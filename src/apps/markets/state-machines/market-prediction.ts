import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty, signerInSet } from '../../../schema/guards.js';

/**
 * Binary or multi-outcome prediction market with oracle resolution and position staking.
 */
export const marketPredictionDef = defineFiberApp({
  metadata: {
    name: 'MarketPrediction',
    app: 'markets',
    type: 'prediction',
    version: '1.0.0',
    description: 'Binary or multi-outcome prediction market with oracle resolution and position staking',
    crossReferences: {
      oracleId: 'Links to IdentityOracle that resolves the outcome',
      creatorIdentityId: "Links to creator's IdentityAgent",
    },
  },

  createSchema: {
    required: ['creator', 'outcomes', 'oracles', 'quorum', 'arbiter'] as const,
    properties: {
      creator: {
        type: 'address',
        description: 'DAG address of the market creator',
        immutable: true,
      },
      arbiter: {
        type: 'address',
        description: 'DAG address of the arbiter authorized to rule on a disputed resolution',
        immutable: true,
      },
      outcomes: {
        type: 'array',
        description: 'Valid outcome identifiers',
        immutable: true,
      },
      oracles: {
        type: 'array',
        description: 'Authorized oracle addresses',
        immutable: true,
      },
      quorum: {
        type: 'number',
        description: 'Minimum oracle submissions needed to resolve',
        immutable: true,
      },
      deadline: { type: 'timestamp', description: 'Optional trading deadline' },
    },
  },

  stateSchema: {
    properties: {
      status: { type: 'string', computed: true },
      creator: { type: 'address', immutable: true },
      arbiter: { type: 'address', immutable: true },
      outcomes: { type: 'array', immutable: true },
      oracles: { type: 'array', immutable: true },
      quorum: { type: 'number', immutable: true },
      deadline: { type: 'timestamp' },
      positions: { type: 'object', computed: true },
      totalPool: { type: 'number', computed: true },
      resolutions: { type: 'array', computed: true },
      finalOutcome: { type: 'string', computed: true },
      claims: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    open: { description: 'Open the market for trading' },
    cancel: {
      description: 'Cancel the market before opening',
      properties: { reason: { type: 'string' } },
    },
    take_position: {
      description: 'Take a position on an outcome',
      required: ['outcome', 'amount'] as const,
      properties: {
        outcome: { type: 'string' },
        amount: { type: 'number', minimum: 0 },
      },
    },
    close: { description: 'Close trading' },
    submit_resolution: {
      description: 'Submit oracle resolution',
      required: ['outcome', 'proof'] as const,
      properties: {
        outcome: { type: 'string' },
        proof: { type: 'string' },
      },
    },
    finalize: {
      description: 'Finalize market after quorum reached',
    },
    dispute: {
      description: 'Dispute the resolution',
      required: ['stake'] as const,
      properties: {
        stake: { type: 'number', minimum: 0 },
        reason: { type: 'string' },
      },
    },
    ruling: {
      description: 'Judicial ruling on dispute',
      properties: {
        finalOutcome: { type: 'string' },
        rulingId: { type: 'string' },
      },
    },
    invalidate: { description: 'Invalidate market by oracle consensus' },
    claim: {
      description: 'Claim payout after settlement',
      properties: { amount: { type: 'number' } },
    },
  },

  states: {
    PROPOSED: {
      id: 'PROPOSED',
      isFinal: false,
      metadata: {
        label: 'Proposed',
        description: 'Market created but not yet open for trading',
        category: 'initial',
      },
    },
    OPEN: {
      id: 'OPEN',
      isFinal: false,
      metadata: {
        label: 'Open',
        description: 'Accepting positions on outcomes',
        category: 'active',
      },
    },
    CLOSED: {
      id: 'CLOSED',
      isFinal: false,
      metadata: {
        label: 'Closed',
        description: 'No more positions, awaiting resolution',
        category: 'pending',
      },
    },
    RESOLVING: {
      id: 'RESOLVING',
      isFinal: false,
      metadata: {
        label: 'Resolving',
        description: 'Oracle(s) submitting resolution',
        category: 'pending',
      },
    },
    DISPUTED: {
      id: 'DISPUTED',
      isFinal: false,
      metadata: {
        label: 'Disputed',
        description: 'Resolution challenged, awaiting arbitration',
        category: 'pending',
      },
    },
    SETTLED: {
      id: 'SETTLED',
      isFinal: true,
      metadata: {
        label: 'Settled',
        description: 'Outcome finalized, payouts available',
        category: 'terminal',
      },
    },
    REFUNDED: {
      id: 'REFUNDED',
      isFinal: true,
      metadata: {
        label: 'Refunded',
        description: 'Market invalidated, all positions refunded',
        category: 'terminal',
      },
    },
    CANCELLED: {
      id: 'CANCELLED',
      isFinal: true,
      metadata: {
        label: 'Cancelled',
        description: 'Market cancelled before opening',
        category: 'terminal',
      },
    },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: signerIsParty('state.creator'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'OPEN',
            openedAt: { var: '$ordinal' },
            positions: {},
            totalPool: 0,
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: signerIsParty('state.creator'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'CANCELLED',
            cancelledAt: { var: '$ordinal' },
            reason: { var: 'event.reason' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'take_position',
      guard: {
        and: [
          { '>': [{ var: 'event.amount' }, 0] },
          { in: [{ var: 'event.outcome' }, { var: 'state.outcomes' }] },
          {
            or: [{ '!': [{ var: 'state.deadline' }] }, { '<=': [{ var: '$ordinal' }, { var: 'state.deadline' }] }],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            positions: {
              merge: [
                { var: 'state.positions' },
                {
                  __computed: {
                    cat: [{ var: 'event.agent' }, '_', { var: 'event.outcome' }],
                  },
                },
              ],
            },
            totalPool: {
              '+': [{ var: 'state.totalPool' }, { var: 'event.amount' }],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'OPEN',
      to: 'CLOSED',
      eventName: 'close',
      guard: {
        or: [
          signerIsParty('state.creator'),
          {
            and: [{ var: 'state.deadline' }, { '>=': [{ var: '$ordinal' }, { var: 'state.deadline' }] }],
          },
        ],
      },
      effect: {
        merge: [{ var: 'state' }, { status: 'CLOSED', closedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'CLOSED',
      to: 'RESOLVING',
      eventName: 'submit_resolution',
      guard: signerInSet('state.oracles'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'RESOLVING',
            resolutions: [
              {
                oracle: { var: 'event.agent' },
                outcome: { var: 'event.outcome' },
                proof: { var: 'event.proof' },
                submittedAt: { var: '$ordinal' },
              },
            ],
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RESOLVING',
      to: 'RESOLVING',
      eventName: 'submit_resolution',
      guard: {
        and: [
          signerInSet('state.oracles'),
          {
            '!': [
              {
                in: [{ var: 'event.agent' }, { map: [{ var: 'state.resolutions' }, { var: 'oracle' }] }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            resolutions: {
              cat: [
                { var: 'state.resolutions' },
                [
                  {
                    oracle: { var: 'event.agent' },
                    outcome: { var: 'event.outcome' },
                    proof: { var: 'event.proof' },
                    submittedAt: { var: '$ordinal' },
                  },
                ],
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RESOLVING',
      to: 'SETTLED',
      eventName: 'finalize',
      // authority gate — an ARBITER/SLASHER attestation check layers on additively when the identity registry lands (see docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerInSet('state.oracles'),
          {
            '>=': [{ count: { var: 'state.resolutions' } }, { var: 'state.quorum' }],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$ordinal' },
            // finalOutcome derives from the quorum-agreed resolution, not a raw event field
            finalOutcome: { var: 'state.resolutions.0.outcome' },
            claims: [],
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RESOLVING',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: {
        and: [
          {
            '>': [
              {
                length: [
                  {
                    filter: [{ var: 'state.positions' }, { '===': [{ var: 'agent' }, { var: 'event.agent' }] }],
                  },
                ],
              },
              0,
            ],
          },
          { var: 'event.stake' },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISPUTED',
            disputedAt: { var: '$ordinal' },
            disputedBy: { var: 'event.agent' },
            disputeStake: { var: 'event.stake' },
            disputeReason: { var: 'event.reason' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'DISPUTED',
      to: 'SETTLED',
      eventName: 'ruling',
      // authority gate — an ARBITER/SLASHER attestation check layers on additively when the identity registry lands (see docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [signerIsParty('state.arbiter'), { in: [{ var: 'event.finalOutcome' }, { var: 'state.outcomes' }] }],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$ordinal' },
            finalOutcome: { var: 'event.finalOutcome' },
            rulingId: { var: 'event.rulingId' },
            claims: [],
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RESOLVING',
      to: 'REFUNDED',
      eventName: 'invalidate',
      guard: {
        '>=': [
          {
            length: [
              {
                filter: [{ var: 'state.resolutions' }, { '===': [{ var: 'outcome' }, 'INVALID'] }],
              },
            ],
          },
          { var: 'state.quorum' },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'REFUNDED',
            refundedAt: { var: '$ordinal' },
            reason: 'oracle_invalidation',
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'SETTLED',
      to: 'SETTLED',
      eventName: 'claim',
      guard: {
        and: [
          {
            '>': [
              {
                length: [
                  {
                    filter: [
                      { var: 'state.positions' },
                      {
                        and: [
                          { '===': [{ var: 'agent' }, { var: 'event.agent' }] },
                          {
                            '===': [{ var: 'outcome' }, { var: 'state.finalOutcome' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              0,
            ],
          },
          {
            '!': [
              {
                in: [{ var: 'event.agent' }, { map: [{ var: 'state.claims' }, { var: 'agent' }] }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            claims: {
              cat: [
                { var: 'state.claims' },
                [
                  {
                    agent: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
                    claimedAt: { var: '$ordinal' },
                  },
                ],
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
