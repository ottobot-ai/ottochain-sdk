/**
 * Lending Application — privacy-preserving credit & lending on OttoChain.
 *
 * The lending family hosts private-finance fibers whose financial state stays private while
 * eligibility is proven in zero-knowledge. The collateral, principal, and repayment are
 * asset-subsystem tokens driven by the fiber lifecycle.
 *
 * Variants:
 *   - `zkLoan` — a collateralized loan whose origination is gated by a zk eligibility proof
 *     (collateral coverage / credit-score floor) without revealing the borrower's financials.
 *
 * The name `lending` (vs. `loans`) deliberately generalizes for the future credit family —
 * credit lines, BNPL, bonds, escrowed credit — mirroring how `markets` hosts prediction /
 * auction / crowdfund variants under one app.
 *
 * @example
 * ```typescript
 * import {
 *   getLendingDefinition,
 *   pinLendingRule,
 *   buildOriginationGuard,
 *   buildEligibilityWitness,
 *   debtPolicy,
 *   collateralPolicy,
 * } from '@ottochain/sdk/apps/lending';
 *
 * const loanDef = getLendingDefinition('zkLoan');
 *
 * // Pin the public rule + build the proof-gated origination guard.
 * const pinned = pinLendingRule({ collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 680 }, vkey);
 * const guard = buildOriginationGuard();
 * const debt = debtPolicy(guard);
 * ```
 *
 * @packageDocumentation
 */

import { lendingZkLoanDef } from './state-machines/index.js';
import type { FiberAppDefinition } from '../../schema/fiber-app.js';

export { lendingZkLoanDef };

/** All lending state machine definitions. */
export const LENDING_DEFINITIONS = {
  zkLoan: lendingZkLoanDef,
} as const;

export type LendingType = keyof typeof LENDING_DEFINITIONS;

/**
 * Get a lending state machine definition by type.
 * @param type - 'zkLoan' (default: 'zkLoan')
 */
export function getLendingDefinition(type: LendingType = 'zkLoan'): FiberAppDefinition {
  return LENDING_DEFINITIONS[type];
}

// ---------------------------------------------------------------------------
// Eligibility-proof model (the semi-private gate)
// ---------------------------------------------------------------------------
export {
  lendingRule,
  pinLendingRule,
  buildOriginationGuard,
  buildEligibilityWitness,
  type LendingRuleParams,
  type PinnedLendingRule,
  type OriginationGuardRefs,
  type JsonLogicRule,
} from './eligibility.js';

// ---------------------------------------------------------------------------
// Credit scoring via the identity + reputation app (the creditScore IS reputation)
// ---------------------------------------------------------------------------
export {
  reputationScore,
  reputationCreditRule,
  buildCreditDataContext,
  reputationAuthorityClause,
  type CreditScoreConfig,
  type ReputationCreditParams,
  type CreditDataContext,
} from './credit-scoring.js';

// ---------------------------------------------------------------------------
// Asset-subsystem integration (collateral, debt/principal, repayment morphisms)
// ---------------------------------------------------------------------------
export {
  // value types
  walletHolder,
  fiberHolder,
  behaviorBits,
  TokenBehaviors,
  type AssetHolder,
  type TokenBehavior,
  type SupplyPolicy,
  type MorphismKind,
  type MorphismVisibility,
  type MorphismSpec,
  type VersionReq,
  type PolicyRef,
  // op payload builders
  createAssetPolicyPayload,
  createMintAssetPayload,
  createApplyMorphismPayload,
  createAuthorizeComposePayload,
  type CreateAssetPolicyParams,
  type CreateAssetPolicyMessage,
  type MintAssetParams,
  type MintAssetMessage,
  type ApplyMorphismParams,
  type ApplyMorphismMessage,
  type AuthorizeComposeParams,
  type AuthorizeComposeMessage,
  // loan policy builders
  collateralPolicy,
  debtPolicy,
  // lifecycle → morphism drivers
  lockCollateralOp,
  mintPrincipalOp,
  repayBurnOp,
  settleCollateralOp,
} from './assets.js';
