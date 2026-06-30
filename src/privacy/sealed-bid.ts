/**
 * Sealed-bid (Vickrey) auction — the worked example for the privacy stack.
 *
 * Two pieces (RFC §4):
 *  1. `sealedBidAccountDef` — the PRIVATE per-bidder bid. `shieldApp` turns it into a shielded
 *     pool (`shieldedSealedBidDef`): a bidder commits a bid note and proves it well-formed with a
 *     zk-jlvm-shielded Groth16 proof, so the amount stays sealed *until the deadline*. This is the
 *     mechanical per-instance / single-owner case.
 *  2. `vickreyAuctionDef` — the PUBLIC settlement (reveal-then-tally). After the deadline bidders
 *     open their notes; the combine computes winner = argmax and clearingPrice = second-highest
 *     (the Vickrey price). This is the one shared-state step, kept simple for v1; a zk settlement
 *     proof that seals losers' amounts forever is the deferred upgrade (RFC §10).
 */

import { defineFiberApp, type FiberAppDefinition } from '../schema/fiber-app.js';
import { shieldApp, type ShieldOptions } from './shield-app.js';

// ── 1. The private bid (base app, shielded by shieldApp) ──────────────────────

/** The per-bidder PRIVATE state: a bid note `{ amount, bidder, nonce }`. */
export const sealedBidAccountDef = defineFiberApp({
  metadata: {
    name: 'SealedBidAccount',
    app: 'markets',
    type: 'sealed-bid-account',
    version: '1.0.0',
    description: "A single bidder's sealed bid (private amount). Shielded via shieldApp.",
  },
  stateSchema: {
    properties: {
      amount: { type: 'number', description: 'the (private) bid amount' },
      bidder: { type: 'address' },
      nonce: { type: 'number', description: 'per-note randomness; keeps the commitment hiding' },
    },
  },
  eventSchemas: {
    place_bid: {
      description: 'Set the sealed bid amount',
      required: ['amount'] as const,
      properties: { amount: { type: 'number', minimum: 1 } },
    },
  },
  states: {
    OPEN: { id: 'OPEN', isFinal: false, metadata: { label: 'Open', description: 'No bid yet', category: 'initial' } },
    BID: { id: 'BID', isFinal: false, metadata: { label: 'Bid', description: 'Bid committed', category: 'active' } },
  },
  initialState: 'OPEN',
  transitions: [
    {
      // This effect is what the zk-jlvm-shielded circuit runs in-zkVM; `exprHash` pins it.
      from: 'OPEN',
      to: 'BID',
      eventName: 'place_bid',
      guard: { '>': [{ var: 'event.amount' }, 0] },
      effect: { merge: [{ var: 'state' }, { amount: { var: 'event.amount' } }] },
      dependencies: [],
    },
  ],
} as const);

/**
 * The shielded sealed-bid pool. `vkey`/`exprHash` come from the built zk-jlvm-shielded circuit
 * (these are placeholders until the circuit's program vkey + the keccak of the `place_bid` effect
 * are wired in by the genesis/build step).
 */
export function shieldedSealedBidDef(opts: ShieldOptions): FiberAppDefinition {
  return shieldApp(sealedBidAccountDef, opts);
}

// ── 2. The public Vickrey settlement ──────────────────────────────────────────

/**
 * Public reveal-then-tally settlement. `reveal` appends an opened bid (in a full build the opening
 * is checked against the recorded commitment in the shielded pool); `settle` computes the winner
 * and the Vickrey (second-price) clearing price over the revealed bids in one reduce.
 */
export const vickreyAuctionDef = defineFiberApp({
  metadata: {
    name: 'VickreyAuction',
    app: 'markets',
    type: 'vickrey-auction',
    version: '1.0.0',
    description: 'Sealed-bid second-price auction: public reveal-then-tally over shielded bids.',
    crossReferences: { bidPool: 'the ShieldedSealedBidAccount pool holding the sealed bids' },
  },
  createSchema: {
    required: ['seller', 'deadline'] as const,
    properties: {
      seller: { type: 'address', immutable: true },
      deadline: { type: 'timestamp', immutable: true },
    },
  },
  stateSchema: {
    properties: {
      seller: { type: 'address', immutable: true },
      deadline: { type: 'timestamp', immutable: true },
      status: { type: 'string', computed: true },
      revealed: { type: 'array', computed: true, description: 'opened bids [{bidder, amount}]' },
      winner: { type: 'address', computed: true },
      clearingPrice: { type: 'number', computed: true, description: 'second-highest bid (Vickrey)' },
    },
  },
  eventSchemas: {
    reveal: {
      description: 'Open a sealed bid after the deadline',
      required: ['bidder', 'amount'] as const,
      properties: { bidder: { type: 'address' }, amount: { type: 'number', minimum: 1 } },
    },
    settle: { description: 'Tally the revealed bids (winner + second price)' },
  },
  states: {
    OPEN: {
      id: 'OPEN',
      isFinal: false,
      metadata: { label: 'Open', description: 'Bidding (sealed)', category: 'initial' },
    },
    REVEAL: {
      id: 'REVEAL',
      isFinal: false,
      metadata: { label: 'Reveal', description: 'Opening bids', category: 'active' },
    },
    SETTLED: {
      id: 'SETTLED',
      isFinal: true,
      metadata: { label: 'Settled', description: 'Winner + price set', category: 'terminal' },
    },
  },
  initialState: 'OPEN',
  transitions: [
    {
      from: 'OPEN',
      to: 'REVEAL',
      eventName: 'reveal',
      guard: { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'REVEAL',
            revealed: {
              cat: [{ var: 'state.revealed' }, [{ bidder: { var: 'event.bidder' }, amount: { var: 'event.amount' } }]],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'REVEAL',
      to: 'REVEAL',
      eventName: 'reveal',
      guard: { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            revealed: {
              cat: [{ var: 'state.revealed' }, [{ bidder: { var: 'event.bidder' }, amount: { var: 'event.amount' } }]],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      // Vickrey tally: fold the revealed bids tracking (max, second, winner).
      from: 'REVEAL',
      to: 'SETTLED',
      eventName: 'settle',
      guard: { '>': [{ reduce: [{ var: 'state.revealed' }, { '+': [{ var: 'accumulator' }, 1] }, 0] }, 0] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$timestamp' },
            winner: {
              var: ['tally.winner', null],
            },
            clearingPrice: { var: ['tally.second', 0] },
            // compute the tally once and expose it for the two fields above
            tally: {
              reduce: [
                { var: 'state.revealed' },
                {
                  if: [
                    { '>': [{ var: 'current.amount' }, { var: 'accumulator.max' }] },
                    {
                      max: { var: 'current.amount' },
                      second: { var: 'accumulator.max' },
                      winner: { var: 'current.bidder' },
                    },
                    {
                      if: [
                        { '>': [{ var: 'current.amount' }, { var: 'accumulator.second' }] },
                        {
                          max: { var: 'accumulator.max' },
                          second: { var: 'current.amount' },
                          winner: { var: 'accumulator.winner' },
                        },
                        { var: 'accumulator' },
                      ],
                    },
                  ],
                },
                { max: 0, second: 0, winner: null },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
