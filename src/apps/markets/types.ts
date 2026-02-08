/**
 * Markets Application Types
 * 
 * Constants, types, and utilities for the Markets application on OttoChain.
 * 
 * Core types (MarketType, MarketState, Market, Commitment, Resolution) are
 * exported from proto-generated types in index.ts.
 * 
 * @packageDocumentation
 */

import { MarketType, MarketState } from '../../generated/ottochain/apps/markets/v1/market_pb.js';

/**
 * Commitment direction (for prediction markets)
 */
export enum CommitmentSide {
  UNSPECIFIED = 0,
  YES = 1,
  NO = 2,
}

// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------

/**
 * Market configuration type
 */
export interface MarketConfig {
  /** Platform fee as percentage (0.01 = 1%) */
  platformFeePercent: number;
  /** Market creator fee as percentage */
  creatorFeePercent: number;
  /** Oracle fee as percentage */
  oracleFeePercent: number;
  /** Minimum quorum for market validity (in tokens) */
  minQuorum: bigint;
  /** Default resolution window in epochs */
  resolutionWindowEpochs: number;
  /** Dispute window after resolution in epochs */
  disputeWindowEpochs: number;
  /** Minimum commitment amount */
  minCommitment: bigint;
  /** Maximum slippage for AMM-style markets */
  maxSlippagePercent: number;
}

/**
 * Default market configuration
 */
export const DEFAULT_MARKET_CONFIG: MarketConfig = {
  platformFeePercent: 0.01,
  creatorFeePercent: 0.02,
  oracleFeePercent: 0.01,
  minQuorum: 100n,
  resolutionWindowEpochs: 24,
  disputeWindowEpochs: 12,
  minCommitment: 1n,
  maxSlippagePercent: 0.05,
};

/**
 * Type-specific market configurations
 */
export const MARKET_TYPE_CONFIGS: Record<MarketType, Partial<MarketConfig>> = {
  [MarketType.UNSPECIFIED]: {},
  [MarketType.PREDICTION]: {
    platformFeePercent: 0.02,
    oracleFeePercent: 0.02,
  },
  [MarketType.AUCTION]: {
    platformFeePercent: 0.025,
    creatorFeePercent: 0,
    oracleFeePercent: 0,
    minQuorum: 1n,
  },
  [MarketType.CROWDFUND]: {
    platformFeePercent: 0.03,
    creatorFeePercent: 0,
    oracleFeePercent: 0,
    disputeWindowEpochs: 0,
  },
  [MarketType.GROUP_BUY]: {
    platformFeePercent: 0.015,
    creatorFeePercent: 0.01,
    oracleFeePercent: 0,
  },
};

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------

/**
 * Valid transitions for each market state (aligned with proto MarketState enum)
 */
export const MARKET_TRANSITIONS: Record<MarketState, readonly string[]> = {
  [MarketState.UNSPECIFIED]: [],
  [MarketState.PROPOSED]: ['open', 'cancel'],
  [MarketState.OPEN]: ['close', 'cancel', 'commit'],
  [MarketState.CLOSED]: ['submit_resolution', 'refund'],
  [MarketState.RESOLVING]: ['submit_resolution', 'finalize', 'refund'],
  [MarketState.SETTLED]: ['claim'],  // Terminal (only claims allowed)
  [MarketState.REFUNDED]: [],        // Terminal state
  [MarketState.CANCELLED]: [],       // Terminal state
};

/**
 * Check if a market state is terminal
 */
export function isTerminalMarketState(state: MarketState): boolean {
  return [
    MarketState.SETTLED,
    MarketState.REFUNDED,
    MarketState.CANCELLED,
  ].includes(state);
}

// ---------------------------------------------------------------------------
// Commitment Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate effective commitment after fees
 * 
 * @param amount - Raw commitment amount
 * @param config - Market configuration (uses defaults if not provided)
 * @returns Net commitment amount after platform fees
 */
export function calculateNetCommitment(
  amount: bigint,
  config: Partial<MarketConfig> = {}
): bigint {
  const feePercent = config.platformFeePercent ?? DEFAULT_MARKET_CONFIG.platformFeePercent;
  const feeAmount = (amount * BigInt(Math.floor(feePercent * 10000))) / 10000n;
  return amount - feeAmount;
}

/**
 * Calculate total fees for a commitment
 * 
 * @param amount - Commitment amount
 * @param marketType - Type of market for type-specific fees
 * @returns Fee breakdown object
 */
export function calculateFees(
  amount: bigint,
  marketType: MarketType = MarketType.PREDICTION
): { platform: bigint; creator: bigint; oracle: bigint; total: bigint } {
  const typeConfig = { ...DEFAULT_MARKET_CONFIG, ...MARKET_TYPE_CONFIGS[marketType] };
  
  const platform = (amount * BigInt(Math.floor(typeConfig.platformFeePercent * 10000))) / 10000n;
  const creator = (amount * BigInt(Math.floor(typeConfig.creatorFeePercent * 10000))) / 10000n;
  const oracle = (amount * BigInt(Math.floor(typeConfig.oracleFeePercent * 10000))) / 10000n;
  
  return {
    platform,
    creator,
    oracle,
    total: platform + creator + oracle,
  };
}

// ---------------------------------------------------------------------------
// Payout Calculations
// ---------------------------------------------------------------------------

/**
 * Outcome shares for payout calculation
 */
export interface OutcomeShares {
  /** Total committed to winning outcome */
  winningPool: bigint;
  /** Total committed to losing outcome(s) */
  losingPool: bigint;
  /** Individual's commitment to winning outcome */
  userCommitment: bigint;
}

/**
 * Calculate payout for a winning commitment in a prediction market
 * 
 * Winner receives: their original + proportional share of losing pool (minus fees)
 * 
 * @param shares - Pool and commitment details
 * @param marketType - Type of market for fee calculation
 * @returns Payout amount
 */
export function calculatePayout(
  shares: OutcomeShares,
  marketType: MarketType = MarketType.PREDICTION
): bigint {
  if (shares.winningPool === 0n) return 0n;
  
  const fees = calculateFees(shares.losingPool, marketType);
  const distributablePool = shares.losingPool - fees.total;
  
  // Proportional share of losing pool
  const winnings = (distributablePool * shares.userCommitment) / shares.winningPool;
  
  // Return original commitment + winnings
  return shares.userCommitment + winnings;
}

/**
 * Calculate refund for cancelled market
 * 
 * @param commitment - Original commitment amount
 * @param refundFeePercent - Optional fee retained on refund (default 0)
 * @returns Refund amount
 */
export function calculateRefund(
  commitment: bigint,
  refundFeePercent: number = 0
): bigint {
  const fee = (commitment * BigInt(Math.floor(refundFeePercent * 10000))) / 10000n;
  return commitment - fee;
}

// ---------------------------------------------------------------------------
// Market Validation
// ---------------------------------------------------------------------------

/**
 * Validate a commitment meets market requirements
 */
export interface CommitmentValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a commitment against market rules
 */
export function validateCommitment(
  amount: bigint,
  marketState: MarketState,
  config: Partial<MarketConfig> = {}
): CommitmentValidation {
  const minCommitment = config.minCommitment ?? DEFAULT_MARKET_CONFIG.minCommitment;
  
  if (marketState !== MarketState.OPEN) {
    return { valid: false, reason: 'Market is not open for commitments' };
  }
  
  if (amount < minCommitment) {
    return { valid: false, reason: `Commitment below minimum: ${minCommitment}` };
  }
  
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Crowdfund Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate crowdfund progress
 */
export interface CrowdfundProgress {
  /** Current total committed */
  current: bigint;
  /** Target goal */
  goal: bigint;
  /** Percentage complete (0-100) */
  percentComplete: number;
  /** Whether goal has been reached */
  goalReached: boolean;
}

/**
 * Calculate crowdfund campaign progress
 */
export function calculateCrowdfundProgress(
  current: bigint,
  goal: bigint
): CrowdfundProgress {
  if (goal === 0n) {
    return { current, goal, percentComplete: 0, goalReached: false };
  }
  
  const percentComplete = Number((current * 10000n) / goal) / 100;
  
  return {
    current,
    goal,
    percentComplete: Math.min(percentComplete, 100),
    goalReached: current >= goal,
  };
}

// ---------------------------------------------------------------------------
// Group Buy Helpers
// ---------------------------------------------------------------------------

/**
 * Tier definition for group buys
 */
export interface GroupBuyTier {
  /** Minimum participants for this tier */
  minParticipants: number;
  /** Discount percentage for this tier */
  discountPercent: number;
}

/**
 * Calculate applicable discount based on participant count
 */
export function calculateGroupBuyDiscount(
  participantCount: number,
  tiers: GroupBuyTier[]
): number {
  // Sort tiers descending by minParticipants
  const sortedTiers = [...tiers].sort((a, b) => b.minParticipants - a.minParticipants);
  
  for (const tier of sortedTiers) {
    if (participantCount >= tier.minParticipants) {
      return tier.discountPercent;
    }
  }
  
  return 0;
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if a value is a valid MarketState
 */
export function isMarketState(value: unknown): value is MarketState {
  return typeof value === 'number' && value in MarketState;
}

/**
 * Check if a value is a valid MarketType
 */
export function isMarketType(value: unknown): value is MarketType {
  return typeof value === 'number' && value in MarketType;
}
