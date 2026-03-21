import { marketCrowdfundDef } from '../../src/apps/markets/state-machines/market-crowdfund.js';

describe('Market Crowdfund State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(marketCrowdfundDef).toBeDefined();
      expect(typeof marketCrowdfundDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(marketCrowdfundDef.metadata.name).toBe('MarketCrowdfund');
      expect(marketCrowdfundDef.metadata.app).toBe('markets');
      expect(marketCrowdfundDef.metadata.description).toContain('crowdfunding');
      expect(marketCrowdfundDef.metadata.version).toBe('1.0.0');
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'ACTIVE', 'FUNDED', 'EXPIRED', 'CANCELLED', 'DELIVERED'];
      const actualStates = Object.keys(marketCrowdfundDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(marketCrowdfundDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(marketCrowdfundDef.states.DELIVERED.isFinal).toBe(true);
      expect(marketCrowdfundDef.states.EXPIRED.isFinal).toBe(true);
      expect(marketCrowdfundDef.states.CANCELLED.isFinal).toBe(true);
      expect(marketCrowdfundDef.states.PROPOSED.isFinal).toBe(false);
      expect(marketCrowdfundDef.states.ACTIVE.isFinal).toBe(false);
      expect(marketCrowdfundDef.states.FUNDED.isFinal).toBe(false);
    });
  });

  describe('Campaign Launch', () => {
    it('should allow launching campaign from PROPOSED', () => {
      const launchTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'launch'
      );
      
      expect(launchTransition).toBeDefined();
      expect(launchTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });

    it('should initialize campaign state on launch', () => {
      const launchTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'ACTIVE' && t.eventName === 'launch'
      );
      
      expect(launchTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            launchedAt: { var: '$timestamp' },
            totalRaised: 0,
            backerCount: 0,
            contributions: []
          }
        ]
      });
    });

    it('should allow creator to cancel before launch', () => {
      const cancelTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });
  });

  describe('Contribution Mechanism', () => {
    it('should allow contributions when campaign is active', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition).toBeDefined();
      expect(contributeTransition!.guard).toBeDefined();
    });

    it('should validate contribution amount', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { '>': [{ var: 'event.amount' }, 0] },
            { '>=': [{ var: 'event.amount' }, { var: 'state.minContribution' }] }
          ])
        })
      );
    });

    it('should not exceed funding goal', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.guard.and).toContain({
        '<=': [
          { '+': [{ var: 'state.totalRaised' }, { var: 'event.amount' }] },
          { var: 'state.fundingGoal' }
        ]
      });
    });

    it('should not allow contributions after deadline', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.guard.and).toContain({
        '<': [{ var: '$timestamp' }, { var: 'state.deadline' }]
      });
    });

    it('should update campaign totals on contribution', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            totalRaised: {
              '+': [{ var: 'state.totalRaised' }, { var: 'event.amount' }]
            },
            backerCount: {
              '+': [{ var: 'state.backerCount' }, 1]
            },
            contributions: {
              cat: [
                { var: 'state.contributions' },
                [
                  {
                    backer: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
                    timestamp: { var: '$timestamp' },
                    rewardTier: { var: 'event.rewardTier' }
                  }
                ]
              ]
            }
          }
        ]
      });
    });
  });

  describe('Goal Achievement', () => {
    it('should automatically transition to FUNDED when goal reached', () => {
      const fundedTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'FUNDED' && t.eventName === 'achieve_goal'
      );
      
      expect(fundedTransition).toBeDefined();
      expect(fundedTransition!.guard).toEqual({
        '>=': [{ var: 'state.totalRaised' }, { var: 'state.fundingGoal' }]
      });
    });

    it('should record funding achievement', () => {
      const fundedTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'FUNDED' && t.eventName === 'achieve_goal'
      );
      
      expect(fundedTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'FUNDED',
            fundedAt: { var: '$timestamp' },
            finalAmount: { var: 'state.totalRaised' }
          }
        ]
      });
    });

    it('should allow late contributions in FUNDED state if stretch goals exist', () => {
      const stretchContributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'FUNDED' && t.to === 'FUNDED' && t.eventName === 'contribute'
      );
      
      expect(stretchContributeTransition).toBeDefined();
      expect(stretchContributeTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            { var: 'state.stretchGoalsEnabled' },
            { '<': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
            { '>': [{ var: 'event.amount' }, 0] }
          ])
        })
      );
    });
  });

  describe('Deadline Handling', () => {
    it('should expire campaign when deadline reached without funding', () => {
      const expireTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'EXPIRED' && t.eventName === 'expire'
      );
      
      expect(expireTransition).toBeDefined();
      expect(expireTransition!.guard).toEqual({
        and: [
          { '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }] },
          { '<': [{ var: 'state.totalRaised' }, { var: 'state.fundingGoal' }] }
        ]
      });
    });

    it('should close funded campaign at deadline', () => {
      const closeFundedTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'FUNDED' && t.to === 'FUNDED' && t.eventName === 'close'
      );
      
      expect(closeFundedTransition).toBeDefined();
      expect(closeFundedTransition!.guard).toEqual({
        '>=': [{ var: '$timestamp' }, { var: 'state.deadline' }]
      });
    });

    it('should record final campaign statistics on expiration', () => {
      const expireTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to => 'EXPIRED' && t.eventName === 'expire'
      );
      
      expect(expireTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'EXPIRED',
            expiredAt: { var: '$timestamp' },
            finalAmount: { var: 'state.totalRaised' },
            refundsAvailable: true
          }
        ]
      });
    });
  });

  describe('Reward Fulfillment', () => {
    it('should allow creator to mark delivery milestones', () => {
      const deliverTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'FUNDED' && t.to === 'DELIVERED' && t.eventName === 'deliver'
      );
      
      expect(deliverTransition).toBeDefined();
      expect(deliverTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });

    it('should track delivery details', () => {
      const deliverTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'FUNDED' && t.to === 'DELIVERED' && t.eventName === 'deliver'
      );
      
      expect(deliverTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            status: 'DELIVERED',
            deliveredAt: { var: '$timestamp' },
            deliveryProof: { var: 'event.proof' },
            deliveryNotes: { var: 'event.notes' }
          }
        ]
      });
    });
  });

  describe('Refund Mechanism', () => {
    it('should allow refunds when campaign expires unfunded', () => {
      const refundTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'EXPIRED' && t.to === 'EXPIRED' && t.eventName === 'refund'
      );
      
      expect(refundTransition).toBeDefined();
      expect(refundTransition!.guard).toBeDefined();
    });

    it('should validate refund eligibility', () => {
      const refundTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'EXPIRED' && t.to === 'EXPIRED' && t.eventName === 'refund'
      );
      
      expect(refundTransition!.guard).toEqual(
        expect.objectContaining({
          and: expect.arrayContaining([
            {
              '>': [
                {
                  size: {
                    filter: [
                      { var: 'state.contributions' },
                      { '===': [{ var: 'backer' }, { var: 'event.agent' }] }
                    ]
                  }
                },
                0
              ]
            },
            {
              '!': [
                {
                  in: [
                    { var: 'event.agent' },
                    { map: [{ var: 'state.refunds' }, { var: 'backer' }] }
                  ]
                }
              ]
            }
          ])
        })
      );
    });

    it('should track refunds to prevent double refunds', () => {
      const refundTransition = marketCrowdfundDef.transitions.find(
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
                    backer: { var: 'event.agent' },
                    amount: { var: 'event.amount' },
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

  describe('Update Mechanism', () => {
    it('should allow creator to post updates during active campaign', () => {
      const updateTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update'
      );
      
      expect(updateTransition).toBeDefined();
      expect(updateTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });

    it('should allow updates in funded state for delivery progress', () => {
      const fundedUpdateTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'FUNDED' && t.to === 'FUNDED' && t.eventName === 'update'
      );
      
      expect(fundedUpdateTransition).toBeDefined();
      expect(fundedUpdateTransition!.guard).toEqual({
        '===': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });

    it('should append updates to campaign timeline', () => {
      const updateTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update'
      );
      
      expect(updateTransition!.effect).toEqual({
        merge: [
          { var: 'state' },
          {
            updates: {
              cat: [
                { var: 'state.updates' },
                [
                  {
                    title: { var: 'event.title' },
                    content: { var: 'event.content' },
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

  describe('Edge Cases', () => {
    it('should not allow creator to contribute to own campaign', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.guard.and).toContain({
        '!==': [{ var: 'event.agent' }, { var: 'state.creator' }]
      });
    });

    it('should handle zero-amount contributions correctly', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      expect(contributeTransition!.guard.and).toContain({
        '>': [{ var: 'event.amount' }, 0]
      });
    });

    it('should prevent contributions after campaign cancellation', () => {
      const cancelFromActiveTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelFromActiveTransition).toBeDefined();
      
      // No transitions should exist from CANCELLED state except refunds
      const fromCancelledTransitions = marketCrowdfundDef.transitions.filter(
        t => t.from === 'CANCELLED' && t.eventName !== 'refund'
      );
      
      expect(fromCancelledTransitions).toHaveLength(0);
    });

    it('should handle exact funding goal achievement', () => {
      const contributeTransition = marketCrowdfundDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'contribute'
      );
      
      // Should allow contribution that exactly meets the goal
      expect(contributeTransition!.guard.and).toContain({
        '<=': [
          { '+': [{ var: 'state.totalRaised' }, { var: 'event.amount' }] },
          { var: 'state.fundingGoal' }
        ]
      });
    });
  });
});