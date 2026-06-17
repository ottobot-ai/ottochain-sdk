# RFC: General private contract state (`zk-jlvm-shielded` + `shieldApp`)

> Status: **RFC / design — pre-implementation.** This is the "design first" deliverable. It
> proposes pivoting privacy from *value transfer only* to **general private contract state**:
> any standard app's transition, proven privately, sharing one universal verifying key.
>
> Companions: [`shielded-transfer-app-sketch.md`](./shielded-transfer-app-sketch.md) (the
> value-PoC-shaped app this generalizes) and
> [`metakit-privacy-extensions-handoff.md`](./metakit-privacy-extensions-handoff.md) (the
> P0–P3 roadmap). Worked example here: a **sealed-bid auction**.

## 1. Why this RFC exists

We kept shipping the value-transfer proof of concept (`zk-shielded`) when the *general*
machine already exists. `metakit-sdk/rust/zk-jlvm` proves **arbitrary JLVM execution**: its
guest reads an expression and its data as **private witness**, evaluates with `jlvm-core`
(the byte-compatible Rust JLVM), and commits only
`JlvmPublicValues { exprHash, dataHash, outputHash, ok }` (keccak256). The data is never
revealed — only its hash. That is the Kachina-class primitive: *prove a contract transition
ran correctly without revealing the inputs.*

Value transfer is the **least** differentiated use of that primitive ("a private token").
The leverage is private state for the apps we already ship — sealed bids, private votes,
selective-disclosure identity, confidential corporate state. This RFC says how to get there
**without per-app circuits and without new metakit crypto opcodes.**

## 2. What already exists (build on, don't rebuild)

| Component | Role | Location |
| --- | --- | --- |
| `zk-jlvm` | proves arbitrary JLVM exec; data is private; commits `{exprHash,dataHash,outputHash,ok}` | `metakit-sdk/rust/zk-jlvm` |
| `zk-shielded` | the **binding layer**, value-typed: Merkle membership + nullifier + commitment + (now) per-asset conservation | `metakit-sdk/rust/zk-shielded` |
| `jlvm-core` | byte-compatible Rust JLVM (shared by both) | `metakit-sdk/rust/jlvm-core` |
| opcodes | `groth16_verify`, `poseidon`, `pmt_verify` (Poseidon-Merkle) on-chain | metakit JLVM |
| app framework | `FiberAppDefinition` = state schema + guard/effect JSON-Logic | `ottochain-sdk/src/schema/fiber-app.ts` |
| registry | `RegistryShape.Machine` + genesis manifest | ottochain + `ottochain-sdk/src/ottochain/genesis-manifest.ts` |

The key observation: **`zk-jlvm` proves *the effect ran*; `zk-shielded` proves *the state
binding* (membership + nullifier + commitment).** A private contract is exactly the two
fused. `zk-shielded`'s note is just `{value, owner, asset, rho}` — value-typed state. Make
the state arbitrary and the binding layer becomes general.

## 3. Design

### 3.1 Generalize the note: a commitment to *arbitrary* state

```
zk-shielded note:        Note { value: u64, owner, asset, rho }     // value-typed
zk-jlvm-shielded note:   Note { stateHash, owner, rho }             // stateHash = poseidon(canonical(appState))
```

`stateHash` is the Poseidon hash of the canonical (RFC 8785) JSON of the app's private
`stateData` — the same canonicalization `zk-jlvm` already uses for `dataHash`. Everything
else (commitment, owner-from-nsk, nullifier `= poseidon(rho, nsk)`, Merkle membership) is
reused verbatim from `zk-shielded`.

### 3.2 The new crate: `zk-jlvm-shielded` (one general circuit)

One SP1 program, app-agnostic. **Private witness:** old state `s`, the event/input, `nsk`,
the Merkle path of `commit(s)` under `anchor`, and the app's effect expression `e`.
**The statement it proves (all in one SNARK):**

1. **Membership** — `commit(s)` is a leaf under the public `anchor` (Poseidon-Merkle, from `zk-shielded`).
2. **Authorization** — `owner(s) == poseidon([nsk])`.
3. **Transition** — `jlvm_core::evaluate(e, context(s, event)) == s'` (deterministic; reuse the exact `zk-jlvm` evaluation path). This is the only new constraint vs. `zk-shielded`.
4. **Nullifier** — `nf = poseidon([rho, nsk])`, revealed.
5. **New commitment** — `cm' = commit(s')`, revealed.

**Public values:** `{ anchor, nullifier, newCommitment, exprHash, publicOutputs }` where
`exprHash = keccak(e)` pins *which* app logic ran, and `publicOutputs` is the app-declared
public part of the effect result (e.g. "a bid was placed", with the amount kept private).

This is **`zk-shielded` with "value conservation" replaced by "an arbitrary `jlvm-core`
effect"** — same membership/nullifier/commitment scaffolding, reusing `jlvm-core` (already a
`zk-jlvm` dependency). It is **one circuit**; the app is *data* (`e`), not a new circuit, so
there is **one universal verifying key** for every shielded app.

### 3.3 Fuse vs. compose

- **Fused (recommended target):** the single circuit above. One proof atomically binds
  "this state was a member" to "this effect ran on it". One proof to verify, one VK, minimal
  linkage leakage.
- **Composed (fast prototype):** verify a `zk-jlvm` proof of the effect **and** a
  `zk-shielded`-style membership/nullifier proof separately, glued by a shared `stateHash`.
  Two proofs, more linkage, but reuses both crates as-is for a first end-to-end demo.

Recommendation: prototype composed if it accelerates the first demo, ship fused.

### 3.4 The SDK transform: `shieldApp(def)`

Because every app is a `FiberAppDefinition` (state schema + guard/effect JSON-Logic) and the
circuit proves arbitrary `jlvm-core` effects, a **generic transform** derives a private
variant of (almost) any app:

```
shieldApp(def): FiberAppDefinition -> FiberAppDefinition
```

- **State split:** `def.stateSchema` → **public** on-chain `{ anchor, knownRoots, nullifiers,
  commitments, vkey, exprHash }` + **private** off-chain (the original `stateData`).
- **One transition**, same for every app:
  - **guard** = `groth16_verify(vkey, publicValues, proof)` ∧ `exprHash == pinned`
    ∧ `anchor ∈ knownRoots` ∧ `nullifier ∉ nullifiers`.
  - **effect** = spend the nullifier, append `newCommitment`, advance the root window,
    surface `publicOutputs`.
- The **original** `guard`/`effect` run **inside the circuit** (proven), not on-chain.
- The on-chain combine is **one template for all apps**; the only per-app difference is the
  pinned `exprHash`. The on-chain footprint is **one genesis `Machine` package** — either one
  per shielded app, or a single generic `std.shielded.pool` parameterized by `exprHash`.

This is the same combine pattern as the value app sketch (verify → spend nullifier → record
commitment), now app-agnostic.

## 4. Worked example: sealed-bid auction (the chosen first app)

Sealed-bid is the right first general app: per-bidder state is **per-instance / single-owner**
(mechanical to shield), and the *only* shared-state step is **settlement** — a clean
max / second-price computation — so it isolates exactly one hard case.

### 4.1 Phases

- **Bid (private).** Each bidder submits a `place-bid` shielded transition: a
  `zk-jlvm-shielded` proof that they formed a well-formed bid note
  `s = { amount, bidder, nonce }` (e.g. `amount > 0`, `amount ≤ provenFunds`) and committed
  it. On-chain: a **commitment** + a **nullifier** (prevents the same bidder double-bidding,
  via a per-auction `nsk`), with the **amount hidden**. `publicOutputs = { event: "bid", auctionId }`.
- **Settle (the shared-state step).** At the deadline, determine winner + price over the
  hidden bids. Two options:
  - **(a) reveal-then-tally** — bidders reveal openings; the effect picks `max` (first-price)
    or second-max (Vickrey). Simple; hides bids **only until** the deadline.
  - **(b) settlement proof** — one `zk-jlvm-shielded`-style proof takes all bid commitments +
    their private openings and proves "`w` is the max bid and `p` is the price" **without
    revealing the losers' amounts**. Stronger privacy; more circuit work.

### 4.2 Leakage profile (first-price, option b)

| Public | Private |
| --- | --- |
| number of bidders, timing | every bid amount |
| winner identity + clearing price | losers' amounts (stay sealed) |
| commitments + nullifiers (unlinkable to amounts) | bidder↔amount linkage |

### 4.3 Why this exercises the framework well

`place-bid` is the mechanical per-instance case (proves `shieldApp` works); settlement is the
first **shared-state** case (proves we can handle the hard part with a bounded, well-defined
computation rather than hand-waving).

## 5. The honest limits

### 5.1 Shared mutable state with concurrent writers

`shieldApp` is mechanical for **per-instance / single-or-few-owner** state (a bid, an
identity, an escrow, a note). It is **not** mechanical for shared mutable state updated
concurrently (a DAO running tally, an order book): two private updates race on one
commitment. Those need app-specific modeling — per-writer shielded contributions plus a
tally/settlement proof (exactly the sealed-bid settlement pattern). **Estimate: a generic
`shieldApp` covers the bulk of per-instance shapes; shared-state apps are bespoke.**

### 5.2 Privacy is not free or automatic

- The SP1 proof must run in its **zero-knowledge mode** so the witness can't be extracted
  from the proof (succinct ≠ hiding).
- `stateHash`/`dataHash` preimages need enough entropy (`rho`/`nonce`) or a small input space
  is brute-forceable.
- The **anonymity set is the nullifier set size**; timing and cardinality leak.
- Each app must **declare its leakage profile** (what's in `publicOutputs`) — this is a design
  artifact, not a default.

### 5.3 Bounded growth (shared with the value app)

The nullifier set is monotonic and unprunable. Same resolution as the value app sketch §6.3:
push it behind a committed structure (`smt_verify` / the committed-MPT) so membership is a
proof not an O(n) scan, and charge **state rent**. This is shared infrastructure across all
shielded apps.

## 6. On-chain invariants (`CLAUDE.md` compliance)

- **Nullifier non-membership-then-insert is combiner-only.** Guards/effects run in
  `FiberEvaluator` during the combine; a `false` guard is a graceful rejected event. It must
  **never** run in `validateSignedUpdate`/block-validity (TOCTOU → whole-block poison).
- **Block-validity is structural only** (fields present, `proof`/`publicValues` are hex,
  arrays well-formed, sequence number).
- **Signed-message fields stay `Option`/required-no-default** (the event carries `proof`,
  `publicValues`, `publicOutputs`).

## 7. What this does NOT add to metakit

No new crypto opcode: `groth16_verify` (proof), `poseidon` (hashing/commitments), `pmt_verify`
(Poseidon-Merkle) already exist. The **only** candidate is an incremental-Merkle-append opcode
(`poseidon_merkle_append`) **if** maintaining the commitment-tree root on-chain as a JSON-Logic
`poseidon` fold proves too gas-heavy — added behind profiling, not preemptively. The general
circuit lives in metakit-**sdk** (`zk-jlvm-shielded`), not metakit.

## 8. Phasing

| Phase | Deliverable |
| --- | --- |
| **P0** | this RFC |
| **P1** | `zk-jlvm-shielded` crate: the general circuit (membership ∧ `jlvm-core` effect ∧ nullifier ∧ new-commitment) + native tests + first conformance vector + GPU-proved Groth16 fixture |
| **P2** | `shieldApp(def)` in `ottochain-sdk` + a generic `std.shielded.pool` genesis package |
| **P3** | **sealed-bid auction** worked end-to-end (place-bid via P1; settlement option (a) then (b)) |
| **P4** | bounded-growth: committed nullifier structure + state rent (shared) |

## 9. Open questions

1. **Fuse vs compose** for P1 (single SNARK vs two glued proofs).
2. **`exprHash` pinning** granularity — per-pool (one app) vs per-event (a multi-app pool).
3. **Settlement privacy** for sealed-bid — reveal-tally (a) vs in-circuit max (b) for v1.
4. **Off-chain state/tree service** — who maintains the Poseidon-Merkle tree + serves paths
   (indexer responsibility, like a Zcash light-wallet server).
5. **zk mode + proving cost** — confirm SP1 zk-Groth16 cost on the 5090 for a `jlvm-core`
   effect-sized guest (the value circuit was ~133M cycles).
