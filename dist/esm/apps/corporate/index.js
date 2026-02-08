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
export { EntityType, EntityState, DirectorStatus, OfficerStatus, BoardMeetingType, ResolutionStatus, Jurisdiction, ShareClass, CorporateEntity, RegisteredAgent, Incorporator, ShareStructure, CorporateBoard, Director, SeatInfo, QuorumRules, BoardMeeting, MeetingAttendee, CorporateOfficers, Officer, OfficerAction, CorporateShareholders, Shareholder, ShareHolding, CorporateResolution, ResolutionVote, CorporateSecurities, SecurityIssuance, SecurityTransfer, CorporateCompliance, FilingRecord, ComplianceRequirement, CreateEntityRequest, AppointDirectorRequest, IssueSharesRequest, ProposeResolutionRequest, entityTypeFromJSON, entityTypeToJSON, entityStateFromJSON, entityStateToJSON, directorStatusFromJSON, directorStatusToJSON, officerStatusFromJSON, officerStatusToJSON, boardMeetingTypeFromJSON, boardMeetingTypeToJSON, resolutionStatusFromJSON, resolutionStatusToJSON, } from '../../generated/ottochain/apps/corporate/v1/corporate.js';
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
export const CORPORATE_DEFINITIONS = {
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
export function getCorporateDefinition(type) {
    const def = CORPORATE_DEFINITIONS[type];
    if (!def) {
        throw new Error(`Unknown corporate type: ${type}`);
    }
    return def;
}
