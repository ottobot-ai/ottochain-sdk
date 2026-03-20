/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const agentIdentityDef = {
  "metadata": {
    "name": "AgentIdentity",
    "description": "Decentralized agent identity with reputation tracking and lifecycle management",
    "version": "1.0.0"
  },
  "states": {
    "REGISTERED": {
      "id": "REGISTERED",
      "isFinal": false,
      "metadata": null
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "CHALLENGED": {
      "id": "CHALLENGED",
      "isFinal": false,
      "metadata": null
    },
    "SUSPENDED": {
      "id": "SUSPENDED",
      "isFinal": false,
      "metadata": null
    },
    "PROBATION": {
      "id": "PROBATION",
      "isFinal": false,
      "metadata": null
    },
    "WITHDRAWN": {
      "id": "WITHDRAWN",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "REGISTERED",
  "transitions": [
    {
      "from": "REGISTERED",
      "to": "ACTIVE",
      "eventName": "activate",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "ACTIVE",
            "activatedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "receive_vouch",
      "guard": {
        "!!": [
          {
            "var": "event.from"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "reputation": {
              "+": [
                {
                  "var": "state.reputation"
                },
                2
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "receive_completion",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "reputation": {
              "+": [
                {
                  "var": "state.reputation"
                },
                5
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "CHALLENGED",
      "eventName": "challenge",
      "guard": {
        "!!": [
          {
            "var": "event.challenger"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "CHALLENGED",
            "challengedBy": {
              "var": "event.challenger"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "CHALLENGED",
      "to": "ACTIVE",
      "eventName": "dismiss_challenge",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "ACTIVE",
            "challengedBy": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "CHALLENGED",
      "to": "SUSPENDED",
      "eventName": "uphold_challenge",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "SUSPENDED",
            "suspendedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "SUSPENDED",
      "to": "PROBATION",
      "eventName": "begin_probation",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "PROBATION",
            "probationStartedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PROBATION",
      "to": "ACTIVE",
      "eventName": "complete_probation",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "ACTIVE",
            "probationStartedAt": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "WITHDRAWN",
      "eventName": "withdraw",
      "guard": {
        "==": [
          1,
          1
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "WITHDRAWN"
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;