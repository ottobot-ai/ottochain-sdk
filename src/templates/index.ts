/**
 * `@ottochain/sdk/templates` — the fiber & asset authoring template catalog.
 *
 * Typed builders that emit the EXACT canonical wire shapes app authors otherwise hand-roll as raw
 * JSON-Logic (asset policies, versioned machines, effect directives, migrations, seeded state). Every
 * builder is additive and pure — it returns the same wire shape the chain re-derives, so a template
 * output signs to byte-identical `JCS(dropNulls(payload))` (CLAUDE.md rule #1). Hand-rolled JSON keeps
 * working; these just make the recurring shapes typed, named, and mistake-resistant.
 *
 * Origin: the fiber-ergonomics program (ottochain `docs/proposals/fiber-ergonomics/`), Phase A — the
 * `riverdale-economy` e2e is the migration proof (each preset reproduces its checked-in golden JSON).
 *
 * @example
 * import {
 *   fungiblePolicy, machine, transition, effect, guard,
 *   transferAsset, triggers, spawn, seedState, seedFields,
 * } from '@ottochain/sdk/templates';
 */

// ─── 1.1 Asset-policy presets ────────────────────────────────────────────────
// fungiblePolicy / nftPolicy / soulboundPolicy / customPolicy (+ sumBehavior, defaultStateTypeName,
// BehaviorBitName) — emit a `CreateAssetPolicy`; behavior is summed from TOKEN_BEHAVIOR_BITS, never a literal.
export * from './asset-policy.js';

// ─── 1.2 Versioned-machine skeleton + transition()/effect() ──────────────────
// machine / transition / effect (+ TransitionSpec, MachineSpec, Machine, …). The skeleton owns ONE
// canonical wire definition, so publish + create cannot drift (verified binding, F9).
export * from './machine.js';

// ─── 1.4 Migration helpers ───────────────────────────────────────────────────
// seedFields / migration — hides the bare-state-root ({"var":""}) foot-gun.
export * from './migration.js';

// ─── 1.5 State-shape-with-defaults ───────────────────────────────────────────
// seedState / declaredFields / StateShape — auto-seed accumulators so no field reads null (F5).
export * from './state-shape.js';

// ─── 1.3 Effect-directive builders ───────────────────────────────────────────
// transferAsset / triggers / spawn / emit / toFiber / toWallet / addDependency / setDependencyActive /
// RESERVED_EFFECT_KEYS — a typo'd directive is a TS error, not a silent state field (F4).
export * from '../schema/effects.js';

// ─── Authorization-guard builders (namespace) ────────────────────────────────
// `guard.signerIsParty('state.borrower')` reads as intent at the call site.
export * as guard from '../schema/guards.js';

// ─── Existing machine/policy primitives re-surfaced for one-import authoring ──
export {
  defineFiberApp,
  toProtoDefinition,
  constrained,
  unconstrained,
  immutable,
  projectFiberPolicy,
} from '../schema/fiber-app.js';
export type {
  FiberAppDefinition,
  Transition,
  ProtoStateMachineDefinition,
  FiberPolicy,
  FiberPolicyDials,
} from '../schema/fiber-app.js';
