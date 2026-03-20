/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const contractDef = {
  "metadata": {
    "name": "Contract",
    "description": "Agreement between two agents with completion attestation and dispute resolution",
    "version": "1.0.0",
    "crossReferences": {
      "proposerIdentityId": "Links to proposer's AgentIdentity fiber",
      "counterpartyIdentityId": "Links to counterparty's AgentIdentity fiber",
      "escrowId": "Links to Escrow if payment is escrowed",
      "arbitrationPoolId": "Links to ArbitrationPool for dispute resolution"
    }
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": null
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "COMPLETED": {
      "id": "COMPLETED",
      "isFinal": true,
      "metadata": null
    },
    "DISPUTED": {
      "id": "DISPUTED",
      "isFinal": false,
      "metadata": null
    },
    "REJECTED": {
      "id": "REJECTED",
      "isFinal": true,
      "metadata": null
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "PROPOSED",
  "transitions": [
    {
      "from": "PROPOSED",
      "to": "ACTIVE",
      "eventName": "accept",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.counterparty"
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
            "acceptedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PROPOSED",
      "to": "REJECTED",
      "eventName": "reject",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.counterparty"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "REJECTED",
            "rejectedAt": {
              "var": "$timestamp"
            },
            "rejectReason": {
              "var": "event.reason"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PROPOSED",
      "to": "CANCELLED",
      "eventName": "cancel",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.proposer"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "CANCELLED",
            "cancelledAt": {
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
      "eventName": "submit_completion",
      "guard": {
        "and": [
          {
            "or": [
              {
                "===": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "var": "state.proposer"
                  }
                ]
              },
              {
                "===": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "var": "state.counterparty"
                  }
                ]
              }
            ]
          },
          {
            "!": [
              {
                "in": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "map": [
                      {
                        "var": "state.completions"
                      },
                      {
                        "var": "agent"
                      }
                    ]
                  }
                ]
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
            "completions": {
              "cat": [
                {
                  "var": "state.completions"
                },
                [
                  {
                    "agent": {
                      "var": "event.agent"
                    },
                    "proof": {
                      "var": "event.proof"
                    },
                    "submittedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "COMPLETED",
      "eventName": "finalize",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.completions"
            }
          },
          2
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "COMPLETED",
            "completedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DISPUTED",
      "eventName": "dispute",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.proposer"
              }
            ]
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.counterparty"
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
            "status": "DISPUTED",
            "disputedAt": {
              "var": "$timestamp"
            },
            "disputeReason": {
              "var": "event.reason"
            },
            "disputedBy": {
              "var": "event.agent"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DISPUTED",
      "to": "COMPLETED",
      "eventName": "resolve",
      "guard": {
        "or": [
          {
            "var": "event.judicialRuling"
          },
          {
            "and": [
              {
                "===": [
                  {
                    "var": "event.proposerApproves"
                  },
                  true
                ]
              },
              {
                "===": [
                  {
                    "var": "event.counterpartyApproves"
                  },
                  true
                ]
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
            "status": "COMPLETED",
            "resolvedAt": {
              "var": "$timestamp"
            },
            "resolution": {
              "var": "event.resolution"
            },
            "rulingId": {
              "var": "event.rulingId"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const escrowDef = {
  "metadata": {
    "name": "Escrow",
    "description": "Asset custody during multi-party transactions with conditional release",
    "version": "1.0.0",
    "crossReferences": {
      "contractId": "Links to Contract SM that created this escrow",
      "marketId": "Links to Market SM for market-based escrow",
      "insuranceId": "Links to Insurance SM for protected escrow",
      "arbitrationPoolId": "Links to ArbitrationPool for dispute resolution",
      "treasuryId": "Links to Treasury for fee collection"
    }
  },
  "states": {
    "CREATED": {
      "id": "CREATED",
      "isFinal": false,
      "metadata": null
    },
    "FUNDED": {
      "id": "FUNDED",
      "isFinal": false,
      "metadata": null
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "RELEASING": {
      "id": "RELEASING",
      "isFinal": false,
      "metadata": null
    },
    "DISPUTED": {
      "id": "DISPUTED",
      "isFinal": false,
      "metadata": null
    },
    "RELEASED": {
      "id": "RELEASED",
      "isFinal": true,
      "metadata": null
    },
    "REFUNDED": {
      "id": "REFUNDED",
      "isFinal": true,
      "metadata": null
    },
    "SPLIT": {
      "id": "SPLIT",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "CREATED",
  "transitions": [
    {
      "from": "CREATED",
      "to": "FUNDED",
      "eventName": "deposit",
      "guard": {
        "and": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.depositor"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "event.amount"
              },
              {
                "var": "state.requiredAmount"
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
            "balance": {
              "var": "event.amount"
            },
            "fundedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "FUNDED",
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
                "var": "state.beneficiary"
              }
            ]
          },
          {
            "var": "state.autoActivate"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
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
      "to": "RELEASING",
      "eventName": "request_release",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.beneficiary"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "releaseRequest": {
              "requestedBy": {
                "var": "event.agent"
              },
              "amount": {
                "var": "event.amount"
              },
              "reason": {
                "var": "event.reason"
              },
              "requestedAt": {
                "var": "$timestamp"
              }
            },
            "releaseDeadline": {
              "+": [
                {
                  "var": "$timestamp"
                },
                {
                  "var": "state.releaseWindowMs"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RELEASING",
      "to": "RELEASED",
      "eventName": "approve_release",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.depositor"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.releaseDeadline"
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
            "releasedAt": {
              "var": "$timestamp"
            },
            "releasedTo": {
              "var": "state.beneficiary"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RELEASING",
      "to": "DISPUTED",
      "eventName": "dispute",
      "guard": {
        "and": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.depositor"
              }
            ]
          },
          {
            "<": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.releaseDeadline"
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
            "disputedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "spawns": {
        "sm": "Judiciary",
        "initialData": {
          "caseType": "escrow_dispute",
          "plaintiff": {
            "var": "state.depositor"
          },
          "defendant": {
            "var": "state.beneficiary"
          },
          "claim": {
            "escrowId": {
              "var": "fiberId"
            },
            "amount": {
              "var": "state.balance"
            }
          }
        }
      },
      "dependencies": []
    },
    {
      "from": "DISPUTED",
      "to": "SPLIT",
      "eventName": "ruling",
      "guard": {
        "var": "event.judicialRuling"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "splits": {
              "var": "event.splits"
            },
            "rulingId": {
              "var": "event.rulingId"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "REFUNDED",
      "eventName": "refund",
      "guard": {
        "or": [
          {
            "var": "event.mutualConsent"
          },
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.expiresAt"
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
            "refundedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;