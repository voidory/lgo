# Batch A: installed hardening source

Source preparation baseline: PR #2 head 27975c1d1e68e0534074a553792fc8d31c7daaaf on hardening/verification-candidate. This source change installs the recovery recipe output and permanent test wiring; normal use no longer requires executing the recipe. The recovery script remains a historical, hash-guarded utility and will reject the already-applied files.

## Installed contracts
- gradeFilling validates occupancy maps before invoking the original filling logic. Omitted own keys mean zero. Negative, fractional, non-finite, nonnumeric, unknown-key and accessor inputs are rejected; above-capacity occupancies are reported as overfull. No learner input is mutated.
- gradeMatching guards malformed/conflicting selections and unknown LGO IDs. Noncanonical sign-only matching is explicitly blocked instead of claiming an exact central linear combination. Canonical course matching remains supported; a general coefficient-level matcher is not implemented.
- centralSymmetry separates AO labels, sampled ligand-coupling labels and zero coupling. H2O py derives B2 while its sampled coupling stays zero. A null label means unresolved, not an absence of molecular symmetry. General d-orbital labels are not claimed solved.
- Complete-set and construction guards classify missing slots, sparse holes and missing coefficients as incomplete; malformed types and values outside -1, 0, 1 are invalid. No learner state is silently completed.
- SVG coefficient zero produces no disk and explicit no-lobe text; unanswered remains a dashed question-mark disk.
- Existing mathematical routines and course data are retained. The original grader bodies remain behind validated entry points in grading.js, with shared guards in hardening.js.

## Normal verification commands
npm test
npm run test:hardening
npm run test:ui

npm test now runs Stage 1, updated Stage 2, hardening and zero-state regressions. Browser tests remain explicit through scripts/verify_batch_a.py or the existing two Python browser scripts. With requirements-verification.txt and Chromium installed, run python scripts/verify_batch_a.py in a complete checkout. It detects installed hardening.js and does not reapply the recipe. The runner does not commit, push, merge or alter Pages.

## Evidence and pending gate
GitHub reported both verify jobs successful for the recipe-applied tree at 27975c1d1e68e0534074a553792fc8d31c7daaaf: runs 41499169584 and 41499775838. This source was regenerated from the committed recipe with all six input Git blob hashes checked, and package wiring reproduced from the verifier. It was not downloaded from a workflow artifact. Local preparation checked JavaScript syntax; it did not rerun the full suites.

The actual source commit must receive its own green CI result before this PR is considered merge-ready. These prior green recipe runs do not by themselves verify that future commit. No fresh per-suite assertion counts are claimed here.

CI produces report.json, logs, screenshots, applied-source.zip, source-overlay.zip and a tracked-files patch, retained for 14 days. In historical recipe-applied runs the new hardening.js was untracked and only included by the ZIPs; in an installed-source checkout it is tracked. The connector has no artifact-download tool. Source snapshots and reports record hashes and the tested source commit.

Still pending independently: H2O course-order provenance, real screen-reader speech, Firefox/WebKit, touch hardware, native zoom and live Pages. No Step 5, other guided case or 3D feature is included. Main and Pages settings are unchanged by preparing this patch; merge requires separate approval.
