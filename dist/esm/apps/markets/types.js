/**
 * Markets Application Types
 *
 * Constants, types, and utilities for the Markets application on OttoChain.
 *
 * Note: When proto files are generated, enums will move to generated types.
 *
 * @packageDocumentation
 */
// ---------------------------------------------------------------------------
// Enums (will be replaced by proto-generated versions)
// ---------------------------------------------------------------------------
/**
 * Market lifecycle states
 */
export var MarketState;
(function (MarketState) {
    MarketState[MarketState["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    /** Market is open for commitments */
    MarketState[MarketState["OPEN"] = 1] = "OPEN";
    /** Commitment period has ended, awaiting resolution */
    MarketState[MarketState["CLOSED"] = 2] = "CLOSED";
    /** Oracle has resolved the outcome */
    MarketState[MarketState["RESOLVED"] = 3] = "RESOLVED";
    /** Payouts distributed to winners */
    MarketState[MarketState["SETTLED"] = 4] = "SETTLED";
    /** Market cancelled, refunds issued */
    MarketState[MarketState["CANCELLED"] = 5] = "CANCELLED";
    /** Market is disputed */
    MarketState[MarketState["DISPUTED"] = 6] = "DISPUTED";
})(MarketState || (MarketState = {}));
/**
 * Types of markets supported
 */
export var MarketType;
(function (MarketType) {
    MarketType[MarketType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    /** Binary or multi-outcome prediction market */
    MarketType[MarketType["PREDICTION"] = 1] = "PREDICTION";
    /** Ascending/descending price auction */
    MarketType[MarketType["AUCTION"] = 2] = "AUCTION";
    /** All-or-nothing crowdfunding */
    MarketType[MarketType["CROWDFUND"] = 3] = "CROWDFUND";
    /** Group buying with volume discounts */
    MarketType[MarketType["GROUP_BUY"] = 4] = "GROUP_BUY";
})(MarketType || (MarketType = {}));
/**
 * Commitment direction (for prediction markets)
 */
export var CommitmentSide;
(function (CommitmentSide) {
    CommitmentSide[CommitmentSide["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    CommitmentSide[CommitmentSide["YES"] = 1] = "YES";
    CommitmentSide[CommitmentSide["NO"] = 2] = "NO";
})(CommitmentSide || (CommitmentSide = {}));
/**
 * Default market configuration
 */
export const DEFAULT_MARKET_CONFIG = {
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
export const MARKET_TYPE_CONFIGS = {
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
 * Valid transitions for each market state
 */
export const MARKET_TRANSITIONS = {
    [MarketState.UNSPECIFIED]: [],
    [MarketState.OPEN]: ['close', 'cancel'],
    [MarketState.CLOSED]: ['resolve', 'dispute', 'cancel'],
    [MarketState.RESOLVED]: ['settle', 'dispute'],
    [MarketState.SETTLED]: [], // Terminal state
    [MarketState.CANCELLED]: [], // Terminal state
    [MarketState.DISPUTED]: ['resolve_dispute', 'cancel'],
};
/**
 * Check if a market state is terminal
 */
export function isTerminalMarketState(state) {
    return [
        MarketState.SETTLED,
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
export function calculateNetCommitment(amount, config = {}) {
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
export function calculateFees(amount, marketType = MarketType.PREDICTION) {
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
/**
 * Calculate payout for a winning commitment in a prediction market
 *
 * Winner receives: their original + proportional share of losing pool (minus fees)
 *
 * @param shares - Pool and commitment details
 * @param marketType - Type of market for fee calculation
 * @returns Payout amount
 */
export function calculatePayout(shares, marketType = MarketType.PREDICTION) {
    if (shares.winningPool === 0n)
        return 0n;
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
export function calculateRefund(commitment, refundFeePercent = 0) {
    const fee = (commitment * BigInt(Math.floor(refundFeePercent * 10000))) / 10000n;
    return commitment - fee;
}
/**
 * Validate a commitment against market rules
 */
export function validateCommitment(amount, marketState, config = {}) {
    const minCommitment = config.minCommitment ?? DEFAULT_MARKET_CONFIG.minCommitment;
    if (marketState !== MarketState.OPEN) {
        return { valid: false, reason: 'Market is not open for commitments' };
    }
    if (amount < minCommitment) {
        return { valid: false, reason: `Commitment below minimum: ${minCommitment}` };
    }
    return { valid: true };
}
/**
 * Calculate crowdfund campaign progress
 */
export function calculateCrowdfundProgress(current, goal) {
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
/**
 * Calculate applicable discount based on participant count
 */
export function calculateGroupBuyDiscount(participantCount, tiers) {
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
export function isMarketState(value) {
    return typeof value === 'number' && value in MarketState;
}
/**
 * Check if a value is a valid MarketType
 */
export function isMarketType(value) {
    return typeof value === 'number' && value in MarketType;
}
