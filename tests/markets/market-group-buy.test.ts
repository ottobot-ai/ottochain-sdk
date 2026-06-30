/**
 * Tests for MarketGroupBuy state machine
 */

import { marketGroupBuyDef } from '../../src/apps/markets/state-machines/market-group-buy';

describe('MarketGroupBuy State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(marketGroupBuyDef).toBeDefined();
    expect(marketGroupBuyDef.metadata.name).toBe('MarketGroupBuy');
    expect(marketGroupBuyDef.metadata.app).toBe('markets');
    expect(marketGroupBuyDef.metadata.type).toBe('groupBuy');
    expect(marketGroupBuyDef.metadata.version).toBe('1.0.0');
  });

  it('should have group buy specific states', () => {
    expect(marketGroupBuyDef.states.PROPOSED.isFinal).toBe(false);
    expect(marketGroupBuyDef.states.OPEN.isFinal).toBe(false);
    expect(marketGroupBuyDef.states.THRESHOLD_MET.isFinal).toBe(false);
    expect(marketGroupBuyDef.states.PROCESSING.isFinal).toBe(false);
    expect(marketGroupBuyDef.states.FULFILLED.isFinal).toBe(true);
    expect(marketGroupBuyDef.states.REFUNDED.isFinal).toBe(true);
    expect(marketGroupBuyDef.states.CANCELLED.isFinal).toBe(true);
  });

  it('should require organizer, minQuantity, deadline', () => {
    expect(marketGroupBuyDef.createSchema.required).toContain('organizer');
    expect(marketGroupBuyDef.createSchema.required).toContain('minQuantity');
    expect(marketGroupBuyDef.createSchema.required).toContain('deadline');
  });

  it('should start in PROPOSED', () => {
    expect(marketGroupBuyDef.initialState).toBe('PROPOSED');
  });

  it('should track orders with totalQuantity', () => {
    const order = marketGroupBuyDef.transitions.find((t) => t.eventName === 'order' && t.from === 'OPEN');
    expect(order).toBeDefined();
    const effectStr = JSON.stringify(order?.effect);
    expect(effectStr).toContain('totalQuantity');
    expect(effectStr).toContain('orders');
  });

  it('should transition to THRESHOLD_MET when minQuantity reached', () => {
    const threshold = marketGroupBuyDef.transitions.find((t) => t.eventName === 'check_threshold');
    expect(threshold).toBeDefined();
    expect(threshold?.to).toBe('THRESHOLD_MET');
    const guardStr = JSON.stringify(threshold?.guard);
    expect(guardStr).toContain('minQuantity');
  });

  it('should support ordering in THRESHOLD_MET state', () => {
    const order = marketGroupBuyDef.transitions.find((t) => t.eventName === 'order' && t.from === 'THRESHOLD_MET');
    expect(order).toBeDefined();
    expect(order?.to).toBe('THRESHOLD_MET');
  });

  it('should update price tier when ordering in THRESHOLD_MET', () => {
    const order = marketGroupBuyDef.transitions.find((t) => t.eventName === 'order' && t.from === 'THRESHOLD_MET');
    const effectStr = JSON.stringify(order?.effect);
    expect(effectStr).toContain('currentTier');
  });

  it('should finalize to PROCESSING from THRESHOLD_MET', () => {
    const finalize = marketGroupBuyDef.transitions.find(
      (t) => t.eventName === 'finalize' && t.from === 'THRESHOLD_MET',
    );
    expect(finalize).toBeDefined();
    expect(finalize?.to).toBe('PROCESSING');
    const effectStr = JSON.stringify(finalize?.effect);
    expect(effectStr).toContain('finalTier');
  });

  it('should support fulfill by vendor or organizer', () => {
    const fulfill = marketGroupBuyDef.transitions.find((t) => t.eventName === 'fulfill');
    expect(fulfill).toBeDefined();
    expect(fulfill?.to).toBe('FULFILLED');
    const guardStr = JSON.stringify(fulfill?.guard);
    expect(guardStr).toContain('vendor');
    expect(guardStr).toContain('organizer');
  });

  it('should refund when threshold not met by deadline', () => {
    const refund = marketGroupBuyDef.transitions.find(
      (t) => t.eventName === 'finalize' && t.from === 'OPEN' && t.to === 'REFUNDED',
    );
    expect(refund).toBeDefined();
    const guardStr = JSON.stringify(refund?.guard);
    expect(guardStr).toContain('minQuantity');
  });

  it('should support claim_refund with deduplication', () => {
    const claimRefund = marketGroupBuyDef.transitions.find((t) => t.eventName === 'claim_refund');
    expect(claimRefund).toBeDefined();
    const guardStr = JSON.stringify(claimRefund?.guard);
    expect(guardStr).toContain('refundsClaimed');
  });
});
