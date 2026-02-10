/**
 * Producer-Validator Framework
 * 
 * Core interfaces for separating data production from governance validation
 * to eliminate double-signing security risks and provide clear separation of concerns.
 * 
 * @packageDocumentation
 */

/**
 * Address type for OttoChain participants
 */
export type Address = string;

/**
 * Timestamp in ISO 8601 format
 */
export type Timestamp = string;

/**
 * Unique identifier for producers
 */
export type ProducerId = string;

/**
 * Unique identifier for validators
 */
export type ValidatorId = string;

/**
 * Unique identifier for asset instances
 */
export type AssetId = string;

/**
 * Producer role interface - responsible for data creation and updates
 * 
 * Producers generate data and content but DO NOT have governance authority.
 * They can create, update, and propose changes, but cannot unilaterally
 * validate or finalize state transitions without validator approval.
 */
export interface Producer {
  /** Unique identifier for this producer */
  readonly id: ProducerId;
  
  /** Producer's public address */
  readonly address: Address;
  
  /** Producer's registered capabilities */
  readonly capabilities: readonly string[];
  
  /** Reputation score (computed by validators) */
  readonly reputation: number;
  
  /** Registration timestamp */
  readonly registeredAt: Timestamp;
  
  /** Current active status */
  readonly isActive: boolean;
}

/**
 * Validator role interface - responsible for governance and validation
 * 
 * Validators have authority to approve, reject, and finalize state transitions.
 * They evaluate producer submissions against business rules and governance policies.
 * Validators can delegate authority but retain ultimate responsibility.
 */
export interface Validator {
  /** Unique identifier for this validator */
  readonly id: ValidatorId;
  
  /** Validator's public address */
  readonly address: Address;
  
  /** Governance domains this validator can oversee */
  readonly governanceDomains: readonly string[];
  
  /** Validator's stake or bond amount */
  readonly stake: number;
  
  /** Authority level (0-100, higher = more authority) */
  readonly authorityLevel: number;
  
  /** Registration timestamp */
  readonly registeredAt: Timestamp;
  
  /** Current active status */
  readonly isActive: boolean;
}

/**
 * Producer-Validator relationship types
 */
export enum RelationshipType {
  /** Producer is registered under validator's governance */
  REGISTERED = 'registered',
  
  /** Producer has delegated authority from validator */
  DELEGATED = 'delegated',
  
  /** Producer and validator are in a multi-party coordination */
  COORDINATED = 'coordinated',
  
  /** Relationship is suspended (temporary) */
  SUSPENDED = 'suspended',
  
  /** Relationship is terminated (permanent) */
  TERMINATED = 'terminated',
}

/**
 * Producer-Validator relationship definition
 */
export interface ProducerValidatorRelationship {
  /** Producer in this relationship */
  readonly producerId: ProducerId;
  
  /** Validator in this relationship */
  readonly validatorId: ValidatorId;
  
  /** Type of relationship */
  readonly relationshipType: RelationshipType;
  
  /** Specific permissions granted to producer */
  readonly permissions: readonly string[];
  
  /** Relationship establishment timestamp */
  readonly establishedAt: Timestamp;
  
  /** Relationship expiry (null if permanent) */
  readonly expiresAt: Timestamp | null;
  
  /** Terms and conditions hash */
  readonly termsHash: string;
}

/**
 * Validation request from producer to validator
 */
export interface ValidationRequest {
  /** Unique request identifier */
  readonly id: string;
  
  /** Producer making the request */
  readonly producerId: ProducerId;
  
  /** Target validator(s) */
  readonly validatorIds: readonly ValidatorId[];
  
  /** Asset being validated */
  readonly assetId: AssetId;
  
  /** Type of validation requested */
  readonly validationType: string;
  
  /** Request payload/data */
  readonly payload: unknown;
  
  /** Request timestamp */
  readonly requestedAt: Timestamp;
  
  /** Expiry for this request */
  readonly expiresAt: Timestamp;
  
  /** Request signature */
  readonly signature: string;
}

/**
 * Validation response from validator
 */
export interface ValidationResponse {
  /** Original request ID */
  readonly requestId: string;
  
  /** Responding validator */
  readonly validatorId: ValidatorId;
  
  /** Validation decision */
  readonly decision: ValidationDecision;
  
  /** Human-readable reason */
  readonly reason: string;
  
  /** Validation rules applied */
  readonly rulesApplied: readonly string[];
  
  /** Response timestamp */
  readonly respondedAt: Timestamp;
  
  /** Response signature */
  readonly signature: string;
}

/**
 * Validation decision types
 */
export enum ValidationDecision {
  /** Request approved - proceed with action */
  APPROVED = 'approved',
  
  /** Request rejected - action denied */
  REJECTED = 'rejected',
  
  /** Request requires modification */
  REQUIRES_MODIFICATION = 'requires_modification',
  
  /** Request delegated to another validator */
  DELEGATED = 'delegated',
  
  /** Validation deferred - needs more information */
  DEFERRED = 'deferred',
}

/**
 * Multi-party coordination primitive
 * 
 * Enables complex scenarios where multiple producers and/or validators
 * must coordinate on asset lifecycle decisions.
 */
export interface MultiPartyCoordination {
  /** Unique coordination instance ID */
  readonly id: string;
  
  /** Asset under coordination */
  readonly assetId: AssetId;
  
  /** Required producers */
  readonly requiredProducers: readonly ProducerId[];
  
  /** Required validators */
  readonly requiredValidators: readonly ValidatorId[];
  
  /** Coordination type/template */
  readonly coordinationType: string;
  
  /** Current participant approvals */
  readonly approvals: readonly ParticipantApproval[];
  
  /** Coordination status */
  readonly status: CoordinationStatus;
  
  /** Creation timestamp */
  readonly createdAt: Timestamp;
  
  /** Deadline for coordination completion */
  readonly deadline: Timestamp;
}

/**
 * Individual participant approval in multi-party coordination
 */
export interface ParticipantApproval {
  /** Participant (producer or validator) ID */
  readonly participantId: ProducerId | ValidatorId;
  
  /** Participant type */
  readonly participantType: 'producer' | 'validator';
  
  /** Approval decision */
  readonly decision: ValidationDecision;
  
  /** Approval timestamp */
  readonly approvedAt: Timestamp;
  
  /** Approval signature */
  readonly signature: string;
}

/**
 * Multi-party coordination status
 */
export enum CoordinationStatus {
  /** Coordination is pending participant responses */
  PENDING = 'pending',
  
  /** Coordination completed successfully */
  COMPLETED = 'completed',
  
  /** Coordination failed (rejections or timeout) */
  FAILED = 'failed',
  
  /** Coordination was cancelled */
  CANCELLED = 'cancelled',
}

/**
 * Producer registration request
 */
export interface ProducerRegistrationRequest {
  /** Desired producer ID */
  readonly producerId: ProducerId;
  
  /** Producer's address */
  readonly address: Address;
  
  /** Requested capabilities */
  readonly capabilities: readonly string[];
  
  /** Registration bond amount */
  readonly bondAmount: number;
  
  /** Terms acceptance hash */
  readonly termsHash: string;
  
  /** Registration signature */
  readonly signature: string;
}

/**
 * Validator registration request
 */
export interface ValidatorRegistrationRequest {
  /** Desired validator ID */
  readonly validatorId: ValidatorId;
  
  /** Validator's address */
  readonly address: Address;
  
  /** Governance domains to oversee */
  readonly governanceDomains: readonly string[];
  
  /** Stake amount */
  readonly stake: number;
  
  /** Requested authority level */
  readonly requestedAuthorityLevel: number;
  
  /** Terms acceptance hash */
  readonly termsHash: string;
  
  /** Registration signature */
  readonly signature: string;
}

/**
 * Producer delegation request
 * 
 * Allows validators to grant limited authority to producers
 * for specific operations without full governance rights.
 */
export interface DelegationRequest {
  /** Delegating validator */
  readonly validatorId: ValidatorId;
  
  /** Producer receiving delegation */
  readonly producerId: ProducerId;
  
  /** Specific permissions being delegated */
  readonly delegatedPermissions: readonly string[];
  
  /** Delegation scope (asset types, domains, etc.) */
  readonly scope: Record<string, string[]>;
  
  /** Delegation duration */
  readonly duration: number; // in seconds
  
  /** Conditions for delegation validity */
  readonly conditions: readonly string[];
  
  /** Delegation signature */
  readonly signature: string;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/**
 * Producer action types that require validation
 */
export enum ProducerAction {
  CREATE_ASSET = 'create_asset',
  UPDATE_ASSET = 'update_asset',
  TRANSFER_ASSET = 'transfer_asset',
  CHANGE_STATE = 'change_state',
  BURN_ASSET = 'burn_asset',
}

/**
 * Validator governance actions
 */
export enum ValidatorAction {
  APPROVE_PRODUCER = 'approve_producer',
  REJECT_PRODUCER = 'reject_producer',
  DELEGATE_AUTHORITY = 'delegate_authority',
  REVOKE_DELEGATION = 'revoke_delegation',
  UPDATE_GOVERNANCE = 'update_governance',
  SLASH_PRODUCER = 'slash_producer',
}

/**
 * Framework configuration
 */
export interface FrameworkConfig {
  /** Minimum stake required for validators */
  readonly minValidatorStake: number;
  
  /** Minimum bond required for producers */
  readonly minProducerBond: number;
  
  /** Default validation timeout (seconds) */
  readonly defaultValidationTimeout: number;
  
  /** Maximum authority level */
  readonly maxAuthorityLevel: number;
  
  /** Reputation thresholds */
  readonly reputationThresholds: {
    readonly minimum: number;
    readonly good: number;
    readonly excellent: number;
  };
}

/**
 * Default framework configuration
 */
export const DEFAULT_FRAMEWORK_CONFIG: FrameworkConfig = {
  minValidatorStake: 1000,
  minProducerBond: 100,
  defaultValidationTimeout: 3600, // 1 hour
  maxAuthorityLevel: 100,
  reputationThresholds: {
    minimum: 10,
    good: 50,
    excellent: 90,
  },
} as const;