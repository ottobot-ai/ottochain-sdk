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
export enum ResolutionType {
  UNSPECIFIED = 0,
  /** Binary yes/no outcome */
  BINARY = 1,
  /** One of multiple predefined outcomes */
  MULTI_CHOICE = 2,
  /** Numeric value (e.g., price) */
  NUMERIC = 3,
  /** Free-form attestation */
  ATTESTATION = 4,
}

/**
 * Reasons for slashing oracle stake
 */
export enum SlashingReason {
  UNSPECIFIED = 0,
  /** Failed to submit resolution in time */
  TIMEOUT = 1,
  /** Resolution overturned by dispute */
  INCORRECT_RESOLUTION = 2,
  /** Evidence of collusion or manipulation */
  COLLUSION = 3,
  /** Violation of oracle protocol */
  PROTOCOL_VIOLATION = 4,
}

// ---------------------------------------------------------------------------
// Configuration Defaults
// ---------------------------------------------------------------------------

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
export const DEFAULT_ORACLE_CONFIG: OracleConfig = {
  minStake: 10000n,
  timeoutSlashPercent: 0.05,
  incorrectSlashPercent: 0.25,
  collusionSlashPercent: 1.0,
  violationSlashPercent: 0.10,
  cooldownEpochs: 48,
  baseReputation: 50,
  highValueThreshold: 100,
  resolutionWindowEpochs: 12,
  challengeWindowEpochs: 6,
  oracleRewardPercent: 0.01,
};

/**
 * Slashing percentages by reason
 */
export const SLASHING_PERCENTAGES: Record<SlashingReason, number> = {
  [SlashingReason.UNSPECIFIED]: 0,
  [SlashingReason.TIMEOUT]: DEFAULT_ORACLE_CONFIG.timeoutSlashPercent,
  [SlashingReason.INCORRECT_RESOLUTION]: DEFAULT_ORACLE_CONFIG.incorrectSlashPercent,
  [SlashingReason.COLLUSION]: DEFAULT_ORACLE_CONFIG.collusionSlashPercent,
  [SlashingReason.PROTOCOL_VIOLATION]: DEFAULT_ORACLE_CONFIG.violationSlashPercent,
};

// ---------------------------------------------------------------------------
// State Machine Transitions
// ---------------------------------------------------------------------------

/**
 * Valid transitions for each oracle state (aligned with proto OracleState enum)
 */
export const ORACLE_TRANSITIONS: Record<OracleState, readonly string[]> = {
  [OracleState.UNSPECIFIED]: [],
  [OracleState.UNREGISTERED]: ['register'],
  [OracleState.REGISTERED]: ['activate', 'withdraw'],
  [OracleState.ACTIVE]: ['add_stake', 'record_resolution', 'slash', 'withdraw'],
  [OracleState.SLASHED]: ['reactivate', 'withdraw'],
  [OracleState.WITHDRAWN]: [],  // Terminal state
};

/**
 * Check if an oracle state is terminal
 */
export function isTerminalOracleState(state: OracleState): boolean {
  return state === OracleState.WITHDRAWN;
}

/**
 * Check if an oracle can accept new assignments
 */
export function canAcceptAssignment(state: OracleState): boolean {
  return state === OracleState.ACTIVE;
}

// ---------------------------------------------------------------------------
// Reputation Calculations
// ---------------------------------------------------------------------------

/**
 * Reputation update factors
 */
export const REPUTATION_DELTAS = {
  /** Successfully resolved market without challenge */
  successfulResolution: 5,
  /** Resolution upheld after challenge */
  upheldChallenge: 10,
  /** Resolution overturned (negative) */
  overturnedResolution: -25,
  /** Timeout on assigned market (negative) */
  timeout: -15,
  /** Collusion detected (negative) */
  collusion: -100,
  /** Protocol violation (negative) */
  violation: -20,
  /** Bonus for high-value market resolution */
  highValueBonus: 3,
} as const;

/**
 * Calculate new reputation after an event
 * 
 * @param currentReputation - Current reputation score
 * @param delta - Reputation change (positive or negative)
 * @param minReputation - Minimum reputation floor (default 0)
 * @returns New reputation score
 */
export function calculateReputation(
  currentReputation: number,
  delta: number,
  minReputation: number = 0
): number {
  return Math.max(minReputation, currentReputation + delta);
}

/**
 * Calculate weighted reputation considering history
 * 
 * @param baseReputation - Current base reputation
 * @param successCount - Number of successful resolutions
 * @param failureCount - Number of failed/overturned resolutions
 * @returns Weighted reputation score
 */
export function calculateWeightedReputation(
  baseReputation: number,
  successCount: number,
  failureCount: number
): number {
  const totalAttempts = successCount + failureCount;
  if (totalAttempts === 0) return baseReputation;
  
  const successRate = successCount / totalAttempts;
  const experienceMultiplier = Math.min(1 + Math.log10(totalAttempts + 1) * 0.2, 1.5);
  
  return Math.round(baseReputation * successRate * experienceMultiplier);
}

/**
 * Check if oracle qualifies for high-value markets
 */
export function qualifiesForHighValue(
  reputation: number,
  stake: bigint,
  threshold: number = DEFAULT_ORACLE_CONFIG.highValueThreshold,
  minStakeMultiplier: number = 5
): boolean {
  return (
    reputation >= threshold &&
    stake >= DEFAULT_ORACLE_CONFIG.minStake * BigInt(minStakeMultiplier)
  );
}

// ---------------------------------------------------------------------------
// Slashing Calculations
// ---------------------------------------------------------------------------

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
export const SLASHING_CONDITIONS: Record<SlashingReason, SlashingCondition> = {
  [SlashingReason.UNSPECIFIED]: {
    reason: SlashingReason.UNSPECIFIED,
    slashPercent: 0,
    description: 'No slashing',
    appealable: false,
    suspensionEpochs: 0,
  },
  [SlashingReason.TIMEOUT]: {
    reason: SlashingReason.TIMEOUT,
    slashPercent: DEFAULT_ORACLE_CONFIG.timeoutSlashPercent,
    description: 'Failed to submit resolution within deadline',
    appealable: true,
    suspensionEpochs: 12,
  },
  [SlashingReason.INCORRECT_RESOLUTION]: {
    reason: SlashingReason.INCORRECT_RESOLUTION,
    slashPercent: DEFAULT_ORACLE_CONFIG.incorrectSlashPercent,
    description: 'Resolution overturned by dispute process',
    appealable: true,
    suspensionEpochs: 48,
  },
  [SlashingReason.COLLUSION]: {
    reason: SlashingReason.COLLUSION,
    slashPercent: DEFAULT_ORACLE_CONFIG.collusionSlashPercent,
    description: 'Evidence of collusion or market manipulation',
    appealable: false,
    suspensionEpochs: -1, // Permanent
  },
  [SlashingReason.PROTOCOL_VIOLATION]: {
    reason: SlashingReason.PROTOCOL_VIOLATION,
    slashPercent: DEFAULT_ORACLE_CONFIG.violationSlashPercent,
    description: 'Violation of oracle operating protocol',
    appealable: true,
    suspensionEpochs: 24,
  },
};

/**
 * Calculate slash amount for a given stake and reason
 * 
 * @param stake - Oracle's current stake
 * @param reason - Reason for slashing
 * @returns Amount to be slashed
 */
export function calculateSlashAmount(
  stake: bigint,
  reason: SlashingReason
): bigint {
  const condition = SLASHING_CONDITIONS[reason];
  return (stake * BigInt(Math.floor(condition.slashPercent * 10000))) / 10000n;
}

/**
 * Calculate remaining stake after slashing
 */
export function calculateStakeAfterSlash(
  stake: bigint,
  reason: SlashingReason
): bigint {
  return stake - calculateSlashAmount(stake, reason);
}

// ---------------------------------------------------------------------------
// Oracle Selection
// ---------------------------------------------------------------------------

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
export function calculateSelectionScore(
  candidate: OracleCandidate,
  marketValue: bigint = 0n
): number {
  const reputationWeight = 0.4;
  const stakeWeight = 0.3;
  const successWeight = 0.2;
  const loadWeight = 0.1;
  
  // Normalize stake to 0-100 range (assuming 1M max)
  const normalizedStake = Math.min(Number(candidate.stake / 10000n), 100);
  
  // Load penalty (fewer active = better)
  const loadScore = Math.max(0, 100 - candidate.activeAssignments * 20);
  
  // High-value market bonus for qualified oracles
  const highValueBonus = marketValue > 100000n && 
    qualifiesForHighValue(candidate.reputation, candidate.stake) ? 10 : 0;
  
  return (
    candidate.reputation * reputationWeight +
    normalizedStake * stakeWeight +
    candidate.successRate * 100 * successWeight +
    loadScore * loadWeight +
    highValueBonus
  );
}

// ---------------------------------------------------------------------------
// Reward Calculations
// ---------------------------------------------------------------------------

/**
 * Calculate oracle reward for successful resolution
 * 
 * @param marketFees - Total fees collected from market
 * @param rewardPercent - Oracle's reward percentage (default from config)
 * @returns Oracle reward amount
 */
export function calculateOracleReward(
  marketFees: bigint,
  rewardPercent: number = DEFAULT_ORACLE_CONFIG.oracleRewardPercent
): bigint {
  return (marketFees * BigInt(Math.floor(rewardPercent * 10000))) / 10000n;
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Check if a value is a valid OracleState
 */
export function isOracleState(value: unknown): value is OracleState {
  return typeof value === 'number' && value in OracleState;
}

/**
 * Check if a value is a valid SlashingReason
 */
export function isSlashingReason(value: unknown): value is SlashingReason {
  return typeof value === 'number' && value in SlashingReason;
}

/**
 * Check if a value is a valid ResolutionType
 */
export function isResolutionType(value: unknown): value is ResolutionType {
  return typeof value === 'number' && value in ResolutionType;
}
