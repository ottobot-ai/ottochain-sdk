import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Single owner controls all actions. Simplest governance model.
 */
export const daoSingleDef = defineFiberApp({
  metadata: {
    name: 'SingleOwnerDAO',
    app: 'governance',
    type: 'daoSingle',
    version: '1.0.0',
    description: 'Single owner controls all actions. Simplest governance model.',
  },

  createSchema: {
    required: ['owner'] as const,
    properties: { owner: { type: 'address', immutable: true } },
  },

  stateSchema: {
    properties: {
      owner: { type: 'address' },
      pendingOwner: { type: 'address', computed: true },
      actions: { type: 'array', computed: true },
      ownershipHistory: { type: 'array', computed: true },
      status: { type: 'string', enum: ['ACTIVE', 'TRANSFERRING', 'DISSOLVED'] as const, computed: true },
    },
  },

  eventSchemas: {
    execute: { required: ['agent', 'actionId', 'actionType', 'payload'] as const, properties: { agent: { type: 'address' }, actionId: { type: 'string' }, actionType: { type: 'string' }, payload: { type: 'object' } } },
    transfer_ownership: { required: ['agent', 'newOwner'] as const, properties: { agent: { type: 'address' }, newOwner: { type: 'address' } } },
    accept_ownership: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    cancel_transfer: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    dissolve: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    TRANSFERRING: { id: 'TRANSFERRING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'execute', guard: { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] }, effect: { merge: [{ var: 'state' }, { actions: { cat: [{ var: 'state.actions' }, [{ id: { var: 'event.actionId' }, type: { var: 'event.actionType' }, payload: { var: 'event.payload' }, executedAt: { var: '$timestamp' } }]] } }] } },
    { from: 'ACTIVE', to: 'TRANSFERRING', eventName: 'transfer_ownership', guard: { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] }, effect: { merge: [{ var: 'state' }, { pendingOwner: { var: 'event.newOwner' }, transferInitiatedAt: { var: '$timestamp' } }] } },
    { from: 'TRANSFERRING', to: 'ACTIVE', eventName: 'accept_ownership', guard: { '===': [{ var: 'event.agent' }, { var: 'state.pendingOwner' }] }, effect: { merge: [{ var: 'state' }, { owner: { var: 'state.pendingOwner' }, pendingOwner: null, ownershipHistory: { cat: [{ var: 'state.ownershipHistory' }, [{ from: { var: 'state.owner' }, to: { var: 'state.pendingOwner' }, at: { var: '$timestamp' } }]] } }] } },
    { from: 'TRANSFERRING', to: 'ACTIVE', eventName: 'cancel_transfer', guard: { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] }, effect: { merge: [{ var: 'state' }, { pendingOwner: null }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '===': [{ var: 'event.agent' }, { var: 'state.owner' }] }, effect: { merge: [{ var: 'state' }, { dissolvedAt: { var: '$timestamp' }, status: 'DISSOLVED' }] } },
  ],
});

export type DaoSingleState = keyof typeof daoSingleDef.states;
export type DaoSingleEvent = typeof daoSingleDef.transitions[number]['eventName'];
