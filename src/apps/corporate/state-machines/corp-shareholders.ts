import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Shareholder registry: tracks shareholders, voting rights, and shareholder meetings.
 */
export const corpShareholdersDef = defineFiberApp({
  metadata: {
    name: 'CorporateShareholders',
    app: 'corporate',
    type: 'shareholders',
    version: '1.0.0',
    description: 'Shareholder registry: tracks shareholders, voting rights, and shareholder meetings',
  },

  createSchema: {
    required: ['entityId', 'totalShares'] as const,
    properties: {
      entityId: { type: 'uuid', description: 'Linked corporate entity' },
      totalShares: { type: 'integer', minimum: 1 },
      votingQuorumPercent: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
  },

  stateSchema: {
    properties: {
      entityId: { type: 'uuid' },
      totalShares: { type: 'integer' },
      votingQuorumPercent: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'MEETING', 'DISSOLVED'] as const, computed: true },
      shareholders: { type: 'object', computed: true },
      currentMeeting: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      meetings: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    register_shareholder: { required: ['shareholder', 'shares'] as const, properties: { shareholder: { type: 'address' }, shares: { type: 'integer' } } },
    transfer_shares: { required: ['from', 'to', 'shares'] as const, properties: { from: { type: 'address' }, to: { type: 'address' }, shares: { type: 'integer' } } },
    call_meeting: { required: ['agent', 'meetingType', 'agenda'] as const, properties: { agent: { type: 'address' }, meetingType: { type: 'string', enum: ['annual', 'special'] as const }, agenda: { type: 'array' } } },
    vote: { required: ['agent', 'support'] as const, properties: { agent: { type: 'address' }, support: { type: 'boolean' } } },
    adjourn: { description: 'Adjourn meeting' },
    dissolve: { description: 'Dissolve shareholder registry' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    MEETING: { id: 'MEETING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'register_shareholder', guard: { '>': [{ var: 'event.shares' }, 0] }, effect: { merge: [{ var: 'state' }, { shareholders: { setKey: [{ var: 'state.shareholders' }, { var: 'event.shareholder' }, { shares: { var: 'event.shares' }, registeredAt: { var: '$timestamp' } }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'transfer_shares', guard: { and: [{ getKey: [{ var: 'state.shareholders' }, { var: 'event.from' }] }, { '>=': [{ var: 'state.shareholders' }, { var: 'event.shares' }] }] }, effect: { merge: [{ var: 'state' }, { shareholders: { setKey: [{ var: 'state.shareholders' }, { var: 'event.to' }, { shares: { var: 'event.shares' }, transferredAt: { var: '$timestamp' } }] } }] } },
    { from: 'ACTIVE', to: 'MEETING', eventName: 'call_meeting', guard: { getKey: [{ var: 'state.shareholders' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { status: 'MEETING', currentMeeting: { calledBy: { var: 'event.agent' }, meetingType: { var: 'event.meetingType' }, agenda: { var: 'event.agenda' }, calledAt: { var: '$timestamp' } }, votes: {} }] } },
    { from: 'MEETING', to: 'MEETING', eventName: 'vote', guard: { and: [{ getKey: [{ var: 'state.shareholders' }, { var: 'event.agent' }] }, { '!': [{ getKey: [{ var: 'state.votes' }, { var: 'event.agent' }] }] }] }, effect: { merge: [{ var: 'state' }, { votes: { setKey: [{ var: 'state.votes' }, { var: 'event.agent' }, { support: { var: 'event.support' }, votedAt: { var: '$timestamp' } }] } }] } },
    { from: 'MEETING', to: 'ACTIVE', eventName: 'adjourn', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'ACTIVE', meetings: { cat: [{ var: 'state.meetings' }, [{ meeting: { var: 'state.currentMeeting' }, votes: { var: 'state.votes' }, adjournedAt: { var: '$timestamp' } }]] }, currentMeeting: null, votes: {} }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type CorpShareholdersState = keyof typeof corpShareholdersDef.states;
export type CorpShareholdersEvent = typeof corpShareholdersDef.transitions[number]['eventName'];
