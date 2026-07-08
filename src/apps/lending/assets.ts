/**
 * Asset-subsystem integration for the lending family.
 *
 * The loan's collateral, principal/debt, and repayment are ASSETS. This module provides
 * typed payload builders for the OttoChain asset operations and loan-specific helpers that
 * map the zk-loan lifecycle onto typed asset morphisms.
 *
 * Wire shapes mirror the asset-model proposal
 * (`/home/euler/repos/ottochain/docs/proposals/asset-model.md` §7 — `CreateAssetPolicy`,
 * `MintAsset`, `ApplyMorphism`, `AuthorizeCompose`; §8 — Governed/ZkVerify-gated morphisms)
 * and follow the SDK's existing single-key-wrapper convention (the discriminator is the outer
 * key, e.g. `{ MintAsset: {...} }`), matching `src/ottochain/transaction.ts`
 * (`createTransitionPayload`, `createScriptPayload`, ...). The asset op-codes are not yet a
 * merged TypeScript SDK surface; these builders let the lending app construct the proposed
 * wire format today and sign it with the existing `signTransaction` path.
 *
 * Amounts are `Long` on-chain; modeled here as `number` for SDK ergonomics (callers may pass a
 * string for values beyond 2^53 — the field is serialized verbatim).
 */

// ---------------------------------------------------------------------------
// Asset model value types (proposal-faithful)
// ---------------------------------------------------------------------------

/** A holder of an asset: a wallet address, or a custody fiber (the escrow). */
export type AssetHolder = { Wallet: { address: string } } | { Fiber: { fiberId: string } };

/** Helpers for the two-variant holder. */
export const walletHolder = (address: string): AssetHolder => ({ Wallet: { address } });
export const fiberHolder = (fiberId: string): AssetHolder => ({ Fiber: { fiberId } });

/** 5-bit token behavior lattice (T/S/C ascending, E/G descending). asset-model.md §2. */
export interface TokenBehavior {
  transferable: boolean;
  splittable: boolean;
  combinable: boolean;
  expirable: boolean;
  governable: boolean;
}

/** Pack a {@link TokenBehavior} to its 5-bit integer (T=16 S=8 C=4 E=2 G=1). */
export function behaviorBits(b: TokenBehavior): number {
  return (
    (b.transferable ? 16 : 0) |
    (b.splittable ? 8 : 0) |
    (b.combinable ? 4 : 0) |
    (b.expirable ? 2 : 0) |
    (b.governable ? 1 : 0)
  );
}

/** Common behavior presets (asset-model.md §2). */
export const TokenBehaviors = {
  /** Non-transferable, non-divisible (bits 0). */
  Soulbound: {
    transferable: false,
    splittable: false,
    combinable: false,
    expirable: false,
    governable: false,
  } as TokenBehavior,
  /** Transferable only (bits 16). */
  NFT: {
    transferable: true,
    splittable: false,
    combinable: false,
    expirable: false,
    governable: false,
  } as TokenBehavior,
  /** Transferable + splittable + combinable (bits 28 = TSC). */
  Fungible: {
    transferable: true,
    splittable: true,
    combinable: true,
    expirable: false,
    governable: false,
  } as TokenBehavior,
  /** Fungible + governable (bits 29 = TSCG) — the default for a gated debt token. */
  GovernedFungible: {
    transferable: true,
    splittable: true,
    combinable: true,
    expirable: false,
    governable: true,
  } as TokenBehavior,
} as const;

/** A JSON-Logic expression (guard/policy). */
export type JsonLogicRule = Record<string, unknown>;

/** Supply policy: cap, mint/burn JSON-Logic guards, decimals. asset-model.md §3. */
export interface SupplyPolicy {
  /** Hard cap; null = uncapped. */
  maxSupply?: number | string | null;
  /** Mint guard (JSON-Logic); null = minting closed after genesis. */
  mintPolicy?: JsonLogicRule | null;
  /** Burn guard (JSON-Logic); null = no burning. */
  burnPolicy?: JsonLogicRule | null;
  /** Fungible decimals; null/0 for NFTs. */
  decimals?: number | null;
}

/** Morphism kinds. asset-model.md §4. */
export type MorphismKind = 'Transfer' | 'Burn' | 'Fractionalize' | 'Compose' | 'Decompose' | 'Wrap' | 'Stake';

/** Morphism visibility — Governed carries a JSON-Logic guard. asset-model.md §8. */
export type MorphismVisibility = 'Public' | 'Governed' | 'Disabled';

/** Per-kind morphism spec on a policy version. asset-model.md §7. */
export interface MorphismSpec {
  visibility: MorphismVisibility;
  /** Counter-party policy allowlist; omit for any. */
  allowedPolicies?: string[];
  /** Counter-party behavior-bitmask allowlist; omit for any. */
  allowedTypes?: number[];
  /** JSON-Logic guard (Governed only). */
  guard?: JsonLogicRule;
}

/** A version requirement for resolving a policy. mirrors SDK `VersionReq`. */
export type VersionReq =
  | { Exact: { version: string } }
  | { Caret: { version: string } }
  | { Tilde: { version: string } }
  | { Latest: Record<string, never> }
  | { PinnedHash: { hash: string } };

/** A policy reference `(name, versionReq)`. mirrors SDK `SchemaRef`. */
export interface PolicyRef {
  name: string;
  version: VersionReq;
}

// ---------------------------------------------------------------------------
// Asset operation payloads (single-key-wrapper, like src/ottochain/transaction.ts)
// ---------------------------------------------------------------------------

export interface CreateAssetPolicyParams {
  /** `.asset` registry name, e.g. "collateral-vault-v1.asset". */
  name: string;
  version: string;
  behavior: TokenBehavior;
  supply: SupplyPolicy;
  morphisms: Partial<Record<MorphismKind, MorphismSpec>>;
  /** The asset record's state shape (proto message shape); free-form here. */
  stateShape: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export interface CreateAssetPolicyMessage {
  CreateAssetPolicy: {
    name: string;
    version: string;
    behavior: TokenBehavior;
    supply: SupplyPolicy;
    morphisms: Partial<Record<MorphismKind, MorphismSpec>>;
    stateShape: Record<string, unknown>;
    metadata?: Record<string, string>;
  };
}

/** Publish an asset policy package version. asset-model.md §7. */
export function createAssetPolicyPayload(params: CreateAssetPolicyParams): CreateAssetPolicyMessage {
  return {
    CreateAssetPolicy: {
      name: params.name,
      version: params.version,
      behavior: params.behavior,
      supply: params.supply,
      morphisms: params.morphisms,
      stateShape: params.stateShape,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    },
  };
}

export interface MintAssetParams {
  /** The new asset instance id (UUID). */
  assetId: string;
  policyRef: PolicyRef;
  holder: AssetHolder;
  amount: number | string;
  expiresAt?: number;
  /** Witness the policy's `mintPolicy` guard reads (e.g. a Groth16 eligibility proof). */
  witness?: Record<string, unknown>;
}

export interface MintAssetMessage {
  MintAsset: {
    assetId: string;
    policyRef: PolicyRef;
    holder: AssetHolder;
    amount: number | string;
    expiresAt?: number;
    witness?: Record<string, unknown>;
  };
}

/**
 * Mint an asset instance. asset-model.md §7. When the policy's `mintPolicy` is a
 * `groth16_verify` guard (proof-gated mint), pass the eligibility `witness`.
 */
export function createMintAssetPayload(params: MintAssetParams): MintAssetMessage {
  return {
    MintAsset: {
      assetId: params.assetId,
      policyRef: params.policyRef,
      holder: params.holder,
      amount: params.amount,
      ...(params.expiresAt !== undefined ? { expiresAt: params.expiresAt } : {}),
      ...(params.witness ? { witness: params.witness } : {}),
    },
  };
}

export interface ApplyMorphismParams {
  assetId: string;
  kind: MorphismKind;
  targetSequenceNumber: number;
  recipient?: AssetHolder;
  otherAssets?: string[];
  compositeId?: string;
  shardIds?: string[];
  nonce?: number;
  /** Witness a Governed morphism's `guard` reads. */
  witness?: Record<string, unknown>;
}

export interface ApplyMorphismMessage {
  ApplyMorphism: {
    assetId: string;
    kind: MorphismKind;
    targetSequenceNumber: number;
    recipient?: AssetHolder;
    otherAssets?: string[];
    compositeId?: string;
    shardIds?: string[];
    nonce?: number;
    witness?: Record<string, unknown>;
  };
}

/**
 * Apply a typed morphism (Transfer / Burn / Compose / ...). asset-model.md §7.
 * Transfer = `{ kind: "Transfer", recipient }`; Burn (repay) = `{ kind: "Burn" }`.
 *
 * C2 — a `Compose`/`Pool` that folds in a counter-party the signer does NOT own is now rejected on-chain
 * unless a live `AuthorizeCompose` nonce authorizes it: pass that nonce here (`nonce`) and build the commit
 * half with {@link createAuthorizeComposePayload}. A same-holder compose (all parts signer-owned) needs no
 * nonce. `otherAssets` must be duplicate-free and must not include `assetId`.
 */
export function createApplyMorphismPayload(params: ApplyMorphismParams): ApplyMorphismMessage {
  return {
    ApplyMorphism: {
      assetId: params.assetId,
      kind: params.kind,
      targetSequenceNumber: params.targetSequenceNumber,
      ...(params.recipient ? { recipient: params.recipient } : {}),
      ...(params.otherAssets ? { otherAssets: params.otherAssets } : {}),
      ...(params.compositeId ? { compositeId: params.compositeId } : {}),
      ...(params.shardIds ? { shardIds: params.shardIds } : {}),
      ...(params.nonce !== undefined ? { nonce: params.nonce } : {}),
      ...(params.witness ? { witness: params.witness } : {}),
    },
  };
}

export interface AuthorizeComposeParams {
  assetId: string;
  partnerPolicy: string;
  nonce: number;
  expiresAt: number;
  targetSequenceNumber: number;
}

export interface AuthorizeComposeMessage {
  AuthorizeCompose: {
    assetId: string;
    partnerPolicy: string;
    nonce: number;
    expiresAt: number;
    targetSequenceNumber: number;
  };
}

/**
 * Commit half of a two-party (cross-holder) compose. asset-model.md §7/§8. As of chain finding C2 this
 * handshake is MANDATORY: a cross-holder `Compose`/`Pool` is rejected unless a matching, unexpired nonce
 * from this call is live for the counter-party. The composing party then echoes `nonce` in its
 * `ApplyMorphism`. A same-holder compose (all parts owned by the signer) does not need this.
 */
export function createAuthorizeComposePayload(params: AuthorizeComposeParams): AuthorizeComposeMessage {
  return {
    AuthorizeCompose: {
      assetId: params.assetId,
      partnerPolicy: params.partnerPolicy,
      nonce: params.nonce,
      expiresAt: params.expiresAt,
      targetSequenceNumber: params.targetSequenceNumber,
    },
  };
}

// ---------------------------------------------------------------------------
// Loan-specific asset policy builders
// ---------------------------------------------------------------------------

/**
 * The collateral vault policy: an NFT-like custodial holding (no fungible split) whose
 * `Transfer` morphism is Governed — the loan/escrow fiber is the authorization. Locking is
 * a custody Transfer into `AssetHolder.Fiber(escrow)`; release/liquidation is a Transfer out
 * driven by the loan fiber's REPAID / LIQUIDATED transition (`_transferAsset`).
 */
export function collateralPolicy(name = 'collateral-vault-v1.asset', version = '1.0.0'): CreateAssetPolicyParams {
  return {
    name,
    version,
    behavior: { transferable: true, splittable: false, combinable: false, expirable: false, governable: true },
    supply: { maxSupply: null, mintPolicy: null, burnPolicy: null, decimals: 0 },
    morphisms: {
      Transfer: { visibility: 'Governed' },
      Burn: { visibility: 'Disabled' },
      Compose: { visibility: 'Disabled' },
    },
    stateShape: {},
    metadata: { family: 'lending', role: 'collateral' },
  };
}

/**
 * The loan-debt / principal policy: a governed fungible whose `mintPolicy` is the
 * proof-gated origination guard — the principal is mintable to the borrower only when the
 * eligibility proof verifies. Repayment is a `Burn` governed by `burnPolicy`.
 *
 * @param mintGuard the origination guard (see `buildOriginationGuard`) — a `groth16_verify`
 *   expression bound to the pinned public lending rule.
 */
export function debtPolicy(
  mintGuard: JsonLogicRule,
  name = 'loan-debt-v1.asset',
  version = '1.0.0',
): CreateAssetPolicyParams {
  return {
    name,
    version,
    behavior: TokenBehaviors.GovernedFungible,
    supply: {
      maxSupply: null,
      // Proof-gated mint: principal is minted only if the eligibility proof verifies.
      mintPolicy: mintGuard,
      // Repayment burns the debt; only the holder (borrower) may burn theirs. The asset context has
      // no `event` key — bind to the verified `signers` (chain-derived from the op's proofs).
      burnPolicy: { in: [{ var: 'holder.Wallet.address' }, { var: 'signers' }] },
      decimals: 2,
    },
    morphisms: {
      Transfer: { visibility: 'Public' },
      Burn: { visibility: 'Public' },
    },
    stateShape: {},
    metadata: { family: 'lending', role: 'debt' },
  };
}

// ---------------------------------------------------------------------------
// Loan lifecycle → asset morphism drivers
// ---------------------------------------------------------------------------

/**
 * lock_collateral: custody Transfer of the pledged collateral into the loan escrow fiber.
 * (asset-model.md §10 — locking is a custody transfer to `AssetHolder.Fiber`, there is no
 * `Lock` morphism.)
 */
export function lockCollateralOp(args: {
  collateralAssetId: string;
  escrowFiberId: string;
  targetSequenceNumber: number;
}): ApplyMorphismMessage {
  return createApplyMorphismPayload({
    assetId: args.collateralAssetId,
    kind: 'Transfer',
    recipient: fiberHolder(args.escrowFiberId),
    targetSequenceNumber: args.targetSequenceNumber,
  });
}

/**
 * originate: Mint the loan principal/debt to the borrower. The policy's `mintPolicy`
 * (the origination guard) reads the eligibility `witness` ({publicValues, proof}).
 */
export function mintPrincipalOp(args: {
  debtAssetId: string;
  debtPolicyRef: PolicyRef;
  borrower: string;
  principalAmount: number | string;
  witness: { publicValues: string; proof: string };
}): MintAssetMessage {
  return createMintAssetPayload({
    assetId: args.debtAssetId,
    policyRef: args.debtPolicyRef,
    holder: walletHolder(args.borrower),
    amount: args.principalAmount,
    witness: args.witness,
  });
}

/** repay: Burn the borrower's debt token (the principal is repaid). */
export function repayBurnOp(args: { debtAssetId: string; targetSequenceNumber: number }): ApplyMorphismMessage {
  return createApplyMorphismPayload({
    assetId: args.debtAssetId,
    kind: 'Burn',
    targetSequenceNumber: args.targetSequenceNumber,
  });
}

/**
 * release / liquidate: Transfer the escrowed collateral out of the escrow fiber to a
 * recipient (the borrower on REPAID, the lender on LIQUIDATED). On-chain this is emitted by
 * the loan fiber's transition via `_transferAsset`; this builder produces the equivalent
 * explicit `ApplyMorphism(Transfer)` for off-fiber/manual settlement.
 */
export function settleCollateralOp(args: {
  collateralAssetId: string;
  recipient: string;
  targetSequenceNumber: number;
}): ApplyMorphismMessage {
  return createApplyMorphismPayload({
    assetId: args.collateralAssetId,
    kind: 'Transfer',
    recipient: walletHolder(args.recipient),
    targetSequenceNumber: args.targetSequenceNumber,
  });
}
