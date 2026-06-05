import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Minimal identity state machine - extend for custom use cases.
 */
export const identityUniversalDef = defineFiberApp({
  metadata: {
    name: "IdentityUniversal",
    app: "identity",
    type: "universal",
    version: "1.0.0",
    description: "Minimal identity state machine - extend for custom use cases",
  },

  createSchema: {
    required: ["owner"] as const,
    properties: {
      owner: {
        type: "address",
        description: "Identity owner DAG address",
        immutable: true,
      },
      metadata: {
        type: "object",
        description: "Arbitrary metadata",
        default: {},
      },
    },
  },

  stateSchema: {
    properties: {
      owner: { type: "address", immutable: true },
      status: {
        type: "string",
        enum: ["CREATED", "ACTIVE", "INACTIVE"] as const,
        computed: true,
      },
      metadata: { type: "object" },
      activatedAt: { type: "timestamp", computed: true },
      updatedAt: { type: "timestamp", computed: true },
      deactivatedAt: { type: "timestamp", computed: true },
    },
  },

  eventSchemas: {
    activate: {
      description: "Activate the identity",
    },
    update: {
      description: "Update identity metadata",
      properties: {
        metadata: { type: "object" },
      },
    },
    deactivate: {
      description: "Deactivate the identity",
    },
  },

  states: {
    CREATED: {
      id: "CREATED",
      isFinal: false,
      metadata: {
        label: "Created",
        description: "Identity registered but not yet activated",
        category: "initial",
      },
    },
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "Identity is active and can be updated",
        category: "active",
      },
    },
    INACTIVE: {
      id: "INACTIVE",
      isFinal: true,
      metadata: {
        label: "Inactive",
        description: "Identity deactivated by its owner (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "CREATED",

  transitions: [
    {
      from: "CREATED",
      to: "ACTIVE",
      eventName: "activate",
      guard: { "==": [1, 1] },
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
      eventName: "update",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          {
            updatedAt: { var: "$timestamp" },
            metadata: { var: "event.metadata" },
          },
        ],
      },
    },
    {
      from: "ACTIVE",
      to: "INACTIVE",
      eventName: "deactivate",
      guard: { "==": [1, 1] },
      effect: {
        merge: [
          { var: "state" },
          { status: "INACTIVE", deactivatedAt: { var: "$timestamp" } },
        ],
      },
    },
  ],
});

export type UniversalIdentityState = keyof typeof identityUniversalDef.states;
export type UniversalIdentityEvent =
  (typeof identityUniversalDef.transitions)[number]["eventName"];
