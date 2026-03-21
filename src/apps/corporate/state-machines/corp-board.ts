import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Board of directors: manages directors, meetings, resolutions, and committees.
 */
export const corpBoardDef = defineFiberApp({
  metadata: {
    name: 'CorporateBoard',
    app: 'corporate',
    type: 'board',
    version: '1.0.0',
    description: 'Board of directors: manages directors, meetings, resolutions, and committees',
  },

  createSchema: {
    required: ['entityId', 'initialDirectors', 'quorumPercent'] as const,
    properties: {
      entityId: { type: 'uuid', description: 'Linked corporate entity' },
      initialDirectors: { type: 'array', items: { type: 'address' } },
      quorumPercent: { type: 'integer', minimum: 1, maximum: 100 },
      termLengthMs: { type: 'integer', default: 31536000000, description: 'Director term (1 year default)' },
    },
  },

  stateSchema: {
    properties: {
      entityId: { type: 'uuid' },
      directors: { type: 'object' },
      quorumPercent: { type: 'integer' },
      termLengthMs: { type: 'integer' },
      status: { type: 'string', enum: ['ACTIVE', 'MEETING', 'DISSOLVED'] as const, computed: true },
      currentMeeting: { type: 'object', computed: true },
      votes: { type: 'object', computed: true },
      resolutions: { type: 'array', computed: true },
    },
  },

  eventSchemas: {
    elect_director: { required: ['director', 'electedBy'] as const, properties: { director: { type: 'address' }, electedBy: { type: 'string' } } },
    remove_director: { required: ['director', 'reason'] as const, properties: { director: { type: 'address' }, reason: { type: 'string' } } },
    call_meeting: { required: ['agent', 'agenda'] as const, properties: { agent: { type: 'address' }, agenda: { type: 'array' } } },
    propose_resolution: { required: ['agent', 'resolutionId', 'title', 'body'] as const, properties: { agent: { type: 'address' }, resolutionId: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } } },
    vote: { required: ['agent', 'support'] as const, properties: { agent: { type: 'address' }, support: { type: 'boolean' } } },
    adjourn: { description: 'Adjourn meeting' },
    dissolve: { description: 'Dissolve the board' },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false },
    MEETING: { id: 'MEETING', isFinal: false },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true },
  },

  initialState: 'ACTIVE',

  transitions: [
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'elect_director', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { directors: { setKey: [{ var: 'state.directors' }, { var: 'event.director' }, { electedBy: { var: 'event.electedBy' }, electedAt: { var: '$timestamp' }, termEnds: { '+': [{ var: '$timestamp' }, { var: 'state.termLengthMs' }] } }] } }] } },
    { from: 'ACTIVE', to: 'ACTIVE', eventName: 'remove_director', guard: { getKey: [{ var: 'state.directors' }, { var: 'event.director' }] }, effect: { merge: [{ var: 'state' }, { directors: { deleteKey: [{ var: 'state.directors' }, { var: 'event.director' }] } }] } },
    { from: 'ACTIVE', to: 'MEETING', eventName: 'call_meeting', guard: { getKey: [{ var: 'state.directors' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { status: 'MEETING', currentMeeting: { calledBy: { var: 'event.agent' }, agenda: { var: 'event.agenda' }, calledAt: { var: '$timestamp' } }, votes: {} }] } },
    { from: 'MEETING', to: 'MEETING', eventName: 'propose_resolution', guard: { getKey: [{ var: 'state.directors' }, { var: 'event.agent' }] }, effect: { merge: [{ var: 'state' }, { currentMeeting: { merge: [{ var: 'state.currentMeeting' }, { resolution: { id: { var: 'event.resolutionId' }, title: { var: 'event.title' }, body: { var: 'event.body' }, proposedBy: { var: 'event.agent' } } }] }, votes: {} }] } },
    { from: 'MEETING', to: 'MEETING', eventName: 'vote', guard: { and: [{ getKey: [{ var: 'state.directors' }, { var: 'event.agent' }] }, { '!': [{ getKey: [{ var: 'state.votes' }, { var: 'event.agent' }] }] }] }, effect: { merge: [{ var: 'state' }, { votes: { setKey: [{ var: 'state.votes' }, { var: 'event.agent' }, { support: { var: 'event.support' }, votedAt: { var: '$timestamp' } }] } }] } },
    { from: 'MEETING', to: 'ACTIVE', eventName: 'adjourn', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'ACTIVE', resolutions: { cat: [{ var: 'state.resolutions' }, [{ meeting: { var: 'state.currentMeeting' }, votes: { var: 'state.votes' }, adjournedAt: { var: '$timestamp' } }]] }, currentMeeting: null, votes: {} }] } },
    { from: 'ACTIVE', to: 'DISSOLVED', eventName: 'dissolve', guard: { '==': [1, 1] }, effect: { merge: [{ var: 'state' }, { status: 'DISSOLVED', dissolvedAt: { var: '$timestamp' } }] } },
  ],
});

export type CorpBoardState = keyof typeof corpBoardDef.states;
export type CorpBoardEvent = typeof corpBoardDef.transitions[number]['eventName'];
