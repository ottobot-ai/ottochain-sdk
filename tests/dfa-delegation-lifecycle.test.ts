/**
 * DFA Delegation and Lifecycle TDD Tests
 * 
 * Tests for delegation patterns, complex lifecycle examples, and integration
 * scenarios as specified in dfa-json-logic-patterns.md.
 * 
 * These tests will FAIL until the delegation system and lifecycle patterns are implemented.
 */

import { describe, it, expect } from '@jest/globals';

// Extended interfaces for delegation and lifecycle testing
interface DelegationStateMachine extends StateMachineEngine {
  createDigitalSportsCollectible(initialData: CollectibleData): Promise<StateMachineInstance>;
  createGameCharacter(initialData: GameCharacterData): Promise<StateMachineInstance>;
  createMarketplace(initialData: MarketplaceData): Promise<StateMachineInstance>;
  enableDelegation(instance: StateMachineInstance, delegationConfig: DelegationConfig): Promise<void>;
}

interface CollectibleData {
  ownerAddress: string;
  tokenId: string;
  sport: string;
  playerName: string;
  rarity: string;
  expiresAtSequence: number;
  validatorAddress: string;
}

interface GameCharacterData {
  ownerAddress: string;
  characterId: string;
  level: number;
  experience: number;
  attributes: Record<string, number>;
  gameAddress: string;
}

interface MarketplaceData {
  operatorAddress: string;
  feePercentage: number;
  allowedCurrencies: string[];
  minimumListingPrice: number;
}

interface DelegationConfig {
  delegator: string;
  relayer: string;
  scope: string[];
  spendLimit: number;
  expiresAt: number;
  sessionKey: string;
}

// From core interfaces
interface StateMachineEngine {
  createStateMachine(definition: StateMachineDefinition, initialData?: Record<string, unknown>): Promise<StateMachineInstance>;
  transitionStateMachine(
    instance: StateMachineInstance, 
    eventName: string, 
    eventData: Record<string, unknown>,
    context: Partial<StateMachineContext>
  ): Promise<StateMachineTransitionResult>;
}

interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: Record<string, unknown>;
}

interface StateDefinition {
  id: { value: string };
  isFinal: boolean;
  metadata: Record<string, unknown> | null;
}

interface TransitionDefinition {
  from: { value: string };
  to: { value: string };
  eventName: string;
  guard: JsonLogicExpression;
  effect?: JsonLogicExpression;
}

interface StateMachineInstance {
  id: string;
  definition: StateMachineDefinition;
  currentState: string;
  stateData: Record<string, unknown>;
  sequenceNumber: number;
  created: number;
  lastUpdated: number;
}

interface StateMachineTransitionResult {
  success: boolean;
  previousState: string;
  newState: string;
  newStateData: Record<string, unknown>;
  newSequenceNumber: number;
  reason?: string;
  sideEffects?: StateMachineSideEffect[];
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
  expiresAt: number;
  scope: string[];
  spendLimit: number;
  spendUsed: number;
  spendRemaining: number;
  delegator: string;
  relayer: string;
  sessionKey: string;
  bondedStake: number;
}

interface JsonLogicExpression {
  [operator: string]: unknown;
}

describe('DFA Delegation Patterns TDD Tests', () => {
  
  describe('Basic Delegation Guards', () => {
    
    it('SHOULD FAIL: should allow operations when delegation is active', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          owned: { id: { value: 'owned' }, isFinal: false, metadata: {} },
          transferred: { id: { value: 'transferred' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'owned' },
        transitions: [
          {
            from: { value: 'owned' },
            to: { value: 'transferred' },
            eventName: 'transfer',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                { 'in': ['transfer', { var: 'delegation.scope' }] }
              ]
            },
            effect: {
              'merge': [
                { var: 'state' },
                {
                  ownerAddress: { var: 'event.to' },
                  lastTransferBy: { var: 'delegation.relayer' },
                  transferCount: { '+': [{ var: 'state.transferCount' }, 1] }
                }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        ownerAddress: '0xowner',
        transferCount: 0
      });
      
      const context: StateMachineContext = {
        state: instance.stateData,
        event: { to: '0xnewowner' },
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ['transfer', 'update'],
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'transfer',
        { to: '0xnewowner' },
        context
      );
      
      expect(result.success).toBe(true);
      expect(result.newState).toBe('transferred');
      expect(result.newStateData.ownerAddress).toBe('0xnewowner');
      expect(result.newStateData.lastTransferBy).toBe('0xrelayer');
      expect(result.newStateData.transferCount).toBe(1);
    });

    it('SHOULD FAIL: should reject operations when delegation is inactive', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          owned: { id: { value: 'owned' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'owned' },
        transitions: [
          {
            from: { value: 'owned' },
            to: { value: 'owned' },
            eventName: 'update',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                { 'in': ['update', { var: 'delegation.scope' }] }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const context: StateMachineContext = {
        state: instance.stateData,
        event: { newData: 'updated' },
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: false, // Delegation inactive
          expiresAt: 500, // Expired
          scope: ['update'],
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'update',
        { newData: 'updated' },
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Guard condition failed');
    });

    it('SHOULD FAIL: should check delegation scope correctly', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'active' },
            eventName: 'restricted_action',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                { 'in': ['restricted_action', { var: 'delegation.scope' }] }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const context: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['transfer', 'update'], // Does NOT include 'restricted_action'
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'restricted_action',
        {},
        context
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Guard condition failed');
    });

    it('SHOULD FAIL: should handle wildcard delegation scope', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'active' },
            eventName: 'any_action',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                {
                  'or': [
                    { 'in': ['any_action', { var: 'delegation.scope' }] },
                    { 'in': ['*', { var: 'delegation.scope' }] }
                  ]
                }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      const context: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['*'], // Wildcard - allows any action
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'any_action',
        {},
        context
      );
      
      expect(result.success).toBe(true);
    });

    it('SHOULD FAIL: should enforce spend limits in delegation', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'active' },
            eventName: 'spend',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                { 'in': ['spend', { var: 'delegation.scope' }] },
                { '>=': [{ var: 'delegation.spendRemaining' }, { var: 'event.amount' }] }
              ]
            },
            effect: {
              'merge': [
                { var: 'state' },
                {
                  totalSpent: { '+': [{ var: 'state.totalSpent' }, { var: 'event.amount' }] },
                  lastSpendAmount: { var: 'event.amount' }
                }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {
        totalSpent: 0
      });
      
      // Test within spend limit
      const validContext: StateMachineContext = {
        state: instance.stateData,
        event: { amount: 100 },
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['spend'],
          spendLimit: 500,
          spendUsed: 200,
          spendRemaining: 300, // 300 >= 100, should pass
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const validResult = await engine.transitionStateMachine(
        instance,
        'spend',
        { amount: 100 },
        validContext
      );
      
      expect(validResult.success).toBe(true);
      expect(validResult.newStateData.totalSpent).toBe(100);
      
      // Test exceeding spend limit
      const invalidContext: StateMachineContext = {
        state: instance.stateData,
        event: { amount: 400 }, // 400 > 300 remaining
        proofs: [{ address: '0xrelayer' }],
        sequenceNumber: 2,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['spend'],
          spendLimit: 500,
          spendUsed: 200,
          spendRemaining: 300,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const invalidResult = await engine.transitionStateMachine(
        instance,
        'spend',
        { amount: 400 },
        invalidContext
      );
      
      expect(invalidResult.success).toBe(false);
    });

    it('SHOULD FAIL: should validate session key matches', async () => {
      const engine = new DelegationStateMachine();
      
      const definition: StateMachineDefinition = {
        states: {
          active: { id: { value: 'active' }, isFinal: false, metadata: {} }
        },
        initialState: { value: 'active' },
        transitions: [
          {
            from: { value: 'active' },
            to: { value: 'active' },
            eventName: 'secure_action',
            guard: {
              'and': [
                { '===': [{ var: 'delegation.active' }, true] },
                { '===': [{ var: 'proofs.0.address' }, { var: 'delegation.relayer' }] },
                { 'in': ['secure_action', { var: 'delegation.scope' }] }
              ]
            }
          }
        ],
        metadata: {}
      };
      
      const instance = await engine.createStateMachine(definition, {});
      
      // Valid relayer address
      const validContext: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xrelayer' }], // Matches delegation.relayer
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['secure_action'],
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const validResult = await engine.transitionStateMachine(
        instance,
        'secure_action',
        {},
        validContext
      );
      
      expect(validResult.success).toBe(true);
      
      // Invalid relayer address
      const invalidContext: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xwrongrelayer' }], // Does not match delegation.relayer
        sequenceNumber: 2,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['secure_action'],
          spendLimit: 1000,
          spendUsed: 0,
          spendRemaining: 1000,
          delegator: '0xowner',
          relayer: '0xrelayer',
          sessionKey: '0xsessionkey',
          bondedStake: 500
        }
      };
      
      const invalidResult = await engine.transitionStateMachine(
        instance,
        'secure_action',
        {},
        invalidContext
      );
      
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Complex Lifecycle: Digital Sports Collectible', () => {
    
    it('SHOULD FAIL: should create digital sports collectible with full lifecycle', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-001',
        sport: 'basketball',
        playerName: 'LeBron James',
        rarity: 'legendary',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      expect(instance.currentState).toBe('minted');
      expect(instance.stateData.ownerAddress).toBe('0xowner');
      expect(instance.stateData.tokenId).toBe('sports-nft-001');
      expect(instance.stateData.transferCount).toBe(0);
      expect(instance.definition.states).toHaveProperty('minted');
      expect(instance.definition.states).toHaveProperty('listed');
      expect(instance.definition.states).toHaveProperty('owned');
      expect(instance.definition.states).toHaveProperty('governance_locked');
      expect(instance.definition.states).toHaveProperty('expired');
      expect(instance.definition.states).toHaveProperty('burned');
    });

    it('SHOULD FAIL: should handle listing lifecycle correctly', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-002',
        sport: 'football',
        playerName: 'Tom Brady',
        rarity: 'rare',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // List the collectible
      const listContext: StateMachineContext = {
        state: instance.stateData,
        event: { askingPrice: 1000, currency: 'DAG' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 1
      };
      
      const listResult = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 1000, currency: 'DAG' },
        listContext
      );
      
      expect(listResult.success).toBe(true);
      expect(listResult.newState).toBe('listed');
      expect(listResult.newStateData.askingPrice).toBe(1000);
      expect(listResult.newStateData.currency).toBe('DAG');
      expect(listResult.newStateData.listedAt).toBe(1);
      
      // Delist the collectible
      const delistContext: StateMachineContext = {
        state: listResult.newStateData,
        event: {},
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 2
      };
      
      instance.currentState = listResult.newState;
      instance.stateData = listResult.newStateData;
      
      const delistResult = await engine.transitionStateMachine(
        instance,
        'delist',
        {},
        delistContext
      );
      
      expect(delistResult.success).toBe(true);
      expect(delistResult.newState).toBe('minted');
    });

    it('SHOULD FAIL: should handle purchase workflow with ownership transfer', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xseller',
        tokenId: 'sports-nft-003',
        sport: 'soccer',
        playerName: 'Lionel Messi',
        rarity: 'legendary',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // First list the item
      const listContext: StateMachineContext = {
        state: instance.stateData,
        event: { askingPrice: 2000, currency: 'DAG' },
        proofs: [{ address: '0xseller' }],
        sequenceNumber: 1
      };
      
      const listResult = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 2000, currency: 'DAG' },
        listContext
      );
      
      expect(listResult.success).toBe(true);
      
      // Purchase the item
      const purchaseContext: StateMachineContext = {
        state: listResult.newStateData,
        event: { buyer: '0xbuyer', price: 2000, currency: 'DAG' },
        proofs: [{ address: '0xbuyer' }],
        sequenceNumber: 2
      };
      
      instance.currentState = listResult.newState;
      instance.stateData = listResult.newStateData;
      
      const purchaseResult = await engine.transitionStateMachine(
        instance,
        'purchase',
        { buyer: '0xbuyer', price: 2000, currency: 'DAG' },
        purchaseContext
      );
      
      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.newState).toBe('owned');
      expect(purchaseResult.newStateData.ownerAddress).toBe('0xbuyer');
      expect(purchaseResult.newStateData.purchasePrice).toBe(2000);
      expect(purchaseResult.newStateData.transferCount).toBe(1);
    });

    it('SHOULD FAIL: should reject unauthorized operations', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-004',
        sport: 'tennis',
        playerName: 'Serena Williams',
        rarity: 'common',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // Try to list from unauthorized address
      const unauthorizedContext: StateMachineContext = {
        state: instance.stateData,
        event: { askingPrice: 500, currency: 'DAG' },
        proofs: [{ address: '0xunauthorized' }], // Not the owner
        sequenceNumber: 1
      };
      
      const result = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 500, currency: 'DAG' },
        unauthorizedContext
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Guard condition failed');
    });

    it('SHOULD FAIL: should handle governance lock by validator', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-005',
        sport: 'hockey',
        playerName: 'Wayne Gretzky',
        rarity: 'legendary',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // Validator locks the collectible
      const lockContext: StateMachineContext = {
        state: instance.stateData,
        event: { reason: 'Suspicious activity detected' },
        proofs: [{ address: '0xvalidator' }],
        sequenceNumber: 1
      };
      
      const lockResult = await engine.transitionStateMachine(
        instance,
        'lock',
        { reason: 'Suspicious activity detected' },
        lockContext
      );
      
      expect(lockResult.success).toBe(true);
      expect(lockResult.newState).toBe('governance_locked');
      expect(lockResult.newStateData.lockReason).toBe('Suspicious activity detected');
      expect(lockResult.newStateData.lockedBy).toBe('0xvalidator');
      
      // Try operation while locked (should fail)
      const lockedOperationContext: StateMachineContext = {
        state: lockResult.newStateData,
        event: { askingPrice: 1000, currency: 'DAG' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 2
      };
      
      instance.currentState = lockResult.newState;
      instance.stateData = lockResult.newStateData;
      
      const lockedResult = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 1000, currency: 'DAG' },
        lockedOperationContext
      );
      
      expect(lockedResult.success).toBe(false); // Should fail - no transitions from locked state except unlock
      
      // Validator unlocks
      const unlockContext: StateMachineContext = {
        state: lockResult.newStateData,
        event: {},
        proofs: [{ address: '0xvalidator' }],
        sequenceNumber: 3
      };
      
      const unlockResult = await engine.transitionStateMachine(
        instance,
        'unlock',
        {},
        unlockContext
      );
      
      expect(unlockResult.success).toBe(true);
      expect(unlockResult.newState).toBe('owned'); // Back to owned state
    });

    it('SHOULD FAIL: should handle expiration based on sequence number', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-006',
        sport: 'baseball',
        playerName: 'Babe Ruth',
        rarity: 'legendary',
        expiresAtSequence: 5, // Low expiration for testing
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // Before expiration (sequence 3 < 5)
      const beforeExpirationContext: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 3
      };
      
      const beforeResult = await engine.transitionStateMachine(
        instance,
        'expire',
        {},
        beforeExpirationContext
      );
      
      expect(beforeResult.success).toBe(false); // Not yet expired
      
      // At expiration (sequence 5 >= 5)
      const atExpirationContext: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 5
      };
      
      const expiredResult = await engine.transitionStateMachine(
        instance,
        'expire',
        {},
        atExpirationContext
      );
      
      expect(expiredResult.success).toBe(true);
      expect(expiredResult.newState).toBe('expired');
      
      // Try operation on expired collectible (should fail - expired is final)
      const expiredOperationContext: StateMachineContext = {
        state: expiredResult.newStateData,
        event: { to: '0xrecipient' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 6
      };
      
      instance.currentState = expiredResult.newState;
      instance.stateData = expiredResult.newStateData;
      
      const expiredOpResult = await engine.transitionStateMachine(
        instance,
        'transfer',
        { to: '0xrecipient' },
        expiredOperationContext
      );
      
      expect(expiredOpResult.success).toBe(false);
      expect(expiredOpResult.reason).toContain('final');
    });

    it('SHOULD FAIL: should handle burn operation to final state', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'sports-nft-007',
        sport: 'golf',
        playerName: 'Tiger Woods',
        rarity: 'rare',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // Burn the collectible
      const burnContext: StateMachineContext = {
        state: instance.stateData,
        event: {},
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 1
      };
      
      const burnResult = await engine.transitionStateMachine(
        instance,
        'burn',
        {},
        burnContext
      );
      
      expect(burnResult.success).toBe(true);
      expect(burnResult.newState).toBe('burned');
      
      // Verify burned state is final
      expect(instance.definition.states.burned.isFinal).toBe(true);
      
      // Try operation on burned collectible (should fail)
      const burnedOperationContext: StateMachineContext = {
        state: burnResult.newStateData,
        event: { to: '0xrecipient' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 2
      };
      
      instance.currentState = burnResult.newState;
      instance.stateData = burnResult.newStateData;
      
      const burnedOpResult = await engine.transitionStateMachine(
        instance,
        'transfer',
        { to: '0xrecipient' },
        burnedOperationContext
      );
      
      expect(burnedOpResult.success).toBe(false);
    });
  });

  describe('Complex Lifecycle: Game Character with Delegation', () => {
    
    it('SHOULD FAIL: should create game character with leveling system', async () => {
      const engine = new DelegationStateMachine();
      
      const characterData: GameCharacterData = {
        ownerAddress: '0xplayer',
        characterId: 'char-001',
        level: 1,
        experience: 0,
        attributes: { strength: 10, agility: 8, intelligence: 12 },
        gameAddress: '0xgame'
      };
      
      const instance = await engine.createGameCharacter(characterData);
      
      expect(instance.currentState).toBe('active');
      expect(instance.stateData.level).toBe(1);
      expect(instance.stateData.experience).toBe(0);
      expect(instance.stateData.attributes).toEqual({ strength: 10, agility: 8, intelligence: 12 });
    });

    it('SHOULD FAIL: should handle experience gain and level up with delegation', async () => {
      const engine = new DelegationStateMachine();
      
      const characterData: GameCharacterData = {
        ownerAddress: '0xplayer',
        characterId: 'char-002',
        level: 1,
        experience: 80,
        attributes: { strength: 10, agility: 8, intelligence: 12 },
        gameAddress: '0xgame'
      };
      
      const instance = await engine.createGameCharacter(characterData);
      
      // Setup delegation for game to manage character
      const delegationConfig: DelegationConfig = {
        delegator: '0xplayer',
        relayer: '0xgame',
        scope: ['gain_experience', 'level_up'],
        spendLimit: 0, // No spend limit for experience actions
        expiresAt: 2000,
        sessionKey: '0xgamesession'
      };
      
      await engine.enableDelegation(instance, delegationConfig);
      
      // Game awards experience (through delegation)
      const expContext: StateMachineContext = {
        state: instance.stateData,
        event: { experienceGained: 30 }, // 80 + 30 = 110, should trigger level up (assuming 100 exp per level)
        proofs: [{ address: '0xgame' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['gain_experience', 'level_up'],
          spendLimit: 0,
          spendUsed: 0,
          spendRemaining: 0,
          delegator: '0xplayer',
          relayer: '0xgame',
          sessionKey: '0xgamesession',
          bondedStake: 100
        }
      };
      
      const expResult = await engine.transitionStateMachine(
        instance,
        'gain_experience',
        { experienceGained: 30 },
        expContext
      );
      
      expect(expResult.success).toBe(true);
      expect(expResult.newStateData.experience).toBe(110);
      expect(expResult.newStateData.level).toBe(2); // Should level up
      expect(expResult.newStateData.leveledUp).toBe(true);
    });

    it('SHOULD FAIL: should handle character equipment and attribute updates', async () => {
      const engine = new DelegationStateMachine();
      
      const characterData: GameCharacterData = {
        ownerAddress: '0xplayer',
        characterId: 'char-003',
        level: 5,
        experience: 500,
        attributes: { strength: 15, agility: 12, intelligence: 18 },
        gameAddress: '0xgame'
      };
      
      const instance = await engine.createGameCharacter(characterData);
      
      // Player equips new item (direct action, not delegated)
      const equipContext: StateMachineContext = {
        state: instance.stateData,
        event: {
          itemId: 'sword-of-power',
          attributeBonus: { strength: 5, agility: 2 }
        },
        proofs: [{ address: '0xplayer' }],
        sequenceNumber: 1
      };
      
      const equipResult = await engine.transitionStateMachine(
        instance,
        'equip_item',
        {
          itemId: 'sword-of-power',
          attributeBonus: { strength: 5, agility: 2 }
        },
        equipContext
      );
      
      expect(equipResult.success).toBe(true);
      expect(equipResult.newStateData.equippedItems).toContain('sword-of-power');
      expect(equipResult.newStateData.attributes.strength).toBe(20); // 15 + 5
      expect(equipResult.newStateData.attributes.agility).toBe(14); // 12 + 2
      expect(equipResult.newStateData.attributes.intelligence).toBe(18); // Unchanged
    });

    it('SHOULD FAIL: should handle character retirement to final state', async () => {
      const engine = new DelegationStateMachine();
      
      const characterData: GameCharacterData = {
        ownerAddress: '0xplayer',
        characterId: 'char-004',
        level: 50,
        experience: 50000,
        attributes: { strength: 100, agility: 80, intelligence: 120 },
        gameAddress: '0xgame'
      };
      
      const instance = await engine.createGameCharacter(characterData);
      
      // Player retires character
      const retireContext: StateMachineContext = {
        state: instance.stateData,
        event: { reason: 'Max level reached' },
        proofs: [{ address: '0xplayer' }],
        sequenceNumber: 1
      };
      
      const retireResult = await engine.transitionStateMachine(
        instance,
        'retire',
        { reason: 'Max level reached' },
        retireContext
      );
      
      expect(retireResult.success).toBe(true);
      expect(retireResult.newState).toBe('retired');
      expect(retireResult.newStateData.retiredAt).toBe(1);
      expect(retireResult.newStateData.retireReason).toBe('Max level reached');
      
      // Verify retired state is final
      expect(instance.definition.states.retired.isFinal).toBe(true);
    });
  });

  describe('Anti-Patterns and Edge Cases', () => {
    
    it('SHOULD FAIL: should prevent self-purchase in marketplace', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'anti-pattern-001',
        sport: 'basketball',
        playerName: 'Michael Jordan',
        rarity: 'legendary',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // List the item first
      const listContext: StateMachineContext = {
        state: instance.stateData,
        event: { askingPrice: 5000, currency: 'DAG' },
        proofs: [{ address: '0xowner' }],
        sequenceNumber: 1
      };
      
      const listResult = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 5000, currency: 'DAG' },
        listContext
      );
      
      expect(listResult.success).toBe(true);
      
      // Try to purchase own item (should fail)
      const selfPurchaseContext: StateMachineContext = {
        state: listResult.newStateData,
        event: { buyer: '0xowner', price: 5000, currency: 'DAG' },
        proofs: [{ address: '0xowner' }], // Same as owner
        sequenceNumber: 2
      };
      
      instance.currentState = listResult.newState;
      instance.stateData = listResult.newStateData;
      
      const selfPurchaseResult = await engine.transitionStateMachine(
        instance,
        'purchase',
        { buyer: '0xowner', price: 5000, currency: 'DAG' },
        selfPurchaseContext
      );
      
      expect(selfPurchaseResult.success).toBe(false);
      expect(selfPurchaseResult.reason).toContain('Cannot purchase own item');
    });

    it('SHOULD FAIL: should validate purchase price matches listing price', async () => {
      const engine = new DelegationStateMachine();
      
      const collectibleData: CollectibleData = {
        ownerAddress: '0xseller',
        tokenId: 'price-validation-001',
        sport: 'football',
        playerName: 'Joe Montana',
        rarity: 'rare',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // List the item
      const listContext: StateMachineContext = {
        state: instance.stateData,
        event: { askingPrice: 1500, currency: 'DAG' },
        proofs: [{ address: '0xseller' }],
        sequenceNumber: 1
      };
      
      const listResult = await engine.transitionStateMachine(
        instance,
        'list',
        { askingPrice: 1500, currency: 'DAG' },
        listContext
      );
      
      expect(listResult.success).toBe(true);
      
      // Try to purchase with wrong price
      const wrongPriceContext: StateMachineContext = {
        state: listResult.newStateData,
        event: { buyer: '0xbuyer', price: 1000, currency: 'DAG' }, // Lower than asking price
        proofs: [{ address: '0xbuyer' }],
        sequenceNumber: 2
      };
      
      instance.currentState = listResult.newState;
      instance.stateData = listResult.newStateData;
      
      const wrongPriceResult = await engine.transitionStateMachine(
        instance,
        'purchase',
        { buyer: '0xbuyer', price: 1000, currency: 'DAG' },
        wrongPriceContext
      );
      
      expect(wrongPriceResult.success).toBe(false);
      expect(wrongPriceResult.reason).toContain('Price mismatch');
    });

    it('SHOULD FAIL: should prevent state explosion with proper state design', async () => {
      const engine = new DelegationStateMachine();
      
      // This test verifies that the state machine definition doesn't have excessive states
      const collectibleData: CollectibleData = {
        ownerAddress: '0xowner',
        tokenId: 'state-explosion-test',
        sport: 'tennis',
        playerName: 'Roger Federer',
        rarity: 'common',
        expiresAtSequence: 1000,
        validatorAddress: '0xvalidator'
      };
      
      const instance = await engine.createDigitalSportsCollectible(collectibleData);
      
      // Verify reasonable number of states (should be < 10 for a simple collectible)
      const stateCount = Object.keys(instance.definition.states).length;
      expect(stateCount).toBeLessThan(10);
      
      // Verify no circular transitions
      const transitions = instance.definition.transitions;
      for (const transition of transitions) {
        if (transition.from.value === transition.to.value) {
          // Self-loops are allowed but should be intentional (like update operations)
          expect(['update', 'gain_experience', 'modify'].some(op => 
            transition.eventName.includes(op)
          )).toBe(true);
        }
      }
    });

    it('SHOULD FAIL: should handle concurrent delegation operations safely', async () => {
      const engine = new DelegationStateMachine();
      
      const characterData: GameCharacterData = {
        ownerAddress: '0xplayer',
        characterId: 'concurrent-test',
        level: 1,
        experience: 90,
        attributes: { strength: 10, agility: 8, intelligence: 12 },
        gameAddress: '0xgame'
      };
      
      const instance = await engine.createGameCharacter(characterData);
      
      // Setup delegation
      const delegationConfig: DelegationConfig = {
        delegator: '0xplayer',
        relayer: '0xgame',
        scope: ['gain_experience'],
        spendLimit: 0,
        expiresAt: 2000,
        sessionKey: '0xgamesession'
      };
      
      await engine.enableDelegation(instance, delegationConfig);
      
      // Simulate concurrent experience gain operations
      const context1: StateMachineContext = {
        state: instance.stateData,
        event: { experienceGained: 15 }, // Would result in 105 total
        proofs: [{ address: '0xgame' }],
        sequenceNumber: 1,
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['gain_experience'],
          spendLimit: 0,
          spendUsed: 0,
          spendRemaining: 0,
          delegator: '0xplayer',
          relayer: '0xgame',
          sessionKey: '0xgamesession',
          bondedStake: 100
        }
      };
      
      const context2: StateMachineContext = {
        state: instance.stateData,
        event: { experienceGained: 20 }, // Would result in 110 total
        proofs: [{ address: '0xgame' }],
        sequenceNumber: 1, // Same sequence number - simulating concurrency
        delegation: {
          active: true,
          expiresAt: 2000,
          scope: ['gain_experience'],
          spendLimit: 0,
          spendUsed: 0,
          spendRemaining: 0,
          delegator: '0xplayer',
          relayer: '0xgame',
          sessionKey: '0xgamesession',
          bondedStake: 100
        }
      };
      
      // Execute both transitions
      const results = await Promise.allSettled([
        engine.transitionStateMachine(instance, 'gain_experience', { experienceGained: 15 }, context1),
        engine.transitionStateMachine(instance, 'gain_experience', { experienceGained: 20 }, context2)
      ]);
      
      // Only one should succeed due to sequence number conflict
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      expect(successful + failed).toBe(2);
      // In a properly implemented system, sequence number validation should prevent both from succeeding
      expect(successful).toBeLessThanOrEqual(1);
    });
  });
});