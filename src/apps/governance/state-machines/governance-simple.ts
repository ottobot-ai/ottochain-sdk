import { defineFiberApp } from "../../../schema/fiber-app.js";
import {
  actorHasEntry,
  signerHasEntry,
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
      description:
        "Finalize the voting period (for-count derived from recorded ballots)",
      properties: {},
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
      description:
        "Dissolve the organization (requires every member to sign this op — verified unanimity)",
      properties: {},
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
              set: [
                { var: "state.members" },
                { var: "event.member" },
                { role: { var: "event.role" }, addedAt: { var: "$ordinal" } },
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
              unset: [{ var: "state.members" }, { var: "event.member" }],
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
      // S1/A2 coupled fix: a CHAIN-VERIFIED signer must be a member (getKey is not a
      // JLVM opcode; signerHasEntry checks signer ∈ keys(state.members) via `has`).
      guard: signerHasEntry("state.members"),
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              type: { var: "event.type" },
              changes: { var: "event.changes" },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              deadline: {
                "+": [{ var: "$ordinal" }, { var: "state.votingPeriodMs" }],
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
      // S1/A2 coupled fix: bind event.agent to a verified signer who is a member (actorHasEntry),
      // and block a re-vote by that SAME bound actor — so the ballot is recorded under, and deduped
      // on, the chain-verified voter. Without the binding, signerHasEntry only proves SOME signer is a
      // member, letting one member stuff votes under arbitrary keys (set is the rc.5 map-write opcode).
      guard: {
        and: [
          actorHasEntry("state.members"),
          { "!": [{ has: [{ var: "state.votes" }, { var: "event.agent" }] }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              set: [
                { var: "state.votes" },
                { var: "event.agent" },
                { vote: { var: "event.vote" }, votedAt: { var: "$ordinal" } },
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
      // S2/A2 coupled fix: the for-count is DERIVED from recorded ballots in
      // state.votes (length of the "for" entries), never read from the attacker's
      // event.forCount. members is a Map so its count is length(keys(members)).
      guard: {
        ">=": [
          {
            length: [
              {
                filter: [
                  { values: [{ var: "state.votes" }] },
                  { "===": [{ var: "vote" }, "for"] },
                ],
              },
            ],
          },
          {
            "*": [
              { length: [{ keys: [{ var: "state.members" }] }] },
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
                    finalizedAt: { var: "$ordinal" },
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
      // S2/A2 coupled fix (failed arm): derive the for-count from recorded ballots in
      // state.votes; never from event.forCount. members count = length(keys(members)).
      guard: {
        "<": [
          {
            length: [
              {
                filter: [
                  { values: [{ var: "state.votes" }] },
                  { "===": [{ var: "vote" }, "for"] },
                ],
              },
            ],
          },
          {
            "*": [
              { length: [{ keys: [{ var: "state.members" }] }] },
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
                    finalizedAt: { var: "$ordinal" },
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
      // S1/A2 coupled fix: only a CHAIN-VERIFIED member may file (getKey is not a JLVM
      // opcode; signerHasEntry checks signer ∈ keys(state.members) via `has`).
      guard: signerHasEntry("state.members"),
      effect: {
        merge: [
          { var: "state" },
          {
            dispute: {
              id: { var: "event.disputeId" },
              plaintiff: { var: "event.agent" },
              defendant: { var: "event.defendant" },
              claim: { var: "event.claim" },
              filedAt: { var: "$ordinal" },
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
                          at: { var: "$ordinal" },
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
      // S1/A2 coupled fix: bind event.agent to a verified member (actorHasEntry), exclude the parties,
      // and block a re-vote by that SAME bound actor — so the dispute ballot is recorded under, and
      // deduped on, the chain-verified voter (set is the rc.5 map-write opcode; signerIsNotParty still
      // excludes any signer who is a party, which covers the bound actor).
      guard: {
        and: [
          actorHasEntry("state.members"),
          signerIsNotParty("state.dispute.plaintiff"),
          signerIsNotParty("state.dispute.defendant"),
          { "!": [{ has: [{ var: "state.votes" }, { var: "event.agent" }] }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              set: [
                { var: "state.votes" },
                { var: "event.agent" },
                {
                  ruling: { var: "event.ruling" },
                  votedAt: { var: "$ordinal" },
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
      // A2 fix: count recorded ballots. votes is a Map, and `length` rejects Maps, so
      // count its keys: length(keys(state.votes)). (size is not a JLVM opcode.)
      guard: {
        ">=": [
          { length: [{ keys: [{ var: "state.votes" }] }] },
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
                    resolvedAt: { var: "$ordinal" },
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
      // S2/A2 coupled fix: dissolution must not trust an attacker-supplied
      // approvalCount. Derive consent from the CHAIN-VERIFIED signers — every member
      // (a key in state.members) must be among proofs[].address, with a non-empty
      // belt. members is a Map, so iterate keys(members); size is not a JLVM opcode.
      guard: {
        and: [
          { ">": [{ length: [{ keys: [{ var: "state.members" }] }] }, 0] },
          {
            all: [
              { keys: [{ var: "state.members" }] },
              {
                in: [
                  { var: "" },
                  { map: [{ var: "proofs" }, { var: "address" }] },
                ],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [{ var: "state" }, { dissolvedAt: { var: "$ordinal" } }],
      },
      dependencies: [],
    },
  ],
} as const);
