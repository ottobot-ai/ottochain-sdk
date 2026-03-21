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
 *   getCorporateDefinition,
 *   CORPORATE_DEFINITIONS
 * } from '@ottochain/sdk/apps/corporate';
 *
 * const entityDef = getCorporateDefinition('entity');
 * const boardDef = getCorporateDefinition('board');
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
} from "../../generated/ottochain/apps/corporate/v1/corporate.js";

// ---------------------------------------------------------------------------
// State Machine Definitions (generated from JSON at build time)
// ---------------------------------------------------------------------------

import {
  corpEntityDef,
  corpBoardDef,
  corpShareholdersDef,
  corpSecuritiesDef,
} from "./state-machines/index.js";

export { corpEntityDef, corpBoardDef, corpShareholdersDef, corpSecuritiesDef };

/** All corporate state machine definitions */
export const CORPORATE_DEFINITIONS = {
  entity: corpEntityDef,
  board: corpBoardDef,
  shareholders: corpShareholdersDef,
  securities: corpSecuritiesDef,
} as const;

export type CorporateType = keyof typeof CORPORATE_DEFINITIONS;

/**
 * Get a corporate state machine definition by type.
 * @param type - 'entity' | 'board' | 'shareholders' | 'securities'
 */
export function getCorporateDefinition(type: CorporateType): unknown {
  return CORPORATE_DEFINITIONS[type];
}
