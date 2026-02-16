"use strict";
/**
 * OttoChain Integration Patterns
 *
 * This module defines how the Producer-Validator framework integrates
 * with OttoChain's fiber system, state machines, and transaction processing.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_INTEGRATION_CONFIG = exports.AssetFiberIntegration = exports.AssetFiberTransactionType = void 0;
/**
 * Fiber transaction types for producer-validator operations
 */
var AssetFiberTransactionType;
(function (AssetFiberTransactionType) {
    /** Register new producer */
    AssetFiberTransactionType["REGISTER_PRODUCER"] = "register_producer";
    /** Register new validator */
    AssetFiberTransactionType["REGISTER_VALIDATOR"] = "register_validator";
    /** Establish producer-validator relationship */
    AssetFiberTransactionType["ESTABLISH_RELATIONSHIP"] = "establish_relationship";
    /** Submit validation request */
    AssetFiberTransactionType["SUBMIT_VALIDATION_REQUEST"] = "submit_validation_request";
    /** Provide validation response */
    AssetFiberTransactionType["PROVIDE_VALIDATION_RESPONSE"] = "provide_validation_response";
    /** Create asset */
    AssetFiberTransactionType["CREATE_ASSET"] = "create_asset";
    /** Transfer asset ownership */
    AssetFiberTransactionType["TRANSFER_ASSET"] = "transfer_asset";
    /** Change asset state */
    AssetFiberTransactionType["CHANGE_ASSET_STATE"] = "change_asset_state";
    /** Start multi-party coordination */
    AssetFiberTransactionType["START_COORDINATION"] = "start_coordination";
    /** Provide coordination approval */
    AssetFiberTransactionType["COORDINATION_APPROVAL"] = "coordination_approval";
    /** Delegate authority */
    AssetFiberTransactionType["DELEGATE_AUTHORITY"] = "delegate_authority";
    /** Revoke authority */
    AssetFiberTransactionType["REVOKE_AUTHORITY"] = "revoke_authority";
})(AssetFiberTransactionType || (exports.AssetFiberTransactionType = AssetFiberTransactionType = {}));
/**
 * Integration utilities
 */
class AssetFiberIntegration {
    /**
     * Initialize producer-validator framework for a fiber
     */
    static initializeFramework(fiberId, config) {
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
    static validateTransaction(transaction, fiberState, rules) {
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
    static applyStateTransition(assetId, transition, context) {
        // Implementation would execute JSON Logic guards and effects
        return {
            success: true,
            newState: transition.toState,
            effects: [],
        };
    }
}
exports.AssetFiberIntegration = AssetFiberIntegration;
/**
 * Default integration configuration
 */
exports.DEFAULT_INTEGRATION_CONFIG = {
    enforceProducerValidatorSeparation: true,
    autoCreateWorkflows: true,
    defaultWorkflowTemplates: {
        'create_asset': 'simple_asset_creation',
        'transfer_asset': 'simple_asset_transfer',
        'change_state': 'asset_state_transition',
    },
    validationTimeouts: {
        'create_asset': 3600, // 1 hour
        'transfer_asset': 1800, // 30 minutes  
        'change_state': 1800, // 30 minutes
        'high_value': 14400, // 4 hours
    },
    coordinationThresholds: {
        'high_value_asset': 2, // Require 2+ validators
        'sensitive_operation': 3, // Require 3+ validators
    },
};
