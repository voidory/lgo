import { specs } from '../src/cases/specs.js';
import { buildCaseModel, feasibleTable, feasibleIrreps, eigenSpectrum } from '../src/engine/casemodel.js';
import { validateSet } from '../src/engine/completeset.js';
import { allPatterns, feasibleSpace, patternKey } from '../src/engine/signs.js';
import { mulv, dot, norm, jacobiEigen, mul, T, maxAbsDiff } from '../src/engine/linalg.js';
import { orbitalRep, closeGroup } from '../src/engine/symmetry.js';

let pass = 0, fail = 0; const failures = [];
const ok = (cond, name, extra = '') => { if (cond) pass++; else { fail++; failures.push(name + ' ' + extra); } };
const near = (a, b, t = 1e-8) => Math.abs(a - b) < t;
const vnear = (a, b, t = 1e-8) => a.length === b.length && a.every((x, i) => near(x, b[i], t));
const parallel = (a, b) => { const na = norm(a), nb = norm(b); return na > 0 && nb > 0 && near(Math.abs(dot(a, b)), na * nb, 1e-8); };

const M = Object.fromEntries(specs.map((s) => [s.id, buildCaseModel(s)]));

// T1 group orders; representation law; derived decompositions
for (const s of specs) {
  const m = M[s.id];
  ok(m.group.order === s.expectedOrder, `${s.id} group order`);
  ok(m.lawError < 1e-12, `${s.id} representation law`, String(m.lawError));
  const got = {}; for (const ir of m.irreps) got[ir.name] = ir.n; // n = dim*mult
  ok(JSON.stringify(Object.keys(got).sort()) === JSON.stringify(Object.keys(s.expectedDecomposition).sort()), `${s.id} irreps present`, JSON.stringify(got));
  for (const [k, mult] of Object.entries(s.expectedDecomposition)) ok(m.irreps.find((i) => i.name === k)?.mult === mult, `${s.id} multiplicity of ${k}`);
  ok(m.irreps.reduce((a, i) => a + i.n, 0) === m.n, `${s.id} dimensions add up`);
  for (const ir of m.irreps) {
    ok(maxAbsDiff(mul(ir.projector, ir.projector), ir.projector) < 1e-9, `${s.id}/${ir.name} projector idempotent`);
    ok(maxAbsDiff(ir.projector, T(ir.projector)) < 1e-9, `${s.id}/${ir.name} projector symmetric`);
    ok(m.Ds.every((D) => maxAbsDiff(mul(D, ir.projector), mul(ir.projector, D)) < 1e-9), `${s.id}/${ir.name} commutes with D(R)`);
    ok(near(ir.chi[m.group.classOf[0]], ir.dim), `${s.id}/${ir.name} chi(E)=dim`);
  }
}

// T3 neighbour-matrix spectra, and whether the model separates irreps
for (const s of specs) if (s.expectedSpectrum) {
  const m = M[s.id]; const sp = eigenSpectrum(m.adjacency);
  ok(vnear(sp, s.expectedSpectrum.slice().sort((a, b) => b - a)), `${s.id} adjacency spectrum`, JSON.stringify(sp));
  ok(m.Ds.every((D) => maxAbsDiff(mul(D, m.adjacency), mul(m.adjacency, D)) < 1e-9), `${s.id} adjacency commutes with D(R)`);
}

// T4 central-orbital vectors
const cv = (id, c) => M[id].central.find((x) => x.id === c);
ok(cv('h2o', 's').irrep === 'A1' && parallel(cv('h2o', 's').vec, [1, 1]), 'H2O O2s -> A1 (1,1)');
ok(cv('h2o', 'pz').irrep === 'A1' && parallel(cv('h2o', 'pz').vec, [1, 1]), 'H2O O2pz -> A1');
ok(cv('h2o', 'px').irrep === 'B1' && parallel(cv('h2o', 'px').vec, [1, -1]), 'H2O O2px -> B1 (1,-1)');
ok(cv('h2o', 'py').nonbonding, 'H2O O2py zero vector (nonbonding)');
ok(cv('ch4', 's').irrep === 'A1' && vnear(cv('ch4', 'px').vec.map(Math.sign), [1, -1, 1, -1]) && cv('ch4', 'px').irrep === 'T2', 'CH4 s->A1, px->T2 (+,-,+,-)');
ok(['px', 'py', 'pz'].every((c) => cv('sf6', c).irrep === 'T1u') && cv('sf6', 's').irrep === 'A1g', 'SF6 s->A1g, p->T1u');
ok(cv('sf6', 'dz2').irrep === 'Eg' && vnear(cv('sf6', 'dz2').vec, [-1, -1, -1, -1, 2, 2]), 'SF6 dz2 -> Eg (-1,-1,-1,-1,2,2)');
ok(cv('sf6', 'dx2y2').irrep === 'Eg' && vnear(cv('sf6', 'dx2y2').vec, [1, 1, -1, -1, 0, 0]), 'SF6 dx2-y2 -> Eg');
ok(['dxy', 'dxz', 'dyz'].every((c) => cv('sf6', c).nonbonding), 'SF6 t2g d functions give zero vectors');
ok(cv('bh3', 's').irrep === "A1'" && cv('bh3', 'px').irrep === "E'" && cv('bh3', 'py').irrep === "E'" && cv('bh3', 'pz').nonbonding, 'BH3: s->A1prime, px,py->Eprime, pz nonbonding');
ok(M['ch4'].central.filter((c) => c.irrep === 'T2').length === 3, 'CH4 three p functions are all T2');

// T6 forced pair-merge results: valid colourings but not exact LGOs
{
  const h3 = M['h3plus']; const v = [1, -1, -1];
  ok(vnear(mulv(h3.adjacency, v), [-2, 0, 0]), 'H3+ A*(1,-1,-1) = (-2,0,0)');
  const Eir = h3.irreps.find((i) => i.name === "E'");
  ok(feasibleSpace(Eir.basis, v).ok, "H3+ (+,-,-) is a valid E' colouring");
  ok(norm(v.map((x, i) => x - mulv(Eir.projector, v)[i])) > 0.1, "H3+ (1,-1,-1) is NOT itself in E' (true LGO is (2,-1,-1))");
  const sf = M['sf6']; const w = [1, 1, 1, 1, -1, -1];
  ok(vnear(mulv(sf.adjacency, w), [0, 0, 0, 0, 4, 4]), 'SF6 A*(1,1,1,1,-1,-1) = (0,0,0,0,4,4)');
  const Eg = sf.irreps.find((i) => i.name === 'Eg');
  ok(feasibleSpace(Eg.basis, w).ok, 'SF6 (1,1,1,1,-1,-1) is a valid Eg colouring');
  ok(norm(w.map((x, i) => x - mulv(Eg.projector, w)[i])) > 0.1, 'SF6 (1,1,1,1,-1,-1) is not itself an Eg member (true: 1,1,1,1,-2,-2)');
  ok(Eg.basis.some(() => true) && feasibleSpace(Eg.basis, [1, 1, 1, 1, -1, -1]).witness.every((x, i) => Math.sign(Math.round(x * 1e9)) === [1, 1, 1, 1, -1, -1][i]), 'SF6 witness has the requested signs');
}

// T8 H3+ patterns: exactly 12 of 27 are achievable in E' (both colours present); A1' only the two all-same patterns
{
  const h3 = M['h3plus']; const Eir = h3.irreps.find((i) => i.name === "E'"); const Air = h3.irreps.find((i) => i.name === "A1'");
  let cE = 0, cA = 0, total = 0, ok_both = true;
  for (const p of allPatterns(3)) { total++; const f = feasibleSpace(Eir.basis, p).ok; if (f) cE++; if (feasibleSpace(Air.basis, p).ok) cA++; const both = p.includes(1) && p.includes(-1); if (f !== both) ok_both = false; }
  ok(total === 27 && cE === 12 && ok_both, `H3+ E' feasible patterns = 12 of 27 (both colours present)`, `${cE}`);
  ok(cA === 2, "H3+ A1' feasible raw patterns = 2 (+++ and ---)", String(cA));
}

// T5 CH4: three pair partitions give the same final set of colourings (up to global flip)
{
  const ch = M['ch4']; const sets = [];
  for (const [P, Q] of [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]) {
    const mk = (pair, sg) => { const v = [0, 0, 0, 0]; v[pair[0]] = 1; v[pair[1]] = sg; return v; };
    const out = [];
    for (const sg of [1, -1]) for (const t of [1, -1]) { const a = mk(P, sg), b = mk(Q, sg); out.push(a.map((x, i) => x + t * b[i])); }
    const keys = out.map(patternKey).sort();
    const v = validateSet(ch, out.map((x) => x.map(Math.sign)));
    ok(v.status === 'complete-valid', 'CH4 pair-merge route is a complete valid set', JSON.stringify(v));
    sets.push(keys.join('|'));
  }
  ok(new Set(sets).size === 1, 'CH4: all three pair partitions give the same four colourings', sets.join(' / '));
}

// SF6 course route (three trans pairs, unequal-size final merge) is a complete valid set
{
  const sf = M['sf6']; const pair = (a, b, sg) => { const v = [0, 0, 0, 0, 0, 0]; v[a] = 1; v[b] = sg; return v; };
  const Xp = pair(0, 1, 1), Yp = pair(2, 3, 1), Zp = pair(4, 5, 1), Xm = pair(0, 1, -1), Ym = pair(2, 3, -1), Zm = pair(4, 5, -1);
  const add = (a, b, t) => a.map((x, i) => x + t * b[i]);
  const XY = add(Xp, Yp, 1), XYm = add(Xp, Yp, -1);
  const set = [add(XY, Zp, 1), add(XY, Zp, -1), XYm, Xm, Ym, Zm].map((v) => v.map(Math.sign));
  const r = validateSet(sf, set);
  ok(r.status === 'complete-valid', 'SF6 course route set (incl. unequal 4+2 merge) is valid', JSON.stringify(r));
  ok(JSON.stringify(r.assignment?.slice().sort()) === JSON.stringify(['A1g', 'Eg', 'Eg', 'T1u', 'T1u', 'T1u']), 'SF6 share-out A1g + 2 Eg + 3 T1u', JSON.stringify(r.assignment));
  const rot = [[1, -1, 1, -1, 1, -1], [1, -1, -1, 1, 1, -1], [1, -1, -1, 1, -1, 1]];
  const set2 = [set[0], set[1], set[2], ...rot];
  ok(validateSet(sf, set2).status === 'complete-valid', 'SF6 rotated T1u triple (3 red/3 blue patterns) is valid in the symmetry model');
  const bad = [set[0], set[1], set[2], [1, -1, 0, 0, 0, 0], [0, 0, 1, -1, 0, 0], [1, -1, 1, -1, 0, 0]];
  const rb = validateSet(sf, bad);
  ok(rb.status === 'invalid', 'SF6 dependent T1u triple rejected (Rado)', JSON.stringify(rb));
}

// T7 CH4 in-with-out merge set fails; zero / incomplete / duplicates
{
  const ch = M['ch4'];
  const mixed = [[1, 1, 1, -1], [1, 1, -1, 1], [1, -1, 1, 1], [1, -1, -1, -1]];
  ok(mixed.every((p) => feasibleIrreps(ch, p).join() === 'T2'), 'CH4 each mixed pattern alone is a T2 colouring');
  ok(validateSet(ch, mixed).status === 'invalid', 'CH4 in-with-out set fails the share-out (no A1)');
  ok(validateSet(ch, [[0, 0, 0, 0], [1, 1, 1, 1], [1, 1, -1, -1], [1, -1, 1, -1]]).status === 'invalid', 'all-zero pattern invalid');
  ok(validateSet(ch, [[1, 1, 1, 1], null]).status === 'incomplete', 'incomplete set reported as incomplete');
  ok(validateSet(ch, [[1, 1, 1, 1], [-1, -1, -1, -1], [1, 1, -1, -1], [1, -1, 1, -1]]).issues.some((i) => i.type.startsWith('duplicate')), 'global-flip duplicate flagged as convention');
}

// Degenerate subspace is invariant, but individual members mix (not merely +-self)
{
  const ch = M['ch4']; const T2 = ch.irreps.find((i) => i.name === 'T2');
  let mixes = false;
  for (const D of ch.Ds) for (const q of T2.basis) {
    const r = mulv(D, q); const inside = norm(r.map((x, i) => x - mulv(T2.projector, r)[i])) < 1e-9;
    ok(inside, 'CH4 T2 invariant under D(R)');
    if (!(vnear(r, q) || vnear(r, q.map((x) => -x)))) mixes = true;
  }
  ok(mixes, 'CH4 T2: some operation sends a basis member to a mixture of members');
}

// Allyl
{
  const A = M['allyl']; ok(A.irreps.map((i) => i.name).sort().join() === 'a2,b2', 'allyl terminal pair = a2 + b2');
  const b2 = A.irreps.find((i) => i.name === 'b2'), a2 = A.irreps.find((i) => i.name === 'a2');
  ok(parallel(mulv(b2.projector, [1, 1]), [1, 1]), 'p1+p3 is b2'); ok(parallel(mulv(a2.projector, [1, -1]), [1, -1]), 'p1-p3 is a2');
  const cen = orbitalRep(M['allyl'].group, [{ pos: [0, 0, 0.7], dir: [0, 1, 0] }]);
  ok(M['allyl'].group.classes.every((cls) => near(cen[cls[0]][0][0], b2.chi[M['allyl'].group.classOf[cls[0]]])), 'central p2 has the same characters as p1+p3 (b2): symmetry-allowed coupling');
  const F = M['allyl-full']; const H = [[0, 1, 0], [1, 0, 1], [0, 1, 0]];
  const eig = jacobiEigen(H); const vals = eig.values.slice().sort((a, b) => b - a);
  ok(vnear(vals, [Math.SQRT2, 0, -Math.SQRT2]), 'allyl Hückel eigenvalues sqrt2, 0, -sqrt2');
  const col = (j) => eig.vectors.map((r) => r[j]);
  const find = (lam) => col(eig.values.findIndex((v) => near(v, lam)));
  ok(parallel(find(Math.SQRT2), [1, Math.SQRT2, 1]) && parallel(find(0), [1, 0, -1]) && parallel(find(-Math.SQRT2), [1, -Math.SQRT2, 1]), 'allyl MO coefficients (1,sqrt2,1),(1,0,-1),(1,-sqrt2,1)');
  const Fb = F.irreps.find((i) => i.name === 'b2'), Fa = F.irreps.find((i) => i.name === 'a2');
  ok(Fb.mult === 2 && Fb.dim === 1, 'full allyl basis: b2 has multiplicity 2 (handled without a character table)');
  ok(parallel(mulv(Fb.projector, find(Math.SQRT2)), find(Math.SQRT2)) && parallel(mulv(Fa.projector, find(0)), find(0)) && parallel(mulv(Fb.projector, find(-Math.SQRT2)), find(-Math.SQRT2)), 'psi1, psi3 in b2; psi2 in a2');
}

// Tutorial D: octahedral H6 gives a1g + eg + t1u, all-in-phase is the totally symmetric one
{
  const h6 = M['oh-h6']; ok(h6.irreps.map((i) => i.name).sort().join() === 'A1g,Eg,T1u', 'octahedral H6 -> A1g + Eg + T1u');
  const A1 = h6.irreps.find((i) => i.name === 'A1g'); ok(parallel(A1.basis[0], [1, 1, 1, 1, 1, 1]), 'A1g is the all-in-phase combination');
  const lam = (name) => { const ir = h6.irreps.find((i) => i.name === name); const v = ir.basis[0]; return dot(v, mulv(h6.adjacency, v)); };
  ok(near(lam('A1g'), 4) && near(lam('T1u'), 0) && near(lam('Eg'), -2), 'MODEL ONLY: cis-adjacency gives A1g (4) > T1u (0) > Eg (-2); not a course statement');
}

// Table sizes (documented, not asserted beyond non-emptiness)
const tableInfo = {};
for (const s of specs) { const t = feasibleTable(M[s.id]); tableInfo[s.id] = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.length])); ok(Object.values(t).every((v) => v.length > 0), `${s.id} every irrep has achievable patterns`); }
console.log('feasible canonical patterns per irrep:', JSON.stringify(tableInfo));
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(failures.join('\n')); process.exit(1); }
