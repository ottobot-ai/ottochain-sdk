/**
 * OttoChain Integration Patterns
 * 
 * This module defines how the Producer-Validator framework integrates
 * with OttoChain's fiber system, state machines, and transaction processing.
 * 
 * @packageDocumentation
 */

import {
  ProducerId,
  ValidatorId,
  AssetId,
  ValidationRequest,
  ValidationResponse,
  MultiPartyCoordination,
  ProducerValidatorRelationship,
  Address,
  Timestamp,
} from './producer-validator.js';

import {
  WorkflowInstance,
  WorkflowTemplate,
  WorkflowStatus,
} from './workflows.js';

/**
 * OttoChain Fiber integration types
 */
export interface FiberIntegration {
  /** Fiber ID this integration applies to */
  readonly fiberId: string;
  
  /** Producer-validator relationships for this fiber */
  readonly relationships: readonly ProducerValidatorRelationship[];
  
  /** Active validation workflows */
  readonly activeWorkflows: readonly WorkflowInstance[];
  
  /** Integration configuration */
  readonly config: FiberIntegrationConfig;
}

/**
 * Fiber integration configuration
 */
export interface FiberIntegrationConfig {
  /** Require producer-validator separation for all operations */
  readonly enforceProducerValidatorSeparation: boolean;
  
  /** Automatically create validation workflows for operations */
  readonly autoCreateWorkflows: boolean;
  
  /** Default workflow templates by operation type */
  readonly defaultWorkflowTemplates: Record<string, string>;
  
  /** Validation timeout defaults (seconds) */
  readonly validationTimeouts: Record<string, number>;
  
  /** Multi-party coordination thresholds */
  readonly coordinationThresholds: Record<string, number>;
}

/**
 * Asset-backed fiber state
 * 
 * Extends standard fiber state to include producer-validator framework data
 */
export interface AssetFiberState {
  /** Standard fiber properties */
  readonly fiberId: string;
  readonly state: unknown;
  readonly sequence: number;
  
  /** Producer-validator framework data */
  readonly producers: readonly ProducerId[];
  readonly validators: readonly ValidatorId[];
  readonly relationships: readonly ProducerValidatorRelationship[];
  readonly activeValidations: readonly ValidationRequest[];
  readonly completedValidations: readonly ValidationResponse[];
  readonly activeCoordinations: readonly MultiPartyCoordination[];
  
  /** Asset-specific state */
  readonly assetRegistry: Record<AssetId, AssetDefinition>;
  readonly ownershipRecords: Record<AssetId, OwnershipRecord>;
  readonly stateTransitions: Record<AssetId, StateTransitionRecord[]>;
  readonly accessPermissions: Record<AssetId, AccessPermissionRecord[]>;
  readonly validationProofs: Record<AssetId, ValidationProofRecord[]>;
}

/**
 * Asset definition within fiber state
 */
export interface AssetDefinition {
  /** Asset unique identifier */
  readonly id: AssetId;
  
  /** Asset type/class */
  readonly assetType: string;
  
  /** Asset metadata */
  readonly metadata: Record<string, unknown>;
  
  /** Creating producer */
  readonly createdBy: ProducerId;
  
  /** Validating authority */
  readonly validatedBy: ValidatorId;
  
  /** Creation timestamp */
  readonly createdAt: Timestamp;
  
  /** Current lifecycle state */
  readonly currentState: string;
  
  /** Asset behavior configuration */
  readonly behaviorConfig: AssetBehaviorConfig;
}

/**
 * Asset behavior configuration based on 4-boolean matrix
 */
export interface AssetBehaviorConfig {
  /** Can tokens be transferred between accounts? */
  readonly transferable: boolean;
  
  /** Are tokens consumed on use? */
  readonly expendable: boolean;
  
  /** Can tokens be duplicated? */
  readonly replicable: boolean;
  
  /** Can authenticity be cryptographically proven? */
  readonly verifiable: boolean;
  
  /** Behavior-specific rules */
  readonly behaviorRules: Record<string, unknown>;
}

/**
 * Ownership record for asset tracking
 */
export interface OwnershipRecord {
  /** Asset being tracked */
  readonly assetId: AssetId;
  
  /** Current owner address */
  readonly owner: Address;
  
  /** Previous owner (for transfer history) */
  readonly previousOwner?: Address;
  
  /** Transfer timestamp */
  readonly transferredAt: Timestamp;
  
  /** Transfer validation proof */
  readonly validationProof: string;
  
  /** Transfer metadata */
  readonly transferMetadata: Record<string, unknown>;
}

/**
 * State transition record for asset lifecycle tracking
 */
export interface StateTransitionRecord {
  /** Asset undergoing transition */
  readonly assetId: AssetId;
  
  /** Previous state */
  readonly fromState: string;
  
  /** New state */
  readonly toState: string;
  
  /** Transition trigger */
  readonly trigger: string;
  
  /** Triggering producer */
  readonly triggeredBy: ProducerId;
  
  /** Validating authority */
  readonly validatedBy: ValidatorId;
  
  /** Transition timestamp */
  readonly transitionedAt: Timestamp;
  
  /** Validation workflow ID */
  readonly workflowId?: string;
  
  /** Transition metadata */
  readonly transitionMetadata: Record<string, unknown>;
}

/**
 * Access permission record for multi-party access control
 */
export interface AccessPermissionRecord {
  /** Asset under access control */
  readonly assetId: AssetId;
  
  /** Entity being granted permission */
  readonly grantedTo: Address;
  
  /** Type of permission granted */
  readonly permissionType: string;
  
  /** Permission scope/limitations */
  readonly scope: Record<string, unknown>;
  
  /** Granting authority */
  readonly grantedBy: ValidatorId;
  
  /** Grant timestamp */
  readonly grantedAt: Timestamp;
  
  /** Permission expiry (null if permanent) */
  readonly expiresAt: Timestamp | null;
}

/**
 * Validation proof record for cryptographic verification
 */
export interface ValidationProofRecord {
  /** Asset being proven */
  readonly assetId: AssetId;
  
  /** Proof type */
  readonly proofType: string;
  
  /** Cryptographic proof data */
  readonly proofData: string;
  
  /** Validating authority */
  readonly validatedBy: ValidatorId;
  
  /** Validation timestamp */
  readonly validatedAt: Timestamp;
  
  /** Proof metadata */
  readonly proofMetadata: Record<string, unknown>;
}

/**
 * Fiber transaction types for producer-validator operations
 */
export enum AssetFiberTransactionType {
  /** Register new producer */
  REGISTER_PRODUCER = 'register_producer',
  
  /** Register new validator */
  REGISTER_VALIDATOR = 'register_validator',
  
  /** Establish producer-validator relationship */
  ESTABLISH_RELATIONSHIP = 'establish_relationship',
  
  /** Submit validation request */
  SUBMIT_VALIDATION_REQUEST = 'submit_validation_request',
  
  /** Provide validation response */
  PROVIDE_VALIDATION_RESPONSE = 'provide_validation_response',
  
  /** Create asset */
  CREATE_ASSET = 'create_asset',
  
  /** Transfer asset ownership */
  TRANSFER_ASSET = 'transfer_asset',
  
  /** Change asset state */
  CHANGE_ASSET_STATE = 'change_asset_state',
  
  /** Start multi-party coordination */
  START_COORDINATION = 'start_coordination',
  
  /** Provide coordination approval */
  COORDINATION_APPROVAL = 'coordination_approval',
  
  /** Delegate authority */
  DELEGATE_AUTHORITY = 'delegate_authority',
  
  /** Revoke authority */
  REVOKE_AUTHORITY = 'revoke_authority',
}

/**
 * Asset fiber transaction payload base
 */
export interface AssetFiberTransactionPayload {
  /** Transaction type */
  readonly type: AssetFiberTransactionType;
  
  /** Timestamp */
  readonly timestamp: Timestamp;
  
  /** Transaction initiator */
  readonly initiator: Address;
  
  /** Transaction signature */
  readonly signature: string;
  
  /** Transaction-specific data */
  readonly data: unknown;
}

/**
 * JSON Logic integration for validation rules
 */
export interface ValidationRule {
  /** Rule identifier */
  readonly id: string;
  
  /** Rule name */
  readonly name: string;
  
  /** JSON Logic rule definition */
  readonly rule: unknown;
  
  /** Rule description */
  readonly description: string;
  
  /** Rule category */
  readonly category: string;
  
  /** Rule version */
  readonly version: string;
}

/**
 * Validation rule evaluation context
 */
export interface ValidationRuleContext {
  /** Asset being validated */
  readonly asset: AssetDefinition;
  
  /** Current asset state */
  readonly currentState: unknown;
  
  /** Proposed state change */
  readonly proposedChange: unknown;
  
  /** Producer making request */
  readonly producer: unknown;
  
  /** Validator performing validation */
  readonly validator: unknown;
  
  /** Historical context */
  readonly history: readonly StateTransitionRecord[];
  
  /** Additional context data */
  readonly environment: Record<string, unknown>;
}

/**
 * State machine integration for asset lifecycle management
 */
export interface AssetStateMachine {
  /** State machine identifier */
  readonly id: string;
  
  /** Asset type this state machine applies to */
  readonly assetType: string;
  
  /** State definitions */
  readonly states: readonly AssetState[];
  
  /** Transition definitions */
  readonly transitions: readonly AssetStateTransition[];
  
  /** Initial state */
  readonly initialState: string;
  
  /** Terminal states */
  readonly terminalStates: readonly string[];
}

/**
 * Asset state definition
 */
export interface AssetState {
  /** State identifier */
  readonly id: string;
  
  /** State display name */
  readonly name: string;
  
  /** State description */
  readonly description: string;
  
  /** State metadata */
  readonly metadata: Record<string, unknown>;
  
  /** Entry actions (JSON Logic) */
  readonly entryActions: readonly unknown[];
  
  /** Exit actions (JSON Logic) */
  readonly exitActions: readonly unknown[];
}

/**
 * Asset state transition definition
 */
export interface AssetStateTransition {
  /** Transition identifier */
  readonly id: string;
  
  /** Source state */
  readonly fromState: string;
  
  /** Target state */
  readonly toState: string;
  
  /** Transition trigger */
  readonly trigger: string;
  
  /** Guard conditions (JSON Logic) */
  readonly guards: readonly unknown[];
  
  /** Transition effects (JSON Logic) */
  readonly effects: readonly unknown[];
  
  /** Required authority level */
  readonly requiredAuthorityLevel: number;
  
  /** Required producer capabilities */
  readonly requiredCapabilities: readonly string[];
}

/**
 * Integration utilities
 */
export class AssetFiberIntegration {
  
  /**
   * Initialize producer-validator framework for a fiber
   */
  static initializeFramework(
    fiberId: string,
    config: FiberIntegrationConfig
  ): FiberIntegration {
    return {
      fiberId,
      relationships: [],
      activeWorkflows: [],
      config,
    };
  }
  
  /**
   * Validate transaction against producer-validator rules
   */
  static validateTransaction(
    transaction: AssetFiberTransactionPayload,
    fiberState: AssetFiberState,
    rules: readonly ValidationRule[]
  ): ValidationResult {
    // Implementation would apply JSON Logic rules
    // to validate transaction against current state
    return {
      isValid: true,
      violations: [],
      appliedRules: rules.map(r => r.id),
    };
  }
  
  /**
   * Apply state machine transition
   */
  static applyStateTransition(
    assetId: AssetId,
    transition: AssetStateTransition,
    context: ValidationRuleContext
  ): StateTransitionResult {
    // Implementation would execute JSON Logic guards and effects
    return {
      success: true,
      newState: transition.toState,
      effects: [],
    };
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  readonly isValid: boolean;
  
  /** List of rule violations */
  readonly violations: readonly string[];
  
  /** Rules that were applied */
  readonly appliedRules: readonly string[];
}

/**
 * State transition result
 */
export interface StateTransitionResult {
  /** Whether transition succeeded */
  readonly success: boolean;
  
  /** New state after transition */
  readonly newState: string;
  
  /** Side effects that were executed */
  readonly effects: readonly unknown[];
}

/**
 * Default integration configuration
 */
export const DEFAULT_INTEGRATION_CONFIG: FiberIntegrationConfig = {
  enforceProducerValidatorSeparation: true,
  autoCreateWorkflows: true,
  defaultWorkflowTemplates: {
    'create_asset': 'simple_asset_creation',
    'transfer_asset': 'simple_asset_transfer',
    'change_state': 'asset_state_transition',
  },
  validationTimeouts: {
    'create_asset': 3600,    // 1 hour
    'transfer_asset': 1800,  // 30 minutes  
    'change_state': 1800,    // 30 minutes
    'high_value': 14400,     // 4 hours
  },
  coordinationThresholds: {
    'high_value_asset': 2,     // Require 2+ validators
    'sensitive_operation': 3,   // Require 3+ validators
  },
};