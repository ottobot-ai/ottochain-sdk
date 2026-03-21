import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * N-of-M multisig governance. Requires threshold signatures for actions.
 */
export const daoMultisigDef = defineFiberApp({
  metadata: {
    name: 'MultisigDAO',
    app: 'governance',
    type: 'daoMultisig',
    version: '1.0.0',
    description: 'N-of-M multisig governance. Requires threshold signatures for actions.',
  },

  createSchema: {
    required: ['signers', 'threshold'] as const,
    properties: {
      signers: { type: 'array', items: { type: 'address' } },
      threshold: { type: 'integer', minimum: 1, description: 'Required signatures' },
    },
  },

  stateSchema: {
    properties: {
      signers: { type: 'array' },
      threshold: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'DISSOLVED'] as const, computed: true },
      proposal: { type: 'object', computed: true },
      signatures: { type: 'array', computed: true },
      executedActions: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    propose: { required: ['agent', 'proposalId', 'actionType', 'payload'] as const, properties: { agent: { type: 'address' }, proposalId: { type: 'string' }, actionType: { type: 'string' }, payload: { type: 'object' } } },
    sign: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    execute: { description: 'Execute after threshold reached' },
    cancel: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    add_signer: { required: ['newSigner'] as const, properties: { newSigner: { type: 'address' } } },
    remove_signer: { required: ['signer'] as const, properties: { signer: { type: 'address' } } },
    change_threshold: { required: ['newThreshold'] as const, properties: { newThreshold: { type: 'integer' } } },
    dissolve: { description: 'Dissolve the DAO' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    PENDING: { id: 'PENDING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'PENDING', eventName: 'propose', guard: { in: [{ var: 'event.agent' }, { var: 'state.signers' }] }, effect: { merge: [{ var: 'state' }, { proposal: { id: { var: 'event.proposalId' }, actionType: { var: 'event.actionType' }, payload: { var: 'event.payload' }, proposer: { var: 'event.agent' }, proposedAt: { var: '$timestamp' } }, signatures: [{ var: 'event.agent' }] }] } },
    { from: 'PENDING', to: 'PENDING', eventName: 'sign', guard: { and: [{ in: [{ var: 'event.agent' }, { var: 'state.signers' }] }, { '!': [{ in: [{ var: 'event.agent' }, { var: 'state.signatures' }] }] }] }, effect: { merge: [{ var: 'state' }, { signatures: { cat: [{ var: 'state.signatures' }, [{ var: 'event.agent' }]] } }] } },
    { from: 'PENDING', to: 'ACTIVE', eventName: 'execute', guard: { '>=': [{ size: { var: 'state.signatures' } }, { var: 'state.threshold' }] }, effect: { merge: [{ var: 'state' }, { executedActions: { cat: [{ var: 'state.executedActions' }, [{ proposal: { var: 'state.proposal' }, executedAt: { var: '$timestamp' }, signatures: { var: 'state.signatures' } }]] }, proposal: null, signatures: [] }] } },
    { from: 'PENDING', to: 'ACTIVE', eventName: 'cancel', guard: { '===': [{ var: 'event.agent' }, { var: 'state.proposal.proposer' }] }, effect: { merge: [{ var: 'state' }, { proposal: null, signatures: [] }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '>=': [{ size: { var: 'state.signers' } }, { var: 'state.threshold' }] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type DaoMultisigState = keyof typeof daoMultisigDef.states;
export type DaoMultisigEvent = typeof daoMultisigDef.transitions[number]['eventName'];
