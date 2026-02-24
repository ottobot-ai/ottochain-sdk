/**
 * Token Validation and JSON Logic Tests (TDD)
 * Tests the runtime validation logic for token operations using JSON Logic guards.
 * 
 * These tests validate that the token behavior matrix correctly enforces
 * operation legality based on the TDEG dimensions.
 */

import {
  validateTokenOperation,
  evaluateTokenGuard,
  createOperationContext,
  TOKEN_BEHAVIOR_TYPES,
  TokenValidationError,
  GuardEvaluationContext,
} from '../src/apps/token/validation';

describe('Token Operation Validation', () => {
  describe('Operation Legality Matrix', () => {
    describe('Mint Operation', () => {
      it('should allow mint for all token types when not expired', () => {
        // Test all 16 types
        for (let behavior = 0; behavior <= 15; behavior++) {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'mint', amount: '100' },
            proofs: [{ address: 'DAGissuer123' }],
            $ordinal: 1000,
            $epochProgress: 0.5,
            $lastSnapshotHash: 'hash123'
          };

          const result = validateTokenOperation('mint', context);
          
          if ((behavior & 2) === 2 && context.state.expiresAtOrdinal && context.$ordinal >= context.state.expiresAtOrdinal) {
            // Expired tokens should reject mint
            expect(result.valid).toBe(false);
            expect(result.error).toContain('expired');
          } else if ((behavior & 1) === 1) {
            // Governable tokens need policy check
            expect(result.valid).toBe(true); // Assuming basic policy allows
          } else {
            // Non-governable tokens should always allow mint
            expect(result.valid).toBe(true);
          }
        }
      });

      it('should reject mint for expired expirable tokens', () => {
        const context: GuardEvaluationContext = {
          state: { 
            tokenBehavior: 10, // Ticket (expirable)
            expiresAtOrdinal: 500
          },
          event: { type: 'mint', amount: '1' },
          proofs: [],
          $ordinal: 1000 // Past expiry
        };

        const result = validateTokenOperation('mint', context);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('expired');
      });

      it('should enforce policy for governable tokens', () => {
        const context: GuardEvaluationContext = {
          state: { 
            tokenBehavior: 13, // Regulated Token (governable)
            policy: {
              allowedMinter: 'DAGissuer123'
            }
          },
          event: { type: 'mint', amount: '100' },
          proofs: [{ address: 'DAGunauthorized456' }], // Wrong issuer
          $ordinal: 1000
        };

        const result = validateTokenOperation('mint', context);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('policy violation');
      });
    });

    describe('Transfer Operation', () => {
      it('should reject transfer for all soulbound tokens (T=0)', () => {
        const soulboundTypes = [0, 1, 2, 3, 4, 5, 6, 7]; // T=0

        soulboundTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'transfer', recipient: 'DAGnewowner' },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('transfer', context);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('soulbound');
        });
      });

      it('should allow transfer for all transferable tokens (T=1) when not expired', () => {
        const transferableTypes = [8, 9, 10, 11, 12, 13, 14, 15]; // T=1

        transferableTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'transfer', recipient: 'DAGnewowner' },
            proofs: [{ address: 'DAGcurrentowner' }],
            $ordinal: 1000
          };

          const result = validateTokenOperation('transfer', context);
          
          if ((behavior & 2) === 2 && context.state.expiresAtOrdinal && context.$ordinal >= context.state.expiresAtOrdinal) {
            // Should reject if expired
            expect(result.valid).toBe(false);
          } else {
            expect(result.valid).toBe(true);
          }
        });
      });

      it('should reject transfer for expired expirable tokens', () => {
        const context: GuardEvaluationContext = {
          state: { 
            tokenBehavior: 10, // Ticket (transferable + expirable)
            expiresAtOrdinal: 500
          },
          event: { type: 'transfer', recipient: 'DAGnewowner' },
          proofs: [],
          $ordinal: 1000 // Past expiry
        };

        const result = validateTokenOperation('transfer', context);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('expired');
      });
    });

    describe('Split Operation', () => {
      it('should reject split for all indivisible tokens (D=0)', () => {
        const indivisibleTypes = [0, 1, 2, 3, 8, 9, 10, 11]; // D=0

        indivisibleTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior, amount: '2' },
            event: { type: 'split', amounts: ['1', '1'] },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('split', context);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('indivisible');
        });
      });

      it('should allow split for all divisible tokens (D=1) when not expired', () => {
        const divisibleTypes = [4, 5, 6, 7, 12, 13, 14, 15]; // D=1

        divisibleTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior, amount: '100.50' },
            event: { type: 'split', amounts: ['50.25', '50.25'] },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('split', context);
          expect(result.valid).toBe(true);
        });
      });

      it('should validate split amounts sum to original', () => {
        const context: GuardEvaluationContext = {
          state: { tokenBehavior: 12, amount: '100' },
          event: { type: 'split', amounts: ['40', '70'] }, // Sum = 110, not 100
          proofs: [],
          $ordinal: 1000
        };

        const result = validateTokenOperation('split', context);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('amounts must sum');
      });
    });

    describe('Set Policy Operation', () => {
      it('should allow set_policy only for governable tokens (G=1)', () => {
        const governableTypes = [1, 3, 5, 7, 9, 11, 13, 15]; // G=1
        const nonGovernableTypes = [0, 2, 4, 6, 8, 10, 12, 14]; // G=0

        governableTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'set_policy', policy: { newRule: true } },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('set_policy', context);
          expect(result.valid).toBe(true);
        });

        nonGovernableTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'set_policy', policy: { newRule: true } },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('set_policy', context);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('not governable');
        });
      });
    });

    describe('Extend Expiry Operation', () => {
      it('should allow extend_expiry only for expirable tokens (E=1)', () => {
        const expirableTypes = [2, 3, 6, 7, 10, 11, 14, 15]; // E=1
        const permanentTypes = [0, 1, 4, 5, 8, 9, 12, 13]; // E=0

        expirableTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior, expiresAtOrdinal: 2000 },
            event: { type: 'extend_expiry', newExpiresAtOrdinal: 3000 },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('extend_expiry', context);
          expect(result.valid).toBe(true);
        });

        permanentTypes.forEach(behavior => {
          const context: GuardEvaluationContext = {
            state: { tokenBehavior: behavior },
            event: { type: 'extend_expiry', newExpiresAtOrdinal: 3000 },
            proofs: [],
            $ordinal: 1000
          };

          const result = validateTokenOperation('extend_expiry', context);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('not expirable');
        });
      });

      it('should allow extending expiry even on expired tokens if governable', () => {
        const context: GuardEvaluationContext = {
          state: { 
            tokenBehavior: 15, // Full-featured (expirable + governable)
            expiresAtOrdinal: 500,
            policy: { allowedExtender: 'DAGauthority' }
          },
          event: { type: 'extend_expiry', newExpiresAtOrdinal: 2000 },
          proofs: [{ address: 'DAGauthority' }],
          $ordinal: 1000 // Past current expiry
        };

        const result = validateTokenOperation('extend_expiry', context);
        expect(result.valid).toBe(true); // Policy allows revival
      });

      it('should reject extending expiry backwards', () => {
        const context: GuardEvaluationContext = {
          state: { 
            tokenBehavior: 10,
            expiresAtOrdinal: 2000
          },
          event: { type: 'extend_expiry', newExpiresAtOrdinal: 1500 }, // Earlier
          proofs: [],
          $ordinal: 1000
        };

        const result = validateTokenOperation('extend_expiry', context);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be in the future');
      });
    });
  });

  describe('Security Validation', () => {
    it('should never use event.initiator for authorization', () => {
      const govToken = {
        tokenBehavior: 13,
        policy: {
          mint: { "===": [{ "var": "event.initiator" }, "ISSUER"] } // BAD - user-controlled
        }
      };

      const context: GuardEvaluationContext = {
        state: govToken,
        event: { type: 'mint', initiator: 'ISSUER' }, // Attacker sets this
        proofs: [{ address: 'DAGattacker' }], // But proofs show real signer
        $ordinal: 1000
      };

      // The validation system should reject guards that use event.initiator
      expect(() => {
        validateTokenOperation('mint', context);
      }).toThrow('Security violation: event.initiator cannot be used for authorization');
    });

    it('should require cryptographic proof for authorization', () => {
      const context: GuardEvaluationContext = {
        state: { 
          tokenBehavior: 13,
          policy: {
            allowedMinter: 'DAGissuer123'
          }
        },
        event: { type: 'mint' },
        proofs: [{ address: 'DAGattacker456' }], // Wrong address
        $ordinal: 1000
      };

      const result = validateTokenOperation('mint', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('issuer not in cryptographic proofs');
    });

    it('should validate DAG addresses format', () => {
      const context: GuardEvaluationContext = {
        state: { tokenBehavior: 8 },
        event: { type: 'transfer', recipient: 'invalid-address' },
        proofs: [],
        $ordinal: 1000
      };

      const result = validateTokenOperation('transfer', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid DAG address format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts correctly', () => {
      const context: GuardEvaluationContext = {
        state: { tokenBehavior: 12 },
        event: { type: 'mint', amount: '0' },
        proofs: [],
        $ordinal: 1000
      };

      const result = validateTokenOperation('mint', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('amount must be positive');
    });

    it('should handle negative amounts', () => {
      const context: GuardEvaluationContext = {
        state: { tokenBehavior: 12 },
        event: { type: 'mint', amount: '-100' },
        proofs: [],
        $ordinal: 1000
      };

      const result = validateTokenOperation('mint', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('amount cannot be negative');
    });

    it('should handle invalid decimal precision for indivisible tokens', () => {
      const context: GuardEvaluationContext = {
        state: { tokenBehavior: 8 }, // NFT (indivisible)
        event: { type: 'mint', amount: '1.5' }, // Fractional not allowed
        proofs: [],
        $ordinal: 1000
      };

      const result = validateTokenOperation('mint', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('fractional amounts not allowed for indivisible tokens');
    });

    it('should handle ordinal boundary conditions', () => {
      // Exactly at expiry ordinal
      const context1: GuardEvaluationContext = {
        state: { 
          tokenBehavior: 10,
          expiresAtOrdinal: 1000
        },
        event: { type: 'transfer' },
        proofs: [],
        $ordinal: 1000 // Exactly at expiry
      };

      const result1 = validateTokenOperation('transfer', context1);
      expect(result1.valid).toBe(false); // Should be expired (>= condition)

      // Just before expiry
      const context2: GuardEvaluationContext = {
        ...context1,
        $ordinal: 999
      };

      const result2 = validateTokenOperation('transfer', context2);
      expect(result2.valid).toBe(true); // Should be valid (< condition)
    });

    it('should handle missing required fields gracefully', () => {
      const context: GuardEvaluationContext = {
        state: { tokenBehavior: 10 }, // Missing expiresAtOrdinal for expirable token
        event: { type: 'transfer' },
        proofs: [],
        $ordinal: 1000
      };

      const result = validateTokenOperation('transfer', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expiresAtOrdinal required for expirable tokens');
    });

    it('should handle self-transfers', () => {
      const context: GuardEvaluationContext = {
        state: { 
          tokenBehavior: 8,
          holder: 'DAGuser123'
        },
        event: { 
          type: 'transfer', 
          recipient: 'DAGuser123' // Same as current holder
        },
        proofs: [{ address: 'DAGuser123' }],
        $ordinal: 1000
      };

      const result = validateTokenOperation('transfer', context);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot transfer to self');
    });
  });

  describe('JSON Logic Context Variables', () => {
    it('should provide all required context variables', () => {
      const context = createOperationContext({
        tokenBehavior: 15,
        holder: 'DAGuser',
        amount: '100'
      }, {
        type: 'mint',
        amount: '50'
      }, [{
        address: 'DAGsigner'
      }], 1000);

      expect(context).toHaveProperty('state');
      expect(context).toHaveProperty('event');
      expect(context).toHaveProperty('proofs');
      expect(context).toHaveProperty('$ordinal');
      expect(context).toHaveProperty('$epochProgress');
      expect(context).toHaveProperty('$lastSnapshotHash');

      // Should NOT have $timestamp
      expect(context).not.toHaveProperty('$timestamp');
    });

    it('should use ordinals for time-based checks, not timestamps', () => {
      const guardExpression = {
        "<": [{ "var": "$ordinal" }, { "var": "state.expiresAtOrdinal" }]
      };

      const context: GuardEvaluationContext = {
        state: { expiresAtOrdinal: 2000 },
        event: {},
        proofs: [],
        $ordinal: 1500
      };

      const result = evaluateTokenGuard(guardExpression, context);
      expect(result).toBe(true);

      context.$ordinal = 2500;
      const result2 = evaluateTokenGuard(guardExpression, context);
      expect(result2).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide specific error messages for each violation type', () => {
      const testCases = [
        {
          context: { state: { tokenBehavior: 0 }, event: { type: 'transfer' } },
          expectedError: 'Transfer not allowed: token is soulbound'
        },
        {
          context: { state: { tokenBehavior: 8 }, event: { type: 'split' } },
          expectedError: 'Split not allowed: token is indivisible'
        },
        {
          context: { state: { tokenBehavior: 12 }, event: { type: 'set_policy' } },
          expectedError: 'Set policy not allowed: token is not governable'
        },
        {
          context: { state: { tokenBehavior: 8 }, event: { type: 'extend_expiry' } },
          expectedError: 'Extend expiry not allowed: token is not expirable'
        }
      ];

      testCases.forEach(({ context, expectedError }) => {
        const result = validateTokenOperation(context.event.type as any, {
          ...context,
          proofs: [],
          $ordinal: 1000
        } as GuardEvaluationContext);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBe(expectedError);
      });
    });
  });
});