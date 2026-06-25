/**
 * Genesis Manifest Exporter
 *
 * The ottochain metagraph can boot from a NON-EMPTY genesis: a set of standard
 * packages pre-registered in the registry before any user transaction. This SDK
 * is the source of truth for those std apps (their proto schemas + JSON-Logic
 * state-machine definitions), so it is also the source of truth for the
 * *genesis manifest* — the per-app CONTENT the chain needs to pre-register each
 * package at genesis.
 *
 * DESIGN — content, not consensus hashes:
 * The manifest ships CONTENT only: the `machineShape` (the typed, proto-faithful
 * projection of the app's state message) and the `definition` (the JSON-Logic
 * `StateMachineDefinition`, verbatim — the same object the chain decodes for any
 * fiber). The CHAIN computes the consensus values itself from this content:
 *   - `logicHash` = `StateMachineDefinition.computeDigest(definition)`
 *   - `schemaHash` = commitment over the FileDescriptorSet (off-chain/Bridge)
 * We deliberately do NOT replicate the chain's canonical hashing here, so there
 * is ZERO hash-parity risk. No advisory hashes are emitted (see HONESTY notes in
 * the PR description); add them later only if an off-chain consumer needs them,
 * clearly marked advisory.
 *
 * NAMING — the reserved `std` label:
 * Each package is named `std.<app>.package`. `RegistryName` reserves the `std`
 * label in-protocol (`RegistryName.isReserved`), so ordinary user registrations
 * of `std.*` are rejected — only the privileged genesis path may claim them.
 * That is exactly the point: users cannot squat the standard names.
 *
 * SCHEMA SHAPES — chain-verified ground truth:
 * The three `stateMessage` shapes are reproduced verbatim from the chain's own
 * conformance suite (`StandardAppsConformanceSuite`, the `identity` / `proposal`
 * / `market` `MessageShape` vals), which proves the on-chain shape validator and
 * the conformance gate accept them. `commands` is left EMPTY for this first cut —
 * the conformance suite itself models all three apps with `SortedMap.empty`
 * commands, and the proto `*Request` messages are transaction-layer DTOs that do
 * not map cleanly onto the universal state machines' free-form JSON-Logic event
 * payloads. Deriving per-event command shapes is a flagged follow-up.
 *
 * The JSON shape emitted here is built to deserialize against the chain's circe
 * codecs (`MachineShape` / `FieldShape` / `MessageShape` and
 * `StateMachineDefinition`), whose magnolia config is camelCase with defaults.
 *
 * @packageDocumentation
 */

import { identityUniversalDef } from '../apps/identity/state-machines/identity-universal.js';
import { govUniversalDef } from '../apps/governance/state-machines/governance-universal.js';
import { marketUniversalDef } from '../apps/markets/state-machines/market-universal.js';
import { toProtoDefinition, type FiberAppDefinition } from '../schema/fiber-app.js';

// ─── Manifest model (mirrors the chain's circe codecs) ────────────────────────

/**
 * One field of a protobuf message, mirroring a `FieldDescriptorProto` at the
 * field level. Matches the chain's `FieldShape` (camelCase, defaults for
 * `repeated`/`optional`).
 */
export interface FieldShape {
  name: string;
  number: number;
  typeName: string;
  repeated: boolean;
  optional: boolean;
}

/** A protobuf message projection. Matches the chain's `MessageShape`. */
export interface MessageShape {
  typeName: string;
  fields: FieldShape[];
}

/**
 * The typed, proto-faithful projection of a registered schema. Matches the
 * chain's `MachineShape`: the state message plus one message per command/event,
 * keyed by event name.
 */
export interface MachineShape {
  stateMessage: MessageShape;
  commands: Record<string, MessageShape>;
}

/**
 * A JSON-Logic `StateMachineDefinition` as the chain decodes it. Kept as an
 * opaque JSON object: the chain owns its meaning and its hashing. `from`/`to`
 * and the `states` keys are bare strings (the chain's `StateId` encodes as a
 * string); `dependencies` defaults to `[]` and state `metadata` to `null`.
 */
export interface StateMachineDefinition {
  states: Record<string, { id: string; isFinal: boolean; metadata: unknown | null }>;
  initialState: string;
  transitions: Array<{
    from: string;
    to: string;
    eventName: string;
    guard: unknown;
    effect: unknown;
    dependencies: unknown[];
  }>;
  metadata: unknown | null;
  /**
   * Fiber constitution. PRESENT only for a `Constrained` policy (a bare object of the
   * SET dials); ABSENT for `Unconstrained` (the chain emits no `policy` key for it).
   */
  policy?: Record<string, unknown>;
}

/**
 * One package to pre-register at genesis. This is the genesis INPUT, not the
 * chain's stored `RegisteredVersion`: it carries CONTENT only and the chain
 * derives `schemaHash` / `logicHash` from it.
 */
export interface GenesisPackage {
  /** RegistryName `"<labels>.package"`, e.g. `std.identity.package`. */
  name: string;
  /** SemVer of this initial version. */
  semver: string;
  /** Opt-in runtime conformance gate (`RegisteredVersion.strict`). */
  strict: boolean;
  /** Free-form notes map (<=8 entries, key <=32 chars, value <=128 chars). */
  metadata: Record<string, string>;
  /** Typed, proto-faithful projection of the app's schema. */
  machineShape: MachineShape;
  /** The JSON-Logic state-machine definition, verbatim. */
  definition: StateMachineDefinition;
}

/** The full genesis manifest the chain consumes to bootstrap its registry. */
export interface GenesisManifest {
  version: number;
  packages: GenesisPackage[];
}

/** Manifest schema version. Bump on any breaking change to the shape. */
export const GENESIS_MANIFEST_VERSION = 1;

// ─── Chain-verified state-message shapes ──────────────────────────────────────
// Reproduced VERBATIM from ottochain
// modules/shared-data/.../StandardAppsConformanceSuite.scala — the `identity`,
// `proposal`, and `market` MessageShape vals. Keep these byte-for-byte in step
// with that suite; it is what guarantees the chain accepts them.

/** Helper: a FieldShape with the two boolean defaults made explicit. */
function field(
  name: string,
  number: number,
  typeName: string,
  repeated = false,
  optional = false,
): FieldShape {
  return { name, number, typeName, repeated, optional };
}

/** ottochain.apps.identity.v1.Identity */
const identityStateMessage: MessageShape = {
  typeName: 'ottochain.apps.identity.v1.Identity',
  fields: [
    field('id', 1, 'string'),
    field('address', 2, 'string'),
    field('public_key', 3, 'string'),
    field('display_name', 4, 'string'),
    field('identity_type', 5, 'ottochain.apps.identity.v1.Type'),
    field('state', 6, 'ottochain.apps.identity.v1.State'),
    field('reputation', 7, 'ottochain.apps.identity.v1.Reputation'),
    field('stake', 8, 'int64'),
    field('domains', 9, 'string', true),
    field('platform_links', 10, 'ottochain.apps.identity.v1.PlatformLink', true),
    field('penalty_history', 11, 'ottochain.apps.identity.v1.PenaltyEvent', true),
    field('created_at', 12, 'google.protobuf.Timestamp'),
    field('updated_at', 13, 'google.protobuf.Timestamp'),
  ],
};

/** ottochain.apps.governance.v1.Proposal */
const governanceStateMessage: MessageShape = {
  typeName: 'ottochain.apps.governance.v1.Proposal',
  fields: [
    field('id', 1, 'string'),
    field('title', 2, 'string'),
    field('description', 3, 'string'),
    field('action_type', 4, 'string'),
    field('payload', 5, 'google.protobuf.Struct'),
    field('proposer', 6, 'string'),
    field('proposed_at', 7, 'google.protobuf.Timestamp'),
    field('deadline', 8, 'google.protobuf.Timestamp'),
    field('queued_at', 9, 'google.protobuf.Timestamp'),
    field('executable_at', 10, 'google.protobuf.Timestamp'),
  ],
};

/** ottochain.apps.markets.v1.Market */
const marketStateMessage: MessageShape = {
  typeName: 'ottochain.apps.markets.v1.Market',
  fields: [
    field('id', 1, 'string'),
    field('market_type', 2, 'ottochain.apps.markets.v1.Type'),
    field('creator', 3, 'string'),
    field('title', 4, 'string'),
    field('terms', 5, 'google.protobuf.Struct'),
    field('deadline', 6, 'google.protobuf.Timestamp'),
    field('threshold', 7, 'int64'),
    field('commitments', 8, 'ottochain.apps.markets.v1.Commitment', true),
    field('oracles', 9, 'string', true),
    field('quorum', 10, 'int32'),
    field('resolutions', 11, 'ottochain.apps.markets.v1.Resolution', true),
    field('status', 12, 'ottochain.apps.markets.v1.State'),
    field('created_at', 13, 'google.protobuf.Timestamp'),
    field('updated_at', 14, 'google.protobuf.Timestamp'),
  ],
};

// ─── Definition projection (single source of truth = the exported defs) ───────

/**
 * Project a `FiberAppDefinition` into the chain's wire `StateMachineDefinition`,
 * matching the `json-archive/*.json` convention exactly:
 *   - states carry explicit `metadata: null`,
 *   - transitions carry explicit `dependencies: []`,
 *   - the TypeScript-only `FiberAppMetadata` is stripped (`metadata: null`).
 *
 * Built on the shared `toProtoDefinition` projector so the manifest never drifts
 * from the SDK's own exported app definitions. The chain decodes `dependencies:
 * []` / `metadata: null` identically to their absent forms (its codecs use
 * defaults), so this is consensus-equivalent to the archives while staying
 * byte-identical to the checked-in `json-archive/*.json` files.
 */
function toWireDefinition(def: FiberAppDefinition): StateMachineDefinition {
  const proto = toProtoDefinition(def);
  const states: StateMachineDefinition['states'] = {};
  for (const [key, st] of Object.entries(proto.states)) {
    states[key] = { id: st.id, isFinal: st.isFinal, metadata: null };
  }
  return {
    states,
    initialState: proto.initialState,
    transitions: proto.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      eventName: t.eventName,
      guard: t.guard,
      effect: t.effect,
      dependencies: t.dependencies ?? [],
    })),
    // Strip FiberAppMetadata — the chain's `metadata` is `Option[JsonLogicValue]`.
    metadata: null,
    // Carry the fiber constitution through verbatim from the shared projector: PRESENT
    // (a bare object of set dials) for `Constrained`, ABSENT for `Unconstrained`. The
    // `policy` key is only set here when `toProtoDefinition` emitted one, so an
    // unconstrained def keeps NO `policy` key (omit-on-unconstrained wire parity).
    ...(proto.policy !== undefined ? { policy: proto.policy as Record<string, unknown> } : {}),
  };
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Assemble the genesis manifest for the standard apps.
 *
 * Covers THREE apps in this first cut — identity, governance, markets (all the
 * `universal` variant). The other std apps (contracts, oracles, corporate) and
 * non-universal variants are a flagged follow-up.
 *
 * @returns a `GenesisManifest` whose JSON deserializes against the chain's circe
 *   codecs. Hashes are intentionally absent — the chain derives them.
 */
export function buildGenesisManifest(): GenesisManifest {
  const packages: GenesisPackage[] = [
    {
      name: 'std.identity.package',
      semver: '1.0.0',
      strict: false,
      metadata: {},
      machineShape: { stateMessage: identityStateMessage, commands: {} },
      definition: toWireDefinition(identityUniversalDef),
    },
    {
      name: 'std.governance.package',
      semver: '1.0.0',
      strict: false,
      metadata: {},
      machineShape: { stateMessage: governanceStateMessage, commands: {} },
      definition: toWireDefinition(govUniversalDef),
    },
    {
      name: 'std.markets.package',
      semver: '1.0.0',
      strict: false,
      metadata: {},
      machineShape: { stateMessage: marketStateMessage, commands: {} },
      definition: toWireDefinition(marketUniversalDef),
    },
  ];

  return { version: GENESIS_MANIFEST_VERSION, packages };
}
