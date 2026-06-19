# zk-loan: a privacy-preserving lending app for OttoChain

A privacy-preserving collateralized loan, modeled on Midnight's
[zkLoan example](https://docs.midnight.network/examples/dapps/zkloan) and integrated with
OttoChain's asset subsystem. The borrower proves loan **eligibility** in zero-knowledge —
their private financials satisfy a public lending rule — without revealing those financials.
The lender originates the loan. Collateral, principal, and repayment are **assets** driven
through typed morphisms by the loan lifecycle.

- App package: `src/apps/lending` (variant `zkLoan`).
- State machine: `src/apps/lending/state-machines/lending-zk-loan.ts`.
- Eligibility-proof model: `src/apps/lending/eligibility.ts`.
- Asset integration: `src/apps/lending/assets.ts`.
- Semi-private zk primitives (shared): `src/zk/{preimage,types,index}.ts`.
- Tests: `tests/lending/*.test.ts`.

## 1. Why `lending` (app-name justification)

The package is named **`lending`**, not `loans` or `zkloan`. The zk-loan is the first variant
(`type: "zkLoan"`) under a family that will grow to **credit lines, BNPL, bonds, and escrowed
credit** — all share the same shape (a private-finance fiber whose financial state stays
private while eligibility/standing is proven in zero-knowledge, with collateral/principal/
repayment modeled as assets). This mirrors how the existing `markets` app
(`src/apps/markets`) hosts `prediction` / `auction` / `crowdfund` / `groupBuy` under one name,
and `governance` hosts `daoSingle` / `daoMultisig` / `daoToken` / `daoReputation`. A variant
registry (`LENDING_DEFINITIONS`, `getLendingDefinition(type)`) lets future credit products land
as sibling state machines without a new package or a new `exports` entry per product.

## 2. The state machine

`lendingZkLoanDef` (via `defineFiberApp`, mirroring `market-prediction.ts`) implements:

```
REQUESTED ──lock_collateral──▶ COLLATERAL_LOCKED ──originate (zk gate)──▶ ACTIVE
    │                                                                       │
  cancel                                                          ┌─────────┴──────────┐
    ▼                                                          repay              default_loan
CANCELLED (final)                                                 │                     │
                                                                  ▼                     ▼
                                                            REPAID (final)         DEFAULTED
                                                          (collateral released)        │
                                                                                   liquidate
                                                                                       ▼
                                                                                 LIQUIDATED (final)
                                                                              (collateral → lender)
```

| State | Category | Meaning |
|---|---|---|
| `REQUESTED` | initial | Loan requested; no collateral locked, eligibility unproven. |
| `COLLATERAL_LOCKED` | pending | Collateral escrowed; awaiting the lender's zk-gated origination. |
| `ACTIVE` | active | Loan originated (eligibility proven); principal minted to the borrower. |
| `DEFAULTED` | pending | Past due and unpaid; collateral pending liquidation. |
| `REPAID` | terminal | Principal repaid (debt burned); collateral released to the borrower. |
| `LIQUIDATED` | terminal | Defaulted loan settled by transferring collateral to the lender. |
| `CANCELLED` | terminal | Request cancelled before any collateral was locked. |

Every transition has a JLVM guard + effect. The loan uses `$ordinal` (snapshot ordinal) for
time, not `$timestamp` — ordinal-based, matching the asset model's no-wall-clock convention.
`repay` and `liquidate` carry `emits` that direct the escrow fiber to settle the collateral
(`collateral_released` / `collateral_liquidated`), the on-chain `_transferAsset` channel
(asset-model §9/§10).

## 3. The eligibility-proof model (the privacy boundary)

### What is PROVEN vs REVEALED

| | Data | Where it lives |
|---|---|---|
| **PRIVATE (proven in zk, never revealed)** | `collateralValue`, `creditScore` (and any income/standing inputs), the outstanding-debt math, blinding salts | The prover's witness only. Their keccak is the proof's `dataHash`; the values never appear on-chain or in the event. |
| **PUBLIC (revealed)** | The loan `principalAmount`; the `collateralAssetId` (a locked *handle*, not its private valuation); the lending-rule `logicHash`; the pinned `vkey`; loan `status`; the boolean eligibility outcome | Loan create-state + chain. |

The boundary is Midnight's: **the chain learns _whether_ the borrower qualifies, never _why_.**
The borrower's collateral valuation and credit score stay hidden; only "the pinned rule
returned `true` on some hidden data" is established on-chain.

### The public lending rule (with pinned bounds)

`lendingRule(params)` (`eligibility.ts`) is a JSON-Logic predicate over the borrower's PRIVATE
context `{ collateralValue, creditScore }`, with the bounds baked in as **literals** (so the
rule's hash pins the bounds):

```jsonc
// collateralRatioPct=150, loanAmount=1000, minCreditScore=680
{ "and": [
    { ">=": [ { "*": [ { "var": "collateralValue" }, 100 ] }, 150000 ] },  // coverage: collateral*100 >= loan*ratio%
    { ">=": [ { "var": "creditScore" }, 680 ] }                            // credit-score floor
] }
```

The integer-ratio form (`collateralValue * 100 >= loanAmount * collateralRatioPct`) avoids
floats. `minCreditScore` is optional (collateral-coverage-only loans omit it).

### Pinning and the binding

`pinLendingRule(params, vkey)` returns:
- `rule` — the public predicate above,
- `logicHash = keccak256(canonicalize(rule))` — via `src/zk` `exprHash` (equals the chain's
  registry `logicHash` for that rule),
- `keccakTrue = keccak256(canonicalize(true))` — via `src/zk` `KECCAK_TRUE`,
- `vkey` — the SP1 program verifying key (bytes32) for the eligibility circuit.

These three constants are stored on the loan's create-state (`lendingRuleVKey`,
`lendingRuleLogicHash`, `keccakTrue`), so the origination guard is a **closed** expression.

### The SP1 zk-jlvm public-values layout

The zk-jlvm guest commits `abi_encode(JlvmPublicValues{ bytes32 exprHash, bytes32 dataHash,
bytes32 outputHash, bool ok })` — four 32-byte words. As a `0x`-hex string:

| word | field | hex chars (after `0x`) | meaning |
|---|---|---|---|
| 0 | `exprHash` | `[0,64)` | `keccak256(canonicalize(rule))` — which rule ran; equals `logicHash`. |
| 1 | `dataHash` | `[64,128)` | `keccak256(canonicalize(private data))` — never revealed. |
| 2 | `outputHash` | `[128,192)` | `keccak256(canonicalize(output))`; `keccakTrue` for `true`. |
| 3 | `ok` | `[192,256)` | bool, right-aligned; final pair `01`/`00`. |

This is mirrored client-side by `decodeJlvmPublicValues` and `PV_HEX_OFFSETS` (`src/zk/types.ts`).

### The origination guard (semi-private gate)

`buildOriginationGuard()` (`eligibility.ts`) produces the guard that the
`COLLATERAL_LOCKED → ACTIVE` transition uses (ANDed with `agent == lender`). Because
`publicValues` is opaque to `groth16_verify`, the guard slices the `0x`-hex blob with **native
JLVM `cat` / `substr`** — there is no `jlvm_pv_decode` opcode by design (`src/zk/types.ts` doc):

```jsonc
{ "and": [
    { "===": [ { "var": "event.agent" }, { "var": "state.lender" } ] },                       // 1. lender only
    { "groth16_verify": [ { "var": "state.lendingRuleVKey" },
                          { "var": "witness.publicValues" },
                          { "var": "witness.proof" } ] },                                       // 2. proof valid
    { "===": [ { "cat": [ "0x", { "substr": [ { "var": "witness.publicValues" }, 2,   64 ] } ] },
               { "var": "state.lendingRuleLogicHash" } ] },                                      // 3. exprHash == logicHash
    { "===": [ { "cat": [ "0x", { "substr": [ { "var": "witness.publicValues" }, 130, 64 ] } ] },
               { "var": "state.keccakTrue" } ] },                                                // 4. outputHash == keccak(true)
    { "===": [ { "substr": [ { "var": "witness.publicValues" }, 256, 2 ] }, "01" ] }            // 5. ok bit
] }
```

So a proof can originate a loan **only if** it (a) verifies under the pinned vkey, (b) proves
**the pinned rule** (`exprHash == logicHash` — clause 3 pins *which* rule, with its bounds),
(c) the rule returned `true` (`outputHash == keccakTrue` — clause 4), and (d) the JLVM run did
not error (clause 5). A missing or garbage witness makes `groth16_verify` return `false`, the
`and` short-circuits, and the transition is **gracefully rejected** with state untouched —
matching the shipped on-chain pattern in
`ottochain/modules/shared-data/.../ZkGatedMorphismSuite.scala`. The eligibility tests execute
these clauses against crafted `publicValues` blobs using the real `metagraph-sdk-jlvm`
evaluator (which supports `substr`/`cat`/`===`/`groth16_verify`), so the byte offsets and the
fail-closed behavior are verified behaviorally.

The witness the guard reads is built by `buildEligibilityWitness({ publicValues, proof })`
(both lowercase `0x`-hex; the SP1-Groth16 bundle from the `zk-jlvm` prover), exposed under the
reserved `witness` key on the `originate` event payload (or on a proof-gated `MintAsset`).

## 4. Asset-subsystem integration

The collateral, principal/debt, and repayment are assets (`assets.ts`). The wire shapes mirror
the asset-model proposal (`ottochain/docs/proposals/asset-model.md` §7–§8) and follow the SDK's
single-key-wrapper convention (`{ MintAsset: {...} }`, like `src/ottochain/transaction.ts`).
> Note: the asset op-codes are a proposed, not-yet-merged TypeScript SDK surface. These builders
> let the lending app construct the proposed wire format today and sign it with the existing
> `signTransaction` path; they track the proposal's field shapes exactly.

### Policies

- **Collateral vault** (`collateralPolicy`) — an NFT-like, non-splittable, governable custodial
  holding. Its `Transfer` morphism is **`Governed`**: the loan/escrow fiber is the
  authorization (asset-model §10 — there is no `Lock` morphism; locking is a custody transfer
  to `AssetHolder.Fiber`).
- **Loan-debt / principal** (`debtPolicy(originationGuard)`) — a `GovernedFungible` (bits 29 =
  T+S+C+G) whose **`mintPolicy` IS the origination guard** (the `groth16_verify` expression).
  The principal is mintable to the borrower **only when the eligibility proof verifies**
  (proof-gated mint, asset-model §8). Repayment is a `Burn` gated by `burnPolicy` (only the
  holder may burn).

### Lifecycle → morphism drivers

| Loan transition | Asset op | Builder |
|---|---|---|
| `lock_collateral` | `ApplyMorphism(Transfer)` into `AssetHolder.Fiber(escrow)` | `lockCollateralOp` |
| `originate` | `MintAsset` of the debt/principal to the borrower, carrying the eligibility `witness` | `mintPrincipalOp` |
| `repay` | `ApplyMorphism(Burn)` of the debt token | `repayBurnOp` |
| `repay` → `REPAID` | collateral `Transfer` back to the borrower (via the fiber `_transferAsset`) | `settleCollateralOp` |
| `liquidate` → `LIQUIDATED` | collateral `Transfer` to the lender | `settleCollateralOp` |

`createAssetPolicyPayload`, `createMintAssetPayload`, `createApplyMorphismPayload`, and
`createAuthorizeComposePayload` are the general op builders; the loan helpers compose them.

## 5. Midnight-zkLoan mapping

| Midnight zkLoan | This app |
|---|---|
| Borrower's private credit score, monthly income, employment tenure, attestation, PIN | Private witness `{ collateralValue, creditScore, … }` — `dataHash` only, never revealed. |
| "The chain learns _whether_ the user qualifies, never _why_" | Origination guard binds `outputHash == keccak(true)` + `ok` — a boolean outcome; the financials stay in the witness. |
| Eligibility tiers / loan logic in the contract circuit | The pinned public `lendingRule` (with literal bounds) → its `logicHash`; the guard binds `exprHash == logicHash`. |
| Witness-provided private inputs fed to the prover at proving time | `buildEligibilityWitness({publicValues, proof})` from the SP1 `zk-jlvm` prover; read under `witness`. |
| Two-phase request → respond (Proposed → Approved) | `REQUESTED → COLLATERAL_LOCKED → ACTIVE`, with the lender's zk-gated `originate` as the approval. |
| Attestation provider signs the credit profile off-chain | The lender pins the `vkey` of the eligibility circuit; the proof is verified on-chain via `groth16_verify`. |
| (not modeled in Midnight's example) collateral / principal / repayment tokens | Concrete asset policies + typed morphisms (lock / mint / burn / release / liquidate). |

## 6. Caveats

- The asset op-codes and the zk verifier opcodes are **proposals / release-candidates**. The
  installed `metagraph-sdk-jlvm@1.8.0-rc.4` evaluator supports `groth16_verify` / `substr` /
  `cat` (used by the guard and verified in tests), but the metakit verifier has **no public
  security audit** — per the asset-model and the shipped Scala test, a ZkVerify-gated guard
  must not protect real value until the verifier is audited.
- Anti-replay: in production the proof's bound message is computed by the chain (a domain-
  separated digest over the op + a single-use nonce), not taken from the witness. The guard
  here binds the rule identity and outcome; nonce binding rides on the asset op / fiber
  sequence (asset-model §8).
