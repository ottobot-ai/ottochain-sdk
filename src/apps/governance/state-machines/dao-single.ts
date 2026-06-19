import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Single owner controls all actions. Simplest governance model.
 */
export const daoSingleDef = defineFiberApp({
  metadata: {
    name: "SingleOwnerDAO",
    app: "governance",
    type: "daoSingle",
    version: "1.0.0",
    description:
      "Single owner controls all actions. Simplest governance model.",
    category: "governance/dao",
    crossReferences: {
      Identity: "owner registration",
      Contract: "action execution targets",
      Treasury: "fund management",
    },
  },

  createSchema: {
    required: ["owner"] as const,
    properties: {
      owner: {
        type: "address",
        description: "DAG address of the initial owner",
        immutable: false,
      },
    },
  },

  stateSchema: {
    properties: {
      owner: { type: "address" },
      pendingOwner: { type: "address" },
      transferInitiatedAt: { type: "timestamp" },
      ownershipHistory: { type: "array", computed: true },
      actions: { type: "array", computed: true },
      status: { type: "string", computed: true },
    },
  },

  eventSchemas: {
    execute: {
      description: "Execute an action (owner only)",
      required: ["actionId", "actionType", "payload"] as const,
      properties: {
        agent: { type: "address" },
        actionId: { type: "string" },
        actionType: { type: "string" },
        payload: { type: "object" },
      },
    },
    transfer_ownership: {
      description: "Initiate ownership transfer (owner only)",
      required: ["newOwner"] as const,
      properties: {
        agent: { type: "address" },
        newOwner: { type: "address" },
      },
    },
    accept_ownership: {
      description: "Accept ownership (pending owner only)",
      properties: {
        agent: { type: "address" },
      },
    },
    cancel_transfer: {
      description: "Cancel pending ownership transfer (owner only)",
      properties: {
        agent: { type: "address" },
      },
    },
    dissolve: {
      description: "Dissolve the DAO (owner only)",
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
        description: "Single owner controls the DAO and may act or transfer ownership",
        category: "initial",
      },
    },
    TRANSFERRING: {
      id: "TRANSFERRING",
      isFinal: false,
      metadata: {
        label: "Transferring",
        description: "Ownership transfer proposed; awaiting acceptance",
        category: "pending",
      },
    },
    DISSOLVED: {
      id: "DISSOLVED",
      isFinal: true,
      metadata: {
        label: "Dissolved",
        description: "DAO dissolved by its owner (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "ACTIVE",

  transitions: [
    // ACTIVE → ACTIVE: execute (owner only)
    {
      from: "ACTIVE",
      to: "ACTIVE",
      eventName: "execute",
      guard: { "===": [{ var: "event.agent" }, { var: "state.owner" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            actions: {
              cat: [
                { var: "state.actions" },
                [
                  {
                    id: { var: "event.actionId" },
                    type: { var: "event.actionType" },
                    payload: { var: "event.payload" },
                    executedAt: { var: "$ordinal" },
                  },
                ],
              ],
            },
          },
        ],
      },
      emits: [{ event: "action_executed", to: "external" }],
      dependencies: [],
    },
    // ACTIVE → TRANSFERRING: transfer_ownership (owner only)
    {
      from: "ACTIVE",
      to: "TRANSFERRING",
      eventName: "transfer_ownership",
      guard: { "===": [{ var: "event.agent" }, { var: "state.owner" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            pendingOwner: { var: "event.newOwner" },
            transferInitiatedAt: { var: "$ordinal" },
          },
        ],
      },
      dependencies: [],
    },
    // TRANSFERRING → ACTIVE: accept_ownership (pending owner only)
    {
      from: "TRANSFERRING",
      to: "ACTIVE",
      eventName: "accept_ownership",
      guard: { "===": [{ var: "event.agent" }, { var: "state.pendingOwner" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            owner: { var: "state.pendingOwner" },
            pendingOwner: null,
            transferInitiatedAt: null,
            ownershipHistory: {
              cat: [
                { var: "state.ownershipHistory" },
                [
                  {
                    from: { var: "state.owner" },
                    to: { var: "state.pendingOwner" },
                    at: { var: "$ordinal" },
                  },
                ],
              ],
            },
          },
        ],
      },
      emits: [{ event: "ownership_transferred", to: "Identity" }],
      dependencies: [],
    },
    // TRANSFERRING → ACTIVE: cancel_transfer (owner only)
    {
      from: "TRANSFERRING",
      to: "ACTIVE",
      eventName: "cancel_transfer",
      guard: { "===": [{ var: "event.agent" }, { var: "state.owner" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            pendingOwner: null,
            transferInitiatedAt: null,
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → DISSOLVED: dissolve (owner only)
    {
      from: "ACTIVE",
      to: "DISSOLVED",
      eventName: "dissolve",
      guard: { "===": [{ var: "event.agent" }, { var: "state.owner" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            dissolvedAt: { var: "$ordinal" },
            status: "DISSOLVED",
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
