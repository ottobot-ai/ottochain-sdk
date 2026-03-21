/**
 * Tests for MarketAuction state machine
 */

import { marketAuctionDef } from '../../src/apps/markets/state-machines/market-auction';

describe('MarketAuction State Machine', () => {
  it('should be defined using defineFiberApp', () => {
    expect(marketAuctionDef).toBeDefined();
    expect(marketAuctionDef.metadata.name).toBe('MarketAuction');
    expect(marketAuctionDef.metadata.app).toBe('markets');
    expect(marketAuctionDef.metadata.type).toBe('auction');
    expect(marketAuctionDef.metadata.version).toBe('1.0.0');
  });

  it('should have auction-specific states', () => {
    expect(marketAuctionDef.states.PROPOSED.isFinal).toBe(false);
    expect(marketAuctionDef.states.OPEN.isFinal).toBe(false);
    expect(marketAuctionDef.states.CLOSING.isFinal).toBe(false);
    expect(marketAuctionDef.states.SETTLED.isFinal).toBe(true);
    expect(marketAuctionDef.states.NO_SALE.isFinal).toBe(true);
    expect(marketAuctionDef.states.CANCELLED.isFinal).toBe(true);
  });

  it('should start in PROPOSED', () => {
    expect(marketAuctionDef.initialState).toBe('PROPOSED');
  });

  it('should require seller and minBid', () => {
    expect(marketAuctionDef.createSchema.required).toContain('seller');
    expect(marketAuctionDef.createSchema.required).toContain('minBid');
  });

  it('should guard bid against seller bidding on own auction', () => {
    const bid = marketAuctionDef.transitions.find(t => t.eventName === 'bid');
    expect(bid).toBeDefined();
    const guardStr = JSON.stringify(bid?.guard);
    expect(guardStr).toContain('!==');
  });

  it('should require bid amount >= minBid with increment', () => {
    const bid = marketAuctionDef.transitions.find(t => t.eventName === 'bid');
    const guard = bid?.guard as Record<string, unknown>;
    const andClauses = guard['and'] as unknown[];
    expect(andClauses.length).toBeGreaterThan(2);
  });

  it('should settle only when reserve price is met', () => {
    const settle = marketAuctionDef.transitions.find(t => t.eventName === 'settle');
    expect(settle).toBeDefined();
    expect(settle?.to).toBe('SETTLED');
    const guardStr = JSON.stringify(settle?.guard);
    expect(guardStr).toContain('reservePrice');
  });

  it('should support no_sale transition when reserve not met', () => {
    const noSale = marketAuctionDef.transitions.find(t => t.eventName === 'no_sale');
    expect(noSale).toBeDefined();
    expect(noSale?.to).toBe('NO_SALE');
    const effectStr = JSON.stringify(noSale?.effect);
    expect(effectStr).toContain('reserve_not_met');
  });
});
