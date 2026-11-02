// Stage 2 graders. All functions are pure and DOM-free. Every verdict carries a feedback code with its layer
// (validity / course / model) and the kind of rule it rests on (theorem / convention / course statement / model).
import { orbitalRep } from './symmetry.js';
import { feasibleIrreps } from './casemodel.js';
import { validateSet } from './completeset.js';
import { patternKey } from './signs.js';
import { fb } from './feedback.js';

const sum = (a) => a.reduce((s, x) => s + x, 0);

// ---- central-function symmetry types -----------------------------------------------------------------------
export function centralIrreps(model) {
  const out = {};
  for (const c of model.central) out[c.id] = c.irrep;
  const co = model.spec.centralOrbital;
  if (co) {
    const rep = orbitalRep(model.group, [co]);
    const chi = model.group.classes.map((cls) => rep[cls[0]][0][0]);
    const hit = model.irreps.find((ir) => ir.dim === 1 && ir.chi.every((x, k) => Math.abs(x - chi[k]) < 1e-9));
    out[co.id] = hit ? hit.name : null;
  }
  return out;
}

// ---- the course MO system derived from interactions -------------------------------------------------------
export function buildCourseSystem(model, course) {
  const mos = [];
  if (course.ligandOnly) {
    for (const l of course.lgos) if (course.ligandOnlyKinds?.[l.id]) mos.push({ id: l.id, label: l.id, kind: course.ligandOnlyKinds[l.id], from: [l.id] });
  } else {
    const usedL = new Set(), usedC = new Set();
    for (const [l, c] of course.interactions) {
      usedL.add(l); usedC.add(c);
      mos.push({ id: `b:${l}+${c}`, label: `${l} + ${c} (bonding)`, kind: 'bonding', from: [l, c] });
      mos.push({ id: `a:${l}+${c}`, label: `${l} - ${c} (antibonding)`, kind: 'antibonding', from: [l, c] });
    }
    for (const l of course.lgos) if (!usedL.has(l.id)) mos.push({ id: `n:${l.id}`, label: `${l.id} (nonbonding)`, kind: 'nonbonding', from: [l.id] });
    for (const c of course.centralUsed) if (!usedC.has(c)) mos.push({ id: `n:${c}`, label: `${c} (nonbonding)`, kind: 'nonbonding', from: [c] });
  }
  const counts = { bonding: 0, nonbonding: 0, antibonding: 0 };
  for (const m of mos) counts[m.kind]++;
  return {
    id: course.caseId, mos, counts, ladder: course.ladder, electrons: course.electrons?.count ?? null, bonds: course.bonds,
    order: course.order, aoCount: course.centralUsed.length + course.lgos.length,
  };
}

// ---- levels, filling, bond order ------------------------------------------------------------------------
export const levelMap = (ladder) => { const m = {}; ladder.forEach((set, i) => set.forEach((id) => { m[id] = i; })); return m; };

// Aufbau + Hund: fill levels from the bottom; within a degenerate level occupy singly before pairing.
export function computeFill(system, electrons = system.electrons) {
  const occ = {}; let left = electrons;
  for (const level of system.ladder) {
    const k = level.length; level.forEach((id) => { occ[id] = 0; });
    if (left >= 2 * k) { level.forEach((id) => { occ[id] = 2; }); left -= 2 * k; }
    else if (left <= k) { for (let i = 0; i < left; i++) occ[level[i]] = 1; left = 0; }
    else { level.forEach((id) => { occ[id] = 1; }); let extra = left - k; for (let i = 0; i < extra; i++) occ[level[i]] = 2; left = 0; }
  }
  return occ;
}
export function computeBondOrder(system, occ) {
  let b = 0, a = 0;
  for (const m of system.mos) { const n = occ[m.id] || 0; if (m.kind === 'bonding') b += n; else if (m.kind === 'antibonding') a += n; }
  const total = (b - a) / 2;
  return { bondingElectrons: b, antibondingElectrons: a, total, perBond: system.bonds ? total / system.bonds : null, note: fb('B1') };
}
export const unpairedElectrons = (occ) => Object.values(occ).filter((n) => n === 1).length;

export function gradeFilling(system, occ) {
  const messages = []; const placed = sum(system.mos.map((m) => occ[m.id] || 0));
  if (placed !== system.electrons) { messages.push(fb('F1', { placed, expected: system.electrons })); return { status: 'wrong-count', placed, messages }; }
  const over = system.mos.filter((m) => (occ[m.id] || 0) > 2).map((m) => m.id);
  if (over.length) { messages.push(fb('F2', { orbitals: over })); return { status: 'overfull', messages }; }
  const course = computeFill(system); const mism = []; let hundOk = true;
  for (const level of system.ladder) {
    const S = sum(level.map((id) => course[id])); const L = sum(level.map((id) => occ[id] || 0)); const k = level.length;
    if (S !== L) mism.push({ level, expected: S, got: L });
    else {
      const vals = level.map((id) => occ[id] || 0);
      const ok = S >= 2 * k ? vals.every((v) => v === 2) : S <= k ? vals.every((v) => v <= 1) : vals.every((v) => v >= 1);
      if (!ok) hundOk = false;
    }
  }
  const bondOrder = computeBondOrder(system, occ); const unpaired = unpairedElectrons(occ);
  if (mism.length) { messages.push(fb('F3', { mismatches: mism })); return { status: 'differs', mismatches: mism, bondOrder, unpaired, messages }; }
  if (!hundOk) { messages.push(fb('F4')); return { status: 'hund-violation', bondOrder, unpaired, messages }; }
  return { status: 'correct', bondOrder, unpaired, messages };
}

// ---- ordering (partial order; only course-stated relations are graded) ------------------------------------
export function gradeOrdering(system, levels) {
  const o = system.order; const req = [], deg = [], drawn = [], messages = [];
  const has = (id) => levels[id] !== undefined && levels[id] !== null;
  for (const [lo, hi] of o.required) {
    if (!has(lo) || !has(hi)) req.push({ lo, hi, status: 'unanswered' });
    else if (levels[lo] < levels[hi]) req.push({ lo, hi, status: 'correct' });
    else { req.push({ lo, hi, status: 'incorrect' }); messages.push(fb('E1', { lo, hi })); }
  }
  for (const set of o.degenerate) {
    if (!set.every(has)) deg.push({ set, status: 'unanswered' });
    else if (set.every((id) => levels[id] === levels[set[0]])) deg.push({ set, status: 'correct' });
    else { deg.push({ set, status: 'incorrect' }); messages.push(fb('E2', { set })); }
  }
  for (const [lo, hi] of o.drawn) drawn.push({ lo, hi, status: !has(lo) || !has(hi) ? 'unanswered' : levels[lo] < levels[hi] ? 'as-drawn' : 'differs-from-drawing' });
  if (drawn.length) messages.push(fb('E3'));
  const total = req.length + deg.length; const correct = [...req, ...deg].filter((r) => r.status === 'correct').length;
  const anyBad = [...req, ...deg].some((r) => r.status === 'incorrect');
  return { status: anyBad ? 'incorrect' : correct === total ? 'correct' : 'partial', correct, total, results: { required: req, degenerate: deg, drawn }, messages };
}
// Ordering of the LGOs themselves (before they interact with the central atom), where the course draws one.
export function gradeLgoOrdering(course, levels) {
  if (!course.lgoOrder) return { status: 'na', correct: 0, total: 0, results: { required: [], degenerate: [], drawn: [] }, messages: [] };
  return gradeOrdering({ order: course.lgoOrder }, levels);
}

// ---- construction -----------------------------------------------------------------------------------------
export function gradeConstruction(model, course, patterns) {
  const messages = []; const courseKeys = new Map(course.lgos.map((l) => [patternKey(l.pattern), l]));
  const perSlot = patterns.map((p, i) => {
    if (!p || p.some((x) => x === null || x === undefined)) return { slot: i, status: 'incomplete', irreps: [] };
    if (p.every((x) => x === 0)) { messages.push(fb('Z1', { slot: i })); return { slot: i, status: 'invalid', reason: 'zero', irreps: [] }; }
    const irreps = feasibleIrreps(model, p);
    if (!irreps.length) { messages.push(fb('S2', { slot: i })); return { slot: i, status: 'invalid', reason: 'not-achievable', irreps }; }
    const hit = courseKeys.get(patternKey(p)); const courseMatch = hit && irreps.includes(hit.irrep) ? hit : null;
    if (!courseMatch) messages.push(fb('C1', { slot: i }));
    return { slot: i, status: 'valid', irreps, course: courseMatch ? { status: 'course-match', lgo: courseMatch.id } : { status: 'valid-alternative' } };
  });
  const set = validateSet(model, patterns);
  if (set.status === 'incomplete') messages.push(fb('S1'));
  else if (set.status === 'invalid') for (const iss of set.issues) {
    if (iss.type === 'duplicate-up-to-global-flip') messages.push(fb('D1'));
    else if (iss.type === 'not-realisable-as-independent-vectors' || iss.type === 'wrong-irrep-share-out') messages.push(fb('S3', { component: iss.component }));
  }
  const matched = perSlot.filter((s) => s.course?.status === 'course-match').map((s) => s.course.lgo);
  const distinct = new Set(matched).size;
  const courseAligned = set.status === 'complete-valid' && distinct === course.lgos.length;
  return { status: set.status, set, perSlot, courseMatchedCount: distinct, courseTotal: course.lgos.length, courseAligned, messages };
}

// ---- matching LGO <-> central functions ----------------------------------------------------------------
// input: { lgoId } for a course LGO, or { pattern } for a learner LGO; selected: central ids ticked; none: "nonbonding" ticked.
export function gradeMatching(model, course, input) {
  const messages = []; const cirreps = centralIrreps(model);
  let irrep, lgo = null, rotated = false;
  if (input.lgoId) { lgo = course.lgos.find((l) => l.id === input.lgoId); irrep = lgo.irrep; }
  else {
    const irs = feasibleIrreps(model, input.pattern);
    if (irs.length !== 1) return { status: 'blocked', reason: irs.length ? 'ambiguous symmetry type' : 'pattern is not a valid LGO', messages };
    irrep = irs[0]; const hit = course.lgos.find((l) => patternKey(l.pattern) === patternKey(input.pattern) && l.irrep === irrep);
    if (hit) lgo = hit; else rotated = true;
  }
  const cvec = (id) => model.central.find((c) => c.id === id)?.vec;
  // A specific course LGO is aligned with its partner, so its overlap with other members of a degenerate set is zero.
  const canon = lgo ? (lgo.partner && cvec(lgo.partner)) || lgo.pattern : null;
  const sameIrrep = Object.entries(cirreps).filter(([, ir]) => ir === irrep).map(([id]) => id);
  const overlaps = (id) => !canon || !cvec(id) || Math.abs(canon.reduce((acc, x, i) => acc + x * cvec(id)[i], 0)) > 1e-9;
  const allCompat = sameIrrep.filter(overlaps);
  const compat = allCompat.filter((id) => course.centralUsed.includes(id));
  const sel = input.none ? [] : (input.selected || []);
  const wrong = sel.filter((id) => !sameIrrep.includes(id));
  const orthogonal = sel.filter((id) => sameIrrep.includes(id) && !allCompat.includes(id));
  const outside = sel.filter((id) => allCompat.includes(id) && !compat.includes(id));
  const missed = compat.filter((id) => !sel.includes(id));
  if (wrong.length) messages.push(fb('X1', { wrong }));
  if (orthogonal.length) messages.push(fb('X6', { ids: orthogonal }));
  if (missed.length || (input.none && compat.length)) messages.push(fb('X2', { missed }));
  if (outside.length) messages.push(fb('X5', { ids: outside }));
  const neglected = (course.neglected || []).filter((n) => lgo && n.lgo === lgo.id);
  for (const n of neglected) messages.push(fb('X4', { central: n.central, note: n.note }));
  if (rotated) messages.push(fb('X3'));
  let status = 'correct';
  if (wrong.length || orthogonal.length) status = 'incorrect';
  else if (rotated) status = sel.length || !compat.length ? 'correct' : 'incorrect'; // a rotated LGO pairs with a combination: any non-empty compatible subset
  else if (missed.length) status = sel.length ? 'partial' : 'incorrect';
  const coursePartner = lgo ? lgo.partner : null;
  const courseOk = !wrong.length && !orthogonal.length && !outside.length && !!lgo && (coursePartner ? sel.includes(coursePartner) : sel.length === 0);
  return { status, courseOk, irrep, compatible: compat, wrong, orthogonal, missed: rotated && sel.length ? [] : missed, outside, coursePartner, neglected, rotated, messages };
}
