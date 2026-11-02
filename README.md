# LGO Lab — Steps 1–5 preview

A mobile-first LGO/MO learning application for NTU CM2021, under development. The root page connects five H₂O Guided steps: valence basis, ligand-fragment separation, sum and difference construction, and an explanatory complete-set check using the existing mathematical engine. Batch A supplies input validation and explicit AO-symmetry metadata; Batch B retains the learner's actual constructions. Course data are unchanged. Zero coefficients remain distinct from unanswered input.

## Preview and test
```sh
python3 -m http.server 8000
# Open http://localhost:8000/
npm test
npm run test:ui
npm run test:hardening
npm run test:step5
# Full verification in a complete git checkout:
python3 -m pip install -r requirements-verification.txt
python3 -m playwright install --with-deps chromium
python3 scripts/verify_batch_a.py
```
Serve over HTTP, not file://. No UI dependencies or build step are required. Imports and assets are relative for a Pages project subdirectory. The verifier requires Node, npm, Python, Git and the pinned browser dependency. It checks permanent package commands without rewriting them, validates 60 rendered states and runs announcement, Step 4 and Step 5 Chromium suites.

## Scope
Shared state preserves view settings and phase choices during navigation until reload. Step 5 checks count, independence and symmetry using retained patterns, without silently filling unanswered signs. Editing a construction resets its explanation; no success badge is cached in state. The preview is ungraded and 2D schematic. Steps 6–9, a 3D camera, MO ladder/filling, Practice, Blind and saved reports are not implemented in the Guided UI. O 2s remains symmetry-compatible, not symmetry-forbidden. No supplied course PDFs, screenshots or transcripts are published.

## CI and Pages
The workflow verifies pushes to guided/h2o-complete-set and hardening/verification-candidate and pull requests targeting main. Reports identify the tested commit; previous green runs do not verify a new commit. Logs, screenshots, source hashes and source ZIPs are retained for 14 days. A successful installed-source run must leave tracked file contents unchanged.

This follow-up changes neither main nor Pages settings and does not deploy. Merge requires separate approval after fresh CI evidence. Actual screen-reader speech, Firefox/WebKit, native zoom, touch hardware, live Pages and H₂O course-order provenance remain independent checks.

See docs/BATCH-B.md for the current checkpoint and merge gate. docs/BATCH-A.md, docs/STEP4-UI.md and docs/UI-PREVIEW.md are historical checkpoints, not claims of current CI success.
