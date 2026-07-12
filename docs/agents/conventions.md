# Conventions

Rule of thumb: **if a linter/formatter can enforce it, it's not documented here** — ESLint
(`eslint.config.mjs`) and Prettier (`.prettierrc.json`) own those. This doc is for the
conventions that are only enforceable by a human or an agent reading the diff.

## Package manager: pnpm, always

`packageManager: "pnpm@10.30.0"` in `package.json`; `pnpm-lock.yaml` is tracked (despite a
stale `.gitignore` comment claiming "this repo uses npm" — ignore that comment, it's dead).
CI runs `pnpm install --frozen-lockfile` in every job. Always use `pnpm`, not `npm`/`yarn`, for
installs and running scripts (`pnpm run <script>` or `pnpm <script>` for the well-known ones).

**Known inconsistency, don't "fix" it casually:** the `build` script's body internally shells
out with `npm run prebuild && npm run build:cjs && ...` (`package.json`). This works fine under
pnpm (npm just re-invokes the local script), but it's a naming leftover from before the pnpm
migration. Leave it — a drive-by "consistency fix" here is exactly the kind of unreviewed churn
that risks breaking the build script's internal chaining for no behavior change. If you touch
`build`'s script body for an unrelated reason, feel free to fix it in the same PR; don't open a
dedicated PR just for this.

## Build & exports

Dual CJS+ESM+types build (`tsconfig.cjs.json` / `tsconfig.esm.json` / `tsconfig.types.json`),
finished by `build:fixup` writing `dist/{cjs,esm}/package.json` type markers. Subpath exports in
`package.json`: `.`, `./core` (wire types), `./metakit`, `./zk`, `./templates`, `./apps/*`,
`./apps`, `./generated` (proto types). Adding a new public entry point means adding BOTH the
`exports` map entry and the matching tsconfig `include` — check both when a "cannot find module"
report comes from a consumer, not just from `src/index.ts`.

## Wire types cite the chain source

Hand-written wire types and client methods should JSDoc-cite the exact chain Scala file they
mirror, the way `src/ottochain/metagraph-client.ts` cites `ML0Routes.scala` and
`webhook-notifications.ts` cites `Subscriber.scala`. When the chain file moves or the route
changes, the stale citation is a trivial grep-and-fix; an absent citation means nobody knows
what to check.

## Error hierarchy

`src/errors.ts`: `OttoChainError` base class + `NetworkError` / `ValidationError` /
`SigningError` / `TransactionError` subclasses, an `ErrorCode` enum, `isErrorCode()` type guard,
`wrapError()` helper. New failure modes get a new `ErrorCode` member and reuse the closest
existing subclass rather than inventing a new one — tests should assert on `error.code`, not on
`error.message` text (see `ai-smells-test-integrity.md` item 5).

## Jest idioms

- Tests live under `tests/`, matched by `**/*.test.ts`, run via `ts-jest`.
- `retryTimes: 2` globally (`jest.config.js`). A test that NEEDS retries goes in `TESTING.md`'s
  known-flaky table with a reason — don't add per-file `jest.retryTimes()` silently.
- Coverage floor is 50% (branches/functions/lines/statements) — a floor, not a target.
- `@jest/globals` explicit imports (`import { describe, it, expect } from '@jest/globals'`), not
  ambient globals.
- Byte-sensitive fixtures (`tests/fixtures/**`, `tests/zk/fixtures/**`, app `json-archive/`) are
  compared/hashed verbatim — never run a formatter over them, never regenerate them from the
  same code path the test exercises.

## Naming

- App state machines: `<app>-<variant>` (e.g. `identity-agent`, `contract-escrow`,
  `market-prediction`) — the file name IS the on-wire `metadata.type`-adjacent identifier for
  most apps, so renames are effectively breaking.
- Inlined definition vars: `<name>Def` (built by `scripts/inline-json.mjs` from
  `<app>/state-machines/*.json`), e.g. `identityUniversalDef`. Special-case remap: any file
  starting `governance-` becomes `gov...Def`, not `governance...Def` — this is a hardcoded
  string replace in `inline-json.mjs`, not a general convention; don't assume other prefixes
  get abbreviated the same way.
- Per-app collections: `*_DEFINITIONS` maps and `getXxxDefinition()` accessors — see
  `docs/SDK-STRUCTURE.md` / `BREAKING_CHANGES.md` for the accessor API shape.

## Ports — README is known-stale, verify against the client

`README.md`'s quick-start examples show `DataL1Client('http://localhost:9300')` and
`CurrencyL1Client('http://localhost:9200')`. **This doesn't match** the actively-maintained
`src/ottochain/metagraph-client.ts`, whose own JSDoc is authoritative: ML0 `9200`, DL1 `9400`.
Before writing a new script, example, or doc that hardcodes a port, check
`metagraph-client.ts`'s `MetagraphClientConfig` JSDoc, not the README. Fixing the README's
examples is a good, low-risk T0–1 task — just confirm the correct ports against the client code
first, not against another stale doc.

## Commits

Conventional commits, `commitlint.config.js`'s `type-enum`: feat/fix/docs/style/refactor/perf/
test/build/ci/chore/revert. `subject-case` is disabled in THIS repo's commitlint config — but
match the chain repo's stricter lowercase-first-word style anyway for consistency across the
ottochain org. Header **≤72 characters, measured, not eyeballed**:

```sh
s="fix(signing): drop nulls before hashing dataUpdate payloads"
printf '%d %s\n' "${#s}" "$s"
```

Run this before every commit. 73 vs 72 is invisible to the eye and has cost real CI round-trips
across this org's repos more than once — don't skip the measurement because the subject "looks
short enough." `commitlint` runs on every PR (`--from base --to head`); it does NOT run on push
to a local branch — there's no pre-push hook mirror in this repo (unlike the chain repo's
opt-in `.githooks/pre-push`), so `bin/preflight` is the only local guard.

## Publishing

Never local. `release-please.yml` (push→`main`) maintains a release PR; merging it tags `v*`;
`release.yml` (`push tags: v*`) does OIDC trusted publishing to npm. See
`docs/agents/tools.md`/`docs/signing-and-publishing.md` for the OIDC gotchas
(`registry-url` on `setup-node` suppresses OIDC; `pnpm publish` can't do the token exchange,
needs `npm publish` with npm ≥ 11.5.1).
