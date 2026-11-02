# Batch A verification foundation

Prepared against main 28625bb2b325fe0e7062161cdf945bca4d5734ca; candidate branch hardening/verification-candidate. This checkpoint adds tests and CI, not applied hardening source.

The read-only workflow applies the recovery recipe in its disposable full checkout if hardening.js is absent, wires companion tests into the local package.json, and runs npm test, UI preview, 48-screen ID/ARIA checks and both Chromium suites at a project-subdirectory URL. It never commits, pushes, merges or changes Pages. Playwright is pinned to 1.51.0; Actions are SHA-pinned. Hosted execution may consume Actions minutes.

Artifacts retained for 14 days contain report.json, logs, screenshots, applied-source.zip, source-overlay.zip and a tracked-files patch. The generated untracked hardening.js is in the ZIPs, not git diff. The connector currently exposes no artifact-download tool; do not promise automatic artifact retrieval through it.

Local disposable-checkout use: create a venv, install requirements-verification.txt, run python -m playwright install chromium, then python scripts/verify_batch_a.py --apply-recipe. This modifies source and test wiring locally and writes verification-output/.

A green run verifies the locally applied tree only. Preserve the actual applied modules/tests in a separately approved source commit, rerun checks against that commit, and obtain merge approval. No fresh application-suite pass is claimed at preparation. Local preflight covered syntax, workflow structure and valid/invalid ID/ARIA checker fixtures.

Still pending: course-order provenance, real screen-reader speech, Firefox/WebKit, touch hardware, native zoom and live Pages. No Step 5 or 3D feature is included.
