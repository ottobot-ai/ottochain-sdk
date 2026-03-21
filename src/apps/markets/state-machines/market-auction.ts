import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Auction market supporting English, Dutch, and sealed-bid variants.
 */
export const marketAuctionDef = defineFiberApp({
  metadata: {
    name: 'MarketAuction',
    app: 'markets',
    type: 'auction',
    version: '1.0.0',
    description: 'Auction market supporting English, Dutch, and sealed-bid variants',
  },

  createSchema: {
    required: ['seller', 'minBid', 'bidIncrement'] as const,
    properties: {
      seller: { type: 'address', immutable: true },
      minBid: { type: 'integer', minimum: 1 },
      bidIncrement: { type: 'integer', minimum: 1 },
      reservePrice: { type: 'integer' },
      deadline: { type: 'timestamp' },
      escrowId: { type: 'uuid', description: 'Linked escrow for asset custody' },
    },
  },

  stateSchema: {
    properties: {
      seller: { type: 'address', immutable: true },
      minBid: { type: 'integer' },
      bidIncrement: { type: 'integer' },
      reservePrice: { type: 'integer' },
      deadline: { type: 'timestamp' },
      escrowId: { type: 'uuid' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'OPEN', 'CLOSING', 'SETTLED', 'NO_SALE', 'CANCELLED'] as const,
        computed: true,
      },
      bids: { type: 'array', computed: true },
      highBid: { type: 'integer', computed: true },
      highBidder: { type: 'address', computed: true },
      winner: { type: 'address', computed: true },
      finalPrice: { type: 'integer', computed: true },
    },
  },

  eventSchemas: {
    open: {
      description: 'Open auction for bidding',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    cancel: {
      description: 'Cancel the auction',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    bid: {
      description: 'Place a bid',
      required: ['agent', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        amount: { type: 'integer', minimum: 1 },
      },
    },
    close: {
      description: 'Close bidding',
      required: ['agent'] as const,
      properties: { agent: { type: 'address' } },
    },
    settle: {
      description: 'Settle with winner',
    },
    no_sale: {
      description: 'No valid bids or reserve not met',
    },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    OPEN: { id: 'OPEN', isFinal: false },
    CLOSING: { id: 'CLOSING', isFinal: false },
    SETTLED: { id: 'SETTLED', isFinal: true },
    NO_SALE: { id: 'NO_SALE', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.seller' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'OPEN', openedAt: { var: '$timestamp' }, bids: [], highBid: null, highBidder: null },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.seller' }] },
      effect: { merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } }] },
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'bid',
      guard: {
        and: [
          { '!==': [{ var: 'event.agent' }, { var: 'state.seller' }] },
          { '>=': [{ var: 'event.amount' }, { var: 'state.minBid' }] },
          {
            or: [
              { '!': [{ var: 'state.highBid' }] },
              { '>=': [{ var: 'event.amount' }, { '+': [{ var: 'state.highBid' }, { var: 'state.bidIncrement' }] }] },
            ],
          },
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
            bids: {
              cat: [
                { var: 'state.bids' },
                [{ bidder: { var: 'event.agent' }, amount: { var: 'event.amount' }, bidAt: { var: '$timestamp' } }],
              ],
            },
            highBid: { var: 'event.amount' },
            highBidder: { var: 'event.agent' },
            lastBidAt: { var: '$timestamp' },
          },
        ],
      },
    },
    {
      from: 'OPEN',
      to: 'CLOSING',
      eventName: 'close',
      guard: {
        or: [
          { '===': [{ var: 'event.agent' }, { var: 'state.seller' }] },
          { and: [{ var: 'state.deadline' }, { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] }] },
        ],
      },
      effect: { merge: [{ var: 'state' }, { status: 'CLOSING', closedAt: { var: '$timestamp' } }] },
    },
    {
      from: 'CLOSING',
      to: 'SETTLED',
      eventName: 'settle',
      guard: {
        and: [
          { var: 'state.highBidder' },
          {
            or: [
              { '!': [{ var: 'state.reservePrice' }] },
              { '>=': [{ var: 'state.highBid' }, { var: 'state.reservePrice' }] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$timestamp' },
            winner: { var: 'state.highBidder' },
            finalPrice: { var: 'state.highBid' },
          },
        ],
      },
    },
    {
      from: 'CLOSING',
      to: 'NO_SALE',
      eventName: 'no_sale',
      guard: {
        or: [
          { '!': [{ var: 'state.highBidder' }] },
          { and: [{ var: 'state.reservePrice' }, { '<': [{ var: 'state.highBid' }, { var: 'state.reservePrice' }] }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'NO_SALE',
            closedAt: { var: '$timestamp' },
            reason: { if: [{ '!': [{ var: 'state.highBidder' }] }, 'no_bids', 'reserve_not_met'] },
          },
        ],
      },
    },
  ],
});

export type AuctionState = keyof typeof marketAuctionDef.states;
export type AuctionEvent = typeof marketAuctionDef.transitions[number]['eventName'];
