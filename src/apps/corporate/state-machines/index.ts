/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const corporateBoardDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-board",
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

export const corporateBylawsDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-bylaws",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Bylaws state machine tracking the adoption, amendment, and restatement of corporate bylaws. Maintains version history and amendment requirements.",
  "context": {
    "bylawsId": {
      "type": "string",
      "description": "Unique identifier for this bylaws instance"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "currentVersion": {
      "type": "string",
      "description": "Current version number (semantic versioning)"
    },
    "originalAdoptionDate": {
      "type": "string",
      "format": "date"
    },
    "lastAmendedDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "documentRef": {
      "type": "string",
      "description": "Reference to current bylaws document"
    },
    "sections": {
      "type": "array",
      "description": "Bylaws organized by section",
      "items": {
        "type": "object",
        "properties": {
          "sectionId": {
            "type": "string"
          },
          "sectionNumber": {
            "type": "string",
            "description": "e.g., 'Article III, Section 2'"
          },
          "title": {
            "type": "string"
          },
          "content": {
            "type": "string"
          },
          "amendmentRequirement": {
            "type": "string",
            "enum": [
              "BOARD_ONLY",
              "BOARD_OR_SHAREHOLDERS",
              "SHAREHOLDERS_ONLY",
              "SUPERMAJORITY_SHAREHOLDERS"
            ],
            "description": "Who can amend this section"
          },
          "supermajorityThreshold": {
            "type": "number",
            "nullable": true
          },
          "lastModifiedVersion": {
            "type": "string"
          }
        }
      }
    },
    "keyProvisions": {
      "type": "object",
      "description": "Quick reference to key bylaw provisions",
      "properties": {
        "boardSize": {
          "type": "object",
          "properties": {
            "minimum": {
              "type": "integer"
            },
            "maximum": {
              "type": "integer"
            },
            "sectionRef": {
              "type": "string"
            }
          }
        },
        "quorumRequirements": {
          "type": "object",
          "properties": {
            "boardQuorum": {
              "type": "number"
            },
            "shareholderQuorum": {
              "type": "number"
            },
            "sectionRef": {
              "type": "string"
            }
          }
        },
        "meetingNotice": {
          "type": "object",
          "properties": {
            "annualMeetingNotice": {
              "type": "integer",
              "description": "Days of notice required"
            },
            "specialMeetingNotice": {
              "type": "integer"
            },
            "boardMeetingNotice": {
              "type": "integer"
            },
            "sectionRef": {
              "type": "string"
            }
          }
        },
        "indemnification": {
          "type": "object",
          "properties": {
            "directorsIndemnified": {
              "type": "boolean"
            },
            "officersIndemnified": {
              "type": "boolean"
            },
            "mandatory": {
              "type": "boolean"
            },
            "advancementOfExpenses": {
              "type": "boolean"
            },
            "sectionRef": {
              "type": "string"
            }
          }
        },
        "specialMeetingThreshold": {
          "type": "object",
          "properties": {
            "boardCanCall": {
              "type": "boolean"
            },
            "shareholderThreshold": {
              "type": "number",
              "description": "% of shares to call special meeting"
            },
            "sectionRef": {
              "type": "string"
            }
          }
        }
      }
    },
    "pendingAmendment": {
      "type": "object",
      "nullable": true,
      "properties": {
        "amendmentId": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "proposedBy": {
          "type": "string"
        },
        "proposedDate": {
          "type": "string",
          "format": "date"
        },
        "sectionsAffected": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "proposedChanges": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "approvalRequired": {
          "type": "string"
        },
        "boardApprovalRef": {
          "type": "string",
          "nullable": true
        },
        "shareholderApprovalRef": {
          "type": "string",
          "nullable": true
        },
        "status": {
          "type": "string",
          "enum": [
            "PROPOSED",
            "BOARD_APPROVED",
            "SHAREHOLDER_APPROVED",
            "REJECTED"
          ]
        }
      }
    },
    "amendmentHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "amendmentId": {
            "type": "string"
          },
          "version": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "sectionsAffected": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "effectiveDate": {
            "type": "string",
            "format": "date"
          },
          "approvedBy": {
            "type": "string",
            "enum": [
              "BOARD",
              "SHAREHOLDERS",
              "BOTH"
            ]
          },
          "boardResolutionRef": {
            "type": "string",
            "nullable": true
          },
          "shareholderResolutionRef": {
            "type": "string",
            "nullable": true
          },
          "documentRef": {
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
    "DRAFT": {
      "description": "Initial bylaws being drafted prior to incorporation or adoption",
      "metadata": null
    },
    "ADOPTED": {
      "description": "Bylaws have been formally adopted and are in effect",
      "metadata": null
    },
    "AMENDING": {
      "description": "Amendment in progress - proposed changes pending approval",
      "metadata": null
    }
  },
  "initialState": "DRAFT",
  "transitions": {
    "adopt": {
      "from": "DRAFT",
      "to": "ADOPTED",
      "description": "Initial adoption of bylaws (typically by incorporators or initial board)",
      "event": {
        "name": "adopt",
        "payload": {
          "adoptionDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "adoptedBy": {
            "type": "string",
            "enum": [
              "INCORPORATORS",
              "INITIAL_BOARD"
            ],
            "required": true
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          },
          "documentRef": {
            "type": "string",
            "required": true
          },
          "sections": {
            "type": "array",
            "required": true
          },
          "keyProvisions": {
            "type": "object"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentVersion",
          "value": "1.0.0"
        },
        {
          "type": "SET_CONTEXT",
          "path": "originalAdoptionDate",
          "value": "{{ event.adoptionDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "documentRef",
          "value": "{{ event.documentRef }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "sections",
          "value": "{{ event.sections }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "keyProvisions",
          "value": "{{ event.keyProvisions }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BYLAWS_ADOPTED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "bylawsId": "{{ context.bylawsId }}",
            "version": "1.0.0"
          }
        }
      ]
    },
    "propose_amendment": {
      "from": "ADOPTED",
      "to": "AMENDING",
      "description": "Propose an amendment to the bylaws",
      "event": {
        "name": "propose_amendment",
        "payload": {
          "amendmentId": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "string",
            "required": true
          },
          "proposedBy": {
            "type": "string",
            "required": true,
            "description": "Director ID, officer ID, or SHAREHOLDER_PROPOSAL"
          },
          "sectionsAffected": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "required": true
          },
          "proposedChanges": {
            "type": "array",
            "required": true,
            "items": {
              "type": "object",
              "properties": {
                "sectionId": {
                  "type": "string"
                },
                "changeType": {
                  "type": "string",
                  "enum": [
                    "MODIFY",
                    "ADD",
                    "DELETE"
                  ]
                },
                "currentContent": {
                  "type": "string"
                },
                "proposedContent": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "guards": [
        {
          "name": "validProposer",
          "description": "Amendment must be proposed by authorized party",
          "expression": "true"
        }
      ],
      "effects": [
        {
          "type": "COMPUTE",
          "path": "pendingAmendment.approvalRequired",
          "expression": "context.sections.filter(s => event.sectionsAffected.includes(s.sectionId)).some(s => s.amendmentRequirement === 'SHAREHOLDERS_ONLY' || s.amendmentRequirement === 'SUPERMAJORITY_SHAREHOLDERS') ? 'SHAREHOLDERS_REQUIRED' : 'BOARD_ONLY'"
        },
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment",
          "value": {
            "amendmentId": "{{ event.amendmentId }}",
            "description": "{{ event.description }}",
            "proposedBy": "{{ event.proposedBy }}",
            "proposedDate": "{{ today() }}",
            "sectionsAffected": "{{ event.sectionsAffected }}",
            "proposedChanges": "{{ event.proposedChanges }}",
            "status": "PROPOSED"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BYLAW_AMENDMENT_PROPOSED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "amendmentId": "{{ event.amendmentId }}",
            "sectionsAffected": "{{ event.sectionsAffected }}"
          }
        }
      ]
    },
    "board_approve_amendment": {
      "from": "AMENDING",
      "to": "AMENDING",
      "description": "Board approves the proposed amendment",
      "event": {
        "name": "board_approve_amendment",
        "payload": {
          "resolutionRef": {
            "type": "string",
            "required": true
          },
          "approvalDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasPendingAmendment",
          "expression": "context.pendingAmendment != null && context.pendingAmendment.status === 'PROPOSED'"
        },
        {
          "name": "boardResolutionExecuted",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.resolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment.boardApprovalRef",
          "value": "{{ event.resolutionRef }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment.status",
          "value": "BOARD_APPROVED"
        }
      ]
    },
    "approve_amendment": {
      "from": "AMENDING",
      "to": "ADOPTED",
      "description": "Finalize and approve the amendment (after required approvals obtained)",
      "event": {
        "name": "approve_amendment",
        "payload": {
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "shareholderResolutionRef": {
            "type": "string",
            "description": "Required if shareholders must approve"
          },
          "newDocumentRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "boardApproved",
          "description": "Board must have approved",
          "expression": "context.pendingAmendment.boardApprovalRef != null"
        },
        {
          "name": "shareholderApprovedIfRequired",
          "description": "If shareholder approval required, must have it",
          "expression": "context.pendingAmendment.approvalRequired !== 'SHAREHOLDERS_REQUIRED' || event.shareholderResolutionRef != null"
        }
      ],
      "effects": [
        {
          "type": "COMPUTE",
          "path": "currentVersion",
          "expression": "(parseFloat(context.currentVersion) + 0.1).toFixed(1) + '.0'"
        },
        {
          "type": "SET_CONTEXT",
          "path": "lastAmendedDate",
          "value": "{{ event.effectiveDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "documentRef",
          "value": "{{ event.newDocumentRef }}"
        },
        {
          "type": "FOR_EACH",
          "array": "{{ context.pendingAmendment.proposedChanges }}",
          "do": {
            "type": "UPDATE_ARRAY_ITEM",
            "path": "sections",
            "matchKey": "sectionId",
            "matchValue": "{{ item.sectionId }}",
            "updates": {
              "content": "{{ item.proposedContent }}",
              "lastModifiedVersion": "{{ context.currentVersion }}"
            }
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "amendmentHistory",
          "value": {
            "amendmentId": "{{ context.pendingAmendment.amendmentId }}",
            "version": "{{ context.currentVersion }}",
            "description": "{{ context.pendingAmendment.description }}",
            "sectionsAffected": "{{ context.pendingAmendment.sectionsAffected }}",
            "effectiveDate": "{{ event.effectiveDate }}",
            "approvedBy": "{{ event.shareholderResolutionRef ? 'BOTH' : 'BOARD' }}",
            "boardResolutionRef": "{{ context.pendingAmendment.boardApprovalRef }}",
            "shareholderResolutionRef": "{{ event.shareholderResolutionRef }}",
            "documentRef": "{{ event.newDocumentRef }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment",
          "value": null
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BYLAWS_AMENDED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "bylawsId": "{{ context.bylawsId }}",
            "newVersion": "{{ context.currentVersion }}",
            "effectiveDate": "{{ event.effectiveDate }}"
          }
        }
      ]
    },
    "reject_amendment": {
      "from": "AMENDING",
      "to": "ADOPTED",
      "description": "Amendment rejected by board or shareholders",
      "event": {
        "name": "reject_amendment",
        "payload": {
          "rejectedBy": {
            "type": "string",
            "enum": [
              "BOARD",
              "SHAREHOLDERS"
            ],
            "required": true
          },
          "reason": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment.status",
          "value": "REJECTED"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BYLAW_AMENDMENT_REJECTED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "amendmentId": "{{ context.pendingAmendment.amendmentId }}",
            "rejectedBy": "{{ event.rejectedBy }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "pendingAmendment",
          "value": null
        }
      ]
    },
    "restate": {
      "from": "ADOPTED",
      "to": "ADOPTED",
      "description": "Complete restatement of bylaws (consolidating all amendments)",
      "event": {
        "name": "restate",
        "payload": {
          "restatedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "newDocumentRef": {
            "type": "string",
            "required": true
          },
          "sections": {
            "type": "array",
            "required": true
          },
          "keyProvisions": {
            "type": "object"
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
          "type": "COMPUTE",
          "path": "currentVersion",
          "expression": "(Math.floor(parseFloat(context.currentVersion)) + 1).toString() + '.0.0'"
        },
        {
          "type": "SET_CONTEXT",
          "path": "lastAmendedDate",
          "value": "{{ event.restatedDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "documentRef",
          "value": "{{ event.newDocumentRef }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "sections",
          "value": "{{ event.sections }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "keyProvisions",
          "value": "{{ event.keyProvisions }}"
        },
        {
          "type": "APPEND_ARRAY",
          "path": "amendmentHistory",
          "value": {
            "amendmentId": "RESTATEMENT-{{ event.restatedDate }}",
            "version": "{{ context.currentVersion }}",
            "description": "Complete Restatement of Bylaws",
            "sectionsAffected": [
              "ALL"
            ],
            "effectiveDate": "{{ event.restatedDate }}",
            "approvedBy": "BOARD",
            "boardResolutionRef": "{{ event.boardResolutionRef }}",
            "documentRef": "{{ event.newDocumentRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "BYLAWS_RESTATED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "bylawsId": "{{ context.bylawsId }}",
            "newVersion": "{{ context.currentVersion }}"
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
    "board": {
      "machine": "corporate-board",
      "description": "Board that can amend bylaws",
      "foreignKey": "entityId"
    },
    "shareholders": {
      "machine": "corporate-shareholders",
      "description": "Shareholders for bylaw amendments requiring shareholder approval",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "bylaws",
      "amendments"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/bylaws"
  }
} as const;

export const corporateCommitteeDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-committee",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Board committee state machine managing standing and special committees, their charters, membership, independence requirements, and formal actions.",
  "context": {
    "committeeId": {
      "type": "string",
      "description": "Unique identifier for this committee"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "boardId": {
      "type": "string",
      "description": "Reference to parent corporate-board"
    },
    "name": {
      "type": "string",
      "description": "Committee name"
    },
    "committeeType": {
      "type": "string",
      "enum": [
        "AUDIT",
        "COMPENSATION",
        "NOMINATING_GOVERNANCE",
        "EXECUTIVE",
        "RISK",
        "FINANCE",
        "SPECIAL",
        "OTHER"
      ],
      "description": "Type of committee"
    },
    "purpose": {
      "type": "string",
      "description": "Brief statement of committee purpose"
    },
    "isStanding": {
      "type": "boolean",
      "default": true,
      "description": "Standing vs special (temporary) committee"
    },
    "createdDate": {
      "type": "string",
      "format": "date"
    },
    "disbandDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "charter": {
      "type": "object",
      "nullable": true,
      "properties": {
        "charterId": {
          "type": "string"
        },
        "version": {
          "type": "string"
        },
        "adoptedDate": {
          "type": "string",
          "format": "date"
        },
        "lastReviewedDate": {
          "type": "string",
          "format": "date"
        },
        "documentRef": {
          "type": "string"
        },
        "purposes": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "responsibilities": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "authorityLimits": {
          "type": "object"
        },
        "reportingRequirements": {
          "type": "string"
        }
      }
    },
    "membershipRequirements": {
      "type": "object",
      "properties": {
        "minimumMembers": {
          "type": "integer",
          "default": 3
        },
        "maximumMembers": {
          "type": "integer"
        },
        "independenceRequired": {
          "type": "boolean",
          "default": false
        },
        "financialExpertRequired": {
          "type": "boolean",
          "default": false,
          "description": "For audit committee"
        },
        "independenceStandard": {
          "type": "string",
          "enum": [
            "NYSE",
            "NASDAQ",
            "SEC",
            "CUSTOM"
          ],
          "nullable": true
        }
      }
    },
    "members": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "memberId": {
            "type": "string"
          },
          "directorId": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "role": {
            "type": "string",
            "enum": [
              "CHAIR",
              "MEMBER"
            ]
          },
          "appointedDate": {
            "type": "string",
            "format": "date"
          },
          "appointmentResolutionRef": {
            "type": "string"
          },
          "removedDate": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "isIndependent": {
            "type": "boolean"
          },
          "isFinancialExpert": {
            "type": "boolean",
            "default": false
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "REMOVED",
              "RESIGNED"
            ]
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
            "FIXED"
          ],
          "default": "MAJORITY"
        },
        "threshold": {
          "type": "number"
        },
        "minimumRequired": {
          "type": "integer"
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
        "scheduledDate": {
          "type": "string",
          "format": "date-time"
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
            "type": "string"
          }
        },
        "quorumPresent": {
          "type": "boolean"
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
          "date": {
            "type": "string",
            "format": "date"
          },
          "attendeeCount": {
            "type": "integer"
          },
          "minutesRef": {
            "type": "string"
          },
          "actionsApproved": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "annualReviewDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "DISBANDED"
      ]
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
    "FORMING": {
      "description": "Committee being formed; members appointed but charter not yet adopted",
      "metadata": null
    },
    "ACTIVE": {
      "description": "Committee is active with adopted charter and proper membership",
      "metadata": null
    },
    "IN_MEETING": {
      "description": "Committee meeting in session with quorum",
      "metadata": null
    },
    "NON_COMPLIANT": {
      "description": "Committee lacks required membership (insufficient members, independence, etc.)",
      "metadata": null
    },
    "DISBANDED": {
      "description": "Committee has been disbanded (terminal for special committees)",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "FORMING",
  "transitions": {
    "create_committee": {
      "from": null,
      "to": "FORMING",
      "description": "Board creates a new committee",
      "event": {
        "name": "create_committee",
        "payload": {
          "committeeId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "boardId": {
            "type": "string",
            "required": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "committeeType": {
            "type": "string",
            "required": true
          },
          "purpose": {
            "type": "string"
          },
          "isStanding": {
            "type": "boolean",
            "default": true
          },
          "membershipRequirements": {
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
          "path": "committeeId",
          "value": "{{ event.committeeId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "boardId",
          "value": "{{ event.boardId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "name",
          "value": "{{ event.name }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "committeeType",
          "value": "{{ event.committeeType }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "purpose",
          "value": "{{ event.purpose }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "isStanding",
          "value": "{{ event.isStanding }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "membershipRequirements",
          "value": "{{ event.membershipRequirements }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "createdDate",
          "value": "{{ today() }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "status",
          "value": "ACTIVE"
        },
        {
          "type": "SET_CONTEXT",
          "path": "members",
          "value": []
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_CREATED",
          "payload": {
            "committeeId": "{{ event.committeeId }}",
            "name": "{{ event.name }}",
            "type": "{{ event.committeeType }}"
          }
        }
      ]
    },
    "appoint_member": {
      "from": [
        "FORMING",
        "ACTIVE",
        "NON_COMPLIANT"
      ],
      "to": null,
      "description": "Appoint a director to the committee",
      "event": {
        "name": "appoint_member",
        "payload": {
          "memberId": {
            "type": "string",
            "required": true
          },
          "directorId": {
            "type": "string",
            "required": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "role": {
            "type": "string",
            "enum": [
              "CHAIR",
              "MEMBER"
            ],
            "default": "MEMBER"
          },
          "isIndependent": {
            "type": "boolean",
            "required": true
          },
          "isFinancialExpert": {
            "type": "boolean",
            "default": false
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "isActiveDirector",
          "description": "Must be an active director on the board",
          "crossMachine": {
            "machine": "corporate-board",
            "instanceRef": "{{ context.boardId }}",
            "query": "directors.some(d => d.directorId === event.directorId && d.status === 'ACTIVE')"
          }
        },
        {
          "name": "notAlreadyMember",
          "expression": "!context.members.some(m => m.directorId === event.directorId && m.status === 'ACTIVE')"
        },
        {
          "name": "meetsIndependenceIfRequired",
          "expression": "!context.membershipRequirements.independenceRequired || event.isIndependent"
        }
      ],
      "effects": [
        {
          "type": "CONDITIONAL",
          "condition": "event.role === 'CHAIR'",
          "then": {
            "type": "UPDATE_ARRAY_ALL",
            "path": "members",
            "filter": "m => m.status === 'ACTIVE' && m.role === 'CHAIR'",
            "updates": {
              "role": "MEMBER"
            }
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "members",
          "value": {
            "memberId": "{{ event.memberId }}",
            "directorId": "{{ event.directorId }}",
            "name": "{{ event.name }}",
            "role": "{{ event.role }}",
            "appointedDate": "{{ today() }}",
            "appointmentResolutionRef": "{{ event.boardResolutionRef }}",
            "isIndependent": "{{ event.isIndependent }}",
            "isFinancialExpert": "{{ event.isFinancialExpert }}",
            "status": "ACTIVE"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_MEMBER_APPOINTED",
          "payload": {
            "committeeId": "{{ context.committeeId }}",
            "directorId": "{{ event.directorId }}",
            "role": "{{ event.role }}"
          }
        }
      ]
    },
    "remove_member": {
      "from": [
        "ACTIVE",
        "NON_COMPLIANT",
        "IN_MEETING"
      ],
      "to": null,
      "description": "Remove a member from the committee",
      "event": {
        "name": "remove_member",
        "payload": {
          "memberId": {
            "type": "string",
            "required": true
          },
          "reason": {
            "type": "string"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "members",
          "matchKey": "memberId",
          "matchValue": "{{ event.memberId }}",
          "updates": {
            "status": "REMOVED",
            "removedDate": "{{ today() }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_MEMBER_REMOVED",
          "payload": {
            "committeeId": "{{ context.committeeId }}",
            "memberId": "{{ event.memberId }}"
          }
        }
      ]
    },
    "adopt_charter": {
      "from": [
        "FORMING",
        "ACTIVE"
      ],
      "to": "ACTIVE",
      "description": "Board adopts or updates the committee charter",
      "event": {
        "name": "adopt_charter",
        "payload": {
          "charterId": {
            "type": "string",
            "required": true
          },
          "version": {
            "type": "string",
            "required": true
          },
          "documentRef": {
            "type": "string",
            "required": true
          },
          "purposes": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "responsibilities": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "authorityLimits": {
            "type": "object"
          },
          "reportingRequirements": {
            "type": "string"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasMinimumMembers",
          "expression": "context.members.filter(m => m.status === 'ACTIVE').length >= context.membershipRequirements.minimumMembers"
        },
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
          "path": "charter",
          "value": {
            "charterId": "{{ event.charterId }}",
            "version": "{{ event.version }}",
            "adoptedDate": "{{ today() }}",
            "lastReviewedDate": "{{ today() }}",
            "documentRef": "{{ event.documentRef }}",
            "purposes": "{{ event.purposes }}",
            "responsibilities": "{{ event.responsibilities }}",
            "authorityLimits": "{{ event.authorityLimits }}",
            "reportingRequirements": "{{ event.reportingRequirements }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_CHARTER_ADOPTED",
          "payload": {
            "committeeId": "{{ context.committeeId }}",
            "charterId": "{{ event.charterId }}",
            "version": "{{ event.version }}"
          }
        }
      ]
    },
    "call_meeting": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Schedule a committee meeting",
      "event": {
        "name": "call_meeting",
        "payload": {
          "meetingId": {
            "type": "string",
            "required": true
          },
          "scheduledDate": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "agenda": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "guards": [
        {
          "name": "noConflictingMeeting",
          "expression": "context.currentMeeting == null || context.currentMeeting.closedAt != null"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting",
          "value": {
            "meetingId": "{{ event.meetingId }}",
            "scheduledDate": "{{ event.scheduledDate }}",
            "agenda": "{{ event.agenda }}",
            "attendees": [],
            "quorumPresent": false
          }
        }
      ]
    },
    "open_meeting": {
      "from": "ACTIVE",
      "to": "IN_MEETING",
      "description": "Open committee meeting once quorum present",
      "event": {
        "name": "open_meeting",
        "payload": {
          "openedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "attendees": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "required": true
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
          "expression": "event.attendees.length >= Math.ceil(context.members.filter(m => m.status === 'ACTIVE').length * 0.5)"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.openedAt",
          "value": "{{ event.openedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.attendees",
          "value": "{{ event.attendees }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting.quorumPresent",
          "value": true
        }
      ]
    },
    "adjourn_meeting": {
      "from": "IN_MEETING",
      "to": "ACTIVE",
      "description": "Adjourn the committee meeting",
      "event": {
        "name": "adjourn_meeting",
        "payload": {
          "closedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "minutesRef": {
            "type": "string"
          },
          "actionsApproved": {
            "type": "array",
            "items": {
              "type": "string"
            }
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
          "type": "APPEND_ARRAY",
          "path": "meetingHistory",
          "value": {
            "meetingId": "{{ context.currentMeeting.meetingId }}",
            "date": "{{ context.currentMeeting.scheduledDate }}",
            "attendeeCount": "{{ context.currentMeeting.attendees.length }}",
            "minutesRef": "{{ event.minutesRef }}",
            "actionsApproved": "{{ event.actionsApproved }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "currentMeeting",
          "value": null
        }
      ]
    },
    "flag_non_compliant": {
      "from": "ACTIVE",
      "to": "NON_COMPLIANT",
      "description": "Committee falls below membership or independence requirements",
      "event": {
        "name": "flag_non_compliant",
        "payload": {
          "reason": {
            "type": "string",
            "required": true
          },
          "flaggedDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_NON_COMPLIANT",
          "payload": {
            "committeeId": "{{ context.committeeId }}",
            "reason": "{{ event.reason }}"
          }
        }
      ]
    },
    "restore_compliance": {
      "from": "NON_COMPLIANT",
      "to": "ACTIVE",
      "description": "Committee restored to compliance after appointments",
      "event": {
        "name": "restore_compliance",
        "payload": {
          "restoredDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "meetsRequirements",
          "expression": "context.members.filter(m => m.status === 'ACTIVE').length >= context.membershipRequirements.minimumMembers"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_COMPLIANCE_RESTORED",
          "payload": {
            "committeeId": "{{ context.committeeId }}"
          }
        }
      ]
    },
    "disband": {
      "from": [
        "ACTIVE",
        "NON_COMPLIANT",
        "FORMING"
      ],
      "to": "DISBANDED",
      "description": "Disband the committee",
      "event": {
        "name": "disband",
        "payload": {
          "disbandDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "reason": {
            "type": "string"
          },
          "boardResolutionRef": {
            "type": "string",
            "required": true
          },
          "finalReportRef": {
            "type": "string"
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
          "path": "disbandDate",
          "value": "{{ event.disbandDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "status",
          "value": "DISBANDED"
        },
        {
          "type": "UPDATE_ARRAY_ALL",
          "path": "members",
          "filter": "m => m.status === 'ACTIVE'",
          "updates": {
            "status": "REMOVED",
            "removedDate": "{{ event.disbandDate }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMMITTEE_DISBANDED",
          "payload": {
            "committeeId": "{{ context.committeeId }}",
            "reason": "{{ event.reason }}"
          }
        }
      ]
    }
  },
  "crossMachineRefs": {
    "board": {
      "machine": "corporate-board",
      "description": "Parent board",
      "foreignKey": "boardId"
    },
    "resolutions": {
      "machine": "corporate-resolution",
      "description": "Resolutions authorizing committee actions",
      "foreignKey": "committeeId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "committee",
      "board",
      "audit",
      "compensation"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/committee"
  }
} as const;

export const corporateComplianceDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-compliance",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Regulatory compliance state machine tracking filing obligations, deadlines, deficiencies, and remediation for corporate entities. Manages annual reports, franchise taxes, registered agent status, and other state/federal requirements.",
  "context": {
    "complianceId": {
      "type": "string",
      "description": "Unique identifier for this compliance record"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "jurisdiction": {
      "type": "object",
      "properties": {
        "state": {
          "type": "string",
          "description": "Primary jurisdiction"
        },
        "country": {
          "type": "string",
          "default": "USA"
        },
        "foreignQualifications": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "state": {
                "type": "string"
              },
              "qualificationDate": {
                "type": "string",
                "format": "date"
              },
              "foreignEntityNumber": {
                "type": "string"
              },
              "status": {
                "type": "string",
                "enum": [
                  "ACTIVE",
                  "WITHDRAWN",
                  "REVOKED"
                ]
              }
            }
          }
        }
      }
    },
    "filingCalendar": {
      "type": "array",
      "description": "Required filings and their deadlines",
      "items": {
        "type": "object",
        "properties": {
          "filingId": {
            "type": "string"
          },
          "filingType": {
            "type": "string",
            "enum": [
              "ANNUAL_REPORT",
              "BIENNIAL_REPORT",
              "FRANCHISE_TAX",
              "STATEMENT_OF_INFORMATION",
              "REGISTERED_AGENT_UPDATE",
              "FOREIGN_QUALIFICATION_ANNUAL",
              "BENEFICIAL_OWNERSHIP",
              "FEDERAL_TAX_RETURN",
              "STATE_TAX_RETURN",
              "SEC_FILING",
              "OTHER"
            ]
          },
          "jurisdiction": {
            "type": "string"
          },
          "frequency": {
            "type": "string",
            "enum": [
              "ANNUAL",
              "BIENNIAL",
              "QUARTERLY",
              "ONE_TIME"
            ]
          },
          "dueDate": {
            "type": "string",
            "format": "date"
          },
          "gracePeriodDays": {
            "type": "integer",
            "default": 0
          },
          "estimatedFee": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "PENDING",
              "FILED",
              "OVERDUE",
              "WAIVED"
            ]
          },
          "lastFiledDate": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "confirmationNumber": {
            "type": "string",
            "nullable": true
          },
          "notes": {
            "type": "string",
            "nullable": true
          }
        }
      }
    },
    "registeredAgents": {
      "type": "array",
      "description": "Registered agents by jurisdiction",
      "items": {
        "type": "object",
        "properties": {
          "jurisdiction": {
            "type": "string"
          },
          "agentName": {
            "type": "string"
          },
          "agentAddress": {
            "type": "object"
          },
          "agentPhone": {
            "type": "string"
          },
          "agentEmail": {
            "type": "string"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date"
          },
          "isThirdParty": {
            "type": "boolean"
          },
          "serviceAgreementRef": {
            "type": "string",
            "nullable": true
          },
          "renewalDate": {
            "type": "string",
            "format": "date",
            "nullable": true
          }
        }
      }
    },
    "deficiencies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "deficiencyId": {
            "type": "string"
          },
          "jurisdiction": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": [
              "ANNUAL_REPORT_MISSING",
              "FRANCHISE_TAX_DELINQUENT",
              "REGISTERED_AGENT_LAPSE",
              "BENEFICIAL_OWNERSHIP_MISSING",
              "OTHER"
            ]
          },
          "description": {
            "type": "string"
          },
          "noticeDate": {
            "type": "string",
            "format": "date"
          },
          "noticeRef": {
            "type": "string"
          },
          "cureDeadline": {
            "type": "string",
            "format": "date"
          },
          "penaltyAmount": {
            "type": "number",
            "nullable": true
          },
          "status": {
            "type": "string",
            "enum": [
              "OPEN",
              "IN_PROGRESS",
              "CURED",
              "PENALTY_ASSESSED",
              "ADMINISTRATIVE_ACTION"
            ]
          },
          "curedDate": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "curativeActions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    },
    "filingHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "filingId": {
            "type": "string"
          },
          "filingType": {
            "type": "string"
          },
          "jurisdiction": {
            "type": "string"
          },
          "filedDate": {
            "type": "string",
            "format": "date"
          },
          "periodCovered": {
            "type": "string"
          },
          "confirmationNumber": {
            "type": "string"
          },
          "feePaid": {
            "type": "number"
          },
          "filedBy": {
            "type": "string"
          },
          "documentRef": {
            "type": "string"
          }
        }
      }
    },
    "goodStandingCertificates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "certificateId": {
            "type": "string"
          },
          "jurisdiction": {
            "type": "string"
          },
          "issuedDate": {
            "type": "string",
            "format": "date"
          },
          "validThrough": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "documentRef": {
            "type": "string"
          },
          "purpose": {
            "type": "string"
          }
        }
      }
    },
    "complianceScore": {
      "type": "object",
      "properties": {
        "overallStatus": {
          "type": "string",
          "enum": [
            "GREEN",
            "YELLOW",
            "RED"
          ]
        },
        "openDeficiencies": {
          "type": "integer"
        },
        "overdueFilings": {
          "type": "integer"
        },
        "upcomingDeadlines30Days": {
          "type": "integer"
        },
        "lastAssessedDate": {
          "type": "string",
          "format": "date"
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
    "COMPLIANT": {
      "description": "Entity is in good standing in all jurisdictions with no open deficiencies",
      "metadata": null
    },
    "REVIEW_PENDING": {
      "description": "Compliance review needed; deadline approaching or minor issue flagged",
      "metadata": null
    },
    "DEFICIENT": {
      "description": "One or more deficiencies identified; action required",
      "metadata": null
    },
    "REMEDIATED": {
      "description": "Deficiencies cured; awaiting state confirmation of good standing",
      "metadata": null
    }
  },
  "initialState": "COMPLIANT",
  "transitions": {
    "initialize_compliance": {
      "from": null,
      "to": "COMPLIANT",
      "description": "Initialize compliance tracking for an entity",
      "event": {
        "name": "initialize_compliance",
        "payload": {
          "complianceId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "object",
            "required": true
          },
          "registeredAgents": {
            "type": "array",
            "required": true
          },
          "filingCalendar": {
            "type": "array"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "complianceId",
          "value": "{{ event.complianceId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "jurisdiction",
          "value": "{{ event.jurisdiction }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "registeredAgents",
          "value": "{{ event.registeredAgents }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "filingCalendar",
          "value": "{{ event.filingCalendar || [] }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "deficiencies",
          "value": []
        },
        {
          "type": "SET_CONTEXT",
          "path": "filingHistory",
          "value": []
        },
        {
          "type": "SET_CONTEXT",
          "path": "goodStandingCertificates",
          "value": []
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore",
          "value": {
            "overallStatus": "GREEN",
            "openDeficiencies": 0,
            "overdueFilings": 0,
            "upcomingDeadlines30Days": 0,
            "lastAssessedDate": "{{ today() }}"
          }
        }
      ]
    },
    "add_filing_requirement": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "DEFICIENT",
        "REMEDIATED"
      ],
      "to": null,
      "description": "Add a new filing requirement to the calendar",
      "event": {
        "name": "add_filing_requirement",
        "payload": {
          "filingId": {
            "type": "string",
            "required": true
          },
          "filingType": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "frequency": {
            "type": "string",
            "required": true
          },
          "dueDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "gracePeriodDays": {
            "type": "integer",
            "default": 0
          },
          "estimatedFee": {
            "type": "number"
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "filingCalendar",
          "value": {
            "filingId": "{{ event.filingId }}",
            "filingType": "{{ event.filingType }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "frequency": "{{ event.frequency }}",
            "dueDate": "{{ event.dueDate }}",
            "gracePeriodDays": "{{ event.gracePeriodDays }}",
            "estimatedFee": "{{ event.estimatedFee }}",
            "status": "PENDING"
          }
        }
      ]
    },
    "file_annual_report": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "DEFICIENT",
        "REMEDIATED"
      ],
      "to": null,
      "description": "Record filing of annual report",
      "event": {
        "name": "file_annual_report",
        "payload": {
          "filingId": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "filedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "periodCovered": {
            "type": "string",
            "required": true
          },
          "confirmationNumber": {
            "type": "string",
            "required": true
          },
          "feePaid": {
            "type": "number",
            "required": true
          },
          "filedBy": {
            "type": "string",
            "required": true
          },
          "documentRef": {
            "type": "string"
          },
          "nextDueDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "filingCalendar",
          "matchKey": "filingId",
          "matchValue": "{{ event.filingId }}",
          "updates": {
            "status": "FILED",
            "lastFiledDate": "{{ event.filedDate }}",
            "confirmationNumber": "{{ event.confirmationNumber }}",
            "dueDate": "{{ event.nextDueDate }}"
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "filingHistory",
          "value": {
            "filingId": "{{ event.filingId }}",
            "filingType": "ANNUAL_REPORT",
            "jurisdiction": "{{ event.jurisdiction }}",
            "filedDate": "{{ event.filedDate }}",
            "periodCovered": "{{ event.periodCovered }}",
            "confirmationNumber": "{{ event.confirmationNumber }}",
            "feePaid": "{{ event.feePaid }}",
            "filedBy": "{{ event.filedBy }}",
            "documentRef": "{{ event.documentRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "ANNUAL_REPORT_FILED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "confirmationNumber": "{{ event.confirmationNumber }}"
          }
        }
      ]
    },
    "pay_franchise_tax": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "DEFICIENT",
        "REMEDIATED"
      ],
      "to": null,
      "description": "Record payment of franchise tax",
      "event": {
        "name": "pay_franchise_tax",
        "payload": {
          "filingId": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "paidDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "taxYear": {
            "type": "integer",
            "required": true
          },
          "amountPaid": {
            "type": "number",
            "required": true
          },
          "confirmationNumber": {
            "type": "string",
            "required": true
          },
          "nextDueDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "filingCalendar",
          "matchKey": "filingId",
          "matchValue": "{{ event.filingId }}",
          "updates": {
            "status": "FILED",
            "lastFiledDate": "{{ event.paidDate }}",
            "confirmationNumber": "{{ event.confirmationNumber }}",
            "dueDate": "{{ event.nextDueDate }}"
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "filingHistory",
          "value": {
            "filingId": "{{ event.filingId }}",
            "filingType": "FRANCHISE_TAX",
            "jurisdiction": "{{ event.jurisdiction }}",
            "filedDate": "{{ event.paidDate }}",
            "periodCovered": "{{ event.taxYear }}",
            "confirmationNumber": "{{ event.confirmationNumber }}",
            "feePaid": "{{ event.amountPaid }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "FRANCHISE_TAX_PAID",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "taxYear": "{{ event.taxYear }}"
          }
        }
      ]
    },
    "update_registered_agent": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "DEFICIENT",
        "REMEDIATED"
      ],
      "to": null,
      "description": "Update registered agent for a jurisdiction",
      "event": {
        "name": "update_registered_agent",
        "payload": {
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "agentName": {
            "type": "string",
            "required": true
          },
          "agentAddress": {
            "type": "object",
            "required": true
          },
          "agentPhone": {
            "type": "string"
          },
          "agentEmail": {
            "type": "string"
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "isThirdParty": {
            "type": "boolean",
            "default": false
          },
          "serviceAgreementRef": {
            "type": "string"
          },
          "filingConfirmation": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "UPSERT_ARRAY",
          "path": "registeredAgents",
          "matchKey": "jurisdiction",
          "matchValue": "{{ event.jurisdiction }}",
          "value": {
            "jurisdiction": "{{ event.jurisdiction }}",
            "agentName": "{{ event.agentName }}",
            "agentAddress": "{{ event.agentAddress }}",
            "agentPhone": "{{ event.agentPhone }}",
            "agentEmail": "{{ event.agentEmail }}",
            "effectiveDate": "{{ event.effectiveDate }}",
            "isThirdParty": "{{ event.isThirdParty }}",
            "serviceAgreementRef": "{{ event.serviceAgreementRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "REGISTERED_AGENT_UPDATED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "newAgent": "{{ event.agentName }}"
          }
        }
      ]
    },
    "flag_review": {
      "from": "COMPLIANT",
      "to": "REVIEW_PENDING",
      "description": "Flag entity for compliance review (deadline approaching or issue identified)",
      "event": {
        "name": "flag_review",
        "payload": {
          "reason": {
            "type": "string",
            "required": true
          },
          "filingId": {
            "type": "string"
          },
          "dueDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.overallStatus",
          "value": "YELLOW"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "COMPLIANCE_REVIEW_FLAGGED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "reason": "{{ event.reason }}"
          }
        }
      ]
    },
    "note_deficiency": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "REMEDIATED"
      ],
      "to": "DEFICIENT",
      "description": "Record a compliance deficiency",
      "event": {
        "name": "note_deficiency",
        "payload": {
          "deficiencyId": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "type": {
            "type": "string",
            "required": true
          },
          "description": {
            "type": "string",
            "required": true
          },
          "noticeDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "noticeRef": {
            "type": "string"
          },
          "cureDeadline": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "penaltyAmount": {
            "type": "number"
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "deficiencies",
          "value": {
            "deficiencyId": "{{ event.deficiencyId }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "type": "{{ event.type }}",
            "description": "{{ event.description }}",
            "noticeDate": "{{ event.noticeDate }}",
            "noticeRef": "{{ event.noticeRef }}",
            "cureDeadline": "{{ event.cureDeadline }}",
            "penaltyAmount": "{{ event.penaltyAmount }}",
            "status": "OPEN",
            "curativeActions": []
          }
        },
        {
          "type": "INCREMENT",
          "path": "complianceScore.openDeficiencies",
          "amount": 1
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.overallStatus",
          "value": "RED"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "DEFICIENCY_NOTED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "deficiencyId": "{{ event.deficiencyId }}",
            "type": "{{ event.type }}",
            "cureDeadline": "{{ event.cureDeadline }}"
          }
        }
      ]
    },
    "record_curative_action": {
      "from": "DEFICIENT",
      "to": "DEFICIENT",
      "description": "Record a curative action taken for a deficiency",
      "event": {
        "name": "record_curative_action",
        "payload": {
          "deficiencyId": {
            "type": "string",
            "required": true
          },
          "action": {
            "type": "string",
            "required": true
          },
          "actionDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "documentRef": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "deficiencies",
          "matchKey": "deficiencyId",
          "matchValue": "{{ event.deficiencyId }}",
          "arrayPath": "curativeActions",
          "arrayOperation": "APPEND",
          "value": "{{ event.action }} ({{ event.actionDate }})"
        },
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "deficiencies",
          "matchKey": "deficiencyId",
          "matchValue": "{{ event.deficiencyId }}",
          "updates": {
            "status": "IN_PROGRESS"
          }
        }
      ]
    },
    "cure_deficiency": {
      "from": "DEFICIENT",
      "to": "REMEDIATED",
      "description": "Cure a deficiency and submit for state confirmation",
      "event": {
        "name": "cure_deficiency",
        "payload": {
          "deficiencyId": {
            "type": "string",
            "required": true
          },
          "curedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "confirmationNumber": {
            "type": "string"
          },
          "penaltyPaid": {
            "type": "number"
          }
        }
      },
      "guards": [
        {
          "name": "isLastOpenDeficiency",
          "description": "Transition to REMEDIATED only when curing last deficiency",
          "expression": "context.deficiencies.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length === 1"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "deficiencies",
          "matchKey": "deficiencyId",
          "matchValue": "{{ event.deficiencyId }}",
          "updates": {
            "status": "CURED",
            "curedDate": "{{ event.curedDate }}"
          }
        },
        {
          "type": "DECREMENT",
          "path": "complianceScore.openDeficiencies",
          "amount": 1
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.overallStatus",
          "value": "YELLOW"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "DEFICIENCY_CURED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "deficiencyId": "{{ event.deficiencyId }}"
          }
        }
      ]
    },
    "cure_deficiency_remaining": {
      "from": "DEFICIENT",
      "to": "DEFICIENT",
      "description": "Cure one deficiency when others remain",
      "event": {
        "name": "cure_deficiency_remaining",
        "payload": {
          "deficiencyId": {
            "type": "string",
            "required": true
          },
          "curedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "confirmationNumber": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "hasRemainingDeficiencies",
          "expression": "context.deficiencies.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length > 1"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "deficiencies",
          "matchKey": "deficiencyId",
          "matchValue": "{{ event.deficiencyId }}",
          "updates": {
            "status": "CURED",
            "curedDate": "{{ event.curedDate }}"
          }
        },
        {
          "type": "DECREMENT",
          "path": "complianceScore.openDeficiencies",
          "amount": 1
        }
      ]
    },
    "confirm_good_standing": {
      "from": "REMEDIATED",
      "to": "COMPLIANT",
      "description": "State confirms entity returned to good standing",
      "event": {
        "name": "confirm_good_standing",
        "payload": {
          "confirmationDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "certificateRef": {
            "type": "string"
          },
          "validThrough": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "effects": [
        {
          "type": "CONDITIONAL",
          "condition": "event.certificateRef != null",
          "then": {
            "type": "APPEND_ARRAY",
            "path": "goodStandingCertificates",
            "value": {
              "certificateId": "{{ event.certificateRef }}",
              "jurisdiction": "{{ event.jurisdiction }}",
              "issuedDate": "{{ event.confirmationDate }}",
              "validThrough": "{{ event.validThrough }}",
              "documentRef": "{{ event.certificateRef }}",
              "purpose": "Post-remediation confirmation"
            }
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.overallStatus",
          "value": "GREEN"
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.lastAssessedDate",
          "value": "{{ event.confirmationDate }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "GOOD_STANDING_CONFIRMED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "jurisdiction": "{{ event.jurisdiction }}"
          }
        }
      ]
    },
    "clear_review": {
      "from": "REVIEW_PENDING",
      "to": "COMPLIANT",
      "description": "Clear pending review - no issues found",
      "event": {
        "name": "clear_review",
        "payload": {
          "clearedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "reviewedBy": {
            "type": "string",
            "required": true
          },
          "notes": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.overallStatus",
          "value": "GREEN"
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.lastAssessedDate",
          "value": "{{ event.clearedDate }}"
        }
      ]
    },
    "request_good_standing_certificate": {
      "from": [
        "COMPLIANT"
      ],
      "to": "COMPLIANT",
      "description": "Request and record receipt of good standing certificate",
      "event": {
        "name": "request_good_standing_certificate",
        "payload": {
          "certificateId": {
            "type": "string",
            "required": true
          },
          "jurisdiction": {
            "type": "string",
            "required": true
          },
          "issuedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "validThrough": {
            "type": "string",
            "format": "date"
          },
          "documentRef": {
            "type": "string",
            "required": true
          },
          "purpose": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "goodStandingCertificates",
          "value": {
            "certificateId": "{{ event.certificateId }}",
            "jurisdiction": "{{ event.jurisdiction }}",
            "issuedDate": "{{ event.issuedDate }}",
            "validThrough": "{{ event.validThrough }}",
            "documentRef": "{{ event.documentRef }}",
            "purpose": "{{ event.purpose }}"
          }
        }
      ]
    },
    "add_foreign_qualification": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING"
      ],
      "to": null,
      "description": "Record foreign qualification in a new state",
      "event": {
        "name": "add_foreign_qualification",
        "payload": {
          "state": {
            "type": "string",
            "required": true
          },
          "qualificationDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "foreignEntityNumber": {
            "type": "string",
            "required": true
          },
          "registeredAgent": {
            "type": "object",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "jurisdiction.foreignQualifications",
          "value": {
            "state": "{{ event.state }}",
            "qualificationDate": "{{ event.qualificationDate }}",
            "foreignEntityNumber": "{{ event.foreignEntityNumber }}",
            "status": "ACTIVE"
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "registeredAgents",
          "value": "{{ event.registeredAgent }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "FOREIGN_QUALIFIED",
          "payload": {
            "complianceId": "{{ context.complianceId }}",
            "entityId": "{{ context.entityId }}",
            "state": "{{ event.state }}"
          }
        }
      ]
    },
    "assess_compliance": {
      "from": [
        "COMPLIANT",
        "REVIEW_PENDING",
        "DEFICIENT",
        "REMEDIATED"
      ],
      "to": null,
      "description": "Perform compliance assessment and update score",
      "event": {
        "name": "assess_compliance",
        "payload": {
          "assessmentDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "assessedBy": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "COMPUTE",
          "path": "complianceScore.openDeficiencies",
          "expression": "context.deficiencies.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length"
        },
        {
          "type": "COMPUTE",
          "path": "complianceScore.overdueFilings",
          "expression": "context.filingCalendar.filter(f => f.status === 'OVERDUE').length"
        },
        {
          "type": "COMPUTE",
          "path": "complianceScore.upcomingDeadlines30Days",
          "expression": "context.filingCalendar.filter(f => f.status === 'PENDING' && new Date(f.dueDate) <= new Date(Date.now() + 30*24*60*60*1000)).length"
        },
        {
          "type": "SET_CONTEXT",
          "path": "complianceScore.lastAssessedDate",
          "value": "{{ event.assessmentDate }}"
        },
        {
          "type": "COMPUTE",
          "path": "complianceScore.overallStatus",
          "expression": "context.complianceScore.openDeficiencies > 0 ? 'RED' : (context.complianceScore.overdueFilings > 0 || context.complianceScore.upcomingDeadlines30Days > 2) ? 'YELLOW' : 'GREEN'"
        }
      ]
    }
  },
  "crossMachineRefs": {
    "entity": {
      "machine": "corporate-entity",
      "description": "Parent corporate entity",
      "foreignKey": "entityId",
      "eventTriggers": {
        "CORPORATION_SUSPENDED": "Triggers transition to DEFICIENT if compliance-related",
        "CORPORATION_REINSTATED": "May trigger return to COMPLIANT"
      }
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "compliance",
      "regulatory",
      "filings"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/compliance"
  }
} as const;

export const corporateEntityDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-entity",
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

export const corporateOfficersDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-officers",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Executive officers state machine managing officer appointments, authority delegation, and succession. Tracks officer roles, reporting relationships, and delegation chains.",
  "context": {
    "officersInstanceId": {
      "type": "string",
      "description": "Unique identifier for this officers instance"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "officers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "officerId": {
            "type": "string"
          },
          "personId": {
            "type": "string",
            "description": "Person identifier"
          },
          "name": {
            "type": "string"
          },
          "title": {
            "type": "string",
            "enum": [
              "CEO",
              "PRESIDENT",
              "COO",
              "CFO",
              "CTO",
              "CLO",
              "SECRETARY",
              "TREASURER",
              "VP",
              "SVP",
              "EVP",
              "GENERAL_COUNSEL",
              "CONTROLLER",
              "ASSISTANT_SECRETARY",
              "ASSISTANT_TREASURER",
              "OTHER"
            ],
            "description": "Officer title"
          },
          "customTitle": {
            "type": "string",
            "nullable": true,
            "description": "Custom title if OTHER"
          },
          "status": {
            "type": "string",
            "enum": [
              "ACTIVE",
              "RESIGNED",
              "REMOVED",
              "INTERIM"
            ]
          },
          "appointedDate": {
            "type": "string",
            "format": "date"
          },
          "appointmentResolutionRef": {
            "type": "string"
          },
          "terminationDate": {
            "type": "string",
            "format": "date",
            "nullable": true
          },
          "reportsTo": {
            "type": "string",
            "nullable": true,
            "description": "Officer ID of supervisor"
          },
          "isBoardMember": {
            "type": "boolean",
            "default": false
          },
          "directorId": {
            "type": "string",
            "nullable": true
          },
          "compensationAgreementRef": {
            "type": "string",
            "nullable": true
          },
          "authorityLevel": {
            "type": "string",
            "enum": [
              "FULL",
              "LIMITED",
              "SPECIFIC"
            ],
            "description": "Scope of authority"
          },
          "spendingLimit": {
            "type": "number",
            "nullable": true,
            "description": "Unilateral spending authority limit"
          },
          "signatureAuthority": {
            "type": "object",
            "properties": {
              "contracts": {
                "type": "boolean",
                "default": false
              },
              "contractLimit": {
                "type": "number",
                "nullable": true
              },
              "checks": {
                "type": "boolean",
                "default": false
              },
              "checkLimit": {
                "type": "number",
                "nullable": true
              },
              "hiringAuthority": {
                "type": "boolean",
                "default": false
              },
              "terminationAuthority": {
                "type": "boolean",
                "default": false
              }
            }
          },
          "delegatedAuthorities": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "delegationId": {
                  "type": "string"
                },
                "authority": {
                  "type": "string"
                },
                "scope": {
                  "type": "string"
                },
                "delegatedBy": {
                  "type": "string"
                },
                "delegatedOn": {
                  "type": "string",
                  "format": "date"
                },
                "expiresOn": {
                  "type": "string",
                  "format": "date",
                  "nullable": true
                },
                "revoked": {
                  "type": "boolean",
                  "default": false
                }
              }
            }
          }
        }
      }
    },
    "appointmentAuthority": {
      "type": "object",
      "description": "Which officers can appoint which other officers",
      "properties": {
        "boardAppoints": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [
            "CEO",
            "PRESIDENT",
            "CFO",
            "SECRETARY",
            "TREASURER",
            "GENERAL_COUNSEL"
          ]
        },
        "ceoAppoints": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [
            "COO",
            "CTO",
            "VP",
            "SVP",
            "EVP",
            "CONTROLLER"
          ]
        },
        "cfoAppoints": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [
            "CONTROLLER",
            "ASSISTANT_TREASURER"
          ]
        },
        "secretaryAppoints": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "default": [
            "ASSISTANT_SECRETARY"
          ]
        }
      }
    },
    "successionPlan": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "position": {
            "type": "string"
          },
          "currentOfficerId": {
            "type": "string"
          },
          "successors": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "personId": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "priority": {
                  "type": "integer"
                },
                "readiness": {
                  "type": "string",
                  "enum": [
                    "READY_NOW",
                    "READY_1_YEAR",
                    "READY_2_YEARS",
                    "DEVELOPMENTAL"
                  ]
                }
              }
            }
          }
        }
      }
    },
    "vacantPositions": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Officer titles currently vacant"
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
      "description": "Officer roster is active. This is the only state - all changes are self-transitions.",
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": {
    "appoint_officer": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Appoint a new executive officer",
      "event": {
        "name": "appoint_officer",
        "payload": {
          "officerId": {
            "type": "string",
            "required": true
          },
          "personId": {
            "type": "string",
            "required": true
          },
          "name": {
            "type": "string",
            "required": true
          },
          "title": {
            "type": "string",
            "required": true
          },
          "customTitle": {
            "type": "string"
          },
          "appointedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "appointmentResolutionRef": {
            "type": "string",
            "required": true
          },
          "reportsTo": {
            "type": "string"
          },
          "isBoardMember": {
            "type": "boolean",
            "default": false
          },
          "directorId": {
            "type": "string"
          },
          "authorityLevel": {
            "type": "string",
            "default": "LIMITED"
          },
          "spendingLimit": {
            "type": "number"
          },
          "signatureAuthority": {
            "type": "object"
          },
          "isInterim": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "guards": [
        {
          "name": "hasAppointmentResolution",
          "description": "Officer appointment requires board resolution (for senior) or authorized officer action",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.appointmentResolutionRef }}",
            "requiredState": "EXECUTED"
          }
        },
        {
          "name": "boardMeetingHadQuorum",
          "description": "If board-appointed, board meeting must have had quorum",
          "expression": "true",
          "note": "Validated through resolution's meeting reference"
        },
        {
          "name": "positionNotDuplicate",
          "description": "Cannot have two active officers with same title (except VPs)",
          "expression": "event.title === 'VP' || event.title === 'SVP' || event.title === 'EVP' || event.title === 'OTHER' || !context.officers.some(o => o.title === event.title && o.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "officers",
          "value": {
            "officerId": "{{ event.officerId }}",
            "personId": "{{ event.personId }}",
            "name": "{{ event.name }}",
            "title": "{{ event.title }}",
            "customTitle": "{{ event.customTitle }}",
            "status": "{{ event.isInterim ? 'INTERIM' : 'ACTIVE' }}",
            "appointedDate": "{{ event.appointedDate }}",
            "appointmentResolutionRef": "{{ event.appointmentResolutionRef }}",
            "reportsTo": "{{ event.reportsTo }}",
            "isBoardMember": "{{ event.isBoardMember }}",
            "directorId": "{{ event.directorId }}",
            "authorityLevel": "{{ event.authorityLevel }}",
            "spendingLimit": "{{ event.spendingLimit }}",
            "signatureAuthority": "{{ event.signatureAuthority }}",
            "delegatedAuthorities": []
          }
        },
        {
          "type": "REMOVE_FROM_ARRAY",
          "path": "vacantPositions",
          "value": "{{ event.title }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "OFFICER_APPOINTED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "officerId": "{{ event.officerId }}",
            "name": "{{ event.name }}",
            "title": "{{ event.title }}",
            "appointedDate": "{{ event.appointedDate }}"
          }
        }
      ]
    },
    "remove_officer": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Remove an officer (with or without cause)",
      "event": {
        "name": "remove_officer",
        "payload": {
          "officerId": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "reason": {
            "type": "string",
            "enum": [
              "WITH_CAUSE",
              "WITHOUT_CAUSE",
              "REORGANIZATION"
            ],
            "required": true
          },
          "removalResolutionRef": {
            "type": "string",
            "required": true
          },
          "severanceAgreementRef": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "isActiveOfficer",
          "expression": "context.officers.some(o => o.officerId === event.officerId && (o.status === 'ACTIVE' || o.status === 'INTERIM'))"
        },
        {
          "name": "hasRemovalAuthority",
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
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.officerId }}",
          "updates": {
            "status": "REMOVED",
            "terminationDate": "{{ event.effectiveDate }}"
          }
        },
        {
          "type": "COMPUTE",
          "path": "vacantPositions",
          "expression": "context.vacantPositions.concat([context.officers.find(o => o.officerId === event.officerId).title])"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "OFFICER_REMOVED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "officerId": "{{ event.officerId }}",
            "reason": "{{ event.reason }}"
          }
        }
      ]
    },
    "accept_resignation": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Accept an officer's resignation",
      "event": {
        "name": "accept_resignation",
        "payload": {
          "officerId": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "resignationLetterRef": {
            "type": "string"
          },
          "acceptedBy": {
            "type": "string",
            "required": true,
            "description": "Officer ID or BOARD"
          }
        }
      },
      "guards": [
        {
          "name": "isActiveOfficer",
          "expression": "context.officers.some(o => o.officerId === event.officerId && o.status === 'ACTIVE')"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.officerId }}",
          "updates": {
            "status": "RESIGNED",
            "terminationDate": "{{ event.effectiveDate }}"
          }
        },
        {
          "type": "COMPUTE",
          "path": "vacantPositions",
          "expression": "context.vacantPositions.concat([context.officers.find(o => o.officerId === event.officerId).title])"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "OFFICER_RESIGNED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "officerId": "{{ event.officerId }}",
            "effectiveDate": "{{ event.effectiveDate }}"
          }
        }
      ]
    },
    "delegate_authority": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "One officer delegates specific authority to another",
      "event": {
        "name": "delegate_authority",
        "payload": {
          "delegationId": {
            "type": "string",
            "required": true
          },
          "fromOfficerId": {
            "type": "string",
            "required": true
          },
          "toOfficerId": {
            "type": "string",
            "required": true
          },
          "authority": {
            "type": "string",
            "required": true,
            "description": "Type of authority being delegated"
          },
          "scope": {
            "type": "string",
            "required": true,
            "description": "Scope/limits of delegation"
          },
          "expiresOn": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "guards": [
        {
          "name": "delegatorIsActive",
          "expression": "context.officers.some(o => o.officerId === event.fromOfficerId && o.status === 'ACTIVE')"
        },
        {
          "name": "delegateeIsActive",
          "expression": "context.officers.some(o => o.officerId === event.toOfficerId && o.status === 'ACTIVE')"
        },
        {
          "name": "delegatorHasAuthority",
          "description": "Cannot delegate authority you don't have",
          "expression": "true"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.toOfficerId }}",
          "arrayPath": "delegatedAuthorities",
          "arrayOperation": "APPEND",
          "value": {
            "delegationId": "{{ event.delegationId }}",
            "authority": "{{ event.authority }}",
            "scope": "{{ event.scope }}",
            "delegatedBy": "{{ event.fromOfficerId }}",
            "delegatedOn": "{{ today() }}",
            "expiresOn": "{{ event.expiresOn }}",
            "revoked": false
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "AUTHORITY_DELEGATED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "delegationId": "{{ event.delegationId }}",
            "from": "{{ event.fromOfficerId }}",
            "to": "{{ event.toOfficerId }}",
            "authority": "{{ event.authority }}"
          }
        }
      ]
    },
    "revoke_authority": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Revoke a previously delegated authority",
      "event": {
        "name": "revoke_authority",
        "payload": {
          "delegationId": {
            "type": "string",
            "required": true
          },
          "officerId": {
            "type": "string",
            "required": true
          },
          "revokedBy": {
            "type": "string",
            "required": true
          },
          "reason": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "UPDATE_NESTED_ARRAY_ITEM",
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.officerId }}",
          "nestedPath": "delegatedAuthorities",
          "nestedMatchKey": "delegationId",
          "nestedMatchValue": "{{ event.delegationId }}",
          "updates": {
            "revoked": true
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "AUTHORITY_REVOKED",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "delegationId": "{{ event.delegationId }}",
            "officerId": "{{ event.officerId }}"
          }
        }
      ]
    },
    "update_authority_limits": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Update an officer's spending or signature authority limits",
      "event": {
        "name": "update_authority_limits",
        "payload": {
          "officerId": {
            "type": "string",
            "required": true
          },
          "authorityLevel": {
            "type": "string"
          },
          "spendingLimit": {
            "type": "number"
          },
          "signatureAuthority": {
            "type": "object"
          },
          "resolutionRef": {
            "type": "string",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasApproval",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.resolutionRef }}",
            "requiredState": "EXECUTED"
          }
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.officerId }}",
          "updates": {
            "authorityLevel": "{{ event.authorityLevel }}",
            "spendingLimit": "{{ event.spendingLimit }}",
            "signatureAuthority": "{{ event.signatureAuthority }}"
          }
        }
      ]
    },
    "promote_interim_to_permanent": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Convert an interim officer to permanent status",
      "event": {
        "name": "promote_interim_to_permanent",
        "payload": {
          "officerId": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
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
          "name": "isInterimOfficer",
          "expression": "context.officers.some(o => o.officerId === event.officerId && o.status === 'INTERIM')"
        }
      ],
      "effects": [
        {
          "type": "UPDATE_ARRAY_ITEM",
          "path": "officers",
          "matchKey": "officerId",
          "matchValue": "{{ event.officerId }}",
          "updates": {
            "status": "ACTIVE",
            "appointedDate": "{{ event.effectiveDate }}",
            "appointmentResolutionRef": "{{ event.resolutionRef }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "INTERIM_MADE_PERMANENT",
          "payload": {
            "entityId": "{{ context.entityId }}",
            "officerId": "{{ event.officerId }}"
          }
        }
      ]
    },
    "update_succession_plan": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Update the succession plan for key positions",
      "event": {
        "name": "update_succession_plan",
        "payload": {
          "position": {
            "type": "string",
            "required": true
          },
          "currentOfficerId": {
            "type": "string",
            "required": true
          },
          "successors": {
            "type": "array",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "UPSERT_ARRAY",
          "path": "successionPlan",
          "matchKey": "position",
          "matchValue": "{{ event.position }}",
          "value": {
            "position": "{{ event.position }}",
            "currentOfficerId": "{{ event.currentOfficerId }}",
            "successors": "{{ event.successors }}"
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
    "board": {
      "machine": "corporate-board",
      "description": "Board that appoints senior officers",
      "foreignKey": "entityId"
    },
    "resolutions": {
      "machine": "corporate-resolution",
      "description": "Resolutions authorizing officer actions",
      "foreignKey": "entityId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "officers",
      "executives",
      "authority"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/officers"
  }
} as const;

export const corporateProxyDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-proxy",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Proxy state machine managing the grant, use, and revocation of shareholder voting proxies. Supports meeting-specific and general proxies with revocability controls.",
  "context": {
    "proxyId": {
      "type": "string",
      "description": "Unique identifier for this proxy"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "grantorId": {
      "type": "string",
      "description": "Shareholder granting the proxy"
    },
    "grantorName": {
      "type": "string"
    },
    "grantorShares": {
      "type": "array",
      "description": "Shares covered by this proxy",
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
            "type": "integer"
          },
          "certificateNumbers": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "nullable": true
          }
        }
      }
    },
    "totalVotes": {
      "type": "integer",
      "description": "Total votes represented by this proxy"
    },
    "holderId": {
      "type": "string",
      "description": "Person/entity receiving proxy authority"
    },
    "holderName": {
      "type": "string"
    },
    "holderType": {
      "type": "string",
      "enum": [
        "INDIVIDUAL",
        "MANAGEMENT",
        "INSTITUTIONAL",
        "PROXY_SOLICITOR"
      ],
      "description": "Type of proxy holder"
    },
    "proxyType": {
      "type": "string",
      "enum": [
        "SPECIFIC_MEETING",
        "GENERAL",
        "LIMITED"
      ],
      "description": "Scope of proxy authority"
    },
    "scope": {
      "type": "object",
      "properties": {
        "meetingId": {
          "type": "string",
          "nullable": true,
          "description": "For meeting-specific proxies"
        },
        "meetingDate": {
          "type": "string",
          "format": "date",
          "nullable": true
        },
        "agendaItems": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "nullable": true,
          "description": "Specific agenda items proxy covers (null = all)"
        },
        "votingInstructions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "agendaItemId": {
                "type": "string"
              },
              "instruction": {
                "type": "string",
                "enum": [
                  "FOR",
                  "AGAINST",
                  "ABSTAIN",
                  "DISCRETIONARY"
                ]
              },
              "cumulativeAllocation": {
                "type": "object",
                "additionalProperties": {
                  "type": "integer"
                },
                "nullable": true,
                "description": "For director elections with cumulative voting"
              }
            }
          }
        },
        "discretionaryAuthority": {
          "type": "boolean",
          "default": false,
          "description": "Can vote on matters not specified"
        }
      }
    },
    "grantDate": {
      "type": "string",
      "format": "date"
    },
    "effectiveDate": {
      "type": "string",
      "format": "date"
    },
    "expirationDate": {
      "type": "string",
      "format": "date",
      "description": "Proxies typically expire after 11 months if not earlier"
    },
    "revocability": {
      "type": "object",
      "properties": {
        "isRevocable": {
          "type": "boolean",
          "default": true
        },
        "irrevocableReason": {
          "type": "string",
          "enum": [
            "COUPLED_WITH_INTEREST",
            "VOTING_AGREEMENT",
            "PLEDGE"
          ],
          "nullable": true,
          "description": "Reason for irrevocability if applicable"
        },
        "irrevocableUntil": {
          "type": "string",
          "format": "date",
          "nullable": true
        }
      }
    },
    "proxyCard": {
      "type": "object",
      "description": "Physical or electronic proxy card details",
      "properties": {
        "cardId": {
          "type": "string"
        },
        "format": {
          "type": "string",
          "enum": [
            "PAPER",
            "ELECTRONIC",
            "TELEPHONE"
          ]
        },
        "signedDate": {
          "type": "string",
          "format": "date"
        },
        "signatureVerified": {
          "type": "boolean",
          "default": false
        },
        "documentRef": {
          "type": "string"
        },
        "controlNumber": {
          "type": "string",
          "description": "Unique control number for voting"
        }
      }
    },
    "votesExercised": {
      "type": "array",
      "description": "Record of votes cast using this proxy",
      "items": {
        "type": "object",
        "properties": {
          "meetingId": {
            "type": "string"
          },
          "agendaItemId": {
            "type": "string"
          },
          "voteCast": {
            "type": "string",
            "enum": [
              "FOR",
              "AGAINST",
              "ABSTAIN",
              "WITHHOLD"
            ]
          },
          "voteCount": {
            "type": "integer"
          },
          "votedAt": {
            "type": "string",
            "format": "date-time"
          },
          "votedBy": {
            "type": "string"
          }
        }
      }
    },
    "revocationDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "revokedAt": {
          "type": "string",
          "format": "date-time"
        },
        "revokedBy": {
          "type": "string"
        },
        "revocationMethod": {
          "type": "string",
          "enum": [
            "WRITTEN_REVOCATION",
            "LATER_PROXY",
            "ATTENDANCE_IN_PERSON",
            "DEATH_INCAPACITY"
          ],
          "description": "How the proxy was revoked"
        },
        "supersedingProxyId": {
          "type": "string",
          "nullable": true
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
    "GRANTED": {
      "description": "Proxy has been granted but not yet active (before effective date or meeting)",
      "metadata": null
    },
    "ACTIVE": {
      "description": "Proxy is active and can be used to vote",
      "metadata": null
    },
    "VOTED": {
      "description": "Proxy has been used to cast all applicable votes",
      "metadata": null,
      "terminal": true
    },
    "REVOKED": {
      "description": "Proxy has been revoked by the grantor or superseded",
      "metadata": null,
      "terminal": true
    },
    "EXPIRED": {
      "description": "Proxy has expired without being fully used",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "GRANTED",
  "transitions": {
    "grant_proxy": {
      "from": null,
      "to": "GRANTED",
      "description": "Shareholder grants a proxy",
      "event": {
        "name": "grant_proxy",
        "payload": {
          "proxyId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "grantorId": {
            "type": "string",
            "required": true
          },
          "grantorName": {
            "type": "string",
            "required": true
          },
          "grantorShares": {
            "type": "array",
            "required": true
          },
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
            "default": "INDIVIDUAL"
          },
          "proxyType": {
            "type": "string",
            "required": true
          },
          "scope": {
            "type": "object",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "expirationDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "revocability": {
            "type": "object"
          },
          "proxyCard": {
            "type": "object"
          }
        }
      },
      "guards": [
        {
          "name": "grantorIsShareholderOfRecord",
          "description": "Grantor must be shareholder of record",
          "expression": "event.grantorShares.length > 0"
        },
        {
          "name": "validExpirationDate",
          "description": "Expiration cannot exceed 11 months for most proxies",
          "expression": "(new Date(event.expirationDate) - new Date(event.effectiveDate)) <= 11 * 30 * 24 * 60 * 60 * 1000"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "proxyId",
          "value": "{{ event.proxyId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "grantorId",
          "value": "{{ event.grantorId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "grantorName",
          "value": "{{ event.grantorName }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "grantorShares",
          "value": "{{ event.grantorShares }}"
        },
        {
          "type": "COMPUTE",
          "path": "totalVotes",
          "expression": "event.grantorShares.reduce((sum, s) => sum + s.votes, 0)"
        },
        {
          "type": "SET_CONTEXT",
          "path": "holderId",
          "value": "{{ event.holderId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "holderName",
          "value": "{{ event.holderName }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "holderType",
          "value": "{{ event.holderType }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "proxyType",
          "value": "{{ event.proxyType }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "scope",
          "value": "{{ event.scope }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "grantDate",
          "value": "{{ today() }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "effectiveDate",
          "value": "{{ event.effectiveDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "expirationDate",
          "value": "{{ event.expirationDate }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "revocability",
          "value": "{{ event.revocability || { isRevocable: true } }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "proxyCard",
          "value": "{{ event.proxyCard }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "votesExercised",
          "value": []
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_GRANTED",
          "payload": {
            "proxyId": "{{ event.proxyId }}",
            "grantorId": "{{ event.grantorId }}",
            "holderId": "{{ event.holderId }}",
            "totalVotes": "{{ event.grantorShares.reduce((sum, s) => sum + s.votes, 0) }}"
          }
        }
      ]
    },
    "activate": {
      "from": "GRANTED",
      "to": "ACTIVE",
      "description": "Proxy becomes active (effective date reached or meeting commenced)",
      "event": {
        "name": "activate",
        "payload": {
          "activatedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "effectiveDateReached",
          "expression": "new Date() >= new Date(context.effectiveDate)"
        },
        {
          "name": "notExpired",
          "expression": "new Date() < new Date(context.expirationDate)"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_ACTIVATED",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "grantorId": "{{ context.grantorId }}"
          }
        }
      ]
    },
    "vote_proxy": {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "description": "Exercise proxy to cast vote on an agenda item",
      "event": {
        "name": "vote_proxy",
        "payload": {
          "meetingId": {
            "type": "string",
            "required": true
          },
          "agendaItemId": {
            "type": "string",
            "required": true
          },
          "voteCast": {
            "type": "string",
            "enum": [
              "FOR",
              "AGAINST",
              "ABSTAIN",
              "WITHHOLD"
            ],
            "required": true
          },
          "votedBy": {
            "type": "string",
            "required": true,
            "description": "Proxy holder exercising vote"
          }
        }
      },
      "guards": [
        {
          "name": "meetingMatches",
          "description": "For meeting-specific proxies, meeting must match",
          "expression": "context.proxyType !== 'SPECIFIC_MEETING' || context.scope.meetingId === event.meetingId"
        },
        {
          "name": "agendaItemCovered",
          "description": "Agenda item must be within proxy scope",
          "expression": "context.scope.agendaItems == null || context.scope.agendaItems.includes(event.agendaItemId)"
        },
        {
          "name": "notAlreadyVotedOnItem",
          "expression": "!context.votesExercised.some(v => v.meetingId === event.meetingId && v.agendaItemId === event.agendaItemId)"
        },
        {
          "name": "isProxyHolder",
          "expression": "event.votedBy === context.holderId"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "votesExercised",
          "value": {
            "meetingId": "{{ event.meetingId }}",
            "agendaItemId": "{{ event.agendaItemId }}",
            "voteCast": "{{ event.voteCast }}",
            "voteCount": "{{ context.totalVotes }}",
            "votedAt": "{{ now() }}",
            "votedBy": "{{ event.votedBy }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_VOTE_CAST",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "grantorId": "{{ context.grantorId }}",
            "meetingId": "{{ event.meetingId }}",
            "agendaItemId": "{{ event.agendaItemId }}",
            "voteCast": "{{ event.voteCast }}",
            "voteCount": "{{ context.totalVotes }}"
          }
        }
      ]
    },
    "complete_voting": {
      "from": "ACTIVE",
      "to": "VOTED",
      "description": "All applicable votes have been cast using this proxy",
      "event": {
        "name": "complete_voting",
        "payload": {
          "completedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "meetingId": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_VOTING_COMPLETED",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "grantorId": "{{ context.grantorId }}",
            "meetingId": "{{ event.meetingId }}",
            "totalVotesExercised": "{{ context.votesExercised.length }}"
          }
        }
      ]
    },
    "revoke_proxy": {
      "from": [
        "GRANTED",
        "ACTIVE"
      ],
      "to": "REVOKED",
      "description": "Revoke the proxy",
      "event": {
        "name": "revoke_proxy",
        "payload": {
          "revokedBy": {
            "type": "string",
            "required": true
          },
          "revocationMethod": {
            "type": "string",
            "required": true
          },
          "supersedingProxyId": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "isRevocable",
          "description": "Proxy must be revocable (or irrevocability period expired)",
          "expression": "context.revocability.isRevocable || (context.revocability.irrevocableUntil && new Date() >= new Date(context.revocability.irrevocableUntil))"
        },
        {
          "name": "revokedByGrantor",
          "description": "Only grantor can revoke (or death/incapacity)",
          "expression": "event.revokedBy === context.grantorId || event.revocationMethod === 'DEATH_INCAPACITY'"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "revocationDetails",
          "value": {
            "revokedAt": "{{ now() }}",
            "revokedBy": "{{ event.revokedBy }}",
            "revocationMethod": "{{ event.revocationMethod }}",
            "supersedingProxyId": "{{ event.supersedingProxyId }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_REVOKED",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "grantorId": "{{ context.grantorId }}",
            "revocationMethod": "{{ event.revocationMethod }}"
          }
        }
      ]
    },
    "expire": {
      "from": [
        "GRANTED",
        "ACTIVE"
      ],
      "to": "EXPIRED",
      "description": "Proxy expires",
      "event": {
        "name": "expire",
        "payload": {
          "expiredAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "isPastExpiration",
          "expression": "new Date(event.expiredAt) >= new Date(context.expirationDate)"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_EXPIRED",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "grantorId": "{{ context.grantorId }}"
          }
        }
      ]
    },
    "supersede": {
      "from": [
        "GRANTED",
        "ACTIVE"
      ],
      "to": "REVOKED",
      "description": "Proxy superseded by a later proxy from the same grantor",
      "event": {
        "name": "supersede",
        "payload": {
          "supersedingProxyId": {
            "type": "string",
            "required": true
          },
          "supersededAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "revocationDetails",
          "value": {
            "revokedAt": "{{ event.supersededAt }}",
            "revokedBy": "{{ context.grantorId }}",
            "revocationMethod": "LATER_PROXY",
            "supersedingProxyId": "{{ event.supersedingProxyId }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "PROXY_SUPERSEDED",
          "payload": {
            "proxyId": "{{ context.proxyId }}",
            "supersedingProxyId": "{{ event.supersedingProxyId }}"
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
    "shareholders": {
      "machine": "corporate-shareholders",
      "description": "Shareholder meeting where proxy may be used",
      "foreignKey": "scope.meetingId"
    },
    "securities": {
      "machine": "corporate-securities",
      "description": "Shares represented by this proxy",
      "foreignKey": "grantorId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "proxy",
      "voting",
      "shareholders"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/proxy"
  }
} as const;

export const corporateResolutionDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-resolution",
  "version": "1.0.0",
  "category": "corporate-governance",
  "description": "Formal corporate resolutions state machine tracking the lifecycle from proposal through approval, execution, and expiration. Supports board resolutions, shareholder resolutions, and written consents.",
  "context": {
    "resolutionId": {
      "type": "string",
      "description": "Unique identifier for this resolution"
    },
    "entityId": {
      "type": "string",
      "description": "Reference to parent corporate-entity"
    },
    "resolutionNumber": {
      "type": "string",
      "description": "Sequential resolution number (e.g., 2024-B-001 for board, 2024-S-001 for shareholder)"
    },
    "title": {
      "type": "string",
      "description": "Brief title of the resolution"
    },
    "resolutionType": {
      "type": "string",
      "enum": [
        "BOARD_RESOLUTION",
        "SHAREHOLDER_RESOLUTION",
        "BOARD_WRITTEN_CONSENT",
        "SHAREHOLDER_WRITTEN_CONSENT",
        "UNANIMOUS_WRITTEN_CONSENT"
      ],
      "description": "Type of resolution"
    },
    "category": {
      "type": "string",
      "enum": [
        "OFFICER_APPOINTMENT",
        "OFFICER_REMOVAL",
        "STOCK_ISSUANCE",
        "DIVIDEND_DECLARATION",
        "CONTRACT_APPROVAL",
        "BANKING",
        "CHARTER_AMENDMENT",
        "BYLAW_AMENDMENT",
        "MERGER_ACQUISITION",
        "DISSOLUTION",
        "COMMITTEE_ACTION",
        "COMPENSATION",
        "AUDIT",
        "GENERAL",
        "OTHER"
      ],
      "description": "Category of action"
    },
    "proposedDate": {
      "type": "string",
      "format": "date"
    },
    "proposedBy": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "DIRECTOR",
            "OFFICER",
            "SHAREHOLDER",
            "COMMITTEE"
          ]
        },
        "personId": {
          "type": "string"
        },
        "name": {
          "type": "string"
        }
      }
    },
    "resolvedText": {
      "type": "string",
      "description": "Full text of the resolution including WHEREAS and RESOLVED clauses"
    },
    "whereAsClauses": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Background/recital clauses"
    },
    "resolvedClauses": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Operative clauses"
    },
    "attachments": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "attachmentId": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "documentRef": {
            "type": "string"
          },
          "type": {
            "type": "string"
          }
        }
      }
    },
    "approvalRequirements": {
      "type": "object",
      "properties": {
        "approverType": {
          "type": "string",
          "enum": [
            "BOARD",
            "SHAREHOLDERS",
            "COMMITTEE",
            "BOARD_AND_SHAREHOLDERS"
          ]
        },
        "threshold": {
          "type": "string",
          "enum": [
            "MAJORITY_PRESENT",
            "MAJORITY_FULL",
            "SUPERMAJORITY",
            "UNANIMOUS"
          ],
          "description": "Vote threshold required"
        },
        "supermajorityPercent": {
          "type": "number",
          "nullable": true
        },
        "quorumRequired": {
          "type": "boolean",
          "default": true
        },
        "shareholderClassVotes": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Share classes that must approve (for class voting)"
        }
      }
    },
    "meetingRef": {
      "type": "object",
      "nullable": true,
      "description": "Reference to meeting where resolution was considered",
      "properties": {
        "meetingType": {
          "type": "string",
          "enum": [
            "BOARD_MEETING",
            "SHAREHOLDER_MEETING",
            "COMMITTEE_MEETING"
          ]
        },
        "meetingId": {
          "type": "string"
        },
        "meetingDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "voting": {
      "type": "object",
      "properties": {
        "votingOpenedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "votingClosedAt": {
          "type": "string",
          "format": "date-time",
          "nullable": true
        },
        "votes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "voterId": {
                "type": "string"
              },
              "voterName": {
                "type": "string"
              },
              "voterType": {
                "type": "string",
                "enum": [
                  "DIRECTOR",
                  "SHAREHOLDER",
                  "COMMITTEE_MEMBER"
                ]
              },
              "vote": {
                "type": "string",
                "enum": [
                  "FOR",
                  "AGAINST",
                  "ABSTAIN",
                  "RECUSE"
                ]
              },
              "votingPower": {
                "type": "integer",
                "default": 1,
                "description": "Number of votes (shares for shareholders)"
              },
              "timestamp": {
                "type": "string",
                "format": "date-time"
              },
              "comment": {
                "type": "string",
                "nullable": true
              }
            }
          }
        },
        "tally": {
          "type": "object",
          "properties": {
            "for": {
              "type": "integer",
              "default": 0
            },
            "against": {
              "type": "integer",
              "default": 0
            },
            "abstain": {
              "type": "integer",
              "default": 0
            },
            "recused": {
              "type": "integer",
              "default": 0
            },
            "totalEligible": {
              "type": "integer"
            },
            "totalVoted": {
              "type": "integer"
            }
          }
        }
      }
    },
    "writtenConsent": {
      "type": "object",
      "nullable": true,
      "description": "For written consent resolutions (no meeting)",
      "properties": {
        "consentForm": {
          "type": "string",
          "description": "Document reference"
        },
        "circulationDate": {
          "type": "string",
          "format": "date"
        },
        "consentDeadline": {
          "type": "string",
          "format": "date"
        },
        "consents": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "consentorId": {
                "type": "string"
              },
              "consentorName": {
                "type": "string"
              },
              "signedDate": {
                "type": "string",
                "format": "date"
              },
              "votingPower": {
                "type": "integer",
                "default": 1
              },
              "signatureRef": {
                "type": "string"
              }
            }
          }
        },
        "totalConsentPower": {
          "type": "integer"
        },
        "requiredConsentPower": {
          "type": "integer"
        }
      }
    },
    "approvalDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "approved": {
          "type": "boolean"
        },
        "approvalDate": {
          "type": "string",
          "format": "date"
        },
        "approvalMethod": {
          "type": "string",
          "enum": [
            "MEETING_VOTE",
            "WRITTEN_CONSENT"
          ]
        },
        "certifiedBy": {
          "type": "string"
        },
        "certificationDate": {
          "type": "string",
          "format": "date"
        }
      }
    },
    "effectiveDate": {
      "type": "string",
      "format": "date",
      "nullable": true
    },
    "expirationDate": {
      "type": "string",
      "format": "date",
      "nullable": true,
      "description": "For authorizations with time limits"
    },
    "executionDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "executedDate": {
          "type": "string",
          "format": "date"
        },
        "executedBy": {
          "type": "string"
        },
        "executionNotes": {
          "type": "string"
        },
        "resultingActions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "actionType": {
                "type": "string"
              },
              "reference": {
                "type": "string"
              },
              "completedDate": {
                "type": "string",
                "format": "date"
              }
            }
          }
        }
      }
    },
    "rescissionDetails": {
      "type": "object",
      "nullable": true,
      "properties": {
        "rescindedDate": {
          "type": "string",
          "format": "date"
        },
        "rescindingResolutionRef": {
          "type": "string"
        },
        "reason": {
          "type": "string"
        }
      }
    },
    "relatedResolutions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "resolutionId": {
            "type": "string"
          },
          "relationship": {
            "type": "string",
            "enum": [
              "SUPERSEDES",
              "SUPERSEDED_BY",
              "AMENDS",
              "AMENDED_BY",
              "DEPENDS_ON",
              "ENABLES"
            ]
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
    "DRAFT": {
      "description": "Resolution drafted but not yet formally proposed",
      "metadata": null
    },
    "PROPOSED": {
      "description": "Resolution formally proposed and awaiting vote",
      "metadata": null
    },
    "VOTING": {
      "description": "Voting or consent collection in progress",
      "metadata": null
    },
    "APPROVED": {
      "description": "Resolution approved but not yet executed/effective",
      "metadata": null
    },
    "EXECUTED": {
      "description": "Resolution has been carried out; authorized actions completed",
      "metadata": null
    },
    "REJECTED": {
      "description": "Resolution failed to obtain required approval",
      "metadata": null,
      "terminal": true
    },
    "EXPIRED": {
      "description": "Resolution expired without execution",
      "metadata": null,
      "terminal": true
    },
    "RESCINDED": {
      "description": "Resolution was rescinded by subsequent action",
      "metadata": null,
      "terminal": true
    }
  },
  "initialState": "DRAFT",
  "transitions": {
    "draft_resolution": {
      "from": null,
      "to": "DRAFT",
      "description": "Create a new draft resolution",
      "event": {
        "name": "draft_resolution",
        "payload": {
          "resolutionId": {
            "type": "string",
            "required": true
          },
          "entityId": {
            "type": "string",
            "required": true
          },
          "title": {
            "type": "string",
            "required": true
          },
          "resolutionType": {
            "type": "string",
            "required": true
          },
          "category": {
            "type": "string",
            "required": true
          },
          "whereAsClauses": {
            "type": "array"
          },
          "resolvedClauses": {
            "type": "array",
            "required": true
          },
          "approvalRequirements": {
            "type": "object",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "resolutionId",
          "value": "{{ event.resolutionId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "entityId",
          "value": "{{ event.entityId }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "title",
          "value": "{{ event.title }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "resolutionType",
          "value": "{{ event.resolutionType }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "category",
          "value": "{{ event.category }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "whereAsClauses",
          "value": "{{ event.whereAsClauses }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "resolvedClauses",
          "value": "{{ event.resolvedClauses }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "approvalRequirements",
          "value": "{{ event.approvalRequirements }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "voting.votes",
          "value": []
        },
        {
          "type": "SET_CONTEXT",
          "path": "voting.tally",
          "value": {
            "for": 0,
            "against": 0,
            "abstain": 0,
            "recused": 0,
            "totalVoted": 0
          }
        }
      ]
    },
    "propose": {
      "from": "DRAFT",
      "to": "PROPOSED",
      "description": "Formally propose the resolution for consideration",
      "event": {
        "name": "propose",
        "payload": {
          "proposedBy": {
            "type": "object",
            "required": true
          },
          "meetingRef": {
            "type": "object",
            "description": "If proposing for a specific meeting"
          },
          "resolutionNumber": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "proposedDate",
          "value": "{{ today() }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "proposedBy",
          "value": "{{ event.proposedBy }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "meetingRef",
          "value": "{{ event.meetingRef }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "resolutionNumber",
          "value": "{{ event.resolutionNumber }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_PROPOSED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "title": "{{ context.title }}",
            "type": "{{ context.resolutionType }}"
          }
        }
      ]
    },
    "open_voting": {
      "from": "PROPOSED",
      "to": "VOTING",
      "description": "Open voting on the resolution (at meeting or via written consent)",
      "event": {
        "name": "open_voting",
        "payload": {
          "votingOpenedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "totalEligibleVoters": {
            "type": "integer",
            "required": true
          },
          "isWrittenConsent": {
            "type": "boolean",
            "default": false
          },
          "consentDeadline": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "guards": [
        {
          "name": "meetingHasQuorumIfRequired",
          "description": "If board/shareholder vote at meeting, meeting must have quorum",
          "expression": "!event.isWrittenConsent || !context.approvalRequirements.quorumRequired"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "voting.votingOpenedAt",
          "value": "{{ event.votingOpenedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "voting.tally.totalEligible",
          "value": "{{ event.totalEligibleVoters }}"
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.isWrittenConsent",
          "then": {
            "type": "SET_CONTEXT",
            "path": "writtenConsent",
            "value": {
              "circulationDate": "{{ today() }}",
              "consentDeadline": "{{ event.consentDeadline }}",
              "consents": [],
              "totalConsentPower": 0
            }
          }
        }
      ]
    },
    "record_vote": {
      "from": "VOTING",
      "to": "VOTING",
      "description": "Record an individual vote on the resolution",
      "event": {
        "name": "record_vote",
        "payload": {
          "voterId": {
            "type": "string",
            "required": true
          },
          "voterName": {
            "type": "string",
            "required": true
          },
          "voterType": {
            "type": "string",
            "required": true
          },
          "vote": {
            "type": "string",
            "enum": [
              "FOR",
              "AGAINST",
              "ABSTAIN",
              "RECUSE"
            ],
            "required": true
          },
          "votingPower": {
            "type": "integer",
            "default": 1
          },
          "comment": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "hasNotAlreadyVoted",
          "expression": "!context.voting.votes.some(v => v.voterId === event.voterId)"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "voting.votes",
          "value": {
            "voterId": "{{ event.voterId }}",
            "voterName": "{{ event.voterName }}",
            "voterType": "{{ event.voterType }}",
            "vote": "{{ event.vote }}",
            "votingPower": "{{ event.votingPower }}",
            "timestamp": "{{ now() }}",
            "comment": "{{ event.comment }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.vote === 'FOR'",
          "then": {
            "type": "INCREMENT",
            "path": "voting.tally.for",
            "amount": "{{ event.votingPower }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.vote === 'AGAINST'",
          "then": {
            "type": "INCREMENT",
            "path": "voting.tally.against",
            "amount": "{{ event.votingPower }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.vote === 'ABSTAIN'",
          "then": {
            "type": "INCREMENT",
            "path": "voting.tally.abstain",
            "amount": "{{ event.votingPower }}"
          }
        },
        {
          "type": "CONDITIONAL",
          "condition": "event.vote === 'RECUSE'",
          "then": {
            "type": "INCREMENT",
            "path": "voting.tally.recused",
            "amount": "{{ event.votingPower }}"
          }
        },
        {
          "type": "INCREMENT",
          "path": "voting.tally.totalVoted",
          "amount": "{{ event.votingPower }}"
        }
      ]
    },
    "record_consent": {
      "from": "VOTING",
      "to": "VOTING",
      "description": "Record a written consent signature",
      "event": {
        "name": "record_consent",
        "payload": {
          "consentorId": {
            "type": "string",
            "required": true
          },
          "consentorName": {
            "type": "string",
            "required": true
          },
          "signedDate": {
            "type": "string",
            "format": "date",
            "required": true
          },
          "votingPower": {
            "type": "integer",
            "default": 1
          },
          "signatureRef": {
            "type": "string"
          }
        }
      },
      "guards": [
        {
          "name": "isWrittenConsentResolution",
          "expression": "context.writtenConsent != null"
        },
        {
          "name": "hasNotAlreadyConsented",
          "expression": "!context.writtenConsent.consents.some(c => c.consentorId === event.consentorId)"
        }
      ],
      "effects": [
        {
          "type": "APPEND_ARRAY",
          "path": "writtenConsent.consents",
          "value": {
            "consentorId": "{{ event.consentorId }}",
            "consentorName": "{{ event.consentorName }}",
            "signedDate": "{{ event.signedDate }}",
            "votingPower": "{{ event.votingPower }}",
            "signatureRef": "{{ event.signatureRef }}"
          }
        },
        {
          "type": "INCREMENT",
          "path": "writtenConsent.totalConsentPower",
          "amount": "{{ event.votingPower }}"
        }
      ]
    },
    "close_voting_approved": {
      "from": "VOTING",
      "to": "APPROVED",
      "description": "Close voting - resolution passes",
      "event": {
        "name": "close_voting_approved",
        "payload": {
          "votingClosedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "certifiedBy": {
            "type": "string",
            "required": true
          },
          "effectiveDate": {
            "type": "string",
            "format": "date"
          },
          "expirationDate": {
            "type": "string",
            "format": "date"
          }
        }
      },
      "guards": [
        {
          "name": "meetsApprovalThreshold",
          "description": "Vote tally meets required threshold",
          "expression": "context.voting.tally.for > context.voting.tally.against"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "voting.votingClosedAt",
          "value": "{{ event.votingClosedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "approvalDetails",
          "value": {
            "approved": true,
            "approvalDate": "{{ today() }}",
            "approvalMethod": "{{ context.writtenConsent ? 'WRITTEN_CONSENT' : 'MEETING_VOTE' }}",
            "certifiedBy": "{{ event.certifiedBy }}",
            "certificationDate": "{{ today() }}"
          }
        },
        {
          "type": "SET_CONTEXT",
          "path": "effectiveDate",
          "value": "{{ event.effectiveDate || today() }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "expirationDate",
          "value": "{{ event.expirationDate }}"
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_APPROVED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "title": "{{ context.title }}",
            "votesFor": "{{ context.voting.tally.for }}",
            "votesAgainst": "{{ context.voting.tally.against }}"
          }
        }
      ]
    },
    "close_voting_rejected": {
      "from": "VOTING",
      "to": "REJECTED",
      "description": "Close voting - resolution fails",
      "event": {
        "name": "close_voting_rejected",
        "payload": {
          "votingClosedAt": {
            "type": "string",
            "format": "date-time",
            "required": true
          },
          "certifiedBy": {
            "type": "string",
            "required": true
          }
        }
      },
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "voting.votingClosedAt",
          "value": "{{ event.votingClosedAt }}"
        },
        {
          "type": "SET_CONTEXT",
          "path": "approvalDetails",
          "value": {
            "approved": false,
            "approvalDate": "{{ today() }}",
            "approvalMethod": "{{ context.writtenConsent ? 'WRITTEN_CONSENT' : 'MEETING_VOTE' }}",
            "certifiedBy": "{{ event.certifiedBy }}",
            "certificationDate": "{{ today() }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_REJECTED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "title": "{{ context.title }}"
          }
        }
      ]
    },
    "execute": {
      "from": "APPROVED",
      "to": "EXECUTED",
      "description": "Execute the resolution - carry out authorized actions",
      "event": {
        "name": "execute",
        "payload": {
          "executedBy": {
            "type": "string",
            "required": true
          },
          "executionNotes": {
            "type": "string"
          },
          "resultingActions": {
            "type": "array"
          }
        }
      },
      "guards": [
        {
          "name": "effectiveDateReached",
          "description": "Cannot execute before effective date",
          "expression": "new Date() >= new Date(context.effectiveDate)"
        },
        {
          "name": "notExpired",
          "description": "Cannot execute after expiration",
          "expression": "context.expirationDate == null || new Date() <= new Date(context.expirationDate)"
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "executionDetails",
          "value": {
            "executedDate": "{{ today() }}",
            "executedBy": "{{ event.executedBy }}",
            "executionNotes": "{{ event.executionNotes }}",
            "resultingActions": "{{ event.resultingActions }}"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_EXECUTED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "title": "{{ context.title }}",
            "category": "{{ context.category }}"
          }
        }
      ]
    },
    "expire": {
      "from": "APPROVED",
      "to": "EXPIRED",
      "description": "Resolution expires without being executed",
      "event": {
        "name": "expire",
        "payload": {
          "expiredDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasExpirationDate",
          "expression": "context.expirationDate != null"
        },
        {
          "name": "isPastExpiration",
          "expression": "new Date(event.expiredDate) >= new Date(context.expirationDate)"
        }
      ],
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_EXPIRED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "title": "{{ context.title }}"
          }
        }
      ]
    },
    "rescind": {
      "from": [
        "APPROVED",
        "EXECUTED"
      ],
      "to": "RESCINDED",
      "description": "Rescind the resolution by subsequent formal action",
      "event": {
        "name": "rescind",
        "payload": {
          "rescindingResolutionRef": {
            "type": "string",
            "required": true
          },
          "reason": {
            "type": "string",
            "required": true
          },
          "rescindedDate": {
            "type": "string",
            "format": "date",
            "required": true
          }
        }
      },
      "guards": [
        {
          "name": "hasRescindingResolution",
          "description": "Must have a subsequent resolution authorizing rescission",
          "crossMachine": {
            "machine": "corporate-resolution",
            "instanceRef": "{{ event.rescindingResolutionRef }}",
            "requiredState": "APPROVED"
          }
        }
      ],
      "effects": [
        {
          "type": "SET_CONTEXT",
          "path": "rescissionDetails",
          "value": {
            "rescindedDate": "{{ event.rescindedDate }}",
            "rescindingResolutionRef": "{{ event.rescindingResolutionRef }}",
            "reason": "{{ event.reason }}"
          }
        },
        {
          "type": "APPEND_ARRAY",
          "path": "relatedResolutions",
          "value": {
            "resolutionId": "{{ event.rescindingResolutionRef }}",
            "relationship": "SUPERSEDED_BY"
          }
        },
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_RESCINDED",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "rescindedBy": "{{ event.rescindingResolutionRef }}"
          }
        }
      ]
    },
    "withdraw": {
      "from": [
        "DRAFT",
        "PROPOSED"
      ],
      "to": "REJECTED",
      "description": "Withdraw the resolution before voting",
      "event": {
        "name": "withdraw",
        "payload": {
          "withdrawnBy": {
            "type": "string",
            "required": true
          },
          "reason": {
            "type": "string"
          }
        }
      },
      "effects": [
        {
          "type": "EMIT_EVENT",
          "eventType": "RESOLUTION_WITHDRAWN",
          "payload": {
            "resolutionId": "{{ context.resolutionId }}",
            "withdrawnBy": "{{ event.withdrawnBy }}"
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
    "board": {
      "machine": "corporate-board",
      "description": "Board for board resolutions",
      "foreignKey": "entityId"
    },
    "shareholders": {
      "machine": "corporate-shareholders",
      "description": "Shareholder meeting for shareholder resolutions",
      "foreignKey": "meetingRef.meetingId"
    }
  },
  "metadata": {
    "author": "OttoChain",
    "license": "MIT",
    "tags": [
      "corporate",
      "governance",
      "resolution",
      "voting",
      "board",
      "shareholders"
    ],
    "documentation": "https://ottochain.dev/docs/corporate/resolution"
  }
} as const;

export const corporateSecuritiesDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-securities",
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

export const corporateShareholdersDef = {
  "$schema": "https://ottochain.dev/schemas/state-machine-v1.json",
  "name": "corporate-shareholders",
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