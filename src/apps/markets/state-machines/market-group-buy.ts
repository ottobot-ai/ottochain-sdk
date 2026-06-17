import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Collective purchasing with quantity thresholds and tiered pricing.
 */
export const marketGroupBuyDef = defineFiberApp({
  metadata: {
    name: "MarketGroupBuy",
    app: "markets",
    type: "groupBuy",
    version: "1.0.0",
    description:
      "Collective purchasing with quantity thresholds and tiered pricing",
    crossReferences: {
      vendorIdentityId: "Links to vendor's IdentityAgent",
      escrowId: "Links to ContractEscrow for payment custody",
    },
  },

  createSchema: {
    required: ["organizer", "minQuantity", "deadline"] as const,
    properties: {
      organizer: {
        type: "address",
        description: "DAG address of group buy organizer",
        immutable: true,
      },
      minQuantity: {
        type: "number",
        minimum: 1,
        description: "Minimum quantity to proceed",
        immutable: true,
      },
      deadline: {
        type: "timestamp",
        description: "Order deadline",
        immutable: true,
      },
      vendor: { type: "address", description: "DAG address of the vendor" },
      maxPerBuyer: {
        type: "number",
        minimum: 1,
        description: "Max quantity per buyer",
      },
      priceTiers: {
        type: "array",
        description: "Quantity-based pricing tiers",
      },
    },
  },

  stateSchema: {
    properties: {
      status: { type: "string", computed: true },
      organizer: { type: "address", immutable: true },
      vendor: { type: "address" },
      minQuantity: { type: "number", immutable: true },
      maxPerBuyer: { type: "number" },
      deadline: { type: "timestamp", immutable: true },
      priceTiers: { type: "array" },
      orders: { type: "array", computed: true },
      totalQuantity: { type: "number", computed: true },
      currentTier: { type: "number", computed: true },
      refundsClaimed: { type: "array", computed: true },
    },
  },

  eventSchemas: {
    open: { description: "Open the group buy for orders" },
    cancel: { description: "Cancel the group buy" },
    order: {
      description: "Place an order",
      required: ["quantity"] as const,
      properties: {
        quantity: { type: "number", minimum: 1 },
        shippingInfo: { type: "object" },
      },
    },
    check_threshold: { description: "Check if minimum threshold reached" },
    finalize: { description: "Finalize after deadline" },
    fulfill: { description: "Mark group buy as fulfilled by vendor/organizer" },
    claim_refund: { description: "Claim refund if threshold not met" },
  },

  states: {
    PROPOSED: {
      id: "PROPOSED",
      isFinal: false,
      metadata: {
        label: "Proposed",
        description: "Group buy created but not yet open",
        category: "initial",
      },
    },
    OPEN: {
      id: "OPEN",
      isFinal: false,
      metadata: {
        label: "Open",
        description: "Accepting orders",
        category: "active",
      },
    },
    THRESHOLD_MET: {
      id: "THRESHOLD_MET",
      isFinal: false,
      metadata: {
        label: "Threshold met",
        description: "Minimum quantity reached, continuing for better tier",
        category: "active",
      },
    },
    PROCESSING: {
      id: "PROCESSING",
      isFinal: false,
      metadata: {
        label: "Processing",
        description: "Order placed with vendor, awaiting fulfillment",
        category: "pending",
      },
    },
    FULFILLED: {
      id: "FULFILLED",
      isFinal: true,
      metadata: {
        label: "Fulfilled",
        description: "All items delivered to buyers",
        category: "terminal",
      },
    },
    REFUNDED: {
      id: "REFUNDED",
      isFinal: true,
      metadata: {
        label: "Refunded",
        description: "Threshold not met, all orders refunded",
        category: "terminal",
      },
    },
    CANCELLED: {
      id: "CANCELLED",
      isFinal: true,
      metadata: {
        label: "Cancelled",
        description: "Group buy cancelled",
        category: "terminal",
      },
    },
  },

  initialState: "PROPOSED",

  transitions: [
    {
      from: "PROPOSED",
      to: "OPEN",
      eventName: "open",
      guard: { "===": [{ var: "event.agent" }, { var: "state.organizer" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "OPEN",
            openedAt: { var: "$ordinal" },
            orders: [],
            totalQuantity: 0,
            currentTier: 0,
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "PROPOSED",
      to: "CANCELLED",
      eventName: "cancel",
      guard: { "===": [{ var: "event.agent" }, { var: "state.organizer" }] },
      effect: {
        merge: [
          { var: "state" },
          { status: "CANCELLED", cancelledAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },
    {
      from: "OPEN",
      to: "OPEN",
      eventName: "order",
      guard: {
        and: [
          { ">": [{ var: "event.quantity" }, 0] },
          {
            or: [
              { "!": [{ var: "state.maxPerBuyer" }] },
              {
                "<=": [{ var: "event.quantity" }, { var: "state.maxPerBuyer" }],
              },
            ],
          },
          { "<=": [{ var: "$ordinal" }, { var: "state.deadline" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            orders: {
              cat: [
                { var: "state.orders" },
                [
                  {
                    buyer: { var: "event.agent" },
                    quantity: { var: "event.quantity" },
                    shippingInfo: { var: "event.shippingInfo" },
                    orderedAt: { var: "$ordinal" },
                  },
                ],
              ],
            },
            totalQuantity: {
              "+": [{ var: "state.totalQuantity" }, { var: "event.quantity" }],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "OPEN",
      to: "THRESHOLD_MET",
      eventName: "check_threshold",
      guard: {
        ">=": [{ var: "state.totalQuantity" }, { var: "state.minQuantity" }],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "THRESHOLD_MET",
            thresholdMetAt: { var: "$ordinal" },
            currentTier: {
              reduce: [
                { var: "state.priceTiers" },
                {
                  if: [
                    {
                      "<=": [
                        { var: "current.minQuantity" },
                        { var: "state.totalQuantity" },
                      ],
                    },
                    { var: "current.tier" },
                    { var: "accumulator" },
                  ],
                },
                0,
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "THRESHOLD_MET",
      to: "THRESHOLD_MET",
      eventName: "order",
      guard: {
        and: [
          { ">": [{ var: "event.quantity" }, 0] },
          { "<=": [{ var: "$ordinal" }, { var: "state.deadline" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            orders: {
              cat: [
                { var: "state.orders" },
                [
                  {
                    buyer: { var: "event.agent" },
                    quantity: { var: "event.quantity" },
                    shippingInfo: { var: "event.shippingInfo" },
                    orderedAt: { var: "$ordinal" },
                  },
                ],
              ],
            },
            totalQuantity: {
              "+": [{ var: "state.totalQuantity" }, { var: "event.quantity" }],
            },
            currentTier: {
              reduce: [
                { var: "state.priceTiers" },
                {
                  if: [
                    {
                      "<=": [
                        { var: "current.minQuantity" },
                        {
                          "+": [
                            { var: "state.totalQuantity" },
                            { var: "event.quantity" },
                          ],
                        },
                      ],
                    },
                    { var: "current.tier" },
                    { var: "accumulator" },
                  ],
                },
                { var: "state.currentTier" },
              ],
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "THRESHOLD_MET",
      to: "PROCESSING",
      eventName: "finalize",
      guard: { ">=": [{ var: "$ordinal" }, { var: "state.deadline" }] },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "PROCESSING",
            finalizedAt: { var: "$ordinal" },
            finalTier: { var: "state.currentTier" },
            finalPricePerUnit: {
              var: {
                cat: [
                  "state.priceTiers.",
                  { var: "state.currentTier" },
                  ".pricePerUnit",
                ],
              },
            },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "PROCESSING",
      to: "FULFILLED",
      eventName: "fulfill",
      guard: {
        or: [
          { "===": [{ var: "event.agent" }, { var: "state.vendor" }] },
          { "===": [{ var: "event.agent" }, { var: "state.organizer" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "FULFILLED",
            fulfilledAt: { var: "$ordinal" },
            trackingInfo: { var: "event.trackingInfo" },
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "OPEN",
      to: "REFUNDED",
      eventName: "finalize",
      guard: {
        and: [
          {
            "<": [{ var: "state.totalQuantity" }, { var: "state.minQuantity" }],
          },
          { ">=": [{ var: "$ordinal" }, { var: "state.deadline" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "REFUNDED",
            refundedAt: { var: "$ordinal" },
            reason: "threshold_not_met",
          },
        ],
      },
      dependencies: [],
    },
    {
      from: "REFUNDED",
      to: "REFUNDED",
      eventName: "claim_refund",
      guard: {
        and: [
          {
            ">": [
              {
                size: {
                  filter: [
                    { var: "state.orders" },
                    { "===": [{ var: "buyer" }, { var: "event.agent" }] },
                  ],
                },
              },
              0,
            ],
          },
          {
            "!": [
              {
                in: [{ var: "event.agent" }, { var: "state.refundsClaimed" }],
              },
            ],
          },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            refundsClaimed: {
              cat: [{ var: "state.refundsClaimed" }, [{ var: "event.agent" }]],
            },
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
