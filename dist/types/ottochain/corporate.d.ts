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
/**
 * Type of corporate entity.
 */
export type EntityType = 'C_CORP' | 'S_CORP' | 'B_CORP' | 'LLC' | 'LP' | 'LLP';
/**
 * Entity lifecycle state.
 */
export type EntityState = 'INCORPORATING' | 'ACTIVE' | 'SUSPENDED' | 'DISSOLVED';
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
    incorporators: Array<{
        name: string;
        address: string;
    }>;
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
/**
 * Director status.
 */
export type DirectorStatus = 'ACTIVE' | 'RESIGNED' | 'REMOVED' | 'TERM_EXPIRED';
/**
 * Board meeting type.
 */
export type BoardMeetingType = 'REGULAR' | 'SPECIAL' | 'ANNUAL' | 'ORGANIZATIONAL';
/**
 * Board quorum rule type.
 */
export type BoardQuorumType = 'MAJORITY' | 'SUPERMAJORITY' | 'FIXED_NUMBER';
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
    attendees: Array<{
        directorId: string;
        present: boolean;
    }>;
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
/**
 * Shareholder meeting type.
 */
export type ShareholderMeetingType = 'ANNUAL' | 'SPECIAL';
/**
 * Agenda item status.
 */
export type AgendaItemStatus = 'PENDING' | 'VOTING' | 'CLOSED' | 'APPROVED' | 'REJECTED';
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
/**
 * Corporate governance state machine definitions.
 */
export declare const CORPORATE_DEFINITIONS: {
    readonly Entity: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            entityId: {
                type: string;
                description: string;
            };
            legalName: {
                type: string;
                description: string;
            };
            tradeName: {
                type: string;
                nullable: boolean;
                description: string;
            };
            entityType: {
                type: string;
                enum: string[];
                description: string;
            };
            jurisdiction: {
                type: string;
                properties: {
                    state: {
                        type: string;
                        description: string;
                    };
                    country: {
                        type: string;
                        default: string;
                    };
                    foreignQualifications: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                };
            };
            formationDate: {
                type: string;
                format: string;
                description: string;
            };
            fiscalYearEnd: {
                type: string;
                description: string;
            };
            registeredAgent: {
                type: string;
                properties: {
                    name: {
                        type: string;
                    };
                    address: {
                        type: string; /** Total authorized shares */
                    };
                    phone: {
                        type: string;
                    };
                    email: {
                        type: string;
                    };
                    effectiveDate: {
                        type: string;
                        format: string;
                    };
                };
            };
            principalOffice: {
                type: string;
                properties: {
                    street: {
                        type: string;
                    };
                    city: {
                        type: string;
                    };
                    state: {
                        type: string;
                    };
                    zip: {
                        type: string;
                    };
                    country: {
                        type: string;
                        default: string;
                    };
                };
            };
            shareStructure: {
                type: string;
                properties: {
                    classes: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                className: {
                                    type: string;
                                    description: string;
                                };
                                classId: {
                                    type: string;
                                };
                                authorized: {
                                    type: string;
                                    description: string;
                                };
                                issued: {
                                    type: string;
                                    description: string;
                                };
                                outstanding: {
                                    type: string;
                                    description: string;
                                };
                                treasury: {
                                    type: string;
                                    description: string;
                                };
                                parValue: {
                                    type: string;
                                    description: string;
                                };
                                votingRights: {
                                    type: string;
                                    description: string;
                                };
                                votesPerShare: {
                                    type: string;
                                    default: number;
                                };
                                liquidationPreference: {
                                    type: string;
                                    nullable: boolean;
                                    description: string;
                                };
                                dividendRate: {
                                    type: string;
                                    nullable: boolean;
                                    description: string;
                                };
                                convertible: {
                                    type: string;
                                    default: boolean;
                                };
                                conversionRatio: {
                                    type: string;
                                    nullable: boolean;
                                };
                                antidilution: {
                                    /**
                                     * Director information.
                                     */
                                    type: string;
                                    enum: string[];
                                    nullable: boolean;
                                };
                            };
                        };
                    };
                    totalAuthorized: {
                        type: string;
                        description: string;
                    };
                    totalIssued: {
                        type: string;
                    };
                    totalOutstanding: {
                        type: string;
                    };
                };
            };
            incorporators: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        address: {
                            type: string;
                        };
                        signatureDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
            };
            ein: {
                type: string;
                nullable: boolean;
                description: string;
            };
            stateIds: {
                type: string;
                additionalProperties: {
                    type: string;
                };
                description: string;
            };
            suspensionReason: {
                type: string;
                nullable: boolean;
            };
            suspensionDate: {
                type: string;
                format: string;
                nullable: boolean;
            };
            dissolutionDate: {
                type: string; /** Seat information */
                format: string;
                nullable: boolean;
            };
            dissolutionReason: {
                type: string;
                nullable: boolean;
            };
            charterAmendments: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        amendmentId: {
                            type: string;
                        };
                        description: {
                            type: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                        };
                        resolutionRef: {
                            type: string;
                            description: string;
                        };
                        filedDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            INCORPORATING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string; /**
                     * Shareholder information.
                     */
                };
            };
            ACTIVE: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            SUSPENDED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            DISSOLVED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string; /** Item type */
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            incorporate: {
                from: string;
                to: string;
                description: string; /** Unique meeting identifier */
                event: {
                    name: string;
                    payload: {
                        approvalDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        stateFileNumber: {
                            type: string;
                            required: boolean;
                        };
                        certificateOfIncorporation: {
                            type: string;
                            description: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        legalName: string;
                        jurisdiction: string;
                        formationDate: string;
                    }; /** Holder's name */
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            amend_charter: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        amendmentId: {
                            type: string;
                            required: boolean;
                        };
                        description: {
                            type: string;
                            required: boolean;
                        };
                        amendmentType: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        filedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        newShareAuthorization: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        newLegalName: {
                            type: string;
                            nullable: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                    crossMachine: {
                        machine: string; /** Creation timestamp */
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        amendmentId: string;
                        description: string;
                        effectiveDate: string;
                        resolutionRef: string;
                        filedDate: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        value: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    condition?: undefined;
                    then?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        /**
                         * Corporate governance state machine definitions.
                         */
                        entityId: string;
                        amendmentId: string;
                        amendmentType: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    condition?: undefined;
                    then?: undefined;
                })[];
            };
            update_share_class: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        classId: {
                            type: string;
                            required: boolean;
                        };
                        className: {
                            type: string;
                            required: boolean;
                        };
                        authorized: {
                            type: string;
                            required: boolean;
                        }; /**
                         * Union of all corporate state types.
                         */
                        parValue: {
                            type: string;
                            required: boolean;
                        };
                        votingRights: {
                            type: string;
                            required: boolean;
                        };
                        votesPerShare: {
                            type: string;
                            default: number;
                        };
                        liquidationPreference: {
                            type: string;
                            nullable: boolean;
                        };
                        dividendRate: {
                            type: string;
                            nullable: boolean;
                        };
                        convertible: {
                            type: string;
                            default: boolean;
                        };
                        charterAmendmentRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    value: {
                        classId: string;
                        className: string;
                        authorized: string;
                        issued: number;
                        outstanding: number;
                        treasury: number;
                        parValue: string;
                        votingRights: string;
                        votesPerShare: string;
                        liquidationPreference: string;
                        dividendRate: string;
                        convertible: string;
                    };
                    expression?: undefined;
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    value?: undefined;
                })[];
            };
            update_registered_agent: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        name: {
                            type: string;
                            required: boolean;
                        };
                        address: {
                            type: string;
                            required: boolean;
                        };
                        phone: {
                            type: string;
                        };
                        email: {
                            type: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        filingConfirmation: {
                            type: string;
                            description: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        name: string;
                        address: string;
                        phone: string;
                        email: string;
                        effectiveDate: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        newAgent: string;
                        effectiveDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            suspend: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        reason: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        suspensionDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        stateNotice: {
                            type: string;
                            description: string;
                        };
                        cureDeadline: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        reason: string;
                        cureDeadline: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            reinstate: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        reinstatementDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        curativeActions: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                            required: boolean;
                        };
                        stateConfirmation: {
                            type: string;
                            required: boolean;
                        };
                        penaltiesPaid: {
                            type: string;
                            nullable: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: null;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        reinstatementDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            dissolve_voluntary: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        dissolutionDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        shareholderResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        windingUpPlan: {
                            type: string;
                            description: string;
                        };
                        certificateOfDissolution: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        dissolutionType: string;
                        dissolutionDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            dissolve_administrative: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        dissolutionDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        stateOrder: {
                            type: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        dissolutionType: string;
                        dissolutionDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            board: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            officers: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            bylaws: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            shareholders: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            securities: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            compliance: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Board: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            boardId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            directors: {
                type: string;
                items: {
                    type: string;
                    /**
                     * Type of corporate entity.
                     */
                    properties: {
                        directorId: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                        email: {
                            type: string;
                        };
                        termStart: {
                            type: string;
                            format: string;
                        };
                        termEnd: {
                            type: string;
                            format: string;
                        };
                        class: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                        isIndependent: {
                            type: string;
                            description: string;
                        };
                        isChair: {
                            type: string;
                            default: boolean;
                        };
                        isLeadIndependent: {
                            type: string;
                            default: boolean;
                        };
                        committees: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                        electedBy: {
                            type: string;
                            description: string;
                        };
                        compensationAgreementRef: {
                            type: string;
                            nullable: boolean;
                        };
                    };
                };
            };
            seats: {
                type: string;
                properties: {
                    authorized: {
                        type: string;
                        description: string;
                    };
                    filled: {
                        /**
                         * Corporate entity state.
                         */
                        type: string;
                    };
                    vacant: {
                        type: string;
                    };
                };
            };
            boardStructure: {
                type: string;
                properties: {
                    isClassified: {
                        type: string;
                        description: string;
                    };
                    termYears: {
                        type: string;
                        default: number;
                        description: string;
                    };
                    classTerms: {
                        type: string;
                        properties: {
                            CLASS_I: {
                                type: string;
                            };
                            CLASS_II: {
                                type: string;
                            };
                            CLASS_III: {
                                type: string;
                            };
                        };
                    };
                };
            };
            quorumRules: {
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                    threshold: {
                        type: string;
                        description: string;
                    };
                    minimumRequired: {
                        /**
                         * Director status.
                         */
                        type: string;
                        description: string;
                    };
                };
            };
            votingRules: {
                type: string;
                properties: {
                    standardApproval: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                    supermajorityMatters: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    supermajorityThreshold: {
                        type: string;
                        default: number;
                    };
                };
            };
            currentMeeting: {
                type: string; /** Director's email */
                nullable: boolean;
                properties: {
                    meetingId: {
                        type: string;
                    };
                    type: {
                        type: string;
                        enum: string[];
                    };
                    scheduledDate: {
                        type: string;
                        format: string;
                    };
                    location: {
                        type: string;
                    };
                    isVirtual: {
                        type: string;
                    };
                    calledBy: {
                        type: string;
                    };
                    noticeDate: {
                        type: string;
                        format: string;
                    };
                    agenda: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    attendees: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                directorId: {
                                    type: string;
                                };
                                present: {
                                    type: string;
                                };
                                arrivedAt: {
                                    type: string;
                                    format: string;
                                    nullable: boolean;
                                };
                                departedAt: {
                                    type: string;
                                    format: string;
                                    nullable: boolean; /** Board of directors */
                                }; /** Board of directors */
                                viaProxy: {
                                    type: string;
                                    default: boolean;
                                };
                            };
                        };
                    };
                    quorumPresent: {
                        type: string;
                    };
                    quorumCount: {
                        type: string;
                    };
                    openedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    closedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    minutesRef: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            meetingHistory: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        meetingId: {
                            type: string;
                        };
                        type: {
                            type: string;
                        };
                        date: {
                            type: string;
                            format: string;
                        };
                        quorumAchieved: {
                            type: string;
                        };
                        attendeeCount: {
                            type: string;
                        };
                        resolutionsPassed: {
                            type: string;
                            /**
                             * Agenda item status.
                             */
                            items: {
                                type: string;
                            };
                        };
                        minutesRef: {
                            type: string;
                        };
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                /** Unique shareholder identifier */
                format: string;
            };
        };
        states: {
            ACTIVE: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            IN_MEETING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            QUORUM_LOST: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
        };
        initialState: string;
        transitions: {
            elect_director: {
                from: string;
                to: string; /** Unique meeting identifier */
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        name: {
                            type: string;
                            required: boolean;
                        };
                        email: {
                            type: string;
                        };
                        termStart: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        termEnd: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        class: {
                            type: string;
                            enum: string[];
                        };
                        isIndependent: {
                            type: string;
                            required: boolean;
                        };
                        electionResolutionRef: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        isFillingVacancy: {
                            type: string;
                            default: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string; /** Holder's name */
                    value: {
                        directorId: string;
                        name: string;
                        email: string;
                        termStart: string;
                        termEnd: string;
                        class: string;
                        status: string;
                        isIndependent: string;
                        isChair: boolean;
                        isLeadIndependent: boolean;
                        committees: never[];
                        electedBy: string;
                    };
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        directorId: string;
                        name: string;
                        termEnd: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    amount?: undefined;
                })[];
            };
            resign_director: {
                from: string[]; /** Transfer history */
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string; /** Creation timestamp */
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                        resignationLetter: {
                            type: string;
                            description: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        termEnd: string;
                    };
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        directorId: string;
                        effectiveDate: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    amount?: undefined;
                })[];
            };
            remove_for_cause: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        cause: {
                            type: string;
                            required: boolean;
                        };
                        removalResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                    expression?: undefined;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        termEnd: string;
                    };
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        directorId: string;
                        cause: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    amount?: undefined;
                })[];
            };
            designate_chair: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    updates: {
                        isChair: boolean;
                    };
                    matchKey?: undefined;
                    matchValue?: undefined;
                } | {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        isChair: boolean;
                    };
                })[];
            };
            call_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                        type: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        scheduledDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        location: {
                            type: string;
                        };
                        isVirtual: {
                            type: string;
                            default: boolean;
                        };
                        calledBy: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        noticeDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        agenda: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        waiverOfNotice: {
                            type: string;
                            default: boolean;
                            description: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        meetingId: string;
                        type: string;
                        scheduledDate: string;
                        location: string;
                        isVirtual: string;
                        calledBy: string;
                        noticeDate: string;
                        agenda: string;
                        attendees: never[];
                        quorumPresent: boolean;
                        quorumCount: number;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        meetingId: string;
                        scheduledDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            record_attendance: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        present: {
                            type: string;
                            required: boolean;
                        };
                        arrivedAt: {
                            type: string;
                            format: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        directorId: string;
                        present: string;
                        arrivedAt: string;
                        viaProxy: boolean;
                    };
                    expression?: undefined;
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                })[];
            };
            open_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        openedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        chairPresiding: {
                            type: string;
                            description: string;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    description?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        meetingId: string;
                        quorumCount: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            director_departs: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        departedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        present: boolean;
                        departedAt: string;
                    };
                    expression?: undefined;
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            quorum_lost: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        lostAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        meetingId: string;
                        remainingDirectors: string;
                    };
                }[];
            };
            quorum_restored: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        restoredAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        directorId: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        meetingId: string;
                    };
                }[];
            };
            adjourn: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        closedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        minutesRef: {
                            type: string;
                            description: string;
                        };
                        resolutionsPassed: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        adjournedTo: {
                            type: string;
                            format: string;
                            nullable: boolean;
                            description: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        meetingId: string;
                        type: string;
                        date: string;
                        quorumAchieved: string;
                        attendeeCount: string;
                        resolutionsPassed: string;
                        minutesRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: null;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        boardId: string;
                        meetingId: string;
                        resolutionsPassed: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            update_seats: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        newAuthorizedSeats: {
                            type: string;
                            required: boolean;
                        };
                        bylawAmendmentRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    expression?: undefined;
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            resolutions: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            committees: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            officers: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Shareholders: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            meetingId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            meetingType: {
                type: string;
                enum: string[];
                description: string;
            };
            fiscalYear: {
                type: string;
                description: string;
            };
            scheduledDate: {
                type: string;
                format: string;
            };
            location: {
                type: string;
                properties: {
                    physical: {
                        type: string;
                        nullable: boolean;
                    };
                    virtualUrl: {
                        type: string;
                        nullable: boolean;
                    };
                    isHybrid: {
                        type: string;
                        default: boolean;
                    };
                };
            };
            calledBy: {
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                    };
                    resolutionRef: {
                        type: string;
                        nullable: boolean;
                    };
                    shareholderPetitionRef: {
                        type: string;
                        nullable: boolean;
                    };
                    courtOrderRef: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            noticeInfo: {
                type: string;
                properties: {
                    noticeSentDate: {
                        type: string;
                        format: string;
                    };
                    noticeMethod: {
                        type: string;
                        enum: string[];
                    };
                    minimumNoticeDays: {
                        type: string;
                        default: number;
                    };
                    maximumNoticeDays: {
                        type: string;
                        default: number;
                    };
                };
            };
            recordDate: {
                type: string;
                nullable: boolean;
                properties: {
                    date: {
                        type: string;
                        format: string;
                    };
                    setByBoardOn: {
                        type: string;
                        format: string;
                    };
                    resolutionRef: {
                        type: string; /** Legal name of the entity */
                    };
                };
            };
            eligibleVoters: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        shareholderId: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                        shareholdings: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    /** Share structure */
                                    shareClass: {
                                        type: string;
                                    };
                                    shares: {
                                        type: string;
                                    };
                                    votes: {
                                        type: string;
                                        description: string;
                                    };
                                };
                            };
                        };
                        totalVotes: {
                            type: string;
                        };
                        proxyGrantedTo: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        hasVoted: {
                            type: string;
                            default: boolean;
                        };
                    };
                };
            };
            quorumRequirements: {
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                    };
                    threshold: {
                        type: string;
                        default: number;
                        description: string;
                    };
                    sharesRequired: {
                        type: string;
                    };
                    sharesRepresented: {
                        type: string;
                        default: number;
                    };
                    quorumMet: {
                        type: string;
                        default: boolean;
                    };
                };
            };
            agenda: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        itemId: {
                            type: string;
                        };
                        itemNumber: {
                            type: string;
                        };
                        title: {
                            type: string;
                        };
                        description: {
                            type: string;
                        }; /** Whether director is board chair */
                        type: {
                            type: string;
                            enum: string[];
                        };
                        voteRequired: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        supermajorityThreshold: {
                            type: string;
                            nullable: boolean;
                        };
                        eligibleClasses: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                        allowCumulativeVoting: {
                            type: string;
                            default: boolean;
                            description: string;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                    };
                };
            };
            proxyPeriod: {
                type: string;
                nullable: boolean;
                properties: {
                    startDate: {
                        type: string;
                        format: string;
                    };
                    endDate: {
                        type: string;
                        format: string; /** Current state */
                        description: string;
                    };
                    proxyMaterials: {
                        type: string;
                        properties: {
                            proxyStatementRef: {
                                type: string;
                            };
                            formOfProxyRef: {
                                type: string;
                            };
                            annualReportRef: {
                                /**
                                 * Shareholder meeting type.
                                 */
                                type: string;
                                nullable: boolean;
                            };
                        };
                    };
                };
            };
            votes: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        voteId: {
                            type: string;
                        };
                        agendaItemId: {
                            type: string;
                        };
                        voterId: {
                            type: string;
                            description: string;
                        };
                        shareholderId: {
                            type: string; /** Share holdings by class */
                            description: string;
                        };
                        shareClass: {
                            type: string;
                        };
                        votesFor: {
                            type: string;
                            default: number;
                        };
                        votesAgainst: {
                            type: string;
                            default: number;
                        };
                        votesAbstain: {
                            type: string;
                            default: number;
                        };
                        votesWithhold: {
                            type: string;
                            default: number;
                            description: string;
                        };
                        cumulativeVoteAllocation: {
                            type: string;
                            additionalProperties: {
                                type: string;
                            };
                            nullable: boolean;
                            description: string;
                        };
                        viaProxy: {
                            type: string;
                            default: boolean;
                        };
                        timestamp: {
                            type: string;
                            format: string;
                        };
                    };
                };
            };
            voteTallies: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        agendaItemId: {
                            type: string;
                        };
                        forVotes: {
                            type: string;
                            default: number;
                        };
                        againstVotes: {
                            type: string;
                            default: number;
                        };
                        abstainVotes: {
                            type: string;
                            default: number;
                        };
                        withholdVotes: {
                            type: string;
                            default: number;
                        };
                        brokerNonVotes: {
                            type: string;
                            default: number;
                        };
                        candidateVotes: {
                            type: string;
                            additionalProperties: {
                                type: string;
                            };
                            nullable: boolean;
                            description: string;
                        };
                        result: {
                            type: string;
                            enum: string[];
                        };
                        certified: {
                            type: string;
                            default: boolean;
                        };
                    };
                };
            };
            inspectorOfElections: {
                type: string;
                nullable: boolean;
                properties: {
                    name: {
                        type: string;
                    };
                    company: {
                        type: string;
                        nullable: boolean;
                    };
                    appointedBy: {
                        type: string;
                    };
                    /**
                     * Security form.
                     */
                    appointmentDate: {
                        type: string;
                        format: string;
                    };
                };
            };
            sessionInfo: {
                type: string;
                nullable: boolean;
                properties: {
                    openedAt: {
                        type: string;
                        format: string;
                    };
                    chairPerson: {
                        type: string;
                    };
                    secretaryPresent: {
                        type: string;
                    };
                    pollsOpenedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    pollsClosedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    adjournedAt: {
                        type: string; /** Holder's name */
                        format: string;
                        nullable: boolean;
                    };
                    minutesRef: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            certification: {
                type: string;
                nullable: boolean;
                properties: {
                    certifiedAt: {
                        type: string;
                        format: string;
                    };
                    certifiedBy: {
                        type: string;
                    };
                    certificateRef: {
                        type: string;
                    }; /** Associated entity ID */
                };
            };
            createdAt: {
                type: string; /** Share class identifier */
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            SCHEDULED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            }; /** Security form */
            RECORD_DATE_SET: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            PROXY_PERIOD: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            IN_SESSION: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            VOTING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            CLOSED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            schedule_annual: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            required: boolean;
                        };
                        fiscalYear: {
                            type: string;
                            required: boolean;
                        };
                        scheduledDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        location: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        type: string;
                        resolutionRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        type: string;
                        scheduledDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            schedule_special: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            required: boolean;
                        };
                        scheduledDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        location: {
                            type: string;
                        };
                        purpose: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        calledByType: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                        };
                        petitionRef: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        purpose: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            set_record_date: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        recordDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        date: string;
                        setByBoardOn: string;
                        resolutionRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        recordDate: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            register_eligible_shareholders: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        shareholders: {
                            type: string;
                            required: boolean;
                            items: {
                                type: string;
                                properties: {
                                    shareholderId: {
                                        type: string;
                                    };
                                    name: {
                                        type: string;
                                    };
                                    shareholdings: {
                                        type: string;
                                    };
                                };
                            };
                        };
                        totalSharesOutstanding: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    value: string;
                }[];
            };
            open_proxy_period: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        startDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        proxyStatementRef: {
                            type: string;
                            required: boolean;
                        };
                        formOfProxyRef: {
                            type: string;
                            required: boolean;
                        };
                        annualReportRef: {
                            type: string;
                        };
                        agenda: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        startDate: string;
                        endDate: string;
                        proxyMaterials: {
                            proxyStatementRef: string;
                            formOfProxyRef: string;
                            annualReportRef: string;
                        };
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        proxyStatementRef: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            add_agenda_item: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        itemId: {
                            type: string;
                            required: boolean;
                        };
                        title: {
                            type: string;
                            required: boolean;
                        };
                        description: {
                            type: string;
                        };
                        type: {
                            type: string;
                            required: boolean;
                        };
                        voteRequired: {
                            type: string;
                            required: boolean;
                        };
                        eligibleClasses: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        allowCumulativeVoting: {
                            type: string;
                            default: boolean;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    value: {
                        itemId: string;
                        itemNumber: string;
                        title: string;
                        description: string;
                        type: string;
                        voteRequired: string;
                        eligibleClasses: string;
                        allowCumulativeVoting: string;
                        status: string;
                    };
                }[];
            };
            open_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        openedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        chairPerson: {
                            type: string;
                            required: boolean;
                        };
                        secretaryPresent: {
                            type: string;
                            required: boolean;
                        };
                        inspectorOfElections: {
                            type: string;
                        };
                        initialQuorumCount: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        openedAt: string;
                        chairPerson: string;
                        secretaryPresent: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: boolean;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        sharesRepresented: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            open_polls: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        pollsOpenedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    updates?: undefined;
                } | {
                    type: string;
                    path: string;
                    updates: {
                        status: string;
                    };
                    value?: undefined;
                })[];
            };
            cast_vote: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        voteId: {
                            type: string;
                            required: boolean;
                        };
                        agendaItemId: {
                            type: string;
                            required: boolean;
                        };
                        voterId: {
                            type: string;
                            required: boolean;
                        };
                        shareholderId: {
                            type: string;
                            required: boolean;
                        };
                        shareClass: {
                            type: string;
                            required: boolean;
                        };
                        votesFor: {
                            type: string;
                            default: number;
                        };
                        votesAgainst: {
                            type: string;
                            default: number;
                        };
                        votesAbstain: {
                            type: string;
                            default: number;
                        };
                        votesWithhold: {
                            type: string;
                            default: number;
                        };
                        cumulativeVoteAllocation: {
                            type: string;
                            nullable: boolean;
                        };
                        viaProxy: {
                            type: string;
                            default: boolean;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    description?: undefined;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                    crossMachine: {
                        machine: string;
                        condition: string;
                        query: string;
                        requiredState: string;
                    };
                })[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        voteId: string;
                        agendaItemId: string;
                        voterId: string;
                        shareholderId: string;
                        shareClass: string;
                        votesFor: string;
                        votesAgainst: string;
                        votesAbstain: string;
                        votesWithhold: string;
                        cumulativeVoteAllocation: string;
                        viaProxy: string;
                        timestamp: string;
                    };
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                } | {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        hasVoted: boolean;
                    };
                    value?: undefined;
                })[];
            };
            close_polls: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        pollsClosedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    updates?: undefined;
                    description?: undefined;
                    targetPath?: undefined;
                } | {
                    type: string;
                    path: string;
                    updates: {
                        status: string;
                    };
                    value?: undefined;
                    description?: undefined;
                    targetPath?: undefined;
                } | {
                    type: string;
                    description: string;
                    targetPath: string;
                    path?: undefined;
                    value?: undefined;
                    updates?: undefined;
                })[];
            };
            certify_results: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        certifiedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        certifiedBy: {
                            type: string;
                            required: boolean;
                        };
                        certificateRef: {
                            type: string;
                            required: boolean;
                        };
                        results: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    agendaItemId: {
                                        type: string;
                                    };
                                    result: {
                                        type: string;
                                        enum: string[];
                                    };
                                };
                            };
                        };
                        minutesRef: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        certifiedAt: string;
                        certifiedBy: string;
                        certificateRef: string;
                    };
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    array: string;
                    do: {
                        type: string;
                        path: string;
                        matchKey: string;
                        matchValue: string;
                        updates: {
                            result: string;
                            certified: boolean;
                        };
                    };
                    path?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        results: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    array?: undefined;
                    do?: undefined;
                })[];
            };
            adjourn_without_action: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        adjournedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                            required: boolean;
                        };
                        adjournedTo: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        meetingId: string;
                        reason: string;
                        adjournedTo: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            proxies: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            resolutions: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            securities: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Officers: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            officersInstanceId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            officers: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        officerId: {
                            type: string;
                        };
                        personId: {
                            type: string;
                            description: string;
                        };
                        name: {
                            type: string;
                        };
                        title: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        customTitle: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        status: {
                            type: string;
                            /** State/province of incorporation */
                            enum: string[];
                        };
                        appointedDate: {
                            type: string;
                            format: string;
                        };
                        appointmentResolutionRef: {
                            type: string;
                        }; /** Unique class identifier */
                        terminationDate: {
                            type: string;
                            /** Human-readable class name */
                            format: string;
                            nullable: boolean;
                        };
                        reportsTo: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        isBoardMember: {
                            type: string;
                            default: boolean;
                        };
                        directorId: {
                            type: string;
                            nullable: boolean; /** Whether shares have voting rights */
                        };
                        compensationAgreementRef: {
                            type: string;
                            nullable: boolean;
                        };
                        authorityLevel: {
                            type: string;
                            /** Liquidation preference multiple */
                            enum: string[];
                            description: string;
                        };
                        spendingLimit: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        /** Legal name of the entity */
                        signatureAuthority: {
                            type: string;
                            properties: {
                                contracts: {
                                    type: string;
                                    default: boolean;
                                };
                                contractLimit: {
                                    type: string;
                                    nullable: boolean;
                                };
                                checks: {
                                    type: string;
                                    default: boolean;
                                };
                                checkLimit: {
                                    type: string;
                                    nullable: boolean;
                                };
                                hiringAuthority: {
                                    type: string;
                                    default: boolean;
                                };
                                terminationAuthority: {
                                    type: string;
                                    default: boolean;
                                };
                            };
                        };
                        delegatedAuthorities: {
                            type: string; /** Current state */
                            items: {
                                type: string;
                                properties: {
                                    delegationId: {
                                        type: string;
                                    };
                                    authority: {
                                        type: string;
                                    };
                                    /**
                                     * Director status.
                                     */
                                    scope: {
                                        type: string;
                                    };
                                    delegatedBy: {
                                        /**
                                         * Director status.
                                         */
                                        type: string;
                                    };
                                    delegatedOn: {
                                        type: string;
                                        format: string;
                                    };
                                    expiresOn: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                    };
                                    revoked: {
                                        type: string;
                                        default: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
            };
            appointmentAuthority: {
                type: string;
                /**
                 * Director information.
                 */
                description: string;
                properties: {
                    boardAppoints: {
                        type: string;
                        items: {
                            type: string;
                        };
                        default: string[];
                    };
                    ceoAppoints: {
                        type: string;
                        items: {
                            type: string;
                        };
                        default: string[];
                    };
                    cfoAppoints: {
                        type: string;
                        items: {
                            type: string;
                        }; /** Unique meeting identifier */
                        default: string[];
                    };
                    secretaryAppoints: {
                        type: string;
                        items: {
                            type: string; /** Attendee information */
                        }; /** Attendee information */
                        default: string[];
                    };
                };
            };
            successionPlan: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        position: {
                            type: string;
                        };
                        currentOfficerId: {
                            type: string;
                        };
                        successors: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    personId: {
                                        type: string;
                                    };
                                    name: {
                                        type: string;
                                    }; /** Quorum rules */
                                    priority: {
                                        type: string;
                                    };
                                    readiness: {
                                        type: string;
                                        enum: string[];
                                    }; /** Meeting history */
                                };
                            };
                        };
                    };
                };
            };
            vacantPositions: {
                type: string;
                items: {
                    type: string; /** Current state */
                };
                description: string;
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            ACTIVE: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
        };
        initialState: string;
        transitions: {
            appoint_officer: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        personId: {
                            type: string;
                            required: boolean;
                        }; /** Total voting power */
                        name: {
                            type: string;
                            required: boolean;
                        };
                        title: {
                            type: string;
                            required: boolean;
                        };
                        customTitle: {
                            type: string;
                        };
                        appointedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        appointmentResolutionRef: {
                            type: string;
                            /** Item title */
                            required: boolean;
                        };
                        reportsTo: {
                            type: string;
                        };
                        isBoardMember: {
                            type: string;
                            default: boolean;
                        };
                        directorId: {
                            type: string;
                        };
                        /**
                         * Corporate shareholders meeting state.
                         */
                        authorityLevel: {
                            type: string;
                            default: string;
                        };
                        spendingLimit: {
                            type: string;
                        };
                        signatureAuthority: {
                            type: string;
                        };
                        isInterim: {
                            type: string;
                            default: boolean;
                        }; /** Type of meeting */
                    };
                };
                guards: ({
                    name: string;
                    description: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                    expression?: undefined;
                    note?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                    note: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                    crossMachine?: undefined;
                    note?: undefined;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        officerId: string;
                        personId: string;
                        name: string;
                        title: string;
                        customTitle: string;
                        status: string;
                        appointedDate: string;
                        appointmentResolutionRef: string;
                        reportsTo: string;
                        isBoardMember: string;
                        directorId: string;
                        authorityLevel: string;
                        spendingLimit: string;
                        signatureAuthority: string;
                        delegatedAuthorities: never[];
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        officerId: string;
                        name: string;
                        title: string;
                        appointedDate: string; /** Current holder */
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            remove_officer: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        removalResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        severanceAgreementRef: {
                            type: string;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                    expression?: undefined;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        terminationDate: string;
                    };
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        officerId: string;
                        reason: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    expression?: undefined;
                })[];
            };
            accept_resignation: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        resignationLetterRef: {
                            type: string;
                        };
                        acceptedBy: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        terminationDate: string;
                    };
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        officerId: string;
                        effectiveDate: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    expression?: undefined;
                })[];
            };
            delegate_authority: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        delegationId: {
                            type: string;
                            required: boolean;
                        };
                        fromOfficerId: {
                            type: string;
                            required: boolean;
                        };
                        toOfficerId: {
                            type: string;
                            required: boolean;
                        };
                        authority: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        scope: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        expiresOn: {
                            type: string;
                            format: string;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    description?: undefined;
                } | {
                    name: string;
                    description: string;
                    expression: string;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    arrayPath: string;
                    arrayOperation: string;
                    value: {
                        delegationId: string;
                        authority: string;
                        scope: string;
                        delegatedBy: string;
                        delegatedOn: string;
                        expiresOn: string;
                        revoked: boolean;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        delegationId: string;
                        from: string;
                        to: string;
                        authority: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    arrayPath?: undefined;
                    arrayOperation?: undefined;
                    value?: undefined;
                })[];
            };
            revoke_authority: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        delegationId: {
                            type: string;
                            required: boolean;
                        };
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        revokedBy: {
                            type: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    nestedPath: string;
                    nestedMatchKey: string;
                    nestedMatchValue: string;
                    updates: {
                        revoked: boolean;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        delegationId: string;
                        officerId: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    nestedPath?: undefined;
                    nestedMatchKey?: undefined;
                    nestedMatchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            update_authority_limits: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        authorityLevel: {
                            type: string;
                        };
                        spendingLimit: {
                            type: string;
                        };
                        signatureAuthority: {
                            type: string;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        authorityLevel: string;
                        spendingLimit: string;
                        signatureAuthority: string;
                    };
                }[];
            };
            promote_interim_to_permanent: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        officerId: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        appointedDate: string;
                        appointmentResolutionRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        officerId: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            update_succession_plan: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        position: {
                            type: string;
                            required: boolean;
                        };
                        currentOfficerId: {
                            type: string;
                            required: boolean;
                        };
                        successors: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    value: {
                        position: string;
                        currentOfficerId: string;
                        successors: string;
                    };
                }[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            board: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            resolutions: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Bylaws: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            bylawsId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            currentVersion: {
                type: string;
                description: string;
            };
            originalAdoptionDate: {
                type: string;
                format: string;
            };
            lastAmendedDate: {
                type: string;
                format: string;
                nullable: boolean;
            };
            documentRef: {
                type: string;
                description: string;
            };
            sections: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        sectionId: {
                            type: string;
                        };
                        sectionNumber: {
                            type: string;
                            description: string;
                        };
                        title: {
                            type: string;
                        };
                        content: {
                            type: string;
                        };
                        amendmentRequirement: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        supermajorityThreshold: {
                            type: string;
                            nullable: boolean;
                        }; /** Total authorized shares */
                        lastModifiedVersion: {
                            type: string;
                        }; /** Shares issued to date */
                    };
                };
            };
            keyProvisions: {
                type: string;
                description: string;
                properties: {
                    boardSize: {
                        type: string;
                        properties: {
                            minimum: {
                                type: string;
                            };
                            maximum: {
                                type: string;
                            };
                            sectionRef: {
                                type: string;
                            };
                        };
                    };
                    quorumRequirements: {
                        type: string;
                        properties: {
                            boardQuorum: {
                                type: string;
                            };
                            shareholderQuorum: {
                                type: string;
                            };
                            sectionRef: {
                                type: string;
                            };
                        }; /** Jurisdiction of incorporation */
                    };
                    meetingNotice: {
                        type: string;
                        /** Date of formation (ISO 8601) */
                        properties: {
                            annualMeetingNotice: {
                                type: string;
                                description: string;
                            };
                            specialMeetingNotice: {
                                type: string;
                            };
                            boardMeetingNotice: {
                                type: string;
                            };
                            sectionRef: {
                                type: string;
                            };
                        };
                    };
                    indemnification: {
                        type: string;
                        properties: {
                            directorsIndemnified: {
                                type: string;
                            };
                            officersIndemnified: {
                                type: string;
                            };
                            mandatory: {
                                type: string;
                            };
                            advancementOfExpenses: {
                                type: string;
                            };
                            sectionRef: {
                                type: string;
                            };
                        };
                    };
                    specialMeetingThreshold: {
                        type: string;
                        properties: {
                            boardCanCall: {
                                type: string;
                            };
                            shareholderThreshold: {
                                type: string;
                                description: string;
                            };
                            sectionRef: {
                                type: string;
                            };
                        };
                    };
                };
            };
            pendingAmendment: {
                type: string;
                nullable: boolean;
                properties: {
                    amendmentId: {
                        type: string;
                    };
                    description: {
                        type: string;
                    };
                    proposedBy: {
                        type: string;
                    };
                    proposedDate: {
                        type: string;
                        format: string;
                    };
                    sectionsAffected: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    proposedChanges: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    approvalRequired: {
                        type: string;
                    };
                    boardApprovalRef: {
                        type: string;
                        nullable: boolean;
                    };
                    shareholderApprovalRef: {
                        type: string;
                        nullable: boolean;
                    };
                    status: {
                        type: string;
                        enum: string[];
                    };
                };
            };
            amendmentHistory: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        amendmentId: {
                            type: string;
                        };
                        version: {
                            type: string;
                        };
                        description: {
                            type: string;
                        }; /** Unique board identifier */
                        sectionsAffected: {
                            type: string;
                            /** Associated entity ID */
                            items: {
                                type: string;
                            };
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                        };
                        approvedBy: {
                            type: string;
                            enum: string[];
                        };
                        boardResolutionRef: {
                            type: string;
                            nullable: boolean;
                        };
                        shareholderResolutionRef: {
                            type: string;
                            nullable: boolean;
                        };
                        documentRef: {
                            type: string;
                        }; /** Meeting history */
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            }; /** Current state */
        };
        states: {
            DRAFT: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            ADOPTED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            AMENDING: {
                description: string;
                metadata: {
                    displayName: string;
                    /** Unique shareholder identifier */
                    color: string;
                };
            };
        };
        initialState: string;
        transitions: {
            adopt: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        adoptionDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        adoptedBy: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        documentRef: {
                            type: string; /** Vote type required */
                            required: boolean;
                        };
                        sections: {
                            type: string;
                            required: boolean;
                        };
                        keyProvisions: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        bylawsId: string;
                        version: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            propose_amendment: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        amendmentId: {
                            type: string;
                            required: boolean;
                        };
                        description: {
                            type: string;
                            required: boolean;
                        };
                        proposedBy: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        sectionsAffected: {
                            type: string;
                            items: {
                                type: string;
                            };
                            required: boolean;
                        };
                        proposedChanges: {
                            type: string;
                            required: boolean;
                            items: {
                                type: string;
                                properties: {
                                    sectionId: {
                                        type: string;
                                    };
                                    changeType: {
                                        type: string;
                                        enum: string[];
                                    };
                                    currentContent: {
                                        type: string;
                                    };
                                    proposedContent: {
                                        type: string;
                                    };
                                }; /** Cost basis */
                            };
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        amendmentId: string;
                        description: string;
                        proposedBy: string;
                        proposedDate: string;
                        sectionsAffected: string;
                        proposedChanges: string;
                        status: string;
                    };
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string; /** Current state */
                        amendmentId: string;
                        sectionsAffected: string;
                    };
                    path?: undefined;
                    expression?: undefined;
                    value?: undefined;
                })[];
            };
            board_approve_amendment: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        approvalDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                    expression?: undefined;
                })[];
                effects: {
                    type: string;
                    path: string;
                    value: string;
                }[];
            };
            approve_amendment: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        shareholderResolutionRef: {
                            type: string;
                            description: string;
                        };
                        newDocumentRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    expression?: undefined;
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    array: string;
                    do: {
                        type: string;
                        path: string;
                        matchKey: string;
                        matchValue: string;
                        updates: {
                            content: string;
                            lastModifiedVersion: string;
                        };
                    };
                    path?: undefined;
                    expression?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        amendmentId: string;
                        version: string;
                        description: string;
                        sectionsAffected: string;
                        effectiveDate: string;
                        approvedBy: string;
                        boardResolutionRef: string;
                        shareholderResolutionRef: string;
                        documentRef: string;
                    };
                    expression?: undefined;
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: null;
                    expression?: undefined;
                    array?: undefined;
                    do?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        bylawsId: string;
                        newVersion: string;
                        effectiveDate: string;
                    };
                    path?: undefined;
                    expression?: undefined;
                    value?: undefined;
                    array?: undefined;
                    do?: undefined;
                })[];
            };
            reject_amendment: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        rejectedBy: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        amendmentId: string;
                        rejectedBy: string;
                    };
                    path?: undefined;
                    value?: undefined;
                } | {
                    type: string;
                    path: string;
                    value: null;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                })[];
            };
            restate: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        restatedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        newDocumentRef: {
                            type: string;
                            required: boolean;
                        };
                        sections: {
                            type: string;
                            required: boolean;
                        };
                        keyProvisions: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        amendmentId: string;
                        version: string;
                        description: string;
                        sectionsAffected: string[];
                        effectiveDate: string;
                        approvedBy: string;
                        boardResolutionRef: string;
                        documentRef: string;
                    };
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        entityId: string;
                        bylawsId: string;
                        newVersion: string;
                    };
                    path?: undefined;
                    expression?: undefined;
                    value?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            board: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            shareholders: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Committee: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            committeeId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            boardId: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            committeeType: {
                type: string;
                enum: string[];
                description: string;
            };
            purpose: {
                type: string;
                description: string;
            };
            isStanding: {
                type: string;
                default: boolean;
                description: string;
            };
            createdDate: {
                type: string;
                format: string;
            };
            disbandDate: {
                type: string;
                format: string;
                nullable: boolean;
            };
            charter: {
                type: string;
                nullable: boolean;
                properties: {
                    charterId: {
                        type: string;
                    };
                    version: {
                        type: string;
                    };
                    adoptedDate: {
                        type: string;
                        format: string;
                    };
                    lastReviewedDate: {
                        type: string;
                        format: string;
                    };
                    documentRef: {
                        type: string; /** Total authorized shares */
                    };
                    purposes: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    responsibilities: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    authorityLimits: {
                        type: string;
                    };
                    reportingRequirements: {
                        type: string;
                    };
                };
            };
            membershipRequirements: {
                type: string;
                properties: {
                    minimumMembers: {
                        type: string;
                        default: number;
                    };
                    maximumMembers: {
                        type: string;
                    };
                    independenceRequired: {
                        type: string;
                        default: boolean;
                    };
                    financialExpertRequired: {
                        type: string;
                        /** Legal name of the entity */
                        default: boolean;
                        description: string;
                    }; /** Type of entity */
                    independenceStandard: {
                        type: string;
                        enum: string[]; /** Date of formation (ISO 8601) */
                        nullable: boolean;
                    };
                };
            };
            members: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        memberId: {
                            type: string;
                        };
                        directorId: {
                            type: string;
                        };
                        name: {
                            type: string;
                        };
                        role: {
                            type: string;
                            enum: string[];
                        };
                        appointedDate: {
                            type: string;
                            format: string;
                        };
                        appointmentResolutionRef: {
                            type: string;
                        };
                        removedDate: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                        isIndependent: {
                            type: string;
                        };
                        isFinancialExpert: {
                            type: string;
                            default: boolean;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                    };
                };
            };
            quorumRules: {
                /**
                 * Board meeting type.
                 */
                type: string;
                properties: {
                    type: {
                        type: string;
                        enum: string[];
                        default: string;
                    };
                    threshold: {
                        type: string;
                    };
                    minimumRequired: {
                        type: string;
                    };
                };
            };
            currentMeeting: {
                type: string;
                nullable: boolean;
                properties: {
                    meetingId: {
                        type: string;
                    };
                    scheduledDate: {
                        type: string;
                        format: string;
                    };
                    agenda: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    attendees: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    quorumPresent: {
                        type: string;
                    };
                    openedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    closedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    }; /** Unique meeting identifier */
                };
            };
            meetingHistory: {
                type: string;
                items: {
                    type: string;
                    /** Scheduled date (ISO 8601) */
                    properties: {
                        meetingId: {
                            type: string;
                        };
                        date: {
                            type: string;
                            format: string;
                        };
                        attendeeCount: {
                            type: string;
                        };
                        minutesRef: {
                            type: string;
                        };
                        actionsApproved: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
            };
            annualReviewDate: {
                type: string; /** Associated entity ID */
                format: string;
                nullable: boolean;
            };
            status: {
                type: string;
                enum: string[];
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                /** Quorum rules */
                format: string;
            };
        };
        states: {
            FORMING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            ACTIVE: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            IN_MEETING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            NON_COMPLIANT: {
                description: string;
                /**
                 * Agenda item status.
                 */
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            DISBANDED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            create_committee: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        committeeId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            required: boolean;
                        };
                        boardId: {
                            type: string;
                            required: boolean;
                        };
                        name: {
                            /** Item title */
                            type: string;
                            required: boolean;
                        };
                        committeeType: {
                            type: string;
                            required: boolean;
                        };
                        purpose: {
                            type: string;
                        };
                        isStanding: {
                            type: string;
                            default: boolean;
                        };
                        membershipRequirements: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: never[];
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        name: string; /**
                         * Holder type.
                         */
                        type: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            appoint_member: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        memberId: {
                            type: string;
                            required: boolean;
                        };
                        directorId: {
                            type: string;
                            required: boolean;
                        };
                        name: {
                            type: string;
                            required: boolean;
                        };
                        role: {
                            type: string;
                            enum: string[];
                            default: string;
                        };
                        isIndependent: {
                            type: string;
                            required: boolean;
                        };
                        isFinancialExpert: {
                            type: string;
                            default: boolean;
                        };
                        /** Share class identifier */
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: ({
                    name: string; /** Par value */
                    description: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        query: string;
                    };
                    expression?: undefined;
                } | {
                    name: string;
                    expression: string;
                    description?: undefined;
                    crossMachine?: undefined;
                })[];
                effects: ({
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        filter: string;
                        updates: {
                            role: string;
                        };
                    };
                    path?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        memberId: string;
                        directorId: string;
                        name: string;
                        role: string;
                        appointedDate: string;
                        appointmentResolutionRef: string;
                        isIndependent: string;
                        isFinancialExpert: string;
                        status: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        directorId: string;
                        role: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            remove_member: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        memberId: {
                            type: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        removedDate: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        memberId: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            adopt_charter: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        charterId: {
                            type: string;
                            required: boolean;
                        };
                        version: {
                            type: string;
                            required: boolean;
                        };
                        documentRef: {
                            type: string;
                            required: boolean;
                        };
                        purposes: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        responsibilities: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                        authorityLimits: {
                            type: string;
                        };
                        reportingRequirements: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: ({
                    name: string;
                    expression: string;
                    crossMachine?: undefined;
                } | {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                    expression?: undefined;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        charterId: string;
                        version: string;
                        adoptedDate: string;
                        lastReviewedDate: string;
                        documentRef: string;
                        purposes: string;
                        responsibilities: string;
                        authorityLimits: string;
                        reportingRequirements: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        charterId: string;
                        version: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            call_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                        scheduledDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        agenda: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    path: string;
                    value: {
                        meetingId: string;
                        scheduledDate: string;
                        agenda: string;
                        attendees: never[];
                        quorumPresent: boolean;
                    };
                }[];
            };
            open_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        openedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        attendees: {
                            type: string;
                            items: {
                                type: string;
                            };
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                } | {
                    type: string;
                    path: string;
                    value: boolean;
                })[];
            };
            adjourn_meeting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        closedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        minutesRef: {
                            type: string;
                        };
                        actionsApproved: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                } | {
                    type: string;
                    path: string;
                    value: {
                        meetingId: string;
                        date: string;
                        attendeeCount: string;
                        minutesRef: string;
                        actionsApproved: string;
                    };
                } | {
                    type: string;
                    path: string;
                    value: null;
                })[];
            };
            flag_non_compliant: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        reason: {
                            type: string;
                            required: boolean;
                        };
                        flaggedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        reason: string;
                    };
                }[];
            };
            restore_compliance: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        restoredDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                    };
                }[];
            };
            disband: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        disbandDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        finalReportRef: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    filter?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    filter: string;
                    updates: {
                        status: string;
                        removedDate: string;
                    };
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        committeeId: string;
                        reason: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    filter?: undefined;
                    updates?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            board: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            resolutions: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Resolution: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            resolutionId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            resolutionNumber: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            resolutionType: {
                type: string;
                enum: string[];
                description: string;
            };
            category: {
                type: string;
                enum: string[];
                description: string;
            };
            proposedDate: {
                type: string;
                format: string;
            };
            proposedBy: {
                type: string;
                /** Human-readable class name */
                properties: {
                    type: {
                        type: string; /** Total authorized shares */
                        enum: string[];
                    };
                    personId: {
                        type: string;
                    }; /** Shares currently outstanding */
                    name: {
                        type: string;
                    };
                };
            };
            resolvedText: {
                type: string;
                description: string; /** Votes per share (if votingRights is true) */
            }; /** Votes per share (if votingRights is true) */
            whereAsClauses: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            resolvedClauses: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            attachments: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        attachmentId: {
                            type: string;
                        };
                        title: {
                            type: string;
                        };
                        documentRef: {
                            type: string;
                        };
                        type: {
                            type: string;
                        };
                    };
                };
            };
            approvalRequirements: {
                type: string;
                properties: {
                    approverType: {
                        type: string;
                        enum: string[];
                    };
                    threshold: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    supermajorityPercent: {
                        type: string;
                        nullable: boolean;
                    };
                    quorumRequired: {
                        type: string;
                        default: boolean;
                    };
                    shareholderClassVotes: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                };
            };
            meetingRef: {
                type: string;
                nullable: boolean;
                description: string;
                properties: {
                    meetingType: {
                        type: string;
                        enum: string[];
                    };
                    meetingId: {
                        type: string;
                    };
                    meetingDate: {
                        type: string;
                        format: string; /** Director's email */
                    }; /** Director's email */
                };
            };
            voting: {
                type: string;
                properties: {
                    votingOpenedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    votingClosedAt: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    votes: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                voterId: {
                                    type: string;
                                };
                                voterName: {
                                    type: string;
                                };
                                voterType: {
                                    type: string;
                                    enum: string[];
                                };
                                vote: {
                                    type: string;
                                    enum: string[];
                                };
                                votingPower: {
                                    type: string;
                                    default: number;
                                    description: string;
                                };
                                timestamp: {
                                    type: string;
                                    format: string;
                                }; /** Associated entity ID */
                                comment: {
                                    type: string;
                                    nullable: boolean;
                                };
                            };
                        };
                    };
                    /** Seat information */
                    tally: {
                        type: string;
                        properties: {
                            for: {
                                type: string;
                                default: number;
                            };
                            against: {
                                type: string;
                                default: number;
                            };
                            abstain: {
                                type: string;
                                default: number;
                            };
                            recused: {
                                type: string;
                                default: number;
                            };
                            totalEligible: {
                                type: string;
                            };
                            totalVoted: {
                                type: string;
                            };
                        };
                    }; /** Current state */
                };
            };
            writtenConsent: {
                /** Creation timestamp */
                type: string;
                nullable: boolean;
                description: string;
                properties: {
                    consentForm: {
                        type: string;
                        description: string;
                    };
                    circulationDate: {
                        type: string;
                        format: string;
                    };
                    consentDeadline: {
                        type: string;
                        format: string;
                    };
                    consents: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                consentorId: {
                                    type: string; /** Unique shareholder identifier */
                                }; /** Unique shareholder identifier */
                                consentorName: {
                                    type: string;
                                };
                                signedDate: {
                                    type: string;
                                    format: string;
                                };
                                votingPower: {
                                    type: string;
                                    default: number;
                                };
                                signatureRef: {
                                    type: string;
                                };
                            };
                        };
                    };
                    totalConsentPower: {
                        type: string;
                    };
                    requiredConsentPower: {
                        type: string;
                    };
                };
            };
            approvalDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    approved: {
                        type: string;
                    };
                    approvalDate: {
                        type: string;
                        format: string;
                    };
                    approvalMethod: {
                        type: string;
                        enum: string[];
                    };
                    certifiedBy: {
                        type: string;
                    };
                    certificationDate: {
                        type: string;
                        format: string;
                    };
                };
            };
            effectiveDate: {
                type: string;
                format: string;
                nullable: boolean;
            };
            expirationDate: {
                type: string;
                format: string; /** Type of meeting */
                nullable: boolean;
                description: string;
            };
            executionDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    executedDate: {
                        type: string;
                        format: string;
                    };
                    executedBy: {
                        type: string;
                    };
                    executionNotes: {
                        type: string;
                    };
                    resultingActions: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                actionType: {
                                    type: string;
                                };
                                reference: {
                                    type: string;
                                };
                                completedDate: {
                                    type: string;
                                    format: string;
                                };
                            };
                        };
                    };
                };
            };
            rescissionDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    rescindedDate: {
                        type: string;
                        format: string;
                    };
                    rescindingResolutionRef: {
                        type: string;
                    };
                    reason: {
                        type: string;
                    };
                };
            };
            relatedResolutions: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        resolutionId: {
                            type: string;
                        };
                        relationship: {
                            /**
                             * Security form.
                             */
                            type: string;
                            enum: string[];
                        };
                    };
                };
            };
            createdAt: {
                type: string;
                format: string; /**
                 * Holder type.
                 */
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            DRAFT: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            PROPOSED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            VOTING: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            APPROVED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            EXECUTED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string; /** Security form */
                };
            };
            REJECTED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string; /** Transfer restrictions */
                };
                terminal: boolean;
            };
            EXPIRED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
            RESCINDED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            draft_resolution: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        resolutionId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            required: boolean;
                        };
                        title: {
                            type: string;
                            required: boolean;
                        };
                        resolutionType: {
                            type: string;
                            required: boolean;
                        };
                        category: {
                            type: string;
                            required: boolean;
                        };
                        whereAsClauses: {
                            type: string;
                        };
                        resolvedClauses: {
                            type: string;
                            required: boolean;
                        };
                        approvalRequirements: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                } | {
                    type: string;
                    path: string;
                    value: never[];
                } | {
                    type: string;
                    path: string;
                    value: {
                        for: number;
                        against: number;
                        abstain: number;
                        recused: number;
                        totalVoted: number;
                    };
                })[];
            };
            propose: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        proposedBy: {
                            type: string;
                            required: boolean;
                        };
                        meetingRef: {
                            type: string;
                            description: string;
                        };
                        resolutionNumber: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        title: string;
                        type: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            open_voting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        votingOpenedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        totalEligibleVoters: {
                            type: string;
                            required: boolean;
                        };
                        isWrittenConsent: {
                            type: string;
                            default: boolean;
                        };
                        consentDeadline: {
                            type: string;
                            format: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    condition?: undefined;
                    then?: undefined;
                } | {
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        value: {
                            circulationDate: string;
                            consentDeadline: string;
                            consents: never[];
                            totalConsentPower: number;
                        };
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            record_vote: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        voterId: {
                            type: string;
                            required: boolean;
                        };
                        voterName: {
                            type: string;
                            required: boolean;
                        };
                        voterType: {
                            type: string;
                            required: boolean;
                        };
                        vote: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        votingPower: {
                            type: string;
                            default: number;
                        };
                        comment: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        voterId: string;
                        voterName: string;
                        voterType: string;
                        vote: string;
                        votingPower: string;
                        timestamp: string;
                        comment: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    amount?: undefined;
                } | {
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        amount: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    amount?: undefined;
                } | {
                    type: string;
                    path: string;
                    amount: string;
                    value?: undefined;
                    condition?: undefined;
                    then?: undefined;
                })[];
            };
            record_consent: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        consentorId: {
                            type: string;
                            required: boolean;
                        };
                        consentorName: {
                            type: string;
                            required: boolean;
                        };
                        signedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        votingPower: {
                            type: string;
                            default: number;
                        };
                        signatureRef: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        consentorId: string;
                        consentorName: string;
                        signedDate: string;
                        votingPower: string;
                        signatureRef: string;
                    };
                    amount?: undefined;
                } | {
                    type: string;
                    path: string;
                    amount: string;
                    value?: undefined;
                })[];
            };
            close_voting_approved: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        votingClosedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        certifiedBy: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                        };
                        expirationDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        approved: boolean;
                        approvalDate: string;
                        approvalMethod: string;
                        certifiedBy: string;
                        certificationDate: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        title: string;
                        votesFor: string;
                        votesAgainst: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            close_voting_rejected: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        votingClosedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        certifiedBy: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        approved: boolean;
                        approvalDate: string;
                        approvalMethod: string;
                        certifiedBy: string;
                        certificationDate: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        title: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            execute: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        executedBy: {
                            type: string;
                            required: boolean;
                        };
                        executionNotes: {
                            type: string;
                        };
                        resultingActions: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        executedDate: string;
                        executedBy: string;
                        executionNotes: string;
                        resultingActions: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        title: string;
                        category: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            expire: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        expiredDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        title: string;
                    };
                }[];
            };
            rescind: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        rescindingResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                            required: boolean;
                        };
                        rescindedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        rescindedDate: string;
                        rescindingResolutionRef: string;
                        reason: string;
                        resolutionId?: undefined;
                        relationship?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        resolutionId: string;
                        relationship: string;
                        rescindedDate?: undefined;
                        rescindingResolutionRef?: undefined;
                        reason?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        rescindedBy: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            withdraw: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        withdrawnBy: {
                            type: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                    };
                };
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        resolutionId: string;
                        withdrawnBy: string;
                    };
                }[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            board: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            shareholders: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Proxy: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            proxyId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            grantorId: {
                type: string;
                description: string;
            };
            grantorName: {
                type: string;
            };
            grantorShares: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        shareClass: {
                            type: string;
                        };
                        shares: {
                            type: string;
                        };
                        votes: {
                            type: string;
                        };
                        /**
                         * Entity lifecycle state.
                         */
                        certificateNumbers: {
                            type: string;
                            items: {
                                type: string;
                            };
                            nullable: boolean;
                        };
                    };
                };
            };
            totalVotes: {
                type: string;
                description: string;
            };
            holderId: {
                type: string;
                description: string;
            };
            holderName: {
                type: string;
            };
            holderType: {
                type: string;
                enum: string[];
                description: string;
            };
            proxyType: {
                type: string;
                enum: string[];
                description: string; /** Shares issued to date */
            };
            scope: {
                type: string;
                properties: {
                    meetingId: {
                        type: string;
                        nullable: boolean;
                        description: string;
                    };
                    meetingDate: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    agendaItems: {
                        type: string;
                        items: {
                            type: string;
                        };
                        nullable: boolean;
                        description: string;
                    };
                    votingInstructions: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                agendaItemId: {
                                    type: string;
                                };
                                instruction: {
                                    type: string;
                                    enum: string[];
                                };
                                cumulativeAllocation: {
                                    type: string;
                                    additionalProperties: {
                                        type: string;
                                    }; /** Incorporators */
                                    nullable: boolean;
                                    description: string;
                                };
                            };
                        };
                    };
                    discretionaryAuthority: {
                        type: string;
                        default: boolean;
                        description: string; /** Creation timestamp */
                    };
                };
            };
            grantDate: {
                type: string;
                format: string;
            };
            effectiveDate: {
                type: string;
                format: string;
            };
            expirationDate: {
                type: string;
                format: string;
                description: string;
            };
            revocability: {
                type: string;
                /**
                 * Board meeting type.
                 */
                properties: {
                    isRevocable: {
                        type: string;
                        default: boolean;
                    };
                    irrevocableReason: {
                        type: string;
                        enum: string[];
                        nullable: boolean;
                        description: string;
                    };
                    irrevocableUntil: {
                        type: string;
                        format: string;
                        nullable: boolean; /** Director's email */
                    };
                };
            };
            proxyCard: {
                type: string;
                description: string;
                properties: {
                    cardId: {
                        type: string;
                    };
                    format: {
                        type: string;
                        enum: string[]; /** Whether director is board chair */
                    };
                    signedDate: {
                        type: string;
                        format: string; /**
                         * Board meeting state.
                         */
                    };
                    signatureVerified: {
                        type: string;
                        default: boolean;
                    };
                    documentRef: {
                        type: string;
                    };
                    controlNumber: {
                        type: string;
                        description: string;
                    };
                };
            };
            /** Attendee information */
            votesExercised: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        meetingId: {
                            type: string;
                        };
                        agendaItemId: {
                            type: string;
                        };
                        voteCast: {
                            type: string; /** Associated entity ID */
                            enum: string[]; /** Board of directors */
                        };
                        voteCount: {
                            type: string;
                        };
                        votedAt: {
                            type: string;
                            format: string;
                        };
                        votedBy: {
                            type: string;
                        };
                    };
                };
            };
            revocationDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    revokedAt: {
                        type: string;
                        format: string;
                    };
                    revokedBy: {
                        type: string;
                    };
                    revocationMethod: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    supersedingProxyId: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            GRANTED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            }; /** Unique shareholder identifier */
            ACTIVE: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            VOTED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
            REVOKED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
            EXPIRED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            grant_proxy: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        proxyId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            required: boolean;
                        };
                        grantorId: {
                            type: string;
                            required: boolean;
                        };
                        grantorName: {
                            type: string;
                            required: boolean;
                        };
                        grantorShares: {
                            type: string;
                            required: boolean;
                        };
                        holderId: {
                            type: string;
                            required: boolean;
                        };
                        holderName: {
                            type: string;
                            required: boolean;
                        };
                        holderType: {
                            type: string;
                            default: string;
                        };
                        proxyType: {
                            type: string;
                            required: boolean;
                        };
                        scope: {
                            type: string;
                            required: boolean;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        expirationDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        revocability: {
                            type: string;
                        };
                        proxyCard: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: never[];
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                        holderId: string;
                        totalVotes: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    expression?: undefined;
                })[];
            };
            activate: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        activatedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                    };
                }[];
            };
            vote_proxy: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                        agendaItemId: {
                            type: string;
                            required: boolean;
                        };
                        voteCast: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        votedBy: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                    };
                };
                guards: ({
                    name: string;
                    description: string;
                    expression: string;
                } | {
                    name: string;
                    expression: string;
                    description?: undefined;
                })[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        meetingId: string;
                        agendaItemId: string;
                        voteCast: string;
                        voteCount: string;
                        votedAt: string;
                        votedBy: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                        meetingId: string;
                        agendaItemId: string;
                        voteCast: string;
                        voteCount: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            complete_voting: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        completedAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        meetingId: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                        meetingId: string;
                        totalVotesExercised: string;
                    };
                }[];
            };
            revoke_proxy: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        revokedBy: {
                            type: string;
                            required: boolean;
                        };
                        revocationMethod: {
                            type: string;
                            required: boolean;
                        };
                        supersedingProxyId: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        revokedAt: string;
                        revokedBy: string;
                        revocationMethod: string;
                        supersedingProxyId: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                        revocationMethod: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            expire: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        expiredAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        grantorId: string;
                    };
                }[];
            };
            supersede: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        supersedingProxyId: {
                            type: string;
                            required: boolean;
                        };
                        supersededAt: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        revokedAt: string;
                        revokedBy: string;
                        revocationMethod: string;
                        supersedingProxyId: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        proxyId: string;
                        supersedingProxyId: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            shareholders: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            securities: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Securities: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            securityId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            shareClass: {
                type: string;
                description: string;
            };
            shareClassName: {
                type: string;
                description: string;
            };
            certificateNumber: {
                type: string;
                nullable: boolean;
                description: string;
            };
            cusip: {
                type: string;
                nullable: boolean;
                description: string;
            };
            shareCount: {
                type: string;
                description: string;
            };
            parValue: {
                type: string;
                description: string;
            };
            issuancePrice: {
                type: string;
                nullable: boolean;
                description: string;
            };
            issuanceDate: {
                type: string;
                format: string;
                nullable: boolean;
            };
            form: {
                type: string;
                enum: string[];
                description: string;
            };
            holder: {
                /** Human-readable class name */
                type: string;
                nullable: boolean;
                properties: {
                    holderId: {
                        type: string;
                    };
                    holderType: {
                        type: string;
                        enum: string[];
                    };
                    name: {
                        type: string;
                    };
                    taxId: {
                        type: string;
                        nullable: boolean;
                    };
                    address: {
                        type: string;
                        nullable: boolean;
                    };
                    acquisitionDate: {
                        type: string;
                        format: string;
                    };
                    acquisitionMethod: {
                        type: string;
                        /**
                         * Corporate entity state.
                         */
                        enum: string[];
                    };
                    costBasis: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            restrictions: {
                type: string;
                properties: {
                    isRestricted: {
                        type: string;
                        default: boolean; /** Date of formation (ISO 8601) */
                    }; /** Date of formation (ISO 8601) */
                    restrictionType: {
                        type: string;
                        items: {
                            type: string;
                            enum: string[];
                        };
                    };
                    restrictionEndDate: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    legends: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    vestingSchedule: {
                        type: string;
                        nullable: boolean;
                        properties: {
                            vestingStartDate: {
                                type: string;
                                format: string;
                            };
                            totalShares: {
                                type: string;
                            };
                            vestedShares: {
                                type: string;
                            };
                            vestingScheduleRef: {
                                type: string;
                            };
                        };
                    };
                    lockUpExpiration: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                    rofr: {
                        type: string;
                        nullable: boolean;
                        description: string;
                        properties: {
                            holderIds: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                            noticePeriodDays: {
                                type: string;
                            };
                        };
                    };
                };
            };
            authorization: {
                type: string;
                nullable: boolean; /** Term end date (ISO 8601) */
                description: string; /** Current status */
                properties: {
                    authorizedDate: {
                        type: string;
                        format: string;
                    };
                    charterProvision: {
                        type: string;
                    };
                    authorizedShares: {
                        type: string;
                    };
                };
            };
            issuanceDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    boardResolutionRef: {
                        type: string;
                    }; /** Scheduled date (ISO 8601) */
                    issuanceAgreementRef: {
                        type: string;
                    };
                    consideration: {
                        type: string;
                        properties: {
                            type: {
                                type: string;
                                enum: string[];
                            };
                            value: {
                                type: string;
                            };
                            description: {
                                type: string;
                            };
                        };
                    };
                    exemptionUsed: {
                        type: string;
                        /** Board of directors */
                        nullable: boolean;
                    };
                    accreditedInvestor: {
                        type: string;
                        nullable: boolean;
                    };
                };
            };
            transferHistory: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        transferId: {
                            type: string;
                        };
                        transferDate: {
                            type: string;
                            format: string;
                        };
                        fromHolderId: {
                            type: string;
                        };
                        toHolderId: {
                            type: string;
                        };
                        shares: {
                            type: string;
                        };
                        transferType: {
                            type: string;
                            enum: string[];
                        };
                        pricePerShare: {
                            type: string;
                            nullable: boolean;
                        };
                        transferAgentConfirmation: {
                            type: string;
                            nullable: boolean;
                        };
                    };
                };
            };
            corporateActions: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        actionId: {
                            type: string;
                        };
                        actionType: {
                            type: string;
                            enum: string[];
                        };
                        actionDate: {
                            type: string;
                            format: string;
                        };
                        ratio: {
                            type: string;
                            nullable: boolean;
                            description: string;
                        };
                        sharesBeforeAction: {
                            type: string;
                        };
                        sharesAfterAction: {
                            type: string;
                        };
                        resolutionRef: {
                            type: string;
                        };
                    };
                };
            };
            retirementDetails: {
                type: string;
                nullable: boolean;
                properties: {
                    retiredDate: {
                        type: string;
                        format: string;
                    };
                    retirementMethod: {
                        type: string;
                        enum: string[];
                    };
                    repurchasePrice: {
                        type: string;
                        nullable: boolean;
                    };
                    boardResolutionRef: {
                        type: string;
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string; /** Associated entity ID */
                format: string;
            };
        };
        states: {
            AUTHORIZED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            ISSUED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            TREASURY: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            }; /** Votes cast */
            TRANSFERRED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            RETIRED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
                terminal: boolean;
            };
        };
        initialState: string;
        transitions: {
            authorize_shares: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        securityId: {
                            type: string;
                            required: boolean;
                        };
                        entityId: {
                            type: string;
                            /**
                             * Holder type.
                             */
                            required: boolean;
                        };
                        shareClass: {
                            type: string;
                            required: boolean;
                        };
                        shareClassName: {
                            type: string;
                            required: boolean;
                        };
                        shareCount: {
                            type: string;
                            required: boolean;
                        };
                        parValue: {
                            type: string;
                            required: boolean;
                        }; /** Holder's name */
                        authorizedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        charterProvision: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                } | {
                    type: string;
                    path: string;
                    value: {
                        authorizedDate: string;
                        charterProvision: string;
                        authorizedShares: string;
                    };
                } | {
                    type: string;
                    path: string;
                    value: never[];
                })[];
            };
            issue_shares: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        holderId: {
                            type: string;
                            required: boolean;
                        };
                        holderType: {
                            type: string;
                            required: boolean;
                        };
                        holderName: {
                            type: string;
                            required: boolean;
                        };
                        address: {
                            type: string;
                        };
                        issuanceDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        issuancePrice: {
                            type: string;
                        };
                        form: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        certificateNumber: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        consideration: {
                            type: string;
                            required: boolean;
                        };
                        isRestricted: {
                            type: string;
                            default: boolean;
                        };
                        restrictionType: {
                            type: string;
                        };
                        legends: {
                            type: string;
                        };
                        exemptionUsed: {
                            type: string;
                        };
                        accreditedInvestor: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        holderId: string;
                        holderType: string;
                        name: string;
                        address: string;
                        acquisitionDate: string;
                        acquisitionMethod: string;
                        costBasis: string;
                        isRestricted?: undefined;
                        restrictionType?: undefined;
                        legends?: undefined;
                        boardResolutionRef?: undefined;
                        consideration?: undefined;
                        exemptionUsed?: undefined;
                        accreditedInvestor?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        isRestricted: string;
                        restrictionType: string;
                        legends: string;
                        holderId?: undefined;
                        holderType?: undefined;
                        name?: undefined;
                        address?: undefined;
                        acquisitionDate?: undefined;
                        acquisitionMethod?: undefined;
                        costBasis?: undefined;
                        boardResolutionRef?: undefined;
                        consideration?: undefined;
                        exemptionUsed?: undefined;
                        accreditedInvestor?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        boardResolutionRef: string;
                        consideration: string;
                        exemptionUsed: string;
                        accreditedInvestor: string;
                        holderId?: undefined;
                        holderType?: undefined;
                        name?: undefined;
                        address?: undefined;
                        acquisitionDate?: undefined;
                        acquisitionMethod?: undefined;
                        costBasis?: undefined;
                        isRestricted?: undefined;
                        restrictionType?: undefined;
                        legends?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        entityId: string;
                        shareClass: string;
                        shares: string;
                        holderId: string;
                        holderName: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            initiate_transfer: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        transferId: {
                            type: string;
                            required: boolean;
                        };
                        toHolderId: {
                            type: string;
                            required: boolean;
                        };
                        toHolderName: {
                            type: string;
                            required: boolean;
                        };
                        toHolderType: {
                            type: string;
                            required: boolean;
                        };
                        toAddress: {
                            type: string;
                        };
                        transferType: {
                            type: string;
                            required: boolean;
                        };
                        pricePerShare: {
                            type: string;
                        };
                        transferDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        transferId: string;
                        transferDate: string;
                        fromHolderId: string;
                        toHolderId: string;
                        shares: string;
                        transferType: string;
                        pricePerShare: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        transferId: string;
                        fromHolderId: string;
                        toHolderId: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            complete_transfer: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        transferAgentConfirmation: {
                            type: string;
                        };
                        newCertificateNumber: {
                            type: string;
                        };
                        toHolderId: {
                            type: string;
                            required: boolean;
                        };
                        toHolderName: {
                            type: string;
                            required: boolean;
                        };
                        toHolderType: {
                            type: string;
                            required: boolean;
                        };
                        toAddress: {
                            type: string;
                        };
                        completedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        costBasis: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        holderId: string;
                        holderType: string;
                        name: string;
                        address: string;
                        acquisitionDate: string;
                        acquisitionMethod: string;
                        costBasis: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        value: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        transferAgentConfirmation: string;
                    };
                    value?: undefined;
                    condition?: undefined;
                    then?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        newHolderId: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    condition?: undefined;
                    then?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            repurchase: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        repurchaseDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        pricePerShare: {
                            type: string;
                            required: boolean;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        repurchaseAgreementRef: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        transferId: string;
                        transferDate: string;
                        fromHolderId: string;
                        toHolderId: string;
                        shares: string;
                        transferType: string;
                        pricePerShare: string;
                        holderId?: undefined;
                        holderType?: undefined;
                        name?: undefined;
                        acquisitionDate?: undefined;
                        acquisitionMethod?: undefined;
                        costBasis?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        holderId: string;
                        holderType: string;
                        name: string;
                        acquisitionDate: string;
                        acquisitionMethod: string;
                        costBasis: string;
                        transferId?: undefined;
                        transferDate?: undefined;
                        fromHolderId?: undefined;
                        toHolderId?: undefined;
                        shares?: undefined;
                        transferType?: undefined;
                        pricePerShare?: undefined;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        shares: string;
                        pricePerShare: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            reissue_from_treasury: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        holderId: {
                            type: string;
                            required: boolean;
                        };
                        holderName: {
                            type: string;
                            required: boolean;
                        };
                        holderType: {
                            type: string;
                            required: boolean;
                        };
                        address: {
                            type: string;
                        };
                        reissueDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        issuancePrice: {
                            type: string;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        holderId: string;
                        holderType: string;
                        name: string;
                        address: string;
                        acquisitionDate: string;
                        acquisitionMethod: string;
                        costBasis: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        holderId: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            retire: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        retiredDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        retirementMethod: {
                            type: string;
                            required: boolean;
                        };
                        boardResolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        repurchasePrice: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        retiredDate: string;
                        retirementMethod: string;
                        repurchasePrice: string;
                        boardResolutionRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: null;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        shareClass: string;
                        shares: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            stock_split: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        actionId: {
                            type: string;
                            required: boolean;
                        };
                        splitRatio: {
                            type: string;
                            required: boolean;
                            description: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                        newShareCount: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        actionId: string;
                        actionType: string;
                        actionDate: string;
                        ratio: string;
                        sharesBeforeAction: string;
                        sharesAfterAction: string;
                        resolutionRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        ratio: string;
                        newShareCount: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            declare_dividend: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        actionId: {
                            type: string;
                            required: boolean;
                        };
                        dividendType: {
                            type: string;
                            enum: string[];
                            required: boolean;
                        };
                        recordDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        paymentDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        cashAmount: {
                            type: string;
                        };
                        stockShares: {
                            type: string;
                        };
                        resolutionRef: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                guards: {
                    name: string;
                    crossMachine: {
                        machine: string;
                        instanceRef: string;
                        requiredState: string;
                    };
                }[];
                effects: ({
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        value: {
                            actionId: string;
                            actionType: string;
                            actionDate: string;
                            sharesBeforeAction: string;
                            sharesAfterAction: string;
                            resolutionRef: string;
                        };
                        amount?: undefined;
                    };
                } | {
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        amount: string;
                        value?: undefined;
                    };
                })[];
            };
            remove_restriction: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        restrictionType: {
                            type: string;
                            required: boolean;
                        };
                        removedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        reason: {
                            type: string;
                        };
                        legalOpinionRef: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    operation: string;
                    value: string;
                    expression?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    expression: string;
                    operation?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        securityId: string;
                        restrictionType: string;
                    };
                    path?: undefined;
                    operation?: undefined;
                    value?: undefined;
                    expression?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            resolutions: {
                machine: string;
                description: string;
                foreignKey: string;
            };
            shareholders: {
                machine: string;
                description: string;
                foreignKey: string;
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
    readonly Compliance: {
        $schema: string;
        name: string;
        version: string;
        category: string;
        description: string;
        context: {
            /**
             * Type of corporate entity.
             */
            complianceId: {
                type: string;
                description: string;
            };
            entityId: {
                type: string;
                description: string;
            };
            jurisdiction: {
                type: string;
                properties: {
                    state: {
                        type: string;
                        description: string;
                    };
                    country: {
                        type: string;
                        default: string;
                    };
                    foreignQualifications: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                state: {
                                    type: string;
                                };
                                qualificationDate: {
                                    type: string;
                                    format: string;
                                };
                                foreignEntityNumber: {
                                    type: string;
                                };
                                status: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                        };
                    };
                };
            };
            filingCalendar: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        filingId: {
                            type: string;
                        };
                        filingType: {
                            type: string;
                            enum: string[];
                        };
                        jurisdiction: {
                            type: string;
                        };
                        frequency: {
                            type: string;
                            enum: string[];
                        };
                        dueDate: {
                            type: string;
                            format: string;
                        };
                        gracePeriodDays: {
                            type: string;
                            default: number;
                        };
                        estimatedFee: {
                            type: string;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                        lastFiledDate: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                        confirmationNumber: {
                            type: string;
                            nullable: boolean;
                        };
                        notes: {
                            type: string;
                            nullable: boolean;
                        };
                    };
                };
            };
            registeredAgents: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        jurisdiction: {
                            type: string;
                        };
                        agentName: {
                            type: string;
                        };
                        agentAddress: {
                            type: string;
                        };
                        agentPhone: {
                            type: string;
                        };
                        agentEmail: {
                            type: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                        };
                        isThirdParty: {
                            type: string;
                        };
                        serviceAgreementRef: {
                            type: string;
                            nullable: boolean;
                        };
                        renewalDate: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                    };
                };
            };
            deficiencies: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        deficiencyId: {
                            type: string;
                        };
                        jurisdiction: {
                            type: string;
                        };
                        type: {
                            type: string;
                            enum: string[]; /** Director's email */
                        };
                        description: {
                            type: string;
                        };
                        noticeDate: {
                            type: string;
                            format: string;
                        };
                        noticeRef: {
                            type: string;
                        };
                        cureDeadline: {
                            type: string;
                            format: string;
                        };
                        penaltyAmount: {
                            type: string;
                            nullable: boolean;
                        };
                        status: {
                            type: string;
                            enum: string[];
                        };
                        curedDate: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                        curativeActions: {
                            type: string;
                            items: {
                                type: string;
                            };
                        };
                    };
                };
            };
            filingHistory: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        filingId: {
                            type: string;
                        };
                        filingType: {
                            type: string;
                        };
                        /** Unique board identifier */
                        jurisdiction: {
                            type: string;
                        };
                        filedDate: {
                            type: string;
                            format: string;
                        };
                        periodCovered: {
                            type: string; /** Seat information */
                        };
                        confirmationNumber: {
                            type: string;
                        };
                        feePaid: {
                            type: string;
                        };
                        filedBy: {
                            type: string;
                        };
                        documentRef: {
                            type: string;
                        };
                    }; /** Current meeting (if in session) */
                };
            };
            goodStandingCertificates: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        certificateId: {
                            type: string;
                        };
                        jurisdiction: {
                            type: string;
                        };
                        issuedDate: {
                            type: string;
                            format: string;
                        };
                        validThrough: {
                            type: string;
                            format: string;
                            nullable: boolean;
                        };
                        documentRef: {
                            type: string;
                        };
                        purpose: {
                            type: string;
                        };
                    };
                };
            };
            complianceScore: {
                type: string;
                properties: {
                    overallStatus: {
                        type: string;
                        enum: string[];
                    };
                    openDeficiencies: {
                        type: string;
                    };
                    overdueFilings: {
                        /**
                         * Shareholder information.
                         */
                        type: string;
                    };
                    upcomingDeadlines30Days: {
                        type: string;
                    };
                    lastAssessedDate: {
                        type: string;
                        format: string;
                    };
                };
            };
            createdAt: {
                type: string;
                format: string;
            };
            updatedAt: {
                type: string;
                format: string;
            };
        };
        states: {
            COMPLIANT: {
                description: string;
                /** Whether shareholder has voted */
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            REVIEW_PENDING: {
                description: string; /** Item type */
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            DEFICIENT: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
            REMEDIATED: {
                description: string;
                metadata: {
                    displayName: string;
                    color: string;
                };
            };
        };
        initialState: string;
        transitions: {
            initialize_compliance: {
                from: null;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        complianceId: {
                            type: string;
                            required: boolean; /** Meeting agenda */
                        };
                        entityId: {
                            type: string;
                            /** Votes cast */
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        registeredAgents: {
                            type: string;
                            required: boolean;
                        };
                        filingCalendar: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                } | {
                    type: string;
                    path: string;
                    value: never[];
                } | {
                    type: string;
                    path: string;
                    value: {
                        overallStatus: string;
                        openDeficiencies: number;
                        overdueFilings: number;
                        upcomingDeadlines30Days: number;
                        lastAssessedDate: string;
                    };
                })[];
            };
            add_filing_requirement: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        filingId: {
                            type: string;
                            required: boolean;
                        }; /** Current holder */
                        filingType: {
                            type: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        frequency: {
                            type: string;
                            required: boolean;
                        };
                        dueDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        gracePeriodDays: {
                            type: string;
                            default: number;
                        };
                        estimatedFee: {
                            type: string;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    value: {
                        filingId: string;
                        filingType: string;
                        jurisdiction: string;
                        frequency: string;
                        dueDate: string;
                        gracePeriodDays: string;
                        estimatedFee: string;
                        status: string;
                    };
                }[];
            };
            file_annual_report: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        filingId: {
                            type: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        filedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        periodCovered: {
                            type: string;
                            required: boolean;
                        };
                        confirmationNumber: {
                            type: string;
                            required: boolean;
                        };
                        feePaid: {
                            type: string;
                            required: boolean;
                        };
                        filedBy: {
                            type: string;
                            required: boolean;
                        };
                        documentRef: {
                            type: string;
                        };
                        nextDueDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        lastFiledDate: string;
                        confirmationNumber: string;
                        dueDate: string;
                    };
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        filingId: string;
                        filingType: string;
                        jurisdiction: string;
                        filedDate: string;
                        periodCovered: string;
                        confirmationNumber: string;
                        feePaid: string;
                        filedBy: string;
                        documentRef: string;
                    };
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        jurisdiction: string;
                        confirmationNumber: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    value?: undefined;
                })[];
            };
            pay_franchise_tax: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        filingId: {
                            type: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        paidDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        taxYear: {
                            type: string;
                            required: boolean;
                        };
                        amountPaid: {
                            type: string;
                            required: boolean;
                        };
                        confirmationNumber: {
                            type: string;
                            required: boolean;
                        };
                        nextDueDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        lastFiledDate: string;
                        confirmationNumber: string;
                        dueDate: string;
                    };
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: {
                        filingId: string;
                        filingType: string;
                        jurisdiction: string;
                        filedDate: string;
                        periodCovered: string;
                        confirmationNumber: string;
                        feePaid: string;
                    };
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        jurisdiction: string;
                        taxYear: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    value?: undefined;
                })[];
            };
            update_registered_agent: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        agentName: {
                            type: string;
                            required: boolean;
                        };
                        agentAddress: {
                            type: string;
                            required: boolean;
                        };
                        agentPhone: {
                            type: string;
                        };
                        agentEmail: {
                            type: string;
                        };
                        effectiveDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        isThirdParty: {
                            type: string;
                            default: boolean;
                        };
                        serviceAgreementRef: {
                            type: string;
                        };
                        filingConfirmation: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    value: {
                        jurisdiction: string;
                        agentName: string;
                        agentAddress: string;
                        agentPhone: string;
                        agentEmail: string;
                        effectiveDate: string;
                        isThirdParty: string;
                        serviceAgreementRef: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        jurisdiction: string;
                        newAgent: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    value?: undefined;
                })[];
            };
            flag_review: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        reason: {
                            type: string;
                            required: boolean;
                        };
                        filingId: {
                            type: string;
                        };
                        dueDate: {
                            type: string;
                            format: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        reason: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            note_deficiency: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        deficiencyId: {
                            type: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        type: {
                            type: string;
                            required: boolean;
                        };
                        description: {
                            type: string;
                            required: boolean;
                        };
                        noticeDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        noticeRef: {
                            type: string;
                        };
                        cureDeadline: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        penaltyAmount: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        deficiencyId: string;
                        jurisdiction: string;
                        type: string;
                        description: string;
                        noticeDate: string;
                        noticeRef: string;
                        cureDeadline: string;
                        penaltyAmount: string;
                        status: string;
                        curativeActions: never[];
                    };
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        deficiencyId: string;
                        type: string;
                        cureDeadline: string;
                    };
                    path?: undefined;
                    value?: undefined;
                    amount?: undefined;
                })[];
            };
            record_curative_action: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        deficiencyId: {
                            type: string;
                            required: boolean;
                        };
                        action: {
                            type: string;
                            required: boolean;
                        };
                        actionDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        documentRef: {
                            type: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    arrayPath: string;
                    arrayOperation: string;
                    value: string;
                    updates?: undefined;
                } | {
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                    };
                    arrayPath?: undefined;
                    arrayOperation?: undefined;
                    value?: undefined;
                })[];
            };
            cure_deficiency: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        deficiencyId: {
                            type: string;
                            required: boolean;
                        };
                        curedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        confirmationNumber: {
                            type: string;
                        };
                        penaltyPaid: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    description: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        curedDate: string;
                    };
                    amount?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    amount?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        deficiencyId: string;
                    };
                    path?: undefined;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                    amount?: undefined;
                    value?: undefined;
                })[];
            };
            cure_deficiency_remaining: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        deficiencyId: {
                            type: string;
                            required: boolean;
                        };
                        curedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        confirmationNumber: {
                            type: string;
                        };
                    };
                };
                guards: {
                    name: string;
                    expression: string;
                }[];
                effects: ({
                    type: string;
                    path: string;
                    matchKey: string;
                    matchValue: string;
                    updates: {
                        status: string;
                        curedDate: string;
                    };
                    amount?: undefined;
                } | {
                    type: string;
                    path: string;
                    amount: number;
                    matchKey?: undefined;
                    matchValue?: undefined;
                    updates?: undefined;
                })[];
            };
            confirm_good_standing: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        confirmationDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        certificateRef: {
                            type: string;
                        };
                        validThrough: {
                            type: string;
                            format: string;
                        };
                    };
                };
                effects: ({
                    type: string;
                    condition: string;
                    then: {
                        type: string;
                        path: string;
                        value: {
                            certificateId: string;
                            jurisdiction: string;
                            issuedDate: string;
                            validThrough: string;
                            documentRef: string;
                            purpose: string;
                        };
                    };
                    path?: undefined;
                    value?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    condition?: undefined;
                    then?: undefined;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        jurisdiction: string;
                    };
                    condition?: undefined;
                    then?: undefined;
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            clear_review: {
                from: string;
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        clearedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        reviewedBy: {
                            type: string;
                            required: boolean;
                        };
                        notes: {
                            type: string;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    value: string;
                }[];
            };
            request_good_standing_certificate: {
                from: string[];
                to: string;
                description: string;
                event: {
                    name: string;
                    payload: {
                        certificateId: {
                            type: string;
                            required: boolean;
                        };
                        jurisdiction: {
                            type: string;
                            required: boolean;
                        };
                        issuedDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        validThrough: {
                            type: string;
                            format: string;
                        };
                        documentRef: {
                            type: string;
                            required: boolean;
                        };
                        purpose: {
                            type: string;
                        };
                    };
                };
                effects: {
                    type: string;
                    path: string;
                    value: {
                        certificateId: string;
                        jurisdiction: string;
                        issuedDate: string;
                        validThrough: string;
                        documentRef: string;
                        purpose: string;
                    };
                }[];
            };
            add_foreign_qualification: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        state: {
                            type: string;
                            required: boolean;
                        };
                        qualificationDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        foreignEntityNumber: {
                            type: string;
                            required: boolean;
                        };
                        registeredAgent: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    value: {
                        state: string;
                        qualificationDate: string;
                        foreignEntityNumber: string;
                        status: string;
                    };
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    path: string;
                    value: string;
                    eventType?: undefined;
                    payload?: undefined; /** Holder's name */
                } | {
                    type: string;
                    eventType: string;
                    payload: {
                        complianceId: string;
                        entityId: string;
                        state: string;
                    };
                    path?: undefined;
                    value?: undefined;
                })[];
            };
            assess_compliance: {
                from: string[];
                to: null;
                description: string;
                event: {
                    name: string;
                    payload: {
                        assessmentDate: {
                            type: string;
                            format: string;
                            required: boolean;
                        };
                        assessedBy: {
                            type: string;
                            required: boolean;
                        };
                    };
                };
                effects: ({
                    type: string;
                    path: string;
                    expression: string;
                    value?: undefined;
                } | {
                    type: string;
                    path: string;
                    value: string;
                    expression?: undefined;
                })[];
            };
        };
        crossMachineRefs: {
            entity: {
                machine: string;
                description: string;
                foreignKey: string;
                eventTriggers: {
                    CORPORATION_SUSPENDED: string;
                    CORPORATION_REINSTATED: string;
                };
            };
        };
        metadata: {
            author: string;
            license: string;
            tags: string[];
            documentation: string;
        };
    };
};
/**
 * Corporate governance types for union discrimination.
 */
export type CorporateType = keyof typeof CORPORATE_DEFINITIONS;
/**
 * Union of all corporate state types.
 */
export type CorporateState = CorporateEntityState | CorporateBoardState | CorporateShareholdersState | CorporateSecuritiesState;
