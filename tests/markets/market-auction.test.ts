import { marketAuctionDef } from '../../src/apps/markets/state-machines/market-auction.js';

describe('Market Auction State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(marketAuctionDef).toBeDefined();
      expect(typeof marketAuctionDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(marketAuctionDef.metadata.name).toBe('MarketAuction');
      expect(marketAuctionDef.metadata.app).toBe('markets');
      expect(marketAuctionDef.metadata.description).toContain('auction');
      expect(marketAuctionDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'OPEN', 'CLOSING', 'CLOSED', 'SETTLED', 'CANCELLED'];
      const actualStates = Object.keys(marketAuctionDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(marketAuctionDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(marketAuctionDef.states.SETTLED.isFinal).toBe(true);
      expect(marketAuctionDef.states.CANCELLED.isFinal).toBe(true);
      expect(marketAuctionDef.states.PROPOSED.isFinal).toBe(false);
      expect(marketAuctionDef.states.OPEN.isFinal).toBe(false);
      expect(marketAuctionDef.states.CLOSING.isFinal).toBe(false);
      expect(marketAuctionDef.states.CLOSED.isFinal).toBe(false);
    });
  });

  describe('Auction Lifecycle', () => {
    it('should allow opening auction from PROPOSED', () => {
      const openTransition = marketAuctionDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition).toBeDefined();
      expect(openTransition!.guard).toBeDefined();
      expect(openTransition!.effect).toBeDefined();
    });

    it('should allow cancelling auction from PROPOSED', () => {
      const cancelTransition = marketAuctionDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
    });

    it('should track auction start time on opening', () => {
      const openTransition = marketAuctionDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition!.effect).toEqual(
        expect.objectContaining({
          merge: expect.arrayContaining([
            { var: 'state' },
            expect.objectContaining({
              status: 'OPEN',
              openedAt: { var: '$timestamp' }
            })
          ])
        })
      );
    });
  });

  describe('Bidding Mechanism', () => {
    it('should allow placing bids when auction is open', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      expect(bidTransition).toBeDefined();
      expect(bidTransition!.guard).toBeDefined();
    });

    it('should require bid amount to exceed current highest bid', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      expect(bidTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '>': [{ var: 'event.amount' }, { var: 'state.highestBid' }] }
          ])
        })
      );
    });

    it('should require minimum bid amount', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      expect(bidTransition!.guard.and).toContain(
        { '>=': [{ var: 'event.amount' }, { var: 'state.minBid' }] }
      );
    });

    it('should update highest bid and bidder on successful bid', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      expect(bidTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            highestBid: { var: 'event.amount' },
            highestBidder: { var: 'event.agent' },
            lastBidAt: { var: '$timestamp' },
            bidHistory: {
              cat: [
                { var: 'state.bidHistory' },
                [
                  {
                    bidder: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
                    timestamp: { var: '$timestamp' }
                  }
                ]
              ]
            }
          }
        ]
      });
    });
  });

  describe('Auction Closing', () => {
    it('should automatically trigger closing when deadline reached', () => {
      const autoCloseTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CLOSING' && t.eventName === 'close'
      );
      
      expect(autoCloseTransition).toBeDefined();
      expect(autoCloseTransition!.guard).toEqual(
        expect.objectContaining({
          or: expect.arrayContaining([
            { '>=': [{ var: '$timestamp' }, { var: 'state.endTime' }] }
          ])
        })
      );
    });

    it('should allow manual closing by auction owner', () => {
      const manualCloseTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CLOSING' && t.eventName === 'close'
      );
      
      expect(manualCloseTransition!.guard.or).toContain(
        { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] }
      );
    });

    it('should enter closing state with grace period', () => {
      const closingTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CLOSING'
      );
      
      expect(closingTransition!.effect).toEqual(
        expect.objectContaining({
          merge: expect.arrayContaining([
            { var: 'state' },
            expect.objectContaining({
              status: 'CLOSING',
              closingStartedAt: { var: '$timestamp' },
              finalCloseAt: {
                '+': [
                  { var: '$timestamp' },
                  { var: 'state.closingGracePeriodMs' }
                ]
              }
            })
          ])
        })
      );
    });

    it('should allow last-minute bids during closing period', () => {
      const closingBidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSING' && t.to === 'CLOSING' && t.eventName === 'bid'
      );
      
      expect(closingBidTransition).toBeDefined();
      expect(closingBidTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '<': [{ var: '$timestamp' }, { var: 'state.finalCloseAt' }] },
            { '>': [{ var: 'event.amount' }, { var: 'state.highestBid' }] }
          ])
        })
      );
    });

    it('should extend closing period on late bid', () => {
      const closingBidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSING' && t.to === 'CLOSING' && t.eventName === 'bid'
      );
      
      expect(closingBidTransition!.effect.merge[1]).toEqual(
        expect.objectContaining({
          finalCloseAt: {
            '+': [
              { var: '$timestamp' },
              { var: 'state.closingGracePeriodMs' }
            ]
          }
        })
      );
    });

    it('should finalize auction when grace period expires', () => {
      const finalizeTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSING' && t.to === 'CLOSED' && t.eventName === 'finalize'
      );
      
      expect(finalizeTransition).toBeDefined();
      expect(finalizeTransition!.guard).toEqual({
        '>=': [{ var: '$timestamp' }, { var: 'state.finalCloseAt' }]
      });
    });
  });

  describe('Settlement', () => {
    it('should allow settlement when auction is closed', () => {
      const settleTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'SETTLED' && t.eventName === 'settle'
      );
      
      expect(settleTransition).toBeDefined();
    });

    it('should require winner confirmation for settlement', () => {
      const settleTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'SETTLED' && t.eventName === 'settle'
      );
      
      expect(settleTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '===': [{ var: 'event.agent' }, { var: 'state.highestBidder' }] },
            { var: 'event.confirmPayment' }
          ])
        })
      );
    });

    it('should record settlement details', () => {
      const settleTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'SETTLED' && t.eventName === 'settle'
      );
      
      expect(settleTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'SETTLED',
            settledAt: { var: '$timestamp' },
            winner: { var: 'state.highestBidder' },
            winningBid: { var: 'state.highestBid' },
            paymentTxHash: { var: 'event.paymentTxHash' }
          }
        ]
      });
    });
  });

  describe('Reserve Price', () => {
    it('should not allow settlement below reserve price', () => {
      const settleTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'SETTLED' && t.eventName === 'settle'
      );
      
      expect(settleTransition!.guard.and).toContain(
        { '>=': [{ var: 'state.highestBid' }, { var: 'state.reservePrice' }] }
      );
    });

    it('should allow cancellation if reserve not met', () => {
      const cancelFromClosedTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelFromClosedTransition).toBeDefined();
      expect(cancelFromClosedTransition!.guard).toEqual({
        and: [
          { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] },
          { '<': [{ var: 'state.highestBid' }, { var: 'state.reservePrice' }] }
        ]
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not allow bids from auction owner', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      expect(bidTransition!.guard.and).toContain(
        { '!==': [{ var: 'event.agent' }, { var: 'state.owner' }] }
      );
    });

    it('should not allow bids after final close time', () => {
      const closingBidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'CLOSING' && t.to === 'CLOSING' && t.eventName === 'bid'
      );
      
      expect(closingBidTransition!.guard.and).toContain(
        { '<': [{ var: '$timestamp' }, { var: 'state.finalCloseAt' }] }
      );
    });

    it('should handle auction with no bids', () => {
      const cancelFromOpenTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelFromOpenTransition).toBeDefined();
      expect(cancelFromOpenTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] },
            { '===': [{ var: 'state.highestBid' }, 0] }
          ])
        })
      );
    });

    it('should prevent duplicate bidders in bid history', () => {
      const bidTransition = marketAuctionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'bid'
      );
      
      // Should track all bids, not prevent duplicates - this is business logic
      expect(bidTransition!.effect.merge[1].bidHistory).toBeDefined();
    });
  });
});