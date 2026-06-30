/**
 * Staked-pool Application — a reusable staked-epoch-pool std-lib BASE plus an oracle-pool specialization.
 *
 * The base is a long-lived account-layer fiber proving the chain can carry real economic coordination:
 * registry-gated, stake-backed membership; an append-only submission array; a state-resident claim
 * entitlement ledger (zero finalize-time transfers); and one-whole-asset claim/withdraw custody moves.
 * The oracle specialization adds an outlier-bounded (trimmed-mean) consensus aggregation whose published
 * answer a consumer reads cross-fiber via an epoch-pinned `depInState(SETTLED)` gate.
 *
 * Composes EXISTING SDK primitives only (+ two helpers added this workstream — `transferAsset`,
 * `actorNotInArray`): `signerIsParty` / `actorIsSigner` / `signerHasReputationVia` / `depInState`
 * (`src/schema/guards.ts`), `addDependency` / `transferAsset` (`src/schema/effects.ts`), and the lending
 * family's asset payload builders (`src/apps/lending/assets.ts`).
 *
 * @example
 * ```typescript
 * import {
 *   getStakedPoolDefinition,
 *   makeOraclePoolDef,
 *   stakePolicy,
 *   rewardPotPolicy,
 *   bindAndPinPoolEpoch,
 *   poolSettledForPinnedEpoch,
 *   readPoolResultValue,
 * } from '@ottochain/sdk/apps/staked-pool';
 *
 * const oracle = getStakedPoolDefinition('oraclePool');
 * const plainMean = makeOraclePoolDef({ aggregation: 'mean' });
 * const stake = stakePolicy();
 * ```
 *
 * @packageDocumentation
 */

import { stakedPoolBaseDef, stakedPoolOracleDef } from './state-machines/index.js';
import type { FiberAppDefinition } from '../../schema/fiber-app.js';

export { stakedPoolBaseDef, stakedPoolOracleDef };

/** All staked-pool state machine definitions. */
export const STAKED_POOL_DEFINITIONS = {
  base: stakedPoolBaseDef,
  oraclePool: stakedPoolOracleDef,
} as const;

export type StakedPoolType = keyof typeof STAKED_POOL_DEFINITIONS;

/**
 * Get a staked-pool state machine definition by type.
 * @param type - 'base' | 'oraclePool' (default: 'oraclePool')
 */
export function getStakedPoolDefinition(type: StakedPoolType = 'oraclePool'): FiberAppDefinition {
  return STAKED_POOL_DEFINITIONS[type];
}

// ---------------------------------------------------------------------------
// Factory + base building blocks (for downstream specializations)
// ---------------------------------------------------------------------------
export { makeStakedPoolDef, defaultSubmitArm, baseInitialStateData, type StakedPoolOverrides } from './base.js';

export { makeOraclePoolDef, type OracleAggregation, type OraclePoolOptions } from './state-machines/index.js';

// ---------------------------------------------------------------------------
// Asset-subsystem integration (stake + reward policies / lifecycle drivers)
// ---------------------------------------------------------------------------
export {
  stakePolicy,
  rewardPotPolicy,
  stakeJoinOp,
  mintRewardInstancesOp,
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
} from './assets.js';

// ---------------------------------------------------------------------------
// Cross-fiber consumer-read interface ("pull the answer", epoch-pinned)
// ---------------------------------------------------------------------------
export { bindAndPinPoolEpoch, poolSettledForPinnedEpoch, readPoolResult, readPoolResultValue } from './consumer.js';
