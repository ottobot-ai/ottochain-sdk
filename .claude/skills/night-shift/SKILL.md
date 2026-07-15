---
name: night-shift
description: Unattended work session for ottochain-sdk — pick a task, worksheet it, branch, implement, preflight, PR, watch to green, log feedback. Use for autonomous/overnight/unsupervised work sessions in this repo.
---

# night-shift (ottochain-sdk)

An unattended session picks ONE task, does it completely (including watching CI to green),
and stops cleanly. It does not chain into a second task without checking budget, and it never
merges or publishes.

## Sequence

1. **Pick a task.** `bin/tasks cheap-model-ok` by default. Only pick from `bin/tasks
   agent-ready` (a broader set) if you were explicitly told this session may do T2 work — see
   `AGENTS.md`'s tier model. Never pick a task whose obvious solution touches a file in
   `docs/agents/blast-radius.md` unless explicitly authorized for this session.
2. **Worksheet first, before writing code.** `bin/worksheet <slug>`. Fill in Goal, Context
   links, Plan before touching anything. This is not optional busywork — it's what lets a
   different session pick up cleanly if this one gets interrupted.
3. **Branch off `origin/main`, never off whatever's checked out.**
   ```sh
   git fetch origin
   git checkout -b <type>/<slug> origin/main
   ```
4. **Work in small commits.** Each commit: conventional prefix, lowercase subject, measured
   ≤72 chars (`s="..."; printf '%d %s\n' "${#s}" "$s"` — see `docs/agents/conventions.md`),
   `Worksheet: docs/worksheets/<file>` trailer. Update the worksheet's state-of-play log at
   each meaningful stopping point, not just at the end.
5. **`bin/preflight` before opening a PR.** Fix everything it reports; don't open a red PR.
6. **Open the PR against `main`.** Never merge it. `gh pr create ...` per `docs/agents/tools.md`
   / the `pr-workflow` skill.
7. **`bin/pr-watch <pr#>` to green — mandatory, not optional.** "PR opened" is not "done."
   If checks fail, fix and push a new commit, re-run `bin/pr-watch`. Don't leave the session
   with an unmonitored PR.
8. **Append a `docs/agents/feedback.md` entry** if the session surfaced a real lesson (a gate
   that should exist and doesn't, a footgun, a wrong assumption you had to correct). Not every
   session produces one — don't pad it.
9. **Update the worksheet's Outcome section** and stop.

## Stop conditions — end the session cleanly, don't push through

- **Two consecutive failed fix attempts** on the same CI failure. Write down what you tried and
  what you observed in the worksheet's Blockers section, leave the branch/PR as-is, stop.
- **Any blast-radius judgment call** (see `docs/agents/blast-radius.md`) that wasn't pre-
  authorized for this session. Propose the diff in the worksheet, don't push it.
- **Budget exceeded** (session count / time budget given for this task). Write worksheet state
  + handoff notes, stop — don't rush the last mile to "finish" past budget.

In every stop case: the worksheet must have enough in Handoff Notes that a fresh session (or a
human) can continue without re-reading the whole diff history.

## Never

- Never merge a PR (only `scasplte2` merges).
- Never publish (`npm publish`/`pnpm publish`) — publishing is tag-driven OIDC only
  (`release.yml` on `v*` tags via `release-please.yml`'s release PR).
- Never hand-edit `src/generated/**`.
- Never force-push over another session's in-progress branch without checking `git log` first.
