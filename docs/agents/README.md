# docs/agents/ — how agent-infra works in this repo

Same scheme as `ottochain` (the chain repo): personas own docs and run checklists against
diffs, worksheets are the running-log habit, `feedback.md` is the append-only lessons file, and
`bin/` externalizes the exact commands so a cheap model never has to reconstruct them from
`package.json`.

## Personas (`review-personas/`)

Four self-contained files. Each is written so a cheap model that gets **only the persona file
plus a diff** can do a useful review — no other context assumed.

| Persona | Owns | Reviews |
|---|---|---|
| `signing-parity.md` | `docs/signing-and-publishing.md` | Anything touching signed-message shape: `src/signing.ts`, `drop-nulls.ts`, `verify.ts`, `schema/fiber-app.ts`, `ottochain/types.ts`. |
| `wire-compat.md` | `docs/type-architecture.md`, `openapi/README.md` | OpenAPI regen, proto regen, version pins, `metagraph-client.ts`. |
| `app-authoring-safety.md` | `docs/reviews/fiber-app-alignment-audit-2026-06.md` | New/changed app state machines under `src/apps/**` — guards, effects, dependencies. |
| `ai-smells-test-integrity.md` | `docs/agents/conventions.md` | Any new or changed test file. |

Each file has the same shape: MISSION, OWNED DOCS, a 10–20 item yes/no CHECKLIST with file
references, DEFECT CLASSES with real examples pulled from this repo's history, and OUT OF SCOPE.

Run a persona against a diff by hand (read the persona file, read the diff, walk the checklist)
or via `bin/agent-review <persona> [range]` once that script exists in this repo (see
`docs/agents/tools.md` — not all ottochain `bin/` scripts have an sdk twin yet).

## Blast radius (`blast-radius.md`)

The T3 file list: consensus-adjacent files where a mistake produces a silent, hard-to-diagnose
wire break rather than a compile error. Cheap models propose a diff against these files and
stop; a senior model or a human decides. See `AGENTS.md`'s tier model for the full T0–T3+ split.

## Worksheets (`docs/worksheets/`)

One file per unit of work: goal, context links, plan, running state-of-play, blockers, handoff,
outcome. Commits reference the worksheet with a `Worksheet: docs/worksheets/<file>` trailer.
Milestone tags use the `ws/<slug>` namespace — confirmed safe, `release.yml` only fires on `v*`
tags. See `docs/worksheets/README.md` + `TEMPLATE.md`.

## Feedback (`feedback.md`)

Append-only. One entry per real lesson learned while working this repo (a gate that arrived
too late, a footgun, a wrong assumption) — not a changelog, not a TODO list.

## `bin/`

Every command an agent needs to preflight, test, watch a PR, find work, or sync the OpenAPI
contract, as an executable script with `--help`. See `docs/agents/tools.md` for the full table.
