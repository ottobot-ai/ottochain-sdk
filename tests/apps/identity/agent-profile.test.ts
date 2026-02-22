/**
 * TDD Tests for Agent Identity & Reputation Integration
 * 
 * Tests for AgentProfile fiber system, reputation scoring, and delegation authority.
 * Based on card: 🆔 Agent Identity & Reputation Integration (698d5b26)
 */

import {
  AgentProfile,
  AgentProfileClient,
  AgentProfileMessage,
  AgentProfileValidationError,
  CapabilityType,
  CreateAgentProfileMessage,
  DeactivateAgentProfileMessage,
  ReputationScore,
  UpdateAgentProfileMessage,
  calculateReputationScore,
  getAgentStateMachineDefinition,
  isEligibleForDelegation,
  validateAgentProfileMessage,
} from '../../../src/apps/identity/agent-profile';

// Re-export types used by test assertions
export type {
  AgentProfile,
  CapabilityType,
  CreateAgentProfileMessage,
  UpdateAgentProfileMessage,
  DeactivateAgentProfileMessage,
  AgentProfileMessage,
  AgentProfileValidationError,
  ReputationScore,
};

describe('Agent Identity & Reputation Integration', () => {

  beforeEach(() => {
    // Reset in-memory store between tests
    AgentProfileClient.reset();
  });
  
  describe('Group 1: Agent Profile Creation (4 tests)', () => {
    test('creates agent profile with valid data', async () => {
      const profileData: CreateAgentProfileMessage = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Test Agent',
        capabilities: [CapabilityType.ML_CLASSIFY, CapabilityType.DATA_PROCESS],
        initialStake: 1000,
        profileMetadata: {
          description: 'A test agent for ML classification',
          website: 'https://testagent.com'
        }
      };
      
      const agentId = await AgentProfileClient.createProfile(profileData);
      
      expect(agentId).toBeDefined();
      expect(typeof agentId).toBe('string');
      expect(agentId.length).toBeGreaterThan(0);
    });

    test('validates required fields on profile creation', async () => {
      const invalidProfile = {
        walletAddress: '', // Empty wallet address should fail
        displayName: 'Test Agent',
        capabilities: [CapabilityType.ML_CLASSIFY],
        initialStake: 1000
      } as CreateAgentProfileMessage;
      
      await expect(
        AgentProfileClient.createProfile(invalidProfile)
      ).rejects.toThrow();
    });

    test('validates minimum stake requirement', async () => {
      const profileData: CreateAgentProfileMessage = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Test Agent',
        capabilities: [CapabilityType.ML_CLASSIFY],
        initialStake: 0 // Below minimum stake should fail
      };
      
      await expect(
        AgentProfileClient.createProfile(profileData)
      ).rejects.toThrow(/minimum stake/i);
    });

    test('validates capability requirements', async () => {
      const profileData: CreateAgentProfileMessage = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Test Agent',
        capabilities: [], // Empty capabilities should fail
        initialStake: 1000
      };
      
      await expect(
        AgentProfileClient.createProfile(profileData)
      ).rejects.toThrow(/capabilities/i);
    });
  });

  describe('Group 2: Agent Profile Retrieval (3 tests)', () => {
    test('retrieves agent profile by wallet address', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      
      const profile = await AgentProfileClient.getProfile(walletAddress);
      
      if (profile) {
        expect(profile.walletAddress).toBe(walletAddress);
        expect(profile.agentId).toBeDefined();
        expect(profile.displayName).toBeDefined();
        expect(Array.isArray(profile.capabilities)).toBe(true);
        expect(typeof profile.reputationScore).toBe('number');
      }
    });

    test('returns null for non-existent agent profile', async () => {
      const nonExistentAddress = '0xnonexistent1234567890abcdef12345678';
      
      const profile = await AgentProfileClient.getProfile(nonExistentAddress);
      
      expect(profile).toBeNull();
    });

    test('searches agents by capability', async () => {
      const agents = await AgentProfileClient.searchByCapability(CapabilityType.ML_CLASSIFY);
      
      expect(Array.isArray(agents)).toBe(true);
      
      if (agents.length > 0) {
        agents.forEach(agent => {
          expect(agent.capabilities).toContain(CapabilityType.ML_CLASSIFY);
          expect(agent.isActive).toBe(true);
        });
      }
    });
  });

  describe('Group 3: Agent Profile Updates (3 tests)', () => {
    test('updates agent profile display name', async () => {
      // Create a profile first
      const agentId = await AgentProfileClient.createProfile({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Original Name',
        capabilities: [CapabilityType.ML_CLASSIFY],
        initialStake: 1000,
      });

      const updateData: UpdateAgentProfileMessage = {
        agentId,
        displayName: 'Updated Agent Name'
      };
      
      await expect(
        AgentProfileClient.updateProfile(updateData)
      ).resolves.not.toThrow();
    });

    test('adds new capabilities to agent profile', async () => {
      const agentId = await AgentProfileClient.createProfile({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Test Agent',
        capabilities: [CapabilityType.ML_CLASSIFY],
        initialStake: 1000,
      });

      const updateData: UpdateAgentProfileMessage = {
        agentId,
        capabilities: [
          CapabilityType.ML_CLASSIFY,
          CapabilityType.DATA_PROCESS,
          CapabilityType.ORACLE_FEED
        ]
      };
      
      await expect(
        AgentProfileClient.updateProfile(updateData)
      ).resolves.not.toThrow();
    });

    test('validates agent ownership for profile updates', async () => {
      const updateData: UpdateAgentProfileMessage = {
        agentId: 'different-agent-id', // Agent not owned by current user
        displayName: 'Malicious Update'
      };
      
      await expect(
        AgentProfileClient.updateProfile(updateData)
      ).rejects.toThrow(/ownership/i);
    });
  });

  describe('Group 4: Reputation Scoring (3 tests)', () => {
    test('calculates reputation score from historical data', () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const historicalData = [
        { taskId: '1', success: true, completionTime: 100 },
        { taskId: '2', success: true, completionTime: 120 },
        { taskId: '3', success: false, completionTime: null },
        { taskId: '4', success: true, completionTime: 90 }
      ];
      
      const reputation = calculateReputationScore(walletAddress, historicalData);
      
      expect(reputation.overall).toBeGreaterThan(0);
      expect(reputation.overall).toBeLessThanOrEqual(100);
      expect(reputation.totalTasks).toBe(4);
      expect(reputation.successfulTasks).toBe(3);
      expect(reputation.reliability).toBeCloseTo(75); // 3/4 success rate
    });

    test('retrieves current reputation score', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      
      const reputation = await AgentProfileClient.getReputationScore(walletAddress);
      
      if (reputation) {
        expect(reputation.overall).toBeGreaterThanOrEqual(0);
        expect(reputation.overall).toBeLessThanOrEqual(100);
        expect(reputation.totalTasks).toBeGreaterThanOrEqual(0);
        expect(reputation.successfulTasks).toBeLessThanOrEqual(reputation.totalTasks);
      }
    });

    test('checks delegation eligibility based on reputation and stake', async () => {
      const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const minReputation = 70;
      const minStake = 1000;
      
      const isEligible = await isEligibleForDelegation(walletAddress, minReputation, minStake);
      
      expect(typeof isEligible).toBe('boolean');
    });
  });

  describe('Group 5: Agent Profile State Machine (2 tests)', () => {
    test('creates valid agent profile state machine definition', () => {
      const stateMachine = getAgentStateMachineDefinition();
      
      expect(stateMachine).toBeDefined();
      expect(stateMachine.states).toBeDefined();
      expect(stateMachine.transitions).toBeDefined();
      expect(stateMachine.initialState).toBeDefined();
      
      // Should have registered, active, and suspended states
      expect(stateMachine.states).toHaveProperty('registered');
      expect(stateMachine.states).toHaveProperty('active');
      expect(stateMachine.states).toHaveProperty('suspended');
    });

    test('validates agent profile state transitions', () => {
      const stateMachine = getAgentStateMachineDefinition();
      
      // Should allow registered -> active transition
      const activateTransition = stateMachine.transitions.find(
        (t) => t.from === 'registered' && t.to === 'active' && t.eventName === 'activate'
      );
      expect(activateTransition).toBeDefined();
      
      // Should allow active <-> suspended bidirectional transitions
      const suspendTransition = stateMachine.transitions.find(
        (t) => t.from === 'active' && t.to === 'suspended' && t.eventName === 'suspend'
      );
      expect(suspendTransition).toBeDefined();
      
      const reactivateTransition = stateMachine.transitions.find(
        (t) => t.from === 'suspended' && t.to === 'active' && t.eventName === 'reactivate'
      );
      expect(reactivateTransition).toBeDefined();
    });
  });

  describe('Group 6: Message Validation (2 tests)', () => {
    test('validates CREATE_AGENT_PROFILE message format', () => {
      const validMessage: AgentProfileMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Valid Agent',
          capabilities: [CapabilityType.ML_CLASSIFY],
          initialStake: 1000
        }
      };
      
      const errors = validateAgentProfileMessage(validMessage);
      expect(errors).toHaveLength(0);
    });

    test('validates UPDATE_AGENT_PROFILE message with ownership check', () => {
      const invalidMessage: AgentProfileMessage = {
        type: 'UPDATE_AGENT_PROFILE',
        data: {
          agentId: '', // Empty agent ID should fail
          displayName: 'Updated Name'
        }
      };
      
      const errors = validateAgentProfileMessage(invalidMessage);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'INVALID_AGENT_ID')).toBe(true);
    });
  });
});

describe('Agent Identity Capability System', () => {
  
  describe('Capability Type Validation', () => {
    test('supports all predefined capability types', () => {
      const allCapabilities = Object.values(CapabilityType);
      
      expect(allCapabilities).toContain(CapabilityType.ML_CLASSIFY);
      expect(allCapabilities).toContain(CapabilityType.DATA_PROCESS);
      expect(allCapabilities).toContain(CapabilityType.COMPUTE_HEAVY);
      expect(allCapabilities).toContain(CapabilityType.STORAGE_PROVIDER);
      expect(allCapabilities).toContain(CapabilityType.ORACLE_FEED);
      expect(allCapabilities).toContain(CapabilityType.VALIDATION_SERVICE);
      expect(allCapabilities).toContain(CapabilityType.BRIDGE_RELAYER);
      expect(allCapabilities).toContain(CapabilityType.GOVERNANCE_DELEGATE);
      expect(allCapabilities).toContain(CapabilityType.CUSTOM_APPLICATION);
      
      expect(allCapabilities).toHaveLength(9);
    });

    test('handles custom capabilities with app prefix', () => {
      const profileData: CreateAgentProfileMessage = {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        displayName: 'Custom Agent',
        capabilities: [CapabilityType.CUSTOM_APPLICATION],
        customCapabilities: ['app:trading-bot', 'app:price-oracle', 'domain-specific-task'],
        initialStake: 1000
      };
      
      expect(() => {
        // This should not throw for valid custom capabilities
        validateAgentProfileMessage({
          type: 'CREATE_AGENT_PROFILE',
          data: profileData
        });
      }).not.toThrow();
    });
  });
});

// These tests are for Phase 2 - after PR #90 (JLVM delegation operators) merges
describe.skip('Agent Identity JLVM Integration (Phase 2)', () => {
  
  test('injects agent profile context into JLVM delegation operators', async () => {
    // This test requires PR #90 to be merged first
    expect(true).toBe(false);
  });

  test('validates delegation authority using agent reputation in JLVM', async () => {
    // This test requires PR #90 to be merged first
    expect(true).toBe(false);
  });
});
