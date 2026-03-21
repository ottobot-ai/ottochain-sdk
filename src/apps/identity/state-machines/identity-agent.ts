import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Standard agent identity with reputation tracking, vouching, and lifecycle management.
 */
export const identityAgentDef = defineFiberApp({
  metadata: {
    name: 'IdentityAgent',
    app: 'identity',
    type: 'agent',
    version: '1.0.0',
    description: 'Standard agent identity with reputation tracking, vouching, and lifecycle management',
  },

  createSchema: {
    required: ['owner', 'displayName'] as const,
    properties: {
      owner: {
        type: 'address',
        description: 'Agent owner DAG address',
        immutable: true,
      },
      displayName: {
        type: 'string',
        maxLength: 64,
        description: 'Human-readable agent name',
      },
      bio: {
        type: 'string',
        maxLength: 256,
        default: '',
      },
      avatar: {
        type: 'uri',
        default: null,
      },
      platforms: {
        type: 'array',
        items: { $ref: '#/definitions/PlatformLink' },
        default: [],
      },
    },
  },

  stateSchema: {
    properties: {
      owner: { type: 'address', immutable: true },
      displayName: { type: 'string' },
      bio: { type: 'string' },
      avatar: { type: 'uri' },
      platforms: { type: 'array', items: { $ref: '#/definitions/PlatformLink' } },
      status: {
        type: 'string',
        enum: ['REGISTERED', 'ACTIVE', 'CHALLENGED', 'SUSPENDED', 'PROBATION', 'WITHDRAWN'] as const,
        computed: true,
      },
      reputation: { type: 'integer', default: 10, computed: true },
      activatedAt: { type: 'timestamp', computed: true },
      suspendedAt: { type: 'timestamp', computed: true },
      probationStartedAt: { type: 'timestamp', computed: true },
      challengedBy: { type: 'address', computed: true },
    },
  },

  eventSchemas: {
    activate: {
      description: 'Activate a registered agent',
    },
    receive_vouch: {
      description: 'Receive a vouch from another agent',
      required: ['from'] as const,
      properties: {
        from: { type: 'address', description: 'Address of vouching agent' },
        weight: { type: 'integer', minimum: 1, maximum: 10, default: 1 },
      },
    },
    receive_completion: {
      description: 'Receive completion attestation from a fiber',
    },
    challenge: {
      description: "Challenge an active agent's behavior",
      required: ['challenger', 'reason'] as const,
      properties: {
        challenger: { type: 'address' },
        reason: { type: 'string', maxLength: 512 },
        evidence: { type: 'array', items: { type: 'uri' } },
      },
    },
    dismiss_challenge: {
      description: 'Dismiss an active challenge',
    },
    uphold_challenge: {
      description: 'Uphold a challenge, suspending the agent',
    },
    begin_probation: {
      description: 'Move suspended agent to probation',
    },
    complete_probation: {
      description: 'Complete probation, reactivating the agent',
    },
    withdraw: {
      description: 'Permanently withdraw the agent',
    },
  },

  definitions: {
    PlatformLink: {
      type: 'object',
      required: ['platform', 'handle'] as const,
      properties: {
        platform: {
          type: 'string',
          enum: ['twitter', 'github', 'discord', 'telegram', 'moltbook'] as const,
        },
        handle: { type: 'string' },
        verified: { type: 'boolean', default: false },
      },
    },
  },

  states: {
    REGISTERED: { id: 'REGISTERED', isFinal: false },
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    CHALLENGED: { id: 'CHALLENGED', isFinal: false },
    SUSPENDED: { id: 'SUSPENDED', isFinal: false },
    PROBATION: { id: 'PROBATION', isFinal: false },
    WITHDRAWN: { id: 'WITHDRAWN', isFinal: true },
  },

  initialState: 'REGISTERED',

  transitions: [
    {
      from: 'REGISTERED',
      to: 'ACTIVE',
      eventName: 'activate',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', activatedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'receive_vouch',
      guard: { '!!': [{ var: 'event.from' }] },
      effect: {
        merge: [
          { var: 'state' },
          { reputation: { '+': [{ var: 'state.reputation' }, 2] } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'receive_completion',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { reputation: { '+': [{ var: 'state.reputation' }, 5] } },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'CHALLENGED',
      eventName: 'challenge',
      guard: { '!!': [{ var: 'event.challenger' }] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'CHALLENGED', challengedBy: { var: 'event.challenger' } },
        ],
      },
    },
    {
      from: 'CHALLENGED',
      to: 'ACTIVE',
      eventName: 'dismiss_challenge',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', challengedBy: null },
        ],
      },
    },
    {
      from: 'CHALLENGED',
      to: 'SUSPENDED',
      eventName: 'uphold_challenge',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'SUSPENDED', suspendedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'SUSPENDED',
      to: 'PROBATION',
      eventName: 'begin_probation',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'PROBATION', probationStartedAt: { var: '$timestamp' } },
        ],
      },
    },
    {
      from: 'PROBATION',
      to: 'ACTIVE',
      eventName: 'complete_probation',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'ACTIVE', probationStartedAt: null },
        ],
      },
    },
    {
      from: 'ACTIVE',
      to: 'WITHDRAWN',
      eventName: 'withdraw',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'WITHDRAWN' },
        ],
      },
    },
    {
      from: 'REGISTERED',
      to: 'WITHDRAWN',
      eventName: 'withdraw',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'WITHDRAWN' },
        ],
      },
    },
  ],
});

// Derived types for consumers
export type AgentState = keyof typeof identityAgentDef.states;
export type AgentEvent = typeof identityAgentDef.transitions[number]['eventName'];
