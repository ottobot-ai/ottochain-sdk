import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Minimal market state machine - extend for custom use cases.
 */
export const marketUniversalDef = defineFiberApp({
  metadata: {
    name: "MarketUniversal",
    app: "markets",
    type: "universal",
    version: "1.0.0",
    description: "Minimal market state machine - extend for custom use cases",
  },

  createSchema: {
    properties: {},
  },

  stateSchema: {
    properties: {
      status: { type: "string" },
      totalCommitted: { type: "number", computed: true },
    },
  },

  eventSchemas: {
    open: { description: "Open the market for participation" },
    cancel: { description: "Cancel the market" },
    commit: {
      description: "Commit funds to the market",
      properties: {
        amount: { type: "number", minimum: 0 },
      },
    },
    close: { description: "Close the market to new commits" },
    settle: { description: "Settle the market" },
  },

  states: {
    PROPOSED: {
      id: "PROPOSED",
      isFinal: false,
      metadata: {
        label: "Proposed",
        description: "Market created but not yet open",
        category: "initial",
      },
    },
    OPEN: {
      id: "OPEN",
      isFinal: false,
      metadata: {
        label: "Open",
        description: "Market is open for participation",
        category: "active",
      },
    },
    CLOSED: {
      id: "CLOSED",
      isFinal: false,
      metadata: {
        label: "Closed",
        description: "Participation closed; awaiting settlement",
        category: "pending",
      },
    },
    SETTLED: {
      id: "SETTLED",
      isFinal: true,
      metadata: {
        label: "Settled",
        description: "Market settled and payouts available (terminal)",
        category: "terminal",
      },
    },
    CANCELLED: {
      id: "CANCELLED",
      isFinal: true,
      metadata: {
        label: "Cancelled",
        description: "Market cancelled before settlement (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "PROPOSED",

  transitions: [
    {
      from: "PROPOSED",
      to: "OPEN",
      eventName: "open",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "OPEN", openedAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "PROPOSED",
      to: "CANCELLED",
      eventName: "cancel",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "CANCELLED", cancelledAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "OPEN",
      to: "OPEN",
      eventName: "commit",
      guard: { ">": [{ var: "event.amount" }, 0] },
      effect: {
        merge: [
          { var: "state" },
          {
            totalCommitted: {
              "+": [{ var: "state.totalCommitted" }, { var: "event.amount" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "OPEN",
      to: "CLOSED",
      eventName: "close",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "CLOSED", closedAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "CLOSED",
      to: "SETTLED",
      eventName: "settle",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "SETTLED", settledAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "CLOSED",
      to: "CANCELLED",
      eventName: "cancel",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "CANCELLED", cancelledAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
