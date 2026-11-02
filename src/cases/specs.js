// Case data only. Geometry and generators; everything else is derived by the engine.
const D2R = Math.PI / 180;
const diag = (a, b, c) => [[a, 0, 0], [0, b, 0], [0, 0, c]];
const rotZ = (deg) => { const t = deg * D2R, c = Math.cos(t), s = Math.sin(t); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
const INV = diag(-1, -1, -1);
const triangle = [90, 210, 330].map((a) => [Math.cos(a * D2R), Math.sin(a * D2R), 0]);
const sOrb = (pos) => ({ pos, dir: null });
const radialP = (pos) => ({ pos, dir: pos.map((x) => -x) }); // positive lobe points at the centre
const cf = {
  s: () => 1, px: (u) => u[0], py: (u) => u[1], pz: (u) => u[2],
  dz2: (u) => 2 * u[2] ** 2 - u[0] ** 2 - u[1] ** 2, dx2y2: (u) => u[0] ** 2 - u[1] ** 2,
  dxy: (u) => u[0] * u[1], dxz: (u) => u[0] * u[2], dyz: (u) => u[1] * u[2],
};
const central = (names) => names.map((n) => ({ id: n, fn: cf[n] }));
const ax = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const tet = [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]].map((v) => v.map((x) => x / Math.sqrt(3)));
const half = 104.5 / 2 * D2R;
const C3diag = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];

export const specs = [
  {
    id: 'h2o', title: 'Water', formula: 'H2O', group: 'C2v', expectedOrder: 4,
    ligandLabels: ['Ha', 'Hb'], orbitals: [sOrb([Math.sin(half), 0, Math.cos(half)]), sOrb([-Math.sin(half), 0, Math.cos(half)])],
    generators: [diag(-1, -1, 1), diag(1, -1, 1)],
    labelRules: [
      { name: 'A1', dim: 1, tot: true },
      { name: 'B1', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: -1 }, { R: diag(1, -1, 1), chi: 1 }] },
      { name: 'B2', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: -1 }, { R: diag(1, -1, 1), chi: -1 }] },
    ],
    expectedDecomposition: { A1: 1, B1: 1 },
    central: central(['s', 'px', 'py', 'pz']), neighbours: 'all', expectedSpectrum: [1, -1],
  },
  {
    id: 'h3plus', title: 'Cyclic H3+', formula: 'H3+', group: 'D3h', expectedOrder: 12,
    ligandLabels: ['H1', 'H2', 'H3'], orbitals: triangle.map(sOrb),
    generators: [rotZ(120), diag(-1, 1, 1), diag(1, 1, -1)],
    labelRules: [
      { name: "A1'", dim: 1, tot: true },
      { name: "E'", dim: 2, probes: [{ R: diag(1, 1, -1), chi: 2 }] },
    ],
    expectedDecomposition: { "A1'": 1, "E'": 1 }, central: [], neighbours: 'all', expectedSpectrum: [2, -1, -1],
  },
  {
    id: 'bh3', title: 'Borane', formula: 'BH3', group: 'D3h', expectedOrder: 12,
    ligandLabels: ['H1', 'H2', 'H3'], orbitals: triangle.map(sOrb),
    generators: [rotZ(120), diag(-1, 1, 1), diag(1, 1, -1)],
    labelRules: [
      { name: "A1'", dim: 1, tot: true },
      { name: "E'", dim: 2, probes: [{ R: diag(1, 1, -1), chi: 2 }] },
    ],
    expectedDecomposition: { "A1'": 1, "E'": 1 }, central: central(['s', 'px', 'py', 'pz']), neighbours: 'all', expectedSpectrum: [2, -1, -1],
  },
  {
    id: 'ch4', title: 'Methane', formula: 'CH4', group: 'Td', expectedOrder: 24,
    ligandLabels: ['a', 'b', 'c', 'd'], orbitals: tet.map(sOrb),
    generators: [C3diag, [[0, 1, 0], [-1, 0, 0], [0, 0, -1]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]]],
    labelRules: [
      { name: 'A1', dim: 1, tot: true },
      { name: 'T2', dim: 3, probes: [{ R: [[0, 1, 0], [-1, 0, 0], [0, 0, -1]], chi: -1 }] },
    ],
    expectedDecomposition: { A1: 1, T2: 1 }, central: central(['s', 'px', 'py', 'pz']), neighbours: 'all', expectedSpectrum: [3, -1, -1, -1],
  },
  {
    id: 'sf6', title: 'Sulfur hexafluoride (sigma, S 3s/3p course model)', formula: 'SF6', group: 'Oh', expectedOrder: 48,
    ligandLabels: ['+x', '-x', '+y', '-y', '+z', '-z'], orbitals: ax.map(radialP),
    generators: [rotZ(90), C3diag, INV],
    labelRules: [
      { name: 'A1g', dim: 1, tot: true },
      { name: 'Eg', dim: 2, probes: [{ R: INV, chi: 2 }] },
      { name: 'T1u', dim: 3, probes: [{ R: INV, chi: -3 }, { R: rotZ(90), chi: 1 }] },
    ],
    expectedDecomposition: { A1g: 1, Eg: 1, T1u: 1 },
    central: central(['s', 'px', 'py', 'pz', 'dz2', 'dx2y2', 'dxy', 'dxz', 'dyz']), neighbours: 'cis', expectedSpectrum: [4, 0, 0, 0, -2, -2],
  },
  {
    id: 'oh-h6', title: 'Six H 1s functions, octahedral (Tutorial D)', formula: 'H6 (octahedral arrangement)', group: 'Oh', expectedOrder: 48,
    ligandLabels: ['+x', '-x', '+y', '-y', '+z', '-z'], orbitals: ax.map(sOrb),
    generators: [rotZ(90), C3diag, INV],
    labelRules: [
      { name: 'A1g', dim: 1, tot: true },
      { name: 'Eg', dim: 2, probes: [{ R: INV, chi: 2 }] },
      { name: 'T1u', dim: 3, probes: [{ R: INV, chi: -3 }, { R: rotZ(90), chi: 1 }] },
    ],
    expectedDecomposition: { A1g: 1, Eg: 1, T1u: 1 }, central: [], neighbours: 'cis', expectedSpectrum: [4, 0, 0, 0, -2, -2],
  },
  {
    id: 'allyl-full', title: 'Allyl pi system, all three p orbitals', formula: 'C3H5+ (pi, full basis)', group: 'C2v', expectedOrder: 4,
    ligandLabels: ['C1', 'C2', 'C3'],
    orbitals: [{ pos: [-1.2, 0, 0], dir: [0, 1, 0] }, { pos: [0, 0, 0.7], dir: [0, 1, 0] }, { pos: [1.2, 0, 0], dir: [0, 1, 0] }],
    generators: [diag(-1, -1, 1), diag(1, -1, 1)],
    labelRules: [
      { name: 'a2', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: 1 }, { R: diag(1, -1, 1), chi: -1 }] },
      { name: 'b2', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: -1 }, { R: diag(1, -1, 1), chi: -1 }] },
    ],
    expectedDecomposition: { a2: 1, b2: 2 }, central: [], neighbours: 'none', expectedSpectrum: null,
  },
  {
    // Allyl pi system: molecule in the xz plane, C2 along z; p orbitals along y (perpendicular to the plane).
    id: 'allyl', title: 'Allyl cation (pi system)', formula: 'C3H5+ (pi)', group: 'C2v', expectedOrder: 4,
    ligandLabels: ['C1', 'C3'], // terminal pair is the "ligand" set; C2 is the central atom
    orbitals: [{ pos: [-1.2, 0, 0], dir: [0, 1, 0] }, { pos: [1.2, 0, 0], dir: [0, 1, 0] }],
    generators: [diag(-1, -1, 1), diag(1, -1, 1)],
    labelRules: [
      { name: 'a2', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: 1 }, { R: diag(1, -1, 1), chi: -1 }] },
      { name: 'b2', dim: 1, probes: [{ R: diag(-1, -1, 1), chi: -1 }, { R: diag(1, -1, 1), chi: -1 }] },
    ],
    expectedDecomposition: { a2: 1, b2: 1 },
    centralOrbital: { id: 'p2', pos: [0, 0, 0.7], dir: [0, 1, 0] },
    huckel: { atoms: 3, edges: [[0, 1], [1, 2]], expectedSpectrum: [Math.SQRT2, 0, -Math.SQRT2] },
    neighbours: 'none', expectedSpectrum: null,
  },
];
