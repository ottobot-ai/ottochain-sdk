/**
 * Tests for TokenDAO state machine
 */

import { daoTokenDef } from '../../src/apps/governance/state-machines/dao-token';

describe('TokenDAO State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(daoTokenDef).toBeDefined();
    expect(daoTokenDef.metadata.name).toBe('TokenDAO');
    expect(daoTokenDef.metadata.app).toBe('governance');
    expect(daoTokenDef.metadata.type).toBe('daoToken');
    expect(daoTokenDef.metadata.version).toBe('1.0.0');
    expect((daoTokenDef.metadata as any).category).toBe('governance/dao');
  });

  it('should have correct states', () => {
    expect(daoTokenDef.states.ACTIVE.isFinal).toBe(false);
    expect(daoTokenDef.states.VOTING.isFinal).toBe(false);
    expect(daoTokenDef.states.QUEUED.isFinal).toBe(false);
    expect(daoTokenDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(daoTokenDef.initialState).toBe('ACTIVE');
  });

  it('should require balances, proposalThreshold, quorum, votingPeriodMs, timelockMs on create', () => {
    expect(daoTokenDef.createSchema.required).toContain('balances');
    expect(daoTokenDef.createSchema.required).toContain('proposalThreshold');
    expect(daoTokenDef.createSchema.required).toContain('quorum');
    expect(daoTokenDef.createSchema.required).toContain('votingPeriodMs');
    expect(daoTokenDef.createSchema.required).toContain('timelockMs');
  });

  it('should guard propose on token balance >= proposalThreshold', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'propose' && t.from === 'ACTIVE' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });

  it('should guard vote: token holder, no double-vote, within window', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'vote' && t.from === 'VOTING' && t.to === 'VOTING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should queue proposal with timelock after voting ends (for > against, quorum)', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'queue' && t.from === 'VOTING' && t.to === 'QUEUED'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should execute after timelock expires', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'QUEUED' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });

  it('should emit proposal_executed on execute', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'QUEUED' && t.to === 'ACTIVE'
    );
    expect((t as any)?.emits).toBeDefined();
    expect((t as any)?.emits[0].event).toBe('proposal_executed');
  });

  it('should reject failed proposals', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'reject' && t.from === 'VOTING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should cancel queued proposal (proposer only)', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'cancel' && t.from === 'QUEUED' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('===');
  });

  it('should support delegation (token holder only)', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'delegate' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>');
  });

  it('should support undelegation', () => {
    const t = daoTokenDef.transitions.find(
      t => t.eventName === 'undelegate' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });
});
