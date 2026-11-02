# Batch B: retained H₂O complete-set check

## Source checkpoint
Prepared on guided/h2o-complete-set after core commit 531adfab169204ec0bc9869d3f78dca0edae5474 and regression/test-wiring commit 07ed6a5b394c628be95239828734dcd33bf9a688. This CI/documentation follow-up is not itself evidence of a passed run. Consult the workflow result and report.json sourceCommit for the exact tested commit.

## Implemented boundary
Step 5 displays the actual sum and difference-slot patterns retained from Steps 3 and 4. Navigation may reach it with an unanswered sum or a same-sign difference reference. No canonical patterns are substituted. The explanation progresses through count, independence and symmetry; validateSet supplies the verdict, and the existing linear-algebra and symmetry routines supply diagnostic rank and transformations. Both globally reversed constructions remain equivalent to their originals; duplicate combinations up to overall sign do not form a complete independent set.

Count is necessary but insufficient. The reference pair (+, +) and (+, −) explains independence without overwriting learner state. C₂ about z and the xz/yz reflections illustrate the fixed molecular frame. This is a ligand-space check, not oxygen AO matching, a solved MO isosurface, or a Practice score. Coefficients are proportional, not asserted normalized. Oxygen stays set aside; Step 6 is not implemented.

Construction edits reset the staged explanation. Verdicts are derived from current patterns rather than stored as a validity badge. Resetting the explanation preserves constructions and view settings. Separate SVG namespaces prevent duplicate IDs when both previews appear. Persistent live-region and focus handling remain part of browser regression coverage.

## Verification contract
Run npm test and npm run test:ui for permanent Node test commands, or python3 scripts/verify_batch_a.py for the full checkout runner after installing requirements-verification.txt and Chromium. Despite its historical filename, the runner now covers installed Batch A and B source. It never rewrites package.json or reapplies the historical recovery recipe. The legacy --apply-recipe flag is accepted only for command compatibility; installed hardening source is still required.

The full runner checks JavaScript/Python syntax, permanent package wiring, Node suites, all 60 initial/built/flipped render variants (5 steps x 2 axes settings x 2 guide settings x 3 phase states), unique IDs and resolved ARIA/label targets. Browser suites cover announcements, Step 4 compatibility and Step 5 flows at 380 and 1280 CSS pixels, including incomplete/duplicate/valid states, global reversal, focus, edits after success, view preferences and enlarged-root-text reflow. Staged interactive Step 5 states are covered by browser tests, not by the 60-state render count.

CI records command output, browser reports, source hashes, screenshots, a full tracked-source ZIP, an overlay ZIP and a tracked-file patch. Any tracked file-content change fails verification. A fresh checkout is recommended; generated evidence goes into verification-output. The workflow uses exact candidate checkout, read-only contents permission, no persisted checkout credentials and 14-day artifact retention.

## Remaining gate
The follow-up push is configured to start verification on this working branch. A successful fresh workflow for the completed candidate is required before merge consideration; green Batch A/PR #2 runs do not verify Batch B. Do not merge on the basis of source preparation or test counts in old notes. Main and Pages remain unchanged by preparing or committing this branch update. Merge/deployment is not authorized here.

Still unverified independently: H₂O course-order provenance, actual assistive-technology speech, Firefox/WebKit, native browser zoom, real touch hardware and live Pages. Root-font enlargement is not native zoom, and DOM live-region assertions are not screen-reader speech tests. No other guided molecule, 3D renderer or Steps 6–9 are added.
