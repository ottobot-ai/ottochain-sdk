"use strict";
/**
 * Producer-Validator Framework
 *
 * Core interfaces for separating data production from governance validation
 * to eliminate double-signing security risks and provide clear separation of concerns.
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FRAMEWORK_CONFIG = exports.ValidatorAction = exports.ProducerAction = exports.CoordinationStatus = exports.ValidationDecision = exports.RelationshipType = void 0;
/**
 * Producer-Validator relationship types
 */
var RelationshipType;
(function (RelationshipType) {
    /** Producer is registered under validator's governance */
    RelationshipType["REGISTERED"] = "registered";
    /** Producer has delegated authority from validator */
    RelationshipType["DELEGATED"] = "delegated";
    /** Producer and validator are in a multi-party coordination */
    RelationshipType["COORDINATED"] = "coordinated";
    /** Relationship is suspended (temporary) */
    RelationshipType["SUSPENDED"] = "suspended";
    /** Relationship is terminated (permanent) */
    RelationshipType["TERMINATED"] = "terminated";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
/**
 * Validation decision types
 */
var ValidationDecision;
(function (ValidationDecision) {
    /** Request approved - proceed with action */
    ValidationDecision["APPROVED"] = "approved";
    /** Request rejected - action denied */
    ValidationDecision["REJECTED"] = "rejected";
    /** Request requires modification */
    ValidationDecision["REQUIRES_MODIFICATION"] = "requires_modification";
    /** Request delegated to another validator */
    ValidationDecision["DELEGATED"] = "delegated";
    /** Validation deferred - needs more information */
    ValidationDecision["DEFERRED"] = "deferred";
})(ValidationDecision || (exports.ValidationDecision = ValidationDecision = {}));
/**
 * Multi-party coordination status
 */
var CoordinationStatus;
(function (CoordinationStatus) {
    /** Coordination is pending participant responses */
    CoordinationStatus["PENDING"] = "pending";
    /** Coordination completed successfully */
    CoordinationStatus["COMPLETED"] = "completed";
    /** Coordination failed (rejections or timeout) */
    CoordinationStatus["FAILED"] = "failed";
    /** Coordination was cancelled */
    CoordinationStatus["CANCELLED"] = "cancelled";
})(CoordinationStatus || (exports.CoordinationStatus = CoordinationStatus = {}));
// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------
/**
 * Producer action types that require validation
 */
var ProducerAction;
(function (ProducerAction) {
    ProducerAction["CREATE_ASSET"] = "create_asset";
    ProducerAction["UPDATE_ASSET"] = "update_asset";
    ProducerAction["TRANSFER_ASSET"] = "transfer_asset";
    ProducerAction["CHANGE_STATE"] = "change_state";
    ProducerAction["BURN_ASSET"] = "burn_asset";
})(ProducerAction || (exports.ProducerAction = ProducerAction = {}));
/**
 * Validator governance actions
 */
var ValidatorAction;
(function (ValidatorAction) {
    ValidatorAction["APPROVE_PRODUCER"] = "approve_producer";
    ValidatorAction["REJECT_PRODUCER"] = "reject_producer";
    ValidatorAction["DELEGATE_AUTHORITY"] = "delegate_authority";
    ValidatorAction["REVOKE_DELEGATION"] = "revoke_delegation";
    ValidatorAction["UPDATE_GOVERNANCE"] = "update_governance";
    ValidatorAction["SLASH_PRODUCER"] = "slash_producer";
})(ValidatorAction || (exports.ValidatorAction = ValidatorAction = {}));
/**
 * Default framework configuration
 */
exports.DEFAULT_FRAMEWORK_CONFIG = {
    minValidatorStake: 1000,
    minProducerBond: 100,
    defaultValidationTimeout: 3600, // 1 hour
    maxAuthorityLevel: 100,
    reputationThresholds: {
        minimum: 10,
        good: 50,
        excellent: 90,
    },
};
