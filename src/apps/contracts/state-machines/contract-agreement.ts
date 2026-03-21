import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Two-party agreement with mutual completion attestation and dispute resolution.
 */
export const contractAgreementDef = defineFiberApp({
  metadata: {
    name: "ContractAgreement",
    app: "contracts",
    type: "agreement",
    version: "1.0.0",
    description:
      "Two-party agreement with mutual completion attestation and dispute resolution",
    crossReferences: {
      proposerIdentityId: {
        machine: "identity-agent",
        field: "proposer",
        description: "Links to proposer's AgentIdentity fiber",
      },
      counterpartyIdentityId: {
        machine: "identity-agent",
        field: "counterparty",
        description: "Links to counterparty's AgentIdentity fiber",
      },
      escrowId: {
        machine: "contract-escrow",
        field: "escrowId",
        description: "Links to Escrow if payment is escrowed",
      },
      arbitrationPoolId: {
        machine: "arbitration-pool",
        field: "arbitrationPoolId",
        description: "Links to ArbitrationPool for dispute resolution",
      },
    },
  },

  createSchema: {
    required: ["proposer", "counterparty"] as const,
    properties: {
      proposer: {
        type: "address",
        description: "DAG address of the proposer",
        immutable: true,
      },
      counterparty: {
        type: "address",
        description: "DAG address of the counterparty",
        immutable: true,
      },
    },
  },

  stateSchema: {
    properties: {
      status: { type: "string" },
      proposer: { type: "address" },
      counterparty: { type: "address" },
      completions: { type: "array" },
      acceptedAt: { type: "integer", nullable: true },
      rejectedAt: { type: "integer", nullable: true },
      rejectReason: { type: "string", nullable: true },
      cancelledAt: { type: "integer", nullable: true },
      completedAt: { type: "integer", nullable: true },
      disputedAt: { type: "integer", nullable: true },
      disputeReason: { type: "string", nullable: true },
      disputedBy: { type: "address", nullable: true },
      resolvedAt: { type: "integer", nullable: true },
      resolution: { type: "string", nullable: true },
      rulingId: { type: "string", nullable: true },
    },
  },

  eventSchemas: {
    accept: {},
    reject: { properties: { reason: { type: "string" } } },
    cancel: {},
    submit_completion: { properties: { proof: { type: "string" } } },
    finalize: {},
    dispute: { properties: { reason: { type: "string" } } },
    resolve: {
      properties: {
        judicialRuling: { type: "boolean", nullable: true },
        proposerApproves: { type: "boolean", nullable: true },
        counterpartyApproves: { type: "boolean", nullable: true },
        resolution: { type: "string" },
        rulingId: { type: "string", nullable: true },
      },
    },
  },

  states: {
    PROPOSED: { id: "PROPOSED", isFinal: false, metadata: null },
    ACTIVE: { id: "ACTIVE", isFinal: false, metadata: null },
    COMPLETED: { id: "COMPLETED", isFinal: true, metadata: null },
    DISPUTED: { id: "DISPUTED", isFinal: false, metadata: null },
    REJECTED: { id: "REJECTED", isFinal: true, metadata: null },
    CANCELLED: { id: "CANCELLED", isFinal: true, metadata: null },
  },

  initialState: "PROPOSED",

  transitions: [
    {
      from: "PROPOSED",
      to: "ACTIVE",
      eventName: "accept",
      guard: { "===": [{ var: "event.agent" }, { var: "state.counterparty" }] },
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
      to: "REJECTED",
      eventName: "reject",
      guard: { "===": [{ var: "event.agent" }, { var: "state.counterparty" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "REJECTED",
            rejectedAt: { var: "$timestamp" },
            rejectReason: { var: "event.reason" },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "PROPOSED",
      to: "CANCELLED",
      eventName: "cancel",
      guard: { "===": [{ var: "event.agent" }, { var: "state.proposer" }] },
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
      to: "ACTIVE",
      eventName: "submit_completion",
      guard: {
        and: [
          {
            or: [
              { "===": [{ var: "event.agent" }, { var: "state.proposer" }] },
              {
                "===": [{ var: "event.agent" }, { var: "state.counterparty" }],
              },
            ],
          },
          {
            "!": [
              {
                in: [
                  { var: "event.agent" },
                  { map: [{ var: "state.completions" }, { var: "agent" }] },
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
            completions: {
              cat: [
                { var: "state.completions" },
                [
                  {
                    agent: { var: "event.agent" },
                    proof: { var: "event.proof" },
                    submittedAt: { var: "$timestamp" },
                  },
                ],
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "ACTIVE",
      to: "COMPLETED",
      eventName: "finalize",
      guard: { ">=": [{ size: { var: "state.completions" } }, 2] },
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
      to: "DISPUTED",
      eventName: "dispute",
      guard: {
        or: [
          { "===": [{ var: "event.agent" }, { var: "state.proposer" }] },
          { "===": [{ var: "event.agent" }, { var: "state.counterparty" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "DISPUTED",
            disputedAt: { var: "$timestamp" },
            disputeReason: { var: "event.reason" },
            disputedBy: { var: "event.agent" },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "DISPUTED",
      to: "COMPLETED",
      eventName: "resolve",
      guard: {
        or: [
          { var: "event.judicialRuling" },
          {
            and: [
              { "===": [{ var: "event.proposerApproves" }, true] },
              { "===": [{ var: "event.counterpartyApproves" }, true] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "COMPLETED",
            resolvedAt: { var: "$timestamp" },
            resolution: { var: "event.resolution" },
            rulingId: { var: "event.rulingId" },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "ACTIVE",
      to: "CANCELLED",
      eventName: "cancel",
      guard: {
        or: [
          { "===": [{ var: "event.agent" }, { var: "state.proposer" }] },
          { "===": [{ var: "event.agent" }, { var: "state.counterparty" }] },
        ],
      },
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
