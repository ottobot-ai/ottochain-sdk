/**
 * TDD Tests for Markets State Machine JSON → TypeScript Conversion
 * 
 * These tests verify that all JSON state machine definitions in src/apps/markets/state-machines/*.json
 * have been properly converted to TypeScript using defineFiberApp() and exported from index.ts.
 * 
 * This test file should PASS after the conversion is complete and FAIL before it's done.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// These imports will FAIL until the TypeScript conversions are complete
import {
  marketUniversalDef,
  marketPredictionDef,
  marketAuctionDef,
  marketCrowdfundDef,
  marketGroupBuyDef
} from '../src/apps/markets/state-machines/index.js';

describe('Markets State Machine Conversion Requirements', () => {
  const marketsDir = resolve(__dirname, '../src/apps/markets/state-machines');
  
  const expectedFiles = [
    'market-universal.json',
    'market-prediction.json', 
    'market-auction.json',
    'market-crowdfund.json',
    'market-group-buy.json'
  ];

  const expectedExports = [
    'marketUniversalDef',
    'marketPredictionDef',
    'marketAuctionDef', 
    'marketCrowdfundDef',
    'marketGroupBuyDef'
  ];

  describe('JSON Source Files', () => {
    expectedFiles.forEach(filename => {
      it(`should have source JSON file: ${filename}`, () => {
        const filePath = resolve(marketsDir, filename);
        expect(existsSync(filePath)).toBe(true);
        
        const content = readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        
        expect(json.metadata).toBeDefined();
        expect(json.states).toBeDefined();
        expect(json.initialState).toBeDefined();
        expect(json.transitions).toBeDefined();
        expect(Array.isArray(json.transitions)).toBe(true);
      });
    });
  });

  describe('TypeScript Exports', () => {
    expectedExports.forEach(exportName => {
      it(`should export ${exportName} from index.ts`, () => {
        let exportedDef;
        
        switch(exportName) {
          case 'marketUniversalDef':
            exportedDef = marketUniversalDef;
            break;
          case 'marketPredictionDef':
            exportedDef = marketPredictionDef;
            break;
          case 'marketAuctionDef':
            exportedDef = marketAuctionDef;
            break;
          case 'marketCrowdfundDef':
            exportedDef = marketCrowdfundDef;
            break;
          case 'marketGroupBuyDef':
            exportedDef = marketGroupBuyDef;
            break;
          default:
            throw new Error(`Unknown export: ${exportName}`);
        }
        
        expect(exportedDef).toBeDefined();
        expect(typeof exportedDef).toBe('object');
      });
    });
  });

  describe('JSON ↔ TypeScript Equivalence', () => {
    const testEquivalence = (jsonFile: string, tsExport: any, expectedName: string) => {
      it(`should have equivalent data: ${jsonFile} ↔ ${expectedName}`, () => {
        const jsonPath = resolve(marketsDir, jsonFile);
        const jsonContent = JSON.parse(readFileSync(jsonPath, 'utf8'));
        
        // Metadata equivalence
        expect(tsExport.metadata.name).toBe(jsonContent.metadata.name);
        expect(tsExport.metadata.description).toBe(jsonContent.metadata.description);
        expect(tsExport.metadata.version).toBe(jsonContent.metadata.version);
        
        // Add app field that should be added during conversion
        expect(tsExport.metadata.app).toBe('markets');
        
        // States equivalence
        expect(Object.keys(tsExport.states)).toEqual(Object.keys(jsonContent.states));
        Object.keys(jsonContent.states).forEach(stateId => {
          expect(tsExport.states[stateId]).toEqual(jsonContent.states[stateId]);
        });
        
        // Initial state equivalence  
        expect(tsExport.initialState).toBe(jsonContent.initialState);
        
        // Transitions equivalence (order may differ)
        expect(tsExport.transitions.length).toBe(jsonContent.transitions.length);
        
        jsonContent.transitions.forEach(jsonTransition => {
          const matchingTsTransition = tsExport.transitions.find(
            t => t.from === jsonTransition.from && 
                 t.to === jsonTransition.to && 
                 t.eventName === jsonTransition.eventName
          );
          
          expect(matchingTsTransition).toBeDefined();
          expect(matchingTsTransition.guard).toEqual(jsonTransition.guard);
          expect(matchingTsTransition.effect).toEqual(jsonTransition.effect);
          expect(matchingTsTransition.dependencies).toEqual(jsonTransition.dependencies || []);
        });
      });
    };

    // Test each JSON ↔ TS pair
    testEquivalence('market-universal.json', marketUniversalDef, 'marketUniversalDef');
    testEquivalence('market-prediction.json', marketPredictionDef, 'marketPredictionDef');
    testEquivalence('market-auction.json', marketAuctionDef, 'marketAuctionDef');
    testEquivalence('market-crowdfund.json', marketCrowdfundDef, 'marketCrowdfundDef');
    testEquivalence('market-group-buy.json', marketGroupBuyDef, 'marketGroupBuyDef');
  });

  describe('Build Requirements', () => {
    it('should pass npm run build', async () => {
      const { execSync } = require('child_process');
      
      // This will throw if build fails
      expect(() => {
        execSync('npm run build', { 
          cwd: resolve(__dirname, '..'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });

    it('should pass npm test (existing tests)', async () => {
      const { execSync } = require('child_process');
      
      // Run only existing tests (not the new TDD tests)
      expect(() => {
        execSync('npm test -- --testPathIgnorePatterns="markets.*\\.test\\.(ts|js)$"', {
          cwd: resolve(__dirname, '..'),
          stdio: 'pipe'
        });
      }).not.toThrow();
    });
  });

  describe('TypeScript Pattern Compliance', () => {
    expectedExports.forEach(exportName => {
      it(`should use 'as const' assertion for ${exportName}`, () => {
        // Read the generated TypeScript file content
        const indexPath = resolve(marketsDir, 'index.ts');
        expect(existsSync(indexPath)).toBe(true);
        
        const content = readFileSync(indexPath, 'utf8');
        
        // Check for 'as const' assertion pattern
        const constPattern = new RegExp(`export\\s+const\\s+${exportName}\\s+=\\s+{[\\s\\S]+?}\\s+as\\s+const;`);
        expect(content).toMatch(constPattern);
      });
    });

    it('should have proper file header comment', () => {
      const indexPath = resolve(marketsDir, 'index.ts');
      const content = readFileSync(indexPath, 'utf8');
      
      expect(content).toContain('Auto-generated from JSON state machine definitions');
      expect(content).toContain('DO NOT EDIT');
    });

    it('should export all market definitions', () => {
      const indexPath = resolve(marketsDir, 'index.ts');
      const content = readFileSync(indexPath, 'utf8');
      
      expectedExports.forEach(exportName => {
        expect(content).toContain(`export const ${exportName}`);
      });
    });
  });

  describe('Functional Validation', () => {
    expectedExports.forEach((exportName, index) => {
      const expectedName = expectedFiles[index].replace('.json', '').replace(/-/g, '');
      
      it(`should preserve all functional requirements for ${exportName}`, () => {
        let exportedDef;
        
        switch(exportName) {
          case 'marketUniversalDef':
            exportedDef = marketUniversalDef;
            break;
          case 'marketPredictionDef':
            exportedDef = marketPredictionDef;
            break;
          case 'marketAuctionDef':
            exportedDef = marketAuctionDef;
            break;
          case 'marketCrowdfundDef':
            exportedDef = marketCrowdfundDef;
            break;
          case 'marketGroupBuyDef':
            exportedDef = marketGroupBuyDef;
            break;
        }

        // Validate state machine completeness
        expect(exportedDef.states).toBeDefined();
        expect(exportedDef.initialState).toBeDefined();
        expect(exportedDef.transitions).toBeDefined();
        
        // Validate at least one transition exists
        expect(exportedDef.transitions.length).toBeGreaterThan(0);
        
        // Validate all transitions have required fields
        exportedDef.transitions.forEach(transition => {
          expect(transition.from).toBeDefined();
          expect(transition.to).toBeDefined();
          expect(transition.eventName).toBeDefined();
          expect(transition.guard).toBeDefined();
          expect(transition.effect).toBeDefined();
          expect(Array.isArray(transition.dependencies)).toBe(true);
        });
        
        // Validate no functionality is lost
        const stateCount = Object.keys(exportedDef.states).length;
        const transitionCount = exportedDef.transitions.length;
        
        expect(stateCount).toBeGreaterThan(0);
        expect(transitionCount).toBeGreaterThan(0);
      });
    });
  });
});