import { defineFiberApp } from "../../../schema/fiber-app.js";
import {
  signerInSet,
  signerIsAnyParty,
  signerIsNotParty,
} from "../../../schema/guards.js";

/**
 * Simple org governance: manage members, update rules, resolve disputes.
 */
export const govSimpleDef = defineFiberApp({
  metadata: {
    name: "Governance",
    app: "governance",
    type: "simple",
    version: "1.0.0",
    description:
      "Simple org governance: manage members, update rules, resolve disputes",
  },

  createSchema: {
    required: [
      "admins",
      "passingThreshold",
      "disputeQuorum",
      "votingPeriodMs",
    ] as const,
    properties: {
      admins: {
        type: "array",
        description: "Initial admin addresses",
        immutable: false,
      },
      passingThreshold: {
        type: "number",
        description: "Fraction of members required to pass (0-1)",
      },
      disputeQuorum: {
        type: "number",
        description: "Min votes to resolve a dispute",
      },
      votingPeriodMs: {
        type: "number",
        description: "Voting window in milliseconds",
      },
    },
  },

  stateSchema: {
    properties: {
      admins: { type: "array", immutable: false },
      members: { type: "object", computed: true },
      rules: { type: "object", computed: true },
      history: { type: "array", computed: true },
      proposal: { type: "object" },
      votes: { type: "object", computed: true },
      dispute: { type: "object" },
      passingThreshold: { type: "number" },
      disputeQuorum: { type: "number" },
      votingPeriodMs: { type: "number" },
    },
  },

  eventSchemas: {
    add_member: {
      description: "Add a member (admin only)",
      required: ["member", "role"] as const,
      properties: {
        agent: { type: "address" },
        member: { type: "address" },
        role: { type: "string" },
      },
    },
    remove_member: {
      description: "Remove a member (admin only)",
      required: ["member"] as const,
      properties: {
        agent: { type: "address" },
        member: { type: "address" },
      },
    },
    propose: {
      description: "Submit a rule change proposal",
      required: ["proposalId", "type", "changes"] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        type: { type: "string" },
        changes: { type: "object" },
      },
    },
    vote: {
      description: "Cast a vote on the active proposal or dispute",
      required: ["vote"] as const,
      properties: {
        agent: { type: "address" },
        vote: { type: "string" },
        ruling: { type: "string" },
      },
    },
    finalize: {
      description: "Finalize the voting period",
      required: ["forCount"] as const,
      properties: {
        forCount: { type: "number" },
      },
    },
    file_dispute: {
      description: "File a dispute against a member",
      required: ["disputeId", "defendant", "claim"] as const,
      properties: {
        agent: { type: "address" },
        disputeId: { type: "string" },
        defendant: { type: "address" },
        claim: { type: "string" },
      },
    },
    submit_evidence: {
      description: "Submit evidence in a dispute",
      required: ["content"] as const,
      properties: {
        agent: { type: "address" },
        content: { type: "string" },
      },
    },
    resolve: {
      description: "Resolve the active dispute",
      required: ["ruling", "remedy"] as const,
      properties: {
        ruling: { type: "string" },
        remedy: { type: "string" },
      },
    },
    dissolve: {
      description: "Dissolve the organization (requires 90% approval)",
      required: ["approvalCount"] as const,
      properties: {
        approvalCount: { type: "number" },
      },
    },
  },

  states: {
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "Governance is idle and ready to accept a proposal",
        category: "initial",
      },
    },
    VOTING: {
      id: "VOTING",
      isFinal: false,
      metadata: {
        label: "Voting",
        description: "A proposal is open for voting",
        category: "pending",
      },
    },
    DISPUTE: {
      id: "DISPUTE",
      isFinal: false,
      metadata: {
        label: "Dispute",
        description: "A proposal outcome is being disputed",
        category: "pending",
      },
    },
    DISSOLVED: {
      id: "DISSOLVED",
      isFinal: true,
      metadata: {
        label: "Dissolved",
        description: "Governance entity dissolved (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "ACTIVE",

  transitions: [
    // ACTIVE → ACTIVE: add member (admin only)
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "add_member",
      guard: signerInSet("state.admins"),
      effect: {
        merge: [
          { var: "state" },
          {
            members: {
              setKey: [
                { var: "state.members" },
                { var: "event.member" },
                { role: { var: "event.role" }, addedAt: { var: "$timestamp" } },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: remove member (admin only)
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "remove_member",
      guard: signerInSet("state.admins"),
      effect: {
        merge: [
          { var: "state" },
          {
            members: {
              deleteKey: [{ var: "state.members" }, { var: "event.member" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → VOTING: propose
    {
      from: "ACTIVE",
      to: "VOTING",
      eventName: "propose",
      guard: { getKey: [{ var: "state.members" }, { var: "event.agent" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              type: { var: "event.type" },
              changes: { var: "event.changes" },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$timestamp" },
              deadline: {
                "+": [{ var: "$timestamp" }, { var: "state.votingPeriodMs" }],
              },
            },
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → VOTING: vote (member, no double-voting)
    {
      from: "VOTING",
      to: "VOTING",
      eventName: "vote",
      guard: {
        and: [
          { getKey: [{ var: "state.members" }, { var: "event.agent" }] },
          {
            "!": [{ getKey: [{ var: "state.votes" }, { var: "event.agent" }] }],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              setKey: [
                { var: "state.votes" },
                { var: "event.agent" },
                { vote: { var: "event.vote" }, votedAt: { var: "$timestamp" } },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → ACTIVE: finalize (passed)
    {
      from: "VOTING",
      to: "ACTIVE",
      eventName: "finalize",
      guard: {
        ">=": [
          { var: "event.forCount" },
          {
            "*": [
              { size: { var: "state.members" } },
              { var: "state.passingThreshold" },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            rules: {
              merge: [
                { var: "state.rules" },
                { var: "state.proposal.changes" },
              ],
            },
            history: {
              cat: [
                { var: "state.history" },
                [
                  {
                    type: "rule_change",
                    proposal: { var: "state.proposal" },
                    outcome: "passed",
                    finalizedAt: { var: "$timestamp" },
                  },
                ],
              ],
            },
            proposal: null,
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → ACTIVE: finalize (failed)
    {
      from: "VOTING",
      to: "ACTIVE",
      eventName: "finalize",
      guard: {
        "<": [
          { var: "event.forCount" },
          {
            "*": [
              { size: { var: "state.members" } },
              { var: "state.passingThreshold" },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            history: {
              cat: [
                { var: "state.history" },
                [
                  {
                    type: "rule_change",
                    proposal: { var: "state.proposal" },
                    outcome: "failed",
                    finalizedAt: { var: "$timestamp" },
                  },
                ],
              ],
            },
            proposal: null,
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → DISPUTE: file_dispute
    {
      from: "ACTIVE",
      to: "DISPUTE",
      eventName: "file_dispute",
      guard: { getKey: [{ var: "state.members" }, { var: "event.agent" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            dispute: {
              id: { var: "event.disputeId" },
              plaintiff: { var: "event.agent" },
              defendant: { var: "event.defendant" },
              claim: { var: "event.claim" },
              filedAt: { var: "$timestamp" },
              evidence: [],
            },
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    // DISPUTE → DISPUTE: submit_evidence (plaintiff or defendant)
    {
      from: "DISPUTE",
      to: "DISPUTE",
      eventName: "submit_evidence",
      guard: signerIsAnyParty([
        "state.dispute.plaintiff",
        "state.dispute.defendant",
      ]),
      effect: {
        merge: [
          { var: "state" },
          {
            dispute: {
              merge: [
                { var: "state.dispute" },
                {
                  evidence: {
                    cat: [
                      { var: "state.dispute.evidence" },
                      [
                        {
                          from: { var: "event.agent" },
                          content: { var: "event.content" },
                          at: { var: "$timestamp" },
                        },
                      ],
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // DISPUTE → DISPUTE: vote (member, not party, no double-vote)
    {
      from: "DISPUTE",
      to: "DISPUTE",
      eventName: "vote",
      guard: {
        and: [
          { getKey: [{ var: "state.members" }, { var: "event.agent" }] },
          signerIsNotParty("state.dispute.plaintiff"),
          signerIsNotParty("state.dispute.defendant"),
          {
            "!": [{ getKey: [{ var: "state.votes" }, { var: "event.agent" }] }],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              setKey: [
                { var: "state.votes" },
                { var: "event.agent" },
                {
                  ruling: { var: "event.ruling" },
                  votedAt: { var: "$timestamp" },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // DISPUTE → ACTIVE: resolve (quorum met)
    {
      from: "DISPUTE",
      to: "ACTIVE",
      eventName: "resolve",
      guard: {
        ">=": [
          { size: { var: "state.votes" } },
          { var: "state.disputeQuorum" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            history: {
              cat: [
                { var: "state.history" },
                [
                  {
                    type: "dispute",
                    dispute: { var: "state.dispute" },
                    ruling: { var: "event.ruling" },
                    remedy: { var: "event.remedy" },
                    resolvedAt: { var: "$timestamp" },
                  },
                ],
              ],
            },
            dispute: null,
            votes: {},
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → DISSOLVED: dissolve (90% approval)
    {
      from: "ACTIVE",
      to: "DISSOLVED",
      eventName: "dissolve",
      guard: {
        ">=": [
          { var: "event.approvalCount" },
          { "*": [{ size: { var: "state.members" } }, 0.9] },
        ],
      },
      effect: {
        merge: [{ var: "state" }, { dissolvedAt: { var: "$timestamp" } }],
      },
      dependencies: [],
    },
  ],
} as const);
