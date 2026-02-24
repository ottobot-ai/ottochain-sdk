/**
 * Contract State Machine Tests (TDD - SHOULD FAIL)
 * 
 * Tests for contract state machine transitions, guards, and effects.
 * These tests verify the JSON Logic behavior before implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateContractTransition,
  createInitialContractState,
  applyContractEffect,
  ContractTransitionError,
  StateMachineContext,
  ContractEvent,
} from '../state-machine.js';
import { getContractDefinition } from '../index.js';

describe('Contract State Machine', () => {
  let stateMachine: any;

  beforeEach(() => {
    stateMachine = getContractDefinition();
  });

  describe('Initial State', () => {
    it('should create initial PROPOSED state correctly', () => {
      const proposalData = {
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        terms: { title: 'Development Contract' },
        description: 'Mobile app development'
      };

      const initialState = createInitialContractState(proposalData);

      expect(initialState.status).toBe('PROPOSED');
      expect(initialState.proposer).toBe(proposalData.proposer);
      expect(initialState.counterparty).toBe(proposalData.counterparty);
      expect(initialState.terms).toEqual(proposalData.terms);
      expect(initialState.proposedAt).toBeDefined();
      expect(initialState.acceptedAt).toBeUndefined();
      expect(initialState.completedAt).toBeUndefined();
      expect(initialState.completions).toEqual([]);
    });
  });

  describe('PROPOSED → ACTIVE Transition (accept)', () => {
    it('should allow counterparty to accept proposed contract', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        terms: { title: 'Development Contract' },
        proposedAt: '2026-01-01T00:00:00Z'
      };

      const event: ContractEvent = {
        type: 'accept',
        agent: '0x0987654321098765432109876543210987654321', // Counterparty
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('accept', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('accept', context);
      expect(newState.status).toBe('ACTIVE');
      expect(newState.acceptedAt).toBe(event.timestamp);
      expect(newState.proposer).toBe(currentState.proposer);
      expect(newState.counterparty).toBe(currentState.counterparty);
    });

    it('should reject acceptance by proposer', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'accept',
        agent: '0x1234567890123456789012345678901234567890', // Proposer (wrong)
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('accept', context);
      expect(canTransition).toBe(false);
    });

    it('should reject acceptance by third party', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'accept',
        agent: '0x1111111111111111111111111111111111111111', // Third party
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('accept', context);
      expect(canTransition).toBe(false);
    });
  });

  describe('PROPOSED → REJECTED Transition (reject)', () => {
    it('should allow counterparty to reject proposed contract', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'reject',
        agent: '0x0987654321098765432109876543210987654321', // Counterparty
        reason: 'Terms are not acceptable',
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('reject', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('reject', context);
      expect(newState.status).toBe('REJECTED');
      expect(newState.rejectedAt).toBe(event.timestamp);
      expect(newState.rejectReason).toBe(event.reason);
    });
  });

  describe('PROPOSED → CANCELLED Transition (cancel)', () => {
    it('should allow proposer to cancel proposed contract', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'cancel',
        agent: '0x1234567890123456789012345678901234567890', // Proposer
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('cancel', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('cancel', context);
      expect(newState.status).toBe('CANCELLED');
      expect(newState.cancelledAt).toBe(event.timestamp);
    });

    it('should reject cancellation by counterparty', () => {
      const currentState = {
        status: 'PROPOSED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'cancel',
        agent: '0x0987654321098765432109876543210987654321', // Counterparty (wrong)
        timestamp: '2026-01-01T01:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 1
      };

      const canTransition = evaluateContractTransition('cancel', context);
      expect(canTransition).toBe(false);
    });
  });

  describe('ACTIVE → ACTIVE Transition (submit_completion)', () => {
    it('should allow proposer to submit completion', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        acceptedAt: '2026-01-01T01:00:00Z',
        completions: []
      };

      const event: ContractEvent = {
        type: 'submit_completion',
        agent: '0x1234567890123456789012345678901234567890', // Proposer
        proof: 'https://example.com/deliverable',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('submit_completion', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('submit_completion', context);
      expect(newState.status).toBe('ACTIVE');
      expect(newState.completions).toHaveLength(1);
      expect(newState.completions[0]).toEqual({
        agent: event.agent,
        proof: event.proof,
        submittedAt: event.timestamp
      });
    });

    it('should allow counterparty to submit completion', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: []
      };

      const event: ContractEvent = {
        type: 'submit_completion',
        agent: '0x0987654321098765432109876543210987654321', // Counterparty
        proof: 'https://example.com/review',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('submit_completion', context);
      expect(canTransition).toBe(true);
    });

    it('should reject completion from third party', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: []
      };

      const event: ContractEvent = {
        type: 'submit_completion',
        agent: '0x1111111111111111111111111111111111111111', // Third party
        proof: 'https://example.com/fake',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('submit_completion', context);
      expect(canTransition).toBe(false);
    });

    it('should reject duplicate completion from same agent', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: [{
          agent: '0x1234567890123456789012345678901234567890',
          proof: 'https://example.com/first',
          submittedAt: '2026-01-01T01:30:00Z'
        }]
      };

      const event: ContractEvent = {
        type: 'submit_completion',
        agent: '0x1234567890123456789012345678901234567890', // Same agent
        proof: 'https://example.com/second',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 3
      };

      const canTransition = evaluateContractTransition('submit_completion', context);
      expect(canTransition).toBe(false);
    });
  });

  describe('ACTIVE → COMPLETED Transition (finalize)', () => {
    it('should allow finalization when both parties submitted completion', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: [
          {
            agent: '0x1234567890123456789012345678901234567890',
            proof: 'https://example.com/deliverable',
            submittedAt: '2026-01-01T01:30:00Z'
          },
          {
            agent: '0x0987654321098765432109876543210987654321',
            proof: 'https://example.com/review',
            submittedAt: '2026-01-01T01:45:00Z'
          }
        ],
        proposerIdentityId: 'identity_123',
        counterpartyIdentityId: 'identity_456'
      };

      const event: ContractEvent = {
        type: 'finalize',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 4
      };

      const canTransition = evaluateContractTransition('finalize', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('finalize', context);
      expect(newState.status).toBe('COMPLETED');
      expect(newState.completedAt).toBe(event.timestamp);
    });

    it('should reject finalization with only one completion', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: [{
          agent: '0x1234567890123456789012345678901234567890',
          proof: 'https://example.com/deliverable',
          submittedAt: '2026-01-01T01:30:00Z'
        }]
      };

      const event: ContractEvent = {
        type: 'finalize',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 3
      };

      const canTransition = evaluateContractTransition('finalize', context);
      expect(canTransition).toBe(false);
    });

    it('should emit identity credit events on finalization', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        completions: [
          { agent: '0x1234567890123456789012345678901234567890', proof: 'test1' },
          { agent: '0x0987654321098765432109876543210987654321', proof: 'test2' }
        ],
        proposerIdentityId: 'identity_123',
        counterpartyIdentityId: 'identity_456'
      };

      const event: ContractEvent = {
        type: 'finalize',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 4
      };

      const { emittedEvents } = applyContractEffect('finalize', context);
      
      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0]).toEqual({
        target: 'identity_123',
        event: 'receive_completion',
        payload: { contractId: 'contract_123' }
      });
      expect(emittedEvents[1]).toEqual({
        target: 'identity_456',
        event: 'receive_completion',
        payload: { contractId: 'contract_123' }
      });
    });
  });

  describe('ACTIVE → DISPUTED Transition (dispute)', () => {
    it('should allow proposer to dispute active contract', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        acceptedAt: '2026-01-01T01:00:00Z'
      };

      const event: ContractEvent = {
        type: 'dispute',
        agent: '0x1234567890123456789012345678901234567890', // Proposer
        reason: 'Deliverables do not match specifications',
        evidence: 'https://example.com/evidence',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('dispute', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('dispute', context);
      expect(newState.status).toBe('DISPUTED');
      expect(newState.disputedAt).toBe(event.timestamp);
      expect(newState.disputeReason).toBe(event.reason);
      expect(newState.disputedBy).toBe(event.agent);
    });

    it('should allow counterparty to dispute active contract', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'dispute',
        agent: '0x0987654321098765432109876543210987654321', // Counterparty
        reason: 'Payment was not received',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('dispute', context);
      expect(canTransition).toBe(true);
    });

    it('should reject dispute from third party', () => {
      const currentState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'dispute',
        agent: '0x1111111111111111111111111111111111111111', // Third party
        reason: 'Just causing trouble',
        timestamp: '2026-01-01T02:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 2
      };

      const canTransition = evaluateContractTransition('dispute', context);
      expect(canTransition).toBe(false);
    });
  });

  describe('DISPUTED → COMPLETED Transition (resolve)', () => {
    it('should allow resolution with judicial ruling', () => {
      const currentState = {
        status: 'DISPUTED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321',
        disputedAt: '2026-01-01T02:00:00Z'
      };

      const event: ContractEvent = {
        type: 'resolve',
        judicialRuling: true,
        resolution: 'Ruling in favor of proposer',
        rulingId: 'ruling_789',
        timestamp: '2026-01-01T03:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 5
      };

      const canTransition = evaluateContractTransition('resolve', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('resolve', context);
      expect(newState.status).toBe('COMPLETED');
      expect(newState.resolvedAt).toBe(event.timestamp);
      expect(newState.resolution).toBe(event.resolution);
      expect(newState.rulingId).toBe(event.rulingId);
    });

    it('should allow resolution with mutual agreement', () => {
      const currentState = {
        status: 'DISPUTED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'resolve',
        proposerApproves: true,
        counterpartyApproves: true,
        resolution: 'Mutual agreement reached',
        timestamp: '2026-01-01T03:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 5
      };

      const canTransition = evaluateContractTransition('resolve', context);
      expect(canTransition).toBe(true);

      const newState = applyContractEffect('resolve', context);
      expect(newState.status).toBe('COMPLETED');
      expect(newState.resolvedAt).toBe(event.timestamp);
    });

    it('should reject resolution without proper approval', () => {
      const currentState = {
        status: 'DISPUTED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'resolve',
        proposerApproves: true,
        counterpartyApproves: false, // Missing counterparty approval
        judicialRuling: false,
        timestamp: '2026-01-01T03:00:00Z'
      };

      const context: StateMachineContext = {
        state: currentState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 5
      };

      const canTransition = evaluateContractTransition('resolve', context);
      expect(canTransition).toBe(false);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject transitions from final states', () => {
      const completedState = {
        status: 'COMPLETED',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'accept',
        agent: '0x0987654321098765432109876543210987654321',
        timestamp: '2026-01-01T03:00:00Z'
      };

      const context: StateMachineContext = {
        state: completedState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 6
      };

      expect(() => evaluateContractTransition('accept', context))
        .toThrow(ContractTransitionError);
    });

    it('should reject invalid event types', () => {
      const activeState = {
        status: 'ACTIVE',
        proposer: '0x1234567890123456789012345678901234567890',
        counterparty: '0x0987654321098765432109876543210987654321'
      };

      const event: ContractEvent = {
        type: 'invalid_event' as any,
        timestamp: '2026-01-01T03:00:00Z'
      };

      const context: StateMachineContext = {
        state: activeState,
        event: event,
        fiberId: 'contract_123',
        sequenceNumber: 3
      };

      expect(() => evaluateContractTransition('invalid_event', context))
        .toThrow(ContractTransitionError);
    });
  });
});