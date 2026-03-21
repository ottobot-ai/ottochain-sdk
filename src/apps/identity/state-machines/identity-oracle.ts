import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Oracle identity with staking, attestations, reputation, and slashing mechanics.
 */
export const identityOracleDef = defineFiberApp({
  metadata: {
    name: "IdentityOracle",
    app: "identity",
    type: "oracle",
    version: "1.0.0",
    description:
      "Oracle identity with staking, attestations, reputation, and slashing mechanics",
  },

  createSchema: {
    required: ["owner", "stake", "domains"] as const,
    properties: {
      owner: {
        type: "address",
        description: "Oracle owner DAG address",
        immutable: true,
      },
      stake: {
        type: "integer",
        minimum: 0,
        description: "Initial stake amount",
      },
      domains: {
        type: "array",
        items: { type: "string" },
        description: "Oracle specialization domains",
      },
      minStake: {
        type: "integer",
        default: 1000,
        description: "Minimum stake required",
      },
    },
  },

  stateSchema: {
    properties: {
      owner: { type: "address", immutable: true },
      address: { type: "address", computed: true },
      stake: { type: "integer", computed: true },
      minStake: { type: "integer" },
      domains: { type: "array", items: { type: "string" } },
      status: {
        type: "string",
        enum: [
          "UNREGISTERED",
          "REGISTERED",
          "ACTIVE",
          "SLASHED",
          "WITHDRAWN",
        ] as const,
        computed: true,
      },
      reputation: {
        type: "object",
        properties: {
          accuracy: { type: "integer" },
          totalResolutions: { type: "integer" },
          disputesWon: { type: "integer" },
          disputesLost: { type: "integer" },
        },
        computed: true,
      },
      slashingHistory: { type: "array", computed: true },
      registeredAt: { type: "timestamp", computed: true },
      activatedAt: { type: "timestamp", computed: true },
      slashedAt: { type: "timestamp", computed: true },
      withdrawnAt: { type: "timestamp", computed: true },
    },
  },

  eventSchemas: {
    register: {
      description: "Register as an oracle with initial stake",
      required: ["agent", "stake", "domains"] as const,
      properties: {
        agent: { type: "address" },
        stake: { type: "integer", minimum: 0 },
        domains: { type: "array", items: { type: "string" } },
      },
    },
    activate: {
      description: "Activate a registered oracle",
      required: ["agent"] as const,
      properties: {
        agent: { type: "address" },
        adminOverride: { type: "boolean", default: false },
      },
    },
    add_stake: {
      description: "Add stake to an active oracle",
      required: ["agent", "amount"] as const,
      properties: {
        agent: { type: "address" },
        amount: { type: "integer", minimum: 1 },
      },
    },
    record_resolution: {
      description: "Record a market resolution outcome",
      required: ["marketId", "correct"] as const,
      properties: {
        marketId: { type: "uuid" },
        correct: { type: "boolean" },
      },
    },
    slash: {
      description: "Slash oracle stake for misconduct",
      required: ["reason", "amount"] as const,
      properties: {
        reason: { type: "string" },
        amount: { type: "integer", minimum: 1 },
        marketId: { type: "uuid" },
      },
    },
    reactivate: {
      description: "Reactivate a slashed oracle",
      required: ["agent"] as const,
      properties: {
        agent: { type: "address" },
      },
    },
    withdraw: {
      description: "Withdraw oracle and reclaim stake",
      required: ["agent"] as const,
      properties: {
        agent: { type: "address" },
      },
    },
  },

  states: {
    UNREGISTERED: { id: "UNREGISTERED", isFinal: false },
    REGISTERED: { id: "REGISTERED", isFinal: false },
    ACTIVE: { id: "ACTIVE", isFinal: false },
    SLASHED: { id: "SLASHED", isFinal: false },
    WITHDRAWN: { id: "WITHDRAWN", isFinal: true },
  },

  initialState: "UNREGISTERED",

  transitions: [
    {
      from: "UNREGISTERED",
      to: "REGISTERED",
      eventName: "register",
      guard: { ">=": [{ var: "event.stake" }, { var: "state.minStake" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "REGISTERED",
            address: { var: "event.agent" },
            stake: { var: "event.stake" },
            registeredAt: { var: "$timestamp" },
            reputation: {
              accuracy: 100,
              totalResolutions: 0,
              disputesWon: 0,
              disputesLost: 0,
            },
            domains: { var: "event.domains" },
            slashingHistory: [],
          },
        ],
      },
    },
    {
      from: "REGISTERED",
      to: "ACTIVE",
      eventName: "activate",
      guard: {
        or: [
          { "===": [{ var: "event.agent" }, { var: "state.address" }] },
          { var: "event.adminOverride" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          { status: "ACTIVE", activatedAt: { var: "$timestamp" } },
        ],
      },
    },
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "add_stake",
      guard: {
        and: [
          { "===": [{ var: "event.agent" }, { var: "state.address" }] },
          { ">": [{ var: "event.amount" }, 0] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            stake: { "+": [{ var: "state.stake" }, { var: "event.amount" }] },
            lastStakeAt: { var: "$timestamp" },
          },
        ],
      },
    },
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "record_resolution",
      guard: { var: "event.marketId" },
      effect: {
        merge: [
          { var: "state" },
          {
            reputation: {
              merge: [
                { var: "state.reputation" },
                {
                  totalResolutions: {
                    "+": [{ var: "state.reputation.totalResolutions" }, 1],
                  },
                  accuracy: {
                    if: [
                      { var: "event.correct" },
                      { var: "state.reputation.accuracy" },
                      { "-": [{ var: "state.reputation.accuracy" }, 5] },
                    ],
                  },
                },
              ],
            },
            lastResolutionAt: { var: "$timestamp" },
          },
        ],
      },
    },
    {
      from: "ACTIVE",
      to: "SLASHED",
      eventName: "slash",
      guard: {
        and: [
          { var: "event.reason" },
          { ">": [{ var: "event.amount" }, 0] },
          { "<=": [{ var: "event.amount" }, { var: "state.stake" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "SLASHED",
            stake: { "-": [{ var: "state.stake" }, { var: "event.amount" }] },
            slashingHistory: {
              cat: [
                { var: "state.slashingHistory" },
                [
                  {
                    reason: { var: "event.reason" },
                    amount: { var: "event.amount" },
                    marketId: { var: "event.marketId" },
                    slashedAt: { var: "$timestamp" },
                  },
                ],
              ],
            },
            slashedAt: { var: "$timestamp" },
          },
        ],
      },
    },
    {
      from: "SLASHED",
      to: "ACTIVE",
      eventName: "reactivate",
      guard: {
        and: [
          { "===": [{ var: "event.agent" }, { var: "state.address" }] },
          { ">=": [{ var: "state.stake" }, { var: "state.minStake" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          { status: "ACTIVE", reactivatedAt: { var: "$timestamp" } },
        ],
      },
    },
    {
      from: "ACTIVE",
      to: "WITHDRAWN",
      eventName: "withdraw",
      guard: { "===": [{ var: "event.agent" }, { var: "state.address" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "WITHDRAWN",
            withdrawnAt: { var: "$timestamp" },
            finalStake: { var: "state.stake" },
          },
        ],
      },
    },
    {
      from: "SLASHED",
      to: "WITHDRAWN",
      eventName: "withdraw",
      guard: { "===": [{ var: "event.agent" }, { var: "state.address" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "WITHDRAWN",
            withdrawnAt: { var: "$timestamp" },
            finalStake: { var: "state.stake" },
          },
        ],
      },
    },
  ],
});

export type OracleState = keyof typeof identityOracleDef.states;
export type OracleEvent =
  (typeof identityOracleDef.transitions)[number]["eventName"];
