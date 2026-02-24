/**
 * Token Types and Interfaces Tests (TDD)
 * Tests the TypeScript type definitions and interfaces for the token system.
 * 
 * These tests validate the type system structure before implementation.
 */

import {
  TokenBehavior,
  TokenState,
  TokenOperation,
  TokenOperationType,
  TokenMetadata,
  TokenPolicy,
  StateMachineDefinition,
  TOKEN_OPERATION_TYPES,
} from '../src/apps/token/types';

describe('Token Type System', () => {
  describe('TokenBehavior Type', () => {
    it('should accept all valid behavior values 0-15', () => {
      const validValues: TokenBehavior[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      
      validValues.forEach(value => {
        const behavior: TokenBehavior = value;
        expect(typeof behavior).toBe('number');
      });
    });

    // TypeScript compile-time test - this should fail to compile if TokenBehavior allows invalid values
    // Uncomment when TokenBehavior type is properly constrained:
    // it('should reject invalid behavior values at compile time', () => {
    //   const invalid: TokenBehavior = 16; // Should cause TypeScript error
    //   const invalid2: TokenBehavior = -1; // Should cause TypeScript error
    // });
  });

  describe('TokenOperationType Enum', () => {
    it('should define all 8 core token operations', () => {
      expect(TOKEN_OPERATION_TYPES.MINT).toBe('mint');
      expect(TOKEN_OPERATION_TYPES.BURN).toBe('burn');
      expect(TOKEN_OPERATION_TYPES.TRANSFER).toBe('transfer');
      expect(TOKEN_OPERATION_TYPES.SPLIT).toBe('split');
      expect(TOKEN_OPERATION_TYPES.MERGE).toBe('merge');
      expect(TOKEN_OPERATION_TYPES.SET_POLICY).toBe('set_policy');
      expect(TOKEN_OPERATION_TYPES.EXTEND_EXPIRY).toBe('extend_expiry');
      expect(TOKEN_OPERATION_TYPES.CHECK_VALID).toBe('check_valid');
    });

    it('should have all operations as string literals', () => {
      Object.values(TOKEN_OPERATION_TYPES).forEach(op => {
        expect(typeof op).toBe('string');
      });
    });
  });

  describe('TokenState Interface', () => {
    it('should define required token state fields', () => {
      const tokenState: TokenState = {
        id: 'token-123',
        tokenBehavior: 12, // Fungible Token
        holder: 'DAGaddress123',
        amount: '100.50',
        metadata: {
          name: 'Test Token',
          symbol: 'TEST'
        }
      };

      expect(tokenState.id).toBe('token-123');
      expect(tokenState.tokenBehavior).toBe(12);
      expect(tokenState.holder).toBe('DAGaddress123');
      expect(tokenState.amount).toBe('100.50');
      expect(tokenState.metadata.name).toBe('Test Token');
    });

    it('should support optional expiry field for expirable tokens', () => {
      const expirableToken: TokenState = {
        id: 'ticket-456',
        tokenBehavior: 10, // Ticket (expirable)
        holder: 'DAGuser456',
        amount: '1',
        expiresAtOrdinal: 1500000,
        metadata: {}
      };

      expect(expirableToken.expiresAtOrdinal).toBe(1500000);
    });

    it('should support optional policy field for governable tokens', () => {
      const governedToken: TokenState = {
        id: 'regulated-789',
        tokenBehavior: 13, // Regulated Token
        holder: 'DAGcompliant789',
        amount: '1000.00',
        policy: {
          allowedMinter: 'DAGissuer123',
          transferRules: {
            "and": [
              { "===": [{ "var": "event.recipientVerified" }, true] }
            ]
          }
        },
        metadata: {}
      };

      expect(governedToken.policy?.allowedMinter).toBe('DAGissuer123');
      expect(governedToken.policy?.transferRules).toBeDefined();
    });

    it('should store amount as string for precision', () => {
      const preciseToken: TokenState = {
        id: 'precise-token',
        tokenBehavior: 12,
        holder: 'DAGuser',
        amount: '123.456789012345678901', // High precision
        metadata: {}
      };

      expect(typeof preciseToken.amount).toBe('string');
      expect(preciseToken.amount).toBe('123.456789012345678901');
    });
  });

  describe('TokenOperation Interface', () => {
    it('should define mint operation structure', () => {
      const mintOp: TokenOperation = {
        type: 'mint',
        tokenId: 'new-token-123',
        params: {
          recipient: 'DAGrecipient123',
          amount: '100.00'
        }
      };

      expect(mintOp.type).toBe('mint');
      expect(mintOp.tokenId).toBe('new-token-123');
      expect(mintOp.params.recipient).toBe('DAGrecipient123');
      expect(mintOp.params.amount).toBe('100.00');
    });

    it('should define transfer operation structure', () => {
      const transferOp: TokenOperation = {
        type: 'transfer',
        tokenId: 'existing-token-456',
        params: {
          recipient: 'DAGnewowner456',
          amount: '50.25'
        }
      };

      expect(transferOp.type).toBe('transfer');
      expect(transferOp.params.recipient).toBe('DAGnewowner456');
    });

    it('should define split operation structure', () => {
      const splitOp: TokenOperation = {
        type: 'split',
        tokenId: 'divisible-token-789',
        params: {
          amounts: ['25.00', '75.00']
        }
      };

      expect(splitOp.type).toBe('split');
      expect(splitOp.params.amounts).toEqual(['25.00', '75.00']);
    });

    it('should define set_policy operation structure', () => {
      const setPolicyOp: TokenOperation = {
        type: 'set_policy',
        tokenId: 'governed-token-101',
        params: {
          policy: {
            "mint": { "in": ["ISSUER_ADDR", { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
          }
        }
      };

      expect(setPolicyOp.type).toBe('set_policy');
      expect(setPolicyOp.params.policy).toBeDefined();
    });

    it('should define extend_expiry operation structure', () => {
      const extendOp: TokenOperation = {
        type: 'extend_expiry',
        tokenId: 'expirable-token-202',
        params: {
          newExpiresAtOrdinal: 2000000
        }
      };

      expect(extendOp.type).toBe('extend_expiry');
      expect(extendOp.params.newExpiresAtOrdinal).toBe(2000000);
    });
  });

  describe('TokenMetadata Interface', () => {
    it('should support standard metadata fields', () => {
      const metadata: TokenMetadata = {
        name: 'My Token',
        symbol: 'MYTKN',
        description: 'A test token for the matrix',
        imageUrl: 'https://example.com/token.png',
        externalUrl: 'https://example.com/token-info',
        attributes: [
          { trait_type: 'Rarity', value: 'Legendary' },
          { trait_type: 'Color', value: 'Blue' }
        ]
      };

      expect(metadata.name).toBe('My Token');
      expect(metadata.symbol).toBe('MYTKN');
      expect(metadata.attributes).toHaveLength(2);
      expect(metadata.attributes?.[0].trait_type).toBe('Rarity');
    });

    it('should support custom metadata fields', () => {
      const customMetadata: TokenMetadata = {
        customField1: 'Custom Value 1',
        customField2: 42,
        customField3: { nested: 'object' }
      };

      expect(customMetadata.customField1).toBe('Custom Value 1');
      expect(customMetadata.customField2).toBe(42);
      expect(customMetadata.customField3).toEqual({ nested: 'object' });
    });
  });

  describe('TokenPolicy Interface', () => {
    it('should support operation-specific policies', () => {
      const policy: TokenPolicy = {
        mint: {
          "in": ["ISSUER_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }]
        },
        transfer: {
          "and": [
            { "===": [{ "var": "event.recipientVerified" }, true] },
            { "!": [{ "getKey": [{ "var": "state.blacklist" }, { "var": "event.recipient" }] }] }
          ]
        },
        burn: {
          "or": [
            { "in": [{ "var": "state.holder" }, { "map": [{ "var": "proofs" }, { "var": "address" }] }] },
            { "in": ["ADMIN_ADDRESS", { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
          ]
        }
      };

      expect(policy.mint).toBeDefined();
      expect(policy.transfer).toBeDefined();
      expect(policy.burn).toBeDefined();
    });

    it('should support additional policy configuration', () => {
      const policy: TokenPolicy = {
        allowedMinter: 'DAGissuer123',
        blacklist: {
          'DAGbadactor1': true,
          'DAGbadactor2': true
        },
        transferRules: {
          "!==": [{ "var": "event.recipient" }, { "var": "state.holder" }] // Prevent self-transfer
        }
      };

      expect(policy.allowedMinter).toBe('DAGissuer123');
      expect(policy.blacklist).toEqual({
        'DAGbadactor1': true,
        'DAGbadactor2': true
      });
      expect(policy.transferRules).toBeDefined();
    });
  });

  describe('StateMachineDefinition Integration', () => {
    it('should define state machine structure for tokens', () => {
      const tokenStateMachine: StateMachineDefinition = {
        id: { value: 'token-sm-123' },
        initialState: { value: 'ACTIVE' },
        states: [
          { value: 'ACTIVE' },
          { value: 'BURNED' },
          { value: 'EXPIRED' }
        ],
        transitions: [
          {
            event: 'mint',
            from: 'ACTIVE',
            to: 'ACTIVE',
            guards: {
              "or": [
                { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 1] }, 0] },
                { "in": [{ "var": "state.policy.allowedMinter" }, { "map": [{ "var": "proofs" }, { "var": "address" }] }] }
              ]
            }
          },
          {
            event: 'transfer',
            from: 'ACTIVE',
            to: 'ACTIVE',
            guards: {
              "and": [
                { "!==": [{ "&": [{ "var": "state.tokenBehavior" }, 8] }, 0] },
                {
                  "or": [
                    { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 2] }, 0] },
                    { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
                  ]
                }
              ]
            }
          }
        ]
      };

      expect(tokenStateMachine.id.value).toBe('token-sm-123');
      expect(tokenStateMachine.initialState.value).toBe('ACTIVE');
      expect(tokenStateMachine.states).toHaveLength(3);
      expect(tokenStateMachine.transitions).toHaveLength(2);
      expect(tokenStateMachine.transitions[0].event).toBe('mint');
      expect(tokenStateMachine.transitions[1].event).toBe('transfer');
    });
  });

  describe('Type Validation', () => {
    it('should validate TokenBehavior range at runtime', () => {
      // These should be implemented as runtime validation functions
      expect(() => {
        const invalidBehavior = 16 as TokenBehavior;
        // validateTokenBehavior(invalidBehavior); // Should throw
      }).toThrow('TokenBehavior must be between 0 and 15');
    });

    it('should validate required fields in TokenState', () => {
      expect(() => {
        const invalidState = {
          // Missing required fields
          tokenBehavior: 12
        } as TokenState;
        // validateTokenState(invalidState); // Should throw
      }).toThrow('TokenState is missing required fields');
    });

    it('should validate amount format', () => {
      expect(() => {
        const invalidAmount = 'not-a-number';
        // validateTokenAmount(invalidAmount); // Should throw
      }).toThrow('Token amount must be a valid decimal string');
    });
  });
});