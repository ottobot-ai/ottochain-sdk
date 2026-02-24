/**
 * DFA Effect System TDD Tests
 * 
 * Tests for the effect system that handles state updates and side effects
 * during state machine transitions as specified in dfa-json-logic-patterns.md.
 * 
 * These tests will FAIL until the effect system is implemented.
 */

import { describe, it, expect } from '@jest/globals';

// Effect system types
interface EffectEngine {
  applyEffect(effect: JsonLogicExpression, context: StateMachineContext): EffectResult;
  mergeStateUpdates(currentState: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown>;
  extractSideEffects(effectResult: Record<string, unknown>): StateMachineSideEffect[];
  validateEffectResult(result: EffectResult): boolean;
}

interface EffectResult {
  newState: Record<string, unknown>;
  sideEffects: StateMachineSideEffect[];
  errors: string[];
}

interface StateMachineSideEffect {
  type: 'oracle_call' | 'emit' | 'spawn';
  data: Record<string, unknown>;
}

interface StateMachineContext {
  state: Record<string, unknown>;
  event: Record<string, unknown>;
  proofs: Array<{ address: string; [key: string]: unknown }>;
  sequenceNumber: number;
  delegation?: DelegationContext;
}

interface DelegationContext {
  active: boolean;
  spendRemaining: number;
  delegator: string;
  relayer: string;
  scope: string[];
}

interface JsonLogicExpression {
  [operator: string]: unknown;
}

describe('DFA Effect System Core TDD Tests', () => {
  
  describe('Basic State Merge Effects', () => {
    
    it('SHOULD FAIL: should merge new fields into existing state', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          ownerAddress: '0x123',
          balance: 1000,
          metadata: { name: 'Test NFT' }
        },
        event: {
          askingPrice: 500,
          currency: 'DAG'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const mergeEffect = {
        'merge': [
          { 'var': 'state' },
          {
            listingPrice: { 'var': 'event.askingPrice' },
            listingCurrency: { 'var': 'event.currency' },
            listedAt: { 'var': 'sequenceNumber' }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(mergeEffect, context);
      
      expect(result.newState.ownerAddress).toBe('0x123'); // Preserved
      expect(result.newState.balance).toBe(1000); // Preserved
      expect(result.newState.metadata).toEqual({ name: 'Test NFT' }); // Preserved
      expect(result.newState.listingPrice).toBe(500); // New field
      expect(result.newState.listingCurrency).toBe('DAG'); // New field
      expect(result.newState.listedAt).toBe(1); // New field
      expect(result.sideEffects).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('SHOULD FAIL: should overwrite existing fields in merge effect', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          ownerAddress: '0x123',
          status: 'minted',
          lastUpdated: 5
        },
        event: {
          newOwner: '0x456'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 10
      };
      
      const overwriteEffect = {
        'merge': [
          { 'var': 'state' },
          {
            ownerAddress: { 'var': 'event.newOwner' },
            status: 'transferred',
            lastUpdated: { 'var': 'sequenceNumber' }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(overwriteEffect, context);
      
      expect(result.newState.ownerAddress).toBe('0x456'); // Overwritten
      expect(result.newState.status).toBe('transferred'); // Overwritten
      expect(result.newState.lastUpdated).toBe(10); // Overwritten
    });

    it('SHOULD FAIL: should handle nested state updates correctly', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          metadata: {
            name: 'Test NFT',
            description: 'A test NFT',
            attributes: {
              rarity: 'common',
              level: 1
            }
          },
          stats: {
            views: 10,
            transfers: 2
          }
        },
        event: {
          newLevel: 5,
          additionalViews: 3
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const nestedUpdateEffect = {
        'merge': [
          { 'var': 'state' },
          {
            metadata: {
              'merge': [
                { 'var': 'state.metadata' },
                {
                  attributes: {
                    'merge': [
                      { 'var': 'state.metadata.attributes' },
                      {
                        level: { 'var': 'event.newLevel' }
                      }
                    ]
                  }
                }
              ]
            },
            stats: {
              'merge': [
                { 'var': 'state.stats' },
                {
                  views: { '+': [{ 'var': 'state.stats.views' }, { 'var': 'event.additionalViews' }] }
                }
              ]
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(nestedUpdateEffect, context);
      
      expect(result.newState.metadata.name).toBe('Test NFT'); // Preserved
      expect(result.newState.metadata.attributes.rarity).toBe('common'); // Preserved
      expect(result.newState.metadata.attributes.level).toBe(5); // Updated
      expect(result.newState.stats.views).toBe(13); // 10 + 3
      expect(result.newState.stats.transfers).toBe(2); // Preserved
    });

    it('SHOULD FAIL: should handle array updates and manipulations', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          transactions: [
            { id: 1, amount: 100, type: 'mint' },
            { id: 2, amount: 50, type: 'transfer' }
          ],
          tags: ['collectible', 'game']
        },
        event: {
          newTransaction: { id: 3, amount: 75, type: 'sale' },
          additionalTag: 'rare'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 3
      };
      
      const arrayUpdateEffect = {
        'merge': [
          { 'var': 'state' },
          {
            transactions: {
              'cat': [
                { 'var': 'state.transactions' },
                [{ 'var': 'event.newTransaction' }]
              ]
            },
            tags: {
              'cat': [
                { 'var': 'state.tags' },
                [{ 'var': 'event.additionalTag' }]
              ]
            },
            lastTransactionId: { 'var': 'event.newTransaction.id' }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(arrayUpdateEffect, context);
      
      expect(result.newState.transactions).toHaveLength(3);
      expect(result.newState.transactions[2]).toEqual({ id: 3, amount: 75, type: 'sale' });
      expect(result.newState.tags).toEqual(['collectible', 'game', 'rare']);
      expect(result.newState.lastTransactionId).toBe(3);
    });
  });

  describe('Mathematical and Counter Effects', () => {
    
    it('SHOULD FAIL: should handle counter increment/decrement effects', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          transferCount: 5,
          viewCount: 100,
          score: 85
        },
        event: {
          increment: 3,
          decrement: 10
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const counterEffect = {
        'merge': [
          { 'var': 'state' },
          {
            transferCount: { '+': [{ 'var': 'state.transferCount' }, 1] },
            viewCount: { '+': [{ 'var': 'state.viewCount' }, { 'var': 'event.increment' }] },
            score: { '-': [{ 'var': 'state.score' }, { 'var': 'event.decrement' }] }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(counterEffect, context);
      
      expect(result.newState.transferCount).toBe(6); // 5 + 1
      expect(result.newState.viewCount).toBe(103); // 100 + 3
      expect(result.newState.score).toBe(75); // 85 - 10
    });

    it('SHOULD FAIL: should handle complex mathematical operations', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          balance: 1000,
          fee: 2.5, // percentage
          multiplier: 3
        },
        event: {
          amount: 100
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const mathEffect = {
        'merge': [
          { 'var': 'state' },
          {
            // Calculate fee amount: (amount * fee) / 100
            feeAmount: {
              '/': [
                { '*': [{ 'var': 'event.amount' }, { 'var': 'state.fee' }] },
                100
              ]
            },
            // Update balance: balance - amount + (amount * multiplier)
            balance: {
              '+': [
                { '-': [{ 'var': 'state.balance' }, { 'var': 'event.amount' }] },
                { '*': [{ 'var': 'event.amount' }, { 'var': 'state.multiplier' }] }
              ]
            },
            // Calculate percentage: (amount / balance) * 100
            percentage: {
              '*': [
                { '/': [{ 'var': 'event.amount' }, { 'var': 'state.balance' }] },
                100
              ]
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(mathEffect, context);
      
      expect(result.newState.feeAmount).toBe(2.5); // (100 * 2.5) / 100
      expect(result.newState.balance).toBe(1200); // 1000 - 100 + (100 * 3)
      expect(result.newState.percentage).toBe(10); // (100 / 1000) * 100
    });

    it('SHOULD FAIL: should handle conditional effects based on state', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          level: 5,
          experience: 800,
          nextLevelExp: 1000
        },
        event: {
          expGained: 250
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const conditionalEffect = {
        'merge': [
          { 'var': 'state' },
          {
            experience: { '+': [{ 'var': 'state.experience' }, { 'var': 'event.expGained' }] },
            level: {
              'if': [
                { '>=': [
                  { '+': [{ 'var': 'state.experience' }, { 'var': 'event.expGained' }] },
                  { 'var': 'state.nextLevelExp' }
                ]},
                { '+': [{ 'var': 'state.level' }, 1] },
                { 'var': 'state.level' }
              ]
            },
            leveledUp: {
              'if': [
                { '>=': [
                  { '+': [{ 'var': 'state.experience' }, { 'var': 'event.expGained' }] },
                  { 'var': 'state.nextLevelExp' }
                ]},
                true,
                false
              ]
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(conditionalEffect, context);
      
      expect(result.newState.experience).toBe(1050); // 800 + 250
      expect(result.newState.level).toBe(6); // Leveled up because 1050 >= 1000
      expect(result.newState.leveledUp).toBe(true);
    });
  });

  describe('Side Effects Extraction', () => {
    
    it('SHOULD FAIL: should extract oracle call side effects', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          oracleId: 'price-oracle',
          symbol: 'ETH/USD'
        },
        event: {
          requestId: 'req-123'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 1
      };
      
      const oracleEffect = {
        'merge': [
          { 'var': 'state' },
          {
            pendingRequest: { 'var': 'event.requestId' },
            lastRequestedAt: { 'var': 'sequenceNumber' },
            _oracleCall: {
              oracleId: { 'var': 'state.oracleId' },
              method: 'getPrice',
              params: {
                symbol: { 'var': 'state.symbol' },
                requestId: { 'var': 'event.requestId' }
              }
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(oracleEffect, context);
      
      // _oracleCall should be extracted as side effect, not included in state
      expect(result.newState._oracleCall).toBeUndefined();
      expect(result.newState.pendingRequest).toBe('req-123');
      expect(result.newState.lastRequestedAt).toBe(1);
      
      expect(result.sideEffects).toHaveLength(1);
      expect(result.sideEffects[0].type).toBe('oracle_call');
      expect(result.sideEffects[0].data).toEqual({
        oracleId: 'price-oracle',
        method: 'getPrice',
        params: {
          symbol: 'ETH/USD',
          requestId: 'req-123'
        }
      });
    });

    it('SHOULD FAIL: should extract emit side effects for events', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          ownerAddress: '0x123',
          tokenId: 'token-456'
        },
        event: {
          to: '0x789',
          amount: 100
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 5
      };
      
      const emitEffect = {
        'merge': [
          { 'var': 'state' },
          {
            lastTransferTo: { 'var': 'event.to' },
            transferCount: { '+': [{ 'var': 'state.transferCount' }, 1] },
            _emit: {
              eventType: 'TokenTransferred',
              data: {
                tokenId: { 'var': 'state.tokenId' },
                from: { 'var': 'state.ownerAddress' },
                to: { 'var': 'event.to' },
                amount: { 'var': 'event.amount' },
                blockNumber: { 'var': 'sequenceNumber' }
              }
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(emitEffect, context);
      
      // _emit should be extracted as side effect
      expect(result.newState._emit).toBeUndefined();
      expect(result.newState.lastTransferTo).toBe('0x789');
      
      expect(result.sideEffects).toHaveLength(1);
      expect(result.sideEffects[0].type).toBe('emit');
      expect(result.sideEffects[0].data).toEqual({
        eventType: 'TokenTransferred',
        data: {
          tokenId: 'token-456',
          from: '0x123',
          to: '0x789',
          amount: 100,
          blockNumber: 5
        }
      });
    });

    it('SHOULD FAIL: should extract spawn side effects for creating child fibers', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          gameId: 'game-123',
          playerId: 'player-456'
        },
        event: {
          itemType: 'weapon',
          rarity: 'legendary'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 10
      };
      
      const spawnEffect = {
        'merge': [
          { 'var': 'state' },
          {
            itemsCreated: { '+': [{ 'var': 'state.itemsCreated' }, 1] },
            lastSpawnedAt: { 'var': 'sequenceNumber' },
            _spawn: {
              fiberType: 'GameItem',
              initialData: {
                gameId: { 'var': 'state.gameId' },
                ownerId: { 'var': 'state.playerId' },
                itemType: { 'var': 'event.itemType' },
                rarity: { 'var': 'event.rarity' },
                createdAt: { 'var': 'sequenceNumber' }
              }
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(spawnEffect, context);
      
      // _spawn should be extracted as side effect
      expect(result.newState._spawn).toBeUndefined();
      expect(result.newState.itemsCreated).toBe(1);
      expect(result.newState.lastSpawnedAt).toBe(10);
      
      expect(result.sideEffects).toHaveLength(1);
      expect(result.sideEffects[0].type).toBe('spawn');
      expect(result.sideEffects[0].data).toEqual({
        fiberType: 'GameItem',
        initialData: {
          gameId: 'game-123',
          ownerId: 'player-456',
          itemType: 'weapon',
          rarity: 'legendary',
          createdAt: 10
        }
      });
    });

    it('SHOULD FAIL: should handle multiple side effects in single transition', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          balance: 1000,
          oracleId: 'balance-oracle'
        },
        event: {
          amount: 100,
          recipient: '0x456'
        },
        proofs: [{ address: '0x123' }],
        sequenceNumber: 20
      };
      
      const multiSideEffectEffect = {
        'merge': [
          { 'var': 'state' },
          {
            balance: { '-': [{ 'var': 'state.balance' }, { 'var': 'event.amount' }] },
            lastTransfer: { 'var': 'sequenceNumber' },
            _emit: {
              eventType: 'Transfer',
              data: {
                amount: { 'var': 'event.amount' },
                to: { 'var': 'event.recipient' }
              }
            },
            _oracleCall: {
              oracleId: { 'var': 'state.oracleId' },
              method: 'updateBalance',
              params: {
                newBalance: { '-': [{ 'var': 'state.balance' }, { 'var': 'event.amount' }] }
              }
            },
            _spawn: {
              fiberType: 'TransactionRecord',
              initialData: {
                amount: { 'var': 'event.amount' },
                timestamp: { 'var': 'sequenceNumber' }
              }
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(multiSideEffectEffect, context);
      
      expect(result.newState.balance).toBe(900);
      expect(result.newState.lastTransfer).toBe(20);
      expect(result.newState._emit).toBeUndefined();
      expect(result.newState._oracleCall).toBeUndefined();
      expect(result.newState._spawn).toBeUndefined();
      
      expect(result.sideEffects).toHaveLength(3);
      
      const emitEffect = result.sideEffects.find(se => se.type === 'emit');
      const oracleEffect = result.sideEffects.find(se => se.type === 'oracle_call');
      const spawnEffect = result.sideEffects.find(se => se.type === 'spawn');
      
      expect(emitEffect).toBeDefined();
      expect(oracleEffect).toBeDefined();
      expect(spawnEffect).toBeDefined();
    });
  });

  describe('Delegation Context Effects', () => {
    
    it('SHOULD FAIL: should update delegation spend tracking', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          balance: 1000
        },
        event: {
          amount: 250
        },
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          spendRemaining: 500,
          delegator: '0xowner',
          relayer: '0xrelayer',
          scope: ['transfer']
        }
      };
      
      const delegationSpendEffect = {
        'merge': [
          { 'var': 'state' },
          {
            balance: { '-': [{ 'var': 'state.balance' }, { 'var': 'event.amount' }] },
            lastDelegatedSpend: { 'var': 'event.amount' },
            delegatedSpendTotal: {
              '+': [
                { 'var': 'state.delegatedSpendTotal' },
                { 'var': 'event.amount' }
              ]
            },
            remainingDelegationSpend: {
              '-': [
                { 'var': 'delegation.spendRemaining' },
                { 'var': 'event.amount' }
              ]
            }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(delegationSpendEffect, context);
      
      expect(result.newState.balance).toBe(750); // 1000 - 250
      expect(result.newState.lastDelegatedSpend).toBe(250);
      expect(result.newState.delegatedSpendTotal).toBe(250);
      expect(result.newState.remainingDelegationSpend).toBe(250); // 500 - 250
    });

    it('SHOULD FAIL: should handle delegation context in effects', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          ownerAddress: '0xowner'
        },
        event: {
          newData: 'updated'
        },
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          scope: ['update']
        }
      };
      
      const delegationAwareEffect = {
        'merge': [
          { 'var': 'state' },
          {
            data: { 'var': 'event.newData' },
            lastUpdatedBy: {
              'if': [
                { '===': [{ 'var': 'delegation.active' }, true] },
                { 'var': 'delegation.delegator' }, // Use delegator as updater
                { 'var': 'proofs.0.address' } // Use direct proof address
              ]
            },
            updateMethod: {
              'if': [
                { '===': [{ 'var': 'delegation.active' }, true] },
                'delegated',
                'direct'
              ]
            },
            relayerAddress: { 'var': 'delegation.relayer' }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(delegationAwareEffect, context);
      
      expect(result.newState.data).toBe('updated');
      expect(result.newState.lastUpdatedBy).toBe('0xowner'); // Delegator, not relayer
      expect(result.newState.updateMethod).toBe('delegated');
      expect(result.newState.relayerAddress).toBe('0xrelayer');
    });
  });

  describe('Effect Validation and Error Handling', () => {
    
    it('SHOULD FAIL: should validate effect structure and reject malformed effects', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {},
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      const malformedEffect = {
        'invalid_operator': [1, 2, 3]
      };
      
      const result = effectEngine.applyEffect(malformedEffect, context);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Unknown JSON Logic operator: invalid_operator');
      expect(result.newState).toEqual({});
    });

    it('SHOULD FAIL: should handle division by zero and other mathematical errors', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          value: 100
        },
        event: {
          divisor: 0
        },
        proofs: [],
        sequenceNumber: 1
      };
      
      const divisionByZeroEffect = {
        'merge': [
          { 'var': 'state' },
          {
            result: { '/': [{ 'var': 'state.value' }, { 'var': 'event.divisor' }] }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(divisionByZeroEffect, context);
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Division by zero');
    });

    it('SHOULD FAIL: should handle missing variable references gracefully', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {},
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      const missingVarEffect = {
        'merge': [
          { 'var': 'state' },
          {
            value: { 'var': 'nonexistent.field' },
            calculation: { '+': [{ 'var': 'missing.number' }, 10] }
          }
        ]
      };
      
      const result = effectEngine.applyEffect(missingVarEffect, context);
      
      // Should handle gracefully, possibly with null values
      expect(result.newState.value).toBeNull();
      expect(result.newState.calculation).toBeNaN();
      expect(result.errors).toHaveLength(0); // Should not error, just use default values
    });

    it('SHOULD FAIL: should prevent state corruption on effect errors', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: {
          importantData: 'preserve this',
          balance: 1000
        },
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      const partiallyFailingEffect = {
        'merge': [
          { 'var': 'state' },
          {
            goodField: 'this should work',
            badField: { 'throw_error': 'intentional failure' },
            anotherGoodField: 42
          }
        ]
      };
      
      const result = effectEngine.applyEffect(partiallyFailingEffect, context);
      
      if (result.errors.length > 0) {
        // If any part of effect fails, entire effect should be rejected
        expect(result.newState).toEqual(context.state); // Original state preserved
      } else {
        // Or handle partial success gracefully
        expect(result.newState.importantData).toBe('preserve this');
        expect(result.newState.goodField).toBe('this should work');
        expect(result.newState.anotherGoodField).toBe(42);
      }
    });

    it('SHOULD FAIL: should limit recursion depth in complex effects', async () => {
      const effectEngine = new EffectEngine();
      
      const context: StateMachineContext = {
        state: { value: 1 },
        event: {},
        proofs: [],
        sequenceNumber: 1
      };
      
      // Create deeply nested effect that could cause stack overflow
      const createDeepNesting = (depth: number): any => {
        if (depth <= 0) return { 'var': 'state.value' };
        return { '+': [createDeepNesting(depth - 1), 1] };
      };
      
      const deepEffect = {
        'merge': [
          { 'var': 'state' },
          {
            result: createDeepNesting(1000) // Very deep nesting
          }
        ]
      };
      
      expect(() => effectEngine.applyEffect(deepEffect, context))
        .toThrow('Maximum recursion depth exceeded');
    });
  });

  describe('State Merge Utilities', () => {
    
    it('SHOULD FAIL: should merge objects preserving type safety', async () => {
      const effectEngine = new EffectEngine();
      
      const currentState = {
        stringField: 'original',
        numberField: 42,
        booleanField: true,
        arrayField: [1, 2, 3],
        objectField: { nested: 'value' }
      };
      
      const updates = {
        stringField: 'updated',
        newNumberField: 100,
        arrayField: [4, 5, 6],
        objectField: { nested: 'new value', additional: true }
      };
      
      const merged = effectEngine.mergeStateUpdates(currentState, updates);
      
      expect(merged.stringField).toBe('updated'); // Overwritten
      expect(merged.numberField).toBe(42); // Preserved
      expect(merged.booleanField).toBe(true); // Preserved
      expect(merged.newNumberField).toBe(100); // Added
      expect(merged.arrayField).toEqual([4, 5, 6]); // Replaced
      expect(merged.objectField).toEqual({ nested: 'new value', additional: true }); // Replaced
    });

    it('SHOULD FAIL: should handle null and undefined values in merge', async () => {
      const effectEngine = new EffectEngine();
      
      const currentState = {
        existingField: 'value',
        nullableField: 'will be null'
      };
      
      const updates = {
        nullableField: null,
        undefinedField: undefined,
        newField: 'new value'
      };
      
      const merged = effectEngine.mergeStateUpdates(currentState, updates);
      
      expect(merged.existingField).toBe('value');
      expect(merged.nullableField).toBeNull();
      expect(merged.undefinedField).toBeUndefined();
      expect(merged.newField).toBe('new value');
    });
  });
});