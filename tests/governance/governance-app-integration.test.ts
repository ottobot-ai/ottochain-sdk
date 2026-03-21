/**
 * Integration tests for the governance app
 */

import {
  govUniversalDef,
  govSimpleDef,
  daoSingleDef,
  daoMultisigDef,
  daoTokenDef,
  daoReputationDef,
} from '../../src/apps/governance/state-machines';

import {
  GOVERNANCE_DEFINITIONS,
  getGovernanceDefinition,
  getDAODefinition,
} from '../../src/apps/governance';

describe('Governance App Integration', () => {
  it('should export all 6 governance state machines from state-machines index', () => {
    expect(govUniversalDef).toBeDefined();
    expect(govSimpleDef).toBeDefined();
    expect(daoSingleDef).toBeDefined();
    expect(daoMultisigDef).toBeDefined();
    expect(daoTokenDef).toBeDefined();
    expect(daoReputationDef).toBeDefined();
  });

  it('should export all governance types from GOVERNANCE_DEFINITIONS', () => {
    expect(GOVERNANCE_DEFINITIONS.universal).toBeDefined();
    expect(GOVERNANCE_DEFINITIONS.simple).toBeDefined();
    expect(GOVERNANCE_DEFINITIONS.daoSingle).toBeDefined();
    expect(GOVERNANCE_DEFINITIONS.daoMultisig).toBeDefined();
    expect(GOVERNANCE_DEFINITIONS.daoToken).toBeDefined();
    expect(GOVERNANCE_DEFINITIONS.daoReputation).toBeDefined();
  });

  it('should get governance definition by type', () => {
    expect(getGovernanceDefinition('universal')).toBe(govUniversalDef);
    expect(getGovernanceDefinition('simple')).toBe(govSimpleDef);
    expect(getGovernanceDefinition('daoSingle')).toBe(daoSingleDef);
    expect(getGovernanceDefinition('daoMultisig')).toBe(daoMultisigDef);
    expect(getGovernanceDefinition('daoToken')).toBe(daoTokenDef);
    expect(getGovernanceDefinition('daoReputation')).toBe(daoReputationDef);
  });

  it('should support deprecated getDAODefinition', () => {
    expect(getDAODefinition('Single')).toBe(daoSingleDef);
    expect(getDAODefinition('Multisig')).toBe(daoMultisigDef);
    expect(getDAODefinition('Token')).toBe(daoTokenDef);
    expect(getDAODefinition('Threshold')).toBe(daoReputationDef);
  });

  it('all governance definitions should have required base fields', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
    ];
    for (const def of defs) {
      expect(def.metadata).toBeDefined();
      expect(def.metadata.name).toBeTruthy();
      expect(def.states).toBeDefined();
      expect(def.initialState).toBeTruthy();
      expect(Array.isArray(def.transitions)).toBe(true);
    }
  });

  it('all governance definitions should have at least one final state', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
    ];
    for (const def of defs) {
      const finalStates = Object.values(def.states).filter(
        (s: { isFinal: boolean }) => s.isFinal
      );
      expect(finalStates.length).toBeGreaterThan(0);
    }
  });

  it('all transitions should have non-empty event names', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
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

  it('all DAO definitions should have governance/dao category', () => {
    const daoDefs = [daoSingleDef, daoMultisigDef, daoTokenDef, daoReputationDef];
    for (const def of daoDefs) {
      expect(def.metadata.category).toBe('governance/dao');
    }
  });

  it('all DAO definitions should have version 1.0.0', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
    ];
    for (const def of defs) {
      expect(def.metadata.version).toBe('1.0.0');
    }
  });

  it('DAO definitions should have cross-references', () => {
    const daoDefs = [daoSingleDef, daoMultisigDef, daoTokenDef, daoReputationDef];
    for (const def of daoDefs) {
      expect(def.crossReferences).toBeDefined();
      expect(def.crossReferences).toHaveProperty('Identity');
    }
  });

  describe('State Machine Consistency', () => {
    it('all initial states should exist in states object', () => {
      const defs = [
        govUniversalDef,
        govSimpleDef,
        daoSingleDef,
        daoMultisigDef,
        daoTokenDef,
        daoReputationDef,
      ];
      for (const def of defs) {
        expect(def.states).toHaveProperty(def.initialState);
      }
    });

    it('all transition from/to states should exist in states object', () => {
      const defs = [
        govUniversalDef,
        govSimpleDef,
        daoSingleDef,
        daoMultisigDef,
        daoTokenDef,
        daoReputationDef,
      ];
      for (const def of defs) {
        const stateNames = Object.keys(def.states);
        for (const t of def.transitions) {
          expect(stateNames).toContain(t.from);
          expect(stateNames).toContain(t.to);
        }
      }
    });

    it('initial states should not be final', () => {
      const defs = [
        govUniversalDef,
        govSimpleDef,
        daoSingleDef,
        daoMultisigDef,
        daoTokenDef,
        daoReputationDef,
      ];
      for (const def of defs) {
        const initialState = def.states[def.initialState as keyof typeof def.states];
        expect(initialState.isFinal).toBe(false);
      }
    });
  });

  describe('Naming Conventions', () => {
    it('should use UPPER_CASE state names', () => {
      const defs = [
        govUniversalDef,
        govSimpleDef,
        daoSingleDef,
        daoMultisigDef,
        daoTokenDef,
        daoReputationDef,
      ];
      for (const def of defs) {
        for (const state of Object.keys(def.states)) {
          expect(state).toMatch(/^[A-Z_]+$/);
        }
      }
    });

    it('should use snake_case event names', () => {
      const defs = [
        govUniversalDef,
        govSimpleDef,
        daoSingleDef,
        daoMultisigDef,
        daoTokenDef,
        daoReputationDef,
      ];
      for (const def of defs) {
        for (const t of def.transitions) {
          expect(t.eventName).toMatch(/^[a-z_]+$/);
        }
      }
    });
  });
});
