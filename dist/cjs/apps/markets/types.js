"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMarketType = exports.isMarketState = exports.calculateGroupBuyDiscount = exports.calculateCrowdfundProgress = exports.validateCommitment = exports.calculateRefund = exports.calculatePayout = exports.calculateFees = exports.calculateNetCommitment = exports.isTerminalMarketState = exports.MARKET_TRANSITIONS = exports.MARKET_TYPE_CONFIGS = exports.DEFAULT_MARKET_CONFIG = exports.CommitmentSide = void 0;
const market_pb_js_1 = require("../../generated/ottochain/apps/markets/v1/market_pb.js");
/**
 * Commitment direction (for prediction markets)
 */
var CommitmentSide;
(function (CommitmentSide) {
    CommitmentSide[CommitmentSide["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    CommitmentSide[CommitmentSide["YES"] = 1] = "YES";
    CommitmentSide[CommitmentSide["NO"] = 2] = "NO";
})(CommitmentSide || (exports.CommitmentSide = CommitmentSide = {}));
/**
 * Default market configuration
 */
exports.DEFAULT_MARKET_CONFIG = {
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
exports.MARKET_TYPE_CONFIGS = {
    [market_pb_js_1.MarketType.UNSPECIFIED]: {},
    [market_pb_js_1.MarketType.PREDICTION]: {
        platformFeePercent: 0.02,
        oracleFeePercent: 0.02,
    },
    [market_pb_js_1.MarketType.AUCTION]: {
        platformFeePercent: 0.025,
        creatorFeePercent: 0,
        oracleFeePercent: 0,
        minQuorum: 1n,
    },
    [market_pb_js_1.MarketType.CROWDFUND]: {
        platformFeePercent: 0.03,
        creatorFeePercent: 0,
        oracleFeePercent: 0,
        disputeWindowEpochs: 0,
    },
    [market_pb_js_1.MarketType.GROUP_BUY]: {
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
exports.MARKET_TRANSITIONS = {
    [market_pb_js_1.MarketState.UNSPECIFIED]: [],
    [market_pb_js_1.MarketState.PROPOSED]: ['open', 'cancel'],
    [market_pb_js_1.MarketState.OPEN]: ['close', 'cancel', 'commit'],
    [market_pb_js_1.MarketState.CLOSED]: ['submit_resolution', 'refund'],
    [market_pb_js_1.MarketState.RESOLVING]: ['submit_resolution', 'finalize', 'refund'],
    [market_pb_js_1.MarketState.SETTLED]: ['claim'], // Terminal (only claims allowed)
    [market_pb_js_1.MarketState.REFUNDED]: [], // Terminal state
    [market_pb_js_1.MarketState.CANCELLED]: [], // Terminal state
};
/**
 * Check if a market state is terminal
 */
function isTerminalMarketState(state) {
    return [
        market_pb_js_1.MarketState.SETTLED,
        market_pb_js_1.MarketState.REFUNDED,
        market_pb_js_1.MarketState.CANCELLED,
    ].includes(state);
}
exports.isTerminalMarketState = isTerminalMarketState;
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
function calculateNetCommitment(amount, config = {}) {
    const feePercent = config.platformFeePercent ?? exports.DEFAULT_MARKET_CONFIG.platformFeePercent;
    const feeAmount = (amount * BigInt(Math.floor(feePercent * 10000))) / 10000n;
    return amount - feeAmount;
}
exports.calculateNetCommitment = calculateNetCommitment;
/**
 * Calculate total fees for a commitment
 *
 * @param amount - Commitment amount
 * @param marketType - Type of market for type-specific fees
 * @returns Fee breakdown object
 */
function calculateFees(amount, marketType = market_pb_js_1.MarketType.PREDICTION) {
    const typeConfig = { ...exports.DEFAULT_MARKET_CONFIG, ...exports.MARKET_TYPE_CONFIGS[marketType] };
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
exports.calculateFees = calculateFees;
/**
 * Calculate payout for a winning commitment in a prediction market
 *
 * Winner receives: their original + proportional share of losing pool (minus fees)
 *
 * @param shares - Pool and commitment details
 * @param marketType - Type of market for fee calculation
 * @returns Payout amount
 */
function calculatePayout(shares, marketType = market_pb_js_1.MarketType.PREDICTION) {
    if (shares.winningPool === 0n)
        return 0n;
    const fees = calculateFees(shares.losingPool, marketType);
    const distributablePool = shares.losingPool - fees.total;
    // Proportional share of losing pool
    const winnings = (distributablePool * shares.userCommitment) / shares.winningPool;
    // Return original commitment + winnings
    return shares.userCommitment + winnings;
}
exports.calculatePayout = calculatePayout;
/**
 * Calculate refund for cancelled market
 *
 * @param commitment - Original commitment amount
 * @param refundFeePercent - Optional fee retained on refund (default 0)
 * @returns Refund amount
 */
function calculateRefund(commitment, refundFeePercent = 0) {
    const fee = (commitment * BigInt(Math.floor(refundFeePercent * 10000))) / 10000n;
    return commitment - fee;
}
exports.calculateRefund = calculateRefund;
/**
 * Validate a commitment against market rules
 */
function validateCommitment(amount, marketState, config = {}) {
    const minCommitment = config.minCommitment ?? exports.DEFAULT_MARKET_CONFIG.minCommitment;
    if (marketState !== market_pb_js_1.MarketState.OPEN) {
        return { valid: false, reason: 'Market is not open for commitments' };
    }
    if (amount < minCommitment) {
        return { valid: false, reason: `Commitment below minimum: ${minCommitment}` };
    }
    return { valid: true };
}
exports.validateCommitment = validateCommitment;
/**
 * Calculate crowdfund campaign progress
 */
function calculateCrowdfundProgress(current, goal) {
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
exports.calculateCrowdfundProgress = calculateCrowdfundProgress;
/**
 * Calculate applicable discount based on participant count
 */
function calculateGroupBuyDiscount(participantCount, tiers) {
    // Sort tiers descending by minParticipants
    const sortedTiers = [...tiers].sort((a, b) => b.minParticipants - a.minParticipants);
    for (const tier of sortedTiers) {
        if (participantCount >= tier.minParticipants) {
            return tier.discountPercent;
        }
    }
    return 0;
}
exports.calculateGroupBuyDiscount = calculateGroupBuyDiscount;
// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------
/**
 * Check if a value is a valid MarketState
 */
function isMarketState(value) {
    return typeof value === 'number' && value in market_pb_js_1.MarketState;
}
exports.isMarketState = isMarketState;
/**
 * Check if a value is a valid MarketType
 */
function isMarketType(value) {
    return typeof value === 'number' && value in market_pb_js_1.MarketType;
}
exports.isMarketType = isMarketType;
