// Course data: the routes, partners, ladders and counting conventions as the lectures/tutorial present them.
// Everything here is DATA about the course; the engine verifies it against derived symmetry (tests/stage2.mjs).
// Each entry has `claims` (source labels) and `verify` (things the user should check against the original slides).
const cross = (A, B) => A.flatMap((a) => B.map((b) => [a, b]));
const T1B = ['b:t1u_x+px', 'b:t1u_y+py', 'b:t1u_z+pz'], T1A = ['a:t1u_x+px', 'a:t1u_y+py', 'a:t1u_z+pz'], EG = ['n:eg_1', 'n:eg_2'];
const T1U = ['t1u_x', 't1u_y', 't1u_z'], EGL = ['eg_1', 'eg_2'];

export const COURSE = {
  h2o: {
    caseId: 'h2o', electrons: { count: 8, source: '6 from O + 1 from each H' }, bonds: 2,
    centralUsed: ['s', 'px', 'py', 'pz'],
    lgos: [
      { id: 'LGO1', irrep: 'A1', pattern: [1, 1], partner: 'pz', note: 'Red-red: lower in energy than LGO2.' },
      { id: 'LGO2', irrep: 'B1', pattern: [1, -1], partner: 'px', note: 'Red-blue: higher in energy than LGO1.' },
    ],
    interactions: [['LGO1', 'pz'], ['LGO2', 'px']],
    neglected: [{ lgo: 'LGO1', central: 's', code: 'X4', note: 'Colours would match, but O 2s is far below the H 1s LGOs in energy, so the course switches the interaction off. This is an energy argument, not a symmetry rule.' }],
    ladder: [['n:s'], ['b:LGO1+pz'], ['b:LGO2+px'], ['n:py'], ['a:LGO1+pz'], ['a:LGO2+px']],
    order: {
      required: [['b:LGO1+pz', 'a:LGO1+pz'], ['b:LGO2+px', 'a:LGO2+px']],
      drawn: [['n:s', 'b:LGO1+pz'], ['n:s', 'b:LGO2+px'], ['b:LGO1+pz', 'n:py'], ['b:LGO2+px', 'n:py'], ['n:py', 'a:LGO1+pz'], ['n:py', 'a:LGO2+px']],
      degenerate: [],
    },
    expectedCounts: { bonding: 2, nonbonding: 2, antibonding: 2 },
    claims: [
      { kind: 'lecture', locator: 'H2O lecture transcript (LGO construction, MO diagram, bond order)', claim: 'Two LGOs from H 1s; O 2s does not interact (energy gap); O 2p_y nonbonding; 8 electrons; bond order 2 for both O-H, 1 each.' },
    ],
    verify: ['Relative order of the two bonding MOs and of nonbonding O 2p_y against the slide.'],
  },
  ch4: {
    caseId: 'ch4', electrons: { count: 8, source: '4 from C + 1 from each H' }, bonds: 4,
    centralUsed: ['s', 'px', 'py', 'pz'],
    lgos: [
      { id: 'LGO1', irrep: 'A1', pattern: [1, 1, 1, 1], partner: 's', note: 'All the same colour: lowest in energy.' },
      { id: 'LGO2', irrep: 'T2', pattern: [1, -1, 1, -1], partner: 'px', note: 'Two red, two blue.' },
      { id: 'LGO3', irrep: 'T2', pattern: [1, -1, -1, 1], partner: 'py', note: 'Two red, two blue.' },
      { id: 'LGO4', irrep: 'T2', pattern: [1, 1, -1, -1], partner: 'pz', note: 'Two red, two blue.' },
    ],
    interactions: [['LGO1', 's'], ['LGO2', 'px'], ['LGO3', 'py'], ['LGO4', 'pz']],
    neglected: [],
    ladder: [['b:LGO1+s'], ['b:LGO2+px', 'b:LGO3+py', 'b:LGO4+pz'], ['a:LGO1+s'], ['a:LGO2+px', 'a:LGO3+py', 'a:LGO4+pz']],
    order: {
      required: [['b:LGO1+s', 'a:LGO1+s'], ['b:LGO2+px', 'a:LGO2+px'], ['b:LGO3+py', 'a:LGO3+py'], ['b:LGO4+pz', 'a:LGO4+pz']],
      drawn: [['b:LGO1+s', 'b:LGO2+px'], ['b:LGO4+pz', 'a:LGO1+s'], ['a:LGO1+s', 'a:LGO2+px']],
      degenerate: [['b:LGO2+px', 'b:LGO3+py', 'b:LGO4+pz'], ['a:LGO2+px', 'a:LGO3+py', 'a:LGO4+pz']],
    },
    expectedCounts: { bonding: 4, nonbonding: 0, antibonding: 4 },
    claims: [
      { kind: 'lecture', locator: 'CH4 lecture transcript and slides 53-57', claim: 'Pair splits (top/bottom, left/right or front/back); LGO1 lowest, LGO2-4 degenerate (two red, two blue); 8 MOs from 8 AOs.' },
    ],
    verify: ['Antibonding order (a1* below t2*) is the standard diagram; confirm against the CH4 slide.'],
  },
  sf6: {
    caseId: 'sf6', electrons: { count: 12, source: 'selected sigma system: 6 from S + 1 from each F p orbital (not all valence electrons)' }, bonds: 6,
    centralUsed: ['s', 'px', 'py', 'pz'],
    excludedCentral: [{ ids: ['dz2', 'dx2y2', 'dxy', 'dxz', 'dyz'], note: 'S 3d orbitals are not required in the course model.' }],
    slideLabels: { a1g: "LGO9'", t1u_x: "LGO2'", t1u_y: "LGO4'", t1u_z: "LGO6'", eg_1: "LGO8'", eg_2: "LGO10'" },
    lgos: [
      { id: 'a1g', irrep: 'A1g', pattern: [1, 1, 1, 1, 1, 1], partner: 's', note: 'All inward lobes the same colour.' },
      { id: 't1u_x', irrep: 'T1u', pattern: [1, -1, 0, 0, 0, 0], partner: 'px', note: 'x pair out of phase.' },
      { id: 't1u_y', irrep: 'T1u', pattern: [0, 0, 1, -1, 0, 0], partner: 'py', note: 'y pair out of phase.' },
      { id: 't1u_z', irrep: 'T1u', pattern: [0, 0, 0, 0, 1, -1], partner: 'pz', note: 'z pair out of phase.' },
      { id: 'eg_1', irrep: 'Eg', pattern: [1, 1, -1, -1, 0, 0], partner: null, note: 'x pair against y pair. No S 3s/3p function matches: nonbonding.' },
      { id: 'eg_2', irrep: 'Eg', pattern: [1, 1, 1, 1, -1, -1], partner: null, note: 'Equatorial four against the z pair. Colours as drawn (equal lobes on the slide); exact amplitudes are (1,1,1,1,-2,-2). No S 3s/3p function matches: nonbonding.' },
    ],
    interactions: [['a1g', 's'], ['t1u_x', 'px'], ['t1u_y', 'py'], ['t1u_z', 'pz']],
    neglected: [],
    // LGO energies as drawn on slides 17-18: a1g lowest, then the three t1u, then the two eg.
    lgoOrder: {
      required: [...cross(['a1g'], [...T1U, ...EGL]), ...cross(T1U, EGL)],
      drawn: [], degenerate: [T1U, EGL],
    },
    // MO ladder as drawn on slide 18.
    ladder: [['b:a1g+s'], T1B, EG, ['a:a1g+s'], T1A],
    order: {
      required: [['b:a1g+s', 'a:a1g+s'], ['b:t1u_x+px', 'a:t1u_x+px'], ['b:t1u_y+py', 'a:t1u_y+py'], ['b:t1u_z+pz', 'a:t1u_z+pz'],
        ...cross(['b:a1g+s'], T1B), ...cross(T1B, EG), ...cross(EG, ['a:a1g+s']), ...cross(['a:a1g+s'], T1A)],
      drawn: [],
      degenerate: [T1B, EG, T1A],
    },
    expectedCounts: { bonding: 4, nonbonding: 2, antibonding: 4 },
    claims: [
      { kind: 'lecture', locator: 'SF6 lecture transcript (Group 16) and slides 14-19', claim: 'Six F p orbitals in three trans pairs; merge two in-phase pairs then merge with the third; S 3s and 3p only; 4 bonding, 2 nonbonding, 4 antibonding; 12 electrons; bond order 8/2 = 4 total, 2/3 per S-F.' },
      { kind: 'slide', locator: 'Slides 14-19 (screenshots checked)', claim: "LGO1'..LGO10' construction sequence matches; LGO levels a1g (LGO9') < t1u (LGO2', 4', 6') < eg (LGO8', 10'); MO ladder a1g < t1u (bonding) < eg (nonbonding) < a1g* < t1u*; S 3s below S 3p; no d orbitals." },
    ],
    verify: ['Sign colours of individual lobes in LGO8\' and LGO10\' were read from screenshots at moderate confidence (a global flip does not matter).'],
  },
  h3plus: {
    caseId: 'h3plus', electrons: { count: 2, source: 'H3+ has 2 electrons' }, bonds: 3, ligandOnly: true,
    centralUsed: [],
    lgos: [
      { id: 'A1p', irrep: "A1'", pattern: [1, 1, 1], partner: null, note: 'All the same colour: lowest.' },
      { id: 'Ep_a', irrep: "E'", pattern: [1, -1, -1], partner: null, note: 'Colours as drawn; exact amplitudes (2,-1,-1).' },
      { id: 'Ep_b', irrep: "E'", pattern: [0, -1, 1], partner: null, note: 'One orbital has a node on H1.' },
    ],
    ligandOnlyKinds: { A1p: 'bonding', Ep_a: 'antibonding', Ep_b: 'antibonding' },
    interactions: [], neglected: [],
    ladder: [['A1p'], ['Ep_a', 'Ep_b']],
    order: { required: [['A1p', 'Ep_a'], ['A1p', 'Ep_b']], drawn: [], degenerate: [['Ep_a', 'Ep_b']] },
    expectedCounts: { bonding: 1, nonbonding: 0, antibonding: 2 },
    claims: [{ kind: 'tutorial', locator: 'Tutorial 3 question B (key)', claim: 'MO diagram of cyclic H3+; bond order 1/3 for each H-H.' },
             { kind: 'app-derived', locator: 'LGO construction route', claim: 'The singleton-plus-pair route is an app reconstruction, not a verified lecture procedure.' }],
    verify: ['Which route the tutor uses to build the H3+ orbitals.'],
  },
  bh3: {
    caseId: 'bh3', electrons: { count: 6, source: '3 from B + 1 from each H' }, bonds: 3,
    centralUsed: ['s', 'px', 'py', 'pz'],
    lgos: [
      { id: 'A1p', irrep: "A1'", pattern: [1, 1, 1], partner: 's', note: 'All the same colour.' },
      { id: 'Ep_y', irrep: "E'", pattern: [1, -1, -1], partner: 'py', note: 'Colours as drawn; exact amplitudes (2,-1,-1).' },
      { id: 'Ep_x', irrep: "E'", pattern: [0, -1, 1], partner: 'px', note: 'Node on H1.' },
    ],
    interactions: [['A1p', 's'], ['Ep_y', 'py'], ['Ep_x', 'px']],
    neglected: [],
    ladder: [['b:A1p+s'], ['b:Ep_y+py', 'b:Ep_x+px'], ['n:pz'], ['a:A1p+s'], ['a:Ep_y+py', 'a:Ep_x+px']],
    order: {
      required: [['b:A1p+s', 'a:A1p+s'], ['b:Ep_y+py', 'a:Ep_y+py'], ['b:Ep_x+px', 'a:Ep_x+px'], ['b:Ep_y+py', 'n:pz'], ['b:Ep_x+px', 'n:pz'], ['n:pz', 'a:A1p+s'], ['n:pz', 'a:Ep_y+py'], ['n:pz', 'a:Ep_x+px']],
      drawn: [['b:A1p+s', 'b:Ep_y+py']],
      degenerate: [['b:Ep_y+py', 'b:Ep_x+px'], ['a:Ep_y+py', 'a:Ep_x+px']],
    },
    expectedCounts: { bonding: 3, nonbonding: 1, antibonding: 3 },
    claims: [{ kind: 'tutorial', locator: 'Tutorial 3 question C (key)', claim: 'B-H bond order 1; 6 valence MO electrons; LUMO is the empty p orbital, responsible for Lewis acidity.' }],
    verify: ['The key states LUMO = empty p; the position of the nonbonding p between bonding and antibonding sets follows from that.'],
  },
  'oh-h6': {
    caseId: 'oh-h6', electrons: null, bonds: null, ligandOnly: true, centralUsed: [],
    lgos: [
      { id: 'a1g', irrep: 'A1g', pattern: [1, 1, 1, 1, 1, 1], partner: null, note: 'All the same colour: lowest in energy (Tutorial D).' },
      { id: 't1u_x', irrep: 'T1u', pattern: [1, -1, 0, 0, 0, 0], partner: null, note: 'x pair out of phase.' },
      { id: 't1u_y', irrep: 'T1u', pattern: [0, 0, 1, -1, 0, 0], partner: null, note: 'y pair out of phase.' },
      { id: 't1u_z', irrep: 'T1u', pattern: [0, 0, 0, 0, 1, -1], partner: null, note: 'z pair out of phase.' },
      { id: 'eg_1', irrep: 'Eg', pattern: [1, 1, -1, -1, 0, 0], partner: null, note: '' },
      { id: 'eg_2', irrep: 'Eg', pattern: [1, 1, 1, 1, -1, -1], partner: null, note: 'Colours as drawn; exact amplitudes (1,1,1,1,-2,-2).' },
    ],
    interactions: [], neglected: [], ladder: null,
    // The tutorial key only asks for the lowest LGO; the SF6 lecture slides (17-18) also draw t1u below eg for the same six LGOs.
    order: {
      required: [...cross(['a1g'], [...T1U, ...EGL])],
      drawn: cross(T1U, EGL), degenerate: [T1U, EGL],
    },
    ligandOnlyKinds: {}, expectedCounts: null,
    claims: [{ kind: 'tutorial', locator: 'Tutorial 3 question D (key)', claim: 'Draw the six LGOs (a1g, three t1u, two eg); the lowest in energy is the a1g combination.' },
             { kind: 'slide', locator: 'SF6 slides 17-18', claim: 'The same six LGOs are drawn with t1u below eg; shown here as drawn, not required by the tutorial key.' }],
    verify: ['The key does not rank t1u against eg; the app requires only that a1g is lowest and reports the slide ordering as drawn.'],
  },
  allyl: {
    caseId: 'allyl', electrons: { count: 2, source: 'allyl cation has 2 pi electrons' }, bonds: 2, piOnly: true,
    centralUsed: ['p2'],
    lgos: [
      { id: 'pp', irrep: 'b2', pattern: [1, 1], partner: 'p2', note: 'p1 + p3: same symmetry as the central p2.' },
      { id: 'pm', irrep: 'a2', pattern: [1, -1], partner: null, note: 'p1 - p3: has a node at C2, so p2 cannot interact: nonbonding.' },
    ],
    interactions: [['pp', 'p2']], neglected: [],
    ladder: [['b:pp+p2'], ['n:pm'], ['a:pp+p2']],
    order: { required: [['b:pp+p2', 'n:pm'], ['n:pm', 'a:pp+p2']], drawn: [], degenerate: [] },
    expectedCounts: { bonding: 1, nonbonding: 1, antibonding: 1 },
    claims: [{ kind: 'tutorial', locator: 'Tutorial 3 question A (key)', claim: 'Three pi MOs (bonding, nonbonding, antibonding); 2 electrons; pi bond order 1/2 per C-C, total C-C 1.5.' },
             { kind: 'app-derived', locator: 'terminal-LGO route', claim: 'Building p1 +/- p3 first is an app explanation of the cancellation at C2; the tutor may use a nodal-plane argument.' }],
    verify: ['Which derivation the tutor uses.'],
  },
  'b2h6-bridge': {
    caseId: 'b2h6-bridge', electrons: { count: 2, source: 'the bridge holds two electrons (one B-H-B three-centre two-electron bond)' }, bonds: 2,
    centralUsed: ['s'],
    lgos: [
      { id: 'LGO1', irrep: 'Ag', pattern: [1, 1], partner: 's', note: 'Sum of the two B hybrids.' },
      { id: 'LGO2', irrep: 'B1u', pattern: [1, -1], partner: null, note: 'Difference: node at the bridging H, nonbonding.' },
    ],
    interactions: [['LGO1', 's']], neglected: [],
    ladder: [['b:LGO1+s'], ['n:LGO2'], ['a:LGO1+s']],
    order: { required: [['b:LGO1+s', 'n:LGO2'], ['n:LGO2', 'a:LGO1+s']], drawn: [], degenerate: [] },
    expectedCounts: { bonding: 1, nonbonding: 1, antibonding: 1 },
    claims: [{ kind: 'slide', locator: 'Diborane slides 10-11 (PDF pages 48-50)', claim: 'Three-centre two-electron B-H-B bridge; each B-H bond order 0.5.' }],
    verify: ['This is a three-centre subsystem, not a full B2H6 calculation; the slides note the nonbonding orbital is slightly bonding.'],
  },
};
