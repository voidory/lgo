# LGO Lab — Steps 1–4 preview

A mobile-first LGO/MO learning application for NTU CM2021, under development. The root entry page now connects four H₂O Guided layout steps: valence basis, ligand-fragment separation and the in-phase and out-of-phase LGOs with global phase reversal. Batch A installs input validation and explicit AO-symmetry metadata in the scientific engine; course data remain unchanged. Zero coefficients render without a lobe and remain distinct from unanswered input.

## Preview and test
```sh
python3 -m http.server 8000
# Open http://localhost:8000/
npm test
npm run test:ui
npm run test:hardening
# Full verification in a complete checkout with requirements-verification.txt installed:
# python scripts/verify_batch_a.py
```
Serve over HTTP, not file://, because the page uses browser modules. No UI dependencies or build step are required. Imports and assets are relative for a Pages project subdirectory.

## Scope
Shared state preserves view settings and phase choices during navigation until reload. This is ungraded, 2D schematic presentation. No 3D camera, Steps 5–9, MO ladder/filling, engine-connected validity checks, Practice, Blind or reports are finished. O 2s is symmetry-compatible, not symmetry-forbidden. No course PDFs, screenshots or transcripts are published.

## Pages
Committing source does not enable Pages. An administrator can select Settings > Pages > Deploy from a branch > main > /(root), then Save. Use GitHub's reported deployment URL after a successful build. Existing branch-based Pages may auto-deploy a commit. This integration does not change Pages settings.

See docs/BATCH-A.md for hardening contracts and verification status, and docs/STEP4-UI.md for the layout checkpoint; docs/UI-PREVIEW.md records the earlier Steps 1–3 checkpoint. Historical engine test counts are not fresh verification.
