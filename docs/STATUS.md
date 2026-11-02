# LGO Lab - build status

## Stage 1 (engine) - done, pushed
Point groups, derived orbital representations, symmetry types without character tables, exact colour feasibility, complete-set validity (Rado), 8 cases, 259 tests, SciPy cross-check (0 mismatches in 4,734 patterns).

## Stage 2 (course data and graders) - done
- `src/engine/feedback.js`: 20 feedback codes, each with layer (validity / course / model) and basis (theorem / convention / course statement / model assumption).
- `src/course/data.js`: course routes, partners, ladders, electron counts, bonds, claim labels and a `verify` list, for H2O, CH4, SF6, H3+, BH3, octahedral H6, allyl and the diborane B-H-B bridge.
- `src/engine/grading.js`: construction, matching, MO construction, ordering (partial order, MO and LGO level), filling (Aufbau + Hund), bond order.
- `src/course/diatomics.js`: one template for H2..Ne2 (s-p mixing swaps sigma(2pz) and pi(2p) for Li2-N2).
- `src/cases/specs2.js`: the B-H-B bridge case.
- `tests/stage2.mjs`: 253 checks (incl. engine regression).

## Checked against the lecture screenshots (SF6 slides 14-19)
- LGO1'..LGO10' construction sequence matches our course route; slide labels are stored in `slideLabels`.
- LGO levels as drawn on slides 17-18: a1g (LGO9') < t1u (LGO2', 4', 6') < eg (LGO8', 10'). Now graded for SF6 (`lgoOrder`).
- MO ladder on slide 18: a1g < t1u (bonding) < eg (nonbonding) < a1g* < t1u*; S 3s below 3p; no d orbitals. SF6 ladder relations promoted from "drawn" to "required".
- Tutorial D (octahedral H6): only "a1g lowest" is required (tutorial key); t1u < eg is reported as drawn on the slide but not graded.
- The slide draws equal-size lobes for LGO10'; the exact amplitudes (1,1,1,1,-2,-2) come from the symmetry calculation, not from the slide.

## Design decisions
- A specific course LGO overlaps only the central function it is aligned with (feedback X6 for same-type orthogonal picks).
- A rotated valid LGO pairs with a combination of central functions: any non-empty compatible subset is accepted (X3).
- H2O O 2s: symmetry-compatible, neglected by the course for the energy gap (X4).
- SF6 S 3d: symmetry-compatible with Eg but outside the course model (X5).
- Groupings: validity never depends on how sites were grouped. For SF6, 7 of 15 pair groupings (all-trans, and one trans + two cis) complete the lecture procedure with a valid colour set; the 8 all-cis ones do not under that procedure. Route checking comes in Stage 3.

## Engine bug found and fixed
`validateSet` crashed when a whole slot was null; it now reports `incomplete`.

## Still to verify against the original slides (`verify` in data.js)
H2O bonding-MO order; CH4 antibonding order; tutor's routes for H3+ and allyl; individual lobe colours in LGO8'/LGO10' (read from screenshots).

## Not built yet
UI (Stage 3), remaining Guided cases in the UI (4), Practice and Blind (5), textbook pack and comparisons (6), uranium report (7), release (8).
