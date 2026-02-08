/**
 * Oracles Application Types
 *
 * Constants, types, and utilities for the Oracle system on OttoChain.
 * Oracles provide truth resolution for markets and disputes.
 *
 * Core types (OracleState, Oracle, etc.) are exported from proto-generated
 * types in index.ts.
 *
 * @packageDocumentation
 */
import { OracleState } from '../../generated/ottochain/apps/oracles/v1/oracle_pb.js';
/**
 * Types of oracle resolutions
 */
export declare enum ResolutionType {
    UNSPECIFIED = 0,
    /** Binary yes/no outcome */
    BINARY = 1,
    /** One of multiple predefined outcomes */
    MULTI_CHOICE = 2,
    /** Numeric value (e.g., price) */
    NUMERIC = 3,
    /** Free-form attestation */
    ATTESTATION = 4
}
/**
 * Reasons for slashing oracle stake
 */
export declare enum SlashingReason {
    UNSPECIFIED = 0,
    /** Failed to submit resolution in time */
    TIMEOUT = 1,
    /** Resolution overturned by dispute */
    INCORRECT_RESOLUTION = 2,
    /** Evidence of collusion or manipulation */
    COLLUSION = 3,
    /** Violation of oracle protocol */
    PROTOCOL_VIOLATION = 4
}
/**
 * Oracle configuration type
 */
export interface OracleConfig {
    /** Minimum stake required to become an oracle (in base units) */
    minStake: bigint;
    /** Stake slashed for timeout (percentage) */
    timeoutSlashPercent: number;
    /** Stake slashed for incorrect resolution (percentage) */
    incorrectSlashPercent: number;
    /** Stake slashed for collusion (percentage) */
    collusionSlashPercent: number;
    /** Stake slashed for protocol violation (percentage) */
    violationSlashPercent: number;
    /** Epochs to wait before withdrawal after unstaking */
    cooldownEpochs: number;
    /** Base reputation for new oracles */
    baseReputation: number;
    /** Minimum reputation to accept high-value markets */
    highValueThreshold: number;
    /** Resolution window in epochs */
    resolutionWindowEpochs: number;
    /** Challenge window after submission in epochs */
    challengeWindowEpochs: number;
    /** Reward percentage from resolved market fees */
    oracleRewardPercent: number;
}
/**
 * Default oracle configuration
 */
export declare const DEFAULT_ORACLE_CONFIG: OracleConfig;
/**
 * Slashing percentages by reason
 */
export declare const SLASHING_PERCENTAGES: Record<SlashingReason, number>;
/**
 * Valid transitions for each oracle state (aligned with proto OracleState enum)
 */
export declare const ORACLE_TRANSITIONS: Record<OracleState, readonly string[]>;
/**
 * Check if an oracle state is terminal
 */
export declare function isTerminalOracleState(state: OracleState): boolean;
/**
 * Check if an oracle can accept new assignments
 */
export declare function canAcceptAssignment(state: OracleState): boolean;
/**
 * Reputation update factors
 */
export declare const REPUTATION_DELTAS: {
    /** Successfully resolved market without challenge */
    readonly successfulResolution: 5;
    /** Resolution upheld after challenge */
    readonly upheldChallenge: 10;
    /** Resolution overturned (negative) */
    readonly overturnedResolution: -25;
    /** Timeout on assigned market (negative) */
    readonly timeout: -15;
    /** Collusion detected (negative) */
    readonly collusion: -100;
    /** Protocol violation (negative) */
    readonly violation: -20;
    /** Bonus for high-value market resolution */
    readonly highValueBonus: 3;
};
/**
 * Calculate new reputation after an event
 *
 * @param currentReputation - Current reputation score
 * @param delta - Reputation change (positive or negative)
 * @param minReputation - Minimum reputation floor (default 0)
 * @returns New reputation score
 */
export declare function calculateReputation(currentReputation: number, delta: number, minReputation?: number): number;
/**
 * Calculate weighted reputation considering history
 *
 * @param baseReputation - Current base reputation
 * @param successCount - Number of successful resolutions
 * @param failureCount - Number of failed/overturned resolutions
 * @returns Weighted reputation score
 */
export declare function calculateWeightedReputation(baseReputation: number, successCount: number, failureCount: number): number;
/**
 * Check if oracle qualifies for high-value markets
 */
export declare function qualifiesForHighValue(reputation: number, stake: bigint, threshold?: number, minStakeMultiplier?: number): boolean;
/**
 * Slashing condition definition
 */
export interface SlashingCondition {
    reason: SlashingReason;
    slashPercent: number;
    description: string;
    appealable: boolean;
    suspensionEpochs: number;
}
/**
 * Predefined slashing conditions
 */
export declare const SLASHING_CONDITIONS: Record<SlashingReason, SlashingCondition>;
/**
 * Calculate slash amount for a given stake and reason
 *
 * @param stake - Oracle's current stake
 * @param reason - Reason for slashing
 * @returns Amount to be slashed
 */
export declare function calculateSlashAmount(stake: bigint, reason: SlashingReason): bigint;
/**
 * Calculate remaining stake after slashing
 */
export declare function calculateStakeAfterSlash(stake: bigint, reason: SlashingReason): bigint;
/**
 * Oracle candidate for selection
 */
export interface OracleCandidate {
    address: string;
    reputation: number;
    stake: bigint;
    activeAssignments: number;
    successRate: number;
}
/**
 * Calculate oracle selection score
 * Higher score = more likely to be selected
 *
 * @param candidate - Oracle candidate details
 * @param marketValue - Value of market to resolve (affects weight for high-value markets)
 * @returns Selection score
 */
export declare function calculateSelectionScore(candidate: OracleCandidate, marketValue?: bigint): number;
/**
 * Calculate oracle reward for successful resolution
 *
 * @param marketFees - Total fees collected from market
 * @param rewardPercent - Oracle's reward percentage (default from config)
 * @returns Oracle reward amount
 */
export declare function calculateOracleReward(marketFees: bigint, rewardPercent?: number): bigint;
/**
 * Check if a value is a valid OracleState
 */
export declare function isOracleState(value: unknown): value is OracleState;
/**
 * Check if a value is a valid SlashingReason
 */
export declare function isSlashingReason(value: unknown): value is SlashingReason;
/**
 * Check if a value is a valid ResolutionType
 */
export declare function isResolutionType(value: unknown): value is ResolutionType;
