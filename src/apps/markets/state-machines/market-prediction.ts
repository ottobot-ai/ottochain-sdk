import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Binary or multi-outcome prediction market with oracle resolution and position staking.
 */
export const marketPredictionDef = defineFiberApp({
  metadata: {
    name: 'MarketPrediction',
    app: 'markets',
    type: 'prediction',
    version: '1.0.0',
    description:
      'Binary or multi-outcome prediction market with oracle resolution and position staking',
    crossReferences: {
      oracleId: "Links to IdentityOracle that resolves the outcome",
      creatorIdentityId: "Links to creator's IdentityAgent",
    },
  },

  createSchema: {
    required: ['creator', 'outcomes', 'oracles', 'quorum'] as const,
    properties: {
      creator: { type: 'address', description: 'DAG address of the market creator', immutable: true },
      outcomes: { type: 'array', description: 'Valid outcome identifiers', immutable: true },
      oracles: { type: 'array', description: 'Authorized oracle addresses', immutable: true },
      quorum: { type: 'number', description: 'Minimum oracle submissions needed to resolve', immutable: true },
      deadline: { type: 'timestamp', description: 'Optional trading deadline' },
    },
  },

  stateSchema: {
    properties: {
      status: { type: 'string', computed: true },
      creator: { type: 'address', immutable: true },
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
      properties: { outcome: { type: 'string' } },
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
        judicialRuling: { type: 'boolean' },
        outcome: { type: 'string' },
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
      metadata: { description: 'Market created but not yet open for trading' },
    },
    OPEN: {
      id: 'OPEN',
      isFinal: false,
      metadata: { description: 'Accepting positions on outcomes' },
    },
    CLOSED: {
      id: 'CLOSED',
      isFinal: false,
      metadata: { description: 'No more positions, awaiting resolution' },
    },
    RESOLVING: {
      id: 'RESOLVING',
      isFinal: false,
      metadata: { description: 'Oracle(s) submitting resolution' },
    },
    DISPUTED: {
      id: 'DISPUTED',
      isFinal: false,
      metadata: { description: 'Resolution challenged, awaiting arbitration' },
    },
    SETTLED: {
      id: 'SETTLED',
      isFinal: true,
      metadata: { description: 'Outcome finalized, payouts available' },
    },
    REFUNDED: {
      id: 'REFUNDED',
      isFinal: true,
      metadata: { description: 'Market invalidated, all positions refunded' },
    },
    CANCELLED: {
      id: 'CANCELLED',
      isFinal: true,
      metadata: { description: 'Market cancelled before opening' },
    },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.creator' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'OPEN', openedAt: { var: '$timestamp' }, positions: {}, totalPool: 0 },
        ],
      },
      dependencies: [],
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.creator' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CANCELLED', cancelledAt: { var: '$timestamp' }, reason: { var: 'event.reason' } },
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
            or: [
              { '!': [{ var: 'state.deadline' }] },
              { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
            ],
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
            totalPool: { '+': [{ var: 'state.totalPool' }, { var: 'event.amount' }] },
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
          { '===': [{ var: 'event.agent' }, { var: 'state.creator' }] },
          {
            and: [
              { var: 'state.deadline' },
              { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CLOSED', closedAt: { var: '$timestamp' } },
        ],
      },
      dependencies: [],
    },
    {
      from: 'CLOSED',
      to: 'RESOLVING',
      eventName: 'submit_resolution',
      guard: { in: [{ var: 'event.agent' }, { var: 'state.oracles' }] },
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
                submittedAt: { var: '$timestamp' },
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
          { in: [{ var: 'event.agent' }, { var: 'state.oracles' }] },
          {
            '!': [
              {
                in: [
                  { var: 'event.agent' },
                  { map: [{ var: 'state.resolutions' }, { var: 'oracle' }] },
                ],
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
                    submittedAt: { var: '$timestamp' },
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
      guard: { '>=': [{ size: { var: 'state.resolutions' } }, { var: 'state.quorum' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$timestamp' },
            finalOutcome: { var: 'event.outcome' },
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
                size: {
                  filter: [
                    { var: 'state.positions' },
                    { '===': [{ var: 'agent' }, { var: 'event.agent' }] },
                  ],
                },
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
            disputedAt: { var: '$timestamp' },
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
      guard: { var: 'event.judicialRuling' },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$timestamp' },
            finalOutcome: { var: 'event.outcome' },
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
            size: {
              filter: [
                { var: 'state.resolutions' },
                { '===': [{ var: 'outcome' }, 'INVALID'] },
              ],
            },
          },
          { var: 'state.quorum' },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'REFUNDED', refundedAt: { var: '$timestamp' }, reason: 'oracle_invalidation' },
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
                size: {
                  filter: [
                    { var: 'state.positions' },
                    {
                      and: [
                        { '===': [{ var: 'agent' }, { var: 'event.agent' }] },
                        { '===': [{ var: 'outcome' }, { var: 'state.finalOutcome' }] },
                      ],
                    },
                  ],
                },
              },
              0,
            ],
          },
          {
            '!': [
              {
                in: [
                  { var: 'event.agent' },
                  { map: [{ var: 'state.claims' }, { var: 'agent' }] },
                ],
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
                    claimedAt: { var: '$timestamp' },
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
