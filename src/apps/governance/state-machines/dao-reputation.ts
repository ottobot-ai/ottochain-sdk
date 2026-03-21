import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Reputation-weighted voting governance. Voting power based on earned reputation.
 */
export const daoReputationDef = defineFiberApp({
  metadata: {
    name: 'ReputationDAO',
    app: 'governance',
    type: 'daoReputation',
    version: '1.0.0',
    description: 'Reputation-weighted voting governance. Voting power based on earned reputation.',
  },

  createSchema: {
    required: ['quorumPercent', 'passingPercent'] as const,
    properties: {
      quorumPercent: { type: 'integer', minimum: 1, maximum: 100 },
      passingPercent: { type: 'integer', minimum: 1, maximum: 100 },
      votingPeriodMs: { type: 'integer', default: 604800000 },
      reputationDecayRate: { type: 'number', description: 'Daily decay rate (0-1)' },
    },
  },

  stateSchema: {
    properties: {
      quorumPercent: { type: 'integer' },
      passingPercent: { type: 'integer' },
      votingPeriodMs: { type: 'integer' },
      reputationDecayRate: { type: 'number' },
      status: { type: 'string', enum: ['ACTIVE', 'VOTING', 'DISSOLVED'] as const, computed: true },
      members: { type: 'object', computed: true },
      totalReputation: { type: 'integer', computed: true },
      proposal: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      forVotes: { type: 'integer', computed: true },
      againstVotes: { type: 'integer', computed: true },
    },
  },

  eventSchemas: {
    add_member: { required: ['member', 'initialReputation'] as const, properties: { member: { type: 'address' }, initialReputation: { type: 'integer' } } },
    award_reputation: { required: ['member', 'amount', 'reason'] as const, properties: { member: { type: 'address' }, amount: { type: 'integer' }, reason: { type: 'string' } } },
    slash_reputation: { required: ['member', 'amount', 'reason'] as const, properties: { member: { type: 'address' }, amount: { type: 'integer' }, reason: { type: 'string' } } },
    propose: { required: ['agent', 'proposalId', 'title', 'actions'] as const, properties: { agent: { type: 'address' }, proposalId: { type: 'string' }, title: { type: 'string' }, actions: { type: 'array' } } },
    vote: { required: ['agent', 'support'] as const, properties: { agent: { type: 'address' }, support: { type: 'boolean' } } },
    finalize: { description: 'Finalize voting' },
    dissolve: { description: 'Dissolve the DAO' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    VOTING: { id: 'VOTING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'add_member', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { members: { setKey: [{ var: 'state.members' }, { var: 'event.member' }, { reputation: { var: 'event.initialReputation' }, joinedAt: { var: '$timestamp' } }] }, totalReputation: { '+': [{ var: 'state.totalReputation' }, { var: 'event.initialReputation' }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'award_reputation', guard: { getKey: [{ var: 'state.members' }, { var: 'event.member' }] }, effect: { merge: [{ var: 'state' }, { totalReputation: { '+': [{ var: 'state.totalReputation' }, { var: 'event.amount' }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'slash_reputation', guard: { getKey: [{ var: 'state.members' }, { var: 'event.member' }] }, effect: { merge: [{ var: 'state' }, { totalReputation: { '-': [{ var: 'state.totalReputation' }, { var: 'event.amount' }] } }] } },
    { from: 'ACTIVE', to: 'VOTING', eventName: 'propose', guard: { getKey: [{ var: 'state.members' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { proposal: { id: { var: 'event.proposalId' }, title: { var: 'event.title' }, actions: { var: 'event.actions' }, proposer: { var: 'event.agent' }, proposedAt: { var: '$timestamp' }, deadline: { '+': [{ var: '$timestamp' }, { var: 'state.votingPeriodMs' }] } }, votes: {}, forVotes: 0, againstVotes: 0 }] } },
    { from: 'VOTING', to: 'VOTING', eventName: 'vote', guard: { and: [{ getKey: [{ var: 'state.members' }, { var: 'event.agent' }] }, { '!': [{ getKey: [{ var: 'state.votes' }, { var: 'event.agent' }] }] }] }, effect: { merge: [{ var: 'state' }, { votes: { setKey: [{ var: 'state.votes' }, { var: 'event.agent' }, { support: { var: 'event.support' }, votedAt: { var: '$timestamp' } }] } }] } },
    { from: 'VOTING', to: 'ACTIVE', eventName: 'finalize', guard: { '>=': [{ '+': [{ var: 'state.forVotes' }, { var: 'state.againstVotes' }] }, { '*': [{ var: 'state.totalReputation' }, { '/': [{ var: 'state.quorumPercent' }, 100] }] }] }, effect: { merge: [{ var: 'state' }, { proposal: null, votes: {}, forVotes: 0, againstVotes: 0 }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type DaoReputationState = keyof typeof daoReputationDef.states;
export type DaoReputationEvent = typeof daoReputationDef.transitions[number]['eventName'];
