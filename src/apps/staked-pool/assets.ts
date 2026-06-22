/**
 * Asset-subsystem integration for the staked-pool family.
 *
 * Two asset roles:
 *   - STAKE token: a governed fungible. Joining is a custody `Transfer` of the whole stake instance into
 *     `AssetHolder.Fiber(poolId)` (the loan family's "lock = Transfer into Fiber holder" pattern); the
 *     pool's `stake_and_join` guard verifies the custody via `heldAssets` (H5). Withdraw/slash move it back
 *     out via the fiber's `_transferAsset` directive.
 *   - REWARD token: a shared fungible the pool pre-holds. `claim_reward` moves ONE whole reward instance to
 *     a verified in-consensus claimant (per-claim model — the whole-asset transfer has no amount field).
 *
 * Reuses the lending family's asset payload builders (`createAssetPolicyPayload`, `createMintAssetPayload`,
 * `createApplyMorphismPayload`, `fiberHolder`, `walletHolder`) — re-exported here so a staked-pool caller
 * has a single import surface.
 */

import {
  createAssetPolicyPayload,
  createMintAssetPayload,
  createApplyMorphismPayload,
  fiberHolder,
  walletHolder,
  TokenBehaviors,
  type CreateAssetPolicyParams,
  type MintAssetMessage,
  type ApplyMorphismMessage,
  type PolicyRef,
  type JsonLogicRule,
} from "../lending/assets.js";

export {
  createAssetPolicyPayload,
  createMintAssetPayload,
  createApplyMorphismPayload,
  fiberHolder,
  walletHolder,
  TokenBehaviors,
};
export type { CreateAssetPolicyParams, MintAssetMessage, ApplyMorphismMessage, PolicyRef, JsonLogicRule };

/**
 * Stake-token policy: a governed fungible. `Transfer` is the custody move into/out of the pool fiber.
 * Transferable so withdraw/slash can return it (a soulbound stake would fail the R1 transferable check
 * on withdraw — see design §11; not the default here).
 */
export function stakePolicy(
  name = "staked-pool-stake-v1.asset",
  version = "1.0.0",
): CreateAssetPolicyParams {
  return {
    name,
    version,
    behavior: TokenBehaviors.GovernedFungible,
    supply: {
      maxSupply: null,
      mintPolicy: null,
      // Only the holder may burn their own stake (defensive; the pool moves it via Transfer, not Burn).
      burnPolicy: { in: [{ var: "holder.Wallet.address" }, { var: "signers" }] },
      decimals: 0,
    },
    morphisms: {
      // Custody Transfer is the join/withdraw mechanism; gated so the pool fiber authorizes movement.
      Transfer: { visibility: "Public" },
      Burn: { visibility: "Public" },
    },
    stateShape: {},
    metadata: { family: "staked-pool", role: "stake" },
  };
}

/**
 * Reward-pot policy: a shared fungible the pool pre-holds and pays out one whole instance per claim.
 * `mintGuard` (optional) gates who may mint reward instances into the pool (e.g. the pool authority);
 * omit for an open mint pinned operationally.
 */
export function rewardPotPolicy(
  mintGuard: JsonLogicRule | null = null,
  name = "staked-pool-reward-v1.asset",
  version = "1.0.0",
): CreateAssetPolicyParams {
  return {
    name,
    version,
    behavior: TokenBehaviors.Fungible,
    supply: {
      maxSupply: null,
      mintPolicy: mintGuard,
      burnPolicy: null,
      decimals: 0,
    },
    morphisms: {
      Transfer: { visibility: "Public" },
    },
    stateShape: {},
    metadata: { family: "staked-pool", role: "reward" },
  };
}

/**
 * stake_and_join driver: the participant Transfers their whole stake instance into the pool fiber BEFORE
 * the `stake_and_join` event (custody = Transfer to `AssetHolder.Fiber`). Mirrors `lockCollateralOp`.
 */
export function stakeJoinOp(args: {
  stakeAssetId: string;
  poolFiberId: string;
  targetSequenceNumber: number;
}): ApplyMorphismMessage {
  return createApplyMorphismPayload({
    assetId: args.stakeAssetId,
    kind: "Transfer",
    recipient: fiberHolder(args.poolFiberId),
    targetSequenceNumber: args.targetSequenceNumber,
  });
}

/**
 * Pre-mint reward instances into the pool fiber (sized to expected claimants for the epoch). Mirrors
 * `mintPrincipalOp` but mints to `Fiber(poolId)` so `claim_reward` can later transfer one whole instance.
 */
export function mintRewardInstancesOp(args: {
  rewardAssetId: string;
  rewardPolicyRef: PolicyRef;
  poolFiberId: string;
  amount: number | string;
  witness?: { publicValues: string; proof: string };
}): MintAssetMessage {
  return createMintAssetPayload({
    assetId: args.rewardAssetId,
    policyRef: args.rewardPolicyRef,
    holder: fiberHolder(args.poolFiberId),
    amount: args.amount,
    ...(args.witness ? { witness: args.witness } : {}),
  });
}
