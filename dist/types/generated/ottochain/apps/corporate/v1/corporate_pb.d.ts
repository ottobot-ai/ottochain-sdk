import type { GenEnum, GenFile, GenMessage } from "@bufbuild/protobuf/codegenv1";
import type { Address as Address$1 } from "../../../v1/common_pb.js";
import type { Timestamp } from "@bufbuild/protobuf/wkt";
import type { Message } from "@bufbuild/protobuf";
/**
 * Describes the file ottochain/apps/corporate/v1/corporate.proto.
 */
export declare const file_ottochain_apps_corporate_v1_corporate: GenFile;
/**
 * Jurisdiction information
 *
 * @generated from message ottochain.apps.corporate.v1.Jurisdiction
 */
export type Jurisdiction = Message<"ottochain.apps.corporate.v1.Jurisdiction"> & {
    /**
     * State/province of incorporation
     *
     * @generated from field: string state = 1;
     */
    state: string;
    /**
     * Country code (ISO 3166-1)
     *
     * @generated from field: string country = 2;
     */
    country: string;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Jurisdiction.
 * Use `create(JurisdictionSchema)` to create a new message.
 */
export declare const JurisdictionSchema: GenMessage<Jurisdiction>;
/**
 * Physical or mailing address
 *
 * @generated from message ottochain.apps.corporate.v1.Address
 */
export type Address = Message<"ottochain.apps.corporate.v1.Address"> & {
    /**
     * @generated from field: string street1 = 1;
     */
    street1: string;
    /**
     * @generated from field: string street2 = 2;
     */
    street2: string;
    /**
     * @generated from field: string city = 3;
     */
    city: string;
    /**
     * @generated from field: string state = 4;
     */
    state: string;
    /**
     * @generated from field: string postal_code = 5;
     */
    postalCode: string;
    /**
     * @generated from field: string country = 6;
     */
    country: string;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Address.
 * Use `create(AddressSchema)` to create a new message.
 */
export declare const AddressSchema: GenMessage<Address>;
/**
 * Share class definition
 *
 * @generated from message ottochain.apps.corporate.v1.ShareClass
 */
export type ShareClass = Message<"ottochain.apps.corporate.v1.ShareClass"> & {
    /**
     * @generated from field: string class_id = 1;
     */
    classId: string;
    /**
     * @generated from field: string class_name = 2;
     */
    className: string;
    /**
     * @generated from field: int64 authorized = 3;
     */
    authorized: bigint;
    /**
     * @generated from field: int64 issued = 4;
     */
    issued: bigint;
    /**
     * @generated from field: int64 outstanding = 5;
     */
    outstanding: bigint;
    /**
     * @generated from field: int64 par_value_cents = 6;
     */
    parValueCents: bigint;
    /**
     * @generated from field: bool voting_rights = 7;
     */
    votingRights: boolean;
    /**
     * @generated from field: int32 votes_per_share = 8;
     */
    votesPerShare: number;
    /**
     * Multiple, e.g., 1 = 1x
     *
     * @generated from field: int32 liquidation_preference = 9;
     */
    liquidationPreference: number;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ShareClass.
 * Use `create(ShareClassSchema)` to create a new message.
 */
export declare const ShareClassSchema: GenMessage<ShareClass>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateEntity
 */
export type CorporateEntity = Message<"ottochain.apps.corporate.v1.CorporateEntity"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: string legal_name = 2;
     */
    legalName: string;
    /**
     * @generated from field: ottochain.apps.corporate.v1.EntityType entity_type = 3;
     */
    entityType: EntityType;
    /**
     * @generated from field: ottochain.apps.corporate.v1.Jurisdiction jurisdiction = 4;
     */
    jurisdiction?: Jurisdiction;
    /**
     * @generated from field: google.protobuf.Timestamp formation_date = 5;
     */
    formationDate?: Timestamp;
    /**
     * @generated from field: ottochain.apps.corporate.v1.RegisteredAgent registered_agent = 6;
     */
    registeredAgent?: RegisteredAgent;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.Incorporator incorporators = 7;
     */
    incorporators: Incorporator[];
    /**
     * @generated from field: ottochain.apps.corporate.v1.ShareStructure share_structure = 8;
     */
    shareStructure?: ShareStructure;
    /**
     * @generated from field: ottochain.apps.corporate.v1.EntityState status = 9;
     */
    status: EntityState;
    /**
     * @generated from field: google.protobuf.Timestamp created_at = 10;
     */
    createdAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateEntity.
 * Use `create(CorporateEntitySchema)` to create a new message.
 */
export declare const CorporateEntitySchema: GenMessage<CorporateEntity>;
/**
 * @generated from message ottochain.apps.corporate.v1.RegisteredAgent
 */
export type RegisteredAgent = Message<"ottochain.apps.corporate.v1.RegisteredAgent"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: ottochain.apps.corporate.v1.Address address = 2;
     */
    address?: Address;
};
/**
 * Describes the message ottochain.apps.corporate.v1.RegisteredAgent.
 * Use `create(RegisteredAgentSchema)` to create a new message.
 */
export declare const RegisteredAgentSchema: GenMessage<RegisteredAgent>;
/**
 * @generated from message ottochain.apps.corporate.v1.Incorporator
 */
export type Incorporator = Message<"ottochain.apps.corporate.v1.Incorporator"> & {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: ottochain.v1.Address address = 2;
     */
    address?: Address$1;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Incorporator.
 * Use `create(IncorporatorSchema)` to create a new message.
 */
export declare const IncorporatorSchema: GenMessage<Incorporator>;
/**
 * @generated from message ottochain.apps.corporate.v1.ShareStructure
 */
export type ShareStructure = Message<"ottochain.apps.corporate.v1.ShareStructure"> & {
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.ShareClass classes = 1;
     */
    classes: ShareClass[];
    /**
     * @generated from field: int64 total_authorized = 2;
     */
    totalAuthorized: bigint;
    /**
     * @generated from field: int64 total_issued = 3;
     */
    totalIssued: bigint;
    /**
     * @generated from field: int64 total_outstanding = 4;
     */
    totalOutstanding: bigint;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ShareStructure.
 * Use `create(ShareStructureSchema)` to create a new message.
 */
export declare const ShareStructureSchema: GenMessage<ShareStructure>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateBoard
 */
export type CorporateBoard = Message<"ottochain.apps.corporate.v1.CorporateBoard"> & {
    /**
     * @generated from field: string board_id = 1;
     */
    boardId: string;
    /**
     * @generated from field: string entity_id = 2;
     */
    entityId: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.Director directors = 3;
     */
    directors: Director[];
    /**
     * @generated from field: ottochain.apps.corporate.v1.SeatInfo seats = 4;
     */
    seats?: SeatInfo;
    /**
     * @generated from field: ottochain.apps.corporate.v1.QuorumRules quorum_rules = 5;
     */
    quorumRules?: QuorumRules;
    /**
     * @generated from field: ottochain.apps.corporate.v1.BoardMeeting current_meeting = 6;
     */
    currentMeeting?: BoardMeeting;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.BoardMeeting meeting_history = 7;
     */
    meetingHistory: BoardMeeting[];
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateBoard.
 * Use `create(CorporateBoardSchema)` to create a new message.
 */
export declare const CorporateBoardSchema: GenMessage<CorporateBoard>;
/**
 * @generated from message ottochain.apps.corporate.v1.Director
 */
export type Director = Message<"ottochain.apps.corporate.v1.Director"> & {
    /**
     * @generated from field: string director_id = 1;
     */
    directorId: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: string email = 3;
     */
    email: string;
    /**
     * @generated from field: google.protobuf.Timestamp term_start = 4;
     */
    termStart?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp term_end = 5;
     */
    termEnd?: Timestamp;
    /**
     * @generated from field: ottochain.apps.corporate.v1.DirectorStatus status = 6;
     */
    status: DirectorStatus;
    /**
     * @generated from field: bool is_independent = 7;
     */
    isIndependent: boolean;
    /**
     * @generated from field: bool is_chair = 8;
     */
    isChair: boolean;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Director.
 * Use `create(DirectorSchema)` to create a new message.
 */
export declare const DirectorSchema: GenMessage<Director>;
/**
 * @generated from message ottochain.apps.corporate.v1.SeatInfo
 */
export type SeatInfo = Message<"ottochain.apps.corporate.v1.SeatInfo"> & {
    /**
     * @generated from field: int32 authorized = 1;
     */
    authorized: number;
    /**
     * @generated from field: int32 filled = 2;
     */
    filled: number;
    /**
     * @generated from field: int32 vacant = 3;
     */
    vacant: number;
};
/**
 * Describes the message ottochain.apps.corporate.v1.SeatInfo.
 * Use `create(SeatInfoSchema)` to create a new message.
 */
export declare const SeatInfoSchema: GenMessage<SeatInfo>;
/**
 * @generated from message ottochain.apps.corporate.v1.QuorumRules
 */
export type QuorumRules = Message<"ottochain.apps.corporate.v1.QuorumRules"> & {
    /**
     * MAJORITY, SUPERMAJORITY, FIXED_NUMBER
     *
     * @generated from field: string type = 1;
     */
    type: string;
    /**
     * @generated from field: int32 threshold = 2;
     */
    threshold: number;
};
/**
 * Describes the message ottochain.apps.corporate.v1.QuorumRules.
 * Use `create(QuorumRulesSchema)` to create a new message.
 */
export declare const QuorumRulesSchema: GenMessage<QuorumRules>;
/**
 * @generated from message ottochain.apps.corporate.v1.BoardMeeting
 */
export type BoardMeeting = Message<"ottochain.apps.corporate.v1.BoardMeeting"> & {
    /**
     * @generated from field: string meeting_id = 1;
     */
    meetingId: string;
    /**
     * @generated from field: ottochain.apps.corporate.v1.BoardMeetingType type = 2;
     */
    type: BoardMeetingType;
    /**
     * @generated from field: google.protobuf.Timestamp scheduled_date = 3;
     */
    scheduledDate?: Timestamp;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.MeetingAttendee attendees = 4;
     */
    attendees: MeetingAttendee[];
    /**
     * @generated from field: bool quorum_present = 5;
     */
    quorumPresent: boolean;
};
/**
 * Describes the message ottochain.apps.corporate.v1.BoardMeeting.
 * Use `create(BoardMeetingSchema)` to create a new message.
 */
export declare const BoardMeetingSchema: GenMessage<BoardMeeting>;
/**
 * @generated from message ottochain.apps.corporate.v1.MeetingAttendee
 */
export type MeetingAttendee = Message<"ottochain.apps.corporate.v1.MeetingAttendee"> & {
    /**
     * @generated from field: string director_id = 1;
     */
    directorId: string;
    /**
     * @generated from field: bool present = 2;
     */
    present: boolean;
};
/**
 * Describes the message ottochain.apps.corporate.v1.MeetingAttendee.
 * Use `create(MeetingAttendeeSchema)` to create a new message.
 */
export declare const MeetingAttendeeSchema: GenMessage<MeetingAttendee>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateOfficers
 */
export type CorporateOfficers = Message<"ottochain.apps.corporate.v1.CorporateOfficers"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.Officer officers = 2;
     */
    officers: Officer[];
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.OfficerAction action_history = 3;
     */
    actionHistory: OfficerAction[];
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateOfficers.
 * Use `create(CorporateOfficersSchema)` to create a new message.
 */
export declare const CorporateOfficersSchema: GenMessage<CorporateOfficers>;
/**
 * @generated from message ottochain.apps.corporate.v1.Officer
 */
export type Officer = Message<"ottochain.apps.corporate.v1.Officer"> & {
    /**
     * @generated from field: string officer_id = 1;
     */
    officerId: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: string title = 3;
     */
    title: string;
    /**
     * @generated from field: string email = 4;
     */
    email: string;
    /**
     * @generated from field: google.protobuf.Timestamp appointed_at = 5;
     */
    appointedAt?: Timestamp;
    /**
     * @generated from field: ottochain.v1.Address appointed_by = 6;
     */
    appointedBy?: Address$1;
    /**
     * @generated from field: ottochain.apps.corporate.v1.OfficerStatus status = 7;
     */
    status: OfficerStatus;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Officer.
 * Use `create(OfficerSchema)` to create a new message.
 */
export declare const OfficerSchema: GenMessage<Officer>;
/**
 * @generated from message ottochain.apps.corporate.v1.OfficerAction
 */
export type OfficerAction = Message<"ottochain.apps.corporate.v1.OfficerAction"> & {
    /**
     * @generated from field: string action_type = 1;
     */
    actionType: string;
    /**
     * @generated from field: string officer_id = 2;
     */
    officerId: string;
    /**
     * @generated from field: google.protobuf.Timestamp at = 3;
     */
    at?: Timestamp;
    /**
     * @generated from field: ottochain.v1.Address by = 4;
     */
    by?: Address$1;
};
/**
 * Describes the message ottochain.apps.corporate.v1.OfficerAction.
 * Use `create(OfficerActionSchema)` to create a new message.
 */
export declare const OfficerActionSchema: GenMessage<OfficerAction>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateShareholders
 */
export type CorporateShareholders = Message<"ottochain.apps.corporate.v1.CorporateShareholders"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.Shareholder shareholders = 2;
     */
    shareholders: Shareholder[];
    /**
     * address -> total votes
     *
     * @generated from field: map<string, int64> voting_power = 3;
     */
    votingPower: {
        [key: string]: bigint;
    };
    /**
     * @generated from field: int64 total_voting_power = 4;
     */
    totalVotingPower: bigint;
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateShareholders.
 * Use `create(CorporateShareholdersSchema)` to create a new message.
 */
export declare const CorporateShareholdersSchema: GenMessage<CorporateShareholders>;
/**
 * @generated from message ottochain.apps.corporate.v1.Shareholder
 */
export type Shareholder = Message<"ottochain.apps.corporate.v1.Shareholder"> & {
    /**
     * @generated from field: ottochain.v1.Address address = 1;
     */
    address?: Address$1;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.ShareHolding holdings = 3;
     */
    holdings: ShareHolding[];
    /**
     * @generated from field: google.protobuf.Timestamp first_acquired = 4;
     */
    firstAcquired?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.Shareholder.
 * Use `create(ShareholderSchema)` to create a new message.
 */
export declare const ShareholderSchema: GenMessage<Shareholder>;
/**
 * @generated from message ottochain.apps.corporate.v1.ShareHolding
 */
export type ShareHolding = Message<"ottochain.apps.corporate.v1.ShareHolding"> & {
    /**
     * @generated from field: string class_id = 1;
     */
    classId: string;
    /**
     * @generated from field: int64 shares = 2;
     */
    shares: bigint;
    /**
     * @generated from field: google.protobuf.Timestamp acquired_at = 3;
     */
    acquiredAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ShareHolding.
 * Use `create(ShareHoldingSchema)` to create a new message.
 */
export declare const ShareHoldingSchema: GenMessage<ShareHolding>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateResolution
 */
export type CorporateResolution = Message<"ottochain.apps.corporate.v1.CorporateResolution"> & {
    /**
     * @generated from field: string resolution_id = 1;
     */
    resolutionId: string;
    /**
     * @generated from field: string entity_id = 2;
     */
    entityId: string;
    /**
     * @generated from field: string title = 3;
     */
    title: string;
    /**
     * @generated from field: string body = 4;
     */
    body: string;
    /**
     * BOARD, SHAREHOLDER, UNANIMOUS_WRITTEN
     *
     * @generated from field: string resolution_type = 5;
     */
    resolutionType: string;
    /**
     * @generated from field: ottochain.apps.corporate.v1.ResolutionStatus status = 6;
     */
    status: ResolutionStatus;
    /**
     * @generated from field: ottochain.v1.Address proposed_by = 7;
     */
    proposedBy?: Address$1;
    /**
     * @generated from field: google.protobuf.Timestamp proposed_at = 8;
     */
    proposedAt?: Timestamp;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.ResolutionVote votes = 9;
     */
    votes: ResolutionVote[];
    /**
     * @generated from field: google.protobuf.Timestamp adopted_at = 10;
     */
    adoptedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateResolution.
 * Use `create(CorporateResolutionSchema)` to create a new message.
 */
export declare const CorporateResolutionSchema: GenMessage<CorporateResolution>;
/**
 * @generated from message ottochain.apps.corporate.v1.ResolutionVote
 */
export type ResolutionVote = Message<"ottochain.apps.corporate.v1.ResolutionVote"> & {
    /**
     * @generated from field: ottochain.v1.Address voter = 1;
     */
    voter?: Address$1;
    /**
     * FOR, AGAINST, ABSTAIN
     *
     * @generated from field: string vote = 2;
     */
    vote: string;
    /**
     * @generated from field: int64 weight = 3;
     */
    weight: bigint;
    /**
     * @generated from field: google.protobuf.Timestamp voted_at = 4;
     */
    votedAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ResolutionVote.
 * Use `create(ResolutionVoteSchema)` to create a new message.
 */
export declare const ResolutionVoteSchema: GenMessage<ResolutionVote>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateSecurities
 */
export type CorporateSecurities = Message<"ottochain.apps.corporate.v1.CorporateSecurities"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.SecurityIssuance issuances = 2;
     */
    issuances: SecurityIssuance[];
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.SecurityTransfer transfers = 3;
     */
    transfers: SecurityTransfer[];
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateSecurities.
 * Use `create(CorporateSecuritiesSchema)` to create a new message.
 */
export declare const CorporateSecuritiesSchema: GenMessage<CorporateSecurities>;
/**
 * @generated from message ottochain.apps.corporate.v1.SecurityIssuance
 */
export type SecurityIssuance = Message<"ottochain.apps.corporate.v1.SecurityIssuance"> & {
    /**
     * @generated from field: string issuance_id = 1;
     */
    issuanceId: string;
    /**
     * @generated from field: string class_id = 2;
     */
    classId: string;
    /**
     * @generated from field: ottochain.v1.Address recipient = 3;
     */
    recipient?: Address$1;
    /**
     * @generated from field: int64 shares = 4;
     */
    shares: bigint;
    /**
     * @generated from field: int64 price_per_share_cents = 5;
     */
    pricePerShareCents: bigint;
    /**
     * @generated from field: google.protobuf.Timestamp issued_at = 6;
     */
    issuedAt?: Timestamp;
    /**
     * @generated from field: string authorization_resolution_id = 7;
     */
    authorizationResolutionId: string;
};
/**
 * Describes the message ottochain.apps.corporate.v1.SecurityIssuance.
 * Use `create(SecurityIssuanceSchema)` to create a new message.
 */
export declare const SecurityIssuanceSchema: GenMessage<SecurityIssuance>;
/**
 * @generated from message ottochain.apps.corporate.v1.SecurityTransfer
 */
export type SecurityTransfer = Message<"ottochain.apps.corporate.v1.SecurityTransfer"> & {
    /**
     * @generated from field: string transfer_id = 1;
     */
    transferId: string;
    /**
     * @generated from field: string class_id = 2;
     */
    classId: string;
    /**
     * @generated from field: ottochain.v1.Address from = 3;
     */
    from?: Address$1;
    /**
     * @generated from field: ottochain.v1.Address to = 4;
     */
    to?: Address$1;
    /**
     * @generated from field: int64 shares = 5;
     */
    shares: bigint;
    /**
     * @generated from field: google.protobuf.Timestamp transferred_at = 6;
     */
    transferredAt?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.SecurityTransfer.
 * Use `create(SecurityTransferSchema)` to create a new message.
 */
export declare const SecurityTransferSchema: GenMessage<SecurityTransfer>;
/**
 * @generated from message ottochain.apps.corporate.v1.CorporateCompliance
 */
export type CorporateCompliance = Message<"ottochain.apps.corporate.v1.CorporateCompliance"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.FilingRecord filings = 2;
     */
    filings: FilingRecord[];
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.ComplianceRequirement requirements = 3;
     */
    requirements: ComplianceRequirement[];
    /**
     * @generated from field: bool in_good_standing = 4;
     */
    inGoodStanding: boolean;
};
/**
 * Describes the message ottochain.apps.corporate.v1.CorporateCompliance.
 * Use `create(CorporateComplianceSchema)` to create a new message.
 */
export declare const CorporateComplianceSchema: GenMessage<CorporateCompliance>;
/**
 * @generated from message ottochain.apps.corporate.v1.FilingRecord
 */
export type FilingRecord = Message<"ottochain.apps.corporate.v1.FilingRecord"> & {
    /**
     * @generated from field: string filing_id = 1;
     */
    filingId: string;
    /**
     * @generated from field: string filing_type = 2;
     */
    filingType: string;
    /**
     * @generated from field: google.protobuf.Timestamp filed_at = 3;
     */
    filedAt?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp due_date = 4;
     */
    dueDate?: Timestamp;
    /**
     * @generated from field: string status = 5;
     */
    status: string;
};
/**
 * Describes the message ottochain.apps.corporate.v1.FilingRecord.
 * Use `create(FilingRecordSchema)` to create a new message.
 */
export declare const FilingRecordSchema: GenMessage<FilingRecord>;
/**
 * @generated from message ottochain.apps.corporate.v1.ComplianceRequirement
 */
export type ComplianceRequirement = Message<"ottochain.apps.corporate.v1.ComplianceRequirement"> & {
    /**
     * @generated from field: string requirement_id = 1;
     */
    requirementId: string;
    /**
     * @generated from field: string description = 2;
     */
    description: string;
    /**
     * ANNUAL, QUARTERLY, etc.
     *
     * @generated from field: string frequency = 3;
     */
    frequency: string;
    /**
     * @generated from field: google.protobuf.Timestamp next_due = 4;
     */
    nextDue?: Timestamp;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ComplianceRequirement.
 * Use `create(ComplianceRequirementSchema)` to create a new message.
 */
export declare const ComplianceRequirementSchema: GenMessage<ComplianceRequirement>;
/**
 * @generated from message ottochain.apps.corporate.v1.CreateEntityRequest
 */
export type CreateEntityRequest = Message<"ottochain.apps.corporate.v1.CreateEntityRequest"> & {
    /**
     * @generated from field: string legal_name = 1;
     */
    legalName: string;
    /**
     * @generated from field: ottochain.apps.corporate.v1.EntityType entity_type = 2;
     */
    entityType: EntityType;
    /**
     * @generated from field: ottochain.apps.corporate.v1.Jurisdiction jurisdiction = 3;
     */
    jurisdiction?: Jurisdiction;
    /**
     * @generated from field: ottochain.apps.corporate.v1.RegisteredAgent registered_agent = 4;
     */
    registeredAgent?: RegisteredAgent;
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.Incorporator incorporators = 5;
     */
    incorporators: Incorporator[];
    /**
     * @generated from field: repeated ottochain.apps.corporate.v1.ShareClass share_classes = 6;
     */
    shareClasses: ShareClass[];
};
/**
 * Describes the message ottochain.apps.corporate.v1.CreateEntityRequest.
 * Use `create(CreateEntityRequestSchema)` to create a new message.
 */
export declare const CreateEntityRequestSchema: GenMessage<CreateEntityRequest>;
/**
 * @generated from message ottochain.apps.corporate.v1.AppointDirectorRequest
 */
export type AppointDirectorRequest = Message<"ottochain.apps.corporate.v1.AppointDirectorRequest"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: string email = 3;
     */
    email: string;
    /**
     * @generated from field: google.protobuf.Timestamp term_start = 4;
     */
    termStart?: Timestamp;
    /**
     * @generated from field: google.protobuf.Timestamp term_end = 5;
     */
    termEnd?: Timestamp;
    /**
     * @generated from field: bool is_independent = 6;
     */
    isIndependent: boolean;
};
/**
 * Describes the message ottochain.apps.corporate.v1.AppointDirectorRequest.
 * Use `create(AppointDirectorRequestSchema)` to create a new message.
 */
export declare const AppointDirectorRequestSchema: GenMessage<AppointDirectorRequest>;
/**
 * @generated from message ottochain.apps.corporate.v1.IssueSharesRequest
 */
export type IssueSharesRequest = Message<"ottochain.apps.corporate.v1.IssueSharesRequest"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: string class_id = 2;
     */
    classId: string;
    /**
     * @generated from field: ottochain.v1.Address recipient = 3;
     */
    recipient?: Address$1;
    /**
     * @generated from field: int64 shares = 4;
     */
    shares: bigint;
    /**
     * @generated from field: int64 price_per_share_cents = 5;
     */
    pricePerShareCents: bigint;
    /**
     * @generated from field: string authorization_resolution_id = 6;
     */
    authorizationResolutionId: string;
};
/**
 * Describes the message ottochain.apps.corporate.v1.IssueSharesRequest.
 * Use `create(IssueSharesRequestSchema)` to create a new message.
 */
export declare const IssueSharesRequestSchema: GenMessage<IssueSharesRequest>;
/**
 * @generated from message ottochain.apps.corporate.v1.ProposeResolutionRequest
 */
export type ProposeResolutionRequest = Message<"ottochain.apps.corporate.v1.ProposeResolutionRequest"> & {
    /**
     * @generated from field: string entity_id = 1;
     */
    entityId: string;
    /**
     * @generated from field: string title = 2;
     */
    title: string;
    /**
     * @generated from field: string body = 3;
     */
    body: string;
    /**
     * @generated from field: string resolution_type = 4;
     */
    resolutionType: string;
    /**
     * @generated from field: ottochain.v1.Address proposer = 5;
     */
    proposer?: Address$1;
};
/**
 * Describes the message ottochain.apps.corporate.v1.ProposeResolutionRequest.
 * Use `create(ProposeResolutionRequestSchema)` to create a new message.
 */
export declare const ProposeResolutionRequestSchema: GenMessage<ProposeResolutionRequest>;
/**
 * Type of corporate entity
 *
 * @generated from enum ottochain.apps.corporate.v1.EntityType
 */
export declare enum EntityType {
    /**
     * @generated from enum value: ENTITY_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * C Corporation
     *
     * @generated from enum value: ENTITY_TYPE_C_CORP = 1;
     */
    C_CORP = 1,
    /**
     * S Corporation
     *
     * @generated from enum value: ENTITY_TYPE_S_CORP = 2;
     */
    S_CORP = 2,
    /**
     * Benefit Corporation
     *
     * @generated from enum value: ENTITY_TYPE_B_CORP = 3;
     */
    B_CORP = 3,
    /**
     * Limited Liability Company
     *
     * @generated from enum value: ENTITY_TYPE_LLC = 4;
     */
    LLC = 4,
    /**
     * Limited Partnership
     *
     * @generated from enum value: ENTITY_TYPE_LP = 5;
     */
    LP = 5,
    /**
     * Limited Liability Partnership
     *
     * @generated from enum value: ENTITY_TYPE_LLP = 6;
     */
    LLP = 6
}
/**
 * Describes the enum ottochain.apps.corporate.v1.EntityType.
 */
export declare const EntityTypeSchema: GenEnum<EntityType>;
/**
 * Entity lifecycle state
 *
 * @generated from enum ottochain.apps.corporate.v1.EntityState
 */
export declare enum EntityState {
    /**
     * @generated from enum value: ENTITY_STATE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * Formation in progress
     *
     * @generated from enum value: ENTITY_STATE_INCORPORATING = 1;
     */
    INCORPORATING = 1,
    /**
     * Good standing
     *
     * @generated from enum value: ENTITY_STATE_ACTIVE = 2;
     */
    ACTIVE = 2,
    /**
     * Administrative suspension
     *
     * @generated from enum value: ENTITY_STATE_SUSPENDED = 3;
     */
    SUSPENDED = 3,
    /**
     * Terminated
     *
     * @generated from enum value: ENTITY_STATE_DISSOLVED = 4;
     */
    DISSOLVED = 4
}
/**
 * Describes the enum ottochain.apps.corporate.v1.EntityState.
 */
export declare const EntityStateSchema: GenEnum<EntityState>;
/**
 * Director status
 *
 * @generated from enum ottochain.apps.corporate.v1.DirectorStatus
 */
export declare enum DirectorStatus {
    /**
     * @generated from enum value: DIRECTOR_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: DIRECTOR_STATUS_ACTIVE = 1;
     */
    ACTIVE = 1,
    /**
     * @generated from enum value: DIRECTOR_STATUS_RESIGNED = 2;
     */
    RESIGNED = 2,
    /**
     * @generated from enum value: DIRECTOR_STATUS_REMOVED = 3;
     */
    REMOVED = 3,
    /**
     * @generated from enum value: DIRECTOR_STATUS_TERM_EXPIRED = 4;
     */
    TERM_EXPIRED = 4
}
/**
 * Describes the enum ottochain.apps.corporate.v1.DirectorStatus.
 */
export declare const DirectorStatusSchema: GenEnum<DirectorStatus>;
/**
 * Officer status
 *
 * @generated from enum ottochain.apps.corporate.v1.OfficerStatus
 */
export declare enum OfficerStatus {
    /**
     * @generated from enum value: OFFICER_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: OFFICER_STATUS_ACTIVE = 1;
     */
    ACTIVE = 1,
    /**
     * @generated from enum value: OFFICER_STATUS_RESIGNED = 2;
     */
    RESIGNED = 2,
    /**
     * @generated from enum value: OFFICER_STATUS_REMOVED = 3;
     */
    REMOVED = 3
}
/**
 * Describes the enum ottochain.apps.corporate.v1.OfficerStatus.
 */
export declare const OfficerStatusSchema: GenEnum<OfficerStatus>;
/**
 * Board meeting type
 *
 * @generated from enum ottochain.apps.corporate.v1.BoardMeetingType
 */
export declare enum BoardMeetingType {
    /**
     * @generated from enum value: BOARD_MEETING_TYPE_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: BOARD_MEETING_TYPE_REGULAR = 1;
     */
    REGULAR = 1,
    /**
     * @generated from enum value: BOARD_MEETING_TYPE_SPECIAL = 2;
     */
    SPECIAL = 2,
    /**
     * @generated from enum value: BOARD_MEETING_TYPE_ANNUAL = 3;
     */
    ANNUAL = 3,
    /**
     * @generated from enum value: BOARD_MEETING_TYPE_ORGANIZATIONAL = 4;
     */
    ORGANIZATIONAL = 4
}
/**
 * Describes the enum ottochain.apps.corporate.v1.BoardMeetingType.
 */
export declare const BoardMeetingTypeSchema: GenEnum<BoardMeetingType>;
/**
 * Resolution status
 *
 * @generated from enum ottochain.apps.corporate.v1.ResolutionStatus
 */
export declare enum ResolutionStatus {
    /**
     * @generated from enum value: RESOLUTION_STATUS_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: RESOLUTION_STATUS_DRAFT = 1;
     */
    DRAFT = 1,
    /**
     * @generated from enum value: RESOLUTION_STATUS_PROPOSED = 2;
     */
    PROPOSED = 2,
    /**
     * @generated from enum value: RESOLUTION_STATUS_VOTING = 3;
     */
    VOTING = 3,
    /**
     * @generated from enum value: RESOLUTION_STATUS_ADOPTED = 4;
     */
    ADOPTED = 4,
    /**
     * @generated from enum value: RESOLUTION_STATUS_REJECTED = 5;
     */
    REJECTED = 5,
    /**
     * @generated from enum value: RESOLUTION_STATUS_WITHDRAWN = 6;
     */
    WITHDRAWN = 6
}
/**
 * Describes the enum ottochain.apps.corporate.v1.ResolutionStatus.
 */
export declare const ResolutionStatusSchema: GenEnum<ResolutionStatus>;
