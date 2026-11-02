// Complete-set validity: n colour patterns can be shared among the isotypic components so that each component gets
// exactly (its dimension) patterns, every pattern is feasible in its component, and linearly independent vectors with
// those signs exist. Independence is decided by Rado's theorem on the subspaces N_i = {v in V : v_i = 0 where s_i = 0}
// (each sign cone is a non-empty relatively open subset of N_i, so its span is all of N_i).
import { feasibleSpace, patternKey } from './signs.js';
import { rankOf } from './linalg.js';

export function validateSet(model, patterns) {
  const n = model.n;
  if (patterns.length !== n || patterns.some((p) => p.length !== n || p.some((x) => x === null || x === undefined)))
    return { status: 'incomplete', issues: [{ type: 'count', detail: `need ${n} fully specified patterns` }] };
  const issues = [];
  if (patterns.some((p) => p.every((x) => x === 0))) return { status: 'invalid', issues: [{ type: 'zero-vector' }] };
  const keys = patterns.map(patternKey);
  if (new Set(keys).size !== keys.length) issues.push({ type: 'duplicate-up-to-global-flip', note: 'teaching convention, not a theorem' });
  const feas = patterns.map((p) => model.irreps.map((ir) => ({ ir, r: feasibleSpace(ir.basis, p) })).filter((x) => x.r.ok));
  const bad = feas.map((f, i) => (f.length ? null : i)).filter((i) => i !== null);
  if (bad.length) return { status: 'invalid', issues: [...issues, { type: 'pattern-not-achievable', slots: bad }] };
  if (issues.length) return { status: 'invalid', issues };
  const need = model.irreps.map((ir) => ir.n);
  let best = null;
  const assign = new Array(n);
  const rec = (i, counts) => {
    if (best?.ok) return;
    if (i === n) {
      if (!counts.every((c, k) => c === need[k])) return;
      // Rado check per component
      for (let k = 0; k < model.irreps.length; k++) {
        const idx = assign.map((a, t) => (a === k ? t : -1)).filter((t) => t >= 0);
        const spaces = idx.map((t) => feas[t].find((x) => x.ir === model.irreps[k]).r.space);
        for (let mask = 1; mask < 1 << idx.length; mask++) {
          const vs = []; let size = 0;
          idx.forEach((_, b) => { if (mask & (1 << b)) { size++; vs.push(...spaces[b]); } });
          if (rankOf(vs) < size) { best = best || { ok: false, reason: 'not-realisable-as-independent-vectors', component: model.irreps[k].name }; return; }
        }
      }
      best = { ok: true, assignment: assign.map((a) => model.irreps[a].name) }; return;
    }
    for (const f of feas[i]) {
      const k = model.irreps.indexOf(f.ir);
      if (counts[k] >= need[k]) continue;
      assign[i] = k; counts[k]++; rec(i + 1, counts); counts[k]--;
    }
  };
  rec(0, model.irreps.map(() => 0));
  if (best?.ok) return { status: 'complete-valid', assignment: best.assignment, issues };
  return { status: 'invalid', issues: [{ type: best ? best.reason : 'wrong-irrep-share-out', component: best?.component }] };
}
