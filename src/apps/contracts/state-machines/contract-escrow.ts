import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty } from '../../../schema/guards.js';

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
    crossReferences: {
      contractId: {
        machine: 'contract-agreement',
        field: 'contractId',
        description: 'Links to Contract SM that created this escrow',
      },
      marketId: {
        machine: 'market-universal',
        field: 'marketId',
        description: 'Links to Market SM for market-based escrow',
      },
      insuranceId: {
        machine: 'insurance',
        field: 'insuranceId',
        description: 'Links to Insurance SM for protected escrow',
      },
      arbitrationPoolId: {
        machine: 'arbitration-pool',
        field: 'arbitrationPoolId',
        description: 'Links to ArbitrationPool for dispute resolution',
      },
      treasuryId: {
        machine: 'treasury',
        field: 'treasuryId',
        description: 'Links to Treasury for fee collection',
      },
    },
  },

  createSchema: {
    required: ['depositor', 'beneficiary', 'requiredAmount', 'arbiter'] as const,
    properties: {
      depositor: {
        type: 'address',
        description: 'DAG address of the depositor',
      },
      beneficiary: {
        type: 'address',
        description: 'DAG address of the beneficiary',
      },
      arbiter: {
        type: 'address',
        description: 'DAG address of the arbiter authorized to rule on a dispute',
        immutable: true,
      },
      requiredAmount: {
        type: 'number',
        minimum: 0,
        description: 'Required escrow amount',
      },
      releaseWindowMs: {
        type: 'integer',
        description: 'Time window for dispute before auto-release',
        nullable: true,
      },
      expiresAt: {
        type: 'integer',
        description: 'Timestamp when escrow expires',
        nullable: true,
      },
      autoActivate: {
        type: 'boolean',
        description: 'Whether to auto-activate on funding',
        nullable: true,
      },
    },
  },

  stateSchema: {
    properties: {
      depositor: { type: 'address' },
      beneficiary: { type: 'address' },
      arbiter: { type: 'address', immutable: true },
      requiredAmount: { type: 'number' },
      balance: { type: 'number' },
      fundedAt: { type: 'integer', nullable: true },
      activatedAt: { type: 'integer', nullable: true },
      releaseRequest: { type: 'object', nullable: true },
      releaseDeadline: { type: 'integer', nullable: true },
      releasedAt: { type: 'integer', nullable: true },
      releasedTo: { type: 'address', nullable: true },
      disputedAt: { type: 'integer', nullable: true },
      refundedAt: { type: 'integer', nullable: true },
      splits: { type: 'array', nullable: true },
      rulingId: { type: 'string', nullable: true },
      releaseWindowMs: { type: 'integer', nullable: true },
      expiresAt: { type: 'integer', nullable: true },
      autoActivate: { type: 'boolean', nullable: true },
    },
  },

  eventSchemas: {
    deposit: {
      properties: {
        amount: { type: 'number' },
      },
    },
    activate: {},
    request_release: {
      properties: {
        amount: { type: 'number' },
        reason: { type: 'string', nullable: true },
      },
    },
    approve_release: {},
    dispute: {},
    ruling: {
      properties: {
        splits: { type: 'array' },
        rulingId: { type: 'string' },
      },
    },
    refund: {},
    cancel: {},
  },

  states: {
    CREATED: {
      id: 'CREATED',
      isFinal: false,
      metadata: {
        label: 'Created',
        description: 'Escrow created; awaiting funding',
        category: 'initial',
      },
    },
    FUNDED: {
      id: 'FUNDED',
      isFinal: false,
      metadata: {
        label: 'Funded',
        description: 'Funds deposited into escrow',
        category: 'active',
      },
    },
    ACTIVE: {
      id: 'ACTIVE',
      isFinal: false,
      metadata: {
        label: 'Active',
        description: 'Escrow in effect while work is performed',
        category: 'active',
      },
    },
    RELEASING: {
      id: 'RELEASING',
      isFinal: false,
      metadata: {
        label: 'Releasing',
        description: 'Release approved; payout in progress',
        category: 'pending',
      },
    },
    DISPUTED: {
      id: 'DISPUTED',
      isFinal: false,
      metadata: {
        label: 'Disputed',
        description: 'A party disputed the escrow; awaiting arbitration',
        category: 'pending',
      },
    },
    RELEASED: {
      id: 'RELEASED',
      isFinal: true,
      metadata: {
        label: 'Released',
        description: 'Funds released to the beneficiary (terminal)',
        category: 'terminal',
      },
    },
    REFUNDED: {
      id: 'REFUNDED',
      isFinal: true,
      metadata: {
        label: 'Refunded',
        description: 'Funds refunded to the depositor (terminal)',
        category: 'terminal',
      },
    },
    SPLIT: {
      id: 'SPLIT',
      isFinal: true,
      metadata: {
        label: 'Split',
        description: 'Funds split between parties per arbitration (terminal)',
        category: 'terminal',
      },
    },
  },

  initialState: 'CREATED',

  transitions: [
    {
      from: 'CREATED',
      to: 'FUNDED',
      eventName: 'deposit',
      guard: {
        and: [signerIsParty('state.depositor'), { '>=': [{ var: 'event.amount' }, { var: 'state.requiredAmount' }] }],
      },
      effect: {
        merge: [{ var: 'state' }, { balance: { var: 'event.amount' }, fundedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'FUNDED',
      to: 'ACTIVE',
      eventName: 'activate',
      guard: {
        or: [signerIsParty('state.beneficiary'), { var: 'state.autoActivate' }],
      },
      effect: {
        merge: [{ var: 'state' }, { activatedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'RELEASING',
      eventName: 'request_release',
      guard: signerIsParty('state.beneficiary'),
      effect: {
        merge: [
          { var: 'state' },
          {
            releaseRequest: {
              requestedBy: { var: 'event.agent' },
              amount: { var: 'event.amount' },
              reason: { var: 'event.reason' },
              requestedAt: { var: '$ordinal' },
            },
            releaseDeadline: {
              '+': [{ var: '$ordinal' }, { var: 'state.releaseWindowMs' }],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RELEASING',
      to: 'RELEASED',
      eventName: 'approve_release',
      guard: {
        or: [signerIsParty('state.depositor'), { '>=': [{ var: '$ordinal' }, { var: 'state.releaseDeadline' }] }],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            releasedAt: { var: '$ordinal' },
            releasedTo: { var: 'state.beneficiary' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'RELEASING',
      to: 'DISPUTED',
      eventName: 'dispute',
      guard: {
        and: [signerIsParty('state.depositor'), { '<': [{ var: '$ordinal' }, { var: 'state.releaseDeadline' }] }],
      },
      effect: {
        merge: [
          { var: 'state' },
          { disputedAt: { var: '$ordinal' } },
          {
            // A3 fix: transition-level `spawns` is dropped by the chain. No Judiciary state machine is
            // defined to inline under `_spawn`, and escrow already resolves disputes via its own pinned
            // `arbiter` (the `ruling` transition) — the spawned Judiciary was fire-and-forget (never read
            // by escrow). So the dispute case is surfaced to the judiciary subsystem as an `_emit`
            // notification instead of a child fiber.
            _emit: [
              {
                name: 'dispute_opened',
                data: {
                  caseType: 'escrow_dispute',
                  plaintiff: { var: 'state.depositor' },
                  defendant: { var: 'state.beneficiary' },
                  claim: {
                    escrowId: { var: 'machineId' },
                    amount: { var: 'state.balance' },
                  },
                },
                destination: 'Judiciary',
              },
            ],
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'DISPUTED',
      to: 'SPLIT',
      eventName: 'ruling',
      // authority gate — an ARBITER/SLASHER attestation check layers on additively when the identity registry lands (see docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.arbiter'),
          {
            '===': [
              {
                reduce: [
                  { var: 'event.splits' },
                  {
                    '+': [{ var: 'accumulator' }, { var: 'current.amount' }],
                  },
                  0,
                ],
              },
              { var: 'state.balance' },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            splits: { var: 'event.splits' },
            rulingId: { var: 'event.rulingId' },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: 'ACTIVE',
      to: 'REFUNDED',
      eventName: 'refund',
      // authority gate — an ARBITER/SLASHER attestation check layers on additively when the identity registry lands (see docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        or: [
          {
            and: [signerIsParty('state.depositor'), signerIsParty('state.beneficiary')],
          },
          { '>=': [{ var: '$ordinal' }, { var: 'state.expiresAt' }] },
        ],
      },
      effect: {
        merge: [{ var: 'state' }, { refundedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
    {
      from: 'CREATED',
      to: 'REFUNDED',
      eventName: 'cancel',
      guard: signerIsParty('state.depositor'),
      effect: {
        merge: [{ var: 'state' }, { refundedAt: { var: '$ordinal' } }],
      },
      dependencies: [],
    },
  ],
});
