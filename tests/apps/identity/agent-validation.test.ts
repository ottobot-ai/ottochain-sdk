/**
 * TDD Tests for Agent Profile ML0 Validation
 */

import {
  AgentProfileValidationErrorCode,
  ValidationResult,
  validateAgentProfileStateTransition,
  validateCreateAgentProfile,
  validateDeactivateAgentProfile,
  validateUpdateAgentProfile,
} from '../../../src/apps/identity/agent-profile';

export { AgentProfileValidationErrorCode, ValidationResult };

describe('Agent Profile ML0 Validation', () => {
  
  describe('CREATE_AGENT_PROFILE Validation', () => {
    test('validates wallet address format', () => {
      const invalidMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: 'invalid-address',
          displayName: 'Test Agent',
          capabilities: ['ml_classify'],
          initialStake: 1000
        }
      };
      
      const result = validateCreateAgentProfile(invalidMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(AgentProfileValidationErrorCode.INVALID_WALLET_ADDRESS);
      expect(result.errors[0].field).toBe('walletAddress');
    });

    test('prevents duplicate agent profiles for same wallet', () => {
      const message = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Duplicate Agent',
          capabilities: ['ml_classify'],
          initialStake: 1000
        }
      };
      
      const contextWithExistingProfile = {
        existingAgentProfiles: ['0x1234567890abcdef1234567890abcdef12345678']
      };
      
      const result = validateCreateAgentProfile(message, contextWithExistingProfile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.DUPLICATE_AGENT_PROFILE)).toBe(true);
    });

    test('validates display name length and format', () => {
      const invalidMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: '',
          capabilities: ['ml_classify'],
          initialStake: 1000
        }
      };
      
      const result = validateCreateAgentProfile(invalidMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.INVALID_DISPLAY_NAME)).toBe(true);
    });

    test('validates minimum stake requirement', () => {
      const insufficientStakeMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Test Agent',
          capabilities: ['ml_classify'],
          initialStake: 100 // Below minimum of 500
        }
      };
      
      const result = validateCreateAgentProfile(insufficientStakeMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.INSUFFICIENT_STAKE)).toBe(true);
    });

    test('validates capability list is not empty', () => {
      const noCapabilitiesMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Test Agent',
          capabilities: [],
          initialStake: 1000
        }
      };
      
      const result = validateCreateAgentProfile(noCapabilitiesMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.INVALID_CAPABILITIES)).toBe(true);
    });

    test('validates custom capability format', () => {
      const invalidCustomCapabilityMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Test Agent',
          capabilities: ['custom_application'],
          customCapabilities: ['invalid-format', 'app:valid-format'],
          initialStake: 1000
        }
      };
      
      const result = validateCreateAgentProfile(invalidCustomCapabilityMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.CUSTOM_CAPABILITY_FORMAT_INVALID)).toBe(true);
    });

    test('accepts valid agent profile creation message', () => {
      const validMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          displayName: 'Valid Test Agent',
          capabilities: ['ml_classify', 'data_process'],
          customCapabilities: ['app:custom-task'],
          initialStake: 1000,
          profileMetadata: { description: 'A valid test agent' }
        }
      };
      
      const result = validateCreateAgentProfile(validMessage, {});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('UPDATE_AGENT_PROFILE Validation', () => {
    test('validates agent exists before update', () => {
      const updateMessage = {
        type: 'UPDATE_AGENT_PROFILE',
        data: { agentId: 'non-existent-agent-id', displayName: 'Updated Name' }
      };
      
      const contextWithoutAgent = { existingAgents: [] };
      
      const result = validateUpdateAgentProfile(updateMessage, contextWithoutAgent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.AGENT_NOT_FOUND)).toBe(true);
    });

    test('validates ownership for profile updates', () => {
      const updateMessage = {
        type: 'UPDATE_AGENT_PROFILE',
        data: { agentId: 'existing-agent-id', displayName: 'Malicious Update' }
      };
      
      const contextWithDifferentOwner = {
        currentWallet: '0x9876543210fedcba9876543210fedcba98765432',
        agentOwner:    '0x1234567890abcdef1234567890abcdef12345678'
      };
      
      const result = validateUpdateAgentProfile(updateMessage, contextWithDifferentOwner);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.UNAUTHORIZED_UPDATE)).toBe(true);
    });

    test('validates updated display name format', () => {
      const updateMessage = {
        type: 'UPDATE_AGENT_PROFILE',
        data: { agentId: 'existing-agent-id', displayName: 'X' } // Too short
      };
      
      const validContext = {
        currentWallet: '0x1234567890abcdef1234567890abcdef12345678',
        agentOwner:    '0x1234567890abcdef1234567890abcdef12345678'
      };
      
      const result = validateUpdateAgentProfile(updateMessage, validContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.INVALID_DISPLAY_NAME)).toBe(true);
    });

    test('accepts valid profile update from owner', () => {
      const updateMessage = {
        type: 'UPDATE_AGENT_PROFILE',
        data: {
          agentId: 'existing-agent-id',
          displayName: 'Valid Updated Name',
          capabilities: ['ml_classify', 'oracle_feed']
        }
      };
      
      const validContext = {
        currentWallet:  '0x1234567890abcdef1234567890abcdef12345678',
        agentOwner:     '0x1234567890abcdef1234567890abcdef12345678',
        existingAgents: ['existing-agent-id']
      };
      
      const result = validateUpdateAgentProfile(updateMessage, validContext);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DEACTIVATE_AGENT_PROFILE Validation', () => {
    test('validates agent exists before deactivation', () => {
      const deactivateMessage = {
        type: 'DEACTIVATE_AGENT_PROFILE',
        data: { agentId: 'non-existent-agent-id', reason: 'Test deactivation' }
      };
      
      const contextWithoutAgent = { existingAgents: [] };
      
      const result = validateDeactivateAgentProfile(deactivateMessage, contextWithoutAgent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.AGENT_NOT_FOUND)).toBe(true);
    });

    test('validates ownership for profile deactivation', () => {
      const deactivateMessage = {
        type: 'DEACTIVATE_AGENT_PROFILE',
        data: { agentId: 'existing-agent-id', reason: 'Unauthorized deactivation' }
      };
      
      const contextWithDifferentOwner = {
        currentWallet: '0x9876543210fedcba9876543210fedcba98765432',
        agentOwner:    '0x1234567890abcdef1234567890abcdef12345678'
      };
      
      const result = validateDeactivateAgentProfile(deactivateMessage, contextWithDifferentOwner);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.UNAUTHORIZED_UPDATE)).toBe(true);
    });
  });

  describe('State Transition Validation', () => {
    test('validates registered to active transition', () => {
      const result = validateAgentProfileStateTransition('registered', 'active', 'activate');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates active to suspended transition', () => {
      const result = validateAgentProfileStateTransition('active', 'suspended', 'suspend');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('validates suspended to active transition', () => {
      const result = validateAgentProfileStateTransition('suspended', 'active', 'reactivate');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid state transitions', () => {
      const result = validateAgentProfileStateTransition('registered', 'suspended', 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === AgentProfileValidationErrorCode.INVALID_STATE_TRANSITION)).toBe(true);
    });

    test('validates reputation threshold for certain transitions', () => {
      const contextWithLowReputation = { currentReputation: 40, requiredReputation: 60 };
      expect(contextWithLowReputation.currentReputation).toBeLessThan(contextWithLowReputation.requiredReputation);
    });
  });

  describe('Comprehensive Validation Scenarios', () => {
    test('validates multiple errors in single message', () => {
      const multiErrorMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: 'invalid',
          displayName: '',
          capabilities: [],
          initialStake: 50
        }
      };
      
      const result = validateCreateAgentProfile(multiErrorMessage, {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.map(e => e.code)).toContain(AgentProfileValidationErrorCode.INVALID_WALLET_ADDRESS);
      expect(result.errors.map(e => e.code)).toContain(AgentProfileValidationErrorCode.INVALID_DISPLAY_NAME);
      expect(result.errors.map(e => e.code)).toContain(AgentProfileValidationErrorCode.INSUFFICIENT_STAKE);
    });

    test('provides helpful error messages for each validation failure', () => {
      const invalidMessage = {
        type: 'CREATE_AGENT_PROFILE',
        data: {
          walletAddress: 'invalid-address',
          displayName: 'Test Agent',
          capabilities: ['ml_classify'],
          initialStake: 1000
        }
      };
      
      const result = validateCreateAgentProfile(invalidMessage, {});
      
      expect(result.isValid).toBe(false);
      const walletError = result.errors.find(e => e.code === AgentProfileValidationErrorCode.INVALID_WALLET_ADDRESS);
      expect(walletError).toBeDefined();
      expect(walletError!.message).toBeDefined();
      expect(walletError!.message.length).toBeGreaterThan(0);
    });
  });
});
