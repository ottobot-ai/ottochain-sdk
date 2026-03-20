/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const daoMultisigDef = {
  "metadata": {
    "name": "MultisigDAO",
    "description": "N-of-M multisig governance. Requires threshold signatures for actions.",
    "version": "1.0.0",
    "category": "governance/dao"
  },
  "states": {
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "PENDING": {
      "id": "PENDING",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": [
    {
      "from": "ACTIVE",
      "to": "PENDING",
      "eventName": "propose",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.signers"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "actionType": {
                "var": "event.actionType"
              },
              "payload": {
                "var": "event.payload"
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "expiresAt": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.proposalTTLMs"
                  }
                ]
              }
            },
            "signatures": {
              "setKey": [
                {},
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "PENDING",
      "eventName": "sign",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.signers"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.signatures"
                  },
                  {
                    "var": "event.agent"
                  }
                ]
              }
            ]
          },
          {
            "<": [
              {
                "size": {
                  "var": "state.signatures"
                }
              },
              {
                "var": "state.threshold"
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
            "signatures": {
              "setKey": [
                {
                  "var": "state.signatures"
                },
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "ACTIVE",
      "eventName": "execute",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.signatures"
            }
          },
          {
            "var": "state.threshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "actions": {
              "cat": [
                {
                  "var": "state.actions"
                },
                [
                  {
                    "id": {
                      "var": "state.proposal.id"
                    },
                    "type": {
                      "var": "state.proposal.actionType"
                    },
                    "payload": {
                      "var": "state.proposal.payload"
                    },
                    "signatures": {
                      "var": "state.signatures"
                    },
                    "executedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "proposal": null,
            "signatures": {}
          }
        ]
      },
      "emits": [
        {
          "event": "multisig_executed",
          "to": "external"
        }
      ],
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "ACTIVE",
      "eventName": "cancel",
      "guard": {
        "or": [
          {
            ">": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.expiresAt"
              }
            ]
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.proposal.proposer"
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
            "cancelledProposals": {
              "cat": [
                {
                  "var": "state.cancelledProposals"
                },
                [
                  {
                    "merge": [
                      {
                        "var": "state.proposal"
                      },
                      {
                        "cancelledAt": {
                          "var": "$timestamp"
                        }
                      }
                    ]
                  }
                ]
              ]
            },
            "proposal": null,
            "signatures": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "PENDING",
      "eventName": "propose_add_signer",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.signers"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "actionType": "add_signer",
              "payload": {
                "newSigner": {
                  "var": "event.newSigner"
                }
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "expiresAt": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.proposalTTLMs"
                  }
                ]
              }
            },
            "signatures": {
              "setKey": [
                {},
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "PENDING",
      "eventName": "propose_remove_signer",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.signers"
              }
            ]
          },
          {
            ">": [
              {
                "size": {
                  "var": "state.signers"
                }
              },
              {
                "var": "state.threshold"
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
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "actionType": "remove_signer",
              "payload": {
                "removeSigner": {
                  "var": "event.removeSigner"
                }
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "expiresAt": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.proposalTTLMs"
                  }
                ]
              }
            },
            "signatures": {
              "setKey": [
                {},
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "PENDING",
      "eventName": "propose_change_threshold",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.signers"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "event.newThreshold"
              },
              1
            ]
          },
          {
            "<=": [
              {
                "var": "event.newThreshold"
              },
              {
                "size": {
                  "var": "state.signers"
                }
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
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "actionType": "change_threshold",
              "payload": {
                "newThreshold": {
                  "var": "event.newThreshold"
                }
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "expiresAt": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.proposalTTLMs"
                  }
                ]
              }
            },
            "signatures": {
              "setKey": [
                {},
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "ACTIVE",
      "eventName": "apply_signer_change",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "size": {
                  "var": "state.signatures"
                }
              },
              {
                "var": "state.threshold"
              }
            ]
          },
          {
            "in": [
              {
                "var": "state.proposal.actionType"
              },
              [
                "add_signer",
                "remove_signer",
                "change_threshold"
              ]
            ]
          }
        ]
      },
      "effect": {
        "if": [
          {
            "===": [
              {
                "var": "state.proposal.actionType"
              },
              "add_signer"
            ]
          },
          {
            "merge": [
              {
                "var": "state"
              },
              {
                "signers": {
                  "cat": [
                    {
                      "var": "state.signers"
                    },
                    [
                      {
                        "var": "state.proposal.payload.newSigner"
                      }
                    ]
                  ]
                },
                "proposal": null,
                "signatures": {}
              }
            ]
          },
          {
            "===": [
              {
                "var": "state.proposal.actionType"
              },
              "remove_signer"
            ]
          },
          {
            "merge": [
              {
                "var": "state"
              },
              {
                "signers": {
                  "filter": [
                    {
                      "var": "state.signers"
                    },
                    {
                      "!==": [
                        {
                          "var": ""
                        },
                        {
                          "var": "state.proposal.payload.removeSigner"
                        }
                      ]
                    }
                  ]
                },
                "proposal": null,
                "signatures": {}
              }
            ]
          },
          {
            "merge": [
              {
                "var": "state"
              },
              {
                "threshold": {
                  "var": "state.proposal.payload.newThreshold"
                },
                "proposal": null,
                "signatures": {}
              }
            ]
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DISSOLVED",
      "eventName": "dissolve",
      "guard": {
        "===": [
          {
            "var": "event.signatureCount"
          },
          {
            "size": {
              "var": "state.signers"
            }
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "dissolvedAt": {
              "var": "$timestamp"
            },
            "status": "DISSOLVED"
          }
        ]
      },
      "dependencies": []
    }
  ],
  "crossReferences": {
    "Identity": "signer verification",
    "Contract": "action execution targets",
    "Treasury": "fund management",
    "Escrow": "controlled release"
  }
} as const;

export const daoSingleDef = {
  "metadata": {
    "name": "SingleOwnerDAO",
    "description": "Single owner controls all actions. Simplest governance model.",
    "version": "1.0.0",
    "category": "governance/dao"
  },
  "states": {
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "TRANSFERRING": {
      "id": "TRANSFERRING",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": [
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "execute",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.owner"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "actions": {
              "cat": [
                {
                  "var": "state.actions"
                },
                [
                  {
                    "id": {
                      "var": "event.actionId"
                    },
                    "type": {
                      "var": "event.actionType"
                    },
                    "payload": {
                      "var": "event.payload"
                    },
                    "executedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            }
          }
        ]
      },
      "emits": [
        {
          "event": "action_executed",
          "to": "external"
        }
      ],
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "TRANSFERRING",
      "eventName": "transfer_ownership",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.owner"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "pendingOwner": {
              "var": "event.newOwner"
            },
            "transferInitiatedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "TRANSFERRING",
      "to": "ACTIVE",
      "eventName": "accept_ownership",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.pendingOwner"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "owner": {
              "var": "state.pendingOwner"
            },
            "pendingOwner": null,
            "transferInitiatedAt": null,
            "ownershipHistory": {
              "cat": [
                {
                  "var": "state.ownershipHistory"
                },
                [
                  {
                    "from": {
                      "var": "state.owner"
                    },
                    "to": {
                      "var": "state.pendingOwner"
                    },
                    "at": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            }
          }
        ]
      },
      "emits": [
        {
          "event": "ownership_transferred",
          "to": "Identity"
        }
      ],
      "dependencies": []
    },
    {
      "from": "TRANSFERRING",
      "to": "ACTIVE",
      "eventName": "cancel_transfer",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.owner"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "pendingOwner": null,
            "transferInitiatedAt": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DISSOLVED",
      "eventName": "dissolve",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.owner"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "dissolvedAt": {
              "var": "$timestamp"
            },
            "status": "DISSOLVED"
          }
        ]
      },
      "dependencies": []
    }
  ],
  "crossReferences": {
    "Identity": "owner registration",
    "Contract": "action execution targets",
    "Treasury": "fund management"
  }
} as const;

export const daoThresholdDef = {
  "metadata": {
    "name": "ThresholdDAO",
    "description": "Reputation-threshold governance. Minimum reputation required for participation.",
    "version": "1.0.0",
    "category": "governance/dao"
  },
  "states": {
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "VOTING": {
      "id": "VOTING",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": [
    {
      "from": "ACTIVE",
      "to": "VOTING",
      "eventName": "propose",
      "guard": {
        ">=": [
          {
            "var": "event.agentReputation"
          },
          {
            "var": "state.proposeThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "title": {
                "var": "event.title"
              },
              "description": {
                "var": "event.description"
              },
              "actionType": {
                "var": "event.actionType"
              },
              "payload": {
                "var": "event.payload"
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "deadline": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.votingPeriodMs"
                  }
                ]
              }
            },
            "votes": {
              "for": [],
              "against": [],
              "abstain": []
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "VOTING",
      "eventName": "vote",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "event.agentReputation"
              },
              {
                "var": "state.voteThreshold"
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
                    "var": "state.votes.for"
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
                    "var": "state.votes.against"
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
                    "var": "state.votes.abstain"
                  }
                ]
              }
            ]
          },
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.deadline"
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
            "votes": {
              "if": [
                {
                  "===": [
                    {
                      "var": "event.vote"
                    },
                    "for"
                  ]
                },
                {
                  "merge": [
                    {
                      "var": "state.votes"
                    },
                    {
                      "for": {
                        "cat": [
                          {
                            "var": "state.votes.for"
                          },
                          [
                            {
                              "var": "event.agent"
                            }
                          ]
                        ]
                      }
                    }
                  ]
                },
                {
                  "===": [
                    {
                      "var": "event.vote"
                    },
                    "against"
                  ]
                },
                {
                  "merge": [
                    {
                      "var": "state.votes"
                    },
                    {
                      "against": {
                        "cat": [
                          {
                            "var": "state.votes.against"
                          },
                          [
                            {
                              "var": "event.agent"
                            }
                          ]
                        ]
                      }
                    }
                  ]
                },
                {
                  "merge": [
                    {
                      "var": "state.votes"
                    },
                    {
                      "abstain": {
                        "cat": [
                          {
                            "var": "state.votes.abstain"
                          },
                          [
                            {
                              "var": "event.agent"
                            }
                          ]
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "ACTIVE",
      "eventName": "execute",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.deadline"
              }
            ]
          },
          {
            ">": [
              {
                "size": {
                  "var": "state.votes.for"
                }
              },
              {
                "size": {
                  "var": "state.votes.against"
                }
              }
            ]
          },
          {
            ">=": [
              {
                "+": [
                  {
                    "size": {
                      "var": "state.votes.for"
                    }
                  },
                  {
                    "size": {
                      "var": "state.votes.against"
                    }
                  }
                ]
              },
              {
                "var": "state.quorum"
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
            "history": {
              "cat": [
                {
                  "var": "state.history"
                },
                [
                  {
                    "type": "executed",
                    "proposal": {
                      "var": "state.proposal"
                    },
                    "votes": {
                      "var": "state.votes"
                    },
                    "at": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": null
          }
        ]
      },
      "emits": [
        {
          "event": "proposal_executed",
          "to": "Reputation",
          "payload": {
            "action": "increase",
            "agents": {
              "var": "state.votes.for"
            }
          }
        }
      ],
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "ACTIVE",
      "eventName": "reject",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.deadline"
              }
            ]
          },
          {
            "or": [
              {
                "<=": [
                  {
                    "size": {
                      "var": "state.votes.for"
                    }
                  },
                  {
                    "size": {
                      "var": "state.votes.against"
                    }
                  }
                ]
              },
              {
                "<": [
                  {
                    "+": [
                      {
                        "size": {
                          "var": "state.votes.for"
                        }
                      },
                      {
                        "size": {
                          "var": "state.votes.against"
                        }
                      }
                    ]
                  },
                  {
                    "var": "state.quorum"
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
            "history": {
              "cat": [
                {
                  "var": "state.history"
                },
                [
                  {
                    "type": "rejected",
                    "proposal": {
                      "var": "state.proposal"
                    },
                    "votes": {
                      "var": "state.votes"
                    },
                    "at": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "join",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "event.agentReputation"
              },
              {
                "var": "state.memberThreshold"
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
                    "var": "state.members"
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
            "members": {
              "cat": [
                {
                  "var": "state.members"
                },
                [
                  {
                    "var": "event.agent"
                  }
                ]
              ]
            },
            "memberJoinedAt": {
              "setKey": [
                {
                  "var": "state.memberJoinedAt"
                },
                {
                  "var": "event.agent"
                },
                {
                  "var": "$timestamp"
                }
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
      "eventName": "leave",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.members"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "members": {
              "filter": [
                {
                  "var": "state.members"
                },
                {
                  "!==": [
                    {
                      "var": ""
                    },
                    {
                      "var": "event.agent"
                    }
                  ]
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "VOTING",
      "eventName": "propose_threshold_change",
      "guard": {
        ">=": [
          {
            "var": "event.agentReputation"
          },
          {
            "var": "state.proposeThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "title": "Threshold Change",
              "actionType": "threshold_change",
              "payload": {
                "memberThreshold": {
                  "var": "event.memberThreshold"
                },
                "voteThreshold": {
                  "var": "event.voteThreshold"
                },
                "proposeThreshold": {
                  "var": "event.proposeThreshold"
                }
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "deadline": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.votingPeriodMs"
                  }
                ]
              }
            },
            "votes": {
              "for": [],
              "against": [],
              "abstain": []
            }
          }
        ]
      },
      "dependencies": []
    }
  ],
  "crossReferences": {
    "Identity": "member verification",
    "Reputation": "threshold checks",
    "Contract": "action execution"
  }
} as const;

export const daoTokenDef = {
  "metadata": {
    "name": "TokenDAO",
    "description": "Token-weighted voting. Voting power proportional to token holdings.",
    "version": "1.0.0",
    "category": "governance/dao"
  },
  "states": {
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "VOTING": {
      "id": "VOTING",
      "isFinal": false,
      "metadata": null
    },
    "QUEUED": {
      "id": "QUEUED",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": [
    {
      "from": "ACTIVE",
      "to": "VOTING",
      "eventName": "propose",
      "guard": {
        ">=": [
          {
            "getKey": [
              {
                "var": "state.balances"
              },
              {
                "var": "event.agent"
              }
            ]
          },
          {
            "var": "state.proposalThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "title": {
                "var": "event.title"
              },
              "description": {
                "var": "event.description"
              },
              "actionType": {
                "var": "event.actionType"
              },
              "payload": {
                "var": "event.payload"
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "votingEndsAt": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.votingPeriodMs"
                  }
                ]
              },
              "snapshotBlock": {
                "var": "event.snapshotBlock"
              }
            },
            "votes": {
              "for": 0,
              "against": 0,
              "abstain": 0,
              "voters": {}
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "VOTING",
      "eventName": "vote",
      "guard": {
        "and": [
          {
            ">": [
              {
                "getKey": [
                  {
                    "var": "state.balances"
                  },
                  {
                    "var": "event.agent"
                  }
                ]
              },
              0
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes.voters"
                  },
                  {
                    "var": "event.agent"
                  }
                ]
              }
            ]
          },
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.votingEndsAt"
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
            "votes": {
              "merge": [
                {
                  "var": "state.votes"
                },
                {
                  "if": [
                    {
                      "===": [
                        {
                          "var": "event.vote"
                        },
                        "for"
                      ]
                    },
                    {
                      "for": {
                        "+": [
                          {
                            "var": "state.votes.for"
                          },
                          {
                            "getKey": [
                              {
                                "var": "state.balances"
                              },
                              {
                                "var": "event.agent"
                              }
                            ]
                          }
                        ]
                      }
                    },
                    {
                      "===": [
                        {
                          "var": "event.vote"
                        },
                        "against"
                      ]
                    },
                    {
                      "against": {
                        "+": [
                          {
                            "var": "state.votes.against"
                          },
                          {
                            "getKey": [
                              {
                                "var": "state.balances"
                              },
                              {
                                "var": "event.agent"
                              }
                            ]
                          }
                        ]
                      }
                    },
                    {
                      "abstain": {
                        "+": [
                          {
                            "var": "state.votes.abstain"
                          },
                          {
                            "getKey": [
                              {
                                "var": "state.balances"
                              },
                              {
                                "var": "event.agent"
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                },
                {
                  "voters": {
                    "setKey": [
                      {
                        "var": "state.votes.voters"
                      },
                      {
                        "var": "event.agent"
                      },
                      {
                        "vote": {
                          "var": "event.vote"
                        },
                        "weight": {
                          "getKey": [
                            {
                              "var": "state.balances"
                            },
                            {
                              "var": "event.agent"
                            }
                          ]
                        },
                        "votedAt": {
                          "var": "$timestamp"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "QUEUED",
      "eventName": "queue",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.votingEndsAt"
              }
            ]
          },
          {
            ">": [
              {
                "var": "state.votes.for"
              },
              {
                "var": "state.votes.against"
              }
            ]
          },
          {
            ">=": [
              {
                "+": [
                  {
                    "var": "state.votes.for"
                  },
                  {
                    "var": "state.votes.against"
                  },
                  {
                    "var": "state.votes.abstain"
                  }
                ]
              },
              {
                "var": "state.quorum"
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
            "proposal": {
              "merge": [
                {
                  "var": "state.proposal"
                },
                {
                  "queuedAt": {
                    "var": "$timestamp"
                  },
                  "executableAt": {
                    "+": [
                      {
                        "var": "$timestamp"
                      },
                      {
                        "var": "state.timelockMs"
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "QUEUED",
      "to": "ACTIVE",
      "eventName": "execute",
      "guard": {
        ">=": [
          {
            "var": "$timestamp"
          },
          {
            "var": "state.proposal.executableAt"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "executedProposals": {
              "cat": [
                {
                  "var": "state.executedProposals"
                },
                [
                  {
                    "merge": [
                      {
                        "var": "state.proposal"
                      },
                      {
                        "votes": {
                          "var": "state.votes"
                        },
                        "executedAt": {
                          "var": "$timestamp"
                        }
                      }
                    ]
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": null
          }
        ]
      },
      "emits": [
        {
          "event": "proposal_executed",
          "to": "external"
        }
      ],
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "ACTIVE",
      "eventName": "reject",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.proposal.votingEndsAt"
              }
            ]
          },
          {
            "or": [
              {
                "<=": [
                  {
                    "var": "state.votes.for"
                  },
                  {
                    "var": "state.votes.against"
                  }
                ]
              },
              {
                "<": [
                  {
                    "+": [
                      {
                        "var": "state.votes.for"
                      },
                      {
                        "var": "state.votes.against"
                      },
                      {
                        "var": "state.votes.abstain"
                      }
                    ]
                  },
                  {
                    "var": "state.quorum"
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
            "rejectedProposals": {
              "cat": [
                {
                  "var": "state.rejectedProposals"
                },
                [
                  {
                    "merge": [
                      {
                        "var": "state.proposal"
                      },
                      {
                        "votes": {
                          "var": "state.votes"
                        },
                        "rejectedAt": {
                          "var": "$timestamp"
                        }
                      }
                    ]
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "QUEUED",
      "to": "ACTIVE",
      "eventName": "cancel",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.proposal.proposer"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "cancelledProposals": {
              "cat": [
                {
                  "var": "state.cancelledProposals"
                },
                [
                  {
                    "merge": [
                      {
                        "var": "state.proposal"
                      },
                      {
                        "cancelledAt": {
                          "var": "$timestamp"
                        }
                      }
                    ]
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "delegate",
      "guard": {
        ">": [
          {
            "getKey": [
              {
                "var": "state.balances"
              },
              {
                "var": "event.agent"
              }
            ]
          },
          0
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "delegations": {
              "setKey": [
                {
                  "var": "state.delegations"
                },
                {
                  "var": "event.agent"
                },
                {
                  "var": "event.delegateTo"
                }
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
      "eventName": "undelegate",
      "guard": {
        "getKey": [
          {
            "var": "state.delegations"
          },
          {
            "var": "event.agent"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "delegations": {
              "deleteKey": [
                {
                  "var": "state.delegations"
                },
                {
                  "var": "event.agent"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    }
  ],
  "crossReferences": {
    "Identity": "voter verification",
    "Token": "balance snapshots",
    "Contract": "action execution",
    "Treasury": "fund management"
  }
} as const;

export const govConstitutionDef = {
  "metadata": {
    "name": "Constitution",
    "description": "Foundational charter that defines governance structure, branch powers, and amendment rules",
    "version": "1.0.0"
  },
  "states": {
    "DRAFT": {
      "id": "DRAFT",
      "isFinal": false,
      "metadata": null
    },
    "RATIFIED": {
      "id": "RATIFIED",
      "isFinal": false,
      "metadata": null
    },
    "AMENDING": {
      "id": "AMENDING",
      "isFinal": false,
      "metadata": null
    },
    "SUSPENDED": {
      "id": "SUSPENDED",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "DRAFT",
  "transitions": [
    {
      "from": "DRAFT",
      "to": "RATIFIED",
      "eventName": "ratify",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.ratifications"
            }
          },
          {
            "var": "state.ratificationThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RATIFIED",
            "ratifiedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DRAFT",
      "to": "DRAFT",
      "eventName": "sign",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.founders"
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
                    "var": "state.ratifications"
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
            "ratifications": {
              "cat": [
                {
                  "var": "state.ratifications"
                },
                [
                  {
                    "var": "event.agent"
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
      "from": "RATIFIED",
      "to": "AMENDING",
      "eventName": "propose_amendment",
      "guard": {
        "or": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.branches.legislature.members"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "event.petitionSignatures"
              },
              {
                "var": "state.amendmentPetitionThreshold"
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
            "status": "AMENDING",
            "pendingAmendment": {
              "id": {
                "var": "event.amendmentId"
              },
              "proposer": {
                "var": "event.agent"
              },
              "changes": {
                "var": "event.changes"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "votes": {}
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "AMENDING",
      "to": "RATIFIED",
      "eventName": "ratify_amendment",
      "guard": {
        ">=": [
          {
            "var": "state.pendingAmendment.approvalCount"
          },
          {
            "var": "state.amendmentThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RATIFIED",
            "amendments": {
              "cat": [
                {
                  "var": "state.amendments"
                },
                [
                  {
                    "id": {
                      "var": "state.pendingAmendment.id"
                    },
                    "changes": {
                      "var": "state.pendingAmendment.changes"
                    },
                    "ratifiedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "pendingAmendment": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "AMENDING",
      "to": "RATIFIED",
      "eventName": "reject_amendment",
      "guard": {
        "var": "state.pendingAmendment.rejected"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RATIFIED",
            "failedAmendments": {
              "cat": [
                {
                  "var": "state.failedAmendments"
                },
                [
                  {
                    "var": "state.pendingAmendment"
                  }
                ]
              ]
            },
            "pendingAmendment": null
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RATIFIED",
      "to": "SUSPENDED",
      "eventName": "suspend",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.emergencyCouncil"
              }
            ]
          },
          {
            "var": "event.reason"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "SUSPENDED",
            "suspendedBy": {
              "var": "event.agent"
            },
            "suspensionReason": {
              "var": "event.reason"
            },
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
      "to": "RATIFIED",
      "eventName": "restore",
      "guard": {
        ">=": [
          {
            "var": "event.restorationVotes"
          },
          {
            "var": "state.restorationThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RATIFIED",
            "restoredAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RATIFIED",
      "to": "DISSOLVED",
      "eventName": "dissolve",
      "guard": {
        ">=": [
          {
            "var": "event.dissolutionVotes"
          },
          {
            "var": "state.dissolutionThreshold"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "DISSOLVED",
            "dissolvedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const govExecutiveDef = {
  "metadata": {
    "name": "Executive",
    "description": "Execution branch - implements mandates, manages operations, reports outcomes",
    "version": "1.0.0"
  },
  "states": {
    "RECEIVED": {
      "id": "RECEIVED",
      "isFinal": false,
      "metadata": null
    },
    "PLANNING": {
      "id": "PLANNING",
      "isFinal": false,
      "metadata": null
    },
    "EXECUTING": {
      "id": "EXECUTING",
      "isFinal": false,
      "metadata": null
    },
    "PAUSED": {
      "id": "PAUSED",
      "isFinal": false,
      "metadata": null
    },
    "COMPLETED": {
      "id": "COMPLETED",
      "isFinal": true,
      "metadata": null
    },
    "FAILED": {
      "id": "FAILED",
      "isFinal": true,
      "metadata": null
    },
    "BLOCKED": {
      "id": "BLOCKED",
      "isFinal": true,
      "metadata": null
    },
    "VETOED": {
      "id": "VETOED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "RECEIVED",
  "transitions": [
    {
      "from": "RECEIVED",
      "to": "PLANNING",
      "eventName": "accept",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "PLANNING",
            "acceptedBy": {
              "var": "event.agent"
            },
            "acceptedAt": {
              "var": "$timestamp"
            },
            "plan": {
              "var": "event.plan"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RECEIVED",
      "to": "VETOED",
      "eventName": "veto",
      "guard": {
        "and": [
          {
            "var": "state.config.executiveVeto"
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.executiveHead"
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
            "status": "VETOED",
            "vetoedBy": {
              "var": "event.agent"
            },
            "vetoReason": {
              "var": "event.reason"
            },
            "vetoedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PLANNING",
      "to": "EXECUTING",
      "eventName": "begin",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "EXECUTING",
            "executionStartedAt": {
              "var": "$timestamp"
            },
            "milestones": []
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "EXECUTING",
      "to": "EXECUTING",
      "eventName": "report_progress",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "milestones": {
              "cat": [
                {
                  "var": "state.milestones"
                },
                [
                  {
                    "description": {
                      "var": "event.description"
                    },
                    "completedAt": {
                      "var": "$timestamp"
                    },
                    "evidence": {
                      "var": "event.evidence"
                    }
                  }
                ]
              ]
            },
            "lastProgressAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "EXECUTING",
      "to": "PAUSED",
      "eventName": "pause",
      "guard": {
        "or": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.executors"
              }
            ]
          },
          {
            "var": "event.judicialOrder"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "PAUSED",
            "pausedBy": {
              "var": "event.agent"
            },
            "pauseReason": {
              "var": "event.reason"
            },
            "pausedAt": {
              "var": "$timestamp"
            },
            "judicialHold": {
              "var": "event.judicialOrder"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PAUSED",
      "to": "EXECUTING",
      "eventName": "resume",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.executors"
              }
            ]
          },
          {
            "!": [
              {
                "var": "state.judicialHold"
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
            "status": "EXECUTING",
            "resumedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PAUSED",
      "to": "BLOCKED",
      "eventName": "block",
      "guard": {
        "var": "event.judicialRuling"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "BLOCKED",
            "blockedBy": {
              "var": "event.agent"
            },
            "rulingId": {
              "var": "event.rulingId"
            },
            "blockedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "EXECUTING",
      "to": "COMPLETED",
      "eventName": "complete",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
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
            "completedAt": {
              "var": "$timestamp"
            },
            "outcome": {
              "var": "event.outcome"
            },
            "finalReport": {
              "var": "event.report"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "EXECUTING",
      "to": "FAILED",
      "eventName": "fail",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "FAILED",
            "failedAt": {
              "var": "$timestamp"
            },
            "failureReason": {
              "var": "event.reason"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const govJudiciaryDef = {
  "metadata": {
    "name": "Judiciary",
    "description": "Judicial branch - interprets rules, reviews actions, resolves disputes, issues rulings",
    "version": "1.0.0"
  },
  "states": {
    "FILED": {
      "id": "FILED",
      "isFinal": false,
      "metadata": null
    },
    "REVIEW": {
      "id": "REVIEW",
      "isFinal": false,
      "metadata": null
    },
    "HEARING": {
      "id": "HEARING",
      "isFinal": false,
      "metadata": null
    },
    "DELIBERATION": {
      "id": "DELIBERATION",
      "isFinal": false,
      "metadata": null
    },
    "RULING": {
      "id": "RULING",
      "isFinal": false,
      "metadata": null
    },
    "ENFORCING": {
      "id": "ENFORCING",
      "isFinal": false,
      "metadata": null
    },
    "CLOSED": {
      "id": "CLOSED",
      "isFinal": true,
      "metadata": null
    },
    "DISMISSED": {
      "id": "DISMISSED",
      "isFinal": true,
      "metadata": null
    },
    "APPEALED": {
      "id": "APPEALED",
      "isFinal": false,
      "metadata": null
    }
  },
  "initialState": "FILED",
  "transitions": [
    {
      "from": "FILED",
      "to": "REVIEW",
      "eventName": "accept",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.judges"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "REVIEW",
            "acceptedBy": {
              "var": "event.agent"
            },
            "acceptedAt": {
              "var": "$timestamp"
            },
            "assignedJudges": {
              "var": "event.panel"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "FILED",
      "to": "DISMISSED",
      "eventName": "dismiss",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.judges"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "DISMISSED",
            "dismissedBy": {
              "var": "event.agent"
            },
            "dismissReason": {
              "var": "event.reason"
            },
            "dismissedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "REVIEW",
      "to": "REVIEW",
      "eventName": "issue_stay",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.assignedJudges"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "emergencyStay": {
              "issuedBy": {
                "var": "event.agent"
              },
              "issuedAt": {
                "var": "$timestamp"
              },
              "targetFiberId": {
                "var": "event.targetFiberId"
              },
              "reason": {
                "var": "event.reason"
              },
              "expiresAt": {
                "var": "event.expiresAt"
              }
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "REVIEW",
      "to": "HEARING",
      "eventName": "schedule_hearing",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.assignedJudges"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "HEARING",
            "hearingScheduledAt": {
              "var": "event.hearingDate"
            },
            "submissions": []
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "HEARING",
      "to": "HEARING",
      "eventName": "submit_evidence",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.plaintiff"
              }
            ]
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.defendant"
              }
            ]
          },
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.interestedParties"
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
            "submissions": {
              "cat": [
                {
                  "var": "state.submissions"
                },
                [
                  {
                    "party": {
                      "var": "event.agent"
                    },
                    "type": {
                      "var": "event.type"
                    },
                    "content": {
                      "var": "event.content"
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
      "from": "HEARING",
      "to": "DELIBERATION",
      "eventName": "close_hearing",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.assignedJudges"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "DELIBERATION",
            "hearingClosedAt": {
              "var": "$timestamp"
            },
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DELIBERATION",
      "to": "DELIBERATION",
      "eventName": "vote",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.assignedJudges"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes"
                  },
                  {
                    "var": "event.agent"
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
            "votes": {
              "setKey": [
                {
                  "var": "state.votes"
                },
                {
                  "var": "event.agent"
                },
                {
                  "position": {
                    "var": "event.position"
                  },
                  "opinion": {
                    "var": "event.opinion"
                  },
                  "votedAt": {
                    "var": "$timestamp"
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DELIBERATION",
      "to": "RULING",
      "eventName": "issue_ruling",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.votes"
            }
          },
          {
            "var": "state.quorum"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RULING",
            "ruling": {
              "decision": {
                "var": "event.decision"
              },
              "majority": {
                "var": "event.majority"
              },
              "dissent": {
                "var": "event.dissent"
              },
              "remedy": {
                "var": "event.remedy"
              },
              "issuedAt": {
                "var": "$timestamp"
              }
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RULING",
      "to": "ENFORCING",
      "eventName": "begin_enforcement",
      "guard": {
        "var": "state.ruling.remedy"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "ENFORCING",
            "enforcementStartedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RULING",
      "to": "CLOSED",
      "eventName": "close",
      "guard": {
        "!": [
          {
            "var": "state.ruling.remedy"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "CLOSED",
            "closedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ENFORCING",
      "to": "CLOSED",
      "eventName": "enforcement_complete",
      "guard": {
        "var": "event.evidence"
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "CLOSED",
            "enforcementCompletedAt": {
              "var": "$timestamp"
            },
            "enforcementEvidence": {
              "var": "event.evidence"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RULING",
      "to": "APPEALED",
      "eventName": "appeal",
      "guard": {
        "and": [
          {
            "var": "state.config.allowAppeals"
          },
          {
            "or": [
              {
                "===": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "var": "state.plaintiff"
                  }
                ]
              },
              {
                "===": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "var": "state.defendant"
                  }
                ]
              }
            ]
          },
          {
            "<=": [
              {
                "-": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.ruling.issuedAt"
                  }
                ]
              },
              {
                "var": "state.config.appealWindowMs"
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
            "status": "APPEALED",
            "appeal": {
              "filedBy": {
                "var": "event.agent"
              },
              "grounds": {
                "var": "event.grounds"
              },
              "filedAt": {
                "var": "$timestamp"
              }
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const govLegislatureDef = {
  "metadata": {
    "name": "Governance",
    "description": "Flexible governance for proposals, voting, delegation, and execution across relationship types",
    "version": "1.0.0"
  },
  "states": {
    "DRAFT": {
      "id": "DRAFT",
      "isFinal": false,
      "metadata": null
    },
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "PENDING": {
      "id": "PENDING",
      "isFinal": false,
      "metadata": null
    },
    "EXECUTING": {
      "id": "EXECUTING",
      "isFinal": false,
      "metadata": null
    },
    "EXECUTED": {
      "id": "EXECUTED",
      "isFinal": true,
      "metadata": null
    },
    "VETOED": {
      "id": "VETOED",
      "isFinal": true,
      "metadata": null
    },
    "DEFEATED": {
      "id": "DEFEATED",
      "isFinal": true,
      "metadata": null
    },
    "EXPIRED": {
      "id": "EXPIRED",
      "isFinal": true,
      "metadata": null
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "DRAFT",
  "transitions": [
    {
      "from": "DRAFT",
      "to": "ACTIVE",
      "eventName": "submit",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.proposers"
              }
            ]
          },
          {
            "var": "state.proposal.title"
          },
          {
            "var": "state.proposal.actions"
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
            "submittedAt": {
              "var": "$timestamp"
            },
            "votingEndsAt": {
              "+": [
                {
                  "var": "$timestamp"
                },
                {
                  "var": "state.config.votingPeriodMs"
                }
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
      "eventName": "vote",
      "guard": {
        "and": [
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.votingEndsAt"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes"
                  },
                  {
                    "var": "event.agent"
                  }
                ]
              }
            ]
          },
          {
            "or": [
              {
                "in": [
                  {
                    "var": "event.agent"
                  },
                  {
                    "var": "state.voters"
                  }
                ]
              },
              {
                "===": [
                  {
                    "var": "state.config.openVoting"
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
            "votes": {
              "setKey": [
                {
                  "var": "state.votes"
                },
                {
                  "var": "event.agent"
                },
                {
                  "choice": {
                    "var": "event.choice"
                  },
                  "weight": {
                    "var": "event.weight"
                  },
                  "conviction": {
                    "var": "event.conviction"
                  },
                  "delegatedFrom": {
                    "var": "event.delegatedFrom"
                  },
                  "votedAt": {
                    "var": "$timestamp"
                  }
                }
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
      "eventName": "delegate",
      "guard": {
        "and": [
          {
            "var": "state.config.allowDelegation"
          },
          {
            "!==": [
              {
                "var": "event.agent"
              },
              {
                "var": "event.delegateTo"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes"
                  },
                  {
                    "var": "event.agent"
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
            "delegations": {
              "setKey": [
                {
                  "var": "state.delegations"
                },
                {
                  "var": "event.agent"
                },
                {
                  "delegateTo": {
                    "var": "event.delegateTo"
                  },
                  "weight": {
                    "var": "event.weight"
                  },
                  "delegatedAt": {
                    "var": "$timestamp"
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "PENDING",
      "eventName": "finalize_voting",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.votingEndsAt"
              }
            ]
          },
          {
            "var": "state.tally.passed"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "PENDING",
            "finalizedAt": {
              "var": "$timestamp"
            },
            "vetoEndsAt": {
              "+": [
                {
                  "var": "$timestamp"
                },
                {
                  "var": "state.config.vetoPeriodMs"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DEFEATED",
      "eventName": "finalize_voting",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.votingEndsAt"
              }
            ]
          },
          {
            "!": [
              {
                "var": "state.tally.passed"
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
            "status": "DEFEATED",
            "finalizedAt": {
              "var": "$timestamp"
            },
            "defeatReason": {
              "var": "state.tally.reason"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "VETOED",
      "eventName": "veto",
      "guard": {
        "and": [
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.vetoEndsAt"
              }
            ]
          },
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.vetoers"
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
            "status": "VETOED",
            "vetoedBy": {
              "var": "event.agent"
            },
            "vetoReason": {
              "var": "event.reason"
            },
            "vetoedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PENDING",
      "to": "EXECUTING",
      "eventName": "execute",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.vetoEndsAt"
              }
            ]
          },
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.executors"
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
            "status": "EXECUTING",
            "executedBy": {
              "var": "event.agent"
            },
            "executionStartedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "EXECUTING",
      "to": "EXECUTED",
      "eventName": "complete",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.executors"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "EXECUTED",
            "completedAt": {
              "var": "$timestamp"
            },
            "executionProof": {
              "var": "event.proof"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DRAFT",
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
      "to": "CANCELLED",
      "eventName": "cancel",
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
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.admins"
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
            "status": "CANCELLED",
            "cancelledBy": {
              "var": "event.agent"
            },
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
      "to": "EXPIRED",
      "eventName": "expire",
      "guard": {
        ">": [
          {
            "var": "$timestamp"
          },
          {
            "+": [
              {
                "var": "state.votingEndsAt"
              },
              {
                "var": "state.config.gracePeriodMs"
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
            "status": "EXPIRED",
            "expiredAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ],
  "presets": {
    "_comment": "Common governance configurations",
    "bilateral": {
      "description": "Two-party mutual consent (like a contract)",
      "config": {
        "votingMechanism": "simple",
        "quorumType": "absolute",
        "quorumValue": 2,
        "passingThreshold": 1,
        "allowDelegation": false,
        "openVoting": false
      }
    },
    "multisig": {
      "description": "N-of-M threshold signing",
      "config": {
        "votingMechanism": "simple",
        "quorumType": "absolute",
        "passingThreshold": 0.6,
        "vetoPeriodMs": 0,
        "allowDelegation": false
      }
    },
    "council": {
      "description": "Small elected/appointed body",
      "config": {
        "votingMechanism": "simple",
        "quorumType": "percentage",
        "quorumValue": 0.5,
        "passingThreshold": 0.5,
        "openVoting": false,
        "allowDelegation": true
      }
    },
    "liquid_democracy": {
      "description": "Delegatable voting power",
      "config": {
        "votingMechanism": "simple",
        "allowDelegation": true,
        "openVoting": true,
        "onePersonOneVote": true
      }
    },
    "conviction": {
      "description": "Time-weighted conviction voting",
      "config": {
        "votingMechanism": "conviction",
        "allowDelegation": true,
        "convictionHalfLifeMs": 604800000
      }
    },
    "quadratic": {
      "description": "Quadratic voting to reduce whale power",
      "config": {
        "votingMechanism": "quadratic",
        "onePersonOneVote": false
      }
    },
    "dictator": {
      "description": "Single admin with full control",
      "config": {
        "votingMechanism": "simple",
        "quorumType": "absolute",
        "quorumValue": 1,
        "passingThreshold": 1,
        "vetoPeriodMs": 0,
        "allowDelegation": false
      }
    }
  }
} as const;

export const govSimpleDef = {
  "metadata": {
    "name": "Governance",
    "description": "Simple org governance: manage members, update rules, resolve disputes",
    "version": "1.0.0"
  },
  "states": {
    "ACTIVE": {
      "id": "ACTIVE",
      "isFinal": false,
      "metadata": null
    },
    "VOTING": {
      "id": "VOTING",
      "isFinal": false,
      "metadata": null
    },
    "DISPUTE": {
      "id": "DISPUTE",
      "isFinal": false,
      "metadata": null
    },
    "DISSOLVED": {
      "id": "DISSOLVED",
      "isFinal": true,
      "metadata": null
    }
  },
  "initialState": "ACTIVE",
  "transitions": [
    {
      "from": "ACTIVE",
      "to": "ACTIVE",
      "eventName": "add_member",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.admins"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "members": {
              "setKey": [
                {
                  "var": "state.members"
                },
                {
                  "var": "event.member"
                },
                {
                  "role": {
                    "var": "event.role"
                  },
                  "addedAt": {
                    "var": "$timestamp"
                  }
                }
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
      "eventName": "remove_member",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.admins"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "members": {
              "deleteKey": [
                {
                  "var": "state.members"
                },
                {
                  "var": "event.member"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "VOTING",
      "eventName": "propose",
      "guard": {
        "getKey": [
          {
            "var": "state.members"
          },
          {
            "var": "event.agent"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "proposal": {
              "id": {
                "var": "event.proposalId"
              },
              "type": {
                "var": "event.type"
              },
              "changes": {
                "var": "event.changes"
              },
              "proposer": {
                "var": "event.agent"
              },
              "proposedAt": {
                "var": "$timestamp"
              },
              "deadline": {
                "+": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.votingPeriodMs"
                  }
                ]
              }
            },
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "VOTING",
      "eventName": "vote",
      "guard": {
        "and": [
          {
            "getKey": [
              {
                "var": "state.members"
              },
              {
                "var": "event.agent"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes"
                  },
                  {
                    "var": "event.agent"
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
            "votes": {
              "setKey": [
                {
                  "var": "state.votes"
                },
                {
                  "var": "event.agent"
                },
                {
                  "vote": {
                    "var": "event.vote"
                  },
                  "votedAt": {
                    "var": "$timestamp"
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "ACTIVE",
      "eventName": "finalize",
      "guard": {
        ">=": [
          {
            "var": "event.forCount"
          },
          {
            "*": [
              {
                "size": {
                  "var": "state.members"
                }
              },
              {
                "var": "state.passingThreshold"
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
            "rules": {
              "merge": [
                {
                  "var": "state.rules"
                },
                {
                  "var": "state.proposal.changes"
                }
              ]
            },
            "history": {
              "cat": [
                {
                  "var": "state.history"
                },
                [
                  {
                    "type": "rule_change",
                    "proposal": {
                      "var": "state.proposal"
                    },
                    "outcome": "passed",
                    "finalizedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "VOTING",
      "to": "ACTIVE",
      "eventName": "finalize",
      "guard": {
        "<": [
          {
            "var": "event.forCount"
          },
          {
            "*": [
              {
                "size": {
                  "var": "state.members"
                }
              },
              {
                "var": "state.passingThreshold"
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
            "history": {
              "cat": [
                {
                  "var": "state.history"
                },
                [
                  {
                    "type": "rule_change",
                    "proposal": {
                      "var": "state.proposal"
                    },
                    "outcome": "failed",
                    "finalizedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "proposal": null,
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DISPUTE",
      "eventName": "file_dispute",
      "guard": {
        "getKey": [
          {
            "var": "state.members"
          },
          {
            "var": "event.agent"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "dispute": {
              "id": {
                "var": "event.disputeId"
              },
              "plaintiff": {
                "var": "event.agent"
              },
              "defendant": {
                "var": "event.defendant"
              },
              "claim": {
                "var": "event.claim"
              },
              "filedAt": {
                "var": "$timestamp"
              },
              "evidence": []
            },
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DISPUTE",
      "to": "DISPUTE",
      "eventName": "submit_evidence",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.dispute.plaintiff"
              }
            ]
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.dispute.defendant"
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
            "dispute": {
              "merge": [
                {
                  "var": "state.dispute"
                },
                {
                  "evidence": {
                    "cat": [
                      {
                        "var": "state.dispute.evidence"
                      },
                      [
                        {
                          "from": {
                            "var": "event.agent"
                          },
                          "content": {
                            "var": "event.content"
                          },
                          "at": {
                            "var": "$timestamp"
                          }
                        }
                      ]
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DISPUTE",
      "to": "DISPUTE",
      "eventName": "vote",
      "guard": {
        "and": [
          {
            "getKey": [
              {
                "var": "state.members"
              },
              {
                "var": "event.agent"
              }
            ]
          },
          {
            "!==": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.dispute.plaintiff"
              }
            ]
          },
          {
            "!==": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.dispute.defendant"
              }
            ]
          },
          {
            "!": [
              {
                "getKey": [
                  {
                    "var": "state.votes"
                  },
                  {
                    "var": "event.agent"
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
            "votes": {
              "setKey": [
                {
                  "var": "state.votes"
                },
                {
                  "var": "event.agent"
                },
                {
                  "ruling": {
                    "var": "event.ruling"
                  },
                  "votedAt": {
                    "var": "$timestamp"
                  }
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DISPUTE",
      "to": "ACTIVE",
      "eventName": "resolve",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.votes"
            }
          },
          {
            "var": "state.disputeQuorum"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "history": {
              "cat": [
                {
                  "var": "state.history"
                },
                [
                  {
                    "type": "dispute",
                    "dispute": {
                      "var": "state.dispute"
                    },
                    "ruling": {
                      "var": "event.ruling"
                    },
                    "remedy": {
                      "var": "event.remedy"
                    },
                    "resolvedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "dispute": null,
            "votes": {}
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "ACTIVE",
      "to": "DISSOLVED",
      "eventName": "dissolve",
      "guard": {
        ">=": [
          {
            "var": "event.approvalCount"
          },
          {
            "*": [
              {
                "size": {
                  "var": "state.members"
                }
              },
              0.9
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
            "dissolvedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;