/**
 * Migration builders — the `UpgradeFiber.migration` JSON-Logic transform applied on a version upgrade.
 *
 * THE FOOT-GUN (F9): a migration's evaluation root is the BARE prior state, not `state.x`.
 * The chain evaluates the migration expression against `sm.stateData` directly
 * (`MeteredEvaluator.eval(expr, sm.stateData, Migration)`, FiberEngine.scala:300), so:
 *   - `{ var: '' }`            => the WHOLE prior state object
 *   - `{ var: 'loyaltyPoints' }` => the top-level `loyaltyPoints` field
 * This is UNLIKE an effect, where the root is the transition context and you read `{ var: 'state.x' }`.
 * Writing `state.loyaltyPoints` in a migration silently reads `undefined`. These helpers hide that
 * asymmetry by pinning the bare-state root for you.
 *
 * `migration` is `Option` on `UpgradeFiber` — when there is no transform, OMIT the key (never send `null`).
 */

/**
 * Seed / overwrite top-level state fields on a version upgrade.
 * Emits `{ merge: [{ var: '' }, fields] }` — merges `fields` onto the bare prior state, so existing
 * fields are preserved and the named fields are added or overwritten.
 *
 * The `{ var: '' }` root is the BARE prior state (NOT `state.x` like an effect) — that asymmetry is
 * exactly the F9 foot-gun this helper hides.
 *
 * @example seedFields({ loyaltyPoints: 0 }) // => { merge: [{ var: '' }, { loyaltyPoints: 0 }] }
 */
export const seedFields = (fields: Record<string, unknown>): unknown => ({
  merge: [{ var: '' }, fields],
});

/**
 * General migration transform with the bare-state root made explicit. `build` receives `{ var: '' }`
 * (the whole prior state) and returns the migration JSON-Logic.
 *
 * @example migration((s) => ({ merge: [s, { x: 1 }] })) // => { merge: [{ var: '' }, { x: 1 }] }
 */
export const migration = (build: (priorState: { var: '' }) => unknown): unknown => build({ var: '' });
