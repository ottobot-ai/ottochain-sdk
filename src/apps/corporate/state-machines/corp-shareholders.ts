import { defineFiberApp } from "../../../schema/fiber-app.js";
import { signerIsParty, depInState } from "../../../schema/guards.js";
import { addDependency } from "../../../schema/effects.js";

/**
 * Shareholder meeting state machine managing annual/special meetings, record dates, proxy periods, voting, and certification of results.
 * Supports multiple share classes and cumulative voting.
 */
export const corpShareholdersDef = defineFiberApp({
  metadata: {
    name: "CorpShareholders",
    app: "corporate",
    type: "shareholders",
    version: "1.0.0",
    description:
      "Shareholder meeting state machine managing annual/special meetings, record dates, proxy periods, voting, and certification of results. Supports multiple share classes and cumulative voting.",
    crossReferences: {
      entity: {
        machine: "corporate-entity",
        description: "Parent corporate entity",
        foreignKey: "entityId",
      },
      proxies: {
        machine: "corporate-proxy",
        description: "Proxy grants for this meeting",
        foreignKey: "meetingId",
      },
      resolutions: {
        machine: "corporate-resolution",
        description: "Resolutions resulting from meeting votes",
        foreignKey: "meetingId",
      },
      securities: {
        machine: "corporate-securities",
        description: "Share records for determining voting rights",
        foreignKey: "entityId",
      },
    },
  },

  createSchema: {
    required: ["meetingId", "entityId", "registrar"] as const,
    properties: {
      meetingId: {
        type: "string",
        description: "Unique identifier for this shareholder meeting",
        immutable: true,
      },
      entityId: {
        type: "string",
        description: "Reference to parent corporate-entity",
        immutable: true,
      },
      registrar: {
        type: "address",
        description:
          "State-pinned DAG address of the transfer agent / registrar authorized to register the eligible-shareholder roster of record. Verified against proofs[].address.",
        immutable: true,
      },
      meetingType: {
        type: "string",
        enum: ["ANNUAL", "SPECIAL"] as const,
        description:
          "Annual meetings are required; special meetings called for specific purposes",
      },
      fiscalYear: {
        type: "integer",
        description: "Fiscal year for annual meetings",
      },
      scheduledDate: {
        type: "string",
        format: "date-time",
      },
      location: {
        type: "object",
        properties: {
          physical: { type: "string", nullable: true },
          virtualUrl: { type: "string", nullable: true },
          isHybrid: { type: "boolean", default: false },
        },
      },
    },
  },

  stateSchema: {
    properties: {
      meetingId: { type: "string", immutable: true },
      entityId: { type: "string", immutable: true },
      registrar: { type: "address", immutable: true },
      meetingType: { type: "string" },
      fiscalYear: { type: "integer" },
      scheduledDate: { type: "string", format: "date-time" },
      location: { type: "object" },
      calledBy: { $ref: "#/definitions/CalledBy", computed: true },
      noticeInfo: { $ref: "#/definitions/NoticeInfo", computed: true },
      recordDate: {
        $ref: "#/definitions/RecordDate",
        nullable: true,
        computed: true,
      },
      eligibleVoters: {
        type: "array",
        items: { $ref: "#/definitions/EligibleVoter" },
        computed: true,
      },
      quorumRequirements: {
        $ref: "#/definitions/QuorumRequirements",
        computed: true,
      },
      agenda: {
        type: "array",
        items: { $ref: "#/definitions/AgendaItem" },
        computed: true,
      },
      proxyPeriod: {
        $ref: "#/definitions/ProxyPeriod",
        nullable: true,
        computed: true,
      },
      votes: {
        type: "array",
        items: { $ref: "#/definitions/Vote" },
        computed: true,
      },
      voteTallies: {
        type: "array",
        items: { $ref: "#/definitions/VoteTally" },
        computed: true,
      },
      inspectorOfElections: {
        $ref: "#/definitions/Inspector",
        nullable: true,
        computed: true,
      },
      sessionInfo: {
        $ref: "#/definitions/SessionInfo",
        nullable: true,
        computed: true,
      },
      certification: {
        $ref: "#/definitions/Certification",
        nullable: true,
        computed: true,
      },
      status: {
        type: "string",
        enum: [
          "SCHEDULED",
          "RECORD_DATE_SET",
          "PROXY_PERIOD",
          "IN_SESSION",
          "VOTING",
          "CLOSED",
        ] as const,
        computed: true,
      },
      createdAt: { type: "timestamp", computed: true },
      updatedAt: { type: "timestamp", computed: true },
      // Two-phase scheduling (#24): propose_schedule_annual binds the board-resolution fiber + records the
      // pending meeting here; schedule_annual asserts the bound resolution is EXECUTED, then clears this.
      pendingschedule_annual: { type: "object", nullable: true, computed: true },
    },
  },

  eventSchemas: {
    propose_schedule_annual: {
      description:
        "Phase 1 of annual-meeting scheduling: bind the executing board-resolution fiber (#24 _addDependency) and record the pending meeting",
      required: [
        "meetingId",
        "entityId",
        "fiscalYear",
        "scheduledDate",
        "boardResolutionRef",
      ] as const,
      properties: {
        meetingId: { type: "string" },
        entityId: { type: "string" },
        fiscalYear: { type: "integer" },
        scheduledDate: { type: "string", format: "date-time" },
        location: { type: "object" },
        boardResolutionRef: { type: "string" },
      },
    },
    schedule_annual: {
      description:
        "Phase 2 of annual-meeting scheduling: execute once the bound board resolution is EXECUTED",
      required: [
        "meetingId",
        "entityId",
        "fiscalYear",
        "scheduledDate",
      ] as const,
      properties: {
        meetingId: { type: "string" },
        entityId: { type: "string" },
        fiscalYear: { type: "integer" },
        scheduledDate: { type: "string", format: "date-time" },
        location: { type: "object" },
      },
    },
    schedule_special: {
      description: "Schedule a special shareholder meeting",
      required: [
        "meetingId",
        "entityId",
        "scheduledDate",
        "purpose",
        "calledByType",
      ] as const,
      properties: {
        meetingId: { type: "string" },
        entityId: { type: "string" },
        scheduledDate: { type: "string", format: "date-time" },
        location: { type: "object" },
        purpose: {
          type: "string",
          description: "Specific purpose for special meeting",
        },
        calledByType: {
          type: "string",
          enum: ["BOARD", "SHAREHOLDERS", "COURT"] as const,
        },
        resolutionRef: { type: "string" },
        petitionRef: { type: "string" },
      },
    },
    set_record_date: {
      description:
        "Board sets the record date for determining eligible shareholders",
      required: ["recordDate", "resolutionRef"] as const,
      properties: {
        recordDate: { type: "string", format: "date" },
        resolutionRef: { type: "string" },
      },
    },
    register_eligible_shareholders: {
      description: "Register shareholders of record as of record date",
      required: ["shareholders", "totalSharesOutstanding"] as const,
      properties: {
        shareholders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              shareholderId: { type: "string" },
              name: { type: "string" },
              address: {
                type: "address",
                description:
                  "DAG wallet address of record for this shareholder; the only key a verified signer can vote under.",
              },
              shareholdings: { type: "array" },
            },
          },
        },
        totalSharesOutstanding: { type: "integer" },
      },
    },
    open_proxy_period: {
      description:
        "Distribute proxy materials and open proxy solicitation period",
      required: [
        "startDate",
        "proxyStatementRef",
        "formOfProxyRef",
        "agenda",
      ] as const,
      properties: {
        startDate: { type: "string", format: "date" },
        proxyStatementRef: { type: "string" },
        formOfProxyRef: { type: "string" },
        annualReportRef: { type: "string" },
        agenda: { type: "array" },
      },
    },
    add_agenda_item: {
      description:
        "Add an item to the meeting agenda (e.g., shareholder proposal)",
      required: ["itemId", "title", "type", "voteRequired"] as const,
      properties: {
        itemId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        type: { type: "string" },
        voteRequired: { type: "string" },
        eligibleClasses: { type: "array", items: { type: "string" } },
        allowCumulativeVoting: { type: "boolean", default: false },
      },
    },
    open_meeting: {
      description: "Convene the shareholder meeting",
      required: [
        "openedAt",
        "chairPerson",
        "secretaryPresent",
        "initialQuorumCount",
      ] as const,
      properties: {
        openedAt: { type: "string", format: "date-time" },
        chairPerson: { type: "string" },
        secretaryPresent: { type: "string" },
        inspectorOfElections: { type: "object" },
        initialQuorumCount: { type: "integer" },
      },
    },
    open_polls: {
      description: "Open polls for voting on agenda items",
      required: ["pollsOpenedAt"] as const,
      properties: {
        pollsOpenedAt: { type: "string", format: "date-time" },
      },
    },
    cast_vote: {
      description: "Record a vote from a shareholder or proxy holder",
      required: [
        "voteId",
        "agendaItemId",
        "voterId",
        "shareholderId",
        "shareClass",
      ] as const,
      properties: {
        voteId: { type: "string" },
        agendaItemId: { type: "string" },
        voterId: { type: "string" },
        shareholderId: { type: "string" },
        shareClass: { type: "string" },
        votesFor: { type: "integer", default: 0 },
        votesAgainst: { type: "integer", default: 0 },
        votesAbstain: { type: "integer", default: 0 },
        votesWithhold: { type: "integer", default: 0 },
        cumulativeVoteAllocation: { type: "object", nullable: true },
        viaProxy: { type: "boolean", default: false },
      },
    },
    close_polls: {
      description: "Close polls and begin vote tabulation",
      required: ["pollsClosedAt"] as const,
      properties: {
        pollsClosedAt: { type: "string", format: "date-time" },
      },
    },
    certify_results: {
      description: "Inspector of elections certifies vote results",
      required: ["certifiedAt", "certifiedBy", "certificateRef"] as const,
      properties: {
        certifiedAt: { type: "string", format: "date-time" },
        certifiedBy: { type: "string" },
        certificateRef: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              agendaItemId: { type: "string" },
              result: {
                type: "string",
                enum: ["APPROVED", "REJECTED"] as const,
              },
            },
          },
        },
        minutesRef: { type: "string" },
      },
    },
    adjourn_without_action: {
      description:
        "Adjourn meeting without completing agenda (e.g., quorum lost)",
      required: ["adjournedAt", "reason"] as const,
      properties: {
        adjournedAt: { type: "string", format: "date-time" },
        reason: { type: "string" },
        adjournedTo: { type: "string", format: "date-time", nullable: true },
      },
    },
  },

  definitions: {
    CalledBy: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["BOARD", "SHAREHOLDERS", "COURT"] as const,
        },
        resolutionRef: { type: "string", nullable: true },
        shareholderPetitionRef: { type: "string", nullable: true },
        courtOrderRef: { type: "string", nullable: true },
      },
    },
    NoticeInfo: {
      type: "object",
      properties: {
        noticeSentDate: { type: "string", format: "date" },
        noticeMethod: {
          type: "string",
          enum: ["MAIL", "EMAIL", "ELECTRONIC_ACCESS"] as const,
        },
        minimumNoticeDays: { type: "integer", default: 10 },
        maximumNoticeDays: { type: "integer", default: 60 },
      },
    },
    RecordDate: {
      type: "object",
      nullable: true,
      properties: {
        date: { type: "string", format: "date" },
        setByBoardOn: { type: "string", format: "date" },
        resolutionRef: { type: "string" },
      },
    },
    EligibleVoter: {
      type: "object",
      properties: {
        shareholderId: { type: "string" },
        name: { type: "string" },
        address: {
          type: "address",
          description:
            "State-pinned DAG wallet address of record; cast_vote requires this address ∈ proofs[].address.",
        },
        shareholdings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              shareClass: { type: "string" },
              shares: { type: "integer" },
              votes: {
                type: "integer",
                description: "Votes this holding represents",
              },
            },
          },
        },
        totalVotes: { type: "integer" },
        proxyGrantedTo: {
          type: "string",
          nullable: true,
          description: "Proxy holder ID if proxied",
        },
        hasVoted: { type: "boolean", default: false },
      },
    },
    QuorumRequirements: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["SHARES_REPRESENTED", "SHARES_OUTSTANDING"] as const,
        },
        threshold: {
          type: "number",
          default: 0.5,
          description: "Fraction required for quorum",
        },
        sharesRequired: { type: "integer" },
        sharesRepresented: { type: "integer", default: 0 },
        quorumMet: { type: "boolean", default: false },
      },
    },
    AgendaItem: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        itemNumber: { type: "integer" },
        title: { type: "string" },
        description: { type: "string" },
        type: {
          type: "string",
          enum: [
            "DIRECTOR_ELECTION",
            "AUDITOR_RATIFICATION",
            "SAY_ON_PAY",
            "CHARTER_AMENDMENT",
            "MERGER",
            "STOCK_PLAN",
            "SHAREHOLDER_PROPOSAL",
            "OTHER",
          ] as const,
        },
        voteRequired: {
          type: "string",
          enum: [
            "PLURALITY",
            "MAJORITY_CAST",
            "MAJORITY_OUTSTANDING",
            "SUPERMAJORITY",
            "UNANIMOUS",
          ] as const,
          description: "Vote threshold for approval",
        },
        supermajorityThreshold: { type: "number", nullable: true },
        eligibleClasses: {
          type: "array",
          items: { type: "string" },
          description: "Share classes that can vote on this item",
        },
        allowCumulativeVoting: {
          type: "boolean",
          default: false,
          description: "For director elections",
        },
        status: {
          type: "string",
          enum: [
            "PENDING",
            "VOTING",
            "CLOSED",
            "APPROVED",
            "REJECTED",
          ] as const,
        },
      },
    },
    ProxyPeriod: {
      type: "object",
      nullable: true,
      properties: {
        startDate: { type: "string", format: "date" },
        endDate: {
          type: "string",
          format: "date-time",
          description: "Usually meeting start time",
        },
        proxyMaterials: {
          type: "object",
          properties: {
            proxyStatementRef: { type: "string" },
            formOfProxyRef: { type: "string" },
            annualReportRef: { type: "string", nullable: true },
          },
        },
      },
    },
    Vote: {
      type: "object",
      properties: {
        voteId: { type: "string" },
        agendaItemId: { type: "string" },
        voterId: {
          type: "string",
          description: "Shareholder or proxy holder ID",
        },
        shareholderId: { type: "string", description: "Beneficial owner" },
        shareClass: { type: "string" },
        votesFor: { type: "integer", default: 0 },
        votesAgainst: { type: "integer", default: 0 },
        votesAbstain: { type: "integer", default: 0 },
        votesWithhold: {
          type: "integer",
          default: 0,
          description: "For director elections",
        },
        cumulativeVoteAllocation: {
          type: "object",
          additionalProperties: { type: "integer" },
          nullable: true,
          description: "For cumulative voting: candidate ID -> votes allocated",
        },
        viaProxy: { type: "boolean", default: false },
        timestamp: { type: "string", format: "date-time" },
      },
    },
    VoteTally: {
      type: "object",
      properties: {
        agendaItemId: { type: "string" },
        forVotes: { type: "integer", default: 0 },
        againstVotes: { type: "integer", default: 0 },
        abstainVotes: { type: "integer", default: 0 },
        withholdVotes: { type: "integer", default: 0 },
        brokerNonVotes: { type: "integer", default: 0 },
        candidateVotes: {
          type: "object",
          additionalProperties: { type: "integer" },
          nullable: true,
          description: "For director elections: candidate ID -> total votes",
        },
        result: {
          type: "string",
          enum: ["APPROVED", "REJECTED", "PENDING"] as const,
        },
        certified: { type: "boolean", default: false },
      },
    },
    Inspector: {
      type: "object",
      nullable: true,
      properties: {
        name: { type: "string" },
        company: { type: "string", nullable: true },
        appointedBy: { type: "string" },
        appointmentDate: { type: "string", format: "date" },
      },
    },
    SessionInfo: {
      type: "object",
      nullable: true,
      properties: {
        openedAt: { type: "string", format: "date-time" },
        chairPerson: { type: "string" },
        secretaryPresent: { type: "string" },
        pollsOpenedAt: { type: "string", format: "date-time", nullable: true },
        pollsClosedAt: { type: "string", format: "date-time", nullable: true },
        adjournedAt: { type: "string", format: "date-time", nullable: true },
        minutesRef: { type: "string", nullable: true },
      },
    },
    Certification: {
      type: "object",
      nullable: true,
      properties: {
        certifiedAt: { type: "string", format: "date-time" },
        certifiedBy: { type: "string" },
        certificateRef: { type: "string" },
      },
    },
  },

  states: {
    SCHEDULED: {
      id: "SCHEDULED",
      isFinal: false,
      description: "Meeting has been scheduled but record date not yet set",
    },
    RECORD_DATE_SET: {
      id: "RECORD_DATE_SET",
      isFinal: false,
      description: "Record date established; eligible shareholders determined",
    },
    PROXY_PERIOD: {
      id: "PROXY_PERIOD",
      isFinal: false,
      description:
        "Proxy materials distributed; shareholders may submit proxies",
    },
    IN_SESSION: {
      id: "IN_SESSION",
      isFinal: false,
      description: "Meeting is convened and in progress",
    },
    VOTING: {
      id: "VOTING",
      isFinal: false,
      description: "Polls are open for voting on agenda items",
    },
    CLOSED: {
      id: "CLOSED",
      isFinal: true,
      description: "Meeting concluded; results certified",
    },
  },

  initialState: "SCHEDULED",

  transitions: [
    // Initial creation transitions (from: null means creation)
    // SCHEDULED -> SCHEDULED (propose_schedule_annual) — phase 1 (#24): bind the executing board-resolution
    // fiber and record the pending meeting, so the next transition can read the resolution's state.
    {
      from: "SCHEDULED",
      to: "SCHEDULED",
      eventName: "propose_schedule_annual",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            pendingschedule_annual: {
              meetingId: { var: "event.meetingId" },
              entityId: { var: "event.entityId" },
              fiscalYear: { var: "event.fiscalYear" },
              scheduledDate: { var: "event.scheduledDate" },
              location: { var: "event.location" },
              ref: { var: "event.boardResolutionRef" },
              proposedAt: { var: "$ordinal" },
            },
          },
          // bind the resolution fiber so schedule_annual can assert its state next transition
          addDependency({ var: "event.boardResolutionRef" }),
        ],
      },
      dependencies: [],
    },

    // SCHEDULED -> SCHEDULED (schedule_annual) — phase 2 (#24): execute once the bound board resolution is
    // EXECUTED. depInState replaces the dropped object-form dependency (which silently never gated).
    {
      from: "SCHEDULED",
      to: "SCHEDULED",
      eventName: "schedule_annual",
      guard: {
        and: [
          // the proposal must target this meeting, and its bound resolution must be EXECUTED
          {
            "==": [
              { var: "state.pendingschedule_annual.meetingId" },
              { var: "event.meetingId" },
            ],
          },
          depInState("state.pendingschedule_annual.ref", "EXECUTED"),
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            meetingId: { var: "event.meetingId" },
            entityId: { var: "event.entityId" },
            meetingType: "ANNUAL",
            fiscalYear: { var: "event.fiscalYear" },
            scheduledDate: { var: "event.scheduledDate" },
            location: { var: "event.location" },
            calledBy: {
              type: "BOARD",
              resolutionRef: { var: "state.pendingschedule_annual.ref" },
            },
            // clear the consumed proposal
            pendingschedule_annual: null,
          },
          {
            _emit: [
              { name: "SHAREHOLDER_MEETING_SCHEDULED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
      dependencies: [],
    },

    // schedule_special -> SCHEDULED
    {
      from: "SCHEDULED",
      to: "SCHEDULED",
      eventName: "schedule_special",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            meetingId: { var: "event.meetingId" },
            entityId: { var: "event.entityId" },
            meetingType: "SPECIAL",
            scheduledDate: { var: "event.scheduledDate" },
            calledBy: {
              type: { var: "event.calledByType" },
            },
          },
          {
            _emit: [
              { name: "SPECIAL_MEETING_SCHEDULED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // SCHEDULED -> RECORD_DATE_SET
    {
      from: "SCHEDULED",
      to: "RECORD_DATE_SET",
      eventName: "set_record_date",
      guard: { "==": [1, 1] }, // validRecordDateTiming simplified
      effect: {
        merge: [
          { var: "state" },
          {
            status: "RECORD_DATE_SET",
            recordDate: {
              date: { var: "event.recordDate" },
              setByBoardOn: { var: "$ordinal" },
              resolutionRef: { var: "event.resolutionRef" },
            },
          },
          {
            _emit: [
              { name: "RECORD_DATE_SET", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // RECORD_DATE_SET -> RECORD_DATE_SET (register_eligible_shareholders)
    {
      from: "RECORD_DATE_SET",
      to: "RECORD_DATE_SET",
      eventName: "register_eligible_shareholders",
      // authority gate — only the pinned registrar may set the roster of record; an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty("state.registrar"),
      effect: {
        merge: [
          { var: "state" },
          {
            eligibleVoters: { var: "event.shareholders" },
            quorumRequirements: {
              merge: [
                { var: "state.quorumRequirements" },
                {
                  sharesRequired: {
                    "*": [{ var: "event.totalSharesOutstanding" }, 0.5],
                  },
                },
              ],
            },
          },
        ],
      },
    },

    // RECORD_DATE_SET -> PROXY_PERIOD
    {
      from: "RECORD_DATE_SET",
      to: "PROXY_PERIOD",
      eventName: "open_proxy_period",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "PROXY_PERIOD",
            proxyPeriod: {
              startDate: { var: "event.startDate" },
              endDate: { var: "state.scheduledDate" },
              proxyMaterials: {
                proxyStatementRef: { var: "event.proxyStatementRef" },
                formOfProxyRef: { var: "event.formOfProxyRef" },
                annualReportRef: { var: "event.annualReportRef" },
              },
            },
            agenda: { var: "event.agenda" },
            noticeInfo: {
              merge: [
                { var: "state.noticeInfo" },
                { noticeSentDate: { var: "event.startDate" } },
              ],
            },
          },
          {
            _emit: [
              { name: "PROXY_PERIOD_OPENED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // add_agenda_item (can be from multiple states)
    {
      from: "SCHEDULED",
      to: "SCHEDULED",
      eventName: "add_agenda_item",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            agenda: {
              merge: [
                { var: "state.agenda" },
                [
                  {
                    itemId: { var: "event.itemId" },
                    itemNumber: { "+": [{ length: [{ var: "state.agenda" }] }, 1] },
                    title: { var: "event.title" },
                    description: { var: "event.description" },
                    type: { var: "event.type" },
                    voteRequired: { var: "event.voteRequired" },
                    eligibleClasses: { var: "event.eligibleClasses" },
                    allowCumulativeVoting: {
                      var: "event.allowCumulativeVoting",
                    },
                    status: "PENDING",
                  },
                ],
              ],
            },
          },
        ],
      },
    },
    {
      from: "RECORD_DATE_SET",
      to: "RECORD_DATE_SET",
      eventName: "add_agenda_item",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            agenda: {
              merge: [
                { var: "state.agenda" },
                [
                  {
                    itemId: { var: "event.itemId" },
                    itemNumber: { "+": [{ length: [{ var: "state.agenda" }] }, 1] },
                    title: { var: "event.title" },
                    description: { var: "event.description" },
                    type: { var: "event.type" },
                    voteRequired: { var: "event.voteRequired" },
                    eligibleClasses: { var: "event.eligibleClasses" },
                    allowCumulativeVoting: {
                      var: "event.allowCumulativeVoting",
                    },
                    status: "PENDING",
                  },
                ],
              ],
            },
          },
        ],
      },
    },
    {
      from: "PROXY_PERIOD",
      to: "PROXY_PERIOD",
      eventName: "add_agenda_item",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            agenda: {
              merge: [
                { var: "state.agenda" },
                [
                  {
                    itemId: { var: "event.itemId" },
                    itemNumber: { "+": [{ length: [{ var: "state.agenda" }] }, 1] },
                    title: { var: "event.title" },
                    description: { var: "event.description" },
                    type: { var: "event.type" },
                    voteRequired: { var: "event.voteRequired" },
                    eligibleClasses: { var: "event.eligibleClasses" },
                    allowCumulativeVoting: {
                      var: "event.allowCumulativeVoting",
                    },
                    status: "PENDING",
                  },
                ],
              ],
            },
          },
        ],
      },
    },

    // PROXY_PERIOD -> IN_SESSION
    {
      from: "PROXY_PERIOD",
      to: "IN_SESSION",
      eventName: "open_meeting",
      guard: {
        ">=": [
          { var: "event.initialQuorumCount" },
          { var: "state.quorumRequirements.sharesRequired" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "IN_SESSION",
            sessionInfo: {
              openedAt: { var: "event.openedAt" },
              chairPerson: { var: "event.chairPerson" },
              secretaryPresent: { var: "event.secretaryPresent" },
            },
            inspectorOfElections: { var: "event.inspectorOfElections" },
            quorumRequirements: {
              merge: [
                { var: "state.quorumRequirements" },
                {
                  sharesRepresented: { var: "event.initialQuorumCount" },
                  quorumMet: true,
                },
              ],
            },
          },
          {
            _emit: [
              { name: "SHAREHOLDER_MEETING_OPENED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // IN_SESSION -> VOTING
    {
      from: "IN_SESSION",
      to: "VOTING",
      eventName: "open_polls",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "VOTING",
            sessionInfo: {
              merge: [
                { var: "state.sessionInfo" },
                { pollsOpenedAt: { var: "event.pollsOpenedAt" } },
              ],
            },
            agenda: {
              map: [
                { var: "state.agenda" },
                {
                  merge: [{ var: "" }, { status: "VOTING" }],
                },
              ],
            },
          },
        ],
      },
    },

    // VOTING -> VOTING (cast_vote)
    {
      from: "VOTING",
      to: "VOTING",
      eventName: "cast_vote",
      // authority gate — the roster entry identified by event.shareholderId must carry an address that signed (address ∈ proofs[].address), so the recorded shareholderId is provably the matched entry's, not a forged one; an identity attestation layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          {
            some: [
              { var: "state.eligibleVoters" },
              {
                and: [
                  {
                    "==": [
                      { var: "shareholderId" },
                      { var: "event.shareholderId" },
                    ],
                  },
                  {
                    in: [
                      { var: "address" },
                      { map: [{ var: "proofs" }, { var: "address" }] },
                    ],
                  },
                ],
              },
            ],
          },
          {
            "!": {
              some: [
                { var: "state.votes" },
                {
                  and: [
                    {
                      "==": [
                        { var: "shareholderId" },
                        { var: "event.shareholderId" },
                      ],
                    },
                    {
                      "==": [
                        { var: "agendaItemId" },
                        { var: "event.agendaItemId" },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              merge: [
                { var: "state.votes" },
                [
                  {
                    voteId: { var: "event.voteId" },
                    agendaItemId: { var: "event.agendaItemId" },
                    voterId: { var: "event.voterId" },
                    shareholderId: { var: "event.shareholderId" },
                    shareClass: { var: "event.shareClass" },
                    votesFor: { var: "event.votesFor" },
                    votesAgainst: { var: "event.votesAgainst" },
                    votesAbstain: { var: "event.votesAbstain" },
                    votesWithhold: { var: "event.votesWithhold" },
                    cumulativeVoteAllocation: {
                      var: "event.cumulativeVoteAllocation",
                    },
                    viaProxy: { var: "event.viaProxy" },
                    timestamp: { var: "$ordinal" },
                  },
                ],
              ],
            },
            eligibleVoters: {
              map: [
                { var: "state.eligibleVoters" },
                {
                  if: [
                    {
                      "==": [
                        { var: "shareholderId" },
                        { var: "event.shareholderId" },
                      ],
                    },
                    {
                      merge: [{ var: "" }, { hasVoted: true }],
                    },
                    { var: "" },
                  ],
                },
              ],
            },
          },
        ],
      },
    },

    // VOTING -> IN_SESSION (close_polls)
    {
      from: "VOTING",
      to: "IN_SESSION",
      eventName: "close_polls",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "IN_SESSION",
            sessionInfo: {
              merge: [
                { var: "state.sessionInfo" },
                { pollsClosedAt: { var: "event.pollsClosedAt" } },
              ],
            },
            agenda: {
              map: [
                { var: "state.agenda" },
                {
                  merge: [{ var: "" }, { status: "CLOSED" }],
                },
              ],
            },
          },
        ],
      },
    },

    // IN_SESSION -> CLOSED (certify_results)
    {
      from: "IN_SESSION",
      to: "CLOSED",
      eventName: "certify_results",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "CLOSED",
            certification: {
              certifiedAt: { var: "event.certifiedAt" },
              certifiedBy: { var: "event.certifiedBy" },
              certificateRef: { var: "event.certificateRef" },
            },
            sessionInfo: {
              merge: [
                { var: "state.sessionInfo" },
                {
                  adjournedAt: { var: "event.certifiedAt" },
                  minutesRef: { var: "event.minutesRef" },
                },
              ],
            },
          },
          {
            _emit: [
              { name: "MEETING_RESULTS_CERTIFIED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // IN_SESSION -> CLOSED (adjourn_without_action)
    {
      from: "IN_SESSION",
      to: "CLOSED",
      eventName: "adjourn_without_action",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "CLOSED",
            sessionInfo: {
              merge: [
                { var: "state.sessionInfo" },
                { adjournedAt: { var: "event.adjournedAt" } },
              ],
            },
          },
          {
            _emit: [
              { name: "MEETING_ADJOURNED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },

    // VOTING -> CLOSED (adjourn_without_action)
    {
      from: "VOTING",
      to: "CLOSED",
      eventName: "adjourn_without_action",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "CLOSED",
            sessionInfo: {
              merge: [
                { var: "state.sessionInfo" },
                { adjournedAt: { var: "event.adjournedAt" } },
              ],
            },
          },
          {
            _emit: [
              { name: "MEETING_ADJOURNED", data: { var: "event" }, destination: "external" },
            ],
          },
        ],
      },
    },
  ],
});

// Derived types for consumers
export type CorpShareholdersState = keyof typeof corpShareholdersDef.states;
export type CorpShareholdersEvent =
  (typeof corpShareholdersDef.transitions)[number]["eventName"];
