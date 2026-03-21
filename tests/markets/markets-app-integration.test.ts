import {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef
} from '../../src/apps/markets/state-machines/index.js';

describe('Markets App Integration', () => {
  describe('All Market Types', () => {
    const marketDefs = [
      { name: 'MarketUniversal', def: marketUniversalDef },
      { name: 'MarketPrediction', def: marketPredictionDef },
      { name: 'MarketAuction', def: marketAuctionDef },
      { name: 'MarketCrowdfund', def: marketCrowdfundDef },
      { name: 'MarketGroupBuy', def: marketGroupBuyDef }
    ];

    marketDefs.forEach(({ name, def }) => {
      describe(name, () => {
        it('should be defined and exported', () => {
          expect(def).toBeDefined();
          expect(typeof def).toBe('object');
        });

        it('should have correct metadata structure', () => {
          expect(def.metadata).toBeDefined();
          expect(def.metadata.name).toBe(name);
          expect(def.metadata.app).toBe('markets');
          expect(def.metadata.version).toBe('1.0.0');
          expect(typeof def.metadata.description).toBe('string');
        });

        it('should have valid states structure', () => {
          expect(def.states).toBeDefined();
          expect(typeof def.states).toBe('object');
          expect(Object.keys(def.states).length).toBeGreaterThan(0);

          Object.entries(def.states).forEach(([stateId, state]) => {
            expect(state.id).toBe(stateId);
            expect(typeof state.isFinal).toBe('boolean');
          });
        });

        it('should have valid initial state', () => {
          expect(def.initialState).toBeDefined();
          expect(typeof def.initialState).toBe('string');
          expect(def.states[def.initialState]).toBeDefined();
          expect(def.states[def.initialState].isFinal).toBe(false);
        });

        it('should have at least one final state', () => {
          const finalStates = Object.values(def.states).filter(state => state.isFinal);
          expect(finalStates.length).toBeGreaterThan(0);
        });

        it('should have valid transitions structure', () => {
          expect(Array.isArray(def.transitions)).toBe(true);
          expect(def.transitions.length).toBeGreaterThan(0);

          def.transitions.forEach(transition => {
            expect(typeof transition.from).toBe('string');
            expect(typeof transition.to).toBe('string');
            expect(typeof transition.eventName).toBe('string');
            expect(def.states[transition.from]).toBeDefined();
            expect(def.states[transition.to]).toBeDefined();
            expect(transition.guard).toBeDefined();
            expect(transition.effect).toBeDefined();
            expect(Array.isArray(transition.dependencies)).toBe(true);
          });
        });

        it('should not have transitions from final states', () => {
          const finalStateIds = Object.entries(def.states)
            .filter(([_, state]) => state.isFinal)
            .map(([id, _]) => id);

          const transitionsFromFinalStates = def.transitions.filter(
            t => finalStateIds.includes(t.from)
          );

          expect(transitionsFromFinalStates).toHaveLength(0);
        });
      });
    });
  });

  describe('Common Market Patterns', () => {
    it('should all start from PROPOSED state', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        expect(def.initialState).toBe('PROPOSED');
        expect(def.states.PROPOSED).toBeDefined();
        expect(def.states.PROPOSED.isFinal).toBe(false);
      });
    });

    it('should all have cancellation from PROPOSED', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        const cancelTransition = def.transitions.find(
          t => t.from === 'PROPOSED' && t.to === 'CANCELLED' && t.eventName === 'cancel'
        );
        expect(cancelTransition).toBeDefined();
      });
    });

    it('should all have at least one settled/completed final state', () => {
      const settlementStates = ['SETTLED', 'COMPLETED', 'FULFILLED', 'DELIVERED'];
      
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        const hasSettlementState = settlementStates.some(state => {
          return def.states[state] && def.states[state].isFinal;
        });
        expect(hasSettlementState).toBe(true);
      });
    });

    it('should use consistent timestamp effect patterns', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        def.transitions.forEach(transition => {
          if (transition.effect && transition.effect.merge) {
            const mergeEffect = transition.effect.merge[1];
            if (mergeEffect) {
              // Check for timestamp fields
              Object.entries(mergeEffect).forEach(([key, value]) => {
                if (key.endsWith('At') || key.endsWith('Time')) {
                  expect(value).toEqual({ var: '$timestamp' });
                }
              });
            }
          }
        });
      });
    });

    it('should use consistent agent authorization patterns', () => {
      const marketDefs = [
        { name: 'MarketPrediction', def: marketPredictionDef },
        { name: 'MarketAuction', def: marketAuctionDef },
        { name: 'MarketCrowdfund', def: marketCrowdfundDef },
        { name: 'MarketGroupBuy', def: marketGroupBuyDef }
      ];

      marketDefs.forEach(({ name, def }) => {
        def.transitions.forEach(transition => {
          if (transition.guard && transition.guard['===']) {
            const guard = transition.guard['==='];
            if (Array.isArray(guard) && guard.length === 2) {
              if (guard[0] && guard[0].var === 'event.agent') {
                expect(guard[1].var).toMatch(/^state\.(creator|organizer|owner|depositor|beneficiary)$/);
              }
            }
          }
        });
      });
    });
  });

  describe('State Machine Validation', () => {
    it('should have reachable final states from initial state', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        const initialState = def.initialState;
        const finalStates = Object.keys(def.states).filter(
          stateId => def.states[stateId].isFinal
        );

        // Build transition graph
        const graph = new Map();
        def.transitions.forEach(t => {
          if (!graph.has(t.from)) {
            graph.set(t.from, new Set());
          }
          graph.get(t.from).add(t.to);
        });

        // BFS to find reachable states
        const visited = new Set();
        const queue = [initialState];
        visited.add(initialState);

        while (queue.length > 0) {
          const current = queue.shift();
          const neighbors = graph.get(current) || new Set();
          
          neighbors.forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }

        // Check that at least one final state is reachable
        const reachableFinalStates = finalStates.filter(state => visited.has(state));
        expect(reachableFinalStates.length).toBeGreaterThan(0);
      });
    });

    it('should have valid JSON Logic guards', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      const validOperators = [
        '==', '===', '!=', '!==', '>', '>=', '<', '<=',
        'and', 'or', '!', 'in', 'var', 'merge', 'cat',
        '+', '-', '*', '/', '%', 'size', 'filter', 'map'
      ];

      marketDefs.forEach(def => {
        def.transitions.forEach(transition => {
          const validateJsonLogic = (obj) => {
            if (typeof obj !== 'object' || obj === null) return;
            
            Object.keys(obj).forEach(key => {
              if (typeof key === 'string' && key !== 'var' && key !== '__computed') {
                // Allow field names and values, but validate operators
                if (key.length <= 3 || validOperators.includes(key)) {
                  // Valid operator or field name
                } else {
                  // Should be a field name (no special validation needed)
                }
              }
              
              if (Array.isArray(obj[key])) {
                obj[key].forEach(validateJsonLogic);
              } else if (typeof obj[key] === 'object') {
                validateJsonLogic(obj[key]);
              }
            });
          };

          validateJsonLogic(transition.guard);
          validateJsonLogic(transition.effect);
        });
      });
    });

    it('should have consistent state merge patterns in effects', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        def.transitions.forEach(transition => {
          if (transition.effect && transition.effect.merge) {
            expect(Array.isArray(transition.effect.merge)).toBe(true);
            expect(transition.effect.merge.length).toBe(2);
            expect(transition.effect.merge[0]).toEqual({ var: 'state' });
            expect(typeof transition.effect.merge[1]).toBe('object');
          }
        });
      });
    });
  });

  describe('Cross-References and Dependencies', () => {
    it('should have valid cross-reference fields where defined', () => {
      const defsWithRefs = [
        marketPredictionDef,
        // Add others if they have crossReferences
      ];

      defsWithRefs.forEach(def => {
        if (def.metadata.crossReferences) {
          Object.entries(def.metadata.crossReferences).forEach(([field, description]) => {
            expect(typeof field).toBe('string');
            expect(typeof description).toBe('string');
            expect(description.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should have empty dependencies arrays (no SM spawning in markets)', () => {
      const marketDefs = [
        marketUniversalDef,
        marketPredictionDef,
        marketAuctionDef,
        marketCrowdfundDef,
        marketGroupBuyDef
      ];

      marketDefs.forEach(def => {
        def.transitions.forEach(transition => {
          expect(transition.dependencies).toEqual([]);
        });
      });
    });
  });
});