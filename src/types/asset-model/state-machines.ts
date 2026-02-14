/**
 * DFA State Machine + JSON Logic Integration
 * 
 * Deterministic Finite Automata (DFA) state machines integrated with OttoChain's
 * JSON Logic Virtual Machine for declarative business logic in asset lifecycle management.
 * 
 * This module provides:
 * - DFA state machine definitions compatible with JLVM
 * - State transition validation using JSON Logic predicates
 * - Asset lifecycle templates for common patterns
 * - Composition primitives for complex multi-party coordination
 * - Debugging and visualization tools
 * 
 * @packageDocumentation
 */

import { Address, AssetId, ProducerId, ValidatorId, Timestamp } from './producer-validator.js';

/**
 * State identifier type
 */
export type StateId = string;

/**
 * Transition identifier type
 */
export type TransitionId = string;

/**
 * Event type identifier
 */
export type EventType = string;

/**
 * JSON Logic expression type for guards and effects
 */
export type JSONLogicExpression = Record<string, any>;

/**
 * State definition in a DFA state machine
 */
export interface DFAState {
  /** Unique identifier for this state */
  readonly id: StateId;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Detailed description of this state */
  readonly description: string;
  
  /** Whether this is an initial state */
  readonly isInitial: boolean;
  
  /** Whether this is a terminal/final state */
  readonly isFinal: boolean;
  
  /** State-specific data schema */
  readonly dataSchema?: Record<string, any>;
  
  /** State entry actions (JSON Logic expressions) */
  readonly onEntry?: JSONLogicExpression[];
  
  /** State exit actions (JSON Logic expressions) */
  readonly onExit?: JSONLogicExpression[];
  
  /** Visualization metadata */
  readonly visualization?: {
    position: { x: number; y: number };
    color: string;
    shape: 'circle' | 'square' | 'diamond';
  };
}

/**
 * State transition definition with JSON Logic guards
 */
export interface DFATransition {
  /** Unique identifier for this transition */
  readonly id: TransitionId;
  
  /** Source state */
  readonly fromState: StateId;
  
  /** Destination state */
  readonly toState: StateId;
  
  /** Event that triggers this transition */
  readonly eventType: EventType;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Guard conditions (JSON Logic expressions) - ALL must be true */
  readonly guards: JSONLogicExpression[];
  
  /** Side effects to execute (JSON Logic expressions) */
  readonly effects: JSONLogicExpression[];
  
  /** Required producer capabilities for this transition */
  readonly requiredCapabilities: readonly string[];
  
  /** Required validator domains for this transition */
  readonly requiredValidatorDomains: readonly string[];
  
  /** Minimum validator authority level required */
  readonly minValidatorAuthority: number;
  
  /** Whether this transition requires multi-party coordination */
  readonly requiresCoordination: boolean;
  
  /** Timeout for transition completion (seconds) */
  readonly timeoutSeconds?: number;
  
  /** Visualization metadata */
  readonly visualization?: {
    label: string;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

/**
 * Complete DFA state machine definition
 */
export interface DFAStateMachine {
  /** Unique identifier for this state machine */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Detailed description */
  readonly description: string;
  
  /** Version for schema evolution */
  readonly version: string;
  
  /** Asset type this state machine applies to */
  readonly assetType: string;
  
  /** All states in this machine */
  readonly states: readonly DFAState[];
  
  /** All transitions between states */
  readonly transitions: readonly DFATransition[];
  
  /** Initial state */
  readonly initialState: StateId;
  
  /** Terminal states (if any) */
  readonly terminalStates: readonly StateId[];
  
  /** Global variables accessible to all guards/effects */
  readonly globalVariables: Record<string, any>;
  
  /** Machine-level metadata */
  readonly metadata: {
    createdAt: Timestamp;
    createdBy: Address;
    tags: readonly string[];
    category: string;
  };
}

/**
 * Runtime state machine instance
 */
export interface DFAInstance {
  /** Instance identifier */
  readonly instanceId: string;
  
  /** Associated asset */
  readonly assetId: AssetId;
  
  /** State machine definition */
  readonly machineId: string;
  
  /** Current state */
  readonly currentState: StateId;
  
  /** Current state data */
  readonly stateData: Record<string, any>;
  
  /** Instance creation timestamp */
  readonly createdAt: Timestamp;
  
  /** Last updated timestamp */
  readonly updatedAt: Timestamp;
  
  /** Transition history */
  readonly transitionHistory: readonly TransitionExecution[];
  
  /** Instance-specific variables */
  readonly variables: Record<string, any>;
}

/**
 * Record of a transition execution
 */
export interface TransitionExecution {
  /** Execution identifier */
  readonly executionId: string;
  
  /** Transition that was executed */
  readonly transitionId: TransitionId;
  
  /** Event that triggered the transition */
  readonly triggerEvent: StateEvent;
  
  /** Producer who initiated the transition */
  readonly producerId: ProducerId;
  
  /** Validators who approved the transition */
  readonly validatorIds: readonly ValidatorId[];
  
  /** Execution timestamp */
  readonly executedAt: Timestamp;
  
  /** Guard evaluation results */
  readonly guardResults: readonly GuardEvaluation[];
  
  /** Effect execution results */
  readonly effectResults: readonly EffectExecution[];
  
  /** Previous state */
  readonly fromState: StateId;
  
  /** Resulting state */
  readonly toState: StateId;
  
  /** State changes that occurred */
  readonly stateChanges: Record<string, any>;
}

/**
 * Event that can trigger state transitions
 */
export interface StateEvent {
  /** Event identifier */
  readonly eventId: string;
  
  /** Event type */
  readonly eventType: EventType;
  
  /** Event data payload */
  readonly data: Record<string, any>;
  
  /** Producer who generated this event */
  readonly producerId: ProducerId;
  
  /** Event timestamp */
  readonly timestamp: Timestamp;
  
  /** Cryptographic signature */
  readonly signature: string;
}

/**
 * Guard condition evaluation result
 */
export interface GuardEvaluation {
  /** Guard expression */
  readonly guard: JSONLogicExpression;
  
  /** Evaluation result */
  readonly result: boolean;
  
  /** Evaluation context (variables available) */
  readonly context: Record<string, any>;
  
  /** Error if evaluation failed */
  readonly error?: string;
  
  /** Evaluation timestamp */
  readonly evaluatedAt: Timestamp;
}

/**
 * Effect execution result
 */
export interface EffectExecution {
  /** Effect expression */
  readonly effect: JSONLogicExpression;
  
  /** Execution result */
  readonly result: any;
  
  /** State changes caused by this effect */
  readonly stateChanges: Record<string, any>;
  
  /** Error if execution failed */
  readonly error?: string;
  
  /** Execution timestamp */
  readonly executedAt: Timestamp;
}

/**
 * State machine validation result
 */
export interface StateMachineValidationResult {
  /** Whether the state machine is valid */
  readonly isValid: boolean;
  
  /** Validation errors (if any) */
  readonly errors: readonly string[];
  
  /** Validation warnings */
  readonly warnings: readonly string[];
  
  /** Detailed validation info */
  readonly details: {
    stateCount: number;
    transitionCount: number;
    reachableStates: readonly StateId[];
    unreachableStates: readonly StateId[];
    deadlockStates: readonly StateId[];
    hasInitialState: boolean;
    hasTerminalStates: boolean;
  };
}

/**
 * Asset lifecycle template for common patterns
 */
export interface AssetLifecycleTemplate {
  /** Template identifier */
  readonly templateId: string;
  
  /** Template name */
  readonly name: string;
  
  /** Template description */
  readonly description: string;
  
  /** Asset types this template applies to */
  readonly applicableAssetTypes: readonly string[];
  
  /** State machine definition */
  readonly stateMachine: DFAStateMachine;
  
  /** Default configuration values */
  readonly defaults: Record<string, any>;
  
  /** Required producer capabilities */
  readonly requiredProducerCapabilities: readonly string[];
  
  /** Required validator domains */
  readonly requiredValidatorDomains: readonly string[];
  
  /** Template usage examples */
  readonly examples: readonly {
    name: string;
    description: string;
    configuration: Record<string, any>;
  }[];
}

/**
 * State machine composition for complex scenarios
 */
export interface StateMachineComposition {
  /** Composition identifier */
  readonly compositionId: string;
  
  /** Composed state machines */
  readonly machines: readonly {
    machineId: string;
    role: string;
    dependencies: readonly string[];
  }[];
  
  /** Coordination rules between machines */
  readonly coordinationRules: readonly {
    trigger: JSONLogicExpression;
    actions: JSONLogicExpression[];
  }[];
  
  /** Shared state variables */
  readonly sharedState: Record<string, any>;
}

// ============================================================================
// Asset Lifecycle Templates
// ============================================================================

/**
 * Basic asset creation → active → transfer → burn lifecycle
 */
export const BASIC_ASSET_LIFECYCLE: AssetLifecycleTemplate = {
  templateId: 'basic_asset_lifecycle',
  name: 'Basic Asset Lifecycle',
  description: 'Simple creation → activation → transfer → burn cycle for standard assets',
  applicableAssetTypes: ['token', 'nft', 'document'],
  
  stateMachine: {
    id: 'basic_asset_lifecycle',
    name: 'Basic Asset Lifecycle',
    description: 'Standard asset lifecycle with creation, activation, transfer, and burn phases',
    version: '1.0.0',
    assetType: 'generic',
    
    states: [
      {
        id: 'created',
        name: 'Created',
        description: 'Asset has been created but is not yet active',
        isInitial: true,
        isFinal: false,
        onEntry: [{ "log": "Asset created" }],
        visualization: { position: { x: 100, y: 100 }, color: '#E3F2FD', shape: 'circle' }
      },
      {
        id: 'active',
        name: 'Active',
        description: 'Asset is active and can be operated on',
        isInitial: false,
        isFinal: false,
        onEntry: [{ "log": "Asset activated" }],
        visualization: { position: { x: 300, y: 100 }, color: '#E8F5E8', shape: 'circle' }
      },
      {
        id: 'transferred',
        name: 'Transferred',
        description: 'Asset has been transferred to a new owner',
        isInitial: false,
        isFinal: false,
        onEntry: [{ "log": "Asset transferred" }],
        visualization: { position: { x: 500, y: 100 }, color: '#FFF3E0', shape: 'circle' }
      },
      {
        id: 'burned',
        name: 'Burned',
        description: 'Asset has been permanently destroyed',
        isInitial: false,
        isFinal: true,
        onEntry: [{ "log": "Asset burned - permanent destruction" }],
        visualization: { position: { x: 300, y: 300 }, color: '#FFEBEE', shape: 'square' }
      }
    ],
    
    transitions: [
      {
        id: 'activate',
        fromState: 'created',
        toState: 'active',
        eventType: 'activation_request',
        name: 'Activate Asset',
        guards: [
          { ">=": [{ "var": "validator.authorityLevel" }, 10] },
          { "!=": [{ "var": "asset.status" }, "suspended"] }
        ],
        effects: [
          { 
            "merge": [
              { "var": "state" },
              { 
                "activatedAt": { "var": "$timestamp" },
                "activatedBy": { "var": "validator.id" },
                "status": "active"
              }
            ]
          }
        ],
        requiredCapabilities: ['state_management'],
        requiredValidatorDomains: ['asset_management'],
        minValidatorAuthority: 10,
        requiresCoordination: false,
        visualization: { label: 'Activate', color: '#4CAF50', style: 'solid' }
      },
      {
        id: 'transfer',
        fromState: 'active',
        toState: 'transferred',
        eventType: 'transfer_request',
        name: 'Transfer Asset',
        guards: [
          { "!!": [{ "var": "event.to" }] },
          { "!==": [{ "var": "event.to" }, { "var": "state.owner" }] },
          { ">=": [{ "var": "validator.authorityLevel" }, 5] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "owner": { "var": "event.to" },
                "transferredAt": { "var": "$timestamp" },
                "transferredBy": { "var": "producer.id" },
                "previousOwner": { "var": "state.owner" }
              }
            ]
          }
        ],
        requiredCapabilities: ['asset_transfer'],
        requiredValidatorDomains: ['transfer_approval'],
        minValidatorAuthority: 5,
        requiresCoordination: false,
        visualization: { label: 'Transfer', color: '#FF9800', style: 'solid' }
      },
      {
        id: 'return_to_active',
        fromState: 'transferred',
        toState: 'active',
        eventType: 'activate_after_transfer',
        name: 'Return to Active',
        guards: [
          { ">=": [{ "var": "validator.authorityLevel" }, 5] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              { 
                "reactivatedAt": { "var": "$timestamp" },
                "status": "active"
              }
            ]
          }
        ],
        requiredCapabilities: ['state_management'],
        requiredValidatorDomains: ['asset_management'],
        minValidatorAuthority: 5,
        requiresCoordination: false,
        visualization: { label: 'Reactivate', color: '#4CAF50', style: 'dashed' }
      },
      {
        id: 'burn_from_active',
        fromState: 'active',
        toState: 'burned',
        eventType: 'burn_request',
        name: 'Burn from Active',
        guards: [
          { ">=": [{ "var": "validator.authorityLevel" }, 20] },
          { "===": [{ "var": "event.producer" }, { "var": "state.owner" }] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "burnedAt": { "var": "$timestamp" },
                "burnedBy": { "var": "producer.id" },
                "status": "burned",
                "finalState": true
              }
            ]
          }
        ],
        requiredCapabilities: ['asset_destruction'],
        requiredValidatorDomains: ['destruction_approval'],
        minValidatorAuthority: 20,
        requiresCoordination: false,
        visualization: { label: 'Burn', color: '#F44336', style: 'solid' }
      },
      {
        id: 'burn_from_transferred',
        fromState: 'transferred',
        toState: 'burned',
        eventType: 'burn_request',
        name: 'Burn from Transferred',
        guards: [
          { ">=": [{ "var": "validator.authorityLevel" }, 20] },
          { "===": [{ "var": "event.producer" }, { "var": "state.owner" }] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "burnedAt": { "var": "$timestamp" },
                "burnedBy": { "var": "producer.id" },
                "status": "burned",
                "finalState": true
              }
            ]
          }
        ],
        requiredCapabilities: ['asset_destruction'],
        requiredValidatorDomains: ['destruction_approval'],
        minValidatorAuthority: 20,
        requiresCoordination: false,
        visualization: { label: 'Burn', color: '#F44336', style: 'solid' }
      }
    ],
    
    initialState: 'created',
    terminalStates: ['burned'],
    
    globalVariables: {
      maxTransfersPerDay: 10,
      requiredBurnConfirmations: 2
    },
    
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      tags: ['basic', 'asset', 'lifecycle', 'standard'],
      category: 'asset_management'
    }
  },
  
  defaults: {
    initialOwner: null,
    transferLimits: { daily: 10, monthly: 100 },
    burnRequiresConfirmation: true
  },
  
  requiredProducerCapabilities: ['state_management', 'asset_transfer', 'asset_destruction'],
  requiredValidatorDomains: ['asset_management', 'transfer_approval', 'destruction_approval'],
  
  examples: [
    {
      name: 'Basic Token',
      description: 'Simple transferable token lifecycle',
      configuration: {
        assetType: 'token',
        transferable: true,
        expendable: false
      }
    },
    {
      name: 'NFT Artwork',
      description: 'Non-fungible token with ownership tracking',
      configuration: {
        assetType: 'nft',
        transferable: true,
        replicable: false
      }
    }
  ]
};

/**
 * Multi-party escrow lifecycle requiring coordination
 */
export const MULTI_PARTY_ESCROW_LIFECYCLE: AssetLifecycleTemplate = {
  templateId: 'multi_party_escrow',
  name: 'Multi-Party Escrow',
  description: 'Complex escrow requiring multiple party coordination and approval',
  applicableAssetTypes: ['escrow', 'contract', 'agreement'],
  
  stateMachine: {
    id: 'multi_party_escrow',
    name: 'Multi-Party Escrow State Machine',
    description: 'Escrow with deposit, dispute resolution, and multi-party release',
    version: '1.0.0',
    assetType: 'escrow',
    
    states: [
      {
        id: 'proposed',
        name: 'Proposed',
        description: 'Escrow terms have been proposed but not yet accepted',
        isInitial: true,
        isFinal: false,
        visualization: { position: { x: 100, y: 100 }, color: '#FFF9C4', shape: 'circle' }
      },
      {
        id: 'accepted',
        name: 'Accepted',
        description: 'All parties have accepted the escrow terms',
        isInitial: false,
        isFinal: false,
        visualization: { position: { x: 300, y: 100 }, color: '#E8F5E8', shape: 'circle' }
      },
      {
        id: 'funded',
        name: 'Funded',
        description: 'Escrow has been funded and is awaiting conditions',
        isInitial: false,
        isFinal: false,
        visualization: { position: { x: 500, y: 100 }, color: '#E3F2FD', shape: 'circle' }
      },
      {
        id: 'disputed',
        name: 'Disputed',
        description: 'Escrow is under dispute and requires resolution',
        isInitial: false,
        isFinal: false,
        visualization: { position: { x: 300, y: 300 }, color: '#FFECB3', shape: 'diamond' }
      },
      {
        id: 'released',
        name: 'Released',
        description: 'Funds have been released to the beneficiary',
        isInitial: false,
        isFinal: true,
        visualization: { position: { x: 700, y: 100 }, color: '#C8E6C9', shape: 'square' }
      },
      {
        id: 'refunded',
        name: 'Refunded',
        description: 'Funds have been returned to the depositor',
        isInitial: false,
        isFinal: true,
        visualization: { position: { x: 100, y: 300 }, color: '#FFCDD2', shape: 'square' }
      }
    ],
    
    transitions: [
      {
        id: 'accept_terms',
        fromState: 'proposed',
        toState: 'accepted',
        eventType: 'accept_escrow',
        name: 'Accept Terms',
        guards: [
          { ">=": [{ "var": "state.acceptanceCount" }, { "var": "state.requiredAcceptances" }] },
          { ">=": [{ "var": "validator.authorityLevel" }, 15] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "acceptedAt": { "var": "$timestamp" },
                "status": "accepted",
                "acceptedBy": { "cat": [{ "var": "state.acceptedBy" }, [{ "var": "producer.id" }]] }
              }
            ]
          }
        ],
        requiredCapabilities: ['escrow_management'],
        requiredValidatorDomains: ['escrow_approval'],
        minValidatorAuthority: 15,
        requiresCoordination: true,
        visualization: { label: 'Accept', color: '#4CAF50', style: 'solid' }
      },
      {
        id: 'fund_escrow',
        fromState: 'accepted',
        toState: 'funded',
        eventType: 'deposit_funds',
        name: 'Fund Escrow',
        guards: [
          { ">=": [{ "var": "event.amount" }, { "var": "state.requiredAmount" }] },
          { ">=": [{ "var": "validator.authorityLevel" }, 10] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "fundedAt": { "var": "$timestamp" },
                "actualAmount": { "var": "event.amount" },
                "depositor": { "var": "producer.id" },
                "status": "funded"
              }
            ]
          }
        ],
        requiredCapabilities: ['funds_management'],
        requiredValidatorDomains: ['financial_approval'],
        minValidatorAuthority: 10,
        requiresCoordination: false,
        timeoutSeconds: 3600,
        visualization: { label: 'Fund', color: '#2196F3', style: 'solid' }
      },
      {
        id: 'raise_dispute',
        fromState: 'funded',
        toState: 'disputed',
        eventType: 'dispute_escrow',
        name: 'Raise Dispute',
        guards: [
          { "!!": [{ "var": "event.disputeReason" }] },
          { ">=": [{ "var": "validator.authorityLevel" }, 25] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "disputedAt": { "var": "$timestamp" },
                "disputeReason": { "var": "event.disputeReason" },
                "disputedBy": { "var": "producer.id" },
                "status": "disputed"
              }
            ]
          }
        ],
        requiredCapabilities: ['dispute_management'],
        requiredValidatorDomains: ['dispute_resolution'],
        minValidatorAuthority: 25,
        requiresCoordination: true,
        visualization: { label: 'Dispute', color: '#FF9800', style: 'solid' }
      },
      {
        id: 'release_funds',
        fromState: 'funded',
        toState: 'released',
        eventType: 'release_escrow',
        name: 'Release Funds',
        guards: [
          { ">=": [{ "var": "state.approvalCount" }, { "var": "state.requiredApprovals" }] },
          { ">=": [{ "var": "validator.authorityLevel" }, 30] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "releasedAt": { "var": "$timestamp" },
                "releasedTo": { "var": "state.beneficiary" },
                "finalAmount": { "var": "state.actualAmount" },
                "status": "released"
              }
            ]
          }
        ],
        requiredCapabilities: ['funds_release'],
        requiredValidatorDomains: ['financial_approval'],
        minValidatorAuthority: 30,
        requiresCoordination: true,
        visualization: { label: 'Release', color: '#4CAF50', style: 'solid' }
      },
      {
        id: 'resolve_dispute_release',
        fromState: 'disputed',
        toState: 'released',
        eventType: 'resolve_dispute_release',
        name: 'Resolve Dispute - Release',
        guards: [
          { "===": [{ "var": "event.resolution" }, "release"] },
          { ">=": [{ "var": "validator.authorityLevel" }, 50] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "resolvedAt": { "var": "$timestamp" },
                "resolution": "release",
                "resolvedBy": { "var": "validator.id" },
                "releasedTo": { "var": "state.beneficiary" },
                "status": "released"
              }
            ]
          }
        ],
        requiredCapabilities: ['dispute_resolution'],
        requiredValidatorDomains: ['dispute_resolution'],
        minValidatorAuthority: 50,
        requiresCoordination: true,
        visualization: { label: 'Resolve-Release', color: '#4CAF50', style: 'dashed' }
      },
      {
        id: 'resolve_dispute_refund',
        fromState: 'disputed',
        toState: 'refunded',
        eventType: 'resolve_dispute_refund',
        name: 'Resolve Dispute - Refund',
        guards: [
          { "===": [{ "var": "event.resolution" }, "refund"] },
          { ">=": [{ "var": "validator.authorityLevel" }, 50] }
        ],
        effects: [
          {
            "merge": [
              { "var": "state" },
              {
                "resolvedAt": { "var": "$timestamp" },
                "resolution": "refund",
                "resolvedBy": { "var": "validator.id" },
                "refundedTo": { "var": "state.depositor" },
                "status": "refunded"
              }
            ]
          }
        ],
        requiredCapabilities: ['dispute_resolution'],
        requiredValidatorDomains: ['dispute_resolution'],
        minValidatorAuthority: 50,
        requiresCoordination: true,
        visualization: { label: 'Resolve-Refund', color: '#F44336', style: 'dashed' }
      }
    ],
    
    initialState: 'proposed',
    terminalStates: ['released', 'refunded'],
    
    globalVariables: {
      maxDisputeResolutionDays: 30,
      requiredApprovals: 2,
      requiredAcceptances: 2
    },
    
    metadata: {
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      tags: ['escrow', 'multi-party', 'dispute', 'coordination'],
      category: 'financial'
    }
  },
  
  defaults: {
    requiredApprovals: 2,
    requiredAcceptances: 2,
    maxDisputePeriod: 2592000, // 30 days
    autoReleaseAfter: 7776000  // 90 days
  },
  
  requiredProducerCapabilities: ['escrow_management', 'funds_management', 'dispute_management', 'funds_release'],
  requiredValidatorDomains: ['escrow_approval', 'financial_approval', 'dispute_resolution'],
  
  examples: [
    {
      name: 'Property Purchase Escrow',
      description: 'Real estate transaction escrow with inspection period',
      configuration: {
        requiredApprovals: 3,
        maxDisputePeriod: 1209600, // 14 days
        parties: ['buyer', 'seller', 'agent']
      }
    },
    {
      name: 'Service Contract Escrow',
      description: 'Service delivery escrow with milestone releases',
      configuration: {
        requiredApprovals: 2,
        milestoneReleases: true,
        parties: ['client', 'service_provider']
      }
    }
  ]
};

// ============================================================================
// State Machine Validation and Utilities
// ============================================================================

/**
 * Validate a DFA state machine definition
 */
export function validateStateMachine(machine: DFAStateMachine): StateMachineValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!machine.states.length) {
    errors.push('State machine must have at least one state');
  }
  
  if (!machine.transitions.length) {
    warnings.push('State machine has no transitions');
  }
  
  // Check for initial state
  const initialStates = machine.states.filter(s => s.isInitial);
  if (initialStates.length === 0) {
    errors.push('State machine must have exactly one initial state');
  } else if (initialStates.length > 1) {
    errors.push('State machine can have only one initial state');
  }
  
  // Check that specified initial state exists
  if (!machine.states.find(s => s.id === machine.initialState)) {
    errors.push(`Initial state '${machine.initialState}' not found in states`);
  }
  
  // Check terminal states
  const terminalStatesInStates = machine.terminalStates.filter(
    terminalId => machine.states.find(s => s.id === terminalId)
  );
  if (terminalStatesInStates.length !== machine.terminalStates.length) {
    errors.push('Some terminal states are not defined in states array');
  }
  
  // Check transition validity
  for (const transition of machine.transitions) {
    if (!machine.states.find(s => s.id === transition.fromState)) {
      errors.push(`Transition '${transition.id}' fromState '${transition.fromState}' not found`);
    }
    if (!machine.states.find(s => s.id === transition.toState)) {
      errors.push(`Transition '${transition.id}' toState '${transition.toState}' not found`);
    }
    
    // Validate guards are arrays
    if (!Array.isArray(transition.guards)) {
      errors.push(`Transition '${transition.id}' guards must be an array`);
    }
    
    // Validate effects are arrays
    if (!Array.isArray(transition.effects)) {
      errors.push(`Transition '${transition.id}' effects must be an array`);
    }
  }
  
  // Check reachability
  const reachableStates = computeReachableStates(machine);
  const allStateIds = machine.states.map(s => s.id);
  const unreachableStates = allStateIds.filter(id => !reachableStates.includes(id));
  
  if (unreachableStates.length > 0) {
    warnings.push(`Unreachable states detected: ${unreachableStates.join(', ')}`);
  }
  
  // Check for deadlock states (non-terminal states with no outgoing transitions)
  const deadlockStates = allStateIds.filter(stateId => {
    const isTerminal = machine.terminalStates.includes(stateId);
    if (isTerminal) return false;
    
    const hasOutgoingTransition = machine.transitions.some(t => t.fromState === stateId);
    return !hasOutgoingTransition;
  });
  
  if (deadlockStates.length > 0) {
    warnings.push(`Potential deadlock states: ${deadlockStates.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    details: {
      stateCount: machine.states.length,
      transitionCount: machine.transitions.length,
      reachableStates,
      unreachableStates,
      deadlockStates,
      hasInitialState: initialStates.length === 1,
      hasTerminalStates: machine.terminalStates.length > 0
    }
  };
}

/**
 * Compute reachable states from initial state
 */
function computeReachableStates(machine: DFAStateMachine): StateId[] {
  const reachable = new Set<StateId>();
  const queue: StateId[] = [machine.initialState];
  
  while (queue.length > 0) {
    const currentState = queue.shift()!;
    if (reachable.has(currentState)) continue;
    
    reachable.add(currentState);
    
    // Find all transitions from current state
    for (const transition of machine.transitions) {
      if (transition.fromState === currentState && !reachable.has(transition.toState)) {
        queue.push(transition.toState);
      }
    }
  }
  
  return Array.from(reachable);
}

/**
 * Generate DOT notation for state machine visualization
 */
export function generateDOTVisualization(machine: DFAStateMachine): string {
  let dot = `digraph "${machine.id}" {\n`;
  dot += `  label="${machine.name}";\n`;
  dot += `  rankdir=LR;\n`;
  dot += `  node [shape=circle];\n\n`;
  
  // Add states
  for (const state of machine.states) {
    const shape = state.isFinal ? 'doublecircle' : 'circle';
    const color = state.visualization?.color || '#E3F2FD';
    const fillcolor = state.isInitial ? '#4CAF50' : color;
    
    dot += `  ${state.id} [label="${state.name}", shape=${shape}, style=filled, fillcolor="${fillcolor}"];\n`;
  }
  
  dot += '\n';
  
  // Add transitions
  for (const transition of machine.transitions) {
    const label = transition.visualization?.label || transition.name;
    const color = transition.visualization?.color || '#666666';
    const style = transition.visualization?.style || 'solid';
    
    dot += `  ${transition.fromState} -> ${transition.toState} [label="${label}", color="${color}", style=${style}];\n`;
  }
  
  dot += '}\n';
  
  return dot;
}

/**
 * State machine debugging utilities
 */
export const StateMachineDebugger = {
  /**
   * Check if a transition is valid for current state and context
   */
  canTransition(
    machine: DFAStateMachine,
    currentState: StateId,
    eventType: EventType,
    context: Record<string, any>
  ): { canTransition: boolean; validTransitions: DFATransition[]; reasons: string[] } {
    // Note: context parameter reserved for future guard evaluation
    void context;
    
    const validTransitions = machine.transitions.filter(
      t => t.fromState === currentState && t.eventType === eventType
    );
    
    if (validTransitions.length === 0) {
      return {
        canTransition: false,
        validTransitions: [],
        reasons: [`No transitions from state '${currentState}' for event '${eventType}'`]
      };
    }
    
    // Note: In a real implementation, you'd evaluate JSON Logic guards here
    // For now, we assume all found transitions are valid
    return {
      canTransition: true,
      validTransitions,
      reasons: []
    };
  },
  
  /**
   * Get possible next states from current state
   */
  getPossibleNextStates(machine: DFAStateMachine, currentState: StateId): StateId[] {
    return machine.transitions
      .filter(t => t.fromState === currentState)
      .map(t => t.toState)
      .filter((stateId, index, array) => array.indexOf(stateId) === index); // unique
  },
  
  /**
   * Get transition path from initial to target state
   */
  findTransitionPath(machine: DFAStateMachine, targetState: StateId): StateId[] | null {
    const visited = new Set<StateId>();
    const queue: { state: StateId; path: StateId[] }[] = [
      { state: machine.initialState, path: [machine.initialState] }
    ];
    
    while (queue.length > 0) {
      const { state, path } = queue.shift()!;
      
      if (state === targetState) {
        return path;
      }
      
      if (visited.has(state)) continue;
      visited.add(state);
      
      for (const transition of machine.transitions) {
        if (transition.fromState === state && !visited.has(transition.toState)) {
          queue.push({
            state: transition.toState,
            path: [...path, transition.toState]
          });
        }
      }
    }
    
    return null;
  }
};

// ============================================================================
// Template Registry
// ============================================================================

/**
 * Registry of available asset lifecycle templates
 */
export const ASSET_LIFECYCLE_TEMPLATES: Record<string, AssetLifecycleTemplate> = {
  'basic_asset_lifecycle': BASIC_ASSET_LIFECYCLE,
  'multi_party_escrow': MULTI_PARTY_ESCROW_LIFECYCLE
};

/**
 * Get available template IDs
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(ASSET_LIFECYCLE_TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AssetLifecycleTemplate | null {
  return ASSET_LIFECYCLE_TEMPLATES[templateId] || null;
}

/**
 * Find templates by asset type
 */
export function findTemplatesByAssetType(assetType: string): AssetLifecycleTemplate[] {
  return Object.values(ASSET_LIFECYCLE_TEMPLATES).filter(
    template => template.applicableAssetTypes.includes(assetType)
  );
}