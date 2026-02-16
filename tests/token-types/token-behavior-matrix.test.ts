/**
 * Comprehensive Tests for 16-Type Token Behavior Matrix
 * 
 * These tests validate the implementation of all 16 token behavior types,
 * their TERV properties, state machines, and interaction rules.
 * 
 * @packageDocumentation
 */

import {
  TokenBehaviorType,
  getTokenBehaviorConfig,
  getTERVFlags,
  findTokenBehaviorType,
  validateTokenOperation,
  canTokenTypesInteract,
  getAllTokenBehaviorTypes,
  getTokenTypeSystemSummary,
  Token,
  TokenOperation,
  TokenOperationContext,
  TokenState,
  TERVFlags,
} from '../../src/types/asset-model/token-types.js';

import { TokenBehaviorExamples } from '../../src/examples/token-types/all-16-types.js';

describe('16-Type Token Behavior Matrix', () => {
  
  describe('TERV Flag System', () => {
    
    test('should correctly extract TERV flags from all 16 token types', () => {
      const expectedFlags: Record<TokenBehaviorType, TERVFlags> = {
        [TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER]: { transferable: false, expendable: false, replicable: false, verifiable: false },
        [TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE]: { transferable: false, expendable: false, replicable: false, verifiable: true },
        [TokenBehaviorType.TERV_0010_SOCIAL_BADGE]: { transferable: false, expendable: false, replicable: true, verifiable: false },
        [TokenBehaviorType.TERV_0011_ACHIEVEMENT_BADGE]: { transferable: false, expendable: false, replicable: true, verifiable: true },
        [TokenBehaviorType.TERV_0100_PERSONAL_VOUCHER]: { transferable: false, expendable: true, replicable: false, verifiable: false },
        [TokenBehaviorType.TERV_0101_SECURE_ACCESS_KEY]: { transferable: false, expendable: true, replicable: false, verifiable: true },
        [TokenBehaviorType.TERV_0110_PERSONAL_RESOURCE]: { transferable: false, expendable: true, replicable: true, verifiable: false },
        [TokenBehaviorType.TERV_0111_VERIFIED_PERSONAL_ASSET]: { transferable: false, expendable: true, replicable: true, verifiable: true },
        [TokenBehaviorType.TERV_1000_SIMPLE_TRADABLE_ITEM]: { transferable: true, expendable: false, replicable: false, verifiable: false },
        [TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE]: { transferable: true, expendable: false, replicable: false, verifiable: true },
        [TokenBehaviorType.TERV_1010_SOCIAL_TOKEN]: { transferable: true, expendable: false, replicable: true, verifiable: false },
        [TokenBehaviorType.TERV_1011_VERIFIED_SOCIAL_TOKEN]: { transferable: true, expendable: false, replicable: true, verifiable: true },
        [TokenBehaviorType.TERV_1100_SIMPLE_CONSUMABLE]: { transferable: true, expendable: true, replicable: false, verifiable: false },
        [TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN]: { transferable: true, expendable: true, replicable: false, verifiable: true },
        [TokenBehaviorType.TERV_1110_UTILITY_TOKEN]: { transferable: true, expendable: true, replicable: true, verifiable: false },
        [TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY]: { transferable: true, expendable: true, replicable: true, verifiable: true },
      };
      
      for (const [tokenType, expectedTERV] of Object.entries(expectedFlags)) {
        const actualFlags = getTERVFlags(tokenType as TokenBehaviorType);
        expect(actualFlags).toEqual(expectedTERV);
      }
    });
    
    test('should find token behavior type by TERV flags', () => {
      const testCases: Array<{ flags: TERVFlags; expectedType: TokenBehaviorType }> = [
        {
          flags: { transferable: false, expendable: false, replicable: false, verifiable: false },
          expectedType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        },
        {
          flags: { transferable: true, expendable: true, replicable: true, verifiable: true },
          expectedType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        },
        {
          flags: { transferable: true, expendable: false, replicable: false, verifiable: true },
          expectedType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        },
      ];
      
      for (const { flags, expectedType } of testCases) {
        const foundType = findTokenBehaviorType(flags);
        expect(foundType).toBe(expectedType);
      }
    });
    
    test('should handle invalid TERV flag combinations', () => {
      expect(() => getTERVFlags('INVALID_TOKEN_TYPE' as TokenBehaviorType))
        .toThrow('Invalid behavior type format');
    });
  });
  
  describe('Token Configuration System', () => {
    
    test('should provide complete configuration for all token types', () => {
      const allTypes = getAllTokenBehaviorTypes();
      expect(allTypes).toHaveLength(16);
      
      for (const tokenType of allTypes) {
        const config = getTokenBehaviorConfig(tokenType);
        
        // Verify essential configuration properties
        expect(config.behaviorType).toBe(tokenType);
        expect(config.flags).toBeDefined();
        expect(config.description).toBeTruthy();
        expect(config.stateMachine).toBeDefined();
        expect(config.interactionRules).toBeDefined();
        expect(config.validationConstraints).toBeDefined();
        expect(config.defaultParameters).toBeDefined();
        
        // Verify state machine structure
        expect(config.stateMachine.states).toContain(config.stateMachine.initialState);
        expect(config.stateMachine.terminalStates.length).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('should provide system summary statistics', () => {
      const summary = getTokenTypeSystemSummary();
      
      expect(summary.totalTypes).toBe(16);
      expect(summary.transferableTypes).toBe(8); // Half should be transferable
      expect(summary.expendableTypes).toBe(8);   // Half should be expendable
      expect(summary.replicableTypes).toBe(8);   // Half should be replicable
      expect(summary.verifiableTypes).toBe(8);   // Half should be verifiable
      expect(summary.fullyImplemented).toBeGreaterThanOrEqual(2); // At least basic + full currency
    });
  });
  
  describe('Operation Validation', () => {
    
    test('should validate transferable operations correctly', () => {
      const transferableToken: Token = {
        id: 'test-nft-001',
        behaviorType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        currentState: TokenState.ACTIVE,
        owner: 'user-001',
        balance: 1,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test-producer',
      };
      
      const nonTransferableToken: Token = {
        ...transferableToken,
        behaviorType: TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
      };
      
      const context: TokenOperationContext = {
        token: transferableToken,
        operation: TokenOperation.TRANSFER,
        initiator: 'user-001',
        parameters: { to: 'user-002', amount: 1 },
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      // Transferable token should allow transfer
      const transferableResult = validateTokenOperation(
        TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        TokenOperation.TRANSFER,
        { ...context, token: transferableToken }
      );
      expect(transferableResult.allowed).toBe(true);
      
      // Non-transferable token should reject transfer
      const nonTransferableResult = validateTokenOperation(
        TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
        TokenOperation.TRANSFER,
        { ...context, token: nonTransferableToken }
      );
      expect(nonTransferableResult.allowed).toBe(false);
      expect(nonTransferableResult.reason).toContain('not transferable');
    });
    
    test('should validate expendable operations correctly', () => {
      const expendableToken: Token = {
        id: 'test-game-item-001',
        behaviorType: TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
        currentState: TokenState.ACTIVE,
        owner: 'player-001',
        balance: 1,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'game-producer',
      };
      
      const nonExpendableToken: Token = {
        ...expendableToken,
        behaviorType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
      };
      
      const context: TokenOperationContext = {
        token: expendableToken,
        operation: TokenOperation.CONSUME,
        initiator: 'player-001',
        parameters: {},
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      // Expendable token should allow consumption
      const expendableResult = validateTokenOperation(
        TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN,
        TokenOperation.CONSUME,
        { ...context, token: expendableToken }
      );
      expect(expendableResult.allowed).toBe(true);
      
      // Non-expendable token should reject consumption
      const nonExpendableResult = validateTokenOperation(
        TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        TokenOperation.CONSUME,
        { ...context, token: nonExpendableToken }
      );
      expect(nonExpendableResult.allowed).toBe(false);
      expect(nonExpendableResult.reason).toContain('not expendable');
    });
    
    test('should validate replicable operations correctly', () => {
      const replicableToken: Token = {
        id: 'test-utility-token-001',
        behaviorType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        currentState: TokenState.ACTIVE,
        owner: 'treasury-001',
        balance: 1000000,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'currency-producer',
      };
      
      const nonReplicableToken: Token = {
        ...replicableToken,
        behaviorType: TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
      };
      
      const context: TokenOperationContext = {
        token: replicableToken,
        operation: TokenOperation.DUPLICATE,
        initiator: 'treasury-001',
        parameters: { amount: 1000 },
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      // Replicable token should allow duplication
      const replicableResult = validateTokenOperation(
        TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        TokenOperation.DUPLICATE,
        { ...context, token: replicableToken }
      );
      expect(replicableResult.allowed).toBe(true);
      
      // Non-replicable token should reject duplication
      const nonReplicableResult = validateTokenOperation(
        TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE,
        TokenOperation.DUPLICATE,
        { ...context, token: nonReplicableToken }
      );
      expect(nonReplicableResult.allowed).toBe(false);
      expect(nonReplicableResult.reason).toContain('not replicable');
    });
    
    test('should validate verifiable operations correctly', () => {
      const verifiableToken: Token = {
        id: 'test-certificate-001',
        behaviorType: TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
        currentState: TokenState.ACTIVE,
        owner: 'student-001',
        balance: 1,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'university-producer',
        proofs: {
          'signature': 'valid_signature',
        },
      };
      
      const nonVerifiableToken: Token = {
        ...verifiableToken,
        behaviorType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        proofs: undefined,
      };
      
      const context: TokenOperationContext = {
        token: verifiableToken,
        operation: TokenOperation.VERIFY,
        initiator: 'verifier-001',
        parameters: {},
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      // Verifiable token should allow verification
      const verifiableResult = validateTokenOperation(
        TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE,
        TokenOperation.VERIFY,
        { ...context, token: verifiableToken }
      );
      expect(verifiableResult.allowed).toBe(true);
      
      // Non-verifiable token should reject verification
      const nonVerifiableResult = validateTokenOperation(
        TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        TokenOperation.VERIFY,
        { ...context, token: nonVerifiableToken }
      );
      expect(nonVerifiableResult.allowed).toBe(false);
      expect(nonVerifiableResult.reason).toContain('not verifiable');
    });
  });
  
  describe('Validation Constraints', () => {
    
    test('should enforce operation cooldown constraints', () => {
      const token: Token = {
        id: 'test-token-cooldown',
        behaviorType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        currentState: TokenState.ACTIVE,
        owner: 'user-001',
        balance: 1,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        createdBy: 'test-producer',
      };
      
      const context: TokenOperationContext = {
        token,
        operation: TokenOperation.CREATE,
        initiator: 'user-001',
        parameters: {},
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER);
      
      // If cooldown is set and not met, operation should be blocked
      if (config.validationConstraints.operationCooldown) {
        const result = validateTokenOperation(
          TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
          TokenOperation.CREATE,
          context
        );
        
        if (config.validationConstraints.operationCooldown > 30) {
          expect(result.allowed).toBe(false);
          expect(result.reason).toContain('cooldown not met');
        }
      }
    });
    
    test('should enforce transfer amount limits', () => {
      const token: Token = {
        id: 'test-currency-limits',
        behaviorType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        currentState: TokenState.ACTIVE,
        owner: 'user-001',
        balance: 1000,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'currency-producer',
      };
      
      const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY);
      
      // Test minimum transfer amount
      if (config.validationConstraints.minTransferAmount) {
        const belowMinContext: TokenOperationContext = {
          token,
          operation: TokenOperation.TRANSFER,
          initiator: 'user-001',
          parameters: { amount: config.validationConstraints.minTransferAmount - 1 },
          timestamp: new Date().toISOString(),
          producers: {},
          validators: {},
          environment: {},
        };
        
        const belowMinResult = validateTokenOperation(
          TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
          TokenOperation.TRANSFER,
          belowMinContext
        );
        
        expect(belowMinResult.allowed).toBe(false);
        expect(belowMinResult.reason).toContain('below minimum');
      }
      
      // Test maximum transfer amount
      if (config.validationConstraints.maxTransferAmount) {
        const aboveMaxContext: TokenOperationContext = {
          token,
          operation: TokenOperation.TRANSFER,
          initiator: 'user-001',
          parameters: { amount: config.validationConstraints.maxTransferAmount + 1 },
          timestamp: new Date().toISOString(),
          producers: {},
          validators: {},
          environment: {},
        };
        
        const aboveMaxResult = validateTokenOperation(
          TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
          TokenOperation.TRANSFER,
          aboveMaxContext
        );
        
        expect(aboveMaxResult.allowed).toBe(false);
        expect(aboveMaxResult.reason).toContain('above maximum');
      }
    });
  });
  
  describe('Token Interactions', () => {
    
    test('should determine compatible token types', () => {
      // Digital currency should be compatible with various token types
      const currencyCompatible = canTokenTypesInteract(
        TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
        TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN
      );
      expect(currencyCompatible).toBe(true);
      
      // Basic identifiers might not be compatible with complex tokens
      const identifierCompatible = canTokenTypesInteract(
        TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY
      );
      // Result depends on configuration, just verify it returns a boolean
      expect(typeof identifierCompatible).toBe('boolean');
    });
  });
  
  describe('Real-World Examples', () => {
    
    test('should create and validate user account identifier', () => {
      const userAccount = TokenBehaviorExamples.UserAccountIdentifierExample
        .createUserAccount('test-user', 'test@example.com');
      
      expect(userAccount.behaviorType).toBe(TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER);
      expect(userAccount.balance).toBe(1);
      expect(userAccount.metadata.email).toBe('test@example.com');
      
      const flags = getTERVFlags(userAccount.behaviorType);
      expect(flags.transferable).toBe(false);
      expect(flags.expendable).toBe(false);
      expect(flags.replicable).toBe(false);
      expect(flags.verifiable).toBe(false);
    });
    
    test('should create and validate educational degree certificate', () => {
      const degree = TokenBehaviorExamples.EducationalDegreeExample
        .createDegree('student123', 'Master of Science', 'University of Technology');
      
      expect(degree.behaviorType).toBe(TokenBehaviorType.TERV_0001_PERSONAL_CERTIFICATE);
      expect(degree.proofs).toBeDefined();
      expect(degree.validator).toBeTruthy();
      expect(degree.metadata.university).toBe('University of Technology');
      
      const flags = getTERVFlags(degree.behaviorType);
      expect(flags.transferable).toBe(false);
      expect(flags.expendable).toBe(false);
      expect(flags.replicable).toBe(false);
      expect(flags.verifiable).toBe(true);
    });
    
    test('should create and transfer NFT collectible', async () => {
      const nft = TokenBehaviorExamples.DigitalArtNFTExample
        .createArtwork('artist001', 'Test Artwork');
      
      expect(nft.behaviorType).toBe(TokenBehaviorType.TERV_1001_AUTHENTICATED_COLLECTIBLE);
      expect(nft.proofs).toBeDefined();
      expect(nft.metadata.title).toBe('Test Artwork');
      
      const flags = getTERVFlags(nft.behaviorType);
      expect(flags.transferable).toBe(true);
      expect(flags.expendable).toBe(false);
      expect(flags.replicable).toBe(false);
      expect(flags.verifiable).toBe(true);
      
      // Test transfer
      const transferredNFT = await TokenBehaviorExamples.DigitalArtNFTExample
        .transferArtwork(nft, 'collector456');
      
      expect(transferredNFT.owner).toBe('collector456');
      expect(transferredNFT.id).toBe(nft.id); // Same NFT, different owner
    });
    
    test('should create and consume game item', async () => {
      const gameItem = TokenBehaviorExamples.GameItemExample
        .createGameItem('Health Potion', 'player001');
      
      expect(gameItem.behaviorType).toBe(TokenBehaviorType.TERV_1101_CONSUMABLE_GAME_TOKEN);
      expect(gameItem.currentState).toBe(TokenState.ACTIVE);
      expect(gameItem.metadata.itemName).toBe('Health Potion');
      
      const flags = getTERVFlags(gameItem.behaviorType);
      expect(flags.transferable).toBe(true);
      expect(flags.expendable).toBe(true);
      expect(flags.replicable).toBe(false);
      expect(flags.verifiable).toBe(true);
      
      // Test consumption
      const consumedItem = await TokenBehaviorExamples.GameItemExample
        .useItem(gameItem, { level: 10, health: 75 });
      
      expect(consumedItem.currentState).toBe(TokenState.CONSUMED);
      expect(consumedItem.balance).toBe(0);
      expect(consumedItem.metadata.consumedAt).toBeDefined();
    });
    
    test('should handle digital currency operations', async () => {
      const currency = TokenBehaviorExamples.DigitalCurrencyExample
        .createCurrency('TestCoin', 1000000);
      
      expect(currency.behaviorType).toBe(TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY);
      expect(currency.balance).toBe(1000000);
      expect(currency.metadata.symbol).toBe('TEST');
      
      const flags = getTERVFlags(currency.behaviorType);
      expect(flags.transferable).toBe(true);
      expect(flags.expendable).toBe(true);
      expect(flags.replicable).toBe(true);
      expect(flags.verifiable).toBe(true);
      
      // Test transfer
      const transferredCurrency = await TokenBehaviorExamples.DigitalCurrencyExample
        .transfer(currency, 'treasury-001', 'user-001', 1000);
      
      expect(transferredCurrency.metadata.lastTransaction).toBeDefined();
      
      // Test minting
      const mintedCurrency = await TokenBehaviorExamples.DigitalCurrencyExample
        .mint(currency, 100000, 'user-002');
      
      expect(mintedCurrency.balance).toBe(1100000);
      expect(mintedCurrency.metadata.lastMint).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    
    test('should handle invalid token operations gracefully', () => {
      const token: Token = {
        id: 'invalid-test',
        behaviorType: TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        currentState: TokenState.ACTIVE,
        owner: 'user-001',
        balance: 1,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test-producer',
      };
      
      const context: TokenOperationContext = {
        token,
        operation: TokenOperation.TRANSFER,
        initiator: 'user-001',
        parameters: {},
        timestamp: new Date().toISOString(),
        producers: {},
        validators: {},
        environment: {},
      };
      
      const result = validateTokenOperation(
        TokenBehaviorType.TERV_0000_BASIC_IDENTIFIER,
        TokenOperation.TRANSFER,
        context
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeTruthy();
    });
    
    test('should handle currency minting limits', async () => {
      const currency = TokenBehaviorExamples.DigitalCurrencyExample
        .createCurrency('LimitedCoin', 1000000);
      
      // Try to mint beyond max supply
      await expect(
        TokenBehaviorExamples.DigitalCurrencyExample
          .mint(currency, 1500000, 'user-001') // Would exceed 2x initial supply
      ).rejects.toThrow('exceed max supply');
    });
  });
});

describe('Integration with Producer-Validator Framework', () => {
  
  test('should integrate token validation with producer capabilities', () => {
    const token: Token = {
      id: 'integration-test',
      behaviorType: TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY,
      currentState: TokenState.ACTIVE,
      owner: 'user-001',
      balance: 1000,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'currency-producer-001',
    };
    
    const config = getTokenBehaviorConfig(token.behaviorType);
    expect(config.stateMachine.transitions).toBeDefined();
    
    // Verify transitions have producer capability requirements
    for (const transition of config.stateMachine.transitions) {
      expect(transition.requiredProducerCapabilities).toBeDefined();
      expect(transition.requiredValidatorAuthorityLevel).toBeGreaterThanOrEqual(0);
    }
  });
  
  test('should validate state machine transitions', () => {
    const config = getTokenBehaviorConfig(TokenBehaviorType.TERV_1111_FULL_DIGITAL_CURRENCY);
    const stateMachine = config.stateMachine;
    
    // Verify state machine structure
    expect(stateMachine.initialState).toBeTruthy();
    expect(stateMachine.states).toContain(stateMachine.initialState);
    expect(stateMachine.transitions.length).toBeGreaterThan(0);
    
    // Verify all transitions reference valid states
    for (const transition of stateMachine.transitions) {
      expect(stateMachine.states).toContain(transition.fromState);
      expect(stateMachine.states).toContain(transition.toState);
    }
  });
});