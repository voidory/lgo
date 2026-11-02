# Post-H2O repository cleanup

Baseline main: 8f7df009742061c08b6c5d90dcb4a0edd1b3f812, after merged PR #4. Cleanup work is isolated on chore/post-h2o-cleanup and still requires fresh CI, review and separate merge approval.

## Consolidated CI target

Retain .github/workflows/h2o-workflow.yml as the complete verification path, named LGO installed-source and H2O verification. Run on all branch pushes, PRs into main and manual dispatch. The branch pattern deliberately includes main and future working branches; it does not add tag-push triggers.

The installed-source full runner and dedicated late H2O browser suite are preserved unchanged, as are pinned actions/dependencies, exact-candidate checkout, read-only contents permission, unpersisted checkout credentials, tracked-source checks and 14-day artifact retention. Push and PR events may each verify a candidate; that is separate from the redundant second workflow removed by this cleanup.

Remove .github/workflows/batch-a.yml only after the retained workflow update is installed. Its full runner is already included in the retained workflow. File removal is a separate approved action; if both workflow files are still present, this staging cleanup is not yet complete. Historical documents naming batch-a.yml remain historical records, not the current CI inventory. scripts/verify_batch_a.py remains the active runner despite its historical filename.

## Preserved material

Keep source, tests, course data, historical checkpoint documents, the hash-guarded recovery script, independent SciPy verification scripts and existing CI evidence. No scientific acceptance criteria, application behavior, package version, release/tag or Pages settings are changed. No supplied copyrighted course material is added.

## Old branch references

At the audit, all three former working-branch tips were reachable from baseline main: guided/h2o-complete-workflow at c4c84b5dec80598133ade6c2d7601335d148c103, guided/h2o-complete-set at 6e3df82ae65e07303fbaec873d711f4810ed76e0, and hardening/verification-candidate at 3621a75d3d4ba92e3eaf3a8ed96f99d2eaaae95a. No PR was open at that audit. These are branch-reference cleanup candidates, not unique unmerged work.

The available connector does not expose branch deletion. This file/configuration cleanup does not claim to delete those branch references, Actions runs, artifacts or releases. Recheck branch tips before any later branch deletion.
