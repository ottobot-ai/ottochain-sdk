# Worksheets

A worksheet is a running log for one unit of work — a bug fix, a feature, a multi-session
migration. It's the thing that survives when a session dies and the next session (or a different
agent entirely) needs to pick the work back up without re-deriving context from scratch.

## When to open one

Before starting any work that will span more than a trivial single commit, or any T2/T3+ change
per `AGENTS.md`'s tier model. Trivial doc typos and one-line fixes don't need one.

```sh
bin/worksheet <slug>
```

Creates `docs/worksheets/YYYY-MM-DD-<slug>.md` from `TEMPLATE.md` with today's date filled in.

## Conventions

- **File naming:** `YYYY-MM-DD-<slug>.md`, date is the day the worksheet was OPENED (not last
  edited).
- **Commit trailer:** every commit that's part of the tracked work gets a trailer line
  `Worksheet: docs/worksheets/<file>` so `git log --grep` can reconstruct the full set of commits
  for a unit of work even across multiple PRs.
- **Milestone tags:** `ws/<slug>` (e.g. `ws/openapi-dl1-wiring`) for marking a worksheet's
  significant checkpoints. Confirmed safe: `release.yml` (npm publish via OIDC) only fires on
  `v*` tags, and `release-please.yml` only runs on push to `main` — a `ws/*` tag triggers neither.
- **Update it at stopping points.** Per this repo's `CLAUDE.md`: update the worksheet whenever
  you reach a stopping point or complete a task, not just at the very end. A worksheet that's
  only filled in retroactively at PR-close time isn't doing its job for a session that gets
  interrupted.
- **Committed, not gitignored.** Worksheets live in git (unlike private `.workspace/` scratch —
  if this repo grows a `.workspace/` convention, that's for throwaway session notes; anything
  worth another agent reading later goes in `docs/worksheets/`).

## Template

See `TEMPLATE.md` for the section structure (goal, context links, plan, state-of-play, blockers,
handoff notes, outcome, feedback entry).
