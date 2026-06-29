# Signing canonical compatibility & npm publishing

## Signing must match the chain's canonical exactly

A `Signed<DataUpdate>` is verified on-chain over `JCS(dropNulls(payload))`. The SDK MUST produce
the identical canonical or the chain rejects every update with `InvalidSignature` (surfaces as an
opaque HTTP 400, often empty-body).

Two rules the SDK has to honor (mirrors `ottochain/docs/signing-canonical-and-validation.md`):

1. **Drop null object fields before signing**, recursively, preserving array elements — this is
   metakit's `JsonBinaryCodec.dropNulls` (drop-nulls-before-RFC8785). The vendored helper is
   `e2e-test/lib/dropNulls.ts`; the published SDK should export an equivalent and `batchSign`
   should apply it. (Until exported, the e2e inlines it — task: standardize drop-nulls.)

2. **Send every field the chain marks REQUIRED; omit optional ones.** `dropNulls` removes `null`,
   NOT `false`/`0`/`{}`/`[]`. The chain's decoder re-fills omitted *defaulted* fields, so if the
   SDK omits a required field the chain treats as present (e.g. `FieldShape.repeated`/`optional`,
   `PublishVersion.strict`), the canonicals diverge → `InvalidSignature`. The SDK's TS types should
   therefore make those **required** (`repeated: boolean`, not `repeated?: boolean`) so clients
   can't silently omit them. Genuinely-optional fields (e.g. `metadata`) are `Option` on the chain
   and may be omitted.

When the chain schema changes, update the SDK types in lockstep and re-check that a minimally-built
payload still round-trips (the chain side guards this with `PublishVersionSigningCanonicalSuite`).

## Subpath exports

The package exports `.`, `./core` (ottochain message types), `./metakit`, `./apps/*`. The e2e
harness imports message types from `@ottochain/sdk/core`. Keep the `exports` map in `package.json`
in sync when adding modules.

## npm publishing (OIDC trusted publishing)

Publishing via OIDC trusted publishing requires:
- **npm CLI ≥ 11.5.1** (does the registry token exchange). **pnpm does NOT** do the exchange →
  `ENEEDAUTH`. Use `npm install -g npm@latest` then `npm publish --access public --provenance`.
- Do **not** let `actions/setup-node` inject a `registry-url` — it writes a placeholder
  `_authToken` into `.npmrc` that **suppresses OIDC** (the 404 / auth failures chased on 2.3.0).
  Drop `registry-url` from `setup-node`. See `.github/workflows/release.yml`.
