import { marketPredictionDef } from '../../src/apps/markets/state-machines/market-prediction.js';

describe('Market Prediction State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(marketPredictionDef).toBeDefined();
      expect(typeof marketPredictionDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(marketPredictionDef.metadata.name).toBe('MarketPrediction');
      expect(marketPredictionDef.metadata.app).toBe('markets');
      expect(marketPredictionDef.metadata.description).toBe(
        'Binary or multi-outcome prediction market with oracle resolution and position staking'
      );
      expect(marketPredictionDef.metadata.version).toBe('1.0.0');
    });

    it('should have cross-references defined', () => {
      expect(marketPredictionDef.metadata.crossReferences).toBeDefined();
      expect(marketPredictionDef.metadata.crossReferences.oracleId).toBeDefined();
      expect(marketPredictionDef.metadata.crossReferences.creatorIdentityId).toBeDefined();
    });

    it('should define all required states', () => {
      const expectedStates = ['PROPOSED', 'OPEN', 'CLOSED', 'RESOLVING', 'DISPUTED', 'SETTLED', 'REFUNDED', 'CANCELLED'];
      const actualStates = Object.keys(marketPredictionDef.states);
      
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(marketPredictionDef.initialState).toBe('PROPOSED');
    });

    it('should mark final states correctly', () => {
      expect(marketPredictionDef.states.SETTLED.isFinal).toBe(true);
      expect(marketPredictionDef.states.REFUNDED.isFinal).toBe(true);
      expect(marketPredictionDef.states.CANCELLED.isFinal).toBe(true);
      expect(marketPredictionDef.states.PROPOSED.isFinal).toBe(false);
      expect(marketPredictionDef.states.OPEN.isFinal).toBe(false);
      expect(marketPredictionDef.states.CLOSED.isFinal).toBe(false);
      expect(marketPredictionDef.states.RESOLVING.isFinal).toBe(false);
      expect(marketPredictionDef.states.DISPUTED.isFinal).toBe(false);
    });

    it('should have state descriptions in metadata', () => {
      expect(marketPredictionDef.states.PROPOSED.metadata.description).toBe(
        'Market created but not yet open for trading'
      );
      expect(marketPredictionDef.states.OPEN.metadata.description).toBe(
        'Accepting positions on outcomes'
      );
      expect(marketPredictionDef.states.SETTLED.metadata.description).toBe(
        'Outcome finalized, payouts available'
      );
    });
  });

  describe('Creator Authorization Transitions', () => {
    it('should allow creator to open market from PROPOSED', () => {
      const openTransition = marketPredictionDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'OPEN' && t.eventName === 'open'
      );
      
      expect(openTransition).toBeDefined();
      expect(openTransition!.guard).toEqual({
        "===": [{ "var": "event.agent" }, { "var": "state.creator" }]
      });
    });

    it('should allow creator to cancel market from PROPOSED', () => {
      const cancelTransition = marketPredictionDef.transitions.find(
        t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
      );
      
      expect(cancelTransition).toBeDefined();
      expect(cancelTransition!.guard).toEqual({
        "===": [{ "var": "event.agent" }, { "var": "state.creator" }]
      });
    });

    it('should allow creator to close market from OPEN', () => {
      const closeTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'CLOSED' && t.eventName === 'close'
      );
      
      expect(closeTransition).toBeDefined();
      expect(closeTransition!.guard).toEqual({
        "or": [
          { "===": [{ "var": "event.agent" }, { "var": "state.creator" }] },
          {
            "and": [
              { "var": "state.deadline" },
              { ">=": [{ "var": "$timestamp" }, { "var": "state.deadline" }] }
            ]
          }
        ]
      });
    });
  });

  describe('Position Taking', () => {
    it('should allow taking positions when market is open', () => {
      const positionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'take_position'
      );
      
      expect(positionTransition).toBeDefined();
      expect(positionTransition!.guard).toEqual({
        "and": [
          { ">": [{ "var": "event.amount" }, 0] },
          { "in": [{ "var": "event.outcome" }, { "var": "state.outcomes" }] },
          {
            "or": [
              { "!": [{ "var": "state.deadline" }] },
              { "<=": [{ "var": "$timestamp" }, { "var": "state.deadline" }] }
            ]
          }
        ]
      });
    });

    it('should update positions and total pool on position taking', () => {
      const positionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'take_position'
      );
      
      expect(positionTransition!.effect).toEqual({
        "merge": [
          { "var": "state" },
          {
            "positions": {
              "merge": [
                { "var": "state.positions" },
                {
                  "__computed": {
                    "cat": [
                      { "var": "event.agent" },
                      "_",
                      { "var": "event.outcome" }
                    ]
                  }
                }
              ]
            },
            "totalPool": {
              "+": [{ "var": "state.totalPool" }, { "var": "event.amount" }]
            }
          }
        ]
      });
    });
  });

  describe('Oracle Resolution', () => {
    it('should allow authorized oracles to submit resolutions', () => {
      const resolutionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'RESOLVING' && t.eventName === 'submit_resolution'
      );
      
      expect(resolutionTransition).toBeDefined();
      expect(resolutionTransition!.guard).toEqual({
        "in": [{ "var": "event.agent" }, { "var": "state.oracles" }]
      });
    });

    it('should initialize resolutions array on first submission', () => {
      const resolutionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'CLOSED' && t.to === 'RESOLVING' && t.eventName === 'submit_resolution'
      );
      
      expect(resolutionTransition!.effect).toEqual({
        "merge": [
          { "var": "state" },
          {
            "status": "RESOLVING",
            "resolutions": [
              {
                "oracle": { "var": "event.agent" },
                "outcome": { "var": "event.outcome" },
                "proof": { "var": "event.proof" },
                "submittedAt": { "var": "$timestamp" }
              }
            ]
          }
        ]
      });
    });

    it('should allow additional oracle submissions in RESOLVING state', () => {
      const additionalResolution = marketPredictionDef.transitions.find(
        t => t.from === 'RESOLVING' && t.to === 'RESOLVING' && t.eventName === 'submit_resolution'
      );
      
      expect(additionalResolution).toBeDefined();
      expect(additionalResolution!.guard).toEqual({
        "and": [
          { "in": [{ "var": "event.agent" }, { "var": "state.oracles" }] },
          {
            "!": [
              {
                "in": [
                  { "var": "event.agent" },
                  { "map": [{ "var": "state.resolutions" }, { "var": "oracle" }] }
                ]
              }
            ]
          }
        ]
      });
    });

    it('should finalize market when quorum is reached', () => {
      const finalizeTransition = marketPredictionDef.transitions.find(
        t => t.from === 'RESOLVING' && t.to === 'SETTLED' && t.eventName === 'finalize'
      );
      
      expect(finalizeTransition).toBeDefined();
      expect(finalizeTransition!.guard).toEqual({
        ">=": [
          { "size": { "var": "state.resolutions" } },
          { "var": "state.quorum" }
        ]
      });
    });

    it('should allow invalidation when oracles submit INVALID outcome', () => {
      const invalidateTransition = marketPredictionDef.transitions.find(
        t => t.from === 'RESOLVING' && t.to === 'REFUNDED' && t.eventName === 'invalidate'
      );
      
      expect(invalidateTransition).toBeDefined();
      expect(invalidateTransition!.guard).toEqual({
        ">=": [
          {
            "size": {
              "filter": [
                { "var": "state.resolutions" },
                { "===": [{ "var": "outcome" }, "INVALID"] }
              ]
            }
          },
          { "var": "state.quorum" }
        ]
      });
    });
  });

  describe('Dispute Mechanism', () => {
    it('should allow position holders to dispute resolution', () => {
      const disputeTransition = marketPredictionDef.transitions.find(
        t => t.from === 'RESOLVING' && t.to === 'DISPUTED' && t.eventName === 'dispute'
      );
      
      expect(disputeTransition).toBeDefined();
      expect(disputeTransition!.guard).toEqual({
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    { "var": "state.positions" },
                    { "===": [{ "var": "agent" }, { "var": "event.agent" }] }
                  ]
                }
              },
              0
            ]
          },
          { "var": "event.stake" }
        ]
      });
    });

    it('should allow judicial rulings to settle disputed markets', () => {
      const rulingTransition = marketPredictionDef.transitions.find(
        t => t.from === 'DISPUTED' && t.to === 'SETTLED' && t.eventName === 'ruling'
      );
      
      expect(rulingTransition).toBeDefined();
      expect(rulingTransition!.guard).toEqual({ "var": "event.judicialRuling" });
    });
  });

  describe('Claims and Payouts', () => {
    it('should allow winners to claim payouts', () => {
      const claimTransition = marketPredictionDef.transitions.find(
        t => t.from === 'SETTLED' && t.to === 'SETTLED' && t.eventName === 'claim'
      );
      
      expect(claimTransition).toBeDefined();
      expect(claimTransition!.guard).toEqual({
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    { "var": "state.positions" },
                    {
                      "and": [
                        { "===": [{ "var": "agent" }, { "var": "event.agent" }] },
                        { "===": [{ "var": "outcome" }, { "var": "state.finalOutcome" }] }
                      ]
                    }
                  ]
                }
              },
              0
            ]
          },
          {
            "!": [
              {
                "in": [
                  { "var": "event.agent" },
                  { "map": [{ "var": "state.claims" }, { "var": "agent" }] }
                ]
              }
            ]
          }
        ]
      });
    });

    it('should prevent double claims', () => {
      const claimTransition = marketPredictionDef.transitions.find(
        t => t.from === 'SETTLED' && t.to === 'SETTLED' && t.eventName === 'claim'
      );
      
      // Guard should include check that agent hasn't already claimed
      expect(claimTransition!.guard.and[1]).toEqual({
        "!": [
          {
            "in": [
              { "var": "event.agent" },
              { "map": [{ "var": "state.claims" }, { "var": "agent" }] }
            ]
          }
        ]
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not allow position taking after deadline', () => {
      const positionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'take_position'
      );
      
      // Guard should include deadline check
      expect(positionTransition!.guard.and[2]).toEqual({
        "or": [
          { "!": [{ "var": "state.deadline" }] },
          { "<=": [{ "var": "$timestamp" }, { "var": "state.deadline" }] }
        ]
      });
    });

    it('should not allow invalid outcome positions', () => {
      const positionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'take_position'
      );
      
      // Guard should include outcome validation
      expect(positionTransition!.guard.and[1]).toEqual({
        "in": [{ "var": "event.outcome" }, { "var": "state.outcomes" }]
      });
    });

    it('should not allow zero amount positions', () => {
      const positionTransition = marketPredictionDef.transitions.find(
        t => t.from === 'OPEN' && t.to === 'OPEN' && t.eventName === 'take_position'
      );
      
      // Guard should include positive amount check
      expect(positionTransition!.guard.and[0]).toEqual({
        ">": [{ "var": "event.amount" }, 0]
      });
    });

    it('should not allow duplicate oracle submissions', () => {
      const additionalResolution = marketPredictionDef.transitions.find(
        t => t.from === 'RESOLVING' && t.to === 'RESOLVING' && t.eventName === 'submit_resolution'
      );
      
      // Guard should prevent same oracle from submitting twice
      expect(additionalResolution!.guard.and[1]).toEqual({
        "!": [
          {
            "in": [
              { "var": "event.agent" },
              { "map": [{ "var": "state.resolutions" }, { "var": "oracle" }] }
            ]
          }
        ]
      });
    });
  });
});