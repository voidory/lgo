// Small dense linear algebra helpers. No DOM, no dependencies.
export const zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));
export const eye = (n) => { const m = zeros(n, n); for (let i = 0; i < n; i++) m[i][i] = 1; return m; };
export const mul = (A, B) => {
  const r = A.length, k = B.length, c = B[0].length, M = zeros(r, c);
  for (let i = 0; i < r; i++) for (let l = 0; l < k; l++) { const a = A[i][l]; if (a !== 0) for (let j = 0; j < c; j++) M[i][j] += a * B[l][j]; }
  return M;
};
export const T = (A) => A[0].map((_, j) => A.map((r) => r[j]));
export const mulv = (A, v) => A.map((r) => r.reduce((s, a, i) => s + a * v[i], 0));
export const addM = (A, B, w = 1) => A.map((r, i) => r.map((x, j) => x + w * B[i][j]));
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const norm = (a) => Math.sqrt(dot(a, a));
export const dist = (a, b) => norm(a.map((x, i) => x - b[i]));
export const trace = (A) => A.reduce((s, r, i) => s + r[i], 0);
export const maxAbsDiff = (A, B) => { let m = 0; for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) m = Math.max(m, Math.abs(A[i][j] - B[i][j])); return m; };

// Cyclic Jacobi eigenvalue algorithm for real symmetric matrices. Eigenvectors are columns of `vectors`.
export function jacobiEigen(A0) {
  const n = A0.length; const A = A0.map((r) => r.slice()); const V = eye(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; }
    }
  }
  return { values: A.map((r, i) => r[i]), vectors: V };
}

// Null space of W (rows are constraints) in R^nc, by Gauss-Jordan with partial pivoting.
export function nullspace(W, nc, tol = 1e-9) {
  const M = W.map((r) => r.slice()); const piv = []; let row = 0;
  for (let c = 0; c < nc && row < M.length; c++) {
    let p = row; for (let r = row + 1; r < M.length; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < tol) continue;
    [M[row], M[p]] = [M[p], M[row]];
    const d = M[row][c]; for (let k = 0; k < nc; k++) M[row][k] /= d;
    for (let r = 0; r < M.length; r++) if (r !== row) { const f = M[r][c]; if (f !== 0) for (let k = 0; k < nc; k++) M[r][k] -= f * M[row][k]; }
    piv.push(c); row++;
  }
  const free = [...Array(nc).keys()].filter((c) => !piv.includes(c));
  return free.map((f) => { const v = new Array(nc).fill(0); v[f] = 1; piv.forEach((pc, i) => { v[pc] = -M[i][f]; }); return v; });
}

export function solveSquare(A, b, tol = 1e-9) {
  const n = A.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < tol) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}

// Rank of a set of vectors (Gram-Schmidt with relative tolerance).
export function rankOf(vectors, tol = 1e-9) {
  const ortho = [];
  for (const v0 of vectors) {
    let v = v0.slice(); const n0 = norm(v0);
    for (const o of ortho) { const f = dot(v, o); v = v.map((x, t) => x - f * o[t]); }
    const nv = norm(v);
    if (nv > tol * Math.max(1, n0)) ortho.push(v.map((x) => x / nv));
  }
  return ortho.length;
}
