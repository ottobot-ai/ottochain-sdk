/**
 * Tests for GovernanceSimple state machine
 */

import { govSimpleDef } from '../../src/apps/governance/state-machines/governance-simple';

describe('GovernanceSimple State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(govSimpleDef).toBeDefined();
    expect(govSimpleDef.metadata.name).toBe('Governance');
    expect(govSimpleDef.metadata.app).toBe('governance');
    expect(govSimpleDef.metadata.type).toBe('simple');
    expect(govSimpleDef.metadata.version).toBe('1.0.0');
  });

  it('should have correct states', () => {
    expect(govSimpleDef.states.ACTIVE.isFinal).toBe(false);
    expect(govSimpleDef.states.VOTING.isFinal).toBe(false);
    expect(govSimpleDef.states.DISPUTE.isFinal).toBe(false);
    expect(govSimpleDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(govSimpleDef.initialState).toBe('ACTIVE');
  });

  it('should require admins, passingThreshold, disputeQuorum, votingPeriodMs on create', () => {
    expect(govSimpleDef.createSchema.required).toContain('admins');
    expect(govSimpleDef.createSchema.required).toContain('passingThreshold');
    expect(govSimpleDef.createSchema.required).toContain('disputeQuorum');
    expect(govSimpleDef.createSchema.required).toContain('votingPeriodMs');
  });

  it('should guard add_member to admins only', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'add_member' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('in');
  });

  it('should guard remove_member to admins only', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'remove_member' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('in');
  });

  it('should have propose transition gated on membership', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'propose' && t.from === 'ACTIVE' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('getKey');
  });

  it('should have two finalize transitions (passed and failed)', () => {
    const transitions = govSimpleDef.transitions.filter(
      t => t.eventName === 'finalize' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect(transitions.length).toBe(2);
  });

  it('should have file_dispute transition from ACTIVE to DISPUTE', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'file_dispute' && t.from === 'ACTIVE' && t.to === 'DISPUTE'
    );
    expect(t).toBeDefined();
  });

  it('should allow submit_evidence from plaintiff or defendant', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'submit_evidence' && t.from === 'DISPUTE' && t.to === 'DISPUTE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('or');
  });

  it('should resolve dispute back to ACTIVE', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'resolve' && t.from === 'DISPUTE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should have dissolve requiring 90% approval', () => {
    const t = govSimpleDef.transitions.find(
      t => t.eventName === 'dissolve' && t.from === 'ACTIVE' && t.to === 'DISSOLVED'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });
});
