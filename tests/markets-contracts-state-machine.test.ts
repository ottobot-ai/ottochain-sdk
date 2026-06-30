/**
 * Tests for markets and contracts state machine schema helpers.
 * Covers getTransitionsFrom, getEventsFrom, isFinalState, toJSON for market and contract definitions.
 * Also covers helper functions like getMarketDefinition and MARKETS_DEFINITIONS.
 */
import { describe, expect, it } from '@jest/globals';
import { getTransitionsFrom, getEventsFrom, isFinalState, toJSON } from '../src/schema/fiber-app.js';
import {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef,
} from '../src/apps/markets/state-machines/index.js';
import {
  contractAgreementDef,
  contractEscrowDef,
  contractUniversalDef,
} from '../src/apps/contracts/state-machines/index.js';
import { getMarketDefinition, MARKETS_DEFINITIONS } from '../src/apps/markets/index.js';
import { getIdentityDefinition, IDENTITY_DEFINITIONS as APP_IDENTITY_DEFINITIONS } from '../src/apps/identity/index.js';
import {
  identityAgentDef,
  identityOracleDef,
  identityUniversalDef,
} from '../src/apps/identity/state-machines/index.js';
import { getContractDefinition, CONTRACTS_DEFINITIONS } from '../src/apps/contracts/index.js';

describe('markets state machine schema helpers', () => {
  describe('marketUniversalDef', () => {
    const def = marketUniversalDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from PROPOSED state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns transitions from OPEN state', () => {
        const transitions = getTransitionsFrom(def, 'OPEN' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns empty array for unknown state', () => {
        const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(transitions).toEqual([]);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names for PROPOSED state', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events.every((e) => typeof e === 'string')).toBe(true);
        expect(events).toContain('open');
      });

      it('returns event names for OPEN state', () => {
        const events = getEventsFrom(def, 'OPEN' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events).toContain('commit');
      });

      it('returns empty array for unknown state', () => {
        const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(events).toEqual([]);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state PROPOSED', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });

      it('returns false for non-final state OPEN', () => {
        expect(isFinalState(def, 'OPEN' as any)).toBe(false);
      });

      it('returns true for final state SETTLED', () => {
        expect(isFinalState(def, 'SETTLED' as any)).toBe(true);
      });

      it('returns true for final state CANCELLED', () => {
        expect(isFinalState(def, 'CANCELLED' as any)).toBe(true);
      });

      it('returns false for undefined state', () => {
        expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('returns a plain object', () => {
        const json = toJSON(def);
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });

      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });

      it('deep-equals the original definition', () => {
        const json = toJSON(def);
        expect(JSON.stringify(json)).toBe(JSON.stringify(def));
      });
    });
  });

  describe('marketPredictionDef', () => {
    const def = marketPredictionDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from PROPOSED state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns empty array for unknown state', () => {
        const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(transitions).toEqual([]);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names for PROPOSED state', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events.every((e) => typeof e === 'string')).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(events).toEqual([]);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state PROPOSED', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });

      it('returns false for undefined state', () => {
        expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('returns a plain object', () => {
        const json = toJSON(def);
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });

      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });
  });

  describe('marketAuctionDef', () => {
    const def = marketAuctionDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from initial state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names array', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });
  });

  describe('marketCrowdfundDef', () => {
    const def = marketCrowdfundDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from initial state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names array', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });
  });

  describe('marketGroupBuyDef', () => {
    const def = marketGroupBuyDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from initial state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names array', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });
  });
});

describe('contracts state machine schema helpers', () => {
  describe('contractAgreementDef', () => {
    const def = contractAgreementDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from PROPOSED state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns transitions from ACTIVE state', () => {
        const transitions = getTransitionsFrom(def, 'ACTIVE' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns empty array for unknown state', () => {
        const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(transitions).toEqual([]);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names for PROPOSED state', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events.every((e) => typeof e === 'string')).toBe(true);
        expect(events).toContain('accept');
      });

      it('returns event names for ACTIVE state', () => {
        const events = getEventsFrom(def, 'ACTIVE' as any);
        expect(Array.isArray(events)).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(events).toEqual([]);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state PROPOSED', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });

      it('returns false for non-final state ACTIVE', () => {
        expect(isFinalState(def, 'ACTIVE' as any)).toBe(false);
      });

      it('returns true for final state COMPLETED', () => {
        expect(isFinalState(def, 'COMPLETED' as any)).toBe(true);
      });

      it('returns true for final state REJECTED', () => {
        expect(isFinalState(def, 'REJECTED' as any)).toBe(true);
      });

      it('returns true for final state CANCELLED', () => {
        expect(isFinalState(def, 'CANCELLED' as any)).toBe(true);
      });

      it('returns false for undefined state', () => {
        expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('returns a plain object', () => {
        const json = toJSON(def);
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });

      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });

      it('deep-equals the original definition', () => {
        const json = toJSON(def);
        expect(JSON.stringify(json)).toBe(JSON.stringify(def));
      });
    });
  });

  describe('contractEscrowDef', () => {
    const def = contractEscrowDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from CREATED state', () => {
        const transitions = getTransitionsFrom(def, 'CREATED' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns transitions from FUNDED state', () => {
        const transitions = getTransitionsFrom(def, 'FUNDED' as any);
        expect(Array.isArray(transitions)).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(transitions).toEqual([]);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names for CREATED state', () => {
        const events = getEventsFrom(def, 'CREATED' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events.every((e) => typeof e === 'string')).toBe(true);
        expect(events).toContain('deposit');
      });

      it('returns event names for ACTIVE state', () => {
        const events = getEventsFrom(def, 'ACTIVE' as any);
        expect(Array.isArray(events)).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(events).toEqual([]);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state CREATED', () => {
        expect(isFinalState(def, 'CREATED' as any)).toBe(false);
      });

      it('returns false for non-final state ACTIVE', () => {
        expect(isFinalState(def, 'ACTIVE' as any)).toBe(false);
      });

      it('returns true for final state RELEASED', () => {
        expect(isFinalState(def, 'RELEASED' as any)).toBe(true);
      });

      it('returns true for final state REFUNDED', () => {
        expect(isFinalState(def, 'REFUNDED' as any)).toBe(true);
      });

      it('returns false for undefined state', () => {
        expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('returns a plain object', () => {
        const json = toJSON(def);
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });

      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });

      it('deep-equals the original definition', () => {
        const json = toJSON(def);
        expect(JSON.stringify(json)).toBe(JSON.stringify(def));
      });
    });
  });

  describe('contractUniversalDef', () => {
    const def = contractUniversalDef;

    describe('getTransitionsFrom', () => {
      it('returns transitions from PROPOSED state', () => {
        const transitions = getTransitionsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(transitions)).toBe(true);
        expect(transitions.length).toBeGreaterThan(0);
      });

      it('returns transitions from ACTIVE state', () => {
        const transitions = getTransitionsFrom(def, 'ACTIVE' as any);
        expect(Array.isArray(transitions)).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const transitions = getTransitionsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(transitions).toEqual([]);
      });
    });

    describe('getEventsFrom', () => {
      it('returns event names for PROPOSED state', () => {
        const events = getEventsFrom(def, 'PROPOSED' as any);
        expect(Array.isArray(events)).toBe(true);
        expect(events.every((e) => typeof e === 'string')).toBe(true);
      });

      it('returns event names for ACTIVE state', () => {
        const events = getEventsFrom(def, 'ACTIVE' as any);
        expect(Array.isArray(events)).toBe(true);
      });

      it('returns empty array for unknown state', () => {
        const events = getEventsFrom(def, 'NONEXISTENT_STATE' as any);
        expect(events).toEqual([]);
      });
    });

    describe('isFinalState', () => {
      it('returns false for non-final state PROPOSED', () => {
        expect(isFinalState(def, 'PROPOSED' as any)).toBe(false);
      });

      it('returns false for non-final state ACTIVE', () => {
        expect(isFinalState(def, 'ACTIVE' as any)).toBe(false);
      });

      it('returns true for final state COMPLETED', () => {
        expect(isFinalState(def, 'COMPLETED' as any)).toBe(true);
      });

      it('returns true for final state CANCELLED', () => {
        expect(isFinalState(def, 'CANCELLED' as any)).toBe(true);
      });

      it('returns false for undefined state', () => {
        expect(isFinalState(def, 'NONEXISTENT' as any)).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('returns a plain object', () => {
        const json = toJSON(def);
        expect(typeof json).toBe('object');
        expect(json).not.toBeNull();
      });

      it('result is JSON-serializable', () => {
        const json = toJSON(def);
        expect(() => JSON.stringify(json)).not.toThrow();
      });

      it('deep-equals the original definition', () => {
        const json = toJSON(def);
        expect(JSON.stringify(json)).toBe(JSON.stringify(def));
      });
    });
  });
});

describe('definition helper functions', () => {
  describe('getMarketDefinition', () => {
    it('returns universal definition by default', () => {
      const def = getMarketDefinition();
      expect(def).toBe(marketUniversalDef);
    });

    it('returns prediction definition', () => {
      const def = getMarketDefinition('prediction');
      expect(def).toBe(marketPredictionDef);
    });

    it('returns auction definition', () => {
      const def = getMarketDefinition('auction');
      expect(def).toBe(marketAuctionDef);
    });

    it('returns crowdfund definition', () => {
      const def = getMarketDefinition('crowdfund');
      expect(def).toBe(marketCrowdfundDef);
    });

    it('returns groupBuy definition', () => {
      const def = getMarketDefinition('groupBuy');
      expect(def).toBe(marketGroupBuyDef);
    });
  });

  describe('MARKETS_DEFINITIONS', () => {
    it('contains all market types', () => {
      expect(MARKETS_DEFINITIONS.universal).toBe(marketUniversalDef);
      expect(MARKETS_DEFINITIONS.prediction).toBe(marketPredictionDef);
      expect(MARKETS_DEFINITIONS.auction).toBe(marketAuctionDef);
      expect(MARKETS_DEFINITIONS.crowdfund).toBe(marketCrowdfundDef);
      expect(MARKETS_DEFINITIONS.groupBuy).toBe(marketGroupBuyDef);
    });
  });

  describe('getContractDefinition', () => {
    it('returns agreement definition by default', () => {
      const def = getContractDefinition();
      expect(def).toBe(contractAgreementDef);
    });

    it('returns escrow definition', () => {
      const def = getContractDefinition('escrow');
      expect(def).toBe(contractEscrowDef);
    });

    it('returns universal definition', () => {
      const def = getContractDefinition('universal');
      expect(def).toBe(contractUniversalDef);
    });
  });

  describe('CONTRACTS_DEFINITIONS', () => {
    it('contains all contract types', () => {
      expect(CONTRACTS_DEFINITIONS.universal).toBe(contractUniversalDef);
      expect(CONTRACTS_DEFINITIONS.agreement).toBe(contractAgreementDef);
      expect(CONTRACTS_DEFINITIONS.escrow).toBe(contractEscrowDef);
    });
  });

  describe('getIdentityDefinition', () => {
    it('returns agent definition by default', () => {
      const def = getIdentityDefinition();
      expect(def).toBeDefined();
      expect((def as any).metadata.name).toBe('IdentityAgent');
    });

    it('returns oracle definition', () => {
      const def = getIdentityDefinition('oracle');
      expect(def).toBeDefined();
      expect((def as any).metadata.name).toBe('IdentityOracle');
    });

    it('returns universal definition', () => {
      const def = getIdentityDefinition('universal');
      expect(def).toBeDefined();
      expect((def as any).metadata.name).toBe('IdentityUniversal');
    });
  });

  describe('APP_IDENTITY_DEFINITIONS', () => {
    it('contains all identity types', () => {
      expect(APP_IDENTITY_DEFINITIONS.agent).toBeDefined();
      expect(APP_IDENTITY_DEFINITIONS.oracle).toBeDefined();
      expect(APP_IDENTITY_DEFINITIONS.universal).toBeDefined();
    });
  });

  describe('State machine definition direct exports', () => {
    it('identityAgentDef is defined', () => {
      expect(identityAgentDef).toBeDefined();
      expect(identityAgentDef.metadata.name).toBe('IdentityAgent');
    });

    it('identityOracleDef is defined', () => {
      expect(identityOracleDef).toBeDefined();
      expect(identityOracleDef.metadata.name).toBe('IdentityOracle');
    });

    it('identityUniversalDef is defined', () => {
      expect(identityUniversalDef).toBeDefined();
      expect(identityUniversalDef.metadata.name).toBe('IdentityUniversal');
    });
  });
});
