/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const identityAgentDef = {
  "$schema": "https://ottochain.ai/schemas/fiber-app-v1.json",
  "metadata": {
    "name": "IdentityAgent",
    "app": "identity",
    "type": "agent",
    "version": "1.0.0",
    "description": "Standard agent identity with reputation tracking, vouching, and lifecycle management"
  },
  "createSchema": {
    "required": [
      "owner",
      "displayName"
    ],
    "properties": {
      "owner": {
        "type": "address",
        "description": "Agent owner DAG address",
        "immutable": true
      },
      "displayName": {
        "type": "string",
        "maxLength": 64,
        "description": "Human-readable agent name"
      },
      "bio": {
        "type": "string",
        "maxLength": 256,
        "default": ""
      },
      "avatar": {
        "type": "uri",
        "default": null
      },
      "platforms": {
        "type": "array",
        "items": {
          "$ref": "#/definitions/PlatformLink"
        },
        "default": []
      }
    }
  },
  "stateSchema": {
    "properties": {
      "owner": {
        "type": "address",
        "immutable": true
      },
      "displayName": {
        "type": "string"
      },
      "bio": {
        "type": "string"
      },
      "avatar": {
        "type": "uri"
      },
      "platforms": {
        "type": "array",
        "items": {
          "$ref": "#/definitions/PlatformLink"
        }
      },
      "status": {
        "type": "string",
        "enum": [
          "REGISTERED",
          "ACTIVE",
          "CHALLENGED",
          "SUSPENDED",
          "PROBATION",
          "WITHDRAWN"
        ],
        "computed": true
      },
      "reputation": {
        "type": "integer",
        "default": 10,
        "computed": true
      },
      "activatedAt": {
        "type": "timestamp",
        "computed": true
      },
      "suspendedAt": {
        "type": "timestamp",
        "computed": true
      },
      "probationStartedAt": {
        "type": "timestamp",
        "computed": true
      },
      "challengedBy": {
        "type": "address",
        "computed": true
      }
    }
  },
  "eventSchemas": {
    "activate": {
      "description": "Activate a registered agent"
    },
    "receive_vouch": {
      "description": "Receive a vouch from another agent",
      "required": [
        "from"
      ],
      "properties": {
        "from": {
          "type": "address",
          "description": "Address of vouching agent"
        },
        "weight": {
          "type": "integer",
          "minimum": 1,
          "maximum": 10,
          "default": 1
        }
      }
    },
    "receive_completion": {
      "description": "Receive completion attestation from a fiber"
    },
    "challenge": {
      "description": "Challenge an active agent's behavior",
      "required": [
        "challenger",
        "reason"
      ],
      "properties": {
        "challenger": {
          "type": "address"
        },
        "reason": {
          "type": "string",
          "maxLength": 512
        },
        "evidence": {
          "type": "array",
          "items": {
            "type": "uri"
          }
        }
      }
    },
    "dismiss_challenge": {
      "description": "Dismiss an active challenge"
    },
    "uphold_challenge": {
      "description": "Uphold a challenge, suspending the agent"
    },
    "begin_probation": {
      "description": "Move suspended agent to probation"
    },
    "complete_probation": {
      "description": "Complete probation, reactivating the agent"
    },
    "withdraw": {
      "description": "Permanently withdraw the agent"
    }
  },
  "definitions": {
    "PlatformLink": {
      "type": "object",
      "required": [
        "platform",
        "handle"
      ],
      "properties": {
        "platform": {
          "type": "string",
          "enum": [
            "twitter",
            "github",
            "discord",
            "telegram",
            "moltbook"
          ]
        },
        "handle": {
          "type": "string"
        },
        "verified": {
          "type": "boolean",
          "default": false
        }
      }
    }
  },
  "states": {
    "REGISTERED": {
      "id": "REGISTERED",
      "isFinal": false
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false
    },
    "CHALLENGED": {
      "id": "CHALLENGED",
      "isFinal": false
    },
    "SUSPENDED": {
      "id": "SUSPENDED",
      "isFinal": false
    },
    "PROBATION": {
      "id": "PROBATION",
      "isFinal": false
    },
    "WITHDRAWN": {
      "id": "WITHDRAWN",
      "isFinal": true
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
    },
    {
      "from": "REGISTERED",
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

export const identityOracleDef = {
  "metadata": {
    "name": "IdentityOracle",
    "description": "Oracle identity with staking, attestations, reputation, and slashing mechanics",
    "version": "1.0.0"
  },
  "states": {
    "UNREGISTERED": {
      "id": "UNREGISTERED",
      "isFinal": false,
      "metadata": null
    },
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
    "SLASHED": {
      "id": "SLASHED",
      "isFinal": false,
      "metadata": null
    },
    "WITHDRAWN": {
      "id": "WITHDRAWN",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "UNREGISTERED",
  "transitions": [
    {
      "from": "UNREGISTERED",
      "to": "REGISTERED",
      "eventName": "register",
      "guard": {
        ">=": [
          {
            "var": "event.stake"
          },
          {
            "var": "state.minStake"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "REGISTERED",
            "address": {
              "var": "event.agent"
            },
            "stake": {
              "var": "event.stake"
            },
            "registeredAt": {
              "var": "$timestamp"
            },
            "reputation": {
              "accuracy": 100,
              "totalResolutions": 0,
              "disputesWon": 0,
              "disputesLost": 0
            },
            "domains": {
              "var": "event.domains"
            },
            "slashingHistory": []
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "REGISTERED",
      "to": "ACTIVE",
      "eventName": "activate",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.address"
              }
            ]
          },
          {
            "var": "event.adminOverride"
          }
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
      "eventName": "add_stake",
      "guard": {
        "and": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.address"
              }
            ]
          },
          {
            ">": [
              {
                "var": "event.amount"
              },
              0
            ]
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "stake": {
              "+": [
                {
                  "var": "state.stake"
                },
                {
                  "var": "event.amount"
                }
              ]
            },
            "lastStakeAt": {
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
      "eventName": "record_resolution",
      "guard": {
        "var": "event.marketId"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "reputation": {
              "merge": [
                {
                  "var": "state.reputation"
                },
                {
                  "totalResolutions": {
                    "+": [
                      {
                        "var": "state.reputation.totalResolutions"
                      },
                      1
                    ]
                  },
                  "accuracy": {
                    "if": [
                      {
                        "var": "event.correct"
                      },
                      {
                        "var": "state.reputation.accuracy"
                      },
                      {
                        "-": [
                          {
                            "var": "state.reputation.accuracy"
                          },
                          5
                        ]
                      }
                    ]
                  }
                }
              ]
            },
            "lastResolutionAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "SLASHED",
      "eventName": "slash",
      "guard": {
        "and": [
          {
            "var": "event.reason"
          },
          {
            ">": [
              {
                "var": "event.amount"
              },
              0
            ]
          },
          {
            "<=": [
              {
                "var": "event.amount"
              },
              {
                "var": "state.stake"
              }
            ]
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "SLASHED",
            "stake": {
              "-": [
                {
                  "var": "state.stake"
                },
                {
                  "var": "event.amount"
                }
              ]
            },
            "slashingHistory": {
              "cat": [
                {
                  "var": "state.slashingHistory"
                },
                [
                  {
                    "reason": {
                      "var": "event.reason"
                    },
                    "amount": {
                      "var": "event.amount"
                    },
                    "marketId": {
                      "var": "event.marketId"
                    },
                    "slashedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "slashedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "SLASHED",
      "to": "ACTIVE",
      "eventName": "reactivate",
      "guard": {
        "and": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.address"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "state.stake"
              },
              {
                "var": "state.minStake"
              }
            ]
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "ACTIVE",
            "reactivatedAt": {
              "var": "$timestamp"
            }
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
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.address"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "WITHDRAWN",
            "withdrawnAt": {
              "var": "$timestamp"
            },
            "finalStake": {
              "var": "state.stake"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "SLASHED",
      "to": "WITHDRAWN",
      "eventName": "withdraw",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.address"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "WITHDRAWN",
            "withdrawnAt": {
              "var": "$timestamp"
            },
            "finalStake": {
              "var": "state.stake"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const identityUniversalDef = {
  "metadata": {
    "name": "IdentityUniversal",
    "description": "Minimal identity state machine - extend for custom use cases",
    "version": "1.0.0"
  },
  "states": {
    "CREATED": {
      "id": "CREATED",
      "isFinal": false,
      "metadata": null
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "INACTIVE": {
      "id": "INACTIVE",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "CREATED",
  "transitions": [
    {
      "from": "CREATED",
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
      "eventName": "update",
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
            "updatedAt": {
              "var": "$timestamp"
            },
            "metadata": {
              "var": "event.metadata"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "INACTIVE",
      "eventName": "deactivate",
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
            "status": "INACTIVE",
            "deactivatedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;