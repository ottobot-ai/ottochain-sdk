# Handoff — Privacy Primitives to Add to metakit / metakit-sdk

**Goal:** make OttoChain's privacy story competitive with Midnight (and Aztec / Zcash / Penumbra / Aleo), by adding a small, ordered set of primitives to **metakit** (the Scala on-chain JLVM engine) and **metakit-sdk** (the byte-for-byte Rust + TS JLVM).

**Audience:** an implementing agent. This doc gives the competitive gap analysis, a prioritized work list (each item: what / why / where / how / unlocks / effort / acceptance / risks), a sequencing roadmap, the ethos constraints to respect, and the files to read first.

**Status of inputs:** grounded against the repos as of 2026-06-17 (metakit-sdk `fix/sigma-dos-hardening`, metakit codec-KAT work). Verified gaps: no standalone range proof, no proof recursion/aggregation, no viewing-key/note-encryption, no on-chain nullifier *set*, no `pv_decode` opcode, and the TS evaluator implements only a subset of the zk-verify opcodes.

---

## 0. The strategic thesis (read first)

OttoChain's differentiator is already built and is the thing Midnight spent years on: **it can prove an *arbitrary* JLVM (JSON-Logic) program executed on private inputs**, via `zk-jlvm` (an SP1 zkVM guest that runs the *real* byte-compatible Rust JLVM and commits `keccak(expr,data,output)+ok`), verified on-chain by a native `groth16_verify`. That is client-held-private-logic of the **Kachina/Midnight class** — but instead of a bespoke DSL→circuit compiler (Compact / Noir / Leo), OttoChain **proves the interpreter itself in a zkVM**, so *the same readable JSON-Logic runs in the clear or in zero-knowledge*. Lean into this; do not build a circuit DSL.

The work below is **not** about acquiring that capability — it exists. It is about the **surrounding subsystems** that turn "we can prove a private transition" into "a usable, unlinkable, auditable, scalable private ledger tier" — i.e. closing the gap to Midnight/Zcash on the parts OttoChain hasn't built yet.

---

## 1. What already exists (the asset you build on)

| Primitive | Where | Status |
|---|---|---|
| Σ-protocols: `prove_dlog_verify` / `prove_dhtuple_verify` / `sigma_verify` (CDS AND/OR/threshold, strong-FS, BN254 G1, **no trusted setup**) | `metakit/.../json_logic/ops/CryptoOps.scala`; `metakit-sdk/rust/jlvm-core/src/crypto.rs` + TS `crypto-ops.ts` | shipped |
| `groth16_verify` (SP1-Groth16-BN254, **one universal setup**, fixed `VK_ROOT`, 250k gas) + native JVM verifier | `metakit/.../crypto/zk/Sp1Groth16Verifier.scala` + `Groth16Verifier.scala` + `Bn254.scala`; Rust in `jlvm-core/src/crypto.rs` | shipped (Scala+Rust; **not** in TS) |
| **`zk-jlvm`** — prove arbitrary JLVM execution (expr+data private) | `metakit-sdk/rust/zk-jlvm/{program,script,lib}` | shipped (the Kachina-class core) |
| **`zk-shielded`** — Sapling/Orchard-style confidential transfer (Poseidon notes, nullifiers, Merkle membership, conservation, in-circuit u64 range) | `metakit-sdk/rust/zk-shielded/{program,script,lib}` | shipped circuit, **2 soundness TODOs**, **not integrated on-chain** |
| Poseidon + Poseidon-Merkle, SMT/MPT auth-DB, BN254 add/mul/pairing, BLS, ECVRF, Schnorr — gas-metered | `metakit/.../crypto/zk/*`, `json_logic/ops/*`, `json_logic/gas/*`; `metakit-sdk/rust/poseidon-bn254` | shipped |
| Committed-state MPT root + light-client `state-proof` endpoints | `ottochain/.../schema/CalculatedState.scala` (`committedView`), `ML0Routes.scala` (`/state-proof`) | shipped |
| ZkVerify-gated morphism (witness-gated JLVM guards; `witness` context key) | PR #166; `ottochain/.../lifecycle/combine/AssetCombiner.scala`; `MintAsset`/`ApplyMorphism.witness` | shipped |
| Canonical signing `canonicalize = JCS ∘ dropNullFields` (metakit 1.8.x) | `metakit-sdk/packages/typescript/src/json-logic/canonicalize.ts` + Scala `JsonBinaryCodec` | shipped (source; npm/crates still 0.2.0) |

**Trusted-setup posture (an advantage to preserve):** Σ needs none; SP1-Groth16 needs **one** universal ceremony (the SP1 wrapper VK), reused by *every* program — strictly better than Midnight's / Aztec's KZG-per-system posture. Don't regress this.

---

## 2. Competitive gap analysis

| Capability | Midnight | Aztec | Zcash / Penumbra | OttoChain today | Missing primitive |
|---|:--:|:--:|:--:|---|---|
| Client-held private state + **arbitrary private logic** | ✅ Kachina/Compact | ✅ Noir | ⚠️ fixed actions | ✅ **`zk-jlvm`** | — (parity; the differentiator) |
| Confidential amounts (shielded transfer) | ✅ Zswap | ✅ notes | ✅ | ✅ circuit, ❌ on-chain | nullifier set + integration |
| **Unlinkable transfers / nullifier set** | ✅ | ✅ | ✅ | ❌ (circuit emits `nf`, nothing checks them) | **on-chain nullifier subsystem** |
| **Client-side proof *verification*** (wallet/browser) | ✅ | ✅ PXE | ✅ | ❌ in TS (`groth16`/`smt`/`mpt`/`bn254`/`ecvrf` unported) | **port verify opcodes to TS** |
| Bind a hidden value to a **public rule** (Kachina "the rule is X") | ✅ | ✅ | n/a | ⚠️ proof works, but `publicValues` is opaque on-chain | **`jlvm_pv_decode`** |
| **Viewing keys / selective disclosure / auditability** | ✅ `disclose()` | ⚠️ | ✅ FVK/IVK/OVK | ❌ | **viewing-key + note encryption** |
| Confidential amounts **outside** a fixed circuit (general JLVM values) | ✅ | ✅ | ✅ MASP | ❌ (no range opcode) | **range-proof primitive** |
| **Proof recursion / aggregation** (scale) | ✅ | ✅ rollup | ⚠️ | ❌ | **recursion / aggregation** |
| No-trusted-setup transparency | ❌ KZG | ❌ KZG | ✅ Orchard (Halo2) | ⚠️ Σ none; SP1 one universal | (optional) transparent general proof |
| Readable contract across public/private | ❌ Compact-only | ❌ Noir-only | ❌ | ✅ **one JLVM, three tiers** | — (advantage) |

**Read:** the *capability* parity with Midnight is already there (zk-jlvm). The competitive gaps are the **nullifier subsystem** (the single biggest one — it gates the entire private tier), **client-side TS verification**, **viewing keys**, and then **range / recursion** for depth and scale.

---

## 3. Prioritized work list

> Each item is scoped to a primitive in **metakit** (Scala on-chain) and/or **metakit-sdk** (Rust circuit + Rust/TS opcode). On-chain *state* (nullifier maps, shielded records) also touches **ottochain** (`modules/models` + `modules/shared-data`), noted where relevant.

### P0 — the gating unlock for the PRIVATE tier

#### P0.1 — On-chain nullifier-set subsystem (the #1 gap)
- **Status (2026-07-15): SHIPPED chain-side** — the protocol nullifier set landed in ottochain#214 (design of record: `docs/proposals/protocol-nullifier-set.md` in the ottochain repo; committed key `nullifier/<domain>/<nf>` with domain = the consuming fiber's id, `_consumeNullifier` effect token, combiner-only check-absent-then-insert ⇒ graceful `CombineRejected`, `/v1/nullifiers/{domain}/{nf}` route, checkpoint-excluded unbounded set — that design supersedes this entry's bounded-growth/state-rent sketch for v1). MPT **absence proofs** shipped in metakit#60 (`MerklePatriciaProof.{Inclusion,Absence}`, rc.8); `@ottochain/sdk` mirrors both (`verifyMptAbsence`/`verifyAbsenceProof`, `getNullifier`, `consumeNullifier`). The original analysis below is kept for context.
- **What:** a committed-state projection `nullifier/<hash>` (a TOTAL committed-view key like `asset/` and `nonce/`), with a combiner-only **non-membership-then-insert** check, and a **bounded-growth** design (the hard part).
- **Why competitive:** without it there is *no* unlinkable transfer and *no* double-spend protection — the `zk-shielded` circuit already produces nullifiers but nothing on-chain consumes them. This is the difference between "we have a shielded circuit" and "we have a shielded ledger" (Zcash/Penumbra/Midnight all have it).
- **Where:** state + ops in **ottochain** (`modules/models/.../CalculatedState.scala` `committedView`, a new `ShieldedSpend` op in `Updates.scala`, combiner in `modules/shared-data/.../AssetCombiner.scala`); the membership/insert primitive can lean on metakit's SMT/Poseidon-Merkle (`metakit/.../crypto/zk/merkle`).
- **How:** follow `ottochain/docs/proposals/asset-shielded-mode.md` §3.3 — non-membership read is **combiner-only** (a read at L1 block-validity is a TOCTOU block-poisoning hazard; CLAUDE.md #3). The research weight is **bounded growth**: nullifier sets are monotonic/unbounded (can't prune like `usedNonces`). Design = **state-rent** (charge shielded activity) + **epoch-windowing** (commit each epoch's nullifier root permanently; keep only a sliding hot window). Note-commitment tree (P0.2) is windowed in lockstep.
- **Unlocks:** the entire private/shielded tier; `ShieldedSpend` morphism (asset-shielded-mode §3.2).
- **Depends on:** committed-state MPT (shipped). **Effort:** Large (the bounded-growth design has real research weight). **Acceptance:** a shielded spend rejects a re-used nullifier deterministically (graceful `CombineRejected` → `RejectionReceipt`), a light client can prove a nullifier present/absent against the snapshot root, and the hot set stays bounded under sustained spend. **Risk:** the TOCTOU/block-poisoning class — keep the check combiner-only.

#### P0.2 — Harden + integrate the `zk-shielded` circuit
- **What:** fix the two documented soundness TODOs and wire the circuit to a `ShieldedSpend` morphism + the P0.1 nullifier set + a note-commitment tree root in committed state.
- **Why:** the circuit is *unsound as-is* for the two cases below; both must close before it guards value.
- **Where:** `metakit-sdk/rust/zk-shielded/lib/src/lib.rs` — (a) **intra-transfer nullifier uniqueness** (`lib.rs:212-217`: the same input note can be listed twice; enforce pairwise-distinct `nf` in-circuit, e.g. strictly-ascending order); (b) **multi-asset conservation** (`lib.rs:236-242`: conservation sums across *all* asset types → can mint across assets; conserve **per `asset`**, or reject mixed-asset witnesses). Plus the note-commitment tree root in `ottochain` committed state (`pmt_verify` membership against it).
- **Unlocks:** production confidential transfers (single- and multi-asset). **Depends on:** P0.1. **Effort:** Medium. **Acceptance:** new circuit conformance vectors for the two fixed cases; a multi-asset transfer that mints across assets is rejected. **Risk:** circuit changes invalidate the SP1 VK → re-key + re-vector.

### P1 — client-side parity + the clean Kachina binding

#### P1.1 — Port the zk-verify opcodes to the TS evaluator
- **What:** implement `groth16_verify`, `smt_verify`, `mpt_verify` / `mpt_prefix_verify`, `bn254_add/mul/pairing`, `ecvrf_verify` in the TS JLVM (today only `poseidon`, `pmt_verify`, `schnorr_verify`, `bls_verify`, `bls_aggregate_verify`, `prove_dlog_verify`, `prove_dhtuple_verify`, `sigma_verify` are implemented; the rest decode but throw `"Unsupported operator"`).
- **Why competitive:** a TS wallet/browser cannot today *verify* a shielded or zk-jlvm proof locally — it must trust the chain. Aztec (PXE) and Zcash wallets verify client-side. This is required for a trustworthy light-client / wallet UX and for the semi-private tier's "verify before you pay" loop.
- **Where:** `metakit-sdk/packages/typescript/src/json-logic/evaluator.ts` (dispatch ~602-619) + new TS modules mirroring `crypto.rs` / the Scala `crypto/zk/*`. The hardest is `groth16_verify` (needs the BN254 pairing — port `bn254_*` first; use `@noble/curves` bn254 or a wasm of the Rust). 
- **Unlocks:** client-side proof verification → real wallet/light-client; closes the "TS has all zk opcodes" claim. **Effort:** Medium (impls exist in Rust+Scala; port byte-for-byte against the shared conformance vectors). **Acceptance:** the shared cross-language opcode vectors (`shared/zk_opcode_test_vectors.json`) pass in TS, incl. the real SP1-Groth16 fixture. **Risk:** BN254 pairing perf in JS — acceptable for verify (not proving).

#### P1.2 — `jlvm_pv_decode` opcode (decode SP1 public values on-chain)
- **What:** a small opcode that splits the SP1 `JlvmPublicValues` ABI blob (`bytes32 exprHash, bytes32 dataHash, bytes32 outputHash, bool ok`) into readable fields, so a JLVM guard can bind `exprHash == registry.logicHash` directly.
- **Why competitive:** this is the **Kachina "the proven rule is *this* public rule" guarantee**. Today `witness.publicValues` is an opaque blob (the guard passes it to `groth16_verify` but can't read `exprHash`), so a semi-private guard can only *trust* SDK-surfaced scalars (a trust gap). This opcode removes the gap and makes "prove a hidden value satisfies a *public, legible* rule" airtight — the headline semi-private property.
- **Where:** `metakit/.../json_logic/ops/CryptoOps.scala` (+ Rust/TS mirror in `jlvm-core/src/crypto.rs` / `crypto-ops.ts`); the blob layout is in `metakit-sdk/rust/zk-jlvm/lib/src/lib.rs`.
- **Unlocks:** trust-gap-free `exprHash == logicHash` binding (see `docs/design/semi-private-sdk-slice.md` §5B). **Effort:** **Small** — best value/effort ratio in this doc. **Acceptance:** a guard `{"==":[{"jlvm_pv_decode":[{"var":"witness.publicValues"}],"exprHash"}, "$logicHash"]}` (or equivalent) verifies. **Risk:** minimal.

### P2 — confidential values, auditability, scale

#### P2.1 — Viewing-key + note-encryption infrastructure
- **What:** encrypt shielded notes to the recipient (so they can discover their notes by trial-decryption) + a viewing-key hierarchy (FVK / IVK / OVK split) that **decrypts but cannot spend**.
- **Why competitive:** (a) **discovery** — without note encryption, a shielded recipient can't find their notes; (b) **auditability-with-privacy** — a holder hands an auditor a read-only key revealing amounts/parties without spend authority. This is the **regulator-aligned differentiator** Midnight (`disclose()`) and Penumbra/Zcash (FVK/IVK/OVK) have, and it fits OttoChain's "trust commons / receipts" ethos better than mandatory-privacy chains (Monero).
- **Where:** mostly **metakit-sdk** crypto (Rust + TS) — key derivation + note ciphertext format; the on-chain side only stores ciphertexts alongside commitments.
- **Unlocks:** usable shielded assets + selective disclosure (the PUBLIC/SEMI-PRIVATE/PRIVATE dial over one policy). **Depends on:** P0. **Effort:** Medium. **Acceptance:** recipient recovers notes via IVK; an FVK reveals amounts/parties but cannot produce a valid spend. **Risk:** key-hierarchy correctness is subtle — follow Zcash Sapling/Orchard or Penumbra exactly.

#### P2.2 — Range-proof primitive
- **What:** a range proof (`0 ≤ v < 2^n`) exposed to the JLVM — for confidential amounts **outside** the shielded-transfer circuit (a semi-private sealed bid/score, a confidential JLVM balance, a Pedersen-commitment amount).
- **Why competitive:** range is currently *only* structural u64 inside `zk-shielded`. A general confidential value in JLVM state has no range gadget, so a bare commitment is *less* safe than plaintext (wraparound mod the group order mints value). Penumbra/MASP/Zcash all have range proofs.
- **Where:** prefer a **transparent** primitive (Bulletproofs / IPA) implemented as an SP1 circuit verified via `groth16_verify`, OR a dedicated `range_verify` opcode — to **preserve the no-extra-ceremony posture** (do not add a second KZG ceremony). Circuit in `metakit-sdk/rust`, opcode in metakit.
- **Unlocks:** confidential amounts for the semi-private tier + general confidential balances. **Effort:** Medium-Large. **Acceptance:** a confidential-amount guard accepts in-range, rejects out-of-range, with no new trusted setup. **Risk:** a hand-rolled range proof is the SPL-class liability — use an audited construction; never ship a commitment without the range.

#### P2.3 — Proof recursion / aggregation
- **What:** aggregate N private transitions/transfers into **one** on-chain `groth16_verify` (SP1 recursion / proof folding / a batch verifier).
- **Why competitive:** each verify is 250k gas; without aggregation, throughput and cost don't scale. Aztec (rollup recursion) and Mina (recursive zk) are built on this. It is also the path to a private *rollup* tier.
- **Where:** **metakit-sdk** prover (SP1 supports recursion/compression); on-chain still one `groth16_verify` of the aggregate.
- **Unlocks:** scale + a batched/rollup settlement path. **Depends on:** P0 (something to batch). **Effort:** Large. **Acceptance:** K transfers verify on-chain at ~one verify's gas. **Risk:** recursion proving cost/latency; scope carefully.

### P3 — strategic / gates

- **P3.1 — External security audit** of the Σ CDS + strong-FS surface, the Groth16 verifier, and the shielded circuit. **Not a feature — a hard GATE**: no value-bearing privacy ships before it (the verifier is currently unaudited; flagged throughout `asset-model-zk-extension.md` and `asset-shielded-mode.md`). Schedule it to land *before* P0/P2 guard real value.
- **P3.2 — (optional) transparent general-proof option** (STARK / Halo2-IPA / Bulletproofs) alongside SP1-Groth16, to offer a *zero-ceremony* path for trust-maximalist deployments. Strategic, large; only if the one-universal-setup posture becomes a sticking point.
- **P3.3 — (optional) BLS12-381 path** for high-value asset policies — BN254 is ~100-bit (known pairing weakening). If Σ/Groth16 proofs gate large value, consider a stronger curve for that path. The parity plan already moved BLS to the eth2 SSWU ciphersuite; extend the reasoning.

---

## 4. Sequencing (fastest path to a Midnight-competitive private tier)

```
1. P1.2  jlvm_pv_decode          (small) ── makes the semi-private "prove the public rule" binding airtight
2. P1.1  TS verify opcodes       (med)   ── wallets/light-clients verify proofs locally
3. P3.1  AUDIT kickoff           (gate)  ── start early; it blocks everything value-bearing
4. P0.1  nullifier subsystem     (large) ─┐
   P0.2  harden+integrate shielded(med)  ─┴ the PRIVATE tier (unlinkable, sound, double-spend-safe)
5. P2.1  viewing keys + note enc (med)   ── discovery + auditability-with-privacy (the differentiator)
6. P2.2  range proof             (med-lg)── confidential amounts beyond the shielded circuit
7. P2.3  recursion/aggregation   (large) ── scale / private-rollup path
```

Steps 1–2 are quick wins that immediately strengthen the *semi-private* tier (which is buildable today on shipped crypto). Step 4 is the big competitive unlock (the private tier). Audit (3) runs in parallel and gates 4–6 going to real value.

---

## 5. Ethos & constraints to respect (do not violate)

- **Public by default, private by opt-in.** Privacy is a per-fiber / per-asset-policy flavor, never the base ledger (whitepaper v0.4 §6, three tiers).
- **Readable JLVM stays the contract language.** Do **not** add a DSL→circuit compiler. The `zk-jlvm` "prove the interpreter" approach is the moat — the same JSON-Logic runs in clear or in zk. (This is where you *beat* Midnight's Compact, not copy it.)
- **Prefer no / one universal trusted setup.** Σ has none; SP1-Groth16 has one universal ceremony. Don't introduce a per-circuit KZG. For new general proofs, prefer transparent (STARK/IPA/Bulletproofs).
- **Determinism is load-bearing.** Every commitment / nullifier / Fiat-Shamir preimage must round-trip **byte-for-byte across Scala / Rust / TS** through `canonicalize` (= `serializeJcs(dropNullFields)`, metakit 1.8.x). A divergence is the opaque `InvalidSignature`/false-verify class. Add cross-language KAT vectors for every new preimage.
- **Combiner-only stateful checks.** Nullifier non-membership (and any lineage read) MUST be in the combiner, never at L1 block-validity (TOCTOU block-poisoning; CLAUDE.md #3).
- **Never hand-roll a proof system or Fiat-Shamir transcript** (the June-2025 SPL ZK-ElGamal break is the cautionary tale). Reuse one audited deterministic verifier.
- **Σ `or`/threshold must route through `sigma_verify`** (CDS), never JLVM `or`/`some` over standalone leaves (cryptographically unsound — documented in `CryptoOps.scala`).
- **Gas + growth realism.** `groth16_verify` = 250k gas; `poseidon` arity ≤ 4; nullifier sets are unbounded (the P0.1 research weight).

---

## 6. What NOT to do (from `zk-coin-audit.md`)

- No second VM or second cryptographic stack (no Plonkish/Halo2/Cairo *engine*, no native Ergo sigma/ring idiom beyond the existing opcodes).
- No Midnight Compact compiler / compile-time information-flow as the contract model — `zk-jlvm` replaces it.
- No Penumbra validator-DKG flow-encryption DEX (heavyweight validator crypto a combiner-deterministic metagraph can't host).
- No in-VM homomorphic-commitment amounts *without* a range proof (P2.2) — unsafe.
- No unlinkable `Mix`/coinjoin morphism — unlinkability comes from the P0 nullifier construction, not a mixer.

---

## 7. Files to read first

**metakit (Scala on-chain):**
- `src/main/scala/io/constellationnetwork/metagraph_sdk/json_logic/ops/CryptoOps.scala` — the zk opcode surface (extend here for `jlvm_pv_decode`, `range_verify`).
- `src/main/scala/.../crypto/zk/Sp1Groth16Verifier.scala`, `Groth16Verifier.scala`, `Bn254.scala`, `poseidon/Poseidon.scala`, `merkle/PoseidonMerkleTree.scala`.
- `src/main/scala/.../json_logic/gas/{JsonLogicGasEstimator,GasMetering}.scala` — gas for new opcodes.

**metakit-sdk (Rust + TS):**
- `rust/zk-jlvm/{program,script,lib}/src` — the arbitrary-JLVM prover (and the `JlvmPublicValues` ABI layout in `lib/src/lib.rs`).
- `rust/zk-shielded/lib/src/lib.rs` — the shielded circuit + the **two soundness TODOs** (`:212-217`, `:236-242`).
- `rust/jlvm-core/src/crypto.rs` + `packages/typescript/src/json-logic/{evaluator.ts,crypto-ops.ts,poseidon.ts,hex-bytes.ts}` — the opcode impls to **port to TS** (P1.1).
- `docs/jlvm-parity-plan.md` + `shared/zk_opcode_test_vectors.json` — the cross-language conformance discipline; every new opcode needs vectors here.

**ottochain (on-chain state + the design proposals):**
- `docs/proposals/asset-shielded-mode.md` — **the spec for P0** (nullifier set, `ShieldedSpend`, note-commitment tree, viewing keys, bounded growth). Start here for P0.
- `docs/proposals/asset-model-zk-extension.md` — the reconciled zk roadmap (shipped vs proposed vs declined).
- `docs/proposals/zk-coin-audit.md` — the external survey + the "what not to do" line.
- `docs/whitepaper/ottochain-whitepaper-v0.4.md` §6 — the three-tier vision.
- `modules/models/src/main/scala/xyz/kd5ujc/schema/CalculatedState.scala` (`committedView`) + `modules/shared-data/.../lifecycle/combine/AssetCombiner.scala` (the `witness` context + combiner) + `Updates.scala` (add `ShieldedSpend`).

**This session's design docs (in `ottochain-sdk/docs/design/`):**
- `client-side-private-data.md` — the three-tier model + the determinism binding (§3.0).
- `semi-private-sdk-slice.md` — the `@ottochain/sdk/zk` client slice; §5B motivates `jlvm_pv_decode`; §7 lists the TS-verify gap.
- `private-off-chain-fibers.md` — the broader competitive landscape (v1).

---

## 8. One-paragraph TL;DR for the implementer

OttoChain already has the hard part — proving arbitrary private JLVM transitions in a zkVM (Midnight-class), verified by a native Groth16 with a single universal setup. The competitive gaps are subsystems, not capability: ship **`jlvm_pv_decode`** (small, makes the semi-private "prove the public rule" binding airtight) and **port the zk-verify opcodes to TS** (wallets verify locally) first; then build the **on-chain nullifier subsystem with bounded growth** + **harden the shielded circuit's two soundness TODOs** (this is the big unlock — the unlinkable, sound, double-spend-safe PRIVATE tier); then add **viewing keys + note encryption** (discovery + the regulator-aligned auditability differentiator), and finally **range proofs** and **proof aggregation** for confidential-value depth and scale. Keep JLVM readable (no DSL→circuit), prefer no/one-universal trusted setup, keep all new preimages byte-for-byte across Scala/Rust/TS, and gate every value-bearing step on an external audit of the verifier surface.
