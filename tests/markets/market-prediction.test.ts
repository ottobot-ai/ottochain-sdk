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

  it('should require creator, outcomes, oracles, quorum, arbiter on create', () => {
    expect(marketPredictionDef.createSchema.required).toContain('creator');
    expect(marketPredictionDef.createSchema.required).toContain('outcomes');
    expect(marketPredictionDef.createSchema.required).toContain('oracles');
    expect(marketPredictionDef.createSchema.required).toContain('quorum');
    // S2 settlement-bypass fix: the arbiter is a state-pinned authority.
    expect(marketPredictionDef.createSchema.required).toContain('arbiter');
    expect(marketPredictionDef.createSchema.properties.arbiter.type).toBe('address');
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

  it('should require an oracle signer AND quorum (count, not size) for finalization', () => {
    const t = marketPredictionDef.transitions.find(
      t => t.eventName === 'finalize' && t.to === 'SETTLED'
    );
    expect(t).toBeDefined();
    // S2 fix: finalize is gated on a verified oracle signer plus the quorum count,
    // and the settled outcome derives from state.resolutions — never event.outcome.
    expect(t?.guard).toHaveProperty('and');
    expect(t?.guard.and[0]).toEqual({
      some: [
        { map: [{ var: 'proofs' }, { var: 'address' }] },
        { in: [{ var: '' }, { var: 'state.oracles' }] },
      ],
    });
    expect(t?.guard.and[1]).toEqual({
      '>=': [{ count: { var: 'state.resolutions' } }, { var: 'state.quorum' }],
    });
    // never the nonexistent `size` opcode
    expect(JSON.stringify(t?.guard)).not.toContain('"size"');
    // settled outcome is derived from the quorum-agreed resolution, not the raw event
    const finalOutcome = t?.effect.merge[1].finalOutcome;
    expect(finalOutcome).toEqual({ var: 'state.resolutions.0.outcome' });
    expect(JSON.stringify(t?.effect)).not.toContain('event.outcome');
    // the forgeable settlement-target event field is removed from the schema
    const finalizeSchema = marketPredictionDef.eventSchemas.finalize as {
      properties?: Record<string, unknown>;
    };
    expect(finalizeSchema.properties).toBeUndefined();
  });

  it('should gate the dispute ruling on the state-pinned arbiter, not event.judicialRuling', () => {
    const dispute = marketPredictionDef.transitions.find(t => t.eventName === 'dispute');
    const ruling = marketPredictionDef.transitions.find(t => t.eventName === 'ruling');
    expect(dispute).toBeDefined();
    expect(ruling).toBeDefined();
    // S2 fix: signer must be the pinned arbiter AND finalOutcome must be a valid outcome.
    expect(ruling?.guard).toHaveProperty('and');
    expect(ruling?.guard.and[0]).toEqual({
      in: [{ var: 'state.arbiter' }, { map: [{ var: 'proofs' }, { var: 'address' }] }],
    });
    expect(ruling?.guard.and[1]).toEqual({
      in: [{ var: 'event.finalOutcome' }, { var: 'state.outcomes' }],
    });
    // the forgeable judicialRuling field is removed from the guard and the schema
    expect(JSON.stringify(ruling?.guard)).not.toContain('judicialRuling');
    expect(marketPredictionDef.eventSchemas.ruling.properties).not.toHaveProperty('judicialRuling');
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
