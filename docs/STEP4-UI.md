# H2O Guided Step 4: out-of-phase LGO

Baseline: voidory/lgo main after bb6667a7053ecaba6bbb85ad1fabdc0550784c67. This is an overlay for the existing repository, not a full repository backup. Extract at the root, preserve all files not included, then serve over HTTP. No manual footer patch is needed.

## Added
Step 4 is part of the same app. Start at a canonical (+,+) reference, independently of the Step 3 global phase view. Keep H_a fixed; assign H_b negative to form (+,-). Optional global reversal shows (-,+), with minus signs/hatching and the corresponding proportional formula. Oxygen remains set aside. No isolated ligand filling or MO antibonding claim is made.

Sum and difference have separate in-memory state: navigation and reset of one do not overwrite the other. Axes/guides persist. The committed persistent-announcement helper is unchanged; the controller now announces the opposite-phase action and moves focus to its enabled next control. Step 3 has Next, Step 4 has Back but no unsupported Next to Step 5.

Course reference patterns and the two-orbital count are explained, not graded. There is no stored 'valid set' badge. Step 5 still needs actual existing-engine complete-set validation. The view remains a 2D constituent-function schematic, not 3D orbitals or calculated isosurfaces.

## Executed checks
- 312 Node state/render assertions over 48 generated screens.
- Unique IDs and ARIA references checked for all 48 generated screens.
- 62 actual Chromium browser checks at 380x900 and 1280x900, with screenshots.
- Syntax checks for the six UI/test JavaScript modules and Python browser test.

The UI/controller and unchanged CSS/announcer were assembled from the retrieved, hash-verified baseline modules plus this patch. A minimal H2O coordinate fixture supplied geometry in the sandbox; this was not a full checkout. The committed Node test imports actual specs.js when run from the complete repository.

Browser checks covered Step 3 regression, keyboard entry into Step 4, opposite-phase assignment, signs/hatching, formulas, whole-orbital reversal, independent Back/Next retention, reset isolation, persistent live node, one live status, focus, view preferences, responsive placement, overflow and enlarged root-text reflow. No current engine test pass count is claimed.

## Run in the full repository
`npm test`
`node tests/ui-preview.mjs`
`python3 -m http.server 8000`
With Python Playwright/Chromium installed: `python3 tests/browser-step4.py http://localhost:8000/ --screenshots review-output`

## Still unverified
Full engine suites, actual screen-reader speech, Firefox/WebKit, real touch hardware, deployed Pages and native browser zoom. The browser check enlarged root text rather than native page zoom. No source was pushed and Pages settings were not changed in this build.

Proposed commit: `Stage 3: add H2O out-of-phase guided step with independent state`.
