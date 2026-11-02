# LGO Lab — H2O functional UI candidate

Mobile-first CM2021 application. The root connects Guided Steps 1–9: retained ligand construction, complete-set checking, oxygen symmetry matching, individual course-model MO outcomes, supported partial ordering, reference filling and per-bond interpretation. This is an ungraded 2D schematic candidate, not a verified release or completed spatial renderer.

## Preview and verify

```sh
python3 -m http.server 8000
# Open http://localhost:8000/
npm test
npm run test:ui
npm run test:h2o
python3 -m pip install -r requirements-verification.txt
python3 -m playwright install --with-deps chromium
python3 scripts/verify_batch_a.py
# Additionally, with the preview server running:
python3 tests/browser-h2o.py http://localhost:8000/ --screenshots verification-output/screenshots
```

Serve over HTTP, not file://. The application is static with relative imports/assets and no backend, account or secret. The branch/PR H2O workflow runs both the installed-source full runner and the dedicated late-step Chromium suite. Old green checks do not verify a new head. The legacy runner's 60 renders cover Steps 1–5; late Node snapshots and interactive browser checks are separate coverage. Source ZIPs, logs, reports and screenshots are retained by CI.

## Scientific and interaction boundaries

O 2s is symmetry-compatible but neglected for energy mismatch in the course model. O 2py retains B2 symmetry despite zero sampled ligand coupling. Every individual MO outcome is checked; aggregate counts alone are insufficient. Full energy ordering remains partly unverified. Step 9 explicitly uses the stored course-reference diagram without overwriting learner placements. Every occupancy including zero requires an answer. No canonical ligand signs or fill answers are substituted.

Navigation remains available with incomplete work; dependent checks explain blocked prerequisites. Upstream edits clear dependent work with notices. State resets on reload. Late Reset preserves constructions/preferences; Restart clears all. Verdicts are derived, not stored success badges.

## Remaining gates

Candidate source and test preparation are not passing verification. Fresh candidate-head CI and review remain required. No other Guided molecules, camera, calculated MO surfaces, Practice/Blind, saved reports, package-version bump, tag/release or deployment is included. Actual screen-reader speech, Firefox/WebKit, native zoom, real touch, course-order provenance and live Pages remain unverified. Merge/deployment require separate approval. No supplied copyrighted PDFs/screenshots/transcripts are published.

See docs/H2O-FUNCTIONAL-WORKFLOW.md. Earlier Batch A/B and UI documents are historical checkpoints; docs/STATUS.md is historical engine/course status, not current UI or CI evidence.
