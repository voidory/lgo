// Isotypic decomposition WITHOUT hand-typed character tables.
// Central elements (class sums) act as scalars on each isotypic component; a generic combination of class sums
// therefore separates the components. Irreducibility is then checked (central characters constant, m^2 integer).
import { zeros, addM, T, mul, trace, jacobiEigen, maxAbsDiff, eye } from './linalg.js';
import { elementIndex } from './symmetry.js';

export function decompose(group, Ds, labelRules = []) {
  const n = Ds[0].length; const G = group.order;
  const M = group.classes.map((cls) => cls.reduce((acc, g) => addM(acc, Ds[g]), zeros(n, n)));
  let A = zeros(n, n);
  M.forEach((Mk, k) => { const S = addM(Mk, T(Mk)); A = addM(A, S, Math.sqrt(2 + 1.7 * k) + 0.37 * k); });
  const { values, vectors } = jacobiEigen(A);
  const order = values.map((v, i) => i).sort((a, b) => values[a] - values[b]);
  const clusters = [];
  for (const i of order) { const last = clusters[clusters.length - 1]; if (last && Math.abs(values[i] - last.v) < 1e-6 * Math.max(1, Math.abs(last.v))) last.idx.push(i); else clusters.push({ v: values[i], idx: [i] }); }
  const irreps = [];
  for (const cl of clusters) {
    const Q = cl.idx.map((c) => vectors.map((r) => r[c])); // list of basis column vectors, each length n
    const nc = Q.length;
    const Qm = T(Q); // n x nc
    const QtMQ = (X) => mul(T(Qm), mul(X, Qm));
    // invariance + character of the isotypic space
    let sumSq = 0;
    for (let g = 0; g < G; g++) {
      const R = QtMQ(Ds[g]);
      const leak = maxAbsDiff(mul(Ds[g], Qm), mul(Qm, R));
      if (leak > 1e-7) throw new Error('isotypic subspace not invariant');
      sumSq += trace(R) ** 2;
    }
    const m2 = sumSq / G; const m = Math.round(Math.sqrt(m2));
    if (Math.abs(m * m - m2) > 1e-6 || nc % m !== 0) throw new Error('isotypic component is not m copies of one irrep: m^2=' + m2);
    const d = nc / m;
    const lambdas = M.map((Mk, k) => {
      const R = QtMQ(Mk); const lam = trace(R) / nc;
      if (maxAbsDiff(R, eye(nc).map((r) => r.map((x) => x * lam))) > 1e-7) throw new Error('central character not constant (mixed irreps)');
      return lam;
    });
    const chi = lambdas.map((lam, k) => lam * d / group.classes[k].length);
    irreps.push({ dim: d, mult: m, n: nc, basis: Q, chi, projector: mul(Qm, T(Qm)) });
  }
  const chiAt = (ir, Rm) => ir.chi[group.classOf[elementIndex(group, Rm)]];
  for (const ir of irreps) {
    ir.totallySymmetric = ir.chi.every((x) => Math.abs(x - 1) < 1e-7);
    let name = null;
    for (const rule of labelRules) {
      if (rule.dim !== ir.dim) continue;
      if (rule.tot && !ir.totallySymmetric) continue;
      if (!rule.tot && ir.totallySymmetric) continue;
      if ((rule.probes || []).every((p) => Math.abs(chiAt(ir, p.R) - p.chi) < 1e-6)) { name = rule.name; break; }
    }
    ir.name = name || (ir.totallySymmetric ? 'A(tot-sym)' : `?dim${ir.dim}`);
  }
  irreps.sort((a, b) => (b.totallySymmetric - a.totallySymmetric) || a.dim - b.dim || a.name.localeCompare(b.name));
  return irreps;
}
