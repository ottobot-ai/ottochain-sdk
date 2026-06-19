# Client-Side Private Data on OttoChain — Public by Default, Private by Opt-In

*The three-tier disclosure model (public / semi-private / private) over one readable JLVM fiber, with zero-knowledge as the dial.*

Status: design. Grounded in OttoChain whitepaper v0.4 §6, and in shipped machinery across `metakit-sdk` and `ottochain`. This document **reopens** the previously-declined "client-held private state / client-side-proven logic" path; those declines were feasibility-scoped, and the feasibility has changed.

> **Superseded-by-implementation (2026-06-19).** The semi-private tier (§3.1) has since shipped as the
> `@ottochain/sdk/zk` slice (`src/zk/`); the worked design-of-record is `docs/design/zk-loan-app.md` +
> the shipped `src/zk/guard.ts`. The on-chain guard snippets in §3.1–§3.3 below were written before that
> code landed and carried two errors, **now reconciled to the shipped guard**:
> 1. `groth16_verify` arg order is **`[vkey, publicValues, proof]`** (not `[proof, publicValues, vkey]`).
> 2. `publicValues` is an opaque `0x` + 256-hex blob (`exprHash | dataHash | outputHash | ok`), **not** a
>    readable JSON object — word `w` is read with `cat("0x", substr(publicValues, 64·w + 2, 64))`
>    (`w`: 0=exprHash, 1=dataHash, 2=outputHash, 3=ok; the `ok` bit is the final hex pair of word 3 == `"01"`).
>
> Kept as a design reference for the three-tier model and the still-unbuilt private tier (§3.2).

---

## 1. Thesis

OttoChain should be **public by default and private by opt-in**. A developer publishes one readable JLVM fiber — states, transitions, JLVM guards and effects — and chooses, *per field and per transition*, how much of the data inside it is revealed versus proven. Nothing about the contract changes across disclosure levels; the bytes of the rules are identical and hash-bound in the registry. What changes is only **what the event carries** and **what the guard checks**.

The whitepaper v0.4 §6 ("A Web of Chains: Public, Semi-Private, Private") states the target directly:

> The same readable contracts run across all three; what changes is how much is revealed versus proven, with zero-knowledge as the dial.

This document makes that literal. The three tiers are not three contracts and not three runtimes — they are **three disclosure settings on the same registered `StateMachineDefinition`**:

| Tier | Governing rules | The sensitive value | What settles on-chain | ZK |
|---|---|---|---|---|
| **Public** | readable, on-chain | plaintext, on-chain | the value itself | none |
| **Semi-private** | readable, on-chain | client-held; a commitment is published, the predicate over it is proven | commitment + proof (consumed in the guard) | verify only |
| **Private** | readable, on-chain | client-held; never published | a commitment-root advance + a nullifier; full state stays on the client | verify only |

### Reopening the declines

Earlier asset proposals **declined** client-held private state / client-side-proven logic. Read the declines carefully: they were *feasibility*-scoped. They assumed OttoChain could verify proofs of *fixed* circuits (a shielded transfer) but could not let a client run **arbitrary private contract logic** and prove it — which is exactly what a Kachina/Midnight-style private contract requires.

That premise is now false. `metakit-sdk/rust/zk-jlvm` is a real SP1 zkVM guest that runs the **byte-compatible Rust JLVM** (`jlvm_core::evaluate_to_canonical`, the same evaluator the chain runs, held to shared cross-language vectors) **inside** the zkVM, with the expression **and** the data as **private** witness, and commits four public values: `keccak256(expr)`, `keccak256(data)`, `keccak256(canonical output)`, and `ok`. The statement it proves is: *"this readable JLVM rule, on data I will not show you, produced this output."* One guest ELF, one universal SP1 setup, one fixed `VK_ROOT`, verifiable anywhere via the `groth16_verify` opcode.

That **is** client-side-proven logic of the Kachina/Midnight class. The decline was correct for its era and is now superseded by shipped code. The remaining honest scoping is **operational** — prover cost and latency, two known circuit soundness TODOs, a missing on-chain nullifier subsystem, a determinism unification, and an audit — **not** a feasibility wall. The rest of this document treats the declines as open questions and assesses each tier on the machinery that actually exists today.

---

## 2. The substrate that already exists

Everything the three tiers need is, with two named exceptions, already shipped. The exceptions are an SDK orchestration layer (this design) and an on-chain nullifier subsystem (a prerequisite for the private tier only).

**Client-side pre-execution.** The TS JLVM (`metakit-sdk/packages/typescript/src/json-logic`, `jsonLogic.apply` / `evaluateWithGas`) runs byte-for-byte with the Rust and Scala evaluators. A client computes the exact next state and the exact gas the chain will charge — including `groth16_verify` at 250k — *before* submitting. This is the whitepaper's "client-side pre-execution," and it is the basis of the "chain proposes, client checks" loop.

**ZK verify opcodes (TS too — with one gap).** The TS evaluator implements `poseidon`, `pmt_verify`, `schnorr_verify`, `bls_verify`, and `bls_aggregate_verify` (`crypto-ops.ts`). It also ships Poseidon over BN254 Fr (`poseidon.ts`: `poseidonHash`, `poseidonCompress`, `merkleComputeRoot`, `merkleVerifyInclusion`) with **exactly** the field orders the shielded circuit fixes. So a browser client can **build** commitments and **verify** Poseidon-Merkle / Schnorr / BLS today. The **gap**: `groth16_verify` (and `smt_verify`, `mpt_verify`, `bn254_*`, `ecvrf_verify`) are *decodable* but **not implemented** in the TS evaluator — they "fall through to the default error" (`evaluator.ts:600-619`, `"Unsupported operator: ..."`). Groth16 verification today is **Rust + Scala only**. The whitepaper's "TS has all ZK verify opcodes" is aspirational for the Groth16/SMT/MPT subset.

**zk-jlvm — prove arbitrary JLVM.** `zk-jlvm/program/src/main.rs` (above). Generation is Rust/SP1 (CPU default, `SP1_PROVER=cuda` option); verification is the universal `groth16_verify`.

**`groth16_verify` — one universal setup.** SP1-Groth16-BN254, **one** trusted setup performed once on the fixed SP1 STARK-verifier circuit, a single hardcoded `VK_ROOT`, 250k gas (the heaviest opcode, under the 1M default budget). The key architectural fact: SP1's verifier takes the **program vkey as a runtime argument** — one deployed verifier validates proofs from *any* guest. Adding a new circuit needs **zero** new trusted setup and **zero** new verification key. Both zk-jlvm and zk-shielded proofs verify through this same path.

**Committed-state roots + state-proofs.** `CalculatedState` is projected into a committed MPT dictionary whose `combinedHash` becomes the snapshot's `calculatedStateProof`. `/state-machines|scripts|assets/{id}/state-proof` returns the record, the committed root, the ordinal, and a Merkle-Patricia inclusion proof a light client checks against the consensus-signed root. This is the "off-chain state, on-chain root, prove a field" pattern (Mina's shape), already present.

**The shielded circuit.** `zk-shielded/lib/src/lib.rs`: Sapling/Orchard-style Poseidon notes `{value:u64, owner, asset, rho}`; `cm = Poseidon([value, owner, asset, rho])`; `nf = Poseidon([rho, nsk])`; `owner = Poseidon([nsk])`. `verify_transfer` enforces Merkle membership under a public anchor, nullifier derivation, authorization (knows `nsk`), value conservation `sum(in) == sum(out) + fee`, and `u64` range **structurally in-circuit**. Public values `{anchor, nullifiers[], outputCms[], fee}` settle on-chain via `groth16_verify`.

**The witness-gated morphism (PR #166).** Guards and effects are JLVM that can call ZK verify opcodes and read a reserved `witness` context key (`Updates.scala`). A guard that calls `groth16_verify` / `pmt_verify` over `{"var":"witness.proof"}` **is** the on-chain settlement hook for both the semi-private and private tiers. No new consensus surface is required.

### What each tier needs vs. what's present

| Capability | Public | Semi-private | Private | Status |
|---|:--:|:--:|:--:|---|
| Readable metered JLVM + receipts | ✔ req | ✔ req | ✔ req | **shipped** |
| Committed-state MPT root + `/state-proof` | ✔ req | ✔ req | ✔ req | **shipped** |
| Client-side pre-execution (TS/Rust) | ✔ | ✔ req | ✔ req | **shipped** |
| Poseidon commitments (TS build) | — | ✔ req | ✔ req | **shipped** |
| `groth16_verify` on-chain (Rust/Scala) | — | ✔ req | ✔ req | **shipped** |
| `groth16_verify` in TS (client verify) | — | nice | nice | **gap — port needed** |
| witness-gated guard (PR #166) | — | ✔ req | ✔ req | **shipped** |
| zk-jlvm (prove arbitrary private logic) | — | ✔ req | ✔ req | **shipped** |
| zk-shielded (notes/nullifiers/range) | — | ✔ (value tier) | ✔ (value tier) | **shipped, 2 TODOs** |
| One canonical preimage (sign == prove) | — | ✔ req | ✔ req | **gap — unify needed** |
| On-chain nullifier set (double-spend) | — | — | ✔ req | **absent — build needed** |
| SDK `private` orchestration layer | — | ✔ req | ✔ req | **this design** |

The takeaway: **public ships now**; **semi-private (commit/reveal + gated morphism) ships now** with a thin SDK layer plus the one-canonical-path fix; **private** is provable today but not yet *safely settle-able* until the nullifier subsystem and the two circuit fixes land.

---

## 3. The three tiers, concretely

### The spectrum model

Publish the fiber's `states`, `transitions`, JLVM `guards`/`effects` **once**; the chain hash-binds the logic on creation. A per-field disclosure setting selects how each sensitive value is carried. The **settlement object** is uniform across tiers:

```
{ commitment, nullifier?, proof?, publicTranscript }
```

The `publicTranscript` is the set of values the on-chain guard re-binds: for zk-jlvm `{exprHash, dataHash, outputHash, ok}`; for shielded `{anchor, nullifiers[], outputCms[], fee}`. Because `exprHash` binds the rule and equals the registry logic-hash preimage, an outsider replaying the public transcript sees **which readable rule was proven** without seeing the data. `exprHash == registry logic-hash` is the trust anchor of the whole scheme.

### 3.0 The determinism binding (read this first — it is the dominant failure source)

Every commitment / nullifier / proof preimage MUST be the **identical byte string** on the client and on-chain. There are two canonicalization rules in play, and **today they do not coincide**:

1. **Signing** is `JCS(dropNulls(payload))` RFC 8785 (`src/signing.ts`, `src/ottochain/drop-nulls.ts`). `dropNulls` removes `null` object fields recursively but **preserves** `false`/`0`/`{}`/`[]` and **preserves array nulls** (index positions). The chain re-fills omitted *defaulted required* fields, so a payload that omits such a field diverges → the opaque empty-body **`InvalidSignature`** 400.

2. **zk-jlvm** does **not** dropNulls and does **not** canonicalize its *inputs*. The guest computes `keccak256(expr_json.as_bytes())` and `keccak256(data_json.as_bytes())` over **the raw bytes the prover sent**, and only the **output** goes through `canonical::canonicalize` (RFC 8785, correctly no-dropNulls, since the output is a JLVM `Value`, not a signed payload).

**The consequence is the sharpest honest finding in this design:** a commitment bound by zk-jlvm (raw-bytes keccak) and a signature bound by the chain (`JCS ∘ dropNulls`) are computed over **different bytes**. Any client that builds a private payload, signs it, and *also* proves over it will silently bind two different things → the opaque `InvalidSignature` / false-verify class, with no useful error.

**The fix — one shared canonical path, now provided by metakit.** As of **metakit-sdk `1.8.x`**, its exported `canonicalize` already drops null object-fields internally (`serializeJcs(dropNullFields(x))`, server-aligned) and `signDataUpdate` signs over it — so the single canonical step is just metakit's `canonicalize(x)`, shared by the signer and the prover feed:

```
preimage(x) = keccak256( canonicalize(x) )     // canonicalize = metakit-sdk's JCS ∘ dropNullFields
```

is the **single** preimage behind both the signature (sha256 over the canonical, + Constellation prefix) and the proof (keccak256 over the canonical) — they bind the **same canonical string**. It must land **before** any semi-private or private use. For value fields that must be range-/arithmetic-checked, the commitment is instead `Poseidon(fieldFr, salt)` over the fixed Fr encoding (`hex-bytes.ts encodeFr`, matching `fr_to_bytes32`); the same single-source discipline applies.

```ts
// SDK prover glue — ONE canonical path, the SAME function signing uses.
import { canonicalize } from '@constellation-network/metagraph-sdk'; // metakit-sdk 1.8.x: drops nulls internally
const proverPreimage = (x: unknown) => keccak256(utf8(canonicalize(x)));
// commitment = proverPreimage(data);  signature also binds canonicalize(payload)
```

> **Version note:** the SDK currently pins metagraph-sdk `^0.2.0`, whose `signDataUpdate` signs the payload as-is — so `src/signing.ts` applies `dropNulls` by hand (and on 0.2.0 `proverPreimage` must too: `keccak256(canonicalize(dropNulls(x)))`). On the bump to `1.8.x`, drop the manual `dropNulls` here and in `signing.ts`; metakit does it. (`1.8.x` is not yet published — npm/crates latest is `0.2.0`.)

CRITICAL nuance from `docs/signing-and-publishing.md`: because the chain re-fills omitted *defaulted required* fields, the private-data SDK types must make those fields **required** (e.g. `repeated: boolean`, not `repeated?: boolean`) exactly as the signing types already do — a commitment over a payload that omits a chain-required defaulted field will not match the chain's recomputed preimage.

---

### 3.1 Semi-private — public rules, shielded values

**On-chain:** a 32-byte commitment in fiber state + the proof consumed transiently in the guard. **Client-held:** the value and its salt. **Proven:** that the hidden value satisfies the public rule and opens to the published commitment.

**Worked example — sealed-bid auction / private score.** Rules are public and readable; the bid (or score) is shielded. (`src/apps/markets/state-machines/market-auction.ts` already ships commit/reveal scaffolding to slot into.)

*Bid phase.* The bidder pre-executes the published bid-validity rule locally (TS JLVM), produces `cm = poseidon([bidFr, saltFr])`, and generates a zk-jlvm proof attesting `exprHash == registry logic-hash`, `dataHash` (kept private), `outputHash == keccak(canonical true)`, `ok == true`. The event carries `{commitment, proof, publicValues}` under the `witness` key. The on-chain guard is plain readable JLVM:

```jsonc
{ "from":"OPEN", "to":"BID_RECORDED", "eventName":"submitBid",
  "guard": { "and": [
    { "groth16_verify": [ {"var":"$VK_ROOT"}, {"var":"witness.publicValues"}, {"var":"witness.proof"} ] },
    { "==": [ { "cat": ["0x", {"substr":[{"var":"witness.publicValues"}, 2, 64]}] },   {"var":"$selfLogicHash"} ] },
    { "==": [ { "cat": ["0x", {"substr":[{"var":"witness.publicValues"}, 130, 64]}] }, {"var":"$keccakTrue"}    ] },
    { "==": [ {"substr":[{"var":"witness.publicValues"}, 256, 2]}, "01" ] } ] },
  "effect": { "merge": [ {"var":"state"},
    { "bids": { "append": [ {"var":"state.bids"}, {"var":"event.commitment"} ] } } ] } }
```

*Reveal/settle.* The winner reveals `(bid, salt)`; the guard recomputes `poseidon([bidFr, saltFr])` and checks equality with the stored commitment, then the max-bid comparison runs in the clear over revealed winners only:

```jsonc
{ "from":"REVEALED", "to":"SETTLED", "eventName":"reveal",
  "guard": { "==": [ {"poseidon":[{"var":"event.bidFr"},{"var":"event.saltFr"}]},
                     {"var":"state.winningCommitment"} ] } }
```

**The honest limit on this tier.** zk-jlvm proves an **opaque keccak triple** — only `exprHash` is public, so a rule like *"bid ≥ minBid"* cannot constrain the hidden value unless the bound is itself bound into the proof. Two correct constructions:

- **(a) Pin the predicate into the expression** (buildable now, recommended). Publish a JLVM rule whose only free variable is the secret, with the bound as a literal, so the bound is baked into `exprHash`:
  ```ts
  const RULE = { ">=": [ {"var":"amount"}, MIN_BID ] };   // MIN_BID literal → baked into exprHash
  // proof.ok==true AND proof.exprHash==keccak(canon(RULE))  ⇒  "hidden amount ≥ MIN_BID", value unrevealed
  ```
  The SDK keeps an `exprHash` registry mapping published rules → `exprHash` so a semi-private guard binds a hidden value to a public, legible rule. This keeps the whitepaper's "same readable contract" promise honest.
- **(b) Add public-input fields to the guest** (new work). Surface the bound (e.g. `minBid`) as a public input the verifier checks. The shielded circuit already does the analogue correctly for value (in-circuit `u64` range).

For confidential **value** specifically, prefer the dedicated shielded circuit (§3.3), whose in-circuit range and conservation already give value semantics.

---

### 3.2 Private — full state client-held

**On-chain:** nothing substantive — only the committed state root advances and a nullifier is consumed per transition (a UTXO-of-state / Kachina shape). **Client-held:** the entire `StateMachineDefinition` state `S_n`. **Proven:** that the published transition logic, run on the private prior state and event, produced the new committed state, and that the consumed prior commitment is a member of the committed root and its nullifier is fresh.

To transition: the client runs the readable transition locally (Rust/TS JLVM) to get `S_{n+1}`; builds a zk-jlvm proof that `{expr = transition logic, data = {prevState: S_n, event, witness}}` evaluated to canonical `S_{n+1}` with `ok == true`. The settlement object is `{newCommitment, nullifier = poseidon([rho_n, nsk]), proof, publicValues}`. The on-chain transition is a thin **universal "advance"** whose bytes are identical for every private fiber:

```jsonc
{ "from":"ACTIVE", "to":"ACTIVE", "eventName":"advance",
  "guard": { "and": [
    { "groth16_verify": [ {"var":"$VK_ROOT"}, {"var":"witness.publicValues"}, {"var":"witness.proof"} ] },
    { "==": [ { "cat": ["0x", {"substr":[{"var":"witness.publicValues"}, 2, 64]}] },   {"var":"state.logicHash"} ] },
    { "==": [ {"substr":[{"var":"witness.publicValues"}, 256, 2]}, "01" ] },
    { "==": [ { "cat": ["0x", {"substr":[{"var":"witness.publicValues"}, 130, 64]}] }, {"var":"event.newCommitment"} ] },
    { "mpt_verify": [ {"var":"event.prevCommitment"}, {"var":"event.merkleProof"}, {"var":"state.stateRoot"} ] },
    { "not": [ { "in": [ {"var":"event.nullifier"}, {"var":"state.nullifierSet"} ] } ] } ] },
  "effect": { "merge": [ {"var":"state"}, {
    "nullifierSet": { "append": [ {"var":"state.nullifierSet"}, {"var":"event.nullifier"} ] },
    "stateRoot":    {"var":"event.newStateRoot"} } ] } }
```

An outsider sees only: a valid proof against the **public** rule, a fresh nullifier, a new root. Existence and ordering of the interaction are provable; content is not. State-proof endpoints let the holder later prove a specific field of `S_n` to a third party without revealing the rest.

> Two on-chain pieces this guard *assumes* are **not yet built**: a committed, append-only **nullifier set** (the `{"in": [..., "state.nullifierSet"]}` check and the `append` effect), and an **anchor/commitment-tree history**. `grep nullifier` over `ottochain/modules` returns **zero** hits today. The circuit *reveals* nullifiers; nothing on-chain *consumes* them — so a valid proof is currently **replayable**. The private tier is **provable but not yet safely settle-able** until this lands. The TS `mpt_verify` in the guard is also part of the §2 TS gap (verified Rust/Scala-side today).

---

### 3.3 The asset mapping

Assets map onto the same three settings using the shipped shielded circuit for the value tiers.

- **Public asset.** Balances are plaintext fiber state; transfers are ordinary readable JLVM effects. Anyone replays. No ZK.
- **Semi-private (shielded-value) asset.** This **is** the zk-shielded circuit. A transfer proof attests membership under the public anchor, authorization, nullifier derivation, conservation `sum(in)=sum(out)+fee`, and `u64` range. Amounts and parties stay hidden; only the transparent **fee** and the nullifier/commitment set are public — "public rules, shielded data" for value.

  ```jsonc
  // publicValues = { anchor, nullifiers:[nf0..], outputCms:[cm0..], fee }
  { "from":"LIVE", "to":"LIVE", "eventName":"shieldedTransfer",
    "guard": { "and": [
      { "groth16_verify": [ {"var":"$SHIELDED_VK_ROOT"}, {"var":"witness.publicValues"}, {"var":"witness.proof"} ] },
      { "==": [ { "cat": ["0x", {"substr":[{"var":"witness.publicValues"}, 2, 64]}] }, {"var":"state.anchor"} ] },
      // nullifiers[]/outputCms[] are the shielded circuit's variable-length PV words, decoded by the
      // shielded policy's own word layout (NOT the fixed 4-word zk-jlvm layout above) — shown illustratively:
      { "all": [ {"var":"witness.publicValues.nullifiers"},
                 { "not": [ { "in": [ {"var":""}, {"var":"state.nullifierSet"} ] } ] } ] } ] },
    "effect": { /* append nullifiers, insert outputCms into the tree, advance anchor */ } }
  ```

- **Private (client-held) asset.** The holder keeps the note set entirely client-side; on-chain only the commitment-tree root and consumed nullifiers advance, so even the count/anchoring of holdings is private beyond the global root — the §3.2 "advance" pattern with the shielded circuit as the proving primitive.

Disclosing a balance to an auditor uses the **viewing-key** path (§5), not a note reveal.

---

## 4. Comparison — how OttoChain differs

Every leading private-contract system already runs the contract on the client, keeps private inputs/state on the client, and settles only commitments + a proof on-chain — exactly the §6 shape. OttoChain's defining divergence is **what it proves**.

| System | Private logic compiled to… | Per-contract circuit? | Per-contract trusted setup / VK? | Client model |
|---|---|:--:|:--:|---|
| **Midnight** | Compact/Minokawa → circuit | yes | yes | proof server per contract |
| **Aztec** | Noir → ACIR / private-kernel | yes | recursive kernels | **PXE**: client simulate → prove |
| **Aleo** | Leo → snarkVM R1CS | yes | yes | offline records; local or delegated prove |
| **Mina** | o1js → Kimchi | yes | yes | in-browser SNARK; off-chain state + on-chain root |
| **OttoChain** | **nothing — proves the JLVM *interpreter* in a zkVM** | **no** | **no (one universal `VK_ROOT`)** | TS pre-exec → Rust/SP1 prove → verify anywhere |

**The crux.** Midnight/Aztec/Aleo/Mina each compile a high-level DSL to a bespoke circuit; that compiler is the single largest, most security-critical, hardest-to-audit component in all four (Aleo's synthesizer was independently audited precisely because a miscompile breaks soundness). OttoChain **skips that entire pipeline**. `zk-jlvm` runs the *real* `jlvm-core` interpreter inside SP1 over arbitrary `(expr, data)`. **One** guest ELF, **one** SP1 setup, **one** fixed `VK_ROOT` proves **any** JLVM program. Adding a contract requires **zero** new circuit, setup, or VK — you ship new readable JLVM. The cost is per-proof zkVM cycles (interpretation overhead) traded against a circuit's tighter constraints; the win is that the thing being proved is **byte-for-byte the same interpreter the public chain replays**, so there is **no compile-time soundness gap between tiers**, and the *same readable contract* runs across all three.

**What to borrow** (and skip):

- **Kachina** (Kerber–Kiayias–Kohlweiss) is OttoChain's exact formal ancestor — public state + per-user private state + a transition over state *oracles* + a public-transcript / private-transcript split + **author-declared leakage** + a NIZK. OttoChain's readable JLVM transition + public/shielded split + zk-jlvm proof *is* a Kachina instantiation; it is the only UC-proven framework of the five. **Borrow its model as the stated security model.** (One caveat below: OttoChain does **not** need Kachina's replayable public *transcript*.)
- **Midnight's `disclose()`** — witness data is private *by default*, and a compile-time taint tracker **halts** unless the developer explicitly wraps a value that flows to the public ledger in `disclose()`. **Borrow this exact ergonomic** at the SDK layer (a `reveal()` with a TS taint-check that refuses to sign if an undisclosed witness flows into the public delta). Skip the language and the proof-server-per-contract model. *Accidental disclosure is the default failure mode without it — "private-by-opt-in" silently degrades to "public."*
- **Aztec's PXE** — client-side simulate, then prove, private inputs never leave the client; **notes + nullifiers**. OttoChain's PXE-equivalent is TS pre-exec → zk-jlvm/zk-shielded prove → submit; the note/nullifier primitive is **already half-built** in `zk-shielded`. Skip the recursive private-kernel machinery for v1 (a single zk-jlvm + single shielded proof cover the common cases).
- **Aleo's** offline records and **explicit local-vs-delegated proving** — OttoChain's prover is Rust/SP1 (heavy for a browser), so the SDK must offer "prove locally / delegate to a self-hosted prover" as a first-class, honestly-documented trade (delegation leaks the witness unless blinded). `groth16_verify` runs in Rust/Scala (and TS once ported), so a delegated proof is verifiable everywhere.
- **Mina's** off-chain state + on-chain Merkle root — OttoChain already has committed MPT roots + state-proof endpoints, and **improves** on Mina by not needing a per-zkApp circuit to prove the root update (the universal interpreter proof does it).

**Why no Kachina-style public transcript.** Each proof's public values already pin `(exprHash, dataHash/commitment, outputHash, ok)`, and the chain commits state behind an authenticated MPT root with field-level state-proofs (§4.4). Ordering and double-spend protection come from the **nullifier set** (once built) + **state-inclusion**, not from a replayable transcript. Adding a transcript layer would **re-leak** exactly the timing/shape the tiers exist to hide. The proof + committed root + nullifier set **subsume** the transcript.

---

## 5. The ottochain-sdk client surface

Ship a new opt-in subpath **`@ottochain/sdk/private`** (alongside the existing `.`, `./core`, `./metakit`, `./apps/*`) so the public-by-default surface is untouched and private features are tree-shakeable. **The client *is* the SDK**: TS holds the private state, pre-executes, builds commitments/nullifiers, drives the Rust prover over a subprocess/local-service boundary (TS cannot *generate* SP1 proofs but can verify Poseidon/Merkle/pmt today), assembles the settlement tx through the canonical signer, and verifies / selectively-discloses locally.

Tiers 1–2 need **no new chain endpoints**; tier 3 needs the chain's nullifier-set + commitment-tree update handler.

**Modules.**

- **`commitments`** — the *only* place that encodes Fr / notes / nullifiers. Import metakit `poseidonHash` / `merkleComputeRoot` / `encodeFr` directly; **never** reimplement Poseidon. Pin the shielded circuit's exact field orders:
  ```ts
  import { poseidonHash, merkleComputeRoot } from '@ottochain/sdk/metakit';
  export const ownerFromNsk   = (nsk: bigint) => poseidonHash([nsk]);                       // owner = Poseidon([nsk])
  export const noteCommitment = (n: Note)     => poseidonHash([BigInt(n.value), n.owner, n.asset, n.rho]); // cm
  export const nullifier      = (rho: bigint, nsk: bigint) => poseidonHash([rho, nsk]);     // nf = Poseidon([rho, nsk])
  export const anchorOf       = (cm: bigint, pos: bigint, sibs: bigint[]) => merkleComputeRoot(cm, pos, sibs);
  ```
- **`PrivateStore`** — client-held state as the system of record, keyed by fiberId: cleartext JLVM state, per-note openings `(value, owner, asset, rho, nsk)`, and the Merkle-witness cache. AEAD at rest (WebCrypto AES-GCM / XChaCha20-Poly1305) under an HKDF key from the wallet seed. Pluggable backends: in-memory, file (Node), IndexedDB (browser). A pure `commit()` recomputes the on-chain commitment from cleartext over the **§3.0 single canonical preimage**, so the chain only ever sees roots/hashes.
- **`prover`** driver — TS orchestrates the Rust SP1 prover; **TS never generates proofs**. Two drivers, picked by environment:
  - `SubprocessProver` (Node/desktop): spawns the existing `zk-jlvm/script` / `zk-shielded/script` binary `--mode groth16`, writes the witness as the wire JSON those scripts accept, reads back `{publicValues, proof, vkey}`. The witness never leaves the trust boundary.
  - `ServiceProver` (browser/mobile): POSTs the witness to a **self-hosted** prover daemon (same binary behind an HTTP shim). Document this as a **privacy boundary you run yourself**, never a shared third party — the witness contains the secrets.
  ```ts
  interface Prover {
    proveJlvm(expr: string, data: string): Promise<Groth16Bundle>;   // zk-jlvm
    proveShielded(w: WireWitness): Promise<Groth16Bundle>;           // zk-shielded
  }
  interface Groth16Bundle { publicValues: `0x${string}`; proof: `0x${string}`; vkey: `0x${string}`; }
  ```
- **`settlement`** — reuse the existing tx path. The proof + public values + revealed transcript ride inside the transition `payload`, and the whole message is signed with `signTransaction` (which already does `dropNulls` then RFC 8785). For shielded, the payload mirrors `ShieldedTransferPublicValues` field-for-field. **Determinism:** lowercase hex, no explicit object nulls, Fr/bytes32 matching `fr_to_bytes32`. **Defensive:** dedup nullifiers client-side and **reject mixed-asset witnesses** until the circuit closes its TODOs.
- **`disclosure`** — viewing keys + selective disclosure (§ below).
- **`OttoPrivate`** facade — composes `MetagraphClient` (`/data-application/v1/onchain`, `/checkpoint`, `/state-machines/:id`, `/scripts/:id`) to fetch the current anchor for Merkle witnesses, confirm settlement, and check nullifier-set membership. Owns the prover driver, the store, and the signer, so the per-tier helpers stay one-liners.

**The per-tier developer flow** funnels all three through the same signing/submit tail — which is exactly what makes "one contract, three disclosure levels" real:

```ts
const sdk = new OttoPrivate({ node, signer, store, prover });
await sdk.publicTransition (fiberId, 'bid', { amount: 100 });                                   // tier 1: no prover
await sdk.provenTransition (fiberId, 'bid', { reveal: { above: 50 }, secret: { amount: 100 } }); // tier 2: zk-jlvm
await sdk.shieldedTransition(fiberId, { spend: [noteA], create: [noteB], fee: 5n });             // tier 3: zk-shielded
// pre-execution is gas-accurate (includes groth16_verify = 250k) BEFORE paying:
sdk.preExecute(guardExpr, fullData);   // evaluateWithGas
```

**Client-side verification.** Available **now** in TS: `merkleVerifyInclusion` (anchor membership), `poseidonHash` (recompute cm/nf), `pmt_verify`, schnorr/sigma. The **one gap**: `groth16_verify` is decodable + gas-priced (250k) but **not implemented** in the TS evaluator — so a thin client today pre-verifies Merkle/Poseidon/transcript facts but **cannot verify the SNARK itself**; it relies on the chain for the Groth16 check. **Recommendation:** port `groth16_verify` to the TS evaluator — the BN254 G1 arithmetic + `bn254_pairing` it needs already exist in `crypto-ops`/`hex-bytes` — to complete the "chain proposes, client checks" guarantee for the private tiers and to enable peer-to-peer / offline selective-disclosure receipts. This is a self-contained addable opcode, not chain machinery.

**Viewing keys + selective disclosure.** The dial is a layer *on top* of the commitments, inheriting the determinism binding for free.

- **Selective field disclosure.** Because every shielded field is committed as `keccak(JCS(dropNulls(field)))` or `Poseidon(fieldFr, salt)`, a holder reveals exactly one field by handing its `(value, salt)` preimage to a counterparty, who recomputes the hash and checks equality against the on-chain commitment via the **same** readable JLVM opcode the guard used. No new trusted path.
- **Viewing keys (FVK/IVK/OVK).** Reuse the Poseidon `nsk` hierarchy the shielded circuit already defines (`owner = Poseidon([nsk])`). Derive an **incoming** viewing key (IVK) and **outgoing** viewing key (OVK) as further Poseidon images of `nsk`, so an auditor holding IVK can detect and open notes/commitments addressed to a holder (scan `outputCms`, trial-open) **without** spend authority (which needs `nsk`); a **Full Viewing Key** `FVK = (IVK, OVK)` grants read-only total visibility to a delegated auditor/regulator. This keeps **spend (`nsk`) separate from sight (IVK/OVK)**, so the whitepaper §8 "prove compliance outward without exposing internals" is a **viewing-key grant, never an `nsk` handover**.
  ```ts
  const { fvk, ivk, ovk } = derivePrivacyKeys(nsk);          // Poseidon hierarchy
  const myNotes = scanForNotes(ivk, snapshot.outputCms);     // auditor/holder read-only
  const disclosure = openField({ commitment: state.bids[i], opening: { value: 4200, salt }, scheme: 'poseidon' });
  // counterparty verifies: poseidon([toFr(4200), toFr(salt)]) === state.bids[i]
  await sdk.proveStatement(fiberId, { ">=": [ {"var":"score"}, 700 ] });  // zk-jlvm predicate proof
  ```

---

## 6. Range & confidential values

**Today: range-by-type, in-circuit only.** The shielded circuit enforces `u64` range as a **structural** consequence of the Rust type — `note.value: u64` zero-extends into Fr without wraparound (`< 2^64 ≪ R`), and conservation accumulates in a `u128` (`checked_add`) so `N·(2^64−1)` never overflows. There is **no** bit-decomposition range gadget and **no** standalone range/Bulletproofs JLVM opcode. This is correct and cheap, but it is **range-by-type, not range-by-proof**, and it covers *only* values that are shielded-transfer notes. The only on-chain ZK verify primitive is `groth16_verify` (250k gas).

**The real gap — confidential values OUTSIDE notes.** A semi-private value that is *not* a shielded note (a sealed bid, a score ≥ threshold, a record in a band) has no native "prove `x ∈ [a,b]`" instruction. The honest assessment: **you do not need to add a Bulletproofs/Halo2/STARK verifier opcode** — and doing so would *worsen* the no-extra-ceremony posture.

**The ceremony-free path — an SP1 predicate/range guest.** Because SP1's `verifyProof(programVKey, publicValues, proofBytes)` takes the program vkey as a **runtime argument**, a tiny new guest reuses the **same** fixed `VK_ROOT` and the **same** `groth16_verify` opcode. A "predicate guest" takes private `x` and public `(cm, lo, hi)` and asserts `lo ≤ x ≤ hi` **and** `Poseidon(x, rho) == cm`. The client proves it; publishes only `(cm, lo, hi, proof)`; the on-chain guard calls `groth16_verify` against the universal `VK_ROOT` — exactly the PR #166 gated-morphism pattern, parameterized by the range-guest vkey. **No new on-chain code, no new ceremony, no new opcode.** The same guest generalizes to arbitrary predicates (membership, sealed-bid ordering, monotone score policies) since it just runs the real JLVM under zk-jlvm with `expr`/`data` private.

```jsonc
// semi-private bid in [0, max] vs committed cm — verified with the EXISTING opcode + universal VK_ROOT
{ "groth16_verify": [ {"var":"$RANGE_GUEST_VKEY"}, {"var":"witness.publicValues"}, {"var":"witness.proof"} ] }
```

**When a native transparent range opcode is worth adding — and only then.** Bulletproofs (674-byte 64-bit proof, ~2.3 ms verify, no setup, but **O(n)** verify), Halo2-IPA (transparent, recursive, non-constant verify), and STARK (transparent, post-quantum, tens-to-hundreds of KB) are all feasible **additive** verifiers — but each is **new audited on-chain code** with verification that **competes poorly** with the constant 250k-gas `groth16_verify`, and each **duplicates** the SP1-guest capability under the existing `VK_ROOT`. **Verdict:** do **not** add one by default. Reserve it strictly for a future **proving-cost-bound** workload (very high-frequency confidential values where the SP1 *prover* — not verifier — dominates), the narrow case where Bulletproofs' cheaper prover and no-RISC-V overhead decide it.

**Batching — SP1 recursion ⇒ one verify for N values.** The dominant on-chain cost is the per-proof `groth16_verify` (250k gas). SP1 recursion aggregates many client range/JLVM proofs into a **single** Groth16 proof verified **once** at 250k gas (the same primitive rollups use; demonstrated productionally by aggregation services like Aligned). Cost shifts entirely to off-chain, parallelizable, CUDA-able proving. This is the lever that makes the semi-private tier **economical at scale** — recommended for high-N flows.

Any new guest inherits the **§3.0 determinism obligation**: `cm = Poseidon(x, rho)` must use the identical Fr encoding and canonicalization as the TS builder, pinned to shared cross-language vectors, or every proof fails as the opaque `InvalidSignature`/verify-mismatch class.

---

## 7. Honest feasibility ledger

| Concern | Reality | Buildable now? |
|---|---|---|
| **Determinism split** (the dominant risk) | zk-jlvm hashes **raw** input bytes (no dropNulls, no input canon); signing is `JCS(dropNulls)`. Two preimages → silent `InvalidSignature`. | Fix is small SDK glue (§3.0). **Do before any tier-2/3 use.** |
| **Prover cost/latency** | SP1 Groth16 is **seconds-to-minutes/proof**, Rust/SP1 only (CUDA optional). No in-browser prover. | Mandatory **async** "commit-now / prove-async / settle-on-proof" UX; never an inline synchronous guard — only the 250k-gas *verify* belongs in a guard. |
| **TS Groth16 verify** | Not implemented in the TS evaluator (decodable + priced only). Verify is Rust/Scala. | Port `groth16_verify` to TS (pairing/G1 already present). Until then clients trust the chain for the SNARK step. |
| **No on-chain nullifier set** | `grep nullifier` over `ottochain/modules` = **0 hits**. Circuit reveals nullifiers; nothing consumes them → valid proof is **replayable**. | Build a committed append-only set + in-guard non-inclusion (`smt`/`pmt`) + insert-on-settle. **Prerequisite for the private tier.** |
| **Shielded soundness TODOs** | (1) **no intra-transfer nullifier-uniqueness** (`lib.rs:212-217`) — same input note listable twice, double-counted. (2) **single-asset conservation only** (`lib.rs:236-239`) — sums across all assets, so a multi-asset witness can **mint across assets**. | Fix **in-circuit** (pairwise-distinct nullifiers; conserve **per** `note.asset`). Until then: single-asset + on-chain dedup required. |
| **Audit gate** | metakit's verifier and the shielded circuit have **no public security audit** (flagged in-repo). They are the trust root for every shielded claim. | Public needs no audit. **Semi-private/private must not protect real value un-audited.** |
| **Semi-private leakage** | Hiding a field still leaks via the proven *bound* (narrows the range), tx **timing/ordering**, **proof size**, **fee**, and revealed commitment/nullifier **cardinality**. Small anonymity sets deanonymize by correlation. | Hides values, not necessarily participation. Replicate Midnight `disclose()` taint-tracking + Kachina leakage declaration or it silently over-claims. |
| **Nullifier-set growth** | A committed nullifier set grows **forever**; without epoch/accumulator/pruning, state + proof costs grow monotonically. | A state-rent/scaling concern the (still-unbuilt, §9) fee model must cover. |
| **Client is system of record** | Lost/corrupted `PrivateStore` = **unrecoverable** notes (chain has only commitments). | Needs encrypted backup + viewing-key recovery design. |
| **`VK_ROOT` allow-listing** | One universal `VK_ROOT`; program identity is only the 32-byte `programVKey` in public inputs. | Which `programVKey` a guard accepts is an **application-layer** responsibility (the `exprHash`/`$selfLogicHash` binding), not enforced by the opcode. |

**What's buildable NOW per tier:**

- **Public** — ships today. Zero crypto. Only a `disclosure: 'public'` default label + docs on the existing `defineFiberApp` surface.
- **Semi-private (commit/reveal + gated morphism)** — ships **now** on shipped crypto, after the §3.0 one-canonical-path fix and a thin SDK layer; pin each rule's `exprHash` to a published expression so the public bound is in the hash. **Audit before real value.**
- **Private** — **provable today, not yet safely settle-able.** Gated on, in order: (1) fix the two circuit TODOs; (2) build the on-chain nullifier subsystem; (3) audit; (4) async prover UX.

The whitepaper's "same readable contracts, ZK as the dial" is **honest for public and semi-private today** and **aspirational-pending-work for private**. Say so.

---

## 8. Roadmap

Each phase lists concrete deliverables and the SDK milestone. Phases 0–2 ship on **existing** crypto.

**Phase 0 — Public tier + the canonical-path fix (foundational).**
- Chain/SDK: mark `disclosure: 'public'` as the default tier; docs.
- SDK: `proverPreimage(x) = keccak256(JCS(dropNulls(x)))` shared by `signing.ts` and the (future) prover glue. Private-data types make defaulted-required fields **required**.
- Tests: property/fuzz the canonical path (explicit nulls, array nulls, hex casing, leading-zero Fr) against the signer to pre-empt the `InvalidSignature` class. Extend the cross-language (TS/Rust/Scala) vector lockstep to cover **all commitment/nullifier/proof preimages**, not just signatures.
- *Milestone:* `@ottochain/sdk/private` skeleton (`commitments`, canonical glue) published as a tree-shakeable subpath.

**Phase 1 — Semi-private field-hiding (commit/reveal, shipped crypto).**
- SDK: `commitments` (pinned Poseidon field orders + golden vector vs `zk-shielded --mode execute`), `SubprocessProver`, `provenTransition`, an **`exprHash` registry** mapping published JLVM rules → `exprHash`.
- Templates: the §3.1 gated guard as a reusable library bound to `$selfLogicHash`; wire the `market-auction.ts` sealed-bid as the exemplar.
- *Milestone:* sealed-bid auction end-to-end on testnet (commit → prove → reveal → settle), values never on-chain.

**Phase 2 — Client-side verification + selective disclosure.**
- metakit: **port `groth16_verify`** (and ideally `smt_verify`/`mpt_verify`) to the TS evaluator.
- SDK: `disclosure` (viewing keys over the `nsk` hierarchy: `derivePrivacyKeys`/`scan`/`openField`), signed disclosure receipts via `signDataUpdate`, Midnight-style `reveal()` taint-check that refuses to sign if an undisclosed witness flows into the public delta.
- *Milestone:* a thin client fully verifies a peer's SP1 proof locally; auditor opens a single field via a viewing key without spend authority.

**Phase 3 — Private client-held fibers (needs new chain work).**
- Chain: build the **nullifier subsystem** (committed append-only set + in-guard non-inclusion via `smt`/`pmt` + insert-on-settle) and an **anchor/commitment-tree history**; state-proof endpoints over them. The universal `advance` transition (§3.2) as a library template.
- SDK: `PrivateStore` (encrypted-at-rest, IndexedDB/file/in-memory backends), `ServiceProver` (self-hosted), async "commit-now/settle-on-proof" job UX with anchor-staleness handling, encrypted backup + viewing-key recovery.
- *Milestone:* a private fiber advances on testnet revealing only `{newCommitment, nullifier, root}`; double-spend rejected on-chain.

**Phase 4 — Confidential assets (shielded value), gated on circuit fixes + audit.**
- Circuit: fix **intra-transfer nullifier-uniqueness** and **per-asset conservation**; **audit** verifier + circuit.
- Chain: shielded settlement handler (verify Groth16, extend nullifier set, append output cms to the tree).
- SDK: shielded-note wallet (note/nullifier/anchor management), `shieldedTransition` orchestrating the prover and submitting `{anchor, nullifiers, outputCms, fee}`; reject mixed-asset witnesses until the multi-asset fix lands.
- *Milestone:* multi-asset shielded transfer with conserved-per-asset value and on-chain double-spend protection — **audited**.

**Phase 5 — Range primitive & batching (only as needed).**
- Default: an **SP1 predicate/range guest** under the existing `VK_ROOT` for confidential values outside the shielded circuit (no new opcode/ceremony).
- Scale: **SP1 recursion/aggregation** so N client proofs cost one 250k-gas verify.
- Reserve a native Bulletproofs opcode strictly for a proven proving-cost-bound workload.
- *Milestone:* a sealed-bid cohort settles N range proofs under one on-chain verify.

---

## 9. Open questions & risks

- **Determinism unification is the gating correctness question.** Until `keccak256(JCS(dropNulls(x)))` is the single shared preimage across signing, commitments, and the zk-jlvm guest, every tier-2/3 client risks the opaque `InvalidSignature`/false-verify class. The guest hashes *raw* input bytes today; the SDK must canonicalize before proving, and the cross-language vectors must cover proof/commitment preimages, not just signatures. **No private feature should ship before this is closed and vectored.**
- **Where does proving run, and what does delegation leak?** No in-browser SP1 prover exists. The honest answer is local Rust/CUDA *or* a **self-hosted** delegated prover; a naive "use someone's prover" deployment **leaks every witness**. Witness-blinding for delegated proving is an open design item. This is also a centralization consideration for the "agent runs it itself" story.
- **Nullifier-set lifecycle.** An append-only set grows forever. Epoch boundaries, accumulators, or sparse-Merkle pruning windows, plus the (unbuilt) fee/state-rent model, must bound it. Open: what is the valid-anchor window, and how do clients refresh Merkle witnesses when the tree advances before their proof lands?
- **How much does semi-private actually hide?** Values are shielded; the proven *bound*, tx timing/ordering, proof size, fee, and commitment/nullifier cardinality are not. Small anonymity sets deanonymize by correlation. The design hides values, not necessarily participation — applications must be told this plainly, and `disclose()`-style taint-tracking must be on or "private-by-opt-in" silently degrades to public.
- **Audit scope and sequencing.** metakit's verifier and the shielded circuit are unaudited and are the trust root for every shielded claim. What is the minimum audited surface to launch semi-private (verifier + the specific predicate guests) versus private (also the nullifier subsystem + the two circuit fixes)?
- **`VK_ROOT` is universal — circuit allow-listing is on the app.** Program identity is only the 32-byte `programVKey`. The `exprHash == $selfLogicHash` binding is what stops an attacker substituting a different proven rule; getting that binding right in every gated guard template is load-bearing and easy to get subtly wrong.
- **Viewing keys are irrevocable read-grants.** A holder of IVK/FVK can always re-derive past openings; a leaked FVK exposes all historical activity addressed to that holder. Auditor key management is a new trust surface with no revocation story yet.
- **Two shielded soundness TODOs are value-critical.** Intra-transfer nullifier duplication (double-count an input) and cross-asset minting (single-asset conservation only) each break value conservation if relied on as-is. They must be fixed **in-circuit**, not patched on-chain, before the shielded `u64`-range/conservation guarantee can be trusted in multi-asset or untrusted-relayer settings.

---

### References (load-bearing, local unless noted)

- Whitepaper v0.4 §6 (three tiers) + §8/§9 (present-today list): `/home/euler/repos/ottochain/docs/whitepaper/ottochain-whitepaper-v0.4.md`
- zk-jlvm guest (prove arbitrary private JLVM; hashes raw input bytes, canonicalizes output only): `/home/euler/repos/metakit-sdk/rust/zk-jlvm/program/src/main.rs`, `lib/src/lib.rs`
- zk-shielded circuit (notes/nullifiers/Merkle/conservation/u64-range; the two TODOs at `lib.rs:212-217` and `lib.rs:236-239`): `/home/euler/repos/metakit-sdk/rust/zk-shielded/lib/src/lib.rs`, `lib/src/pub_values.rs`, `lib/src/wire.rs`
- `groth16_verify` (Rust/Scala; 250k gas; universal `VK_ROOT`): `/home/euler/repos/metakit-sdk/rust/jlvm-core/src/crypto.rs`
- TS evaluator gap (groth16/smt/mpt/bn254/ecvrf unported, `"Unsupported operator"`): `/home/euler/repos/metakit-sdk/packages/typescript/src/json-logic/evaluator.ts:600-619`, `operators.ts`
- TS Poseidon/Merkle + Fr encoders: `/home/euler/repos/metakit-sdk/packages/typescript/src/json-logic/poseidon.ts`, `crypto-ops.ts`, `hex-bytes.ts`
- Witness-gated morphism (PR #166): `/home/euler/repos/ottochain/modules/models/.../schema/Updates.scala`; SDK guard surface `/home/euler/repos/ottochain-sdk/src/schema/fiber-app.ts`
- Signing canonical (`JCS(dropNulls)`) + `InvalidSignature` class: `/home/euler/repos/ottochain-sdk/src/signing.ts`, `src/ottochain/drop-nulls.ts`, `docs/signing-and-publishing.md`
- SDK tx path + ML0 client: `/home/euler/repos/ottochain-sdk/src/ottochain/transaction.ts`, `metagraph-client.ts`, `types.ts`
- Sealed-bid exemplar: `/home/euler/repos/ottochain-sdk/src/apps/markets/state-machines/market-auction.ts`
- Kachina (UC private contracts), Midnight `disclose()`, Aztec PXE, Aleo offline execution, Mina off-chain state, SP1 recursion/`ISP1Verifier`, Bulletproofs — external (see the grounding brief for URLs).

---

The full doc is also saved at `/home/euler/repos/ottochain-sdk/docs/client-side-private-data.md` (all nine sections). Before writing, I confirmed against source the load-bearing claims the doc's credibility rests on: the **determinism split** (zk-jlvm `main.rs` hashes raw `expr_json`/`data_json` bytes with no dropNulls and canonicalizes only the output, vs. signing's `JCS(dropNulls)`), the **two shielded TODOs** (`lib.rs:212-217` nullifier-uniqueness, `lib.rs:236-239` single-asset conservation), the **TS `groth16_verify` gap** (`evaluator.ts:600-619`), and **zero on-chain nullifier hits** in `ottochain/modules`.
