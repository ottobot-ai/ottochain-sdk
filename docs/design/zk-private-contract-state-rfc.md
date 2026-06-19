# RFC: General private contract state (`zk-jlvm-shielded` + `shieldApp`)

> Status: **Implemented (2026-06-19) — design-of-record.** Originally an "RFC / design-first"
> deliverable; the design it proposes has since **shipped**: the **`zk-jlvm-shielded`** circuit
> (metakit-sdk **#53**, merged 2026-06-17) and the **`shieldApp()`** SDK transform + sealed-bid
> worked example (`src/privacy/shield-app.ts`, `src/privacy/sealed-bid.ts`, ottochain-sdk **#212**).
> Read the body below as the design of a system that now exists, not a forecast. It pivots privacy
> from *value transfer only* to **general private contract state**: any standard app's transition,
> proven privately, sharing one universal verifying key.
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
zk-jlvm-shielded note:   Note { stateHash, owner, rho }             // stateHash = keccak(canonical(appState))
```

`stateHash = keccak256(canonical(state))` (RFC 8785, the same canonicalization `zk-jlvm` uses
for `dataHash`), folded into the Poseidon commitment as two 128-bit limbs:
`cm = Poseidon([stateHi, stateLo, owner, rho])`. (keccak for the byte→hash step because
poseidon-bn254 hashes field elements, not arbitrary bytes; the limbs keep it field-native and
fully binding.) Everything else — `owner = Poseidon([nsk])`, `nf = Poseidon([rho, nsk])`,
Poseidon-Merkle membership — is reused verbatim from `zk-shielded`. **Implemented + tested:**
`zk-jlvm-shielded-lib`, metakit-sdk #53 (9/9 native tests green).

### 3.1.1 Why a note model and not an auth-DB (MPT / SMT / PMT / IMT)?

A fair question, since metakit already has `mpt_verify` / `smt_verify` / `pmt_verify`. The
distinction is **how private state is represented and authenticated**, and the two models are
complementary, not competitors:

| | **Note model** (this RFC) | **Auth-DB model** (SMT/MPT keyed) |
|---|---|---|
| state shape | a set of independent commitments (blobs) | a key→value map under one root |
| update | spend old note → create new note (replace whole) | prove read(k)=v, write(k,v') in-circuit |
| large state | rehash the whole blob | partial O(log n) update |
| anti-replay | explicit **nullifier set** (monotonic, unprunable — the growth tax) | **root-versioning** (no nullifier set!) — but needs stale-root rejection |
| concurrency | independent notes parallel; one note serialized by its nullifier | one root serializes *all* writers (unless sharded) |
| unlinkability | strong (spent note ↔ output unlinkable) | weaker (repeated writes to key `k` link) unless positions re-randomized |
| in-circuit cost | 1 membership + 1 commitment | 1 membership + 1 **in-circuit trie-insert** gadget (more constraints, new work) |
| best for | per-instance, single-owner, replace-wholesale (a bid, a coin, a credential) | mutable keyed maps, account balances, large/shared state |

Three things make the note model the right **v1**:

1. **It's the minimal generalization of `zk-shielded`** — same membership/nullifier/commitment
   scaffolding, only the leaf payload (`stateHash`) and the conservation→effect swap change.
   No new in-circuit trie gadget to build and audit.
2. **The chosen first apps are per-instance / single-owner** — a sealed bid, an identity
   credential, an escrow. Their state is small and replaced wholesale; `stateHash` can hash a
   *structured* object, so "keyed-ish" state still fits, it's just rehashed each step.
3. **We're already using a PMT** — the commitment tree *is* a Poseidon-Merkle tree
   (`pmt_verify`). "Note vs PMT" is a false choice; the note model is *opaque-blob leaves in a
   PMT + a nullifier set*. An auth-DB would instead put *keyed* leaves in an SMT/MPT and update
   in place.

When the auth-DB model wins, and the path to it:

- **Large keyed maps / per-key updates** (an account ledger, a big registry): an **in-circuit
  SMT/MPT insert** beats rehashing a giant blob. This is real new circuit work (the on-chain
  `smt_verify`/`mpt_verify` are verifiers, not in-circuit *mutators*).
- **Avoiding the unbounded nullifier set**: the auth-DB's **root-versioning** is the one model
  that sidesteps the monotonic nullifier set entirely (a transition just extends the *current*
  root; stale roots are rejected by comparison) — at the cost of linkability unless you
  re-randomize, which brings nullifiers back. So it's a privacy/cost trade, not a free win.
- **`IMT` specifically** solves a *different* sub-problem: efficient **in-circuit
  non-membership** (proving a nullifier is *not* yet spent). That's orthogonal to the state
  model — if we keep the note model and want the nullifier check *inside* the proof (rather
  than in the on-chain combine), an IMT is how. v1 does the nullifier check in the **combine**
  (on-chain, `none`/`in`), so no IMT yet.

**Decision:** note model for v1; design the leaf-commitment so an **auth-DB variant** (in-circuit
SMT) can slot in for keyed/large/shared state, and treat the IMT as the future tool for moving
nullifier non-membership *into* the circuit. The bounded-growth section (§5.3) is the note
model's tax we pay consciously.

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
second-price computation — so it isolates exactly one hard case.

**Decided (this RFC):** **Vickrey (second-price)** auction, settled by **reveal-then-tally**.
Reveal-then-tally keeps v1 simple (no in-circuit max/second-max proof) and is the honest first
cut: bids are sealed *until the deadline*, which is exactly the property a sealed-bid auction
needs to kill bid-shading and front-running during bidding. A zero-knowledge settlement proof
that keeps *losers'* amounts sealed forever is the natural follow-up (noted in §9), not v1.

### 4.1 Phases

- **Bid (private).** Each bidder submits a `place-bid` shielded transition: a
  `zk-jlvm-shielded` proof that they formed a well-formed bid note
  `s = { amount, bidder, nonce }` (e.g. `amount > 0`, `amount ≤ provenFunds`) and committed
  it. On-chain: a **commitment** + a **nullifier** (prevents the same bidder double-bidding,
  via a per-auction `nsk`), with the **amount hidden**. `publicOutputs = { event: "bid", auctionId }`.
- **Reveal (after deadline).** Each bidder opens their note (`amount`, `nonce`); the chain
  checks the opening against the recorded commitment. Non-revealers simply forfeit (their
  sealed bid is discarded) — no griefing of the tally.
- **Tally (Vickrey).** Over the revealed bids the combine computes `winner = argmax(amount)`
  and `price = second-highest amount` (the Vickrey clearing price), in plain JSON-Logic
  (`max`, comparisons) — no proof needed once amounts are public.

### 4.2 Leakage profile (Vickrey, reveal-then-tally)

| Public | Private |
| --- | --- |
| number of bidders, timing | every bid amount **during bidding** (sealed until deadline) |
| after reveal: all *revealed* amounts, winner, clearing price | a bidder who forfeits keeps their amount sealed |
| commitments + nullifiers (unlinkable to amounts while sealed) | bidder↔amount linkage while sealed |

(A zk settlement proof — §9 — would shrink the "after reveal" column to just *winner + price*,
keeping losers' amounts sealed forever. That's the privacy upgrade, deferred from v1.)

### 4.3 Why this exercises the framework well

`place-bid` is the mechanical per-instance case (proves `shieldApp` works); reveal-then-tally
is the simplest correct **shared-state settlement**, so v1 ships an end-to-end private flow
without first building an in-circuit auction-clearing gadget.

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

## 8. Proving cost (MEASURED)

All numbers below are measured on this hardware (SP1 v6, RTX 5090), not estimated.

**Fused transition, small state — `68.8M cycles`.** The bundled 1-in/1-out transition
(`{"balance":100,"bids":[]}`, deduct effect) executes in **68,764,987 cycles**, public values
matching native exactly. Its Groth16 proof was generated **and verified on the GPU**
(`sp1-gpu-server 6.2.4`, device 0) in **~1.5 min** wall-clock; vkey
`0x00f48340d57e907ec1364bb941e40d86808c0fe5360ead51c4a401556a0d1267`.

**The split: fixed scaffolding vs. size-linear effect.** The two parts scale very differently:

- **Scaffolding (FIXED, ~68M):** Poseidon-Merkle membership (depth-8) + old/new commitments +
  nullifier + owner hash + BN254 field arithmetic + parsing the Merkle-proof witness. This is
  **independent of state size** — it operates on the 32-byte state *hash*, not the state.
- **`jlvm-core` effect (LINEAR in state size):** parse the state JSON + evaluate + RFC-8785
  canonicalize the new state + keccak it. Measured scaling (via `zk-jlvm`):

  | JSON elements | bytes | eval cycles |
  | ---: | ---: | ---: |
  | ~5 (tiny) | ~50 B | ~87K |
  | 200 | 0.9 KB | 3.4M |
  | 3,000 | 16.9 KB | 52.3M |

  i.e. **≈ 87K fixed + ~17K cycles per JSON element** (the cost is `num-bigint`/Ratio number
  handling + canonicalize, not the operator logic). Linear.

**So is the effect negligible at max size? NO — only at small/typical size.** Crossover (effect
≈ scaffolding) is at **~4,000 elements (~22 KB)**. Extrapolating to the fiber engine's
**`maxStateSizeBytes = 1 MB`** cap (~150K elements) the effect is **~2.5B cycles — ~1.5 orders
of magnitude LARGER than the scaffolding.** Concretely:

| state size | transition ≈ | effect vs scaffolding |
| --- | --- | --- |
| typical app (≤ ~1K elems, few KB) | ~68–85M | effect negligible (the measured case) |
| ~4K elems (~22 KB) | ~136M | effect ≈ scaffolding |
| 1 MB cap (~150K elems) | **~2.6B** | effect dominates (~37×) |

**Critical: gas does NOT bound proving cost.** `maxGas = 10M` meters *operations* (one `merge`
over a huge object is cheap in gas), but zkVM cycles scale with *bytes parsed/canonicalized*.
An effect can sit inside the gas budget and still be billions of zkVM cycles. So:

- A shielded pool must impose its **own, tighter state-size cap** (a few KB) — far below the
  1 MB fiber cap — to keep proofs fast. The note model rehashes the *whole* state each
  transition, so its proving cost is `O(state size)`.
- This is the **quantified argument for the auth-DB model (§3.1.1) at large state**: an
  in-circuit SMT/MPT update touches `O(log n)` nodes, not the whole map, so a large *keyed*
  state stays cheap to prove. Note model for small per-instance state; auth-DB when state grows.

**On the SP1 prover network:** priced by prover-gas roughly ∝ cycles; a ~68M-cycle small-state
transition is the **same tier as the `zk-shielded` value circuit** — order **cents–dollars per
proof**. Wallets prove off-chain (local GPU or the network); the chain only *verifies* (the
cheap `groth16_verify` opcode). A 1 MB-state transition would be ~40× that — another reason to
cap shielded state size.

*Guest-build note (resolved):* the guest needs `jlvm-core` without `blst` (its C backend can't
cross-compile for the SP1 riscv target). Fixed by making `blst` an optional, default-on `bls`
feature in `jlvm-core` and depending on it with `default-features = false` from the guests — see
the **PV / opcode** note below.

## 8.1 No new metakit opcode for public-values decoding

The fused public values are **four static `bytes32`** (`anchor`, `nullifier`, `newCommitment`,
`exprHash`) — a fixed 128-byte ABI layout, **no dynamic arrays**. So the guard extracts each
field with the existing `substr`/`slice` ops at constant offsets, and since `groth16_verify`
attests *exactly* those `publicValues` bytes, slicing fields **from the verified string** is the
binding — no `jlvm_pv_decode` opcode and no hash-commit needed. (This is why the fixed 1-in/1-out
layout is preferable to the value circuit's variable-length `nullifiers[]`/`outputCms[]`, which
*would* have needed dynamic-array offset-following — the original motivation for a PV-decode
opcode in the value sketch §6.1. It evaporates here.)

## 9. Phasing

| Phase | Deliverable | Status |
| --- | --- | --- |
| **P0** | this RFC | ✅ |
| **P1** | `zk-jlvm-shielded` **lib**: fused circuit (membership ∧ `jlvm-core` effect ∧ nullifier ∧ new-commitment) + native tests | ✅ metakit-sdk #53 (9/9) |
| **P1b** | the SP1 **guest** + host + GPU Groth16 fixture | ✅ guest builds blst-free, execute matches native (68.8M cycles), GPU groth16 fixture proved+verified (vkey `0x00f48340…`) |
| **P2** | `shieldApp(def)` in `ottochain-sdk` + a generic `std.shielded.pool` genesis package | 🔜 in progress |
| **P3** | **sealed-bid (Vickrey)** worked end-to-end: place-bid (P1) → reveal → tally | |
| **P4** | bounded-growth: committed nullifier structure + state rent (shared) | |

## 10. Decisions & open questions

**Decided in this RFC:**

- **Fuse, not compose** — P1 is the single fused SNARK (membership ∧ effect ∧ nullifier ∧
  commitment), as built in `zk-jlvm-shielded-lib`.
- **Sealed-bid = Vickrey (second-price), reveal-then-tally** for v1 (§4). A zk settlement proof
  that keeps losers' amounts sealed forever is the deferred privacy upgrade.
- **State model = note (not auth-DB)** for v1; auth-DB/IMT are the documented paths for
  keyed/large/shared state and in-circuit nullifier non-membership (§3.1.1).
- **Off-chain tree = the user wallet** for now — the wallet maintains the Poseidon-Merkle
  commitment tree, serves its own membership paths, and coordinates any off-chain P2P. An
  off-chain coordinator, when needed, becomes the **Bridge** (`~/repos/ottochain-services/`)
  for convenience — a later move, not a v1 dependency.

- **`blst`/guest-build** (P1b) — RESOLVED: `blst` is now an optional, default-on `bls` feature
  in `jlvm-core`; guests use `default-features = false`. Unblocks `zk-jlvm` too.
- **Shielded state-size cap** — a shielded pool caps note state well below the 1 MB fiber cap
  (proving cost is `O(state size)`; §8). Large *keyed* state ⇒ the auth-DB variant.

**Still open:**

1. **`exprHash` pinning** granularity — per-pool (one app) vs per-event (a multi-app pool).
2. **zk-settlement** for sealed-bid — the in-circuit second-price proof that seals losers'
   amounts permanently (the §4 follow-up).
3. **Auth-DB variant** — an in-circuit SMT/MPT mutator for large keyed/shared state (§3.1.1, §8).
