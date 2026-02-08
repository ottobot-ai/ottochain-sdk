import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { Address as Address1 } from "../../../v1/common.js";
export declare const protobufPackage = "ottochain.apps.corporate.v1";
/** Type of corporate entity */
export declare enum EntityType {
    ENTITY_TYPE_UNSPECIFIED = "ENTITY_TYPE_UNSPECIFIED",
    /** ENTITY_TYPE_C_CORP - C Corporation */
    ENTITY_TYPE_C_CORP = "ENTITY_TYPE_C_CORP",
    /** ENTITY_TYPE_S_CORP - S Corporation */
    ENTITY_TYPE_S_CORP = "ENTITY_TYPE_S_CORP",
    /** ENTITY_TYPE_B_CORP - Benefit Corporation */
    ENTITY_TYPE_B_CORP = "ENTITY_TYPE_B_CORP",
    /** ENTITY_TYPE_LLC - Limited Liability Company */
    ENTITY_TYPE_LLC = "ENTITY_TYPE_LLC",
    /** ENTITY_TYPE_LP - Limited Partnership */
    ENTITY_TYPE_LP = "ENTITY_TYPE_LP",
    /** ENTITY_TYPE_LLP - Limited Liability Partnership */
    ENTITY_TYPE_LLP = "ENTITY_TYPE_LLP",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function entityTypeFromJSON(object: any): EntityType;
export declare function entityTypeToJSON(object: EntityType): string;
export declare function entityTypeToNumber(object: EntityType): number;
/** Entity lifecycle state */
export declare enum EntityState {
    ENTITY_STATE_UNSPECIFIED = "ENTITY_STATE_UNSPECIFIED",
    /** ENTITY_STATE_INCORPORATING - Formation in progress */
    ENTITY_STATE_INCORPORATING = "ENTITY_STATE_INCORPORATING",
    /** ENTITY_STATE_ACTIVE - Good standing */
    ENTITY_STATE_ACTIVE = "ENTITY_STATE_ACTIVE",
    /** ENTITY_STATE_SUSPENDED - Administrative suspension */
    ENTITY_STATE_SUSPENDED = "ENTITY_STATE_SUSPENDED",
    /** ENTITY_STATE_DISSOLVED - Terminated */
    ENTITY_STATE_DISSOLVED = "ENTITY_STATE_DISSOLVED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function entityStateFromJSON(object: any): EntityState;
export declare function entityStateToJSON(object: EntityState): string;
export declare function entityStateToNumber(object: EntityState): number;
/** Director status */
export declare enum DirectorStatus {
    DIRECTOR_STATUS_UNSPECIFIED = "DIRECTOR_STATUS_UNSPECIFIED",
    DIRECTOR_STATUS_ACTIVE = "DIRECTOR_STATUS_ACTIVE",
    DIRECTOR_STATUS_RESIGNED = "DIRECTOR_STATUS_RESIGNED",
    DIRECTOR_STATUS_REMOVED = "DIRECTOR_STATUS_REMOVED",
    DIRECTOR_STATUS_TERM_EXPIRED = "DIRECTOR_STATUS_TERM_EXPIRED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function directorStatusFromJSON(object: any): DirectorStatus;
export declare function directorStatusToJSON(object: DirectorStatus): string;
export declare function directorStatusToNumber(object: DirectorStatus): number;
/** Officer status */
export declare enum OfficerStatus {
    OFFICER_STATUS_UNSPECIFIED = "OFFICER_STATUS_UNSPECIFIED",
    OFFICER_STATUS_ACTIVE = "OFFICER_STATUS_ACTIVE",
    OFFICER_STATUS_RESIGNED = "OFFICER_STATUS_RESIGNED",
    OFFICER_STATUS_REMOVED = "OFFICER_STATUS_REMOVED",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function officerStatusFromJSON(object: any): OfficerStatus;
export declare function officerStatusToJSON(object: OfficerStatus): string;
export declare function officerStatusToNumber(object: OfficerStatus): number;
/** Board meeting type */
export declare enum BoardMeetingType {
    BOARD_MEETING_TYPE_UNSPECIFIED = "BOARD_MEETING_TYPE_UNSPECIFIED",
    BOARD_MEETING_TYPE_REGULAR = "BOARD_MEETING_TYPE_REGULAR",
    BOARD_MEETING_TYPE_SPECIAL = "BOARD_MEETING_TYPE_SPECIAL",
    BOARD_MEETING_TYPE_ANNUAL = "BOARD_MEETING_TYPE_ANNUAL",
    BOARD_MEETING_TYPE_ORGANIZATIONAL = "BOARD_MEETING_TYPE_ORGANIZATIONAL",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function boardMeetingTypeFromJSON(object: any): BoardMeetingType;
export declare function boardMeetingTypeToJSON(object: BoardMeetingType): string;
export declare function boardMeetingTypeToNumber(object: BoardMeetingType): number;
/** Resolution status */
export declare enum ResolutionStatus {
    RESOLUTION_STATUS_UNSPECIFIED = "RESOLUTION_STATUS_UNSPECIFIED",
    RESOLUTION_STATUS_DRAFT = "RESOLUTION_STATUS_DRAFT",
    RESOLUTION_STATUS_PROPOSED = "RESOLUTION_STATUS_PROPOSED",
    RESOLUTION_STATUS_VOTING = "RESOLUTION_STATUS_VOTING",
    RESOLUTION_STATUS_ADOPTED = "RESOLUTION_STATUS_ADOPTED",
    RESOLUTION_STATUS_REJECTED = "RESOLUTION_STATUS_REJECTED",
    RESOLUTION_STATUS_WITHDRAWN = "RESOLUTION_STATUS_WITHDRAWN",
    UNRECOGNIZED = "UNRECOGNIZED"
}
export declare function resolutionStatusFromJSON(object: any): ResolutionStatus;
export declare function resolutionStatusToJSON(object: ResolutionStatus): string;
export declare function resolutionStatusToNumber(object: ResolutionStatus): number;
/** Jurisdiction information */
export interface Jurisdiction {
    /** State/province of incorporation */
    state: string;
    /** Country code (ISO 3166-1) */
    country: string;
}
/** Physical or mailing address */
export interface Address {
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
/** Share class definition */
export interface ShareClass {
    classId: string;
    className: string;
    authorized: number;
    issued: number;
    outstanding: number;
    parValueCents: number;
    votingRights: boolean;
    votesPerShare: number;
    /** Multiple, e.g., 1 = 1x */
    liquidationPreference: number;
}
export interface CorporateEntity {
    entityId: string;
    legalName: string;
    entityType: EntityType;
    jurisdiction?: Jurisdiction | undefined;
    formationDate?: Date | undefined;
    registeredAgent?: RegisteredAgent | undefined;
    incorporators: Incorporator[];
    shareStructure?: ShareStructure | undefined;
    status: EntityState;
    createdAt?: Date | undefined;
}
export interface RegisteredAgent {
    name: string;
    address?: Address | undefined;
}
export interface Incorporator {
    name: string;
    address?: Address1 | undefined;
}
export interface ShareStructure {
    classes: ShareClass[];
    totalAuthorized: number;
    totalIssued: number;
    totalOutstanding: number;
}
export interface CorporateBoard {
    boardId: string;
    entityId: string;
    directors: Director[];
    seats?: SeatInfo | undefined;
    quorumRules?: QuorumRules | undefined;
    currentMeeting?: BoardMeeting | undefined;
    meetingHistory: BoardMeeting[];
}
export interface Director {
    directorId: string;
    name: string;
    email: string;
    termStart?: Date | undefined;
    termEnd?: Date | undefined;
    status: DirectorStatus;
    isIndependent: boolean;
    isChair: boolean;
}
export interface SeatInfo {
    authorized: number;
    filled: number;
    vacant: number;
}
export interface QuorumRules {
    /** MAJORITY, SUPERMAJORITY, FIXED_NUMBER */
    type: string;
    threshold: number;
}
export interface BoardMeeting {
    meetingId: string;
    type: BoardMeetingType;
    scheduledDate?: Date | undefined;
    attendees: MeetingAttendee[];
    quorumPresent: boolean;
}
export interface MeetingAttendee {
    directorId: string;
    present: boolean;
}
export interface CorporateOfficers {
    entityId: string;
    officers: Officer[];
    actionHistory: OfficerAction[];
}
export interface Officer {
    officerId: string;
    name: string;
    title: string;
    email: string;
    appointedAt?: Date | undefined;
    appointedBy?: Address1 | undefined;
    status: OfficerStatus;
}
export interface OfficerAction {
    actionType: string;
    officerId: string;
    at?: Date | undefined;
    by?: Address1 | undefined;
}
export interface CorporateShareholders {
    entityId: string;
    shareholders: Shareholder[];
    /** address -> total votes */
    votingPower: {
        [key: string]: number;
    };
    totalVotingPower: number;
}
export interface CorporateShareholders_VotingPowerEntry {
    key: string;
    value: number;
}
export interface Shareholder {
    address?: Address1 | undefined;
    name: string;
    holdings: ShareHolding[];
    firstAcquired?: Date | undefined;
}
export interface ShareHolding {
    classId: string;
    shares: number;
    acquiredAt?: Date | undefined;
}
export interface CorporateResolution {
    resolutionId: string;
    entityId: string;
    title: string;
    body: string;
    /** BOARD, SHAREHOLDER, UNANIMOUS_WRITTEN */
    resolutionType: string;
    status: ResolutionStatus;
    proposedBy?: Address1 | undefined;
    proposedAt?: Date | undefined;
    votes: ResolutionVote[];
    adoptedAt?: Date | undefined;
}
export interface ResolutionVote {
    voter?: Address1 | undefined;
    /** FOR, AGAINST, ABSTAIN */
    vote: string;
    weight: number;
    votedAt?: Date | undefined;
}
export interface CorporateSecurities {
    entityId: string;
    issuances: SecurityIssuance[];
    transfers: SecurityTransfer[];
}
export interface SecurityIssuance {
    issuanceId: string;
    classId: string;
    recipient?: Address1 | undefined;
    shares: number;
    pricePerShareCents: number;
    issuedAt?: Date | undefined;
    authorizationResolutionId: string;
}
export interface SecurityTransfer {
    transferId: string;
    classId: string;
    from?: Address1 | undefined;
    to?: Address1 | undefined;
    shares: number;
    transferredAt?: Date | undefined;
}
export interface CorporateCompliance {
    entityId: string;
    filings: FilingRecord[];
    requirements: ComplianceRequirement[];
    inGoodStanding: boolean;
}
export interface FilingRecord {
    filingId: string;
    filingType: string;
    filedAt?: Date | undefined;
    dueDate?: Date | undefined;
    status: string;
}
export interface ComplianceRequirement {
    requirementId: string;
    description: string;
    /** ANNUAL, QUARTERLY, etc. */
    frequency: string;
    nextDue?: Date | undefined;
}
export interface CreateEntityRequest {
    legalName: string;
    entityType: EntityType;
    jurisdiction?: Jurisdiction | undefined;
    registeredAgent?: RegisteredAgent | undefined;
    incorporators: Incorporator[];
    shareClasses: ShareClass[];
}
export interface AppointDirectorRequest {
    entityId: string;
    name: string;
    email: string;
    termStart?: Date | undefined;
    termEnd?: Date | undefined;
    isIndependent: boolean;
}
export interface IssueSharesRequest {
    entityId: string;
    classId: string;
    recipient?: Address1 | undefined;
    shares: number;
    pricePerShareCents: number;
    authorizationResolutionId: string;
}
export interface ProposeResolutionRequest {
    entityId: string;
    title: string;
    body: string;
    resolutionType: string;
    proposer?: Address1 | undefined;
}
export declare const Jurisdiction: MessageFns<Jurisdiction>;
export declare const Address: MessageFns<Address>;
export declare const ShareClass: MessageFns<ShareClass>;
export declare const CorporateEntity: MessageFns<CorporateEntity>;
export declare const RegisteredAgent: MessageFns<RegisteredAgent>;
export declare const Incorporator: MessageFns<Incorporator>;
export declare const ShareStructure: MessageFns<ShareStructure>;
export declare const CorporateBoard: MessageFns<CorporateBoard>;
export declare const Director: MessageFns<Director>;
export declare const SeatInfo: MessageFns<SeatInfo>;
export declare const QuorumRules: MessageFns<QuorumRules>;
export declare const BoardMeeting: MessageFns<BoardMeeting>;
export declare const MeetingAttendee: MessageFns<MeetingAttendee>;
export declare const CorporateOfficers: MessageFns<CorporateOfficers>;
export declare const Officer: MessageFns<Officer>;
export declare const OfficerAction: MessageFns<OfficerAction>;
export declare const CorporateShareholders: MessageFns<CorporateShareholders>;
export declare const CorporateShareholders_VotingPowerEntry: MessageFns<CorporateShareholders_VotingPowerEntry>;
export declare const Shareholder: MessageFns<Shareholder>;
export declare const ShareHolding: MessageFns<ShareHolding>;
export declare const CorporateResolution: MessageFns<CorporateResolution>;
export declare const ResolutionVote: MessageFns<ResolutionVote>;
export declare const CorporateSecurities: MessageFns<CorporateSecurities>;
export declare const SecurityIssuance: MessageFns<SecurityIssuance>;
export declare const SecurityTransfer: MessageFns<SecurityTransfer>;
export declare const CorporateCompliance: MessageFns<CorporateCompliance>;
export declare const FilingRecord: MessageFns<FilingRecord>;
export declare const ComplianceRequirement: MessageFns<ComplianceRequirement>;
export declare const CreateEntityRequest: MessageFns<CreateEntityRequest>;
export declare const AppointDirectorRequest: MessageFns<AppointDirectorRequest>;
export declare const IssueSharesRequest: MessageFns<IssueSharesRequest>;
export declare const ProposeResolutionRequest: MessageFns<ProposeResolutionRequest>;
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {
    $case: string;
} ? {
    [K in keyof Omit<T, "$case">]?: DeepPartial<T[K]>;
} & {
    $case: T["$case"];
} : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
