/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const corpBoardDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "CorpBoard",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Board of directors state machine managing director seats, meetings, quorum, and formal board actions. Supports staggered boards with classified directors.",
  "context": {
    "boardId": {
      "type": "string",
      "description": "Unique identifier for this board instance"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "directors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "directorId": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "termStart": {
            "type": "string",
            "format": "date"
          },
          "termEnd": {
            "type": "string",
            "format": "date"
          },
          "class": {
            "type": "string",
            "enum": [
              "CLASS_I",
              "CLASS_II",
              "CLASS_III",
              "UNCLASSIFIED"
            ],
            "description": "For staggered boards"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "RESIGNED",
              "REMOVED",
              "TERM_EXPIRED"
            ]
          },
          "isIndependent": {
            "type": "boolean",
            "description": "Independence under applicable rules"
          },
          "isChair": {
            "type": "boolean",
            "default": false
          },
          "isLeadIndependent": {
            "type": "boolean",
            "default": false
          },
          "committees": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Committee memberships by committee ID"
          },
          "electedBy": {
            "type": "string",
            "description": "Resolution reference for election"
          },
          "compensationAgreementRef": {
            "type": "string",
            "nullable": true
          }
        }
      }
    },
    "seats": {
      "type": "object",
      "properties": {
        "authorized": {
          "type": "integer",
          "description": "Number of board seats authorized by bylaws"
        },
        "filled": {
          "type": "integer"
        },
        "vacant": {
          "type": "integer"
        }
      }
    },
    "boardStructure": {
      "type": "object",
      "properties": {
        "isClassified": {
          "type": "boolean",
          "description": "Whether board has staggered terms"
        },
        "termYears": {
          "type": "integer",
          "default": 1,
          "description": "Director term length"
        },
        "classTerms": {
          "type": "object",
          "properties": {
            "CLASS_I": {
              "type": "integer"
            },
            "CLASS_II": {
              "type": "integer"
            },
            "CLASS_III": {
              "type": "integer"
            }
          }
        }
      }
    },
    "quorumRules": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "MAJORITY",
            "SUPERMAJORITY",
            "FIXED_NUMBER"
          ],
          "default": "MAJORITY"
        },
        "threshold": {
          "type": "number",
          "description": "Fraction for majority/super, or count for fixed"
        },
        "minimumRequired": {
          "type": "integer",
          "description": "Absolute minimum regardless of formula"
        }
      }
    },
    "votingRules": {
      "type": "object",
      "properties": {
        "standardApproval": {
          "type": "string",
          "enum": [
            "MAJORITY_PRESENT",
            "MAJORITY_FULL_BOARD"
          ],
          "default": "MAJORITY_PRESENT"
        },
        "supermajorityMatters": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Action types requiring supermajority"
        },
        "supermajorityThreshold": {
          "type": "number",
          "default": 0.6667
        }
      }
    },
    "currentMeeting": {
      "type": "object",
      "nullable": true,
      "properties": {
        "meetingId": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
            "REGULAR",
            "SPECIAL",
            "ANNUAL",
            "ORGANIZATIONAL"
          ]
        },
        "scheduledDate": {
          "type": "string",
          "format": "date-time"
        },
        "location": {
          "type": "string"
        },
        "isVirtual": {
          "type": "boolean"
        },
        "calledBy": {
          "type": "string"
        },
        "noticeDate": {
          "type": "string",
          "format": "date"
        },
        "agenda": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "attendees": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "directorId": {
                "type": "string"
              },
              "present": {
                "type": "boolean"
              },
              "arrivedAt": {
                "type": "string",
                "format": "date-time",
                "nullable": true
              },
              "departedAt": {
                "type": "string",
                "format": "date-time",
                "nullable": true
              },
              "viaProxy": {
                "type": "boolean",
                "default": false
              }
            }
          }
        },
        "quorumPresent": {
          "type": "boolean"
        },
        "quorumCount": {
          "type": "integer"
        },
        "openedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "closedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "minutesRef": {
          "type": "string",
          "nullable": true
        }
      }
    },
    "meetingHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "meetingId": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "date": {
            "type": "string",
            "format": "date"
          },
          "quorumAchieved": {
            "type": "boolean"
          },
          "attendeeCount": {
            "type": "integer"
          },
          "resolutionsPassed": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "minutesRef": {
            "type": "string"
          }
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "states": {
    "ACTIVE": {
      "description": "Board is constituted and able to conduct business. Default state between meetings.",
      "metadata": null
    },
    "IN_MEETING": {
      "description": "Board meeting is in session with quorum present. Can take formal actions.",
      "metadata": null
    },
    "QUORUM_LOST": {
      "description": "Meeting in progress but quorum lost due to departures. No further action until quorum restored or adjourned.",
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": {
    "elect_director": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Add a new director to the board (election typically done at shareholder meeting or by board to fill vacancy)",
      "event": {
        "name": "elect_director",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "email": {
            "type": "string"
          },
          "termStart": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "termEnd": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "class": {
            "type": "string",
            "enum": [
              "CLASS_I",
              "CLASS_II",
              "CLASS_III",
              "UNCLASSIFIED"
            ]
          },
          "isIndependent": {
            "type": "boolean",
            "required": true
          },
          "electionResolutionRef": {
            "type": "string",
            "required": true,
            "description": "Shareholder or board resolution"
          },
          "isFillingVacancy": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "guards": [
        {
          "name": "hasAvailableSeat",
          "description": "Must have vacant seat or be filling expired term",
          "expression": "context.seats.vacant > 0 || event.isFillingVacancy"
        },
        {
          "name": "hasElectionResolution",
          "description": "Must have valid election resolution (shareholder for annual, board for vacancy fill)",
          "expression": "event.electionResolutionRef != null"
        },
        {
          "name": "notAlreadyDirector",
          "description": "Person not already serving on board",
          "expression": "!context.directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "directors",
          "value": {
            "directorId": "{{ event.directorId }}",
            "name": "{{ event.name }}",
            "email": "{{ event.email }}",
            "termStart": "{{ event.termStart }}",
            "termEnd": "{{ event.termEnd }}",
            "class": "{{ event.class }}",
            "status": "ACTIVE",
            "isIndependent": "{{ event.isIndependent }}",
            "isChair": false,
            "isLeadIndependent": false,
            "committees": [],
            "electedBy": "{{ event.electionResolutionRef }}"
          }
        },
        {
          "type": "INCREMENT",
          "path": "seats.filled",
          "amount": 1
        },
        {
          "type": "DECREMENT",
          "path": "seats.vacant",
          "amount": 1
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "DIRECTOR_ELECTED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "directorId": "{{ event.directorId }}",
            "name": "{{ event.name }}",
            "termEnd": "{{ event.termEnd }}"
          }
        }
      ]
    },
    "resign_director": {
      "from": [
        "ACTIVE",
        "IN_MEETING"
      ],
      "to": "ACTIVE",
      "description": "Director resigns from the board",
      "event": {
        "name": "resign_director",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "reason": {
            "type": "string"
          },
          "resignationLetter": {
            "type": "string",
            "description": "Document reference"
          }
        }
      },
      "guards": [
        {
          "name": "isActiveDirector",
          "expression": "context.directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "directors",
          "matchKey": "directorId",
          "matchValue": "{{ event.directorId }}",
          "updates": {
            "status": "RESIGNED",
            "termEnd": "{{ event.effectiveDate }}"
          }
        },
        {
          "type": "DECREMENT",
          "path": "seats.filled",
          "amount": 1
        },
        {
          "type": "INCREMENT",
          "path": "seats.vacant",
          "amount": 1
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "DIRECTOR_RESIGNED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "directorId": "{{ event.directorId }}",
            "effectiveDate": "{{ event.effectiveDate }}"
          }
        }
      ]
    },
    "remove_for_cause": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Remove a director for cause (requires board or shareholder action depending on bylaws)",
      "event": {
        "name": "remove_for_cause",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "cause": {
            "type": "string",
            "required": true
          },
          "removalResolutionRef": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "isActiveDirector",
          "expression": "context.directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
        },
        {
          "name": "hasRemovalResolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.removalResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "directors",
          "matchKey": "directorId",
          "matchValue": "{{ event.directorId }}",
          "updates": {
            "status": "REMOVED",
            "termEnd": "{{ event.effectiveDate }}"
          }
        },
        {
          "type": "DECREMENT",
          "path": "seats.filled",
          "amount": 1
        },
        {
          "type": "INCREMENT",
          "path": "seats.vacant",
          "amount": 1
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "DIRECTOR_REMOVED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "directorId": "{{ event.directorId }}",
            "cause": "{{ event.cause }}"
          }
        }
      ]
    },
    "designate_chair": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Designate a director as board chair",
      "event": {
        "name": "designate_chair",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "isActiveDirector",
          "expression": "context.directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ALL",
          "path": "directors",
          "updates": {
            "isChair": false
          }
        },
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "directors",
          "matchKey": "directorId",
          "matchValue": "{{ event.directorId }}",
          "updates": {
            "isChair": true
          }
        }
      ]
    },
    "call_meeting": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Schedule a board meeting (can be called by chair, CEO, or directors per bylaws)",
      "event": {
        "name": "call_meeting",
        "payload": {
          "meetingId": {
            "type": "string",
            "required": true
          },
          "type": {
            "type": "string",
            "enum": [
              "REGULAR",
              "SPECIAL",
              "ANNUAL",
              "ORGANIZATIONAL"
            ],
            "required": true
          },
          "scheduledDate": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "location": {
            "type": "string"
          },
          "isVirtual": {
            "type": "boolean",
            "default": false
          },
          "calledBy": {
            "type": "string",
            "required": true,
            "description": "Director ID or officer title"
          },
          "noticeDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "agenda": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "waiverOfNotice": {
            "type": "boolean",
            "default": false,
            "description": "If all directors waive notice"
          }
        }
      },
      "guards": [
        {
          "name": "sufficientNotice",
          "description": "Must provide notice per bylaws (typically 2-10 days for special, less for regular)",
          "expression": "event.waiverOfNotice || (new Date(event.scheduledDate) - new Date(event.noticeDate)) >= 2 * 24 * 60 * 60 * 1000"
        },
        {
          "name": "noConflictingMeeting",
          "description": "No other meeting currently scheduled/in progress",
          "expression": "context.currentMeeting == null || context.currentMeeting.closedAt != null"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting",
          "value": {
            "meetingId": "{{ event.meetingId }}",
            "type": "{{ event.type }}",
            "scheduledDate": "{{ event.scheduledDate }}",
            "location": "{{ event.location }}",
            "isVirtual": "{{ event.isVirtual }}",
            "calledBy": "{{ event.calledBy }}",
            "noticeDate": "{{ event.noticeDate }}",
            "agenda": "{{ event.agenda }}",
            "attendees": [],
            "quorumPresent": false,
            "quorumCount": 0
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BOARD_MEETING_SCHEDULED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "meetingId": "{{ event.meetingId }}",
            "scheduledDate": "{{ event.scheduledDate }}"
          }
        }
      ]
    },
    "record_attendance": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Record a director's attendance before meeting opens",
      "event": {
        "name": "record_attendance",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "present": {
            "type": "boolean",
            "required": true
          },
          "arrivedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "guards": [
        {
          "name": "hasPendingMeeting",
          "expression": "context.currentMeeting != null && context.currentMeeting.openedAt == null"
        },
        {
          "name": "isActiveDirector",
          "expression": "context.directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "currentMeeting.attendees",
          "value": {
            "directorId": "{{ event.directorId }}",
            "present": "{{ event.present }}",
            "arrivedAt": "{{ event.arrivedAt }}",
            "viaProxy": false
          }
        },
        {
          "type": "COMPUTE",
          "path": "currentMeeting.quorumCount",
          "expression": "context.currentMeeting.attendees.filter(a => a.present).length"
        },
        {
          "type": "COMPUTE",
          "path": "currentMeeting.quorumPresent",
          "expression": "context.currentMeeting.attendees.filter(a => a.present).length >= Math.ceil(context.seats.filled * 0.5)"
        }
      ]
    },
    "open_meeting": {
      "from": "ACTIVE",
      "to": "IN_MEETING",
      "description": "Officially open the board meeting once quorum is established",
      "event": {
        "name": "open_meeting",
        "payload": {
          "openedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "chairPresiding": {
            "type": "string",
            "description": "Director ID presiding"
          }
        }
      },
      "guards": [
        {
          "name": "hasPendingMeeting",
          "expression": "context.currentMeeting != null && context.currentMeeting.openedAt == null"
        },
        {
          "name": "quorumPresent",
          "description": "Cannot open meeting without quorum",
          "expression": "context.currentMeeting.quorumPresent === true"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.openedAt",
          "value": "{{ event.openedAt }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BOARD_MEETING_OPENED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "meetingId": "{{ context.currentMeeting.meetingId }}",
            "quorumCount": "{{ context.currentMeeting.quorumCount }}"
          }
        }
      ]
    },
    "director_departs": {
      "from": "IN_MEETING",
      "to": "IN_MEETING",
      "description": "Record a director leaving the meeting (may affect quorum)",
      "event": {
        "name": "director_departs",
        "payload": {
          "directorId": {
            "type": "string",
            "required": true
          },
          "departedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "currentMeeting.attendees",
          "matchKey": "directorId",
          "matchValue": "{{ event.directorId }}",
          "updates": {
            "present": false,
            "departedAt": "{{ event.departedAt }}"
          }
        },
        {
          "type": "COMPUTE",
          "path": "currentMeeting.quorumCount",
          "expression": "context.currentMeeting.attendees.filter(a => a.present).length"
        },
        {
          "type": "COMPUTE",
          "path": "currentMeeting.quorumPresent",
          "expression": "context.currentMeeting.attendees.filter(a => a.present).length >= Math.ceil(context.seats.filled * 0.5)"
        }
      ]
    },
    "quorum_lost": {
      "from": "IN_MEETING",
      "to": "QUORUM_LOST",
      "description": "Automatic transition when quorum is lost during meeting",
      "event": {
        "name": "quorum_lost",
        "payload": {
          "lostAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "noLongerQuorate",
          "expression": "context.currentMeeting.quorumPresent === false"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "BOARD_QUORUM_LOST",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "meetingId": "{{ context.currentMeeting.meetingId }}",
            "remainingDirectors": "{{ context.currentMeeting.quorumCount }}"
          }
        }
      ]
    },
    "quorum_restored": {
      "from": "QUORUM_LOST",
      "to": "IN_MEETING",
      "description": "Quorum restored after additional director(s) join",
      "event": {
        "name": "quorum_restored",
        "payload": {
          "restoredAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "directorId": {
            "type": "string",
            "required": true,
            "description": "Joining director"
          }
        }
      },
      "guards": [
        {
          "name": "nowQuorate",
          "expression": "context.currentMeeting.quorumPresent === true"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "BOARD_QUORUM_RESTORED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "meetingId": "{{ context.currentMeeting.meetingId }}"
          }
        }
      ]
    },
    "adjourn": {
      "from": [
        "IN_MEETING",
        "QUORUM_LOST"
      ],
      "to": "ACTIVE",
      "description": "Adjourn the board meeting",
      "event": {
        "name": "adjourn",
        "payload": {
          "closedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "minutesRef": {
            "type": "string",
            "description": "Reference to meeting minutes document"
          },
          "resolutionsPassed": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "adjournedTo": {
            "type": "string",
            "format": "date-time",
            "nullable": true,
            "description": "If adjourning to later date"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.closedAt",
          "value": "{{ event.closedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.minutesRef",
          "value": "{{ event.minutesRef }}"
        },
        {
          "type": "APPEND_ARRAY",
          "path": "meetingHistory",
          "value": {
            "meetingId": "{{ context.currentMeeting.meetingId }}",
            "type": "{{ context.currentMeeting.type }}",
            "date": "{{ context.currentMeeting.scheduledDate }}",
            "quorumAchieved": "{{ context.currentMeeting.quorumPresent }}",
            "attendeeCount": "{{ context.currentMeeting.attendees.filter(a => a.present).length }}",
            "resolutionsPassed": "{{ event.resolutionsPassed }}",
            "minutesRef": "{{ event.minutesRef }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting",
          "value": null
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BOARD_MEETING_ADJOURNED",
          "payload": {
            "boardId": "{{ context.boardId }}",
            "meetingId": "{{ context.currentMeeting.meetingId }}",
            "resolutionsPassed": "{{ event.resolutionsPassed }}"
          }
        }
      ]
    },
    "update_seats": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Change the number of authorized board seats (requires bylaw amendment)",
      "event": {
        "name": "update_seats",
        "payload": {
          "newAuthorizedSeats": {
            "type": "integer",
            "required": true
          },
          "bylawAmendmentRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "seatsNotLessThanFilled",
          "description": "Cannot reduce below current filled seats",
          "expression": "event.newAuthorizedSeats >= context.seats.filled"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "seats.authorized",
          "value": "{{ event.newAuthorizedSeats }}"
        },
        {
          "type": "COMPUTE",
          "path": "seats.vacant",
          "expression": "event.newAuthorizedSeats - context.seats.filled"
        }
      ]
    }
  },
  "crossMachineRefs": {
    "entity": {
      "machine": "corporate-entity",
      "description": "Parent corporate entity",
      "foreignKey": "entityId"
    },
    "resolutions": {
      "machine": "corporate-resolution",
      "description": "Board resolutions",
      "foreignKey": "boardId"
    },
    "committees": {
      "machine": "corporate-committee",
      "description": "Board committees",
      "foreignKey": "boardId"
    },
    "officers": {
      "machine": "corporate-officers",
      "description": "Officers appointed by board",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "board",
      "directors",
      "meetings"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/board"
  }
} as const;

export const corpEntityDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "CorpEntity",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Master corporate record tracking the lifecycle of a business entity from incorporation through dissolution. Manages legal identity, share structure, and corporate status.",
  "context": {
    "entityId": {
      "type": "string",
      "description": "Unique identifier for this corporate entity"
    },
    "legalName": {
      "type": "string",
      "description": "Full legal name of the corporation"
    },
    "tradeName": {
      "type": "string",
      "nullable": true,
      "description": "DBA or trade name if different"
    },
    "entityType": {
      "type": "string",
      "enum": [
        "C_CORP",
        "S_CORP",
        "B_CORP",
        "LLC",
        "LP",
        "LLP"
      ],
      "description": "Legal entity type"
    },
    "jurisdiction": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "description": "State of incorporation (e.g., DE, NV, WY)"
        },
        "country": {
          "type": "string",
          "default": "USA"
        },
        "foreignQualifications": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "States where foreign qualified to do business"
        }
      }
    },
    "formationDate": {
      "type": "string",
      "format": "date",
      "description": "Date of incorporation"
    },
    "fiscalYearEnd": {
      "type": "string",
      "description": "Fiscal year end (MM-DD format)"
    },
    "registeredAgent": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "address": {
          "type": "object"
        },
        "phone": {
          "type": "string"
        },
        "email": {
          "type": "string"
        },
        "effectiveDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "principalOffice": {
      "type": "object",
      "properties": {
        "street": {
          "type": "string"
        },
        "city": {
          "type": "string"
        },
        "state": {
          "type": "string"
        },
        "zip": {
          "type": "string"
        },
        "country": {
          "type": "string",
          "default": "USA"
        }
      }
    },
    "shareStructure": {
      "type": "object",
      "properties": {
        "classes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "className": {
                "type": "string",
                "description": "e.g., Common, Series A Preferred"
              },
              "classId": {
                "type": "string"
              },
              "authorized": {
                "type": "integer",
                "description": "Total shares authorized"
              },
              "issued": {
                "type": "integer",
                "description": "Shares currently issued"
              },
              "outstanding": {
                "type": "integer",
                "description": "Issued minus treasury"
              },
              "treasury": {
                "type": "integer",
                "description": "Shares held by company"
              },
              "parValue": {
                "type": "number",
                "description": "Par value per share"
              },
              "votingRights": {
                "type": "boolean",
                "description": "Whether class has voting rights"
              },
              "votesPerShare": {
                "type": "number",
                "default": 1
              },
              "liquidationPreference": {
                "type": "number",
                "nullable": true,
                "description": "Liquidation preference multiple"
              },
              "dividendRate": {
                "type": "number",
                "nullable": true,
                "description": "Annual dividend rate %"
              },
              "convertible": {
                "type": "boolean",
                "default": false
              },
              "conversionRatio": {
                "type": "number",
                "nullable": true
              },
              "antidilution": {
                "type": "string",
                "enum": [
                  "NONE",
                  "BROAD_BASED",
                  "NARROW_BASED",
                  "FULL_RATCHET"
                ],
                "nullable": true
              }
            }
          }
        },
        "totalAuthorized": {
          "type": "integer",
          "description": "Sum of all authorized shares"
        },
        "totalIssued": {
          "type": "integer"
        },
        "totalOutstanding": {
          "type": "integer"
        }
      }
    },
    "incorporators": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "address": {
            "type": "object"
          },
          "signatureDate": {
            "type": "string",
            "format": "date"
          }
        }
      }
    },
    "ein": {
      "type": "string",
      "nullable": true,
      "description": "Federal EIN"
    },
    "stateIds": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      },
      "description": "State-specific entity IDs keyed by state code"
    },
    "suspensionReason": {
      "type": "string",
      "nullable": true
    },
    "suspensionDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "dissolutionDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "dissolutionReason": {
      "type": "string",
      "nullable": true
    },
    "charterAmendments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "amendmentId": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date"
          },
          "resolutionRef": {
            "type": "string",
            "description": "Reference to approving resolution"
          },
          "filedDate": {
            "type": "string",
            "format": "date"
          }
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "states": {
    "INCORPORATING": {
      "description": "Initial state during formation process. Articles filed but not yet approved by state.",
      "metadata": null
    },
    "ACTIVE": {
      "description": "Corporation is in good standing and authorized to conduct business.",
      "metadata": null
    },
    "SUSPENDED": {
      "description": "Corporate powers suspended due to compliance failure (tax, filings, etc). Can be reinstated.",
      "metadata": null
    },
    "DISSOLVED": {
      "description": "Corporation has been legally dissolved. Terminal state.",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "INCORPORATING",
  "transitions": {
    "incorporate": {
      "from": "INCORPORATING",
      "to": "ACTIVE",
      "description": "State approves articles of incorporation, corporation comes into existence",
      "event": {
        "name": "incorporate",
        "payload": {
          "approvalDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "stateFileNumber": {
            "type": "string",
            "required": true
          },
          "certificateOfIncorporation": {
            "type": "string",
            "description": "Document reference"
          }
        }
      },
      "guards": [
        {
          "name": "hasRequiredFormationDocs",
          "description": "Articles of incorporation filed, incorporators signed, registered agent designated",
          "expression": "context.legalName != null && context.jurisdiction.state != null && context.registeredAgent != null && context.incorporators.length > 0"
        },
        {
          "name": "hasAuthorizedShares",
          "description": "At least one share class authorized",
          "expression": "context.shareStructure.classes.length > 0 && context.shareStructure.totalAuthorized > 0"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "formationDate",
          "value": "{{ event.approvalDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "stateIds.{{ context.jurisdiction.state }}",
          "value": "{{ event.stateFileNumber }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "updatedAt",
          "value": "{{ now() }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CORPORATION_FORMED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "legalName": "{{ context.legalName }}",
            "jurisdiction": "{{ context.jurisdiction.state }}",
            "formationDate": "{{ event.approvalDate }}"
          }
        }
      ]
    },
    "amend_charter": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Amend the certificate/articles of incorporation (requires shareholder approval for most amendments)",
      "event": {
        "name": "amend_charter",
        "payload": {
          "amendmentId": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "string",
            "required": true
          },
          "amendmentType": {
            "type": "string",
            "enum": [
              "NAME_CHANGE",
              "SHARE_AUTHORIZATION",
              "PURPOSE_CHANGE",
              "OTHER"
            ],
            "required": true
          },
          "resolutionRef": {
            "type": "string",
            "required": true,
            "description": "Reference to board/shareholder resolution"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "filedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "newShareAuthorization": {
            "type": "object",
            "nullable": true,
            "description": "If increasing/changing authorized shares"
          },
          "newLegalName": {
            "type": "string",
            "nullable": true
          }
        }
      },
      "guards": [
        {
          "name": "hasApprovedResolution",
          "description": "Charter amendment must be backed by an executed resolution",
          "expression": "event.resolutionRef != null",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.resolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "charterAmendments",
          "value": {
            "amendmentId": "{{ event.amendmentId }}",
            "description": "{{ event.description }}",
            "effectiveDate": "{{ event.effectiveDate }}",
            "resolutionRef": "{{ event.resolutionRef }}",
            "filedDate": "{{ event.filedDate }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.newLegalName != null",
          "then": {
            "type": "SET_CONTEXT",
            "path": "legalName",
            "value": "{{ event.newLegalName }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "updatedAt",
          "value": "{{ now() }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CHARTER_AMENDED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "amendmentId": "{{ event.amendmentId }}",
            "amendmentType": "{{ event.amendmentType }}"
          }
        }
      ]
    },
    "update_share_class": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Update authorized shares for an existing class or add new class (requires charter amendment)",
      "event": {
        "name": "update_share_class",
        "payload": {
          "classId": {
            "type": "string",
            "required": true
          },
          "className": {
            "type": "string",
            "required": true
          },
          "authorized": {
            "type": "integer",
            "required": true
          },
          "parValue": {
            "type": "number",
            "required": true
          },
          "votingRights": {
            "type": "boolean",
            "required": true
          },
          "votesPerShare": {
            "type": "number",
            "default": 1
          },
          "liquidationPreference": {
            "type": "number",
            "nullable": true
          },
          "dividendRate": {
            "type": "number",
            "nullable": true
          },
          "convertible": {
            "type": "boolean",
            "default": false
          },
          "charterAmendmentRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "charterAmended",
          "description": "Share class changes require charter amendment to be filed",
          "expression": "context.charterAmendments.some(a => a.amendmentId === event.charterAmendmentRef)"
        }
      ],
      "effects": [
        {
          "type": "UPSERT_ARRAY",
          "path": "shareStructure.classes",
          "matchKey": "classId",
          "matchValue": "{{ event.classId }}",
          "value": {
            "classId": "{{ event.classId }}",
            "className": "{{ event.className }}",
            "authorized": "{{ event.authorized }}",
            "issued": 0,
            "outstanding": 0,
            "treasury": 0,
            "parValue": "{{ event.parValue }}",
            "votingRights": "{{ event.votingRights }}",
            "votesPerShare": "{{ event.votesPerShare }}",
            "liquidationPreference": "{{ event.liquidationPreference }}",
            "dividendRate": "{{ event.dividendRate }}",
            "convertible": "{{ event.convertible }}"
          }
        },
        {
          "type": "COMPUTE",
          "path": "shareStructure.totalAuthorized",
          "expression": "context.shareStructure.classes.reduce((sum, c) => sum + c.authorized, 0)"
        }
      ]
    },
    "update_registered_agent": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Change the registered agent on file with the state",
      "event": {
        "name": "update_registered_agent",
        "payload": {
          "name": {
            "type": "string",
            "required": true
          },
          "address": {
            "type": "object",
            "required": true
          },
          "phone": {
            "type": "string"
          },
          "email": {
            "type": "string"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "filingConfirmation": {
            "type": "string",
            "description": "State filing confirmation number"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "registeredAgent",
          "value": {
            "name": "{{ event.name }}",
            "address": "{{ event.address }}",
            "phone": "{{ event.phone }}",
            "email": "{{ event.email }}",
            "effectiveDate": "{{ event.effectiveDate }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "REGISTERED_AGENT_CHANGED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "newAgent": "{{ event.name }}",
            "effectiveDate": "{{ event.effectiveDate }}"
          }
        }
      ]
    },
    "suspend": {
      "from": "ACTIVE",
      "to": "SUSPENDED",
      "description": "State suspends corporate powers (typically for tax/filing noncompliance)",
      "event": {
        "name": "suspend",
        "payload": {
          "reason": {
            "type": "string",
            "enum": [
              "FRANCHISE_TAX_DELINQUENT",
              "ANNUAL_REPORT_MISSING",
              "REGISTERED_AGENT_LAPSE",
              "ADMINISTRATIVE",
              "OTHER"
            ],
            "required": true
          },
          "suspensionDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "stateNotice": {
            "type": "string",
            "description": "Reference to state notice"
          },
          "cureDeadline": {
            "type": "string",
            "format": "date",
            "nullable": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "suspensionReason",
          "value": "{{ event.reason }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "suspensionDate",
          "value": "{{ event.suspensionDate }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CORPORATION_SUSPENDED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "reason": "{{ event.reason }}",
            "cureDeadline": "{{ event.cureDeadline }}"
          }
        }
      ]
    },
    "reinstate": {
      "from": "SUSPENDED",
      "to": "ACTIVE",
      "description": "Cure deficiencies and reinstate corporate powers",
      "event": {
        "name": "reinstate",
        "payload": {
          "reinstatementDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "curativeActions": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "List of actions taken to cure",
            "required": true
          },
          "stateConfirmation": {
            "type": "string",
            "required": true
          },
          "penaltiesPaid": {
            "type": "number",
            "nullable": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "suspensionReason",
          "value": null
        },
        {
          "type": "SET_CONTEXT",
          "path": "suspensionDate",
          "value": null
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CORPORATION_REINSTATED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "reinstatementDate": "{{ event.reinstatementDate }}"
          }
        }
      ]
    },
    "dissolve_voluntary": {
      "from": "ACTIVE",
      "to": "DISSOLVED",
      "description": "Voluntary dissolution approved by board and shareholders",
      "event": {
        "name": "dissolve_voluntary",
        "payload": {
          "dissolutionDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "shareholderResolutionRef": {
            "type": "string",
            "required": true
          },
          "windingUpPlan": {
            "type": "string",
            "description": "Reference to winding up plan"
          },
          "certificateOfDissolution": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "boardApproved",
          "description": "Board must approve dissolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        },
        {
          "name": "shareholdersApproved",
          "description": "Shareholders must approve dissolution (typically majority or supermajority)",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.shareholderResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "dissolutionDate",
          "value": "{{ event.dissolutionDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "dissolutionReason",
          "value": "VOLUNTARY"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CORPORATION_DISSOLVED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "dissolutionType": "VOLUNTARY",
            "dissolutionDate": "{{ event.dissolutionDate }}"
          }
        }
      ]
    },
    "dissolve_administrative": {
      "from": "SUSPENDED",
      "to": "DISSOLVED",
      "description": "Administrative dissolution by state after prolonged suspension",
      "event": {
        "name": "dissolve_administrative",
        "payload": {
          "dissolutionDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "stateOrder": {
            "type": "string",
            "required": true
          },
          "reason": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "dissolutionDate",
          "value": "{{ event.dissolutionDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "dissolutionReason",
          "value": "ADMINISTRATIVE: {{ event.reason }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "CORPORATION_DISSOLVED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "dissolutionType": "ADMINISTRATIVE",
            "dissolutionDate": "{{ event.dissolutionDate }}"
          }
        }
      ]
    }
  },
  "crossMachineRefs": {
    "board": {
      "machine": "corporate-board",
      "description": "Board of directors for this entity",
      "foreignKey": "entityId"
    },
    "officers": {
      "machine": "corporate-officers",
      "description": "Executive officers for this entity",
      "foreignKey": "entityId"
    },
    "bylaws": {
      "machine": "corporate-bylaws",
      "description": "Governing bylaws for this entity",
      "foreignKey": "entityId"
    },
    "shareholders": {
      "machine": "corporate-shareholders",
      "description": "Shareholder meeting instances",
      "foreignKey": "entityId"
    },
    "securities": {
      "machine": "corporate-securities",
      "description": "Stock issuance records",
      "foreignKey": "entityId"
    },
    "compliance": {
      "machine": "corporate-compliance",
      "description": "Regulatory compliance tracking",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "entity",
      "formation"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/entity"
  }
} as const;

export const corpSecuritiesDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "CorpSecurities",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Securities state machine tracking the lifecycle of equity from authorization through issuance, transfer, and retirement. Manages stock certificates, book entry positions, and restricted securities.",
  "context": {
    "securityId": {
      "type": "string",
      "description": "Unique identifier for this security lot/certificate"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "shareClass": {
      "type": "string",
      "description": "Share class ID from corporate-entity"
    },
    "shareClassName": {
      "type": "string",
      "description": "Human-readable class name"
    },
    "certificateNumber": {
      "type": "string",
      "nullable": true,
      "description": "For certificated shares"
    },
    "cusip": {
      "type": "string",
      "nullable": true,
      "description": "CUSIP number if assigned"
    },
    "shareCount": {
      "type": "integer",
      "description": "Number of shares in this lot"
    },
    "parValue": {
      "type": "number",
      "description": "Par value per share"
    },
    "issuancePrice": {
      "type": "number",
      "nullable": true,
      "description": "Price per share at issuance"
    },
    "issuanceDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "form": {
      "type": "string",
      "enum": [
        "CERTIFICATED",
        "BOOK_ENTRY",
        "DRS"
      ],
      "description": "Physical certificate, book entry, or Direct Registration System"
    },
    "holder": {
      "type": "object",
      "nullable": true,
      "properties": {
        "holderId": {
          "type": "string"
        },
        "holderType": {
          "type": "string",
          "enum": [
            "INDIVIDUAL",
            "ENTITY",
            "TRUST",
            "TREASURY"
          ]
        },
        "name": {
          "type": "string"
        },
        "taxId": {
          "type": "string",
          "nullable": true
        },
        "address": {
          "type": "object",
          "nullable": true
        },
        "acquisitionDate": {
          "type": "string",
          "format": "date"
        },
        "acquisitionMethod": {
          "type": "string",
          "enum": [
            "ORIGINAL_ISSUANCE",
            "PURCHASE",
            "GIFT",
            "INHERITANCE",
            "STOCK_SPLIT",
            "CONVERSION",
            "EXERCISE"
          ]
        },
        "costBasis": {
          "type": "number",
          "nullable": true
        }
      }
    },
    "restrictions": {
      "type": "object",
      "properties": {
        "isRestricted": {
          "type": "boolean",
          "default": false
        },
        "restrictionType": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "RULE_144",
              "SECTION_4(a)(2)",
              "REG_D",
              "REG_S",
              "LOCK_UP",
              "VESTING",
              "RIGHT_OF_FIRST_REFUSAL"
            ]
          }
        },
        "restrictionEndDate": {
          "type": "string",
          "format": "date",
          "nullable": true
        },
        "legends": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Legend text on certificates"
        },
        "vestingSchedule": {
          "type": "object",
          "nullable": true,
          "properties": {
            "vestingStartDate": {
              "type": "string",
              "format": "date"
            },
            "totalShares": {
              "type": "integer"
            },
            "vestedShares": {
              "type": "integer"
            },
            "vestingScheduleRef": {
              "type": "string"
            }
          }
        },
        "lockUpExpiration": {
          "type": "string",
          "format": "date",
          "nullable": true
        },
        "rofr": {
          "type": "object",
          "nullable": true,
          "description": "Right of First Refusal",
          "properties": {
            "holderIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "noticePeriodDays": {
              "type": "integer"
            }
          }
        }
      }
    },
    "authorization": {
      "type": "object",
      "nullable": true,
      "description": "For shares in AUTHORIZED state",
      "properties": {
        "authorizedDate": {
          "type": "string",
          "format": "date"
        },
        "charterProvision": {
          "type": "string"
        },
        "authorizedShares": {
          "type": "integer"
        }
      }
    },
    "issuanceDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "boardResolutionRef": {
          "type": "string"
        },
        "issuanceAgreementRef": {
          "type": "string"
        },
        "consideration": {
          "type": "object",
          "properties": {
            "type": {
              "type": "string",
              "enum": [
                "CASH",
                "PROPERTY",
                "SERVICES",
                "DEBT_CONVERSION",
                "STOCK_CONVERSION"
              ]
            },
            "value": {
              "type": "number"
            },
            "description": {
              "type": "string"
            }
          }
        },
        "exemptionUsed": {
          "type": "string",
          "nullable": true
        },
        "accreditedInvestor": {
          "type": "boolean",
          "nullable": true
        }
      }
    },
    "transferHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "transferId": {
            "type": "string"
          },
          "transferDate": {
            "type": "string",
            "format": "date"
          },
          "fromHolderId": {
            "type": "string"
          },
          "toHolderId": {
            "type": "string"
          },
          "shares": {
            "type": "integer"
          },
          "transferType": {
            "type": "string",
            "enum": [
              "SALE",
              "GIFT",
              "INHERITANCE",
              "INTERNAL"
            ]
          },
          "pricePerShare": {
            "type": "number",
            "nullable": true
          },
          "transferAgentConfirmation": {
            "type": "string",
            "nullable": true
          }
        }
      }
    },
    "corporateActions": {
      "type": "array",
      "description": "Stock splits, dividends, etc. affecting this lot",
      "items": {
        "type": "object",
        "properties": {
          "actionId": {
            "type": "string"
          },
          "actionType": {
            "type": "string",
            "enum": [
              "STOCK_SPLIT",
              "REVERSE_SPLIT",
              "STOCK_DIVIDEND",
              "CONVERSION",
              "RECLASSIFICATION"
            ]
          },
          "actionDate": {
            "type": "string",
            "format": "date"
          },
          "ratio": {
            "type": "string",
            "nullable": true,
            "description": "e.g., 2:1 for split"
          },
          "sharesBeforeAction": {
            "type": "integer"
          },
          "sharesAfterAction": {
            "type": "integer"
          },
          "resolutionRef": {
            "type": "string"
          }
        }
      }
    },
    "retirementDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "retiredDate": {
          "type": "string",
          "format": "date"
        },
        "retirementMethod": {
          "type": "string",
          "enum": [
            "REPURCHASE",
            "REDEMPTION",
            "CANCELLATION",
            "CONVERSION"
          ]
        },
        "repurchasePrice": {
          "type": "number",
          "nullable": true
        },
        "boardResolutionRef": {
          "type": "string"
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "states": {
    "AUTHORIZED": {
      "description": "Shares authorized by charter but not yet issued",
      "metadata": null
    },
    "ISSUED": {
      "description": "Shares issued and held by a shareholder",
      "metadata": null
    },
    "TREASURY": {
      "description": "Shares repurchased and held by the company",
      "metadata": null
    },
    "TRANSFERRED": {
      "description": "Transitional state during transfer between holders",
      "metadata": null
    },
    "RETIRED": {
      "description": "Shares cancelled and returned to authorized but unissued",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "AUTHORIZED",
  "transitions": {
    "authorize_shares": {
      "from": null,
      "to": "AUTHORIZED",
      "description": "Record shares as authorized per charter/amendment",
      "event": {
        "name": "authorize_shares",
        "payload": {
          "securityId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "shareClass": {
            "type": "string",
            "required": true
          },
          "shareClassName": {
            "type": "string",
            "required": true
          },
          "shareCount": {
            "type": "integer",
            "required": true
          },
          "parValue": {
            "type": "number",
            "required": true
          },
          "authorizedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "charterProvision": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "securityId",
          "value": "{{ event.securityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "shareClass",
          "value": "{{ event.shareClass }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "shareClassName",
          "value": "{{ event.shareClassName }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "shareCount",
          "value": "{{ event.shareCount }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "parValue",
          "value": "{{ event.parValue }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "authorization",
          "value": {
            "authorizedDate": "{{ event.authorizedDate }}",
            "charterProvision": "{{ event.charterProvision }}",
            "authorizedShares": "{{ event.shareCount }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "transferHistory",
          "value": []
        },
        {
          "type": "SET_CONTEXT",
          "path": "corporateActions",
          "value": []
        }
      ]
    },
    "issue_shares": {
      "from": "AUTHORIZED",
      "to": "ISSUED",
      "description": "Issue shares to a holder",
      "event": {
        "name": "issue_shares",
        "payload": {
          "holderId": {
            "type": "string",
            "required": true
          },
          "holderType": {
            "type": "string",
            "required": true
          },
          "holderName": {
            "type": "string",
            "required": true
          },
          "address": {
            "type": "object"
          },
          "issuanceDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "issuancePrice": {
            "type": "number"
          },
          "form": {
            "type": "string",
            "enum": [
              "CERTIFICATED",
              "BOOK_ENTRY",
              "DRS"
            ],
            "required": true
          },
          "certificateNumber": {
            "type": "string"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "consideration": {
            "type": "object",
            "required": true
          },
          "isRestricted": {
            "type": "boolean",
            "default": false
          },
          "restrictionType": {
            "type": "array"
          },
          "legends": {
            "type": "array"
          },
          "exemptionUsed": {
            "type": "string"
          },
          "accreditedInvestor": {
            "type": "boolean"
          }
        }
      },
      "guards": [
        {
          "name": "hasIssuanceResolution",
          "description": "Board must have approved stock issuance",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        },
        {
          "name": "entityIsActive",
          "description": "Cannot issue stock if corporation is suspended or dissolved",
          "crossMachine": {
            "machine": "corporate-entity",
            "instanceRef": "{{ context.entityId }}",
            "requiredState": "ACTIVE"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "form",
          "value": "{{ event.form }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "certificateNumber",
          "value": "{{ event.certificateNumber }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "issuanceDate",
          "value": "{{ event.issuanceDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "issuancePrice",
          "value": "{{ event.issuancePrice }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "holder",
          "value": {
            "holderId": "{{ event.holderId }}",
            "holderType": "{{ event.holderType }}",
            "name": "{{ event.holderName }}",
            "address": "{{ event.address }}",
            "acquisitionDate": "{{ event.issuanceDate }}",
            "acquisitionMethod": "ORIGINAL_ISSUANCE",
            "costBasis": "{{ event.issuancePrice * context.shareCount }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "restrictions",
          "value": {
            "isRestricted": "{{ event.isRestricted }}",
            "restrictionType": "{{ event.restrictionType }}",
            "legends": "{{ event.legends }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "issuanceDetails",
          "value": {
            "boardResolutionRef": "{{ event.boardResolutionRef }}",
            "consideration": "{{ event.consideration }}",
            "exemptionUsed": "{{ event.exemptionUsed }}",
            "accreditedInvestor": "{{ event.accreditedInvestor }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SHARES_ISSUED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "entityId": "{{ context.entityId }}",
            "shareClass": "{{ context.shareClassName }}",
            "shares": "{{ context.shareCount }}",
            "holderId": "{{ event.holderId }}",
            "holderName": "{{ event.holderName }}"
          }
        }
      ]
    },
    "initiate_transfer": {
      "from": "ISSUED",
      "to": "TRANSFERRED",
      "description": "Begin transfer of shares to new holder",
      "event": {
        "name": "initiate_transfer",
        "payload": {
          "transferId": {
            "type": "string",
            "required": true
          },
          "toHolderId": {
            "type": "string",
            "required": true
          },
          "toHolderName": {
            "type": "string",
            "required": true
          },
          "toHolderType": {
            "type": "string",
            "required": true
          },
          "toAddress": {
            "type": "object"
          },
          "transferType": {
            "type": "string",
            "required": true
          },
          "pricePerShare": {
            "type": "number"
          },
          "transferDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "restrictionsCleared",
          "description": "Must clear any transfer restrictions",
          "expression": "!context.restrictions.isRestricted || context.restrictions.restrictionEndDate == null || new Date() >= new Date(context.restrictions.restrictionEndDate)"
        },
        {
          "name": "rofrSatisfied",
          "description": "Right of first refusal must be waived or expired",
          "expression": "context.restrictions.rofr == null"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "transferHistory",
          "value": {
            "transferId": "{{ event.transferId }}",
            "transferDate": "{{ event.transferDate }}",
            "fromHolderId": "{{ context.holder.holderId }}",
            "toHolderId": "{{ event.toHolderId }}",
            "shares": "{{ context.shareCount }}",
            "transferType": "{{ event.transferType }}",
            "pricePerShare": "{{ event.pricePerShare }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "TRANSFER_INITIATED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "transferId": "{{ event.transferId }}",
            "fromHolderId": "{{ context.holder.holderId }}",
            "toHolderId": "{{ event.toHolderId }}"
          }
        }
      ]
    },
    "complete_transfer": {
      "from": "TRANSFERRED",
      "to": "ISSUED",
      "description": "Complete the transfer, update holder",
      "event": {
        "name": "complete_transfer",
        "payload": {
          "transferAgentConfirmation": {
            "type": "string"
          },
          "newCertificateNumber": {
            "type": "string"
          },
          "toHolderId": {
            "type": "string",
            "required": true
          },
          "toHolderName": {
            "type": "string",
            "required": true
          },
          "toHolderType": {
            "type": "string",
            "required": true
          },
          "toAddress": {
            "type": "object"
          },
          "completedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "costBasis": {
            "type": "number"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "holder",
          "value": {
            "holderId": "{{ event.toHolderId }}",
            "holderType": "{{ event.toHolderType }}",
            "name": "{{ event.toHolderName }}",
            "address": "{{ event.toAddress }}",
            "acquisitionDate": "{{ event.completedDate }}",
            "acquisitionMethod": "PURCHASE",
            "costBasis": "{{ event.costBasis }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.newCertificateNumber != null",
          "then": {
            "type": "SET_CONTEXT",
            "path": "certificateNumber",
            "value": "{{ event.newCertificateNumber }}"
          }
        },
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "transferHistory",
          "matchKey": "toHolderId",
          "matchValue": "{{ event.toHolderId }}",
          "updates": {
            "transferAgentConfirmation": "{{ event.transferAgentConfirmation }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "TRANSFER_COMPLETED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "newHolderId": "{{ event.toHolderId }}"
          }
        }
      ]
    },
    "repurchase": {
      "from": "ISSUED",
      "to": "TREASURY",
      "description": "Company repurchases shares from holder",
      "event": {
        "name": "repurchase",
        "payload": {
          "repurchaseDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "pricePerShare": {
            "type": "number",
            "required": true
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "repurchaseAgreementRef": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "hasRepurchaseResolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "transferHistory",
          "value": {
            "transferId": "REPURCHASE-{{ event.repurchaseDate }}",
            "transferDate": "{{ event.repurchaseDate }}",
            "fromHolderId": "{{ context.holder.holderId }}",
            "toHolderId": "TREASURY",
            "shares": "{{ context.shareCount }}",
            "transferType": "INTERNAL",
            "pricePerShare": "{{ event.pricePerShare }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "holder",
          "value": {
            "holderId": "TREASURY",
            "holderType": "TREASURY",
            "name": "Treasury Stock",
            "acquisitionDate": "{{ event.repurchaseDate }}",
            "acquisitionMethod": "PURCHASE",
            "costBasis": "{{ event.pricePerShare * context.shareCount }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SHARES_REPURCHASED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "shares": "{{ context.shareCount }}",
            "pricePerShare": "{{ event.pricePerShare }}"
          }
        }
      ]
    },
    "reissue_from_treasury": {
      "from": "TREASURY",
      "to": "ISSUED",
      "description": "Reissue treasury shares to a new holder",
      "event": {
        "name": "reissue_from_treasury",
        "payload": {
          "holderId": {
            "type": "string",
            "required": true
          },
          "holderName": {
            "type": "string",
            "required": true
          },
          "holderType": {
            "type": "string",
            "required": true
          },
          "address": {
            "type": "object"
          },
          "reissueDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "issuancePrice": {
            "type": "number"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasReissueResolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "holder",
          "value": {
            "holderId": "{{ event.holderId }}",
            "holderType": "{{ event.holderType }}",
            "name": "{{ event.holderName }}",
            "address": "{{ event.address }}",
            "acquisitionDate": "{{ event.reissueDate }}",
            "acquisitionMethod": "PURCHASE",
            "costBasis": "{{ event.issuancePrice * context.shareCount }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "TREASURY_SHARES_REISSUED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "holderId": "{{ event.holderId }}"
          }
        }
      ]
    },
    "retire": {
      "from": [
        "ISSUED",
        "TREASURY"
      ],
      "to": "RETIRED",
      "description": "Retire shares (cancel them)",
      "event": {
        "name": "retire",
        "payload": {
          "retiredDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "retirementMethod": {
            "type": "string",
            "required": true
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "repurchasePrice": {
            "type": "number"
          }
        }
      },
      "guards": [
        {
          "name": "hasRetirementResolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "retirementDetails",
          "value": {
            "retiredDate": "{{ event.retiredDate }}",
            "retirementMethod": "{{ event.retirementMethod }}",
            "repurchasePrice": "{{ event.repurchasePrice }}",
            "boardResolutionRef": "{{ event.boardResolutionRef }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "holder",
          "value": null
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SHARES_RETIRED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "shareClass": "{{ context.shareClassName }}",
            "shares": "{{ context.shareCount }}"
          }
        }
      ]
    },
    "stock_split": {
      "from": "ISSUED",
      "to": "ISSUED",
      "description": "Apply stock split to this lot",
      "event": {
        "name": "stock_split",
        "payload": {
          "actionId": {
            "type": "string",
            "required": true
          },
          "splitRatio": {
            "type": "string",
            "required": true,
            "description": "e.g., '2:1' for 2-for-1 split"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          },
          "newShareCount": {
            "type": "integer",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "corporateActions",
          "value": {
            "actionId": "{{ event.actionId }}",
            "actionType": "STOCK_SPLIT",
            "actionDate": "{{ event.effectiveDate }}",
            "ratio": "{{ event.splitRatio }}",
            "sharesBeforeAction": "{{ context.shareCount }}",
            "sharesAfterAction": "{{ event.newShareCount }}",
            "resolutionRef": "{{ event.resolutionRef }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "shareCount",
          "value": "{{ event.newShareCount }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "STOCK_SPLIT_APPLIED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "ratio": "{{ event.splitRatio }}",
            "newShareCount": "{{ event.newShareCount }}"
          }
        }
      ]
    },
    "declare_dividend": {
      "from": "ISSUED",
      "to": "ISSUED",
      "description": "Record dividend declaration affecting this lot (for stock dividends)",
      "event": {
        "name": "declare_dividend",
        "payload": {
          "actionId": {
            "type": "string",
            "required": true
          },
          "dividendType": {
            "type": "string",
            "enum": [
              "CASH",
              "STOCK"
            ],
            "required": true
          },
          "recordDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "paymentDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "cashAmount": {
            "type": "number"
          },
          "stockShares": {
            "type": "integer"
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasDividendResolution",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.resolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "CONDITIONAL",
          "condition": "event.dividendType === 'STOCK'",
          "then": {
            "type": "APPEND_ARRAY",
            "path": "corporateActions",
            "value": {
              "actionId": "{{ event.actionId }}",
              "actionType": "STOCK_DIVIDEND",
              "actionDate": "{{ event.paymentDate }}",
              "sharesBeforeAction": "{{ context.shareCount }}",
              "sharesAfterAction": "{{ context.shareCount + event.stockShares }}",
              "resolutionRef": "{{ event.resolutionRef }}"
            }
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.dividendType === 'STOCK'",
          "then": {
            "type": "INCREMENT",
            "path": "shareCount",
            "amount": "{{ event.stockShares }}"
          }
        }
      ]
    },
    "remove_restriction": {
      "from": "ISSUED",
      "to": "ISSUED",
      "description": "Remove or update restrictions on the shares",
      "event": {
        "name": "remove_restriction",
        "payload": {
          "restrictionType": {
            "type": "string",
            "required": true
          },
          "removedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "reason": {
            "type": "string"
          },
          "legalOpinionRef": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY",
          "path": "restrictions.restrictionType",
          "operation": "REMOVE",
          "value": "{{ event.restrictionType }}"
        },
        {
          "type": "COMPUTE",
          "path": "restrictions.isRestricted",
          "expression": "context.restrictions.restrictionType.length > 0"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESTRICTION_REMOVED",
          "payload": {
            "securityId": "{{ context.securityId }}",
            "restrictionType": "{{ event.restrictionType }}"
          }
        }
      ]
    }
  },
  "crossMachineRefs": {
    "entity": {
      "machine": "corporate-entity",
      "description": "Parent corporate entity with share class definitions",
      "foreignKey": "entityId"
    },
    "resolutions": {
      "machine": "corporate-resolution",
      "description": "Board resolutions authorizing securities actions",
      "foreignKey": "entityId"
    },
    "shareholders": {
      "machine": "corporate-shareholders",
      "description": "Shareholder meetings for determining voting rights",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "securities",
      "stock",
      "equity",
      "certificates"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/securities"
  }
} as const;

export const corpShareholdersDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "CorpShareholders",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Shareholder meeting state machine managing annual/special meetings, record dates, proxy periods, voting, and certification of results. Supports multiple share classes and cumulative voting.",
  "context": {
    "meetingId": {
      "type": "string",
      "description": "Unique identifier for this shareholder meeting"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "meetingType": {
      "type": "string",
      "enum": [
        "ANNUAL",
        "SPECIAL"
      ],
      "description": "Annual meetings are required; special meetings called for specific purposes"
    },
    "fiscalYear": {
      "type": "integer",
      "description": "Fiscal year for annual meetings"
    },
    "scheduledDate": {
      "type": "string",
      "format": "date-time"
    },
    "location": {
      "type": "object",
      "properties": {
        "physical": {
          "type": "string",
          "nullable": true
        },
        "virtualUrl": {
          "type": "string",
          "nullable": true
        },
        "isHybrid": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "calledBy": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "BOARD",
            "SHAREHOLDERS",
            "COURT"
          ]
        },
        "resolutionRef": {
          "type": "string",
          "nullable": true
        },
        "shareholderPetitionRef": {
          "type": "string",
          "nullable": true
        },
        "courtOrderRef": {
          "type": "string",
          "nullable": true
        }
      }
    },
    "noticeInfo": {
      "type": "object",
      "properties": {
        "noticeSentDate": {
          "type": "string",
          "format": "date"
        },
        "noticeMethod": {
          "type": "string",
          "enum": [
            "MAIL",
            "EMAIL",
            "ELECTRONIC_ACCESS"
          ]
        },
        "minimumNoticeDays": {
          "type": "integer",
          "default": 10
        },
        "maximumNoticeDays": {
          "type": "integer",
          "default": 60
        }
      }
    },
    "recordDate": {
      "type": "object",
      "nullable": true,
      "properties": {
        "date": {
          "type": "string",
          "format": "date"
        },
        "setByBoardOn": {
          "type": "string",
          "format": "date"
        },
        "resolutionRef": {
          "type": "string"
        }
      }
    },
    "eligibleVoters": {
      "type": "array",
      "description": "Shareholders as of record date with their share counts",
      "items": {
        "type": "object",
        "properties": {
          "shareholderId": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "shareholdings": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "shareClass": {
                  "type": "string"
                },
                "shares": {
                  "type": "integer"
                },
                "votes": {
                  "type": "integer",
                  "description": "Votes this holding represents"
                }
              }
            }
          },
          "totalVotes": {
            "type": "integer"
          },
          "proxyGrantedTo": {
            "type": "string",
            "nullable": true,
            "description": "Proxy holder ID if proxied"
          },
          "hasVoted": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    "quorumRequirements": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "SHARES_REPRESENTED",
            "SHARES_OUTSTANDING"
          ]
        },
        "threshold": {
          "type": "number",
          "default": 0.5,
          "description": "Fraction required for quorum"
        },
        "sharesRequired": {
          "type": "integer"
        },
        "sharesRepresented": {
          "type": "integer",
          "default": 0
        },
        "quorumMet": {
          "type": "boolean",
          "default": false
        }
      }
    },
    "agenda": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "itemId": {
            "type": "string"
          },
          "itemNumber": {
            "type": "integer"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "DIRECTOR_ELECTION",
              "AUDITOR_RATIFICATION",
              "SAY_ON_PAY",
              "CHARTER_AMENDMENT",
              "MERGER",
              "STOCK_PLAN",
              "SHAREHOLDER_PROPOSAL",
              "OTHER"
            ]
          },
          "voteRequired": {
            "type": "string",
            "enum": [
              "PLURALITY",
              "MAJORITY_CAST",
              "MAJORITY_OUTSTANDING",
              "SUPERMAJORITY",
              "UNANIMOUS"
            ],
            "description": "Vote threshold for approval"
          },
          "supermajorityThreshold": {
            "type": "number",
            "nullable": true
          },
          "eligibleClasses": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Share classes that can vote on this item"
          },
          "allowCumulativeVoting": {
            "type": "boolean",
            "default": false,
            "description": "For director elections"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "VOTING",
              "CLOSED",
              "APPROVED",
              "REJECTED"
            ]
          }
        }
      }
    },
    "proxyPeriod": {
      "type": "object",
      "nullable": true,
      "properties": {
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "endDate": {
          "type": "string",
          "format": "date-time",
          "description": "Usually meeting start time"
        },
        "proxyMaterials": {
          "type": "object",
          "properties": {
            "proxyStatementRef": {
              "type": "string"
            },
            "formOfProxyRef": {
              "type": "string"
            },
            "annualReportRef": {
              "type": "string",
              "nullable": true
            }
          }
        }
      }
    },
    "votes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "voteId": {
            "type": "string"
          },
          "agendaItemId": {
            "type": "string"
          },
          "voterId": {
            "type": "string",
            "description": "Shareholder or proxy holder ID"
          },
          "shareholderId": {
            "type": "string",
            "description": "Beneficial owner"
          },
          "shareClass": {
            "type": "string"
          },
          "votesFor": {
            "type": "integer",
            "default": 0
          },
          "votesAgainst": {
            "type": "integer",
            "default": 0
          },
          "votesAbstain": {
            "type": "integer",
            "default": 0
          },
          "votesWithhold": {
            "type": "integer",
            "default": 0,
            "description": "For director elections"
          },
          "cumulativeVoteAllocation": {
            "type": "object",
            "additionalProperties": {
              "type": "integer"
            },
            "nullable": true,
            "description": "For cumulative voting: candidate ID -> votes allocated"
          },
          "viaProxy": {
            "type": "boolean",
            "default": false
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    },
    "voteTallies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "agendaItemId": {
            "type": "string"
          },
          "forVotes": {
            "type": "integer",
            "default": 0
          },
          "againstVotes": {
            "type": "integer",
            "default": 0
          },
          "abstainVotes": {
            "type": "integer",
            "default": 0
          },
          "withholdVotes": {
            "type": "integer",
            "default": 0
          },
          "brokerNonVotes": {
            "type": "integer",
            "default": 0
          },
          "candidateVotes": {
            "type": "object",
            "additionalProperties": {
              "type": "integer"
            },
            "nullable": true,
            "description": "For director elections: candidate ID -> total votes"
          },
          "result": {
            "type": "string",
            "enum": [
              "APPROVED",
              "REJECTED",
              "PENDING"
            ]
          },
          "certified": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    "inspectorOfElections": {
      "type": "object",
      "nullable": true,
      "properties": {
        "name": {
          "type": "string"
        },
        "company": {
          "type": "string",
          "nullable": true
        },
        "appointedBy": {
          "type": "string"
        },
        "appointmentDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "sessionInfo": {
      "type": "object",
      "nullable": true,
      "properties": {
        "openedAt": {
          "type": "string",
          "format": "date-time"
        },
        "chairPerson": {
          "type": "string"
        },
        "secretaryPresent": {
          "type": "string"
        },
        "pollsOpenedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "pollsClosedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "adjournedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "minutesRef": {
          "type": "string",
          "nullable": true
        }
      }
    },
    "certification": {
      "type": "object",
      "nullable": true,
      "properties": {
        "certifiedAt": {
          "type": "string",
          "format": "date-time"
        },
        "certifiedBy": {
          "type": "string"
        },
        "certificateRef": {
          "type": "string"
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "states": {
    "SCHEDULED": {
      "description": "Meeting has been scheduled but record date not yet set",
      "metadata": null
    },
    "RECORD_DATE_SET": {
      "description": "Record date established; eligible shareholders determined",
      "metadata": null
    },
    "PROXY_PERIOD": {
      "description": "Proxy materials distributed; shareholders may submit proxies",
      "metadata": null
    },
    "IN_SESSION": {
      "description": "Meeting is convened and in progress",
      "metadata": null
    },
    "VOTING": {
      "description": "Polls are open for voting on agenda items",
      "metadata": null
    },
    "CLOSED": {
      "description": "Meeting concluded; results certified",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "SCHEDULED",
  "transitions": {
    "schedule_annual": {
      "from": null,
      "to": "SCHEDULED",
      "description": "Schedule an annual shareholder meeting",
      "event": {
        "name": "schedule_annual",
        "payload": {
          "meetingId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "fiscalYear": {
            "type": "integer",
            "required": true
          },
          "scheduledDate": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "location": {
            "type": "object"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "boardApproved",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.boardResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "meetingId",
          "value": "{{ event.meetingId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "meetingType",
          "value": "ANNUAL"
        },
        {
          "type": "SET_CONTEXT",
          "path": "fiscalYear",
          "value": "{{ event.fiscalYear }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "scheduledDate",
          "value": "{{ event.scheduledDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "location",
          "value": "{{ event.location }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "calledBy",
          "value": {
            "type": "BOARD",
            "resolutionRef": "{{ event.boardResolutionRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SHAREHOLDER_MEETING_SCHEDULED",
          "payload": {
            "meetingId": "{{ event.meetingId }}",
            "type": "ANNUAL",
            "scheduledDate": "{{ event.scheduledDate }}"
          }
        }
      ]
    },
    "schedule_special": {
      "from": null,
      "to": "SCHEDULED",
      "description": "Schedule a special shareholder meeting",
      "event": {
        "name": "schedule_special",
        "payload": {
          "meetingId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "scheduledDate": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "location": {
            "type": "object"
          },
          "purpose": {
            "type": "string",
            "required": true,
            "description": "Specific purpose for special meeting"
          },
          "calledByType": {
            "type": "string",
            "enum": [
              "BOARD",
              "SHAREHOLDERS",
              "COURT"
            ],
            "required": true
          },
          "resolutionRef": {
            "type": "string"
          },
          "petitionRef": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "meetingId",
          "value": "{{ event.meetingId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "meetingType",
          "value": "SPECIAL"
        },
        {
          "type": "SET_CONTEXT",
          "path": "scheduledDate",
          "value": "{{ event.scheduledDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "calledBy.type",
          "value": "{{ event.calledByType }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SPECIAL_MEETING_SCHEDULED",
          "payload": {
            "meetingId": "{{ event.meetingId }}",
            "purpose": "{{ event.purpose }}"
          }
        }
      ]
    },
    "set_record_date": {
      "from": "SCHEDULED",
      "to": "RECORD_DATE_SET",
      "description": "Board sets the record date for determining eligible shareholders",
      "event": {
        "name": "set_record_date",
        "payload": {
          "recordDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "validRecordDateTiming",
          "description": "Record date must be 10-60 days before meeting (per most state laws)",
          "expression": "true"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "recordDate",
          "value": {
            "date": "{{ event.recordDate }}",
            "setByBoardOn": "{{ today() }}",
            "resolutionRef": "{{ event.resolutionRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RECORD_DATE_SET",
          "payload": {
            "meetingId": "{{ context.meetingId }}",
            "recordDate": "{{ event.recordDate }}"
          }
        }
      ]
    },
    "register_eligible_shareholders": {
      "from": "RECORD_DATE_SET",
      "to": "RECORD_DATE_SET",
      "description": "Register shareholders of record as of record date",
      "event": {
        "name": "register_eligible_shareholders",
        "payload": {
          "shareholders": {
            "type": "array",
            "required": true,
            "items": {
              "type": "object",
              "properties": {
                "shareholderId": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "shareholdings": {
                  "type": "array"
                }
              }
            }
          },
          "totalSharesOutstanding": {
            "type": "integer",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "eligibleVoters",
          "value": "{{ event.shareholders }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "quorumRequirements.sharesRequired",
          "value": "{{ Math.ceil(event.totalSharesOutstanding * 0.5) }}"
        }
      ]
    },
    "open_proxy_period": {
      "from": "RECORD_DATE_SET",
      "to": "PROXY_PERIOD",
      "description": "Distribute proxy materials and open proxy solicitation period",
      "event": {
        "name": "open_proxy_period",
        "payload": {
          "startDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "proxyStatementRef": {
            "type": "string",
            "required": true
          },
          "formOfProxyRef": {
            "type": "string",
            "required": true
          },
          "annualReportRef": {
            "type": "string"
          },
          "agenda": {
            "type": "array",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "proxyPeriod",
          "value": {
            "startDate": "{{ event.startDate }}",
            "endDate": "{{ context.scheduledDate }}",
            "proxyMaterials": {
              "proxyStatementRef": "{{ event.proxyStatementRef }}",
              "formOfProxyRef": "{{ event.formOfProxyRef }}",
              "annualReportRef": "{{ event.annualReportRef }}"
            }
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "agenda",
          "value": "{{ event.agenda }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "noticeInfo.noticeSentDate",
          "value": "{{ event.startDate }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_PERIOD_OPENED",
          "payload": {
            "meetingId": "{{ context.meetingId }}",
            "proxyStatementRef": "{{ event.proxyStatementRef }}"
          }
        }
      ]
    },
    "add_agenda_item": {
      "from": [
        "SCHEDULED",
        "RECORD_DATE_SET",
        "PROXY_PERIOD"
      ],
      "to": null,
      "description": "Add an item to the meeting agenda (e.g., shareholder proposal)",
      "event": {
        "name": "add_agenda_item",
        "payload": {
          "itemId": {
            "type": "string",
            "required": true
          },
          "title": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "required": true
          },
          "voteRequired": {
            "type": "string",
            "required": true
          },
          "eligibleClasses": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "allowCumulativeVoting": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "agenda",
          "value": {
            "itemId": "{{ event.itemId }}",
            "itemNumber": "{{ context.agenda.length + 1 }}",
            "title": "{{ event.title }}",
            "description": "{{ event.description }}",
            "type": "{{ event.type }}",
            "voteRequired": "{{ event.voteRequired }}",
            "eligibleClasses": "{{ event.eligibleClasses }}",
            "allowCumulativeVoting": "{{ event.allowCumulativeVoting }}",
            "status": "PENDING"
          }
        }
      ]
    },
    "open_meeting": {
      "from": "PROXY_PERIOD",
      "to": "IN_SESSION",
      "description": "Convene the shareholder meeting",
      "event": {
        "name": "open_meeting",
        "payload": {
          "openedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "chairPerson": {
            "type": "string",
            "required": true
          },
          "secretaryPresent": {
            "type": "string",
            "required": true
          },
          "inspectorOfElections": {
            "type": "object"
          },
          "initialQuorumCount": {
            "type": "integer",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "quorumPresentOrRepresented",
          "description": "Must have quorum to proceed",
          "expression": "event.initialQuorumCount >= context.quorumRequirements.sharesRequired"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo",
          "value": {
            "openedAt": "{{ event.openedAt }}",
            "chairPerson": "{{ event.chairPerson }}",
            "secretaryPresent": "{{ event.secretaryPresent }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "inspectorOfElections",
          "value": "{{ event.inspectorOfElections }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "quorumRequirements.sharesRepresented",
          "value": "{{ event.initialQuorumCount }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "quorumRequirements.quorumMet",
          "value": true
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "SHAREHOLDER_MEETING_OPENED",
          "payload": {
            "meetingId": "{{ context.meetingId }}",
            "sharesRepresented": "{{ event.initialQuorumCount }}"
          }
        }
      ]
    },
    "open_polls": {
      "from": "IN_SESSION",
      "to": "VOTING",
      "description": "Open polls for voting on agenda items",
      "event": {
        "name": "open_polls",
        "payload": {
          "pollsOpenedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo.pollsOpenedAt",
          "value": "{{ event.pollsOpenedAt }}"
        },
        {
          "type": "UPDATE_ARRAY_ALL",
          "path": "agenda",
          "updates": {
            "status": "VOTING"
          }
        }
      ]
    },
    "cast_vote": {
      "from": "VOTING",
      "to": "VOTING",
      "description": "Record a vote from a shareholder or proxy holder",
      "event": {
        "name": "cast_vote",
        "payload": {
          "voteId": {
            "type": "string",
            "required": true
          },
          "agendaItemId": {
            "type": "string",
            "required": true
          },
          "voterId": {
            "type": "string",
            "required": true
          },
          "shareholderId": {
            "type": "string",
            "required": true
          },
          "shareClass": {
            "type": "string",
            "required": true
          },
          "votesFor": {
            "type": "integer",
            "default": 0
          },
          "votesAgainst": {
            "type": "integer",
            "default": 0
          },
          "votesAbstain": {
            "type": "integer",
            "default": 0
          },
          "votesWithhold": {
            "type": "integer",
            "default": 0
          },
          "cumulativeVoteAllocation": {
            "type": "object",
            "nullable": true
          },
          "viaProxy": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "guards": [
        {
          "name": "isEligibleVoter",
          "expression": "context.eligibleVoters.some(v => v.shareholderId === event.shareholderId)"
        },
        {
          "name": "hasNotAlreadyVoted",
          "description": "Shareholder cannot vote twice on same item",
          "expression": "!context.votes.some(v => v.shareholderId === event.shareholderId && v.agendaItemId === event.agendaItemId)"
        },
        {
          "name": "validProxyIfApplicable",
          "description": "If voting via proxy, proxy must be valid",
          "expression": "!event.viaProxy || true",
          "crossMachine": {
            "machine": "corporate-proxy",
            "condition": "event.viaProxy",
            "query": "findByGrantor(event.shareholderId)",
            "requiredState": "ACTIVE"
          }
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "votes",
          "value": {
            "voteId": "{{ event.voteId }}",
            "agendaItemId": "{{ event.agendaItemId }}",
            "voterId": "{{ event.voterId }}",
            "shareholderId": "{{ event.shareholderId }}",
            "shareClass": "{{ event.shareClass }}",
            "votesFor": "{{ event.votesFor }}",
            "votesAgainst": "{{ event.votesAgainst }}",
            "votesAbstain": "{{ event.votesAbstain }}",
            "votesWithhold": "{{ event.votesWithhold }}",
            "cumulativeVoteAllocation": "{{ event.cumulativeVoteAllocation }}",
            "viaProxy": "{{ event.viaProxy }}",
            "timestamp": "{{ now() }}"
          }
        },
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "eligibleVoters",
          "matchKey": "shareholderId",
          "matchValue": "{{ event.shareholderId }}",
          "updates": {
            "hasVoted": true
          }
        }
      ]
    },
    "close_polls": {
      "from": "VOTING",
      "to": "IN_SESSION",
      "description": "Close polls and begin vote tabulation",
      "event": {
        "name": "close_polls",
        "payload": {
          "pollsClosedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo.pollsClosedAt",
          "value": "{{ event.pollsClosedAt }}"
        },
        {
          "type": "UPDATE_ARRAY_ALL",
          "path": "agenda",
          "updates": {
            "status": "CLOSED"
          }
        },
        {
          "type": "COMPUTE_TALLIES",
          "description": "Aggregate votes by agenda item",
          "targetPath": "voteTallies"
        }
      ]
    },
    "certify_results": {
      "from": "IN_SESSION",
      "to": "CLOSED",
      "description": "Inspector of elections certifies vote results",
      "event": {
        "name": "certify_results",
        "payload": {
          "certifiedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "certifiedBy": {
            "type": "string",
            "required": true
          },
          "certificateRef": {
            "type": "string",
            "required": true
          },
          "results": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "agendaItemId": {
                  "type": "string"
                },
                "result": {
                  "type": "string",
                  "enum": [
                    "APPROVED",
                    "REJECTED"
                  ]
                }
              }
            }
          },
          "minutesRef": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "certification",
          "value": {
            "certifiedAt": "{{ event.certifiedAt }}",
            "certifiedBy": "{{ event.certifiedBy }}",
            "certificateRef": "{{ event.certificateRef }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo.adjournedAt",
          "value": "{{ event.certifiedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo.minutesRef",
          "value": "{{ event.minutesRef }}"
        },
        {
          "type": "FOR_EACH",
          "array": "{{ event.results }}",
          "do": {
            "type": "UPDATE_ARRAY_ITEM",
            "path": "voteTallies",
            "matchKey": "agendaItemId",
            "matchValue": "{{ item.agendaItemId }}",
            "updates": {
              "result": "{{ item.result }}",
              "certified": true
            }
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "MEETING_RESULTS_CERTIFIED",
          "payload": {
            "meetingId": "{{ context.meetingId }}",
            "results": "{{ event.results }}"
          }
        }
      ]
    },
    "adjourn_without_action": {
      "from": [
        "IN_SESSION",
        "VOTING"
      ],
      "to": "CLOSED",
      "description": "Adjourn meeting without completing agenda (e.g., quorum lost)",
      "event": {
        "name": "adjourn_without_action",
        "payload": {
          "adjournedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "reason": {
            "type": "string",
            "required": true
          },
          "adjournedTo": {
            "type": "string",
            "format": "date-time",
            "nullable": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "sessionInfo.adjournedAt",
          "value": "{{ event.adjournedAt }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "MEETING_ADJOURNED",
          "payload": {
            "meetingId": "{{ context.meetingId }}",
            "reason": "{{ event.reason }}",
            "adjournedTo": "{{ event.adjournedTo }}"
          }
        }
      ]
    }
  },
  "crossMachineRefs": {
    "entity": {
      "machine": "corporate-entity",
      "description": "Parent corporate entity",
      "foreignKey": "entityId"
    },
    "proxies": {
      "machine": "corporate-proxy",
      "description": "Proxy grants for this meeting",
      "foreignKey": "meetingId"
    },
    "resolutions": {
      "machine": "corporate-resolution",
      "description": "Resolutions resulting from meeting votes",
      "foreignKey": "meetingId"
    },
    "securities": {
      "machine": "corporate-securities",
      "description": "Share records for determining voting rights",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "shareholders",
      "voting",
      "meetings",
      "proxy"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/shareholders"
  }
} as const;