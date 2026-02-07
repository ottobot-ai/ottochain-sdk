/**
 * Corporate Governance type definitions
 *
 * TypeScript interfaces for corporate governance state machines covering
 * entity lifecycle, board management, shareholder meetings, officers,
 * bylaws, committees, resolutions, proxy voting, securities, and compliance.
 *
 * @see corporate/*.json for JSON state machine definitions
 * @packageDocumentation
 */

// Types from base module (for future use in request/response types)
// import type { Address, StateId, StateMachineDefinition, JsonLogicValue } from './types.js';

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

/**
 * Type of corporate entity.
 */
export type EntityType =
  | 'C_CORP'    // C Corporation
  | 'S_CORP'    // S Corporation
  | 'B_CORP'    // Benefit Corporation
  | 'LLC'       // Limited Liability Company
  | 'LP'        // Limited Partnership
  | 'LLP';      // Limited Liability Partnership

/**
 * Entity lifecycle state.
 */
export type EntityState =
  | 'INCORPORATING'  // Formation in progress
  | 'ACTIVE'         // Good standing
  | 'SUSPENDED'      // Administrative suspension
  | 'DISSOLVED';     // Terminated

/**
 * Jurisdiction information.
 */
export interface Jurisdiction {
  /** State/province of incorporation */
  state: string;
  /** Country code (ISO 3166-1) */
  country: string;
}

/**
 * Share class definition.
 */
export interface ShareClass {
  /** Unique class identifier */
  classId: string;
  /** Human-readable class name */
  className: string;
  /** Total authorized shares */
  authorized: number;
  /** Shares issued to date */
  issued: number;
  /** Shares currently outstanding */
  outstanding: number;
  /** Par value per share */
  parValue: number;
  /** Whether shares have voting rights */
  votingRights: boolean;
  /** Votes per share (if votingRights is true) */
  votesPerShare?: number;
  /** Liquidation preference multiple */
  liquidationPreference?: number;
}

/**
 * Corporate entity state.
 */
export interface CorporateEntityState {
  schema: 'CorporateEntity';
  /** Unique entity identifier */
  entityId: string;
  /** Legal name of the entity */
  legalName: string;
  /** Type of entity */
  entityType: EntityType;
  /** Jurisdiction of incorporation */
  jurisdiction: Jurisdiction;
  /** Date of formation (ISO 8601) */
  formationDate: string | null;
  /** Registered agent information */
  registeredAgent: {
    name: string;
    address: Record<string, string>;
  };
  /** Incorporators */
  incorporators: Array<{ name: string; address: string }>;
  /** Share structure */
  shareStructure: {
    classes: ShareClass[];
    totalAuthorized: number;
    totalIssued: number;
    totalOutstanding: number;
  };
  /** Current state */
  status: EntityState;
  /** Creation timestamp */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Board Types
// ---------------------------------------------------------------------------

/**
 * Director status.
 */
export type DirectorStatus =
  | 'ACTIVE'
  | 'RESIGNED'
  | 'REMOVED'
  | 'TERM_EXPIRED';

/**
 * Board meeting type.
 */
export type BoardMeetingType =
  | 'REGULAR'
  | 'SPECIAL'
  | 'ANNUAL'
  | 'ORGANIZATIONAL';

/**
 * Board quorum rule type.
 */
export type BoardQuorumType =
  | 'MAJORITY'
  | 'SUPERMAJORITY'
  | 'FIXED_NUMBER';

/**
 * Director information.
 */
export interface Director {
  /** Unique director identifier */
  directorId: string;
  /** Director's name */
  name: string;
  /** Director's email */
  email: string;
  /** Term start date (ISO 8601) */
  termStart: string;
  /** Term end date (ISO 8601) */
  termEnd: string;
  /** Current status */
  status: DirectorStatus;
  /** Whether director is independent */
  isIndependent: boolean;
  /** Whether director is board chair */
  isChair: boolean;
}

/**
 * Board meeting state.
 */
export interface BoardMeeting {
  /** Unique meeting identifier */
  meetingId: string;
  /** Type of meeting */
  type: BoardMeetingType;
  /** Scheduled date (ISO 8601) */
  scheduledDate: string;
  /** Attendee information */
  attendees: Array<{ directorId: string; present: boolean }>;
  /** Whether quorum is present */
  quorumPresent: boolean;
}

/**
 * Corporate board state.
 */
export interface CorporateBoardState {
  schema: 'CorporateBoard';
  /** Unique board identifier */
  boardId: string;
  /** Associated entity ID */
  entityId: string;
  /** Board of directors */
  directors: Director[];
  /** Seat information */
  seats: {
    authorized: number;
    filled: number;
    vacant: number;
  };
  /** Quorum rules */
  quorumRules: {
    type: BoardQuorumType;
    threshold: number;
  };
  /** Current meeting (if in session) */
  currentMeeting: BoardMeeting | null;
  /** Meeting history */
  meetingHistory: Array<{
    meetingId: string;
    type: string;
    date: string;
    resolutionsPassed: string[];
  }>;
  /** Current state */
  status: string;
  /** Creation timestamp */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Shareholder Types
// ---------------------------------------------------------------------------

/**
 * Shareholder meeting type.
 */
export type ShareholderMeetingType = 'ANNUAL' | 'SPECIAL';

/**
 * Agenda item status.
 */
export type AgendaItemStatus =
  | 'PENDING'
  | 'VOTING'
  | 'CLOSED'
  | 'APPROVED'
  | 'REJECTED';

/**
 * Shareholder information.
 */
export interface Shareholder {
  /** Unique shareholder identifier */
  shareholderId: string;
  /** Shareholder's name */
  name: string;
  /** Share holdings by class */
  shareholdings: Array<{
    shareClass: string;
    shares: number;
    votes: number;
  }>;
  /** Total voting power */
  totalVotes: number;
  /** Proxy granted to (if any) */
  proxyGrantedTo: string | null;
  /** Whether shareholder has voted */
  hasVoted: boolean;
}

/**
 * Agenda item for shareholder meeting.
 */
export interface AgendaItem {
  /** Unique item identifier */
  itemId: string;
  /** Item title */
  title: string;
  /** Item type */
  type: string;
  /** Vote type required */
  voteRequired: string;
  /** Current status */
  status: AgendaItemStatus;
}

/**
 * Corporate shareholders meeting state.
 */
export interface CorporateShareholdersState {
  schema: 'CorporateShareholders';
  /** Unique meeting identifier */
  meetingId: string;
  /** Associated entity ID */
  entityId: string;
  /** Type of meeting */
  meetingType: ShareholderMeetingType;
  /** Fiscal year */
  fiscalYear: number;
  /** Scheduled date (ISO 8601) */
  scheduledDate: string;
  /** Record date information */
  recordDate: {
    date: string;
    setByBoardOn: string;
  } | null;
  /** Eligible voters */
  eligibleVoters: Shareholder[];
  /** Quorum requirements */
  quorumRequirements: {
    threshold: number;
    sharesRequired: number;
    sharesRepresented: number;
    quorumMet: boolean;
  };
  /** Meeting agenda */
  agenda: AgendaItem[];
  /** Votes cast */
  votes: Array<{
    voteId: string;
    agendaItemId: string;
    shareholderId: string;
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    viaProxy: boolean;
  }>;
  /** Vote tallies */
  voteTallies: Array<{
    agendaItemId: string;
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    result: 'APPROVED' | 'REJECTED' | 'PENDING';
    certified: boolean;
  }>;
  /** Current state */
  status: string;
  /** Creation timestamp */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Securities Types
// ---------------------------------------------------------------------------

/**
 * Security form.
 */
export type SecurityForm = 'CERTIFICATED' | 'BOOK_ENTRY' | 'DRS';

/**
 * Holder type.
 */
export type HolderType = 'INDIVIDUAL' | 'ENTITY' | 'TRUST' | 'TREASURY';

/**
 * Security holder information.
 */
export interface SecurityHolder {
  /** Unique holder identifier */
  holderId: string;
  /** Type of holder */
  holderType: HolderType;
  /** Holder's name */
  name: string;
  /** Date acquired */
  acquisitionDate: string;
  /** Method of acquisition */
  acquisitionMethod: string;
  /** Cost basis */
  costBasis: number | null;
}

/**
 * Corporate securities state.
 */
export interface CorporateSecuritiesState {
  schema: 'CorporateSecurities';
  /** Unique security identifier */
  securityId: string;
  /** Associated entity ID */
  entityId: string;
  /** Share class identifier */
  shareClass: string;
  /** Share class name */
  shareClassName: string;
  /** Number of shares */
  shareCount: number;
  /** Par value */
  parValue: number;
  /** Issuance price */
  issuancePrice: number | null;
  /** Issuance date */
  issuanceDate: string | null;
  /** Security form */
  form: SecurityForm;
  /** Certificate number (if certificated) */
  certificateNumber: string | null;
  /** Current holder */
  holder: SecurityHolder | null;
  /** Transfer restrictions */
  restrictions: {
    isRestricted: boolean;
    restrictionType: string[];
    restrictionEndDate: string | null;
  };
  /** Authorization info */
  authorization: {
    authorizedDate: string;
    authorizedShares: number;
  } | null;
  /** Transfer history */
  transferHistory: Array<{
    transferId: string;
    transferDate: string;
    fromHolderId: string;
    toHolderId: string;
    shares: number;
    transferType: string;
    pricePerShare: number | null;
  }>;
  /** Current state */
  status: string;
  /** Creation timestamp */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// State Machine Imports
// ---------------------------------------------------------------------------

import CorporateEntityDefinition from './corporate/corporate-entity.json';
import CorporateBoardDefinition from './corporate/corporate-board.json';
import CorporateShareholdersDefinition from './corporate/corporate-shareholders.json';
import CorporateOfficersDefinition from './corporate/corporate-officers.json';
import CorporateBylawsDefinition from './corporate/corporate-bylaws.json';
import CorporateCommitteeDefinition from './corporate/corporate-committee.json';
import CorporateResolutionDefinition from './corporate/corporate-resolution.json';
import CorporateProxyDefinition from './corporate/corporate-proxy.json';
import CorporateSecuritiesDefinition from './corporate/corporate-securities.json';
import CorporateComplianceDefinition from './corporate/corporate-compliance.json';

/**
 * Corporate governance state machine definitions.
 */
export const CORPORATE_DEFINITIONS = {
  Entity: CorporateEntityDefinition,
  Board: CorporateBoardDefinition,
  Shareholders: CorporateShareholdersDefinition,
  Officers: CorporateOfficersDefinition,
  Bylaws: CorporateBylawsDefinition,
  Committee: CorporateCommitteeDefinition,
  Resolution: CorporateResolutionDefinition,
  Proxy: CorporateProxyDefinition,
  Securities: CorporateSecuritiesDefinition,
  Compliance: CorporateComplianceDefinition,
} as const;

/**
 * Corporate governance types for union discrimination.
 */
export type CorporateType = keyof typeof CORPORATE_DEFINITIONS;

/**
 * Union of all corporate state types.
 */
export type CorporateState =
  | CorporateEntityState
  | CorporateBoardState
  | CorporateShareholdersState
  | CorporateSecuritiesState;
