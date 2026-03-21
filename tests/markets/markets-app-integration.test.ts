/**
 * Integration tests for the markets app
 */

import {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef,
} from '../../src/apps/markets/state-machines';

import {
  MARKETS_DEFINITIONS,
  getMarketDefinition,
} from '../../src/apps/markets';

describe('Markets App Integration', () => {
  it('should export all 5 market state machines from state-machines index', () => {
    expect(marketUniversalDef).toBeDefined();
    expect(marketPredictionDef).toBeDefined();
    expect(marketAuctionDef).toBeDefined();
    expect(marketCrowdfundDef).toBeDefined();
    expect(marketGroupBuyDef).toBeDefined();
  });

  it('should export all market types from MARKETS_DEFINITIONS', () => {
    expect(MARKETS_DEFINITIONS.universal).toBeDefined();
    expect(MARKETS_DEFINITIONS.prediction).toBeDefined();
    expect(MARKETS_DEFINITIONS.auction).toBeDefined();
    expect(MARKETS_DEFINITIONS.crowdfund).toBeDefined();
    expect(MARKETS_DEFINITIONS.groupBuy).toBeDefined();
  });

  it('should get market definition by type', () => {
    expect(getMarketDefinition('universal')).toBe(marketUniversalDef);
    expect(getMarketDefinition('prediction')).toBe(marketPredictionDef);
    expect(getMarketDefinition('auction')).toBe(marketAuctionDef);
    expect(getMarketDefinition('crowdfund')).toBe(marketCrowdfundDef);
    expect(getMarketDefinition('groupBuy')).toBe(marketGroupBuyDef);
  });

  it('should default to universal type', () => {
    expect(getMarketDefinition()).toBe(marketUniversalDef);
  });

  it('all market definitions should have required base fields', () => {
    const defs = [
      marketUniversalDef,
      marketPredictionDef,
      marketAuctionDef,
      marketCrowdfundDef,
      marketGroupBuyDef,
    ];
    for (const def of defs) {
      expect(def.metadata).toBeDefined();
      expect(def.metadata.name).toBeTruthy();
      expect(def.states).toBeDefined();
      expect(def.initialState).toBeTruthy();
      expect(Array.isArray(def.transitions)).toBe(true);
    }
  });

  it('all market definitions should have at least one final state', () => {
    const defs = [
      marketUniversalDef,
      marketPredictionDef,
      marketAuctionDef,
      marketCrowdfundDef,
      marketGroupBuyDef,
    ];
    for (const def of defs) {
      const finalStates = Object.values(def.states).filter((s: { isFinal: boolean }) => s.isFinal);
      expect(finalStates.length).toBeGreaterThan(0);
    }
  });

  it('all transitions should have non-empty event names', () => {
    const defs = [
      marketUniversalDef,
      marketPredictionDef,
      marketAuctionDef,
      marketCrowdfundDef,
      marketGroupBuyDef,
    ];
    for (const def of defs) {
      for (const t of def.transitions) {
        expect(t.eventName).toBeTruthy();
        expect(t.from).toBeTruthy();
        expect(t.to).toBeTruthy();
        expect(t.guard).toBeDefined();
        expect(t.effect).toBeDefined();
      }
    }
  });
});
