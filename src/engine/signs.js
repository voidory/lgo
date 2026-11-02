// Colour (sign) feasibility: does a vector v in a subspace exist with sign(v_i) = s_i  (s_i in {+1,-1,0})?
// Exact-vertex method (no LP solver): after imposing v_i = 0 where s_i = 0, the rest is {z : A z >= 1}.
// With independent columns the polyhedron is pointed, so non-empty <=> a vertex exists, i.e. some k rows of
// A z = 1 solve to a point satisfying every row.  Witness and margin are returned and re-verified.
import { nullspace, dot, norm, solveSquare } from './linalg.js';

function* combos(n, k, start = 0, cur = []) {
  if (cur.length === k) { yield cur.slice(); return; }
  for (let i = start; i <= n - (k - cur.length); i++) { cur.push(i); yield* combos(n, k, i + 1, cur); cur.pop(); }
}

// B: array of D basis vectors (each length n) spanning the subspace.
export function feasibleSpace(B, s) {
  const n = s.length, D = B.length;
  const rowsB = Array.from({ length: n }, (_, i) => B.map((col) => col[i]));
  const zeroIdx = [], nzIdx = [];
  s.forEach((x, i) => (x === 0 ? zeroIdx.push(i) : nzIdx.push(i)));
  if (!nzIdx.length) return { ok: false, reason: 'all-zero' };
  const N = nullspace(zeroIdx.map((i) => rowsB[i]), D);
  const space = N.map((nv) => B[0].map((_, t) => nv.reduce((acc, c, j) => acc + c * B[j][t], 0)));
  if (!N.length) return { ok: false, reason: 'forced-zero', space: [] };
  const cols = N.map((nv) => nzIdx.map((i) => s[i] * dot(rowsB[i], nv)));
  const keep = []; const ortho = [];
  cols.forEach((c, j) => {
    let v = c.slice(); for (const o of ortho) { const f = dot(v, o); v = v.map((x, t) => x - f * o[t]); }
    const nv = norm(v); if (nv > 1e-9 * Math.max(1, norm(c))) { ortho.push(v.map((x) => x / nv)); keep.push(j); }
  });
  const kk = keep.length; if (!kk) return { ok: false, reason: 'sign-incompatible', space };
  const r = nzIdx.length; const A = nzIdx.map((_, ri) => keep.map((j) => cols[j][ri]));
  for (const rows of combos(r, kk)) {
    const z = solveSquare(rows.map((ri) => A[ri]), rows.map(() => 1)); if (!z) continue;
    if (!A.every((row) => dot(row, z) >= 1 - 1e-9)) continue;
    const v = new Array(B[0].length).fill(0);
    keep.forEach((j, t) => N[j].forEach((c, jj) => { for (let q = 0; q < v.length; q++) v[q] += z[t] * c * B[jj][q]; }));
    const mx = Math.max(...v.map(Math.abs));
    const margin = Math.min(...nzIdx.map((i) => s[i] * v[i])) / mx;
    const zerosOk = zeroIdx.every((i) => Math.abs(v[i]) < 1e-9 * Math.max(1, mx));
    const signsOk = nzIdx.every((i) => s[i] * v[i] > 1e-9 * mx);
    if (zerosOk && signsOk) return { ok: true, witness: v, margin, space };
  }
  return { ok: false, reason: 'sign-incompatible', space };
}

export const canonicalPattern = (p) => { const f = p.find((x) => x !== 0); return f === -1 ? p.map((x) => -x) : p.slice(); };
export const patternKey = (p) => canonicalPattern(p).map((x) => (x > 0 ? '+' : x < 0 ? '-' : '0')).join('');
export function* allPatterns(n) { const tot = 3 ** n; for (let c = 0; c < tot; c++) { const p = []; let x = c; for (let i = 0; i < n; i++) { p.push((x % 3) - 1); x = Math.floor(x / 3); } yield p; } }
