/**
 * Auto-generated from JSON state machine definitions.
 * DO NOT EDIT - regenerate with: npm run prebuild
 */

export const marketAuctionDef = {
  "metadata": {
    "name": "MarketAuction",
    "description": "Auction market supporting English, Dutch, and sealed-bid variants",
    "version": "1.0.0",
    "crossReferences": {
      "sellerIdentityId": "Links to seller's IdentityAgent",
      "escrowId": "Links to ContractEscrow for asset custody"
    }
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": {
        "description": "Auction created but not yet open"
      }
    },
    "OPEN": {
      "id": "OPEN",
      "isFinal": false,
      "metadata": {
        "description": "Accepting bids"
      }
    },
    "CLOSING": {
      "id": "CLOSING",
      "isFinal": false,
      "metadata": {
        "description": "Bid period ended, determining winner"
      }
    },
    "SETTLED": {
      "id": "SETTLED",
      "isFinal": true,
      "metadata": {
        "description": "Winner determined, transfer complete"
      }
    },
    "NO_SALE": {
      "id": "NO_SALE",
      "isFinal": true,
      "metadata": {
        "description": "Reserve not met or no valid bids"
      }
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": {
        "description": "Auction cancelled by seller"
      }
    }
  },
  "initialState": "PROPOSED",
  "transitions": [
    {
      "from": "PROPOSED",
      "to": "OPEN",
      "eventName": "open",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.seller"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "OPEN",
            "openedAt": {
              "var": "$timestamp"
            },
            "bids": [],
            "highBid": null,
            "highBidder": null
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
            "var": "state.seller"
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
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "bid",
      "guard": {
        "and": [
          {
            "!==": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.seller"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "event.amount"
              },
              {
                "var": "state.minBid"
              }
            ]
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.highBid"
                  }
                ]
              },
              {
                ">=": [
                  {
                    "var": "event.amount"
                  },
                  {
                    "+": [
                      {
                        "var": "state.highBid"
                      },
                      {
                        "var": "state.bidIncrement"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.deadline"
                  }
                ]
              },
              {
                "<=": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.deadline"
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
            "bids": {
              "cat": [
                {
                  "var": "state.bids"
                },
                [
                  {
                    "bidder": {
                      "var": "event.agent"
                    },
                    "amount": {
                      "var": "event.amount"
                    },
                    "bidAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "highBid": {
              "var": "event.amount"
            },
            "highBidder": {
              "var": "event.agent"
            },
            "lastBidAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "CLOSING",
      "eventName": "close",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.seller"
              }
            ]
          },
          {
            "and": [
              {
                "var": "state.deadline"
              },
              {
                ">=": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.deadline"
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
            "status": "CLOSING",
            "closedAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "CLOSING",
      "to": "SETTLED",
      "eventName": "settle",
      "guard": {
        "and": [
          {
            "var": "state.highBidder"
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.reservePrice"
                  }
                ]
              },
              {
                ">=": [
                  {
                    "var": "state.highBid"
                  },
                  {
                    "var": "state.reservePrice"
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
            "status": "SETTLED",
            "settledAt": {
              "var": "$timestamp"
            },
            "winner": {
              "var": "state.highBidder"
            },
            "finalPrice": {
              "var": "state.highBid"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "CLOSING",
      "to": "NO_SALE",
      "eventName": "no_sale",
      "guard": {
        "or": [
          {
            "!": [
              {
                "var": "state.highBidder"
              }
            ]
          },
          {
            "and": [
              {
                "var": "state.reservePrice"
              },
              {
                "<": [
                  {
                    "var": "state.highBid"
                  },
                  {
                    "var": "state.reservePrice"
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
            "status": "NO_SALE",
            "closedAt": {
              "var": "$timestamp"
            },
            "reason": {
              "if": [
                {
                  "!": [
                    {
                      "var": "state.highBidder"
                    }
                  ]
                },
                "no_bids",
                "reserve_not_met"
              ]
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;

export const marketCrowdfundDef = {
  "metadata": {
    "name": "MarketCrowdfund",
    "description": "All-or-nothing crowdfunding with threshold, deadline, and stretch goals",
    "version": "1.0.0",
    "crossReferences": {
      "creatorIdentityId": "Links to creator's IdentityAgent",
      "treasuryId": "Links to Treasury for fund custody"
    }
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": {
        "description": "Campaign created but not yet open"
      }
    },
    "OPEN": {
      "id": "OPEN",
      "isFinal": false,
      "metadata": {
        "description": "Accepting pledges"
      }
    },
    "FUNDED": {
      "id": "FUNDED",
      "isFinal": true,
      "metadata": {
        "description": "Threshold met, funds released to creator"
      }
    },
    "REFUNDED": {
      "id": "REFUNDED",
      "isFinal": true,
      "metadata": {
        "description": "Threshold not met, all pledges refunded"
      }
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": {
        "description": "Campaign cancelled by creator"
      }
    }
  },
  "initialState": "PROPOSED",
  "transitions": [
    {
      "from": "PROPOSED",
      "to": "OPEN",
      "eventName": "launch",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.creator"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "OPEN",
            "launchedAt": {
              "var": "$timestamp"
            },
            "pledges": [],
            "totalPledged": 0,
            "backerCount": 0
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
            "var": "state.creator"
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
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "pledge",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "event.amount"
              },
              0
            ]
          },
          {
            "!==": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.creator"
              }
            ]
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.minPledge"
                  }
                ]
              },
              {
                ">=": [
                  {
                    "var": "event.amount"
                  },
                  {
                    "var": "state.minPledge"
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
                "var": "state.deadline"
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
            "pledges": {
              "cat": [
                {
                  "var": "state.pledges"
                },
                [
                  {
                    "backer": {
                      "var": "event.agent"
                    },
                    "amount": {
                      "var": "event.amount"
                    },
                    "rewardTier": {
                      "var": "event.rewardTier"
                    },
                    "pledgedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "totalPledged": {
              "+": [
                {
                  "var": "state.totalPledged"
                },
                {
                  "var": "event.amount"
                }
              ]
            },
            "backerCount": {
              "+": [
                {
                  "var": "state.backerCount"
                },
                1
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "increase_pledge",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "event.additionalAmount"
              },
              0
            ]
          },
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.deadline"
              }
            ]
          },
          {
            ">": [
              {
                "size": {
                  "filter": [
                    {
                      "var": "state.pledges"
                    },
                    {
                      "===": [
                        {
                          "var": "backer"
                        },
                        {
                          "var": "event.agent"
                        }
                      ]
                    }
                  ]
                }
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
            "totalPledged": {
              "+": [
                {
                  "var": "state.totalPledged"
                },
                {
                  "var": "event.additionalAmount"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "FUNDED",
      "eventName": "finalize",
      "guard": {
        "and": [
          {
            ">=": [
              {
                "var": "state.totalPledged"
              },
              {
                "var": "state.threshold"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.deadline"
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
            "status": "FUNDED",
            "fundedAt": {
              "var": "$timestamp"
            },
            "stretchGoalsReached": {
              "filter": [
                {
                  "var": "state.stretchGoals"
                },
                {
                  "<=": [
                    {
                      "var": "target"
                    },
                    {
                      "var": "state.totalPledged"
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
      "from": "OPEN",
      "to": "REFUNDED",
      "eventName": "finalize",
      "guard": {
        "and": [
          {
            "<": [
              {
                "var": "state.totalPledged"
              },
              {
                "var": "state.threshold"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.deadline"
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
            "status": "REFUNDED",
            "refundedAt": {
              "var": "$timestamp"
            },
            "reason": "threshold_not_met"
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "REFUNDED",
      "to": "REFUNDED",
      "eventName": "claim_refund",
      "guard": {
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    {
                      "var": "state.pledges"
                    },
                    {
                      "===": [
                        {
                          "var": "backer"
                        },
                        {
                          "var": "event.agent"
                        }
                      ]
                    }
                  ]
                }
              },
              0
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
                    "var": "state.refundsClaimed"
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
            "refundsClaimed": {
              "cat": [
                {
                  "var": "state.refundsClaimed"
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
    }
  ]
} as const;

export const marketGroupBuyDef = {
  "metadata": {
    "name": "MarketGroupBuy",
    "description": "Collective purchasing with quantity thresholds and tiered pricing",
    "version": "1.0.0",
    "crossReferences": {
      "vendorIdentityId": "Links to vendor's IdentityAgent",
      "escrowId": "Links to ContractEscrow for payment custody"
    }
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": {
        "description": "Group buy created but not yet open"
      }
    },
    "OPEN": {
      "id": "OPEN",
      "isFinal": false,
      "metadata": {
        "description": "Accepting orders"
      }
    },
    "THRESHOLD_MET": {
      "id": "THRESHOLD_MET",
      "isFinal": false,
      "metadata": {
        "description": "Minimum quantity reached, continuing for better tier"
      }
    },
    "PROCESSING": {
      "id": "PROCESSING",
      "isFinal": false,
      "metadata": {
        "description": "Order placed with vendor, awaiting fulfillment"
      }
    },
    "FULFILLED": {
      "id": "FULFILLED",
      "isFinal": true,
      "metadata": {
        "description": "All items delivered to buyers"
      }
    },
    "REFUNDED": {
      "id": "REFUNDED",
      "isFinal": true,
      "metadata": {
        "description": "Threshold not met, all orders refunded"
      }
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": {
        "description": "Group buy cancelled"
      }
    }
  },
  "initialState": "PROPOSED",
  "transitions": [
    {
      "from": "PROPOSED",
      "to": "OPEN",
      "eventName": "open",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.organizer"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "OPEN",
            "openedAt": {
              "var": "$timestamp"
            },
            "orders": [],
            "totalQuantity": 0,
            "currentTier": 0
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
            "var": "state.organizer"
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
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "order",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "event.quantity"
              },
              0
            ]
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.maxPerBuyer"
                  }
                ]
              },
              {
                "<=": [
                  {
                    "var": "event.quantity"
                  },
                  {
                    "var": "state.maxPerBuyer"
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
                "var": "state.deadline"
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
            "orders": {
              "cat": [
                {
                  "var": "state.orders"
                },
                [
                  {
                    "buyer": {
                      "var": "event.agent"
                    },
                    "quantity": {
                      "var": "event.quantity"
                    },
                    "shippingInfo": {
                      "var": "event.shippingInfo"
                    },
                    "orderedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "totalQuantity": {
              "+": [
                {
                  "var": "state.totalQuantity"
                },
                {
                  "var": "event.quantity"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "THRESHOLD_MET",
      "eventName": "check_threshold",
      "guard": {
        ">=": [
          {
            "var": "state.totalQuantity"
          },
          {
            "var": "state.minQuantity"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "THRESHOLD_MET",
            "thresholdMetAt": {
              "var": "$timestamp"
            },
            "currentTier": {
              "reduce": [
                {
                  "var": "state.priceTiers"
                },
                {
                  "if": [
                    {
                      "<=": [
                        {
                          "var": "current.minQuantity"
                        },
                        {
                          "var": "state.totalQuantity"
                        }
                      ]
                    },
                    {
                      "var": "current.tier"
                    },
                    {
                      "var": "accumulator"
                    }
                  ]
                },
                0
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "THRESHOLD_MET",
      "to": "THRESHOLD_MET",
      "eventName": "order",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "event.quantity"
              },
              0
            ]
          },
          {
            "<=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.deadline"
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
            "orders": {
              "cat": [
                {
                  "var": "state.orders"
                },
                [
                  {
                    "buyer": {
                      "var": "event.agent"
                    },
                    "quantity": {
                      "var": "event.quantity"
                    },
                    "shippingInfo": {
                      "var": "event.shippingInfo"
                    },
                    "orderedAt": {
                      "var": "$timestamp"
                    }
                  }
                ]
              ]
            },
            "totalQuantity": {
              "+": [
                {
                  "var": "state.totalQuantity"
                },
                {
                  "var": "event.quantity"
                }
              ]
            },
            "currentTier": {
              "reduce": [
                {
                  "var": "state.priceTiers"
                },
                {
                  "if": [
                    {
                      "<=": [
                        {
                          "var": "current.minQuantity"
                        },
                        {
                          "+": [
                            {
                              "var": "state.totalQuantity"
                            },
                            {
                              "var": "event.quantity"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "var": "current.tier"
                    },
                    {
                      "var": "accumulator"
                    }
                  ]
                },
                {
                  "var": "state.currentTier"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "THRESHOLD_MET",
      "to": "PROCESSING",
      "eventName": "finalize",
      "guard": {
        ">=": [
          {
            "var": "$timestamp"
          },
          {
            "var": "state.deadline"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "PROCESSING",
            "finalizedAt": {
              "var": "$timestamp"
            },
            "finalTier": {
              "var": "state.currentTier"
            },
            "finalPricePerUnit": {
              "var": {
                "cat": [
                  "state.priceTiers.",
                  {
                    "var": "state.currentTier"
                  },
                  ".pricePerUnit"
                ]
              }
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "PROCESSING",
      "to": "FULFILLED",
      "eventName": "fulfill",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.vendor"
              }
            ]
          },
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.organizer"
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
            "status": "FULFILLED",
            "fulfilledAt": {
              "var": "$timestamp"
            },
            "trackingInfo": {
              "var": "event.trackingInfo"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "REFUNDED",
      "eventName": "finalize",
      "guard": {
        "and": [
          {
            "<": [
              {
                "var": "state.totalQuantity"
              },
              {
                "var": "state.minQuantity"
              }
            ]
          },
          {
            ">=": [
              {
                "var": "$timestamp"
              },
              {
                "var": "state.deadline"
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
            "status": "REFUNDED",
            "refundedAt": {
              "var": "$timestamp"
            },
            "reason": "threshold_not_met"
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "REFUNDED",
      "to": "REFUNDED",
      "eventName": "claim_refund",
      "guard": {
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    {
                      "var": "state.orders"
                    },
                    {
                      "===": [
                        {
                          "var": "buyer"
                        },
                        {
                          "var": "event.agent"
                        }
                      ]
                    }
                  ]
                }
              },
              0
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
                    "var": "state.refundsClaimed"
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
            "refundsClaimed": {
              "cat": [
                {
                  "var": "state.refundsClaimed"
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
    }
  ]
} as const;

export const marketPredictionDef = {
  "metadata": {
    "name": "MarketPrediction",
    "description": "Binary or multi-outcome prediction market with oracle resolution and position staking",
    "version": "1.0.0",
    "crossReferences": {
      "oracleId": "Links to IdentityOracle that resolves the outcome",
      "creatorIdentityId": "Links to creator's IdentityAgent"
    }
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": {
        "description": "Market created but not yet open for trading"
      }
    },
    "OPEN": {
      "id": "OPEN",
      "isFinal": false,
      "metadata": {
        "description": "Accepting positions on outcomes"
      }
    },
    "CLOSED": {
      "id": "CLOSED",
      "isFinal": false,
      "metadata": {
        "description": "No more positions, awaiting resolution"
      }
    },
    "RESOLVING": {
      "id": "RESOLVING",
      "isFinal": false,
      "metadata": {
        "description": "Oracle(s) submitting resolution"
      }
    },
    "DISPUTED": {
      "id": "DISPUTED",
      "isFinal": false,
      "metadata": {
        "description": "Resolution challenged, awaiting arbitration"
      }
    },
    "SETTLED": {
      "id": "SETTLED",
      "isFinal": true,
      "metadata": {
        "description": "Outcome finalized, payouts available"
      }
    },
    "REFUNDED": {
      "id": "REFUNDED",
      "isFinal": true,
      "metadata": {
        "description": "Market invalidated, all positions refunded"
      }
    },
    "CANCELLED": {
      "id": "CANCELLED",
      "isFinal": true,
      "metadata": {
        "description": "Market cancelled before opening"
      }
    }
  },
  "initialState": "PROPOSED",
  "transitions": [
    {
      "from": "PROPOSED",
      "to": "OPEN",
      "eventName": "open",
      "guard": {
        "===": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.creator"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "OPEN",
            "openedAt": {
              "var": "$timestamp"
            },
            "positions": {},
            "totalPool": 0
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
            "var": "state.creator"
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
            },
            "reason": {
              "var": "event.reason"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "take_position",
      "guard": {
        "and": [
          {
            ">": [
              {
                "var": "event.amount"
              },
              0
            ]
          },
          {
            "in": [
              {
                "var": "event.outcome"
              },
              {
                "var": "state.outcomes"
              }
            ]
          },
          {
            "or": [
              {
                "!": [
                  {
                    "var": "state.deadline"
                  }
                ]
              },
              {
                "<=": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.deadline"
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
            "positions": {
              "merge": [
                {
                  "var": "state.positions"
                },
                {
                  "__computed": {
                    "cat": [
                      {
                        "var": "event.agent"
                      },
                      "_",
                      {
                        "var": "event.outcome"
                      }
                    ]
                  }
                }
              ]
            },
            "totalPool": {
              "+": [
                {
                  "var": "state.totalPool"
                },
                {
                  "var": "event.amount"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "CLOSED",
      "eventName": "close",
      "guard": {
        "or": [
          {
            "===": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.creator"
              }
            ]
          },
          {
            "and": [
              {
                "var": "state.deadline"
              },
              {
                ">=": [
                  {
                    "var": "$timestamp"
                  },
                  {
                    "var": "state.deadline"
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
      "from": "CLOSED",
      "to": "RESOLVING",
      "eventName": "submit_resolution",
      "guard": {
        "in": [
          {
            "var": "event.agent"
          },
          {
            "var": "state.oracles"
          }
        ]
      },
      "effect": {
        "merge": [
          {
            "var": "state"
          },
          {
            "status": "RESOLVING",
            "resolutions": [
              {
                "oracle": {
                  "var": "event.agent"
                },
                "outcome": {
                  "var": "event.outcome"
                },
                "proof": {
                  "var": "event.proof"
                },
                "submittedAt": {
                  "var": "$timestamp"
                }
              }
            ]
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RESOLVING",
      "to": "RESOLVING",
      "eventName": "submit_resolution",
      "guard": {
        "and": [
          {
            "in": [
              {
                "var": "event.agent"
              },
              {
                "var": "state.oracles"
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
                        "var": "state.resolutions"
                      },
                      {
                        "var": "oracle"
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
            "resolutions": {
              "cat": [
                {
                  "var": "state.resolutions"
                },
                [
                  {
                    "oracle": {
                      "var": "event.agent"
                    },
                    "outcome": {
                      "var": "event.outcome"
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
      "from": "RESOLVING",
      "to": "SETTLED",
      "eventName": "finalize",
      "guard": {
        ">=": [
          {
            "size": {
              "var": "state.resolutions"
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
            "status": "SETTLED",
            "settledAt": {
              "var": "$timestamp"
            },
            "finalOutcome": {
              "var": "event.outcome"
            },
            "claims": []
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RESOLVING",
      "to": "DISPUTED",
      "eventName": "dispute",
      "guard": {
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    {
                      "var": "state.positions"
                    },
                    {
                      "===": [
                        {
                          "var": "agent"
                        },
                        {
                          "var": "event.agent"
                        }
                      ]
                    }
                  ]
                }
              },
              0
            ]
          },
          {
            "var": "event.stake"
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
            "disputedBy": {
              "var": "event.agent"
            },
            "disputeStake": {
              "var": "event.stake"
            },
            "disputeReason": {
              "var": "event.reason"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "DISPUTED",
      "to": "SETTLED",
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
            "status": "SETTLED",
            "settledAt": {
              "var": "$timestamp"
            },
            "finalOutcome": {
              "var": "event.outcome"
            },
            "rulingId": {
              "var": "event.rulingId"
            },
            "claims": []
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "RESOLVING",
      "to": "REFUNDED",
      "eventName": "invalidate",
      "guard": {
        ">=": [
          {
            "size": {
              "filter": [
                {
                  "var": "state.resolutions"
                },
                {
                  "===": [
                    {
                      "var": "outcome"
                    },
                    "INVALID"
                  ]
                }
              ]
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
            "status": "REFUNDED",
            "refundedAt": {
              "var": "$timestamp"
            },
            "reason": "oracle_invalidation"
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "SETTLED",
      "to": "SETTLED",
      "eventName": "claim",
      "guard": {
        "and": [
          {
            ">": [
              {
                "size": {
                  "filter": [
                    {
                      "var": "state.positions"
                    },
                    {
                      "and": [
                        {
                          "===": [
                            {
                              "var": "agent"
                            },
                            {
                              "var": "event.agent"
                            }
                          ]
                        },
                        {
                          "===": [
                            {
                              "var": "outcome"
                            },
                            {
                              "var": "state.finalOutcome"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              },
              0
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
                        "var": "state.claims"
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
            "claims": {
              "cat": [
                {
                  "var": "state.claims"
                },
                [
                  {
                    "agent": {
                      "var": "event.agent"
                    },
                    "amount": {
                      "var": "event.amount"
                    },
                    "claimedAt": {
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
    }
  ]
} as const;

export const marketUniversalDef = {
  "metadata": {
    "name": "MarketUniversal",
    "description": "Minimal market state machine - extend for custom use cases",
    "version": "1.0.0"
  },
  "states": {
    "PROPOSED": {
      "id": "PROPOSED",
      "isFinal": false,
      "metadata": null
    },
    "OPEN": {
      "id": "OPEN",
      "isFinal": false,
      "metadata": null
    },
    "CLOSED": {
      "id": "CLOSED",
      "isFinal": false,
      "metadata": null
    },
    "SETTLED": {
      "id": "SETTLED",
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
      "to": "OPEN",
      "eventName": "open",
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
            "status": "OPEN",
            "openedAt": {
              "var": "$timestamp"
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
      "from": "OPEN",
      "to": "OPEN",
      "eventName": "commit",
      "guard": {
        ">": [
          {
            "var": "event.amount"
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
            "totalCommitted": {
              "+": [
                {
                  "var": "state.totalCommitted"
                },
                {
                  "var": "event.amount"
                }
              ]
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "OPEN",
      "to": "CLOSED",
      "eventName": "close",
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
      "from": "CLOSED",
      "to": "SETTLED",
      "eventName": "settle",
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
            "status": "SETTLED",
            "settledAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    },
    {
      "from": "CLOSED",
      "to": "CANCELLED",
      "eventName": "cancel",
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
            "status": "CANCELLED",
            "cancelledAt": {
              "var": "$timestamp"
            }
          }
        ]
      },
      "dependencies": []
    }
  ]
} as const;