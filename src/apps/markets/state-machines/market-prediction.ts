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
    description: 'Binary or multi-outcome prediction market with oracle resolution and position staking',
  },

  createSchema: {
    required: ['creator', 'question', 'outcomes', 'oracles', 'quorum'] as const,
    properties: {
      creator: { type: 'address', immutable: true },
      question: { type: 'string', description: 'Market question', immutable: true },
      outcomes: { type: 'array', items: { type: 'string' }, description: 'Possible outcomes' },
      oracles: { type: 'array', items: { type: 'address' }, description: 'Authorized oracles' },
      quorum: { type: 'integer', minimum: 1, description: 'Required oracle confirmations' },
      deadline: { type: 'timestamp', description: 'Deadline for positions' },
    },
  },

  stateSchema: {
    properties: {
      creator: { type: 'address', immutable: true },
      question: { type: 'string', immutable: true },
      outcomes: { type: 'array' },
      oracles: { type: 'array' },
      quorum: { type: 'integer' },
      deadline: { type: 'timestamp' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'OPEN', 'CLOSED', 'RESOLVING', 'DISPUTED', 'SETTLED', 'REFUNDED', 'CANCELLED'] as const,
        computed: true,
      },
      positions: { type: 'object', computed: true },
      totalPool: { type: 'integer', computed: true },
      resolutions: { type: 'array', computed: true },
      finalOutcome: { type: 'string', computed: true },
      claims: { type: 'array', computed: true },
      disputedBy: { type: 'address', computed: true },
      disputeStake: { type: 'integer', computed: true },
      rulingId: { type: 'uuid', computed: true },
    },
  },

  eventSchemas: {
    open: {
      description: 'Open market for trading',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    cancel: {
      description: 'Cancel the market',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' }, reason: { type: 'string' } },
    },
    take_position: {
      description: 'Take a position on an outcome',
      required: ['agent', 'outcome', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        outcome: { type: 'string' },
        amount: { type: 'integer', minimum: 1 },
      },
    },
    close: {
      description: 'Close market to new positions',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    submit_resolution: {
      description: 'Oracle submits resolution',
      required: ['agent', 'outcome'] as const,
      properties: {
        agent: { type: 'address' },
        outcome: { type: 'string' },
        proof: { type: 'string' },
      },
    },
    finalize: {
      description: 'Finalize with quorum',
      properties: { outcome: { type: 'string' } },
    },
    dispute: {
      description: 'Dispute the resolution',
      required: ['agent', 'stake'] as const,
      properties: {
        agent: { type: 'address' },
        stake: { type: 'integer' },
        reason: { type: 'string' },
      },
    },
    ruling: {
      description: 'Judicial ruling on dispute',
      required: ['judicialRuling', 'outcome', 'rulingId'] as const,
      properties: {
        judicialRuling: { type: 'boolean' },
        outcome: { type: 'string' },
        rulingId: { type: 'uuid' },
      },
    },
    invalidate: {
      description: 'Invalidate market and refund',
    },
    claim: {
      description: 'Claim winnings',
      required: ['agent', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        amount: { type: 'integer' },
      },
    },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    OPEN: { id: 'OPEN', isFinal: false },
    CLOSED: { id: 'CLOSED', isFinal: false },
    RESOLVING: { id: 'RESOLVING', isFinal: false },
    DISPUTED: { id: 'DISPUTED', isFinal: false },
    SETTLED: { id: 'SETTLED', isFinal: true },
    REFUNDED: { id: 'REFUNDED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
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
          { totalPool: { '+': [{ var: 'state.totalPool' }, { var: 'event.amount' }] } },
        ],
      },
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
      effect: { merge: [{ var: 'state' }, { status: 'CLOSED', closedAt: { var: '$timestamp' } }] },
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
            resolutions: [{
              oracle: { var: 'event.agent' },
              outcome: { var: 'event.outcome' },
              proof: { var: 'event.proof' },
              submittedAt: { var: '$timestamp' },
            }],
          },
        ],
      },
    },
    {
      from: 'RESOLVING',
      to: 'RESOLVING',
      eventName: 'submit_resolution',
      guard: {
        and: [
          { in: [{ var: 'event.agent' }, { var: 'state.oracles' }] },
          { '!': [{ in: [{ var: 'event.agent' }, { map: [{ var: 'state.resolutions' }, { var: 'oracle' }] }] }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            resolutions: {
              cat: [
                { var: 'state.resolutions' },
                [{
                  oracle: { var: 'event.agent' },
                  outcome: { var: 'event.outcome' },
                  proof: { var: 'event.proof' },
                  submittedAt: { var: '$timestamp' },
                }],
              ],
            },
          },
        ],
      },
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
    },
    {
      from: 'RESOLVING',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: { var: 'event.stake' },
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
    },
    {
      from: 'RESOLVING',
      to: 'REFUNDED',
      eventName: 'invalidate',
      guard: { '>=': [{ size: { filter: [{ var: 'state.resolutions' }, { '===': [{ var: 'outcome' }, 'INVALID'] }] } }, { var: 'state.quorum' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'REFUNDED', refundedAt: { var: '$timestamp' }, reason: 'oracle_invalidation' },
        ],
      },
    },
    {
      from: 'SETTLED',
      to: 'SETTLED',
      eventName: 'claim',
      guard: {
        '!': [{ in: [{ var: 'event.agent' }, { map: [{ var: 'state.claims' }, { var: 'agent' }] }] }],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            claims: {
              cat: [
                { var: 'state.claims' },
                [{ agent: { var: 'event.agent' }, amount: { var: 'event.amount' }, claimedAt: { var: '$timestamp' } }],
              ],
            },
          },
        ],
      },
    },
  ],
});

export type PredictionState = keyof typeof marketPredictionDef.states;
export type PredictionEvent = typeof marketPredictionDef.transitions[number]['eventName'];
