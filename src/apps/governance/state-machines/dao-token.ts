import { defineFiberApp } from "../../../schema/fiber-app.js";
import { signerIsParty, actorIsSigner } from "../../../schema/guards.js";

/**
 * Token-weighted voting. Voting power proportional to token holdings.
 */
export const daoTokenDef = defineFiberApp({
  metadata: {
    name: "TokenDAO",
    app: "governance",
    type: "daoToken",
    version: "1.0.0",
    description:
      "Token-weighted voting. Voting power proportional to token holdings.",
    category: "governance/dao",
    crossReferences: {
      Identity: "voter verification",
      Token: "balance snapshots",
      Contract: "action execution",
      Treasury: "fund management",
    },
  },

  createSchema: {
    required: [
      "balances",
      "proposalThreshold",
      "quorum",
      "votingPeriodMs",
      "timelockMs",
    ] as const,
    properties: {
      balances: {
        type: "object",
        description: "Initial token balances by address",
      },
      proposalThreshold: {
        type: "number",
        description: "Min token balance to submit a proposal",
      },
      quorum: {
        type: "number",
        description: "Min total votes (weighted) to pass",
      },
      votingPeriodMs: {
        type: "number",
        description: "Voting window in milliseconds",
      },
      timelockMs: {
        type: "number",
        description: "Time-lock delay before execution",
      },
    },
  },

  stateSchema: {
    properties: {
      balances: { type: "object" },
      delegations: { type: "object", computed: true },
      proposalThreshold: { type: "number" },
      quorum: { type: "number" },
      votingPeriodMs: { type: "number" },
      timelockMs: { type: "number" },
      proposal: { type: "object" },
      votes: { type: "object", computed: true },
      executedProposals: { type: "array", computed: true },
      rejectedProposals: { type: "array", computed: true },
      cancelledProposals: { type: "array", computed: true },
    },
  },

  eventSchemas: {
    propose: {
      description: "Submit a proposal (requires >= proposalThreshold tokens)",
      required: [
        "proposalId",
        "title",
        "description",
        "actionType",
        "payload",
      ] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        actionType: { type: "string" },
        payload: { type: "object" },
        snapshotBlock: { type: "string" },
      },
    },
    vote: {
      description:
        "Cast a token-weighted vote (must hold tokens, no double-vote, within window)",
      required: ["vote"] as const,
      properties: {
        agent: { type: "address" },
        vote: { type: "string", description: '"for" | "against" | "abstain"' },
      },
    },
    queue: {
      description:
        "Queue passing proposal into timelock (voting ended, for > against, quorum met)",
      properties: {},
    },
    execute: {
      description: "Execute queued proposal after timelock expires",
      properties: {},
    },
    reject: {
      description:
        "Formally reject a failed proposal (voting ended, failed conditions)",
      properties: {},
    },
    cancel: {
      description: "Cancel a queued proposal (proposer only)",
      properties: {
        agent: { type: "address" },
      },
    },
    delegate: {
      description: "Delegate voting power to another address",
      required: ["delegateTo"] as const,
      properties: {
        agent: { type: "address" },
        delegateTo: { type: "address" },
      },
    },
    undelegate: {
      description: "Revoke delegation",
      properties: {
        agent: { type: "address" },
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
        description: "Token holders are voting on the active proposal",
        category: "pending",
      },
    },
    QUEUED: {
      id: "QUEUED",
      isFinal: false,
      metadata: {
        label: "Queued",
        description: "Passed proposal queued in timelock before execution",
        category: "pending",
      },
    },
    DISSOLVED: {
      id: "DISSOLVED",
      isFinal: true,
      metadata: {
        label: "Dissolved",
        description: "Token DAO dissolved (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "ACTIVE",

  transitions: [
    // ACTIVE → VOTING: propose (enough tokens)
    {
      from: "ACTIVE",
      to: "VOTING",
      eventName: "propose",
      // S1/A2 coupled fix: a CHAIN-VERIFIED signer must hold >= proposalThreshold
      // tokens. Iterate proofs[].address and read each balance via `get` (getKey is
      // not a JLVM opcode); never trust the forgeable event.agent for the lookup.
      guard: {
        some: [
          { map: [{ var: "proofs" }, { var: "address" }] },
          {
            ">=": [
              { get: [{ var: "state.balances" }, { var: "" }] },
              { var: "state.proposalThreshold" },
            ],
          },
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
              votingEndsAt: {
                "+": [{ var: "$ordinal" }, { var: "state.votingPeriodMs" }],
              },
              snapshotBlock: { var: "event.snapshotBlock" },
            },
            votes: { for: 0, against: 0, abstain: 0, voters: {} },
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → VOTING: vote (token holder, no double-vote, within window)
    {
      from: "VOTING",
      to: "VOTING",
      eventName: "vote",
      // S1+A2 coupled fix: bind event.agent to a verified signer (actorIsSigner) so the
      // balance lookup, the no-double-vote check, and the voters write below all key on the
      // CHAIN-VERIFIED actor — never a forgeable claim. getKey→get (value), getKey→has
      // (presence), setKey→set are the rc.5 map opcodes (getKey/setKey do not exist).
      guard: {
        and: [
          actorIsSigner(),
          {
            ">": [
              { get: [{ var: "state.balances" }, { var: "event.agent" }] },
              0,
            ],
          },
          {
            "!": [
              {
                has: [{ var: "state.votes.voters" }, { var: "event.agent" }],
              },
            ],
          },
          {
            "<=": [{ var: "$ordinal" }, { var: "state.proposal.votingEndsAt" }],
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
                {
                  if: [
                    { "===": [{ var: "event.vote" }, "for"] },
                    {
                      for: {
                        "+": [
                          { var: "state.votes.for" },
                          {
                            get: [
                              { var: "state.balances" },
                              { var: "event.agent" },
                            ],
                          },
                        ],
                      },
                    },
                    { "===": [{ var: "event.vote" }, "against"] },
                    {
                      against: {
                        "+": [
                          { var: "state.votes.against" },
                          {
                            get: [
                              { var: "state.balances" },
                              { var: "event.agent" },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      abstain: {
                        "+": [
                          { var: "state.votes.abstain" },
                          {
                            get: [
                              { var: "state.balances" },
                              { var: "event.agent" },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  voters: {
                    set: [
                      { var: "state.votes.voters" },
                      { var: "event.agent" },
                      {
                        vote: { var: "event.vote" },
                        weight: {
                          get: [
                            { var: "state.balances" },
                            { var: "event.agent" },
                          ],
                        },
                        votedAt: { var: "$ordinal" },
                      },
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
    // VOTING → QUEUED: queue (voting ended, for > against, quorum met)
    {
      from: "VOTING",
      to: "QUEUED",
      eventName: "queue",
      guard: {
        and: [
          {
            ">": [{ var: "$ordinal" }, { var: "state.proposal.votingEndsAt" }],
          },
          { ">": [{ var: "state.votes.for" }, { var: "state.votes.against" }] },
          {
            ">=": [
              {
                "+": [
                  { var: "state.votes.for" },
                  { var: "state.votes.against" },
                  { var: "state.votes.abstain" },
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
            proposal: {
              merge: [
                { var: "state.proposal" },
                {
                  queuedAt: { var: "$ordinal" },
                  executableAt: {
                    "+": [{ var: "$ordinal" }, { var: "state.timelockMs" }],
                  },
                },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // QUEUED → ACTIVE: execute (timelock expired)
    {
      from: "QUEUED",
      to: "ACTIVE",
      eventName: "execute",
      guard: {
        ">=": [{ var: "$ordinal" }, { var: "state.proposal.executableAt" }],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            executedProposals: {
              cat: [
                { var: "state.executedProposals" },
                [
                  {
                    merge: [
                      { var: "state.proposal" },
                      {
                        votes: { var: "state.votes" },
                        executedAt: { var: "$ordinal" },
                      },
                    ],
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
                data: { proposalId: { var: "state.proposal.id" } },
                destination: "external",
              },
            ],
          },
        ],
      },
      dependencies: [],
    },
    // VOTING → ACTIVE: reject (voting ended, failed quorum or for <= against)
    {
      from: "VOTING",
      to: "ACTIVE",
      eventName: "reject",
      guard: {
        and: [
          {
            ">": [{ var: "$ordinal" }, { var: "state.proposal.votingEndsAt" }],
          },
          {
            or: [
              {
                "<=": [
                  { var: "state.votes.for" },
                  { var: "state.votes.against" },
                ],
              },
              {
                "<": [
                  {
                    "+": [
                      { var: "state.votes.for" },
                      { var: "state.votes.against" },
                      { var: "state.votes.abstain" },
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
            rejectedProposals: {
              cat: [
                { var: "state.rejectedProposals" },
                [
                  {
                    merge: [
                      { var: "state.proposal" },
                      {
                        votes: { var: "state.votes" },
                        rejectedAt: { var: "$ordinal" },
                      },
                    ],
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
    // QUEUED → ACTIVE: cancel (proposer only)
    {
      from: "QUEUED",
      to: "ACTIVE",
      eventName: "cancel",
      guard: signerIsParty("state.proposal.proposer"),
      effect: {
        merge: [
          { var: "state" },
          {
            cancelledProposals: {
              cat: [
                { var: "state.cancelledProposals" },
                [
                  {
                    merge: [
                      { var: "state.proposal" },
                      { cancelledAt: { var: "$ordinal" } },
                    ],
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
    // ACTIVE → ACTIVE: delegate
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "delegate",
      // S1+A2: bind event.agent to a verified signer so the delegation is written under the
      // CHAIN-VERIFIED delegator's key (set), keyed on the same actor whose balance is checked (get).
      guard: {
        and: [
          actorIsSigner(),
          {
            ">": [
              { get: [{ var: "state.balances" }, { var: "event.agent" }] },
              0,
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            delegations: {
              set: [
                { var: "state.delegations" },
                { var: "event.agent" },
                { var: "event.delegateTo" },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → ACTIVE: undelegate
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "undelegate",
      // S1+A2: bind event.agent to a verified signer; presence via has, removal via unset (the rc.5
      // map opcodes — getKey/deleteKey do not exist). Only the verified delegator can clear their own
      // delegation.
      guard: {
        and: [
          actorIsSigner(),
          { has: [{ var: "state.delegations" }, { var: "event.agent" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            delegations: {
              unset: [{ var: "state.delegations" }, { var: "event.agent" }],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
