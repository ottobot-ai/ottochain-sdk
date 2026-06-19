import { defineFiberApp } from "../../../schema/fiber-app.js";
import { actorInSet, signerIsParty } from "../../../schema/guards.js";

/**
 * N-of-M multisig governance. Requires threshold signatures for actions.
 */
export const daoMultisigDef = defineFiberApp({
  metadata: {
    name: "MultisigDAO",
    app: "governance",
    type: "daoMultisig",
    version: "1.0.0",
    description:
      "N-of-M multisig governance. Requires threshold signatures for actions.",
    category: "governance/dao",
    crossReferences: {
      Identity: "signer verification",
      Contract: "action execution targets",
      Treasury: "fund management",
      Escrow: "controlled release",
    },
  },

  createSchema: {
    required: ["signers", "threshold", "proposalTTLMs"] as const,
    properties: {
      signers: {
        type: "array",
        description: "Authorized signer addresses",
        immutable: false,
      },
      threshold: {
        type: "number",
        description: "Number of signatures required to execute",
      },
      proposalTTLMs: {
        type: "number",
        description: "Proposal expiry window in milliseconds",
      },
    },
  },

  stateSchema: {
    properties: {
      signers: { type: "array" },
      threshold: { type: "number" },
      proposalTTLMs: { type: "number" },
      proposal: { type: "object" },
      signatures: { type: "object", computed: true },
      actions: { type: "array", computed: true },
      cancelledProposals: { type: "array", computed: true },
      status: { type: "string", computed: true },
    },
  },

  eventSchemas: {
    propose: {
      description: "Propose an action (signer only)",
      required: ["proposalId", "actionType", "payload"] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        actionType: { type: "string" },
        payload: { type: "object" },
      },
    },
    sign: {
      description: "Sign the current proposal (signer only, no double-signing)",
      properties: {
        agent: { type: "address" },
      },
    },
    execute: {
      description: "Execute once threshold signatures collected",
      properties: {
        agent: { type: "address" },
      },
    },
    cancel: {
      description: "Cancel proposal (expired or proposer)",
      properties: {
        agent: { type: "address" },
      },
    },
    propose_add_signer: {
      description: "Propose adding a new signer (signer only)",
      required: ["proposalId", "newSigner"] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        newSigner: { type: "address" },
      },
    },
    propose_remove_signer: {
      description:
        "Propose removing a signer (signer only, must keep > threshold signers)",
      required: ["proposalId", "removeSigner"] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        removeSigner: { type: "address" },
      },
    },
    propose_change_threshold: {
      description: "Propose changing the signature threshold",
      required: ["proposalId", "newThreshold"] as const,
      properties: {
        agent: { type: "address" },
        proposalId: { type: "string" },
        newThreshold: { type: "number", minimum: 1 },
      },
    },
    apply_signer_change: {
      description: "Apply approved signer-set or threshold change",
      properties: {
        agent: { type: "address" },
      },
    },
    dissolve: {
      description:
        "Dissolve the DAO (requires every signer to sign this op — verified unanimity)",
      properties: {},
    },
  },

  states: {
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "Multisig is idle and ready to propose an action",
        category: "initial",
      },
    },
    PENDING: {
      id: "PENDING",
      isFinal: false,
      metadata: {
        label: "Pending",
        description: "An action is awaiting the required signature threshold",
        category: "pending",
      },
    },
    DISSOLVED: {
      id: "DISSOLVED",
      isFinal: true,
      metadata: {
        label: "Dissolved",
        description: "Multisig DAO dissolved (terminal)",
        category: "terminal",
      },
    },
  },

  initialState: "ACTIVE",

  transitions: [
    // ACTIVE → PENDING: propose (signer only)
    {
      from: "ACTIVE",
      to: "PENDING",
      eventName: "propose",
      guard: actorInSet("state.signers"),
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              actionType: { var: "event.actionType" },
              payload: { var: "event.payload" },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              expiresAt: {
                "+": [{ var: "$ordinal" }, { var: "state.proposalTTLMs" }],
              },
            },
            signatures: {
              set: [{}, { var: "event.agent" }, { var: "$ordinal" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // PENDING → PENDING: sign (signer, no double-sign, not yet at threshold)
    {
      from: "PENDING",
      to: "PENDING",
      eventName: "sign",
      guard: {
        and: [
          actorInSet("state.signers"),
          {
            "!": [
              { has: [{ var: "state.signatures" }, { var: "event.agent" }] },
            ],
          },
          {
            "<": [
              { length: [{ keys: [{ var: "state.signatures" }] }] },
              { var: "state.threshold" },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            signatures: {
              set: [
                { var: "state.signatures" },
                { var: "event.agent" },
                { var: "$ordinal" },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    // PENDING → ACTIVE: execute (threshold met)
    {
      from: "PENDING",
      to: "ACTIVE",
      eventName: "execute",
      guard: {
        ">=": [
          { length: [{ keys: [{ var: "state.signatures" }] }] },
          { var: "state.threshold" },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            actions: {
              cat: [
                { var: "state.actions" },
                [
                  {
                    id: { var: "state.proposal.id" },
                    type: { var: "state.proposal.actionType" },
                    payload: { var: "state.proposal.payload" },
                    signatures: { var: "state.signatures" },
                    executedAt: { var: "$ordinal" },
                  },
                ],
              ],
            },
            proposal: null,
            signatures: {},
          },
        ],
      },
      emits: [{ event: "multisig_executed", to: "external" }],
      dependencies: [],
    },
    // PENDING → ACTIVE: cancel (expired or proposer)
    {
      from: "PENDING",
      to: "ACTIVE",
      eventName: "cancel",
      guard: {
        or: [
          { ">": [{ var: "$ordinal" }, { var: "state.proposal.expiresAt" }] },
          signerIsParty("state.proposal.proposer"),
        ],
      },
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
            signatures: {},
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → PENDING: propose_add_signer
    {
      from: "ACTIVE",
      to: "PENDING",
      eventName: "propose_add_signer",
      guard: actorInSet("state.signers"),
      effect: {
        merge: [
          { var: "state" },
          {
            proposal: {
              id: { var: "event.proposalId" },
              actionType: "add_signer",
              payload: { newSigner: { var: "event.newSigner" } },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              expiresAt: {
                "+": [{ var: "$ordinal" }, { var: "state.proposalTTLMs" }],
              },
            },
            signatures: {
              set: [{}, { var: "event.agent" }, { var: "$ordinal" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → PENDING: propose_remove_signer (signers > threshold)
    {
      from: "ACTIVE",
      to: "PENDING",
      eventName: "propose_remove_signer",
      guard: {
        and: [
          actorInSet("state.signers"),
          {
            ">": [
              { length: [{ var: "state.signers" }] },
              { var: "state.threshold" },
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
              actionType: "remove_signer",
              payload: { removeSigner: { var: "event.removeSigner" } },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              expiresAt: {
                "+": [{ var: "$ordinal" }, { var: "state.proposalTTLMs" }],
              },
            },
            signatures: {
              set: [{}, { var: "event.agent" }, { var: "$ordinal" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → PENDING: propose_change_threshold (1 <= new <= signers count)
    {
      from: "ACTIVE",
      to: "PENDING",
      eventName: "propose_change_threshold",
      guard: {
        and: [
          actorInSet("state.signers"),
          { ">=": [{ var: "event.newThreshold" }, 1] },
          {
            "<=": [
              { var: "event.newThreshold" },
              { length: [{ var: "state.signers" }] },
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
              actionType: "change_threshold",
              payload: { newThreshold: { var: "event.newThreshold" } },
              proposer: { var: "event.agent" },
              proposedAt: { var: "$ordinal" },
              expiresAt: {
                "+": [{ var: "$ordinal" }, { var: "state.proposalTTLMs" }],
              },
            },
            signatures: {
              set: [{}, { var: "event.agent" }, { var: "$ordinal" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    // PENDING → ACTIVE: apply_signer_change (threshold met, signer-type proposal)
    {
      from: "PENDING",
      to: "ACTIVE",
      eventName: "apply_signer_change",
      guard: {
        and: [
          {
            ">=": [
              { length: [{ keys: [{ var: "state.signatures" }] }] },
              { var: "state.threshold" },
            ],
          },
          {
            in: [
              { var: "state.proposal.actionType" },
              ["add_signer", "remove_signer", "change_threshold"],
            ],
          },
        ],
      },
      effect: {
        if: [
          { "===": [{ var: "state.proposal.actionType" }, "add_signer"] },
          {
            merge: [
              { var: "state" },
              {
                signers: {
                  cat: [
                    { var: "state.signers" },
                    [{ var: "state.proposal.payload.newSigner" }],
                  ],
                },
                proposal: null,
                signatures: {},
              },
            ],
          },
          { "===": [{ var: "state.proposal.actionType" }, "remove_signer"] },
          {
            merge: [
              { var: "state" },
              {
                signers: {
                  filter: [
                    { var: "state.signers" },
                    {
                      "!==": [
                        { var: "" },
                        { var: "state.proposal.payload.removeSigner" },
                      ],
                    },
                  ],
                },
                proposal: null,
                signatures: {},
              },
            ],
          },
          {
            merge: [
              { var: "state" },
              {
                threshold: { var: "state.proposal.payload.newThreshold" },
                proposal: null,
                signatures: {},
              },
            ],
          },
        ],
      },
      dependencies: [],
    },
    // ACTIVE → DISSOLVED: dissolve (unanimous)
    {
      from: "ACTIVE",
      to: "DISSOLVED",
      eventName: "dissolve",
      // S2 fix: dissolution must not trust an attacker-supplied count. Derive
      // unanimity from the CHAIN-VERIFIED signers — every signer in state.signers
      // must be among proofs[].address (with a non-empty belt). signers is an array.
      guard: {
        and: [
          { ">": [{ length: [{ var: "state.signers" }] }, 0] },
          {
            all: [
              { var: "state.signers" },
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
        merge: [
          { var: "state" },
          { dissolvedAt: { var: "$ordinal" }, status: "DISSOLVED" },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
