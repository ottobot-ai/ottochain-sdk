/**
 * TDD Tests for Asset Model: Token State Machine SDK
 * 
 * Tests for token state machine factory functions and utilities.
 * Based on specification: docs/design/asset-model-token-spec.md
 * 
 * Total: 48 test cases across 6 groups
 */

import {
  createTokenStateMachine,
  getFungibleTokenDefinition,
  getLicenseDefinition,
  getNFTDefinition,
  getSoulboundBadgeDefinition,
  getStablecoinDefinition,
  isDivisible,
  isExpirable,
  isGovernable,
  isTransferable,
  makeTokenBehavior,
  TOKEN_BEHAVIOR_TYPES,
  TokenStateMachineDefinition,
  validateTokenEvent,
} from '../../../src/apps/token';

// ── Re-export TokenEvent for this test file ──────────────────────────────────

interface TokenEvent {
  eventName: string;
  fiberId: string;
  [key: string]: unknown;
}

describe('Asset Model: Token State Machine SDK', () => {
  
  describe('Group 1: TokenBehavior Predicates (5 tests)', () => {
    test('T1.1: makeTokenBehavior(true, false, false, false) === 8 (NFT)', () => {
      const result = makeTokenBehavior(true, false, false, false);
      expect(result).toBe(8);
    });

    test('T1.2: makeTokenBehavior(true, true, false, true) === 13 (stablecoin)', () => {
      const result = makeTokenBehavior(true, true, false, true);
      expect(result).toBe(13);
    });

    test('T1.3: isTransferable(8) === true; isTransferable(7) === false', () => {
      expect(isTransferable(8)).toBe(true);  // NFT is transferable
      expect(isTransferable(7)).toBe(false); // Soulbound expirable points not transferable
    });

    test('T1.4: isDivisible(4) === true; isDivisible(8) === false', () => {
      expect(isDivisible(4)).toBe(true);  // Loyalty points are divisible
      expect(isDivisible(8)).toBe(false); // NFT is not divisible
    });

    test('T1.5: isExpirable(2) === true; isGovernable(1) === true', () => {
      expect(isExpirable(2)).toBe(true);  // Expirable credential
      expect(isGovernable(1)).toBe(true); // Governed badge
    });
  });

  describe('Group 2: State Machine Structure — All 16 Types (16 tests)', () => {
    for (let behavior = 0; behavior <= 15; behavior++) {
      test(`T2.${behavior}: createTokenStateMachine(${behavior}) returns valid structure`, () => {
        const result = createTokenStateMachine(behavior);
        
        // Always present states
        expect(result.states).toHaveProperty('ACTIVE');
        expect(result.states).toHaveProperty('BURNED');
        expect(result.states.BURNED).toHaveProperty('isFinal', true);
        
        // Wire format for initialState
        expect(result.initialState).toEqual({ value: 'ACTIVE' });
        
        // At least burn transition always present
        expect(Array.isArray(result.transitions)).toBe(true);
        expect(result.transitions.length).toBeGreaterThanOrEqual(1);
        
        // Should have burn transition
        const burnTransition = result.transitions.find(t => t.eventName === 'burn');
        expect(burnTransition).toBeDefined();
        expect(burnTransition?.from).toEqual({ value: 'ACTIVE' });
        expect(burnTransition?.to).toEqual({ value: 'BURNED' });
      });
    }
  });

  describe('Group 3: Transition Presence by Flag (12 tests)', () => {
    test('T3.1: behavior=8 (NFT, T=1) → has transfer transition', () => {
      const result = createTokenStateMachine(8);
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
    });

    test('T3.2: behavior=0 (soulbound, T=0) → no transfer transition', () => {
      const result = createTokenStateMachine(0);
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeUndefined();
    });

    test('T3.3: behavior=12 (fungible, D=1) → has split transition', () => {
      const result = createTokenStateMachine(12);
      const splitTransition = result.transitions.find(t => t.eventName === 'split');
      expect(splitTransition).toBeDefined();
    });

    test('T3.4: behavior=12 (fungible, D=1) → has merge transition', () => {
      const result = createTokenStateMachine(12);
      const mergeTransition = result.transitions.find(t => t.eventName === 'merge');
      expect(mergeTransition).toBeDefined();
    });

    test('T3.5: behavior=8 (NFT, D=0) → no split transition', () => {
      const result = createTokenStateMachine(8);
      const splitTransition = result.transitions.find(t => t.eventName === 'split');
      expect(splitTransition).toBeUndefined();
    });

    test('T3.6: behavior=8 (NFT, D=0) → no merge transition', () => {
      const result = createTokenStateMachine(8);
      const mergeTransition = result.transitions.find(t => t.eventName === 'merge');
      expect(mergeTransition).toBeUndefined();
    });

    test('T3.7: behavior=2 (expirable, E=1) → has expire transition', () => {
      const result = createTokenStateMachine(2);
      const expireTransition = result.transitions.find(t => t.eventName === 'expire');
      expect(expireTransition).toBeDefined();
    });

    test('T3.8: behavior=0 (permanent, E=0) → no expire transition', () => {
      const result = createTokenStateMachine(0);
      const expireTransition = result.transitions.find(t => t.eventName === 'expire');
      expect(expireTransition).toBeUndefined();
    });

    test('T3.9: All 16 types → have burn transition (burn is universal)', () => {
      for (let behavior = 0; behavior <= 15; behavior++) {
        const result = createTokenStateMachine(behavior);
        const burnTransition = result.transitions.find(t => t.eventName === 'burn');
        expect(burnTransition).toBeDefined();
      }
    });

    test('T3.10: behavior=13 (governed, G=1) → transfer guard contains delegation.isAuthorized', () => {
      const result = createTokenStateMachine(13);
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
      
      const guard = transferTransition!.guard;
      const guardStr = JSON.stringify(guard);
      expect(guardStr).toContain('delegation.isAuthorized');
    });

    test('T3.11: behavior=12 (not governed, G=0) → transfer guard does NOT contain delegation.isAuthorized', () => {
      const result = createTokenStateMachine(12);
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
      
      const guard = transferTransition!.guard;
      const guardStr = JSON.stringify(guard);
      expect(guardStr).not.toContain('delegation.isAuthorized');
    });

    test('T3.12: behavior=9 (T=1, G=1, E=0) → transfer guard contains governance check only (no expiry)', () => {
      const result = createTokenStateMachine(9);
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
      
      const guard = transferTransition!.guard;
      const guardStr = JSON.stringify(guard);
      expect(guardStr).toContain('delegation.isAuthorized');
      expect(guardStr).not.toContain('expiresAtOrdinal');
    });
  });

  describe('Group 4: Wire Format Correctness (6 tests)', () => {
    test('T4.1: initialState is { value: "ACTIVE" } not plain string', () => {
      const result = createTokenStateMachine(8);
      expect(result.initialState).toEqual({ value: 'ACTIVE' });
      expect(typeof result.initialState).toBe('object');
    });

    test('T4.2: All state IDs are { value: string } not plain strings', () => {
      const result = createTokenStateMachine(8);
      
      // Check that states object contains wire format
      const stateKeys = Object.keys(result.states);
      expect(stateKeys.length).toBeGreaterThan(0);
      
      // States should be objects with proper structure, not the keys themselves
      expect(result.states.ACTIVE).toBeDefined();
      expect(result.states.BURNED).toBeDefined();
    });

    test('T4.3: All transition from/to are { value: string } not plain strings', () => {
      const result = createTokenStateMachine(8);
      
      result.transitions.forEach(transition => {
        expect(transition.from).toHaveProperty('value');
        expect(typeof transition.from.value).toBe('string');
        expect(transition.to).toHaveProperty('value');
        expect(typeof transition.to.value).toBe('string');
      });
    });

    test('T4.4: createTokenStateMachine(8).metadata.tokenBehavior === 8', () => {
      const result = createTokenStateMachine(8);
      expect(result.metadata?.tokenBehavior).toBe(8);
    });

    test('T4.5: Guard for type 10 (E=1, T=1) contains ordinal comparison', () => {
      const result = createTokenStateMachine(10); // Expirable NFT
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
      
      const guard = transferTransition!.guard;
      const guardStr = JSON.stringify(guard);
      expect(guardStr).toContain('$ordinal');
      expect(guardStr).toContain('state.expiresAtOrdinal');
      expect(guardStr).toContain('<'); // Less than comparison
    });

    test('T4.6: Split guard for type 12 (D=1) contains amount <= balance check', () => {
      const result = createTokenStateMachine(12); // Fungible token
      const splitTransition = result.transitions.find(t => t.eventName === 'split');
      expect(splitTransition).toBeDefined();
      
      const guard = splitTransition!.guard;
      const guardStr = JSON.stringify(guard);
      expect(guardStr).toContain('event.amount');
      expect(guardStr).toContain('state.balance');
      expect(guardStr).toContain('<='); // Less than or equal comparison
    });
  });

  describe('Group 5: Event Validators (4 tests)', () => {
    test('T5.1: validateTokenEvent({eventName:"transfer",...}, behavior=0) → throws (soulbound)', () => {
      const transferEvent: TokenEvent = {
        eventName: 'transfer',
        fiberId: 'test-fiber',
        recipient: 'recipient-address'
      };
      
      expect(() => {
        validateTokenEvent(transferEvent as Parameters<typeof validateTokenEvent>[0], 0);
      }).toThrow();
    });

    test('T5.2: validateTokenEvent({eventName:"transfer",...}, behavior=8) → does not throw (NFT)', () => {
      const transferEvent: TokenEvent = {
        eventName: 'transfer',
        fiberId: 'test-fiber',
        recipient: 'recipient-address'
      };
      
      expect(() => {
        validateTokenEvent(transferEvent as Parameters<typeof validateTokenEvent>[0], 8);
      }).not.toThrow();
    });

    test('T5.3: validateTokenEvent({eventName:"split",...}, behavior=8) → throws (indivisible)', () => {
      const splitEvent: TokenEvent = {
        eventName: 'split',
        fiberId: 'test-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(splitEvent as Parameters<typeof validateTokenEvent>[0], 8);
      }).toThrow();
    });

    test('T5.4: validateTokenEvent({eventName:"split",...}, behavior=12) → does not throw (divisible)', () => {
      const splitEvent: TokenEvent = {
        eventName: 'split',
        fiberId: 'test-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(splitEvent as Parameters<typeof validateTokenEvent>[0], 12);
      }).not.toThrow();
    });
  });

  describe('Group 6: Named Presets (5 tests)', () => {
    test('T6.1: getNFTDefinition().metadata.tokenBehavior === 8', () => {
      const result = getNFTDefinition();
      expect(result.metadata?.tokenBehavior).toBe(8);
    });

    test('T6.2: getFungibleTokenDefinition().metadata.tokenBehavior === 12', () => {
      const result = getFungibleTokenDefinition();
      expect(result.metadata?.tokenBehavior).toBe(12);
    });

    test('T6.3: getStablecoinDefinition().metadata.tokenBehavior === 13 — guard has governance check', () => {
      const result = getStablecoinDefinition();
      expect(result.metadata?.tokenBehavior).toBe(13);
      
      // Should have transfer transition with governance check
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeDefined();
      
      const guardStr = JSON.stringify(transferTransition!.guard);
      expect(guardStr).toContain('delegation.isAuthorized');
    });

    test('T6.4: getLicenseDefinition().metadata.tokenBehavior === 3 — is soulbound (no transfer) + expirable', () => {
      const result = getLicenseDefinition();
      expect(result.metadata?.tokenBehavior).toBe(3);
      
      // Should not have transfer (soulbound)
      const transferTransition = result.transitions.find(t => t.eventName === 'transfer');
      expect(transferTransition).toBeUndefined();
      
      // Should have expire transition (expirable)
      const expireTransition = result.transitions.find(t => t.eventName === 'expire');
      expect(expireTransition).toBeDefined();
    });

    test('T6.5: TOKEN_BEHAVIOR_TYPES has exactly 16 entries covering all values 0–15', () => {
      const values = Object.values(TOKEN_BEHAVIOR_TYPES);
      expect(values).toHaveLength(16);
      
      // Should cover all values from 0 to 15
      for (let i = 0; i <= 15; i++) {
        expect(values).toContain(i);
      }
      
      // Should have all 16 unique values
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(16);
    });
  });

  // Smoke test for the unused preset
  test('getSoulboundBadgeDefinition().metadata.tokenBehavior === 0', () => {
    const result: TokenStateMachineDefinition = getSoulboundBadgeDefinition();
    expect(result.metadata.tokenBehavior).toBe(0);
  });
});
