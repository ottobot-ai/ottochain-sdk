import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Board of directors state machine managing director seats, meetings, quorum, and formal board actions.
 * Supports staggered boards with classified directors.
 */
export const corpBoardDef = defineFiberApp({
  metadata: {
    name: 'CorpBoard',
    app: 'corporate',
    type: 'board',
    version: '1.0.0',
    description: 'Board of directors state machine managing director seats, meetings, quorum, and formal board actions. Supports staggered boards with classified directors.',
  },

  createSchema: {
    required: ['boardId', 'entityId', 'seats'] as const,
    properties: {
      boardId: {
        type: 'string',
        description: 'Unique identifier for this board instance',
        immutable: true,
      },
      entityId: {
        type: 'string',
        description: 'Reference to parent corporate-entity',
        immutable: true,
      },
      seats: {
        type: 'object',
        properties: {
          authorized: { type: 'integer', description: 'Number of board seats authorized by bylaws' },
          filled: { type: 'integer' },
          vacant: { type: 'integer' },
        },
      },
      boardStructure: {
        type: 'object',
        properties: {
          isClassified: { type: 'boolean', description: 'Whether board has staggered terms' },
          termYears: { type: 'integer', default: 1, description: 'Director term length' },
          classTerms: {
            type: 'object',
            properties: {
              CLASS_I: { type: 'integer' },
              CLASS_II: { type: 'integer' },
              CLASS_III: { type: 'integer' },
            },
          },
        },
      },
      quorumRules: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['MAJORITY', 'SUPERMAJORITY', 'FIXED_NUMBER'] as const, default: 'MAJORITY' },
          threshold: { type: 'number', description: 'Fraction for majority/super, or count for fixed' },
          minimumRequired: { type: 'integer', description: 'Absolute minimum regardless of formula' },
        },
      },
      votingRules: {
        type: 'object',
        properties: {
          standardApproval: { type: 'string', enum: ['MAJORITY_PRESENT', 'MAJORITY_FULL_BOARD'] as const, default: 'MAJORITY_PRESENT' },
          supermajorityMatters: { type: 'array', items: { type: 'string' }, description: 'Action types requiring supermajority' },
          supermajorityThreshold: { type: 'number', default: 0.6667 },
        },
      },
    },
  },

  stateSchema: {
    properties: {
      boardId: { type: 'string', immutable: true },
      entityId: { type: 'string', immutable: true },
      directors: {
        type: 'array',
        items: { $ref: '#/definitions/Director' },
        computed: true,
      },
      seats: { type: 'object' },
      boardStructure: { type: 'object' },
      quorumRules: { type: 'object' },
      votingRules: { type: 'object' },
      currentMeeting: { $ref: '#/definitions/Meeting', nullable: true, computed: true },
      meetingHistory: { type: 'array', items: { $ref: '#/definitions/MeetingRecord' }, computed: true },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'IN_MEETING', 'QUORUM_LOST'] as const,
        computed: true,
      },
      createdAt: { type: 'timestamp', computed: true },
      updatedAt: { type: 'timestamp', computed: true },
    },
  },

  eventSchemas: {
    elect_director: {
      description: 'Add a new director to the board (election typically done at shareholder meeting or by board to fill vacancy)',
      required: ['directorId', 'name', 'termStart', 'termEnd', 'isIndependent', 'electionResolutionRef'] as const,
      properties: {
        directorId: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        termStart: { type: 'string', format: 'date' },
        termEnd: { type: 'string', format: 'date' },
        class: { type: 'string', enum: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'UNCLASSIFIED'] as const },
        isIndependent: { type: 'boolean' },
        electionResolutionRef: { type: 'string', description: 'Shareholder or board resolution' },
        isFillingVacancy: { type: 'boolean', default: false },
      },
    },
    resign_director: {
      description: 'Director resigns from the board',
      required: ['directorId', 'effectiveDate'] as const,
      properties: {
        directorId: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date' },
        reason: { type: 'string' },
        resignationLetter: { type: 'string', description: 'Document reference' },
      },
    },
    remove_for_cause: {
      description: 'Remove a director for cause (requires board or shareholder action depending on bylaws)',
      required: ['directorId', 'cause', 'removalResolutionRef', 'effectiveDate'] as const,
      properties: {
        directorId: { type: 'string' },
        cause: { type: 'string' },
        removalResolutionRef: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date' },
      },
    },
    designate_chair: {
      description: 'Designate a director as board chair',
      required: ['directorId', 'resolutionRef'] as const,
      properties: {
        directorId: { type: 'string' },
        resolutionRef: { type: 'string' },
      },
    },
    call_meeting: {
      description: 'Schedule a board meeting (can be called by chair, CEO, or directors per bylaws)',
      required: ['meetingId', 'type', 'scheduledDate', 'calledBy', 'noticeDate'] as const,
      properties: {
        meetingId: { type: 'string' },
        type: { type: 'string', enum: ['REGULAR', 'SPECIAL', 'ANNUAL', 'ORGANIZATIONAL'] as const },
        scheduledDate: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        isVirtual: { type: 'boolean', default: false },
        calledBy: { type: 'string', description: 'Director ID or officer title' },
        noticeDate: { type: 'string', format: 'date' },
        agenda: { type: 'array', items: { type: 'string' } },
        waiverOfNotice: { type: 'boolean', default: false, description: 'If all directors waive notice' },
      },
    },
    record_attendance: {
      description: 'Record a director\'s attendance before meeting opens',
      required: ['directorId', 'present'] as const,
      properties: {
        directorId: { type: 'string' },
        present: { type: 'boolean' },
        arrivedAt: { type: 'string', format: 'date-time' },
      },
    },
    open_meeting: {
      description: 'Officially open the board meeting once quorum is established',
      required: ['openedAt'] as const,
      properties: {
        openedAt: { type: 'string', format: 'date-time' },
        chairPresiding: { type: 'string', description: 'Director ID presiding' },
      },
    },
    director_departs: {
      description: 'Record a director leaving the meeting (may affect quorum)',
      required: ['directorId', 'departedAt'] as const,
      properties: {
        directorId: { type: 'string' },
        departedAt: { type: 'string', format: 'date-time' },
      },
    },
    quorum_lost: {
      description: 'Automatic transition when quorum is lost during meeting',
      required: ['lostAt'] as const,
      properties: {
        lostAt: { type: 'string', format: 'date-time' },
      },
    },
    quorum_restored: {
      description: 'Quorum restored after additional director(s) join',
      required: ['restoredAt', 'directorId'] as const,
      properties: {
        restoredAt: { type: 'string', format: 'date-time' },
        directorId: { type: 'string', description: 'Joining director' },
      },
    },
    adjourn: {
      description: 'Adjourn the board meeting',
      required: ['closedAt'] as const,
      properties: {
        closedAt: { type: 'string', format: 'date-time' },
        minutesRef: { type: 'string', description: 'Reference to meeting minutes document' },
        resolutionsPassed: { type: 'array', items: { type: 'string' } },
        adjournedTo: { type: 'string', format: 'date-time', nullable: true, description: 'If adjourning to later date' },
      },
    },
    update_seats: {
      description: 'Change the number of authorized board seats (requires bylaw amendment)',
      required: ['newAuthorizedSeats', 'bylawAmendmentRef'] as const,
      properties: {
        newAuthorizedSeats: { type: 'integer' },
        bylawAmendmentRef: { type: 'string' },
      },
    },
  },

  definitions: {
    Director: {
      type: 'object',
      properties: {
        directorId: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        termStart: { type: 'string', format: 'date' },
        termEnd: { type: 'string', format: 'date' },
        class: { type: 'string', enum: ['CLASS_I', 'CLASS_II', 'CLASS_III', 'UNCLASSIFIED'] as const },
        status: { type: 'string', enum: ['ACTIVE', 'RESIGNED', 'REMOVED', 'TERM_EXPIRED'] as const },
        isIndependent: { type: 'boolean', description: 'Independence under applicable rules' },
        isChair: { type: 'boolean', default: false },
        isLeadIndependent: { type: 'boolean', default: false },
        committees: { type: 'array', items: { type: 'string' }, description: 'Committee memberships by committee ID' },
        electedBy: { type: 'string', description: 'Resolution reference for election' },
        compensationAgreementRef: { type: 'string', nullable: true },
      },
    },
    Meeting: {
      type: 'object',
      nullable: true,
      properties: {
        meetingId: { type: 'string' },
        type: { type: 'string', enum: ['REGULAR', 'SPECIAL', 'ANNUAL', 'ORGANIZATIONAL'] as const },
        scheduledDate: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        isVirtual: { type: 'boolean' },
        calledBy: { type: 'string' },
        noticeDate: { type: 'string', format: 'date' },
        agenda: { type: 'array', items: { type: 'string' } },
        attendees: { type: 'array', items: { $ref: '#/definitions/Attendee' } },
        quorumPresent: { type: 'boolean' },
        quorumCount: { type: 'integer' },
        openedAt: { type: 'string', format: 'date-time', nullable: true },
        closedAt: { type: 'string', format: 'date-time', nullable: true },
        minutesRef: { type: 'string', nullable: true },
      },
    },
    Attendee: {
      type: 'object',
      properties: {
        directorId: { type: 'string' },
        present: { type: 'boolean' },
        arrivedAt: { type: 'string', format: 'date-time', nullable: true },
        departedAt: { type: 'string', format: 'date-time', nullable: true },
        viaProxy: { type: 'boolean', default: false },
      },
    },
    MeetingRecord: {
      type: 'object',
      properties: {
        meetingId: { type: 'string' },
        type: { type: 'string' },
        date: { type: 'string', format: 'date' },
        quorumAchieved: { type: 'boolean' },
        attendeeCount: { type: 'integer' },
        resolutionsPassed: { type: 'array', items: { type: 'string' } },
        minutesRef: { type: 'string' },
      },
    },
  },

  states: {
    ACTIVE: { id: 'ACTIVE', isFinal: false, description: 'Board is constituted and able to conduct business. Default state between meetings.' },
    IN_MEETING: { id: 'IN_MEETING', isFinal: false, description: 'Board meeting is in session with quorum present. Can take formal actions.' },
    QUORUM_LOST: { id: 'QUORUM_LOST', isFinal: false, description: 'Meeting in progress but quorum lost due to departures. No further action until quorum restored or adjourned.' },
  },

  initialState: 'ACTIVE',

  transitions: [
    // ACTIVE -> ACTIVE (elect_director)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'elect_director',
      guard: {
        and: [
          {
            or: [
              { '>': [{ var: 'state.seats.vacant' }, 0] },
              { '==': [{ var: 'event.isFillingVacancy' }, true] },
            ],
          },
          { '!=': [{ var: 'event.electionResolutionRef' }, null] },
          {
            '!': {
              some: [
                { var: 'state.directors' },
                {
                  and: [
                    { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                    { '==': [{ var: '.status' }, 'ACTIVE'] },
                  ],
                },
              ],
            },
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            directors: {
              cat: [
                { var: 'state.directors' },
                [
                  {
                    directorId: { var: 'event.directorId' },
                    name: { var: 'event.name' },
                    email: { var: 'event.email' },
                    termStart: { var: 'event.termStart' },
                    termEnd: { var: 'event.termEnd' },
                    class: { var: 'event.class' },
                    status: 'ACTIVE',
                    isIndependent: { var: 'event.isIndependent' },
                    isChair: false,
                    isLeadIndependent: false,
                    committees: [],
                    electedBy: { var: 'event.electionResolutionRef' },
                  },
                ],
              ],
            },
            seats: {
              merge: [
                { var: 'state.seats' },
                {
                  filled: { '+': [{ var: 'state.seats.filled' }, 1] },
                  vacant: { '-': [{ var: 'state.seats.vacant' }, 1] },
                },
              ],
            },
          },
        ],
      },
      emits: ['DIRECTOR_ELECTED'],
    },

    // ACTIVE -> ACTIVE (resign_director) and IN_MEETING -> ACTIVE (resign_director)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'resign_director',
      guard: {
        some: [
          { var: 'state.directors' },
          {
            and: [
              { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
              { '==': [{ var: '.status' }, 'ACTIVE'] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            directors: {
              map: [
                { var: 'state.directors' },
                {
                  if: [
                    { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                    {
                      merge: [
                        { var: '' },
                        { status: 'RESIGNED', termEnd: { var: 'event.effectiveDate' } },
                      ],
                    },
                    { var: '' },
                  ],
                },
              ],
            },
            seats: {
              merge: [
                { var: 'state.seats' },
                {
                  filled: { '-': [{ var: 'state.seats.filled' }, 1] },
                  vacant: { '+': [{ var: 'state.seats.vacant' }, 1] },
                },
              ],
            },
          },
        ],
      },
      emits: ['DIRECTOR_RESIGNED'],
    },
    {
      from: 'IN_MEETING',
      to: 'ACTIVE',
      eventName: 'resign_director',
      guard: {
        some: [
          { var: 'state.directors' },
          {
            and: [
              { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
              { '==': [{ var: '.status' }, 'ACTIVE'] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            directors: {
              map: [
                { var: 'state.directors' },
                {
                  if: [
                    { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                    {
                      merge: [
                        { var: '' },
                        { status: 'RESIGNED', termEnd: { var: 'event.effectiveDate' } },
                      ],
                    },
                    { var: '' },
                  ],
                },
              ],
            },
            seats: {
              merge: [
                { var: 'state.seats' },
                {
                  filled: { '-': [{ var: 'state.seats.filled' }, 1] },
                  vacant: { '+': [{ var: 'state.seats.vacant' }, 1] },
                },
              ],
            },
          },
        ],
      },
      emits: ['DIRECTOR_RESIGNED'],
    },

    // ACTIVE -> ACTIVE (remove_for_cause)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'remove_for_cause',
      guard: {
        some: [
          { var: 'state.directors' },
          {
            and: [
              { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
              { '==': [{ var: '.status' }, 'ACTIVE'] },
            ],
          },
        ],
      },
      dependencies: [
        {
          machine: 'corporate-resolution',
          instanceRef: { var: 'event.removalResolutionRef' },
          requiredState: 'EXECUTED',
        },
      ],
      effect: {
        merge: [
          { var: 'state' },
          {
            directors: {
              map: [
                { var: 'state.directors' },
                {
                  if: [
                    { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                    {
                      merge: [
                        { var: '' },
                        { status: 'REMOVED', termEnd: { var: 'event.effectiveDate' } },
                      ],
                    },
                    { var: '' },
                  ],
                },
              ],
            },
            seats: {
              merge: [
                { var: 'state.seats' },
                {
                  filled: { '-': [{ var: 'state.seats.filled' }, 1] },
                  vacant: { '+': [{ var: 'state.seats.vacant' }, 1] },
                },
              ],
            },
          },
        ],
      },
      emits: ['DIRECTOR_REMOVED'],
    },

    // ACTIVE -> ACTIVE (designate_chair)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'designate_chair',
      guard: {
        some: [
          { var: 'state.directors' },
          {
            and: [
              { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
              { '==': [{ var: '.status' }, 'ACTIVE'] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            directors: {
              map: [
                { var: 'state.directors' },
                {
                  merge: [
                    { var: '' },
                    {
                      isChair: { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },

    // ACTIVE -> ACTIVE (call_meeting)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'call_meeting',
      guard: {
        and: [
          {
            or: [
              { '==': [{ var: 'event.waiverOfNotice' }, true] },
              { '>=': [
                { '-': [
                  { var: 'event.scheduledDate' },
                  { var: 'event.noticeDate' },
                ] },
                172800000, // 2 days in ms
              ] },
            ],
          },
          {
            or: [
              { '==': [{ var: 'state.currentMeeting' }, null] },
              { '!=': [{ var: 'state.currentMeeting.closedAt' }, null] },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            currentMeeting: {
              meetingId: { var: 'event.meetingId' },
              type: { var: 'event.type' },
              scheduledDate: { var: 'event.scheduledDate' },
              location: { var: 'event.location' },
              isVirtual: { var: 'event.isVirtual' },
              calledBy: { var: 'event.calledBy' },
              noticeDate: { var: 'event.noticeDate' },
              agenda: { var: 'event.agenda' },
              attendees: [],
              quorumPresent: false,
              quorumCount: 0,
            },
          },
        ],
      },
      emits: ['BOARD_MEETING_SCHEDULED'],
    },

    // ACTIVE -> ACTIVE (record_attendance)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'record_attendance',
      guard: {
        and: [
          { '!=': [{ var: 'state.currentMeeting' }, null] },
          { '==': [{ var: 'state.currentMeeting.openedAt' }, null] },
          {
            some: [
              { var: 'state.directors' },
              {
                and: [
                  { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                  { '==': [{ var: '.status' }, 'ACTIVE'] },
                ],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            currentMeeting: {
              merge: [
                { var: 'state.currentMeeting' },
                {
                  attendees: {
                    cat: [
                      { var: 'state.currentMeeting.attendees' },
                      [
                        {
                          directorId: { var: 'event.directorId' },
                          present: { var: 'event.present' },
                          arrivedAt: { var: 'event.arrivedAt' },
                          viaProxy: false,
                        },
                      ],
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },

    // ACTIVE -> IN_MEETING (open_meeting)
    {
      from: 'ACTIVE',
      to: 'IN_MEETING',
      eventName: 'open_meeting',
      guard: {
        and: [
          { '!=': [{ var: 'state.currentMeeting' }, null] },
          { '==': [{ var: 'state.currentMeeting.openedAt' }, null] },
          { '==': [{ var: 'state.currentMeeting.quorumPresent' }, true] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'IN_MEETING',
            currentMeeting: {
              merge: [
                { var: 'state.currentMeeting' },
                { openedAt: { var: 'event.openedAt' } },
              ],
            },
          },
        ],
      },
      emits: ['BOARD_MEETING_OPENED'],
    },

    // IN_MEETING -> IN_MEETING (director_departs)
    {
      from: 'IN_MEETING',
      to: 'IN_MEETING',
      eventName: 'director_departs',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            currentMeeting: {
              merge: [
                { var: 'state.currentMeeting' },
                {
                  attendees: {
                    map: [
                      { var: 'state.currentMeeting.attendees' },
                      {
                        if: [
                          { '==': [{ var: '.directorId' }, { var: 'event.directorId' }] },
                          {
                            merge: [
                              { var: '' },
                              { present: false, departedAt: { var: 'event.departedAt' } },
                            ],
                          },
                          { var: '' },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },

    // IN_MEETING -> QUORUM_LOST
    {
      from: 'IN_MEETING',
      to: 'QUORUM_LOST',
      eventName: 'quorum_lost',
      guard: { '==': [{ var: 'state.currentMeeting.quorumPresent' }, false] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'QUORUM_LOST' },
        ],
      },
      emits: ['BOARD_QUORUM_LOST'],
    },

    // QUORUM_LOST -> IN_MEETING
    {
      from: 'QUORUM_LOST',
      to: 'IN_MEETING',
      eventName: 'quorum_restored',
      guard: { '==': [{ var: 'state.currentMeeting.quorumPresent' }, true] },
      effect: {
        merge: [
          { var: 'state' },
          { status: 'IN_MEETING' },
        ],
      },
      emits: ['BOARD_QUORUM_RESTORED'],
    },

    // IN_MEETING -> ACTIVE (adjourn)
    {
      from: 'IN_MEETING',
      to: 'ACTIVE',
      eventName: 'adjourn',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            currentMeeting: null,
            meetingHistory: {
              cat: [
                { var: 'state.meetingHistory' },
                [
                  {
                    meetingId: { var: 'state.currentMeeting.meetingId' },
                    type: { var: 'state.currentMeeting.type' },
                    date: { var: 'state.currentMeeting.scheduledDate' },
                    quorumAchieved: { var: 'state.currentMeeting.quorumPresent' },
                    attendeeCount: { var: 'state.currentMeeting.quorumCount' },
                    resolutionsPassed: { var: 'event.resolutionsPassed' },
                    minutesRef: { var: 'event.minutesRef' },
                  },
                ],
              ],
            },
          },
        ],
      },
      emits: ['BOARD_MEETING_ADJOURNED'],
    },

    // QUORUM_LOST -> ACTIVE (adjourn)
    {
      from: 'QUORUM_LOST',
      to: 'ACTIVE',
      eventName: 'adjourn',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            currentMeeting: null,
            meetingHistory: {
              cat: [
                { var: 'state.meetingHistory' },
                [
                  {
                    meetingId: { var: 'state.currentMeeting.meetingId' },
                    type: { var: 'state.currentMeeting.type' },
                    date: { var: 'state.currentMeeting.scheduledDate' },
                    quorumAchieved: { var: 'state.currentMeeting.quorumPresent' },
                    attendeeCount: { var: 'state.currentMeeting.quorumCount' },
                    resolutionsPassed: { var: 'event.resolutionsPassed' },
                    minutesRef: { var: 'event.minutesRef' },
                  },
                ],
              ],
            },
          },
        ],
      },
      emits: ['BOARD_MEETING_ADJOURNED'],
    },

    // ACTIVE -> ACTIVE (update_seats)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'update_seats',
      guard: { '>=': [{ var: 'event.newAuthorizedSeats' }, { var: 'state.seats.filled' }] },
      effect: {
        merge: [
          { var: 'state' },
          {
            seats: {
              merge: [
                { var: 'state.seats' },
                {
                  authorized: { var: 'event.newAuthorizedSeats' },
                  vacant: { '-': [{ var: 'event.newAuthorizedSeats' }, { var: 'state.seats.filled' }] },
                },
              ],
            },
          },
        ],
      },
    },
  ],

  crossReferences: {
    entity: { machine: 'corporate-entity', description: 'Parent corporate entity', foreignKey: 'entityId' },
    resolutions: { machine: 'corporate-resolution', description: 'Board resolutions', foreignKey: 'boardId' },
    committees: { machine: 'corporate-committee', description: 'Board committees', foreignKey: 'boardId' },
    officers: { machine: 'corporate-officers', description: 'Officers appointed by board', foreignKey: 'entityId' },
  },
});

// Derived types for consumers
export type CorpBoardState = keyof typeof corpBoardDef.states;
export type CorpBoardEvent = typeof corpBoardDef.transitions[number]['eventName'];
