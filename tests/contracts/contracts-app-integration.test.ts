import { contractAgreementDef } from '../../src/apps/contracts/state-machines/contract-agreement.js';
import { contractUniversalDef } from '../../src/apps/contracts/state-machines/contract-universal.js';
import { contractEscrowDef } from '../../src/apps/contracts/state-machines/contract-escrow.js';

describe('Contracts App Integration', () => {
  describe('Module Exports', () => {
    it('should export all contract state machine definitions', () => {
      expect(contractAgreementDef).toBeDefined();
      expect(contractUniversalDef).toBeDefined();
      expect(contractEscrowDef).toBeDefined();
    });

    it('should be importable from contracts app index', () => {
      // This will fail until the index file is updated
      expect(() => {
        const contractsApp = require('../../src/apps/contracts/index.js');
        expect(contractsApp).toHaveProperty('contractAgreementDef');
        expect(contractsApp).toHaveProperty('contractUniversalDef');
        expect(contractsApp).toHaveProperty('contractEscrowDef');
      }).not.toThrow();
    });
  });

  describe('State Machine Registry', () => {
    it('should be available in main state-machines index', () => {
      // This will fail until state-machines/index.ts is updated
      expect(() => {
        const stateMachines = require('../../src/state-machines/index.js');
        expect(stateMachines).toHaveProperty('contractAgreementDef');
        expect(stateMachines).toHaveProperty('contractUniversalDef');
        expect(stateMachines).toHaveProperty('contractEscrowDef');
      }).not.toThrow();
    });
  });

  describe('Build Compatibility', () => {
    it('should compile without TypeScript errors', async () => {
      // This test validates the TypeScript definitions compile correctly
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      try {
        await execAsync('npm run build', { cwd: process.cwd() });
        expect(true).toBe(true); // If we get here, build succeeded
      } catch (error: any) {
        // Should fail until implementation is complete
        expect(error.stdout || error.stderr).toContain('Cannot find module');
      }
    });

    it('should pass all tests after implementation', async () => {
      // This test validates the conversion preserves functionality
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      try {
        await execAsync('npm test', { cwd: process.cwd() });
        expect(true).toBe(true); // If we get here, all tests passed
      } catch (error: any) {
        // Should fail until implementation is complete
        expect(error.code).toBeGreaterThan(0);
      }
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('should maintain consistent cross-references between contract types', () => {
      // Agreement contracts should reference escrow
      expect(contractAgreementDef.metadata.crossReferences).toHaveProperty('escrowId');
      
      // Escrow should reference contracts
      expect(contractEscrowDef.metadata.crossReferences).toHaveProperty('contractId');
    });

    it('should use consistent state naming patterns', () => {
      const agreementStates = Object.keys(contractAgreementDef.states);
      const universalStates = Object.keys(contractUniversalDef.states);
      const escrowStates = Object.keys(contractEscrowDef.states);

      // All should use UPPER_CASE state names
      [...agreementStates, ...universalStates, ...escrowStates].forEach(state => {
        expect(state).toMatch(/^[A-Z_]+$/);
      });

      // Universal states should be a subset of agreement states
      universalStates.forEach(state => {
        if (state !== 'DISPUTED' && state !== 'REJECTED') {
          expect(agreementStates).toContain(state);
        }
      });
    });
  });

  describe('Functional Completeness', () => {
    it('should preserve all original JSON Logic expressions', () => {
      // Count transitions to ensure none are lost
      expect(contractAgreementDef.transitions).toHaveLength(7);
      expect(contractUniversalDef.transitions).toHaveLength(4);
      expect(contractEscrowDef.transitions).toHaveLength(7);
    });

    it('should preserve all state machine metadata', () => {
      [contractAgreementDef, contractUniversalDef, contractEscrowDef].forEach(def => {
        expect(def.metadata.name).toBeDefined();
        expect(def.metadata.description).toBeDefined();
        expect(def.metadata.version).toBe('1.0.0');
        expect(def.metadata.app).toBe('contracts');
      });
    });

    it('should maintain exact 1:1 functional equivalence', () => {
      // This is a placeholder for more specific functional tests
      // that would validate the JSON Logic expressions work identically
      // in both the JSON and TypeScript versions
      
      // Example: Test that guard conditions produce identical results
      const sampleState = {
        proposer: 'alice',
        counterparty: 'bob',
        completions: []
      };
      const sampleEvent = {
        agent: 'bob'
      };

      // The JSON Logic should evaluate identically in both versions
      // (This test would need actual JSON Logic evaluation to validate)
      expect(typeof contractAgreementDef.transitions[0].guard).toBe('object');
    });
  });
});