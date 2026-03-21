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

export const daoReputationDef = {
  "metadata": {
    "name": "DAOReputation",
    "description": "Reputation-based governance. Minimum reputation required for participation.",
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

export const govUniversalDef = {
  "metadata": {
    "name": "GovernanceUniversal",
    "description": "Minimal governance state machine - extend for custom use cases",
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
            "status": "VOTING",
            "proposal": {
              "var": "event.proposal"
            },
            "proposedAt": {
              "var": "$timestamp"
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
            "votes": {
              "merge": [
                {
                  "var": "state.votes"
                },
                {
                  "__key": {
                    "var": "event.agent"
                  },
                  "__value": {
                    "var": "event.vote"
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
            "lastProposal": {
              "var": "state.proposal"
            },
            "lastResult": {
              "var": "event.result"
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
      "to": "DISSOLVED",
      "eventName": "dissolve",
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