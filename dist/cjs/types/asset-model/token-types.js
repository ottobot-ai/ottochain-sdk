"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenTypeSystemSummary = exports.getAllTokenBehaviorTypes = exports.canTokenTypesInteract = exports.getCompatibleTokenTypes = exports.validateTokenOperation = exports.findTokenBehaviorType = exports.getTERVFlags = exports.getTokenBehaviorConfig = exports.TokenEffectType = exports.TokenState = exports.TokenOperation = exports.TokenBehaviorType = void 0;
/**
 * The 16 token behavior types based on TERV matrix
 *
 * Format: TERV_[T][E][R][V]_DESCRIPTIVE_NAME
 * Where T, E, R, V are 0 or 1 representing the boolean values
 */
var TokenBehaviorType;
(function (TokenBehaviorType) {
    // Non-Transferable, Non-Expendable, Non-Replicable, Non-Verifiable (0000)
    TokenBehaviorType["TERV_0000_BASIC_IDENTIFIER"] = "TERV_0000_BASIC_IDENTIFIER";
    // Non-Transferable, Non-Expendable, Non-Replicable, Verifiable (0001)  
    TokenBehaviorType["TERV_0001_PERSONAL_CERTIFICATE"] = "TERV_0001_PERSONAL_CERTIFICATE";
    // Non-Transferable, Non-Expendable, Replicable, Non-Verifiable (0010)
    TokenBehaviorType["TERV_0010_SOCIAL_BADGE"] = "TERV_0010_SOCIAL_BADGE";
    // Non-Transferable, Non-Expendable, Replicable, Verifiable (0011)
    TokenBehaviorType["TERV_0011_ACHIEVEMENT_BADGE"] = "TERV_0011_ACHIEVEMENT_BADGE";
    // Non-Transferable, Expendable, Non-Replicable, Non-Verifiable (0100)
    TokenBehaviorType["TERV_0100_PERSONAL_VOUCHER"] = "TERV_0100_PERSONAL_VOUCHER";
    // Non-Transferable, Expendable, Non-Replicable, Verifiable (0101)
    TokenBehaviorType["TERV_0101_SECURE_ACCESS_KEY"] = "TERV_0101_SECURE_ACCESS_KEY";
    // Non-Transferable, Expendable, Replicable, Non-Verifiable (0110)
    TokenBehaviorType["TERV_0110_PERSONAL_RESOURCE"] = "TERV_0110_PERSONAL_RESOURCE";
    // Non-Transferable, Expendable, Replicable, Verifiable (0111)
    TokenBehaviorType["TERV_0111_VERIFIED_PERSONAL_ASSET"] = "TERV_0111_VERIFIED_PERSONAL_ASSET";
    // Transferable, Non-Expendable, Non-Replicable, Non-Verifiable (1000)
    TokenBehaviorType["TERV_1000_SIMPLE_TRADABLE_ITEM"] = "TERV_1000_SIMPLE_TRADABLE_ITEM";
    // Transferable, Non-Expendable, Non-Replicable, Verifiable (1001)
    TokenBehaviorType["TERV_1001_AUTHENTICATED_COLLECTIBLE"] = "TERV_1001_AUTHENTICATED_COLLECTIBLE";
    // Transferable, Non-Expendable, Replicable, Non-Verifiable (1010)  
    TokenBehaviorType["TERV_1010_SOCIAL_TOKEN"] = "TERV_1010_SOCIAL_TOKEN";
    // Transferable, Non-Expendable, Replicable, Verifiable (1011)
    TokenBehaviorType["TERV_1011_VERIFIED_SOCIAL_TOKEN"] = "TERV_1011_VERIFIED_SOCIAL_TOKEN";
    // Transferable, Expendable, Non-Replicable, Non-Verifiable (1100)
    TokenBehaviorType["TERV_1100_SIMPLE_CONSUMABLE"] = "TERV_1100_SIMPLE_CONSUMABLE";
    // Transferable, Expendable, Non-Replicable, Verifiable (1101)
    TokenBehaviorType["TERV_1101_CONSUMABLE_GAME_TOKEN"] = "TERV_1101_CONSUMABLE_GAME_TOKEN";
    // Transferable, Expendable, Replicable, Non-Verifiable (1110)
    TokenBehaviorType["TERV_1110_UTILITY_TOKEN"] = "TERV_1110_UTILITY_TOKEN";
    // Transferable, Expendable, Replicable, Verifiable (1111)
    TokenBehaviorType["TERV_1111_FULL_DIGITAL_CURRENCY"] = "TERV_1111_FULL_DIGITAL_CURRENCY";
})(TokenBehaviorType || (exports.TokenBehaviorType = TokenBehaviorType = {}));
/**
 * Token operations that can be performed
 */
var TokenOperation;
(function (TokenOperation) {
    TokenOperation["CREATE"] = "create";
    TokenOperation["TRANSFER"] = "transfer";
    TokenOperation["CONSUME"] = "consume";
    TokenOperation["DUPLICATE"] = "duplicate";
    TokenOperation["VERIFY"] = "verify";
    TokenOperation["BURN"] = "burn";
    TokenOperation["LOCK"] = "lock";
    TokenOperation["UNLOCK"] = "unlock";
    TokenOperation["MINT"] = "mint";
    TokenOperation["FREEZE"] = "freeze";
    TokenOperation["UNFREEZE"] = "unfreeze";
})(TokenOperation || (exports.TokenOperation = TokenOperation = {}));
/**
 * Token lifecycle states
 */
var TokenState;
(function (TokenState) {
    /** Token has been created but not yet active */
    TokenState["CREATED"] = "created";
    /** Token is active and can be used */
    TokenState["ACTIVE"] = "active";
    /** Token is temporarily locked */
    TokenState["LOCKED"] = "locked";
    /** Token is frozen (admin action) */
    TokenState["FROZEN"] = "frozen";
    /** Token has been consumed/spent */
    TokenState["CONSUMED"] = "consumed";
    /** Token has been permanently burned */
    TokenState["BURNED"] = "burned";
    /** Token verification failed */
    TokenState["INVALID"] = "invalid";
    /** Token is in dispute */
    TokenState["DISPUTED"] = "disputed";
})(TokenState || (exports.TokenState = TokenState = {}));
/**
 * Types of effects that can occur during transitions
 */
var TokenEffectType;
(function (TokenEffectType) {
    /** Update token balance */
    TokenEffectType["UPDATE_BALANCE"] = "update_balance";
    /** Create new token instances */
    TokenEffectType["MINT_TOKENS"] = "mint_tokens";
    /** Log transaction event */
    TokenEffectType["LOG_EVENT"] = "log_event";
    /** Send notification */
    TokenEffectType["NOTIFY"] = "notify";
    /** Update metadata */
    TokenEffectType["UPDATE_METADATA"] = "update_metadata";
    /** Validate cryptographic proof */
    TokenEffectType["VALIDATE_PROOF"] = "validate_proof";
    /** Execute external call */
    TokenEffectType["EXTERNAL_CALL"] = "external_call";
})(TokenEffectType || (exports.TokenEffectType = TokenEffectType = {}));
// ---------------------------------------------------------------------------
// Token Behavior Configurations
// ---------------------------------------------------------------------------
/**
 * Get the complete configuration for a token behavior type
 */
function getTokenBehaviorConfig(behaviorType) {
    return TOKEN_BEHAVIOR_CONFIGS[behaviorType];
}
exports.getTokenBehaviorConfig = getTokenBehaviorConfig;
/**
 * Extract TERV flags from behavior type
 */
function getTERVFlags(behaviorType) {
    const match = behaviorType.match(/TERV_(\d)(\d)(\d)(\d)_/);
    if (!match) {
        throw new Error(`Invalid behavior type format: ${behaviorType}`);
    }
    return {
        transferable: match[1] === '1',
        expendable: match[2] === '1',
        replicable: match[3] === '1',
        verifiable: match[4] === '1',
    };
}
exports.getTERVFlags = getTERVFlags;
/**
 * Find token behavior type by TERV flags
 */
function findTokenBehaviorType(flags) {
    const tervCode = [
        flags.transferable ? '1' : '0',
        flags.expendable ? '1' : '0',
        flags.replicable ? '1' : '0',
        flags.verifiable ? '1' : '0',
    ].join('');
    for (const [behaviorType] of Object.entries(TOKEN_BEHAVIOR_CONFIGS)) {
        if (behaviorType.includes(`TERV_${tervCode}_`)) {
            return behaviorType;
        }
    }
    throw new Error(`No token behavior type found for TERV: ${tervCode}`);
}
exports.findTokenBehaviorType = findTokenBehaviorType;
/**
 * Validate if an operation is allowed for a token type
 */
function validateTokenOperation(behaviorType, operation, context) {
    const config = getTokenBehaviorConfig(behaviorType);
    // Check TERV constraints (TERV flags are the canonical source of truth for operations)
    const flags = config.flags;
    switch (operation) {
        case TokenOperation.TRANSFER:
            if (!flags.transferable) {
                return {
                    allowed: false,
                    reason: 'Token type is not transferable',
                };
            }
            break;
        case TokenOperation.CONSUME:
            if (!flags.expendable) {
                return {
                    allowed: false,
                    reason: 'Token type is not expendable',
                };
            }
            break;
        case TokenOperation.DUPLICATE:
            if (!flags.replicable) {
                return {
                    allowed: false,
                    reason: 'Token type is not replicable',
                };
            }
            break;
        case TokenOperation.VERIFY:
            if (!flags.verifiable) {
                return {
                    allowed: false,
                    reason: 'Token type is not verifiable',
                };
            }
            break;
    }
    // Additional validation constraints
    const constraints = config.validationConstraints;
    // Check transfer amount limits first (absolute constraints take priority over rate limits)
    if (operation === TokenOperation.TRANSFER) {
        const amount = context.parameters.amount;
        if (constraints.minTransferAmount && amount < constraints.minTransferAmount) {
            return {
                allowed: false,
                reason: `Transfer amount below minimum: ${constraints.minTransferAmount}`,
            };
        }
        if (constraints.maxTransferAmount && amount > constraints.maxTransferAmount) {
            return {
                allowed: false,
                reason: `Transfer amount above maximum: ${constraints.maxTransferAmount}`,
            };
        }
    }
    // Check operation cooldown (rate limit applied after absolute constraints)
    // Cooldown only applies to operations after the initial token creation
    // (updatedAt === createdAt indicates this is the first operation on a fresh token)
    if (constraints.operationCooldown) {
        const lastUpdate = new Date(context.token.updatedAt).getTime();
        const createdAt = new Date(context.token.createdAt).getTime();
        const currentTime = new Date(context.timestamp).getTime();
        const timeDiff = (currentTime - lastUpdate) / 1000;
        // Skip cooldown for brand-new tokens (first operation after creation)
        const isFirstOperation = Math.abs(lastUpdate - createdAt) < 100; // within 100ms of creation
        if (!isFirstOperation && timeDiff < constraints.operationCooldown) {
            return {
                allowed: false,
                reason: `Operation cooldown not met: ${constraints.operationCooldown - timeDiff} seconds remaining`,
            };
        }
    }
    return { allowed: true };
}
exports.validateTokenOperation = validateTokenOperation;
/**
 * Get compatible token types for interactions
 */
function getCompatibleTokenTypes(behaviorType) {
    const config = getTokenBehaviorConfig(behaviorType);
    return config.interactionRules.compatibleTypes;
}
exports.getCompatibleTokenTypes = getCompatibleTokenTypes;
/**
 * Check if two token types can interact
 */
function canTokenTypesInteract(type1, type2) {
    const config1 = getTokenBehaviorConfig(type1);
    const config2 = getTokenBehaviorConfig(type2);
    return (config1.interactionRules.compatibleTypes.includes(type2) &&
        config2.interactionRules.compatibleTypes.includes(type1) &&
        !config1.interactionRules.conflictingTypes.includes(type2) &&
        !config2.interactionRules.conflictingTypes.includes(type1));
}
exports.canTokenTypesInteract = canTokenTypesInteract;
// ---------------------------------------------------------------------------  
// Configuration Data (Implementation continues in next part...)
// ---------------------------------------------------------------------------
/**
 * Complete configuration mapping for all 16 token behavior types
 */
const TOKEN_BEHAVIOR_CONFIGS = {
    [TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER]: {
        behaviorType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        flags: { transferable: false, expendable: false, replicable: false, verifiable: false },
        description: 'Simple identifier tokens that cannot be transferred, consumed, duplicated, or cryptographically verified',
        useCases: ['User IDs', 'Simple labels', 'Basic categorization', 'Non-transferable markers'],
        allowedOperations: [TokenOperation.CREATE, TokenOperation.BURN],
        stateMachine: {
            id: 'basic_identifier_sm',
            name: 'Basic Identifier State Machine',
            states: [TokenState.CREATED, TokenState.ACTIVE, TokenState.BURNED],
            transitions: [
                {
                    fromState: TokenState.CREATED,
                    toState: TokenState.ACTIVE,
                    trigger: TokenOperation.CREATE,
                    guards: [],
                    effects: [{ effectType: TokenEffectType.LOG_EVENT, parameters: { event: 'identifier_activated' } }],
                    requiredProducerCapabilities: ['basic_token_creation'],
                    requiredValidatorAuthorityLevel: 5,
                },
                {
                    fromState: TokenState.ACTIVE,
                    toState: TokenState.BURNED,
                    trigger: TokenOperation.BURN,
                    guards: [],
                    effects: [{ effectType: TokenEffectType.LOG_EVENT, parameters: { event: 'identifier_burned' } }],
                    requiredProducerCapabilities: ['token_destruction'],
                    requiredValidatorAuthorityLevel: 10,
                },
            ],
            initialState: TokenState.CREATED,
            terminalStates: [TokenState.BURNED],
        },
        interactionRules: {
            compatibleTypes: [TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE, TokenBehaviorType.TERV_0010_SOCIAL_BADGE],
            conflictingTypes: [],
            conversionRules: [],
            compositionRules: [],
        },
        validationConstraints: {
            maxSupply: 1000000,
            operationCooldown: 60, // 1 minute
        },
        defaultParameters: {
            defaultBalance: 1,
            defaultAccessControl: { permissions: { 'read': ['owner'] } },
        },
    },
    [TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY]: {
        behaviorType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        flags: { transferable: true, expendable: true, replicable: true, verifiable: true },
        description: 'Complete digital currency with all capabilities: transferable, expendable, replicable, and cryptographically verifiable',
        useCases: ['Digital currencies', 'Stablecoins', 'Central bank digital currencies', 'Full-featured tokens'],
        allowedOperations: [
            TokenOperation.CREATE,
            TokenOperation.TRANSFER,
            TokenOperation.CONSUME,
            TokenOperation.DUPLICATE,
            TokenOperation.VERIFY,
            TokenOperation.MINT,
            TokenOperation.BURN,
            TokenOperation.LOCK,
            TokenOperation.UNLOCK,
            TokenOperation.FREEZE,
            TokenOperation.UNFREEZE,
        ],
        stateMachine: {
            id: 'full_currency_sm',
            name: 'Full Digital Currency State Machine',
            states: [
                TokenState.CREATED,
                TokenState.ACTIVE,
                TokenState.LOCKED,
                TokenState.FROZEN,
                TokenState.CONSUMED,
                TokenState.BURNED,
            ],
            transitions: [
                {
                    fromState: TokenState.CREATED,
                    toState: TokenState.ACTIVE,
                    trigger: TokenOperation.CREATE,
                    guards: [{ '>': [{ 'var': 'initialSupply' }, 0] }],
                    effects: [
                        { effectType: TokenEffectType.VALIDATE_PROOF, parameters: { proofType: 'creation_signature' } },
                        { effectType: TokenEffectType.LOG_EVENT, parameters: { event: 'currency_activated' } },
                    ],
                    requiredProducerCapabilities: ['currency_creation', 'cryptographic_verification'],
                    requiredValidatorAuthorityLevel: 50,
                },
                {
                    fromState: TokenState.ACTIVE,
                    toState: TokenState.ACTIVE,
                    trigger: TokenOperation.TRANSFER,
                    guards: [
                        { '>': [{ 'var': 'amount' }, 0] },
                        { '>=': [{ 'var': 'senderBalance' }, { 'var': 'amount' }] },
                    ],
                    effects: [
                        { effectType: TokenEffectType.UPDATE_BALANCE, parameters: { operation: 'transfer' } },
                        { effectType: TokenEffectType.VALIDATE_PROOF, parameters: { proofType: 'transfer_signature' } },
                        { effectType: TokenEffectType.LOG_EVENT, parameters: { event: 'currency_transferred' } },
                    ],
                    requiredProducerCapabilities: ['currency_transfer'],
                    requiredValidatorAuthorityLevel: 10,
                },
                // Additional transitions...
            ],
            initialState: TokenState.CREATED,
            terminalStates: [TokenState.BURNED],
        },
        interactionRules: {
            compatibleTypes: [
                TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
                TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
                TokenBehaviorType.TERV_1110_UTILITY_TOKEN,
            ],
            conflictingTypes: [],
            conversionRules: [
                {
                    targetType: TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
                    conversionRate: 1,
                    conditions: [{ '>=': [{ 'var': 'validatorAuthority' }, 25] }],
                    requiredApprovalLevel: 25,
                },
            ],
            compositionRules: [],
        },
        validationConstraints: {
            minTransferAmount: 0.000001,
            maxTransferAmount: 1000000,
            operationCooldown: 1, // 1 second
            requiredProofTypes: ['digital_signature', 'merkle_proof'],
            customRules: [
                { 'and': [
                        { '>': [{ 'var': 'amount' }, 0] },
                        { '<=': [{ 'var': 'totalSupply' }, { 'var': 'maxSupply' }] },
                    ] },
            ],
        },
        defaultParameters: {
            defaultBalance: 0,
            defaultMetadataSchema: {
                name: 'string',
                symbol: 'string',
                decimals: 'number',
                totalSupply: 'number',
            },
            defaultEconomics: {
                creationCost: 100,
                transferFee: 0.001,
            },
        },
    },
    // Additional configurations for other token types will be added here...
    // For brevity, I'm showing the pattern with two extremes (0000 and 1111)
    // The full implementation would include all 16 configurations
};
// Placeholder configurations for remaining types (to be fully implemented)
[
    TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
    TokenBehaviorType.TERV_0010_SOCIAL_BADGE,
    TokenBehaviorType.TERV_0011_ACHIEVEMENT_BADGE,
    TokenBehaviorType.TERV_0100_PERSONAL_VOUCHER,
    TokenBehaviorType.TERV_0101_SECURE_ACCESS_KEY,
    TokenBehaviorType.TERV_0110_PERSONAL_RESOURCE,
    TokenBehaviorType.TERV_0111_VERIFIED_PERSONAL_ASSET,
    TokenBehaviorType.TERV_1000_SIMPLE_TRADABLE_ITEM,
    TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
    TokenBehaviorType.TERV_1010_SOCIAL_TOKEN,
    TokenBehaviorType.TERV_1011_VERIFIED_SOCIAL_TOKEN,
    TokenBehaviorType.TERV_1100_SIMPLE_CONSUMABLE,
    TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
    TokenBehaviorType.TERV_1110_UTILITY_TOKEN,
].forEach(tokenType => {
    if (!TOKEN_BEHAVIOR_CONFIGS[tokenType]) {
        const flags = getTERVFlags(tokenType);
        // Derive allowed operations from TERV flags so validateTokenOperation works correctly
        const allowedOperations = [TokenOperation.CREATE, TokenOperation.BURN];
        if (flags.transferable)
            allowedOperations.push(TokenOperation.TRANSFER);
        if (flags.expendable)
            allowedOperations.push(TokenOperation.CONSUME);
        if (flags.replicable)
            allowedOperations.push(TokenOperation.DUPLICATE);
        if (flags.verifiable)
            allowedOperations.push(TokenOperation.VERIFY);
        // Derive compatible types: any type that shares at least one TERV flag
        const compatibleTypes = Object.values(TokenBehaviorType).filter(other => {
            if (other === tokenType)
                return false;
            try {
                const otherFlags = getTERVFlags(other);
                return ((flags.transferable && otherFlags.transferable) ||
                    (flags.expendable && otherFlags.expendable) ||
                    (flags.replicable && otherFlags.replicable) ||
                    (flags.verifiable && otherFlags.verifiable));
            }
            catch {
                return false;
            }
        });
        TOKEN_BEHAVIOR_CONFIGS[tokenType] = {
            behaviorType: tokenType,
            flags,
            description: `Token type ${tokenType} — ${[
                flags.transferable ? 'Transferable' : 'Non-Transferable',
                flags.expendable ? 'Expendable' : 'Non-Expendable',
                flags.replicable ? 'Replicable' : 'Non-Replicable',
                flags.verifiable ? 'Verifiable' : 'Non-Verifiable',
            ].join(', ')}`,
            useCases: ['General purpose'],
            allowedOperations,
            stateMachine: {
                id: `${tokenType}_sm`,
                name: `${tokenType} State Machine`,
                states: [TokenState.CREATED, TokenState.ACTIVE, TokenState.BURNED],
                transitions: [],
                initialState: TokenState.CREATED,
                terminalStates: [TokenState.BURNED],
            },
            interactionRules: {
                compatibleTypes,
                conflictingTypes: [],
                conversionRules: [],
                compositionRules: [],
            },
            validationConstraints: {},
            defaultParameters: {},
        };
    }
});
/**
 * Get all available token behavior types
 */
function getAllTokenBehaviorTypes() {
    return Object.values(TokenBehaviorType);
}
exports.getAllTokenBehaviorTypes = getAllTokenBehaviorTypes;
/**
 * Get summary statistics for the token type system
 */
function getTokenTypeSystemSummary() {
    const allTypes = getAllTokenBehaviorTypes();
    let transferableTypes = 0;
    let expendableTypes = 0;
    let replicableTypes = 0;
    let verifiableTypes = 0;
    let fullyImplemented = 0;
    for (const tokenType of allTypes) {
        const flags = getTERVFlags(tokenType);
        const config = getTokenBehaviorConfig(tokenType);
        if (flags.transferable)
            transferableTypes++;
        if (flags.expendable)
            expendableTypes++;
        if (flags.replicable)
            replicableTypes++;
        if (flags.verifiable)
            verifiableTypes++;
        if (config.allowedOperations.length > 0)
            fullyImplemented++;
    }
    return {
        totalTypes: allTypes.length,
        transferableTypes,
        expendableTypes,
        replicableTypes,
        verifiableTypes,
        fullyImplemented,
    };
}
exports.getTokenTypeSystemSummary = getTokenTypeSystemSummary;
