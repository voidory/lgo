# LGO Lab — H2O functional UI candidate

The root application connects Guided Steps 1–9: retained ligand construction, complete-set checking, oxygen symmetry matching, individual course-model MO outcomes, supported partial ordering, explicit reference-diagram filling and per-bond interpretation. This is an ungraded 2D schematic candidate, not a verified release or completed spatial renderer.

Preview over HTTP with `python3 -m http.server 8000`. Run `npm test`, `npm run test:ui` and, with verification dependencies installed, `python3 scripts/verify_batch_a.py` in a complete Git checkout. Existing navigation regressions are updated with the root wiring. Dedicated late-UI Node/browser tests and their CI wiring are the pending verification follow-up; old green checks do not validate this candidate.

O 2s is symmetry-compatible but neglected for energy mismatch in the course model. O 2py retains B2 AO symmetry despite zero sampled coupling. Full energy ordering remains partly unverified. Filling explicitly uses the supplied course reference without overwriting learner placements; every occupancy including zero requires an answer. Upstream edits clear dependent work with notices. State resets on reload.

No other Guided molecules, 3D camera, calculated MO surfaces, Practice/Blind, saved reports, tag/release or deployment is added. No supplied copyrighted course material is published. Actual screen-reader speech, Firefox/WebKit, native zoom, real touch, course-order provenance and live Pages remain unverified. Merge/deployment require separate approval. docs/H2O-FUNCTIONAL-WORKFLOW.md currently records the preceding model checkpoint; its integration/verification update is pending.
