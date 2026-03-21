import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Securities registry: tracks share classes, issuances, transfers, and cap table.
 */
export const corpSecuritiesDef = defineFiberApp({
  metadata: {
    name: 'CorporateSecurities',
    app: 'corporate',
    type: 'securities',
    version: '1.0.0',
    description: 'Securities registry: tracks share classes, issuances, transfers, and cap table',
  },

  createSchema: {
    required: ['entityId', 'authorizedShares'] as const,
    properties: {
      entityId: { type: 'uuid', description: 'Linked corporate entity' },
      authorizedShares: { type: 'integer', minimum: 1 },
    },
  },

  stateSchema: {
    properties: {
      entityId: { type: 'uuid' },
      authorizedShares: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'FROZEN', 'DISSOLVED'] as const, computed: true },
      shareClasses: { type: 'object', computed: true },
      issuedShares: { type: 'integer', computed: true },
      holders: { type: 'object', computed: true },
      transfers: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    create_class: { required: ['classId', 'name', 'votingRights', 'dividendRate'] as const, properties: { classId: { type: 'string' }, name: { type: 'string' }, votingRights: { type: 'boolean' }, dividendRate: { type: 'number' } } },
    issue: { required: ['recipient', 'classId', 'shares', 'pricePerShare'] as const, properties: { recipient: { type: 'address' }, classId: { type: 'string' }, shares: { type: 'integer' }, pricePerShare: { type: 'integer' } } },
    transfer: { required: ['from', 'to', 'classId', 'shares'] as const, properties: { from: { type: 'address' }, to: { type: 'address' }, classId: { type: 'string' }, shares: { type: 'integer' } } },
    authorize_more: { required: ['additionalShares'] as const, properties: { additionalShares: { type: 'integer' } } },
    freeze: { required: ['reason'] as const, properties: { reason: { type: 'string' } } },
    unfreeze: { description: 'Unfreeze securities' },
    dissolve: { description: 'Dissolve securities registry' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    FROZEN: { id: 'FROZEN', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'create_class', guard: { '!': [{ getKey: [{ var: 'state.shareClasses' }, { var: 'event.classId' }] }] }, effect: { merge: [{ var: 'state' }, { shareClasses: { setKey: [{ var: 'state.shareClasses' }, { var: 'event.classId' }, { name: { var: 'event.name' }, votingRights: { var: 'event.votingRights' }, dividendRate: { var: 'event.dividendRate' }, createdAt: { var: '$timestamp' } }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'issue', guard: { and: [{ getKey: [{ var: 'state.shareClasses' }, { var: 'event.classId' }] }, { '<=': [{ '+': [{ var: 'state.issuedShares' }, { var: 'event.shares' }] }, { var: 'state.authorizedShares' }] }] }, effect: { merge: [{ var: 'state' }, { issuedShares: { '+': [{ var: 'state.issuedShares' }, { var: 'event.shares' }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'transfer', guard: { getKey: [{ var: 'state.holders' }, { var: 'event.from' }] }, effect: { merge: [{ var: 'state' }, { transfers: { cat: [{ var: 'state.transfers' }, [{ from: { var: 'event.from' }, to: { var: 'event.to' }, classId: { var: 'event.classId' }, shares: { var: 'event.shares' }, transferredAt: { var: '$timestamp' } }]] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'authorize_more', guard: { '>': [{ var: 'event.additionalShares' }, 0] }, effect: { merge: [{ var: 'state' }, { authorizedShares: { '+': [{ var: 'state.authorizedShares' }, { var: 'event.additionalShares' }] } }] } },
    { from: 'ACTIVE', to: 'FROZEN', eventName: 'freeze', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'FROZEN', freezeReason: { var: 'event.reason' }, frozenAt: { var: '$timestamp' } }] } },
    { from: 'FROZEN', to: 'ACTIVE', eventName: 'unfreeze', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'ACTIVE', unfrozenAt: { var: '$timestamp' } }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type CorpSecuritiesState = keyof typeof corpSecuritiesDef.states;
export type CorpSecuritiesEvent = typeof corpSecuritiesDef.transitions[number]['eventName'];
