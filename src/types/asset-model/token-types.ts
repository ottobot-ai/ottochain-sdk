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

import {
  Address,
  Timestamp,
  AssetId,
  ProducerId,
  ValidatorId
} from './producer-validator.js';

/**
 * The 16 token behavior types based on TERV matrix
 * 
 * Format: TERV_[T][E][R][V]_DESCRIPTIVE_NAME
 * Where T, E, R, V are 0 or 1 representing the boolean values
 */
export enum TokenBehaviorType {
  // Non-Transferable, Non-Expendable, Non-Replicable, Non-Verifiable (0000)
  TERV_0000_BASIC_IDENTIFIER = 'TERV_0000_BASIC_IDENTIFIER',
  
  // Non-Transferable, Non-Expendable, Non-Replicable, Verifiable (0001)  
  TERV_0001_PERSONAL_CERTIFICATE = 'TERV_0001_PERSONAL_CERTIFICATE',
  
  // Non-Transferable, Non-Expendable, Replicable, Non-Verifiable (0010)
  TERV_0010_SOCIAL_BADGE = 'TERV_0010_SOCIAL_BADGE',
  
  // Non-Transferable, Non-Expendable, Replicable, Verifiable (0011)
  TERV_0011_ACHIEVEMENT_BADGE = 'TERV_0011_ACHIEVEMENT_BADGE',
  
  // Non-Transferable, Expendable, Non-Replicable, Non-Verifiable (0100)
  TERV_0100_PERSONAL_VOUCHER = 'TERV_0100_PERSONAL_VOUCHER',
  
  // Non-Transferable, Expendable, Non-Replicable, Verifiable (0101)
  TERV_0101_SECURE_ACCESS_KEY = 'TERV_0101_SECURE_ACCESS_KEY',
  
  // Non-Transferable, Expendable, Replicable, Non-Verifiable (0110)
  TERV_0110_PERSONAL_RESOURCE = 'TERV_0110_PERSONAL_RESOURCE',
  
  // Non-Transferable, Expendable, Replicable, Verifiable (0111)
  TERV_0111_VERIFIED_PERSONAL_ASSET = 'TERV_0111_VERIFIED_PERSONAL_ASSET',
  
  // Transferable, Non-Expendable, Non-Replicable, Non-Verifiable (1000)
  TERV_1000_SIMPLE_TRADABLE_ITEM = 'TERV_1000_SIMPLE_TRADABLE_ITEM',
  
  // Transferable, Non-Expendable, Non-Replicable, Verifiable (1001)
  TERV_1001_AUTHENTICATED_COLLECTIBLE = 'TERV_1001_AUTHENTICATED_COLLECTIBLE',
  
  // Transferable, Non-Expendable, Replicable, Non-Verifiable (1010)  
  TERV_1010_SOCIAL_TOKEN = 'TERV_1010_SOCIAL_TOKEN',
  
  // Transferable, Non-Expendable, Replicable, Verifiable (1011)
  TERV_1011_VERIFIED_SOCIAL_TOKEN = 'TERV_1011_VERIFIED_SOCIAL_TOKEN',
  
  // Transferable, Expendable, Non-Replicable, Non-Verifiable (1100)
  TERV_1100_SIMPLE_CONSUMABLE = 'TERV_1100_SIMPLE_CONSUMABLE',
  
  // Transferable, Expendable, Non-Replicable, Verifiable (1101)
  TERV_1101_CONSUMABLE_GAME_TOKEN = 'TERV_1101_CONSUMABLE_GAME_TOKEN',
  
  // Transferable, Expendable, Replicable, Non-Verifiable (1110)
  TERV_1110_UTILITY_TOKEN = 'TERV_1110_UTILITY_TOKEN',
  
  // Transferable, Expendable, Replicable, Verifiable (1111)
  TERV_1111_FULL_DIGITAL_CURRENCY = 'TERV_1111_FULL_DIGITAL_CURRENCY',
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
export enum TokenOperation {
  CREATE = 'create',
  TRANSFER = 'transfer',
  CONSUME = 'consume',
  DUPLICATE = 'duplicate',
  VERIFY = 'verify',
  BURN = 'burn',
  LOCK = 'lock',
  UNLOCK = 'unlock',
  MINT = 'mint',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
}

/**
 * Token lifecycle states
 */
export enum TokenState {
  /** Token has been created but not yet active */
  CREATED = 'created',
  
  /** Token is active and can be used */
  ACTIVE = 'active',
  
  /** Token is temporarily locked */
  LOCKED = 'locked',
  
  /** Token is frozen (admin action) */
  FROZEN = 'frozen',
  
  /** Token has been consumed/spent */
  CONSUMED = 'consumed',
  
  /** Token has been permanently burned */
  BURNED = 'burned',
  
  /** Token verification failed */
  INVALID = 'invalid',
  
  /** Token is in dispute */
  DISPUTED = 'disputed',
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
  readonly condition?: unknown; // JSON Logic
}

/**
 * Types of effects that can occur during transitions
 */
export enum TokenEffectType {
  /** Update token balance */
  UPDATE_BALANCE = 'update_balance',
  
  /** Create new token instances */
  MINT_TOKENS = 'mint_tokens',
  
  /** Log transaction event */
  LOG_EVENT = 'log_event',
  
  /** Send notification */
  NOTIFY = 'notify',
  
  /** Update metadata */
  UPDATE_METADATA = 'update_metadata',
  
  /** Validate cryptographic proof */
  VALIDATE_PROOF = 'validate_proof',
  
  /** Execute external call */
  EXTERNAL_CALL = 'external_call',
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

// ---------------------------------------------------------------------------
// Token Behavior Configurations
// ---------------------------------------------------------------------------

/**
 * Get the complete configuration for a token behavior type
 */
export function getTokenBehaviorConfig(behaviorType: TokenBehaviorType): TokenBehaviorConfig {
  return TOKEN_BEHAVIOR_CONFIGS[behaviorType];
}

/**
 * Extract TERV flags from behavior type
 */
export function getTERVFlags(behaviorType: TokenBehaviorType): TERVFlags {
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

/**
 * Find token behavior type by TERV flags
 */
export function findTokenBehaviorType(flags: TERVFlags): TokenBehaviorType {
  const tervCode = [
    flags.transferable ? '1' : '0',
    flags.expendable ? '1' : '0',
    flags.replicable ? '1' : '0',
    flags.verifiable ? '1' : '0',
  ].join('');
  
  for (const [behaviorType] of Object.entries(TOKEN_BEHAVIOR_CONFIGS)) {
    if (behaviorType.includes(`TERV_${tervCode}_`)) {
      return behaviorType as TokenBehaviorType;
    }
  }
  
  throw new Error(`No token behavior type found for TERV: ${tervCode}`);
}

/**
 * Validate if an operation is allowed for a token type
 */
export function validateTokenOperation(
  behaviorType: TokenBehaviorType,
  operation: TokenOperation,
  context: TokenOperationContext
): { allowed: boolean; reason?: string } {
  const config = getTokenBehaviorConfig(behaviorType);
  
  // Check if operation is in allowed operations
  if (!config.allowedOperations.includes(operation)) {
    return {
      allowed: false,
      reason: `Operation ${operation} not allowed for token type ${behaviorType}`,
    };
  }
  
  // Check TERV constraints
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
  
  // Check operation cooldown
  if (constraints.operationCooldown) {
    const lastUpdate = new Date(context.token.updatedAt).getTime();
    const currentTime = new Date(context.timestamp).getTime();
    const timeDiff = (currentTime - lastUpdate) / 1000;
    
    if (timeDiff < constraints.operationCooldown) {
      return {
        allowed: false,
        reason: `Operation cooldown not met: ${constraints.operationCooldown - timeDiff} seconds remaining`,
      };
    }
  }
  
  // Check transfer amount limits
  if (operation === TokenOperation.TRANSFER) {
    const amount = context.parameters.amount as number;
    
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
  
  return { allowed: true };
}

/**
 * Get compatible token types for interactions
 */
export function getCompatibleTokenTypes(behaviorType: TokenBehaviorType): readonly TokenBehaviorType[] {
  const config = getTokenBehaviorConfig(behaviorType);
  return config.interactionRules.compatibleTypes;
}

/**
 * Check if two token types can interact
 */
export function canTokenTypesInteract(
  type1: TokenBehaviorType,
  type2: TokenBehaviorType
): boolean {
  const config1 = getTokenBehaviorConfig(type1);
  const config2 = getTokenBehaviorConfig(type2);
  
  return (
    config1.interactionRules.compatibleTypes.includes(type2) &&
    config2.interactionRules.compatibleTypes.includes(type1) &&
    !config1.interactionRules.conflictingTypes.includes(type2) &&
    !config2.interactionRules.conflictingTypes.includes(type1)
  );
}

// ---------------------------------------------------------------------------  
// Configuration Data (Implementation continues in next part...)
// ---------------------------------------------------------------------------

/**
 * Complete configuration mapping for all 16 token behavior types
 */
const TOKEN_BEHAVIOR_CONFIGS: Record<TokenBehaviorType, TokenBehaviorConfig> = {
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
        ]},
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
  
} as Record<TokenBehaviorType, TokenBehaviorConfig>;

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
    TOKEN_BEHAVIOR_CONFIGS[tokenType] = {
      behaviorType: tokenType,
      flags,
      description: `Token type ${tokenType} - configuration pending full implementation`,
      useCases: ['To be defined'],
      allowedOperations: [], // To be defined
      stateMachine: {
        id: `${tokenType}_sm`,
        name: `${tokenType} State Machine`,
        states: [TokenState.CREATED, TokenState.ACTIVE],
        transitions: [],
        initialState: TokenState.CREATED,
        terminalStates: [],
      },
      interactionRules: {
        compatibleTypes: [],
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
export function getAllTokenBehaviorTypes(): readonly TokenBehaviorType[] {
  return Object.values(TokenBehaviorType);
}

/**
 * Get summary statistics for the token type system
 */
export function getTokenTypeSystemSummary(): {
  totalTypes: number;
  transferableTypes: number;
  expendableTypes: number;
  replicableTypes: number;
  verifiableTypes: number;
  fullyImplemented: number;
} {
  const allTypes = getAllTokenBehaviorTypes();
  
  let transferableTypes = 0;
  let expendableTypes = 0;
  let replicableTypes = 0;
  let verifiableTypes = 0;
  let fullyImplemented = 0;
  
  for (const tokenType of allTypes) {
    const flags = getTERVFlags(tokenType);
    const config = getTokenBehaviorConfig(tokenType);
    
    if (flags.transferable) transferableTypes++;
    if (flags.expendable) expendableTypes++;
    if (flags.replicable) replicableTypes++;
    if (flags.verifiable) verifiableTypes++;
    if (config.allowedOperations.length > 0) fullyImplemented++;
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