import { closeGroup, orbitalRep, representationLawError } from './symmetry.js';
import { decompose } from './irreps.js';
import { mulv, norm, dot, zeros, jacobiEigen, mul, T, maxAbsDiff, addM } from './linalg.js';
import { feasibleSpace, allPatterns, patternKey } from './signs.js';

export function adjacency(orbs, kind) {
  const n = orbs.length; const A = zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    if (kind === 'all') A[i][j] = 1;
    else if (kind === 'cis') { const u = orbs[i].pos, v = orbs[j].pos; if (Math.abs(dot(u, v)) < 1e-9) A[i][j] = 1; } // not trans, not same
  }
  return A;
}

export function buildCaseModel(spec) {
  const group = closeGroup(spec.generators);
  if (group.order !== spec.expectedOrder) throw new Error(`${spec.id}: group order ${group.order} != ${spec.expectedOrder}`);
  const Ds = orbitalRep(group, spec.orbitals);
  const lawError = representationLawError(group, Ds);
  const irreps = decompose(group, Ds, spec.labelRules);
  const n = spec.orbitals.length;
  const A = adjacency(spec.orbitals, spec.neighbours === 'none' ? 'none' : spec.neighbours);
  const model = { spec, group, Ds, lawError, irreps, n, adjacency: A };
  // central functions evaluated on bond-direction unit vectors (sigma / s ligands only)
  model.central = (spec.central || []).map((c) => {
    const vec = spec.orbitals.map((o) => c.fn(o.pos.map((x) => x / norm(o.pos))));
    const nv = norm(vec);
    if (nv < 1e-9) return { id: c.id, vec, irrep: null, nonbonding: true };
    const hits = irreps.filter((ir) => Math.abs(dot(vec, mulv(ir.projector, vec)) - nv * nv) < 1e-8);
    return { id: c.id, vec, irrep: hits.length === 1 ? hits[0].name : null, nonbonding: false, hits: hits.map((h) => h.name) };
  });
  return model;
}

// All colour patterns feasible in each isotypic subspace (canonical up to a global flip).
export function feasibleTable(model) {
  const out = {};
  for (const ir of model.irreps) {
    const set = new Map();
    for (const p of allPatterns(model.n)) {
      const r = feasibleSpace(ir.basis, p);
      if (r.ok) { const k = patternKey(p); if (!set.has(k)) set.set(k, { pattern: p, margin: r.margin }); }
    }
    out[ir.name] = [...set.keys()].sort();
  }
  return out;
}

export function feasibleIrreps(model, pattern) {
  return model.irreps.filter((ir) => feasibleSpace(ir.basis, pattern).ok).map((ir) => ir.name);
}

// Symmetry-compatibility with a central coupling vector, for debugging/teaching.
export function eigenSpectrum(A) { return jacobiEigen(A).values.slice().sort((a, b) => b - a); }
