/**
 * Tests for fiber-app schema helpers.
 * Covers getTransitionsFrom, getEventsFrom, isFinalState, toJSON.
 */
import { describe, expect, it } from '@jest/globals';
import {
  getTransitionsFrom,
  getEventsFrom,
  isFinalState,
  toJSON,
  toProtoDefinition,
  defineFiberApp,
} from '../src/schema/fiber-app.js';
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
      expect(events.every((e) => typeof e === 'string')).toBe(true);
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

  describe('toProtoDefinition — guard/effect always reach the wire', () => {
    // The chain's `Transition` case class REQUIRES `guard` + `effect` (no Scala defaults); an omitted
    // key decodes to a failure → HTTP 400. Authoring keeps them optional, so the projector must default.
    const bareDef = defineFiberApp({
      metadata: { name: 'Bare', app: 'test', type: 'bare', version: '1.0.0' },
      states: {
        A: { id: 'A', isFinal: false },
        B: { id: 'B', isFinal: true },
      },
      initialState: 'A',
      transitions: [{ from: 'A', to: 'B', eventName: 'go' }], // NO guard, NO effect
    });

    it('projects an omitted guard to the always-true {"==":[1,1]} and an omitted effect to {}', () => {
      const proto = toProtoDefinition(bareDef);
      expect(proto.transitions).toHaveLength(1);
      const t = proto.transitions[0];
      expect(t.guard).toEqual({ '==': [1, 1] });
      expect(t.effect).toEqual({});
      // guard/effect keys are PRESENT (not undefined) so they survive JSON serialization to the wire
      expect(Object.prototype.hasOwnProperty.call(t, 'guard')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(t, 'effect')).toBe(true);
      expect(JSON.parse(JSON.stringify(t))).toMatchObject({ guard: { '==': [1, 1] }, effect: {} });
    });

    it('preserves an explicitly-authored guard/effect verbatim', () => {
      const withLogic = defineFiberApp({
        metadata: { name: 'Logic', app: 'test', type: 'logic', version: '1.0.0' },
        states: { A: { id: 'A', isFinal: false }, B: { id: 'B', isFinal: true } },
        initialState: 'A',
        transitions: [
          {
            from: 'A',
            to: 'B',
            eventName: 'go',
            guard: { '>': [{ var: 'event.amount' }, 0] },
            effect: { total: { var: 'event.amount' } },
          },
        ],
      });
      const t = toProtoDefinition(withLogic).transitions[0];
      expect(t.guard).toEqual({ '>': [{ var: 'event.amount' }, 0] });
      expect(t.effect).toEqual({ total: { var: 'event.amount' } });
    });
  });
});
