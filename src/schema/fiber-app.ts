/**
 * Fiber App Definition Schema
 *
 * TypeScript-first definitions for fiber apps. This is the source of truth —
 * no JSON, no code generation. Import types directly.
 */

// =============================================================================
// Schema Field Types
// =============================================================================

export type SchemaFieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'address' // DAG address
  | 'uri'
  | 'timestamp' // ISO 8601
  | 'uuid'
  | 'hash' // hex-encoded
  | 'object'
  | 'array';

export interface SchemaField {
  type?: SchemaFieldType; // Optional when using $ref
  description?: string;
  default?: unknown;

  // Constraints
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: readonly string[];
  pattern?: string;
  format?: string; // e.g., 'date-time', 'email', 'uri'
  nullable?: boolean; // Allow null values

  // Annotations
  immutable?: boolean; // Cannot change after creation
  computed?: boolean; // Managed by effects, not user-settable
  indexed?: boolean; // Hint for indexer

  // JSON Schema references
  $ref?: string; // Reference to a definition

  // Nested types
  items?: SchemaField | { $ref: string };
  properties?: Record<string, SchemaField>;
  required?: readonly string[];
  additionalProperties?: boolean | SchemaField;
}

export interface SchemaDefinition {
  type: 'object';
  description?: string;
  required?: readonly string[];
  properties: Record<string, SchemaField>;
  nullable?: boolean;
}

// =============================================================================
// Event Schema
// =============================================================================

export interface EventSchema {
  description?: string;
  required?: readonly string[];
  properties?: Record<string, SchemaField>;
}

// =============================================================================
// State Machine Core (matches metagraph)
// =============================================================================

/**
 * Lifecycle category for a state — a small fixed vocabulary that lets UIs group
 * and color states and lets analytics bucket fibers without app-specific logic.
 *
 * - `initial`  — the machine's `initialState` (entry point)
 * - `active`   — a normal, operational, non-terminal state
 * - `pending`  — a transient state awaiting an action/condition/timeout
 * - `terminal` — a final state (`isFinal: true`); the machine ends here
 */
export type StateCategory = 'initial' | 'active' | 'pending' | 'terminal';

/**
 * Standard per-state metadata convention for OttoChain std apps.
 *
 * This is the minimal, high-value block we attach to every standard state
 * definition (instead of `metadata: null`). It is plain JSON, so it survives
 * the client/server null-dropping canonicalization (only NULL fields are
 * dropped; a populated object is kept and signed/verified identically on both
 * sides). Custom apps may extend `StateDefinition.metadata` with extra keys.
 *
 * Fields:
 * - `label`       — short human-readable title for the state (e.g. "Active")
 * - `description` — one-line explanation of what the state means
 * - `category`    — optional lifecycle hint (see {@link StateCategory})
 */
export interface StdStateMetadata {
  /** Short human-readable title, e.g. "Voting". */
  label: string;
  /** One-line description of what this state represents. */
  description: string;
  /** Optional lifecycle category hint for UIs / analytics. */
  category?: StateCategory;
}

export interface StateDefinition {
  id: string;
  isFinal: boolean;
  description?: string;
  /**
   * Optional per-state metadata. Std apps populate the {@link StdStateMetadata}
   * convention (`label` / `description` / `category`); custom apps may use any
   * JSON object or `null`. NOTE: a `null` here is stripped from the signed wire
   * form (the chain drops null object-fields), so prefer populated metadata or
   * omit the field entirely.
   */
  metadata?: StdStateMetadata | Record<string, unknown> | null;
}

export type JsonLogicRule = Record<string, unknown>;

export interface EmitSpec {
  event: string;
  to?: string;
  payload?: JsonLogicRule;
}

export interface DependencySpec {
  machine: string;
  instanceRef: JsonLogicRule;
  requiredState?: string;
}

export interface Transition<TState extends string = string, TEvent extends string = string> {
  from: TState;
  to: TState;
  eventName: TEvent;
  guard?: JsonLogicRule;
  effect?: JsonLogicRule;
  dependencies?: readonly (string | DependencySpec)[];
  emits?: readonly (string | EmitSpec)[]; // Event names emitted by this transition
}

// =============================================================================
// Fiber Policy (the fiber "constitution")
// =============================================================================

// ─── Dial value types (EXACT chain wire encodings) ───────────────────────────
// These mirror the chain's `FiberPolicy.scala` codecs byte-for-byte. The chain
// re-encodes and verifies over `JCS(dropNulls(payload))`, so any divergence in
// casing or shape silently breaks the create signature (opaque HTTP 400). Each
// type is annotated with the exact Scala source it mirrors.

/**
 * `allowedEffects` element — the 5 `EffectKind` families, UPPERCASE on the wire
 * (`enumeratum` `Uppercase` mixin). Chain: `EffectKind` in `FiberPolicy.scala`.
 */
export type EffectKind = 'TRIGGER' | 'SPAWN' | 'EMIT' | 'TRANSFER' | 'DEPENDENCY';

/**
 * `spawnOwnerPolicy` — UPPERCASE (`enumeratum` `Uppercase`). Chain: `SpawnOwnerPolicy`
 * (`Explicit` / `SubsetOfParent` / `InheritParent` ⇒ `"EXPLICIT"` / `"SUBSETOFPARENT"`
 * / `"INHERITPARENT"`).
 */
export type SpawnOwnerPolicy = 'EXPLICIT' | 'SUBSETOFPARENT' | 'INHERITPARENT';

/**
 * `dependencyPolicy.mode` — UPPERCASE (`enumeratum` `Uppercase`). Chain: `DependencyMode`
 * (`Open` / `Allowlist` / `Frozen`). REQUIRED on the wire (Scala defaults it to `Open`,
 * but the `customizableEncoder` always encodes the value).
 */
export type DependencyMode = 'OPEN' | 'ALLOWLIST' | 'FROZEN';

/**
 * `transferPolicy` — recipient allowlist for `_transferAsset`. Chain: `TransferPolicy`
 * (`Option[Set[UUID]]` fibers, `Option[Set[Address]]` wallets). Each field is OPTIONAL;
 * an absent field ⇒ that recipient class is unconstrained (and is `dropNulls`-stripped).
 */
export interface TransferPolicy {
  /** Fiber UUIDs permitted to receive a transfer. */
  allowedRecipientFibers?: readonly string[];
  /** DAG wallet addresses permitted to receive a transfer. */
  allowedRecipientWallets?: readonly string[];
}

/**
 * `dependencyPolicy` — dynamic-dependency posture. Chain: `DependencyPolicy`
 * (`mode: DependencyMode`, `allowed: Option[Set[UUID]]`). `mode` is REQUIRED; `allowed`
 * is meaningful only when `mode === 'ALLOWLIST'` and is `dropNulls`-stripped otherwise.
 */
export interface DependencyPolicy {
  /** Posture: `OPEN` (any target) / `ALLOWLIST` (only `allowed`) / `FROZEN` (no new). */
  mode: DependencyMode;
  /** Fiber UUIDs permitted as dependency targets (meaningful only under `ALLOWLIST`). */
  allowed?: readonly string[];
}

/**
 * `migrationAuthority` — who may authorize a `Governed` migration. Chain:
 * `MigrationAuthority`, a DISJOINT-FIELD discriminated union (no tag key): the `Signers`
 * arm carries `addresses`, the `Role` arm carries `registryFiberId` + `roleField`. The
 * presence of disjoint fields is the discriminator (same as the chain decoder's `.or`).
 */
export type MigrationAuthority =
  | {
      /** VERIFIED signer DAG addresses permitted to authorize the migration (`Signers`). */
      addresses: readonly string[];
    }
  | {
      /** Registry fiber UUID whose role-map is consulted (`Role`). */
      registryFiberId: string;
      /** Field/key in that fiber's state holding the `{<address>: true}` role map (`Role`). */
      roleField: string;
    };

/**
 * `upgradePolicy` — the upgrade-path constitution. Chain: `UpgradePolicy`. The three
 * bare variants encode as LOWERCASE tag STRINGS (`"immutable"` / `"appendOnly"` /
 * `"arbitrary"`); the `Governed` arm encodes as the object `{ authority: <MigrationAuthority> }`.
 *
 * NOTE: this lowercase `"immutable"` is the upgradePolicy DIAL VALUE — distinct from the
 * policy-level variant tag `"Immutable"` (capital-I), a different construct added in a
 * later change.
 */
export type UpgradePolicy =
  | 'immutable'
  | 'appendOnly'
  | 'arbitrary'
  | {
      /** Authority that may consent to a `Governed` migration. */
      authority: MigrationAuthority;
    };

/**
 * `compatibleWith` — the inclusive-min / exclusive-max SemVer bridge window a migration
 * may target. Chain: `VersionRange` (`min: Option[SemVer]`, `max: Option[SemVer]`). Each
 * bound is a SemVer STRING (`"1.2.3"`); an absent bound is unconstrained on that side and
 * is `dropNulls`-stripped.
 */
export interface VersionRange {
  /** Inclusive lower bound, e.g. `"1.0.0"` (absent ⇒ unconstrained below). */
  min?: string;
  /** Exclusive upper bound, e.g. `"2.0.0"` (absent ⇒ unconstrained above). */
  max?: string;
}

/**
 * `FiberPolicy` — the constitution a definition declares for the fibers it spawns.
 *
 * This MIRRORS the chain ADT `FiberPolicy = Unconstrained | Immutable | Constrained(<dials>)`
 * (chain branch `feat/fiber-policy-adt`). The representation here is chosen for
 * BYTE-FOR-BYTE wire parity with the chain, because a `StateMachineDefinition` is
 * signed verbatim by the SDK (`batchSign(dropNulls(...))`) and re-encoded + verified
 * by the chain. The rule is:
 *
 *   - **`Unconstrained`** ⇒ there is **NO `policy` key** on the wire definition at all.
 *     In the SDK this is the DEFAULT and is represented by simply OMITTING `policy`
 *     (i.e. `policy === undefined`).
 *   - **`Immutable`** ⇒ the definition is permanently locked; `policy` is the bare JSON
 *     STRING `"Immutable"` (EXACT casing, capital-I) — NOT an object. Semantically this is
 *     the upgradePolicy DIAL set to its LOWERCASE `"immutable"` value with no other dial
 *     set, and the chain collapses that exact `Constrained` into the `Immutable` variant.
 *     See {@link immutable} and the canonical collapse in {@link projectFiberPolicy}.
 *   - **`Constrained(dials)`** ⇒ `policy` is a bare object of ONLY the dials that are
 *     SET. Unset dials are absent (the chain `dropNulls`-strips them; so does the SDK
 *     at sign time). A `Constrained` with no dials set is wire-indistinguishable from
 *     `Unconstrained`, so `toProtoDefinition` collapses it back to "no policy key".
 *
 * All 14 dials are optional. Provide any subset.
 */
export interface FiberPolicyDials {
  /** Whether the fiber may reproduce itself (spawn instances of its own definition). Wire: boolean. */
  selfReproducing?: boolean;
  /**
   * Allow-list of effect families this fiber's transitions may produce, as a SET of the 5
   * UPPERCASE {@link EffectKind} tokens (`"TRIGGER" | "SPAWN" | "EMIT" | "TRANSFER" |
   * "DEPENDENCY"`). Order is not significant; duplicates are collapsed by the chain's `Set`.
   * Chain: `allowedEffects: Option[Set[EffectKind]]`.
   */
  allowedEffects?: readonly EffectKind[];
  /**
   * Who/what may own fibers this one spawns — an UPPERCASE {@link SpawnOwnerPolicy} token
   * (`"EXPLICIT" | "SUBSETOFPARENT" | "INHERITPARENT"`). Chain: `spawnOwnerPolicy: Option[SpawnOwnerPolicy]`.
   */
  spawnOwnerPolicy?: SpawnOwnerPolicy;
  /** Maximum spawn-generation depth (descendant chain length). Wire: number. */
  maxGenerations?: number;
  /** Maximum number of children a single transition may spawn. Wire: number. */
  maxSpawnFanout?: number;
  /** SET of caller fiber UUIDs permitted to drive transitions on this fiber. Wire: string[]. */
  acceptedCallers?: readonly string[];
  /** SET of state ids that are sealed (no transition may fire from them). Wire: string[]. */
  sealedStates?: readonly string[];
  /**
   * Recipient allowlist for `_transferAsset` — the {@link TransferPolicy} object
   * `{ allowedRecipientFibers?: uuid[], allowedRecipientWallets?: DAG-address[] }`.
   * Chain: `transferPolicy: Option[TransferPolicy]`.
   */
  transferPolicy?: TransferPolicy;
  /**
   * Dynamic-dependency policy — the {@link DependencyPolicy} object `{ mode, allowed? }`
   * where `mode` is the REQUIRED UPPERCASE {@link DependencyMode}. Chain:
   * `dependencyPolicy: Option[DependencyPolicy]`.
   */
  dependencyPolicy?: DependencyPolicy;
  /**
   * In-place upgrade/migration posture — an {@link UpgradePolicy}: a LOWERCASE bare tag
   * (`"immutable" | "appendOnly" | "arbitrary"`) OR the `Governed` object
   * `{ authority: <MigrationAuthority> }`. Chain: `upgradePolicy: Option[UpgradePolicy]`.
   */
  upgradePolicy?: UpgradePolicy;
  /** Self-declared SemVer of this definition as a STRING `"major.minor.patch"` (e.g. `"1.2.3"`). Chain: `version: Option[SemVer]`. */
  version?: string;
  /**
   * Migration bridge window — the {@link VersionRange} object `{ min?: semver, max?: semver }`
   * naming the successor versions this definition declares it will migrate TO. Chain:
   * `compatibleWith: Option[VersionRange]`.
   */
  compatibleWith?: VersionRange;
  /** SET of (ERC-165-style) interface identifiers this definition advertises. Wire: string[]. */
  interfaces?: readonly string[];
  /**
   * Authority permitted to authorize a `Governed` migration — a {@link MigrationAuthority}:
   * `{ addresses: DAG-address[] }` (Signers) OR `{ registryFiberId: uuid, roleField: string }`
   * (Role), discriminated by disjoint fields. Chain: `migrationAuthority: Option[MigrationAuthority]`.
   */
  migrationAuthority?: MigrationAuthority;
}

/**
 * The wire (and authoring) tag for the `Immutable` policy VARIANT: the bare JSON string
 * `"Immutable"`. EXACT casing, capital-I — this is the POLICY-LEVEL variant name and is
 * DISTINCT from the `upgradePolicy` dial VALUE `"immutable"` (lowercase). The chain emits
 * exactly this capital-I string for `Immutable`, so the SDK must too, byte-for-byte.
 */
export const IMMUTABLE_POLICY = 'Immutable' as const;
export type ImmutablePolicy = typeof IMMUTABLE_POLICY;

/**
 * Wire form of a `FiberPolicy`. Mirrors the chain ADT's non-`Unconstrained` arms:
 *
 *   - a bare object of the SET dials — the `Constrained` arm. Unset dials are stripped at
 *     projection time (and again by `dropNulls` at sign time), so this object matches the
 *     chain's `dropNulls`-stripped `Constrained` encoding exactly; OR
 *   - the bare JSON string `"Immutable"` — the {@link ImmutablePolicy} arm.
 *
 * (`Unconstrained` has no wire representation: it is the absence of the `policy` key.)
 */
export type FiberPolicy = FiberPolicyDials | ImmutablePolicy;

/** The names of the 14 policy dials, in declaration order. Used by the projector. */
const FIBER_POLICY_DIALS: readonly (keyof FiberPolicyDials)[] = [
  'selfReproducing',
  'allowedEffects',
  'spawnOwnerPolicy',
  'maxGenerations',
  'maxSpawnFanout',
  'acceptedCallers',
  'sealedStates',
  'transferPolicy',
  'dependencyPolicy',
  'upgradePolicy',
  'version',
  'compatibleWith',
  'interfaces',
  'migrationAuthority',
];

/**
 * The canonical UNCONSTRAINED policy: omission. Provided as a named export for
 * readability at call sites — `policy: unconstrained()` documents intent, and projects
 * to NO `policy` key (identical to leaving `policy` off entirely).
 */
export function unconstrained(): undefined {
  return undefined;
}

/**
 * The canonical IMMUTABLE policy: the definition is permanently locked. Projects to the
 * bare JSON string `"Immutable"` ({@link IMMUTABLE_POLICY}), the chain's `Immutable`
 * variant tag. Semantically equivalent to `constrained({ upgradePolicy: 'immutable' })`
 * with no other dial set — which `constrained()`/`projectFiberPolicy()` collapse to the
 * same string for wire parity (see {@link constrained}).
 *
 * @example
 * ```ts
 * const def = defineFiberApp({ ...spec, policy: immutable() });
 * ```
 */
export function immutable(): ImmutablePolicy {
  return IMMUTABLE_POLICY;
}

/**
 * Build a CONSTRAINED `FiberPolicy` from any subset of the 14 dials.
 *
 * Pass only the dials you want to set. Dials left `undefined`/`null` are dropped so the
 * result is a clean, minimal object that serializes identically to the chain's
 * `dropNulls`-stripped `Constrained`. If NO dial is effectively set, this returns
 * `undefined` (an empty constraint == `Unconstrained`), which projects to no `policy`
 * key — preserving wire parity.
 *
 * CANONICAL COLLAPSE: `constrained({ upgradePolicy: 'immutable' })` with NO other dial set
 * collapses to the bare string `"Immutable"` ({@link IMMUTABLE_POLICY}), because the chain
 * collapses that exact `Constrained` into the `Immutable` variant. NOTE the casing: the
 * collapse triggers on the chain's LOWERCASE upgradePolicy dial value `"immutable"`, and
 * the result is the capital-I policy-variant tag `"Immutable"`. Signing the dials object
 * `{ "upgradePolicy": "immutable" }` instead would diverge the canonical (the chain
 * re-encodes it as `"Immutable"`) and break the create signature. Adding ANY other dial
 * keeps it a dials object.
 *
 * @example
 * ```ts
 * const policy = constrained({
 *   selfReproducing: false,
 *   maxGenerations: 3,
 *   allowedEffects: ['EMIT', 'TRANSFER'],
 *   sealedStates: ['ARCHIVED'],
 * });
 * ```
 */
export function constrained(dials: FiberPolicyDials): FiberPolicy | undefined {
  const out: Record<string, unknown> = {};
  for (const k of FIBER_POLICY_DIALS) {
    const v = dials[k];
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  const keys = Object.keys(out);
  if (keys.length === 0) return undefined;
  // Canonical collapse: a lone LOWERCASE `upgradePolicy: 'immutable'` (the chain's dial
  // value) IS the `Immutable` variant — emit the capital-I `"Immutable"` tag, not the dials.
  if (keys.length === 1 && out.upgradePolicy === 'immutable') return IMMUTABLE_POLICY;
  return out as FiberPolicy;
}

/**
 * Project an authoring `policy` value onto the wire form. Returns one of:
 *   - `undefined` when the policy is (effectively) `Unconstrained` — i.e. omit the `policy`
 *     key entirely;
 *   - the bare string `"Immutable"` ({@link IMMUTABLE_POLICY}) for the `Immutable` variant
 *     (also the collapse of a lone LOWERCASE `upgradePolicy: 'immutable'`); or
 *   - the minimal `Constrained` dials object otherwise.
 *
 * Centralizes the omit-on-unconstrained AND the Immutable-collapse parity rules so every
 * projection path (`toProtoDefinition`, the genesis manifest) stays consistent.
 */
export function projectFiberPolicy(policy: FiberPolicy | undefined): FiberPolicy | undefined {
  if (policy === undefined || policy === null) return undefined;
  // The Immutable variant is already its canonical bare-string wire form.
  if (policy === IMMUTABLE_POLICY) return IMMUTABLE_POLICY;
  // Re-run the dial filter so a hand-built object with explicit-undefined/empty dials
  // collapses to Unconstrained, and a lone `upgradePolicy: 'immutable'` collapses to
  // `"Immutable"`, exactly like `constrained()` does.
  return constrained(policy);
}

// =============================================================================
// Fiber App Definition
// =============================================================================

export interface FiberAppMetadata {
  name: string;
  app: string;
  type: string;
  version: string;
  description?: string;
  category?: string;
  /** Cross-references to other fiber types (informational) */
  crossReferences?: CrossReferences;
}

export interface CrossReferenceSpec {
  machine: string;
  description: string;
  foreignKey?: string;
}

export interface CrossReferences {
  [key: string]: string | CrossReferenceSpec;
}

export interface FiberAppDefinition<TState extends string = string, TEvent extends string = string> {
  metadata: FiberAppMetadata;

  /**
   * Fiber constitution. Mirrors the chain ADT `FiberPolicy = Unconstrained | Immutable |
   * Constrained(<dials>)`. OMIT this field (the default) for `Unconstrained` — the projected
   * wire definition then has NO `policy` key. Set it to `immutable()` to permanently lock the
   * definition (projects to the bare string `"Immutable"`). Set it to a `constrained({...})`
   * object to declare a subset of the 14 dials; unset dials are stripped so the wire form
   * matches the chain's `dropNulls`-stripped `Constrained` byte-for-byte (and a lone
   * `upgradePolicy: 'immutable'` collapses to `"Immutable"`).
   */
  policy?: FiberPolicy;

  /** Schema for fiber creation inputs (user-provided) */
  createSchema?: {
    required?: readonly string[];
    properties: Record<string, SchemaField>;
  };

  /** Schema for full fiber state (includes computed fields) */
  stateSchema?: {
    properties: Record<string, SchemaField>;
  };

  /** Schema for each event's payload */
  eventSchemas?: Record<TEvent, EventSchema>;

  /** Reusable type definitions */
  definitions?: Record<string, SchemaDefinition>;

  /** State machine states */
  states: Record<TState, StateDefinition>;

  /** Initial state */
  initialState: TState;

  /** State transitions */
  transitions: readonly Transition<TState, TEvent>[];
}

// =============================================================================
// Helper: defineFiberApp
// =============================================================================

/**
 * Define a fiber app with full type inference.
 *
 * @example
 * ```ts
 * const agentDef = defineFiberApp({
 *   metadata: { name: 'Agent', app: 'identity', type: 'agent', version: '1.0.0' },
 *   states: {
 *     REGISTERED: { id: 'REGISTERED', isFinal: false },
 *     ACTIVE: { id: 'ACTIVE', isFinal: false },
 *   },
 *   initialState: 'REGISTERED',
 *   transitions: [
 *     { from: 'REGISTERED', to: 'ACTIVE', eventName: 'activate' },
 *   ],
 * });
 * ```
 */
export function defineFiberApp<
  TState extends string,
  TEvent extends string,
  TDef extends FiberAppDefinition<TState, TEvent>,
>(definition: TDef): TDef {
  // Runtime validation could go here
  return definition;
}

// =============================================================================
// Utilities
// =============================================================================

/** Extract state names from a fiber app definition */
export type StateNames<T extends FiberAppDefinition> = keyof T['states'] & string;

/** Extract event names from a fiber app definition */
export type EventNames<T extends FiberAppDefinition> = T['transitions'][number]['eventName'];

/** Get valid transitions from a given state */
export function getTransitionsFrom<T extends FiberAppDefinition>(
  def: T,
  state: StateNames<T>,
): T['transitions'][number][] {
  return def.transitions.filter((t) => t.from === state) as T['transitions'][number][];
}

/** Get valid event names from a given state */
export function getEventsFrom<T extends FiberAppDefinition>(def: T, state: StateNames<T>): string[] {
  return getTransitionsFrom(def, state).map((t) => t.eventName);
}

/** Check if a state is final */
export function isFinalState<T extends FiberAppDefinition>(def: T, state: StateNames<T>): boolean {
  return def.states[state]?.isFinal ?? false;
}

/** Convert definition to plain JSON (for serialization) */
export function toJSON<T extends FiberAppDefinition>(def: T): object {
  return JSON.parse(JSON.stringify(def));
}

/**
 * Proto-compatible state machine definition for metagraph submission.
 * Matches StateMachineDefinition from ottochain/v1/fiber.proto
 */
export interface ProtoStateMachineDefinition {
  states: Record<string, { id: string; isFinal: boolean }>;
  initialState: string;
  transitions: Array<{
    from: string;
    to: string;
    eventName: string;
    guard?: unknown;
    effect?: unknown;
    // Always present, always a UUID-string array (chain `Set[UUID]`, required-no-default).
    // No `emits` — the chain `Transition` has no such field; declared emits are stripped here.
    dependencies: string[];
  }>;
  metadata?: Record<string, unknown>;
  /**
   * Fiber constitution. PRESENT for `Constrained` (a bare object of the SET dials) and for
   * `Immutable` (the bare string `"Immutable"`); ABSENT for `Unconstrained`. This
   * omit-on-unconstrained rule is the wire parity contract: the chain emits no `policy` key
   * for `Unconstrained`, so neither may the SDK, or the signature breaks (HTTP 400). See
   * {@link projectFiberPolicy}.
   */
  policy?: FiberPolicy;
}

/**
 * Extract proto-compatible StateMachineDefinition from a FiberAppDefinition.
 * Use this when submitting to the metagraph.
 *
 * @example
 * ```ts
 * const def = getContractDefinition('agreement');
 * const protoDef = toProtoDefinition(def);
 * // Submit protoDef to metagraph
 * ```
 */
export function toProtoDefinition<T extends FiberAppDefinition>(def: T): ProtoStateMachineDefinition {
  // Extract only the proto-compatible fields
  // NOTE: guard and effect are REQUIRED by the Scala Transition case class (no defaults)
  const protoDef: ProtoStateMachineDefinition = {
    states: {},
    initialState: def.initialState,
    transitions: def.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      eventName: t.eventName,
      guard: t.guard, // Required - Scala has no default
      effect: t.effect, // Required - Scala has no default
      // Chain `Transition.dependencies: Set[UUID]` is REQUIRED (no Scala default), and each
      // element must be a fiber UUID string. A `DependencySpec` object is a build-time-only
      // authoring affordance with no wire representation (concrete dependency UUIDs are per
      // instance, not part of the definition template), so drop non-string entries. Always
      // emit the array — omitting a no-default field diverges the canonical and the chain
      // rejects the whole update (InvalidSignature / decode failure).
      dependencies: (t.dependencies ?? []).filter((d): d is string => typeof d === 'string'),
    })),
  };

  // Copy states (only id and isFinal)
  for (const [key, state] of Object.entries(def.states)) {
    protoDef.states[key] = {
      id: state.id,
      isFinal: state.isFinal,
    };
  }

  // NOTE: `def.metadata` is the SDK's FiberAppMetadata (name/app/type/version — app-routing
  // packaging info), NOT chain metadata. Projecting it onto the wire would make the on-chain
  // canonical + the registry `logicHash` depend on packaging fields (changing `description` would
  // change the signed digest of an otherwise-identical machine), so it is deliberately NOT emitted
  // (the chain's `StateMachineDefinition.metadata` stays absent → `None`). A caller that genuinely
  // needs on-chain metadata sets `ProtoStateMachineDefinition.metadata` explicitly after conversion.

  // Fiber constitution. OMIT the `policy` key entirely for `Unconstrained` (the chain
  // emits nothing for it); emit the bare string `"Immutable"` for `Immutable`; emit a bare
  // object of only the SET dials for `Constrained`. `projectFiberPolicy` returns `undefined`
  // for an (effectively) unconstrained policy, so we assign only when it is a real policy —
  // keeping the wire byte-for-byte identical to the chain's encoding.
  const policy = projectFiberPolicy(def.policy);
  if (policy !== undefined) {
    protoDef.policy = policy;
  }

  return protoDef;
}
