import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Minimal governance state machine - extend for custom use cases.
 */
export const govUniversalDef = defineFiberApp({
  metadata: {
    name: 'GovernanceUniversal',
    app: 'governance',
    type: 'universal',
    version: '1.0.0',
    description: 'Minimal governance state machine - extend for custom use cases',
  },

  createSchema: {
    properties: {},
  },

  stateSchema: {
    properties: {
      status: { type: 'string' },
      proposal: { type: 'object' },
      proposedAt: { type: 'timestamp' },
      votes: { type: 'object', computed: true },
      lastProposal: { type: 'object' },
      lastResult: { type: 'string' },
      dissolvedAt: { type: 'timestamp' },
    },
  },

  eventSchemas: {
    propose: {
      description: 'Submit a new proposal',
      properties: {
        proposal: { type: 'object' },
      },
    },
    vote: {
      description: 'Cast a vote on the active proposal',
      properties: {
        agent: { type: 'address' },
        vote: { type: 'string' },
      },
    },
    finalize: {
      description: 'Finalize the current proposal',
      properties: {
        result: { type: 'string' },
      },
    },
    dissolve: {
      description: 'Dissolve the governance entity',
    },
  },

  states: {
    ACTIVE: {
      id: 'ACTIVE',
      isFinal: false,
      metadata: {
        label: 'Active',
        description: 'Governance is idle and ready to accept a proposal',
        category: 'initial',
      },
    },
    VOTING: {
      id: 'VOTING',
      isFinal: false,
      metadata: {
        label: 'Voting',
        description: 'A proposal is open for voting',
        category: 'pending',
      },
    },
    DISSOLVED: {
      id: 'DISSOLVED',
      isFinal: true,
      metadata: {
        label: 'Dissolved',
        description: 'Governance entity dissolved (terminal)',
        category: 'terminal',
      },
    },
  },

  initialState: 'ACTIVE',

  transitions: [
    {
      from: 'ACTIVE',
      to: 'VOTING',
      eventName: 'propose',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'VOTING',
            proposal: { var: 'event.proposal' },
            proposedAt: { var: '$ordinal' },
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'VOTING',
      to: 'VOTING',
      eventName: 'vote',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            votes: {
              merge: [
                { var: 'state.votes' },
                {
                  __key: { var: 'event.agent' },
                  __value: { var: 'event.vote' },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'VOTING',
      to: 'ACTIVE',
      eventName: 'finalize',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            lastProposal: { var: 'state.proposal' },
            lastResult: { var: 'event.result' },
            proposal: null,
            votes: null,
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'DISSOLVED',
      eventName: 'dissolve',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISSOLVED',
            dissolvedAt: { var: '$ordinal' },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
