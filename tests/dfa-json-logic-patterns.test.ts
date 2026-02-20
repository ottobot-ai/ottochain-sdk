/**
 * TDD Tests for DFA + JSON Logic State Machine Patterns and Templates
 * 
 * These tests define the expected behavior for DFA-based lifecycle management
 * patterns with JSON Logic guard conditions as described in 
 * docs/design/dfa-json-logic-patterns.md
 * 
 * Card: 📐 Spec: DFA + JSON Logic state machine patterns and templates (#699630188cd55eb7feafdc57)
 * Epic: Asset Model Exploration: Complete Artifacts
 * 
 * @group tdd
 * @group dfa-json-logic
 * @group asset-model
 */

import { describe, it, expect, beforeEach } from '@jest/testing-library/jest-dom';

// Types from the specification that should be implemented
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
  effect: JsonLogicExpression;
  dependencies: string[];
}

interface StateMachineDefinition {
  states: Record<string, StateDefinition>;
  initialState: { value: string };
  transitions: TransitionDefinition[];
  metadata?: { name: string; description: string; [key: string]: unknown };
}

interface JsonLogicExpression {
  [operator: string]: any;
}

interface JLVMContext {
  state: Record<string, any>;
  event: Record<string, any>;
  eventName: string;
  machineId: string;
  currentStateId: string;
  sequenceNumber: number;
  proofs: Array<{ address: string; id: string; signature: string }>;
  machines?: Record<string, { state: any; currentStateId: string; sequenceNumber: number }>;
  scripts?: Record<string, { state: any; status: string; sequenceNumber: number }>;
  parent?: { state: any; currentStateId: string } | null;
  children?: Record<string, { state: any }>;
  delegation?: {
    active: boolean;
    expiresAt: number;
    scope: string[];
    spendRemaining: number;
    delegator: string;
    relayer: string;
    sessionKey: string;
    bondedStake: number;
  };
}

interface Fiber {
  fiberId: string;
  currentState: { value: string };
  stateData: Record<string, any>;
  sequenceNumber: number;
  definition: StateMachineDefinition;
  status: 'ACTIVE' | 'ARCHIVED';
  isFinal: boolean;
}

interface TransitionResult {
  success: boolean;
  newState: string;
  newStateData: Record<string, any>;
  error?: string;
  effects?: Array<{ type: string; data: any }>;
}

interface DataUpdate {
  fiberId: string;
  event: string;
  payload: Record<string, any>;
  targetSequenceNumber: number;
  proofs: Array<{ address: string; id: string; signature: string }>;
}

describe('DFA + JSON Logic Patterns: Core Type System', () => {
  
  describe('StateMachineDefinition Structure', () => {
    it('should validate minimal state machine definition structure', () => {
      // ARRANGE: Minimal working state machine
      const minimalSM: StateMachineDefinition = {
        states: {
          "pending": { id: { value: "pending" }, isFinal: false, metadata: null },
          "approved": { id: { value: "approved" }, isFinal: true, metadata: null },
          "rejected": { id: { value: "rejected" }, isFinal: true, metadata: null }
        },
        initialState: { value: "pending" },
        transitions: [
          {
            from: { value: "pending" },
            to: { value: "approved" },
            eventName: "approve",
            guard: { "==": [1, 1] }, // Always true
            effect: { "merge": [{ "var": "state" }, { "approvedBy": { "var": "event.approver" } }] },
            dependencies: []
          }
        ],
        metadata: { name: "ApprovalWorkflow", description: "Simple approval lifecycle" }
      };
      
      // ACT & ASSERT: Structure validation
      expect(() => validateStateMachineDefinition(minimalSM)).not.toThrow();
      
      // ASSERT: Required fields present
      expect(minimalSM.states).toBeDefined();
      expect(minimalSM.initialState).toBeDefined();
      expect(minimalSM.transitions).toBeDefined();
      
      // ASSERT: States contain required fields
      expect(minimalSM.states.pending.id.value).toBe("pending");
      expect(minimalSM.states.pending.isFinal).toBe(false);
      expect(minimalSM.states.approved.isFinal).toBe(true);
    });

    it('should enforce state ID consistency', () => {
      // ARRANGE: Invalid state machine where state key != state.id.value
      const invalidSM: StateMachineDefinition = {
        states: {
          "pending": { id: { value: "different_name" }, isFinal: false, metadata: null } // Mismatch
        },
        initialState: { value: "pending" },
        transitions: [],
        metadata: { name: "Invalid", description: "Test" }
      };
      
      // ACT & ASSERT: Should reject inconsistent state IDs
      expect(() => validateStateMachineDefinition(invalidSM))
        .toThrow('State key "pending" must match state.id.value "different_name"');
    });

    it('should validate initial state exists in states collection', () => {
      // ARRANGE: SM with invalid initial state
      const invalidSM: StateMachineDefinition = {
        states: {
          "pending": { id: { value: "pending" }, isFinal: false, metadata: null }
        },
        initialState: { value: "nonexistent" },
        transitions: [],
        metadata: { name: "Invalid", description: "Test" }
      };
      
      // ACT & ASSERT: Should reject unknown initial state
      expect(() => validateStateMachineDefinition(invalidSM))
        .toThrow('Initial state "nonexistent" not found in states collection');
    });

    it('should validate transition from/to states exist', () => {
      // ARRANGE: Transition referencing unknown states
      const invalidSM: StateMachineDefinition = {
        states: {
          "pending": { id: { value: "pending" }, isFinal: false, metadata: null }
        },
        initialState: { value: "pending" },
        transitions: [
          {
            from: { value: "pending" },
            to: { value: "unknown" }, // State doesn't exist
            eventName: "approve",
            guard: { "==": [1, 1] },
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT & ASSERT: Should reject unknown transition target
      expect(() => validateStateMachineDefinition(invalidSM))
        .toThrow('Transition target state "unknown" not found in states collection');
    });

    it('should ensure every non-final state has outgoing transitions', () => {
      // ARRANGE: Non-final state with no way out
      const stuckSM: StateMachineDefinition = {
        states: {
          "stuck": { id: { value: "stuck" }, isFinal: false, metadata: null },
          "final": { id: { value: "final" }, isFinal: true, metadata: null }
        },
        initialState: { value: "stuck" },
        transitions: [] // No transitions - stuck state has no way out
      };
      
      // ACT & ASSERT: Should detect stuck states
      const analysis = analyzeStateMachineReachability(stuckSM);
      expect(analysis.stuckStates).toContain("stuck");
      expect(analysis.isValid).toBe(false);
    });
  });

  describe('Guard Validation and Mutual Exclusion', () => {
    it('should detect overlapping guards for same (from, eventName)', () => {
      // ARRANGE: SM with overlapping numeric guards
      const overlappingSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "gold": { id: { value: "gold" }, isFinal: true, metadata: null },
          "silver": { id: { value: "silver" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "gold" },
            eventName: "score",
            guard: { ">=": [{ "var": "event.score" }, 100] },
            effect: { "var": "state" },
            dependencies: []
          },
          {
            from: { value: "active" },
            to: { value: "silver" },
            eventName: "score",
            guard: { ">=": [{ "var": "event.score" }, 50] }, // Overlaps with gold when score >= 100
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze guard exclusivity
      const guardAnalysis = analyzeGuardExclusivity(overlappingSM);
      
      // ASSERT: Should detect overlap
      expect(guardAnalysis.hasOverlappingGuards).toBe(true);
      expect(guardAnalysis.overlaps).toHaveLength(1);
      expect(guardAnalysis.overlaps[0].from).toBe("active");
      expect(guardAnalysis.overlaps[0].eventName).toBe("score");
    });

    it('should accept mutually exclusive guards', () => {
      // ARRANGE: SM with properly partitioned guards
      const exclusiveSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "gold": { id: { value: "gold" }, isFinal: true, metadata: null },
          "silver": { id: { value: "silver" }, isFinal: true, metadata: null },
          "bronze": { id: { value: "bronze" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "gold" },
            eventName: "score",
            guard: { ">=": [{ "var": "event.score" }, 100] },
            effect: { "var": "state" },
            dependencies: []
          },
          {
            from: { value: "active" },
            to: { value: "silver" },
            eventName: "score",
            guard: { "and": [
              { ">=": [{ "var": "event.score" }, 50] },
              { "<": [{ "var": "event.score" }, 100] }
            ]},
            effect: { "var": "state" },
            dependencies: []
          },
          {
            from: { value: "active" },
            to: { value: "bronze" },
            eventName: "score",
            guard: { "<": [{ "var": "event.score" }, 50] },
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze exclusivity
      const analysis = analyzeGuardExclusivity(exclusiveSM);
      
      // ASSERT: Should be valid (no overlaps)
      expect(analysis.hasOverlappingGuards).toBe(false);
      expect(analysis.overlaps).toHaveLength(0);
    });
  });
});

describe('DFA + JSON Logic Patterns: JLVM Guard Evaluation', () => {
  let mockContext: JLVMContext;

  beforeEach(() => {
    mockContext = {
      state: { amount: 100, ownerAddress: "DAGowner123..." },
      event: { amount: 50, buyerAddress: "DAGbuyer456..." },
      eventName: "transfer",
      machineId: "fiber-uuid-123",
      currentStateId: "active",
      sequenceNumber: 5,
      proofs: [
        { address: "DAGowner123...", id: "key1", signature: "sig1" },
        { address: "DAGsigner789...", id: "key2", signature: "sig2" }
      ]
    };
  });

  describe('Basic Guard Patterns', () => {
    it('should evaluate always-true guard correctly', () => {
      // ARRANGE: Always true guard
      const alwaysTrue = { "==": [1, 1] };
      
      // ACT: Evaluate guard
      const result = evaluateJSONLogic(alwaysTrue, mockContext);
      
      // ASSERT: Should always be true
      expect(result).toBe(true);
    });

    it('should evaluate field presence guards', () => {
      // ARRANGE: Field presence guards
      const presentFieldGuard = { "!!": [{ "var": "event.buyerAddress" }] };
      const absentFieldGuard = { "!!": [{ "var": "event.nonexistentField" }] };
      
      // ACT & ASSERT: Present field
      expect(evaluateJSONLogic(presentFieldGuard, mockContext)).toBe(true);
      
      // ACT & ASSERT: Absent field
      expect(evaluateJSONLogic(absentFieldGuard, mockContext)).toBe(false);
    });

    it('should evaluate numeric equality guards', () => {
      // ARRANGE: Numeric equality checks
      const exactMatch = { "===": [{ "var": "state.amount" }, 100] };
      const noMatch = { "===": [{ "var": "state.amount" }, 200] };
      
      // ACT & ASSERT: Exact match
      expect(evaluateJSONLogic(exactMatch, mockContext)).toBe(true);
      
      // ACT & ASSERT: No match
      expect(evaluateJSONLogic(noMatch, mockContext)).toBe(false);
    });

    it('should evaluate numeric range guards', () => {
      // ARRANGE: Range checks
      const inRange = {
        "and": [
          { ">=": [{ "var": "event.amount" }, 1] },
          { "<=": [{ "var": "event.amount" }, 100] }
        ]
      };
      
      const outOfRange = {
        "and": [
          { ">=": [{ "var": "event.amount" }, 200] },
          { "<=": [{ "var": "event.amount" }, 300] }
        ]
      };
      
      // ACT & ASSERT: In range (event.amount = 50)
      expect(evaluateJSONLogic(inRange, mockContext)).toBe(true);
      
      // ACT & ASSERT: Out of range
      expect(evaluateJSONLogic(outOfRange, mockContext)).toBe(false);
    });

    it('should evaluate string equality guards', () => {
      // ARRANGE: String comparisons
      const stringMatch = { "===": [{ "var": "currentStateId" }, "active"] };
      const stringNoMatch = { "===": [{ "var": "currentStateId" }, "inactive"] };
      
      // ACT & ASSERT: String match
      expect(evaluateJSONLogic(stringMatch, mockContext)).toBe(true);
      
      // ACT & ASSERT: String no match
      expect(evaluateJSONLogic(stringNoMatch, mockContext)).toBe(false);
    });

    it('should evaluate enum membership guards', () => {
      // ARRANGE: Membership checks
      const validCurrency = { "in": [{ "var": "event.currency" }, ["DAG", "USDC", "ETH"]] };
      
      // Test with valid currency
      const contextWithCurrency = { ...mockContext, event: { ...mockContext.event, currency: "DAG" } };
      expect(evaluateJSONLogic(validCurrency, contextWithCurrency)).toBe(true);
      
      // Test with invalid currency
      const contextWithInvalidCurrency = { ...mockContext, event: { ...mockContext.event, currency: "INVALID" } };
      expect(evaluateJSONLogic(validCurrency, contextWithInvalidCurrency)).toBe(false);
    });

    it('should evaluate multi-field AND guards', () => {
      // ARRANGE: Multi-field requirement
      const multiField = {
        "and": [
          { "!!": [{ "var": "event.buyerAddress" }] },
          { "!!": [{ "var": "event.amount" }] },
          { ">": [{ "var": "event.amount" }, 0] }
        ]
      };
      
      // ACT & ASSERT: All conditions met
      expect(evaluateJSONLogic(multiField, mockContext)).toBe(true);
      
      // Test with missing field
      const contextMissingAmount = { ...mockContext, event: { buyerAddress: "DAGbuyer456..." } };
      expect(evaluateJSONLogic(multiField, contextMissingAmount)).toBe(false);
    });

    it('should evaluate OR guards correctly', () => {
      // ARRANGE: OR condition
      const orGuard = {
        "or": [
          { "===": [{ "var": "event.type" }, "premium"] },
          { ">=": [{ "var": "event.amount" }, 1000] }
        ]
      };
      
      // ACT & ASSERT: First condition true
      const contextPremium = { ...mockContext, event: { ...mockContext.event, type: "premium", amount: 1 } };
      expect(evaluateJSONLogic(orGuard, contextPremium)).toBe(true);
      
      // ACT & ASSERT: Second condition true
      const contextHighAmount = { ...mockContext, event: { ...mockContext.event, type: "basic", amount: 1000 } };
      expect(evaluateJSONLogic(orGuard, contextHighAmount)).toBe(true);
      
      // ACT & ASSERT: Both conditions false
      const contextNeither = { ...mockContext, event: { ...mockContext.event, type: "basic", amount: 1 } };
      expect(evaluateJSONLogic(orGuard, contextNeither)).toBe(false);
    });

    it('should evaluate negation guards', () => {
      // ARRANGE: Negation guard
      const negationGuard = { "!": [{ "===": [{ "var": "event.type" }, "restricted"] }] };
      
      // ACT & ASSERT: Negated condition (type is not restricted)
      const contextUnrestricted = { ...mockContext, event: { ...mockContext.event, type: "normal" } };
      expect(evaluateJSONLogic(negationGuard, contextUnrestricted)).toBe(true);
      
      // ACT & ASSERT: Negated condition (type is restricted)
      const contextRestricted = { ...mockContext, event: { ...mockContext.event, type: "restricted" } };
      expect(evaluateJSONLogic(negationGuard, contextRestricted)).toBe(false);
    });
  });

  describe('Context Variable Access', () => {
    it('should access event fields correctly', () => {
      // ARRANGE: Event field access
      const eventFieldGuard = { "var": "event.buyerAddress" };
      
      // ACT: Evaluate field access
      const result = evaluateJSONLogic(eventFieldGuard, mockContext);
      
      // ASSERT: Should return event field value
      expect(result).toBe("DAGbuyer456...");
    });

    it('should access state fields correctly', () => {
      // ARRANGE: State field access
      const stateFieldGuard = { "var": "state.amount" };
      
      // ACT: Evaluate state access
      const result = evaluateJSONLogic(stateFieldGuard, mockContext);
      
      // ASSERT: Should return state field value
      expect(result).toBe(100);
    });

    it('should access proofs.0.address for primary signer', () => {
      // ARRANGE: Primary signer check
      const primarySignerGuard = { "var": "proofs.0.address" };
      
      // ACT: Evaluate primary signer access
      const result = evaluateJSONLogic(primarySignerGuard, mockContext);
      
      // ASSERT: Should return first signer address
      expect(result).toBe("DAGowner123...");
    });

    it('should access proofs.1.address for multi-sig scenarios', () => {
      // ARRANGE: Multi-sig signer check
      const secondSignerGuard = { "var": "proofs.1.address" };
      
      // ACT: Evaluate second signer access
      const result = evaluateJSONLogic(secondSignerGuard, mockContext);
      
      // ASSERT: Should return second signer address
      expect(result).toBe("DAGsigner789...");
    });

    it('should access sequenceNumber for ordering', () => {
      // ARRANGE: Sequence number access
      const sequenceGuard = { "var": "sequenceNumber" };
      
      // ACT: Evaluate sequence access
      const result = evaluateJSONLogic(sequenceGuard, mockContext);
      
      // ASSERT: Should return sequence number
      expect(result).toBe(5);
    });

    it('should access currentStateId correctly', () => {
      // ARRANGE: Current state access
      const stateIdGuard = { "var": "currentStateId" };
      
      // ACT: Evaluate state ID access
      const result = evaluateJSONLogic(stateIdGuard, mockContext);
      
      // ASSERT: Should return current state
      expect(result).toBe("active");
    });

    it('should access machineId correctly', () => {
      // ARRANGE: Machine ID access
      const machineIdGuard = { "var": "machineId" };
      
      // ACT: Evaluate machine ID access
      const result = evaluateJSONLogic(machineIdGuard, mockContext);
      
      // ASSERT: Should return fiber ID
      expect(result).toBe("fiber-uuid-123");
    });

    it('should access script oracle state when in dependencies', () => {
      // ARRANGE: Context with oracle dependency
      const contextWithOracle = {
        ...mockContext,
        scripts: {
          "oracle-123": {
            state: { status: "APPROVED", value: 42 },
            status: "ACTIVE",
            sequenceNumber: 10
          }
        }
      };
      
      const oracleGuard = { "var": "scripts.oracle-123.state.status" };
      
      // ACT: Evaluate oracle state access
      const result = evaluateJSONLogic(oracleGuard, contextWithOracle);
      
      // ASSERT: Should return oracle state value
      expect(result).toBe("APPROVED");
    });

    it('should return null for scripts not in dependencies', () => {
      // ARRANGE: Access to non-dependent script
      const nonDependentGuard = { "var": "scripts.nonexistent.state" };
      
      // ACT: Evaluate non-dependent script access
      const result = evaluateJSONLogic(nonDependentGuard, mockContext);
      
      // ASSERT: Should return undefined/null
      expect(result).toBeUndefined();
    });

    it('should not provide event.initiator (common mistake)', () => {
      // ARRANGE: Attempt to access non-existent event.initiator
      const initiatorGuard = { "var": "event.initiator" };
      
      // ACT: Evaluate initiator access
      const result = evaluateJSONLogic(initiatorGuard, mockContext);
      
      // ASSERT: Should not exist (undefined)
      expect(result).toBeUndefined();
    });

    it('should return 0 for $ordinal at root (not yet supported)', () => {
      // ARRANGE: Access to $ordinal at context root
      const ordinalGuard = { "var": "$ordinal" };
      
      // ACT: Evaluate ordinal access
      const result = evaluateJSONLogic(ordinalGuard, mockContext);
      
      // ASSERT: Should default to 0 (VarExpression default)
      expect(result).toBe(0);
    });
  });

  describe('Delegation Context Variables', () => {
    it('should return false for delegation.active when no delegation', () => {
      // ARRANGE: Context without delegation
      const noDelegationGuard = { "var": "delegation.active" };
      
      // ACT: Evaluate delegation active
      const result = evaluateJSONLogic(noDelegationGuard, mockContext);
      
      // ASSERT: Should be false when no delegation
      expect(result).toBe(false);
    });

    it('should return true for delegation.active when delegation present', () => {
      // ARRANGE: Context with active delegation
      const contextWithDelegation = {
        ...mockContext,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ["transfer", "vote"],
          spendRemaining: 500,
          delegator: "DAGdelegator123...",
          relayer: "DAGagent456...",
          sessionKey: "sessionkey789",
          bondedStake: 1000
        }
      };
      
      const delegationGuard = { "var": "delegation.active" };
      
      // ACT: Evaluate delegation active
      const result = evaluateJSONLogic(delegationGuard, contextWithDelegation);
      
      // ASSERT: Should be true when delegation active
      expect(result).toBe(true);
    });

    it('should check delegation scope contains operation', () => {
      // ARRANGE: Delegation with specific scope
      const contextWithScope = {
        ...mockContext,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ["transfer", "vote"],
          spendRemaining: 500,
          delegator: "DAGdelegator123...",
          relayer: "DAGagent456...",
          sessionKey: "sessionkey789",
          bondedStake: 1000
        }
      };
      
      const scopeCheckGuard = { "in": ["transfer", { "var": "delegation.scope" }] };
      const invalidScopeGuard = { "in": ["mint", { "var": "delegation.scope" }] };
      
      // ACT & ASSERT: Valid operation in scope
      expect(evaluateJSONLogic(scopeCheckGuard, contextWithScope)).toBe(true);
      
      // ACT & ASSERT: Invalid operation not in scope
      expect(evaluateJSONLogic(invalidScopeGuard, contextWithScope)).toBe(false);
    });

    it('should handle wildcard delegation scope', () => {
      // ARRANGE: Delegation with wildcard scope
      const contextWithWildcard = {
        ...mockContext,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ["*"],
          spendRemaining: 500,
          delegator: "DAGdelegator123...",
          relayer: "DAGagent456...",
          sessionKey: "sessionkey789",
          bondedStake: 1000
        }
      };
      
      const anyOperationGuard = { "in": ["any_operation", { "var": "delegation.scope" }] };
      const wildcardGuard = { "in": ["*", { "var": "delegation.scope" }] };
      
      // ACT & ASSERT: Wildcard should NOT match arbitrary operations directly
      expect(evaluateJSONLogic(anyOperationGuard, contextWithWildcard)).toBe(false);
      
      // ACT & ASSERT: Wildcard should match wildcard check
      expect(evaluateJSONLogic(wildcardGuard, contextWithWildcard)).toBe(true);
    });

    it('should validate spend limits in delegation', () => {
      // ARRANGE: Delegation with spend limit
      const contextWithSpendLimit = {
        ...mockContext,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ["transfer"],
          spendRemaining: 100,
          delegator: "DAGdelegator123...",
          relayer: "DAGagent456...",
          sessionKey: "sessionkey789",
          bondedStake: 1000
        }
      };
      
      const withinLimitGuard = { ">=": [{ "var": "delegation.spendRemaining" }, { "var": "event.amount" }] };
      
      // Test within limit (event.amount = 50, spendRemaining = 100)
      expect(evaluateJSONLogic(withinLimitGuard, contextWithSpendLimit)).toBe(true);
      
      // Test exceeding limit
      const contextExceedingLimit = {
        ...contextWithSpendLimit,
        event: { ...mockContext.event, amount: 150 }
      };
      expect(evaluateJSONLogic(withinLimitGuard, contextExceedingLimit)).toBe(false);
    });

    it('should access delegation addresses', () => {
      // ARRANGE: Delegation context
      const contextWithDelegation = {
        ...mockContext,
        delegation: {
          active: true,
          expiresAt: 1000,
          scope: ["transfer"],
          spendRemaining: 500,
          delegator: "DAGdelegator123...",
          relayer: "DAGagent456...",
          sessionKey: "sessionkey789",
          bondedStake: 1000
        }
      };
      
      const delegatorGuard = { "var": "delegation.delegator" };
      const relayerGuard = { "var": "delegation.relayer" };
      
      // ACT & ASSERT: Access delegation addresses
      expect(evaluateJSONLogic(delegatorGuard, contextWithDelegation)).toBe("DAGdelegator123...");
      expect(evaluateJSONLogic(relayerGuard, contextWithDelegation)).toBe("DAGagent456...");
    });
  });
});

describe('DFA + JSON Logic Patterns: State Machine Transitions', () => {
  let testFiber: Fiber;
  let approvalWorkflowSM: StateMachineDefinition;

  beforeEach(() => {
    approvalWorkflowSM = {
      states: {
        "pending": { id: { value: "pending" }, isFinal: false, metadata: null },
        "approved": { id: { value: "approved" }, isFinal: true, metadata: null },
        "rejected": { id: { value: "rejected" }, isFinal: true, metadata: null }
      },
      initialState: { value: "pending" },
      transitions: [
        {
          from: { value: "pending" },
          to: { value: "approved" },
          eventName: "approve",
          guard: { "!!": [{ "var": "event.approver" }] },
          effect: { "merge": [{ "var": "state" }, { "approvedBy": { "var": "event.approver" } }] },
          dependencies: []
        },
        {
          from: { value: "pending" },
          to: { value: "rejected" },
          eventName: "reject",
          guard: { "!!": [{ "var": "event.reason" }] },
          effect: { "merge": [{ "var": "state" }, { "rejectedBy": { "var": "event.approver" }, "reason": { "var": "event.reason" } }] },
          dependencies: []
        }
      ],
      metadata: { name: "ApprovalWorkflow", description: "Simple approval lifecycle" }
    };

    testFiber = {
      fiberId: "test-fiber-123",
      currentState: { value: "pending" },
      stateData: { submittedBy: "DAGuser123...", submittedAt: 1 },
      sequenceNumber: 1,
      definition: approvalWorkflowSM,
      status: "ACTIVE",
      isFinal: false
    };
  });

  describe('CreateStateMachine Integration', () => {
    it('should create fiber starting in initialState', () => {
      // ARRANGE: CreateStateMachine request
      const createRequest = {
        fiberId: "new-fiber-456",
        definition: approvalWorkflowSM,
        initialData: { submittedBy: "DAGuser789...", submittedAt: 0 }
      };
      
      // ACT: Create state machine fiber
      const createdFiber = createStateMachineFiber(createRequest);
      
      // ASSERT: Starts in initial state
      expect(createdFiber.currentState.value).toBe("pending");
      expect(createdFiber.sequenceNumber).toBe(0);
      expect(createdFiber.stateData.submittedBy).toBe("DAGuser789...");
      expect(createdFiber.isFinal).toBe(false);
    });

    it('should prevent outgoing transitions from final states', () => {
      // ARRANGE: Final state definition
      const finalStateSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "final": { id: { value: "final" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "final" },
            eventName: "complete",
            guard: { "==": [1, 1] },
            effect: { "var": "state" },
            dependencies: []
          },
          {
            // This should be invalid - transition from final state
            from: { value: "final" },
            to: { value: "active" },
            eventName: "reopen",
            guard: { "==": [1, 1] },
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT & ASSERT: Should reject transitions from final states
      expect(() => validateStateMachineDefinition(finalStateSM))
        .toThrow('Transition from final state "final" is not allowed');
    });
  });

  describe('TransitionStateMachine Processing', () => {
    it('should advance state when guard passes', () => {
      // ARRANGE: Valid approval event
      const approveEvent: DataUpdate = {
        fiberId: testFiber.fiberId,
        event: "approve",
        payload: { approver: "DAGmanager456..." },
        targetSequenceNumber: 1,
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(testFiber, approveEvent);
      
      // ASSERT: Should succeed and advance state
      expect(result.success).toBe(true);
      expect(result.newState).toBe("approved");
      expect(result.newStateData.approvedBy).toBe("DAGmanager456...");
      expect(result.newStateData.submittedBy).toBe("DAGuser123..."); // Preserved by merge
    });

    it('should reject transition when guard fails', () => {
      // ARRANGE: Invalid approval event (missing approver)
      const invalidApproveEvent: DataUpdate = {
        fiberId: testFiber.fiberId,
        event: "approve",
        payload: {}, // Missing approver field
        targetSequenceNumber: 1,
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(testFiber, invalidApproveEvent);
      
      // ASSERT: Should reject due to guard failure
      expect(result.success).toBe(false);
      expect(result.error).toBe("GUARD_FAILED");
      expect(testFiber.currentState.value).toBe("pending"); // State unchanged
    });

    it('should reject transition from wrong state', () => {
      // ARRANGE: Fiber in wrong state
      const approvedFiber = { ...testFiber, currentState: { value: "approved" }, isFinal: true };
      
      const approveEvent: DataUpdate = {
        fiberId: approvedFiber.fiberId,
        event: "approve",
        payload: { approver: "DAGmanager456..." },
        targetSequenceNumber: 1,
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(approvedFiber, approveEvent);
      
      // ASSERT: Should reject due to wrong state
      expect(result.success).toBe(false);
      expect(result.error).toBe("NO_MATCHING_TRANSITION");
    });

    it('should reject transition with unknown event name', () => {
      // ARRANGE: Unknown event
      const unknownEvent: DataUpdate = {
        fiberId: testFiber.fiberId,
        event: "unknown_action",
        payload: { data: "test" },
        targetSequenceNumber: 1,
        proofs: [{ address: "DAGuser123...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(testFiber, unknownEvent);
      
      // ASSERT: Should reject unknown event
      expect(result.success).toBe(false);
      expect(result.error).toBe("UNKNOWN_EVENT");
    });

    it('should handle multiple transitions for same (from, event) with first matching guard', () => {
      // ARRANGE: SM with multiple transitions for same event
      const multiTransitionSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "gold": { id: { value: "gold" }, isFinal: true, metadata: null },
          "silver": { id: { value: "silver" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "gold" },
            eventName: "score",
            guard: { ">=": [{ "var": "event.score" }, 100] },
            effect: { "merge": [{ "var": "state" }, { "tier": "gold" }] },
            dependencies: []
          },
          {
            from: { value: "active" },
            to: { value: "silver" },
            eventName: "score",
            guard: { ">=": [{ "var": "event.score" }, 50] },
            effect: { "merge": [{ "var": "state" }, { "tier": "silver" }] },
            dependencies: []
          }
        ]
      };
      
      const activeFiber = {
        ...testFiber,
        definition: multiTransitionSM,
        currentState: { value: "active" },
        stateData: {}
      };
      
      const highScoreEvent: DataUpdate = {
        fiberId: activeFiber.fiberId,
        event: "score",
        payload: { score: 120 }, // Matches both guards, but should take first (gold)
        targetSequenceNumber: 1,
        proofs: [{ address: "DAGuser123...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(activeFiber, highScoreEvent);
      
      // ASSERT: Should take first matching transition (gold)
      expect(result.success).toBe(true);
      expect(result.newState).toBe("gold");
      expect(result.newStateData.tier).toBe("gold");
    });

    it('should reject events on final states', () => {
      // ARRANGE: Fiber in final state
      const finalFiber = {
        ...testFiber,
        currentState: { value: "approved" },
        isFinal: true,
        stateData: { approvedBy: "DAGmanager456...", submittedBy: "DAGuser123..." }
      };
      
      const anyEvent: DataUpdate = {
        fiberId: finalFiber.fiberId,
        event: "any_action",
        payload: { data: "test" },
        targetSequenceNumber: 2,
        proofs: [{ address: "DAGuser123...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition on final state
      const result = processTransitionStateMachine(finalFiber, anyEvent);
      
      // ASSERT: Should reject any event on final state
      expect(result.success).toBe(false);
      expect(result.error).toBe("FINAL_STATE");
    });

    it('should validate target sequence number matches current', () => {
      // ARRANGE: Event with wrong sequence number
      const wrongSequenceEvent: DataUpdate = {
        fiberId: testFiber.fiberId,
        event: "approve",
        payload: { approver: "DAGmanager456..." },
        targetSequenceNumber: 5, // Current is 1
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process transition
      const result = processTransitionStateMachine(testFiber, wrongSequenceEvent);
      
      // ASSERT: Should reject due to sequence mismatch
      expect(result.success).toBe(false);
      expect(result.error).toBe("SEQUENCE_MISMATCH");
    });
  });
});

describe('DFA + JSON Logic Patterns: Effect System', () => {
  let testFiber: Fiber;
  let mockContext: JLVMContext;

  beforeEach(() => {
    mockContext = {
      state: { amount: 100, ownerAddress: "DAGowner123..." },
      event: { amount: 50, newOwner: "DAGbuyer456..." },
      eventName: "transfer",
      machineId: "fiber-uuid-123",
      currentStateId: "active",
      sequenceNumber: 5,
      proofs: [{ address: "DAGowner123...", id: "key1", signature: "sig1" }]
    };
  });

  describe('Basic Effect Patterns', () => {
    it('should apply merge effect preserving existing state', () => {
      // ARRANGE: Merge effect
      const mergeEffect = { "merge": [{ "var": "state" }, { "newField": { "var": "event.amount" } }] };
      
      // ACT: Apply effect
      const result = evaluateJSONLogic(mergeEffect, mockContext);
      
      // ASSERT: Should merge new field while preserving existing
      expect(result.amount).toBe(100); // Preserved
      expect(result.ownerAddress).toBe("DAGowner123..."); // Preserved
      expect(result.newField).toBe(50); // Added
    });

    it('should apply effect to replace state entirely (dangerous pattern)', () => {
      // ARRANGE: Complete replacement effect
      const replaceEffect = {
        "newOwner": { "var": "event.newOwner" },
        "transferredAt": { "var": "sequenceNumber" }
      };
      
      // ACT: Apply effect
      const result = evaluateJSONLogic(replaceEffect, mockContext);
      
      // ASSERT: Should create entirely new state
      expect(result.newOwner).toBe("DAGbuyer456...");
      expect(result.transferredAt).toBe(5);
      expect(result.amount).toBeUndefined(); // Lost!
      expect(result.ownerAddress).toBeUndefined(); // Lost!
    });

    it('should apply counter increment effect', () => {
      // ARRANGE: Counter increment effect
      const counterContext = {
        ...mockContext,
        state: { ...mockContext.state, count: 3 }
      };
      
      const incrementEffect = { "merge": [{ "var": "state" }, { "count": { "+": [{ "var": "state.count" }, 1] } }] };
      
      // ACT: Apply increment effect
      const result = evaluateJSONLogic(incrementEffect, counterContext);
      
      // ASSERT: Should increment counter
      expect(result.count).toBe(4);
      expect(result.amount).toBe(100); // Preserved
    });

    it('should apply ownership transfer effect', () => {
      // ARRANGE: Ownership transfer effect
      const ownershipEffect = {
        "merge": [
          { "var": "state" },
          {
            "previousOwner": { "var": "state.ownerAddress" },
            "ownerAddress": { "var": "event.newOwner" },
            "transferredAt": { "var": "sequenceNumber" }
          }
        ]
      };
      
      // ACT: Apply ownership effect
      const result = evaluateJSONLogic(ownershipEffect, mockContext);
      
      // ASSERT: Should transfer ownership
      expect(result.previousOwner).toBe("DAGowner123...");
      expect(result.ownerAddress).toBe("DAGbuyer456...");
      expect(result.transferredAt).toBe(5);
      expect(result.amount).toBe(100); // Preserved
    });

    it('should apply conditional state update effect', () => {
      // ARRANGE: Conditional effect
      const conditionalEffect = {
        "merge": [
          { "var": "state" },
          {
            "amount": {
              "if": [
                { "var": "event.amount" },
                { "var": "event.amount" },
                { "var": "state.amount" }
              ]
            }
          }
        ]
      };
      
      // Test with event.amount present
      const result1 = evaluateJSONLogic(conditionalEffect, mockContext);
      expect(result1.amount).toBe(50); // From event
      
      // Test with event.amount absent
      const contextNoAmount = { ...mockContext, event: { newOwner: "DAGbuyer456..." } };
      const result2 = evaluateJSONLogic(conditionalEffect, contextNoAmount);
      expect(result2.amount).toBe(100); // From state (preserved)
    });
  });

  describe('Special Effect Keys', () => {
    it('should handle _oracleCall effect key', () => {
      // ARRANGE: Oracle call effect
      const oracleEffect = {
        "merge": [{ "var": "state" }, { "localField": "updated" }],
        "_oracleCall": {
          "fiberId": { "var": "state.oracleFiberId" },
          "method": "processPayment",
          "args": {
            "amount": { "var": "event.amount" },
            "recipient": { "var": "event.newOwner" }
          }
        }
      };
      
      const contextWithOracle = {
        ...mockContext,
        state: { ...mockContext.state, oracleFiberId: "oracle-123" }
      };
      
      // ACT: Apply oracle effect
      const result = evaluateJSONLogic(oracleEffect, contextWithOracle);
      
      // ASSERT: Local state updated, _oracleCall extracted
      expect(result.localField).toBe("updated");
      expect(result.amount).toBe(100); // Preserved
      expect(result._oracleCall).toBeDefined(); // Should be extracted as side effect
      expect(result._oracleCall.fiberId).toBe("oracle-123");
      expect(result._oracleCall.method).toBe("processPayment");
    });

    it('should handle _emit effect key', () => {
      // ARRANGE: Emit effect
      const emitEffect = {
        "merge": [{ "var": "state" }, { "completedAt": { "var": "sequenceNumber" } }],
        "_emit": [
          {
            "name": "asset_transferred",
            "data": {
              "assetId": { "var": "state.assetId" },
              "from": { "var": "state.ownerAddress" },
              "to": { "var": "event.newOwner" }
            }
          }
        ]
      };
      
      const contextWithAsset = {
        ...mockContext,
        state: { ...mockContext.state, assetId: "asset-456" }
      };
      
      // ACT: Apply emit effect
      const result = evaluateJSONLogic(emitEffect, contextWithAsset);
      
      // ASSERT: State updated, _emit extracted
      expect(result.completedAt).toBe(5);
      expect(result.amount).toBe(100); // Preserved
      expect(result._emit).toBeDefined(); // Should be extracted as side effect
      expect(result._emit[0].name).toBe("asset_transferred");
      expect(result._emit[0].data.assetId).toBe("asset-456");
    });
  });
});

describe('DFA + JSON Logic Patterns: Standard Lifecycle Templates', () => {
  
  describe('Simple Binary Template (Draft → Active | Cancelled)', () => {
    let binaryTemplate: StateMachineDefinition;

    beforeEach(() => {
      binaryTemplate = {
        states: {
          "draft": { id: { value: "draft" }, isFinal: false, metadata: null },
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "cancelled": { id: { value: "cancelled" }, isFinal: true, metadata: null }
        },
        initialState: { value: "draft" },
        transitions: [
          {
            from: { value: "draft" },
            to: { value: "active" },
            eventName: "activate",
            guard: { "!!": [{ "var": "event.activatedBy" }] },
            effect: { "merge": [{ "var": "state" }, { "activatedBy": { "var": "event.activatedBy" }, "activatedAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          },
          {
            from: { value: "draft" },
            to: { value: "cancelled" },
            eventName: "cancel",
            guard: { "==": [1, 1] },
            effect: { "merge": [{ "var": "state" }, { "cancelledAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          },
          {
            from: { value: "active" },
            to: { value: "cancelled" },
            eventName: "cancel",
            guard: { "==": [1, 1] },
            effect: { "merge": [{ "var": "state" }, { "cancelledAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          }
        ]
      };
    });

    it('should validate binary template structure', () => {
      // ACT: Validate template
      const validation = validateStateMachineDefinition(binaryTemplate);
      
      // ASSERT: Should be valid
      expect(() => validation).not.toThrow();
      
      // ASSERT: Has correct states
      expect(binaryTemplate.states.draft.isFinal).toBe(false);
      expect(binaryTemplate.states.active.isFinal).toBe(false);
      expect(binaryTemplate.states.cancelled.isFinal).toBe(true);
    });

    it('should support draft → active transition', () => {
      // ARRANGE: Draft fiber
      const draftFiber: Fiber = {
        fiberId: "binary-test-123",
        currentState: { value: "draft" },
        stateData: { createdBy: "DAGuser123..." },
        sequenceNumber: 0,
        definition: binaryTemplate,
        status: "ACTIVE",
        isFinal: false
      };
      
      const activateEvent: DataUpdate = {
        fiberId: draftFiber.fiberId,
        event: "activate",
        payload: { activatedBy: "DAGmanager456..." },
        targetSequenceNumber: 0,
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Process activation
      const result = processTransitionStateMachine(draftFiber, activateEvent);
      
      // ASSERT: Should activate successfully
      expect(result.success).toBe(true);
      expect(result.newState).toBe("active");
      expect(result.newStateData.activatedBy).toBe("DAGmanager456...");
      expect(result.newStateData.createdBy).toBe("DAGuser123..."); // Preserved
    });

    it('should support cancellation from both draft and active states', () => {
      // Test cancellation from draft
      const draftFiber: Fiber = {
        fiberId: "binary-test-123",
        currentState: { value: "draft" },
        stateData: { createdBy: "DAGuser123..." },
        sequenceNumber: 0,
        definition: binaryTemplate,
        status: "ACTIVE",
        isFinal: false
      };
      
      const cancelEvent: DataUpdate = {
        fiberId: draftFiber.fiberId,
        event: "cancel",
        payload: {},
        targetSequenceNumber: 0,
        proofs: [{ address: "DAGuser123...", id: "key1", signature: "sig1" }]
      };
      
      // ACT: Cancel from draft
      const result1 = processTransitionStateMachine(draftFiber, cancelEvent);
      
      // ASSERT: Should cancel from draft
      expect(result1.success).toBe(true);
      expect(result1.newState).toBe("cancelled");
      
      // Test cancellation from active
      const activeFiber = { ...draftFiber, currentState: { value: "active" } };
      const result2 = processTransitionStateMachine(activeFiber, cancelEvent);
      
      // ASSERT: Should cancel from active
      expect(result2.success).toBe(true);
      expect(result2.newState).toBe("cancelled");
    });
  });

  describe('Linear Approval Chain (Draft → Submitted → Approved | Rejected)', () => {
    let approvalChainTemplate: StateMachineDefinition;

    beforeEach(() => {
      approvalChainTemplate = {
        states: {
          "draft": { id: { value: "draft" }, isFinal: false, metadata: null },
          "submitted": { id: { value: "submitted" }, isFinal: false, metadata: null },
          "approved": { id: { value: "approved" }, isFinal: true, metadata: null },
          "rejected": { id: { value: "rejected" }, isFinal: true, metadata: null }
        },
        initialState: { value: "draft" },
        transitions: [
          {
            from: { value: "draft" },
            to: { value: "submitted" },
            eventName: "submit",
            guard: { "!!": [{ "var": "event.submittedBy" }] },
            effect: { "merge": [{ "var": "state" }, { "submittedBy": { "var": "event.submittedBy" }, "submittedAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          },
          {
            from: { value: "submitted" },
            to: { value: "approved" },
            eventName: "approve",
            guard: { "!!": [{ "var": "event.approver" }] },
            effect: { "merge": [{ "var": "state" }, { "approvedBy": { "var": "event.approver" }, "approvedAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          },
          {
            from: { value: "submitted" },
            to: { value: "rejected" },
            eventName: "reject",
            guard: { "!!": [{ "var": "event.approver" }] },
            effect: { "merge": [{ "var": "state" }, { "rejectedBy": { "var": "event.approver" }, "reason": { "var": "event.reason" }, "rejectedAt": { "var": "sequenceNumber" } }] },
            dependencies: []
          }
        ]
      };
    });

    it('should enforce sequential progression through approval chain', () => {
      // ARRANGE: Draft fiber
      const draftFiber: Fiber = {
        fiberId: "approval-test-123",
        currentState: { value: "draft" },
        stateData: { documentId: "doc-456", author: "DAGuser123..." },
        sequenceNumber: 0,
        definition: approvalChainTemplate,
        status: "ACTIVE",
        isFinal: false
      };
      
      // ACT: Try to approve directly from draft (should fail)
      const directApproveEvent: DataUpdate = {
        fiberId: draftFiber.fiberId,
        event: "approve",
        payload: { approver: "DAGmanager456..." },
        targetSequenceNumber: 0,
        proofs: [{ address: "DAGmanager456...", id: "key1", signature: "sig1" }]
      };
      
      const result1 = processTransitionStateMachine(draftFiber, directApproveEvent);
      
      // ASSERT: Should fail (no transition from draft to approved)
      expect(result1.success).toBe(false);
      expect(result1.error).toBe("NO_MATCHING_TRANSITION");
      
      // ACT: Submit first
      const submitEvent: DataUpdate = {
        fiberId: draftFiber.fiberId,
        event: "submit",
        payload: { submittedBy: "DAGuser123..." },
        targetSequenceNumber: 0,
        proofs: [{ address: "DAGuser123...", id: "key1", signature: "sig1" }]
      };
      
      const result2 = processTransitionStateMachine(draftFiber, submitEvent);
      
      // ASSERT: Should succeed
      expect(result2.success).toBe(true);
      expect(result2.newState).toBe("submitted");
      
      // ACT: Then approve
      const submittedFiber = {
        ...draftFiber,
        currentState: { value: "submitted" },
        stateData: result2.newStateData,
        sequenceNumber: 1
      };
      
      const approveAfterSubmitEvent = { ...directApproveEvent, targetSequenceNumber: 1 };
      const result3 = processTransitionStateMachine(submittedFiber, approveAfterSubmitEvent);
      
      // ASSERT: Should succeed after proper submission
      expect(result3.success).toBe(true);
      expect(result3.newState).toBe("approved");
    });
  });
});

describe('DFA + JSON Logic Patterns: Digital Sports Collectible Example', () => {
  let collectibleSM: StateMachineDefinition;
  let collectibleFiber: Fiber;

  beforeEach(() => {
    // Full digital sports collectible state machine from the spec
    collectibleSM = {
      states: {
        "minted": { id: { value: "minted" }, isFinal: false, metadata: { description: "Newly created, held by creator" } },
        "listed": { id: { value: "listed" }, isFinal: false, metadata: { description: "On marketplace, available for purchase" } },
        "owned": { id: { value: "owned" }, isFinal: false, metadata: { description: "Held by owner, off market" } },
        "governance_locked": { id: { value: "governance_locked" }, isFinal: false, metadata: { description: "Locked by validator" } },
        "expired": { id: { value: "expired" }, isFinal: true, metadata: { description: "Past expiry" } },
        "burned": { id: { value: "burned" }, isFinal: true, metadata: { description: "Permanently destroyed" } }
      },
      initialState: { value: "minted" },
      transitions: [
        {
          from: { value: "minted" },
          to: { value: "listed" },
          eventName: "list",
          guard: {
            "and": [
              { "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
              { ">=": [{ "var": "event.askingPrice" }, 1] },
              { "!!": [{ "var": "event.currency" }] }
            ]
          },
          effect: {
            "merge": [
              { "var": "state" },
              {
                "askingPrice": { "var": "event.askingPrice" },
                "currency": { "var": "event.currency" },
                "listedAt": { "var": "sequenceNumber" }
              }
            ]
          },
          dependencies: []
        },
        {
          from: { value: "listed" },
          to: { value: "owned" },
          eventName: "purchase",
          guard: {
            "and": [
              { "!!": [{ "var": "event.buyerAddress" }] },
              { "===": [{ "var": "event.paidAmount" }, { "var": "state.askingPrice" }] },
              { "===": [{ "var": "event.currency" }, { "var": "state.currency" }] },
              { "!": [{ "===": [{ "var": "event.buyerAddress" }, { "var": "state.ownerAddress" }] }] }
            ]
          },
          effect: {
            "merge": [
              { "var": "state" },
              {
                "previousOwner": { "var": "state.ownerAddress" },
                "ownerAddress": { "var": "event.buyerAddress" },
                "purchasePrice": { "var": "event.paidAmount" },
                "purchasedAt": { "var": "sequenceNumber" },
                "askingPrice": null,
                "currency": null,
                "listedAt": null,
                "transferCount": { "+": [{ "var": "state.transferCount" }, 1] }
              }
            ]
          },
          dependencies: []
        },
        {
          from: { value: "owned" },
          to: { value: "owned" },
          eventName: "transfer",
          guard: {
            "and": [
              { "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
              { "!!": [{ "var": "event.recipientAddress" }] },
              { "!": [{ "===": [{ "var": "event.recipientAddress" }, { "var": "state.ownerAddress" }] }] }
            ]
          },
          effect: {
            "merge": [
              { "var": "state" },
              {
                "previousOwner": { "var": "state.ownerAddress" },
                "ownerAddress": { "var": "event.recipientAddress" },
                "transferredAt": { "var": "sequenceNumber" },
                "transferCount": { "+": [{ "var": "state.transferCount" }, 1] }
              }
            ]
          },
          dependencies: []
        },
        {
          from: { value: "owned" },
          to: { value: "governance_locked" },
          eventName: "lock",
          guard: {
            "and": [
              { "===": [{ "var": "proofs.0.address" }, { "var": "state.validatorAddress" }] },
              { "!!": [{ "var": "event.lockReason" }] }
            ]
          },
          effect: {
            "merge": [
              { "var": "state" },
              {
                "lockReason": { "var": "event.lockReason" },
                "lockedAt": { "var": "sequenceNumber" },
                "lockedBy": { "var": "proofs.0.address" }
              }
            ]
          },
          dependencies: []
        },
        {
          from: { value: "governance_locked" },
          to: { value: "owned" },
          eventName: "unlock",
          guard: { "===": [{ "var": "proofs.0.address" }, { "var": "state.validatorAddress" }] },
          effect: {
            "merge": [
              { "var": "state" },
              { "lockReason": null, "lockedAt": null, "lockedBy": null, "unlockedAt": { "var": "sequenceNumber" } }
            ]
          },
          dependencies: []
        },
        {
          from: { value: "owned" },
          to: { value: "expired" },
          eventName: "expire",
          guard: {
            "and": [
              { ">": [{ "var": "state.expiresAtSequence" }, 0] },
              { ">=": [{ "var": "sequenceNumber" }, { "var": "state.expiresAtSequence" }] }
            ]
          },
          effect: { "merge": [{ "var": "state" }, { "expiredAt": { "var": "sequenceNumber" } }] },
          dependencies: []
        },
        {
          from: { value: "owned" },
          to: { value: "burned" },
          eventName: "burn",
          guard: { "===": [{ "var": "proofs.0.address" }, { "var": "state.ownerAddress" }] },
          effect: { "merge": [{ "var": "state" }, { "burnedAt": { "var": "sequenceNumber" } }] },
          dependencies: []
        }
      ],
      metadata: {
        name: "DigitalSportsCollectible",
        description: "Collectible lifecycle with governance and expiry",
        asset_model: "true",
        version: "1.0.0"
      }
    };

    collectibleFiber = {
      fiberId: "collectible-2026-season-001",
      currentState: { value: "minted" },
      stateData: {
        assetId: "collectible-2026-season-001",
        assetType: "sports_collectible",
        ownerAddress: "DAGcreator123...",
        validatorAddress: "DAGvalidator456...",
        expiresAtSequence: 500,
        transferCount: 0,
        createdAt: 1
      },
      sequenceNumber: 1,
      definition: collectibleSM,
      status: "ACTIVE",
      isFinal: false
    };
  });

  it('should create collectible fiber in minted state', () => {
    // ARRANGE: CreateStateMachine request
    const createRequest = {
      fiberId: "new-collectible-789",
      definition: collectibleSM,
      initialData: {
        assetId: "collectible-2026-season-002",
        ownerAddress: "DAGcreator789...",
        validatorAddress: "DAGvalidator456...",
        expiresAtSequence: 1000,
        transferCount: 0
      }
    };
    
    // ACT: Create collectible
    const fiber = createStateMachineFiber(createRequest);
    
    // ASSERT: Should start in minted state
    expect(fiber.currentState.value).toBe("minted");
    expect(fiber.stateData.assetId).toBe("collectible-2026-season-002");
    expect(fiber.stateData.transferCount).toBe(0);
  });

  it('should support minted → listed transition from owner with valid price', () => {
    // ARRANGE: List event from owner
    const listEvent: DataUpdate = {
      fiberId: collectibleFiber.fiberId,
      event: "list",
      payload: { askingPrice: 100, currency: "DAG" },
      targetSequenceNumber: 1,
      proofs: [{ address: "DAGcreator123...", id: "key1", signature: "sig1" }] // Owner
    };
    
    // ACT: Process listing
    const result = processTransitionStateMachine(collectibleFiber, listEvent);
    
    // ASSERT: Should list successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("listed");
    expect(result.newStateData.askingPrice).toBe(100);
    expect(result.newStateData.currency).toBe("DAG");
    expect(result.newStateData.listedAt).toBe(1);
    expect(result.newStateData.ownerAddress).toBe("DAGcreator123..."); // Preserved
  });

  it('should reject listing from non-owner', () => {
    // ARRANGE: List event from non-owner
    const listEvent: DataUpdate = {
      fiberId: collectibleFiber.fiberId,
      event: "list",
      payload: { askingPrice: 100, currency: "DAG" },
      targetSequenceNumber: 1,
      proofs: [{ address: "DAGstranger999...", id: "key1", signature: "sig1" }] // Not owner
    };
    
    // ACT: Process listing
    const result = processTransitionStateMachine(collectibleFiber, listEvent);
    
    // ASSERT: Should reject non-owner listing
    expect(result.success).toBe(false);
    expect(result.error).toBe("GUARD_FAILED");
  });

  it('should support listed → owned transition on valid purchase', () => {
    // ARRANGE: Listed collectible
    const listedFiber = {
      ...collectibleFiber,
      currentState: { value: "listed" },
      stateData: {
        ...collectibleFiber.stateData,
        askingPrice: 250,
        currency: "DAG",
        listedAt: 2
      },
      sequenceNumber: 2
    };
    
    const purchaseEvent: DataUpdate = {
      fiberId: listedFiber.fiberId,
      event: "purchase",
      payload: {
        buyerAddress: "DAGbuyer789...",
        paidAmount: 250,
        currency: "DAG"
      },
      targetSequenceNumber: 2,
      proofs: [{ address: "DAGbuyer789...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Process purchase
    const result = processTransitionStateMachine(listedFiber, purchaseEvent);
    
    // ASSERT: Should purchase successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("owned");
    expect(result.newStateData.ownerAddress).toBe("DAGbuyer789...");
    expect(result.newStateData.previousOwner).toBe("DAGcreator123...");
    expect(result.newStateData.purchasePrice).toBe(250);
    expect(result.newStateData.transferCount).toBe(1);
    expect(result.newStateData.askingPrice).toBe(null); // Cleared
  });

  it('should reject purchase with wrong price', () => {
    // ARRANGE: Listed collectible
    const listedFiber = {
      ...collectibleFiber,
      currentState: { value: "listed" },
      stateData: {
        ...collectibleFiber.stateData,
        askingPrice: 250,
        currency: "DAG"
      },
      sequenceNumber: 2
    };
    
    const wrongPriceEvent: DataUpdate = {
      fiberId: listedFiber.fiberId,
      event: "purchase",
      payload: {
        buyerAddress: "DAGbuyer789...",
        paidAmount: 200, // Wrong amount
        currency: "DAG"
      },
      targetSequenceNumber: 2,
      proofs: [{ address: "DAGbuyer789...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Process purchase
    const result = processTransitionStateMachine(listedFiber, wrongPriceEvent);
    
    // ASSERT: Should reject wrong price
    expect(result.success).toBe(false);
    expect(result.error).toBe("GUARD_FAILED");
  });

  it('should reject self-purchase', () => {
    // ARRANGE: Listed collectible
    const listedFiber = {
      ...collectibleFiber,
      currentState: { value: "listed" },
      stateData: {
        ...collectibleFiber.stateData,
        askingPrice: 250,
        currency: "DAG"
      },
      sequenceNumber: 2
    };
    
    const selfPurchaseEvent: DataUpdate = {
      fiberId: listedFiber.fiberId,
      event: "purchase",
      payload: {
        buyerAddress: "DAGcreator123...", // Same as owner
        paidAmount: 250,
        currency: "DAG"
      },
      targetSequenceNumber: 2,
      proofs: [{ address: "DAGcreator123...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Process self-purchase
    const result = processTransitionStateMachine(listedFiber, selfPurchaseEvent);
    
    // ASSERT: Should reject self-purchase
    expect(result.success).toBe(false);
    expect(result.error).toBe("GUARD_FAILED");
  });

  it('should support owned → owned transfer from owner', () => {
    // ARRANGE: Owned collectible
    const ownedFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      stateData: {
        ...collectibleFiber.stateData,
        ownerAddress: "DAGowner456...",
        transferCount: 1
      },
      sequenceNumber: 3
    };
    
    const transferEvent: DataUpdate = {
      fiberId: ownedFiber.fiberId,
      event: "transfer",
      payload: { recipientAddress: "DAGrecipient789..." },
      targetSequenceNumber: 3,
      proofs: [{ address: "DAGowner456...", id: "key1", signature: "sig1" }] // Owner
    };
    
    // ACT: Process transfer
    const result = processTransitionStateMachine(ownedFiber, transferEvent);
    
    // ASSERT: Should transfer successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("owned"); // Stays in owned
    expect(result.newStateData.ownerAddress).toBe("DAGrecipient789...");
    expect(result.newStateData.previousOwner).toBe("DAGowner456...");
    expect(result.newStateData.transferCount).toBe(2); // Incremented
  });

  it('should support governance locking from validator', () => {
    // ARRANGE: Owned collectible
    const ownedFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      sequenceNumber: 3
    };
    
    const lockEvent: DataUpdate = {
      fiberId: ownedFiber.fiberId,
      event: "lock",
      payload: { lockReason: "suspicious_activity" },
      targetSequenceNumber: 3,
      proofs: [{ address: "DAGvalidator456...", id: "key1", signature: "sig1" }] // Validator
    };
    
    // ACT: Process lock
    const result = processTransitionStateMachine(ownedFiber, lockEvent);
    
    // ASSERT: Should lock successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("governance_locked");
    expect(result.newStateData.lockReason).toBe("suspicious_activity");
    expect(result.newStateData.lockedBy).toBe("DAGvalidator456...");
  });

  it('should reject locking from non-validator', () => {
    // ARRANGE: Owned collectible
    const ownedFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      sequenceNumber: 3
    };
    
    const lockEvent: DataUpdate = {
      fiberId: ownedFiber.fiberId,
      event: "lock",
      payload: { lockReason: "malicious_lock" },
      targetSequenceNumber: 3,
      proofs: [{ address: "DAGmalicious999...", id: "key1", signature: "sig1" }] // Not validator
    };
    
    // ACT: Process lock
    const result = processTransitionStateMachine(ownedFiber, lockEvent);
    
    // ASSERT: Should reject non-validator lock
    expect(result.success).toBe(false);
    expect(result.error).toBe("GUARD_FAILED");
  });

  it('should support sequence-number-based expiry', () => {
    // ARRANGE: Owned collectible near expiry
    const nearExpiryFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      stateData: {
        ...collectibleFiber.stateData,
        expiresAtSequence: 500
      },
      sequenceNumber: 500 // At expiry threshold
    };
    
    const expireEvent: DataUpdate = {
      fiberId: nearExpiryFiber.fiberId,
      event: "expire",
      payload: {},
      targetSequenceNumber: 500,
      proofs: [{ address: "DAGanyone123...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Process expiry
    const result = processTransitionStateMachine(nearExpiryFiber, expireEvent);
    
    // ASSERT: Should expire successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("expired");
    expect(result.newStateData.expiredAt).toBe(500);
  });

  it('should reject premature expiry', () => {
    // ARRANGE: Owned collectible before expiry
    const beforeExpiryFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      stateData: {
        ...collectibleFiber.stateData,
        expiresAtSequence: 500
      },
      sequenceNumber: 400 // Before expiry
    };
    
    const prematureExpireEvent: DataUpdate = {
      fiberId: beforeExpiryFiber.fiberId,
      event: "expire",
      payload: {},
      targetSequenceNumber: 400,
      proofs: [{ address: "DAGanyone123...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Process premature expiry
    const result = processTransitionStateMachine(beforeExpiryFiber, prematureExpireEvent);
    
    // ASSERT: Should reject premature expiry
    expect(result.success).toBe(false);
    expect(result.error).toBe("GUARD_FAILED");
  });

  it('should support burning from owner', () => {
    // ARRANGE: Owned collectible
    const ownedFiber = {
      ...collectibleFiber,
      currentState: { value: "owned" },
      sequenceNumber: 3
    };
    
    const burnEvent: DataUpdate = {
      fiberId: ownedFiber.fiberId,
      event: "burn",
      payload: {},
      targetSequenceNumber: 3,
      proofs: [{ address: "DAGcreator123...", id: "key1", signature: "sig1" }] // Owner
    };
    
    // ACT: Process burn
    const result = processTransitionStateMachine(ownedFiber, burnEvent);
    
    // ASSERT: Should burn successfully
    expect(result.success).toBe(true);
    expect(result.newState).toBe("burned");
    expect(result.newStateData.burnedAt).toBe(3);
  });

  it('should reject all events on final states (expired, burned)', () => {
    // Test expired state
    const expiredFiber = {
      ...collectibleFiber,
      currentState: { value: "expired" },
      isFinal: true,
      sequenceNumber: 10
    };
    
    const anyEvent: DataUpdate = {
      fiberId: expiredFiber.fiberId,
      event: "transfer",
      payload: { recipientAddress: "DAGanyone123..." },
      targetSequenceNumber: 10,
      proofs: [{ address: "DAGcreator123...", id: "key1", signature: "sig1" }]
    };
    
    // ACT: Try event on expired fiber
    const result1 = processTransitionStateMachine(expiredFiber, anyEvent);
    
    // ASSERT: Should reject
    expect(result1.success).toBe(false);
    expect(result1.error).toBe("FINAL_STATE");
    
    // Test burned state
    const burnedFiber = { ...expiredFiber, currentState: { value: "burned" } };
    const result2 = processTransitionStateMachine(burnedFiber, anyEvent);
    
    // ASSERT: Should reject
    expect(result2.success).toBe(false);
    expect(result2.error).toBe("FINAL_STATE");
  });
});

describe('DFA + JSON Logic Patterns: Anti-Patterns Detection', () => {
  
  describe('State Explosion Anti-Pattern', () => {
    it('should detect state explosion (too many states for simple attributes)', () => {
      // ARRANGE: State machine with explosive state count
      const explosiveSM: StateMachineDefinition = {
        states: {
          // Wrong: separate states for each attribute combination
          "listed_public_active": { id: { value: "listed_public_active" }, isFinal: false, metadata: null },
          "listed_public_paused": { id: { value: "listed_public_paused" }, isFinal: false, metadata: null },
          "listed_private_active": { id: { value: "listed_private_active" }, isFinal: false, metadata: null },
          "listed_private_paused": { id: { value: "listed_private_paused" }, isFinal: false, metadata: null },
          "owned_locked_active": { id: { value: "owned_locked_active" }, isFinal: false, metadata: null },
          "owned_locked_paused": { id: { value: "owned_locked_paused" }, isFinal: false, metadata: null },
          "owned_unlocked_active": { id: { value: "owned_unlocked_active" }, isFinal: false, metadata: null },
          "owned_unlocked_paused": { id: { value: "owned_unlocked_paused" }, isFinal: false, metadata: null }
        },
        initialState: { value: "listed_public_active" },
        transitions: []
      };
      
      // ACT: Analyze for anti-patterns
      const analysis = detectAntiPatterns(explosiveSM);
      
      // ASSERT: Should detect state explosion
      expect(analysis.hasStateExplosion).toBe(true);
      expect(analysis.stateCount).toBe(8);
      expect(analysis.recommendations).toContain(
        "Use 3 states (listed, owned, final) with attributes in state data instead of 8 separate states"
      );
    });
  });

  describe('Missing Error States Anti-Pattern', () => {
    it('should detect states with no error exit paths', () => {
      // ARRANGE: SM with stuck states
      const stuckSM: StateMachineDefinition = {
        states: {
          "pending": { id: { value: "pending" }, isFinal: false, metadata: null },
          "success": { id: { value: "success" }, isFinal: true, metadata: null }
          // Missing error/failure state
        },
        initialState: { value: "pending" },
        transitions: [
          {
            from: { value: "pending" },
            to: { value: "success" },
            eventName: "complete",
            guard: { ">=": [{ "var": "event.score" }, 100] }, // What if score < 100?
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze reachability
      const analysis = detectAntiPatterns(stuckSM);
      
      // ASSERT: Should detect missing error exits
      expect(analysis.hasMissingErrorStates).toBe(true);
      expect(analysis.unreachableEvents).toContain("complete with score < 100");
    });
  });

  describe('Circular Transitions Anti-Pattern', () => {
    it('should detect circular transitions without termination', () => {
      // ARRANGE: SM with infinite loop and no terminal states
      const circularSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "locked": { id: { value: "locked" }, isFinal: false, metadata: null }
          // No terminal states - infinite loop possible
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "locked" },
            eventName: "lock",
            guard: { "==": [1, 1] },
            effect: { "var": "state" },
            dependencies: []
          },
          {
            from: { value: "locked" },
            to: { value: "active" },
            eventName: "unlock",
            guard: { "==": [1, 1] },
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze termination
      const analysis = detectAntiPatterns(circularSM);
      
      // ASSERT: Should detect lack of terminal states
      expect(analysis.hasNoTerminalStates).toBe(true);
      expect(analysis.recommendations).toContain(
        "Add terminal states (burned, expired, etc.) to prevent infinite loops"
      );
    });
  });

  describe('Timestamp Anti-Pattern', () => {
    it('should detect usage of $timestamp in guards', () => {
      // ARRANGE: SM using non-deterministic timestamp
      const timestampSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "expired": { id: { value: "expired" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "expired" },
            eventName: "expire",
            guard: { ">=": [{ "var": "$timestamp" }, { "var": "state.expiresAt" }] }, // Wrong!
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze for timestamp usage
      const analysis = detectAntiPatterns(timestampSM);
      
      // ASSERT: Should detect timestamp anti-pattern
      expect(analysis.usesTimestamp).toBe(true);
      expect(analysis.recommendations).toContain(
        "Replace $timestamp with sequenceNumber for deterministic time-based guards"
      );
    });
  });

  describe('Event.initiator Anti-Pattern', () => {
    it('should detect usage of event.initiator for access control', () => {
      // ARRANGE: SM using insecure event.initiator
      const insecureSM: StateMachineDefinition = {
        states: {
          "active": { id: { value: "active" }, isFinal: false, metadata: null },
          "restricted": { id: { value: "restricted" }, isFinal: true, metadata: null }
        },
        initialState: { value: "active" },
        transitions: [
          {
            from: { value: "active" },
            to: { value: "restricted" },
            eventName: "restrict",
            guard: { "===": [{ "var": "event.initiator" }, "DAGadmin123..."] }, // Wrong!
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Analyze for security issues
      const analysis = detectAntiPatterns(insecureSM);
      
      // ASSERT: Should detect insecure access control
      expect(analysis.usesEventInitiator).toBe(true);
      expect(analysis.securityIssues).toContain(
        "event.initiator is user-controlled - use proofs.0.address for access control"
      );
    });
  });

  describe('Overlapping Guards Anti-Pattern', () => {
    it('should detect non-exclusive guards on same (from, eventName)', () => {
      // ARRANGE: SM with overlapping guards (from earlier test)
      const overlappingSM: StateMachineDefinition = {
        states: {
          "playing": { id: { value: "playing" }, isFinal: false, metadata: null },
          "won": { id: { value: "won" }, isFinal: true, metadata: null },
          "lost": { id: { value: "lost" }, isFinal: true, metadata: null }
        },
        initialState: { value: "playing" },
        transitions: [
          {
            from: { value: "playing" },
            to: { value: "won" },
            eventName: "finish",
            guard: { ">=": [{ "var": "event.score" }, 50] },
            effect: { "var": "state" },
            dependencies: []
          },
          {
            from: { value: "playing" },
            to: { value: "lost" },
            eventName: "finish",
            guard: { "<=": [{ "var": "event.score" }, 100] }, // Overlaps!
            effect: { "var": "state" },
            dependencies: []
          }
        ]
      };
      
      // ACT: Detect overlapping guards
      const analysis = detectAntiPatterns(overlappingSM);
      
      // ASSERT: Should flag overlap
      expect(analysis.hasOverlappingGuards).toBe(true);
      expect(analysis.overlappingTransitions).toHaveLength(1);
      expect(analysis.overlappingTransitions[0].eventName).toBe("finish");
    });
  });
});

describe('DFA + JSON Logic Patterns: Design Checklist Validation', () => {
  
  it('should validate complete design checklist', () => {
    // ARRANGE: Well-designed state machine
    const wellDesignedSM: StateMachineDefinition = {
      states: {
        "draft": { id: { value: "draft" }, isFinal: false, metadata: null },
        "active": { id: { value: "active" }, isFinal: false, metadata: null },
        "completed": { id: { value: "completed" }, isFinal: true, metadata: null },
        "cancelled": { id: { value: "cancelled" }, isFinal: true, metadata: null }
      },
      initialState: { value: "draft" },
      transitions: [
        {
          from: { value: "draft" },
          to: { value: "active" },
          eventName: "activate",
          guard: { "===": [{ "var": "proofs.0.address" }, { "var": "state.creatorAddress" }] },
          effect: { "merge": [{ "var": "state" }, { "activatedAt": { "var": "sequenceNumber" } }] },
          dependencies: []
        },
        {
          from: { value: "active" },
          to: { value: "completed" },
          eventName: "complete",
          guard: { "!!": [{ "var": "event.completedBy" }] },
          effect: { "merge": [{ "var": "state" }, { "completedBy": { "var": "event.completedBy" } }] },
          dependencies: []
        },
        {
          from: { value: "draft" },
          to: { value: "cancelled" },
          eventName: "cancel",
          guard: { "==": [1, 1] },
          effect: { "merge": [{ "var": "state" }, { "cancelledAt": { "var": "sequenceNumber" } }] },
          dependencies: []
        },
        {
          from: { value: "active" },
          to: { value: "cancelled" },
          eventName: "cancel",
          guard: { "==": [1, 1] },
          effect: { "merge": [{ "var": "state" }, { "cancelledAt": { "var": "sequenceNumber" } }] },
          dependencies: []
        }
      ],
      metadata: { name: "WellDesigned", asset_model: "true" }
    };
    
    // ACT: Run full checklist validation
    const checklist = validateDesignChecklist(wellDesignedSM);
    
    // ASSERT: Should pass all checklist items
    expect(checklist.completeness.everyNonTerminalHasExit).toBe(true);
    expect(checklist.completeness.everyStateHasPathToTerminal).toBe(true);
    expect(checklist.completeness.allEventsHandled).toBe(true);
    
    expect(checklist.determinism.guardsAreMutuallyExclusive).toBe(true);
    expect(checklist.determinism.noTimestampUsage).toBe(true);
    expect(checklist.determinism.noOrdinalUsage).toBe(true); // $ordinal not used
    expect(checklist.determinism.usesSequenceNumber).toBe(true);
    
    expect(checklist.security.allTransitionsCheckCaller).toBe(true);
    expect(checklist.security.noEventInitiatorUsage).toBe(true);
    expect(checklist.security.oracleDependenciesDeclared).toBe(true);
    
    expect(checklist.effects.allUsesMerge).toBe(true);
    expect(checklist.effects.noOracleCallsInGuards).toBe(true);
    
    expect(checklist.terminalStates.allFinalStatesMarked).toBe(true);
    expect(checklist.terminalStates.noTransitionsFromFinal).toBe(true);
    expect(checklist.terminalStates.atLeastOneTerminalReachable).toBe(true);
    
    expect(checklist.assetModel.hasMetadataFlag).toBe(true);
    
    expect(checklist.overallScore).toBe(1.0); // Perfect score
  });
});

// Mock helper functions (these would be implemented in the actual DFA/JLVM framework)

function validateStateMachineDefinition(sm: StateMachineDefinition): void {
  // Mock implementation - would validate structure and consistency
  throw new Error('Not yet implemented - TDD test should fail');
}

function analyzeStateMachineReachability(sm: StateMachineDefinition): {
  stuckStates: string[];
  isValid: boolean;
  unreachableStates: string[];
} {
  // Mock implementation - would analyze reachability and detect stuck states
  throw new Error('Not yet implemented - TDD test should fail');
}

function analyzeGuardExclusivity(sm: StateMachineDefinition): {
  hasOverlappingGuards: boolean;
  overlaps: Array<{ from: string; eventName: string; transitions: number[] }>;
} {
  // Mock implementation - would analyze guard exclusivity
  throw new Error('Not yet implemented - TDD test should fail');
}

function evaluateJSONLogic(expression: JsonLogicExpression, context: JLVMContext): any {
  // Mock implementation - would evaluate JSON Logic expressions
  throw new Error('Not yet implemented - TDD test should fail');
}

function createStateMachineFiber(request: {
  fiberId: string;
  definition: StateMachineDefinition;
  initialData: Record<string, any>;
}): Fiber {
  // Mock implementation - would create new state machine fiber
  throw new Error('Not yet implemented - TDD test should fail');
}

function processTransitionStateMachine(fiber: Fiber, event: DataUpdate): TransitionResult {
  // Mock implementation - would process transition
  throw new Error('Not yet implemented - TDD test should fail');
}

function detectAntiPatterns(sm: StateMachineDefinition): {
  hasStateExplosion: boolean;
  stateCount: number;
  hasMissingErrorStates: boolean;
  hasNoTerminalStates: boolean;
  usesTimestamp: boolean;
  usesEventInitiator: boolean;
  hasOverlappingGuards: boolean;
  recommendations: string[];
  securityIssues: string[];
  unreachableEvents: string[];
  overlappingTransitions: Array<{ eventName: string }>;
} {
  // Mock implementation - would detect anti-patterns
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateDesignChecklist(sm: StateMachineDefinition): {
  completeness: {
    everyNonTerminalHasExit: boolean;
    everyStateHasPathToTerminal: boolean;
    allEventsHandled: boolean;
  };
  determinism: {
    guardsAreMutuallyExclusive: boolean;
    noTimestampUsage: boolean;
    noOrdinalUsage: boolean;
    usesSequenceNumber: boolean;
  };
  security: {
    allTransitionsCheckCaller: boolean;
    noEventInitiatorUsage: boolean;
    oracleDependenciesDeclared: boolean;
  };
  effects: {
    allUsesMerge: boolean;
    noOracleCallsInGuards: boolean;
  };
  terminalStates: {
    allFinalStatesMarked: boolean;
    noTransitionsFromFinal: boolean;
    atLeastOneTerminalReachable: boolean;
  };
  assetModel: {
    hasMetadataFlag: boolean;
  };
  overallScore: number;
} {
  // Mock implementation - would run complete design checklist
  throw new Error('Not yet implemented - TDD test should fail');
}