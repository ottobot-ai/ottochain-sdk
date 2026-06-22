/**
 * shielded-note-pool — a Tornado-style fixed-denomination UTXO-private asset pool.
 *
 * One fiber instance is one shielded pool. The pool's PUBLIC state is the privacy
 * scaffolding only — a Poseidon-Merkle commitment ROOT window, a spent-NULLIFIER set,
 * an append-only output-COMMITMENT log, and the asset-record UUIDs the pool custodies.
 * The real value model is a UTXO note layer that lives OFF-chain in notes committed to
 * the tree; each spend is attested by a single Groth16 proof of the `zk-shielded` circuit.
 *
 * Division of labour (the Kachina/Midnight split — a general verifier in the VM, the
 * shielded pool as ordinary state + transitions on top of it; see
 * docs/design/ergo-patterns-as-fiber-primitives.md §"shielded-note-pool" and
 * docs/design/shielded-transfer-app-sketch.md):
 *   - the CIRCUIT proves membership (Poseidon-Merkle inclusion) ∧ authorization
 *     (`owner == Poseidon([nsk])`) ∧ nullifier derivation (`nf == Poseidon([rho, nsk])`)
 *     ∧ intra-transfer nullifier uniqueness ∧ per-asset conservation ∧ u64 range;
 *   - this GUARD (combine) verifies the proof against the pinned `vkey`, binds the
 *     public inputs by slicing them from the VERIFIED `publicValues` bytes, rejects an
 *     already-spent nullifier (`none`), checks the spend's anchor is still honored
 *     (`in [anchor, knownRoots]`), and pins the fee word to a configured value;
 *   - the EFFECT (combine) spends the nullifier, logs the output commitment, advances
 *     the rolling anchor window, and (on `unshield`) releases exactly one whole
 *     `denom`-valued asset record to a clear recipient.
 *
 * It uses NO new metakit opcode. `groth16_verify` verifies the proof; the public-input
 * words are extracted from the verified `publicValues` string with fixed-offset `substr`
 * and re-prefixed `0x` (`{cat:['0x', {substr:[pv,off,64]}]}`) — slicing the verified
 * bytes IS the binding, so no field can be mauled independently of the proof.
 *
 * ──────────────────────────────────────────────────────────────────────────────────────
 *  ⚠ UNAUDITED — TEST ASSETS ONLY. The `zk-shielded` circuit and its Groth16 verifier are
 *  UNAUDITED; BN254 is ~100-bit security. This MVP is test-assets-only and pins
 *  N=1 input / M=1 output / zero fee, with a SINGLE TRUSTED RELAYER for root advancement.
 *  Do NOT deploy with value-bearing assets until the circuit + verifier are audited and the
 *  in-circuit `newRoot` (which removes the trusted relayer) has landed. See §"Scope" / the
 *  Risks list in the design doc.
 * ──────────────────────────────────────────────────────────────────────────────────────
 *
 * MVP constraints (CONFIRMED DEFAULTS):
 *   - test assets only;
 *   - single trusted relayer gates root advancement (`event.newRoot` is NOT in the proven
 *     public values, so a non-relayer could otherwise flood `knownRoots` and evict honest
 *     in-flight anchors — a real DoS). LATER: prove `newRoot` in-circuit and drop the relayer.
 *   - fixed denomination; the deposit mint is transparent (Tornado-style), the amount is
 *     hidden among same-`denom` notes (anonymity set = all live `denom` notes).
 *
 * On-chain primitive facts this builder relies on (re-verified against
 * `@constellation-network/metagraph-sdk-jlvm@1.8.0-rc.5`, see tests/note-pool.test.ts):
 *   - array APPEND is `merge([arr,[item]])` (flatten one level); `cat` on arrays ERRORS
 *     ("Unexpected input for `cat`") — never use `cat` for array append on-chain;
 *   - every crypto/compare value is `0x`-prefixed; an extracted word MUST be re-prefixed
 *     `{cat:['0x', {substr:[pv,off,64]}]}` before comparing with a stored `0x` hash;
 *   - `none [arr, {===:[{var:""}, x]}]` fires correctly (fresh→true, spent→false);
 *   - `groth16_verify` on a garbage bundle returns `false` (graceful deny, never throws);
 *   - `pmt_verify([root, leaf, index, [siblings]])` is Poseidon-Merkle inclusion with
 *     ROOT-FIRST siblings and a leaf-position `index` (depth range-checked) — exported as
 *     {@link pmtMembership} for off-chain witness building / a membership-gated variant.
 */

import { defineFiberApp, type FiberAppDefinition, type JsonLogicRule, type SchemaField } from "../../../schema/fiber-app.js";
import { signerIsParty } from "../../../schema/guards.js";
import { transferAsset } from "../../../schema/effects.js";

// =============================================================================
// Public-input layout the guard expects (for fixture / circuit generation)
// =============================================================================

/**
 * The EXACT `publicValues` layout the guard slices, for the N=1 input / M=1 output MVP.
 *
 * `publicValues` is the abi-encoded `ShieldedTransferPublicValues` carried as a single
 * `0x`-prefixed lowercase-hex string. Each 32-byte ABI word is 64 hex chars; word `w`
 * begins at hex offset `2 + 64*w` (the leading `2` skips `0x`).
 *
 * `ShieldedTransferPublicValues { bytes32 anchor; bytes32[] nullifiers; bytes32[] outputCms;
 *  uint64 fee; bytes32 feeAsset; }`. ABI-encoded with the two dynamic arrays as a head of
 * offsets + a tail of (len, elems). For FIXED N=1/M=1 the tail is static and `substr`-addressable.
 *
 * ┌── field ─────────────┬── hex offset ─┬── width ─┬── notes ─────────────────────────────────┐
 * │ anchor               │      2        │   64     │ Poseidon-Merkle root the inputs prove under │
 * │ fee  (uint64 word)   │    194        │   64     │ transparent fee, right-aligned in word 3    │
 * │ feeAsset             │    258        │   64     │ asset-as-Fr the fee is denominated in       │
 * │ nullifiers[0]        │    386        │   64     │ after the nullifiers length word @322       │
 * │ outputCms[0]         │    514        │   64     │ after the outputCms length word @450        │
 * └──────────────────────┴───────────────┴──────────┴─────────────────────────────────────────────┘
 *
 * The word ORDER and ENCODING a matching SP1 fixture MUST produce (so the placeholder can be
 * swapped for a real proof): the `0x`-string is
 *   0x ‖ anchor ‖ <head offset words for the two arrays> ‖ fee ‖ feeAsset ‖
 *      nullifiers.len ‖ nullifiers[0] ‖ outputCms.len ‖ outputCms[0]
 * laid out by the circuit's `commit_public_values(ShieldedTransferPublicValues{..})` ABI encoder,
 * such that the five offsets below land on the words above. Every word is a lowercase
 * 32-byte hex with NO `0x` per-word prefix (the single `0x` is on the whole string).
 *
 * cm / nf preimages (the circuit's, fixed and byte-for-byte across Scala/Rust/TS):
 *   - `cm = Poseidon([value_as_fr, owner, asset, rho])` (4-input, MAX poseidon arity);
 *   - `owner = Poseidon([nsk])`;
 *   - `nf = Poseidon([rho, nsk])` (FIELD ORDER rho, nsk).
 */
export const PV_LAYOUT = {
  /** anchor — word 0. */
  anchor: 2,
  /** fee — word 3 (uint64 right-aligned). MVP pins this whole word to {@link NotePoolOptions.feeWord}. */
  fee: 194,
  /** feeAsset — word 4. */
  feeAsset: 258,
  /** nullifiers[0] — after the nullifiers length word @322. */
  nullifier: 386,
  /** outputCms[0] — after the outputCms length word @450. */
  outputCm: 514,
} as const;

// =============================================================================
// Field extraction — slice the VERIFIED bytes, re-prefix 0x (the binding)
// =============================================================================

const WORD_HEX = 64; // a 32-byte ABI word as hex chars

/**
 * Lift `publicValues` word at hex `offset` back to a `0x`-hex value comparable with a stored
 * `bytes32`/`hash`. `cat` of two STRINGS is valid on-chain; `cat` of arrays ERRORS — this is
 * strings only. The slice is taken from the SAME bytes `groth16_verify` consumed, so a changed
 * field invalidates the proof: re-prefixing the verified slice IS the public-input binding.
 */
export const pvField = (offset: number): JsonLogicRule => ({
  cat: ["0x", { substr: [{ var: "event.publicValues" }, offset, WORD_HEX] }],
});

/**
 * `pmt_verify([root, leaf, index, [siblings]])` Poseidon-Merkle inclusion (root-first siblings,
 * leaf-position `index`, depth = `siblings.length`, range-checked). Exported for off-chain witness
 * building and for a membership-gated pool variant. NOTE: the MVP `transfer`/`unshield` guards do
 * NOT call `pmt_verify` — membership is proven INSIDE the circuit (`verify_inclusion`) and bound to
 * the verified `anchor`; the chain only checks `anchor ∈ knownRoots`. This helper exists so a
 * downstream pool that wants an additional ON-CHAIN inclusion check (e.g. for a transparent leaf)
 * can express it with the verified operand format.
 */
export const pmtMembership = (
  rootVar: JsonLogicRule,
  leafVar: JsonLogicRule,
  indexVar: JsonLogicRule,
  siblingsVar: JsonLogicRule,
): JsonLogicRule => ({ pmt_verify: [rootVar, leafVar, indexVar, siblingsVar] });

// =============================================================================
// Options + public state
// =============================================================================

export interface NotePoolOptions {
  /** zk-shielded program vkey (32B, `0x`-hex). Pinned ONCE at creation; the guard reads it from state. */
  vkey: string;
  /** Merkle depth of the commitment tree, pinned at creation. */
  depth: number;
  /** Fixed note denomination (asset units). Each live note ⇔ one `denom`-valued asset record. */
  denom: number;
  /** Asset policy ref the pool mints/burns note-records under (the deposit authorization surface). */
  poolPolicyRef: string;
  /** `0x` Fr label fees are charged in (== asset-as-Fr). Must equal the proof's `feeAsset` word. */
  feeAsset: string;
  /**
   * The EXACT `0x` 32-byte word `fee` must equal. MVP: the all-zero word (forces fee=0, rejects any
   * value-siphoning fee). LATER, to allow a fixed nonzero fee, compare only the right 16 hex.
   */
  feeWord?: string;
  /** DAG address authorized to advance the root (MVP single trusted relayer; anti-grief). */
  relayer: string;
  /** How many recent anchors stay spendable (rolling window). Default 64. */
  rootWindow?: number;
}

/** The all-zero 32-byte word — the MVP `feeWord` (pins fee=0). */
export const ZERO_WORD = "0x" + "0".repeat(64);

/** Public state every shielded note-pool carries (the note value model itself is private/off-chain). */
export const NOTE_POOL_STATE: Record<string, SchemaField> = {
  vkey: { type: "hash", immutable: true, description: "zk-shielded program vkey (32B, 0x)" },
  depth: { type: "integer", immutable: true, description: "merkle depth pinned at creation" },
  denom: { type: "integer", immutable: true, description: "fixed note denomination (asset units)" },
  poolPolicyRef: { type: "string", immutable: true, description: "asset policy the pool mints/burns note-records under" },
  feeAsset: { type: "hash", immutable: true, description: "0x Fr label fees are charged in (== asset-as-Fr)" },
  feeWord: { type: "hash", immutable: true, description: "the EXACT 0x 32-byte word `fee` must equal (MVP: zero word)" },
  relayer: { type: "string", immutable: true, description: "DAG address authorized to advance the root (MVP single trusted relayer)" },
  rootWindow: { type: "integer", immutable: true, default: 64 },
  currentRoot: { type: "hash", computed: true },
  knownRoots: { type: "array", computed: true, description: "rolling window of valid anchors (0x)" },
  nullifiers: { type: "array", computed: true, description: "spent set (0x); monotonic — O(n) `none` scan, see ceiling note" },
  commitments: { type: "array", computed: true, description: "append-only output-commitment log (0x)" },
  noteRecords: { type: "array", computed: true, description: "assetId UUIDs of live note-records the pool holds" },
  leafCount: { type: "integer", computed: true, default: 0 },
  transfers: { type: "integer", computed: true, default: 0 },
};

// =============================================================================
// Event payload TS types (informational; the chain validates structurally)
// =============================================================================

/** `transfer` / `unshield` carry a Groth16 bundle; `unshield` also carries the record to release. */
export interface ShieldedSpendPayload {
  /** Groth16 proof bytes (0x hex). */
  proof: string;
  /** abi-encoded `ShieldedTransferPublicValues` (0x hex); see {@link PV_LAYOUT}. */
  publicValues: string;
}

/** `transfer` advances the tree; `newRoot` is wallet/relayer-computed (NOT in the proven PV). */
export interface TransferPayload extends ShieldedSpendPayload {
  /** wallet/relayer-computed root after appending `outputCms[0]`. Authorized by the relayer signer gate. */
  newRoot: string;
}

/** `unshield` releases one whole `denom`-valued record the pool holds to a clear recipient. */
export interface UnshieldPayload extends ShieldedSpendPayload {
  /** assetId UUID of the note-record to release; MUST be `in state.noteRecords`. */
  recordId: string;
  /** clear DAG address (→ `AssetHolder.Wallet`) that receives the released note-record. */
  recipient: string;
}

/** `noteMinted` records a deposit's commitment + the freshly-minted record's UUID. */
export interface NoteMintedPayload {
  /** client-computed `cm = Poseidon([denom, owner, feeAsset, rho])` (0x). */
  commitment: string;
  /** assetId UUID of the `denom`-valued record the deposit minted into `Fiber(poolId)`. */
  recordId: string;
}

// =============================================================================
// Guard / effect builders
// =============================================================================

/** Extracted, 0x-re-prefixed public-input words (shared by `transfer` and `unshield`). */
const pvWords = () => ({
  anchor: pvField(PV_LAYOUT.anchor),
  feeWord: pvField(PV_LAYOUT.fee),
  feeAsset: pvField(PV_LAYOUT.feeAsset),
  nullifier: pvField(PV_LAYOUT.nullifier),
  newCm: pvField(PV_LAYOUT.outputCm),
});

/**
 * The proof + nullifier + anchor + fee binding shared by every spend (combiner-only, all
 * stateful). Binds against the EXACT verified bytes: any field change invalidates the Groth16.
 */
const spendBinding = (w: ReturnType<typeof pvWords>): JsonLogicRule[] => [
  // 1. the proof verifies against the pool's pinned vkey over EXACTLY these public bytes
  { groth16_verify: [{ var: "state.vkey" }, { var: "event.publicValues" }, { var: "event.proof" }] },
  // 2. the spend's anchor is a root we produced and still honor
  { in: [w.anchor, { var: "state.knownRoots" }] },
  // 3. INTER-transfer double-spend: the (0x-prefixed) nullifier is not already spent
  { none: [{ var: "state.nullifiers" }, { "===": [{ var: "" }, w.nullifier] }] },
  // 4. no fee-asset spoofing
  { "===": [w.feeAsset, { var: "state.feeAsset" }] },
  // 5. no value siphon via fee: the whole fee word is pinned (MVP: the zero word ⇒ fee==0)
  { "===": [w.feeWord, { var: "state.feeWord" }] },
];

/**
 * Build the shielded-note-pool fiber app.
 *
 * Single state `ACTIVE → ACTIVE` with three transitions:
 *   - `transfer`  — note-to-note spend (no public asset move); advances the tree. Relayer-gated.
 *   - `noteMinted`— witness transition recording a deposit's commitment + record UUID (the deposit
 *                   itself is an asset-model `MintAsset` into `Fiber(poolId)`, gated by the
 *                   `poolPolicyRef` mintPolicy — NOT a fiber transition).
 *   - `unshield`  — burn a note (nullify), release one whole `denom` note-record to a clear recipient.
 *                   Self-sufficient because it is CASCADE-REACHABLE (asset transfers fire from cascades).
 */
export function notePoolDef(opts: NotePoolOptions): FiberAppDefinition {
  const feeWord = opts.feeWord ?? ZERO_WORD;
  const w = pvWords();

  // --- transfer: note-to-note spend, advance the rolling anchor window ---------------------
  const transferGuard: JsonLogicRule = {
    and: [
      ...spendBinding(w),
      // Root-advance authz: only the pinned relayer's signed `transfer` advances the tree, so a
      // non-relayer cannot flood `knownRoots` and evict honest in-flight anchors (DoS). Uses
      // `proofs[].address` (verified signers) — NOT a forgeable `event.*` field.
      signerIsParty("state.relayer"),
    ],
  };

  const transferEffect: JsonLogicRule = {
    merge: [
      { var: "state" },
      {
        // append via merge (NOT cat — cat errors on arrays on-chain)
        nullifiers: { merge: [{ var: "state.nullifiers" }, [w.nullifier]] },
        commitments: { merge: [{ var: "state.commitments" }, [w.newCm]] },
        currentRoot: { var: "event.newRoot" },
        // append newRoot, then trim to the last rootWindow anchors via negative-start slice
        knownRoots: {
          slice: [
            { merge: [{ var: "state.knownRoots" }, [{ var: "event.newRoot" }]] },
            { "*": [-1, { var: "state.rootWindow" }] },
          ],
        },
        leafCount: { "+": [{ var: "state.leafCount" }, 1] },
        transfers: { "+": [{ var: "state.transfers" }, 1] },
      },
    ],
  };

  // --- noteMinted: witness a deposit (record its commitment + record UUID) ------------------
  // The deposit is an asset-model MintAsset of a `denom`-valued record into Fiber(poolId), gated by
  // the poolPolicyRef mintPolicy (pins amount==denom, holder==pool, depositor-signed). This witness
  // transition only records bookkeeping; `unshield` independently re-checks record custody at
  // withdrawal (the asset combiner's R1 holder defense), so a forged noteMinted cannot extract value.
  const noteMintedGuard: JsonLogicRule = {
    // the depositor (who signed the mint) signs this witness; the commitment + recordId are theirs.
    // No balance read (no guard can witness an escrow). The release-time custody check is the real gate.
    and: [signerIsParty("event.depositor")],
  };

  const noteMintedEffect: JsonLogicRule = {
    merge: [
      { var: "state" },
      {
        commitments: { merge: [{ var: "state.commitments" }, [{ var: "event.commitment" }]] },
        noteRecords: { merge: [{ var: "state.noteRecords" }, [{ var: "event.recordId" }]] },
        leafCount: { "+": [{ var: "state.leafCount" }, 1] },
      },
    ],
  };

  // --- unshield: burn a note, release exactly one whole note-record ------------------------
  const unshieldGuard: JsonLogicRule = {
    and: [
      ...spendBinding(w),
      // can only release a record the pool actually holds (combiner R1 holder defense re-checks too)
      { in: [{ var: "event.recordId" }, { var: "state.noteRecords" }] },
    ],
  };

  const unshieldEffect: JsonLogicRule = {
    merge: [
      { var: "state" },
      {
        nullifiers: { merge: [{ var: "state.nullifiers" }, [w.nullifier]] },
        // remove the released record id from the live set
        noteRecords: {
          filter: [{ var: "state.noteRecords" }, { "!==": [{ var: "" }, { var: "event.recordId" }] }],
        },
        transfers: { "+": [{ var: "state.transfers" }, 1] },
        // release exactly one whole denom-valued record to a clear recipient wallet
        ...transferAsset([{ assetId: { var: "event.recordId" }, recipient: { var: "event.recipient" } }]),
      },
    ],
  };

  return defineFiberApp({
    metadata: {
      name: "ShieldedNotePool",
      app: "privacy",
      type: "shielded-note-pool",
      version: "0.1.0",
      description:
        "UNAUDITED, TEST-ASSETS-ONLY fixed-denomination UTXO-private asset pool over the zk-shielded " +
        "Groth16 circuit (BN254 ~100-bit). Notes live off-chain in a Poseidon-Merkle tree; spends are " +
        "attested by a Groth16 proof. Public state = nullifier set + anchor window + commitment log. " +
        "Single trusted relayer advances the root (MVP). Do NOT deploy with value-bearing assets.",
    },

    createSchema: {
      required: ["vkey", "depth", "denom", "poolPolicyRef", "feeAsset", "relayer"],
      properties: {
        vkey: { type: "hash", immutable: true, default: opts.vkey },
        depth: { type: "integer", immutable: true, default: opts.depth },
        denom: { type: "integer", immutable: true, default: opts.denom },
        poolPolicyRef: { type: "string", immutable: true, default: opts.poolPolicyRef },
        feeAsset: { type: "hash", immutable: true, default: opts.feeAsset },
        feeWord: { type: "hash", immutable: true, default: feeWord },
        relayer: { type: "string", immutable: true, default: opts.relayer },
        rootWindow: { type: "integer", immutable: true, default: opts.rootWindow ?? 64 },
      },
    },

    stateSchema: { properties: { ...NOTE_POOL_STATE } },

    eventSchemas: {
      transfer: {
        description: "Note-to-note shielded spend (N=1/M=1), attested by a zk-shielded Groth16 proof; advances the tree.",
        required: ["proof", "publicValues", "newRoot"],
        properties: {
          proof: { type: "string", description: "Groth16 proof bytes (0x hex)" },
          publicValues: { type: "string", description: "abi-encoded ShieldedTransferPublicValues (0x hex); see PV_LAYOUT" },
          newRoot: { type: "hash", description: "wallet/relayer-computed root after appending outputCms[0]" },
        },
      },
      noteMinted: {
        description: "Witness a deposit: record its commitment + the minted note-record's UUID.",
        required: ["commitment", "recordId", "depositor"],
        properties: {
          commitment: { type: "hash", description: "client-computed cm = Poseidon([denom, owner, feeAsset, rho]) (0x)" },
          recordId: { type: "uuid", description: "assetId of the denom-valued record minted into Fiber(poolId)" },
          depositor: { type: "address", description: "DAG address of the depositor who signed the mint" },
        },
      },
      unshield: {
        description: "Burn a note, release one whole denom-valued note-record to a clear recipient.",
        required: ["proof", "publicValues", "recordId", "recipient"],
        properties: {
          proof: { type: "string", description: "Groth16 proof bytes (0x hex)" },
          publicValues: { type: "string", description: "abi-encoded ShieldedTransferPublicValues (0x hex); see PV_LAYOUT" },
          recordId: { type: "uuid", description: "note-record to release; MUST be in state.noteRecords" },
          recipient: { type: "address", description: "clear DAG address that receives the released record" },
        },
      },
    },

    states: {
      ACTIVE: {
        id: "ACTIVE",
        isFinal: false,
        metadata: { label: "Active", description: "Pool accepts shielded transfers, deposits, and withdrawals", category: "active" },
      },
    },
    initialState: "ACTIVE",

    transitions: [
      { from: "ACTIVE", to: "ACTIVE", eventName: "transfer", guard: transferGuard, effect: transferEffect, dependencies: [] },
      { from: "ACTIVE", to: "ACTIVE", eventName: "noteMinted", guard: noteMintedGuard, effect: noteMintedEffect, dependencies: [] },
      { from: "ACTIVE", to: "ACTIVE", eventName: "unshield", guard: unshieldGuard, effect: unshieldEffect, dependencies: [] },
    ],
  });
}
