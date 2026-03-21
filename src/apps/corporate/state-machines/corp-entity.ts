import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Corporate entity: tracks incorporation, status, and linked governance structures.
 */
export const corpEntityDef = defineFiberApp({
  metadata: {
    name: 'CorporateEntity',
    app: 'corporate',
    type: 'entity',
    version: '1.0.0',
    description: 'Corporate entity: tracks incorporation, status, and linked governance structures',
  },

  createSchema: {
    required: ['name', 'incorporator', 'jurisdiction'] as const,
    properties: {
      name: { type: 'string', immutable: true },
      incorporator: { type: 'address', immutable: true },
      jurisdiction: { type: 'string' },
      entityType: { type: 'string', enum: ['corporation', 'llc', 'partnership', 'cooperative'] as const },
      registeredAgent: { type: 'address' },
    },
  },

  stateSchema: {
    properties: {
      name: { type: 'string', immutable: true },
      incorporator: { type: 'address', immutable: true },
      jurisdiction: { type: 'string' },
      entityType: { type: 'string' },
      registeredAgent: { type: 'address' },
      status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'DISSOLVED'] as const, computed: true },
      boardId: { type: 'uuid', computed: true },
      shareholdersId: { type: 'uuid', computed: true },
      securitiesId: { type: 'uuid', computed: true },
      incorporatedAt: { type: 'timestamp', computed: true },
    },
  },

  eventSchemas: {
    incorporate: { description: 'Complete incorporation', required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    link_board: { required: ['boardId'] as const, properties: { boardId: { type: 'uuid' } } },
    link_shareholders: { required: ['shareholdersId'] as const, properties: { shareholdersId: { type: 'uuid' } } },
    link_securities: { required: ['securitiesId'] as const, properties: { securitiesId: { type: 'uuid' } } },
    update_agent: { required: ['agent', 'newAgent'] as const, properties: { agent: { type: 'address' }, newAgent: { type: 'address' } } },
    suspend: { required: ['reason'] as const, properties: { reason: { type: 'string' } } },
    reinstate: { description: 'Reinstate suspended entity' },
    dissolve: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
  },

  states: {
    PENDING: { id: 'PENDING', isFinal: false },
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    SUSPENDED: { id: 'SUSPENDED', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'PENDING',

  transitions: [
    { from: 'PENDING', to: 'ACTIVE', eventName: 'incorporate', guard: { '===': [{ var: 'event.agent' }, { var: 'state.incorporator' }] }, effect: { merge: [{ var: 'state' }, { status: 'ACTIVE', incorporatedAt: { var: '$timestamp' } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'link_board', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { boardId: { var: 'event.boardId' } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'link_shareholders', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { shareholdersId: { var: 'event.shareholdersId' } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'link_securities', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { securitiesId: { var: 'event.securitiesId' } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'update_agent', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { registeredAgent: { var: 'event.newAgent' } }] } },
    { from: 'ACTIVE', to: 'SUSPENDED', eventName: 'suspend', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'SUSPENDED', suspendReason: { var: 'event.reason' }, suspendedAt: { var: '$timestamp' } }] } },
    { from: 'SUSPENDED', to: 'ACTIVE', eventName: 'reinstate', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'ACTIVE', reinstatedAt: { var: '$timestamp' } }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type CorpEntityState = keyof typeof corpEntityDef.states;
export type CorpEntityEvent = typeof corpEntityDef.transitions[number]['eventName'];
