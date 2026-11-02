# LGO Lab — Steps 1–3 preview

A mobile-first LGO/MO learning application for NTU CM2021, under development. The root entry page now connects three H₂O Guided layout steps: valence basis, ligand-fragment separation and the in-phase LGO with global phase reversal. The existing scientific engine and course data are unchanged.

## Preview and test
```sh
python3 -m http.server 8000
# Open http://localhost:8000/
npm test
node tests/ui-preview.mjs
```
Serve over HTTP, not file://, because the page uses browser modules. No UI dependencies or build step are required. Imports and assets are relative for a Pages project subdirectory.

## Scope
Shared state preserves view settings and phase choices during navigation until reload. This is ungraded, 2D schematic presentation. No 3D camera, Steps 4–9, MO ladder/filling, engine-connected validity checks, Practice, Blind or reports are finished. O 2s is symmetry-compatible, not symmetry-forbidden. No course PDFs, screenshots or transcripts are published.

## Pages
Committing source does not enable Pages. An administrator can select Settings > Pages > Deploy from a branch > main > /(root), then Save. Use GitHub's reported deployment URL after a successful build. Existing branch-based Pages may auto-deploy a commit. This integration does not change Pages settings.

See docs/UI-PREVIEW.md for executed checks and remaining review. Historical engine test counts are not fresh verification.
