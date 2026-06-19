# Shielded-transfer app sketch (a jlvm-standard app)

> Status: **design sketch / RFC**. Models confidential value transfer as a standard
> OttoChain fiber app that *consumes* the metakit-sdk `zk-shielded` Groth16 circuit. The
> point of this document is to show the three concrete artifacts asked for — a **state
> schema**, a **combine (effect) step**, and a **guard expression** — wired against the
> *real* app framework (`defineFiberApp` / `buildGenesisManifest`) and the *real* on-chain
> registry (`RegistryShape.Machine`), and to be honest about the two design decisions that
> are not yet settled.
>
> Companion docs: [`metakit-privacy-extensions-handoff.md`](./metakit-privacy-extensions-handoff.md)
> (the P0–P3 privacy roadmap this realizes) and the circuit itself in
> `metakit-sdk/rust/zk-shielded`.
>
> **As-built note (2026-06-19).** The privacy app that actually shipped took the *general private
> contract state* path, not this value-transfer flavor: `src/privacy/shield-app.ts` (a `shieldApp()`
> builder over the **`zk-jlvm-shielded`** circuit, PR #212) + the companion RFC
> [`zk-private-contract-state-rfc.md`](./zk-private-contract-state-rfc.md). This sketch's
> **value-transfer variant over `zk-shielded`** is genuinely **not yet built**, so it stays valid as
> forward design — read it as the value-typed special case of the shipped general machine. The
> `zk-shielded` soundness fixes it cites (intra-transfer nullifier uniqueness, per-asset conservation)
> have since landed in the circuit.

## 0. Thesis: privacy is an app, not a pile of opcodes

The privacy state — the spent-nullifier set and the commitment-tree anchors — is **fiber
app state**. The state transition — *verify a proof, reject already-spent nullifiers, then
spend them* — is a **JLVM combine step**. Nothing here needs a new metakit opcode: the two
crypto primitives the guard needs, `groth16_verify` and `poseidon`, already exist (added in
metakit #49–#53 / metakit-sdk #49–#51), and the set/array logic uses ordinary JSON-Logic
(`none`, `in`, `cat`, `merge`). That keeps metakit small and pushes the policy into an app
that ships in this SDK's genesis manifest like every other std app.

This mirrors the Kachina/Midnight split: a general verifier in the VM, the *contract* (here,
the shielded pool) expressed as ordinary state + transitions on top of it.

## 1. The circuit this app consumes

`zk-shielded`'s `verify_transfer` is the single native+zkVM constraint function; an SP1
proof of it, wrapped to **Groth16-over-BN254** (one universal verifying key, no per-app
trusted setup), is what the app verifies. After the soundness fixes in
`metakit-sdk` (`fix(zk-shielded): nullifier uniqueness + per-asset conservation`), the
**public statement** the proof attests is:

```
ShieldedTransferPublicValues {
  bytes32   anchor;        // Poseidon-Merkle root the inputs are proven under
  bytes32[] nullifiers;    // one per input, INPUT ORDER, pairwise-distinct within the transfer
  bytes32[] outputCms;     // one per output, output order
  uint64    fee;           // transparent fee
  bytes32   feeAsset;      // the asset `fee` is denominated in
}
```

and the guarantees **the circuit already provides**, so the app must *not* re-check them:

| Guarantee | Provided by the circuit |
| --- | --- |
| MEMBERSHIP — each input note is under `anchor` | ✅ Poseidon-Merkle inclusion |
| AUTHORIZATION — spender knows each note's `nsk` | ✅ `owner == Poseidon([nsk])` |
| NULLIFIER derivation — `nf = Poseidon([rho, nsk])` | ✅ derived in-circuit, revealed |
| **UNIQUENESS (intra-transfer)** — nullifiers pairwise-distinct *in this transfer* | ✅ (new) set-distinctness |
| **CONSERVATION (per-asset)** — `Σin[a] == Σout[a] (+fee if a==feeAsset)` | ✅ (new) no cross-asset mint |
| RANGE — every value is a `u64` | ✅ structural |

The chain verifies the wrapped proof with the JLVM opcode

```
groth16_verify(vkey: hex32, publicValues: hex, proof: hex) -> bool
```

(pure-JVM `Sp1Groth16Verifier`, vendored Besu alt_bn128 pairing — no native deps). A
malformed input is a hard opcode error; a well-formed proof that simply does not verify is
`false`.

## 2. Division of labor — and where each check is allowed to live

This is the load-bearing part, because OttoChain has hard rules about *where* a stateful
check may run (see `CLAUDE.md` invariants #2/#3 and `docs/signing-canonical-and-validation.md`).

| Check | Layer | Why here |
| --- | --- | --- |
| Proof verifies (`groth16_verify`) | **combine** (transition guard) | needs the proof + the pinned `vkey` from state |
| `anchor ∈ knownRoots` | **combine** (guard) | reads `CalculatedState` (the roots window) |
| **No input nullifier already spent** | **combine** (guard) | reads `CalculatedState` (the spent set) |
| Spend nullifiers / append commitments / advance root | **combine** (effect) | mutates `CalculatedState` |
| Fields present & well-typed (`proof`, `publicValues` are hex; arrays non-empty) | **block-validity** (`validateSignedUpdate`) | **structural only** |
| Sequence number / event well-formedness | **block-validity** | structural |

**The nullifier non-membership-then-insert is combiner-only.** It must never run in
`validateSignedUpdate` / block acceptance: a TOCTOU race (two transfers spending the same
note land in one snapshot) evaluated at block-validity returns `Invalid` and drops the
**entire block** for every transaction in it. In the fiber model this falls out for free —
guards and effects are evaluated by `FiberEvaluator` **inside the combine**, and a guard
returning `false` is a graceful "no transition / rejected event", not a block poison. The
block-validity gate only confirms the *shape* of the update.

## 3. The app: a shielded pool as a `Machine` fiber

One fiber instance is one shielded pool. Because conservation is now per-asset, a single
pool can hold many assets; deployments may still run one pool per asset family if they want
disjoint anchor sets. State is a `MapValue` (JLVM object).

### 3.1 State schema (`defineFiberApp`)

```ts
// ottochain-sdk/src/apps/privacy/state-machines/shielded-pool.ts
import { defineFiberApp } from '../../../schema/fiber-app.js';

export const shieldedPoolDef = defineFiberApp({
  metadata: {
    name: 'ShieldedPool',
    app: 'privacy',
    type: 'shielded',
    version: '0.1.0',
    description:
      'Confidential value transfer over a Poseidon note-commitment tree, verified by a ' +
      'Groth16 proof of the zk-shielded circuit. Nullifier set + anchors are app state.',
  },

  // User-supplied at fiber creation. The verifying key is pinned ONCE here, so a transfer
  // can never smuggle in its own vkey: the guard reads vkey from state, not from the event.
  createSchema: {
    required: ['vkey', 'merkleDepth'],
    properties: {
      vkey:        { type: 'hash', immutable: true, description: 'SP1 program vkey (bytes32) for groth16_verify' },
      merkleDepth: { type: 'integer', immutable: true, minimum: 1, maximum: 32 },
      rootWindow:  { type: 'integer', default: 64, immutable: true, description: 'how many recent anchors stay spendable' },
    },
  },

  // Full state. Everything below `vkey`/`merkleDepth` is `computed` — only effects write it.
  stateSchema: {
    properties: {
      vkey:        { type: 'hash', immutable: true },
      merkleDepth: { type: 'integer', immutable: true },
      rootWindow:  { type: 'integer', immutable: true },

      currentRoot: { type: 'hash',  computed: true, description: 'latest commitment-tree root' },
      knownRoots:  { type: 'array', computed: true, description: 'rolling window of valid anchors (hex)' },
      frontier:    { type: 'array', computed: true, description: 'right-edge hashes for incremental append' },
      leafCount:   { type: 'integer', computed: true, default: 0 },

      nullifiers:  { type: 'array', computed: true, description: 'spent set (hex); monotonic, see §6.3' },
      commitments: { type: 'array', computed: true, description: 'append-only log of output cms (hex)' },

      feesAccrued: { type: 'object', computed: true, description: 'asset(hex) -> total transparent fee' },
      transfers:   { type: 'integer', computed: true, default: 0 },
    },
  },

  eventSchemas: {
    transfer: {
      description: 'Spend N inputs / create M outputs, attested by a Groth16 proof.',
      required: ['proof', 'publicValues', 'public'],
      properties: {
        proof:        { type: 'string', description: 'Groth16 proof bytes (hex)' },
        publicValues: { type: 'string', description: 'abi-encoded ShieldedTransferPublicValues (hex)' },
        // Decoded, human-/JLVM-readable view of `publicValues`. Its trustworthiness comes
        // from the binding check in the guard (§4, §6.1) — it is NOT trusted on its own.
        public: {
          type: 'object',
          properties: {
            anchor:    { type: 'hash' },
            nullifiers:{ type: 'array', items: { type: 'hash' } },
            outputCms: { type: 'array', items: { type: 'hash' } },
            fee:       { type: 'integer', minimum: 0 },
            feeAsset:  { type: 'hash' },
            newRoot:   { type: 'hash', description: 'root after appending outputCms (see §6.2)' },
          },
        },
      },
    },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false, metadata: { label: 'Active', description: 'Pool accepts shielded transfers', category: 'active' } },
  },
  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'transfer', guard: TRANSFER_GUARD, effect: TRANSFER_EFFECT },
  ],
} as const);
```

The evaluation context the chain hands the guard/effect is the usual one:
`{ state, event, proofs[], $ordinal }` (same shape governance/markets use, e.g.
`{"var":"proofs.0.address"}`, `{"var":"$ordinal"}`).

### 3.2 Guard expression (`TRANSFER_GUARD`)

Three stateful checks, all combiner-side. (`{"var":""}` is the current element inside
`none`/`all`.)

```jsonc
{ "and": [
  // (1) the proof verifies against the pool's pinned vkey over EXACTLY these public bytes
  { "groth16_verify": [ {"var":"state.vkey"}, {"var":"event.publicValues"}, {"var":"event.proof"} ] },

  // (2) bind the readable `event.public.*` to the bytes the proof committed (see §6.1).
  //     Sketch form: recompute the circuit's public digest from the claimed fields and
  //     compare. With a hash-committed PV this is one poseidon + one "==".
  { "==": [
      {"var":"event.public.digest"},
      {"poseidon": [
        {"var":"event.public.anchor"}, {"var":"event.public.feeAsset"}, {"var":"event.public.fee"}
        /* …nullifiers/outputCms folded in; see §6.1 for the exact preimage */
      ]} ] },

  // (3) the anchor the inputs were proven under is a root we actually produced + still honor
  { "in": [ {"var":"event.public.anchor"}, {"var":"state.knownRoots"} ] },

  // (4) INTER-transfer double-spend: none of the input nullifiers is already spent
  { "none": [ {"var":"event.public.nullifiers"},
              { "in": [ {"var":""}, {"var":"state.nullifiers"} ] } ] }
] }
```

A `false` here = the `transfer` event is rejected for this fiber (graceful), the block is
unaffected.

### 3.3 Combine / effect expression (`TRANSFER_EFFECT`)

Runs only after the guard passes. Spends the nullifiers, logs the outputs, advances the
anchor window, and accounts the fee. `merge` overlays the returned object on current state;
`cat` concatenates arrays.

```jsonc
{ "merge": [
  {"var":"state"},
  {
    "nullifiers":  { "cat": [ {"var":"state.nullifiers"},  {"var":"event.public.nullifiers"} ] },
    "commitments": { "cat": [ {"var":"state.commitments"}, {"var":"event.public.outputCms"} ] },
    "leafCount":   { "+":   [ {"var":"state.leafCount"}, {"reduce":[{"var":"event.public.outputCms"},{"+":[{"var":"accumulator"},1]},0]} ] },

    // advance the tree: the new root (validated in §6.2) becomes current and enters the window
    "currentRoot": {"var":"event.public.newRoot"},
    "knownRoots":  { "cat": [
        {"var":"state.knownRoots"},
        [ {"var":"event.public.newRoot"} ] ] },   // window trimmed to rootWindow (§6.3)

    // transparent fee, per asset
    "feesAccrued": { "set": [ {"var":"state.feesAccrued"}, {"var":"event.public.feeAsset"},
                       {"+":[ {"if":[ {"has":[{"var":"state.feesAccrued"},{"var":"event.public.feeAsset"}]},
                                      {"get":[{"var":"state.feesAccrued"},{"var":"event.public.feeAsset"}]}, 0 ]},
                              {"var":"event.public.fee"} ]} ] },
    "transfers":   { "+": [ {"var":"state.transfers"}, 1 ] }
  }
] }
```

(`knownRoots` trimming to the last `rootWindow` entries is elided for readability — it is a
`slice`/`filter` on the concatenated array; same idea as §6.3 for nullifiers.)

## 4. Registry conformance — the genesis manifest

The app ships exactly like the other std apps. `buildGenesisManifest()` would add:

```ts
// in ottochain-sdk/src/ottochain/genesis-manifest.ts
const shieldedStateMessage: MessageShape = {
  typeName: 'ottochain.apps.privacy.v1.ShieldedPool',
  fields: [
    field('vkey', 1, 'string'),
    field('merkle_depth', 2, 'int32'),
    field('root_window', 3, 'int32'),
    field('current_root', 4, 'string'),
    field('known_roots', 5, 'string', /*repeated*/ true),
    field('frontier', 6, 'string', true),
    field('leaf_count', 7, 'int64'),
    field('nullifiers', 8, 'string', true),
    field('commitments', 9, 'string', true),
    field('fees_accrued', 10, 'google.protobuf.Struct'),
    field('transfers', 11, 'int64'),
  ],
};

// packages.push({
//   name: 'std.privacy.package',     // `std` is protocol-reserved (RegistryName.isReserved)
//   semver: '0.1.0',
//   strict: false,                   // see note below
//   metadata: {},
//   machineShape: { stateMessage: shieldedStateMessage, commands: {} },
//   definition: toWireDefinition(shieldedPoolDef),
// });
```

This conforms to the chain side without changes:

- The chain stores it as `RegistryShape.Machine(MachineShape(stateMessage, commands))`
  (`ottochain/modules/models/.../registry/SchemaShape.scala`). `Machine` is exactly the
  `{ stateMessage, commands }` shape the manifest already emits.
- `logicHash = StateMachineDefinition.computeDigest(definition)` is computed **by the chain**
  from `definition` (the guard/effect JSON-Logic travels verbatim inside it). The manifest
  ships content only — zero hash-parity risk, same as identity/governance/markets.
- `guard` and `effect` are **required, no-default** on the chain's `Transition`
  (`toProtoDefinition` already emits both) — so they must be present, which they are.
- `strict`: leave `false` for v1. A `strict: true` Machine version would force every fiber's
  `stateData` to conform to `stateMessage`; revisit once the shape is stable (the
  conformance gate is opt-in per registered version).

The guard/effect JSON-Logic above is the only "new" content — and it uses opcodes the chain
already ships (`groth16_verify`, `poseidon`, `none`, `in`, `cat`, `merge`, `set`, `get`, `has`,
`reduce`). So **the manifest is the entire on-chain footprint**; there is no Scala change to
register this app.

> **Opcode note (rc.5):** map writes use **`set [map, key, value]`** and reads use
> **`get [map, key]`** / **`has [map, key]`**. There is **no** `setKey`/`getKey` opcode — metakit
> silently mis-decodes those as literal maps (`KNOWN_BAD_OPERATORS` in `src/schema/guard-lint.ts`,
> the A2 drift class), so `lint-apps` rejects them. An earlier draft of the fee-accrual effect used
> `setKey`; corrected above.

## 5. End-to-end flow

1. **Genesis**: `std.privacy.package` is pre-registered; an operator creates a pool fiber
   with `{ vkey, merkleDepth, rootWindow }`. `knownRoots = [emptyRoot]`.
2. **Wallet** builds a transfer witness (input notes + paths under a known `anchor`, output
   notes, `fee`/`feeAsset`), proves it in the SP1 zkVM, wraps to Groth16, and computes the
   `newRoot` from appending `outputCms`. It submits `transfer` with `{ proof, publicValues,
   public }`.
3. **Block-validity** checks structure only (hex fields present, arrays non-empty, seq#).
4. **Combine**: guard verifies the proof, binds `public`, checks anchor recency + nullifier
   freshness; effect spends nullifiers, logs commitments, advances the root window, accrues
   the fee. A stale anchor or a re-spent nullifier → graceful rejection (block intact).
5. **Indexers/wallets** rebuild the off-chain Poseidon-Merkle tree from the public
   `commitments` log to produce paths for the next spend.

## 6. The two design decisions that are NOT settled

These are called out deliberately; the sketch above is written so either resolution drops in.

### 6.1 Binding `publicValues` (bytes) → `event.public.*` (fields)

`groth16_verify` binds the proof to the **opaque bytes** `publicValues`. The effect needs
the *structured* fields. The readable `event.public.*` cannot be trusted until it is bound to
those bytes. Two ways:

- **(recommended) hash-committed public values.** Change the circuit to commit a single
  `digest = Poseidon(anchor ‖ nullifiers ‖ outputCms ‖ fee ‖ feeAsset)` (the
  `JlvmPublicValues` pattern M2 already uses). Then the guard recomputes that digest from
  `event.public.*` with `poseidon` and compares (§3.2 check 2): O(1) opcode-wise, trivially
  sound. Cost: a small, well-contained circuit change + VK re-key.
- **(works today) decode the ABI in JLVM.** Keep the struct PV; slice `event.publicValues`
  with `substr`/`slice` and follow the two array offsets. The fixed tail (`anchor`, `fee`,
  `feeAsset`) is static-offset and easy; the dynamic `nullifiers`/`outputCms` arrays need
  offset-following + a `reduce`. Sound but verbose and easy to get wrong.

Recommendation: ship the hash-committed PV. It is the same decision the privacy handoff doc
flags as `jlvm_pv_decode`, resolved in favor of *make the commitment app-shaped* rather than
teach JLVM to parse Solidity ABI.

### 6.2 Who maintains the commitment tree / produces new anchors

The circuit proves membership under an `anchor`; the chain must therefore only ever honor
anchors that reflect the **real** accepted commitment history, or a spender could prove
membership in a tree they invented.

- **(recommended v1) on-chain incremental root.** Keep a Merkle **frontier** (the right-edge
  hashes) in state and fold each new `outputCm` up with `poseidon` to get `newRoot`; the
  effect validates the submitted `event.public.newRoot` equals that fold before accepting it.
  Bounded cost: `O(merkleDepth)` poseidon calls per appended leaf — gas-heavy but deterministic
  and needs **no new opcode**.
- **(optimization, only if gas demands)** a `poseidon_merkle_append(frontier, leaf) -> (frontier', root')`
  opcode in metakit. This is the *one* place a new opcode could earn its keep; it should be
  added behind gas profiling, not preemptively — consistent with "don't go crazy on opcodes".
- **(alt) off-chain tree + checkpoint.** The chain stores only `knownRoots`; a privileged
  "checkpoint" event advances the root. Simpler on-chain, but moves trust to the checkpointer
  — not recommended for a value-bearing pool.

### 6.3 Bounded growth (the real long-term cost)

`nullifiers` (and `commitments`) grow **monotonically and unprunably** — a spent nullifier
can never be forgotten without reintroducing double-spends. An unbounded `array` with
`in`/`none` membership is also `O(n)` per check. This is the same problem the handoff doc and
the IMT discussion raise. Options, in order of preference:

1. **Accept-and-price**: keep the set, push it behind a committed structure (an
   SMT/`smt_verify` or the committed-MPT already in metakit) so membership is a proof, not an
   `O(n)` scan, and charge **state rent** for the growth.
2. **Windowing + rent**: only the last *K* roots are spendable (already modeled by
   `rootWindow`); combine with epoch-scoped nullifier shards so old shards can be archived.

This is the part that should gate "guards real value" — the soundness fixes close the
circuit holes, but a production pool also needs the growth story above. v1 can ship with the
plain array + a hard cap and a `log`/metric on size; the committed-structure migration is the
P2/P3 follow-up.

## 7. What this sketch deliberately does NOT add to metakit

Per the "model privacy as an app, don't go crazy on opcodes" guidance:

- **No** new verify opcode — `groth16_verify` already does it.
- **No** nullifier-set opcode — it is app state + `none`/`cat`.
- **No** range opcode — range is inside the circuit (`value: u64`).
- The **only** opcode this might ever want is the incremental-Merkle append (§6.2), and only
  if on-chain root maintenance proves too gas-heavy as a JSON-Logic fold.

So the entire on-chain delta to support shielded transfers is **one genesis manifest entry**.
