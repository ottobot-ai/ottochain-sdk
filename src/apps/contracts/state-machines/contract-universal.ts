import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Minimal contract state machine - extend for custom use cases.
 */
export const contractUniversalDef = defineFiberApp({
  metadata: {
    name: 'ContractUniversal',
    app: 'contracts',
    type: 'universal',
    version: '1.0.0',
    description: 'Minimal contract state machine - extend for custom use cases',
  },

  createSchema: {
    required: ['owner'] as const,
    properties: {
      owner: { type: 'address', description: 'Contract owner', immutable: true },
      metadata: { type: 'object', description: 'Arbitrary metadata', default: {} },
    },
  },

  stateSchema: {
    properties: {
      owner: { type: 'address', immutable: true },
      metadata: { type: 'object' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const,
        computed: true,
      },
      acceptedAt: { type: 'timestamp', computed: true },
      completedAt: { type: 'timestamp', computed: true },
      cancelledAt: { type: 'timestamp', computed: true },
    },
  },

  eventSchemas: {
    accept: { description: 'Accept the contract' },
    complete: { description: 'Mark contract as completed' },
    cancel: { description: 'Cancel the contract' },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    COMPLETED: { id: 'COMPLETED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'ACTIVE',
      eventName: 'accept',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', acceptedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'COMPLETED',
      eventName: 'complete',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'COMPLETED', completedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } },
        ],
      },
    },
  ],
});

export type UniversalContractState = keyof typeof contractUniversalDef.states;
export type UniversalContractEvent = typeof contractUniversalDef.transitions[number]['eventName'];
