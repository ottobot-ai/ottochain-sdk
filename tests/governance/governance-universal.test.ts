/**
 * Tests for GovernanceUniversal state machine
 */

import { govUniversalDef } from '../../src/apps/governance/state-machines/governance-universal';

describe('GovernanceUniversal State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(govUniversalDef).toBeDefined();
    expect(govUniversalDef.metadata.name).toBe('GovernanceUniversal');
    expect(govUniversalDef.metadata.app).toBe('governance');
    expect(govUniversalDef.metadata.type).toBe('universal');
    expect(govUniversalDef.metadata.version).toBe('1.0.0');
  });

  it('should have correct states', () => {
    expect(govUniversalDef.states.ACTIVE.isFinal).toBe(false);
    expect(govUniversalDef.states.VOTING.isFinal).toBe(false);
    expect(govUniversalDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(govUniversalDef.initialState).toBe('ACTIVE');
  });

  it('should have propose transition from ACTIVE to VOTING', () => {
    const t = govUniversalDef.transitions.find(
      t => t.eventName === 'propose' && t.from === 'ACTIVE' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
  });

  it('should have vote transition in VOTING', () => {
    const t = govUniversalDef.transitions.find(
      t => t.eventName === 'vote' && t.from === 'VOTING' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
  });

  it('should have finalize transition from VOTING to ACTIVE', () => {
    const t = govUniversalDef.transitions.find(
      t => t.eventName === 'finalize' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should have dissolve transition from ACTIVE to DISSOLVED', () => {
    const t = govUniversalDef.transitions.find(
      t => t.eventName === 'dissolve' && t.from === 'ACTIVE' && t.to === 'DISSOLVED'
    );
    expect(t).toBeDefined();
  });

  it('should have eventSchemas defined', () => {
    expect(govUniversalDef.eventSchemas).toBeDefined();
    expect(govUniversalDef.eventSchemas.propose).toBeDefined();
    expect(govUniversalDef.eventSchemas.vote).toBeDefined();
    expect(govUniversalDef.eventSchemas.finalize).toBeDefined();
    expect(govUniversalDef.eventSchemas.dissolve).toBeDefined();
  });
});
