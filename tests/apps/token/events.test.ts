/**
 * TDD Tests for Token Event Builders and Validators
 * 
 * Tests for type-safe event construction and validation utilities.
 * Based on specification: docs/design/asset-model-token-spec.md § 6.3
 */

import {
  BurnEvent,
  ExpireEvent,
  MergeEvent,
  SplitEvent,
  TokenEvent,
  TransferEvent,
  createBurnEvent,
  createExpireEvent,
  createMergeEvent,
  createSplitEvent,
  createTransferEvent,
  validateTokenEvent,
} from '../../../src/apps/token';

describe('Token Event Builders and Validators', () => {
  
  describe('Event Validation Logic', () => {
    test('validateTokenEvent throws for transfer on soulbound token (T=0)', () => {
      const transferEvent: TransferEvent = {
        eventName: 'transfer',
        fiberId: 'test-fiber',
        recipient: 'test-recipient'
      };
      
      expect(() => {
        validateTokenEvent(transferEvent, 0); // Soulbound receipt (T=0)
      }).toThrow(/transfer is illegal for soulbound token/);
    });

    test('validateTokenEvent allows transfer on transferable token (T=1)', () => {
      const transferEvent: TransferEvent = {
        eventName: 'transfer',
        fiberId: 'test-fiber',
        recipient: 'test-recipient'
      };
      
      expect(() => {
        validateTokenEvent(transferEvent, 8); // NFT (T=1)
      }).not.toThrow();
    });

    test('validateTokenEvent throws for split on indivisible token (D=0)', () => {
      const splitEvent: SplitEvent = {
        eventName: 'split',
        fiberId: 'test-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(splitEvent, 8); // NFT (D=0)
      }).toThrow(/split is illegal for indivisible token/);
    });

    test('validateTokenEvent allows split on divisible token (D=1)', () => {
      const splitEvent: SplitEvent = {
        eventName: 'split',
        fiberId: 'test-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(splitEvent, 12); // Fungible token (D=1)
      }).not.toThrow();
    });

    test('validateTokenEvent throws for merge on indivisible token (D=0)', () => {
      const mergeEvent: MergeEvent = {
        eventName: 'merge',
        fiberId: 'test-fiber',
        sourceFiberId: 'source-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(mergeEvent, 8); // NFT (D=0)
      }).toThrow(/merge is illegal for indivisible token/);
    });

    test('validateTokenEvent allows merge on divisible token (D=1)', () => {
      const mergeEvent: MergeEvent = {
        eventName: 'merge',
        fiberId: 'test-fiber',
        sourceFiberId: 'source-fiber',
        amount: 100
      };
      
      expect(() => {
        validateTokenEvent(mergeEvent, 12); // Fungible token (D=1)
      }).not.toThrow();
    });

    test('validateTokenEvent allows burn on all token types (universal)', () => {
      const burnEvent: BurnEvent = {
        eventName: 'burn',
        fiberId: 'test-fiber'
      };
      
      // Test on several different behavior types
      [0, 5, 8, 12, 15].forEach(behavior => {
        expect(() => {
          validateTokenEvent(burnEvent, behavior);
        }).not.toThrow();
      });
    });

    test('validateTokenEvent allows expire on all token types (manual trigger)', () => {
      const expireEvent: ExpireEvent = {
        eventName: 'expire',
        fiberId: 'test-fiber'
      };
      
      // Expire should be allowed on all types - guard logic handles E flag
      [0, 2, 8, 10].forEach(behavior => {
        expect(() => {
          validateTokenEvent(expireEvent, behavior);
        }).not.toThrow();
      });
    });
  });

  describe('Event Builder Functions', () => {
    test('createTransferEvent builds valid TransferEvent structure', () => {
      const result = createTransferEvent('test-fiber', 'recipient-address');
      
      expect(result.eventName).toBe('transfer');
      expect(result.fiberId).toBe('test-fiber');
      expect(result.recipient).toBe('recipient-address');
      expect(result.amount).toBeUndefined();
    });

    test('createTransferEvent with amount builds valid TransferEvent for divisible tokens', () => {
      const result = createTransferEvent('test-fiber', 'recipient-address', 250);
      
      expect(result.eventName).toBe('transfer');
      expect(result.fiberId).toBe('test-fiber');
      expect(result.recipient).toBe('recipient-address');
      expect(result.amount).toBe(250);
    });

    test('createSplitEvent builds valid SplitEvent structure', () => {
      const result = createSplitEvent('test-fiber', 100);
      
      expect(result.eventName).toBe('split');
      expect(result.fiberId).toBe('test-fiber');
      expect(result.amount).toBe(100);
      expect(result.childFiberId).toBeUndefined();
    });

    test('createSplitEvent with childFiberId builds valid SplitEvent', () => {
      const result = createSplitEvent('test-fiber', 100, 'child-fiber-id');
      
      expect(result.eventName).toBe('split');
      expect(result.fiberId).toBe('test-fiber');
      expect(result.amount).toBe(100);
      expect(result.childFiberId).toBe('child-fiber-id');
    });

    test('createMergeEvent builds valid MergeEvent structure', () => {
      const result = createMergeEvent('target-fiber', 'source-fiber', 150);
      
      expect(result.eventName).toBe('merge');
      expect(result.fiberId).toBe('target-fiber');
      expect(result.sourceFiberId).toBe('source-fiber');
      expect(result.amount).toBe(150);
    });

    test('createExpireEvent builds valid ExpireEvent structure', () => {
      const result = createExpireEvent('test-fiber');
      
      expect(result.eventName).toBe('expire');
      expect(result.fiberId).toBe('test-fiber');
    });

    test('createBurnEvent builds valid BurnEvent structure', () => {
      const result = createBurnEvent('test-fiber');
      
      expect(result.eventName).toBe('burn');
      expect(result.fiberId).toBe('test-fiber');
    });
  });

  describe('Event Type Discrimination', () => {
    test('Event objects can be discriminated by eventName', () => {
      const events: TokenEvent[] = [
        createTransferEvent('fiber1', 'recipient'),
        createSplitEvent('fiber2', 100),
        createMergeEvent('fiber3', 'source', 50),
        createExpireEvent('fiber4'),
        createBurnEvent('fiber5')
      ];
      
      const transferEvents = events.filter(e => e.eventName === 'transfer');
      const splitEvents = events.filter(e => e.eventName === 'split');
      const mergeEvents = events.filter(e => e.eventName === 'merge');
      const expireEvents = events.filter(e => e.eventName === 'expire');
      const burnEvents = events.filter(e => e.eventName === 'burn');
      
      expect(transferEvents).toHaveLength(1);
      expect(splitEvents).toHaveLength(1);
      expect(mergeEvents).toHaveLength(1);
      expect(expireEvents).toHaveLength(1);
      expect(burnEvents).toHaveLength(1);
    });
  });

  describe('Input Validation (edge cases)', () => {
    test('validateTokenEvent handles unknown event names gracefully', () => {
      const unknownEvent = {
        eventName: 'unknown-event',
        fiberId: 'test-fiber'
      } as unknown as TokenEvent;
      
      expect(() => {
        validateTokenEvent(unknownEvent, 8);
      }).not.toThrow(); // Unknown events should be allowed - guard logic will handle
    });

    test('Event builders reject invalid input parameters', () => {
      expect(() => {
        createTransferEvent('', 'recipient'); // Empty fiberId
      }).toThrow();
      
      expect(() => {
        createTransferEvent('fiber', ''); // Empty recipient
      }).toThrow();
      
      expect(() => {
        createSplitEvent('fiber', 0); // Zero amount
      }).toThrow();
      
      expect(() => {
        createSplitEvent('fiber', -100); // Negative amount
      }).toThrow();
      
      expect(() => {
        createMergeEvent('', 'source', 100); // Empty fiberId
      }).toThrow();
      
      expect(() => {
        createMergeEvent('fiber', '', 100); // Empty sourceFiberId
      }).toThrow();
    });
  });
});
