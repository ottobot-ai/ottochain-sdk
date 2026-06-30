/**
 * shieldApp — turn a fiber app into a PRIVATE-state pool.
 *
 * Given a base {@link FiberAppDefinition} (the app whose state + transition you want to keep
 * private), `shieldApp` returns a new `FiberAppDefinition` for a "shielded pool" Machine fiber.
 * The pool's state is PUBLIC scaffolding only — the spent-nullifier set, the commitment log, and
 * the set of valid anchors — while the app's real state lives off-chain in a note committed to
 * the tree. Each app transition is carried out off-chain and attested by a single
 * `zk-jlvm-shielded` Groth16 proof; the on-chain combine just verifies the proof, rejects an
 * already-spent nullifier, and records the new commitment.
 *
 * Division of labour (see ottochain-sdk RFC docs/design/zk-private-contract-state-rfc.md):
 *  - the CIRCUIT proves membership ∧ authorization ∧ `jlvm-core` effect ∧ new commitment;
 *  - this GUARD (combine) verifies the proof, pins which app logic ran (`exprHash`), checks the
 *    anchor is recent, and checks the nullifier is fresh — all combiner-only (CLAUDE.md);
 *  - block-validity stays structural (proof / publicValues present + hex).
 *
 * It uses NO new metakit opcode: `groth16_verify` verifies the proof, and the four-`bytes32`
 * public values (`anchor`, `nullifier`, `newCommitment`, `exprHash`) are extracted from the
 * VERIFIED `publicValues` string with fixed-offset `substr` — slicing the verified bytes IS the
 * binding (§8.1).
 *
 * NOTE on cost: the note model rehashes the whole state each transition, so proving cost is
 * O(state size) (RFC §8). Keep shielded note state small (a few KB); for large keyed state use
 * the auth-DB variant (RFC §3.1.1).
 */

import { defineFiberApp, type FiberAppDefinition, type JsonLogicRule, type SchemaField } from '../schema/fiber-app.js';

export interface ShieldOptions {
  /** SP1 program vkey for the zk-jlvm-shielded circuit (0x-prefixed bytes32 hex). Pinned at creation. */
  vkey: string;
  /**
   * `keccak256(effectExpr)` the circuit commits — pins WHICH app logic the accepted proofs ran.
   * Compute it from the base app's transition effect; one pinned effect per pool (the per-event /
   * multi-effect generalization is RFC §10 open question 1).
   */
  exprHash: string;
  /** How many recent anchors stay spendable (rolling window). Default 64. */
  rootWindow?: number;
}

/**
 * Field extractors over the abi-encoded `JlvmTransitionPublicValues` — four static `bytes32`
 * `[anchor | nullifier | newCommitment | exprHash]`, a fixed 128-byte (256 hex char) layout with
 * NO dynamic arrays. `publicValues` is the 0x-prefixed hex from the prover, so each field is 64
 * hex chars starting at: anchor=2, nullifier=66, newCommitment=130, exprHash=194.
 */
const pvField = (publicValues: JsonLogicRule, hexOffset: number): JsonLogicRule => ({
  substr: [publicValues, hexOffset, 64],
});

/** Standard public state every shielded pool carries (the rest of the app state is private/off-chain). */
export const SHIELDED_POOL_STATE: Record<string, SchemaField> = {
  vkey: { type: 'hash', immutable: true },
  exprHash: { type: 'hash', immutable: true },
  rootWindow: { type: 'integer', immutable: true },
  currentRoot: { type: 'hash', computed: true },
  knownRoots: { type: 'array', computed: true, description: 'rolling window of valid anchors (hex)' },
  nullifiers: { type: 'array', computed: true, description: 'spent set (hex); monotonic — see RFC §5.3' },
  commitments: { type: 'array', computed: true, description: 'append-only log of output commitments (hex)' },
  leafCount: { type: 'integer', computed: true, default: 0 },
  transitions: { type: 'integer', computed: true, default: 0 },
};

/**
 * Build the shielded-pool variant of `base`.
 *
 * @param base  the app being shielded (used for naming + to document the pinned logic).
 * @param opts  the circuit vkey + the pinned `exprHash` + the anchor window.
 */
export function shieldApp(base: FiberAppDefinition, opts: ShieldOptions): FiberAppDefinition {
  const publicValues: JsonLogicRule = { var: 'event.publicValues' };
  const anchor = pvField(publicValues, 2);
  const nullifier = pvField(publicValues, 66);
  const newCommitment = pvField(publicValues, 130);
  const exprHash = pvField(publicValues, 194);

  // GUARD (combine): all stateful, combiner-only.
  const guard: JsonLogicRule = {
    and: [
      // 1. the proof verifies against the pool's pinned vkey over EXACTLY these public bytes
      { groth16_verify: [{ var: 'state.vkey' }, publicValues, { var: 'event.proof' }] },
      // 2. it ran the app logic this pool pins (binds which effect produced the transition)
      { '===': [exprHash, { var: 'state.exprHash' }] },
      // 3. the spent note was proven under an anchor we still honor
      { in: [anchor, { var: 'state.knownRoots' }] },
      // 4. inter-transfer double-spend guard: the nullifier is not already spent
      { none: [{ var: 'state.nullifiers' }, { '===': [{ var: '' }, nullifier] }] },
    ],
  };

  // EFFECT (combine): spend the nullifier, record the new commitment, advance counters.
  // Root advancement (turning the appended commitment into the next anchor) is wallet/Bridge-side
  // per RFC §6.2 / §10; the chain records the commitment + nullifier here.
  const effect: JsonLogicRule = {
    merge: [
      { var: 'state' },
      {
        nullifiers: { cat: [{ var: 'state.nullifiers' }, [nullifier]] },
        commitments: { cat: [{ var: 'state.commitments' }, [newCommitment]] },
        leafCount: { '+': [{ var: 'state.leafCount' }, 1] },
        transitions: { '+': [{ var: 'state.transitions' }, 1] },
        lastTransitionAt: { var: '$ordinal' },
      },
    ],
  };

  return defineFiberApp({
    metadata: {
      name: `Shielded${base.metadata.name}`,
      app: 'privacy',
      type: `shielded-${base.metadata.type}`,
      version: base.metadata.version,
      description:
        `Shielded (zk-jlvm-shielded) variant of ${base.metadata.name}: private state transitions ` +
        `verified by a Groth16 proof; the nullifier set + anchors are public pool state.`,
    },

    createSchema: {
      required: ['vkey', 'exprHash'],
      properties: {
        vkey: { type: 'hash', immutable: true, default: opts.vkey },
        exprHash: { type: 'hash', immutable: true, default: opts.exprHash },
        rootWindow: { type: 'integer', immutable: true, default: opts.rootWindow ?? 64 },
      },
    },

    stateSchema: { properties: { ...SHIELDED_POOL_STATE } },

    eventSchemas: {
      transition: {
        description: `A private state transition of ${base.metadata.name}, attested by a zk-jlvm-shielded Groth16 proof.`,
        required: ['proof', 'publicValues'],
        properties: {
          proof: { type: 'string', description: 'Groth16 proof bytes (0x hex)' },
          publicValues: { type: 'string', description: 'abi-encoded JlvmTransitionPublicValues (4×bytes32, 0x hex)' },
        },
      },
    },

    states: {
      ACTIVE: {
        id: 'ACTIVE',
        isFinal: false,
        metadata: { label: 'Active', description: 'Pool accepts shielded transitions', category: 'active' },
      },
    },
    initialState: 'ACTIVE',

    transitions: [{ from: 'ACTIVE', to: 'ACTIVE', eventName: 'transition', guard, effect, dependencies: [] }],
  });
}
