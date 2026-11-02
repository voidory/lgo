# H2O functional workflow: first implementation unit

## Status

Candidate prepared for guided/h2o-complete-workflow from f8506e063323ffd868771bf4e07993865b68c48e. This unit adds a pure workflow model and regressions, not new visible screens. Root UI remains Guided Steps 1-5 until a subsequent integration unit. No completion, CI success, merge, deployment, version or release is asserted.

The earlier nine-file workflow-state/workflow-view proposal is withdrawn, not installed. The supplied Revised Implementation Brief and Final Build Handoff provide the source requirements. Current explicit external-write/PR/merge approval rules remain in force. Do not publish those supplied PDFs.

## Functional contract

1. Pass actual retained ligand patterns to the existing complete-set engine. Incomplete/invalid sets block later acceptance, without overwriting patterns.
2. Select all symmetry-compatible oxygen functions for each actual pattern. Sum: s and pz; difference: px. Global reversal preserves the result. O py remains B2 despite zero sampled coupling.
3. Separately choose course interaction partners, explain the O 2s energy approximation, and classify each of six MO product slots. The reference tasks expose source functions and overlap-reinforcing/opposing relationships for the future UI. Correct aggregate counts are not a substitute for correct individual outcomes. Labels refer to relative overlap, not a universal literal plus/minus sign on a central function.
4. Assign levels explicitly and check supported partial-order relations only. A pass does not validate the full energy order. Required relations and course verification caveats come from committed course data.
5. Explicitly acknowledge switching to the stored course-reference ladder before filling. Preserve learner level choices. Every occupancy including zero must be explicit before calling gradeFilling. Eight electrons and bond order per O-H are checked; bond diagnostics are exposed only for correct filling.

No success badge is stored. Verdicts derive from inputs. Metadata is detached before exposure to views. The module uses the existing mathematical/course engines without changing them.

## Dependencies and integration still required

Matching edits clear course-model, order and filling work. Partner/energy edits clear products and later work. Individual product edits clear ordering/filling. Level edits clear reference acknowledgement, occupancies and bond order. Occupancy edits clear bond order. The future interface must disclose these resets before/when editing; the pure model alone does not establish accessible messaging.

The next unit must integrate freshH2O/updateH2O/evaluateH2O into the existing state/view/app modules, reset this downstream state on ligand construction edits, and update affected regressions directly. Do not install a parallel historical-view adapter or patch scope strings at runtime.

MO construction must show the interaction-to-product relationship, not just six classification selects without explanatory connection. Use original schematic illustrations and clear labels. 3D camera/renderer work is the separately scoped visual unit; do not advertise it as installed.

## Verification boundary

New Node suite: tests/h2o-model.mjs, permanently wired into npm test and npm run test:ui. The branch workflow runs the installed-source full verification runner, including historical browser suites. Because this unit does not alter screens, the runner's 60 render variants still cover only Steps 1-5. New model tests are not new browser or touch coverage.

Fresh CI at the actual committed head remains required. Local syntax results, if supplied, are not engine regression or browser results. H2O course energy-order provenance, actual screen-reader speech, Firefox/WebKit, native zoom, real touch and live deployment remain independently unverified.
