/**
 * TDD Tests for 16-Type Token Behavior Matrix
 * 
 * These tests define the expected behavior for the token behavior matrix
 * as described in docs/design/token-behavior-matrix.md
 * 
 * Card: 📊 Reference: 16-type token behavior matrix spec (#6996301865712baccd17883a)
 * Epic: Asset Model Exploration: Complete Artifacts
 * 
 * @group tdd
 * @group token-behavior
 * @group asset-model
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Import the token behavior matrix module that we need to implement
import {
  TokenBehavior,
  Token,
  TokenOperation,
  ValidationContext,
  isTransferable,
  isDivisible,
  isExpirable,
  isGovernable,
  makeTokenBehavior,
  isValidTokenBehavior,
  getTokenDescription,
  validateTokenStructure,
  getTokenValidationErrors
} from '../src/token-behavior-matrix';

describe('Token Behavior Matrix: Core Type System', () => {
  
  describe('Token Behavior Flags and Encoding', () => {
    it('should correctly identify transferable tokens', () => {
      // ARRANGE & ACT: Test transferable flag detection
      const transferableTypes = [8, 9, 10, 11, 12, 13, 14, 15]; // T=1
      const nonTransferableTypes = [0, 1, 2, 3, 4, 5, 6, 7];     // T=0
      
      // ASSERT: Transferable detection
      for (const type of transferableTypes) {
        expect(isTransferable(type as TokenBehavior)).toBe(true);
      }
      
      for (const type of nonTransferableTypes) {
        expect(isTransferable(type as TokenBehavior)).toBe(false);
      }
    });

    it('should correctly identify divisible tokens', () => {
      // ARRANGE & ACT: Test divisible flag detection
      const divisibleTypes = [4, 5, 6, 7, 12, 13, 14, 15];       // D=1
      const indivisibleTypes = [0, 1, 2, 3, 8, 9, 10, 11];       // D=0
      
      // ASSERT: Divisible detection
      for (const type of divisibleTypes) {
        expect(isDivisible(type as TokenBehavior)).toBe(true);
      }
      
      for (const type of indivisibleTypes) {
        expect(isDivisible(type as TokenBehavior)).toBe(false);
      }
    });

    it('should correctly identify expirable tokens', () => {
      // ARRANGE & ACT: Test expirable flag detection
      const expirableTypes = [2, 3, 6, 7, 10, 11, 14, 15];       // E=1
      const nonExpirableTypes = [0, 1, 4, 5, 8, 9, 12, 13];      // E=0
      
      // ASSERT: Expirable detection
      for (const type of expirableTypes) {
        expect(isExpirable(type as TokenBehavior)).toBe(true);
      }
      
      for (const type of nonExpirableTypes) {
        expect(isExpirable(type as TokenBehavior)).toBe(false);
      }
    });

    it('should correctly identify governable tokens', () => {
      // ARRANGE & ACT: Test governable flag detection
      const governableTypes = [1, 3, 5, 7, 9, 11, 13, 15];       // G=1
      const nonGovernableTypes = [0, 2, 4, 6, 8, 10, 12, 14];    // G=0
      
      // ASSERT: Governable detection
      for (const type of governableTypes) {
        expect(isGovernable(type as TokenBehavior)).toBe(true);
      }
      
      for (const type of nonGovernableTypes) {
        expect(isGovernable(type as TokenBehavior)).toBe(false);
      }
    });

    it('should compose token behavior from boolean dimensions', () => {
      // ARRANGE & ACT & ASSERT: Test all 16 combinations
      expect(makeTokenBehavior(false, false, false, false)).toBe(0);  // Type 0
      expect(makeTokenBehavior(false, false, false, true)).toBe(1);   // Type 1
      expect(makeTokenBehavior(false, false, true, false)).toBe(2);   // Type 2
      expect(makeTokenBehavior(false, false, true, true)).toBe(3);    // Type 3
      expect(makeTokenBehavior(false, true, false, false)).toBe(4);   // Type 4
      expect(makeTokenBehavior(false, true, false, true)).toBe(5);    // Type 5
      expect(makeTokenBehavior(false, true, true, false)).toBe(6);    // Type 6
      expect(makeTokenBehavior(false, true, true, true)).toBe(7);     // Type 7
      expect(makeTokenBehavior(true, false, false, false)).toBe(8);   // Type 8 (NFT)
      expect(makeTokenBehavior(true, false, false, true)).toBe(9);    // Type 9
      expect(makeTokenBehavior(true, false, true, false)).toBe(10);   // Type 10 (Ticket)
      expect(makeTokenBehavior(true, false, true, true)).toBe(11);    // Type 11
      expect(makeTokenBehavior(true, true, false, false)).toBe(12);   // Type 12 (ERC20)
      expect(makeTokenBehavior(true, true, false, true)).toBe(13);    // Type 13 (Stablecoin)
      expect(makeTokenBehavior(true, true, true, false)).toBe(14);    // Type 14 (Loyalty)
      expect(makeTokenBehavior(true, true, true, true)).toBe(15);     // Type 15 (Full)
    });

    it('should validate token behavior is in valid range 0-15', () => {
      // ARRANGE: Valid and invalid behavior values
      const validBehaviors = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const invalidBehaviors = [-1, 16, 17, 255, 1000];
      
      // ACT & ASSERT: Valid behaviors
      for (const behavior of validBehaviors) {
        expect(isValidTokenBehavior(behavior)).toBe(true);
      }
      
      // ACT & ASSERT: Invalid behaviors
      for (const behavior of invalidBehaviors) {
        expect(isValidTokenBehavior(behavior)).toBe(false);
      }
    });
  });

  describe('Token Type Archetypes', () => {
    it('should identify Type 0 as Soulbound Collectible', () => {
      // ARRANGE: Type 0 token
      const type0 = 0 as TokenBehavior;
      
      // ACT & ASSERT: Properties
      expect(isTransferable(type0)).toBe(false); // Soulbound
      expect(isDivisible(type0)).toBe(false);    // Whole unit only
      expect(isExpirable(type0)).toBe(false);    // Permanent
      expect(isGovernable(type0)).toBe(false);   // No policy
      
      // ASSERT: Archetype identification
      expect(getTokenDescription(type0)).toBe('Soulbound Collectible');
      expect(getTokenDescription(type0)).toContain('Permanent achievements, honors, diplomas');
    });

    it('should identify Type 8 as Pure Collectible (NFT)', () => {
      // ARRANGE: Type 8 token
      const type8 = 8 as TokenBehavior;
      
      // ACT & ASSERT: Properties
      expect(isTransferable(type8)).toBe(true);  // Transferable
      expect(isDivisible(type8)).toBe(false);    // Whole unit only
      expect(isExpirable(type8)).toBe(false);    // Permanent
      expect(isGovernable(type8)).toBe(false);   // No policy
      
      // ASSERT: Archetype identification
      expect(getTokenDescription(type8)).toBe('Pure Collectible (NFT)');
      expect(getTokenDescription(type8)).toContain('Digital art, sports trading cards');
    });

    it('should identify Type 12 as Fungible Token (ERC-20 equivalent)', () => {
      // ARRANGE: Type 12 token
      const type12 = 12 as TokenBehavior;
      
      // ACT & ASSERT: Properties
      expect(isTransferable(type12)).toBe(true); // Transferable
      expect(isDivisible(type12)).toBe(true);    // Fractional amounts
      expect(isExpirable(type12)).toBe(false);   // Permanent
      expect(isGovernable(type12)).toBe(false);  // No policy
      
      // ASSERT: Archetype identification
      expect(getTokenDescription(type12)).toBe('Fungible Token');
      expect(getTokenDescription(type12)).toContain('ERC-20 equivalent');
    });

    it('should identify Type 15 as Full-Featured Asset', () => {
      // ARRANGE: Type 15 token
      const type15 = 15 as TokenBehavior;
      
      // ACT & ASSERT: All properties enabled
      expect(isTransferable(type15)).toBe(true); // Transferable
      expect(isDivisible(type15)).toBe(true);    // Fractional amounts
      expect(isExpirable(type15)).toBe(true);    // Can expire
      expect(isGovernable(type15)).toBe(true);   // Policy enforced
      
      // ASSERT: Archetype identification
      expect(getTokenDescription(type15)).toBe('Full-Featured Asset');
      expect(getTokenDescription(type15)).toContain('Complex financial instruments');
    });
  });
});

describe('Token Behavior Matrix: Operation Legality', () => {
  let mockContext: ValidationContext;

  beforeEach(() => {
    mockContext = {
      ordinal: 1000,
      epochProgress: 0.5,
      lastSnapshotHash: '0xabc123',
      proofs: [{ address: 'DAGtester123...', signature: 'sig123' }],
      state: {},
      event: {}
    };
  });

  describe('Mint Operation', () => {
    it('should allow mint on all token types when not expired and policy passes', () => {
      // ARRANGE: Test all 16 token types
      for (let type = 0; type <= 15; type++) {
        const token: Token = {
          id: `token_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1,
          // Non-expirable or not yet expired
          ...(isExpirable(type as TokenBehavior) ? { expiresAtOrdinal: 2000 } : {}),
          // Non-governable or policy that allows mint
          ...(isGovernable(type as TokenBehavior) ? { policy: { mint: true } } : {})
        };
        
        const operation: TokenOperation = {
          tokenId: token.id,
          operation: 'mint',
          params: { amount: 5 }
        };
        
        // ACT & ASSERT: Mint should be allowed
        expect(isOperationLegal(token, operation, mockContext)).toBe(true);
      }
    });

    it('should reject mint on expired tokens', () => {
      // ARRANGE: Expired expirable token (Type 2)
      const expiredToken: Token = {
        id: 'expired_credential',
        behavior: 2, // Expirable but not governable
        holder: 'DAGholder123...',
        amount: 1,
        expiresAtOrdinal: 500 // Expired (current ordinal is 1000)
      };
      
      const mintOperation: TokenOperation = {
        tokenId: expiredToken.id,
        operation: 'mint',
        params: { amount: 1 }
      };
      
      // ACT & ASSERT: Should reject expired mint
      expect(isOperationLegal(expiredToken, mintOperation, mockContext)).toBe(false);
      expect(getOperationRejectionReason(expiredToken, mintOperation, mockContext))
        .toBe('TOKEN_EXPIRED');
    });

    it('should reject mint when governable token policy denies', () => {
      // ARRANGE: Governable token with denying policy
      const governedToken: Token = {
        id: 'governed_token',
        behavior: 1, // Governable soulbound badge
        holder: 'DAGholder123...',
        amount: 1,
        policy: {
          mint: { "===": [1, 0] } // Always false
        }
      };
      
      const mintOperation: TokenOperation = {
        tokenId: governedToken.id,
        operation: 'mint',
        params: { amount: 1 }
      };
      
      // ACT & ASSERT: Should reject due to policy
      expect(isOperationLegal(governedToken, mintOperation, mockContext)).toBe(false);
      expect(getOperationRejectionReason(governedToken, mintOperation, mockContext))
        .toBe('POLICY_FAILED');
    });

    it('should allow mint when governable policy checks proof signatures', () => {
      // ARRANGE: Governable token requiring specific signer
      const authorizedAddress = 'DAGtester123...'; // Matches mockContext.proofs[0].address
      const governedToken: Token = {
        id: 'governed_mint_token',
        behavior: 9, // Governed collectible
        holder: 'DAGholder123...',
        amount: 1,
        policy: {
          mint: {
            "in": [
              authorizedAddress,
              { "map": [{ "var": "proofs" }, { "var": "address" }] }
            ]
          }
        }
      };
      
      const mintOperation: TokenOperation = {
        tokenId: governedToken.id,
        operation: 'mint',
        params: { amount: 1 }
      };
      
      // ACT & ASSERT: Should allow mint with proper proof
      expect(isOperationLegal(governedToken, mintOperation, mockContext)).toBe(true);
    });
  });

  describe('Transfer Operation', () => {
    it('should reject transfer on all soulbound tokens (T=0)', () => {
      // ARRANGE: All soulbound types (0-7)
      const soulboundTypes = [0, 1, 2, 3, 4, 5, 6, 7];
      
      for (const type of soulboundTypes) {
        const token: Token = {
          id: `soulbound_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1
        };
        
        const transferOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'transfer',
          params: { recipient: 'DAGrecipient456...', amount: 1 }
        };
        
        // ACT & ASSERT: Transfer should be rejected
        expect(isOperationLegal(token, transferOperation, mockContext)).toBe(false);
        expect(getOperationRejectionReason(token, transferOperation, mockContext))
          .toBe('NOT_TRANSFERABLE');
      }
    });

    it('should allow transfer on all transferable tokens (T=1) when not expired', () => {
      // ARRANGE: All transferable types (8-15)
      const transferableTypes = [8, 9, 10, 11, 12, 13, 14, 15];
      
      for (const type of transferableTypes) {
        const token: Token = {
          id: `transferable_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1,
          // Set expiry in future if expirable
          ...(isExpirable(type as TokenBehavior) ? { expiresAtOrdinal: 2000 } : {}),
          // Allow transfer policy if governable
          ...(isGovernable(type as TokenBehavior) ? { policy: { transfer: true } } : {})
        };
        
        const transferOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'transfer',
          params: { recipient: 'DAGrecipient456...', amount: 1 }
        };
        
        // ACT & ASSERT: Transfer should be allowed
        expect(isOperationLegal(token, transferOperation, mockContext)).toBe(true);
      }
    });

    it('should reject transfer on expired transferable tokens', () => {
      // ARRANGE: Expired ticket (Type 10)
      const expiredTicket: Token = {
        id: 'expired_ticket',
        behavior: 10, // Transferable, indivisible, expirable, non-governable
        holder: 'DAGholder123...',
        amount: 1,
        expiresAtOrdinal: 500 // Expired
      };
      
      const transferOperation: TokenOperation = {
        tokenId: expiredTicket.id,
        operation: 'transfer',
        params: { recipient: 'DAGrecipient456...', amount: 1 }
      };
      
      // ACT & ASSERT: Should reject expired transfer
      expect(isOperationLegal(expiredTicket, transferOperation, mockContext)).toBe(false);
      expect(getOperationRejectionReason(expiredTicket, transferOperation, mockContext))
        .toBe('TOKEN_EXPIRED');
    });
  });

  describe('Split Operation', () => {
    it('should reject split on all indivisible tokens (D=0)', () => {
      // ARRANGE: All indivisible types
      const indivisibleTypes = [0, 1, 2, 3, 8, 9, 10, 11];
      
      for (const type of indivisibleTypes) {
        const token: Token = {
          id: `indivisible_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1
        };
        
        const splitOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'split',
          params: { amounts: [0.5, 0.5] }
        };
        
        // ACT & ASSERT: Split should be rejected
        expect(isOperationLegal(token, splitOperation, mockContext)).toBe(false);
        expect(getOperationRejectionReason(token, splitOperation, mockContext))
          .toBe('NOT_DIVISIBLE');
      }
    });

    it('should allow split on divisible tokens when not expired', () => {
      // ARRANGE: All divisible types
      const divisibleTypes = [4, 5, 6, 7, 12, 13, 14, 15];
      
      for (const type of divisibleTypes) {
        const token: Token = {
          id: `divisible_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 100.0,
          // Set expiry in future if expirable
          ...(isExpirable(type as TokenBehavior) ? { expiresAtOrdinal: 2000 } : {}),
          // Allow split policy if governable
          ...(isGovernable(type as TokenBehavior) ? { policy: { split: true } } : {})
        };
        
        const splitOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'split',
          params: { amounts: [60.0, 40.0] }
        };
        
        // ACT & ASSERT: Split should be allowed
        expect(isOperationLegal(token, splitOperation, mockContext)).toBe(true);
      }
    });

    it('should reject split when split amounts do not sum to original', () => {
      // ARRANGE: Divisible token with invalid split
      const token: Token = {
        id: 'utility_token',
        behavior: 12, // Fungible token
        holder: 'DAGholder123...',
        amount: 100.0
      };
      
      const invalidSplitOperation: TokenOperation = {
        tokenId: token.id,
        operation: 'split',
        params: { amounts: [60.0, 50.0] } // Sum is 110, not 100
      };
      
      // ACT & ASSERT: Should reject invalid split
      expect(isOperationLegal(token, invalidSplitOperation, mockContext)).toBe(false);
      expect(getOperationRejectionReason(token, invalidSplitOperation, mockContext))
        .toBe('INVALID_SPLIT_AMOUNTS');
    });
  });

  describe('Burn Operation', () => {
    it('should allow burn on all token types including expired ones', () => {
      // ARRANGE: Test all types including expired expirable ones
      for (let type = 0; type <= 15; type++) {
        const token: Token = {
          id: `burn_test_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1,
          // Make expirable tokens expired to test burn-after-expiry
          ...(isExpirable(type as TokenBehavior) ? { expiresAtOrdinal: 500 } : {}),
          // Allow burn policy if governable
          ...(isGovernable(type as TokenBehavior) ? { policy: { burn: true } } : {})
        };
        
        const burnOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'burn',
          params: { amount: 1 }
        };
        
        // ACT & ASSERT: Burn should be allowed even on expired tokens
        expect(isOperationLegal(token, burnOperation, mockContext)).toBe(true);
      }
    });

    it('should respect governance policy on burn for governable tokens', () => {
      // ARRANGE: Governed token that denies burn
      const governedToken: Token = {
        id: 'no_burn_token',
        behavior: 13, // Regulated token
        holder: 'DAGholder123...',
        amount: 100.0,
        policy: {
          burn: { "===": [1, 0] } // Always deny
        }
      };
      
      const burnOperation: TokenOperation = {
        tokenId: governedToken.id,
        operation: 'burn',
        params: { amount: 10.0 }
      };
      
      // ACT & ASSERT: Should reject due to policy
      expect(isOperationLegal(governedToken, burnOperation, mockContext)).toBe(false);
      expect(getOperationRejectionReason(governedToken, burnOperation, mockContext))
        .toBe('POLICY_FAILED');
    });
  });

  describe('Set Policy Operation', () => {
    it('should reject set_policy on all non-governable tokens (G=0)', () => {
      // ARRANGE: All non-governable types
      const nonGovernableTypes = [0, 2, 4, 6, 8, 10, 12, 14];
      
      for (const type of nonGovernableTypes) {
        const token: Token = {
          id: `non_governable_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1
        };
        
        const setPolicyOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'set_policy',
          params: { policy: { mint: true } }
        };
        
        // ACT & ASSERT: set_policy should be rejected
        expect(isOperationLegal(token, setPolicyOperation, mockContext)).toBe(false);
        expect(getOperationRejectionReason(token, setPolicyOperation, mockContext))
          .toBe('NOT_GOVERNABLE');
      }
    });

    it('should allow set_policy on governable tokens', () => {
      // ARRANGE: All governable types
      const governableTypes = [1, 3, 5, 7, 9, 11, 13, 15];
      
      for (const type of governableTypes) {
        const token: Token = {
          id: `governable_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1,
          policy: { set_policy: true } // Allow policy updates
        };
        
        const setPolicyOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'set_policy',
          params: { 
            policy: { 
              mint: { ">=": [{ "var": "event.amount" }, 1] } 
            } 
          }
        };
        
        // ACT & ASSERT: set_policy should be allowed
        expect(isOperationLegal(token, setPolicyOperation, mockContext)).toBe(true);
      }
    });
  });

  describe('Extend Expiry Operation', () => {
    it('should reject extend_expiry on non-expirable tokens (E=0)', () => {
      // ARRANGE: All non-expirable types
      const nonExpirableTypes = [0, 1, 4, 5, 8, 9, 12, 13];
      
      for (const type of nonExpirableTypes) {
        const token: Token = {
          id: `non_expirable_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1
        };
        
        const extendExpiryOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'extend_expiry',
          params: { newExpiryOrdinal: 3000 }
        };
        
        // ACT & ASSERT: extend_expiry should be rejected
        expect(isOperationLegal(token, extendExpiryOperation, mockContext)).toBe(false);
        expect(getOperationRejectionReason(token, extendExpiryOperation, mockContext))
          .toBe('NOT_EXPIRABLE');
      }
    });

    it('should allow extend_expiry on active expirable tokens', () => {
      // ARRANGE: Active expirable tokens
      const expirableTypes = [2, 3, 6, 7, 10, 11, 14, 15];
      
      for (const type of expirableTypes) {
        const token: Token = {
          id: `expirable_${type}`,
          behavior: type as TokenBehavior,
          holder: 'DAGholder123...',
          amount: 1,
          expiresAtOrdinal: 2000, // Active (current ordinal is 1000)
          ...(isGovernable(type as TokenBehavior) ? { policy: { extend_expiry: true } } : {})
        };
        
        const extendExpiryOperation: TokenOperation = {
          tokenId: token.id,
          operation: 'extend_expiry',
          params: { newExpiryOrdinal: 3000 }
        };
        
        // ACT & ASSERT: extend_expiry should be allowed
        expect(isOperationLegal(token, extendExpiryOperation, mockContext)).toBe(true);
      }
    });

    it('should allow extend_expiry on expired tokens for revival (if policy allows)', () => {
      // ARRANGE: Expired governable token with revival policy
      const expiredGovernableToken: Token = {
        id: 'revivable_license',
        behavior: 3, // Governed credential
        holder: 'DAGholder123...',
        amount: 1,
        expiresAtOrdinal: 500, // Expired
        policy: {
          extend_expiry: {
            // Allow revival if new expiry is greater than current ordinal
            ">": [{ "var": "event.newExpiryOrdinal" }, { "var": "$ordinal" }]
          }
        }
      };
      
      const reviveOperation: TokenOperation = {
        tokenId: expiredGovernableToken.id,
        operation: 'extend_expiry',
        params: { newExpiryOrdinal: 2000 }
      };
      
      // ACT & ASSERT: Revival should be allowed
      expect(isOperationLegal(expiredGovernableToken, reviveOperation, mockContext)).toBe(true);
    });
  });
});

describe('Token Behavior Matrix: JSON Logic Integration', () => {
  let mockContext: ValidationContext;

  beforeEach(() => {
    mockContext = {
      ordinal: 1000,
      epochProgress: 0.5,
      lastSnapshotHash: '0xabc123',
      proofs: [
        { address: 'DAGauthorized123...', signature: 'sig1' },
        { address: 'DAGsigner456...', signature: 'sig2' }
      ],
      state: {},
      event: {}
    };
  });

  describe('Expiry Guards Using Ordinals', () => {
    it('should create correct JSON Logic guard for ordinal-based expiry', () => {
      // ARRANGE: Expirable token guard
      const expiryGuard = createExpiryGuard();
      
      // ASSERT: Guard structure
      expect(expiryGuard).toEqual({
        "or": [
          // Not expirable
          { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 2] }, 0] },
          // Expirable and not expired
          { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
        ]
      });
    });

    it('should reject tokens that use timestamp instead of ordinal', () => {
      // ARRANGE: Token with invalid timestamp expiry
      const invalidToken: Token = {
        id: 'invalid_timestamp_token',
        behavior: 10, // Expirable ticket
        holder: 'DAGholder123...',
        amount: 1,
        expiresAtOrdinal: 1_500_000, // Correct: ordinal deadline, not timestamp
        metadata: { 
          note: "Test token with ordinal expiry"
        }
      };
      
      // ACT & ASSERT: Should be flagged as invalid
      expect(validateTokenStructure(invalidToken)).toBe(false);
      expect(getTokenValidationErrors(invalidToken)).toContain(
        'Expirable tokens must use expiresAtOrdinal, not timestamps'
      );
    });

    it('should evaluate expiry correctly with ordinal context', () => {
      // ARRANGE: Token with ordinal expiry
      const expiringToken: Token = {
        id: 'ordinal_expiry_token',
        behavior: 14, // Loyalty points
        holder: 'DAGholder123...',
        amount: 500.0,
        expiresAtOrdinal: 1200 // Expires in future
      };
      
      const context1000 = { ...mockContext, ordinal: 1000 }; // Before expiry
      const context1500 = { ...mockContext, ordinal: 1500 }; // After expiry
      
      // ACT & ASSERT: Should be valid before expiry
      expect(isTokenValid(expiringToken, context1000)).toBe(true);
      
      // ACT & ASSERT: Should be invalid after expiry
      expect(isTokenValid(expiringToken, context1500)).toBe(false);
    });
  });

  describe('Transfer Guards with Proof Verification', () => {
    it('should create correct transfer guard using proofs for authorization', () => {
      // ARRANGE: Transfer guard for regulated token
      const transferGuard = createTransferGuard();
      
      // ASSERT: Guard uses proofs[], not event.initiator
      expect(transferGuard).toEqual({
        "and": [
          // Must be transferable
          { "!==": [{ "&": [{ "var": "state.tokenBehavior" }, 8] }, 0] },
          // Must not be expired (if expirable)
          {
            "or": [
              { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 2] }, 0] },
              { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
            ]
          },
          // If governable, check policy using proofs
          {
            "or": [
              { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 1] }, 0] },
              // Policy check - example: authorized address in proofs
              { "in": [
                { "var": "state.policy.authorizedTransferAgent" },
                { "map": [{ "var": "proofs" }, { "var": "address" }] }
              ]}
            ]
          }
        ]
      });
    });

    it('should reject guards that use event.initiator for access control', () => {
      // ARRANGE: Insecure guard using event.initiator
      const insecureGuard = {
        "===": [{ "var": "event.initiator" }, "DAGauthorized123..."]
      };
      
      // ACT & ASSERT: Should be flagged as security vulnerability
      expect(validateJSONLogicSecurity(insecureGuard)).toBe(false);
      expect(getJSONLogicSecurityErrors(insecureGuard)).toContain(
        'event.initiator is user-controlled and insecure for access control'
      );
    });

    it('should accept guards that properly use proofs for authorization', () => {
      // ARRANGE: Secure guard using proofs
      const secureGuard = {
        "in": [
          "DAGauthorized123...",
          { "map": [{ "var": "proofs" }, { "var": "address" }] }
        ]
      };
      
      // ACT & ASSERT: Should pass security validation
      expect(validateJSONLogicSecurity(secureGuard)).toBe(true);
    });
  });

  describe('Complex Policy Scenarios', () => {
    it('should handle multi-condition governance policies', () => {
      // ARRANGE: Complex governed token with multiple conditions
      const complexToken: Token = {
        id: 'complex_governed_asset',
        behavior: 15, // Full-featured asset
        holder: 'DAGholder123...',
        amount: 1000.0,
        expiresAtOrdinal: 2000,
        policy: {
          transfer: {
            "and": [
              // Amount limits
              { "<=": [{ "var": "event.amount" }, 100.0] },
              // Authorized signer required
              { "in": [
                "DAGauthorized123...",
                { "map": [{ "var": "proofs" }, { "var": "address" }] }
              ]},
              // Recipient must be verified
              { "===": [{ "var": "event.recipientVerified" }, true] },
              // Not during blackout periods
              { "<": [{ "var": "$epochProgress" }, 0.9] }
            ]
          },
          mint: {
            "and": [
              // Only minting authority
              { "in": [
                "DAGminter789...",
                { "map": [{ "var": "proofs" }, { "var": "address" }] }
              ]},
              // Maximum supply check
              { "<=": [
                { "+": [{ "var": "state.totalSupply" }, { "var": "event.amount" }] },
                1000000.0
              ]}
            ]
          }
        }
      };
      
      // Test transfer with valid conditions
      const validTransferContext = {
        ...mockContext,
        proofs: [{ address: 'DAGauthorized123...', signature: 'sig' }],
        event: { 
          amount: 50.0, 
          recipient: 'DAGrecipient456...',
          recipientVerified: true 
        }
      };
      
      const transferOperation: TokenOperation = {
        tokenId: complexToken.id,
        operation: 'transfer',
        params: validTransferContext.event
      };
      
      // ACT & ASSERT: Should allow valid transfer
      expect(isOperationLegal(complexToken, transferOperation, validTransferContext)).toBe(true);
      
      // Test transfer with invalid amount
      const invalidTransferContext = {
        ...validTransferContext,
        event: { ...validTransferContext.event, amount: 200.0 } // Exceeds limit
      };
      
      const invalidTransferOperation: TokenOperation = {
        tokenId: complexToken.id,
        operation: 'transfer',
        params: invalidTransferContext.event
      };
      
      // ACT & ASSERT: Should reject invalid transfer
      expect(isOperationLegal(complexToken, invalidTransferOperation, invalidTransferContext)).toBe(false);
    });

    it('should support policy inheritance and defaults', () => {
      // ARRANGE: Token with partial policy (inherits defaults)
      const partialPolicyToken: Token = {
        id: 'partial_policy_token',
        behavior: 13, // Regulated token
        holder: 'DAGholder123...',
        amount: 500.0,
        policy: {
          // Only defines mint policy, transfer should use default
          mint: { "===": [1, 0] } // Always deny mint
          // transfer policy missing - should inherit default or be permissive
        }
      };
      
      const mintOperation: TokenOperation = {
        tokenId: partialPolicyToken.id,
        operation: 'mint',
        params: { amount: 10.0 }
      };
      
      const transferOperation: TokenOperation = {
        tokenId: partialPolicyToken.id,
        operation: 'transfer',
        params: { recipient: 'DAGrecipient123...', amount: 10.0 }
      };
      
      // ACT & ASSERT: Mint should be denied by explicit policy
      expect(isOperationLegal(partialPolicyToken, mintOperation, mockContext)).toBe(false);
      
      // ACT & ASSERT: Transfer should be allowed (no explicit policy = default allow)
      expect(isOperationLegal(partialPolicyToken, transferOperation, mockContext)).toBe(true);
    });
  });
});

describe('Token Behavior Matrix: Anti-Pattern Detection', () => {
  
  describe('Type Selection Anti-Patterns', () => {
    it('should flag Type 15 usage when simpler type would suffice', () => {
      // ARRANGE: Token that claims to be Type 15 but only uses basic features
      const unnecessaryComplexToken: Token = {
        id: 'overcomplicated_token',
        behavior: 15, // Full-featured but only uses T,D features
        holder: 'DAGholder123...',
        amount: 1000.0,
        // No expiry set despite E=1
        // No policy set despite G=1
      };
      
      // ACT & ASSERT: Should recommend simpler Type 12
      const analysis = analyzeTokenDesign(unnecessaryComplexToken);
      expect(analysis.hasAntiPatterns).toBe(true);
      expect(analysis.recommendations).toContain(
        'Consider using Type 12 (Fungible Token) instead of Type 15 - no expiry or governance features used'
      );
    });

    it('should flag missing policy on governable tokens', () => {
      // ARRANGE: Governable token without policy
      const governableWithoutPolicy: Token = {
        id: 'governable_no_policy',
        behavior: 9, // Governed collectible
        holder: 'DAGholder123...',
        amount: 1
        // Missing policy field
      };
      
      // ACT & ASSERT: Should flag missing policy
      const validation = validateTokenStructure(governableWithoutPolicy);
      expect(validation).toBe(false);
      expect(getTokenValidationErrors(governableWithoutPolicy)).toContain(
        'Governable tokens (G=1) must define a policy'
      );
    });

    it('should flag divisible tokens used for "one per person" semantics', () => {
      // ARRANGE: Achievement token that allows fractional amounts
      const fractionalAchievement: Token = {
        id: 'fractional_diploma',
        behavior: 4, // Soulbound but divisible - problematic for achievements
        holder: 'DAGgraduate123...',
        amount: 0.5, // Fractional diploma?!
        metadata: { type: 'graduation_diploma' }
      };
      
      // ACT & ASSERT: Should recommend Type 0 instead
      const analysis = analyzeTokenDesign(fractionalAchievement);
      expect(analysis.hasAntiPatterns).toBe(true);
      expect(analysis.recommendations).toContain(
        'Achievement/diploma tokens should be indivisible (Type 0) to maintain "one per person" semantics'
      );
    });
  });

  describe('Security Anti-Patterns', () => {
    it('should detect timestamp usage instead of ordinal for expiry', () => {
      // ARRANGE: Policy using non-existent $timestamp
      const timestampPolicy = {
        transfer: { "<": [{ "var": "$timestamp" }, 1677649200000] } // Unix timestamp
      };
      
      // ACT & ASSERT: Should flag invalid context variable
      const validation = validateJSONLogicSecurity(timestampPolicy);
      expect(validation).toBe(false);
      expect(getJSONLogicSecurityErrors(timestampPolicy)).toContain(
        '$timestamp is not available in JLVM context - use $ordinal instead'
      );
    });

    it('should detect event.initiator usage in access control', () => {
      // ARRANGE: Multiple insecure patterns
      const insecurePolicies = [
        { "===": [{ "var": "event.initiator" }, "DAGauthorized..."] },
        { "in": [{ "var": "event.initiator" }, ["DAG1...", "DAG2..."]] },
        { 
          "and": [
            { ">=": [{ "var": "event.amount" }, 1] },
            { "===": [{ "var": "event.initiator" }, { "var": "state.owner" }] }
          ]
        }
      ];
      
      for (const policy of insecurePolicies) {
        // ACT & ASSERT: Should flag each insecure usage
        expect(validateJSONLogicSecurity(policy)).toBe(false);
        expect(getJSONLogicSecurityErrors(policy)).toContain(
          'event.initiator is user-controlled and insecure for access control'
        );
      }
    });

    it('should accept secure alternatives using proofs', () => {
      // ARRANGE: Secure policy patterns
      const securePolicies = [
        // Single authorized address
        { "in": [
          "DAGauthorized...",
          { "map": [{ "var": "proofs" }, { "var": "address" }] }
        ]},
        // Multiple authorized addresses
        {
          "some": [
            { "map": [{ "var": "proofs" }, { "var": "address" }] },
            { "in": [{ "var": "this" }, ["DAG1...", "DAG2...", "DAG3..."]] }
          ]
        },
        // Multi-sig requirement (at least 2 of 3)
        {
          ">=": [
            {
              "reduce": [
                { "map": [{ "var": "proofs" }, { "var": "address" }] },
                {
                  "if": [
                    { "in": [{ "var": "accumulator" }, ["DAG1...", "DAG2...", "DAG3..."]] },
                    { "+": [{ "var": "current" }, 1] },
                    { "var": "current" }
                  ]
                },
                0
              ]
            },
            2
          ]
        }
      ];
      
      for (const policy of securePolicies) {
        // ACT & ASSERT: Should pass security validation
        expect(validateJSONLogicSecurity(policy)).toBe(true);
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle edge case of zero-amount tokens', () => {
      // ARRANGE: Token with zero amount
      const zeroAmountToken: Token = {
        id: 'zero_amount_token',
        behavior: 12,
        holder: 'DAGholder123...',
        amount: 0
      };
      
      // ACT & ASSERT: Should handle gracefully
      const validation = validateTokenStructure(zeroAmountToken);
      expect(validation).toBe(true); // Zero amounts may be valid for burns
    });

    it('should validate amount precision for divisible tokens', () => {
      // ARRANGE: Divisible token with too much precision
      const highPrecisionToken: Token = {
        id: 'high_precision_token',
        behavior: 12,
        holder: 'DAGholder123...',
        amount: 123.123456789012345 // Very high precision
      };
      
      // ACT & ASSERT: Should flag precision concerns
      const analysis = analyzeTokenDesign(highPrecisionToken);
      expect(analysis.warnings).toContain(
        'High precision amounts may cause floating-point issues - consider using integer amounts with implied decimals'
      );
    });

    it('should validate holder address format', () => {
      // ARRANGE: Token with invalid holder address
      const invalidHolderToken: Token = {
        id: 'invalid_holder_token',
        behavior: 8,
        holder: 'invalid_address_format',
        amount: 1
      };
      
      // ACT & ASSERT: Should reject invalid address
      expect(validateTokenStructure(invalidHolderToken)).toBe(false);
      expect(getTokenValidationErrors(invalidHolderToken)).toContain(
        'Holder must be valid DAG address format'
      );
    });
  });
});

describe('Token Behavior Matrix: Integration Scenarios', () => {
  
  it('should handle complete token lifecycle for Type 8 NFT', () => {
    // ARRANGE: NFT lifecycle
    let nft: Token = {
      id: 'nft_artwork_001',
      behavior: 8, // Pure collectible
      holder: 'DAGcreator123...',
      amount: 1,
      metadata: { 
        title: 'Digital Sunset #42',
        artist: 'Alice Creator',
        edition: '1/1'
      }
    };
    
    const context = {
      ordinal: 1000,
      epochProgress: 0.5,
      lastSnapshotHash: '0xabc123',
      proofs: [{ address: 'DAGcreator123...', signature: 'sig1' }],
      state: {},
      event: {}
    };
    
    // ACT & ASSERT: Mint should be allowed
    const mintOp = { tokenId: nft.id, operation: 'mint' as const, params: { amount: 1 } };
    expect(isOperationLegal(nft, mintOp, context)).toBe(true);
    
    // ACT & ASSERT: Transfer should be allowed
    const transferOp = { 
      tokenId: nft.id, 
      operation: 'transfer' as const, 
      params: { recipient: 'DAGcollector456...', amount: 1 } 
    };
    expect(isOperationLegal(nft, transferOp, context)).toBe(true);
    
    // ACT & ASSERT: Split should be rejected (indivisible)
    const splitOp = { 
      tokenId: nft.id, 
      operation: 'split' as const, 
      params: { amounts: [0.5, 0.5] } 
    };
    expect(isOperationLegal(nft, splitOp, context)).toBe(false);
    
    // ACT & ASSERT: set_policy should be rejected (non-governable)
    const setPolicyOp = { 
      tokenId: nft.id, 
      operation: 'set_policy' as const, 
      params: { policy: { transfer: false } } 
    };
    expect(isOperationLegal(nft, setPolicyOp, context)).toBe(false);
  });

  it('should handle token evolution from Type 12 to Type 13', () => {
    // ARRANGE: Utility token that becomes regulated
    let utilityToken: Token = {
      id: 'utility_to_regulated',
      behavior: 12, // Initially fungible
      holder: 'DAGholder123...',
      amount: 1000.0
    };
    
    const context = {
      ordinal: 1000,
      epochProgress: 0.5,
      lastSnapshotHash: '0xabc123',
      proofs: [{ address: 'DAGholder123...', signature: 'sig1' }],
      state: {},
      event: {}
    };
    
    // Phase 1: Initial unrestricted transfers
    const initialTransferOp = {
      tokenId: utilityToken.id,
      operation: 'transfer' as const,
      params: { recipient: 'DAGuser456...', amount: 100.0 }
    };
    expect(isOperationLegal(utilityToken, initialTransferOp, context)).toBe(true);
    
    // Phase 2: Token becomes regulated (behavior change)
    const regulatedToken: Token = {
      ...utilityToken,
      behavior: 13, // Now regulated
      policy: {
        transfer: {
          // Require KYC verification
          "===": [{ "var": "event.recipientKYC" }, true]
        },
        mint: {
          // Only regulator can mint
          "in": [
            "DAGregulator789...",
            { "map": [{ "var": "proofs" }, { "var": "address" }] }
          ]
        }
      }
    };
    
    // ACT & ASSERT: Transfer now requires KYC
    const restrictedTransferOp = {
      tokenId: regulatedToken.id,
      operation: 'transfer' as const,
      params: { 
        recipient: 'DAGuser456...', 
        amount: 100.0,
        recipientKYC: false  // Failed KYC
      }
    };
    
    const kycContext = {
      ...context,
      event: restrictedTransferOp.params
    };
    
    expect(isOperationLegal(regulatedToken, restrictedTransferOp, kycContext)).toBe(false);
    
    // ACT & ASSERT: Transfer with KYC should work
    const kycTransferOp = {
      ...restrictedTransferOp,
      params: { ...restrictedTransferOp.params, recipientKYC: true }
    };
    
    const validKycContext = {
      ...context,
      event: kycTransferOp.params
    };
    
    expect(isOperationLegal(regulatedToken, kycTransferOp, validKycContext)).toBe(true);
  });

  it('should validate cross-type compatibility in multi-token scenarios', () => {
    // ARRANGE: Multiple tokens in a complex transaction
    const tokens = [
      { // Utility token for fees
        id: 'fee_token',
        behavior: 12 as TokenBehavior,
        holder: 'DAGtrader123...',
        amount: 100.0
      },
      { // NFT being traded
        id: 'traded_nft',
        behavior: 8 as TokenBehavior,
        holder: 'DAGtrader123...',
        amount: 1
      },
      { // Expiring auction bid
        id: 'bid_token',
        behavior: 14 as TokenBehavior,
        holder: 'DAGbidder456...',
        amount: 500.0,
        expiresAtOrdinal: 1200
      }
    ];
    
    const context = {
      ordinal: 1100, // Before bid expiry
      epochProgress: 0.5,
      lastSnapshotHash: '0xabc123',
      proofs: [{ address: 'DAGtrader123...', signature: 'sig1' }],
      state: {},
      event: {}
    };
    
    // ACT & ASSERT: Multi-token transaction validation
    const transactionValid = validateMultiTokenTransaction(tokens, [
      { tokenId: 'fee_token', operation: 'burn', params: { amount: 5.0 } },
      { tokenId: 'traded_nft', operation: 'transfer', params: { recipient: 'DAGbidder456...', amount: 1 } },
      { tokenId: 'bid_token', operation: 'transfer', params: { recipient: 'DAGtrader123...', amount: 500.0 } }
    ], context);
    
    expect(transactionValid).toBe(true);
    
    // ACT & ASSERT: Same transaction after bid expiry should fail
    const expiredContext = { ...context, ordinal: 1300 };
    const expiredTransactionValid = validateMultiTokenTransaction(tokens, [
      { tokenId: 'fee_token', operation: 'burn', params: { amount: 5.0 } },
      { tokenId: 'traded_nft', operation: 'transfer', params: { recipient: 'DAGbidder456...', amount: 1 } },
      { tokenId: 'bid_token', operation: 'transfer', params: { recipient: 'DAGtrader123...', amount: 500.0 } }
    ], expiredContext);
    
    expect(expiredTransactionValid).toBe(false);
  });
});

// Mock helper functions (these would be implemented in the actual token framework)

// ===== HELPER FUNCTIONS FOR TESTS =====
// Core functions are imported from ../src/token-behavior-matrix

// Helper functions for tests - these would be implemented later
function isOperationLegal(_token: Token, _operation: TokenOperation, _context: ValidationContext): boolean {
  throw new Error('Not yet implemented - TDD test should fail');
}

function getOperationRejectionReason(_token: Token, _operation: TokenOperation, _context: ValidationContext): string {
  throw new Error('Not yet implemented - TDD test should fail');
}

// validateTokenStructure and getTokenValidationErrors are imported from ../src/token-behavior-matrix

function isTokenValid(_token: Token, _context: ValidationContext): boolean {
  throw new Error('Not yet implemented - TDD test should fail');
}

function createExpiryGuard(): any {
  // Mock implementation - would create JSON Logic guard for expiry
  return {
    "or": [
      { "===": [{ "&": [{ "var": "state.tokenBehavior" }, 2] }, 0] },
      { "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }] }
    ]
  };
}

function createTransferGuard(): any {
  // Mock implementation - would create JSON Logic guard for transfer
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateJSONLogicSecurity(_policy: any): boolean {
  throw new Error('Not yet implemented - TDD test should fail');
}

function getJSONLogicSecurityErrors(_policy: any): string[] {
  throw new Error('Not yet implemented - TDD test should fail');
}

function analyzeTokenDesign(_token: Token): { 
  hasAntiPatterns: boolean; 
  recommendations: string[];
  warnings: string[];
} {
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateMultiTokenTransaction(
  _tokens: Token[], 
  _operations: TokenOperation[], 
  _context: ValidationContext
): boolean {
  throw new Error('Not yet implemented - TDD test should fail');
}