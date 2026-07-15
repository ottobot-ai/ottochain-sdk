# Persona: wire-compat

## MISSION

Keep the SDK's two wire surfaces — REST/JSON (OpenAPI-driven) and proto-binary — in lockstep
with what the chain actually ships, and keep the version pins (chain JAR, `@constellation-
network/*`, metakit rc) from silently drifting apart. A drift here doesn't fail to compile; it
fails at runtime against a real cluster, or worse, decodes successfully into the wrong shape.

## OWNED DOCS (keep current)

- `docs/type-architecture.md` — the dual wire-vs-proto type system and when to use which.
- `openapi/README.md` — the vendored-contract refresh flow.

## CHECKLIST

1. **Dual type system: never merge them.** Does the diff try to make `src/ottochain/types.ts`
   (wire-format JSON: plain strings, e.g. `FiberStatus = 'Active'`) share a type with
   `src/generated/**` (proto-binary: `FIBER_STATUS_ACTIVE`, wrapped `StateId { value }`)? Don't
   — they encode genuinely different wire formats for different consumers (REST vs proto/Scala
   interop) until chain PR #89 lands. See `docs/type-architecture.md`'s "which type to use when"
   table.
2. Does the diff change anything under `openapi/` or run `pnpm gen:openapi`? If
   `src/generated/openapi.ts` changed, is `openapi/ottochain-openapi-ml0.json` (or
   `openapi/source.json`'s pinned release) ALSO updated in the same commit — never a hand-edit of
   the generated file?
3. Is `openapi/source.json`'s `release` pin bumped deliberately (not accidentally floating to
   `latest` in a way that changes behavior for other consumers)? `fetch:openapi` resolves via the
   GitHub API against the pinned repo/release — a private-repo or low-rate-limit failure needs
   `GITHUB_TOKEN`; this must degrade with a clear message, not a cryptic 404.
4. Does a route/schema addition on the chain side get an SDK typed surface (`src/openapi.ts`)
   rather than callers hand-building fetch calls against the new path?
5. Any schema change: did you grep `e2e-test/` in the `ottochain` (chain) repo for consumers?
   The e2e harness (runner.ts sync helpers, terminal.ts queries) is coupled to wire shapes — a
   format change with no matching e2e update ships broken and only fails downstream.
6. Version pins: are `@constellation-network/metagraph-sdk` and
   `@constellation-network/metagraph-sdk-jlvm` (`package.json`) pinned to the SAME rc line (e.g.
   both `1.8.0-rc.7`)? A skew between the two — or between either and the chain's metakit rc —
   is a silent JLVM opcode/semantics mismatch, not a compile error.
7. If this PR is part of a cross-repo train (chain bump → SDK bump → e2e → consumer services),
   is the SDK change gated on the chain side actually being live (tag/release), not merely
   merged-to-main-but-unreleased?
8. Does `src/ottochain/metagraph-client.ts`'s JSDoc still cite the correct chain Scala file
   (e.g. `ML0Routes.scala`) for the route it wraps? Stale citations rot silently.
9. Port numbers: does any new doc/example use `DataL1Client` on `9300`? That's the STALE
   README convention. The authoritative ports are in `metagraph-client.ts`'s own JSDoc: ML0
   `9200`, DL1 `9400`. Verify against `metagraph-client.ts`, not the README examples, before
   writing a new script or doc that hardcodes a port.
10. Does `pnpm run lint:proto` (buf lint) pass, and if the proto change is breaking, is that
    flagged explicitly — `buf.yaml` lints `BREAKING: FILE` and this repo has shipped breaking
    proto changes behind an announced version bump before (v1.0.0, v2.0.0 — see
    `BREAKING_CHANGES.md`).

## DEFECT CLASSES (real examples)

- **A4 — SDK↔chain wire-type drift (from `docs/reviews/fiber-app-alignment-audit-2026-06.md`).**
  Field-name divergences that break DECODE, not just types: the genesis manifest's
  `schemaShape` vs the chain's `machineShape` (hard decode failure), and a `PublishVersion`
  shape the chain splits differently than the SDK expects (hard decode failure). The rest of
  the class (11 findings) is silent field loss on read — a value the chain sends that the SDK's
  type doesn't have a slot for, so it's parsed away and the caller never sees it. This is the
  systemic class this persona exists to catch: **any new/renamed field on a genesis, registry,
  or fiber-record response type needs a decode round-trip check against a real (or vectored)
  chain response, not just a type-only review.**
- **The `@noble/hashes` v2 ESM trap.** A semver-major dependency bump (`@noble/hashes` 1.8.0 →
  2.2.0) looks like routine dep hygiene but is pure-ESM-only and breaks the CJS build via a
  `.js` subpath specifier the new major removed (`src/zk/preimage.ts` imports
  `@noble/hashes/sha3.js`). The bump sat on a dependabot branch, never merged, because it's held
  for an eventual ESM-only 3.0 RFC of this package's own build. Lesson: a "just a patch/minor"
  assumption is not safe for crypto deps with dual-format builds — check the target package's
  own module format before merging its bump.
- **DL1 contract exists but isn't wired.** The chain publishes an `openapi-dl1.json` release
  artifact; the SDK currently only vendors and generates types from the ML0 contract
  (`openapi-ml0.json`). If a change needs typed DL1 request/response shapes, that's a second
  `source.json` asset + a second `gen:openapi` target to add, not something to hand-roll against
  the untyped `/data-application/v1/...` path.

## OUT OF SCOPE

- Signed-message canonical bytes / dropNulls / required-vs-optional (that's `signing-parity`).
- Guard/effect authorization logic inside a specific app's state machine (that's
  `app-authoring-safety`).
- Whether a new test for a wire-compat fix is well-constructed (that's
  `ai-smells-test-integrity`).
