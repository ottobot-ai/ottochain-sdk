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
export const addDependency = (
  fiberId: JsonLogicValue,
): Record<string, unknown> => ({
  _addDependency: [{ fiberId }],
});

/**
 * `_setDependencyActive` (#24): toggle a dynamic dependency's `active` flag. The entry is NEVER removed —
 * deactivation simply drops it from the `machines` context (and it can be cheaply re-activated). `fiberId`
 * may be a literal or an expression.
 */
export const setDependencyActive = (
  fiberId: JsonLogicValue,
  active: boolean,
): Record<string, unknown> => ({
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
 * one whole instance at a time, never split. `recipient` must resolve to a `StrValue`: a UUID → `Fiber`,
 * a DAG address → `Wallet` (UUID is tried first). `assetId`/`recipient` may be literals or expressions
 * (e.g. `{ var: "event.agent" }`).
 *
 * Combiner-side holder defense (R1) independently re-validates every directive: the asset must resolve,
 * be held by `Fiber(self)`, be `behavior.transferable`, and (Fiber recipient) the recipient fiber must be
 * live — else the whole transition is `CombineRejected`. There is a hard cap of 32 asset mutations per
 * transition (all-or-nothing); keep emitting fibers at ≤1 transfer per transition for claim/withdraw/slash.
 *
 * @example
 * effect: { merge: [ { var: "state" }, {
 *   status: "SETTLED",
 *   ...transferAsset([{ assetId: { var: "event.rewardAssetId" }, recipient: { var: "event.agent" } }]),
 * } ] }
 */
export const transferAsset = (
  transfers: { assetId: JsonLogicValue; recipient: JsonLogicValue }[],
): Record<string, unknown> => ({ _transferAsset: transfers });
