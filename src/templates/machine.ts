/**
 * Versioned-machine skeleton + `transition()` / `effect()` composition (handoff §1.2).
 *
 * Two moves:
 *   1. `transition()` / `effect()` build the wire `Transition` + its flat effect map from typed
 *      fragments instead of a hand-rolled JSON blob.
 *   2. `machine()` is a versioned-package SKELETON that OWNS exactly ONE canonical wire definition
 *      (`toProtoDefinition(app)`, computed once) and hands the SAME object to BOTH `publishVersion()`
 *      and `create()`. That is the verified-binding invariant (F9): because publish and create cannot
 *      drift, the chain's `definition.computeDigest` equals the registered `logicHash` and the bind
 *      admits the fiber. The skeleton REUSES `toProtoDefinition` (the one canonicalization path) — it
 *      never re-derives the wire shape.
 *
 * Guardrail (CLAUDE.md #1): every builder here is a pure function emitting the exact wire shape the
 * chain re-derives. Absent optionals (`metadata`/`participants`/`parentFiberId`/`migration`) are
 * OMITTED, never `null`; required-no-default fields (`strict` on publish, `dependencies: []` per
 * transition) are ALWAYS present.
 */

import {
  toProtoDefinition,
  type Transition,
  type JsonLogicRule,
  type DependencySpec,
  type FiberAppDefinition,
  type ProtoStateMachineDefinition,
} from '../schema/fiber-app.js';
import type {
  MachineShape,
  PublishMachineVersion,
  CreateStateMachine,
  UpgradeFiber,
  SchemaRef,
  SemVer,
  JsonLogicValue,
  JsonLogicExpression,
} from '../ottochain/types.js';

// =============================================================================
// transition()
// =============================================================================

/** Authoring shape for {@link transition} — `on` is the event name (mapped to the wire `eventName`). */
export interface TransitionSpec<TState extends string = string, TEvent extends string = string> {
  from: TState;
  to: TState;
  /** Event that fires this transition. Mapped to the wire key `eventName`. */
  on: TEvent;
  /** JSON-Logic predicate; defaults to the always-true `{ "==": [1, 1] }` when omitted. */
  guard?: JsonLogicRule;
  /** The flat effect map (build it with {@link effect}). Passed through verbatim. */
  effect?: JsonLogicRule;
  /**
   * Dependencies for this transition. Defaults to `[]` (ALWAYS present — the chain
   * `Transition.dependencies: Set[UUID]` has no default; omitting it diverges the canonical).
   * `toProtoDefinition` later drops any non-string {@link DependencySpec} authoring entries.
   */
  dependencies?: readonly (string | DependencySpec)[];
}

/**
 * Build a wire {@link Transition} from a typed spec.
 *
 *   - `on` → `eventName` (the wire key);
 *   - `guard` defaults to `{ "==": [1, 1] }`;
 *   - `dependencies` defaults to `[]` and is ALWAYS present;
 *   - `effect` is passed through (build it with {@link effect}).
 *
 * @example
 * ```ts
 * transition({
 *   from: 'debt_current', to: 'debt_current', on: 'buy',
 *   effect: effect(
 *     { status: 'debt_current', purchaseCount: { '+': [{ var: 'state.purchaseCount' }, 1] } },
 *     triggers([...]), transferAsset([...]),
 *   ),
 * });
 * ```
 */
export function transition<TState extends string = string, TEvent extends string = string>(
  t: TransitionSpec<TState, TEvent>,
): Transition<TState, TEvent> {
  return {
    from: t.from,
    to: t.to,
    eventName: t.on,
    guard: t.guard ?? { '==': [1, 1] },
    effect: t.effect,
    dependencies: t.dependencies ?? [],
  };
}

// =============================================================================
// effect()
// =============================================================================

/**
 * Compose an effect into ONE FLAT map: the state-update fields PLUS any `_`-directive fragments,
 * all in a single object (`Object.assign({}, stateUpdate, ...directives)`).
 *
 * Riverdale effects are flat maps that mix `_`-reserved directives (`_triggers`, `_transferAsset`,
 * `_spawn`, …) with plain state-update fields — they are NOT `merge`-wrapped. Each directive fragment
 * is a `Record` (e.g. the output of `transferAsset(...)` / `triggers(...)`), spread in here. Later
 * fragments override earlier keys (`Object.assign` semantics).
 *
 * @example
 * ```ts
 * effect(
 *   { status: 'debt_current', purchaseCount: { '+': [{ var: 'state.purchaseCount' }, 1] } },
 *   { _triggers: [...] },
 *   transferAsset([{ assetId: { var: 'event.payAssetId' }, recipient: { var: 'event.retailerId' } }]),
 * );
 * // => { status, purchaseCount, _triggers, _transferAsset }
 * ```
 */
export function effect(
  stateUpdate: Record<string, unknown>,
  ...directives: Record<string, unknown>[]
): Record<string, unknown> {
  return Object.assign({}, stateUpdate, ...directives);
}

// =============================================================================
// machine() — the versioned-package skeleton
// =============================================================================

/** The machine package spec: identity (`name`@`version`) + the one canonical `app` + its schema shape. */
export interface MachineSpec<TState extends string = string, TEvent extends string = string> {
  /** Full registry name `labels.tld` (e.g. `"consumer.package"`). */
  name: string;
  /** SemVer string (e.g. `"1.0.0"`). */
  version: SemVer;
  /** The typed fiber app; projected ONCE to the canonical wire definition via `toProtoDefinition`. */
  app: FiberAppDefinition<TState, TEvent>;
  /** The advisory proto projection the chain stores for discovery (carried onto `PublishMachineVersion.machineShape`). */
  schemaShape: MachineShape;
}

/** Options for {@link Machine.publishVersion}. */
export interface PublishVersionOptions {
  /** Opt-in runtime conformance gate (#33). Defaults to `false` (REQUIRED on the wire — never omitted). */
  strict?: boolean;
  /** Optional off-chain links grab-bag; OMITTED when absent (never `null`). */
  metadata?: Record<string, string>;
  /**
   * Base64 of the proto FileDescriptorSet. REQUIRED on the wire `PublishMachineVersion` (the chain
   * base64-validates + hashes it, then drops the bytes), so it is ALWAYS present; defaults to the empty
   * string `''` (valid empty base64) when the skeleton has no descriptor set bound. The verified binding
   * hangs on `definition.computeDigest`, NOT on this field.
   */
  schemaB64?: string;
}

/** Options for {@link Machine.create}. */
export interface CreateOptions {
  fiberId: string;
  /** Seeded fiber state (e.g. from `seedState(...)`); pre-seed accumulators so no field reads `null`. */
  initialData: JsonLogicValue;
  /** Optional DAG addresses authorized to sign transitions; OMITTED when absent (never `null`). */
  participants?: string[];
  /** Optional parent fiber UUID; OMITTED when absent (never `null`). */
  parentFiberId?: string;
}

/** Options for {@link Machine.upgradeFrom}. */
export interface UpgradeOptions {
  fiberId: string;
  targetSequenceNumber: number;
  /** Optional JSON-Logic migration transform of the prior state; OMITTED when absent (never `null`). */
  migration?: JsonLogicExpression;
}

/** The versioned-machine skeleton returned by {@link machine}. */
export interface Machine {
  /** The ONE canonical wire definition (`toProtoDefinition(app)`), shared by publish + create. */
  wireDefinition(): ProtoStateMachineDefinition;
  /** The `PublishMachineVersion` body — its `definition` is the SAME object as `wireDefinition()`. */
  publishVersion(o?: PublishVersionOptions): PublishMachineVersion;
  /** The `CreateStateMachine` body — references `name@version` via `schemaRef` + the SAME `definition`. */
  create(o: CreateOptions): CreateStateMachine;
  /** The `UpgradeFiber` body — re-pins to `name@version` with the SAME `newDefinition`. */
  upgradeFrom(o: UpgradeOptions): UpgradeFiber;
}

/** A pinned-Exact `SchemaRef` for `name@version`. Wire: `{ name, version: { Exact: { version } } }`. */
function exactRef(name: string, version: SemVer): SchemaRef {
  return { name, version: { Exact: { version } } };
}

/**
 * Build a versioned-machine skeleton that binds publish + create to ONE canonical definition.
 *
 * The definition is projected ONCE here (`toProtoDefinition(spec.app)`) and the SAME reference is handed
 * to `wireDefinition()`, `publishVersion().definition`, `create().definition`, and
 * `upgradeFrom().newDefinition` — so they cannot drift and the chain's verified binding admits the fiber
 * (F9). REUSES `toProtoDefinition` (the single canonicalization path); never re-derives the wire shape.
 */
export function machine<TState extends string = string, TEvent extends string = string>(
  spec: MachineSpec<TState, TEvent>,
): Machine {
  // Project the canonical wire definition ONCE; every consumer reuses this exact reference.
  const wireDef: ProtoStateMachineDefinition = toProtoDefinition(spec.app);

  return {
    wireDefinition(): ProtoStateMachineDefinition {
      return wireDef;
    },

    publishVersion(o?: PublishVersionOptions): PublishMachineVersion {
      return {
        name: spec.name,
        version: spec.version,
        // REQUIRED-no-default on the wire; '' is valid empty base64 when no descriptor set is bound.
        schemaB64: o?.schemaB64 ?? '',
        machineShape: spec.schemaShape,
        definition: wireDef, // SAME reference as wireDefinition()/create()
        strict: o?.strict ?? false, // REQUIRED — never omitted
        ...(o?.metadata ? { metadata: o.metadata } : {}), // OMIT when absent
      };
    },

    create(o: CreateOptions): CreateStateMachine {
      return {
        fiberId: o.fiberId,
        definition: wireDef, // SAME reference as wireDefinition()/publishVersion()
        initialData: o.initialData,
        schemaRef: exactRef(spec.name, spec.version), // verified binding: name@version
        ...(o.participants ? { participants: o.participants } : {}), // OMIT when absent
        ...(o.parentFiberId ? { parentFiberId: o.parentFiberId } : {}), // OMIT when absent
      };
    },

    upgradeFrom(o: UpgradeOptions): UpgradeFiber {
      return {
        fiberId: o.fiberId,
        targetRef: exactRef(spec.name, spec.version),
        newDefinition: wireDef, // SAME reference — re-pin hashes to the same logicHash
        targetSequenceNumber: o.targetSequenceNumber,
        ...(o.migration !== undefined ? { migration: o.migration } : {}), // OMIT (Option) when absent
      };
    },
  };
}
