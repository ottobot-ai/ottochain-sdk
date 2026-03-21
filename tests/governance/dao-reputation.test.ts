/**
 * Tests for DAOReputation state machine
 */

import { daoReputationDef } from '../../src/apps/governance/state-machines/dao-reputation';

describe('DAOReputation State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(daoReputationDef).toBeDefined();
    expect(daoReputationDef.metadata.name).toBe('DAOReputation');
    expect(daoReputationDef.metadata.app).toBe('governance');
    expect(daoReputationDef.metadata.type).toBe('daoReputation');
    expect(daoReputationDef.metadata.version).toBe('1.0.0');
    expect((daoReputationDef.metadata as any).category).toBe('governance/dao');
  });

  it('should have correct states', () => {
    expect(daoReputationDef.states.ACTIVE.isFinal).toBe(false);
    expect(daoReputationDef.states.VOTING.isFinal).toBe(false);
    expect(daoReputationDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(daoReputationDef.initialState).toBe('ACTIVE');
  });

  it('should require memberThreshold, voteThreshold, proposeThreshold, quorum, votingPeriodMs on create', () => {
    expect(daoReputationDef.createSchema.required).toContain('memberThreshold');
    expect(daoReputationDef.createSchema.required).toContain('voteThreshold');
    expect(daoReputationDef.createSchema.required).toContain('proposeThreshold');
    expect(daoReputationDef.createSchema.required).toContain('quorum');
    expect(daoReputationDef.createSchema.required).toContain('votingPeriodMs');
  });

  it('should guard propose on agentReputation >= proposeThreshold', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'propose' && t.from === 'ACTIVE' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });

  it('should guard vote: reputation check, no double-vote, within window', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'vote' && t.from === 'VOTING' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should execute passing proposal (voting ended, for > against, quorum)', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should emit proposal_executed to Reputation oracle on execute', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect((t as any)?.emits).toBeDefined();
    expect((t as any)?.emits[0].event).toBe('proposal_executed');
    expect((t as any)?.emits[0].to).toBe('Reputation');
  });

  it('should reject failed proposals', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'reject' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should allow join when reputation meets memberThreshold and not already a member', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'join' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should allow leave for current members', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'leave' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('in');
  });

  it('should support propose_threshold_change gated on proposeThreshold', () => {
    const t = daoReputationDef.transitions.find(
      t => t.eventName === 'propose_threshold_change' && t.from === 'ACTIVE' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });
});
