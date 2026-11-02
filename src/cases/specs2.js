// Stage 2 additions: the B-H-B bridge subsystem of diborane (two B-directed hybrids + bridging H 1s).
// Idealised linear arrangement along z; this is a three-centre subsystem, NOT a full B2H6 calculation.
const diag = (a, b, c) => [[a, 0, 0], [0, b, 0], [0, 0, c]];
const INV = diag(-1, -1, -1);
export const specs2 = [
  {
    id: 'b2h6-bridge', title: 'Diborane B-H-B bridge (three-centre subsystem)', formula: 'B-H-B bridge', group: 'D2h (idealised linear)', expectedOrder: 8,
    ligandLabels: ['B(a) hybrid', 'B(b) hybrid'],
    orbitals: [{ pos: [0, 0, 1], dir: [0, 0, -1] }, { pos: [0, 0, -1], dir: [0, 0, 1] }],
    generators: [diag(-1, -1, 1), diag(1, -1, -1), INV],
    labelRules: [
      { name: 'Ag', dim: 1, tot: true },
      { name: 'B1u', dim: 1, probes: [{ R: INV, chi: -1 }, { R: diag(-1, -1, 1), chi: 1 }] },
    ],
    expectedDecomposition: { Ag: 1, B1u: 1 },
    central: [{ id: 's', fn: () => 1 }], neighbours: 'none', expectedSpectrum: null,
  },
];
