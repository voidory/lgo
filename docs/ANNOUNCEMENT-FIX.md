# Persistent status announcement fix

Baseline controller: src/ui/app.mjs on voidory/lgo main, blob 71558ce7da4d2fa02e44f52381b99920febcc496.

Adds one persistent polite, atomic status region after #app, outside the subtree replaced during screen rendering. The visible Step 3 status remains in place in the lesson but its transient live attributes are removed from a detached template before insertion. No duplicate live region is attached. Phase assignment, phase flip and reset update the persistent text after focus management. Axes/guides rerenders do not rewrite it; repeated identical messages are not rewritten. Navigation clears stale text without removing the persistent element.

Executed: 44 Chromium browser assertions across 380px and 1280px, using the patched controller and announcer with representative state/view fixtures. Tests checked original node identity/connection, single status region, text updates, no duplicate announcements on toggles, navigation clearing, keyboard focus and settings retention. Node syntax checks passed for both changed modules. This is a targeted controller regression, not a full original-UI rerun. Actual screen-reader speech, Firefox/WebKit, engine suites and Pages were not tested.

To run against a complete checkout: serve it over HTTP, install Python Playwright/Chromium if needed, then run `python3 tests/browser-announcements.py http://localhost:8000/`. The test script takes a URL; it does not install dependencies, launch a web server or modify the repository.

No engine, case data, course content, CSS or view module is changed. The pre-existing renderer still replaces other screen nodes; this patch addresses live-region persistence and avoids duplicate live semantics. No general screen-reader compatibility guarantee is made.
