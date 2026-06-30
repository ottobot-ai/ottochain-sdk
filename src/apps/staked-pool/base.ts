/**
 * Staked-pool BASE factory — a reusable staked-epoch-pool lifecycle skeleton.
 *
 * Lifecycle: FORMING → COLLECTING → SETTLED → COLLECTING (reset) … → CLOSED.
 *   FORMING    (initial) — accepting stake/join; registry bound; not yet running epochs.
 *   COLLECTING           — epoch open; participants submit datapoints/votes.
 *   SETTLED              — result published; entitlement ledger credited; result readable cross-fiber.
 *   CLOSED     (final)   — wound down; stakes + unclaimed rewards still withdrawable/claimable.
 *
 * The base composes EXISTING SDK primitives only:
 *   - `signerIsParty` (authority gate), `actorIsSigner`/`actorHasEntry` (effect-key↔signer coupling),
 *     `signerHasReputationVia` (the #24 dynamic-dep reputation-gated join), `actorNotInArray` (array dedup),
 *     `depInState` (cross-fiber consumer read — used by the consumer, not the pool itself) — `src/schema/guards.ts`.
 *   - `addDependency` (#24 bind), `transferAsset` (whole-instance custody move) — `src/schema/effects.ts`.
 *
 * Value model (design §2.1, §4 — resolved):
 *   - Submissions are an APPEND-ONLY ARRAY of `{ addr, value }` records (no map-keyed-by-address, because
 *     there is no `(array,int)` element-index op). Append is `merge[state.submissions, [record]]` — verified.
 *   - finalize emits ZERO asset transfers: it publishes `result` and records the in-consensus address set
 *     into `inConsensus` (the entitlement ledger). No reward map-fold (a map-valued `reduce` accumulator is
 *     rejected by the VM — `isPrimitive` guard in `opReduce`); entitlement is membership in `inConsensus`.
 *   - reward = PER-CLAIM on a shared fungible: `claim_reward` moves ONE whole reward instance the pool holds
 *     to a verified, in-consensus, not-yet-claimed signer, and marks `claimed[addr] = true`. ≤1 transfer.
 *   - withdraw_stake / hard-slash each emit exactly ONE whole `_transferAsset` ⇒ never the 32-cap.
 *
 * Multi-`from` arms are SPLIT into one transition per source state (chain `from` is a single string):
 *   stake_and_join ×2, claim_reward ×2, withdraw_stake ×2, close ×3.
 */

import { defineFiberApp } from '../../schema/fiber-app.js';
import type { FiberAppDefinition, JsonLogicRule, Transition } from '../../schema/fiber-app.js';
import { signerIsParty, actorIsSigner, signerHasReputationVia, actorNotInArray } from '../../schema/guards.js';
import { addDependency, transferAsset, toWallet } from '../../schema/effects.js';

// ---------------------------------------------------------------------------
// Shared guard fragments (composed from the canonical builders)
// ---------------------------------------------------------------------------

/** event.agent is among the verified signers (proofs[].address). */
const isSigner = (): JsonLogicRule => actorIsSigner('event.agent');

/** event.agent is a verified signer AND a key in the flat membership map `state.participants`. */
const isJoinedParticipant = (): JsonLogicRule => ({
  and: [isSigner(), { has: [{ var: 'state.participants' }, { var: 'event.agent' }] }],
});

/** The submit window is still open: $ordinal <= epochStartedAt + epochLength. */
const withinEpochWindow = (): JsonLogicRule => ({
  '<=': [{ var: '$ordinal' }, { '+': [{ var: 'state.epochStartedAt' }, { var: 'state.epochLength' }] }],
});

/**
 * H5 stake-reality: the pool actually holds `event.stakeAssetId` with `amount >= state.stakeAmount`.
 * `heldAssets` is injected keyed by assetId and is BY CONSTRUCTION only the assets this fiber holds.
 */
const poolHoldsStake = (): JsonLogicRule => ({
  and: [
    { has: [{ var: 'heldAssets' }, { var: 'event.stakeAssetId' }] },
    {
      '>=': [
        {
          get: [{ get: [{ var: 'heldAssets' }, { var: 'event.stakeAssetId' }] }, 'amount'],
        },
        { var: 'state.stakeAmount' },
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// Base transition bodies (parameterized by `from`/`to` for the split arms)
// ---------------------------------------------------------------------------

const dep0 = { dependencies: [] as const };

/** bind_registry FORMING→FORMING — #24 genesis bind site; MUST precede all reputation-gated joins. */
function bindRegistryArm(): Transition {
  return {
    from: 'FORMING',
    to: 'FORMING',
    eventName: 'bind_registry',
    guard: signerIsParty('state.authority'),
    // Only effect: bind the identity registry so machines.<registryId> is readable NEXT transition (#24).
    effect: {
      merge: [{ var: 'state' }, { ...addDependency({ var: 'state.registryId' }) }],
    },
    ...dep0,
  };
}

/**
 * stake_and_join {from}→{from} — reputation-gated join + stake-custody VERIFICATION (H5).
 * actorIsSigner is load-bearing: it pins the written participant key to the verified signer (anti-S1).
 */
function stakeAndJoinArm(state: string): Transition {
  return {
    from: state,
    to: state,
    eventName: 'stake_and_join',
    guard: {
      and: [
        isSigner(), // anti-S1: the written key == verified signer
        { '===': [{ var: 'event.stakeAmount' }, { var: 'state.stakeAmount' }] },
        {
          '!': [{ has: [{ var: 'state.participants' }, { var: 'event.agent' }] }],
        }, // dedup
        poolHoldsStake(), // H5
        signerHasReputationVia('state.registryId', 'state.minReputation'), // #24 reputation gate
      ],
    },
    effect: {
      merge: [
        { var: 'state' },
        {
          participants: {
            set: [{ var: 'state.participants' }, { var: 'event.agent' }, true],
          },
          stakes: {
            set: [{ var: 'state.stakes' }, { var: 'event.agent' }, { var: 'event.stakeAmount' }],
          },
          stakeAssetIds: {
            set: [{ var: 'state.stakeAssetIds' }, { var: 'event.agent' }, { var: 'event.stakeAssetId' }],
          },
        },
      ],
    },
    ...dep0,
  };
}

/** open_first_epoch FORMING→COLLECTING — authority opens epoch 1. */
function openFirstEpochArm(): Transition {
  return {
    from: 'FORMING',
    to: 'COLLECTING',
    eventName: 'open_first_epoch',
    guard: signerIsParty('state.authority'),
    effect: {
      merge: [
        { var: 'state' },
        {
          status: 'COLLECTING',
          epoch: 1,
          epochStartedAt: { var: '$ordinal' },
          submissions: [],
        },
      ],
    },
    ...dep0,
  };
}

/** reset_epoch SETTLED→COLLECTING — authority advances the epoch; clears submissions + inConsensus + claimed. */
function resetEpochArm(): Transition {
  return {
    from: 'SETTLED',
    to: 'COLLECTING',
    eventName: 'reset_epoch',
    guard: signerIsParty('state.authority'),
    effect: {
      merge: [
        { var: 'state' },
        {
          status: 'COLLECTING',
          epoch: { '+': [{ var: 'state.epoch' }, 1] },
          epochStartedAt: { var: '$ordinal' },
          submissions: [],
          inConsensus: [],
          claimed: {},
        },
      ],
    },
    ...dep0,
  };
}

/**
 * submit COLLECTING→COLLECTING — append one `{addr,value}` datapoint. OVERRIDABLE per specialization.
 * Guard = joined participant (signer-pinned) AND within window AND not-yet-submitted-this-epoch (array dedup).
 */
export function defaultSubmitArm(): Transition {
  return {
    from: 'COLLECTING',
    to: 'COLLECTING',
    eventName: 'submit',
    guard: {
      and: [isJoinedParticipant(), withinEpochWindow(), actorNotInArray('state.submissions', 'addr', 'event.agent')],
    },
    // Array append via merge (verified: merge[arr, [record]] concatenates).
    effect: {
      merge: [
        { var: 'state' },
        {
          submissions: {
            merge: [{ var: 'state.submissions' }, [{ addr: { var: 'event.agent' }, value: { var: 'event.value' } }]],
          },
        },
      ],
    },
    ...dep0,
  };
}

/**
 * claim_reward {from}→{from} — pull ONE whole reward instance for an in-consensus, not-yet-claimed entitlement.
 * Reward = per-claim on a shared fungible: the pool transfers one held reward instance to the claimant.
 */
function claimRewardArm(state: string): Transition {
  return {
    from: state,
    to: state,
    eventName: 'claim_reward',
    guard: {
      and: [
        isSigner(), // anti-S1: recipient/claimed key == verified signer
        {
          some: [{ var: 'state.inConsensus' }, { '===': [{ var: '' }, { var: 'event.agent' }] }],
        }, // entitled
        { '!': [{ has: [{ var: 'state.claimed' }, { var: 'event.agent' }] }] }, // not already claimed
        { has: [{ var: 'heldAssets' }, { var: 'event.rewardAssetId' }] }, // pool holds the named instance
      ],
    },
    effect: {
      merge: [
        { var: 'state' },
        {
          claimed: {
            set: [{ var: 'state.claimed' }, { var: 'event.agent' }, true],
          },
          ...transferAsset([
            {
              assetId: { var: 'event.rewardAssetId' },
              recipient: toWallet({ var: 'event.agent' }),
            },
          ]),
        },
      ],
    },
    ...dep0,
  };
}

/**
 * withdraw_stake {from}→{from} — participant reclaims their staked instance (ONE whole transfer).
 * H4: the `_transferAsset.assetId` read of `stakeAssetIds[agent]` and the sibling `unset` BOTH see the
 * PRE-MERGE state (verified) — so reading-then-unsetting in one merge is correct, not a strand.
 */
function withdrawStakeArm(state: string): Transition {
  return {
    from: state,
    to: state,
    eventName: 'withdraw_stake',
    guard: {
      and: [isSigner(), { has: [{ var: 'state.stakeAssetIds' }, { var: 'event.agent' }] }],
    },
    effect: {
      merge: [
        { var: 'state' },
        {
          stakes: { set: [{ var: 'state.stakes' }, { var: 'event.agent' }, 0] },
          stakeAssetIds: {
            unset: [{ var: 'state.stakeAssetIds' }, { var: 'event.agent' }],
          },
          ...transferAsset([
            {
              assetId: {
                get: [{ var: 'state.stakeAssetIds' }, { var: 'event.agent' }],
              }, // pre-merge read (H4)
              recipient: toWallet({ var: 'event.agent' }),
            },
          ]),
        },
      ],
    },
    ...dep0,
  };
}

/** close {from}→CLOSED — authority winds the pool down. Stakes/rewards remain withdrawable/claimable. */
function closeArm(state: string): Transition {
  return {
    from: state,
    to: 'CLOSED',
    eventName: 'close',
    guard: signerIsParty('state.authority'),
    effect: {
      merge: [{ var: 'state' }, { status: 'CLOSED', closedAt: { var: '$ordinal' } }],
    },
    ...dep0,
  };
}

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

const baseCreateSchema = {
  required: [
    'authority',
    'registryId',
    'minReputation',
    'stakePolicy',
    'stakeAmount',
    'quorum',
    'epochLength',
    'outlierBound',
    'rewardPerEpoch',
  ] as const,
  properties: {
    authority: {
      type: 'address',
      description: 'Pool authority (opens/resets/closes epochs).',
      immutable: true,
    },
    registryId: {
      type: 'uuid',
      description: 'Identity-registry fiber id, bound via _addDependency (#24).',
      immutable: true,
    },
    minReputation: {
      type: 'integer',
      description: 'Join reputation bar (signerHasReputationVia).',
      immutable: true,
    },
    stakePolicy: {
      type: 'string',
      description: 'Asset policy name of the stake token.',
      immutable: true,
    },
    stakeAmount: {
      type: 'integer',
      description: 'Required stake (minor units); checked vs heldAssets (H5).',
      immutable: true,
    },
    quorum: {
      type: 'integer',
      description: 'Min submissions to finalize.',
      immutable: true,
    },
    epochLength: {
      type: 'integer',
      description: 'Ordinals per epoch (submit window).',
      immutable: true,
    },
    outlierBound: {
      type: 'integer',
      description: '|x - center| <= bound ⇒ in-consensus.',
      immutable: true,
    },
    rewardPerEpoch: {
      type: 'integer',
      description: 'Informational per-epoch reward budget.',
      immutable: true,
    },
  },
} as const;

const baseStateSchema = {
  properties: {
    status: { type: 'string', computed: true },
    epoch: { type: 'integer', computed: true },
    epochStartedAt: { type: 'integer', computed: true },
    authority: { type: 'address', immutable: true },
    registryId: { type: 'uuid', immutable: true },
    minReputation: { type: 'integer', immutable: true },
    stakePolicy: { type: 'string', immutable: true },
    stakeAmount: { type: 'integer', immutable: true },
    quorum: { type: 'integer', immutable: true },
    epochLength: { type: 'integer', immutable: true },
    outlierBound: { type: 'integer', immutable: true },
    rewardPerEpoch: { type: 'integer', immutable: true },
    participants: {
      type: 'object',
      computed: true,
      description: '{ <addr>: true } flat membership.',
    },
    stakes: {
      type: 'object',
      computed: true,
      description: '{ <addr>: int } staked amount.',
    },
    stakeAssetIds: {
      type: 'object',
      computed: true,
      description: '{ <addr>: uuid } staked instance.',
    },
    submissions: {
      type: 'array',
      computed: true,
      description: "[ {addr,value} ] this epoch's datapoints.",
    },
    inConsensus: {
      type: 'array',
      computed: true,
      description: "Last epoch's rewarded addresses (entitlement ledger).",
    },
    claimed: {
      type: 'object',
      computed: true,
      description: '{ <addr>: true } reward already claimed this epoch.',
    },
    result: {
      type: 'object',
      computed: true,
      nullable: true,
      description: 'Last finalized published result.',
    },
    closedAt: { type: 'integer', computed: true },
  },
} as const;

/**
 * Genesis state — EVERY map init'd to `{}` and EVERY array to `[]` so reads stay total (M1: `has`/`get`
 * on null hard-error). `epoch`/`epochStartedAt` are 0 until `open_first_epoch`.
 */
export const baseInitialStateData = {
  status: 'FORMING',
  epoch: 0,
  epochStartedAt: 0,
  participants: {},
  stakes: {},
  stakeAssetIds: {},
  submissions: [],
  inConsensus: [],
  claimed: {},
  result: null,
} as const;

const baseStates = {
  FORMING: {
    id: 'FORMING',
    isFinal: false,
    metadata: {
      label: 'Forming',
      description: 'Accepting stake/join; registry bound; no epoch yet.',
      category: 'initial' as const,
    },
  },
  COLLECTING: {
    id: 'COLLECTING',
    isFinal: false,
    metadata: {
      label: 'Collecting',
      description: 'Epoch open; participants submit datapoints.',
      category: 'active' as const,
    },
  },
  SETTLED: {
    id: 'SETTLED',
    isFinal: false,
    metadata: {
      label: 'Settled',
      description: 'Result published; entitlement ledger credited; readable cross-fiber.',
      category: 'pending' as const,
    },
  },
  CLOSED: {
    id: 'CLOSED',
    isFinal: true,
    metadata: {
      label: 'Closed',
      description: 'Wound down; stakes + unclaimed rewards still withdrawable/claimable.',
      category: 'terminal' as const,
    },
  },
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface StakedPoolOverrides {
  /** Metadata identity for the specialization. */
  metadata: {
    name: string;
    type: string;
    description: string;
    version?: string;
  };
  /** Override the COLLECTING→COLLECTING `submit` arm (e.g. oracle datapoint append). Defaults to {@link defaultSubmitArm}. */
  submit?: Transition;
  /** The finalize arm (COLLECTING→SETTLED) — REQUIRED; supplied by the specialization (e.g. trimmed-mean). */
  finalize: Transition;
  /** Extra arms (e.g. governance propose/vote/resolve/challenge/slash) appended after the base arms. */
  extraTransitions?: readonly Transition[];
  /** Extra states (e.g. governance VOTING). */
  extraStates?: Record<string, { id: string; isFinal: boolean; metadata?: unknown }>;
  /** Extra create-schema properties merged onto the base. */
  extraCreateProperties?: Record<string, unknown>;
  /** Extra state-schema properties merged onto the base. */
  extraStateProperties?: Record<string, unknown>;
}

/**
 * Build a staked-pool definition from the shared base + a specialization's `submit`/`finalize` (+ extras).
 * Emits all SPLIT multi-`from` arms; no two emitted entries share both `from` and `eventName`.
 */
export function makeStakedPoolDef(overrides: StakedPoolOverrides): FiberAppDefinition {
  const submit = overrides.submit ?? defaultSubmitArm();

  const transitions: Transition[] = [
    bindRegistryArm(),
    stakeAndJoinArm('FORMING'),
    stakeAndJoinArm('COLLECTING'),
    openFirstEpochArm(),
    resetEpochArm(),
    submit,
    overrides.finalize,
    claimRewardArm('SETTLED'),
    claimRewardArm('CLOSED'),
    withdrawStakeArm('SETTLED'),
    withdrawStakeArm('CLOSED'),
    closeArm('FORMING'),
    closeArm('COLLECTING'),
    closeArm('SETTLED'),
    ...(overrides.extraTransitions ?? []),
  ];

  return defineFiberApp({
    metadata: {
      name: overrides.metadata.name,
      app: 'staked-pool',
      type: overrides.metadata.type,
      version: overrides.metadata.version ?? '1.0.0',
      description: overrides.metadata.description,
    },
    createSchema: {
      required: baseCreateSchema.required,
      properties: {
        ...baseCreateSchema.properties,
        ...(overrides.extraCreateProperties ?? {}),
      },
    },
    stateSchema: {
      properties: {
        ...baseStateSchema.properties,
        ...(overrides.extraStateProperties ?? {}),
      },
    },
    states: { ...baseStates, ...(overrides.extraStates ?? {}) },
    initialState: 'FORMING',
    transitions,
  });
}
