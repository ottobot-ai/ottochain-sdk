/**
 * Builders for the fiber-engine reserved EFFECT directives — the `_`-prefixed keys the chain extracts
 * from an evaluated effect result and applies as side effects (then strips from the merged state).
 *
 * Place the returned fragment INSIDE the state-update map of a `merge` effect, so the directive rides in
 * the evaluated result map (EffectExtractor reads it; StateMerger drops `_`-prefixed keys from state):
 *
 * ```ts
 * effect: {
 *   merge: [
 *     { var: "state" },
 *     { boundAt: { var: "$ordinal" }, ...addDependency({ var: "event.registryId" }) },
 *   ],
 * }
 * ```
 */

import type { ProtoStateMachineDefinition } from './fiber-app.js';

/** A JSON-Logic value: a literal (string/number/bool) or a `{var}`/operator expression. */
type JsonLogicValue = unknown;

/**
 * `_addDependency` (#24): add — or re-activate — a runtime DYNAMIC dependency on `fiberId`, so that
 * fiber's state appears in `machines.<fiberId>` for SUBSEQUENT transitions of this fiber. `fiberId` may
 * be a literal UUID string or an expression (e.g. `{ var: "event.registryId" }`, `{ var: "state.registryId" }`).
 * The ledger is append-only, idempotent (one entry per fiber), and engine-bounded (active + ledger caps).
 * Because the `machines` context is built BEFORE the effect runs, the bound dependency is readable only
 * from the NEXT transition onward (two-phase: bind, then read).
 */
export const addDependency = (fiberId: JsonLogicValue): Record<string, unknown> => ({
  _addDependency: [{ fiberId }],
});

/**
 * `_setDependencyActive` (#24): toggle a dynamic dependency's `active` flag. The entry is NEVER removed —
 * deactivation simply drops it from the `machines` context (and it can be cheaply re-activated). `fiberId`
 * may be a literal or an expression.
 */
export const setDependencyActive = (fiberId: JsonLogicValue, active: boolean): Record<string, unknown> => ({
  _setDependencyActive: [{ fiberId, active }],
});

/**
 * `_transferAsset`: move one or more WHOLE asset instances the emitting fiber holds, each to a single
 * recipient. The directive rides INSIDE a `merge` effect map (the engine extracts `_`-prefixed keys
 * before merging into state); a transition-level `emits` block is silently stripped by
 * `toProtoDefinition`, which would strand the asset.
 *
 * Each directive is `{ assetId, recipient }` ONLY — there is NO `amount` field. The combiner reassigns
 * `holder := recipient` on the WHOLE asset record (`AssetCombiner.applyFiberTransfer`); value is moved
 * one whole instance at a time, never split. `recipient` must resolve to the canonical `AssetHolder`
 * OBJECT form — `{"Fiber":{"fiberId":..}}` / `{"Wallet":{"address":..}}` — built with {@link toFiber} /
 * {@link toWallet}; the chain raises a graceful `CombineRejected` on a bare string or malformed object
 * (`EffectExtractor.parseAssetTransfer`). `assetId` is a UUID; the holder id may be a literal or an
 * expression (e.g. `{ var: "event.agent" }`).
 *
 * Combiner-side holder defense (R1) independently re-validates every directive: the asset must resolve,
 * be held by `Fiber(self)`, be `behavior.transferable`, and (Fiber recipient) the recipient fiber must be
 * live — else the whole transition is `CombineRejected`. There is a hard cap of 32 asset mutations per
 * transition (all-or-nothing); keep emitting fibers at ≤1 transfer per transition for claim/withdraw/slash.
 *
 * @example
 * effect: { merge: [ { var: "state" }, {
 *   status: "SETTLED",
 *   ...transferAsset([{ assetId: { var: "event.rewardAssetId" }, recipient: toWallet({ var: "event.agent" }) }]),
 * } ] }
 */
export const transferAsset = (
  transfers: { assetId: JsonLogicValue; recipient: JsonLogicValue }[],
): Record<string, unknown> => ({ _transferAsset: transfers });

/**
 * Build a `_transferAsset` `recipient` as the canonical `AssetHolder` OBJECT form. The chain requires the
 * object form ONLY — `{"Fiber":{"fiberId":..}}` / `{"Wallet":{"address":..}}` — and raises a graceful
 * `CombineRejected` on a bare string or a malformed object (`EffectExtractor.parseAssetTransfer`); the
 * legacy bare-string UUID/DAG-address disambiguation has been removed. These mirror the typed
 * {@link fiberHolder} / {@link walletHolder} `AssetHolder` builders (used for `MintAsset.holder` /
 * `ApplyMorphism.recipient`) but accept a `JsonLogicValue`, so the id can be a runtime expression:
 *
 * ```ts
 * transferAsset([{ assetId, recipient: toFiber({ var: "event.retailerId" }) }]);  // → {"Fiber":{"fiberId":..}}
 * transferAsset([{ assetId, recipient: toWallet({ var: "event.agent" }) }]);       // → {"Wallet":{"address":..}}
 * ```
 */
export const toFiber = (fiberId: JsonLogicValue): JsonLogicValue => ({
  Fiber: { fiberId },
});
/** See {@link toFiber}: a `transferAsset` recipient held by a wallet — `{"Wallet":{"address":..}}`. */
export const toWallet = (address: JsonLogicValue): JsonLogicValue => ({
  Wallet: { address },
});

/**
 * `_triggers` (F4): fire one or more CROSS-FIBER events. Each entry is projected to
 * `{ targetMachineId, eventName, payload }` — the exact shape the chain's `EffectExtractor` reads
 * (`ReservedKeys.scala`, `EffectExtractor.scala`). `target` is the recipient fiber id (a literal UUID
 * or an expression, e.g. `{ var: "event.retailerId" }`); `event` is the event NAME to enqueue on it;
 * `payload` is the event body — omit it and the builder emits `{}` (never `null`).
 *
 * Authoring this as a builder makes a typo'd `_trigger` / `triggres` a TypeScript error rather than a
 * silently-merged state field (the F4 foot-gun). Place the fragment INSIDE the effect's state-update
 * map so it rides in the evaluated result the extractor reads.
 *
 * @example
 * effect: { merge: [ { var: "state" }, {
 *   status: "debt_current",
 *   ...triggers([{ target: { var: "event.retailerId" }, event: "process_sale",
 *     payload: { buyerId: { var: "machineId" }, quantity: { var: "event.quantity" } } }]),
 * } ] }
 */
export const triggers = (
  ts: {
    target: JsonLogicValue;
    event: string;
    payload?: Record<string, unknown>;
  }[],
): Record<string, unknown> => ({
  _triggers: ts.map((t) => ({
    targetMachineId: t.target,
    eventName: t.event,
    payload: t.payload ?? {},
  })),
});

/**
 * `_spawn`: create one or more CHILD fibers, each from a literal machine `definition`. Each entry is
 * `{ childId, definition, initialData, owners }` (`ReservedKeys.scala`, `EffectExtractor.scala`).
 *
 * The chain extracts `_spawn` from the effect EXPRESSION, not the evaluated result, so `definition`
 * MUST be a literal {@link ProtoStateMachineDefinition} (e.g. a nested `machine().wireDefinition()` /
 * `toProtoDefinition(child)` output) — NOT an expression the engine would evaluate at runtime.
 *
 * F8 gotcha — `owners` is load-bearing. A spawned child's transitions are gated by
 * `owners ∪ authorizedSigners` (`riverdale-economy/README.md`), so EVERY party that will later drive
 * the child (e.g. every bidder on a spawned auction) MUST be listed in `owners`, or their events are
 * rejected. `owners` may be a literal id array or an expression (e.g. `{ var: "event.auctionOwners" }`);
 * `childId` / `initialData` likewise accept literals or expressions.
 */
export const spawn = (
  ds: {
    childId: JsonLogicValue;
    definition: ProtoStateMachineDefinition;
    initialData: Record<string, unknown>;
    owners: JsonLogicValue;
  }[],
): Record<string, unknown> => ({ _spawn: ds });

/**
 * `_emit`: emit one or more domain events to the fiber's outbox. Each entry is
 * `{ name, data, destination? }` (`ReservedKeys.scala`, `EffectExtractor.scala`). `name` is the event
 * name, `data` the body (a literal or an expression), and `destination` an OPTIONAL routing target —
 * omit it when absent (callers never pass `null`, so it is simply absent on the wire).
 */
export const emit = (es: { name: string; data: JsonLogicValue; destination?: string }[]): Record<string, unknown> => ({
  _emit: es,
});

/**
 * `_scriptCall`: invoke a SCRIPT fiber's `method` from an effect. Unlike the array-valued directives,
 * `_scriptCall` is a SINGLE object `{ fiberId, method, args }` (chain `ReservedKeys.scala` `SCRIPT_CALL` /
 * `EffectExtractor.extractScriptCall`). `fiberId` is the target script's UUID (a literal or an expression,
 * e.g. `{ var: "state.resolverId" }`); `method` is the script method NAME; `args` is the argument body —
 * a JSON-Logic value the chain EVALUATES against the transition context before dispatch.
 *
 * The chain's extractor requires ALL THREE fields — if `args` is absent the whole call is silently DROPPED
 * (fail-silent, like the other extractors). So the builder ALWAYS emits `args`, defaulting an omitted one
 * to `{}` (no-args), mirroring how {@link triggers} defaults an absent `payload`. Authoring this as a
 * builder makes a typo'd `_scriptcall` / wrong field a TypeScript error rather than a silently-merged
 * state field. Place the fragment INSIDE the effect's state-update map so it rides in the evaluated result.
 *
 * @example
 * effect: { merge: [ { var: "state" }, {
 *   status: "resolving",
 *   ...scriptCall({ fiberId: { var: "state.resolverId" }, method: "resolve",
 *     args: { marketId: { var: "machineId" } } }),
 * } ] }
 */
export const scriptCall = (call: {
  fiberId: JsonLogicValue;
  method: string;
  args?: JsonLogicValue;
}): Record<string, unknown> => ({
  _scriptCall: {
    fiberId: call.fiberId,
    method: call.method,
    args: call.args ?? {},
  },
});

/**
 * The complete set of `_`-prefixed RESERVED effect keys the chain's `EffectExtractor` consumes and
 * `StateMerger` strips from state (`ReservedKeys.scala:12-49`). Exported so a validator (Proposal 01)
 * can reject an unknown `_`-prefixed key (a typo'd directive) instead of letting it silently leak into
 * persisted state.
 */
export const RESERVED_EFFECT_KEYS = [
  '_triggers',
  '_spawn',
  '_emit',
  '_transferAsset',
  '_scriptCall',
  '_addDependency',
  '_setDependencyActive',
] as const;
