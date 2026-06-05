import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Minimal contract state machine - extend for custom use cases.
 */
export const contractUniversalDef = defineFiberApp({
  metadata: {
    name: "ContractUniversal",
    app: "contracts",
    type: "universal",
    version: "1.0.0",
    description: "Minimal contract state machine - extend for custom use cases",
  },

  createSchema: {
    properties: {},
  },

  stateSchema: {
    properties: {
      status: { type: "string" },
      acceptedAt: { type: "integer", nullable: true },
      cancelledAt: { type: "integer", nullable: true },
      completedAt: { type: "integer", nullable: true },
    },
  },

  eventSchemas: {
    accept: {},
    cancel: {},
    complete: {},
  },

  states: {
    PROPOSED: {
      id: "PROPOSED",
      isFinal: false,
      metadata: {
        label: "Proposed",
        description: "Contract proposed; awaiting acceptance",
        category: "initial",
      },
    },
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "Contract accepted and in effect",
        category: "active",
      },
    },
    COMPLETED: {
      id: "COMPLETED",
      isFinal: true,
      metadata: {
        label: "Completed",
        description: "Contract obligations fulfilled (terminal)",
        category: "terminal",
      },
    },
    CANCELLED: {
      id: "CANCELLED",
      isFinal: true,
      metadata: {
        label: "Cancelled",
        description: "Contract cancelled before completion (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "PROPOSED",

  transitions: [
    {
      from: "PROPOSED",
      to: "ACTIVE",
      eventName: "accept",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "ACTIVE", acceptedAt: { var: "$timestamp" } },
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
          { status: "CANCELLED", cancelledAt: { var: "$timestamp" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "ACTIVE",
      to: "COMPLETED",
      eventName: "complete",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "COMPLETED", completedAt: { var: "$timestamp" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "ACTIVE",
      to: "CANCELLED",
      eventName: "cancel",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "CANCELLED", cancelledAt: { var: "$timestamp" } },
        ],
      },
      dependencies: [],
    },
  ],
});
