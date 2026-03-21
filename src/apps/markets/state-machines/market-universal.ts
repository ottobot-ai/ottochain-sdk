import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Minimal market state machine - extend for custom use cases.
 */
export const marketUniversalDef = defineFiberApp({
  metadata: {
    name: 'MarketUniversal',
    app: 'markets',
    type: 'universal',
    version: '1.0.0',
    description: 'Minimal market state machine - extend for custom use cases',
  },

  createSchema: {
    required: ['creator'] as const,
    properties: {
      creator: { type: 'address', description: 'Market creator', immutable: true },
      metadata: { type: 'object', default: {} },
    },
  },

  stateSchema: {
    properties: {
      creator: { type: 'address', immutable: true },
      metadata: { type: 'object' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED'] as const,
        computed: true,
      },
      totalCommitted: { type: 'integer', default: 0, computed: true },
      openedAt: { type: 'timestamp', computed: true },
      closedAt: { type: 'timestamp', computed: true },
      settledAt: { type: 'timestamp', computed: true },
      cancelledAt: { type: 'timestamp', computed: true },
    },
  },

  eventSchemas: {
    open: { description: 'Open the market' },
    commit: {
      description: 'Commit funds to the market',
      required: ['amount'] as const,
      properties: { amount: { type: 'integer', minimum: 1 } },
    },
    close: { description: 'Close the market' },
    settle: { description: 'Settle the market' },
    cancel: { description: 'Cancel the market' },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    OPEN: { id: 'OPEN', isFinal: false },
    CLOSED: { id: 'CLOSED', isFinal: false },
    SETTLED: { id: 'SETTLED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'OPEN', openedAt: { var: '$timestamp' } }] },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } }] },
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'commit',
      guard: { '>': [{ var: 'event.amount' }, 0] },
      effect: {
        merge: [
          { var: 'state' },
          { totalCommitted: { '+': [{ var: 'state.totalCommitted' }, { var: 'event.amount' }] } },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'CLOSED',
      eventName: 'close',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'CLOSED', closedAt: { var: '$timestamp' } }] },
    },
    {
      from: 'CLOSED',
      to: 'SETTLED',
      eventName: 'settle',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'SETTLED', settledAt: { var: '$timestamp' } }] },
    },
    {
      from: 'CLOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '==': [1, 1] },
      effect: { merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } }] },
    },
  ],
});

export type UniversalMarketState = keyof typeof marketUniversalDef.states;
export type UniversalMarketEvent = typeof marketUniversalDef.transitions[number]['eventName'];
