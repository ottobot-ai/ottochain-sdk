
# OttoChain SDK ↔ Chain Security & Alignment Audit — Consolidated Report

**Scope:** FiberEngine + std apps (SDK definitions vs. on-chain metakit/JLVM + chain engine semantics)
**Date:** 2026-06-18
**Status:** All findings below are CONFIRMED against ground-truth chain source (ContextProvider, ExpressionParser, EffectExtractor, ReservedKeys, JsonLogicSemantics, AssetCombiner, Updates/Records/GenesisManifest Scala) and the metakit JLVM opcode tables (`ops.rs`/`gas.rs`, `JsonLogicOp.scala`).

---

## 1. Executive Summary

### 1.1 Counts by severity

| Severity | Security | Alignment | Total |
|---|---:|---:|---:|
| **High** | 28 | 31 | 59 |
| **Medium** | 8 | 22 | 30 |
| **Low** | 4 | 9 | 13 |
| **Info** | 1 | 2 | 3 |
| **Total** | **41** | **64** | **105** |

> Note: many entries are file-level findings that explicitly enumerate sibling sites (e.g. contract-escrow names 6 `event.agent` guards in one finding; dao-multisig bundles `getKey`/`setKey`/`size` across one machine). The table counts discrete findings as given, not individual call sites — the true number of code sites to patch is several hundred.

### 1.2 Counts by dimension and app

| App / area | Security | Alignment | Notes |
|---|---:|---:|---|
| contracts (agreement, escrow, universal) | 9 | 5 | escrow is the single worst machine |
| corporate (board, entity, securities, shareholders) | 4 | 12 | dependency/`cat`/`.length`/`$timestamp` drift |
| governance (dao-multisig, -reputation, -single, -token, -simple, -universal) | 14 | 18 | opcode + identity drift compounded |
| identity (agent, oracle, universal) | 8 | 7 | oracle slash/settlement; universal/agent open |
| lending (zk-loan) | 0 | 2 | asset-transfer channel + witness path |
| markets (auction, crowdfund, group-buy, prediction, universal) | 6 | 14 | prediction is worst; `$timestamp` pervasive |
| zk-guards | 1 | 1 | replayable semi-private proof |
| engine-registry-alignment (SDK↔chain wire types) | 0 | 11 | genesis/registry/record decode breaks |
| **Total** | **42** | **70** | (cross-listed apps counted per finding) |

### 1.3 Systemic patterns

Five classes account for the overwhelming majority of findings. Almost every high-severity item is an instance of one of these, not a one-off.

- **S1 — Authorization bound to attacker-supplied `event.*` (audit class "F1").** The guard or effect reads the *acting party / authority* from the raw transition payload (`event.agent`, `event.shareholderId`, `event.judicialRuling`, `event.mutualConsent`, `event.signatureCount`, `event.forCount`, `event.approvalCount`, `event.adminOverride`, `event.agentReputation`, `event.isFillingVacancy`). The chain injects `event` verbatim (`ContextProvider: EVENT -> payload`) and never rebinds the signer. The only verified identity is `proofs[].address` (`= id.toAddress`). This is the dominant security class: ~30 of the 41 security findings. **Fix is always the same shape:** `signerIsParty` / `signerInSet` / `signerIsNotParty` over `proofs[].address`. The SDK's own `src/schema/guards.ts` documents this exact anti-pattern and ships the correct builders.

- **S2 — Bare attacker boolean / magnitude *is* the authorization.** A subclass of S1 where the entire guard is one attacker field: `{"var":"event.judicialRuling"}` (contract-escrow ruling, contract-agreement resolve, market-prediction ruling), `{"var":"event.mutualConsent"}` (escrow refund), `{"===":[event.signatureCount, size(state.signers)]}` (dao-multisig dissolve), `event.forCount`/`event.approvalCount` (governance-simple finalize/dissolve), `{"!!":[event.from]}` (identity-agent vouch). The attacker *supplies its own approval count / verdict*. Worst-impact settlement/terminal bypasses.

- **A1 — `$timestamp` is not a reserved key.** `ReservedKeys` injects only `$ordinal`, `$lastSnapshotHash`, `$epochProgress`. `{"var":"$timestamp"}` resolves to `NullValue` → coerced to `0` in numeric contexts. **~33 SDK definitions** affected. Mostly silent data corruption (`*At` fields written null), but **security-relevant** wherever it backs a deadline *guard* — `0 <= deadline` is always true (windows unenforced) and `0 >= deadline` is always false (settle/refund/expiry transitions become dead). Fix: `$ordinal`, and retype `*Ms`/`timestamp` schema fields as ordinal deltas.

- **A2 — Nonexistent / misused JLVM opcodes.** `size`, `getKey`, `setKey`, `deleteKey`, and `cat`-on-arrays are not valid for their intended use. metakit silently decodes an unknown single-key object (`{size:…}`, `{getKey:…}`) as a **literal Map**, not an operator — so guards become always-true/always-false or throw `promoteToNumeric` exceptions, and effects write junk keys into state. `cat` is string-only and *raises* on array operands, aborting array-append effects. Correct ops: `length`/`count` (collections; note `length` rejects Maps → wrap with `keys`/`values`), `get`/`has` (member access), `merge`/`cat` (array append, depending on shape), and a **data-model change to arrays** for anything needing dynamic-key map writes.

- **A3 — SDK directives the chain silently drops.** `dependencies` object form `{machine, instanceRef, requiredState}` (chain parses `Set[UUID]` only; `requiredState`/`instanceRef` exist nowhere — no auto-gating, ever); transition-level `emits` / `spawns` (not in the on-chain `Transition` schema; `toProtoDefinition` forwards only from/to/eventName/guard/effect/dependencies). Cross-machine/asset effects must ride *inside the effect result* under reserved keys `_emit`/`_triggers`/`_transferAsset`/`_spawn`. This class is the root cause behind several high-sev authorization gaps (corp-board removal, corp-entity dissolve, corp-securities issuance) because authors believed `requiredState: EXECUTED` was gating them.

The remaining cluster (**A4 — SDK↔chain wire-type drift**, the engine-registry-alignment findings) is structurally distinct: schema/field-name divergences that break decode of genesis manifests, registry/version queries, fiber records, and rejection logs. Two are **hard decode failures** (genesis `schemaShape`→`machineShape`; `PublishVersion` split), the rest are silent field loss on reads.

**The single most dangerous machine is `contracts/contract-escrow`** (9 security + 2 alignment findings: every `event.agent` authorization, two bare-boolean settlement bypasses, a no-op `spawns` arbiter, and file-wide `$timestamp`). **`markets/market-prediction`** and **`governance/dao-multisig`** are close behind, each combining S1/S2 identity forgery with A1/A2 opcode drift such that *fixing the opcode without fixing the identity binding converts an inert bug into a live exploit* — these must be patched as coupled pairs.

---

## 2. Findings by Severity → App

Legend: **[S#]/[A#]** = systemic class (§1.3); **[one-off]** = not a systemic instance. `file:line` is the cited primary site; sibling sites are noted where the finding enumerates them.

---

### HIGH — Security

#### contracts/contract-agreement
- **resolve settles a dispute on a bare attacker boolean + attacker approvals** — `contract-agreement.ts:282` — **[S2]**
  Attack: `or([{var:event.judicialRuling}, and([event.proposerApproves, event.counterpartyApproves])])`. Disjunct 1 is a bare attacker flag → force `DISPUTED→COMPLETED` with no signature. Disjunct 2 reads *both* party approvals from attacker event → one caller consents for both. No binding to proofs, `state.disputedBy`, or the arbitration pool.
  Fix: `or([<judicial: arbitrator-signer / pool-dependency / *_verify witness>, and([signerIsParty("state.proposer"), signerIsParty("state.counterparty")])])`. Add immutable `arbitrator`/`arbitrationPoolId` to schema; bind `rulingId` to the verified ruling, not the raw event.

#### contracts/contract-escrow (one file, 8 security findings — **all [S1] except the two [S2] below**)
- **deposit authorizes depositor via `event.agent`** — `contract-escrow.ts:213` — **[S1]**
- **activate authorizes beneficiary via `event.agent`** — `:231` — **[S1]** (the `state.autoActivate` disjunct is fine — state-sourced)
- **request_release authorizes beneficiary via `event.agent`** — `:244` — **[S1]** (starts the auto-release payout clock without the beneficiary's signature)
- **approve_release authorizes depositor via `event.agent`** — `:269` — **[S1]** (releases custody; especially critical)
- **dispute authorizes depositor via `event.agent`** — `:290` — **[S1]**
- **cancel authorizes depositor via `event.agent`** — `:346` — **[S1]**
  Shared attack: `{"===":[event.agent, state.<party>]}`. `event.agent` is attacker-supplied (not even in some schemas → resolves null unless forged) and is never the verified signer. Any account forges `agent` to drive the transition while attributing it to the real party.
  Shared fix: replace each with `signerIsParty("state.<party>")` ⇒ `{"in":[{"var":"state.<party>"},{"map":[{"var":"proofs"},{"var":"address"}]}]}`. Keep value/state and ordinal-deadline comparisons untouched; record provenance (`requestedBy`) from the verified signer too.
- **ruling settlement gated entirely by `event.judicialRuling`, attacker-chosen splits** — `:315` — **[S2]**
  Attack: bare `{"var":"event.judicialRuling"}` → terminal `SPLIT` with `splits`/`rulingId` written verbatim; arbitrary caller dictates the entire payout division. No real arbiter (the `Judiciary` spawn is a no-op, below).
  Fix: pin `arbiter` into state on dispute-open; guard `and([{in:[state.arbiter, map(proofs,address)]}, {===:[Σ event.splits.amount, state.balance]}])` (signer + conservation).
- **refund settlement gated by bare `event.mutualConsent`** — `:333` — **[S2]**
  Attack: `or([{var:event.mutualConsent}, {">=":[$timestamp, state.expiresAt]}])` → one attacker boolean triggers full refund; expiry disjunct also broken by A1.
  Fix: replace disjunct 1 with `and([in[depositor,…], in[beneficiary,…]])` (true mutual consent), expiry → `{">=":[$ordinal, state.expiresAt]}`.

#### corporate
- **corp-board: remove_for_cause authorized solely by a `dependencies` object the engine drops** — `corp-board.ts:641` — **[A3]+[S1]**
  Attack: highest-impact board action (unseat a director) has *no signer check* — the entire gate is `dependencies:[{machine, instanceRef:{var:event.removalResolutionRef}, requiredState:'EXECUTED'}]`, which the chain parses as `Set[UUID]`, dropping the object. Any caller unseats any director with an arbitrary `removalResolutionRef`.
  Fix: move the gate into the guard: `{some:[proofs,{in:[address, state.authorizedRemovers]}]}` (+ optional `{==:[machines.<resolution-uuid>.state.status,"EXECUTED"]}` with the resolution UUID registered as a **bare-string** dependency). Keep `event.directorId` as the lookup key only.
- **corp-entity: amend_charter rewrites legal identity off `event.resolutionRef != null`** — `corp-entity.ts:475` — **[A3]+[S1]**
  Attack: the privileged identity-mutation path's only guard is a non-null check on an attacker field (the intended resolution dependency is dropped per A3). `{resolutionRef:"x", newLegalName:"Attacker Co"}` renames the entity.
  Fix: `{some:[proofs,{===:[address, state.charterAuthority]}]}` (or `signerIsParty`). Also fix the parallel `dissolve_voluntary`.
- **corp-entity: dissolve_voluntary — always-true guard + dropped resolutions** — `corp-entity.ts:645` — **[A3]+[S2]**
  Attack: `{"==":[1,1]}` + two dropped board/shareholder dependencies → any party irreversibly DISSOLVES the entity.
  Fix: real predicate over reserved sources — `{and:[{some:[proofs,{in:[address,state.boardAuthority]}]}, {some:[proofs,{in:[address,state.shareholderAuthority]}]}]}`; drop the object dependencies.
- **corp-securities: every state-changing guard is `{"==":[1,1]}` — no signer auth anywhere** — `corp-securities.ts:586` — **[S2]**
  Attack: issuance/transfer/repurchase/reissue/retire/split/dividend/restriction-removal all tautology-gated; machine never reads `proofs`. Anyone issues shares to themselves, transfers a holder's shares, etc. The only intended gate (board-resolution EXECUTED) is inert (A3).
  Fix: add state-pinned immutable `issuerAddress` (+ `holder.walletAddress`); gate each privileged transition on `{some:[proofs,{===:[address, state.issuerAddress]}]}`; holder-initiated on the current holder's wallet. Drop the inert dependencies; migrate `$timestamp`→`$ordinal`.
- **corp-shareholders: cast_vote authorizes voter by `event.shareholderId`** — `corp-shareholders.ts:930` — **[S1]**
  Attack: voter identity decided purely from `event.shareholderId` (on-roster + not-yet-voted), never tied to `proofs`. Any party forges a vote as any eligible shareholder, stuffs that holder's full weight, and locks the real holder out (`hasVoted=true`).
  Fix: add `address` to `EligibleVoter`; harden `register_eligible_shareholders` (authorize registrar via `proofs`); make cast_vote require `{in:[.address, map(proofs,address)]}`; derive recorded `shareholderId` from the matched roster entry. Proxy ballots must require `proxyGrantedTo`'s address ∈ `proofs[].address`.

#### governance
- **dao-multisig: all authorization gates on `event.agent ∈ state.signers`** — `dao-multisig.ts:164` (+ `:194,:303,:333,:371`) — **[S1]**
  Attack: every guard (propose/sign/propose_*), every recorded `proposer`, and the signatures map all key on forgeable `event.agent`. A non-signer sets `event.agent` to a real signer and passes.
  Fix: `{some:[map(proofs,address),{in:[{var:""},state.signers]}]}`; record `proposer`/signature keys from `proofs[].address`.
- **dao-multisig: threshold reachable single-handedly — sign() counts/dedupes by `event.agent`** — `:194` — **[S1]**
  Attack: one key calls `sign` repeatedly varying `event.agent` → distinct keys accumulate until `size(signatures) >= threshold`. N-of-M collapses to 1-of-anyone.
  Fix: authorize and key `state.signatures` on `proofs[].address`; dedupe over verified addresses.
- **dao-multisig: dissolve() destroys the DAO on `event.signatureCount` with no signatures** — `:484` — **[S2]**
  Attack: `{===:[event.signatureCount, size(state.signers)]}` — attacker supplies its own count; irreversible DISSOLVE.
  Fix: `{and:[{">":[size(signers),0]}, {all:[signers, {in:[{var:""}, map(proofs,address)]}]}]}` (verified unanimity + non-empty belt), or propose→accumulate→guarded-apply.
- **dao-reputation: join authorizes membership on attacker reputation + identity** — `dao-reputation.ts:401` — **[S1]**
  Attack: `and([event.agentReputation >= memberThreshold, !in(event.agent, members)])` — both operands from the payload → join as any address with fabricated reputation (Sybil + reputation forgery). Recurs in vote/propose/leave/propose_threshold_change.
  Fix: (1) append the **verified signer** (`proofs[].address`), gate `{some:[map(proofs,address),{!:[in[…, members]]}]}`; (2) read reputation from a chain-authoritative Reputation dependency (`machines.<id>.state…`) or a verified witness opcode — never `event.agentReputation`.
- **dao-reputation: vote gate + dedup keyed on `event.agent` (ballot stuffing)** — `:205` — **[S1]**
- **dao-reputation: leave authorizes the removal *target* by `event.agent` (evict-anyone)** — `:436` — **[S1]**
  Fix leave: self-removal only — `signerInSet("state.members")`; effect filters out whichever member actually signed; remove the `agent` event field.
- **dao-reputation: propose / propose_threshold_change gate on self-asserted `event.agentReputation`** — `:172` — **[S1]+[S2]** (both halves required: bind proposer to verified signer **and** read reputation from a signer-keyed dependency)
- **dao-single: execute authorizes owner from `event.agent`** — `dao-single.ts:121` — **[S1]**
  Fix: `signerIsParty("state.owner")` (and `state.pendingOwner` for accept_ownership) across all four owner-gated transitions; rebuild `dist/` + regenerate `json-archive/dao-single.json`.
- **governance-simple: proposal pass/fail decided by `event.forCount`** — `governance-simple.ts:282` — **[S2]**
  Attack: finalize compares attacker-supplied `forCount` to `members*passingThreshold`; `state.votes` never consulted → force pass or censor.
  Fix: derive the for-count from `state.votes` in **both** arms: `{>=:[length[filter[values(votes), vote=="for"]], {*:[size(members), passingThreshold]}]}` (and `<` for failed). Remove `forCount` from the schema.
- **governance-simple: irreversible dissolve gated on `event.approvalCount`** — `:508` — **[S2]**
  Fix: add a signed `approve` path recording `state.approvals` keyed by verified signer; dissolve guard counts `size(state.approvals) >= 0.9*size(members)` AND requires the trigger to be a member (`signerInSet`).
- **identity-oracle: activate has bare `event.adminOverride` bypass** — `identity-oracle.ts:220` — **[S2]**
  Fix: delete the `event.adminOverride` disjunct (and field); any escape hatch must be a pinned admin proven via `proofs[].address`.
- **identity-oracle: slash has NO authority — any party slashes full stake** — `:285` — **[one-off / missing-auth]**
  Attack: `and([event.reason, amount>0, amount<=stake])` — all data, no *who*-check. Any submitter burns any active oracle's stake. (`amount<=stake` is the correct direction; the bug is the **absent** authority.)
  Fix: add `state.slasher`/`state.governance`; require `{in:[state.slasher, map(proofs,address)]}` (or a pinned governance literal) in the `and`.
- **identity-oracle: reactivate authorizes by `event.agent`** — `:322` — **[S1]**
- **identity-oracle: withdraw (ACTIVE) gates stake reclamation on `event.agent`** — `:337` — **[S1]**
- **identity-oracle: withdraw (SLASHED) gates stake reclamation on `event.agent`** — `:353` — **[S1]**
  Fix: bind to `state.owner` (immutable) via `proofs[].address` membership; apply to all `event.agent===state.address` siblings (`:219,:236,:322`).

#### markets
- **market-auction: bid records winning-bidder identity from `event.agent`** — `market-auction.ts:173` — **[S1]** (effect-side)
  Attack: `highBidder`/`bids[].bidder := event.agent` (the address settlement pays) is taken verbatim → win under an address you do not control. (The seller-exclusion *guard* `signerIsNotParty("state.seller")` is **already correct** — do not touch it; amount comparisons are fine.)
  Fix: in the effect, `event.agent → proofs.0.address`; optionally require exactly one signer (`{===:[length(proofs),1]}`).
- **market-prediction: submit_resolution (CLOSED→RESOLVING) oracle auth on `event.agent`** — `market-prediction.ts:295` — **[S1]**
- **market-prediction: submit_resolution (RESOLVING→RESOLVING) auth + dedup on `event.agent`** — `:320` — **[S1]** (vary `event.agent` across whitelisted addresses to manufacture quorum)
  Fix both: `signerInSet("state.oracles")`; record `resolutions[].oracle` as the matched `proofs[].address`, and dedup on that — otherwise dedup never matches.
- **market-prediction: ruling settled entirely on bare `event.judicialRuling`** — `:415` — **[S2]**
  Fix: add immutable `arbiter`; guard `signerIsParty("state.arbiter")`; constrain `finalOutcome` to `state.outcomes`.
- **market-prediction: finalize takes settled outcome from `event.outcome` with no oracle binding** — `:368` — **[S2]** (settlement *target* attacker-controlled; even a correct quorum wouldn't constrain it)
  Fix: derive `finalOutcome` from a quorum-agreed value in `state.resolutions`; replace `size`→`count`/`length`; authorize via `signerInSet("state.oracles")`.
- **market-prediction: claim — payout recipient/dedup on `event.agent`, amount unvalidated** — `:473` — **[S1]**
  Fix: eligibility filter `{in:[agent, map(proofs,address)]}`; dedup the same proofs address; compute `amount` from state (pool share); record claimant from `proofs[].address`.
- **market-group-buy: claim_refund recipient/authority on `event.agent`** — `market-group-buy.ts:399` — **[S1]**
  Fix: `{some:[proofs, {and:[{>:[length(filter(orders, buyer==address)),0]}, {!:[in[address, refundsClaimed]]}]}]}`; append the matched verified signer; replace `size`→`length`.

---

### HIGH — Alignment

#### A1 — `$timestamp` → `$ordinal` (security-relevant where in a guard)
- **contract-escrow: every deadline guard + timestamp effect resolves to null** — `contract-escrow.ts:220` (guards `:270,:291,:334`; effects `:220,:236,:253–256,:277,:295,:338`) — **[A1]** (deadline/auto-release/expiry defeated; pair with the escrow security fixes). Apply identical fix to contract-agreement (8 sites).
- **dao-reputation: 10 reads → vote window always-true, proposals never close** — `dao-reputation.ts:189` — **[A1]** (rename `votingPeriodMs`→`votingPeriodOrdinals`)
- **dao-token: every deadline guard + `*At` wrong** — `dao-token.ts:201` — **[A1]** (`votingPeriodMs`/`timelockMs`→ordinal deltas; never fall back to `event.timestamp`)
- **market-auction: 9 sites; bid/close deadline logic dead** — `market-auction.ts:194` — **[A1]** (retype `deadline` from `timestamp`→`number`)
- **market-crowdfund: pledge window always-open, finalize never fires** — `market-crowdfund.ts:180` — **[A1]**
- **market-group-buy: order window unenforced, finalize unreachable** — `market-group-buy.ts:201` — **[A1]**
- **market-prediction: 12 sites incl. take_position/close guards** — `market-prediction.ts:201` — **[A1]**

#### A2 — Opcode drift
- **contract-agreement: finalize uses nonexistent `size` → never satisfiable, blocks COMPLETED** — `contract-agreement.ts:246` — **[A2]** Fix: `{">=":[{length:[{var:"state.completions"}]},2]}`; apply `size`→`length` to dao-multisig, market-crowdfund, market-group-buy. **Pair with CA-SEC-04**: submit_completion dedup (`:200–214`) keys on `event.agent` — once `length>=2` works, two forged agents from one signer satisfy it; dedup on `proofs[].address`. **[S1]**
- **corp-board: every array-append uses `cat` (string-only; rejects arrays)** — `corp-board.ts:472` (`:822,:955,:991`) — **[A2]** elect_director/record_attendance/adjourn all abort. Fix: `cat`→`merge`.
- **corp-securities: 4 `cat`-on-array effects error at runtime** — `corp-securities.ts:668` (`:741,:888,:931`) — **[A2]** Fix: outer array-append `cat`→`merge`; keep inner string `cat` (`"REPURCHASE-"+date`).
- **corp-entity: incorporate reads `.length` on arrays → 2 clauses always-false, lifecycle bricked at step 1** — `corp-entity.ts:452` — **[A2]** Fix: `{length:[{var:"state.incorporators"}]}` etc. Also fix `state.agenda.length` in corp-shareholders `:773,:806,:839` (itemNumber always 1).
- **dao-multisig: `setKey` not an opcode — map insertion silently mis-decodes** — `dao-multisig.ts:180` (`:213,:319,:357`) — **[A2]** Model `signatures` as an **array** of verified addresses; append with `cat`, count with `length`.
- **dao-multisig: `getKey` not an opcode — double-sign guard** — `:197` — **[A2]** Use `has`, keyed on verified signer.
- **dao-multisig: `size` not an opcode — 6 threshold guards** — `:202` — **[A2]** `length` (and `length[keys[…]]` for the map-shaped `signatures`).
- **dao-reputation: `size` not an opcode — execute/reject quorum** — `dao-reputation.ts:293` — **[A2]** `{length:[…]}` (wrap operand in array). *Systemic*: same `{size:…}` across dao-multisig, governance-simple, market-prediction, market-crowdfund, market-group-buy, contract-agreement.
- **dao-reputation: `cat` for array append (votes/members/history)** — `:241` — **[A2]** inner `cat`→`merge`.
- **dao-token: `getKey`/`setKey`/`deleteKey` + `for` — propose/vote/delegate/undelegate bricked** — `dao-token.ts:186` — **[A2]** Reads→`get`/`has`; **writes need data-model change**: voters/delegations as arrays, append with `cat`, filter for delete. Bare-map undelegate guard is always-true → must become `some` over the array.
- **governance-simple: `getKey`/`setKey`/`deleteKey`** — `governance-simple.ts:225` — **[A2]** membership-via-`getKey` is silently always-true (compounds GS-SEC-01/02). Restructure to arrays of `{address,…}`.
- **governance-simple: `size` in finalize/resolve/dissolve** — `:285` — **[A2]** `{length:[{keys:[…]}]}` (members/votes are objects; `length` rejects Maps).
- **market-prediction: `size` in 5 threshold/eligibility guards** — `:360` — **[A2]** `length`/`count`. *(Adjacent: `state.positions` is built as a map but filtered as an array — see med findings.)*

#### A3 — Dropped directives
- **corp-entity: dependencies use `{machine,instanceRef,requiredState}` (engine accepts `Set[UUID]` only)** — `corp-entity.ts:476` — **[A3]** Emit bare-UUID array; assert `machines.<uuid>.currentStateId=="EXECUTED"` in the guard; drop `instanceRef`. Same in corp-shareholders/-securities/-board.
- **corp-securities: dependencies object + `requiredState` inert; board-resolution gate is a no-op on chain** — `corp-securities.ts:587` — **[A3]** (compounds the constant-true guards)
- **corp-shareholders: schedule_annual dependencies silently dropped** — `corp-shareholders.ts:626` — **[A3]**
- **contract-escrow: transition-level `spawns` not recognized — Judiciary child never created** — `contract-escrow.ts:297` — **[A3]** This is *why* the ruling guard (ESC-SEC-06) has no arbiter behind it. Fix: emit `_spawn` from inside the effect with a full inline `definition`, a distinct `childId`, and `initialData`.
- **lending-zk-loan: collateral release/liquidation use transition-level `emits:[{event,to:"asset"}]` — never becomes an asset transfer** — `lending-zk-loan.ts:383` (`:429`) — **[A3]** Collateral is stranded forever (status-only change). Fix: emit `_transferAsset:[{assetId, recipient}]` from inside the effect of the **holding** fiber (R1 holder check); `recipient` = `state.borrower`/`state.lender`. `emits` is dropped by `toProtoDefinition` and unparsed by the chain.

#### A4 — SDK↔chain wire-type drift (engine-registry-alignment)
- **Genesis manifest emits `schemaShape` but chain requires `machineShape` (no default) — whole manifest fails to decode** — `genesis-manifest.ts:117` — **[A4]** *Hard failure — genesis bootstrap impossible.* Rename wrapper key (inner `{stateMessage,commands}` already equals `MachineShape`); regenerate `genesis/std-manifest.json`.
- **SDK `PublishVersion` doesn't exist on chain — split into `PublishMachineVersion` + `PublishScriptVersion`** — `types.ts:501` — **[A4]** *Hard failure — every registry-publish rejected.* Field is `machineShape`/`scriptShape`, not `schemaShape`. Fix interfaces, union, `OTTOCHAIN_MESSAGE_TYPES`, proto, regenerated TS.
- **`transaction.ts` default `accessControl:{type:'open'}` is not a valid `AccessControlPolicy`** — `transaction.ts:207` — **[A4]** *Hard failure on CreateScript decode.* Fix default to `{Public:{}}`; type params/message as `AccessControlPolicy` (note `types.ts:57` already models it correctly — only the helper diverges).

---

### MEDIUM

**[A1] `$timestamp`→`$ordinal` (silent null, no live guard):** contract-agreement `:160`; contract-universal `:84`; corp-entity `:463`; corp-securities `:654` (lockup deadline arm — borderline security, restricted transfer time-gate non-functional); corp-shareholders `:689`; dao-multisig `:174`; dao-single `:134`,`:156`; governance-simple `:194`; governance-universal `:101`; identity-agent `:206`; identity-oracle `:200`; identity-universal `:102`,`:115`,`:129`; market-universal `:98`. All fixes: swap to `$ordinal`, retype `timestamp`/`*Ms` schema fields. Several explicitly note higher-impact siblings exist elsewhere (dao-token, market guards) — handle in the repo-wide sweep.

**[A2] opcode drift (fail-closed liveness / silent corruption):**
- corp-entity: update_share_class uses **leading-dot relative var paths** (`.amendmentId`/`.classId`) → resolve to null; guard inverted, effect dead — `:525` — Fix: drop leading dots (bare element-field names). Also corp-board (17 occurrences), corp-shareholders (4).
- dao-reputation: `setKey` in join `memberJoinedAt` writes a literal object — `:420` — Redesign as array-of-records.
- market-prediction: take_position uses unsupported `__computed` dynamic-key → positions clobbered under literal key `"__computed"` — `:250` — Restructure positions as array-of-`{agent,outcome,amount}`.
- governance-universal: vote effect uses `__key`/`__value` (metakit `merge` has no such convention) — `:117` — Restructure votes as array; bind voter to `proofs[].address`.
- market-crowdfund: `size` in increase_pledge/claim_refund → both transitions dead (fail-closed) — `:220` — `count`/`length`.
- market-group-buy: `size` in claim_refund → refund path bricked (fail-closed DoS) — `:404` — `count`; fix predicate to test order `buyer` ∈ `proofs[].address`.

**[A3] dropped directives (med):**
- corp-board: `dependencies` object shape no-op (also tracked under CB-1 high) — `:641`
- dao-reputation: execute `emits` block dropped; wrong shape — `:332` — use `_triggers` (state-changing cross-machine call), resolve a real UUID, register dependency.

**[S1] identity-from-`event.agent` (med — no direct fund movement / mitigated by chain owner-gate):**
- dao-token: voter/proposer/delegator from `event.agent` — `:186` — **must fix together with the A2 opcode swap**, else inert→exploitable. Bind to `proofs.0.address`.
- governance-simple: member/admin auth on `event.agent` — `:185` — admin gates already use `signerInSet("state.admins")` correctly; fix the four *member-tier* gates to `signerInSet("state.members")` and stop reading acting identity from `event.*` in effects/dedup. (Also `getKey`→`get`/`has`.)
- governance-universal: voter identity from `event.agent`, guard `{"==":[1,1]}` — `:121` — bind to `proofs[].address`, add eligibility guard, drop `__key/__value`.
- identity-oracle: activate `:219`, add_stake `:236` authorize by `event.agent`; **record_resolution has no authority** and `event.correct` steers reputation `:254` — add a state-pinned `resolver`/market-fiber authority.
- market-crowdfund: claim_refund keys refund identity to `event.agent` `:308` — bind to `proofs[].address` (no `_transferAsset` wired → med).
- market-group-buy: order writes buyer-of-record from `event.agent` `:213` — `buyer := proofs.0.address`.

**[A1-class, witness-context] lending-zk-loan: origination zk gate reads `witness.*` in a transition where no `witness` key is injected** — `:331` — **[one-off]** The proof rides in `event.witness.*`; `witness` exists only in asset-guard contexts. groth16_verify over null fails → origination un-passable (**fail-closed**, hence med not high). Fix: read `event.witness.{publicValues,proof}` (Option A) or move the semi-private guard onto the debt-asset `mintPolicy` (Option B); parameterize `buildOriginationGuard`/`semiPrivateGuard` so the asset-context guard isn't copy-pasted into a transition.

**[S-replay] zk-guards: semiPrivateGuard proof is fully replayable — no action/fiber/ordinal/identity binding** — `guard.ts:42` — **[one-off]** Public values commit only `exprHash|dataHash|outputHash|ok`; nothing situational. A valid proof is a reusable bearer token (no on-chain nonce consumption). Fix: add a `usedNonces`-style one-time ledger keyed by `dataHash`/per-action nonce; bind identity/asset *inside the proven rule*; document the replay property until then. (No on-chain keccak opcode → cannot recompute dynamic `dataHash` in-guard.)

**[A4] wire-type drift (silent field loss on reads):**
- `RegisteredVersion.schemaShape` vs chain `shape: RegistryShape` (wrapped ADT) — `types.ts:199` — registry/version queries won't decode. (Scope caution: do **not** blanket-rename publish-side `schemaShape`.)
- `RegistryTarget` missing `AssetPolicyPackage` — `.asset` entries undecodable — `types.ts:230`
- `FiberLogEntry` missing `RejectionReceipt` — rejected-update logs dropped at decode + bypass filters — `types.ts:331`
- `UpgradeScript` message missing — can't upgrade a script fiber — `types.ts:546`
- `CreateScript` missing `schemaRef` — no verified-binding script create — `types.ts:463`

---

### LOW

- **corp-board: elect_director vacancy bypass reads `event.isFillingVacancy`** — `:443` — **[S1/S2]** Attacker boolean drives `vacant` negative (over-fills board). Fix: gate solely on `{">":[state.seats.vacant,0]}`.
- **corp-entity: 4 privileged transitions guarded by `{"==":[1,1]}`** (registered-agent change, suspend, reinstate, administrative dissolve) — `:584` — **[S2/missing-auth]** Bind to a registered signer set or dependency state.
- **governance-universal: every transition unguarded; permissionless terminal dissolve** — `:94` — **[missing-auth]** Add `state.admins` + `proofs[].address` gate.
- **identity-universal: no owner authorization; constant-true guards; terminal deactivate is griefable** — `:98` — **[missing-auth]** Gate each owner-only transition on `signerIsParty("state.owner")`.
- **[A1] dao-single** accept_ownership `:182`, dissolve `:220` (`$timestamp`→`$ordinal`).
- **[A3] dao-token** transition-level `emits:[{event,to}]` never read — `:399` — use `_emit` `{name,data,destination}` or remove.
- **[A3] lending-zk-loan** EmitSpec `{event,to,payload}` matches neither `_emit` nor `_triggers` even where an emit applies — `:384`.
- **[A1] market-universal** `$timestamp` at `:111`,`:141`,`:154`,`:167` (close/settle/cancel effect fields).
- **zk-guards: generic semiPrivateGuard omits the ok-bit clause** that `buildOriginationGuard` enforces — `guard.ts:52` — **[one-off]** add `{===:[substr(witness.publicValues,256,2),'01']}` for defense-in-depth, or document the intentional reliance on `outputHash`.
- **[A4] StateMachineFiberRecord** missing `authorizedSigners` — `types.ts:341`; **ScriptFiberRecord** missing `schemaBinding` — `types.ts:363`; **OnChain/CalculatedState** missing asset state (`assetCommits`/`assets`/`usedNonces`) — `types.ts:398`. Decode-tolerant; additive fixes + regenerate.

---

### INFO
- **contract-universal: all guards `{"==":[1,1]}`** — **[S2, by-design template]** — `:80` — Not a forgeable-target bug (no `event.*` read); a deliberately open template. Document: integrators must add a `proofs[].address` authority before shipping for value.
- **corp-entity: transition-level `emits[]` decorative** — **[A3]** — `:467` — Never reach the chain; use `_emit`/`_triggers` if firing is intended.
- **engine-registry-alignment: standalone `SchemaShape` type now orphaned (it is `MachineShape`, wrapped in `RegistryShape.Machine`)** — **[A4]** — `types.ts:164` — Rename for consistency with ALIGN-2/ALIGN-5.

---

## 3. Prioritized Remediation Plan

### Tier (i) — Guard-level name-swaps & op swaps doable NOW (no chain/schema change)
These are pure SDK-definition edits using already-supported reserved vars and opcodes. They fix the **majority of high-severity findings** and should ship first.

1. **S1/S2 authorization rebind → `proofs[].address`.** Mechanically replace every `{"===":[event.agent, state.X]}` / `{"in":[event.agent, state.X]}` / bare `event.judicialRuling|mutualConsent|adminOverride|signatureCount|forCount|approvalCount|isFillingVacancy` with the existing `src/schema/guards.ts` helpers (`signerIsParty`, `signerInSet`, `signerIsNotParty`) and **derive recorded identities/dedup keys from `proofs[].address` in effects**. Covers: all contract-escrow auth (`:213/231/244/269/290/346`), contract-agreement resolve mutual-consent path + CA-SEC-04 dedup, dao-multisig (auth + sign counting; dissolve unanimity), dao-reputation join/vote/leave/propose, dao-single, governance-simple finalize/dissolve tallies + member gates, identity-oracle reactivate/withdraw/activate/add_stake/record_resolution, market-auction bidder, market-prediction submit_resolution/claim, market-group-buy/crowdfund refund, dao-token, governance-universal vote, identity-universal, corp-entity literal-true transitions, corp-board vacancy. *(For the **judicial/arbiter** disjuncts and **slash/record_resolution** authority, Tier (i) only gets you the signer-membership check against a state-held authority — see (ii)/(iii) if that authority field doesn't exist yet.)*

2. **A2 opcode swaps.** `size`→`length`/`count` (wrap operand; use `length[keys[…]]` for Maps); `getKey`→`get`, double-sign→`has`; `cat`-on-arrays→`merge` (or `cat` where the model is already array-shaped); fix leading-dot relative var paths (`.classId`→`classId`); `.length` path segment→`length` opcode. Covers contract-agreement finalize, corp-board/-securities array appends, corp-entity incorporate, governance-simple, dao-reputation, market-prediction quorum.

3. **A1 `$timestamp`→`$ordinal`** repo-wide (≈33 files), with `*Ms`/`timestamp` schema fields re-documented/retyped as ordinal deltas/bounds. Prioritize the *guard* sites (escrow/market deadline gates, dao-token/dao-reputation windows) — those are security-relevant, not just cosmetic.

4. **A3 directive relocation that needs no new chain feature:** move `emits`→`_emit`/`_triggers` and asset moves→`_transferAsset` *inside the effect result* (lending-zk-loan collateral release/liquidation; dao-reputation/dao-token emits; corp-entity decorative emits); remove the transition-level `spawns`/`emits`/object-`dependencies` sugar. Convert object `dependencies` to bare-UUID arrays **and** assert `machines.<uuid>.currentStateId=="EXECUTED"` in the guard.

5. **A4 hard-decode fixes** that are local SDK edits + regen: genesis `schemaShape`→`machineShape` (+ regenerate `std-manifest.json`); `transaction.ts` `accessControl` default `{Public:{}}`; `PublishVersion`→`PublishMachineVersion`/`PublishScriptVersion`.

> **Coupling rule (must-do):** for dao-token, governance-simple, dao-reputation, market-prediction — land the **A2 opcode swap and the S1 identity rebind in the same change**. Fixing the opcode alone converts an inert (always-true/always-throw) guard into a *live, exploitable* `event.agent` authorization.

### Tier (ii) — Needs a new reserved/state authority var or a chain feature
These require adding an **immutable authority field to state/createSchema** (populated at create/dispute-open from a chain-authoritative source), or a chain mechanism that doesn't exist yet. The guard *shape* is Tier-(i)-ready, but it has nothing trustworthy to bind against until the field/feature lands.

1. **Pinned arbiter / judiciary authority** for all judicial settlement paths: contract-escrow ruling (`arbiter` + dispute-open population + the no-op `_spawn` Judiciary), contract-agreement resolve judicial disjunct (`arbitrator`/`arbitrationPoolId`), market-prediction ruling (`arbiter`). Needs the spawn/pool-dependency wiring to actually establish the authority.
2. **Pinned slasher / resolver / issuer authority**: identity-oracle `slasher`/`governance` (slash) and `resolver`/market-fiber (record_resolution); corp-securities `issuerAddress`/`holder.walletAddress`; corp-entity `charterAuthority`/`boardAuthority`/`shareholderAuthority`; corp-board `authorizedRemovers`; corp-shareholders `EligibleVoter.address` + hardened registrar.
3. **Chain-authoritative reputation source**: dao-reputation join/vote/propose must read reputation from a declared Reputation **dependency** (`machines.<id>.state…`) keyed to the verified signer, or a verified witness — the engine context exposes no reputation today.
4. **One-time proof consumption (`usedNonces`-style ledger) for semi-private zk proofs** (zk-guards replay) — a chain combiner mechanism analogous to `AuthorizeCompose.consumeNonce`, since there is no on-chain keccak opcode to bind `$ordinal`/signer in-guard.
5. **Build-time guard/lint surface (SDK feature):** reject unknown `$`-prefixed reserved keys and operator tags not in `JsonLogicOp.knownOperatorTags`; add typed `_spawn`/`_emit`/`_transferAsset` surfaces so misplaced directives fail authoring instead of silently dropping. Prevents regression of A1/A2/A3 across all apps.

### Tier (iii) — Needs circuit / public-values / wire-schema changes
Structural changes to proofs or to the SDK↔chain protobuf/record schemas; require regen and (for zk) circuit/guest changes.

1. **zk public-values redesign** (zk-guards, hardening beyond the Tier-(ii) nonce ledger): commit situational facts (assetId, recipient/spender, fiber, `$ordinal`, nonce) **inside the proven rule's public values** so cross-identity/cross-asset forwarding is impossible — the current 4-word blob commits nothing situational. Extend the `reputationCreditRule` `subject===borrowerId` pattern to pin spender/asset as public.
2. **Wire-schema additions + regen** (engine-registry-alignment reads): `RegisteredVersion.shape: RegistryShape` (rename + retype the ADT), `RegistryTarget.AssetPolicyPackage`, `FiberLogEntry.RejectionReceipt`, `UpgradeScript` message, `CreateScript.schemaRef`, and the record/state additions (`authorizedSigners`, `schemaBinding`, `assetCommits`/`assets`/`usedNonces`). Each requires editing the proto, regenerating `src/generated/**`, and adding decode fixtures — not hand-patching generated TS.
3. **Schema/data-model restructures** that ride alongside Tier-(i) opcode fixes but change persisted shape (and therefore any indexers/consumers): votes/voters/delegations/positions/signatures from **dynamic-key maps → arrays of records** (dao-token, governance-simple, governance-universal, market-prediction, dao-multisig) — required because no JLVM op synthesizes a runtime map key. Coordinate with downstream readers since the on-chain state shape changes.

---

*Report files referenced (all absolute):* the 28 state-machine definitions under `/home/euler/repos/ottochain-sdk/src/apps/*/state-machines/`, the guard builders at `/home/euler/repos/ottochain-sdk/src/schema/guards.ts`, the wire types at `/home/euler/repos/ottochain-sdk/src/ottochain/{types.ts,transaction.ts,genesis-manifest.ts}`, the zk guards at `/home/euler/repos/ottochain-sdk/src/zk/{guard.ts,types.ts,eligibility.ts}`, and the generated protos under `/home/euler/repos/ottochain-sdk/src/generated/ottochain/v1/`.