import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty, signerIsNotParty } from '../../../schema/guards.js';

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
    crossReferences: {
      sellerIdentityId: "Links to seller's IdentityAgent",
      escrowId: 'Links to ContractEscrow for asset custody',
    },
  },

  createSchema: {
    required: ['seller', 'minBid'] as const,
    properties: {
      seller: {
        type: 'address',
        description: 'DAG address of the seller',
        immutable: true,
      },
      minBid: {
        type: 'number',
        minimum: 0,
        description: 'Minimum opening bid',
        immutable: true,
      },
      bidIncrement: {
        type: 'number',
        minimum: 0,
        description: 'Minimum bid increment',
      },
      reservePrice: {
        type: 'number',
        minimum: 0,
        description: 'Reserve price (if any)',
      },
      deadline: { type: 'timestamp', description: 'Auction deadline' },
    },
  },

  stateSchema: {
    properties: {
      status: { type: 'string', computed: true },
      seller: { type: 'address', immutable: true },
      minBid: { type: 'number', immutable: true },
      bidIncrement: { type: 'number' },
      reservePrice: { type: 'number' },
      deadline: { type: 'timestamp' },
      bids: { type: 'array', computed: true },
      highBid: { type: 'number', computed: true },
      highBidder: { type: 'address', computed: true },
    },
  },

  eventSchemas: {
    open: { description: 'Open the auction' },
    cancel: { description: 'Cancel the auction' },
    bid: {
      description: 'Place a bid',
      required: ['amount'] as const,
      properties: { amount: { type: 'number', minimum: 0 } },
    },
    close: { description: 'Close bidding' },
    settle: { description: 'Settle with winning bidder' },
    no_sale: { description: 'Declare no sale (reserve not met or no bids)' },
  },

  states: {
    PROPOSED: {
      id: 'PROPOSED',
      isFinal: false,
      metadata: {
        label: 'Proposed',
        description: 'Auction created but not yet open',
        category: 'initial',
      },
    },
    OPEN: {
      id: 'OPEN',
      isFinal: false,
      metadata: {
        label: 'Open',
        description: 'Accepting bids',
        category: 'active',
      },
    },
    CLOSING: {
      id: 'CLOSING',
      isFinal: false,
      metadata: {
        label: 'Closing',
        description: 'Bid period ended, determining winner',
        category: 'pending',
      },
    },
    SETTLED: {
      id: 'SETTLED',
      isFinal: true,
      metadata: {
        label: 'Settled',
        description: 'Winner determined, transfer complete',
        category: 'terminal',
      },
    },
    NO_SALE: {
      id: 'NO_SALE',
      isFinal: true,
      metadata: {
        label: 'No sale',
        description: 'Reserve not met or no valid bids',
        category: 'terminal',
      },
    },
    CANCELLED: {
      id: 'CANCELLED',
      isFinal: true,
      metadata: {
        label: 'Cancelled',
        description: 'Auction cancelled by seller',
        category: 'terminal',
      },
    },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'OPEN',
      eventName: 'open',
      guard: signerIsParty('state.seller'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'OPEN',
            openedAt: { var: '$ordinal' },
            bids: [],
            highBid: null,
            highBidder: null,
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: signerIsParty('state.seller'),
      effect: {
        merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'OPEN',
      to: 'OPEN',
      eventName: 'bid',
      guard: {
        and: [
          signerIsNotParty('state.seller'),
          { '>=': [{ var: 'event.amount' }, { var: 'state.minBid' }] },
          {
            or: [
              { '!': [{ var: 'state.highBid' }] },
              {
                '>=': [
                  { var: 'event.amount' },
                  {
                    '+': [{ var: 'state.highBid' }, { var: 'state.bidIncrement' }],
                  },
                ],
              },
            ],
          },
          {
            or: [{ '!': [{ var: 'state.deadline' }] }, { '<=': [{ var: '$ordinal' }, { var: 'state.deadline' }] }],
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
                [
                  {
                    bidder: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
                    bidAt: { var: '$ordinal' },
                  },
                ],
              ],
            },
            highBid: { var: 'event.amount' },
            highBidder: { var: 'event.agent' },
            lastBidAt: { var: '$ordinal' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'OPEN',
      to: 'CLOSING',
      eventName: 'close',
      guard: {
        or: [
          signerIsParty('state.seller'),
          {
            and: [{ var: 'state.deadline' }, { '>=': [{ var: '$ordinal' }, { var: 'state.deadline' }] }],
          },
        ],
      },
      effect: {
        merge: [{ var: 'state' }, { status: 'CLOSING', closedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
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
              {
                '>=': [{ var: 'state.highBid' }, { var: 'state.reservePrice' }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$ordinal' },
            winner: { var: 'state.highBidder' },
            finalPrice: { var: 'state.highBid' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'CLOSING',
      to: 'NO_SALE',
      eventName: 'no_sale',
      guard: {
        or: [
          { '!': [{ var: 'state.highBidder' }] },
          {
            and: [
              { var: 'state.reservePrice' },
              {
                '<': [{ var: 'state.highBid' }, { var: 'state.reservePrice' }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'NO_SALE',
            closedAt: { var: '$ordinal' },
            reason: {
              if: [{ '!': [{ var: 'state.highBidder' }] }, 'no_bids', 'reserve_not_met'],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
