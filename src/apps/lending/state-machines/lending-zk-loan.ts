import { defineFiberApp } from "../../../schema/fiber-app.js";

/**
 * Privacy-preserving zk-loan — a private-finance lending fiber modeled on Midnight's
 * zkLoan example, integrated with OttoChain's asset subsystem.
 *
 * The borrower proves, in zero-knowledge, that their PRIVATE financials satisfy the
 * PUBLIC lending rule (collateral coverage and/or a credit-score floor) WITHOUT
 * revealing the financials. The lender originates the loan. The collateral, principal,
 * and repayment are ASSETS, driven through typed morphisms by the loan lifecycle.
 *
 * Privacy boundary (see docs/design/zk-loan-app.md):
 *   - PRIVATE (witness only): collateralValue, credit/income financials (income, score),
 *     outstanding debt, and the blinding salts. Never on-chain, never in the event.
 *   - PUBLIC (revealed): the loan principal amount, the collateral asset id (a locked
 *     handle, not its private valuation), the lending-rule logicHash, loan status, and
 *     the boolean "eligible" outcome — the chain learns *whether* the borrower qualifies,
 *     never *why*.
 *
 * The ORIGINATION guard (`originate`, COLLATERAL_LOCKED -> ACTIVE) is the semi-private
 * gate: it verifies an SP1-Groth16 eligibility proof over `witness.{publicValues,proof}`
 * with the lender's pinned verifying key, AND binds the proof's committed public values
 * (parsed out of the opaque `publicValues` blob with native JLVM `cat`/`substr`) to the
 * PUBLIC lending rule — `exprHash == $lendingRuleLogicHash`, `outputHash == $keccakTrue`,
 * and the `ok` bit — so a proof can only originate a loan if it proves THE pinned rule
 * evaluated to `true` on the borrower's hidden data. A missing/garbage witness makes the
 * guard false and the transition is gracefully rejected (state untouched).
 *
 * The pinned public constants ($lendingRuleVKey, $lendingRuleLogicHash, $keccakTrue) live
 * on the loan's create-state so the guard is a closed expression. They are produced
 * client-side by `src/apps/lending` helpers (`buildOriginationGuard`, `pinLendingRule`)
 * over `src/zk` (`exprHash`, `KECCAK_TRUE`).
 */
export const lendingZkLoanDef = defineFiberApp({
  metadata: {
    name: "LendingZkLoan",
    app: "lending",
    type: "zkLoan",
    version: "1.0.0",
    description:
      "Privacy-preserving collateralized loan: the borrower proves loan eligibility (collateral coverage / credit-score floor) in zero-knowledge without revealing the financials; collateral, principal and repayment are asset-subsystem tokens driven by the loan lifecycle.",
    crossReferences: {
      borrowerIdentityId: "Links to the borrower's IdentityAgent",
      lenderIdentityId: "Links to the lender's IdentityAgent (loan originator)",
      collateralAssetId:
        "Asset instance locked as collateral (held by the loan's escrow fiber)",
      debtAssetId:
        "Asset instance representing the outstanding loan principal/debt minted to the borrower",
    },
  },

  createSchema: {
    required: [
      "borrower",
      "lender",
      "principalAmount",
      "collateralAssetId",
      "collateralPolicy",
      "debtPolicy",
      "lendingRuleVKey",
      "lendingRuleLogicHash",
      "keccakTrue",
    ] as const,
    properties: {
      borrower: {
        type: "address",
        description: "DAG address of the borrower",
        immutable: true,
      },
      lender: {
        type: "address",
        description: "DAG address of the lender / loan originator",
        immutable: true,
      },
      principalAmount: {
        type: "integer",
        description:
          "PUBLIC loan principal (asset minor-units). The financials backing eligibility stay private.",
        minimum: 1,
        immutable: true,
      },
      collateralAssetId: {
        type: "uuid",
        description:
          "Asset instance id pledged as collateral (its private valuation is never revealed).",
        immutable: true,
      },
      collateralPolicy: {
        type: "string",
        description: "Collateral asset policy name (e.g. 'collateral-vault-v1.asset').",
        immutable: true,
      },
      debtPolicy: {
        type: "string",
        description: "Debt/loan-token asset policy name (e.g. 'loan-debt-v1.asset').",
        immutable: true,
      },
      escrowFiberId: {
        type: "uuid",
        description:
          "Fiber that custodies the locked collateral (AssetHolder.Fiber). Defaults to this loan fiber.",
      },
      lendingRuleVKey: {
        type: "hash",
        description:
          "PINNED SP1 program verifying key (bytes32, 0x-hex) for the eligibility circuit.",
        immutable: true,
      },
      lendingRuleLogicHash: {
        type: "hash",
        description:
          "PINNED logicHash of the public lending rule = keccak256(canonicalize(rule)). The proof's committed exprHash must equal this.",
        immutable: true,
      },
      keccakTrue: {
        type: "hash",
        description:
          "PINNED keccak256(canonicalize(true)) — the outputHash a 'rule returned true' proof must commit.",
        immutable: true,
      },
      dueOrdinal: {
        type: "integer",
        description: "Optional snapshot ordinal by which repayment is due.",
        minimum: 0,
      },
    },
  },

  stateSchema: {
    properties: {
      status: { type: "string", computed: true },
      borrower: { type: "address", immutable: true },
      lender: { type: "address", immutable: true },
      principalAmount: { type: "integer", immutable: true },
      collateralAssetId: { type: "uuid", immutable: true },
      collateralPolicy: { type: "string", immutable: true },
      debtPolicy: { type: "string", immutable: true },
      escrowFiberId: { type: "uuid" },
      debtAssetId: { type: "uuid", computed: true },
      lendingRuleVKey: { type: "hash", immutable: true },
      lendingRuleLogicHash: { type: "hash", immutable: true },
      keccakTrue: { type: "hash", immutable: true },
      dueOrdinal: { type: "integer" },
      lockedAt: { type: "integer", computed: true },
      originatedAt: { type: "integer", computed: true },
      repaidAt: { type: "integer", computed: true },
      defaultedAt: { type: "integer", computed: true },
      liquidatedAt: { type: "integer", computed: true },
    },
  },

  eventSchemas: {
    lock_collateral: {
      description:
        "Borrower locks the pledged collateral asset into the loan escrow fiber (drives an asset Transfer/Mint into AssetHolder.Fiber).",
    },
    originate: {
      description:
        "Lender originates the loan after the borrower's zk eligibility proof verifies. The witness carries the SP1-Groth16 {publicValues, proof}; the guard binds them to the pinned public lending rule. The effect mints the debt/principal asset to the borrower.",
      required: ["witness", "debtAssetId"] as const,
      properties: {
        witness: {
          type: "object",
          description:
            "Eligibility-proof witness: { publicValues: 0x-hex, proof: 0x-hex }. Exposed to the guard under the reserved `witness` key.",
          properties: {
            publicValues: { type: "string", description: "abi_encode(JlvmPublicValues), 0x-hex." },
            proof: { type: "string", description: "SP1-Groth16 proof bytes, 0x-hex." },
          },
          required: ["publicValues", "proof"] as const,
        },
        debtAssetId: {
          type: "uuid",
          description: "Asset instance id for the debt/principal token minted to the borrower.",
        },
      },
    },
    repay: {
      description:
        "Borrower repays the principal (drives a Burn of the debt token); on success the collateral is released back to the borrower via the escrow fiber.",
    },
    default_loan: {
      description:
        "Mark the loan defaulted once past due (drives the collateral toward liquidation).",
    },
    liquidate: {
      description:
        "Lender liquidates a defaulted loan: the locked collateral is transferred to the lender via the escrow fiber.",
    },
    cancel: {
      description: "Cancel a loan request before collateral is locked.",
      properties: { reason: { type: "string" } },
    },
  },

  states: {
    REQUESTED: {
      id: "REQUESTED",
      isFinal: false,
      metadata: {
        label: "Requested",
        description: "Loan requested; collateral not yet locked, eligibility not yet proven.",
        category: "initial",
      },
    },
    COLLATERAL_LOCKED: {
      id: "COLLATERAL_LOCKED",
      isFinal: false,
      metadata: {
        label: "Collateral Locked",
        description:
          "Collateral asset escrowed in the loan fiber; awaiting the lender's zk-gated origination.",
        category: "pending",
      },
    },
    ACTIVE: {
      id: "ACTIVE",
      isFinal: false,
      metadata: {
        label: "Active",
        description: "Loan originated (eligibility proven in zk); principal minted to the borrower.",
        category: "active",
      },
    },
    DEFAULTED: {
      id: "DEFAULTED",
      isFinal: false,
      metadata: {
        label: "Defaulted",
        description: "Loan past due and unpaid; collateral pending liquidation.",
        category: "pending",
      },
    },
    REPAID: {
      id: "REPAID",
      isFinal: true,
      metadata: {
        label: "Repaid",
        description: "Principal repaid (debt burned) and collateral released to the borrower.",
        category: "terminal",
      },
    },
    LIQUIDATED: {
      id: "LIQUIDATED",
      isFinal: true,
      metadata: {
        label: "Liquidated",
        description: "Defaulted loan settled by transferring the collateral to the lender.",
        category: "terminal",
      },
    },
    CANCELLED: {
      id: "CANCELLED",
      isFinal: true,
      metadata: {
        label: "Cancelled",
        description: "Loan request cancelled before any collateral was locked.",
        category: "terminal",
      },
    },
  },

  initialState: "REQUESTED",

  transitions: [
    // Borrower locks collateral into the escrow fiber.
    {
      from: "REQUESTED",
      to: "COLLATERAL_LOCKED",
      eventName: "lock_collateral",
      guard: {
        and: [
          { in: [{ var: "state.borrower" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
          { "===": [{ var: "event.assetId" }, { var: "state.collateralAssetId" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          { status: "COLLATERAL_LOCKED", lockedAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },

    // Cancel a request before any collateral is locked.
    {
      from: "REQUESTED",
      to: "CANCELLED",
      eventName: "cancel",
      guard: {
        or: [
          { in: [{ var: "state.borrower" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
          { in: [{ var: "state.lender" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          {
            status: "CANCELLED",
            cancelledAt: { var: "$ordinal" },
            reason: { var: "event.reason" },
          },
        ],
      },
      dependencies: [],
    },

    // ─── ORIGINATION: the zk eligibility gate ─────────────────────────────────
    // The lender originates iff the borrower's SP1-Groth16 eligibility proof verifies
    // against the pinned vkey AND its committed public values bind to the pinned PUBLIC
    // lending rule. publicValues = abi_encode(JlvmPublicValues{exprHash|dataHash|outputHash|ok}):
    // four 32-byte words, so as a 0x-hex string each word is 64 hex chars at offset
    // 2 + 64*i. We slice with native JLVM `substr` (start, len) and re-`cat` the `0x`
    // prefix to compare to the pinned hashes — there is no jlvm_pv_decode opcode by design.
    // The clauses, in order:
    //   1. agent == lender                                   — only the lender originates
    //   2. groth16_verify(vkey, publicValues, proof)         — the proof is valid
    //   3. exprHash   == lendingRuleLogicHash                — it proved THE pinned rule
    //   4. outputHash == keccakTrue                          — the rule evaluated to true
    //   5. ok bit (last hex pair of word 3) == "01"          — the JLVM run did not error
    {
      from: "COLLATERAL_LOCKED",
      to: "ACTIVE",
      eventName: "originate",
      guard: {
        and: [
          { in: [{ var: "state.lender" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
          {
            groth16_verify: [
              { var: "state.lendingRuleVKey" },
              { var: "event.witness.publicValues" },
              { var: "event.witness.proof" },
            ],
          },
          {
            "===": [
              { cat: ["0x", { substr: [{ var: "event.witness.publicValues" }, 2, 64] }] },
              { var: "state.lendingRuleLogicHash" },
            ],
          },
          {
            "===": [
              { cat: ["0x", { substr: [{ var: "event.witness.publicValues" }, 130, 64] }] },
              { var: "state.keccakTrue" },
            ],
          },
          {
            "===": [{ substr: [{ var: "event.witness.publicValues" }, 256, 2] }, "01"],
          },
        ],
      },
      // Effect mints the loan principal/debt to the borrower (asset Mint), records the
      // debt asset id, and activates the loan.
      effect: {
        merge: [
          { var: "state" },
          {
            status: "ACTIVE",
            originatedAt: { var: "$ordinal" },
            debtAssetId: { var: "event.debtAssetId" },
          },
        ],
      },
      dependencies: [],
    },

    // Borrower repays — debt is burned, collateral released back to the borrower.
    {
      from: "ACTIVE",
      to: "REPAID",
      eventName: "repay",
      guard: { in: [{ var: "state.borrower" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
      // Release the escrowed collateral back to the borrower. The loan fiber HOLDS the collateral
      // (locked as AssetHolder.Fiber), so it emits the reserved `_transferAsset` directive from inside
      // the effect — the engine extracts `_`-prefixed keys (it is NOT merged into state). A transition-
      // level `emits` block is silently dropped by toProtoDefinition, which would strand the collateral.
      effect: {
        merge: [
          { var: "state" },
          {
            status: "REPAID",
            repaidAt: { var: "$ordinal" },
            _transferAsset: [
              { assetId: { var: "state.collateralAssetId" }, recipient: { var: "state.borrower" } },
            ],
          },
        ],
      },
      dependencies: [],
    },

    // Loan goes past due → defaulted.
    {
      from: "ACTIVE",
      to: "DEFAULTED",
      eventName: "default_loan",
      guard: {
        and: [
          { var: "state.dueOrdinal" },
          { ">=": [{ var: "$ordinal" }, { var: "state.dueOrdinal" }] },
        ],
      },
      effect: {
        merge: [
          { var: "state" },
          { status: "DEFAULTED", defaultedAt: { var: "$ordinal" } },
        ],
      },
      dependencies: [],
    },

    // Lender liquidates a defaulted loan — collateral transferred to the lender.
    {
      from: "DEFAULTED",
      to: "LIQUIDATED",
      eventName: "liquidate",
      guard: { in: [{ var: "state.lender" }, { map: [{ var: "proofs" }, { var: "address" }] }] },
      // Transfer the escrowed collateral to the lender via the reserved `_transferAsset` directive
      // inside the effect (the loan fiber holds it). A transition-level `emits` block is dropped by the engine.
      effect: {
        merge: [
          { var: "state" },
          {
            status: "LIQUIDATED",
            liquidatedAt: { var: "$ordinal" },
            _transferAsset: [
              { assetId: { var: "state.collateralAssetId" }, recipient: { var: "state.lender" } },
            ],
          },
        ],
      },
      dependencies: [],
    },
  ],
} as const);
