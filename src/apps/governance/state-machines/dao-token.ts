import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Token-weighted voting governance. Voting power proportional to token holdings.
 */
export const daoTokenDef = defineFiberApp({
  metadata: {
    name: 'TokenDAO',
    app: 'governance',
    type: 'daoToken',
    version: '1.0.0',
    description: 'Token-weighted voting governance. Voting power proportional to token holdings.',
  },

  createSchema: {
    required: ['tokenId', 'quorumPercent', 'passingPercent'] as const,
    properties: {
      tokenId: { type: 'uuid', description: 'Governance token fiber ID' },
      quorumPercent: { type: 'integer', minimum: 1, maximum: 100 },
      passingPercent: { type: 'integer', minimum: 1, maximum: 100 },
      votingPeriodMs: { type: 'integer', default: 604800000 },
      proposalThreshold: { type: 'integer', description: 'Min tokens to propose' },
    },
  },

  stateSchema: {
    properties: {
      tokenId: { type: 'uuid' },
      quorumPercent: { type: 'integer' },
      passingPercent: { type: 'integer' },
      votingPeriodMs: { type: 'integer' },
      proposalThreshold: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'VOTING', 'DISSOLVED'] as const, computed: true },
      proposal: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      forVotes: { type: 'integer', computed: true },
      againstVotes: { type: 'integer', computed: true },
      proposalHistory: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    propose: { required: ['agent', 'proposalId', 'title', 'description', 'actions'] as const, properties: { agent: { type: 'address' }, proposalId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' }, actions: { type: 'array' } } },
    vote: { required: ['agent', 'support', 'weight'] as const, properties: { agent: { type: 'address' }, support: { type: 'boolean' }, weight: { type: 'integer' } } },
    finalize: { required: ['totalSupply'] as const, properties: { totalSupply: { type: 'integer' } } },
    cancel: { required: ['agent'] as const, properties: { agent: { type: 'address' } } },
    dissolve: { required: ['approvalWeight', 'totalSupply'] as const, properties: { approvalWeight: { type: 'integer' }, totalSupply: { type: 'integer' } } },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    VOTING: { id: 'VOTING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'VOTING', eventName: 'propose', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { proposal: { id: { var: 'event.proposalId' }, title: { var: 'event.title' }, description: { var: 'event.description' }, actions: { var: 'event.actions' }, proposer: { var: 'event.agent' }, proposedAt: { var: '$timestamp' }, deadline: { '+': [{ var: '$timestamp' }, { var: 'state.votingPeriodMs' }] } }, votes: {}, forVotes: 0, againstVotes: 0 }] } },
    { from: 'VOTING', to: 'VOTING', eventName: 'vote', guard: { '!': [{ getKey: [{ var: 'state.votes' }, { var: 'event.agent' }] }] }, effect: { merge: [{ var: 'state' }, { votes: { setKey: [{ var: 'state.votes' }, { var: 'event.agent' }, { support: { var: 'event.support' }, weight: { var: 'event.weight' }, votedAt: { var: '$timestamp' } }] }, forVotes: { if: [{ var: 'event.support' }, { '+': [{ var: 'state.forVotes' }, { var: 'event.weight' }] }, { var: 'state.forVotes' }] }, againstVotes: { if: [{ '!': [{ var: 'event.support' }] }, { '+': [{ var: 'state.againstVotes' }, { var: 'event.weight' }] }, { var: 'state.againstVotes' }] } }] } },
    { from: 'VOTING', to: 'ACTIVE', eventName: 'finalize', guard: { '>=': [{ '+': [{ var: 'state.forVotes' }, { var: 'state.againstVotes' }] }, { '*': [{ var: 'event.totalSupply' }, { '/': [{ var: 'state.quorumPercent' }, 100] }] }] }, effect: { merge: [{ var: 'state' }, { proposalHistory: { cat: [{ var: 'state.proposalHistory' }, [{ proposal: { var: 'state.proposal' }, forVotes: { var: 'state.forVotes' }, againstVotes: { var: 'state.againstVotes' }, passed: { '>=': [{ var: 'state.forVotes' }, { '*': [{ '+': [{ var: 'state.forVotes' }, { var: 'state.againstVotes' }] }, { '/': [{ var: 'state.passingPercent' }, 100] }] }] }, finalizedAt: { var: '$timestamp' } }]] }, proposal: null, votes: {}, forVotes: 0, againstVotes: 0 }] } },
    { from: 'VOTING', to: 'ACTIVE', eventName: 'cancel', guard: { '===': [{ var: 'event.agent' }, { var: 'state.proposal.proposer' }] }, effect: { merge: [{ var: 'state' }, { proposal: null, votes: {}, forVotes: 0, againstVotes: 0 }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '>=': [{ var: 'event.approvalWeight' }, { '*': [{ var: 'event.totalSupply' }, 0.9] }] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type DaoTokenState = keyof typeof daoTokenDef.states;
export type DaoTokenEvent = typeof daoTokenDef.transitions[number]['eventName'];
