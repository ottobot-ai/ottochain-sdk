/**
 * Agent Profile — Type Definitions
 */

export enum CapabilityType {
  ML_CLASSIFY         = 'ml_classify',
  DATA_PROCESS        = 'data_process',
  COMPUTE_HEAVY       = 'compute_heavy',
  STORAGE_PROVIDER    = 'storage_provider',
  ORACLE_FEED         = 'oracle_feed',
  VALIDATION_SERVICE  = 'validation_service',
  BRIDGE_RELAYER      = 'bridge_relayer',
  GOVERNANCE_DELEGATE = 'governance_delegate',
  CUSTOM_APPLICATION  = 'custom_application',
}

export interface AgentProfile {
  agentId: string;
  walletAddress: string;
  displayName: string;
  capabilities: CapabilityType[];
  customCapabilities?: string[];
  reputationScore: number;
  stakeBonded: number;
  isActive: boolean;
  registrationOrdinal: number;
  lastActiveOrdinal?: number;
  profileMetadata?: Record<string, unknown>;
}

export interface CreateAgentProfileMessage {
  walletAddress: string;
  displayName: string;
  capabilities: CapabilityType[] | string[];
  customCapabilities?: string[];
  initialStake: number;
  profileMetadata?: Record<string, unknown>;
}

export interface UpdateAgentProfileMessage {
  agentId: string;
  displayName?: string;
  capabilities?: CapabilityType[] | string[];
  customCapabilities?: string[];
  profileMetadata?: Record<string, unknown>;
}

export interface DeactivateAgentProfileMessage {
  agentId: string;
  reason?: string;
}

export type AgentProfileMessage =
  | { type: 'CREATE_AGENT_PROFILE'; data: CreateAgentProfileMessage }
  | { type: 'UPDATE_AGENT_PROFILE'; data: UpdateAgentProfileMessage }
  | { type: 'DEACTIVATE_AGENT_PROFILE'; data: DeactivateAgentProfileMessage };

export interface AgentProfileValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ReputationScore {
  overall: number;
  reliability: number;
  performance: number;
  trustworthiness: number;
  totalTasks: number;
  successfulTasks: number;
  lastUpdatedOrdinal: number;
}

/** Minimum bonded stake for agent registration (in DAG). */
export const MIN_STAKE = 500;

/** Minimum display name length. */
export const MIN_DISPLAY_NAME_LENGTH = 2;

/** Maximum display name length. */
export const MAX_DISPLAY_NAME_LENGTH = 64;
