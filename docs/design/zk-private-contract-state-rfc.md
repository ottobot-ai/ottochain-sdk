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

## 8. Proving cost (estimate)

Cost of a fused transition = shielded scaffolding + the `jlvm-core` effect + the Groth16 wrap.
Anchor: the now-sound `zk-shielded` value circuit measured **~133M cycles** for 2-in/2-out (two
depth-8 Poseidon-Merkle memberships + 4 commitments + 2 nullifiers + per-asset conservation),
and its Groth16 proof on the **RTX 5090** (`sp1-gpu-server`) completed in single-digit-to-low-
tens of minutes.

Decomposition for the 1-in/1-out fused transition:

- **Shielded scaffolding** (1 depth-8 membership + old/new commitments + nullifier + owner
  hash ≈ ~12 Poseidon perms) — *fewer* than zk-shielded's 2-in/2-out (~20+ perms). Poseidon
  dominates zk-shielded's 133M, so scaffolding ≈ **~60–90M cycles**.
- **`jlvm-core` effect** — parse the witness JSON + evaluate the effect + RFC-8785 canonicalize
  the output. For a small app effect (merge/cat/arithmetic) this is **single-digit to low-tens
  of M cycles**, dominated by JSON parse/canonicalize, not the logic.
- **2× keccak256** — cheap with SP1's keccak precompile (**< ~1M each**).

So a typical fused transition ≈ **~80–130M cycles** — the *same order* as `zk-shielded`. The
**Groth16 wrap is a roughly fixed cost** (recursion + final SNARK) that dominates wall-clock
regardless of guest cycles.

- **On the 5090:** expect **single-digit to ~15 min** per Groth16 proof (the wrap dominates),
  comparable to the measured `zk-shielded` proof.
- **On the SP1 prover network:** priced by prover-gas roughly ∝ cycles; a ~100M-cycle program
  Groth16-wrapped sits in the **same tier as the value circuit** — order **cents–dollars per
  proof** (exact figure per the current network tariff). Wallets prove off-chain (local GPU or
  the network); the chain only *verifies* (the cheap `groth16_verify` opcode).

**Caveat — exact `jlvm-core` cycles are currently blocked.** The `zk-jlvm` (and `zk-jlvm-shielded`)
**guest** can't build here: `jlvm-core` pulls `blst`, whose C backend doesn't cross-compile for
the SP1 riscv target with the system `cc` (`-mabi=lp64` unrecognized). Fixing it (point the
guest C build at SP1's clang, or feature-gate `blst` out of the guest) unblocks the precise
cycle count **and** the GPU fixture. The native constraint system (the `lib`) is unaffected —
`blst` builds fine on x86 — so `zk-jlvm-shielded-lib` is green today (metakit-sdk #53).

## 9. Phasing

| Phase | Deliverable | Status |
| --- | --- | --- |
| **P0** | this RFC | ✅ |
| **P1** | `zk-jlvm-shielded` **lib**: fused circuit (membership ∧ `jlvm-core` effect ∧ nullifier ∧ new-commitment) + native tests | ✅ metakit-sdk #53 (9/9) |
| **P1b** | the SP1 **guest** + host + GPU Groth16 fixture + first conformance vector | ⛔ blocked on the `blst`/guest-build fix (also blocks `zk-jlvm`) |
| **P2** | `shieldApp(def)` in `ottochain-sdk` + a generic `std.shielded.pool` genesis package | |
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

**Still open:**

1. **`exprHash` pinning** granularity — per-pool (one app) vs per-event (a multi-app pool).
2. **The `blst`/guest-build fix** (P1b) — SP1-clang for the guest C build vs feature-gating
   `blst` out of the zkVM target.
3. **zk-settlement** for sealed-bid — the in-circuit second-price proof that seals losers'
   amounts permanently (the §4 follow-up).
