"use strict";
/**
 * Validation Workflow Primitives
 *
 * This module defines standardized workflow patterns for producer-validator
 * interactions, providing templates for common governance scenarios.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowBuilder = exports.WorkflowAction = exports.HIGH_VALUE_ASSET_TEMPLATE = exports.ASSET_STATE_TRANSITION_TEMPLATE = exports.MULTI_PARTY_TRANSFER_TEMPLATE = exports.SIMPLE_ASSET_CREATION_TEMPLATE = exports.StepExecutionResult = exports.WorkflowStatus = exports.WorkflowStepType = void 0;
/**
 * Workflow step types
 */
var WorkflowStepType;
(function (WorkflowStepType) {
    /** Producer submits data or request */
    WorkflowStepType["PRODUCER_SUBMISSION"] = "producer_submission";
    /** Validator reviews and decides */
    WorkflowStepType["VALIDATOR_REVIEW"] = "validator_review";
    /** Multi-party coordination required */
    WorkflowStepType["MULTI_PARTY_COORDINATION"] = "multi_party_coordination";
    /** Automated validation check */
    WorkflowStepType["AUTOMATED_VALIDATION"] = "automated_validation";
    /** External oracle consultation */
    WorkflowStepType["EXTERNAL_ORACLE"] = "external_oracle";
    /** Wait for external condition */
    WorkflowStepType["WAIT_CONDITION"] = "wait_condition";
    /** Final step - workflow completion */
    WorkflowStepType["COMPLETION"] = "completion";
})(WorkflowStepType || (exports.WorkflowStepType = WorkflowStepType = {}));
/**
 * Workflow status types
 */
var WorkflowStatus;
(function (WorkflowStatus) {
    /** Workflow is actively progressing */
    WorkflowStatus["ACTIVE"] = "active";
    /** Workflow completed successfully */
    WorkflowStatus["COMPLETED"] = "completed";
    /** Workflow failed or was rejected */
    WorkflowStatus["FAILED"] = "failed";
    /** Workflow was cancelled */
    WorkflowStatus["CANCELLED"] = "cancelled";
    /** Workflow is paused */
    WorkflowStatus["PAUSED"] = "paused";
    /** Workflow timed out */
    WorkflowStatus["TIMED_OUT"] = "timed_out";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
/**
 * Step execution result types
 */
var StepExecutionResult;
(function (StepExecutionResult) {
    StepExecutionResult["SUCCESS"] = "success";
    StepExecutionResult["FAILURE"] = "failure";
    StepExecutionResult["TIMEOUT"] = "timeout";
    StepExecutionResult["CANCELLED"] = "cancelled";
    StepExecutionResult["DEFERRED"] = "deferred";
})(StepExecutionResult || (exports.StepExecutionResult = StepExecutionResult = {}));
// ---------------------------------------------------------------------------
// Predefined Workflow Templates
// ---------------------------------------------------------------------------
/**
 * Simple asset creation workflow
 */
exports.SIMPLE_ASSET_CREATION_TEMPLATE = {
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
exports.MULTI_PARTY_TRANSFER_TEMPLATE = {
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
exports.ASSET_STATE_TRANSITION_TEMPLATE = {
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
exports.HIGH_VALUE_ASSET_TEMPLATE = {
    id: 'high_value_asset',
    name: 'High Value Asset Management',
    description: 'Enhanced workflow for high-value assets requiring multiple approvals',
    requiredProducerCapabilities: ['asset_creation', 'asset_transfer', 'high_value_handling'],
    requiredValidatorDomains: ['asset_management', 'compliance', 'risk_management'],
    minValidatorAuthorityLevel: 50,
    defaultTimeoutSeconds: 14400, // 4 hours
    version: '1.0.0',
};
/**
 * Workflow action types
 */
var WorkflowAction;
(function (WorkflowAction) {
    WorkflowAction["START_WORKFLOW"] = "start_workflow";
    WorkflowAction["EXECUTE_STEP"] = "execute_step";
    WorkflowAction["APPROVE_STEP"] = "approve_step";
    WorkflowAction["REJECT_STEP"] = "reject_step";
    WorkflowAction["PAUSE_WORKFLOW"] = "pause_workflow";
    WorkflowAction["RESUME_WORKFLOW"] = "resume_workflow";
    WorkflowAction["CANCEL_WORKFLOW"] = "cancel_workflow";
    WorkflowAction["TIMEOUT_WORKFLOW"] = "timeout_workflow";
})(WorkflowAction || (exports.WorkflowAction = WorkflowAction = {}));
/**
 * Workflow builder utility for creating custom templates
 */
class WorkflowBuilder {
    constructor(id, name) {
        this.template = { id, name, version: '1.0.0' };
        this.steps = [];
    }
    /**
     * Set template description
     */
    description(description) {
        this.template.description = description;
        return this;
    }
    /**
     * Set required producer capabilities
     */
    requiresProducerCapabilities(capabilities) {
        this.template.requiredProducerCapabilities = capabilities;
        return this;
    }
    /**
     * Set required validator domains
     */
    requiresValidatorDomains(domains) {
        this.template.requiredValidatorDomains = domains;
        return this;
    }
    /**
     * Set minimum validator authority level
     */
    minValidatorAuthority(level) {
        this.template.minValidatorAuthorityLevel = level;
        return this;
    }
    /**
     * Set default timeout
     */
    defaultTimeout(seconds) {
        this.template.defaultTimeoutSeconds = seconds;
        return this;
    }
    /**
     * Add a workflow step
     */
    addStep(step) {
        this.steps.push(step);
        return this;
    }
    /**
     * Build the final workflow template
     */
    build() {
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
        return this.template;
    }
}
exports.WorkflowBuilder = WorkflowBuilder;
