import { defineFiberApp } from '../../../schema/fiber-app.js';
import type { JsonLogicRule } from '../../../schema/fiber-app.js';

/**
 * sigma-mixer — a CDS OR-of-`dhtuple` Σ-protocol ring mixer.
 *
 * Anonymity comes from a Cramer–Damgård–Schoenmakers OR-proof over the deposited
 * ring, verified by the `sigma_verify` JLVM opcode; double-spend safety comes
 * from a WITNESS-BOUND nullifier carried as the shared DDH point of an
 * OR-of-`dhtuple` proposition.
 *
 * Each ring branch is a DDH tuple `dhtuple(G, H, P_i, Nf)`. A satisfied dhtuple
 * proves knowledge of one `x` with `P_i = x·G` AND `Nf = x·H` (the verifier uses
 * a SINGLE shared response `z` for both coordinate reconstructions
 * `a1 = z·G − e·P_i`, `a2 = z·H − e·Nf`). The OR uses the SAME
 * `v = event.nullifier` in every branch, so it hides which branch while forcing
 * `event.nullifier = x_j·H` for the one real branch `j`. With `H` a NUMS base of
 * unknown dlog w.r.t. `G`, the map `x ↦ x·H` is injective, so the nullifier is
 * cryptographically bound to the proven secret — closing the
 * witness-unbound-nullifier double-spend hole an OR-of-`dlog` ring leaves open.
 *
 * Verified against `@constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5`: the
 * `sigma_verify` dhtuple operands are exactly `["type","g","h","u","v"]` (each a
 * 64-byte G1 hex), the OR child challenges XOR to the node challenge, and the
 * strong-FS root challenge folds the bound message. Array append uses `merge`
 * (`merge([arr,[item]])` flattens one level == append). All operators used
 * (`sigma_verify`, `has`, `set`, `none`, `cat`, `substr`, `merge`) are in
 * KNOWN_OPERATORS.
 *
 * SCOPE: this base definition is CRYPTO + LIFECYCLE. Production custody
 * (`_transferAsset` in on deposit / out on withdraw), a signer-bound deposit-auth
 * clause, and a `mixerId`-prefixed bound message are layered on by a downstream
 * specialization (see the §8 production-hardening note in the design doc).
 */

// =============================================================================
// sigmaDdhRingOf — the OR-of-dhtuple proposition builder
// =============================================================================

/**
 * Emit the `or`-of-`dhtuple` proposition for an `n`-member ring, unrolling
 * `{"var":"<pointsVar>.k"}` for `k in 0..n-1` as the `u` (commitment) of each
 * branch, with `g = gHex`, `h = hHex` (literal 64-byte G1 hex) and a shared
 * `v = {"var":"<nullifierVar>"}` across ALL branches.
 *
 * `n` is FIXED at definition time (the proposition shape is closed). `u` and `v`
 * are `{"var":...}` map-node values that the evaluator resolves element-wise.
 *
 * @param pointsVar    state var holding the ordered ring points, e.g. `"state.points"`.
 * @param nullifierVar event var holding the revealed nullifier, e.g. `"event.nullifier"`.
 * @param gHex         the verifier generator `G=(1,2)` as 64-byte `0x` hex.
 * @param hHex         the NUMS second base `H` as 64-byte `0x` hex (unknown dlog wrt G).
 * @param n            ring size (number of unrolled branches).
 */
export function sigmaDdhRingOf(
  pointsVar: string,
  nullifierVar: string,
  gHex: string,
  hHex: string,
  n: number,
): JsonLogicRule {
  const children: JsonLogicRule[] = [];
  for (let k = 0; k < n; k++) {
    children.push({
      type: 'dhtuple',
      g: gHex,
      h: hHex,
      u: { var: `${pointsVar}.${k}` },
      v: { var: nullifierVar },
    });
  }
  return { type: 'or', children };
}

/**
 * The shared withdraw verify clauses (ring proof ∧ freshness ∧ recipient-bind).
 * The lifecycle clause (`→drained` vs `→open`) is appended per transition.
 */
function withdrawVerifyClauses(gHex: string, hHex: string, n: number): JsonLogicRule[] {
  return [
    {
      sigma_verify: [
        sigmaDdhRingOf('state.points', 'event.nullifier', gHex, hHex, n),
        { var: 'event.proof' },
        { var: 'event.message' },
      ],
    },
    // Double-withdraw prevention: the witness-bound nullifier must be unseen.
    { '!': { has: [{ var: 'state.spentNullifiers' }, { var: 'event.nullifier' }] } },
    // Recipient binding (anti-front-run): message == Nf ‖ recipientHex.
    {
      '===': [
        { var: 'event.message' },
        {
          cat: ['0x', { substr: [{ var: 'event.nullifier' }, 2] }, { substr: [{ var: 'event.recipientHex' }, 2] }],
        },
      ],
    },
  ];
}

// The withdraw effect: record the nullifier, advance the counter (+ optional status).
function withdrawEffect(extra: Record<string, unknown>): JsonLogicRule {
  return {
    merge: [
      { var: 'state' },
      {
        spentNullifiers: {
          set: [{ var: 'state.spentNullifiers' }, { var: 'event.nullifier' }, true],
        },
        withdrawCount: { '+': [{ var: 'state.withdrawCount' }, 1] },
        ...extra,
      },
    ],
  };
}

// G=(1,2) and the NUMS H are the e2e defaults (derived by scripts/gen-sigma-mixer-fixture.ts).
// Downstream apps pass their own audited H via the builder; these are the pinned-ring v1 demo values.
const G_HEX =
  '0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002';
const H_HEX =
  '0x039c846e3a79217fd140d094eec09fe4f398085d01dee70506edde1eb6a9d81608922722cc3a6c3a7ae4929e78e82dc5f25e91598a69f7f8b9b3adb95badb3d0';
const RING_N = 4;

/**
 * sigma-mixer fiber definition (pinned-ring v1, n=4).
 *
 * Trust model: PUBLIC. Anyone may deposit a ring point or submit a withdrawal.
 * Privacy = a CDS OR-proof hides which of the n branches is being spent;
 * anonymity set = exactly n (the ring size is public). Double-spend safety =
 * the witness-bound nullifier + spent-set. Replay/front-run safety = the
 * message-bound recipient.
 */
export const mixerDdhRingDef = defineFiberApp({
  metadata: {
    name: 'MixerDdhRing',
    app: 'privacy',
    type: 'sigma-mixer',
    version: '1.0.0',
    description:
      'CDS OR-of-dhtuple Σ-protocol ring mixer. Anonymity via sigma_verify over an ' +
      'OR of DDH tuples (G,H,P_i,nullifier); the revealed nullifier Nf=x_j·H is ' +
      'witness-bound (H has unknown dlog wrt G), closing the ring-drain double-spend. ' +
      'Frozen-ring lifecycle (filling→open→drained) + message-bound recipient.',
  },

  createSchema: {
    required: ['mixerId', 'denomination', 'anonymityTarget'] as const,
    properties: {
      mixerId: { type: 'string', immutable: true, description: 'Mixer instance id.' },
      denomination: {
        type: 'integer',
        immutable: true,
        description: 'Equal denomination per deposit/withdraw (production custody).',
      },
      nullifierBaseH: {
        type: 'string',
        immutable: true,
        description: 'The NUMS second base H (64B G1 hex); informational — H is inlined in the proposition.',
      },
      anonymityTarget: {
        type: 'integer',
        immutable: true,
        description: 'Ring size n; the ring opens once depositCount == anonymityTarget.',
      },
      points: {
        type: 'array',
        items: { type: 'string' },
        default: [],
        description: 'Ordered ring commitments P_i = x_i·G (64B G1 hex).',
      },
      spentNullifiers: {
        type: 'object',
        default: {},
        description: 'FLAT map nullifierHex -> true. MUST be {} (never null): has/set throw on null.',
      },
      depositCount: { type: 'integer', default: 0 },
      withdrawCount: { type: 'integer', default: 0 },
      status: { type: 'string', default: 'filling', description: 'filling → open → drained.' },
    },
  },

  stateSchema: {
    properties: {
      mixerId: { type: 'string', immutable: true },
      denomination: { type: 'integer', immutable: true },
      nullifierBaseH: { type: 'string', immutable: true },
      anonymityTarget: { type: 'integer', immutable: true },
      points: { type: 'array', items: { type: 'string' }, computed: true },
      spentNullifiers: { type: 'object', computed: true },
      depositCount: { type: 'integer', computed: true },
      withdrawCount: { type: 'integer', computed: true },
      status: { type: 'string', computed: true },
    },
  },

  eventSchemas: {
    deposit: { description: 'Register a ring commitment point P_i = x_i·G.' },
    withdraw: {
      description: 'Spend one ring slot: a CDS OR-of-dhtuple proof + witness-bound nullifier + bound recipient.',
    },
  },

  states: {
    filling: {
      id: 'filling',
      isFinal: false,
      metadata: { label: 'Filling', description: 'Ring accepting deposits.', category: 'active' },
    },
    open: {
      id: 'open',
      isFinal: false,
      metadata: { label: 'Open', description: 'Ring frozen; withdrawals allowed.', category: 'active' },
    },
    drained: {
      id: 'drained',
      isFinal: true,
      metadata: { label: 'Drained', description: 'All slots withdrawn; one-shot.', category: 'terminal' },
    },
  },

  initialState: 'filling',

  // ORDER IS LOAD-BEARING: the open-flip deposit is declared FIRST (exact
  // boundary), the drained-flip withdraw is declared FIRST (exact boundary).
  transitions: [
    // Deposit A — the LAST deposit: filling → open. Declared FIRST.
    {
      from: 'filling',
      to: 'open',
      eventName: 'deposit',
      guard: {
        and: [
          { '===': [{ '+': [{ var: 'state.depositCount' }, 1] }, { var: 'state.anonymityTarget' }] },
          { '!!': [{ var: 'event.point' }] },
          { none: [{ var: 'state.points' }, { '===': [{ var: '' }, { var: 'event.point' }] }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            // Array append = merge([arr,[item]]) (verified: opMerge flattens one level).
            points: { merge: [{ var: 'state.points' }, [{ var: 'event.point' }]] },
            depositCount: { '+': [{ var: 'state.depositCount' }, 1] },
            status: 'open',
          },
        ],
      },
      dependencies: [],
    },
    // Deposit B — not-yet-last: filling → filling. Declared SECOND.
    {
      from: 'filling',
      to: 'filling',
      eventName: 'deposit',
      guard: {
        and: [
          { '<': [{ '+': [{ var: 'state.depositCount' }, 1] }, { var: 'state.anonymityTarget' }] },
          { '!!': [{ var: 'event.point' }] },
          { none: [{ var: 'state.points' }, { '===': [{ var: '' }, { var: 'event.point' }] }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            points: { merge: [{ var: 'state.points' }, [{ var: 'event.point' }]] },
            depositCount: { '+': [{ var: 'state.depositCount' }, 1] },
          },
        ],
      },
      dependencies: [],
    },
    // Withdraw → drained (the LAST withdrawal). Declared FIRST.
    {
      from: 'open',
      to: 'drained',
      eventName: 'withdraw',
      guard: {
        and: [
          ...withdrawVerifyClauses(G_HEX, H_HEX, RING_N),
          { '===': [{ '+': [{ var: 'state.withdrawCount' }, 1] }, { var: 'state.anonymityTarget' }] },
        ],
      },
      effect: withdrawEffect({ status: 'drained' }),
      dependencies: [],
    },
    // Withdraw → open (not-yet-last). Declared SECOND.
    {
      from: 'open',
      to: 'open',
      eventName: 'withdraw',
      guard: {
        and: [
          ...withdrawVerifyClauses(G_HEX, H_HEX, RING_N),
          { '<': [{ '+': [{ var: 'state.withdrawCount' }, 1] }, { var: 'state.anonymityTarget' }] },
        ],
      },
      effect: withdrawEffect({}),
      dependencies: [],
    },
  ],
});
