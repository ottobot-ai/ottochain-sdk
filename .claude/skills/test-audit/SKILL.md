---
name: test-audit
description: Sample and audit ottochain-sdk's jest test suites for AI-authored-test smells — verify each sampled test actually fails when its subject is broken. Use when asked to check test-suite quality/integrity, not for writing new tests.
---

# test-audit (ottochain-sdk)

Samples existing `tests/**/*.test.ts` suites and checks whether they actually test what they
claim to, using the `ai-smells-test-integrity` persona's checklist as the rubric. The core
technique is empirical, not just reading: mutate the code under test, confirm the test goes red,
revert.

## Sequence

1. **Open a worksheet.** `bin/worksheet test-audit-<date>`.
2. **Sample.** Pick a mix: a few files from each of the golden signing-canonical suites (highest
   stakes — `bin/test signing`'s shortlist), a few from `src/apps/**` state-machine test files,
   a few at random from elsewhere. Record which files were sampled and why.
3. **Read each sampled test against the checklist** in
   `docs/agents/review-personas/ai-smells-test-integrity.md`: retry masking, self-regenerated
   fixtures, coverage-as-target thinking, message-string assertions instead of `ErrorCode`, dead
   helpers, hallucinated APIs.
4. **The mutation check (the highest-value step — do this for every sampled test, not just
   ones that look suspicious):**
   - Identify the specific line(s) of source the test claims to verify.
   - Make a small, obviously-wrong local change there (invert a condition, hardcode a return,
     delete a guard clause) — NOT a full revert of a feature, just enough to break the one
     behavior this test is supposed to catch.
   - Run the test file: `bin/test <path-to-test-file>` (or the relevant pattern).
   - **Expected: it fails.** If it still passes, that's a finding — the test isn't testing what
     its name/description claims.
   - `git checkout -- <file>` to revert the mutation before moving to the next test. Never leave
     a mutation in the tree.
5. **File findings as GitHub issues**, one per test-file-level problem, citing the mutation used
   and the (unexpected) pass. Don't fix inline in this skill — same rule as `commit-sweep`: audit
   produces findings, a separate PR does the fix.
6. **Summarize in the worksheet:** files sampled, mutation-check pass/fail count, findings filed.

## Mutation testing backbone — not built yet, note it

This repo has no automated mutation-testing tool wired in (the chain repo has a stryker4s
spike for Scala; the JS/TS equivalent would be Stryker Mutator, or the plain `jest --coverage`
report combined with `istanbul-lib-mutate`-style tooling). Manual mutation-per-sample (step 4)
is the interim substitute — if this skill runs repeatedly and keeps finding the same class of
gap, that's the signal to actually stand up Stryker Mutator as a CI job rather than continuing
to do it by hand. Note that recommendation in the worksheet if it comes up; don't act on it
unilaterally (it's a CI-config change, T2 at minimum).

## Reminder

Coverage percentage is not a proxy for this audit's finding. A file at 90% coverage can still
fail every mutation check if its assertions are weak (e.g. asserting `.not.toThrow()` instead of
checking the actual output shape). Don't let a high coverage number talk you out of sampling a
file.
