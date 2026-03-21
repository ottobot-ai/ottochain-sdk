import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Asset custody with conditional release, dispute resolution, and split payments.
 */
export const contractEscrowDef = defineFiberApp({
  metadata: {
    name: 'ContractEscrow',
    app: 'contracts',
    type: 'escrow',
    version: '1.0.0',
    description: 'Asset custody with conditional release, dispute resolution, and split payments',
  },

  createSchema: {
    required: ['depositor', 'beneficiary', 'requiredAmount'] as const,
    properties: {
      depositor: { type: 'address', description: 'Party depositing funds', immutable: true },
      beneficiary: { type: 'address', description: 'Party receiving funds', immutable: true },
      requiredAmount: { type: 'integer', minimum: 1, description: 'Required deposit amount' },
      releaseWindowMs: { type: 'integer', default: 86400000, description: 'Release approval window (ms)' },
      expiresAt: { type: 'timestamp', description: 'Escrow expiration' },
      autoActivate: { type: 'boolean', default: false },
      contractId: { type: 'uuid', description: 'Linked contract fiber' },
      arbitrationPoolId: { type: 'uuid', description: 'Arbitration pool for disputes' },
    },
  },

  stateSchema: {
    properties: {
      depositor: { type: 'address', immutable: true },
      beneficiary: { type: 'address', immutable: true },
      requiredAmount: { type: 'integer' },
      releaseWindowMs: { type: 'integer' },
      expiresAt: { type: 'timestamp' },
      autoActivate: { type: 'boolean' },
      contractId: { type: 'uuid' },
      arbitrationPoolId: { type: 'uuid' },
      balance: { type: 'integer', computed: true },
      fundedAt: { type: 'timestamp', computed: true },
      activatedAt: { type: 'timestamp', computed: true },
      releaseRequest: { type: 'object', computed: true },
      releaseDeadline: { type: 'timestamp', computed: true },
      releasedAt: { type: 'timestamp', computed: true },
      releasedTo: { type: 'address', computed: true },
      disputedAt: { type: 'timestamp', computed: true },
      refundedAt: { type: 'timestamp', computed: true },
      splits: { type: 'array', computed: true },
      rulingId: { type: 'uuid', computed: true },
    },
  },

  eventSchemas: {
    deposit: {
      description: 'Deposit funds into escrow',
      required: ['agent', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        amount: { type: 'integer', minimum: 1 },
      },
    },
    activate: {
      description: 'Activate the escrow',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
      },
    },
    request_release: {
      description: 'Request fund release',
      required: ['agent', 'amount'] as const,
      properties: {
        agent: { type: 'address' },
        amount: { type: 'integer' },
        reason: { type: 'string' },
      },
    },
    approve_release: {
      description: 'Approve release request',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
      },
    },
    dispute: {
      description: 'Dispute the release',
      required: ['agent'] as const,
      properties: {
        agent: { type: 'address' },
      },
    },
    ruling: {
      description: 'Judicial ruling on dispute',
      required: ['judicialRuling', 'splits', 'rulingId'] as const,
      properties: {
        judicialRuling: { type: 'boolean' },
        splits: { type: 'array' },
        rulingId: { type: 'uuid' },
      },
    },
    refund: {
      description: 'Refund to depositor',
      properties: {
        mutualConsent: { type: 'boolean' },
      },
    },
  },

  states: {
    CREATED: { id: 'CREATED', isFinal: false },
    FUNDED: { id: 'FUNDED', isFinal: false },
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    RELEASING: { id: 'RELEASING', isFinal: false },
    DISPUTED: { id: 'DISPUTED', isFinal: false },
    RELEASED: { id: 'RELEASED', isFinal: true },
    REFUNDED: { id: 'REFUNDED', isFinal: true },
    SPLIT: { id: 'SPLIT', isFinal: true },
  },

  initialState: 'CREATED',

  transitions: [
    {
      from: 'CREATED',
      to: 'FUNDED',
      eventName: 'deposit',
      guard: {
        and: [
          { '===': [{ var: 'event.agent' }, { var: 'state.depositor' }] },
          { '>=': [{ var: 'event.amount' }, { var: 'state.requiredAmount' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { balance: { var: 'event.amount' }, fundedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'FUNDED',
      to: 'ACTIVE',
      eventName: 'activate',
      guard: {
        or: [
          { '===': [{ var: 'event.agent' }, { var: 'state.beneficiary' }] },
          { var: 'state.autoActivate' },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { activatedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'RELEASING',
      eventName: 'request_release',
      guard: { '===': [{ var: 'event.agent' }, { var: 'state.beneficiary' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            releaseRequest: {
              requestedBy: { var: 'event.agent' },
              amount: { var: 'event.amount' },
              reason: { var: 'event.reason' },
              requestedAt: { var: '$timestamp' },
            },
            releaseDeadline: { '+': [{ var: '$timestamp' }, { var: 'state.releaseWindowMs' }] },
          },
        ],
      },
    },
    {
      from: 'RELEASING',
      to: 'RELEASED',
      eventName: 'approve_release',
      guard: {
        or: [
          { '===': [{ var: 'event.agent' }, { var: 'state.depositor' }] },
          { '>=': [{ var: '$timestamp' }, { var: 'state.releaseDeadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { releasedAt: { var: '$timestamp' }, releasedTo: { var: 'state.beneficiary' } },
        ],
      },
    },
    {
      from: 'RELEASING',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: {
        and: [
          { '===': [{ var: 'event.agent' }, { var: 'state.depositor' }] },
          { '<': [{ var: '$timestamp' }, { var: 'state.releaseDeadline' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { disputedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'DISPUTED',
      to: 'SPLIT',
      eventName: 'ruling',
      guard: { var: 'event.judicialRuling' },
      effect: {
        merge: [
          { var: 'state' },
          { splits: { var: 'event.splits' }, rulingId: { var: 'event.rulingId' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'REFUNDED',
      eventName: 'refund',
      guard: {
        or: [
          { var: 'event.mutualConsent' },
          { '>=': [{ var: '$timestamp' }, { var: 'state.expiresAt' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          { refundedAt: { var: '$timestamp' } },
        ],
      },
    },
  ],
});

export type EscrowState = keyof typeof contractEscrowDef.states;
export type EscrowEvent = typeof contractEscrowDef.transitions[number]['eventName'];
