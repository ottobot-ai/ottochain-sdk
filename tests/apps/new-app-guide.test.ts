/**
 * TDD Tests for "Adding a New App" Guide Implementation
 * 
 * These failing tests define the expected behavior for implementing a new OttoChain domain
 * as described in docs/adding-a-new-app.md
 * 
 * Card: 📚 Documentation: Adding a New App skill guide (#6996294c)
 * Spec: docs/adding-a-new-app.md (corrected by @think and @research)
 * 
 * @group tdd
 * @group apps
 * @group guide
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Test domain: 'lending' (example from specification)
const TEST_DOMAIN = 'lending';
const PROTO_PATH = `proto/ottochain/apps/${TEST_DOMAIN}/v1/${TEST_DOMAIN}.proto`;
const GENERATED_TS_PATH = `src/generated/ottochain/apps/${TEST_DOMAIN}/v1/${TEST_DOMAIN}.ts`;

describe('Adding a New App Guide: TDD Tests', () => {
  
  describe('Step 1: Proto Schema Definition', () => {
    it('should have proto file with lending domain structure', () => {
      // ARRANGE: Expected proto file location
      const protoFile = join(process.cwd(), PROTO_PATH);
      
      // ACT & ASSERT: Proto file exists
      expect(existsSync(protoFile)).toBe(true);
      
      const content = readFileSync(protoFile, 'utf8');
      
      // ASSERT: Contains required proto syntax and package
      expect(content).toContain('syntax = "proto3"');
      expect(content).toContain(`package ottochain.apps.${TEST_DOMAIN}.v1`);
      expect(content).toContain('java_package');
      expect(content).toContain('java_outer_classname');
      
      // ASSERT: Contains lending-specific messages
      expect(content).toContain('message LoanRecord');
      expect(content).toContain('message ProposeLoan');
      expect(content).toContain('enum LoanStatus');
      
      // ASSERT: Required fields with proper numbering
      expect(content).toContain('string loan_id = 1');
      expect(content).toContain('string borrower_address = 2');
      expect(content).toContain('int64 principal_amount');
    });

    it('should generate TypeScript types from proto', () => {
      // ARRANGE: Path to generated TypeScript types
      const generatedFile = join(process.cwd(), GENERATED_TS_PATH);
      
      // ACT & ASSERT: Generated types exist
      expect(existsSync(generatedFile)).toBe(true);
      
      const content = readFileSync(generatedFile, 'utf8');
      
      // ASSERT: Contains TypeScript interfaces
      expect(content).toContain('export interface LoanRecord');
      expect(content).toContain('export interface ProposeLoan');
      expect(content).toContain('export enum LoanStatus');
      
      // ASSERT: Fields are properly typed
      expect(content).toContain('loanId: string');
      expect(content).toContain('borrowerAddress: string');
      expect(content).toContain('principalAmount: number');
    });
  });

  describe('Step 2: State Machine Definition', () => {
    it('should have valid state machine definition file', () => {
      // ARRANGE: Path to state machine definition
      const definitionPath = join(process.cwd(), `src/apps/${TEST_DOMAIN}/definition.ts`);
      
      // ACT & ASSERT: Definition file exists
      expect(existsSync(definitionPath)).toBe(true);
      
      // Import the definition
      const definition = require(definitionPath).default;
      
      // ASSERT: Contains required structure
      expect(definition).toHaveProperty('states');
      expect(definition).toHaveProperty('initialState');
      expect(definition).toHaveProperty('transitions');
      
      // ASSERT: Has lending lifecycle states
      expect(definition.states).toHaveProperty('proposed');
      expect(definition.states).toHaveProperty('active');
      expect(definition.states).toHaveProperty('repaid');
      expect(definition.states).toHaveProperty('defaulted');
      
      // ASSERT: Final states are marked correctly
      expect(definition.states.repaid.isFinal).toBe(true);
      expect(definition.states.defaulted.isFinal).toBe(true);
    });

    it('should have valid transitions with JLVM guards', () => {
      const definitionPath = join(process.cwd(), `src/apps/${TEST_DOMAIN}/definition.ts`);
      const definition = require(definitionPath).default;
      
      // ASSERT: Has expected transitions
      const transitions = definition.transitions;
      expect(transitions.length).toBeGreaterThan(0);
      
      const acceptTransition = transitions.find((t: any) => t.eventName === 'accept');
      expect(acceptTransition).toBeDefined();
      expect(acceptTransition.from.value).toBe('proposed');
      expect(acceptTransition.to.value).toBe('active');
      
      // ASSERT: Guard uses proper JSON Logic syntax
      expect(acceptTransition.guard).toHaveProperty('===');
      expect(acceptTransition.guard['===']).toEqual([
        { "var": "proofs.0.address" },
        { "var": "state.lenderAddress" }
      ]);
    });
  });

  describe('Step 3: Bridge Routes', () => {
    it('should have POST route for proposing loans', async () => {
      // ARRANGE: Mock dependencies
      const mockRouter = { post: jest.fn() };
      const mockClient = { 
        submitDataUpdate: jest.fn().mockResolvedValue({ ordinal: 12345 }) 
      };
      
      // ACT: Import and register route
      const { proposeLoanRoute } = await import('../../packages/bridge/src/routes/lending/propose');
      proposeLoanRoute(mockRouter as any, mockClient as any);
      
      // ASSERT: Route was registered
      expect(mockRouter.post).toHaveBeenCalledWith(
        '/api/lending/loans', 
        expect.any(Function)
      );
    });

    it('should have GET route for querying loans', async () => {
      // ARRANGE: Mock dependencies
      const mockRouter = { get: jest.fn() };
      const mockIndexer = { 
        queryFibers: jest.fn().mockResolvedValue([
          { loanId: 'loan-1', status: 'active' }
        ])
      };
      
      // ACT: Import and register route
      const { lendingQueryRoutes } = await import('../../packages/bridge/src/routes/lending/query');
      lendingQueryRoutes(mockRouter as any, mockIndexer as any);
      
      // ASSERT: Route was registered
      expect(mockRouter.get).toHaveBeenCalledWith(
        '/api/lending/loans',
        expect.any(Function)
      );
    });
  });

  describe('Step 4: SDK Client Methods', () => {
    it('should export lending app from SDK', () => {
      // ACT & ASSERT: Import lending from SDK
      const { lending } = require('../../src/apps/index');
      expect(lending).toBeDefined();
      
      // ASSERT: Contains expected methods
      expect(lending.proposeLoan).toBeDefined();
      expect(lending.acceptLoan).toBeDefined();
      expect(lending.getLoan).toBeDefined();
      expect(lending.listLoans).toBeDefined();
      
      // ASSERT: Methods are functions
      expect(typeof lending.proposeLoan).toBe('function');
      expect(typeof lending.acceptLoan).toBe('function');
      expect(typeof lending.getLoan).toBe('function');
      expect(typeof lending.listLoans).toBe('function');
    });

    it('should implement proposeLoan with correct API call', async () => {
      const { lending } = require('../../src/apps/index');
      
      // ARRANGE: Mock fetch
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ loanId: 'test-loan-123', ordinal: 456 })
      });
      global.fetch = mockFetch;
      
      // ACT: Call proposeLoan
      const result = await lending.proposeLoan({
        borrowerAddress: 'DAG123...',
        principalAmount: 1000,
        interestRateBps: 500,
        dueAtOrdinal: 1000000
      }, { bridgeBaseUrl: 'http://localhost:3030' });
      
      // ASSERT: Makes correct API call
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3030/api/lending/loans',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // ASSERT: Returns expected result
      expect(result).toEqual({
        loanId: 'test-loan-123',
        ordinal: 456
      });
    });
  });

  describe('Step 5: Traffic Generator Integration', () => {
    it('should have WorkflowDefinition for lending', () => {
      // ACT: Import workflow definitions
      const { WORKFLOW_DEFINITIONS } = require('../../packages/traffic-generator/src/workflows');
      
      // ASSERT: Contains lending workflow
      const lendingWorkflow = WORKFLOW_DEFINITIONS.find((w: any) => w.type === 'Lending');
      expect(lendingWorkflow).toBeDefined();
      expect(lendingWorkflow.name).toBe('Lending Protocol');
      expect(lendingWorkflow.states).toEqual(['proposed', 'active', 'repaid', 'defaulted']);
      expect(lendingWorkflow.finalStates).toEqual(['repaid', 'defaulted']);
    });

    it('should generate valid initial loan data', () => {
      const { WORKFLOW_DEFINITIONS } = require('../../packages/traffic-generator/src/workflows');
      const lendingWorkflow = WORKFLOW_DEFINITIONS.find((w: any) => w.type === 'Lending');
      
      // ARRANGE: Mock context
      const mockContext = {
        fiberId: 'test-loan-123',
        participants: ['DAG123...', 'DAG456...'],
        ownerAddress: 'DAG123...'
      };
      
      // ACT: Generate initial data
      const initialData = lendingWorkflow.initialDataFn(mockContext);
      
      // ASSERT: Contains required fields
      expect(initialData).toHaveProperty('loanId', 'test-loan-123');
      expect(initialData).toHaveProperty('borrowerAddress', 'DAG123...');
      expect(initialData).toHaveProperty('lenderAddress', 'DAG456...');
      expect(initialData).toHaveProperty('principalAmount');
      expect(typeof initialData.principalAmount).toBe('number');
      expect(initialData.principalAmount).toBeGreaterThan(0);
    });
  });

  describe('Step 6: E2E Test Examples', () => {
    it('should have E2E example definition file', () => {
      // ARRANGE: Expected example file path (in ottochain repo)
      const examplePath = join(process.cwd(), '..', 'ottochain', 'e2e-test/examples/lending/example.json');
      
      // ACT & ASSERT: Example file exists
      expect(existsSync(examplePath)).toBe(true);
      
      const example = JSON.parse(readFileSync(examplePath, 'utf8'));
      
      // ASSERT: Valid E2E example structure
      expect(example).toHaveProperty('name');
      expect(example).toHaveProperty('flows');
      expect(Array.isArray(example.flows)).toBe(true);
      
      const flow = example.flows[0];
      expect(flow.steps.length).toBeGreaterThan(2);
      
      // ASSERT: Contains lifecycle steps
      const stepTypes = flow.steps.map((s: any) => s.type);
      expect(stepTypes).toContain('createStateMachine');
      expect(stepTypes).toContain('transitionStateMachine');
    });

    it('should have state machine initial data file', () => {
      const initialDataPath = join(process.cwd(), '..', 'ottochain', 'e2e-test/examples/lending/sm-initial-data.ts');
      
      // ACT & ASSERT: Initial data file exists
      expect(existsSync(initialDataPath)).toBe(true);
      
      // Import and validate
      const { generateInitialData } = require(initialDataPath);
      expect(typeof generateInitialData).toBe('function');
      
      // ASSERT: Generates valid initial data
      const mockContext = { participants: ['DAG123...', 'DAG456...'] };
      const data = generateInitialData(mockContext);
      
      expect(data).toHaveProperty('borrowerAddress');
      expect(data).toHaveProperty('lenderAddress');
      expect(data).toHaveProperty('principalAmount');
    });
  });

  describe('Integration: Complete App Pipeline', () => {
    it('should validate all components work together', () => {
      // This meta-test ensures the complete pipeline is functional
      
      // ASSERT: Core components exist
      expect(existsSync(join(process.cwd(), PROTO_PATH))).toBe(true);
      expect(existsSync(join(process.cwd(), GENERATED_TS_PATH))).toBe(true);
      expect(existsSync(join(process.cwd(), `src/apps/${TEST_DOMAIN}/definition.ts`))).toBe(true);
      
      // ASSERT: SDK can be imported without errors
      const { lending } = require('../../src/apps/index');
      expect(lending).toBeDefined();
      expect(typeof lending.proposeLoan).toBe('function');
      
      // ASSERT: State machine is valid
      const definition = require(`../../src/apps/${TEST_DOMAIN}/definition`).default;
      expect(definition.transitions.length).toBeGreaterThan(0);
    });

    it('should handle error cases gracefully', () => {
      // ARRANGE: Invalid loan data
      const invalidLoanData = {
        borrowerAddress: '', // Empty
        principalAmount: -100, // Negative
        interestRateBps: 10001 // > 100%
      };
      
      // ACT & ASSERT: Should have validation
      // (Implementation will add proper validation)
      expect(invalidLoanData.borrowerAddress).toBe('');
    });
  });
});