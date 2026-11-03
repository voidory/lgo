# H2O spatial foundation — five-file batch 1

Baseline: render/h2o-spatial-foundation at 7a38005051754b80a0be251b3074a32c6918b3e5. This checkpoint adds camera maths/state and tests only. It does not expose a renderer, rotation buttons, orbital meshes, fallback runtime or new screen. Do not advertise spatial rendering as finished. Visual MO/ladder integration is a later bounded batch.

## Five files

src/ui/camera.mjs supplies pure presentation-only camera state, bounded yaw/pitch/zoom actions, an orthonormal right-handed view frame, camera position and orthographic point projection. src/ui/state.mjs stores the camera in shared state and routes camera actions without changing any learner answer, explanation request, notice, axis preference or scientific verdict. tests/camera.mjs covers the pure module and, by default, the real shared reducer plus actual H2O grading invariance. package.json wires that full suite permanently into test/test:ui/test:camera. This document records the scope and remaining work.

## Camera contract

Angles are radians. Course view is yaw 0, pitch 0, zoom 1. It looks from negative y toward the origin, with positive x screen-right and positive z screen-up; positive y points away from the viewer. right cross up equals the direction toward the eye. The molecular geometry, axes and H-site identities never rotate or relabel; only the camera frame changes.

The existing 2D drawing's historical 'y out of page' label must not be copied as a signed-axis claim for this spatial course view. Spatial integration must draw the signed projected axes consistently and explain the chosen viewing side; it must not alter case coordinates to imitate that label. No visible 2D drawing is changed by this batch.

Yaw wraps to [-pi,pi); pitch stops 0.05 radians short of either pole; zoom is clamped to 0.5–3. Valid finite out-of-range requests are bounded deliberately. Malformed, unknown, non-finite, non-positive zoom and overflowed actions leave valid camera state unchanged. Camera-set accepts only own finite data properties yaw/pitch/zoom, not accessors or extra keys. Invalid stored camera state throws rather than being silently repaired.

Camera reset affects camera settings only. Navigation and learner edits preserve the camera. Explicit full Restart returns it to course view. No camera action supplies coefficients, completes occupancy maps, resets assessment work or rewrites scientific feedback. Projection utilities are presentation geometry, not calculated wavefunctions, energies or optimized distances.

## Verification

Run npm run test:camera (or npm test/test:ui) in the complete repository. Default execution includes production shared-state/H2O integration tests. node tests/camera.mjs --pure is an explicit limited local mode requiring only camera.mjs; it reports integrationExecuted=false and must not substitute for the full CI suite. No CI/package command uses --pure.

Fresh candidate-head CI is required after committing. Local pure tests and syntax checks do not prove browser behavior or full integration. Browser/touch/assistive-technology checks remain pending. No source PDF or copyrighted teaching artwork is published.

## Subsequent batches, not implemented here

Add the shared-camera spatial renderer and upright labels; accessible rotation/reset controls; schematic basis-function objects with consistent signs/hatching; a usable 2D/text fallback for loading/WebGL/context loss; event/render-lifecycle integration; actual browser regression coverage and truthful status documentation. Stop after these five files until this checkpoint is pushed with exact approval. No PR, merge, deployment or release is authorized by preparing this batch.
