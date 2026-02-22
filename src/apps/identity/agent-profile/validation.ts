/**
 * Agent Profile — ML0 Validation Logic
 */

import { MAX_DISPLAY_NAME_LENGTH, MIN_DISPLAY_NAME_LENGTH, MIN_STAKE } from './types';

export enum AgentProfileValidationErrorCode {
  INVALID_WALLET_ADDRESS          = 'INVALID_WALLET_ADDRESS',
  DUPLICATE_AGENT_PROFILE         = 'DUPLICATE_AGENT_PROFILE',
  INVALID_DISPLAY_NAME            = 'INVALID_DISPLAY_NAME',
  INSUFFICIENT_STAKE              = 'INSUFFICIENT_STAKE',
  INVALID_CAPABILITIES            = 'INVALID_CAPABILITIES',
  UNAUTHORIZED_UPDATE             = 'UNAUTHORIZED_UPDATE',
  AGENT_NOT_FOUND                 = 'AGENT_NOT_FOUND',
  INVALID_STATE_TRANSITION        = 'INVALID_STATE_TRANSITION',
  REPUTATION_THRESHOLD_NOT_MET    = 'REPUTATION_THRESHOLD_NOT_MET',
  CUSTOM_CAPABILITY_FORMAT_INVALID = 'CUSTOM_CAPABILITY_FORMAT_INVALID',
  INVALID_AGENT_ID                = 'INVALID_AGENT_ID',
}

export interface ValidationError {
  code: AgentProfileValidationErrorCode;
  message: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CreateContext {
  existingAgentProfiles?: string[];
}

export interface UpdateContext {
  currentWallet?: string;
  agentOwner?: string;
  existingAgents?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;
const CUSTOM_CAP_PREFIX = 'app:';

function isValidWallet(addr: string): boolean {
  return WALLET_REGEX.test(addr);
}

function isValidDisplayName(name: string): boolean {
  return typeof name === 'string' &&
    name.length >= MIN_DISPLAY_NAME_LENGTH &&
    name.length <= MAX_DISPLAY_NAME_LENGTH;
}

function isValidCustomCapability(cap: string): boolean {
  return cap.startsWith(CUSTOM_CAP_PREFIX) && cap.length > CUSTOM_CAP_PREFIX.length;
}

function ok(): ValidationResult {
  return { isValid: true, errors: [] };
}

function fail(errors: ValidationError[]): ValidationResult {
  return { isValid: false, errors };
}

// ── Allowed state transitions ──────────────────────────────────────────────

const VALID_TRANSITIONS = new Set([
  'registered:active:activate',
  'active:suspended:suspend',
  'suspended:active:reactivate',
  'active:deactivated:deactivate',
  'suspended:deactivated:deactivate',
]);

// ── Public validators ──────────────────────────────────────────────────────

export function validateCreateAgentProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: { type: string; data: any },
  context: CreateContext
): ValidationResult {
  const data = message.data as {
    walletAddress?: string;
    displayName?: string;
    capabilities?: string[];
    customCapabilities?: string[];
    initialStake?: number;
  };

  const errors: ValidationError[] = [];

  // Wallet address
  if (!data.walletAddress || !isValidWallet(data.walletAddress)) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_WALLET_ADDRESS,
      message: 'walletAddress must be a valid Ethereum-style address (0x + 40 hex chars)',
      field: 'walletAddress',
    });
  }

  // Duplicate check
  if (
    data.walletAddress &&
    context.existingAgentProfiles &&
    context.existingAgentProfiles.includes(data.walletAddress)
  ) {
    errors.push({
      code: AgentProfileValidationErrorCode.DUPLICATE_AGENT_PROFILE,
      message: `An agent profile already exists for wallet ${data.walletAddress}`,
      field: 'walletAddress',
    });
  }

  // Display name
  if (!isValidDisplayName(data.displayName ?? '')) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_DISPLAY_NAME,
      message: `displayName must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters`,
      field: 'displayName',
    });
  }

  // Minimum stake
  if (typeof data.initialStake !== 'number' || data.initialStake < MIN_STAKE) {
    errors.push({
      code: AgentProfileValidationErrorCode.INSUFFICIENT_STAKE,
      message: `initialStake must be at least ${MIN_STAKE} DAG`,
      field: 'initialStake',
    });
  }

  // Capabilities
  if (!Array.isArray(data.capabilities) || data.capabilities.length === 0) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_CAPABILITIES,
      message: 'At least one capability must be specified',
      field: 'capabilities',
    });
  }

  // Custom capabilities format
  if (Array.isArray(data.customCapabilities)) {
    const badCaps = data.customCapabilities.filter(c => !isValidCustomCapability(c));
    if (badCaps.length > 0) {
      errors.push({
        code: AgentProfileValidationErrorCode.CUSTOM_CAPABILITY_FORMAT_INVALID,
        message: `Custom capabilities must start with "${CUSTOM_CAP_PREFIX}": ${badCaps.join(', ')}`,
        field: 'customCapabilities',
      });
    }
  }

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateUpdateAgentProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: { type: string; data: any },
  context: UpdateContext
): ValidationResult {
  const data = message.data as {
    agentId?: string;
    displayName?: string;
    capabilities?: string[];
  };

  const errors: ValidationError[] = [];

  // AgentId required
  if (!data.agentId) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_AGENT_ID,
      message: 'agentId is required',
      field: 'agentId',
    });
    return fail(errors);
  }

  // Agent must exist
  if (
    context.existingAgents !== undefined &&
    !context.existingAgents.includes(data.agentId)
  ) {
    errors.push({
      code: AgentProfileValidationErrorCode.AGENT_NOT_FOUND,
      message: `Agent with id ${data.agentId} not found`,
      field: 'agentId',
    });
    return fail(errors);
  }

  // Ownership check
  if (
    context.currentWallet !== undefined &&
    context.agentOwner !== undefined &&
    context.currentWallet !== context.agentOwner
  ) {
    errors.push({
      code: AgentProfileValidationErrorCode.UNAUTHORIZED_UPDATE,
      message: 'Only the owner wallet may update this agent profile',
    });
    return fail(errors);
  }

  // Display name if provided
  if (data.displayName !== undefined && !isValidDisplayName(data.displayName)) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_DISPLAY_NAME,
      message: `displayName must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters`,
      field: 'displayName',
    });
  }

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateDeactivateAgentProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: { type: string; data: any },
  context: UpdateContext
): ValidationResult {
  const data = message.data as { agentId?: string };
  const errors: ValidationError[] = [];

  if (!data.agentId) {
    errors.push({
      code: AgentProfileValidationErrorCode.INVALID_AGENT_ID,
      message: 'agentId is required',
      field: 'agentId',
    });
    return fail(errors);
  }

  if (
    context.existingAgents !== undefined &&
    !context.existingAgents.includes(data.agentId)
  ) {
    errors.push({
      code: AgentProfileValidationErrorCode.AGENT_NOT_FOUND,
      message: `Agent with id ${data.agentId} not found`,
    });
    return fail(errors);
  }

  if (
    context.currentWallet !== undefined &&
    context.agentOwner !== undefined &&
    context.currentWallet !== context.agentOwner
  ) {
    errors.push({
      code: AgentProfileValidationErrorCode.UNAUTHORIZED_UPDATE,
      message: 'Only the owner wallet may deactivate this agent profile',
    });
    return fail(errors);
  }

  return ok();
}

export function validateAgentProfileStateTransition(
  fromState: string,
  toState: string,
  eventName: string
): ValidationResult {
  const key = `${fromState}:${toState}:${eventName}`;
  if (VALID_TRANSITIONS.has(key)) {
    return ok();
  }

  return fail([{
    code: AgentProfileValidationErrorCode.INVALID_STATE_TRANSITION,
    message: `Transition ${fromState} → ${toState} via '${eventName}' is not permitted`,
  }]);
}

/**
 * High-level message validator dispatching to type-specific validators.
 * Used by agent-profile.test.ts Group 6.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMessage = { type: string; data: any };

export function validateAgentProfileMessage(
  message: AnyMessage
): Array<{ code: string; message: string; field?: string }> {
  switch (message.type) {
    case 'CREATE_AGENT_PROFILE': {
      const result = validateCreateAgentProfile(message, {});
      return result.errors;
    }
    case 'UPDATE_AGENT_PROFILE': {
      const data = message.data as { agentId?: string };
      if (!data.agentId) {
        return [{ code: 'INVALID_AGENT_ID', message: 'agentId is required', field: 'agentId' }];
      }
      return [];
    }
    case 'DEACTIVATE_AGENT_PROFILE': {
      const result = validateDeactivateAgentProfile(message, {});
      return result.errors;
    }
    default:
      return [{ code: 'UNKNOWN_MESSAGE_TYPE', message: `Unknown message type: ${message.type}` }];
  }
}
