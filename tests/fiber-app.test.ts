/**
 * Tests for fiber-app schema helpers.
 * Covers getTransitionsFrom, getEventsFrom, isFinalState, toJSON.
 */
import { describe, expect, it } from '@jest/globals';
import { getTransitionsFrom, getEventsFrom, isFinalState, toJSON } from '../src/schema/fiber-app.js';
import { identityAgentDef } from '../src/apps/identity/state-machines/index.js';

// Use the identity-agent definition as a real fixture
const def = identityAgentDef;

describe('fiber-app schema helpers', () => {
  describe('getTransitionsFrom', () => {
    it('returns transitions from REGISTERED state', () => {
      const transitions = getTransitionsFrom(def, 'REGISTERED' as any);
      expect(Array.isArray(transitions)).toBe(true);
      expect(transitions.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown state', () => {
      const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
      expect(transitions).toEqual([]);
    });
  });

  describe('getEventsFrom', () => {
    it('returns event names for REGISTERED state', () => {
      const events = getEventsFrom(def, 'REGISTERED' as any);
      expect(Array.isArray(events)).toBe(true);
      expect(events.every(e => typeof e === 'string')).toBe(true);
    });

    it('returns empty array for unknown state', () => {
      const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
      expect(events).toEqual([]);
    });
  });

  describe('isFinalState', () => {
    it('returns false for non-final state', () => {
      expect(isFinalState(def, 'REGISTERED' as any)).toBe(false);
    });

    it('returns true for WITHDRAWN (final) state', () => {
      expect(isFinalState(def, 'WITHDRAWN' as any)).toBe(true);
    });

    it('returns false for undefined state', () => {
      expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns a plain object', () => {
      const json = toJSON(def);
      expect(typeof json).toBe('object');
      expect(json).not.toBeNull();
    });

    it('result is JSON-serializable', () => {
      const json = toJSON(def);
      expect(() => JSON.stringify(json)).not.toThrow();
    });

    it('deep-equals the original definition', () => {
      const json = toJSON(def);
      expect(JSON.stringify(json)).toBe(JSON.stringify(def));
    });
  });
});
