# LGO Lab (engine, stage 1)

Scientific engine for a ligand-group-orbital (LGO) trainer. **This is the engine only: there is no UI yet.**

## Run it

Requirements: Node 20+. The optional cross-check needs Python 3 with numpy and scipy.

```
npm test                                   # 259 checks, Node only
npm run dump                               # writes build/engine-dump.json
python3 scripts/verify_scipy.py            # independent LP cross-check (numpy + scipy)
```

Expected: `259 passed, 0 failed`, then `patterns checked 4734 mismatches 0`.

## What is in here

- `src/engine/` linear algebra, point-group closure, orbital representations derived from geometry, symmetry-type decomposition without character tables, colour (sign) feasibility, complete-set validity.
- `src/cases/specs.js` H2O, cyclic H3+, BH3, CH4, SF6 (S 3s/3p sigma model), octahedral H6, allyl (terminal pair and full pi basis).
- `tests/run.mjs` test suite. `scripts/` dump and SciPy cross-check. `docs/STATUS.md` what is and is not done.

## Not built yet

UI, 3D view, Guided/Practice/Blind modes, reports, diatomics, textbook pack, uranium sandbox, GitHub Pages packaging.

## Limits

The SciPy check re-implements the same geometric model, so it checks the code, not the chemistry. Energy-ordering numbers from the adjacency model are illustrative only. No course PDFs or transcripts are included.
