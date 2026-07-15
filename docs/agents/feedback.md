# Feedback log

Append-only. One entry per real lesson learned working this repo — a gate that arrived too
late, a footgun that cost a cycle, a wrong assumption an agent made and had to walk back. Not a
changelog (that's `CHANGELOG.md`) and not a TODO list (that's GitHub issues / `bin/tasks`).

Entry format:

```markdown
## YYYY-MM-DD — short title

**What happened:** ...
**Why it mattered:** ...
**Fix / mitigation:** ...
```

---

## 2026-06 — the prettier format-gate big-bang

**What happened:** PR #238 added a `format` CI job (`pnpm run format:check`) to a repo that
already had a `format` script and a `.prettierrc.json` but no enforcement — style had already
drifted across the codebase (roughly 288 single-quote vs 169 double-quote strings by the time the
gate was proposed). Turning the gate on required reformatting ~120 `.ts` files, about 70% of that
PR's diff, before it could pass its own gate.

**Why it mattered:** the gate went from "the right thing to add" to "a 120-file mechanical diff
that has to land in one shot before the gate can be enabled," which is exactly the kind of PR
that's slow to review and risky to land (large diffs hide small regressions). It also meant the
gate sat live-but-blocked: once `format` was appended to `main`'s required checks, the PR that
*defines* formatting was itself gated behind manual code-owner review it couldn't self-satisfy.

**Fix / mitigation:** none needed retroactively — the reformat landed and the gate is live. The
general lesson for future gates: **add the enforcing CI job in the SAME PR (or immediately
after) the formatter/linter config is introduced**, before style has had time to drift. A gate
proposed months after the tool it enforces is a much bigger, much riskier PR than one proposed
at introduction time. If you're adding a new lint/format rule to this repo, budget for "does
existing code already violate this" before writing the CI job, not after.
