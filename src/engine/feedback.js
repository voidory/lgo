// Feedback registry. Every message names the rule it rests on and whether that rule is a theorem of the model,
// a convention used for teaching, the course's own statement, or a modelling choice.
export const LAYERS = { VALIDITY: 'validity', COURSE: 'course', MODEL: 'model' };
export const BASIS = { THEOREM: 'theorem', CONVENTION: 'convention', COURSE: 'course statement', MODEL: 'model assumption' };

const TABLE = {
  Z1: ['validity', 'theorem', 'An all-zero pattern is not an orbital.'],
  S1: ['validity', 'theorem', 'The set is incomplete: every ligand orbital needs a defined lobe.'],
  S2: ['validity', 'theorem', 'No combination of the ligand orbitals with this symmetry has exactly these signs.'],
  S3: ['validity', 'theorem', 'These patterns cannot be shared out among the symmetry types as independent combinations.'],
  D1: ['course', 'convention', 'Two slots have the same colouring (or its global flip). Teaching convention: count each distinct LGO once.'],
  C1: ['course', 'course statement', 'Valid, but not the picture the course draws. It is a rotated or different member of the same symmetry type.'],
  X1: ['validity', 'theorem', 'Only central functions of the same symmetry type as the LGO can have non-zero interaction.'],
  X2: ['validity', 'theorem', 'Every symmetry-compatible central function should be listed; an LGO with none is nonbonding.'],
  X3: ['model', 'model assumption', 'Noncanonical sign-only matching is not graded without coefficient-level support.'],
  X4: ['course', 'course statement', 'Symmetry permits this interaction; the course neglects it because of the energy gap.'],
  X6: ['validity', 'theorem', 'Same symmetry type, but this specific LGO has zero overlap with that central function: it is aligned with a different one.'],
  X5: ['course', 'course statement', 'Symmetry-compatible, but this central function is not part of the course model.'],
  E1: ['course', 'course statement', 'This ordering contradicts a relation the course states.'],
  E2: ['validity', 'theorem', 'Members of a degenerate set must share a level.'],
  E3: ['model', 'model assumption', 'This relation is drawn in the course diagram but is not decided by the colour rules, so it is not graded.'],
  F1: ['course', 'course statement', 'The number of electrons placed does not match the electrons available.'],
  F2: ['validity', 'theorem', 'An orbital holds at most two electrons.'],
  F3: ['course', 'course statement', 'The occupancy differs from filling the course ladder from the bottom up.'],
  F4: ['course', 'course statement', "Hund's rule: occupy a degenerate set singly before pairing."],
  F5: ['validity', 'convention', 'Occupancies must map known orbital IDs to integers 0, 1 or 2; omitted IDs mean zero.'],
  S4: ['validity', 'convention', 'Construction inputs must use sign arrays of -1, 0 and 1; missing entries remain unanswered.'],
  B1: ['model', 'model assumption', 'Bond order here is a counting convention for the qualitative diagram: (bonding e - antibonding e)/2, shared equally over the bonds.'],
};
export function fb(code, extra = {}) {
  const [layer, basis, message] = TABLE[code]; return { code, layer, basis, message, ...extra };
}
export const FEEDBACK_CODES = Object.keys(TABLE);
