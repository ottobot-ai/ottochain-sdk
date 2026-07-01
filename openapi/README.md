# Vendored OpenAPI contracts

The SDK's typed HTTP surface (`src/openapi.ts` → `src/generated/openapi.ts`) is generated from
ottochain's tapir-derived OpenAPI contract. To keep the SDK and the chain on **one** source of
truth, we vendor the contract that ottochain **publishes as a release artifact** (tied to the
metagraph jars) rather than hand-copying it out of the ottochain repo.

## Files

- `ottochain-openapi-ml0.json` — the **ML0** (Metagraph L0) contract; `gen:openapi` generates the
  TS types from this file. This is the layer the SDK queries.
- `source.json` — provenance + pin: which `repo`, which `release` (a tag like `v0.7.17`, or
  `latest`), and which release `assets` map to which local files.

ottochain also publishes a **DL1** contract (`openapi-dl1.json`); it serves the same
`/data-application/v1/...` paths on a different port, so it is a *separate* document. Add it to
`source.json` and wire a second `gen:openapi` target if/when the SDK needs DL1 types.

## Refreshing the contract

```sh
pnpm fetch:openapi   # download the pinned release's spec(s) into openapi/
pnpm gen:openapi     # regenerate src/generated/openapi.ts
git add openapi src/generated/openapi.ts && git commit -m "chore: sync OpenAPI contract"
```

`fetch:openapi` reads `source.json`, resolves the release via the GitHub API, and downloads each
asset. A private ottochain repo (or a low API rate limit) needs `GITHUB_TOKEN` in the environment.

The **committed** `ottochain-openapi-ml0.json` is the reproducible build input — CI regenerates the
TS from it offline and fails if `src/generated/openapi.ts` drifted. Pulling a newer contract is a
deliberate `fetch:openapi` step (bump `source.json`'s `release`, re-fetch, regenerate, commit).

> Seeded from ottochain PR #198 (the change that first publishes these per-layer artifacts).
> Once an ottochain release ships them, `pnpm fetch:openapi` pulls the identical, tagged file.
