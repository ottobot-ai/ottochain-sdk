/**
 * TDD Tests for Token Types and Constants
 * 
 * Tests for TokenBehavior type system, flags, and named constants.
 * Based on specification: docs/design/asset-model-token-spec.md § 3
 */

import {
  TOKEN_BEHAVIOR_FLAGS,
  TOKEN_BEHAVIOR_NAMES,
  TOKEN_BEHAVIOR_TYPES,
  TokenBehavior,
  describeTokenBehavior,
  isDivisible,
  isExpirable,
  isGovernable,
  isTransferable,
  makeTokenBehavior,
} from '../../../src/apps/token';

describe('Token Types and Constants', () => {
  
  describe('TOKEN_BEHAVIOR_FLAGS Constants', () => {
    test('TOKEN_BEHAVIOR_FLAGS has correct bit patterns', () => {
      expect(TOKEN_BEHAVIOR_FLAGS.TRANSFERABLE).toBe(8);  // 0b1000
      expect(TOKEN_BEHAVIOR_FLAGS.DIVISIBLE).toBe(4);     // 0b0100
      expect(TOKEN_BEHAVIOR_FLAGS.EXPIRABLE).toBe(2);     // 0b0010
      expect(TOKEN_BEHAVIOR_FLAGS.GOVERNABLE).toBe(1);    // 0b0001
    });

    test('Flag bits are mutually exclusive powers of 2', () => {
      const flags = Object.values(TOKEN_BEHAVIOR_FLAGS);
      
      // Each flag should be a power of 2
      flags.forEach(flag => {
        expect((flag & (flag - 1))).toBe(0); // Power of 2 check
      });
      
      // All flags combined should be 15 (0b1111)
      const combined = flags.reduce((a, b) => a | b, 0);
      expect(combined).toBe(15);
    });
  });

  describe('TOKEN_BEHAVIOR_TYPES Named Constants', () => {
    test('TOKEN_BEHAVIOR_TYPES covers all values 0-15', () => {
      const values = Object.values(TOKEN_BEHAVIOR_TYPES);
      expect(values).toHaveLength(16);
      
      // Should have all values from 0 to 15
      for (let i = 0; i <= 15; i++) {
        expect(values).toContain(i);
      }
      
      // All values should be unique
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(16);
    });

    test('TOKEN_BEHAVIOR_TYPES has meaningful names matching behavior flags', () => {
      // Test a few key examples
      expect(TOKEN_BEHAVIOR_TYPES.SOULBOUND_RECEIPT).toBe(0); // T=0, D=0, E=0, G=0
      expect(TOKEN_BEHAVIOR_TYPES.NFT).toBe(8); // T=1, D=0, E=0, G=0
      expect(TOKEN_BEHAVIOR_TYPES.FUNGIBLE_TOKEN).toBe(12); // T=1, D=1, E=0, G=0
      expect(TOKEN_BEHAVIOR_TYPES.GOVERNED_EXPIRABLE_FUNGIBLE).toBe(15); // T=1, D=1, E=1, G=1
    });

    test('Named types match their bit patterns', () => {
      // Soulbound Receipt: T=0, D=0, E=0, G=0 = 0
      expect(TOKEN_BEHAVIOR_TYPES.SOULBOUND_RECEIPT).toBe(0);
      
      // NFT: T=1, D=0, E=0, G=0 = 8
      expect(TOKEN_BEHAVIOR_TYPES.NFT).toBe(8);
      
      // License: T=0, D=0, E=1, G=1 = 3
      expect(TOKEN_BEHAVIOR_TYPES.GOVERNED_LICENSE).toBe(3);
      
      // Stablecoin: T=1, D=1, E=0, G=1 = 13
      expect(TOKEN_BEHAVIOR_TYPES.GOVERNED_FUNGIBLE_TOKEN).toBe(13);
    });
  });

  describe('TokenBehavior Construction', () => {
    test('makeTokenBehavior correctly combines boolean flags', () => {
      // Test various combinations
      expect(makeTokenBehavior(false, false, false, false)).toBe(0); // Soulbound receipt
      expect(makeTokenBehavior(true, false, false, false)).toBe(8);  // NFT
      expect(makeTokenBehavior(true, true, false, false)).toBe(12);  // Fungible token
      expect(makeTokenBehavior(true, true, true, true)).toBe(15);    // Full feature set
      expect(makeTokenBehavior(false, false, true, true)).toBe(3);   // License
    });

    test('makeTokenBehavior handles all 16 combinations', () => {
      const combinations: Array<[boolean, boolean, boolean, boolean, number]> = [
        [false, false, false, false, 0],
        [false, false, false, true, 1],
        [false, false, true, false, 2],
        [false, false, true, true, 3],
        [false, true, false, false, 4],
        [false, true, false, true, 5],
        [false, true, true, false, 6],
        [false, true, true, true, 7],
        [true, false, false, false, 8],
        [true, false, false, true, 9],
        [true, false, true, false, 10],
        [true, false, true, true, 11],
        [true, true, false, false, 12],
        [true, true, false, true, 13],
        [true, true, true, false, 14],
        [true, true, true, true, 15]
      ];
      
      combinations.forEach(([t, d, e, g, expected]) => {
        expect(makeTokenBehavior(t, d, e, g)).toBe(expected);
      });
    });
  });

  describe('TokenBehavior Predicates', () => {
    test('isTransferable correctly identifies T flag', () => {
      // Transferable types (T=1): 8-15
      for (let i = 8; i <= 15; i++) {
        expect(isTransferable(i as TokenBehavior)).toBe(true);
      }
      
      // Non-transferable types (T=0): 0-7
      for (let i = 0; i <= 7; i++) {
        expect(isTransferable(i as TokenBehavior)).toBe(false);
      }
    });

    test('isDivisible correctly identifies D flag', () => {
      // Divisible types (D=1): 4-7, 12-15
      const divisibleTypes = [4, 5, 6, 7, 12, 13, 14, 15];
      divisibleTypes.forEach(type => {
        expect(isDivisible(type as TokenBehavior)).toBe(true);
      });
      
      // Non-divisible types (D=0): 0-3, 8-11
      const indivisibleTypes = [0, 1, 2, 3, 8, 9, 10, 11];
      indivisibleTypes.forEach(type => {
        expect(isDivisible(type as TokenBehavior)).toBe(false);
      });
    });

    test('isExpirable correctly identifies E flag', () => {
      // Expirable types (E=1): 2-3, 6-7, 10-11, 14-15
      const expirableTypes = [2, 3, 6, 7, 10, 11, 14, 15];
      expirableTypes.forEach(type => {
        expect(isExpirable(type as TokenBehavior)).toBe(true);
      });
      
      // Non-expirable types (E=0): 0-1, 4-5, 8-9, 12-13
      const permanentTypes = [0, 1, 4, 5, 8, 9, 12, 13];
      permanentTypes.forEach(type => {
        expect(isExpirable(type as TokenBehavior)).toBe(false);
      });
    });

    test('isGovernable correctly identifies G flag', () => {
      // Governable types (G=1): odd numbers 1, 3, 5, 7, 9, 11, 13, 15
      const governableTypes = [1, 3, 5, 7, 9, 11, 13, 15];
      governableTypes.forEach(type => {
        expect(isGovernable(type as TokenBehavior)).toBe(true);
      });
      
      // Non-governable types (G=0): even numbers 0, 2, 4, 6, 8, 10, 12, 14
      const autonomousTypes = [0, 2, 4, 6, 8, 10, 12, 14];
      autonomousTypes.forEach(type => {
        expect(isGovernable(type as TokenBehavior)).toBe(false);
      });
    });
  });

  describe('TOKEN_BEHAVIOR_NAMES Lookup', () => {
    test('TOKEN_BEHAVIOR_NAMES provides reverse lookup', () => {
      expect(TOKEN_BEHAVIOR_NAMES[0]).toBe('SOULBOUND_RECEIPT');
      expect(TOKEN_BEHAVIOR_NAMES[8]).toBe('NFT');
      expect(TOKEN_BEHAVIOR_NAMES[12]).toBe('FUNGIBLE_TOKEN');
      expect(TOKEN_BEHAVIOR_NAMES[15]).toBe('GOVERNED_EXPIRABLE_FUNGIBLE');
    });

    test('TOKEN_BEHAVIOR_NAMES covers all 16 types', () => {
      for (let i = 0; i <= 15; i++) {
        expect(TOKEN_BEHAVIOR_NAMES[i]).toBeDefined();
        expect(typeof TOKEN_BEHAVIOR_NAMES[i]).toBe('string');
        expect(TOKEN_BEHAVIOR_NAMES[i].length).toBeGreaterThan(0);
      }
    });

    test('TOKEN_BEHAVIOR_NAMES matches TOKEN_BEHAVIOR_TYPES keys', () => {
      const typeKeys = Object.keys(TOKEN_BEHAVIOR_TYPES);
      const nameValues = Object.values(TOKEN_BEHAVIOR_NAMES);
      
      // Every name should correspond to a type key
      nameValues.forEach(name => {
        expect(typeKeys).toContain(name);
      });
    });
  });

  describe('describeTokenBehavior Function', () => {
    test('describeTokenBehavior returns meaningful descriptions', () => {
      const description0 = describeTokenBehavior(0);
      expect(description0).toContain('soulbound');
      expect(description0).toContain('indivisible');
      expect(description0).toContain('permanent');
      
      const description8 = describeTokenBehavior(8);
      expect(description8).toContain('transferable');
      expect(description8).toContain('indivisible');
      expect(description8).toContain('permanent');
      
      const description15 = describeTokenBehavior(15);
      expect(description15).toContain('transferable');
      expect(description15).toContain('divisible');
      expect(description15).toContain('expirable');
      expect(description15).toContain('governable');
    });

    test('describeTokenBehavior handles edge cases', () => {
      // Should work for all valid behaviors
      for (let i = 0; i <= 15; i++) {
        const description = describeTokenBehavior(i as TokenBehavior);
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Type Safety', () => {
    test('TokenBehavior type restricts to valid values', () => {
      const validBehaviors: TokenBehavior[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      
      // This test passes if TypeScript compilation succeeds
      validBehaviors.forEach(behavior => {
        expect(typeof behavior).toBe('number');
        expect(behavior >= 0 && behavior <= 15).toBe(true);
      });
    });
  });
});
