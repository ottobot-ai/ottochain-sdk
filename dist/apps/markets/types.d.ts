/**
 * Markets Application Types
 *
 * Constants, types, and utilities for the Markets application on OttoChain.
 *
 * Note: When proto files are generated, enums will move to generated types.
 *
 * @packageDocumentation
 */
/**
 * Market lifecycle states
 */
export declare enum MarketState {
    UNSPECIFIED = 0,
    /** Market is open for commitments */
    OPEN = 1,
    /** Commitment period has ended, awaiting resolution */
    CLOSED = 2,
    /** Oracle has resolved the outcome */
    RESOLVED = 3,
    /** Payouts distributed to winners */
    SETTLED = 4,
    /** Market cancelled, refunds issued */
    CANCELLED = 5,
    /** Market is disputed */
    DISPUTED = 6
}
/**
 * Types of markets supported
 */
export declare enum MarketType {
    UNSPECIFIED = 0,
    /** Binary or multi-outcome prediction market */
    PREDICTION = 1,
    /** Ascending/descending price auction */
    AUCTION = 2,
    /** All-or-nothing crowdfunding */
    CROWDFUND = 3,
    /** Group buying with volume discounts */
    GROUP_BUY = 4
}
/**
 * Commitment direction (for prediction markets)
 */
export declare enum CommitmentSide {
    UNSPECIFIED = 0,
    YES = 1,
    NO = 2
}
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
export declare const DEFAULT_MARKET_CONFIG: MarketConfig;
/**
 * Type-specific market configurations
 */
export declare const MARKET_TYPE_CONFIGS: Record<MarketType, Partial<MarketConfig>>;
/**
 * Valid transitions for each market state
 */
export declare const MARKET_TRANSITIONS: Record<MarketState, readonly string[]>;
/**
 * Check if a market state is terminal
 */
export declare function isTerminalMarketState(state: MarketState): boolean;
/**
 * Calculate effective commitment after fees
 *
 * @param amount - Raw commitment amount
 * @param config - Market configuration (uses defaults if not provided)
 * @returns Net commitment amount after platform fees
 */
export declare function calculateNetCommitment(amount: bigint, config?: Partial<MarketConfig>): bigint;
/**
 * Calculate total fees for a commitment
 *
 * @param amount - Commitment amount
 * @param marketType - Type of market for type-specific fees
 * @returns Fee breakdown object
 */
export declare function calculateFees(amount: bigint, marketType?: MarketType): {
    platform: bigint;
    creator: bigint;
    oracle: bigint;
    total: bigint;
};
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
export declare function calculatePayout(shares: OutcomeShares, marketType?: MarketType): bigint;
/**
 * Calculate refund for cancelled market
 *
 * @param commitment - Original commitment amount
 * @param refundFeePercent - Optional fee retained on refund (default 0)
 * @returns Refund amount
 */
export declare function calculateRefund(commitment: bigint, refundFeePercent?: number): bigint;
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
export declare function validateCommitment(amount: bigint, marketState: MarketState, config?: Partial<MarketConfig>): CommitmentValidation;
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
export declare function calculateCrowdfundProgress(current: bigint, goal: bigint): CrowdfundProgress;
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
export declare function calculateGroupBuyDiscount(participantCount: number, tiers: GroupBuyTier[]): number;
/**
 * Check if a value is a valid MarketState
 */
export declare function isMarketState(value: unknown): value is MarketState;
/**
 * Check if a value is a valid MarketType
 */
export declare function isMarketType(value: unknown): value is MarketType;
