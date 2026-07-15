<!--
Copy this file to docs/worksheets/YYYY-MM-DD-<slug>.md (or run `bin/worksheet <slug>`).
Keep it updated at every stopping point — see docs/worksheets/README.md.
-->

# <slug> — YYYY-MM-DD

## Goal

What are we trying to accomplish, in one or two sentences. What does "done" look like.

## Context links

- Related issue(s): #
- Related PR(s): #
- Related RFC/proposal doc(s):
- Prior worksheet(s), if this continues earlier work:

## Plan

1. ...
2. ...

Note the tier (per `AGENTS.md`) of the riskiest file this plan touches. If it's T3+, name the
blast-radius file(s) up front and who needs to sign off (`docs/agents/blast-radius.md`).

## State of play (running log — append, don't rewrite)

- YYYY-MM-DD HH:MM — started; did X; found Y.
- YYYY-MM-DD HH:MM — ...

## Blockers

Anything stopping forward progress right now. Empty section is fine — delete or leave "none."

## Handoff notes

If this worksheet is being picked up by a different session/agent: what do they need to know
that isn't obvious from the plan and log above? What's the very next action?

## Outcome

Filled in when the work lands (or is abandoned — say why). Link the merged PR(s).

## Feedback entry

If this work surfaced a real lesson (a gate that arrived late, a wrong assumption, a footgun),
add it to `docs/agents/feedback.md` and link it here. Not every worksheet produces one.

## Pre-commit checklist (per commit in this worksheet's line of work)

- [ ] Subject measured, not eyeballed: `s="..."; printf '%d %s\n' "${#s}" "$s"` — ≤72.
- [ ] Conventional-commit type prefix, lowercase subject.
- [ ] `Worksheet: docs/worksheets/<this file>` trailer included.
- [ ] `bin/preflight` (or `--fast`) run before pushing.
