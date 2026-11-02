# Stage 3: Step 1 static UI

The repository root index.html is a self-contained static preview. CSS and the presentation-only axes toggle are inline; there are no dependencies, build step or external assets. This consolidates the preceding layout slice; it is not a byte-for-byte copy of the expired sandbox archive. Existing engine, course data, tests and package scripts are unchanged.

## Local preview
From the repository root run `python3 -m http.server 8000` and open http://localhost:8000/.

## GitHub Pages
Committing this file does not enable Pages. An administrator can select Settings > Pages > Deploy from a branch > main > /(root) > Save. After a successful deployment, use the site URL reported by GitHub. This entry page uses a relative home link and is suitable for a project subdirectory. No course PDFs or screenshots are included.

## Scope
Notebook styling; mobile single-column and desktop two-column layout; static H2O SVG skeleton in the repository xz convention; six-function valence inventory; Do/Course/Why/Model explanations; keyboard-accessible native controls, focus styles, skip link, SVG text description and reduced-motion rule. Element colours are not orbital phases.

Not implemented: orbital meshes, rotation/reset, mathematical grading, state persistence, later steps or MO ladder. No nonfunctional Next/Back controls are shown. This is not Stage 3 completion. Geometry source: src/cases/specs.js at d22631fdc2b2a1c9ecabc03f54235ac42e054d1a.

## Verification still required
This consolidated version has not been executed in a browser or run through the engine tests. Historical test results must not be treated as new results.

- Run npm test from the complete repository.
- Check 380px and 1280px layouts for overflow and label legibility.
- Tab through the skip link, home link, checkbox and disclosure summaries; verify keyboard activation and focus visibility.
- Toggle axes: only guides disappear; bonds and atom positions stay fixed.
- Check screen-reader SVG and disclosure announcements.
- Check reduced motion, 200% text zoom, Safari, Firefox and Chromium.
