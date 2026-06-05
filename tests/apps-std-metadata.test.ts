/**
 * Standard per-state metadata convention for std apps.
 *
 * Every standard state-machine state must carry the { label, description,
 * category } block instead of `metadata: null`. A populated (non-null) metadata
 * object survives the client/server null-dropping canonicalization, so these
 * definitions sign/verify identically on both sides (unlike `metadata: null`,
 * which the chain drops and which previously broke signature verification).
 */

import { identity, governance, markets, contracts } from '../src/apps/index.js';
import type { FiberAppDefinition, StateCategory } from '../src/schema/fiber-app.js';

const VALID_CATEGORIES: StateCategory[] = ['initial', 'active', 'pending', 'terminal'];

// Collect every std-app definition we populated with standard state metadata.
const ALL_DEFS: Record<string, FiberAppDefinition> = {
  // identity
  identityUniversal: identity.identityUniversalDef,
  identityAgent: identity.identityAgentDef,
  identityOracle: identity.identityOracleDef,
  // governance
  govUniversal: governance.govUniversalDef,
  govSimple: governance.govSimpleDef,
  daoSingle: governance.daoSingleDef,
  daoMultisig: governance.daoMultisigDef,
  daoToken: governance.daoTokenDef,
  daoReputation: governance.daoReputationDef,
  // markets
  marketUniversal: markets.marketUniversalDef,
  marketPrediction: markets.marketPredictionDef,
  marketAuction: markets.marketAuctionDef,
  marketCrowdfund: markets.marketCrowdfundDef,
  marketGroupBuy: markets.marketGroupBuyDef,
  // contracts
  contractUniversal: contracts.contractUniversalDef,
  contractAgreement: contracts.contractAgreementDef,
  contractEscrow: contracts.contractEscrowDef,
};

describe('std-app standard state metadata', () => {
  for (const [name, def] of Object.entries(ALL_DEFS)) {
    describe(name, () => {
      it('has a non-null { label, description } block on every state', () => {
        const states = Object.entries(def.states);
        expect(states.length).toBeGreaterThan(0);
        for (const [stateId, state] of states) {
          // No state may be null (the chain drops null object-fields).
          expect(state.metadata).not.toBeNull();
          expect(state.metadata).toBeDefined();
          const meta = state.metadata as Record<string, unknown>;
          expect(typeof meta.label).toBe('string');
          expect((meta.label as string).length).toBeGreaterThan(0);
          expect(typeof meta.description).toBe('string');
          expect((meta.description as string).length).toBeGreaterThan(0);
          // category, when present, is from the fixed vocabulary.
          if (meta.category !== undefined) {
            expect(VALID_CATEGORIES).toContain(meta.category as StateCategory);
          }
          // Sanity: stateId matches the embedded id.
          expect(state.id).toBe(stateId);
        }
      });

      it('marks the initialState as category "initial" and final states as "terminal"', () => {
        const initial = def.states[def.initialState];
        expect((initial.metadata as Record<string, unknown>).category).toBe('initial');
        for (const state of Object.values(def.states)) {
          const category = (state.metadata as Record<string, unknown>).category;
          if (state.isFinal) {
            expect(category).toBe('terminal');
          } else {
            // non-final states are never 'terminal'
            expect(category).not.toBe('terminal');
          }
        }
      });
    });
  }
});
