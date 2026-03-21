import { defineFiberApp } from '../../../schema/fiber-app.js';

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
  },

  createSchema: {
    required: ['proposer', 'counterparty', 'terms'] as const,
    properties: {
      proposer: { type: 'address', description: 'Proposing party', immutable: true },
      counterparty: { type: 'address', description: 'Counterparty', immutable: true },
      terms: { type: 'string', description: 'Contract terms', immutable: true },
      escrowId: { type: 'uuid', description: 'Linked escrow fiber' },
      arbitrationPoolId: { type: 'uuid', description: 'Arbitration pool for disputes' },
    },
  },

  stateSchema: {
    properties: {
      proposer: { type: 'address', immutable: true },
      counterparty: { type: 'address', immutable: true },
      terms: { type: 'string', immutable: true },
      escrowId: { type: 'uuid' },
      arbitrationPoolId: { type: 'uuid' },
      status: {
        type: 'string',
        enum: ['PROPOSED', 'ACTIVE', 'COMPLETED', 'DISPUTED', 'REJECTED', 'CANCELLED'] as const,
        computed: true,
      },
      completions: { type: 'array', computed: true },
      acceptedAt: { type: 'timestamp', computed: true },
      completedAt: { type: 'timestamp', computed: true },
      rejectedAt: { type: 'timestamp', computed: true },
      cancelledAt: { type: 'timestamp', computed: true },
      disputedAt: { type: 'timestamp', computed: true },
      disputeReason: { type: 'string', computed: true },
      disputedBy: { type: 'address', computed: true },
      resolvedAt: { type: 'timestamp', computed: true },
      resolution: { type: 'string', computed: true },
      rulingId: { type: 'uuid', computed: true },
    },
  },

  eventSchemas: {
    accept: {
      description: 'Counterparty accepts the contract',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
      },
    },
    reject: {
      description: 'Counterparty rejects the contract',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
        reason: { type: 'string' },
      },
    },
    cancel: {
      description: 'Proposer cancels the contract',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
      },
    },
    submit_completion: {
      description: 'Submit completion attestation',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
        proof: { type: 'string' },
      },
    },
    finalize: {
      description: 'Finalize contract after both parties submit completion',
    },
    dispute: {
      description: 'Raise a dispute',
      required: ['agent', 'reason'] as const,
      properties: {
        agent: { type: 'address' },
        reason: { type: 'string' },
      },
    },
    resolve: {
      description: 'Resolve a dispute',
      properties: {
        judicialRuling: { type: 'boolean' },
        proposerApproves: { type: 'boolean' },
        counterpartyApproves: { type: 'boolean' },
        resolution: { type: 'string' },
        rulingId: { type: 'uuid' },
      },
    },
  },

  states: {
    PROPOSED: { id: 'PROPOSED', isFinal: false },
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    COMPLETED: { id: 'COMPLETED', isFinal: true },
    DISPUTED: { id: 'DISPUTED', isFinal: false },
    REJECTED: { id: 'REJECTED', isFinal: true },
    CANCELLED: { id: 'CANCELLED', isFinal: true },
  },

  initialState: 'PROPOSED',

  transitions: [
    {
      from: 'PROPOSED',
      to: 'ACTIVE',
      eventName: 'accept',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.counterparty' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', acceptedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'REJECTED',
      eventName: 'reject',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.counterparty' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'REJECTED',
            rejectedAt: { var: '$timestamp' },
            rejectReason: { var: 'event.reason' },
          },
        ],
      },
    },
    {
      from: 'PROPOSED',
      to: 'CANCELLED',
      eventName: 'cancel',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.proposer' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CANCELLED', cancelledAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'submit_completion',
      guard: {
        and: [
          {
            or: [
              { '===': [{ var: 'event.agent' }, { var: 'state.proposer' }] },
              { '===': [{ var: 'event.agent' }, { var: 'state.counterparty' }] },
            ],
          },
          {
            '!': [{
              in: [
                { var: 'event.agent' },
                { map: [{ var: 'state.completions' }, { var: 'agent' }] },
              ],
            }],
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
                [{
                  agent: { var: 'event.agent' },
                  proof: { var: 'event.proof' },
                  submittedAt: { var: '$timestamp' },
                }],
              ],
            },
          },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'COMPLETED',
      eventName: 'finalize',
      guard: { '>=': [{ size: { var: 'state.completions' } }, 2] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'COMPLETED', completedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: {
        or: [
          { '===': [{ var: 'event.agent' }, { var: 'state.proposer' }] },
          { '===': [{ var: 'event.agent' }, { var: 'state.counterparty' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISPUTED',
            disputedAt: { var: '$timestamp' },
            disputeReason: { var: 'event.reason' },
            disputedBy: { var: 'event.agent' },
          },
        ],
      },
    },
    {
      from: 'DISPUTED',
      to: 'COMPLETED',
      eventName: 'resolve',
      guard: {
        or: [
          { var: 'event.judicialRuling' },
          {
            and: [
              { '===': [{ var: 'event.proposerApproves' }, true] },
              { '===': [{ var: 'event.counterpartyApproves' }, true] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'COMPLETED',
            resolvedAt: { var: '$timestamp' },
            resolution: { var: 'event.resolution' },
            rulingId: { var: 'event.rulingId' },
          },
        ],
      },
    },
  ],
});

export type AgreementState = keyof typeof contractAgreementDef.states;
export type AgreementEvent = typeof contractAgreementDef.transitions[number]['eventName'];
