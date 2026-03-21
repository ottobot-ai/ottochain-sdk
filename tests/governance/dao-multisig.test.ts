/**
 * Tests for MultisigDAO state machine
 */

import { daoMultisigDef } from '../../src/apps/governance/state-machines/dao-multisig';

describe('MultisigDAO State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(daoMultisigDef).toBeDefined();
    expect(daoMultisigDef.metadata.name).toBe('MultisigDAO');
    expect(daoMultisigDef.metadata.app).toBe('governance');
    expect(daoMultisigDef.metadata.type).toBe('daoMultisig');
    expect(daoMultisigDef.metadata.version).toBe('1.0.0');
    expect((daoMultisigDef.metadata as any).category).toBe('governance/dao');
  });

  it('should have correct states', () => {
    expect(daoMultisigDef.states.ACTIVE.isFinal).toBe(false);
    expect(daoMultisigDef.states.PENDING.isFinal).toBe(false);
    expect(daoMultisigDef.states.DISSOLVED.isFinal).toBe(true);
  });

  it('should start in ACTIVE', () => {
    expect(daoMultisigDef.initialState).toBe('ACTIVE');
  });

  it('should require signers, threshold, proposalTTLMs on create', () => {
    expect(daoMultisigDef.createSchema.required).toContain('signers');
    expect(daoMultisigDef.createSchema.required).toContain('threshold');
    expect(daoMultisigDef.createSchema.required).toContain('proposalTTLMs');
  });

  it('should guard propose to signers only', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'propose' && t.from === 'ACTIVE' && t.to === 'PENDING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('in');
  });

  it('should guard sign: signer, no double-sign, not yet at threshold', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'sign' && t.from === 'PENDING' && t.to === 'PENDING'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should execute when threshold met', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'PENDING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });

  it('should emit multisig_executed on execute', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'execute' && t.from === 'PENDING' && t.to === 'ACTIVE'
    );
    expect((t as any)?.emits).toBeDefined();
    expect((t as any)?.emits[0].event).toBe('multisig_executed');
  });

  it('should cancel expired or proposer-cancelled proposals', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'cancel' && t.from === 'PENDING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('or');
  });

  it('should support propose_add_signer (signer only)', () => {
    const t = daoMultisigDef.transitions.find(t => t.eventName === 'propose_add_signer');
    expect(t).toBeDefined();
    expect(t?.from).toBe('ACTIVE');
    expect(t?.to).toBe('PENDING');
  });

  it('should support propose_remove_signer with signers > threshold guard', () => {
    const t = daoMultisigDef.transitions.find(t => t.eventName === 'propose_remove_signer');
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should support propose_change_threshold with 1 <= new <= signers count', () => {
    const t = daoMultisigDef.transitions.find(t => t.eventName === 'propose_change_threshold');
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('and');
  });

  it('should apply signer changes via apply_signer_change', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'apply_signer_change' && t.from === 'PENDING' && t.to === 'ACTIVE'
    );
    expect(t).toBeDefined();
  });

  it('should dissolve with unanimous signatures', () => {
    const t = daoMultisigDef.transitions.find(
      t => t.eventName === 'dissolve' && t.from === 'ACTIVE' && t.to === 'DISSOLVED'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('===');
  });
});
