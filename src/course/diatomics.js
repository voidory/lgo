// Homonuclear diatomics H2..Ne2 as one reusable template: only the ladder and electron count differ.
// Ladders follow the course slides (Fig. 5.7 in the textbook extract): s-p mixing for Li2-N2 swaps sigma(2pz) and pi(2p).
const s1 = [['σ1s'], ['σ*1s']];
const s2 = [['σ2s'], ['σ*2s']];
const mixed = [['σ2s'], ['σ*2s'], ['π2px', 'π2py'], ['σ2pz'], ['π*2px', 'π*2py'], ['σ*2pz']];
const unmixed = [['σ2s'], ['σ*2s'], ['σ2pz'], ['π2px', 'π2py'], ['π*2px', 'π*2py'], ['σ*2pz']];
export const DIATOMICS = {
  H2: { electrons: 2, ladder: s1, expected: { bondOrder: 1, unpaired: 0 } },
  He2: { electrons: 4, ladder: s1, expected: { bondOrder: 0, unpaired: 0 } },
  Li2: { electrons: 2, ladder: s2, expected: { bondOrder: 1, unpaired: 0 } },
  Be2: { electrons: 4, ladder: s2, expected: { bondOrder: 0, unpaired: 0 } },
  B2: { electrons: 6, ladder: mixed, mixing: true, expected: { bondOrder: 1, unpaired: 2 } },
  C2: { electrons: 8, ladder: mixed, mixing: true, expected: { bondOrder: 2, unpaired: 0 } },
  N2: { electrons: 10, ladder: mixed, mixing: true, expected: { bondOrder: 3, unpaired: 0 } },
  O2: { electrons: 12, ladder: unmixed, expected: { bondOrder: 2, unpaired: 2 } },
  F2: { electrons: 14, ladder: unmixed, expected: { bondOrder: 1, unpaired: 0 } },
  Ne2: { electrons: 16, ladder: unmixed, expected: { bondOrder: 0, unpaired: 0 } },
};
export function diatomicSystem(name) {
  const d = DIATOMICS[name]; if (!d) throw new Error('unknown diatomic ' + name);
  const ids = d.ladder.flat();
  return { id: name, mos: ids.map((id) => ({ id, label: id, kind: id.includes('*') ? 'antibonding' : 'bonding' })), ladder: d.ladder, electrons: d.electrons, bonds: 1,
    order: { required: [], drawn: [], degenerate: d.ladder.filter((l) => l.length > 1) } };
}
