/**
 * Corporate Governance Application
 *
 * State machines and types for corporate entity management including
 * board governance, shareholder meetings, securities, and compliance.
 *
 * @example
 * ```typescript
 * import { getCorporateDefinition } from '@ottochain/sdk/apps/corporate';
 *
 * // Get state machine definition for corporate entity
 * const entityDef = getCorporateDefinition('Entity');
 * const boardDef = getCorporateDefinition('Board');
 * ```
 *
 * @packageDocumentation
 */

export * from './types.js';

// Proto-generated types (prefixed to avoid conflicts with TS types)
export {
  EntityType as EntityTypeProto,
  EntityState as EntityStateProto,
  DirectorStatus as DirectorStatusProto,
  OfficerStatus as OfficerStatusProto,
  BoardMeetingType as BoardMeetingTypeProto,
  ResolutionStatus as ResolutionStatusProto,
  Jurisdiction as JurisdictionProto,
  Address,
  ShareClass as ShareClassProto,
  CorporateEntity,
  RegisteredAgent,
  Incorporator,
  ShareStructure,
  CorporateBoard,
  Director as DirectorProto,
  SeatInfo,
  QuorumRules,
  BoardMeeting as BoardMeetingProto,
  MeetingAttendee,
  CorporateOfficers,
  Officer,
  OfficerAction,
  CorporateShareholders,
  Shareholder as ShareholderProto,
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
} from '../../generated/ottochain/apps/corporate/v1/corporate_pb.js';

// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------

import corporateEntityDef from './state-machines/corporate-entity.json';
import corporateBoardDef from './state-machines/corporate-board.json';
import corporateShareholdersDef from './state-machines/corporate-shareholders.json';
import corporateOfficersDef from './state-machines/corporate-officers.json';
import corporateSecuritiesDef from './state-machines/corporate-securities.json';
import corporateComplianceDef from './state-machines/corporate-compliance.json';
import corporateBylawsDef from './state-machines/corporate-bylaws.json';
import corporateCommitteeDef from './state-machines/corporate-committee.json';
import corporateProxyDef from './state-machines/corporate-proxy.json';
import corporateResolutionDef from './state-machines/corporate-resolution.json';

/**
 * Corporate state machine types.
 */
export type CorporateType =
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

/**
 * Corporate state machine definitions mapped by type.
 */
export const CORPORATE_DEFINITIONS: Record<CorporateType, unknown> = {
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
 * Get the state machine definition for a corporate governance type.
 *
 * @param type - Corporate type (Entity, Board, Shareholders, etc.)
 * @returns The state machine definition JSON
 */
export function getCorporateDefinition(type: CorporateType): unknown {
  const def = CORPORATE_DEFINITIONS[type];
  if (!def) {
    throw new Error(`Unknown corporate type: ${type}`);
  }
  return def;
}
