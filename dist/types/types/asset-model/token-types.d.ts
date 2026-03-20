/**
 * 16-Type Token Behavior Matrix Implementation
 *
 * This module implements the comprehensive 4-boolean matrix token type system
 * for deterministic asset behaviors in the Producer-Validator Framework.
 *
 * The matrix is based on four fundamental properties (TERV):
 * - **Transferable (T)**: Can tokens be transferred between accounts?
 * - **Expendable (E)**: Are tokens consumed on use?
 * - **Replicable (R)**: Can tokens be duplicated?
 * - **Verifiable (V)**: Can authenticity be cryptographically proven?
 *
 * This creates 16 distinct token types (2^4 = 16 combinations), each with
 * specific behavior patterns, state machines, and interaction rules.
 *
 * @example Basic Token Type Usage
 * ```typescript
 * import {
 *   TokenBehaviorType,
 *   getTokenBehaviorConfig,
 *   validateTokenOperation
 * } from '@ottochain/sdk/types/asset-model';
 *
 * // Define a game token (TERV = 1101)
 * const gameToken = TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN;
 * const config = getTokenBehaviorConfig(gameToken);
 *
 * // Validate an operation
 * const canTransfer = validateTokenOperation(gameToken, 'transfer', context);
 * ```
 *
 * @packageDocumentation
 */
import { Address, Timestamp, AssetId, ProducerId, ValidatorId } from './producer-validator.js';
/**
 * The 16 token behavior types based on TERV matrix
 *
 * Format: TERV_[T][E][R][V]_DESCRIPTIVE_NAME
 * Where T, E, R, V are 0 or 1 representing the boolean values
 */
export declare enum TokenBehaviorType {
    TERV_0000_BASIC_IDENTIFIER = "TERV_0000_BASIC_IDENTIFIER",
    TERV_0001_PERSONAL_CERTIFICATE = "TERV_0001_PERSONAL_CERTIFICATE",
    TERV_0010_SOCIAL_BADGE = "TERV_0010_SOCIAL_BADGE",
    TERV_0011_ACHIEVEMENT_BADGE = "TERV_0011_ACHIEVEMENT_BADGE",
    TERV_0100_PERSONAL_VOUCHER = "TERV_0100_PERSONAL_VOUCHER",
    TERV_0101_SECURE_ACCESS_KEY = "TERV_0101_SECURE_ACCESS_KEY",
    TERV_0110_PERSONAL_RESOURCE = "TERV_0110_PERSONAL_RESOURCE",
    TERV_0111_VERIFIED_PERSONAL_ASSET = "TERV_0111_VERIFIED_PERSONAL_ASSET",
    TERV_1000_SIMPLE_TRADABLE_ITEM = "TERV_1000_SIMPLE_TRADABLE_ITEM",
    TERV_1001_AUTHENTICATED_COLLECTIBLE = "TERV_1001_AUTHENTICATED_COLLECTIBLE",
    TERV_1010_SOCIAL_TOKEN = "TERV_1010_SOCIAL_TOKEN",
    TERV_1011_VERIFIED_SOCIAL_TOKEN = "TERV_1011_VERIFIED_SOCIAL_TOKEN",
    TERV_1100_SIMPLE_CONSUMABLE = "TERV_1100_SIMPLE_CONSUMABLE",
    TERV_1101_CONSUMABLE_GAME_TOKEN = "TERV_1101_CONSUMABLE_GAME_TOKEN",
    TERV_1110_UTILITY_TOKEN = "TERV_1110_UTILITY_TOKEN",
    TERV_1111_FULL_DIGITAL_CURRENCY = "TERV_1111_FULL_DIGITAL_CURRENCY"
}
/**
 * Individual boolean flags extracted from TERV
 */
export interface TERVFlags {
    /** Transferable: Can tokens be transferred between accounts? */
    readonly transferable: boolean;
    /** Expendable: Are tokens consumed on use? */
    readonly expendable: boolean;
    /** Replicable: Can tokens be duplicated? */
    readonly replicable: boolean;
    /** Verifiable: Can authenticity be cryptographically proven? */
    readonly verifiable: boolean;
}
/**
 * Comprehensive configuration for a token behavior type
 */
export interface TokenBehaviorConfig {
    /** Token behavior type */
    readonly behaviorType: TokenBehaviorType;
    /** TERV boolean flags */
    readonly flags: TERVFlags;
    /** Human-readable description */
    readonly description: string;
    /** Typical use cases */
    readonly useCases: readonly string[];
    /** Allowed operations for this token type */
    readonly allowedOperations: readonly TokenOperation[];
    /** State machine definition */
    readonly stateMachine: TokenStateMachine;
    /** Interaction rules with other token types */
    readonly interactionRules: TokenInteractionRules;
    /** Validation constraints */
    readonly validationConstraints: TokenValidationConstraints;
    /** Default behavior parameters */
    readonly defaultParameters: TokenBehaviorParameters;
}
/**
 * Token operations that can be performed
 */
export declare enum TokenOperation {
    CREATE = "create",
    TRANSFER = "transfer",
    CONSUME = "consume",
    DUPLICATE = "duplicate",
    VERIFY = "verify",
    BURN = "burn",
    LOCK = "lock",
    UNLOCK = "unlock",
    MINT = "mint",
    FREEZE = "freeze",
    UNFREEZE = "unfreeze"
}
/**
 * Token lifecycle states
 */
export declare enum TokenState {
    /** Token has been created but not yet active */
    CREATED = "created",
    /** Token is active and can be used */
    ACTIVE = "active",
    /** Token is temporarily locked */
    LOCKED = "locked",
    /** Token is frozen (admin action) */
    FROZEN = "frozen",
    /** Token has been consumed/spent */
    CONSUMED = "consumed",
    /** Token has been permanently burned */
    BURNED = "burned",
    /** Token verification failed */
    INVALID = "invalid",
    /** Token is in dispute */
    DISPUTED = "disputed"
}
/**
 * State transition definition
 */
export interface TokenStateTransition {
    /** Source state */
    readonly fromState: TokenState;
    /** Target state */
    readonly toState: TokenState;
    /** Operation that triggers this transition */
    readonly trigger: TokenOperation;
    /** Guard conditions (JSON Logic) */
    readonly guards: readonly unknown[];
    /** Effects to execute on transition */
    readonly effects: readonly TokenTransitionEffect[];
    /** Required producer capabilities */
    readonly requiredProducerCapabilities: readonly string[];
    /** Required validator authority level */
    readonly requiredValidatorAuthorityLevel: number;
}
/**
 * Effects executed during state transitions
 */
export interface TokenTransitionEffect {
    /** Effect type */
    readonly effectType: TokenEffectType;
    /** Effect parameters */
    readonly parameters: Record<string, unknown>;
    /** Effect condition (optional) */
    readonly condition?: unknown;
}
/**
 * Types of effects that can occur during transitions
 */
export declare enum TokenEffectType {
    /** Update token balance */
    UPDATE_BALANCE = "update_balance",
    /** Create new token instances */
    MINT_TOKENS = "mint_tokens",
    /** Log transaction event */
    LOG_EVENT = "log_event",
    /** Send notification */
    NOTIFY = "notify",
    /** Update metadata */
    UPDATE_METADATA = "update_metadata",
    /** Validate cryptographic proof */
    VALIDATE_PROOF = "validate_proof",
    /** Execute external call */
    EXTERNAL_CALL = "external_call"
}
/**
 * Token state machine definition
 */
export interface TokenStateMachine {
    /** State machine identifier */
    readonly id: string;
    /** Human-readable name */
    readonly name: string;
    /** All possible states */
    readonly states: readonly TokenState[];
    /** All possible transitions */
    readonly transitions: readonly TokenStateTransition[];
    /** Initial state when token is created */
    readonly initialState: TokenState;
    /** Terminal states (no further transitions) */
    readonly terminalStates: readonly TokenState[];
}
/**
 * Rules for how different token types can interact
 */
export interface TokenInteractionRules {
    /** Token types this type can be combined with */
    readonly compatibleTypes: readonly TokenBehaviorType[];
    /** Token types this type conflicts with */
    readonly conflictingTypes: readonly TokenBehaviorType[];
    /** Conversion rules to other token types */
    readonly conversionRules: readonly TokenConversionRule[];
    /** Composition rules for creating composite tokens */
    readonly compositionRules: readonly TokenCompositionRule[];
}
/**
 * Rule for converting between token types
 */
export interface TokenConversionRule {
    /** Target token type */
    readonly targetType: TokenBehaviorType;
    /** Conversion rate (source tokens per target token) */
    readonly conversionRate: number;
    /** Conditions for conversion (JSON Logic) */
    readonly conditions: readonly unknown[];
    /** Required validator approval level */
    readonly requiredApprovalLevel: number;
}
/**
 * Rule for composing multiple tokens into one
 */
export interface TokenCompositionRule {
    /** Component token types required */
    readonly componentTypes: readonly TokenBehaviorType[];
    /** Component quantities required */
    readonly componentQuantities: readonly number[];
    /** Resulting composite token type */
    readonly resultType: TokenBehaviorType;
    /** Composition conditions */
    readonly conditions: readonly unknown[];
}
/**
 * Validation constraints for token operations
 */
export interface TokenValidationConstraints {
    /** Maximum token supply */
    readonly maxSupply?: number;
    /** Minimum transfer amount */
    readonly minTransferAmount?: number;
    /** Maximum transfer amount */
    readonly maxTransferAmount?: number;
    /** Required waiting period between operations (seconds) */
    readonly operationCooldown?: number;
    /** Maximum duplications per time period */
    readonly maxDuplicationsPerPeriod?: {
        readonly count: number;
        readonly periodSeconds: number;
    };
    /** Required cryptographic proof types */
    readonly requiredProofTypes?: readonly string[];
    /** Custom validation rules (JSON Logic) */
    readonly customRules?: readonly unknown[];
}
/**
 * Default behavior parameters for token types
 */
export interface TokenBehaviorParameters {
    /** Default initial balance */
    readonly defaultBalance?: number;
    /** Default expiration time (seconds from creation) */
    readonly defaultExpirationSeconds?: number;
    /** Default metadata schema */
    readonly defaultMetadataSchema?: Record<string, unknown>;
    /** Default access control settings */
    readonly defaultAccessControl?: {
        readonly owners?: readonly Address[];
        readonly operators?: readonly Address[];
        readonly permissions?: Record<string, string[]>;
    };
    /** Default economic parameters */
    readonly defaultEconomics?: {
        readonly creationCost?: number;
        readonly transferFee?: number;
        readonly consumptionReward?: number;
    };
}
/**
 * Token instance with behavior type and current state
 */
export interface Token {
    /** Unique token identifier */
    readonly id: AssetId;
    /** Token behavior type */
    readonly behaviorType: TokenBehaviorType;
    /** Current lifecycle state */
    readonly currentState: TokenState;
    /** Token owner */
    readonly owner: Address;
    /** Current balance/quantity */
    readonly balance: number;
    /** Token metadata */
    readonly metadata: Record<string, unknown>;
    /** Creation timestamp */
    readonly createdAt: Timestamp;
    /** Last update timestamp */
    readonly updatedAt: Timestamp;
    /** Producer who created this token */
    readonly createdBy: ProducerId;
    /** Current validator (if any) */
    readonly validator?: ValidatorId;
    /** Cryptographic proofs (for verifiable tokens) */
    readonly proofs?: Record<string, string>;
    /** Expiration timestamp (if applicable) */
    readonly expiresAt?: Timestamp;
}
/**
 * Context for token operation validation
 */
export interface TokenOperationContext {
    /** Token being operated on */
    readonly token: Token;
    /** Operation being performed */
    readonly operation: TokenOperation;
    /** Operation initiator */
    readonly initiator: Address;
    /** Operation parameters */
    readonly parameters: Record<string, unknown>;
    /** Current timestamp */
    readonly timestamp: Timestamp;
    /** Available producers */
    readonly producers: Record<ProducerId, unknown>;
    /** Available validators */
    readonly validators: Record<ValidatorId, unknown>;
    /** Additional context data */
    readonly environment: Record<string, unknown>;
}
/**
 * Get the complete configuration for a token behavior type
 */
export declare function getTokenBehaviorConfig(behaviorType: TokenBehaviorType): TokenBehaviorConfig;
/**
 * Extract TERV flags from behavior type
 */
export declare function getTERVFlags(behaviorType: TokenBehaviorType): TERVFlags;
/**
 * Find token behavior type by TERV flags
 */
export declare function findTokenBehaviorType(flags: TERVFlags): TokenBehaviorType;
/**
 * Validate if an operation is allowed for a token type
 */
export declare function validateTokenOperation(behaviorType: TokenBehaviorType, operation: TokenOperation, context: TokenOperationContext): {
    allowed: boolean;
    reason?: string;
};
/**
 * Get compatible token types for interactions
 */
export declare function getCompatibleTokenTypes(behaviorType: TokenBehaviorType): readonly TokenBehaviorType[];
/**
 * Check if two token types can interact
 */
export declare function canTokenTypesInteract(type1: TokenBehaviorType, type2: TokenBehaviorType): boolean;
/**
 * Get all available token behavior types
 */
export declare function getAllTokenBehaviorTypes(): readonly TokenBehaviorType[];
/**
 * Get summary statistics for the token type system
 */
export declare function getTokenTypeSystemSummary(): {
    totalTypes: number;
    transferableTypes: number;
    expendableTypes: number;
    replicableTypes: number;
    verifiableTypes: number;
    fullyImplemented: number;
};
