# LGO Lab - build status (Stage 1: engine only)

Run: `npm test` (Node 20) then `npm run dump && python3 scripts/verify_scipy.py` (needs numpy, scipy).

## Done and verified
- Point groups closed from generators; orders C2v 4, D3h 12, Td 24, Oh 48.
- Orbital signed-permutation representations derived from geometry (including allyl p-pi sign reversal); representation law checked.
- Irreps found without a hand-typed character table (class-sum / central-character method), including multiplicity > 1 (full allyl basis: b2 twice).
- Cases in the engine: H2O, cyclic H3+, BH3, CH4, SF6 (radial sigma), octahedral H6 (Tutorial D), allyl (terminal pair and full pi basis).
- Colour feasibility by exact vertex enumeration (no LP solver), witness + margin re-verified; cross-checked against scipy linprog on 4,734 pattern/irrep combinations with 0 mismatches.
- Complete-set validity: share-out among irreps + independence by Rado's theorem (no precomputed triple tables).
- Tests (259 checks) include: SF6 four-plus-two merge accepted; rotated T1u triple (3 red/3 blue) accepted; dependent T1u triple rejected; CH4 in-with-out set rejected; all three CH4 pair splits give the same colourings; (1,-1,-1) and (1,1,1,1,-1,-1) are valid colourings but not eigenvectors; degenerate members mix under symmetry; H3+ has exactly 12 of 27 achievable E' patterns.

## Not built yet
UI, three.js rendering, Guided/Practice/Blind modes, reports, diatomics, textbook pack, linear H3+/BeH2 comparisons, uranium sandbox, GitHub Pages packaging, provenance registry.

## Limits of the verification
- The scipy check re-implements the same geometric model; it is not an independent check of the model's chemistry.
- Adjacency (Hueckel-type) spectra are labelled model-only; they are not course statements.
- Central-orbital vectors use point evaluation at bond directions: valid for s and radial-sigma ligands only, NOT for oriented pi ligands (uranium/benzene will need a different treatment).
- Symmetry labels (A1, T2, ...) come from probe characters in each spec, checked against derived characters; probes are a small amount of typed data per case.
