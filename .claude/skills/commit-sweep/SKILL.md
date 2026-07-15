---
name: commit-sweep
description: Walk a range of ottochain-sdk commits through one review-persona lens and file findings as GitHub issues + a worksheet. Use for retrospective audits of recent history, not for reviewing a single in-flight diff.
---

# commit-sweep (ottochain-sdk)

Retrospective sweep: given a starting point, walk the commits since then through ONE persona's
checklist, and produce a paper trail of findings — never a silent inline fix.

## Input

A since-ref (a commit SHA, a tag, or a relative ref like `origin/main~50`) and a persona name
from `docs/agents/review-personas/` (`signing-parity`, `wire-compat`, `app-authoring-safety`,
`ai-smells-test-integrity`).

## Sequence

1. **Open a worksheet.** `bin/worksheet commit-sweep-<persona>-<date>`. Record the since-ref and
   persona in Context links.
2. **Enumerate the range.** `git log --oneline <since-ref>..origin/main`. Note the total commit
   count in the worksheet — a sweep over 200 commits needs a sampling strategy (see below), a
   sweep over 15 doesn't.
3. **Read the persona file fully first.** `docs/agents/review-personas/<persona>.md` — MISSION,
   CHECKLIST, DEFECT CLASSES. Hold ONLY this lens; don't opportunistically flag unrelated issues
   (that's what a different sweep, with a different persona, is for).
4. **Walk each commit's diff** (`git show <sha>`) against the persona's checklist. For a large
   range, sample: every commit that touches a blast-radius file (`docs/agents/blast-radius.md`)
   or a file the persona OWNS/reviews, plus a random subset of the rest — record the sampling
   rule used in the worksheet so it's reproducible.
5. **For each finding:** file a `gh issue create` with the persona name as a label prefix in the
   title (e.g. `[signing-parity] ...`), citing the commit SHA, file, line, and which checklist
   item it violates. Link the issue from the worksheet.
6. **NEVER fix inline during a sweep.** A sweep's job is to produce a findings list, not a diff.
   Even an "obviously trivial" one-line fix goes into its own separate PR (and its own
   worksheet) — mixing "found a problem" and "fixed a problem" into one artifact makes both
   harder to review and hides how many findings a sweep actually produced.
7. **Summarize in the worksheet's Outcome:** total commits examined, findings filed (with issue
   links), any patterns worth promoting into the persona's DEFECT CLASSES section (open a small
   PR against the persona doc itself if a genuinely new class emerged — that IS an inline change,
   to the doc, not to product code, and is fine).

## Notes

- A sweep is complementary to `bin/agent-review <persona> [range]` (per-diff review at PR time,
  once that script exists here) — commit-sweep is for auditing HISTORY that already merged,
  not gating a PR that's still open.
- If a sweep's sampling misses a real issue, that's expected and fine — the goal is a
  reasonable pass, not exhaustive verification. Note the sampling rule so gaps are legible.
