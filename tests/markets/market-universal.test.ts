/**
 * Tests for MarketUniversal state machine
 */

import { marketUniversalDef } from '../../src/apps/markets/state-machines/market-universal';

describe('MarketUniversal State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(marketUniversalDef).toBeDefined();
    expect(marketUniversalDef.metadata).toBeDefined();
    expect(marketUniversalDef.metadata.name).toBe('MarketUniversal');
    expect(marketUniversalDef.metadata.app).toBe('markets');
    expect(marketUniversalDef.metadata.type).toBe('universal');
    expect(marketUniversalDef.metadata.version).toBe('1.0.0');
  });

  it('should have the expected states with standard metadata', () => {
    expect(marketUniversalDef.states.PROPOSED.id).toBe('PROPOSED');
    expect(marketUniversalDef.states.PROPOSED.isFinal).toBe(false);
    expect(marketUniversalDef.states.OPEN.isFinal).toBe(false);
    expect(marketUniversalDef.states.CLOSED.isFinal).toBe(false);
    expect(marketUniversalDef.states.SETTLED.isFinal).toBe(true);
    expect(marketUniversalDef.states.CANCELLED.isFinal).toBe(true);

    // States now carry the standard { label, description, category } metadata
    // block (not null), which survives client/server null-dropping canonicalization.
    for (const state of Object.values(marketUniversalDef.states)) {
      expect(state.metadata).not.toBeNull();
      expect(typeof state.metadata!.label).toBe('string');
      expect(typeof state.metadata!.description).toBe('string');
    }
    expect(marketUniversalDef.states.PROPOSED.metadata!.category).toBe('initial');
    expect(marketUniversalDef.states.OPEN.metadata!.category).toBe('active');
    expect(marketUniversalDef.states.SETTLED.metadata!.category).toBe('terminal');
  });

  it('should start in PROPOSED state', () => {
    expect(marketUniversalDef.initialState).toBe('PROPOSED');
  });

  it('should have open, cancel, commit, close, settle events', () => {
    const eventNames = marketUniversalDef.transitions.map((t) => t.eventName);
    expect(eventNames).toContain('open');
    expect(eventNames).toContain('cancel');
    expect(eventNames).toContain('commit');
    expect(eventNames).toContain('close');
    expect(eventNames).toContain('settle');
  });

  it('should have commit transition with amount guard', () => {
    const commitTransition = marketUniversalDef.transitions.find((t) => t.eventName === 'commit');
    expect(commitTransition).toBeDefined();
    expect(commitTransition?.from).toBe('OPEN');
    expect(commitTransition?.to).toBe('OPEN');
    expect(commitTransition?.guard).toHaveProperty('>');
  });
});
