/**
 * Corporate Governance Application
 *
 * Types and utilities for corporate entity management on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   EntityType,
 *   EntityState,
 *   CorporateEntity,
 *   getCorporateDefinition
 * } from '@ottochain/sdk/apps/corporate';
 *
 * const entityDef = getCorporateDefinition('Entity');
 * const boardDef = getCorporateDefinition('Board');
 * ```
 *
 * @packageDocumentation
 */

// Re-export generated protobuf types (source of truth)
export {
  EntityType,
  EntityState,
  DirectorStatus,
  OfficerStatus,
  BoardMeetingType,
  ResolutionStatus,
  Jurisdiction,
  ShareClass,
  CorporateEntity,
  RegisteredAgent,
  Incorporator,
  ShareStructure,
  CorporateBoard,
  Director,
  SeatInfo,
  QuorumRules,
  BoardMeeting,
  MeetingAttendee,
  CorporateOfficers,
  Officer,
  OfficerAction,
  CorporateShareholders,
  Shareholder,
  ShareHolding,
  CorporateResolution,
  ResolutionVote,
  CorporateSecurities,
  SecurityIssuance,
  SecurityTransfer,
  CorporateCompliance,
  FilingRecord,
  ComplianceRequirement,
  CreateEntityRequest,
  AppointDirectorRequest,
  IssueSharesRequest,
  ProposeResolutionRequest,
  entityTypeFromJSON,
  entityTypeToJSON,
  entityStateFromJSON,
  entityStateToJSON,
  directorStatusFromJSON,
  directorStatusToJSON,
  officerStatusFromJSON,
  officerStatusToJSON,
  boardMeetingTypeFromJSON,
  boardMeetingTypeToJSON,
  resolutionStatusFromJSON,
  resolutionStatusToJSON,
} from '../../generated/ottochain/apps/corporate/v1/corporate.js';

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  corporateEntityDef,
  corporateBoardDef,
  corporateShareholdersDef,
  corporateOfficersDef,
  corporateSecuritiesDef,
  corporateComplianceDef,
  corporateBylawsDef,
  corporateCommitteeDef,
  corporateProxyDef,
  corporateResolutionDef,
} from './state-machines/index.js';

export type CorporateDefinitionType =
  | 'Entity'
  | 'Board'
  | 'Shareholders'
  | 'Officers'
  | 'Securities'
  | 'Compliance'
  | 'Bylaws'
  | 'Committee'
  | 'Proxy'
  | 'Resolution';

export const CORPORATE_DEFINITIONS: Record<CorporateDefinitionType, unknown> = {
  Entity: corporateEntityDef,
  Board: corporateBoardDef,
  Shareholders: corporateShareholdersDef,
  Officers: corporateOfficersDef,
  Securities: corporateSecuritiesDef,
  Compliance: corporateComplianceDef,
  Bylaws: corporateBylawsDef,
  Committee: corporateCommitteeDef,
  Proxy: corporateProxyDef,
  Resolution: corporateResolutionDef,
};

/**
 * Get the state machine definition for a corporate type.
 */
export function getCorporateDefinition(type: CorporateDefinitionType): unknown {
  const def = CORPORATE_DEFINITIONS[type];
  if (!def) {
    throw new Error(`Unknown corporate type: ${type}`);
  }
  return def;
}
