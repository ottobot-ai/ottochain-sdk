/**
 * Ottochain-specific type definitions
 *
 * TypeScript interfaces matching the wire format from the Scala metagraph.
 * The JSON Logic engine stores state as plain JSON - no wrapper objects.
 *
 * @see modules/models/src/main/scala/xyz/kd5ujc/schema/
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Re-export primitive types from src/types.ts
// ---------------------------------------------------------------------------

export type { Address, FiberId, StateId, HashValue, FiberOrdinal, SnapshotOrdinal, Timestamp } from '../types.js';

// ---------------------------------------------------------------------------
// JSON Logic types
// ---------------------------------------------------------------------------

/**
 * JSON logic value - arbitrary JSON data used for state data and payloads.
 */
export type JsonLogicValue = unknown;

/**
 * JSON logic expression - a JsonLogic program definition.
 */
export type JsonLogicExpression = unknown;

// ---------------------------------------------------------------------------
// Fiber status
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of a fiber.
 * Wire format: UPPERCASE string (chain `FiberStatus` is enumeratum `Uppercase`):
 * `ACTIVE` | `ARCHIVED` | `FAILED`. Used both as the `record.status` value and as
 * the `?status=` query filter on the ML0 fiber endpoints.
 *
 * @see modules/models/.../schema/fiber/FiberStatus.scala
 */
export type FiberStatus = 'ACTIVE' | 'ARCHIVED' | 'FAILED';

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

/**
 * Access control policy for scripts.
 * Wire format: discriminated union with type key.
 */
export type AccessControlPolicy =
  { Public: Record<string, never> } | { Whitelist: { addresses: string[] } } | { FiberOwned: { fiberId: string } };

// ---------------------------------------------------------------------------
// State machine definition
// ---------------------------------------------------------------------------

/**
 * Definition of a state machine's structure and transitions.
 * Wire format: plain JSON object with string initialState.
 */
export interface StateMachineDefinition {
  states: Record<string, unknown>;
  initialState: string; // Plain string, not { value: string }
  transitions: unknown[];
  metadata?: JsonLogicValue;
}

// ---------------------------------------------------------------------------
// Registry: versioning, naming, and schema shapes
// ---------------------------------------------------------------------------

/**
 * Semantic version `MAJOR.MINOR.PATCH`.
 * Wire format: plain string (e.g. "1.0.0"). Also used as a JSON map key.
 *
 * @see modules/models/.../schema/registry/SemVer.scala
 */
export type SemVer = string;

/**
 * Lifecycle status of a registered version (npm/Cargo-style).
 * Wire format: uppercase string (enumeratum `Uppercase`).
 *
 *  - `ACTIVE`     — selectable + recommended.
 *  - `DEPRECATED` — still resolvable/runnable, flagged, discouraged for new instances.
 *  - `YANKED`     — excluded from NEW resolutions; existing pinned fibers keep running.
 *
 * @see modules/models/.../schema/registry/RegistryStatus.scala
 */
export type RegistryStatus = 'ACTIVE' | 'DEPRECATED' | 'YANKED';

/**
 * A caller's version requirement, resolved against a {@link VersionLineage} (Cargo/npm-style).
 * Wire format: single-key wrapper object (sealed-trait encoding).
 *
 *  - `Exact`      — exactly this version: `{"Exact":{"version":"1.0.0"}}`.
 *  - `Caret`      — same MAJOR and `>= v` (`^1.2.0`).
 *  - `Tilde`      — same MAJOR.MINOR and `>= v` (`~1.2.0`).
 *  - `Latest`     — highest selectable version: `{"Latest":{}}`.
 *  - `PinnedHash` — the exact artifact by schema hash, version-agnostic.
 *
 * @see modules/models/.../schema/registry/VersionReq.scala
 */
export type VersionReq =
  | { Exact: { version: SemVer } }
  | { Caret: { version: SemVer } }
  | { Tilde: { version: SemVer } }
  | { Latest: Record<string, never> }
  | { PinnedHash: { schemaHash: string } };

/**
 * A caller's reference to a registered schema/program version, supplied at fiber creation
 * (`CreateStateMachine.schemaRef`). The chain resolves `version` against the registry at create time.
 * Wire format: `{"name":"counter.package","version":{"Exact":{"version":"1.0.0"}}}`.
 *
 * @see modules/models/.../schema/registry/SchemaRef.scala
 */
export interface SchemaRef {
  /** Full registry name `labels.tld` (e.g. "counter.package"). */
  name: string;
  version: VersionReq;
}

/**
 * One field of a {@link MessageShape} — mirrors a protobuf `FieldDescriptorProto`
 * at the field level (name + field number + type).
 * Wire format: `repeated`/`optional` are REQUIRED Booleans with NO chain default. The
 * SDK MUST send them — they ride inside the signed `MachineShape`/`ScriptShape` payload,
 * and omitting a no-default field diverges the canonical (decode failure / InvalidSignature).
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface FieldShape {
  name: string;
  number: number;
  typeName: string;
  repeated: boolean;
  optional: boolean;
}

/**
 * A single protobuf message shape: its type name plus its fields.
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface MessageShape {
  typeName: string;
  fields: FieldShape[];
}

/**
 * The on-chain projection of a STATE-MACHINE version's proto schema: the State message
 * plus one message per command/event (keyed by event name). Publisher-claimed and advisory.
 * (Chain `MachineShape`; supersedes the old loose `SchemaShape`.)
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface MachineShape {
  stateMessage: MessageShape;
  /** One message per command/event, keyed by event name. */
  commands: Record<string, MessageShape>;
}

/**
 * The on-chain projection of a SCRIPT version's surface. Chain `ScriptShape` is a sealed
 * ADT with one variant today, `MethodDispatch`, encoded directly as `{ methods: {...} }`
 * (the `methods` key discriminates from future variants).
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface ScriptShape {
  /** One {@link MessageShape} per callable method, keyed by method name. */
  methods: Record<string, MessageShape>;
}

/**
 * The advisory schema projection stored in a {@link RegisteredVersion}, discriminated by
 * inner field names (no explicit tag): `machineShape` (state-machine package), `scriptShape`
 * (script package), or the AssetPolicy fields (`behavior`/`supply`/`morphisms`/`stateShape`).
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala (RegistryShape ADT)
 */
export type RegistryShape =
  | { machineShape: MachineShape }
  | { scriptShape: ScriptShape }
  // AssetPolicy package projection (asset-model.md §5a).
  | {
      behavior: TokenBehavior;
      supply: SupplyPolicy;
      morphisms: Record<string, MorphismSpec>;
      stateShape: MessageShape;
    };

/**
 * The resolved, pinned binding recorded on a fiber: which registry (name, version) it
 * instantiates, with the committed hashes. Resolved once at create, then immutable.
 *
 * @see modules/models/.../schema/registry/SchemaBinding.scala
 */
export interface SchemaBinding {
  /** Full registry name `labels.tld`. */
  name: string;
  version: SemVer;
  /** Commitment to the protobuf FileDescriptorSet (descriptor bytes; off-chain). */
  schemaHash: string;
  /** The verified-binding anchor: `StateMachineDefinition.computeDigest` of the logic. */
  logicHash: string;
}

/**
 * One immutable version of a registry entry. The chain commits only the hashes + the
 * typed {@link RegistryShape} projection (never the descriptor or definition bytes).
 * Wire format: `strict` is a REQUIRED Boolean (the chain has no default — read responses
 * always carry it, and signed publish messages MUST send it).
 *
 * @see modules/models/.../schema/registry/RegisteredVersion.scala
 */
export interface RegisteredVersion {
  version: SemVer;
  /** Commitment to the protobuf FileDescriptorSet (descriptor bytes; off-chain). */
  schemaHash: string;
  /** The verified-binding anchor: `StateMachineDefinition.computeDigest` of the logic. */
  logicHash: string;
  /** The kind-correct advisory projection (Machine | Script | AssetPolicy). */
  shape: RegistryShape;
  status: RegistryStatus;
  /** Snapshot ordinal at which this version was registered. */
  registeredAt: number;
  /** Opt-in runtime conformance gate (#33). Required on the wire. */
  strict: boolean;
}

/**
 * The append-only, monotonic version lineage of a single registry entry.
 * Wire format: `versions` is a SemVer-string-keyed map of {@link RegisteredVersion}.
 *
 * @see modules/models/.../schema/registry/VersionLineage.scala
 */
export interface VersionLineage {
  /** SemVer-string keyed map of registered versions. */
  versions: Record<string, RegisteredVersion>;
}

/**
 * What a registry entry resolves to, discriminated by the name's TLD.
 * Wire format: single-key wrapper object (sealed-trait encoding).
 *
 *  - `SchemaPackage` (`.package`) — a versioned schema/program type (its {@link VersionLineage}).
 *    Note the double-nesting: `SchemaPackage.versions` is a {@link VersionLineage} whose
 *    own `.versions` is the SemVer-keyed map, e.g.
 *    `{"SchemaPackage":{"versions":{"versions":{"1.0.0":{...}}}}}`.
 *  - `InstanceAlias` (`.machine` / `.script`) — a nickname for an existing fiber (#29).
 *
 * @see modules/models/.../schema/registry/RegistryTarget.scala
 */
export type RegistryTarget =
  | { SchemaPackage: { versions: VersionLineage } }
  | { InstanceAlias: { fiberId: string } }
  // `.asset` name → a versioned asset-policy type (each version's shape is RegistryShape.AssetPolicy).
  | { AssetPolicyPackage: { versions: VersionLineage } };

/**
 * A single owned entry in the registry namespace: a name -> a discriminated
 * {@link RegistryTarget}, with the owning addresses and an optional off-chain metadata grab-bag.
 * Wire format: `metadata` defaults to `{}` and is omittable.
 *
 * @see modules/models/.../schema/registry/RegistryEntry.scala
 */
export interface RegistryEntry {
  /** Full registry name `labels.tld`. */
  name: string;
  /** Owning DAG addresses (who may publish versions / change status / transfer). */
  owner: string[];
  target: RegistryTarget;
  /** Optional off-chain links grab-bag (e.g. "repo"/"homepage" -> URL). */
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Log entries (FiberLogEntry)
// ---------------------------------------------------------------------------

/**
 * Event emitted by a state machine transition trigger.
 */
export interface EmittedEvent {
  name: string;
  data: JsonLogicValue;
  destination?: string;
}

/**
 * Receipt of a state machine event processing.
 * Wire format: all ordinals/states are plain primitives.
 */
export interface EventReceipt {
  fiberId: string;
  sequenceNumber: number; // Plain number
  eventName: string;
  ordinal: number; // Plain number (snapshot ordinal)
  fromState: string; // Plain string
  toState: string; // Plain string
  success: boolean;
  gasUsed: number;
  triggersFired: number;
  errorMessage?: string;
  sourceFiberId?: string;
  emittedEvents: EmittedEvent[];
}

/**
 * Log entry for a script invocation.
 */
export interface ScriptInvocation {
  fiberId: string;
  method: string;
  args: JsonLogicValue;
  result: JsonLogicValue;
  gasUsed: number;
  invokedAt: number; // Plain number (snapshot ordinal)
  invokedBy: string; // Plain string (address)
}

/**
 * Birth record for a fiber, emitted once at creation. Records the resolved registry
 * binding (name@version + committed hashes) when instantiated from a registered version
 * (#26), or omits it for an ad-hoc fiber. Seeds the audit-trail rendering (#30).
 *
 * @see modules/models/.../schema/fiber/FiberLogEntry.scala
 */
export interface CreationReceipt {
  fiberId: string;
  ordinal: number; // Plain number (snapshot ordinal)
  initialState: string; // Plain string (state id)
  owners: string[]; // Plain string array (addresses)
  schemaBinding?: SchemaBinding;
  parentFiberId?: string;
}

/**
 * Emitted when a fiber is upgraded to a different registered version (#27). Records the
 * binding change (from -> to) and whether a state migration ran.
 *
 * @see modules/models/.../schema/fiber/FiberLogEntry.scala
 */
export interface UpgradeReceipt {
  fiberId: string;
  ordinal: number; // Plain number (snapshot ordinal)
  /** Prior binding; absent for a fiber that had no registry binding before the upgrade. */
  fromBinding?: SchemaBinding;
  toBinding: SchemaBinding;
  gasUsed: number;
  migrated: boolean;
}

/**
 * Emitted when an update that reached `combine` is rejected by a deterministic business rule
 * (unauthorized, non-monotonic, sequence-number mismatch, conformance violation, reserved label).
 * The update does NOT mutate state — this is the on-chain, auditable record that it was processed
 * and rejected, and the ONLY signal distinguishing "submitted-but-rejected" from "not-yet-processed".
 * `fiberId` is the update's routing id (target fiber, or the registry routing id for registry ops).
 *
 * @see modules/models/.../schema/fiber/FiberLogEntry.scala
 */
export interface RejectionReceipt {
  fiberId: string;
  ordinal: number;
  /** The rejected update's message name (e.g. "TransitionStateMachine"). */
  updateType: string;
  reason: string;
}

/**
 * Union type for all fiber log entries.
 */
export type FiberLogEntry = EventReceipt | ScriptInvocation | CreationReceipt | UpgradeReceipt | RejectionReceipt;

// ---------------------------------------------------------------------------
// Fiber records
// ---------------------------------------------------------------------------

/**
 * On-chain record for a state machine fiber.
 * Wire format: all ordinals/states/hashes are plain primitives.
 */
export interface StateMachineFiberRecord {
  fiberId: string;
  creationOrdinal: number;
  previousUpdateOrdinal: number;
  latestUpdateOrdinal: number;
  definition: StateMachineDefinition;
  currentState: string; // Plain string
  stateData: JsonLogicValue;
  stateDataHash: string; // Plain string
  sequenceNumber: number;
  owners: string[]; // Plain string array (addresses)
  status: FiberStatus;
  lastReceipt?: EventReceipt;
  parentFiberId?: string;
  childFiberIds: string[];
  /** The resolved, pinned registry binding (#26), present when created from a registered version. */
  schemaBinding?: SchemaBinding;
  /** DAG addresses authorized to sign transitions (multi-party); seeded from `CreateStateMachine.participants`. */
  authorizedSigners?: string[];
}

/**
 * On-chain record for a script fiber.
 */
export interface ScriptFiberRecord {
  fiberId: string;
  creationOrdinal: number;
  latestUpdateOrdinal: number;
  scriptProgram: JsonLogicExpression;
  stateData?: JsonLogicValue;
  stateDataHash?: string; // Plain string
  accessControl: AccessControlPolicy;
  sequenceNumber: number;
  owners: string[]; // Plain string array
  status: FiberStatus;
  lastInvocation?: ScriptInvocation;
  /** The resolved, pinned registry binding, present when created from a registered version. */
  schemaBinding?: SchemaBinding;
}

/**
 * Union type for all fiber records.
 */
export type FiberRecord = StateMachineFiberRecord | ScriptFiberRecord;

// ---------------------------------------------------------------------------
// On-chain state
// ---------------------------------------------------------------------------

/**
 * Commit hash for a single fiber in the on-chain state.
 */
export interface FiberCommit {
  recordHash: string; // Plain string
  stateDataHash?: string; // Plain string
  sequenceNumber: number;
}

/**
 * Full on-chain state of the ottochain metagraph.
 */
export interface OnChain {
  fiberCommits: Record<string, FiberCommit>;
  latestLogs: Record<string, FiberLogEntry[]>;
  /** Per-registry-entry commitment hash, keyed by full registry name `labels.tld`. */
  registryCommits: Record<string, string>;
  /** Per-asset L1 fast-path commit (behavior bits + sequence), keyed by asset UUID. */
  assetCommits: Record<string, AssetCommit>;
}

// ---------------------------------------------------------------------------
// Calculated state
// ---------------------------------------------------------------------------

/**
 * Full calculated state (served by ML0 /v1/ endpoints).
 */
export interface CalculatedState {
  stateMachines: Record<string, StateMachineFiberRecord>;
  scripts: Record<string, ScriptFiberRecord>;
  /** Registry namespace, keyed by full registry name `labels.tld`. */
  registry: Record<string, RegistryEntry>;
  /** Reverse records (#29): fiber UUID -> its canonical registered name. */
  reverseNames: Record<string, string>;
  /** Asset instances (asset-model §5b): asset UUID -> AssetRecord (a dedicated record, not a fiber). */
  assets: Record<string, AssetRecord>;
  /** Used commit-reveal nonces per asset UUID; bounded (pruned past expiresAt in combine). */
  usedNonces: Record<string, number[]>;
}

// ---------------------------------------------------------------------------
// Message types (OttochainMessage / DataUpdate payloads)
// ---------------------------------------------------------------------------

/**
 * Create a new state machine fiber.
 */
export interface CreateStateMachine {
  fiberId: string;
  definition: StateMachineDefinition;
  initialData: JsonLogicValue;
  parentFiberId?: string | null;
  /** Optional set of DAG addresses authorized to sign transitions (multi-party signing). */
  participants?: string[] | null;
  /**
   * Optional reference to a registered schema/program version (#26). When present, the chain
   * resolves it against the registry at create time and records the verified {@link SchemaBinding}.
   */
  schemaRef?: SchemaRef | null;
}

/**
 * Trigger a state machine transition.
 */
export interface TransitionStateMachine {
  fiberId: string;
  eventName: string;
  payload: JsonLogicValue;
  targetSequenceNumber: number;
}

/**
 * Archive a state machine fiber.
 */
export interface ArchiveStateMachine {
  fiberId: string;
  targetSequenceNumber: number;
}

/**
 * Create a new script fiber.
 */
export interface CreateScript {
  fiberId: string;
  scriptProgram: JsonLogicExpression;
  initialState?: JsonLogicValue;
  accessControl: AccessControlPolicy;
}

/**
 * Invoke a script method.
 */
export interface InvokeScript {
  fiberId: string;
  method: string;
  args: JsonLogicValue;
  targetSequenceNumber: number;
}

/**
 * Upgrade an existing script fiber to a different registered version of the SAME package.
 * The chain verifies `newProgram` hashes to the target version's `logicHash`, applies the
 * optional `migration` (a JSON-Logic transform of the prior state data), and re-pins the binding.
 */
export interface UpgradeScript {
  fiberId: string;
  targetRef: SchemaRef;
  newProgram: JsonLogicExpression;
  /** Optional JSON-Logic transform applied to the prior state data during upgrade. */
  migration?: JsonLogicExpression;
  targetSequenceNumber: number;
}

/**
 * Upgrade an existing fiber to a different registered version of the SAME package (#27).
 * The chain verifies `newDefinition` hashes to the target version's `logicHash`, applies the
 * optional `migration` (a JSON-Logic transform of the prior state data), preserves the current
 * state id, and re-pins the binding.
 */
export interface UpgradeFiber {
  fiberId: string;
  targetRef: SchemaRef;
  newDefinition: StateMachineDefinition;
  /** Optional JSON-Logic transform applied to the prior state data during upgrade. */
  migration?: JsonLogicExpression;
  targetSequenceNumber: number;
}

/**
 * Create-or-append a registry version for a STATE-MACHINE package (npm-publish semantics): the
 * first publish for a name claims it and makes the signer the owner; later publishes require an
 * existing owner. The chain split the old `PublishVersion` into machine/script variants — this is
 * the machine half.
 *
 * Note: `fiberId` is NOT on the wire — the chain derives the routing id from `name`.
 */
export interface PublishMachineVersion {
  /** Full registry name `labels.tld` (e.g. "order.package"). */
  name: string;
  version: SemVer;
  /** Base64 of the proto FileDescriptorSet; the chain base64-validates + hashes it, then drops the bytes. */
  schemaB64: string;
  /** The typed proto projection the chain stores for discovery (advisory). */
  machineShape: MachineShape;
  /** The typed JSON-Logic state machine; hashed into `logicHash` for verified binding (#37). */
  definition: StateMachineDefinition;
  /** Opt-in runtime conformance gate (#33). REQUIRED — the chain has no default; omitting it diverges the signed canonical. */
  strict: boolean;
  /** Optional off-chain links grab-bag set on the entry at first publish; omittable (`None`). */
  metadata?: Record<string, string>;
}

/**
 * Create-or-append a registry version for a SCRIPT package — parallel to {@link PublishMachineVersion}
 * but carrying a `scriptProgram` (JSON-Logic) instead of a state-machine `definition`.
 *
 * Note: `fiberId` is NOT on the wire — the chain derives the routing id from `name`.
 */
export interface PublishScriptVersion {
  /** Full registry name `labels.tld`. */
  name: string;
  version: SemVer;
  /** Base64 of the proto FileDescriptorSet; the chain base64-validates + hashes it, then drops the bytes. */
  schemaB64: string;
  /** The typed method-surface projection the chain stores for discovery (advisory). */
  scriptShape: ScriptShape;
  /** The typed JSON-Logic script; hashed into `logicHash` for verified binding (#37). */
  scriptProgram: JsonLogicExpression;
  /** Opt-in runtime conformance gate (#33). REQUIRED — omitting it diverges the signed canonical. */
  strict: boolean;
  /** Optional off-chain links grab-bag; omittable (`None`). */
  metadata?: Record<string, string>;
}

/**
 * Change a registered version's lifecycle status (Active <-> Deprecated -> Yanked). Owner-gated.
 */
export interface SetVersionStatus {
  /** Full registry name `labels.tld`. */
  name: string;
  version: SemVer;
  status: RegistryStatus;
}

/**
 * Register a human-readable nickname for an existing fiber (#29). The name's TLD must be
 * `.machine` or `.script` and match the target fiber's kind; the signer must own the target.
 *
 * Note: `fiberId` is NOT on the wire — the chain derives the routing id from `name`.
 */
export interface RegisterAlias {
  /** Full registry name `labels.tld` (e.g. "my-escrow.machine"). */
  name: string;
  /** The existing fiber UUID this alias points at. */
  targetFiberId: string;
  /** Optional off-chain links grab-bag; defaults to `{}`, omittable. */
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Asset model (asset-model.md) — types
// ---------------------------------------------------------------------------

/**
 * Typed asset morphism verb. Wire form: the UPPERCASE entry name (also used as a `morphisms` map key).
 * @see modules/models/.../schema/asset/MorphismKind.scala
 */
export type MorphismKind = 'TRANSFER' | 'BURN' | 'FRACTIONALIZE' | 'COMPOSE' | 'DECOMPOSE' | 'POOL' | 'WRAP' | 'STAKE';

/**
 * Access-control level of one morphism on an asset policy. Wire form: UPPERCASE entry name.
 * @see modules/models/.../schema/asset/MorphismVisibility.scala
 */
export type MorphismVisibility = 'PUBLIC' | 'GOVERNED' | 'DISABLED';

/**
 * A token's 5-bit behavioral capability surface, packed into a single Int (the wire form):
 * `T=16` transferable, `S=8` splittable, `C=4` combinable, `E=2` expirable, `G=1` governable
 * (e.g. NFT=16, Fungible=28, FullFeatured=31). Matches `AssetCommit.behavior`.
 * @see modules/models/.../schema/asset/TokenBehavior.scala
 */
export type TokenBehavior = number;

/** Bit weights for {@link TokenBehavior} (T=16, S=8, C=4, E=2, G=1). */
export const TOKEN_BEHAVIOR_BITS = {
  transferable: 16,
  splittable: 8,
  combinable: 4,
  expirable: 2,
  governable: 1,
} as const;

/**
 * Supply authority for an asset policy version (orthogonal to instance {@link TokenBehavior}).
 * All fields omittable (`None`).
 * @see modules/models/.../schema/asset/SupplyPolicy.scala
 */
export interface SupplyPolicy {
  /** Hard cap on derived total supply; omit = uncapped. */
  maxSupply?: number;
  /** JSON-Logic predicate gating new supply; omit = minting closed after genesis. */
  mintPolicy?: JsonLogicExpression;
  /** JSON-Logic predicate gating destruction; omit = no burning. */
  burnPolicy?: JsonLogicExpression;
  /** Fractional precision for splittable fungibles; omit/0 for NFTs. */
  decimals?: number;
}

/**
 * Per-morphism policy spec, layered on the morphism's fixed structural domain guard.
 * `visibility` is REQUIRED; the allowlist/guard refinements are omittable.
 * @see modules/models/.../schema/asset/MorphismSpec.scala
 */
export interface MorphismSpec {
  visibility: MorphismVisibility;
  /** Counter-party policy allowlist (registry names); omit = any. */
  allowedPolicies?: string[];
  /** Counter-party behavior-bitmask allowlist (packed {@link TokenBehavior} ints); omit = any. */
  allowedTypes?: number[];
  /** Optional extra JSON-Logic predicate — the `witness`-gated guard lives here. */
  guard?: JsonLogicExpression;
}

/**
 * Who holds an asset instance: an ordinary wallet, or a live fiber (escrow / pool / vault).
 * Wire form: single-key variant `{"Wallet":{"address":..}}` / `{"Fiber":{"fiberId":..}}`.
 * @see modules/models/.../schema/asset/AssetHolder.scala
 */
export type AssetHolder = { Wallet: { address: string } } | { Fiber: { fiberId: string } };

/**
 * Cross-chain provenance for a bridged-in (wrapped) asset (the IBC denom-trace analogue).
 * @see modules/models/.../schema/asset/OriginProvenance.scala
 */
export interface OriginProvenance {
  originChainId: string;
  originAssetRef: string;
  fullPath: string[];
  attestationHash: string;
}

/**
 * The committed snapshot of ONE component consumed into a composite at `Compose` — the reveal
 * witness that makes `Decompose` a faithful retraction (rides `ApplyMorphism.priorComponents`).
 * @see modules/models/.../schema/asset/ComponentWitness.scala
 */
export interface ComponentWitness {
  assetId: string;
  schemaBinding: SchemaBinding;
  behavior: TokenBehavior;
  holder: AssetHolder;
  amount: number;
  expiresAt?: number;
  componentFiberIds?: string[];
  componentsCommitment?: string;
  provenance?: OriginProvenance;
}

/**
 * An asset INSTANCE record (NOT a fiber). Lives in {@link CalculatedState} `assets`; its behavior
 * lives in the bound policy version, pinned via {@link SchemaBinding}.
 * @see modules/models/.../schema/Records.scala (AssetRecord)
 */
export interface AssetRecord {
  assetId: string;
  schemaBinding: SchemaBinding;
  behavior: TokenBehavior;
  holder: AssetHolder;
  amount: number;
  sequenceNumber: number;
  creationOrdinal: number;
  latestUpdateOrdinal: number;
  expiresAt?: number;
  /** Present iff this is a composite (stored verbatim for retraction). */
  componentFiberIds?: string[];
  /** Digest of the canonical component-witness list; present iff composite. */
  componentsCommitment?: string;
  /** Set on a component folded into a composite. */
  parentCompositeId?: string;
  provenance?: OriginProvenance;
}

/**
 * The on-chain L1 fast-path commit for an asset instance — a safe subset (packed behavior bits +
 * sequence) so L1 can structurally reject impossible morphisms without a `CalculatedState`
 * round-trip. `behavior` is advisory/stale; the combiner re-derives from `CalculatedState.assets`.
 * @see modules/models/.../schema/OnChain.scala (AssetCommit)
 */
export interface AssetCommit {
  /** Packed {@link TokenBehavior} bits (advisory). */
  behavior: TokenBehavior;
  sequenceNumber: number;
  recordHash: string;
  /** Phase-6 interop double-wrap fast-reject discriminator. */
  origin?: string;
}

// ---------------------------------------------------------------------------
// Asset model — signed operations (asset-model.md §7)
// ---------------------------------------------------------------------------

/**
 * Publish an asset-policy PACKAGE version (npm-publish semantics, parallel to {@link PublishMachineVersion}).
 * `morphisms` is REQUIRED (presence required; emptiness is meaningful, never decoder-defaulted).
 * Note: `fiberId` is NOT on the wire — the chain derives the routing id from `name`.
 */
export interface CreateAssetPolicy {
  name: string;
  version: SemVer;
  behavior: TokenBehavior;
  supply: SupplyPolicy;
  /** Per-kind morphism specs, keyed by the UPPERCASE {@link MorphismKind}. Required (may be empty). */
  morphisms: Record<string, MorphismSpec>;
  stateShape: MessageShape;
  metadata?: Record<string, string>;
}

/** Mint a new asset INSTANCE against a resolved policy version. */
export interface MintAsset {
  assetId: string;
  policyRef: SchemaRef;
  holder: AssetHolder;
  amount: number;
  expiresAt?: number;
  provenance?: OriginProvenance;
  /**
   * ZkVerify-gated mint: optional proof / Merkle-membership witness the policy's `mintPolicy` guard
   * reads under the reserved `witness` context key (e.g. `groth16_verify` / `pmt_verify`).
   */
  witness?: JsonLogicValue;
}

/**
 * Apply a typed morphism to an asset instance. Sequenced by `(assetId, targetSequenceNumber)`.
 * Optional fields carry per-kind directives (recipient for Transfer/Wrap; otherAssetIds + compositeId
 * for Compose; shardIds for Fractionalize; nonce for a commit-reveal symmetric Compose;
 * priorComponents is the Decompose reveal witness).
 *
 * C2 — cross-holder Compose/Pool consent is MANDATORY. As of the fiber-engine permissionless-hardening
 * (chain branch `fix/fiber-engine-permissionless-hardening`, audit finding C2) a `Compose`/`Pool` that
 * folds in a counter-party the signer does NOT hold is REJECTED (graceful `CombineRejected`) UNLESS a
 * live {@link AuthorizeCompose} nonce authorizes that counter-party. A SAME-holder compose (every part in
 * `otherAssetIds` is signer-owned) still needs no nonce. `otherAssetIds` may no longer contain duplicates
 * or the `assetId` itself (the old self/duplicate-inflation path is rejected).
 */
export interface ApplyMorphism {
  assetId: string;
  kind: MorphismKind;
  targetSequenceNumber: number;
  recipient?: AssetHolder;
  /**
   * Compose/Pool counter-party asset ids folded into the composite. Each id the signer does NOT hold is a
   * CROSS-HOLDER part and now REQUIRES a live {@link AuthorizeCompose} nonce (see `nonce`) authorizing it
   * — else the whole morphism is rejected (C2). Must be free of duplicates and must not include `assetId`.
   */
  otherAssetIds?: string[];
  compositeId?: string;
  shardIds?: string[];
  /**
   * The cross-holder Compose consent nonce: the reveal half of the {@link AuthorizeCompose} handshake.
   * REQUIRED whenever any `otherAssetIds` entry is not signer-owned (C2); omit it only for a same-holder
   * compose. A nonce-less cross-holder compose is no longer accepted.
   */
  nonce?: number;
  priorComponents?: ComponentWitness[];
  /** ZkVerify-gated morphism: optional witness a `Governed` morphism's guard reads (see {@link MorphismSpec}). */
  witness?: JsonLogicValue;
}

/**
 * Authorize a counter-party policy to Compose with this asset (the commit half of the commit-reveal
 * symmetric-compose handshake). `nonce` and `expiresAt` are REQUIRED (no sentinel defaults).
 *
 * C2 — this consent is now MANDATORY, not opt-in. A `Compose`/`Pool` ({@link ApplyMorphism}) that consumes
 * a counter-party the signer does not own is rejected unless a matching, unexpired `AuthorizeCompose` nonce
 * is live for that counter-party (chain branch `fix/fiber-engine-permissionless-hardening`, finding C2).
 * The composing party echoes this `nonce` in `ApplyMorphism.nonce`. A same-holder compose needs none.
 */
export interface AuthorizeCompose {
  assetId: string;
  partnerPolicyId: string;
  nonce: number;
  expiresAt: number;
  targetSequenceNumber: number;
}

/**
 * Union type for all ottochain messages.
 * JSON is wrapped as `{ MessageName: { ...fields } }`.
 */
export type OttochainMessage =
  | { CreateStateMachine: CreateStateMachine }
  | { TransitionStateMachine: TransitionStateMachine }
  | { ArchiveStateMachine: ArchiveStateMachine }
  | { UpgradeFiber: UpgradeFiber }
  | { CreateScript: CreateScript }
  | { InvokeScript: InvokeScript }
  | { UpgradeScript: UpgradeScript }
  | { PublishMachineVersion: PublishMachineVersion }
  | { PublishScriptVersion: PublishScriptVersion }
  | { SetVersionStatus: SetVersionStatus }
  | { RegisterAlias: RegisterAlias }
  | { CreateAssetPolicy: CreateAssetPolicy }
  | { MintAsset: MintAsset }
  | { ApplyMorphism: ApplyMorphism }
  | { AuthorizeCompose: AuthorizeCompose };

/**
 * Names of all valid OttochainMessage types.
 * Use this for runtime validation (e.g., in API routes).
 */
export const OTTOCHAIN_MESSAGE_TYPES = [
  'CreateStateMachine',
  'TransitionStateMachine',
  'ArchiveStateMachine',
  'UpgradeFiber',
  'CreateScript',
  'InvokeScript',
  'UpgradeScript',
  'PublishMachineVersion',
  'PublishScriptVersion',
  'SetVersionStatus',
  'RegisterAlias',
  'CreateAssetPolicy',
  'MintAsset',
  'ApplyMorphism',
  'AuthorizeCompose',
] as const;

/**
 * Type representing valid message type names.
 */
export type OttochainMessageType = (typeof OTTOCHAIN_MESSAGE_TYPES)[number];
