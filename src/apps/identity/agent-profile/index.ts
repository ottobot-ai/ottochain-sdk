/**
 * Agent Profile — Module Exports
 */

export type {
  AgentProfile,
  CreateAgentProfileMessage,
  UpdateAgentProfileMessage,
  DeactivateAgentProfileMessage,
  AgentProfileMessage,
  AgentProfileValidationError,
  ReputationScore,
} from './types';
export { CapabilityType, MIN_STAKE, MIN_DISPLAY_NAME_LENGTH, MAX_DISPLAY_NAME_LENGTH } from './types';

export { AgentProfileValidationErrorCode } from './validation';
export type { ValidationResult, ValidationError, CreateContext, UpdateContext } from './validation';
export {
  validateCreateAgentProfile,
  validateUpdateAgentProfile,
  validateDeactivateAgentProfile,
  validateAgentProfileStateTransition,
  validateAgentProfileMessage,
} from './validation';

export { getAgentStateMachineDefinition } from './state-machine';
export type { AgentProfileStateMachine, AgentProfileTransition } from './state-machine';

export { calculateReputationScore, isEligibleForDelegation } from './reputation';
export type { TaskRecord } from './reputation';

export { AgentProfileClient } from './client';

export { createIndexerClient, testIndexerClient } from './indexer';
export type { AgentFiberRecord, ReputationHistoryEntry, IndexerClient } from './indexer';
