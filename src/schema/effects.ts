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
