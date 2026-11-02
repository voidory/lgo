import { specs } from '../src/cases/specs.js';
import { buildCaseModel, feasibleTable } from '../src/engine/casemodel.js';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('build', { recursive: true });
const out = specs.map((s) => {
  const m = buildCaseModel(s);
  return { id: s.id, n: m.n, order: m.group.order, generators: s.generators,
    orbitals: s.orbitals, irreps: m.irreps.map((i) => ({ name: i.name, dim: i.dim, mult: i.mult, basis: i.basis, projector: i.projector })),
    feasible: feasibleTable(m) };
});
writeFileSync('build/engine-dump.json', JSON.stringify(out));
console.log('dumped', out.length, 'cases');
