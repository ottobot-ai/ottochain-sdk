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

  it('should have minimal states', () => {
    expect(marketUniversalDef.states.PROPOSED).toEqual({ id: 'PROPOSED', isFinal: false, metadata: null });
    expect(marketUniversalDef.states.OPEN).toEqual({ id: 'OPEN', isFinal: false, metadata: null });
    expect(marketUniversalDef.states.CLOSED).toEqual({ id: 'CLOSED', isFinal: false, metadata: null });
    expect(marketUniversalDef.states.SETTLED).toEqual({ id: 'SETTLED', isFinal: true, metadata: null });
    expect(marketUniversalDef.states.CANCELLED).toEqual({ id: 'CANCELLED', isFinal: true, metadata: null });
  });

  it('should start in PROPOSED state', () => {
    expect(marketUniversalDef.initialState).toBe('PROPOSED');
  });

  it('should have open, cancel, commit, close, settle events', () => {
    const eventNames = marketUniversalDef.transitions.map(t => t.eventName);
    expect(eventNames).toContain('open');
    expect(eventNames).toContain('cancel');
    expect(eventNames).toContain('commit');
    expect(eventNames).toContain('close');
    expect(eventNames).toContain('settle');
  });

  it('should have commit transition with amount guard', () => {
    const commitTransition = marketUniversalDef.transitions.find(t => t.eventName === 'commit');
    expect(commitTransition).toBeDefined();
    expect(commitTransition?.from).toBe('OPEN');
    expect(commitTransition?.to).toBe('OPEN');
    expect(commitTransition?.guard).toHaveProperty('>');
  });
});
