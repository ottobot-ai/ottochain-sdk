/**
 * Tests for SingleOwnerDAO state machine
 */

import { daoSingleDef } from '../../src/apps/governance/state-machines/dao-single';

describe('SingleOwnerDAO State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(daoSingleDef).toBeDefined();
    expect(daoSingleDef.metadata.name).toBe('SingleOwnerDAO');
    expect(daoSingleDef.metadata.app).toBe('governance');
    expect(daoSingleDef.metadata.type).toBe('daoSingle');
    expect(daoSingleDef.metadata.version).toBe('1.0.0');
    expect((daoSingleDef.metadata as any).category).toBe('governance/dao');
  });

  it('should have correct states', () => {
    expect(daoSingleDef.states.ACTIVE.isFinal).toBe(false);
    expect(daoSingleDef.states.TRANSFERRING.isFinal).toBe(false);
    expect(daoSingleDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(daoSingleDef.initialState).toBe('ACTIVE');
  });

  it('should require owner on create', () => {
    expect(daoSingleDef.createSchema.required).toContain('owner');
  });

  it('should have crossReferences for Identity, Contract, Treasury', () => {
    expect((daoSingleDef.metadata as any).crossReferences).toBeDefined();
    expect((daoSingleDef.metadata as any).crossReferences.Identity).toBeDefined();
    expect((daoSingleDef.metadata as any).crossReferences.Contract).toBeDefined();
    expect((daoSingleDef.metadata as any).crossReferences.Treasury).toBeDefined();
  });

  it('should guard execute to owner only', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('===');
  });

  it('should have execute emit action_executed', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'ACTIVE' && t.to === 'ACTIVE'
    );
    expect((t as any)?.emits).toBeDefined();
    expect((t as any)?.emits[0].event).toBe('action_executed');
  });

  it('should transition ACTIVE → TRANSFERRING on transfer_ownership', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'transfer_ownership' && t.from === 'ACTIVE' && t.to === 'TRANSFERRING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('===');
  });

  it('should accept ownership from pending owner', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'accept_ownership' && t.from === 'TRANSFERRING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should allow owner to cancel transfer', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'cancel_transfer' && t.from === 'TRANSFERRING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should dissolve when owner calls dissolve', () => {
    const t = daoSingleDef.transitions.find(
      t => t.eventName === 'dissolve' && t.from === 'ACTIVE' && t.to === 'DISSOLVED'
    );
    expect(t).toBeDefined();
  });
});
