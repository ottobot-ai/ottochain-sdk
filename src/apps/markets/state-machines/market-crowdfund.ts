import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * All-or-nothing crowdfunding with threshold, deadline, and stretch goals.
 */
export const marketCrowdfundDef = defineFiberApp({
  metadata: {
    name: 'MarketCrowdfund',
    app: 'markets',
    type: 'crowdfund',
    version: '1.0.0',
    description: 'All-or-nothing crowdfunding with threshold, deadline, and stretch goals',
  },

  createSchema: {
    required: ['creator', 'threshold', 'deadline'] as const,
    properties: {
      creator: { type: 'address', immutable: true },
      threshold: { type: 'integer', minimum: 1, description: 'Funding goal' },
      deadline: { type: 'timestamp', description: 'Campaign end date' },
      minPledge: { type: 'integer', minimum: 1 },
      stretchGoals: { type: 'array', description: 'Stretch goal targets' },
      treasuryId: { type: 'uuid', description: 'Treasury for fund custody' },
    },
  },

  stateSchema: {
    properties: {
      creator: { type: 'address', immutable: true },
      threshold: { type: 'integer' },
      deadline: { type: 'timestamp' },
      minPledge: { type: 'integer' },
      stretchGoals: { type: 'array' },
      treasuryId: { type: 'uuid' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'OPEN', 'FUNDED', 'REFUNDED', 'CANCELLED'] as const,
        computed: true,
      },
      pledges: { type: 'array', computed: true },
      totalPledged: { type: 'integer', computed: true },
      backerCount: { type: 'integer', computed: true },
      stretchGoalsReached: { type: 'array', computed: true },
      refundsClaimed: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    launch: {
      description: 'Launch the campaign',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    cancel: {
      description: 'Cancel the campaign',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    pledge: {
      description: 'Make a pledge',
      required: ['agent', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        amount: { type: 'integer', minimum: 1 },
        rewardTier: { type: 'string' },
      },
    },
    increase_pledge: {
      description: 'Increase existing pledge',
      required: ['agent', 'additionalAmount'] as const,
      properties: {
        agent: { type: 'address' },
        additionalAmount: { type: 'integer', minimum: 1 },
      },
    },
    finalize: {
      description: 'Finalize campaign at deadline',
    },
    claim_refund: {
      description: 'Claim refund if threshold not met',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    OPEN: { id: 'OPEN', isFinal: false },
    FUNDED: { id: 'FUNDED', isFinal: true },
    REFUNDED: { id: 'REFUNDED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'launch',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.creator' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'OPEN', launchedAt: { var: '$timestamp' }, pledges: [], totalPledged: 0, backerCount: 0 },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.creator' }] },
      effect: { merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } }] },
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'pledge',
      guard: {
        and: [
          { '>': [{ var: 'event.amount' }, 0] },
          { '!==': [{ var: 'event.agent' }, { var: 'state.creator' }] },
          {
            or: [
              { '!': [{ var: 'state.minPledge' }] },
              { '>=': [{ var: 'event.amount' }, { var: 'state.minPledge' }] },
            ],
          },
          { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            pledges: {
              cat: [
                { var: 'state.pledges' },
                [{
                  backer: { var: 'event.agent' },
                  amount: { var: 'event.amount' },
                  rewardTier: { var: 'event.rewardTier' },
                  pledgedAt: { var: '$timestamp' },
                }],
              ],
            },
            totalPledged: { '+': [{ var: 'state.totalPledged' }, { var: 'event.amount' }] },
            backerCount: { '+': [{ var: 'state.backerCount' }, 1] },
          },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'increase_pledge',
      guard: {
        and: [
          { '>': [{ var: 'event.additionalAmount' }, 0] },
          { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { totalPledged: { '+': [{ var: 'state.totalPledged' }, { var: 'event.additionalAmount' }] } },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'FUNDED',
      eventName: 'finalize',
      guard: {
        and: [
          { '>=': [{ var: 'state.totalPledged' }, { var: 'state.threshold' }] },
          { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'FUNDED',
            fundedAt: { var: '$timestamp' },
            stretchGoalsReached: {
              filter: [
                { var: 'state.stretchGoals' },
                { '<=': [{ var: 'target' }, { var: 'state.totalPledged' }] },
              ],
            },
          },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'REFUNDED',
      eventName: 'finalize',
      guard: {
        and: [
          { '<': [{ var: 'state.totalPledged' }, { var: 'state.threshold' }] },
          { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'REFUNDED', refundedAt: { var: '$timestamp' }, reason: 'threshold_not_met' },
        ],
      },
    },
    {
      from: 'REFUNDED',
      to: 'REFUNDED',
      eventName: 'claim_refund',
      guard: { '!': [{ in: [{ var: 'event.agent' }, { var: 'state.refundsClaimed' }] }] },
      effect: {
        merge: [
          { var: 'state' },
          { refundsClaimed: { cat: [{ var: 'state.refundsClaimed' }, [{ var: 'event.agent' }]] } },
        ],
      },
    },
  ],
});

export type CrowdfundState = keyof typeof marketCrowdfundDef.states;
export type CrowdfundEvent = typeof marketCrowdfundDef.transitions[number]['eventName'];
