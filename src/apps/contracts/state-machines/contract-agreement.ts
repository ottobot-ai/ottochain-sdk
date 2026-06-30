import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty, signerIsAnyParty } from '../../../schema/guards.js';

/**
 * Two-party agreement with mutual completion attestation and dispute resolution.
 */
export const contractAgreementDef = defineFiberApp({
  metadata: {
    name: 'ContractAgreement',
    app: 'contracts',
    type: 'agreement',
    version: '1.0.0',
    description: 'Two-party agreement with mutual completion attestation and dispute resolution',
    crossReferences: {
      proposerIdentityId: {
        machine: 'identity-agent',
        field: 'proposer',
        description: "Links to proposer's AgentIdentity fiber",
      },
      counterpartyIdentityId: {
        machine: 'identity-agent',
        field: 'counterparty',
        description: "Links to counterparty's AgentIdentity fiber",
      },
      escrowId: {
        machine: 'contract-escrow',
        field: 'escrowId',
        description: 'Links to Escrow if payment is escrowed',
      },
      arbitrationPoolId: {
        machine: 'arbitration-pool',
        field: 'arbitrationPoolId',
        description: 'Links to ArbitrationPool for dispute resolution',
      },
    },
  },

  createSchema: {
    required: ['proposer', 'counterparty', 'arbitrator'] as const,
    properties: {
      proposer: {
        type: 'address',
        description: 'DAG address of the proposer',
        immutable: true,
      },
      counterparty: {
        type: 'address',
        description: 'DAG address of the counterparty',
        immutable: true,
      },
      arbitrator: {
        type: 'address',
        description: 'DAG address of the arbitrator authorized to resolve a dispute',
        immutable: true,
      },
    },
  },

  stateSchema: {
    properties: {
      status: { type: 'string' },
      proposer: { type: 'address' },
      counterparty: { type: 'address' },
      arbitrator: { type: 'address', immutable: true },
      completions: { type: 'array' },
      acceptedAt: { type: 'integer', nullable: true },
      rejectedAt: { type: 'integer', nullable: true },
      rejectReason: { type: 'string', nullable: true },
      cancelledAt: { type: 'integer', nullable: true },
      completedAt: { type: 'integer', nullable: true },
      disputedAt: { type: 'integer', nullable: true },
      disputeReason: { type: 'string', nullable: true },
      disputedBy: { type: 'address', nullable: true },
      resolvedAt: { type: 'integer', nullable: true },
      resolution: { type: 'string', nullable: true },
      rulingId: { type: 'string', nullable: true },
    },
  },

  eventSchemas: {
    accept: {},
    reject: { properties: { reason: { type: 'string' } } },
    cancel: {},
    submit_completion: { properties: { proof: { type: 'string' } } },
    finalize: {},
    dispute: { properties: { reason: { type: 'string' } } },
    resolve: {
      properties: {
        resolution: { type: 'string' },
        rulingId: { type: 'string', nullable: true },
      },
    },
  },

  states: {
    PROPOSED: {
      id: 'PROPOSED',
      isFinal: false,
      metadata: {
        label: 'Proposed',
        description: 'Agreement proposed; awaiting the counterparty',
        category: 'initial',
      },
    },
    ACTIVE: {
      id: 'ACTIVE',
      isFinal: false,
      metadata: {
        label: 'Active',
        description: 'Agreement accepted and in effect',
        category: 'active',
      },
    },
    COMPLETED: {
      id: 'COMPLETED',
      isFinal: true,
      metadata: {
        label: 'Completed',
        description: 'Agreement completed and attested (terminal)',
        category: 'terminal',
      },
    },
    DISPUTED: {
      id: 'DISPUTED',
      isFinal: false,
      metadata: {
        label: 'Disputed',
        description: 'A party has raised a dispute; awaiting resolution',
        category: 'pending',
      },
    },
    REJECTED: {
      id: 'REJECTED',
      isFinal: true,
      metadata: {
        label: 'Rejected',
        description: 'Proposal rejected by the counterparty (terminal)',
        category: 'terminal',
      },
    },
    CANCELLED: {
      id: 'CANCELLED',
      isFinal: true,
      metadata: {
        label: 'Cancelled',
        description: 'Agreement cancelled before completion (terminal)',
        category: 'terminal',
      },
    },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'ACTIVE',
      eventName: 'accept',
      guard: signerIsParty('state.counterparty'),
      effect: {
        merge: [{ var: 'state' }, { status: 'ACTIVE', acceptedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'PROPOSED',
      to: 'REJECTED',
      eventName: 'reject',
      guard: signerIsParty('state.counterparty'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'REJECTED',
            rejectedAt: { var: '$ordinal' },
            rejectReason: { var: 'event.reason' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: signerIsParty('state.proposer'),
      effect: {
        merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'submit_completion',
      guard: {
        and: [
          signerIsAnyParty(['state.proposer', 'state.counterparty']),
          {
            '!': [
              {
                in: [{ var: 'event.agent' }, { map: [{ var: 'state.completions' }, { var: 'agent' }] }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            completions: {
              cat: [
                { var: 'state.completions' },
                [
                  {
                    agent: { var: 'event.agent' },
                    proof: { var: 'event.proof' },
                    submittedAt: { var: '$ordinal' },
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
      from: 'ACTIVE',
      to: 'COMPLETED',
      eventName: 'finalize',
      guard: { '>=': [{ length: [{ var: 'state.completions' }] }, 2] },
      effect: {
        merge: [{ var: 'state' }, { status: 'COMPLETED', completedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: signerIsAnyParty(['state.proposer', 'state.counterparty']),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISPUTED',
            disputedAt: { var: '$ordinal' },
            disputeReason: { var: 'event.reason' },
            disputedBy: { var: 'event.agent' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'DISPUTED',
      to: 'COMPLETED',
      eventName: 'resolve',
      // authority gate — an ARBITER/SLASHER attestation check layers on additively when the identity registry lands (see docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        or: [
          signerIsParty('state.arbitrator'),
          {
            and: [signerIsParty('state.proposer'), signerIsParty('state.counterparty')],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'COMPLETED',
            resolvedAt: { var: '$ordinal' },
            resolution: { var: 'event.resolution' },
            // rulingId is recorded only on the arbitrator-resolved path
            rulingId: {
              if: [signerIsParty('state.arbitrator'), { var: 'event.rulingId' }, null],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: signerIsAnyParty(['state.proposer', 'state.counterparty']),
      effect: {
        merge: [{ var: 'state' }, { status: 'CANCELLED', cancelledAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
  ],
});
