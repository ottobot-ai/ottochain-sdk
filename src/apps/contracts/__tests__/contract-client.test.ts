/**
 * Contract Client Tests (TDD - SHOULD FAIL)
 * 
 * Tests for contract client operations and state management.
 * These tests define the expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  ContractClient,
  ContractState,
  Contract,
  ProposeContractRequest,
  AcceptContractRequest,
  CompleteContractRequest,
  RejectContractRequest,
  DisputeContractRequest,
  ContractNotFoundError,
  InvalidContractStateError,
  UnauthorizedContractActionError,
} from '../client.js';
import { MetagraphClient } from '../../core/metagraph-client.js';

describe('ContractClient', () => {
  let contractClient: ContractClient;
  let mockMetagraphClient: MetagraphClient;

  beforeEach(() => {
    mockMetagraphClient = {
      createStateMachine: vi.fn(),
      transitionStateMachine: vi.fn(),
      getStateMachine: vi.fn(),
      waitForState: vi.fn(),
    } as unknown as MetagraphClient;

    contractClient = new ContractClient(mockMetagraphClient);
  });

  describe('proposeContract', () => {
    it('should successfully propose a new contract', async () => {
      const request: ProposeContractRequest = {
        proposer: { value: '0x1234567890123456789012345678901234567890' },
        counterparty: { value: '0x0987654321098765432109876543210987654321' },
        terms: {
          fields: {
            title: { stringValue: 'Development Contract' },
            payment: { numberValue: 1000 }
          }
        },
        description: 'Mobile app development'
      };

      const expectedFiberId = 'contract_123';
      (mockMetagraphClient.createStateMachine as Mock).mockResolvedValue({
        fiberId: expectedFiberId,
        state: {
          status: 'PROPOSED',
          proposer: request.proposer.value,
          counterparty: request.counterparty.value,
          terms: request.terms
        }
      });

      const result = await contractClient.proposeContract(request);

      expect(result).toEqual({
        contractId: expectedFiberId,
        state: ContractState.PROPOSED,
        proposer: request.proposer.value,
        counterparty: request.counterparty.value
      });

      expect(mockMetagraphClient.createStateMachine).toHaveBeenCalledWith({
        workflowType: 'Contract',
        initialData: {
          proposer: request.proposer.value,
          counterparty: request.counterparty.value,
          terms: request.terms,
          description: request.description,
          proposedAt: expect.any(String),
          status: 'PROPOSED'
        }
      });
    });

    it('should throw error if proposal validation fails', async () => {
      const invalidRequest: ProposeContractRequest = {
        proposer: { value: '0x1234567890123456789012345678901234567890' },
        counterparty: { value: '0x1234567890123456789012345678901234567890' }, // Same as proposer
        terms: { fields: {} },
        description: 'Self-contract'
      };

      await expect(contractClient.proposeContract(invalidRequest))
        .rejects.toThrow('Proposer and counterparty cannot be the same address');
    });
  });

  describe('acceptContract', () => {
    it('should successfully accept a proposed contract', async () => {
      const contractId = 'contract_123';
      const request: AcceptContractRequest = {
        contractId,
        acceptor: { value: '0x0987654321098765432109876543210987654321' }
      };

      const existingContract: Contract = {
        id: contractId,
        contractId,
        proposer: { value: '0x1234567890123456789012345678901234567890' },
        counterparty: { value: '0x0987654321098765432109876543210987654321' },
        state: ContractState.PROPOSED,
        terms: { fields: {} },
        proposedAt: { seconds: BigInt(Date.now() / 1000), nanos: 0 },
        acceptedAt: undefined,
        completedAt: undefined,
        completionProof: ''
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: existingContract
      });

      (mockMetagraphClient.transitionStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          ...existingContract,
          state: ContractState.ACTIVE,
          acceptedAt: { seconds: BigInt(Date.now() / 1000), nanos: 0 }
        }
      });

      const result = await contractClient.acceptContract(request);

      expect(result.state).toBe(ContractState.ACTIVE);
      expect(result.acceptedAt).toBeDefined();

      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenCalledWith(
        contractId,
        'accept',
        { agent: request.acceptor.value }
      );
    });

    it('should throw error if contract not found', async () => {
      const request: AcceptContractRequest = {
        contractId: 'nonexistent_contract',
        acceptor: { value: '0x0987654321098765432109876543210987654321' }
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue(null);

      await expect(contractClient.acceptContract(request))
        .rejects.toThrow(ContractNotFoundError);
    });

    it('should throw error if contract not in PROPOSED state', async () => {
      const contractId = 'contract_123';
      const request: AcceptContractRequest = {
        contractId,
        acceptor: { value: '0x0987654321098765432109876543210987654321' }
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: { status: 'ACTIVE' } // Already active
      });

      await expect(contractClient.acceptContract(request))
        .rejects.toThrow(InvalidContractStateError);
    });

    it('should throw error if acceptor is not the counterparty', async () => {
      const contractId = 'contract_123';
      const request: AcceptContractRequest = {
        contractId,
        acceptor: { value: '0x1111111111111111111111111111111111111111' } // Wrong address
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'PROPOSED',
          counterparty: '0x0987654321098765432109876543210987654321'
        }
      });

      await expect(contractClient.acceptContract(request))
        .rejects.toThrow(UnauthorizedContractActionError);
    });
  });

  describe('completeContract', () => {
    it('should successfully submit completion for an active contract', async () => {
      const contractId = 'contract_123';
      const request: CompleteContractRequest = {
        contractId,
        completer: { value: '0x1234567890123456789012345678901234567890' },
        proof: 'https://example.com/deliverable'
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'ACTIVE',
          proposer: '0x1234567890123456789012345678901234567890',
          counterparty: '0x0987654321098765432109876543210987654321',
          completions: []
        }
      });

      (mockMetagraphClient.transitionStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'ACTIVE',
          completions: [{
            agent: request.completer.value,
            proof: request.proof,
            submittedAt: expect.any(String)
          }]
        }
      });

      const result = await contractClient.completeContract(request);

      expect(result.state).toBe(ContractState.ACTIVE);
      expect(result.completions).toHaveLength(1);
      expect(result.completions[0].agent).toBe(request.completer.value);

      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenCalledWith(
        contractId,
        'submit_completion',
        {
          agent: request.completer.value,
          proof: request.proof
        }
      );
    });

    it('should automatically finalize contract when both parties submit completion', async () => {
      const contractId = 'contract_123';
      const request: CompleteContractRequest = {
        contractId,
        completer: { value: '0x0987654321098765432109876543210987654321' },
        proof: 'https://example.com/final-deliverable'
      };

      // Mock contract with one existing completion
      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'ACTIVE',
          proposer: '0x1234567890123456789012345678901234567890',
          counterparty: '0x0987654321098765432109876543210987654321',
          completions: [{
            agent: '0x1234567890123456789012345678901234567890',
            proof: 'https://example.com/first-completion',
            submittedAt: '2026-01-01T00:00:00Z'
          }]
        }
      });

      // Mock the finalize transition
      (mockMetagraphClient.transitionStateMachine as Mock)
        .mockResolvedValueOnce({
          fiberId: contractId,
          state: {
            status: 'ACTIVE',
            completions: [
              {
                agent: '0x1234567890123456789012345678901234567890',
                proof: 'https://example.com/first-completion',
                submittedAt: '2026-01-01T00:00:00Z'
              },
              {
                agent: request.completer.value,
                proof: request.proof,
                submittedAt: expect.any(String)
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          fiberId: contractId,
          state: {
            status: 'COMPLETED',
            completedAt: expect.any(String)
          }
        });

      const result = await contractClient.completeContract(request);

      expect(result.state).toBe(ContractState.COMPLETED);
      expect(result.completedAt).toBeDefined();

      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenCalledTimes(2);
      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenNthCalledWith(2,
        contractId,
        'finalize',
        {}
      );
    });

    it('should throw error if completer already submitted completion', async () => {
      const contractId = 'contract_123';
      const request: CompleteContractRequest = {
        contractId,
        completer: { value: '0x1234567890123456789012345678901234567890' },
        proof: 'https://example.com/duplicate'
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'ACTIVE',
          completions: [{
            agent: '0x1234567890123456789012345678901234567890', // Same agent
            proof: 'https://example.com/first',
            submittedAt: '2026-01-01T00:00:00Z'
          }]
        }
      });

      await expect(contractClient.completeContract(request))
        .rejects.toThrow('Completion already submitted by this agent');
    });
  });

  describe('rejectContract', () => {
    it('should successfully reject a proposed contract', async () => {
      const contractId = 'contract_123';
      const request: RejectContractRequest = {
        contractId,
        rejector: { value: '0x0987654321098765432109876543210987654321' },
        reason: 'Terms are not acceptable'
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'PROPOSED',
          counterparty: request.rejector.value
        }
      });

      (mockMetagraphClient.transitionStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'REJECTED',
          rejectedAt: expect.any(String),
          rejectReason: request.reason
        }
      });

      const result = await contractClient.rejectContract(request);

      expect(result.state).toBe(ContractState.REJECTED);
      expect(result.rejectReason).toBe(request.reason);

      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenCalledWith(
        contractId,
        'reject',
        {
          agent: request.rejector.value,
          reason: request.reason
        }
      );
    });
  });

  describe('disputeContract', () => {
    it('should successfully dispute an active contract', async () => {
      const contractId = 'contract_123';
      const request: DisputeContractRequest = {
        contractId,
        disputant: { value: '0x1234567890123456789012345678901234567890' },
        evidence: 'https://example.com/dispute-evidence',
        reason: 'Deliverables do not match specifications'
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'ACTIVE',
          proposer: request.disputant.value
        }
      });

      (mockMetagraphClient.transitionStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: {
          status: 'DISPUTED',
          disputedAt: expect.any(String),
          disputeReason: request.reason,
          disputedBy: request.disputant.value
        }
      });

      const result = await contractClient.disputeContract(request);

      expect(result.state).toBe(ContractState.DISPUTED);
      expect(result.disputeReason).toBe(request.reason);

      expect(mockMetagraphClient.transitionStateMachine).toHaveBeenCalledWith(
        contractId,
        'dispute',
        {
          agent: request.disputant.value,
          reason: request.reason,
          evidence: request.evidence
        }
      );
    });
  });

  describe('getContract', () => {
    it('should successfully retrieve an existing contract', async () => {
      const contractId = 'contract_123';
      const mockContract: Contract = {
        id: contractId,
        contractId,
        proposer: { value: '0x1234567890123456789012345678901234567890' },
        counterparty: { value: '0x0987654321098765432109876543210987654321' },
        state: ContractState.ACTIVE,
        terms: { fields: {} },
        proposedAt: { seconds: BigInt(Date.now() / 1000), nanos: 0 },
        acceptedAt: { seconds: BigInt(Date.now() / 1000), nanos: 0 },
        completedAt: undefined,
        completionProof: ''
      };

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue({
        fiberId: contractId,
        state: mockContract
      });

      const result = await contractClient.getContract(contractId);

      expect(result).toEqual(mockContract);
      expect(mockMetagraphClient.getStateMachine).toHaveBeenCalledWith(contractId);
    });

    it('should throw error if contract not found', async () => {
      const contractId = 'nonexistent_contract';

      (mockMetagraphClient.getStateMachine as Mock).mockResolvedValue(null);

      await expect(contractClient.getContract(contractId))
        .rejects.toThrow(ContractNotFoundError);
    });
  });

  describe('waitForContractState', () => {
    it('should wait for contract to reach specified state', async () => {
      const contractId = 'contract_123';
      const targetState = ContractState.COMPLETED;

      (mockMetagraphClient.waitForState as Mock).mockResolvedValue({
        fiberId: contractId,
        state: { status: 'COMPLETED' }
      });

      const result = await contractClient.waitForContractState(contractId, targetState);

      expect(result.state).toBe(targetState);
      expect(mockMetagraphClient.waitForState).toHaveBeenCalledWith(
        contractId,
        'COMPLETED',
        { timeout: 30000 }
      );
    });

    it('should support custom timeout', async () => {
      const contractId = 'contract_123';
      const targetState = ContractState.ACTIVE;
      const customTimeout = 60000;

      (mockMetagraphClient.waitForState as Mock).mockResolvedValue({
        fiberId: contractId,
        state: { status: 'ACTIVE' }
      });

      await contractClient.waitForContractState(contractId, targetState, { timeout: customTimeout });

      expect(mockMetagraphClient.waitForState).toHaveBeenCalledWith(
        contractId,
        'ACTIVE',
        { timeout: customTimeout }
      );
    });
  });
});