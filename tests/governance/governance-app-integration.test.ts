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

  it('all governance definitions should have at least one final state (DISSOLVED)', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
    ];
    for (const def of defs) {
      const finalStates = Object.values(def.states).filter((s: { isFinal: boolean }) => s.isFinal);
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

  it('all governance definitions should use TypeScript defineFiberApp pattern', () => {
    const defs = [
      govUniversalDef,
      govSimpleDef,
      daoSingleDef,
      daoMultisigDef,
      daoTokenDef,
      daoReputationDef,
    ];
    for (const def of defs) {
      // defineFiberApp returns an object with createSchema and stateSchema
      expect(def.createSchema).toBeDefined();
      expect(def.stateSchema).toBeDefined();
      expect(def.eventSchemas).toBeDefined();
    }
  });
});
