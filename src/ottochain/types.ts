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

export type {
  Address,
  FiberId,
  StateId,
  HashValue,
  FiberOrdinal,
  SnapshotOrdinal,
  Timestamp,
} from '../types.js';

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
 * Wire format: plain string.
 */
export type FiberStatus = 'Active' | 'Archived' | 'Failed';

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

/**
 * Access control policy for scripts.
 * Wire format: discriminated union with type key.
 */
export type AccessControlPolicy =
  | { Public: Record<string, never> }
  | { Whitelist: { addresses: string[] } }
  | { FiberOwned: { fiberId: string } };

// ---------------------------------------------------------------------------
// State machine definition
// ---------------------------------------------------------------------------

/**
 * Definition of a state machine's structure and transitions.
 * Wire format: plain JSON object with string initialState.
 */
export interface StateMachineDefinition {
  states: Record<string, unknown>;
  initialState: string;  // Plain string, not { value: string }
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
 * Wire format: `repeated`/`optional` default to `false` and are omittable.
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface FieldShape {
  name: string;
  number: number;
  typeName: string;
  repeated?: boolean;
  optional?: boolean;
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
 * The on-chain projection of a version's proto schema: the State message plus one
 * message per command/event (keyed by event name). Publisher-claimed and advisory.
 *
 * @see modules/models/.../schema/registry/SchemaShape.scala
 */
export interface SchemaShape {
  stateMessage: MessageShape;
  /** One message per command/event, keyed by event name. */
  commands: Record<string, MessageShape>;
}

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
 * typed {@link SchemaShape} projection (never the descriptor or definition bytes).
 * Wire format: `strict` defaults to `false` and is omittable.
 *
 * @see modules/models/.../schema/registry/RegisteredVersion.scala
 */
export interface RegisteredVersion {
  version: SemVer;
  /** Commitment to the protobuf FileDescriptorSet (descriptor bytes; off-chain). */
  schemaHash: string;
  /** The verified-binding anchor: `StateMachineDefinition.computeDigest` of the logic. */
  logicHash: string;
  schemaShape: SchemaShape;
  status: RegistryStatus;
  /** Snapshot ordinal at which this version was registered. */
  registeredAt: number;
  /** Opt-in runtime conformance gate (#33); defaults to `false`. */
  strict?: boolean;
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
  | { InstanceAlias: { fiberId: string } };

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
  sequenceNumber: number;  // Plain number
  eventName: string;
  ordinal: number;  // Plain number (snapshot ordinal)
  fromState: string;  // Plain string
  toState: string;  // Plain string
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
  invokedAt: number;  // Plain number (snapshot ordinal)
  invokedBy: string;  // Plain string (address)
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
 * Union type for all fiber log entries.
 */
export type FiberLogEntry = EventReceipt | ScriptInvocation | CreationReceipt | UpgradeReceipt;

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
  currentState: string;  // Plain string
  stateData: JsonLogicValue;
  stateDataHash: string;  // Plain string
  sequenceNumber: number;
  owners: string[];  // Plain string array (addresses)
  status: FiberStatus;
  lastReceipt?: EventReceipt;
  parentFiberId?: string;
  childFiberIds: string[];
  /** The resolved, pinned registry binding (#26), present when created from a registered version. */
  schemaBinding?: SchemaBinding;
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
  stateDataHash?: string;  // Plain string
  accessControl: AccessControlPolicy;
  sequenceNumber: number;
  owners: string[];  // Plain string array
  status: FiberStatus;
  lastInvocation?: ScriptInvocation;
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
  recordHash: string;  // Plain string
  stateDataHash?: string;  // Plain string
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
 * Invoke a script script.
 */
export interface InvokeScript {
  fiberId: string;
  method: string;
  args: JsonLogicValue;
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
 * Create-or-append a registry schema-package version (npm-publish semantics): the first publish
 * for a name claims it and makes the signer the owner; later publishes require an existing owner.
 *
 * Note: `fiberId` is NOT on the wire — the chain derives the routing id from `name`.
 */
export interface PublishVersion {
  /** Full registry name `labels.tld` (e.g. "order.package"). */
  name: string;
  version: SemVer;
  /** Base64 of the proto FileDescriptorSet; the chain base64-validates + hashes it, then drops the bytes. */
  schemaB64: string;
  /** The typed proto projection the chain stores for discovery (advisory). */
  schemaShape: SchemaShape;
  /** The typed JSON-Logic state machine; hashed into `logicHash` for verified binding (#37). */
  definition: StateMachineDefinition;
  /** Opt-in runtime conformance gate (#33); defaults to `false`, omittable. */
  strict?: boolean;
  /** Optional off-chain links grab-bag set on the entry at first publish; defaults to `{}`, omittable. */
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
  | { PublishVersion: PublishVersion }
  | { SetVersionStatus: SetVersionStatus }
  | { RegisterAlias: RegisterAlias };

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
  'PublishVersion',
  'SetVersionStatus',
  'RegisterAlias',
] as const;

/**
 * Type representing valid message type names.
 */
export type OttochainMessageType = (typeof OTTOCHAIN_MESSAGE_TYPES)[number];
