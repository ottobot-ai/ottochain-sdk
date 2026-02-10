/**
 * Validation Workflow Primitives
 * 
 * This module defines standardized workflow patterns for producer-validator
 * interactions, providing templates for common governance scenarios.
 * 
 * @packageDocumentation
 */

import { 
  ProducerId, 
  ValidatorId, 
  AssetId, 
  Timestamp,
  ValidationRequest,
  ValidationResponse,
  ValidationDecision,
  MultiPartyCoordination,
  CoordinationStatus
} from './producer-validator.js';

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  /** Unique template identifier */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Template description */
  readonly description: string;
  
  /** Required producer capabilities */
  readonly requiredProducerCapabilities: readonly string[];
  
  /** Required validator governance domains */
  readonly requiredValidatorDomains: readonly string[];
  
  /** Minimum validator authority level */
  readonly minValidatorAuthorityLevel: number;
  
  /** Default validation timeout (seconds) */
  readonly defaultTimeoutSeconds: number;
  
  /** Template version */
  readonly version: string;
}

/**
 * Workflow instance - active execution of a template
 */
export interface WorkflowInstance {
  /** Unique instance identifier */
  readonly id: string;
  
  /** Template being executed */
  readonly templateId: string;
  
  /** Asset under workflow */
  readonly assetId: AssetId;
  
  /** Initiating producer */
  readonly initiatorId: ProducerId;
  
  /** Assigned validators */
  readonly validatorIds: readonly ValidatorId[];
  
  /** Current workflow step */
  readonly currentStep: WorkflowStep;
  
  /** Workflow status */
  readonly status: WorkflowStatus;
  
  /** Step history */
  readonly stepHistory: readonly WorkflowStepExecution[];
  
  /** Instance creation timestamp */
  readonly createdAt: Timestamp;
  
  /** Workflow deadline */
  readonly deadline: Timestamp;
  
  /** Instance metadata */
  readonly metadata: Record<string, unknown>;
}

/**
 * Individual workflow step definition
 */
export interface WorkflowStep {
  /** Step identifier within template */
  readonly stepId: string;
  
  /** Step name */
  readonly name: string;
  
  /** Step type */
  readonly stepType: WorkflowStepType;
  
  /** Required participants for this step */
  readonly requiredParticipants: readonly string[];
  
  /** Step timeout (seconds) */
  readonly timeoutSeconds: number;
  
  /** Next step conditions */
  readonly nextStepConditions: readonly NextStepCondition[];
  
  /** Step parameters */
  readonly parameters: Record<string, unknown>;
}

/**
 * Workflow step types
 */
export enum WorkflowStepType {
  /** Producer submits data or request */
  PRODUCER_SUBMISSION = 'producer_submission',
  
  /** Validator reviews and decides */
  VALIDATOR_REVIEW = 'validator_review',
  
  /** Multi-party coordination required */
  MULTI_PARTY_COORDINATION = 'multi_party_coordination',
  
  /** Automated validation check */
  AUTOMATED_VALIDATION = 'automated_validation',
  
  /** External oracle consultation */
  EXTERNAL_ORACLE = 'external_oracle',
  
  /** Wait for external condition */
  WAIT_CONDITION = 'wait_condition',
  
  /** Final step - workflow completion */
  COMPLETION = 'completion',
}

/**
 * Condition for proceeding to next step
 */
export interface NextStepCondition {
  /** Condition that must be met */
  readonly condition: string;
  
  /** Next step if condition is true */
  readonly nextStepId: string;
  
  /** JSON Logic rule for condition evaluation */
  readonly conditionRule: unknown;
}

/**
 * Workflow status types
 */
export enum WorkflowStatus {
  /** Workflow is actively progressing */
  ACTIVE = 'active',
  
  /** Workflow completed successfully */
  COMPLETED = 'completed',
  
  /** Workflow failed or was rejected */
  FAILED = 'failed',
  
  /** Workflow was cancelled */
  CANCELLED = 'cancelled',
  
  /** Workflow is paused */
  PAUSED = 'paused',
  
  /** Workflow timed out */
  TIMED_OUT = 'timed_out',
}

/**
 * Workflow step execution record
 */
export interface WorkflowStepExecution {
  /** Step that was executed */
  readonly stepId: string;
  
  /** Participant who executed */
  readonly executedBy: ProducerId | ValidatorId;
  
  /** Execution result */
  readonly result: StepExecutionResult;
  
  /** Execution timestamp */
  readonly executedAt: Timestamp;
  
  /** Time taken (milliseconds) */
  readonly durationMs: number;
  
  /** Step input data */
  readonly input: unknown;
  
  /** Step output data */
  readonly output: unknown;
  
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Step execution result types
 */
export enum StepExecutionResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred',
}

// ---------------------------------------------------------------------------
// Predefined Workflow Templates
// ---------------------------------------------------------------------------

/**
 * Simple asset creation workflow
 */
export const SIMPLE_ASSET_CREATION_TEMPLATE: WorkflowTemplate = {
  id: 'simple_asset_creation',
  name: 'Simple Asset Creation',
  description: 'Basic workflow for creating new assets with validator approval',
  requiredProducerCapabilities: ['asset_creation'],
  requiredValidatorDomains: ['asset_management'],
  minValidatorAuthorityLevel: 10,
  defaultTimeoutSeconds: 3600, // 1 hour
  version: '1.0.0',
};

/**
 * Multi-party asset transfer workflow  
 */
export const MULTI_PARTY_TRANSFER_TEMPLATE: WorkflowTemplate = {
  id: 'multi_party_transfer',
  name: 'Multi-Party Asset Transfer',
  description: 'Complex transfer requiring multiple validator approvals',
  requiredProducerCapabilities: ['asset_transfer'],
  requiredValidatorDomains: ['asset_management', 'compliance'],
  minValidatorAuthorityLevel: 25,
  defaultTimeoutSeconds: 7200, // 2 hours
  version: '1.0.0',
};

/**
 * Asset state transition workflow
 */
export const ASSET_STATE_TRANSITION_TEMPLATE: WorkflowTemplate = {
  id: 'asset_state_transition',
  name: 'Asset State Transition',
  description: 'Workflow for changing asset lifecycle states',
  requiredProducerCapabilities: ['state_management'],
  requiredValidatorDomains: ['lifecycle_management'],
  minValidatorAuthorityLevel: 15,
  defaultTimeoutSeconds: 1800, // 30 minutes
  version: '1.0.0',
};

/**
 * High-value asset workflow (requires multiple validators)
 */
export const HIGH_VALUE_ASSET_TEMPLATE: WorkflowTemplate = {
  id: 'high_value_asset',
  name: 'High Value Asset Management',
  description: 'Enhanced workflow for high-value assets requiring multiple approvals',
  requiredProducerCapabilities: ['asset_creation', 'asset_transfer', 'high_value_handling'],
  requiredValidatorDomains: ['asset_management', 'compliance', 'risk_management'],
  minValidatorAuthorityLevel: 50,
  defaultTimeoutSeconds: 14400, // 4 hours
  version: '1.0.0',
};

// ---------------------------------------------------------------------------
// Workflow Execution Utilities
// ---------------------------------------------------------------------------

/**
 * Workflow execution context
 */
export interface WorkflowExecutionContext {
  /** Current workflow instance */
  readonly instance: WorkflowInstance;
  
  /** Available producers */
  readonly producers: Record<ProducerId, unknown>;
  
  /** Available validators */  
  readonly validators: Record<ValidatorId, unknown>;
  
  /** Current asset state */
  readonly assetState: unknown;
  
  /** Execution environment data */
  readonly environment: Record<string, unknown>;
}

/**
 * Workflow action types
 */
export enum WorkflowAction {
  START_WORKFLOW = 'start_workflow',
  EXECUTE_STEP = 'execute_step',
  APPROVE_STEP = 'approve_step',
  REJECT_STEP = 'reject_step',
  PAUSE_WORKFLOW = 'pause_workflow',
  RESUME_WORKFLOW = 'resume_workflow',
  CANCEL_WORKFLOW = 'cancel_workflow',
  TIMEOUT_WORKFLOW = 'timeout_workflow',
}

/**
 * Workflow event for state changes
 */
export interface WorkflowEvent {
  /** Event ID */
  readonly id: string;
  
  /** Workflow instance ID */
  readonly workflowId: string;
  
  /** Event type */
  readonly eventType: WorkflowAction;
  
  /** Participant who triggered event */
  readonly triggeredBy: ProducerId | ValidatorId;
  
  /** Event timestamp */
  readonly timestamp: Timestamp;
  
  /** Event data */
  readonly data: unknown;
  
  /** Previous workflow state */
  readonly previousState: WorkflowStatus;
  
  /** New workflow state */
  readonly newState: WorkflowStatus;
}

/**
 * Workflow metrics for monitoring
 */
export interface WorkflowMetrics {
  /** Template ID */
  readonly templateId: string;
  
  /** Total workflows executed */
  readonly totalExecutions: number;
  
  /** Successful completions */
  readonly successfulCompletions: number;
  
  /** Average execution time (seconds) */
  readonly averageExecutionTime: number;
  
  /** Timeout rate */
  readonly timeoutRate: number;
  
  /** Most common failure reasons */
  readonly commonFailureReasons: readonly string[];
  
  /** Metrics calculation timestamp */
  readonly calculatedAt: Timestamp;
}

/**
 * Workflow builder utility for creating custom templates
 */
export class WorkflowBuilder {
  private template: Partial<WorkflowTemplate>;
  private steps: WorkflowStep[];
  
  constructor(id: string, name: string) {
    this.template = { id, name, version: '1.0.0' };
    this.steps = [];
  }
  
  /**
   * Set template description
   */
  description(description: string): this {
    this.template.description = description;
    return this;
  }
  
  /**
   * Set required producer capabilities
   */
  requiresProducerCapabilities(capabilities: string[]): this {
    this.template.requiredProducerCapabilities = capabilities;
    return this;
  }
  
  /**
   * Set required validator domains
   */
  requiresValidatorDomains(domains: string[]): this {
    this.template.requiredValidatorDomains = domains;
    return this;
  }
  
  /**
   * Set minimum validator authority level
   */
  minValidatorAuthority(level: number): this {
    this.template.minValidatorAuthorityLevel = level;
    return this;
  }
  
  /**
   * Set default timeout
   */
  defaultTimeout(seconds: number): this {
    this.template.defaultTimeoutSeconds = seconds;
    return this;
  }
  
  /**
   * Add a workflow step
   */
  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }
  
  /**
   * Build the final workflow template
   */
  build(): WorkflowTemplate {
    if (!this.template.description) {
      throw new Error('Template description is required');
    }
    if (!this.template.requiredProducerCapabilities) {
      throw new Error('Required producer capabilities must be specified');
    }
    if (!this.template.requiredValidatorDomains) {
      throw new Error('Required validator domains must be specified');
    }
    if (this.template.minValidatorAuthorityLevel === undefined) {
      throw new Error('Minimum validator authority level must be specified');
    }
    if (!this.template.defaultTimeoutSeconds) {
      throw new Error('Default timeout must be specified');
    }
    
    return this.template as WorkflowTemplate;
  }
}