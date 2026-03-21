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

  crossReferences: {
    creatorIdentityId: "Links to creator's IdentityAgent",
    treasuryId: 'Links to Treasury for fund custody',
  },

  createSchema: {
    required: ['creator', 'threshold', 'deadline'] as const,
    properties: {
      creator: { type: 'address', description: 'DAG address of campaign creator', immutable: true },
      threshold: { type: 'number', minimum: 0, description: 'Funding goal amount', immutable: true },
      deadline: { type: 'timestamp', description: 'Campaign deadline', immutable: true },
      minPledge: { type: 'number', minimum: 0, description: 'Minimum pledge amount' },
      stretchGoals: { type: 'array', description: 'Stretch goal targets' },
    },
  },

  stateSchema: {
    properties: {
      status: { type: 'string', computed: true },
      creator: { type: 'address', immutable: true },
      threshold: { type: 'number', immutable: true },
      deadline: { type: 'timestamp', immutable: true },
      minPledge: { type: 'number' },
      stretchGoals: { type: 'array' },
      pledges: { type: 'array', computed: true },
      totalPledged: { type: 'number', computed: true },
      backerCount: { type: 'number', computed: true },
      refundsClaimed: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    launch: { description: 'Launch the campaign' },
    cancel: { description: 'Cancel the campaign' },
    pledge: {
      description: 'Make a pledge',
      required: ['amount'] as const,
      properties: {
        amount: { type: 'number', minimum: 0 },
        rewardTier: { type: 'string' },
      },
    },
    increase_pledge: {
      description: 'Increase an existing pledge',
      required: ['additionalAmount'] as const,
      properties: { additionalAmount: { type: 'number', minimum: 0 } },
    },
    finalize: { description: 'Finalize the campaign after deadline' },
    claim_refund: { description: 'Claim refund in failed campaign' },
  },

  states: {
    PROPOSED: {
      id: 'PROPOSED',
      isFinal: false,
      metadata: { description: 'Campaign created but not yet open' },
    },
    OPEN: {
      id: 'OPEN',
      isFinal: false,
      metadata: { description: 'Accepting pledges' },
    },
    FUNDED: {
      id: 'FUNDED',
      isFinal: true,
      metadata: { description: 'Threshold met, funds released to creator' },
    },
    REFUNDED: {
      id: 'REFUNDED',
      isFinal: true,
      metadata: { description: 'Threshold not met, all pledges refunded' },
    },
    CANCELLED: {
      id: 'CANCELLED',
      isFinal: true,
      metadata: { description: 'Campaign cancelled by creator' },
    },
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
          {
            status: 'OPEN',
            launchedAt: { var: '$timestamp' },
            pledges: [],
            totalPledged: 0,
            backerCount: 0,
          },
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
          { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } },
        ],
      },
      dependencies: [],
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
                [
                  {
                    backer: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
                    rewardTier: { var: 'event.rewardTier' },
                    pledgedAt: { var: '$timestamp' },
                  },
                ],
              ],
            },
            totalPledged: { '+': [{ var: 'state.totalPledged' }, { var: 'event.amount' }] },
            backerCount: { '+': [{ var: 'state.backerCount' }, 1] },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'increase_pledge',
      guard: {
        and: [
          { '>': [{ var: 'event.additionalAmount' }, 0] },
          { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
          {
            '>': [
              {
                size: {
                  filter: [
                    { var: 'state.pledges' },
                    { '===': [{ var: 'backer' }, { var: 'event.agent' }] },
                  ],
                },
              },
              0,
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            totalPledged: {
              '+': [{ var: 'state.totalPledged' }, { var: 'event.additionalAmount' }],
            },
          },
        ],
      },
      dependencies: [],
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
      dependencies: [],
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
      dependencies: [],
    },
    {
      from: 'REFUNDED',
      to: 'REFUNDED',
      eventName: 'claim_refund',
      guard: {
        and: [
          {
            '>': [
              {
                size: {
                  filter: [
                    { var: 'state.pledges' },
                    { '===': [{ var: 'backer' }, { var: 'event.agent' }] },
                  ],
                },
              },
              0,
            ],
          },
          {
            '!': [
              {
                in: [{ var: 'event.agent' }, { var: 'state.refundsClaimed' }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            refundsClaimed: {
              cat: [{ var: 'state.refundsClaimed' }, [{ var: 'event.agent' }]],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
