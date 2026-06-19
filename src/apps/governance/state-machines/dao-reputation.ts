import { defineFiberApp } from "../../../schema/fiber-app.js";
import { actorIsSigner, signerInSet } from "../../../schema/guards.js";

/**
 * Reputation-based governance. Minimum reputation required for participation.
 */
export const daoReputationDef = defineFiberApp({
  metadata: {
    name: "DAOReputation",
    app: "governance",
    type: "daoReputation",
    version: "1.0.0",
    description:
      "Reputation-based governance. Minimum reputation required for participation.",
    category: "governance/dao",
    crossReferences: {
      Identity: "member verification",
      Reputation: "threshold checks",
      Contract: "action execution",
    },
  },

  createSchema: {
    required: [
      "memberThreshold",
      "voteThreshold",
      "proposeThreshold",
      "quorum",
      "votingPeriodMs",
    ] as const,
    properties: {
      memberThreshold: {
        type: "number",
        description: "Min reputation to join as a member",
      },
      voteThreshold: { type: "number", description: "Min reputation to vote" },
      proposeThreshold: {
        type: "number",
        description: "Min reputation to submit a proposal",
      },
      quorum: {
        type: "number",
        description: "Min total votes (count) to execute",
      },
      votingPeriodMs: {
        type: "number",
        description: "Voting window in milliseconds",
      },
    },
  },

  stateSchema: {
    properties: {
      members: { type: "array", computed: true },
      memberJoinedAt: { type: "object", computed: true },
      memberThreshold: { type: "number" },
      voteThreshold: { type: "number" },
      proposeThreshold: { type: "number" },
      quorum: { type: "number" },
      votingPeriodMs: { type: "number" },
      proposal: { type: "object" },
      votes: { type: "object", computed: true },
      history: { type: "array", computed: true },
    },
  },

  eventSchemas: {
    propose: {
      description:
        "Submit a proposal (requires >= proposeThreshold reputation)",
      required: [
        "proposalId",
        "title",
        "description",
        "actionType",
        "payload",
        "agentReputation",
      ] as const,
      properties: {
        agent: { type: "address" },
        agentReputation: { type: "number" },
        proposalId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        actionType: { type: "string" },
        payload: { type: "object" },
      },
    },
    vote: {
      description:
        "Cast a vote (requires >= voteThreshold, no double-vote, within window)",
      required: ["vote", "agentReputation"] as const,
      properties: {
        agent: { type: "address" },
        agentReputation: { type: "number" },
        vote: { type: "string", description: '"for" | "against" | "abstain"' },
      },
    },
    execute: {
      description: "Execute a passing proposal after voting ends",
      properties: {},
    },
    reject: {
      description: "Formally reject a failed proposal",
      properties: {},
    },
    join: {
      description: "Join the DAO (requires >= memberThreshold reputation)",
      required: ["agentReputation"] as const,
      properties: {
        agent: { type: "address" },
        agentReputation: { type: "number" },
      },
    },
    leave: {
      description: "Leave the DAO voluntarily",
      properties: {
        agent: { type: "address" },
      },
    },
    propose_threshold_change: {
      description: "Propose changing reputation thresholds",
      required: ["proposalId", "agentReputation"] as const,
      properties: {
        agent: { type: "address" },
        agentReputation: { type: "number" },
        proposalId: { type: "string" },
        memberThreshold: { type: "number" },
        voteThreshold: { type: "number" },
        proposeThreshold: { type: "number" },
      },
    },
  },

  states: {
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "DAO is idle and ready to accept a proposal",
        category: "initial",
      },
    },
    VOTING: {
      id: "VOTING",
      isFinal: false,
      metadata: {
        label: "Voting",
        description: "Members vote with reputation-weighted power",
        category: "pending",
      },
    },
    DISSOLVED: {
      id: "DISSOLVED",
      isFinal: true,
      metadata: {
        label: "Dissolved",
        description: "Reputation DAO dissolved (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "ACTIVE",

  transitions: [
    // ACTIVE → VOTING: propose (reputation check)
    {
      from: "ACTIVE",
      to: "VOTING",
      eventName: "propose",
      guard: {
        ">=": [
          { var: "event.agentReputation" },
          { var: "state.proposeThreshold" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              title: { var: "event.title" },
              description: { var: "event.description" },
              actionType: { var: "event.actionType" },
              payload: { var: "event.payload" },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              deadline: {
                "+": [{ var: "$ordinal" }, { var: "state.votingPeriodMs" }],
              },
            },
            votes: { for: [], against: [], abstain: [] },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → VOTING: vote (reputation check, no double-vote, within window)
    {
      from: "VOTING",
      to: "VOTING",
      eventName: "vote",
      guard: {
        and: [
          {
            ">=": [
              { var: "event.agentReputation" },
              { var: "state.voteThreshold" },
            ],
          },
          { "!": [signerInSet("state.votes.for")] },
          { "!": [signerInSet("state.votes.against")] },
          { "!": [signerInSet("state.votes.abstain")] },
          { "<=": [{ var: "$ordinal" }, { var: "state.proposal.deadline" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            votes: {
              if: [
                { "===": [{ var: "event.vote" }, "for"] },
                {
                  merge: [
                    { var: "state.votes" },
                    {
                      for: {
                        cat: [
                          { var: "state.votes.for" },
                          [{ var: "event.agent" }],
                        ],
                      },
                    },
                  ],
                },
                { "===": [{ var: "event.vote" }, "against"] },
                {
                  merge: [
                    { var: "state.votes" },
                    {
                      against: {
                        cat: [
                          { var: "state.votes.against" },
                          [{ var: "event.agent" }],
                        ],
                      },
                    },
                  ],
                },
                {
                  merge: [
                    { var: "state.votes" },
                    {
                      abstain: {
                        cat: [
                          { var: "state.votes.abstain" },
                          [{ var: "event.agent" }],
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → ACTIVE: execute (voting ended, for > against, quorum met)
    {
      from: "VOTING",
      to: "ACTIVE",
      eventName: "execute",
      // A2 fix: votes.for/against/abstain are arrays of voter addresses; count with
      // `length` (size is not a JLVM opcode).
      guard: {
        and: [
          { ">": [{ var: "$ordinal" }, { var: "state.proposal.deadline" }] },
          {
            ">": [
              { length: [{ var: "state.votes.for" }] },
              { length: [{ var: "state.votes.against" }] },
            ],
          },
          {
            ">=": [
              {
                "+": [
                  { length: [{ var: "state.votes.for" }] },
                  { length: [{ var: "state.votes.against" }] },
                ],
              },
              { var: "state.quorum" },
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
                    type: "executed",
                    proposal: { var: "state.proposal" },
                    votes: { var: "state.votes" },
                    at: { var: "$ordinal" },
                  },
                ],
              ],
            },
            proposal: null,
            votes: null,
            // A3 fix: transition-level `emits` is dropped by the chain; emit from INSIDE the effect
            // under the reserved `_emit` key (extracted as an EmittedEvent, stripped from state).
            _emit: [
              {
                name: "proposal_executed",
                data: { action: "increase", agents: { var: "state.votes.for" } },
                destination: "Reputation",
              },
            ],
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → ACTIVE: reject (voting ended, for <= against or quorum not met)
    {
      from: "VOTING",
      to: "ACTIVE",
      eventName: "reject",
      // A2 fix: count the array-shaped vote tallies with `length` (size is not a JLVM
      // opcode).
      guard: {
        and: [
          { ">": [{ var: "$ordinal" }, { var: "state.proposal.deadline" }] },
          {
            or: [
              {
                "<=": [
                  { length: [{ var: "state.votes.for" }] },
                  { length: [{ var: "state.votes.against" }] },
                ],
              },
              {
                "<": [
                  {
                    "+": [
                      { length: [{ var: "state.votes.for" }] },
                      { length: [{ var: "state.votes.against" }] },
                    ],
                  },
                  { var: "state.quorum" },
                ],
              },
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
                    type: "rejected",
                    proposal: { var: "state.proposal" },
                    votes: { var: "state.votes" },
                    at: { var: "$ordinal" },
                  },
                ],
              ],
            },
            proposal: null,
            votes: null,
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: join (reputation check, not already member)
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "join",
      // S1/A2: bind event.agent to a verified signer (actorIsSigner) so the member is appended to the
      // array and keyed into memberJoinedAt under a CHAIN-VERIFIED address (set is the rc.5 map-write
      // opcode), and dedup on that bound actor.
      // TODO(#24): event.agentReputation is self-asserted. Replace the reputation clause with
      // signerHasReputation(registryReputationPath(<registryDep>), "state.memberThreshold") once
      // runtime-updatable dependencies (#24) let a std-app bind the identity-registry instance — the
      // same gate as corp-board's removal-resolution. The registry foundation + read helper already
      // exist (src/apps/identity/state-machines/identity-registry.ts, guards.signerHasReputation).
      guard: {
        and: [
          actorIsSigner(),
          {
            ">=": [
              { var: "event.agentReputation" },
              { var: "state.memberThreshold" },
            ],
          },
          { "!": [{ in: [{ var: "event.agent" }, { var: "state.members" }] }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            members: {
              cat: [{ var: "state.members" }, [{ var: "event.agent" }]],
            },
            memberJoinedAt: {
              set: [
                { var: "state.memberJoinedAt" },
                { var: "event.agent" },
                { var: "$ordinal" },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: leave (member only)
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "leave",
      guard: signerInSet("state.members"),
      effect: {
        merge: [
          { var: "state" },
          {
            members: {
              filter: [
                { var: "state.members" },
                { "!==": [{ var: "" }, { var: "event.agent" }] },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → VOTING: propose_threshold_change
    {
      from: "ACTIVE",
      to: "VOTING",
      eventName: "propose_threshold_change",
      guard: {
        ">=": [
          { var: "event.agentReputation" },
          { var: "state.proposeThreshold" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              title: "Threshold Change",
              actionType: "threshold_change",
              payload: {
                memberThreshold: { var: "event.memberThreshold" },
                voteThreshold: { var: "event.voteThreshold" },
                proposeThreshold: { var: "event.proposeThreshold" },
              },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              deadline: {
                "+": [{ var: "$ordinal" }, { var: "state.votingPeriodMs" }],
              },
            },
            votes: { for: [], against: [], abstain: [] },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
