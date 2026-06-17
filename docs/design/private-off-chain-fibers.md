# Privately Managed Off-Chain Fibers — Competitive Landscape & Architecture

**Status:** Design draft
**Audience:** OttoChain core (SDK / metagraph / metakit), protocol design
**Scope:** A design for *private off-chain fibers* — fibers whose internal state lives off-chain and whose public effects settle on the metagraph via a commitment plus a Σ-protocol proof — grounded in a competitive survey of ZK private-contract systems and an audit of OttoChain's current Σ-JLVM machinery.
**Date:** 2026-06-17

---

## 1. Executive summary

### The opportunity

OttoChain already runs **fibers**: deterministic JSON state machines (identity, contracts, markets, governance, corporate) and callable JLVM **script fibers**, all evaluated by a JLVM that is **byte-for-byte identical across Scala, Rust, and TypeScript** and signed over a **frozen canonical encoding** — `JCS(dropNulls(payload))` per RFC 8785, enforced by metakit's `JsonBinaryCodec` and mirrored in the SDK's `dropNulls` + the upstream signer. metakit's JLVM is *currently gaining* a Σ-protocol (Schnorr / Ergo lineage) opcode family: `prove_dlog_verify` (Schnorr/DLog leaf), `prove_dhtuple_verify` (DDH/Diffie–Hellman-tuple leaf), and `sigma_verify` (a recursive CDS AND/OR/k-of-n tree with strong Fiat–Shamir), all over BN254 G1, with Rust/TS conformance vectors.

Everything a *private* off-chain state machine needs **except the proof of hidden computation** is therefore already in hand: a deterministic transition engine, a canonical replay/equality guarantee, multi-language re-execution, and authorization-grade zero-knowledge primitives. Across the competitive set (Midnight/Kachina, Aztec, Aleo, Zcash/MASP/Penumbra, Mina), the **architecture** of "execute privately off-chain, settle a commitment + nullifier + proof on-chain, chain verifies and advances an accumulator" is convergent and stable. OttoChain can adopt that architecture now.

### Core thesis

> **A private off-chain fiber = (a) public on-chain state that is only a *commitment* to the fiber's canonical state, (b) private off-chain state held by the operator/participants, (c) a JLVM transition function run off-chain, and (d) a Σ-protocol proof — verified on-chain by the new sigma opcodes — that *authorizes* the transition and binds it to the new commitment, with a nullifier preventing replay/double-progress.**

This is the **Kachina** decomposition (public ledger state + per-user private state + transition function + transcript/commitment settlement + explicit leakage) adapted to fibers, with one deliberate substitution: where Kachina/Midnight prove an *arbitrary* private transition with a **general circuit SNARK**, OttoChain proves only the *authorization and binding* with **Σ-protocols** — which need **no trusted setup** but **cannot hide arbitrary JLVM computation**.

### The honest boundary (stated up front so the roadmap doesn't overcommit)

| With Σ-protocols only, OttoChain **CAN** | OttoChain **CANNOT** (needs a general SNARK/STARK) |
|---|---|
| Commit to off-chain state and advance it on-chain | Hide *which JLVM transition logic ran* (hidden control flow) |
| Prove ownership / key possession (`prove_dlog_verify`) | Prove "this arbitrary JSON-Logic guard evaluated true on **secret inputs**" |
| Prove 1-of-n ring / k-of-n threshold authorization (`sigma_verify`) | Confidential **amounts** with range proofs |
| Unlinkable one-time **nullifiers** (DH-tuple, `prove_dhtuple_verify`) | **Large** hidden anonymity sets (ZK Merkle membership over a big tree) |
| ZeroJoin-style equal-denomination **mixing** | Succinct **recursive aggregation** of many transitions |
| Threshold / batched ("flow-encryption-style") settlement | — |

The product framing is therefore **"verifiable, authorization-private off-chain fibers"** — hide *who/which-branch/owners/witnesses and one-time-spend linkage*, keep *the program and its public effects* in the clear — **not** "fully shielded, hidden-computation contracts." That subset is real, novel, and buildable on the machinery being shipped today.

---

## 2. Competitive landscape

### 2.1 Comparison matrix

| Protocol | State model | Proof system | Trusted setup | Off↔on-chain split | Asset privacy | Programmability | Maturity |
|---|---|---|---|---|---|---|---|
| **Midnight / Kachina** (IOG) | Public on-chain `ledger` ADT + **per-user off-chain** private state via `witness`; no global private tree | General SNARK — `midnight-proofs` (Halo2/PSE fork; PLONKish + KZG). *Kachina paper is proof-agnostic NIZK* | **Yes** (KZG powers-of-tau) for Midnight; **none** at the Kachina abstraction | Off-chain run → **public transcript + private transcript + state delta + NIZK**; chain replays public transcript (Impact VM), commits iff read-set matches | Zswap: Zerocash notes, sparse homomorphic (multi-value Pedersen) commitments, atomic multi-asset swaps | **Fully general** (Compact DSL → circuits); limit is circuit-encodability | Production-staging (NIGHT live on Cardano Dec 2025; Kukolu privacy-dApp mainnet Q1 2026) |
| **Aztec** (Noir/Aztec.nr) | Dual: private **encrypted notes** (commitments in note-hash tree) + nullifier tree; public account/slot tree (AVM) | General recursive SNARK — ClientIVC (Protogalaxy fold) + Honk/UltraPlonk; Goblin/ECCVM | **Yes** (KZG universal SRS, BN254); inner IPA/Grumpkin path transparent but settlement bottoms out in KZG | **PXE** client-side proving → sequencer gets commitments + nullifiers + encrypted logs + proof; rollup recursively verifies, settles L1 | Tokens are notes; amounts/links hidden; balance conservation = **in-circuit range/arith** | **High** (Noir), private logic is fixed-shape circuits (bounded loops) | Alpha/experimental; "Ignition" L2 live Nov 2025, pre-audit |
| **Aleo** (Leo/snarkVM) | Private **records** (encrypted UTXO ciphertexts, `owner`+`nonce`) + public **mappings** | General SNARK — **Varuna** (batched Marlin, R1CS, KZG) | **Yes** (universal + updatable powers-of-tau SRS) | Off-chain `transition` (snarkVM) → tx carries **serial numbers + commitments + proof**; optional `finalize` runs **publicly** on validators | Encrypted records hide amount/owner/type; private/public/mixed flows | **General** (R1CS), private transition + public finalize | Production (mainnet Sep 2024, 350+ apps, audited) |
| **Zcash Sapling/Orchard · MASP · Penumbra** | Shielded-pool UTXO: notes → **commitments in incremental Merkle tree** + **nullifier set**; root is sole anchor | General SNARK: Sapling **Groth16**/BLS12-381, **Orchard Halo2** (transparent), MASP Groth16, **Penumbra Groth16**/BLS12-377 (*not* Halo2) | **Yes** for Sapling/MASP/Penumbra; **None** for Orchard (Halo2/IPA) | Wallet holds notes, scans via viewing keys, builds nullifiers + proof; chain verifies proof, checks nullifier-nonmembership, appends commitments, advances root | Pedersen **value commitments** (homomorphic sum-to-zero); MASP multi-asset + Convert; Penumbra **flow-encryption** batch DEX | **Deliberately limited** — fixed action/circuit menu (spend/output/convert/swap/…), no user contracts | Production (Sapling 2018, Orchard 2022; MASP & Penumbra mainnet 2024) |
| **Mina zkApps** (o1js) | 8 on-chain field slots + **off-chain Merkle Map**, only its **root** on-chain; Actions/Reducer settle | General SNARK — **Kimchi** (PLONK + **IPA**, transparent) wrapped by **Pickles** recursion (Pasta cycle) | **None** (IPA, DLog + Fiat–Shamir) | Client-side proving (o1js); chain stores 8 fields + root, verifies recursive proof; `settle()` batches actions → one root update | Not native; build confidentiality in-circuit yourself | **High** (general circuits + recursion); concurrency via Actions/Reducer | Production L1 (Berkeley/Kimchi live); client proving heavy |
| **Ergo Σ / ZeroJoin** | **UTXO boxes** guarded by a `SigmaBoolean` (AND/OR/THRESHOLD tree); ZeroJoin half-mix/full-mix boxes | **Σ-protocols** — Schnorr `ProveDlog` + `ProveDHTuple`, CDS trees, Fiat–Shamir. **No SNARK** | **None** (DLog/DDH in ROM) | Interaction pushed **on-chain** (non-interactive CoinJoin); off-chain = each party's secret scalar; spending a box **is** the nullification (no separate nullifier set) | **Unlinkability** of equal-denomination coins (mixer), **not** confidential amounts; fixed denomination | **Limited** — only what a sigma proposition (+ public predicates) expresses; surrounding logic in the clear | Production (Ergo mainnet 2019; ErgoMixer deployed; ZeroJoin ESORICS 2020) |
| **OttoChain (target)** | Public fiber state = **commitment**; private state **off-chain**; nullifier set on-chain | **Σ-protocols** — `prove_dlog_verify`/`prove_dhtuple_verify`/`sigma_verify` (BN254 G1, strong-FS, CDS). `groth16_verify` exists but per-circuit setup | **None** (Σ); a SNARK path would reintroduce setup | Off-chain JLVM run → settle **commitment + nullifier + Σ-proof**; JLVM guard re-verifies on-chain | **ZeroJoin-style** mixing (Σ-only) now; MASP-grade confidential amounts **out of reach** without range proofs | **Authorization-private** state machines; computation in the clear | Σ opcodes **live but unaudited**; TS gap on `groth16`/`smt`/`mpt`/`bn254`/`ecvrf` |

### 2.2 The model to adapt — Kachina / Midnight

**Kachina** (Kerber–Kiayias–Kohlweiss, ePrint 2020/543) is the canonical, UC-proven formalization of *exactly* what private off-chain fibers want to be: a contract is a **transition function** over a two-part state — **public** state on the shared ledger and **private** state held off-chain per user and never published, accessed only indirectly through a contract-defined **state oracle** — plus an explicit **leakage function** that declares what each transition reveals. Running a transition off-chain produces a **public transcript** (ordered reads/writes against public state, which the chain replays), a **private transcript** (witness outputs consumed only by the prover), and a **public-state delta**. Settlement carries `{public transcript, delta, proof}`; validators verify the proof and re-execute the public transcript against current on-chain state, committing iff the read-set still matches — which is simultaneously Kachina's **soundness** mechanism and its **optimistic-concurrency** mechanism (non-conflicting transactions commute and reorder).

Why this is the right mental model for OttoChain, almost line-for-line:

- **JLVM state machines *are* Kachina transition functions.** A fiber's guards/effects already form a deterministic transition over state.
- **`JCS(dropNulls(...))` *is* the transcript-equality / replay-determinism guarantee** Kachina assumes. Kachina's whole concurrency argument rests on the public transcript replaying *identically* across validators; OttoChain already froze that property for signing.
- **Rust/TS/Scala byte-for-byte parity *is* the multi-party re-execution** Kachina takes for granted.
- The **Impact transcript** (public ops replayed on-chain) is conceptually the **same artifact as a deterministic JLVM state-machine transition log**.

**The single gap is the proof.** Kachina/Midnight prove that *there exists* a private state + private inputs making an *arbitrary* transition valid, using a **general circuit SNARK** (Midnight: a Halo2 fork, PLONKish + KZG). OttoChain has only Σ-protocols, which prove **fixed algebraic statements** (knowledge of discrete logs, DH-tuples, monotone AND/OR access structures). So OttoChain can borrow the **architecture and the transcript/concurrency model directly**, and can build the subset of private fibers whose hidden predicate reduces to a Σ-expressible statement — but **cannot hide arbitrary JLVM transition logic** the way Compact does without adding a general SNARK.

**Borrow directly from Kachina/Midnight:** the public/private state split with **no global private-state tree** (chain stores only public state + commitments); **transcript-replay settlement** with read-set matching (needs *no* SNARK — pure JLVM determinism); **optimistic concurrency** via explicit read/write dependency sets; the **explicit leakage function** as a first-class, per-transition privacy budget ("private by default + explicit disclosure"); and **verification-key-as-contract-identity** (bind a fiber's on-chain identity to a hash of its JLVM program + its Σ verification parameters).

### 2.3 The crypto OttoChain actually has — Ergo Σ-protocols & ZeroJoin

Ergo is **the most architecturally aligned protocol in the set**, because OttoChain's new opcodes *are* this lineage. ErgoScript runs surrounding logic **in the clear** and treats Σ-proofs as pure verify-precompiles over a `SigmaBoolean` — exactly metakit's "VM runs in the clear, Σ-proofs are verify opcodes" model. Two atomic leaves over a prime-order group (Ergo: secp256k1; **metakit: BN254 G1**): **ProveDlog** (Schnorr PoK of `x` s.t. `pk = x·G`) and **ProveDHTuple** (PoK of `w` s.t. `u = g^w ∧ v = h^w`). They compose into **AND / OR / THRESHOLD(k,n)** "sigma proposition" trees via the **CDS** (Cramer–Damgård–Schoenmakers) challenge-splitting technique (OR = XOR of challenges; THRESHOLD = Shamir-sharing the parent challenge), with a **strong Fiat–Shamir** root binding the full statement + all commitments + the message. Security is plain **DLOG/DDH in the random-oracle model — no trusted setup, no SRS, no toxic waste**, which is the single biggest advantage over Groth16/PLONK-class SNARKs and precisely what makes byte-for-byte multi-language replication tractable.

**ZeroJoin** (ePrint 2020/560) shows how far this goes for *privacy* with Σ-protocols alone — it is a Zerocoin-style mixer built **entirely from ProveDHTuple**, no SNARK. State is a pool of on-chain mix boxes:

- **Half-mix:** Alice picks secret `x`, publishes `u = g^x`.
- **Full-mix:** Bob spends Alice's half-mix box + an equal-value box, picks `(y, bit)`, publishes `h = g^y`, `v = u^y`, and emits **two indistinguishable** outputs each guarded by `proveDHTuple(g,h,u,v) OR proveDlog(h)`. Alice (knowing `x`) can later spend exactly one because `(g, g^y, g^x, g^{xy})` is a valid DH-tuple for her; Bob spends the other via `proveDlog(y)`. Under DDH an observer cannot tell which output is whose.

Note what ZeroJoin gives and what it does **not**:
- **Gives:** sender↔receiver **unlinkability** for equal-denomination coins; double-spend protection is the *native UTXO consumption rule* (spending the box **is** the nullification — **no separate nullifier set**); anonymity grows with **rounds** (≈ `1/2^n` after `n` rounds), not pool size, so the accumulator never grows monotonically.
- **Does not give:** confidential **amounts** (Σ has no range proof → **fixed denominations**), hidden token type, or any hidden *state*.

**The crucial boundary, restated against the OttoChain machinery:** metakit's `CryptoOps.scala` already implements `prove_dlog_verify`, `prove_dhtuple_verify`, and `sigma_verify`. So OttoChain can borrow Ergo/ZeroJoin **authorization-privacy** patterns *today, with no new crypto*: ownership guards, 1-of-n ring membership, k-of-n thresholds, and the ZeroJoin DH-tuple mixer as a script fiber or state-machine guard. But Σ-protocols hide **which secret/branch** authorized a step, **not arbitrary state** — a private off-chain fiber whose internal state is secret and whose hidden transition settles on-chain **cannot be built from Σ-opcodes alone**.

> **Load-bearing soundness warning, already documented in `CryptoOps.scala`:** composing standalone `prove_dlog_verify` / `prove_dhtuple_verify` with JLVM `or` / `some` is **CRYPTOGRAPHICALLY UNSOUND** for OR/threshold — each standalone proof carries its own independently-derived Fiat–Shamir challenge, so there is no challenge-splitting and no branch hiding (an attacker can satisfy *one* branch and present it as a disjunction it didn't prove). The **only** sound OR/threshold composition is the recursive `sigma_verify` CDS tree. Any private-fiber authorization that is disjunctive/threshold **must** route through `sigma_verify`, never through JSON-Logic boolean glue.

---

## 3. OttoChain mapping

### 3.1 The pieces, and how they line up

| OttoChain primitive | Where it lives | Kachina/Aztec/Mina analogue | Role in a private off-chain fiber |
|---|---|---|---|
| **State-machine fiber** (`StateMachineFiberRecord` + `StateMachineDefinition`) | SDK `src/ottochain/types.ts`; Scala metagraph | Kachina transition function; Aztec public contract | The **on-chain settlement** object: stores the commitment, runs the verifying guard, advances the nullifier set |
| **Script fiber** (callable JLVM; `/data-application/v1/scripts`, `ScriptInvocation`) | SDK `src/generated/ottochain/v1/fiber.ts` | Aztec private function; Mina off-chain method | The **off-chain prover/transition** surface: evaluate the private transition, emit `(commitment, nullifier, Σ-proof)` |
| **JLVM** (JSON-Logic VM) | metakit (Scala) + metakit-sdk (Rust + TS) | Impact VM (Midnight) replay engine | The transition engine; runs **off-chain on private state** and **on-chain on the public transcript/guard** |
| **Canonical signing** `JCS(dropNulls(payload))` | metakit `JsonBinaryCodec`; SDK `signing.ts` + `drop-nulls.ts` | Kachina transcript-equality; Zcash note-commitment determinism | The **commitment/nullifier preimage encoding** — what gets hashed must be these exact bytes |
| **Σ opcodes** `prove_dlog_verify` / `prove_dhtuple_verify` / `sigma_verify` (BN254 G1) | metakit `CryptoOps.scala`; metakit-sdk `crypto.rs` + `crypto-ops.ts` | Ergo `SigmaBoolean`; Aztec key-derived nullifier; Zcash Chaum–Pedersen nullifier | The **proof verified on-chain**: ownership, ring/threshold authorization, DH-tuple nullifier well-formedness |

### 3.2 Σ-protocol capability vs SNARK capability — the honest implications

**What the sigma opcodes let a private fiber prove on-chain (buildable now):**
1. **Ownership / key possession** — `prove_dlog_verify`: "the actor advancing this fiber holds the secret behind public key `pk`," with no plaintext signature field.
2. **Ring (1-of-n) and k-of-n threshold authorization** — `sigma_verify` CDS OR/THRESHOLD trees: "*one of* the board / *k of n* directors authorized this transition," hiding *which*. Native sweet spot; maps onto governance/corporate/identity fibers.
3. **DH-tuple relations** — `prove_dhtuple_verify`: equality-of-discrete-logs, the literal ZeroJoin leaf and the basis for a **key-derived nullifier** (`nf` bound to a secret key by a common discrete log, the classic Chaum–Pedersen construction).
4. **Unlinkable equal-denomination mixing** — the ZeroJoin half-mix/full-mix pattern as a fiber.

**What Σ-protocols *cannot* do, and the product consequence:**

| Capability the competitors have | Why Σ-only can't reach it | Honest implication for OttoChain |
|---|---|---|
| Prove an **arbitrary hidden JLVM transition** ran correctly on secret inputs | Σ proves fixed algebraic relations, not circuit satisfiability; there is **no circuit for the JLVM itself** | The transition **logic is public**. We hide *authorization, owners, witnesses, linkage* — not the program or its effects. JLVM evaluates guards/effects **in the clear**. |
| Confidential **amounts** (`0 ≤ v < 2^64`, balance conservation) | No native **range proof**; naive Σ range proofs are too large | No hidden balances/bids/limits. Mixing must use **fixed denominations**. (Range proofs ⇒ Bulletproofs — transparent, but **not** in the opcode set today.) |
| **Large** shielded anonymity set | Needs **ZK Merkle membership** (hidden-index over a big tree) — a circuit. Σ ring proofs are **O(n)**, so only tiny rings are practical | Anonymity = **small explicit ring** or **round-based** (ZeroJoin), **not** a Zcash-grade pool. Drop or explicitly bound this. |
| **Succinct recursive aggregation** of many steps | Σ-proofs compose via AND/OR but **do not compress**; N statements ≈ O(N) bytes | Multi-step fibers won't get Aztec/Mina single-proof settlement. Settlement cost scales with proof-tree size. |
| Fully hidden **control flow** | Hiding *which branch of a computation even exists* needs circuit execution | We can hide *which branch of a sigma tree* was satisfied, but the **statement shape is public** to the on-chain guard. |

**Net:** OttoChain's advantage is **no trusted setup + cheap verification + multi-language determinism**; its ceiling is **fixed-statement authorization privacy**. Frame the product as *authorization-private + commitment-based*, not *computation-private*, unless/until a (preferably transparent — Bulletproofs/IPA-Halo2/STARK) SNARK is added.

---

## 4. Proposed architecture — "Private Off-Chain Fiber"

A **Private Off-Chain Fiber (POF)** adapts Kachina to OttoChain fibers, using the **script fiber** as the off-chain prover/transition surface and the **state-machine fiber** as the on-chain settlement object.

### 4.1 State decomposition

- **Public on-chain state** (in the state-machine fiber record): a **commitment** `C = H(JCS(dropNulls(S_priv)) ‖ salt)` to the fiber's current canonical private state `S_priv`, plus protocol metadata: the bound program identity (`StateMachineDefinition.computeDigest` + the fiber's Σ verification parameters), an append-only **commitment log/root**, a **nullifier set**, and an explicit **disclosure field** (the leakage budget — what this transition publishes in the clear).
- **Private off-chain state** `S_priv`: the full canonical JSON state, held by the operator/participants, **never published**. Its hash is `C`.

### 4.2 The JLVM transition function

A POF transition is the *same* JLVM evaluation OttoChain already runs, executed **off-chain on `S_priv`** by the operator (via the script-fiber surface):

```
(S_priv', publicDelta, transcript) = JLVM_transition(S_priv, action, witnesses)
C' = H(JCS(dropNulls(S_priv')) ‖ salt')
```

Because the JLVM is byte-for-byte across Rust/TS/Scala and the preimage is `JCS(dropNulls(...))`, `C'` is reproducible by any party that learns `S_priv'` and recomputed identically by the chain when (and if) `S_priv'` is ever revealed — **the same determinism that signing already depends on**.

### 4.3 The Σ-proof attached per transition

Each transition carries a **non-interactive Σ-proof bundle** verified on-chain by the sigma opcodes. The Fiat–Shamir **message** binds the transition context — minimally `H(C ‖ C' ‖ publicDelta ‖ fiberId ‖ ordinal)` — so the proof is non-malleable and inseparable from *this* state advance. The bundle proves the **authorization predicate** the fiber declares, e.g.:

- **Ownership:** `prove_dlog_verify(pk, msg, π)` — operator holds the fiber key.
- **Ring / threshold:** `sigma_verify(proposition, proof, msg)` — a CDS OR/THRESHOLD tree (governance/corporate quorum), hiding which member acted. *(Disjunctive/threshold authorization MUST use `sigma_verify`, never JLVM `or`/`some` — see §2.3.)*
- **Nullifier well-formedness:** `prove_dhtuple_verify(g, h, u, v, msg, π)` — the published **nullifier** `nf` is the correct key-derived tag for the consumed commitment (Chaum–Pedersen DH-tuple), so it is **unlinkable** to the commitment yet **deterministic** (one `nf` per spend).

### 4.4 On-chain validator checks (the state-machine fiber guard)

On settlement, validators run a **public JLVM guard** that performs only verification + bookkeeping — no private re-execution:

1. **Program/identity binding:** the proof's statement parameters match the fiber's pinned `computeDigest` + Σ params (verification-key-as-identity).
2. **Proof verification:** the Σ bundle verifies against the FS message `H(C ‖ C' ‖ publicDelta ‖ …)` via the sigma opcodes.
3. **Nullifier non-membership:** `nf ∉ nullifierSet` (replay / double-progress guard), then **insert** `nf`.
4. **Commitment advance:** record `C'` as current; **append** `C'` to the commitment log/root.
5. **Leakage/disclosure:** apply only the explicitly disclosed `publicDelta` to public state; everything else stays in `S_priv` off-chain.

This is **settlement plumbing, not ZK** — steps 3–4 are ordinary JLVM state-machine effects ("nullifier not in set," "append commitment"), and only step 2 touches cryptography. It reuses the byte-for-byte JLVM end-to-end: the operator proves off-chain in Rust/TS, the chain verifies in Scala, and `sigma_verify`'s **frozen** canonical layout (`DomainSep = "sigma_verify:v1" ‖ serializeTree(root) ‖ message`, `low31` challenge reduction) guarantees identical challenges on both sides.

### 4.5 Concurrency (borrowed from Kachina)

Have the off-chain transition emit its **read/write dependency set** alongside `publicDelta`. The guard commits iff the declared read-set still matches current public state; non-conflicting POF transitions then **commute and rebase** instead of serializing — Kachina's optimistic-concurrency model, free on OttoChain's deterministic replay.

### 4.6 Asset privacy as a specialization (ZeroJoin now; MASP later)

Asset privacy is a **specialization of the POF settlement shape**, not a separate system:

- **ZeroJoin mixer fiber (buildable now, Σ-only):** a script fiber emitting two equal-denomination outputs each guarded by `prove_dhtuple_verify(g,h,u,v) OR prove_dlog_verify(h)` **composed via `sigma_verify`**. Settles via normal state/UTXO consumption — *spending the box is the nullification*, so for the pure mixer **no separate nullifier set is even required**. Delivers per-asset, per-denomination payment **unlinkability**, with **round-based** anonymity accounting (`1/2^rounds`). Requires solving the ZeroJoin **fee-privacy** problem (naive fee payment de-anonymizes the mix).
- **MASP-grade shielded pool (out of reach today):** note-commitment + nullifier + **homomorphic Pedersen value commitments** (sum-to-zero balance) is *partly* Σ-reachable — the balance check needs no SNARK — but **hidden amounts need range proofs** and a **large anonymity set needs ZK Merkle membership**, both circuit-shaped. Treat as a later phase gated on adding a transparent range-proof / membership primitive.
- **Threshold / batched settlement (Penumbra flow-encryption analogue, Σ-adjacent):** "many private off-chain intents → aggregate → reveal only the **net** on-chain" via additively-homomorphic threshold (ElGamal-style) encryption + Pedersen DKG + Chaum–Pedersen decryption proofs — buildable **without a SNARK** and the strongest analogue to POF *batching*. Carries a validator liveness/collusion (threshold-honesty) assumption.

---

## 5. Buildable-today vs gaps (tied to the machinery audit)

### 5.1 What the current sigma opcodes already enable

From the machinery audit — **LIVE**: `prove_dlog_verify` (DLog leaf), `prove_dhtuple_verify` (DDH leaf), `sigma_verify` (CDS tree); plus `schnorr` / `poseidon` / `pmt` (Poseidon-Merkle) / `bls` with TS parity. Expressible **today**: discrete-log knowledge, DDH tuple, OR/ring, k-of-n multisig, AND/OR/threshold, `groth16` off-chain verify (Scala only), SMT/MPT (clear), Poseidon+Merkle, ECVRF.

**Therefore the following POF capabilities are buildable now, with no new crypto:**

| Capability | Opcode(s) | Notes |
|---|---|---|
| On-chain **commitment** to canonical fiber state | `poseidon` / `pmt` over `JCS(dropNulls(state))` | Determinism reuses the signing canonicalization |
| **Ownership / authorization** guard | `prove_dlog_verify` | Replaces plaintext signature field |
| **Ring / k-of-n threshold** authorization (branch-hiding) | `sigma_verify` | **Must not** use JLVM `or`/`some` |
| **Key-derived nullifier** well-formedness | `prove_dhtuple_verify` | Chaum–Pedersen; unlinkable one-time tag |
| **ZeroJoin mixer** (equal-denomination unlinkability) | `prove_dhtuple_verify` + `prove_dlog_verify` via `sigma_verify` | Round-based anonymity; needs fee-privacy scheme |
| **Append-only commitment tree** membership (transparent) | `pmt` / `poseidon` | Merkle auth checked in clear by JLVM; only *hiding the preimage* needs a Σ proof |

### 5.2 The specific NEW primitives required

Mapped directly to the audit's `gapsForPrivacy` — **no hiding commitment, no nullifier, no ZK membership, no range proof, no encryption, no balance leaves, TS gap, no audit**:

| Gap (audit) | New primitive needed | Σ-reachable? | Blocks |
|---|---|---|---|
| **no hiding commitment** | A standardized **hiding-binding state commitment** scheme (salt + canonical preimage + fixed hash), with a Σ proof-of-knowledge-of-opening | **Yes** (Pedersen + `prove_dlog_verify`) | All POF |
| **no nullifier** | A canonical **nullifier derivation** (`nf` from owner key + commitment nonce) + on-chain **nullifier-set** state-machine ops (non-membership + insert) | **Yes** (`prove_dhtuple_verify`) | Replay/double-progress safety |
| **no ZK membership** | ZK **set-membership over a large tree** (hidden index) | **No** — needs SNARK/STARK; *small explicit rings* only with Σ | Large anonymity sets |
| **no range proof** | **Range proofs** (`0 ≤ v < 2^n`) | **No** — Bulletproofs (transparent) or SNARK; **new opcode** | Confidential amounts |
| **no encryption** | **Note/state encryption** to owner + **viewing-key trial-decryption** discovery infra | Orthogonal to Σ; **build regardless** (key mgmt, tagging) | Private discovery / asset notes |
| **no balance leaves** | **Homomorphic value commitments** + sum-to-zero balance opcode | Partly (Pedersen sum needs no SNARK; range bound does) | Multi-asset balance |
| **TS gap** | TS parity for `smt`/`mpt`/`bn254`/`ecvrf`/`groth16` (currently **no TS**) | N/A (engineering) | Client-side proving where these are needed |
| **no audit** | **External cryptographic audit** of the CDS + strong-FS surface | N/A | Any **real spend/mint** path |

> Two of these gaps are **hard walls** for Σ-only: **ZK membership** (large anonymity sets) and **range proofs** (confidential amounts). Both are *circuit-shaped*. If/when added, prefer **transparent** systems (Bulletproofs / IPA-Halo2 / STARK) to preserve the no-ceremony property that distinguishes OttoChain — do **not** silently inherit a KZG powers-of-tau ceremony.

---

## 6. Threat model & trust assumptions

**Assets to protect:** the *content* of private off-chain state `S_priv`; the *identity* of the authorizing party (which key / which ring member); the *linkage* between a consumed commitment and its nullifier; (for mixing) sender↔receiver unlinkability.

**Adversary capabilities:** full view of all on-chain data (commitments, nullifiers, proofs, disclosed deltas, tx timing/size); may submit transactions; may collude with other participants / mixer peers / (for threshold settlement) some validators.

**What POF guarantees (under DLOG/DDH in the ROM, no trusted setup):**
- **Soundness of authorization:** a transition commits only if a valid Σ-proof of the declared predicate verifies against the FS message binding `(C, C')`. Forging requires breaking DLOG/DDH or the strong-FS hash (ROM).
- **No replay / double-progress:** the nullifier-set non-membership check; `nf` is deterministic and key-bound.
- **Branch/owner privacy:** CDS trees (`sigma_verify`) hide which leaf/branch satisfied a disjunction/threshold.
- **State confidentiality:** `S_priv` never leaves the operator; only `C` and the explicit `publicDelta` are on-chain.

**What POF does NOT guarantee (must be stated to users):**
- **Not hidden computation:** the transition *logic* and its public effects are visible; only secrets/owners/witnesses/linkage are hidden.
- **Not confidential amounts; not large anonymity sets** (Σ ceiling; see §5.2).
- **Leakage is real:** the public transcript, *which* commitments/nullifiers are touched, disclosed deltas, and **tx timing/size** all leak. Each fiber's **leakage function must be explicit** and minimized; Σ-proofs are larger and **can leak statement structure**.
- **Threshold-settlement variants** add a **validator liveness + ≤t-collusion** assumption (DKG correctness, epoch key rotation) — not unconditional privacy.

**Cross-cutting, load-bearing risks (same failure class as the SDK's existing `InvalidSignature`/HTTP-400):**
- **Canonicalization determinism is load-bearing.** Every commitment/nullifier/FS-transcript preimage must round-trip through `JCS(dropNulls(...))` **byte-for-byte across Rust/TS/Scala**, *and over the same bytes the signing path uses*. Any divergence ⇒ client-computed commitment/nullifier ≠ chain recomputation ⇒ **opaque proof/settlement failure**, indistinguishable from the canonical-mismatch bug already known in the SDK.
- **Strong Fiat–Shamir is non-negotiable.** A transcript that omits any statement point or commitment is forgeable (the weak-FS / ZK-ElGamal class). All POF Σ usage must bind the **full** statement + commitments + message under the frozen canonical layout.
- **`sigma_verify`-only OR/threshold.** JLVM `or`/`some` over standalone leaves is unsound (§2.3) — an easy, fatal JSON-Logic-layer mistake.
- **Curve strength.** BN254 is ~100-bit security with known pairing-related weakening — fine for these discrete-log Σ-proofs, weaker than Ergo's secp256k1; flag if Σ-proofs gate high-value asset policy.
- **Audit gating.** metakit's Σ surface is **live but not externally audited** on its CDS/strong-FS code; conformance vectors are necessary-but-not-sufficient. **Do not place it on a real mint/spend path before an audit.**

---

## 7. Phased roadmap

### Phase 0 — Feasibility spike (proof on a single transition)
**Goal:** prove the POF loop end-to-end on **one** transition, no asset value, off the real spend path.
**Deliverables:**
- A spec for the **state commitment** preimage (`JCS(dropNulls(S_priv)) ‖ salt`) and the **FS message** binding (`C ‖ C' ‖ publicDelta ‖ fiberId ‖ ordinal`).
- A prototype **script fiber** that runs a JLVM transition off-chain and emits `(C', π_ownership)` via `prove_dlog_verify`.
- A prototype **state-machine fiber guard** that verifies the proof and advances `C`.
- **Cross-language commitment/FS vectors** (Rust/TS/Scala) proving byte-for-byte parity — the single highest-risk item.
**Exit criterion:** a transition authored in TS, proven, and settled by the Scala guard, with a deliberately-mutated null/field shown to produce the opaque-mismatch failure (so the determinism guard is demonstrably effective).

### Phase 1 — MVP private fiber (authorization-private state machine)
**Goal:** a usable POF with branch-hiding authorization + replay safety, on governance/corporate/identity fibers.
**Deliverables:**
- **Nullifier** derivation + on-chain **nullifier-set** ops (non-membership + insert) with `prove_dhtuple_verify` well-formedness.
- **Ring / k-of-n** authorization via `sigma_verify` (e.g. "k-of-n directors advanced this fiber, hiding which") — wired so disjunction **cannot** fall back to JLVM `or`/`some`.
- **Append-only commitment log/root** as state-machine state; **explicit leakage/disclosure** field per transition.
- **Optimistic concurrency**: read/write dependency-set declaration + read-set match on settlement.
- SDK surface (TS): build/sign/submit a POF transition; helper to compute the canonical commitment via the existing `dropNulls` path.
**Exit criterion:** a multi-party corporate/governance fiber whose *authorizer is hidden* and whose state is off-chain, with replay rejected. **Gated by external audit before any value-bearing use.**

### Phase 2 — Asset privacy (ZeroJoin mixer)
**Goal:** payment unlinkability with Σ-only crypto.
**Deliverables:**
- **ZeroJoin half-mix/full-mix** as a script fiber: two equal-denomination outputs guarded by `prove_dhtuple_verify(g,h,u,v) OR prove_dlog_verify(h)` **via `sigma_verify`**.
- A **fee-privacy** scheme (ZeroJoin needed a novel one precisely because naive fees de-anonymize the mix).
- **Round-based anonymity** accounting + UX/cost model to drive repeated rounds.
- **Note/state encryption** + **viewing-key discovery** infra (orthogonal to Σ; needed for participants to find their outputs).
**Exit criterion:** a working per-asset, per-denomination mixer with measured anonymity vs rounds; **audited** Σ spend path.

### Phase 3 (stretch / gated) — Confidential amounts & larger anonymity sets
**Goal:** close the two Σ hard walls.
**Deliverables (decision-gated):**
- Evaluate a **transparent** range-proof primitive (Bulletproofs) as a new opcode for confidential amounts + homomorphic value-commitment balance leaves (MASP-style multi-asset).
- Evaluate **ZK set-membership** (transparent SNARK/STARK) for large anonymity sets — explicitly weighing the no-trusted-setup constraint.
- Optionally, **threshold/flow-encryption batched settlement** (threshold-Schnorr + Pedersen DKG + Chaum–Pedersen decryption proofs) for "many private intents → one net on-chain settlement."
**Exit criterion:** a written decision on whether to add a transparent general-proof primitive, with the trust-model trade-off (no ceremony) made explicit.

---

## 8. Open questions & risks

**Cryptographic / design**
1. **Nullifier derivation** must bind to the canonical commitment + spending key via `prove_dhtuple_verify` *correctly* — get it wrong and you get either **linkability** (privacy loss) or **forgeable double-spends** (soundness loss). Needs a frozen, vectored spec.
2. **Salt/blinding management** for hiding commitments: where does `salt` live, how is it recovered, how does it survive fiber upgrades?
3. **Dynamic JLVM control flow vs fixed statements.** A JSON-Logic state machine is more dynamic than a fixed circuit; even for Σ, mapping which *predicate* is proven per branch may force bounding/unrolling decisions at fiber-design time.
4. **Anonymity-set strategy:** commit to *round-based* (ZeroJoin) vs *small explicit rings* — pick deliberately, since the SNARK-backed large-pool option is off the table without Phase 3.

**Determinism / parity (highest operational risk)**
5. **One canonical path or two?** The commitment/nullifier/FS preimage must be the *same* `JCS(dropNulls(...))` bytes as signing — confirm there is exactly one canonicalizer shared by signing and commitment, across Rust/TS/Scala, to avoid a second `InvalidSignature`-class failure surface.
6. **TS parity gap.** Client-side proving that needs `smt`/`mpt`/`bn254`/`ecvrf`/`groth16` is blocked until TS parity lands; scope which POF features depend on the TS-missing opcodes.

**Maturity / process**
7. **Audit is a gate, not a step.** The Σ CDS/strong-FS surface is unaudited; **no value-bearing POF** (Phase 2+) ships before it. Budget and schedule the audit explicitly.
8. **Leakage-function discipline** is a *design* obligation per fiber, not a library feature — who reviews each fiber's declared disclosure for actually-minimal leakage (timing/size/touched-set included)?

**Strategic**
9. **Don't oversell.** The competitive temptation is to claim "Midnight/Aztec-style private contracts." OttoChain delivers **authorization-private, commitment-based off-chain fibers** — a real and differentiated subset (no trusted setup, cheap verification, multi-language determinism), but **not** hidden-computation or hidden-amount contracts. Marketing and roadmap must hold this line, or the gap becomes an `InvalidSignature`-style surprise for integrators.
10. **Aztec Connect's sunset is the cautionary tale:** fixed-statement privacy hit a programmability ceiling and forced a rebuild on a general VM. A Σ-only POF is similarly bounded by construction — be explicit that Phase 3 (a transparent general-proof primitive) is the only path past that ceiling, so the architecture leaves room for it.
```
