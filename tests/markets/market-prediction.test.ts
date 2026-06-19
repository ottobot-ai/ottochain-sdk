/**
 * Tests for MarketPrediction state machine
 */

import { marketPredictionDef } from '../../src/apps/markets/state-machines/market-prediction';

describe('MarketPrediction State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(marketPredictionDef).toBeDefined();
    expect(marketPredictionDef.metadata.name).toBe('MarketPrediction');
    expect(marketPredictionDef.metadata.app).toBe('markets');
    expect(marketPredictionDef.metadata.type).toBe('prediction');
    expect(marketPredictionDef.metadata.version).toBe('1.0.0');
  });

  it('should have crossReferences', () => {
    expect(marketPredictionDef.metadata.crossReferences).toBeDefined();
    expect(marketPredictionDef.metadata.crossReferences).toHaveProperty('oracleId');
    expect(marketPredictionDef.metadata.crossReferences).toHaveProperty('creatorIdentityId');
  });

  it('should have correct states', () => {
    expect(marketPredictionDef.states.PROPOSED.isFinal).toBe(false);
    expect(marketPredictionDef.states.OPEN.isFinal).toBe(false);
    expect(marketPredictionDef.states.CLOSED.isFinal).toBe(false);
    expect(marketPredictionDef.states.RESOLVING.isFinal).toBe(false);
    expect(marketPredictionDef.states.DISPUTED.isFinal).toBe(false);
    expect(marketPredictionDef.states.SETTLED.isFinal).toBe(true);
    expect(marketPredictionDef.states.REFUNDED.isFinal).toBe(true);
    expect(marketPredictionDef.states.CANCELLED.isFinal).toBe(true);
  });

  it('should start in PROPOSED', () => {
    expect(marketPredictionDef.initialState).toBe('PROPOSED');
  });

  it('should require creator, outcomes, oracles, quorum on create', () => {
    expect(marketPredictionDef.createSchema.required).toContain('creator');
    expect(marketPredictionDef.createSchema.required).toContain('outcomes');
    expect(marketPredictionDef.createSchema.required).toContain('oracles');
    expect(marketPredictionDef.createSchema.required).toContain('quorum');
  });

  it('should have take_position transition from OPEN to OPEN', () => {
    const t = marketPredictionDef.transitions.find(
      t => t.eventName === 'take_position' && t.from === 'OPEN' && t.to === 'OPEN'
    );
    expect(t).toBeDefined();
  });

  it('should guard oracle resolution submission to authorized oracles', () => {
    const t = marketPredictionDef.transitions.find(
      t => t.eventName === 'submit_resolution' && t.from === 'CLOSED'
    );
    expect(t).toBeDefined();
    // Oracle allowlist binds to VERIFIED signers (proofs[].address), not the
    // forgeable event.agent — signerInSet('state.oracles').
    expect(t?.guard).toEqual({
      some: [
        { map: [{ var: 'proofs' }, { var: 'address' }] },
        { in: [{ var: '' }, { var: 'state.oracles' }] },
      ],
    });
  });

  it('should require quorum for finalization', () => {
    const t = marketPredictionDef.transitions.find(
      t => t.eventName === 'finalize' && t.to === 'SETTLED'
    );
    expect(t).toBeDefined();
    expect(t?.guard).toHaveProperty('>=');
  });

  it('should support dispute and ruling transitions', () => {
    const dispute = marketPredictionDef.transitions.find(t => t.eventName === 'dispute');
    const ruling = marketPredictionDef.transitions.find(t => t.eventName === 'ruling');
    expect(dispute).toBeDefined();
    expect(ruling).toBeDefined();
    expect(ruling?.guard).toHaveProperty('var');
  });

  it('should support invalidation by oracle consensus', () => {
    const invalidate = marketPredictionDef.transitions.find(t => t.eventName === 'invalidate');
    expect(invalidate).toBeDefined();
    expect(invalidate?.to).toBe('REFUNDED');
  });

  it('should support claim after settlement', () => {
    const claim = marketPredictionDef.transitions.find(t => t.eventName === 'claim');
    expect(claim).toBeDefined();
    expect(claim?.from).toBe('SETTLED');
    expect(claim?.to).toBe('SETTLED');
  });
});
