import { marketUniversalDef } from '../../src/apps/markets/state-machines/market-universal.js';

describe('Market Universal State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(marketUniversalDef).toBeDefined();
      expect(typeof marketUniversalDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(marketUniversalDef.metadata.name).toBe('MarketUniversal');
      expect(marketUniversalDef.metadata.app).toBe('markets');
      expect(marketUniversalDef.metadata.description).toBe(
        'Minimal market state machine - extend for custom use cases'
      );
      expect(marketUniversalDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED'];
      const actualStates = Object.keys(marketUniversalDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(marketUniversalDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(marketUniversalDef.states.SETTLED.isFinal).toBe(true);
      expect(marketUniversalDef.states.CANCELLED.isFinal).toBe(true);
      expect(marketUniversalDef.states.PROPOSED.isFinal).toBe(false);
      expect(marketUniversalDef.states.OPEN.isFinal).toBe(false);
      expect(marketUniversalDef.states.CLOSED.isFinal).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should allow open transition from PROPOSED to OPEN', () => {
      const openTransition = marketUniversalDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition).toBeDefined();
      expect(openTransition!.guard).toBeDefined();
      expect(openTransition!.effect).toBeDefined();
    });

    it('should allow cancel transition from PROPOSED to CANCELLED', () => {
      const cancelTransition = marketUniversalDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
    });

    it('should allow commit transition from OPEN to OPEN (self-loop)', () => {
      const commitTransition = marketUniversalDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'commit'
      );
      
      expect(commitTransition).toBeDefined();
      expect(commitTransition!.guard).toEqual({
        ">": [{ "var": "event.amount" }, 0]
      });
    });

    it('should allow close transition from OPEN to CLOSED', () => {
      const closeTransition = marketUniversalDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CLOSED' && t.eventName === 'close'
      );
      
      expect(closeTransition).toBeDefined();
    });

    it('should allow settle transition from CLOSED to SETTLED', () => {
      const settleTransition = marketUniversalDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'SETTLED' && t.eventName === 'settle'
      );
      
      expect(settleTransition).toBeDefined();
    });

    it('should allow cancel transition from CLOSED to CANCELLED', () => {
      const cancelFromClosedTransition = marketUniversalDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelFromClosedTransition).toBeDefined();
    });
  });

  describe('JSON Logic Guards', () => {
    it('should have valid commit amount guard', () => {
      const commitTransition = marketUniversalDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'commit'
      );
      
      expect(commitTransition!.guard).toEqual({
        ">": [{ "var": "event.amount" }, 0]
      });
    });

    it('should have universal true guards for simple transitions', () => {
      const openTransition = marketUniversalDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition!.guard).toEqual({ "==": [1, 1] });
    });
  });

  describe('Effects', () => {
    it('should update status and timestamp on open', () => {
      const openTransition = marketUniversalDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition!.effect).toEqual({
        "merge": [
          { "var": "state" },
          {
            "status": "OPEN",
            "openedAt": { "var": "$timestamp" }
          }
        ]
      });
    });

    it('should update totalCommitted on commit', () => {
      const commitTransition = marketUniversalDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'commit'
      );
      
      expect(commitTransition!.effect).toEqual({
        "merge": [
          { "var": "state" },
          {
            "totalCommitted": {
              "+": [
                { "var": "state.totalCommitted" },
                { "var": "event.amount" }
              ]
            }
          }
        ]
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not allow invalid transitions', () => {
      // No direct transition from PROPOSED to SETTLED
      const invalidTransition = marketUniversalDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'SETTLED'
      );
      
      expect(invalidTransition).toBeUndefined();
    });

    it('should not allow transitions from final states', () => {
      // No transitions FROM settled state
      const fromSettledTransitions = marketUniversalDef.transitions.filter(
        t => t.from === 'SETTLED'
      );
      
      expect(fromSettledTransitions).toHaveLength(0);
    });
  });
});