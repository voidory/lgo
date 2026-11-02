// Spatial point groups generated from 3x3 orthogonal matrices; orbital (signed-permutation) representations
// are DERIVED from geometry, never typed by hand.
import { eye, mul, mulv, T, zeros, dist, maxAbsDiff } from './linalg.js';

const keyOf = (M) => M.flat().map((x) => { const r = Math.round(x * 1e6) / 1e6; return r === 0 ? 0 : r; }).join(',');

export function closeGroup(gens, max = 500) {
  const I = eye(3); const elements = [I]; const index = new Map([[keyOf(I), 0]]);
  for (let i = 0; i < elements.length; i++) for (const g of gens) {
    const m = mul(g, elements[i]); const k = keyOf(m);
    if (!index.has(k)) { index.set(k, elements.length); elements.push(m); if (elements.length > max) throw new Error('group too large'); }
  }
  const order = elements.length;
  const table = elements.map((a) => elements.map((b) => index.get(keyOf(mul(a, b)))));
  const inverse = elements.map((a) => index.get(keyOf(T(a))));
  // conjugacy classes
  const seen = new Array(order).fill(-1); const classes = [];
  for (let g = 0; g < order; g++) {
    if (seen[g] >= 0) continue; const cls = new Set();
    for (let h = 0; h < order; h++) cls.add(table[table[h][g]][inverse[h]]);
    const members = [...cls]; members.forEach((m) => { seen[m] = classes.length; }); classes.push(members);
  }
  return { elements, index, order, table, inverse, classes, classOf: seen, keyOf };
}

export function orbitalRep(group, orbs) {
  const n = orbs.length;
  return group.elements.map((R) => {
    const D = zeros(n, n);
    orbs.forEach((o, i) => {
      const p = mulv(R, o.pos); const j = orbs.findIndex((q) => dist(q.pos, p) < 1e-6);
      if (j < 0) throw new Error('operation does not map orbital positions onto orbital positions');
      let sg = 1;
      if (o.dir) {
        const d = mulv(R, o.dir);
        if (dist(d, orbs[j].dir) < 1e-6) sg = 1; else if (dist(d, orbs[j].dir.map((x) => -x)) < 1e-6) sg = -1; else throw new Error('orbital direction not preserved up to sign');
      }
      D[j][i] = sg;
    });
    return D;
  });
}

// Check D(ab) = D(a) D(b) for every pair; returns the worst deviation.
export function representationLawError(group, Ds) {
  let worst = 0;
  for (let a = 0; a < group.order; a++) for (let b = 0; b < group.order; b++) worst = Math.max(worst, maxAbsDiff(Ds[group.table[a][b]], mul(Ds[a], Ds[b])));
  return worst;
}

export const elementIndex = (group, M) => { const i = group.index.get(keyOf(M)); if (i === undefined) throw new Error('matrix is not a group element'); return i; };
