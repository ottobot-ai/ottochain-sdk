/**
 * Agent Identity Types
 * 
 * TypeScript types for the Agent Identity application on OttoChain.
 * These mirror the protobuf definitions in proto/ottochain/apps/identity/v1/
 * 
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Agent lifecycle states in the identity state machine
 */
export type AgentState =
  | 'REGISTERED'    // Initial state after registration
  | 'ACTIVE'        // Activated and participating
  | 'CHALLENGED'    // Under dispute/challenge
  | 'SUSPENDED'     // Challenge upheld, temporarily suspended
  | 'PROBATION'     // Recovering from suspension
  | 'WITHDRAWN';    // Voluntarily exited (terminal)

/**
 * Platform where agent identity is linked
 */
export type Platform =
  | 'DISCORD'
  | 'TELEGRAM'
  | 'TWITTER'
  | 'GITHUB'
  | 'CUSTOM';

/**
 * Types of attestations that affect reputation
 */
export type AttestationType =
  | 'COMPLETION'    // Contract completed successfully (+5)
  | 'VOUCH'         // Vouched for by another agent (+2)
  | 'VIOLATION'     // Protocol violation (-10)
  | 'BEHAVIORAL';   // Positive behavioral signal (+3)

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/**
 * Platform identity link
 */
export interface PlatformLink {
  platform: Platform;
  platformUserId: string;
  platformUsername?: string;
  linkedAt: string;  // ISO timestamp
  verified: boolean;
}

/**
 * Agent identity on-chain state
 */
export interface AgentIdentity {
  address: string;
  publicKey: string;
  displayName?: string;
  reputation: number;
  state: AgentState;
  platformLinks: PlatformLink[];
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
}

/**
 * Reputation change record
 */
export interface ReputationDelta {
  attestationType: AttestationType;
  delta: number;
  reason?: string;
  recordedAt: string;  // ISO timestamp
}

/**
 * Attestation record
 */
export interface Attestation {
  id: string;
  type: AttestationType;
  subject: string;      // Agent address receiving attestation
  issuer?: string;      // Agent address issuing (if agent-issued)
  issuerPlatform?: Platform;  // If platform-issued
  delta: number;
  reason?: string;
  txHash: string;
  createdAt: string;    // ISO timestamp
}

// ---------------------------------------------------------------------------
// Request Types
// ---------------------------------------------------------------------------

/**
 * Register a new agent identity
 */
export interface RegisterAgentRequest {
  platform: Platform;
  platformUserId: string;
  platformUsername?: string;
  displayName?: string;
}

/**
 * Activate a registered agent
 */
export interface ActivateAgentRequest {
  address: string;
}

/**
 * Vouch for another agent
 */
export interface VouchRequest {
  fromAddress: string;
  toAddress: string;
  reason?: string;
}

/**
 * Challenge an agent's behavior
 */
export interface ChallengeRequest {
  challenger: string;
  challenged: string;
  evidence: string;
  reason: string;
}

/**
 * Withdraw an agent (voluntary exit)
 */
export interface WithdrawRequest {
  address: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Reputation configuration for agent identity
 */
export interface ReputationConfig {
  baseReputation: number;        // Starting rep (default: 10)
  completionDelta: number;       // Contract completion (default: +5)
  vouchDelta: number;            // Vouch received (default: +2)
  violationDelta: number;        // Violation penalty (default: -10)
  behavioralDelta: number;       // Behavioral bonus (default: +3)
  minReputation: number;         // Floor (default: 0)
  challengeThreshold: number;    // Min rep to challenge (default: 5)
}

/**
 * Default reputation configuration
 */
export const DEFAULT_REPUTATION_CONFIG: ReputationConfig = {
  baseReputation: 10,
  completionDelta: 5,
  vouchDelta: 2,
  violationDelta: -10,
  behavioralDelta: 3,
  minReputation: 0,
  challengeThreshold: 5,
};

// ---------------------------------------------------------------------------
// State Machine Definition
// ---------------------------------------------------------------------------

/**
 * Agent identity state machine transitions
 */
export const AGENT_TRANSITIONS = {
  REGISTERED: ['activate', 'withdraw'],
  ACTIVE: ['challenge', 'withdraw'],
  CHALLENGED: ['uphold_challenge', 'dismiss_challenge'],
  SUSPENDED: ['begin_probation'],
  PROBATION: ['complete_probation'],
  WITHDRAWN: [],  // Terminal state
} as const;
