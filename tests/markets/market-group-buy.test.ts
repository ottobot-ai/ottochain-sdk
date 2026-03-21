import { marketGroupBuyDef } from '../../src/apps/markets/state-machines/market-group-buy.js';

describe('Market Group Buy State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(marketGroupBuyDef).toBeDefined();
      expect(typeof marketGroupBuyDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(marketGroupBuyDef.metadata.name).toBe('MarketGroupBuy');
      expect(marketGroupBuyDef.metadata.app).toBe('markets');
      expect(marketGroupBuyDef.metadata.description).toContain('group buying');
      expect(marketGroupBuyDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'ACTIVE', 'THRESHOLD_MET', 'FULFILLED', 'EXPIRED', 'CANCELLED'];
      const actualStates = Object.keys(marketGroupBuyDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(marketGroupBuyDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(marketGroupBuyDef.states.FULFILLED.isFinal).toBe(true);
      expect(marketGroupBuyDef.states.EXPIRED.isFinal).toBe(true);
      expect(marketGroupBuyDef.states.CANCELLED.isFinal).toBe(true);
      expect(marketGroupBuyDef.states.PROPOSED.isFinal).toBe(false);
      expect(marketGroupBuyDef.states.ACTIVE.isFinal).toBe(false);
      expect(marketGroupBuyDef.states.THRESHOLD_MET.isFinal).toBe(false);
    });
  });

  describe('Group Buy Launch', () => {
    it('should allow organizer to launch group buy from PROPOSED', () => {
      const launchTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'launch'
      );
      
      expect(launchTransition).toBeDefined();
      expect(launchTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.organizer' }]
      });
    });

    it('should initialize group buy state on launch', () => {
      const launchTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'launch'
      );
      
      expect(launchTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            launchedAt: { var: '$timestamp' },
            participantCount: 0,
            totalCommitted: 0,
            participants: []
          }
        ]
      });
    });

    it('should allow cancellation before launch', () => {
      const cancelTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.organizer' }]
      });
    });
  });

  describe('Participation Mechanism', () => {
    it('should allow joining active group buy', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition).toBeDefined();
      expect(joinTransition!.guard).toBeDefined();
    });

    it('should validate participation requirements', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '>': [{ var: 'event.quantity' }, 0] },
            { '>=': [{ var: 'event.quantity' }, { var: 'state.minQuantityPerPerson' }] },
            { '<=': [{ var: 'event.quantity' }, { var: 'state.maxQuantityPerPerson' }] }
          ])
        })
      );
    });

    it('should not exceed maximum participants', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '<': [{ var: 'state.participantCount' }, { var: 'state.maxParticipants' }]
      });
    });

    it('should not exceed total quantity limit', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '<=': [
          { '+': [{ var: 'state.totalCommitted' }, { var: 'event.quantity' }] },
          { var: 'state.maxQuantity' }
        ]
      });
    });

    it('should not allow joining after deadline', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '<': [{ var: '$timestamp' }, { var: 'state.deadline' }]
      });
    });

    it('should prevent duplicate participation', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '!': [
          {
            in: [
              { var: 'event.agent' },
              { map: [{ var: 'state.participants' }, { var: 'agent' }] }
            ]
          }
        ]
      });
    });

    it('should update group buy totals on joining', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            participantCount: {
              '+': [{ var: 'state.participantCount' }, 1]
            },
            totalCommitted: {
              '+': [{ var: 'state.totalCommitted' }, { var: 'event.quantity' }]
            },
            participants: {
              cat: [
                { var: 'state.participants' },
                [
                  {
                    agent: { var: 'event.agent' },
                    quantity: { var: 'event.quantity' },
                    joinedAt: { var: '$timestamp' },
                    unitPrice: { var: 'state.currentTierPrice' }
                  }
                ]
              ]
            }
          }
        ]
      });
    });
  });

  describe('Threshold Management', () => {
    it('should transition to THRESHOLD_MET when minimum quantity reached', () => {
      const thresholdTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'THRESHOLD_MET' && t.eventName === 'reach_threshold'
      );
      
      expect(thresholdTransition).toBeDefined();
      expect(thresholdTransition!.guard).toEqual({
        '>=': [{ var: 'state.totalCommitted' }, { var: 'state.minQuantity' }]
      });
    });

    it('should record threshold achievement', () => {
      const thresholdTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'THRESHOLD_MET' && t.eventName === 'reach_threshold'
      );
      
      expect(thresholdTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'THRESHOLD_MET',
            thresholdMetAt: { var: '$timestamp' },
            finalPrice: { var: 'state.currentTierPrice' }
          }
        ]
      });
    });

    it('should allow additional participants after threshold met', () => {
      const lateJoinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'THRESHOLD_MET' && t.to === 'THRESHOLD_MET' && t.eventName === 'join'
      );
      
      expect(lateJoinTransition).toBeDefined();
      expect(lateJoinTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '<': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
            { '<': [{ var: 'state.participantCount' }, { var: 'state.maxParticipants' }] },
            { '<=': [
              { '+': [{ var: 'state.totalCommitted' }, { var: 'event.quantity' }] },
              { var: 'state.maxQuantity' }
            ]}
          ])
        })
      );
    });
  });

  describe('Tiered Pricing', () => {
    it('should update price tiers based on quantity thresholds', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      // Should calculate current tier price based on total quantity
      expect(joinTransition!.effect.merge[1]).toEqual(
        expect.objectContaining({
          participants: expect.objectContaining({
            cat: expect.arrayContaining([
              { var: 'state.participants' },
              expect.arrayContaining([
                expect.objectContaining({
                  unitPrice: { var: 'state.currentTierPrice' }
                })
              ])
            ])
          })
        })
      );
    });

    it('should provide price protection for early participants', () => {
      const lateJoinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'THRESHOLD_MET' && t.to === 'THRESHOLD_MET' && t.eventName === 'join'
      );
      
      // Late joiners should get the same final price as earlier participants
      expect(lateJoinTransition!.effect.merge[1].participants.cat[1][0]).toEqual(
        expect.objectContaining({
          unitPrice: { var: 'state.finalPrice' }
        })
      );
    });
  });

  describe('Order Fulfillment', () => {
    it('should allow organizer to fulfill orders from THRESHOLD_MET', () => {
      const fulfillTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'THRESHOLD_MET' && t.to === 'FULFILLED' && t.eventName === 'fulfill'
      );
      
      expect(fulfillTransition).toBeDefined();
      expect(fulfillTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.organizer' }]
      });
    });

    it('should record fulfillment details', () => {
      const fulfillTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'THRESHOLD_MET' && t.to === 'FULFILLED' && t.eventName === 'fulfill'
      );
      
      expect(fulfillTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'FULFILLED',
            fulfilledAt: { var: '$timestamp' },
            supplierOrderId: { var: 'event.supplierOrderId' },
            trackingInfo: { var: 'event.trackingInfo' },
            estimatedDelivery: { var: 'event.estimatedDelivery' }
          }
        ]
      });
    });
  });

  describe('Expiration Handling', () => {
    it('should expire group buy when deadline reached without threshold', () => {
      const expireTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'EXPIRED' && t.eventName === 'expire'
      );
      
      expect(expireTransition).toBeDefined();
      expect(expireTransition!.guard).toEqual({
        and: [
          { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
          { '<': [{ var: 'state.totalCommitted' }, { var: 'state.minQuantity' }] }
        ]
      });
    });

    it('should close successful group buy at deadline', () => {
      const closeTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'THRESHOLD_MET' && t.to => 'THRESHOLD_MET' && t.eventName === 'close'
      );
      
      expect(closeTransition).toBeDefined();
      expect(closeTransition!.guard).toEqual({
        '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }]
      });
    });

    it('should enable refunds on expiration', () => {
      const expireTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'EXPIRED' && t.eventName === 'expire'
      );
      
      expect(expireTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'EXPIRED',
            expiredAt: { var: '$timestamp' },
            refundsAvailable: true
          }
        ]
      });
    });
  });

  describe('Withdrawal Mechanism', () => {
    it('should allow participants to withdraw before threshold met', () => {
      const withdrawTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'withdraw'
      );
      
      expect(withdrawTransition).toBeDefined();
      expect(withdrawTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            {
              in: [
                { var: 'event.agent' },
                { map: [{ var: 'state.participants' }, { var: 'agent' }] }
              ]
            },
            { '<': [{ var: 'state.totalCommitted' }, { var: 'state.minQuantity' }] }
          ])
        })
      );
    });

    it('should prevent withdrawal after threshold met', () => {
      const withdrawFromThresholdTransitions = marketGroupBuyDef.transitions.filter(
        t => t.from === 'THRESHOLD_MET' && t.eventName === 'withdraw'
      );
      
      expect(withdrawFromThresholdTransitions).toHaveLength(0);
    });

    it('should update totals on withdrawal', () => {
      const withdrawTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'withdraw'
      );
      
      expect(withdrawTransition!.effect).toEqual(
        expect.objectContaining({
          merge: expect.arrayContaining([
            { var: 'state' },
            expect.objectContaining({
              participantCount: {
                '-': [{ var: 'state.participantCount' }, 1]
              },
              totalCommitted: {
                '-': [
                  { var: 'state.totalCommitted' },
                  { var: 'event.withdrawnQuantity' }
                ]
              },
              participants: {
                filter: [
                  { var: 'state.participants' },
                  { '!==': [{ var: 'agent' }, { var: 'event.agent' }] }
                ]
              }
            })
          ])
        })
      );
    });
  });

  describe('Refund Mechanism', () => {
    it('should allow refunds for expired group buys', () => {
      const refundTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'EXPIRED' && t.to === 'EXPIRED' && t.eventName === 'refund'
      );
      
      expect(refundTransition).toBeDefined();
    });

    it('should validate refund eligibility', () => {
      const refundTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'EXPIRED' && t.to === 'EXPIRED' && t.eventName === 'refund'
      );
      
      expect(refundTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            {
              in: [
                { var: 'event.agent' },
                { map: [{ var: 'state.participants' }, { var: 'agent' }] }
              ]
            },
            {
              '!': [
                {
                  in: [
                    { var: 'event.agent' },
                    { map: [{ var: 'state.refunds' }, { var: 'agent' }] }
                  ]
                }
              ]
            }
          ])
        })
      );
    });

    it('should track refunds to prevent duplicates', () => {
      const refundTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'EXPIRED' && t.to === 'EXPIRED' && t.eventName === 'refund'
      );
      
      expect(refundTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            refunds: {
              cat: [
                { var: 'state.refunds' },
                [
                  {
                    agent: { var: 'event.agent' },
                    amount: { var: 'event.refundAmount' },
                    refundedAt: { var: '$timestamp' }
                  }
                ]
              ]
            }
          }
        ]
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not allow organizer to participate in own group buy', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '!==': [{ var: 'event.agent' }, { var: 'state.organizer' }]
      });
    });

    it('should handle zero quantity join attempts', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '>': [{ var: 'event.quantity' }, 0]
      });
    });

    it('should prevent joining when max quantity would be exceeded', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName => 'join'
      );
      
      expect(joinTransition!.guard.and).toContain({
        '<=': [
          { '+': [{ var: 'state.totalCommitted' }, { var: 'event.quantity' }] },
          { var: 'state.maxQuantity' }
        ]
      });
    });

    it('should handle exact threshold achievement', () => {
      const thresholdTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'THRESHOLD_MET' && t.eventName === 'reach_threshold'
      );
      
      expect(thresholdTransition!.guard).toEqual({
        '>=': [{ var: 'state.totalCommitted' }, { var: 'state.minQuantity' }]
      });
    });

    it('should maintain participant order for fairness', () => {
      const joinTransition = marketGroupBuyDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'join'
      );
      
      // Participants should be appended to maintain join order
      expect(joinTransition!.effect.merge[1].participants).toEqual({
        cat: [
          { var: 'state.participants' },
          expect.any(Array)
        ]
      });
    });
  });
});