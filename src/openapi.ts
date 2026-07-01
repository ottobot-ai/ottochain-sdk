/**
 * Typed OttoChain HTTP API surface.
 *
 * These types are generated from the metagraph's ML0 OpenAPI contract
 * (`openapi/ottochain-openapi-ml0.json`, emitted by ottochain's tapir `ApiEndpoints`) — so the SDK and the
 * chain share ONE source of truth for request/response shapes, instead of reverse-engineering them inline.
 * The vendored contract is pulled from ottochain's published RELEASE artifacts (see `openapi/README.md` +
 * `openapi/source.json`); refresh it with `pnpm fetch:openapi`.
 *
 * Regenerate after the contract changes with `pnpm gen:openapi`. The raw generated module is
 * `src/generated/openapi.ts`; this file gives consumers stable, named aliases for the precise response
 * DTOs. Heavy domain bodies (onchain, checkpoint, records, state proofs) are typed `unknown`/opaque in
 * the contract for now — see ottochain `docs/proposals/typed-network-interface.md` §3.
 */
import type { components, operations, paths } from './generated/openapi.js';

export type { components, operations, paths };

type Schemas = components['schemas'];

export type VersionInfo = Schemas['VersionInfo'];
export type TransitionFeeEstimate = Schemas['TransitionFeeEstimate'];
export type ScriptFeeEstimate = Schemas['ScriptFeeEstimate'];
export type SubscribeRequest = Schemas['SubscribeRequest'];
export type SubscribeResponse = Schemas['SubscribeResponse'];
export type Subscriber = Schemas['Subscriber'];
export type SubscriberList = Schemas['SubscriberList'];
