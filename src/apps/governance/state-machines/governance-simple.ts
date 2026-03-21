import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Simple org governance: manage members, update rules, resolve disputes.
 */
export const governanceSimpleDef = defineFiberApp({
  metadata: {
    name: 'GovernanceSimple',
    app: 'governance',
    type: 'simple',
    version: '1.0.0',
    description: 'Simple org governance: manage members, update rules, resolve disputes',
  },

  createSchema: {
    required: ['admins', 'passingThreshold'] as const,
    properties: {
      admins: { type: 'array', items: { type: 'address' } },
      passingThreshold: { type: 'number', description: 'Fraction required to pass (0-1)' },
      votingPeriodMs: { type: 'integer', default: 604800000 },
      disputeQuorum: { type: 'integer', default: 3 },
    },
  },

  stateSchema: {
    properties: {
      admins: { type: 'array' },
      members: { type: 'object' },
      rules: { type: 'object' },
      passingThreshold: { type: 'number' },
      votingPeriodMs: { type: 'integer' },
      disputeQuorum: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'VOTING', 'DISPUTE', 'DISSOLVED'] as const, computed: true },
      proposal: { type: 'object', computed: true },
      dispute: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      history: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    add_member: { required: ['agent', 'member', 'role'] as const, properties: { agent: { type: 'address' }, member: { type: 'address' }, role: { type: 'string' } } },
    remove_member: { required: ['agent', 'member'] as const, properties: { agent: { type: 'address' }, member: { type: 'address' } } },
    propose: { required: ['agent', 'proposalId', 'type', 'changes'] as const, properties: { agent: { type: 'address' }, proposalId: { type: 'string' }, type: { type: 'string' }, changes: { type: 'object' } } },
    vote: { required: ['agent', 'vote'] as const, properties: { agent: { type: 'address' }, vote: { type: 'string' } } },
    finalize: { required: ['forCount'] as const, properties: { forCount: { type: 'integer' } } },
    file_dispute: { required: ['agent', 'disputeId', 'defendant', 'claim'] as const, properties: { agent: { type: 'address' }, disputeId: { type: 'string' }, defendant: { type: 'address' }, claim: { type: 'string' } } },
    submit_evidence: { required: ['agent', 'content'] as const, properties: { agent: { type: 'address' }, content: { type: 'string' } } },
    resolve: { required: ['ruling', 'remedy'] as const, properties: { ruling: { type: 'string' }, remedy: { type: 'string' } } },
    dissolve: { required: ['approvalCount'] as const, properties: { approvalCount: { type: 'integer' } } },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    VOTING: { id: 'VOTING', isFinal: false },
    DISPUTE: { id: 'DISPUTE', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'add_member', guard: { in: [{ var: 'event.agent' }, { var: 'state.admins' }] }, effect: { merge: [{ var: 'state' }, { members: { setKey: [{ var: 'state.members' }, { var: 'event.member' }, { role: { var: 'event.role' }, addedAt: { var: '$timestamp' } }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'remove_member', guard: { in: [{ var: 'event.agent' }, { var: 'state.admins' }] }, effect: { merge: [{ var: 'state' }, { members: { deleteKey: [{ var: 'state.members' }, { var: 'event.member' }] } }] } },
    { from: 'ACTIVE', to: 'VOTING', eventName: 'propose', guard: { getKey: [{ var: 'state.members' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { proposal: { id: { var: 'event.proposalId' }, type: { var: 'event.type' }, changes: { var: 'event.changes' }, proposer: { var: 'event.agent' }, proposedAt: { var: '$timestamp' }, deadline: { '+': [{ var: '$timestamp' }, { var: 'state.votingPeriodMs' }] } }, votes: {} }] } },
    { from: 'VOTING', to: 'VOTING', eventName: 'vote', guard: { and: [{ getKey: [{ var: 'state.members' }, { var: 'event.agent' }] }, { '!': [{ getKey: [{ var: 'state.votes' }, { var: 'event.agent' }] }] }] }, effect: { merge: [{ var: 'state' }, { votes: { setKey: [{ var: 'state.votes' }, { var: 'event.agent' }, { vote: { var: 'event.vote' }, votedAt: { var: '$timestamp' } }] } }] } },
    { from: 'VOTING', to: 'ACTIVE', eventName: 'finalize', guard: { '>=': [{ var: 'event.forCount' }, { '*': [{ size: { var: 'state.members' } }, { var: 'state.passingThreshold' }] }] }, effect: { merge: [{ var: 'state' }, { rules: { merge: [{ var: 'state.rules' }, { var: 'state.proposal.changes' }] }, history: { cat: [{ var: 'state.history' }, [{ type: 'rule_change', proposal: { var: 'state.proposal' }, outcome: 'passed', finalizedAt: { var: '$timestamp' } }]] }, proposal: null, votes: {} }] } },
    { from: 'ACTIVE', to: 'DISPUTE', eventName: 'file_dispute', guard: { getKey: [{ var: 'state.members' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { dispute: { id: { var: 'event.disputeId' }, plaintiff: { var: 'event.agent' }, defendant: { var: 'event.defendant' }, claim: { var: 'event.claim' }, filedAt: { var: '$timestamp' }, evidence: [] }, votes: {} }] } },
    { from: 'DISPUTE', to: 'ACTIVE', eventName: 'resolve', guard: { '>=': [{ size: { var: 'state.votes' } }, { var: 'state.disputeQuorum' }] }, effect: { merge: [{ var: 'state' }, { history: { cat: [{ var: 'state.history' }, [{ type: 'dispute', dispute: { var: 'state.dispute' }, ruling: { var: 'event.ruling' }, remedy: { var: 'event.remedy' }, resolvedAt: { var: '$timestamp' } }]] }, dispute: null, votes: {} }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '>=': [{ var: 'event.approvalCount' }, { '*': [{ size: { var: 'state.members' } }, 0.9] }] }, effect: { merge: [{ var: 'state' }, { dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type SimpleGovernanceState = keyof typeof governanceSimpleDef.states;
export type SimpleGovernanceEvent = typeof governanceSimpleDef.transitions[number]['eventName'];
