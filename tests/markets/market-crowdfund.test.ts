/**
 * Tests for MarketCrowdfund state machine
 */

import { marketCrowdfundDef } from '../../src/apps/markets/state-machines/market-crowdfund';

describe('MarketCrowdfund State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(marketCrowdfundDef).toBeDefined();
    expect(marketCrowdfundDef.metadata.name).toBe('MarketCrowdfund');
    expect(marketCrowdfundDef.metadata.app).toBe('markets');
    expect(marketCrowdfundDef.metadata.type).toBe('crowdfund');
    expect(marketCrowdfundDef.metadata.version).toBe('1.0.0');
  });

  it('should have crowdfund-specific states', () => {
    expect(marketCrowdfundDef.states.PROPOSED.isFinal).toBe(false);
    expect(marketCrowdfundDef.states.OPEN.isFinal).toBe(false);
    expect(marketCrowdfundDef.states.FUNDED.isFinal).toBe(true);
    expect(marketCrowdfundDef.states.REFUNDED.isFinal).toBe(true);
    expect(marketCrowdfundDef.states.CANCELLED.isFinal).toBe(true);
  });

  it('should require creator, threshold, deadline', () => {
    expect(marketCrowdfundDef.createSchema.required).toContain('creator');
    expect(marketCrowdfundDef.createSchema.required).toContain('threshold');
    expect(marketCrowdfundDef.createSchema.required).toContain('deadline');
  });

  it('should start in PROPOSED', () => {
    expect(marketCrowdfundDef.initialState).toBe('PROPOSED');
  });

  it('should guard creator from pledging their own campaign', () => {
    const pledge = marketCrowdfundDef.transitions.find(t => t.eventName === 'pledge');
    expect(pledge).toBeDefined();
    const guardStr = JSON.stringify(pledge?.guard);
    expect(guardStr).toContain('!==');
    expect(guardStr).toContain('state.creator');
  });

  it('should increment totalPledged and backerCount on pledge', () => {
    const pledge = marketCrowdfundDef.transitions.find(t => t.eventName === 'pledge');
    const effectStr = JSON.stringify(pledge?.effect);
    expect(effectStr).toContain('totalPledged');
    expect(effectStr).toContain('backerCount');
  });

  it('should support increase_pledge event', () => {
    const increase = marketCrowdfundDef.transitions.find(t => t.eventName === 'increase_pledge');
    expect(increase).toBeDefined();
    expect(increase?.from).toBe('OPEN');
    expect(increase?.to).toBe('OPEN');
  });

  it('should finalize to FUNDED when threshold met', () => {
    const funded = marketCrowdfundDef.transitions.find(
      t => t.eventName === 'finalize' && t.to === 'FUNDED'
    );
    expect(funded).toBeDefined();
    const guardStr = JSON.stringify(funded?.guard);
    expect(guardStr).toContain('threshold');
  });

  it('should finalize to REFUNDED when threshold not met', () => {
    const refunded = marketCrowdfundDef.transitions.find(
      t => t.eventName === 'finalize' && t.to === 'REFUNDED'
    );
    expect(refunded).toBeDefined();
    const effectStr = JSON.stringify(refunded?.effect);
    expect(effectStr).toContain('threshold_not_met');
  });

  it('should support stretch goals in FUNDED effect', () => {
    const funded = marketCrowdfundDef.transitions.find(
      t => t.eventName === 'finalize' && t.to === 'FUNDED'
    );
    const effectStr = JSON.stringify(funded?.effect);
    expect(effectStr).toContain('stretchGoalsReached');
  });

  it('should support claim_refund after REFUNDED', () => {
    const claimRefund = marketCrowdfundDef.transitions.find(t => t.eventName === 'claim_refund');
    expect(claimRefund).toBeDefined();
    expect(claimRefund?.from).toBe('REFUNDED');
    expect(claimRefund?.to).toBe('REFUNDED');
    const guardStr = JSON.stringify(claimRefund?.guard);
    expect(guardStr).toContain('refundsClaimed');
  });
});
