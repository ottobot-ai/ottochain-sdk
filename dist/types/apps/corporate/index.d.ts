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
export { EntityType, EntityState, DirectorStatus, OfficerStatus, BoardMeetingType, ResolutionStatus, Jurisdiction, ShareClass, CorporateEntity, RegisteredAgent, Incorporator, ShareStructure, CorporateBoard, Director, SeatInfo, QuorumRules, BoardMeeting, MeetingAttendee, CorporateOfficers, Officer, OfficerAction, CorporateShareholders, Shareholder, ShareHolding, CorporateResolution, ResolutionVote, CorporateSecurities, SecurityIssuance, SecurityTransfer, CorporateCompliance, FilingRecord, ComplianceRequirement, CreateEntityRequest, AppointDirectorRequest, IssueSharesRequest, ProposeResolutionRequest, entityTypeFromJSON, entityTypeToJSON, entityStateFromJSON, entityStateToJSON, directorStatusFromJSON, directorStatusToJSON, officerStatusFromJSON, officerStatusToJSON, boardMeetingTypeFromJSON, boardMeetingTypeToJSON, resolutionStatusFromJSON, resolutionStatusToJSON, } from '../../generated/ottochain/apps/corporate/v1/corporate.js';
export type CorporateDefinitionType = 'Entity' | 'Board' | 'Shareholders' | 'Officers' | 'Securities' | 'Compliance' | 'Bylaws' | 'Committee' | 'Proxy' | 'Resolution';
export declare const CORPORATE_DEFINITIONS: Record<CorporateDefinitionType, unknown>;
/**
 * Get the state machine definition for a corporate type.
 */
export declare function getCorporateDefinition(type: CorporateDefinitionType): unknown;
