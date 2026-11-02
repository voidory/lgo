import { specs } from '../src/cases/specs.js';
import { specs2 } from '../src/cases/specs2.js';
import { COURSE } from '../src/course/data.js';
import { DIATOMICS, diatomicSystem } from '../src/course/diatomics.js';
import { buildCaseModel } from '../src/engine/casemodel.js';
import { validateSet } from '../src/engine/completeset.js';
import { patternKey, feasibleSpace } from '../src/engine/signs.js';
import { centralIrreps, buildCourseSystem, computeFill, computeBondOrder, unpairedElectrons, gradeFilling, gradeOrdering, gradeLgoOrdering, gradeConstruction, gradeMatching, levelMap } from '../src/engine/grading.js';
import { FEEDBACK_CODES } from '../src/engine/feedback.js';

let pass = 0, fail = 0; const failures = []; const emitted = new Set();
const ok = (c, n, e = '') => { if (c) pass++; else { fail++; failures.push(n + ' ' + e); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) < t;
const note = (r) => { for (const m of r.messages || []) emitted.add(m.code); if (r.bondOrder?.note) emitted.add(r.bondOrder.note.code); return r; };

const all = [...specs, ...specs2]; const M = Object.fromEntries(all.map((s) => [s.id, buildCaseModel(s)]));
const sgn = (v) => v.map((x) => (Math.abs(x) < 1e-9 ? 0 : x > 0 ? 1 : -1));
const ids = Object.keys(COURSE);

// 0. Engine regression (guards the completeset.js null-slot fix and earlier Stage 1 results)
{
  const orders = { h2o: 4, h3plus: 12, bh3: 12, ch4: 24, sf6: 48, 'oh-h6': 48, allyl: 4, 'allyl-full': 4, 'b2h6-bridge': 8 };
  for (const [id, o] of Object.entries(orders)) ok(M[id].group.order === o && M[id].lawError < 1e-12, `regression: ${id} group order ${o}, representation law`);
  const ch = M['ch4'];
  for (const [P, Q] of [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]) {
    const mk = (pr, sg) => { const v = [0, 0, 0, 0]; v[pr[0]] = 1; v[pr[1]] = sg; return v; }; const out = [];
    for (const sg of [1, -1]) for (const tt of [1, -1]) out.push(mk(P, sg).map((x, i) => x + tt * mk(Q, sg)[i]).map(Math.sign));
    ok(validateSet(ch, out).status === 'complete-valid', 'regression: CH4 pair-merge route valid for every pair split');
  }
  ok(validateSet(ch, [[1, 1, 1, 1], null, null, null]).status === 'incomplete', 'regression: null slots are reported as incomplete (previously crashed)');
  const h3 = M['h3plus']; const E = h3.irreps.find((i) => i.name === "E'");
  let cnt = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) if (feasibleSpace(E.basis, [a, b, c]).ok) cnt++;
  ok(cnt === 12, "regression: exactly 12 of 27 H3+ patterns are achievable in E'", String(cnt));
}

// 1. Course data agrees with derived symmetry
for (const id of ids) {
  const C = COURSE[id], m = M[id]; ok(!!m, `${id} has an engine model`);
  ok(C.claims?.length > 0 && Array.isArray(C.verify), `${id} carries claims and a verify list`);
  const cir = centralIrreps(m);
  ok(validateSet(m, C.lgos.map((l) => l.pattern)).status === 'complete-valid', `${id} course LGOs form a complete valid set`);
  for (const l of C.lgos) {
    ok(m.irreps.some((ir) => ir.name === l.irrep), `${id}/${l.id} irrep ${l.irrep} exists`);
    if (l.partner) {
      ok(cir[l.partner] === l.irrep, `${id}/${l.id} partner ${l.partner} has the same symmetry type`, String(cir[l.partner]));
      const c = m.central.find((x) => x.id === l.partner);
      if (c) ok(patternKey(sgn(c.vec)) === patternKey(l.pattern), `${id}/${l.id} colours match sign of ${l.partner} at the ligands`);
    } else {
      ok(!C.centralUsed.some((c) => cir[c] === l.irrep), `${id}/${l.id} has no symmetry-compatible central function in the course set (nonbonding)`);
    }
  }
  const inter = new Set(C.interactions.map((x) => x[1]));
  for (const c of C.centralUsed) if (!inter.has(c) && !C.ligandOnly) {
    const neglected = (C.neglected || []).some((n) => n.central === c);
    ok(!m.irreps.some(ir=>ir.name===cir[c]) || neglected, `${id}/${c}: unused central function is nonbonding by symmetry or neglected by the course for a stated reason`);
  }
}

// 2. Systems: counts, conservation, ladders
for (const id of ids) {
  const C = COURSE[id], sys = buildCourseSystem(M[id], C);
  if (C.expectedCounts) ok(JSON.stringify(sys.counts) === JSON.stringify(C.expectedCounts), `${id} MO counts bonding/nonbonding/antibonding`, JSON.stringify(sys.counts));
  if (!C.ligandOnly) ok(sys.mos.length === sys.aoCount, `${id} orbital number conserved (MOs = central + LGOs)`, `${sys.mos.length} vs ${sys.aoCount}`);
  if (C.ladder) {
    const lad = sys.ladder.flat().slice().sort().join('|'), mo = sys.mos.map((m) => m.id).sort().join('|');
    ok(lad === mo, `${id} ladder lists exactly the MOs`);
    const known = new Set(sys.mos.map((m) => m.id)); const rel = [...C.order.required, ...C.order.drawn, ...C.order.degenerate].flat();
    ok(rel.every((x) => known.has(x)), `${id} ordering relations refer to real MOs`);
    const lv = levelMap(sys.ladder);
    ok(C.order.required.every(([a, b]) => lv[a] < lv[b]) && C.order.degenerate.every((s) => s.every((x) => lv[x] === lv[s[0]])), `${id} the course ladder satisfies its own required relations`);
  }
}

// 2b. LGO-level ordering and slide labels (SF6 slides 14-19)
{
  const C = COURSE['sf6'], lgoIds = new Set(C.lgos.map((l) => l.id));
  ok([...C.lgoOrder.required, ...C.lgoOrder.degenerate].flat().every((x) => lgoIds.has(x)), 'sf6 LGO-order relations refer to real LGOs');
  const lv = { a1g: 0, t1u_x: 1, t1u_y: 1, t1u_z: 1, eg_1: 2, eg_2: 2 };
  let r = note(gradeLgoOrdering(C, lv)); ok(r.status === 'correct', 'SF6 LGO levels a1g < t1u < eg (slides 17-18) are accepted');
  r = note(gradeLgoOrdering(C, { ...lv, t1u_x: 3, t1u_y: 3, t1u_z: 3 })); ok(r.status === 'incorrect' && r.messages.some((x) => x.code === 'E1'), 'SF6 t1u above eg contradicts the slide (E1)');
  r = gradeLgoOrdering(COURSE['h2o'], {}); ok(r.status === 'na', 'cases without a drawn LGO ordering return n/a');
  const lab = Object.values(C.slideLabels); ok(Object.keys(C.slideLabels).length === 6 && new Set(lab).size === 6 && Object.keys(C.slideLabels).every((k) => lgoIds.has(k)), 'SF6: each LGO maps to a distinct slide label');
  // the adjacency model agrees with the slide ordering (model check only)
  const m = M['sf6']; const lam = (name) => { const ir = m.irreps.find((i) => i.name === name); const v = ir.basis[0]; return v.reduce((s, x, i) => s + x * m.adjacency[i].reduce((a, y, j) => a + y * v[j], 0), 0); };
  ok(lam('A1g') > lam('T1u') && lam('T1u') > lam('Eg'), 'MODEL ONLY: cis-adjacency ordering A1g > T1u > Eg agrees with the slide drawing (lower energy = larger value)');
}

// 3. Filling and bond order against the lecture/tutorial answers
const BO = { h2o: [2, 1], ch4: [4, 1], sf6: [4, 2 / 3], bh3: [3, 1], h3plus: [1, 1 / 3], allyl: [1, 1 / 2], 'b2h6-bridge': [1, 1 / 2] };
for (const [id, [tot, per]] of Object.entries(BO)) {
  const sys = buildCourseSystem(M[id], COURSE[id]); const occ = computeFill(sys); const bo = computeBondOrder(sys, occ);
  ok(Object.values(occ).reduce((a, b) => a + b, 0) === sys.electrons, `${id} fills all ${sys.electrons} electrons`);
  ok(near(bo.total, tot) && near(bo.perBond, per), `${id} bond order total ${tot}, per bond ${per}`, `${bo.total}/${bo.perBond}`);
  ok(unpairedElectrons(occ) === 0, `${id} no unpaired electrons`);
  const g = note(gradeFilling(sys, occ)); ok(g.status === 'correct', `${id} course filling is graded correct`, g.status);
}
{ const s = buildCourseSystem(M['sf6'], COURSE['sf6']); const o = computeFill(s);
  ok(o['b:a1g+s'] === 2 && o['n:eg_1'] === 2 && o['n:eg_2'] === 2 && o['a:a1g+s'] === 0, 'SF6: bonding (8) and nonbonding Eg (4) filled, antibonding empty'); }

// 4. Diatomics from one template
for (const [name, d] of Object.entries(DIATOMICS)) {
  const sys = diatomicSystem(name); const occ = computeFill(sys); const bo = computeBondOrder(sys, occ);
  ok(near(bo.total, d.expected.bondOrder) && unpairedElectrons(occ) === d.expected.unpaired, `${name} bond order ${d.expected.bondOrder}, unpaired ${d.expected.unpaired}`, `${bo.total}/${unpairedElectrons(occ)}`);
}
{ const o2 = diatomicSystem('O2'); const occ = computeFill(o2); ok(occ['π*2px'] === 1 && occ['π*2py'] === 1, 'O2: Hund puts one electron in each pi*');
  const bad = { ...occ, 'π*2px': 2, 'π*2py': 0 }; const g = note(gradeFilling(o2, bad)); ok(g.status === 'hund-violation', 'O2 paired pi* is flagged (Hund)', g.status);
  const n2 = diatomicSystem('N2').ladder.flat().join(); const o2l = diatomicSystem('O2').ladder.flat().join();
  ok(n2.indexOf('π2px') < n2.indexOf('σ2pz') && o2l.indexOf('σ2pz') < o2l.indexOf('π2px'), 's-p mixing swaps sigma(2pz) and pi(2p) between N2 and O2'); }

// 5. Construction grading
{
  const C = COURSE['sf6'], m = M['sf6'];
  const good = note(gradeConstruction(m, C, C.lgos.map((l) => l.pattern)));
  ok(good.status === 'complete-valid' && good.courseAligned && good.messages.length === 0, 'SF6 course route: valid, course-aligned, no feedback codes', JSON.stringify(good.messages.map((x) => x.code)));
  const base = [C.lgos[0], C.lgos[4], C.lgos[5]].map((l) => l.pattern);
  const alt = [...base, [1, -1, 1, -1, 1, -1], [1, -1, -1, 1, 1, -1], [1, -1, -1, 1, -1, 1]];
  const ra = note(gradeConstruction(m, C, alt));
  ok(ra.status === 'complete-valid' && !ra.courseAligned && ra.messages.some((x) => x.code === 'C1'), 'SF6 rotated T1u set: valid but flagged "not the course picture" (C1)');
  const dep = note(gradeConstruction(m, C, [...base, [1, -1, 0, 0, 0, 0], [0, 0, 1, -1, 0, 0], [1, -1, 1, -1, 0, 0]]));
  ok(dep.status === 'invalid' && dep.messages.some((x) => x.code === 'S3'), 'dependent T1u set rejected with S3');
  ok(note(gradeConstruction(m, C, [[0, 0, 0, 0, 0, 0], ...C.lgos.slice(1).map((l) => l.pattern)])).messages.some((x) => x.code === 'Z1'), 'zero pattern -> Z1');
  ok(note(gradeConstruction(m, C, [C.lgos[0].pattern, null, ...C.lgos.slice(2).map((l) => l.pattern)])).messages.some((x) => x.code === 'S1'), 'unfinished set -> S1');
  ok(note(gradeConstruction(M['h2o'], COURSE['h2o'], [[1, 0], [1, -1]])).messages.some((x) => x.code === 'S2'), 'H2O pattern (+,0) achievable by no LGO -> S2');
  ok(note(gradeConstruction(m, C, [C.lgos[0].pattern, C.lgos[0].pattern.map((x) => -x), ...C.lgos.slice(2).map((l) => l.pattern)])).messages.some((x) => x.code === 'D1'), 'global-flip duplicate -> D1 (convention)');
  const ch = M['ch4'], Cc = COURSE['ch4'];
  const mixed = note(gradeConstruction(ch, Cc, [[1, 1, 1, -1], [1, 1, -1, 1], [1, -1, 1, 1], [1, -1, -1, -1]]));
  ok(mixed.status === 'invalid' && mixed.messages.some((x) => x.code === 'S3'), 'CH4 in-with-out set rejected (S3), though each pattern alone is a T2 colouring');
  for (const id of ids) { const g = note(gradeConstruction(M[id], COURSE[id], COURSE[id].lgos.map((l) => l.pattern))); ok(g.courseAligned && g.messages.length === 0, `${id} course route grades clean`); }
}

// 6. Matching
{
  const m = M['h2o'], C = COURSE['h2o'];
  let r = note(gradeMatching(m, C, { lgoId: 'LGO1', selected: ['s', 'pz'] })); ok(r.status === 'correct' && r.courseOk && r.messages.some((x) => x.code === 'X4'), 'H2O LGO1 -> {s, pz}: symmetry-complete; X4 explains the course neglects O 2s');
  r = note(gradeMatching(m, C, { lgoId: 'LGO1', selected: ['pz'] })); ok(r.status === 'partial' && r.courseOk, 'H2O LGO1 -> {pz}: course answer, symmetry-incomplete (partial)');
  r = note(gradeMatching(m, C, { lgoId: 'LGO1', selected: ['px'] })); ok(r.status === 'incorrect' && r.messages.some((x) => x.code === 'X1'), 'H2O LGO1 -> px is wrong symmetry (X1)');
  r = note(gradeMatching(m, C, { lgoId: 'LGO2', none: true })); ok(r.status === 'incorrect' && r.messages.some((x) => x.code === 'X2'), 'H2O LGO2 marked nonbonding but px is compatible (X2)');
  const s = M['sf6'], Cs = COURSE['sf6'];
  r = note(gradeMatching(s, Cs, { lgoId: 'eg_1', none: true })); ok(r.status === 'correct' && r.courseOk, 'SF6 Eg LGO is nonbonding in the course model');
  r = note(gradeMatching(s, Cs, { lgoId: 'eg_1', selected: ['dx2y2'] })); ok(r.status === 'correct' && !r.courseOk && r.messages.some((x) => x.code === 'X5'), 'SF6 Eg -> d(x2-y2): symmetry-allowed but outside the course model (X5)');
  r = note(gradeMatching(s, Cs, { lgoId: 't1u_x', selected: ['py'] })); ok(r.status === 'incorrect' && r.messages.some((x) => x.code === 'X6'), 'SF6 T1u_x -> py: same symmetry type but zero overlap (X6)');
  r = note(gradeMatching(s, Cs, { lgoId: 't1u_x', selected: ['px'] })); ok(r.status === 'correct' && r.courseOk, 'SF6 T1u_x -> px');
  r = note(gradeMatching(s, Cs, { pattern: [1, -1, 1, -1, 0, 0], selected: ['px', 'py'] })); ok(r.status === 'blocked' && r.messages.some(x=>x.code==='X3'), 'Noncanonical matching is explicitly ungraded');
  const a = M['allyl'], Ca = COURSE['allyl'];
  r = note(gradeMatching(a, Ca, { lgoId: 'pp', selected: ['p2'] })); ok(r.status === 'correct' && r.courseOk, 'allyl p1+p3 -> p2');
  r = note(gradeMatching(a, Ca, { lgoId: 'pm', none: true })); ok(r.status === 'correct', 'allyl p1-p3 is nonbonding');
  r = note(gradeMatching(M['bh3'], COURSE['bh3'], { lgoId: 'Ep_x', selected: ['px'] })); ok(r.status === 'correct', 'BH3 E-prime LGO -> px');
}

// 7. Ordering
{
  const sys = buildCourseSystem(M['sf6'], COURSE['sf6']); const good = levelMap(sys.ladder);
  let r = note(gradeOrdering(sys, good)); ok(r.status === 'correct', 'SF6 course ladder (slide 18) passes');
  const swapped = { ...good, 'b:a1g+s': 5 }; r = note(gradeOrdering(sys, swapped)); ok(r.status === 'incorrect' && r.messages.some((x) => x.code === 'E1'), 'bonding above antibonding -> E1');
  const nbLow = { ...good, 'n:eg_1': -1, 'n:eg_2': -1 }; r = gradeOrdering(sys, nbLow); note(r); ok(r.status === 'incorrect', 'SF6: nonbonding Eg below the bonding set contradicts slide 18');
  const split = { ...good, 'b:t1u_y+py': good['b:t1u_y+py'] + 0.5 }; r = note(gradeOrdering(sys, split)); ok(r.messages.some((x) => x.code === 'E2'), 'degenerate set split -> E2');
  const ch = buildCourseSystem(M['ch4'], COURSE['ch4']); const lc = levelMap(ch.ladder);
  r = gradeOrdering(ch, { ...lc, 'a:LGO1+s': 9 }); note(r);
  ok(r.status === 'correct' && r.results.drawn.some((d) => d.status === 'differs-from-drawing') && r.messages.some((x) => x.code === 'E3'), 'CH4: drawn-but-not-required relations are reported (E3), not marked wrong');
  r = gradeOrdering(sys, {}); ok(r.status === 'partial' && r.correct === 0, 'empty ladder is unanswered, not wrong');
  const h6 = { mos: [], order: COURSE['oh-h6'].order }; const lv = { a1g: 0, t1u_x: 1, t1u_y: 1, t1u_z: 1, eg_1: 2, eg_2: 2 };
  r = note(gradeOrdering(h6, lv)); ok(r.status === 'correct' && r.results.drawn.every((d) => d.status === 'as-drawn'), 'Tutorial D: a1g lowest passes; t1u < eg matches the slide drawing');
  r = note(gradeOrdering(h6, { ...lv, t1u_x: 3, t1u_y: 3, t1u_z: 3 })); ok(r.status === 'correct' && r.results.drawn.some((d) => d.status === 'differs-from-drawing'), 'Tutorial D: t1u-vs-eg is NOT required by the key (reported against the slide, not marked wrong)');
  r = note(gradeOrdering(h6, { ...lv, a1g: 4 })); ok(r.status === 'incorrect', 'Tutorial D: a1g above another LGO is wrong');
}

// 8. Filling errors
{
  const sys = buildCourseSystem(M['h2o'], COURSE['h2o']); const occ = computeFill(sys);
  ok(note(gradeFilling(sys, { ...occ, 'n:py': 0 })).status === 'wrong-count', 'too few electrons -> F1');
  ok(note(gradeFilling(sys, { ...occ, 'n:py': 3, 'n:s': 1 })).status === 'overfull', 'three in one orbital -> F2');
  const sw = { ...occ, 'n:py': 0, 'a:LGO1+pz': 2 }; ok(note(gradeFilling(sys, sw)).status === 'differs', 'antibonding filled instead of nonbonding -> F3');
}

note(gradeFilling(buildCourseSystem(M.h2o,COURSE.h2o),{ghost:2}));
note(gradeConstruction(M.h2o,COURSE.h2o,[[1,2],[1,-1]]));

// 9. Every feedback code is reachable
for (const c of FEEDBACK_CODES) ok(emitted.has(c), `feedback code ${c} is reachable by a scripted answer`);
console.log(`stage 2: ${pass} passed, ${fail} failed`);
if (fail) { console.log(failures.join('\n')); process.exit(1); }
