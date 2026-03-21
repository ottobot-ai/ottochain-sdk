import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Minimal governance state machine - extend for custom use cases.
 */
export const governanceUniversalDef = defineFiberApp({
  metadata: {
    name: 'GovernanceUniversal',
    app: 'governance',
    type: 'universal',
    version: '1.0.0',
    description: 'Minimal governance state machine - extend for custom use cases',
  },

  createSchema: {
    required: ['creator'] as const,
    properties: {
      creator: { type: 'address', immutable: true },
      metadata: { type: 'object', default: {} },
    },
  },

  stateSchema: {
    properties: {
      creator: { type: 'address', immutable: true },
      status: { type: 'string', enum: ['ACTIVE', 'VOTING', 'DISSOLVED'] as const, computed: true },
      proposal: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      lastProposal: { type: 'object', computed: true },
      lastResult: { type: 'string', computed: true },
    },
  },

  eventSchemas: {
    propose: {
      description: 'Create a proposal',
      required: ['proposal'] as const,
      properties: { proposal: { type: 'object' } },
    },
    vote: {
      description: 'Vote on active proposal',
      required: ['agent', 'vote'] as const,
      properties: { agent: { type: 'address' }, vote: { type: 'string' } },
    },
    finalize: {
      description: 'Finalize voting',
      properties: { result: { type: 'string' } },
    },
    dissolve: { description: 'Dissolve the governance' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    VOTING: { id: 'VOTING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
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
          { status: 'VOTING', proposal: { var: 'event.proposal' }, proposedAt: { var: '$timestamp' }, votes: {} },
        ],
      },
    },
    {
      from: 'VOTING',
      to: 'VOTING',
      eventName: 'vote',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { votes: { merge: [{ var: 'state.votes' }, { __key: { var: 'event.agent' }, __value: { var: 'event.vote' } }] } },
        ],
      },
    },
    {
      from: 'VOTING',
      to: 'ACTIVE',
      eventName: 'finalize',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', lastProposal: { var: 'state.proposal' }, lastResult: { var: 'event.result' }, proposal: null, votes: null },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'DISSOLVED',
      eventName: 'dissolve',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] },
    },
  ],
});

export type UniversalGovernanceState = keyof typeof governanceUniversalDef.states;
export type UniversalGovernanceEvent = typeof governanceUniversalDef.transitions[number]['eventName'];
