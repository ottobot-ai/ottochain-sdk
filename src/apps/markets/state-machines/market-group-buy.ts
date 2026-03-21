import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Collective purchasing with quantity thresholds and tiered pricing.
 */
export const marketGroupBuyDef = defineFiberApp({
  metadata: {
    name: 'MarketGroupBuy',
    app: 'markets',
    type: 'groupBuy',
    version: '1.0.0',
    description: 'Collective purchasing with quantity thresholds and tiered pricing',
  },

  createSchema: {
    required: ['organizer', 'vendor', 'minQuantity', 'deadline'] as const,
    properties: {
      organizer: { type: 'address', immutable: true },
      vendor: { type: 'address' },
      minQuantity: { type: 'integer', minimum: 1 },
      maxPerBuyer: { type: 'integer' },
      deadline: { type: 'timestamp' },
      priceTiers: { type: 'array', description: 'Volume discount tiers' },
      escrowId: { type: 'uuid' },
    },
  },

  stateSchema: {
    properties: {
      organizer: { type: 'address', immutable: true },
      vendor: { type: 'address' },
      minQuantity: { type: 'integer' },
      maxPerBuyer: { type: 'integer' },
      deadline: { type: 'timestamp' },
      priceTiers: { type: 'array' },
      escrowId: { type: 'uuid' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'OPEN', 'THRESHOLD_MET', 'PROCESSING', 'FULFILLED', 'REFUNDED', 'CANCELLED'] as const,
        computed: true,
      },
      orders: { type: 'array', computed: true },
      totalQuantity: { type: 'integer', computed: true },
      currentTier: { type: 'integer', computed: true },
      finalTier: { type: 'integer', computed: true },
      finalPricePerUnit: { type: 'integer', computed: true },
      trackingInfo: { type: 'string', computed: true },
      refundsClaimed: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    open: {
      description: 'Open for orders',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    cancel: {
      description: 'Cancel group buy',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    order: {
      description: 'Place an order',
      required: ['agent', 'quantity'] as const,
      properties: {
        agent: { type: 'address' },
        quantity: { type: 'integer', minimum: 1 },
        shippingInfo: { type: 'object' },
      },
    },
    check_threshold: {
      description: 'Check if threshold is met',
    },
    finalize: {
      description: 'Finalize at deadline',
    },
    fulfill: {
      description: 'Mark as fulfilled',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
        trackingInfo: { type: 'string' },
      },
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
    THRESHOLD_MET: { id: 'THRESHOLD_MET', isFinal: false },
    PROCESSING: { id: 'PROCESSING', isFinal: false },
    FULFILLED: { id: 'FULFILLED', isFinal: true },
    REFUNDED: { id: 'REFUNDED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.organizer' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'OPEN', openedAt: { var: '$timestamp' }, orders: [], totalQuantity: 0, currentTier: 0 },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.organizer' }] },
      effect: { merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } }] },
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'order',
      guard: {
        and: [
          { '>': [{ var: 'event.quantity' }, 0] },
          {
            or: [
              { '!': [{ var: 'state.maxPerBuyer' }] },
              { '<=': [{ var: 'event.quantity' }, { var: 'state.maxPerBuyer' }] },
            ],
          },
          { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            orders: {
              cat: [
                { var: 'state.orders' },
                [{
                  buyer: { var: 'event.agent' },
                  quantity: { var: 'event.quantity' },
                  shippingInfo: { var: 'event.shippingInfo' },
                  orderedAt: { var: '$timestamp' },
                }],
              ],
            },
            totalQuantity: { '+': [{ var: 'state.totalQuantity' }, { var: 'event.quantity' }] },
          },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'THRESHOLD_MET',
      eventName: 'check_threshold',
      guard: { '>=': [{ var: 'state.totalQuantity' }, { var: 'state.minQuantity' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'THRESHOLD_MET', thresholdMetAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'THRESHOLD_MET',
      to: 'THRESHOLD_MET',
      eventName: 'order',
      guard: {
        and: [
          { '>': [{ var: 'event.quantity' }, 0] },
          { '<=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            orders: {
              cat: [
                { var: 'state.orders' },
                [{
                  buyer: { var: 'event.agent' },
                  quantity: { var: 'event.quantity' },
                  shippingInfo: { var: 'event.shippingInfo' },
                  orderedAt: { var: '$timestamp' },
                }],
              ],
            },
            totalQuantity: { '+': [{ var: 'state.totalQuantity' }, { var: 'event.quantity' }] },
          },
        ],
      },
    },
    {
      from: 'THRESHOLD_MET',
      to: 'PROCESSING',
      eventName: 'finalize',
      guard: { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'PROCESSING',
            finalizedAt: { var: '$timestamp' },
            finalTier: { var: 'state.currentTier' },
          },
        ],
      },
    },
    {
      from: 'PROCESSING',
      to: 'FULFILLED',
      eventName: 'fulfill',
      guard: {
        or: [
          { '===': [{ var: 'event.agent' }, { var: 'state.vendor' }] },
          { '===': [{ var: 'event.agent' }, { var: 'state.organizer' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'FULFILLED', fulfilledAt: { var: '$timestamp' }, trackingInfo: { var: 'event.trackingInfo' } },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'REFUNDED',
      eventName: 'finalize',
      guard: {
        and: [
          { '<': [{ var: 'state.totalQuantity' }, { var: 'state.minQuantity' }] },
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

export type GroupBuyState = keyof typeof marketGroupBuyDef.states;
export type GroupBuyEvent = typeof marketGroupBuyDef.transitions[number]['eventName'];
