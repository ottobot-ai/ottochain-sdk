import { defineFiberApp } from '../../../schema/fiber-app.js';
import { signerIsParty, depInState } from '../../../schema/guards.js';
import { addDependency } from '../../../schema/effects.js';

/**
 * Securities state machine tracking the lifecycle of equity from authorization through issuance, transfer, and retirement.
 * Manages stock certificates, book entry positions, and restricted securities.
 */
export const corpSecuritiesDef = defineFiberApp({
  metadata: {
    name: 'CorpSecurities',
    app: 'corporate',
    type: 'securities',
    version: '1.0.0',
    description:
      'Securities state machine tracking the lifecycle of equity from authorization through issuance, transfer, and retirement. Manages stock certificates, book entry positions, and restricted securities.',
    crossReferences: {
      entity: {
        machine: 'corporate-entity',
        description: 'Parent corporate entity with share class definitions',
        foreignKey: 'entityId',
      },
      resolutions: {
        machine: 'corporate-resolution',
        description: 'Board resolutions authorizing securities actions',
        foreignKey: 'entityId',
      },
      shareholders: {
        machine: 'corporate-shareholders',
        description: 'Shareholder meetings for determining voting rights',
        foreignKey: 'entityId',
      },
    },
  },

  createSchema: {
    required: [
      'securityId',
      'entityId',
      'issuerAddress',
      'shareClass',
      'shareClassName',
      'shareCount',
      'parValue',
    ] as const,
    properties: {
      securityId: {
        type: 'string',
        description: 'Unique identifier for this security lot/certificate',
        immutable: true,
      },
      entityId: {
        type: 'string',
        description: 'Reference to parent corporate-entity',
        immutable: true,
      },
      issuerAddress: {
        type: 'address',
        description:
          'State-pinned DAG address of the issuing authority (the corporation / transfer agent). Verified against proofs[].address to gate issuer-privileged transitions.',
        immutable: true,
      },
      shareClass: {
        type: 'string',
        description: 'Share class ID from corporate-entity',
      },
      shareClassName: {
        type: 'string',
        description: 'Human-readable class name',
      },
      shareCount: {
        type: 'integer',
        description: 'Number of shares in this lot',
      },
      parValue: {
        type: 'number',
        description: 'Par value per share',
      },
    },
  },

  stateSchema: {
    properties: {
      securityId: { type: 'string', immutable: true },
      entityId: { type: 'string', immutable: true },
      issuerAddress: { type: 'address', immutable: true },
      shareClass: { type: 'string' },
      shareClassName: { type: 'string' },
      certificateNumber: {
        type: 'string',
        nullable: true,
        description: 'For certificated shares',
      },
      cusip: {
        type: 'string',
        nullable: true,
        description: 'CUSIP number if assigned',
      },
      shareCount: { type: 'integer' },
      parValue: { type: 'number' },
      issuancePrice: {
        type: 'number',
        nullable: true,
        description: 'Price per share at issuance',
        computed: true,
      },
      issuanceDate: {
        type: 'string',
        format: 'date',
        nullable: true,
        computed: true,
      },
      form: {
        type: 'string',
        enum: ['CERTIFICATED', 'BOOK_ENTRY', 'DRS'] as const,
        description: 'Physical certificate, book entry, or Direct Registration System',
        computed: true,
      },
      holder: { $ref: '#/definitions/Holder', nullable: true, computed: true },
      restrictions: { $ref: '#/definitions/Restrictions', computed: true },
      authorization: {
        $ref: '#/definitions/Authorization',
        nullable: true,
        computed: true,
      },
      issuanceDetails: {
        $ref: '#/definitions/IssuanceDetails',
        nullable: true,
        computed: true,
      },
      transferHistory: {
        type: 'array',
        items: { $ref: '#/definitions/TransferRecord' },
        computed: true,
      },
      corporateActions: {
        type: 'array',
        items: { $ref: '#/definitions/CorporateAction' },
        computed: true,
      },
      retirementDetails: {
        $ref: '#/definitions/RetirementDetails',
        nullable: true,
        computed: true,
      },
      status: {
        type: 'string',
        enum: ['AUTHORIZED', 'ISSUED', 'TREASURY', 'TRANSFERRED', 'RETIRED'] as const,
        computed: true,
      },
      createdAt: { type: 'timestamp', computed: true },
      updatedAt: { type: 'timestamp', computed: true },
      // Two-phase resolution gating (#24): each propose_<X> binds the executing resolution (and, for
      // issuance, the parent entity) fiber via _addDependency and records the pending action here; the
      // gated <X> then asserts the bound dependency state via depInState and clears the pending object.
      // The dropped object-form dependencies (which the chain silently never gated) are replaced this way.
      pendingIssue: { type: 'object', nullable: true, computed: true },
      pendingRepurchase: { type: 'object', nullable: true, computed: true },
      pendingReissue: { type: 'object', nullable: true, computed: true },
      pendingRetire: { type: 'object', nullable: true, computed: true },
      pendingDividend: { type: 'object', nullable: true, computed: true },
    },
  },

  eventSchemas: {
    authorize_shares: {
      description: 'Record shares as authorized per charter/amendment',
      required: [
        'securityId',
        'entityId',
        'shareClass',
        'shareClassName',
        'shareCount',
        'parValue',
        'authorizedDate',
      ] as const,
      properties: {
        securityId: { type: 'string' },
        entityId: { type: 'string' },
        shareClass: { type: 'string' },
        shareClassName: { type: 'string' },
        shareCount: { type: 'integer' },
        parValue: { type: 'number' },
        authorizedDate: { type: 'string', format: 'date' },
        charterProvision: { type: 'string' },
      },
    },
    propose_issue: {
      description:
        'Phase 1 of issuance (#24): bind the executing board resolution + parent entity fibers (_addDependency) and record the pending issuance',
      required: ['holderId', 'boardResolutionRef'] as const,
      properties: {
        holderId: { type: 'string' },
        boardResolutionRef: { type: 'string' },
      },
    },
    issue_shares: {
      description: 'Issue shares to a holder',
      required: ['holderId', 'holderType', 'holderName', 'issuanceDate', 'form', 'consideration'] as const,
      properties: {
        holderId: { type: 'string' },
        holderType: { type: 'string' },
        holderName: { type: 'string' },
        holderWallet: {
          type: 'address',
          description:
            'DAG wallet address the holder controls; pinned so holder-initiated transfer/repurchase can be authorized via proofs[].address.',
        },
        address: { type: 'object' },
        issuanceDate: { type: 'string', format: 'date' },
        issuancePrice: { type: 'number' },
        form: {
          type: 'string',
          enum: ['CERTIFICATED', 'BOOK_ENTRY', 'DRS'] as const,
        },
        certificateNumber: { type: 'string' },
        consideration: { type: 'object' },
        isRestricted: { type: 'boolean', default: false },
        restrictionType: { type: 'array' },
        legends: { type: 'array' },
        exemptionUsed: { type: 'string' },
        accreditedInvestor: { type: 'boolean' },
      },
    },
    initiate_transfer: {
      description: 'Begin transfer of shares to new holder',
      required: ['transferId', 'toHolderId', 'toHolderName', 'toHolderType', 'transferType', 'transferDate'] as const,
      properties: {
        transferId: { type: 'string' },
        toHolderId: { type: 'string' },
        toHolderName: { type: 'string' },
        toHolderType: { type: 'string' },
        toAddress: { type: 'object' },
        transferType: { type: 'string' },
        pricePerShare: { type: 'number' },
        transferDate: { type: 'string', format: 'date' },
      },
    },
    complete_transfer: {
      description: 'Complete the transfer, update holder',
      required: ['toHolderId', 'toHolderName', 'toHolderType', 'completedDate'] as const,
      properties: {
        transferAgentConfirmation: { type: 'string' },
        newCertificateNumber: { type: 'string' },
        toHolderId: { type: 'string' },
        toHolderName: { type: 'string' },
        toHolderType: { type: 'string' },
        toHolderWallet: {
          type: 'address',
          description: 'DAG wallet address the new holder controls.',
        },
        toAddress: { type: 'object' },
        completedDate: { type: 'string', format: 'date' },
        costBasis: { type: 'number' },
      },
    },
    propose_repurchase: {
      description:
        'Phase 1 of repurchase (#24): bind the executing board resolution fiber (_addDependency) and record the pending repurchase',
      required: ['repurchaseDate', 'boardResolutionRef'] as const,
      properties: {
        repurchaseDate: { type: 'string', format: 'date' },
        boardResolutionRef: { type: 'string' },
      },
    },
    repurchase: {
      description: 'Company repurchases shares from holder',
      required: ['repurchaseDate', 'pricePerShare'] as const,
      properties: {
        repurchaseDate: { type: 'string', format: 'date' },
        pricePerShare: { type: 'number' },
        repurchaseAgreementRef: { type: 'string' },
      },
    },
    propose_reissue: {
      description:
        'Phase 1 of treasury reissue (#24): bind the executing board resolution fiber (_addDependency) and record the pending reissue',
      required: ['holderId', 'boardResolutionRef'] as const,
      properties: {
        holderId: { type: 'string' },
        boardResolutionRef: { type: 'string' },
      },
    },
    reissue_from_treasury: {
      description: 'Reissue treasury shares to a new holder',
      required: ['holderId', 'holderName', 'holderType', 'reissueDate'] as const,
      properties: {
        holderId: { type: 'string' },
        holderName: { type: 'string' },
        holderType: { type: 'string' },
        holderWallet: {
          type: 'address',
          description: 'DAG wallet address the reissued holder controls.',
        },
        address: { type: 'object' },
        reissueDate: { type: 'string', format: 'date' },
        issuancePrice: { type: 'number' },
      },
    },
    propose_retire: {
      description:
        'Phase 1 of retirement (#24): bind the executing board resolution fiber (_addDependency) and record the pending retirement (from ISSUED or TREASURY)',
      required: ['retiredDate', 'boardResolutionRef'] as const,
      properties: {
        retiredDate: { type: 'string', format: 'date' },
        boardResolutionRef: { type: 'string' },
      },
    },
    retire: {
      description: 'Retire shares (cancel them)',
      required: ['retiredDate', 'retirementMethod'] as const,
      properties: {
        retiredDate: { type: 'string', format: 'date' },
        retirementMethod: { type: 'string' },
        repurchasePrice: { type: 'number' },
      },
    },
    stock_split: {
      description: 'Apply stock split to this lot',
      required: ['actionId', 'splitRatio', 'effectiveDate', 'resolutionRef', 'newShareCount'] as const,
      properties: {
        actionId: { type: 'string' },
        splitRatio: {
          type: 'string',
          description: "e.g., '2:1' for 2-for-1 split",
        },
        effectiveDate: { type: 'string', format: 'date' },
        resolutionRef: { type: 'string' },
        newShareCount: { type: 'integer' },
      },
    },
    propose_dividend: {
      description:
        'Phase 1 of dividend declaration (#24): bind the executing board resolution fiber (_addDependency) and record the pending declaration',
      required: ['actionId', 'resolutionRef'] as const,
      properties: {
        actionId: { type: 'string' },
        resolutionRef: { type: 'string' },
      },
    },
    declare_dividend: {
      description: 'Record dividend declaration affecting this lot (for stock dividends)',
      required: ['actionId', 'dividendType', 'recordDate', 'paymentDate'] as const,
      properties: {
        actionId: { type: 'string' },
        dividendType: { type: 'string', enum: ['CASH', 'STOCK'] as const },
        recordDate: { type: 'string', format: 'date' },
        paymentDate: { type: 'string', format: 'date' },
        cashAmount: { type: 'number' },
        stockShares: { type: 'integer' },
      },
    },
    remove_restriction: {
      description: 'Remove or update restrictions on the shares',
      required: ['restrictionType', 'removedDate'] as const,
      properties: {
        restrictionType: { type: 'string' },
        removedDate: { type: 'string', format: 'date' },
        reason: { type: 'string' },
        legalOpinionRef: { type: 'string' },
      },
    },
  },

  definitions: {
    Holder: {
      type: 'object',
      nullable: true,
      properties: {
        holderId: { type: 'string' },
        holderType: {
          type: 'string',
          enum: ['INDIVIDUAL', 'ENTITY', 'TRUST', 'TREASURY'] as const,
        },
        name: { type: 'string' },
        taxId: { type: 'string', nullable: true },
        walletAddress: {
          type: 'address',
          nullable: true,
          description:
            'State-pinned DAG wallet address controlled by this holder; verified against proofs[].address to gate holder-initiated transfer/repurchase.',
        },
        address: { type: 'object', nullable: true },
        acquisitionDate: { type: 'string', format: 'date' },
        acquisitionMethod: {
          type: 'string',
          enum: [
            'ORIGINAL_ISSUANCE',
            'PURCHASE',
            'GIFT',
            'INHERITANCE',
            'STOCK_SPLIT',
            'CONVERSION',
            'EXERCISE',
          ] as const,
        },
        costBasis: { type: 'number', nullable: true },
      },
    },
    Restrictions: {
      type: 'object',
      properties: {
        isRestricted: { type: 'boolean', default: false },
        restrictionType: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'RULE_144',
              'SECTION_4(a)(2)',
              'REG_D',
              'REG_S',
              'LOCK_UP',
              'VESTING',
              'RIGHT_OF_FIRST_REFUSAL',
            ] as const,
          },
        },
        restrictionEndDate: { type: 'string', format: 'date', nullable: true },
        legends: {
          type: 'array',
          items: { type: 'string' },
          description: 'Legend text on certificates',
        },
        vestingSchedule: {
          type: 'object',
          nullable: true,
          properties: {
            vestingStartDate: { type: 'string', format: 'date' },
            totalShares: { type: 'integer' },
            vestedShares: { type: 'integer' },
            vestingScheduleRef: { type: 'string' },
          },
        },
        lockUpExpiration: { type: 'string', format: 'date', nullable: true },
        rofr: {
          type: 'object',
          nullable: true,
          description: 'Right of First Refusal',
          properties: {
            holderIds: { type: 'array', items: { type: 'string' } },
            noticePeriodDays: { type: 'integer' },
          },
        },
      },
    },
    Authorization: {
      type: 'object',
      nullable: true,
      description: 'For shares in AUTHORIZED state',
      properties: {
        authorizedDate: { type: 'string', format: 'date' },
        charterProvision: { type: 'string' },
        authorizedShares: { type: 'integer' },
      },
    },
    IssuanceDetails: {
      type: 'object',
      nullable: true,
      properties: {
        boardResolutionRef: { type: 'string' },
        issuanceAgreementRef: { type: 'string' },
        consideration: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['CASH', 'PROPERTY', 'SERVICES', 'DEBT_CONVERSION', 'STOCK_CONVERSION'] as const,
            },
            value: { type: 'number' },
            description: { type: 'string' },
          },
        },
        exemptionUsed: { type: 'string', nullable: true },
        accreditedInvestor: { type: 'boolean', nullable: true },
      },
    },
    TransferRecord: {
      type: 'object',
      properties: {
        transferId: { type: 'string' },
        transferDate: { type: 'string', format: 'date' },
        fromHolderId: { type: 'string' },
        toHolderId: { type: 'string' },
        shares: { type: 'integer' },
        transferType: {
          type: 'string',
          enum: ['SALE', 'GIFT', 'INHERITANCE', 'INTERNAL'] as const,
        },
        pricePerShare: { type: 'number', nullable: true },
        transferAgentConfirmation: { type: 'string', nullable: true },
      },
    },
    CorporateAction: {
      type: 'object',
      description: 'Stock splits, dividends, etc. affecting this lot',
      properties: {
        actionId: { type: 'string' },
        actionType: {
          type: 'string',
          enum: ['STOCK_SPLIT', 'REVERSE_SPLIT', 'STOCK_DIVIDEND', 'CONVERSION', 'RECLASSIFICATION'] as const,
        },
        actionDate: { type: 'string', format: 'date' },
        ratio: {
          type: 'string',
          nullable: true,
          description: 'e.g., 2:1 for split',
        },
        sharesBeforeAction: { type: 'integer' },
        sharesAfterAction: { type: 'integer' },
        resolutionRef: { type: 'string' },
      },
    },
    RetirementDetails: {
      type: 'object',
      nullable: true,
      properties: {
        retiredDate: { type: 'string', format: 'date' },
        retirementMethod: {
          type: 'string',
          enum: ['REPURCHASE', 'REDEMPTION', 'CANCELLATION', 'CONVERSION'] as const,
        },
        repurchasePrice: { type: 'number', nullable: true },
        boardResolutionRef: { type: 'string' },
      },
    },
  },

  states: {
    AUTHORIZED: {
      id: 'AUTHORIZED',
      isFinal: false,
      description: 'Shares authorized by charter but not yet issued',
    },
    ISSUED: {
      id: 'ISSUED',
      isFinal: false,
      description: 'Shares issued and held by a shareholder',
    },
    TREASURY: {
      id: 'TREASURY',
      isFinal: false,
      description: 'Shares repurchased and held by the company',
    },
    TRANSFERRED: {
      id: 'TRANSFERRED',
      isFinal: false,
      description: 'Transitional state during transfer between holders',
    },
    RETIRED: {
      id: 'RETIRED',
      isFinal: true,
      description: 'Shares cancelled and returned to authorized but unissued',
    },
  },

  initialState: 'AUTHORIZED',

  transitions: [
    // Initial authorization (creation)
    {
      from: 'AUTHORIZED',
      to: 'AUTHORIZED',
      eventName: 'authorize_shares',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            securityId: { var: 'event.securityId' },
            entityId: { var: 'event.entityId' },
            shareClass: { var: 'event.shareClass' },
            shareClassName: { var: 'event.shareClassName' },
            shareCount: { var: 'event.shareCount' },
            parValue: { var: 'event.parValue' },
            authorization: {
              authorizedDate: { var: 'event.authorizedDate' },
              charterProvision: { var: 'event.charterProvision' },
              authorizedShares: { var: 'event.shareCount' },
            },
            transferHistory: [],
            corporateActions: [],
          },
        ],
      },
    },

    // AUTHORIZED -> AUTHORIZED (propose_issue) — phase 1 (#24): bind the executing resolution + parent
    // entity fibers and record the pending issuance, so issue_shares can read their state next transition.
    {
      from: 'AUTHORIZED',
      to: 'AUTHORIZED',
      eventName: 'propose_issue',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingIssue: {
              holderId: { var: 'event.holderId' },
              ref: { var: 'event.boardResolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so issue_shares can assert its state next transition
          addDependency({ var: 'event.boardResolutionRef' }),
          // bind the parent entity fiber so issue_shares can assert it is ACTIVE
          addDependency({ var: 'state.entityId' }),
        ],
      },
      dependencies: [],
    },

    // AUTHORIZED -> ISSUED — phase 2 (#24): issue once the bound resolution is EXECUTED and the parent
    // entity is ACTIVE. depInState replaces the dropped object-form dependencies (which never gated).
    {
      from: 'AUTHORIZED',
      to: 'ISSUED',
      eventName: 'issue_shares',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.issuerAddress'),
          // the proposal must target this holder, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingIssue.holderId' }, { var: 'event.holderId' }],
          },
          depInState('state.pendingIssue.ref', 'EXECUTED'),
          depInState('state.entityId', 'ACTIVE'),
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ISSUED',
            form: { var: 'event.form' },
            certificateNumber: { var: 'event.certificateNumber' },
            issuanceDate: { var: 'event.issuanceDate' },
            issuancePrice: { var: 'event.issuancePrice' },
            holder: {
              holderId: { var: 'event.holderId' },
              holderType: { var: 'event.holderType' },
              name: { var: 'event.holderName' },
              walletAddress: { var: 'event.holderWallet' },
              address: { var: 'event.address' },
              acquisitionDate: { var: 'event.issuanceDate' },
              acquisitionMethod: 'ORIGINAL_ISSUANCE',
              costBasis: {
                '*': [{ var: 'event.issuancePrice' }, { var: 'state.shareCount' }],
              },
            },
            restrictions: {
              isRestricted: { var: 'event.isRestricted' },
              restrictionType: { var: 'event.restrictionType' },
              legends: { var: 'event.legends' },
            },
            issuanceDetails: {
              boardResolutionRef: { var: 'state.pendingIssue.ref' },
              consideration: { var: 'event.consideration' },
              exemptionUsed: { var: 'event.exemptionUsed' },
              accreditedInvestor: { var: 'event.accreditedInvestor' },
            },
            // clear the consumed proposal
            pendingIssue: null,
          },
          {
            _emit: [{ name: 'SHARES_ISSUED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
      dependencies: [],
    },

    // ISSUED -> TRANSFERRED
    {
      from: 'ISSUED',
      to: 'TRANSFERRED',
      eventName: 'initiate_transfer',
      guard: {
        and: [
          // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
          signerIsParty('state.holder.walletAddress'),
          {
            or: [
              { '==': [{ var: 'state.restrictions.isRestricted' }, false] },
              {
                '==': [{ var: 'state.restrictions.restrictionEndDate' }, null],
              },
              {
                '>=': [{ var: '$ordinal' }, { var: 'state.restrictions.restrictionEndDate' }],
              },
            ],
          },
          { '==': [{ var: 'state.restrictions.rofr' }, null] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'TRANSFERRED',
            transferHistory: {
              merge: [
                { var: 'state.transferHistory' },
                [
                  {
                    transferId: { var: 'event.transferId' },
                    transferDate: { var: 'event.transferDate' },
                    fromHolderId: { var: 'state.holder.holderId' },
                    toHolderId: { var: 'event.toHolderId' },
                    shares: { var: 'state.shareCount' },
                    transferType: { var: 'event.transferType' },
                    pricePerShare: { var: 'event.pricePerShare' },
                  },
                ],
              ],
            },
          },
          {
            _emit: [{ name: 'TRANSFER_INITIATED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
    },

    // TRANSFERRED -> ISSUED
    {
      from: 'TRANSFERRED',
      to: 'ISSUED',
      eventName: 'complete_transfer',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ISSUED',
            holder: {
              holderId: { var: 'event.toHolderId' },
              holderType: { var: 'event.toHolderType' },
              name: { var: 'event.toHolderName' },
              walletAddress: { var: 'event.toHolderWallet' },
              address: { var: 'event.toAddress' },
              acquisitionDate: { var: 'event.completedDate' },
              acquisitionMethod: 'PURCHASE',
              costBasis: { var: 'event.costBasis' },
            },
            certificateNumber: {
              if: [
                { '!=': [{ var: 'event.newCertificateNumber' }, null] },
                { var: 'event.newCertificateNumber' },
                { var: 'state.certificateNumber' },
              ],
            },
          },
          {
            _emit: [{ name: 'TRANSFER_COMPLETED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
    },

    // ISSUED -> ISSUED (propose_repurchase) — phase 1 (#24): bind the executing resolution fiber and
    // record the pending repurchase, so repurchase can read the resolution's state next transition.
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'propose_repurchase',
      // authority gate — the selling holder must sign; an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.holder.walletAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingRepurchase: {
              repurchaseDate: { var: 'event.repurchaseDate' },
              ref: { var: 'event.boardResolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so repurchase can assert its state next transition
          addDependency({ var: 'event.boardResolutionRef' }),
        ],
      },
      dependencies: [],
    },

    // ISSUED -> TREASURY — phase 2 (#24): repurchase once the bound resolution is EXECUTED.
    {
      from: 'ISSUED',
      to: 'TREASURY',
      eventName: 'repurchase',
      // authority gate — the selling holder must sign; an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.holder.walletAddress'),
          // the proposal must match this repurchase, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingRepurchase.repurchaseDate' }, { var: 'event.repurchaseDate' }],
          },
          depInState('state.pendingRepurchase.ref', 'EXECUTED'),
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'TREASURY',
            transferHistory: {
              merge: [
                { var: 'state.transferHistory' },
                [
                  {
                    transferId: {
                      cat: ['REPURCHASE-', { var: 'event.repurchaseDate' }],
                    },
                    transferDate: { var: 'event.repurchaseDate' },
                    fromHolderId: { var: 'state.holder.holderId' },
                    toHolderId: 'TREASURY',
                    shares: { var: 'state.shareCount' },
                    transferType: 'INTERNAL',
                    pricePerShare: { var: 'event.pricePerShare' },
                  },
                ],
              ],
            },
            holder: {
              holderId: 'TREASURY',
              holderType: 'TREASURY',
              name: 'Treasury Stock',
              acquisitionDate: { var: 'event.repurchaseDate' },
              acquisitionMethod: 'PURCHASE',
              costBasis: {
                '*': [{ var: 'event.pricePerShare' }, { var: 'state.shareCount' }],
              },
            },
            // clear the consumed proposal
            pendingRepurchase: null,
          },
          {
            _emit: [{ name: 'SHARES_REPURCHASED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
      dependencies: [],
    },

    // TREASURY -> TREASURY (propose_reissue) — phase 1 (#24): bind the executing resolution fiber and
    // record the pending reissue, so reissue_from_treasury can read the resolution's state next transition.
    {
      from: 'TREASURY',
      to: 'TREASURY',
      eventName: 'propose_reissue',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingReissue: {
              holderId: { var: 'event.holderId' },
              ref: { var: 'event.boardResolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so reissue_from_treasury can assert its state next transition
          addDependency({ var: 'event.boardResolutionRef' }),
        ],
      },
      dependencies: [],
    },

    // TREASURY -> ISSUED — phase 2 (#24): reissue once the bound resolution is EXECUTED.
    {
      from: 'TREASURY',
      to: 'ISSUED',
      eventName: 'reissue_from_treasury',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.issuerAddress'),
          // the proposal must target this holder, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingReissue.holderId' }, { var: 'event.holderId' }],
          },
          depInState('state.pendingReissue.ref', 'EXECUTED'),
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ISSUED',
            holder: {
              holderId: { var: 'event.holderId' },
              holderType: { var: 'event.holderType' },
              name: { var: 'event.holderName' },
              walletAddress: { var: 'event.holderWallet' },
              address: { var: 'event.address' },
              acquisitionDate: { var: 'event.reissueDate' },
              acquisitionMethod: 'PURCHASE',
              costBasis: {
                '*': [{ var: 'event.issuancePrice' }, { var: 'state.shareCount' }],
              },
            },
            // clear the consumed proposal
            pendingReissue: null,
          },
          {
            _emit: [{ name: 'TREASURY_SHARES_REISSUED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
      dependencies: [],
    },

    // ISSUED -> ISSUED (propose_retire) — phase 1 (#24): bind the executing resolution fiber and record
    // the pending retirement, so the retire transition can read the resolution's state next transition.
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'propose_retire',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingRetire: {
              retiredDate: { var: 'event.retiredDate' },
              ref: { var: 'event.boardResolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so retire can assert its state next transition
          addDependency({ var: 'event.boardResolutionRef' }),
        ],
      },
      dependencies: [],
    },

    // TREASURY -> TREASURY (propose_retire) — phase 1 (#24): the treasury-side counterpart, binding the
    // executing resolution fiber and recording the pending retirement before retire executes.
    {
      from: 'TREASURY',
      to: 'TREASURY',
      eventName: 'propose_retire',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingRetire: {
              retiredDate: { var: 'event.retiredDate' },
              ref: { var: 'event.boardResolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so retire can assert its state next transition
          addDependency({ var: 'event.boardResolutionRef' }),
        ],
      },
      dependencies: [],
    },

    // ISSUED -> RETIRED — phase 2 (#24): retire once the bound resolution is EXECUTED.
    {
      from: 'ISSUED',
      to: 'RETIRED',
      eventName: 'retire',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.issuerAddress'),
          // the proposal must match this retirement, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingRetire.retiredDate' }, { var: 'event.retiredDate' }],
          },
          depInState('state.pendingRetire.ref', 'EXECUTED'),
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'RETIRED',
            retirementDetails: {
              retiredDate: { var: 'event.retiredDate' },
              retirementMethod: { var: 'event.retirementMethod' },
              repurchasePrice: { var: 'event.repurchasePrice' },
              boardResolutionRef: { var: 'state.pendingRetire.ref' },
            },
            holder: null,
            // clear the consumed proposal
            pendingRetire: null,
          },
          {
            _emit: [{ name: 'SHARES_RETIRED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
      dependencies: [],
    },

    // TREASURY -> RETIRED — phase 2 (#24): retire once the bound resolution is EXECUTED.
    {
      from: 'TREASURY',
      to: 'RETIRED',
      eventName: 'retire',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.issuerAddress'),
          // the proposal must match this retirement, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingRetire.retiredDate' }, { var: 'event.retiredDate' }],
          },
          depInState('state.pendingRetire.ref', 'EXECUTED'),
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'RETIRED',
            retirementDetails: {
              retiredDate: { var: 'event.retiredDate' },
              retirementMethod: { var: 'event.retirementMethod' },
              repurchasePrice: { var: 'event.repurchasePrice' },
              boardResolutionRef: { var: 'state.pendingRetire.ref' },
            },
            holder: null,
            // clear the consumed proposal
            pendingRetire: null,
          },
          {
            _emit: [{ name: 'SHARES_RETIRED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
      dependencies: [],
    },

    // ISSUED -> ISSUED (stock_split)
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'stock_split',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            corporateActions: {
              merge: [
                { var: 'state.corporateActions' },
                [
                  {
                    actionId: { var: 'event.actionId' },
                    actionType: 'STOCK_SPLIT',
                    actionDate: { var: 'event.effectiveDate' },
                    ratio: { var: 'event.splitRatio' },
                    sharesBeforeAction: { var: 'state.shareCount' },
                    sharesAfterAction: { var: 'event.newShareCount' },
                    resolutionRef: { var: 'event.resolutionRef' },
                  },
                ],
              ],
            },
            shareCount: { var: 'event.newShareCount' },
          },
          {
            _emit: [{ name: 'STOCK_SPLIT_APPLIED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
    },

    // ISSUED -> ISSUED (propose_dividend) — phase 1 (#24): bind the executing resolution fiber and record
    // the pending declaration, so declare_dividend can read the resolution's state next transition.
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'propose_dividend',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            pendingDividend: {
              actionId: { var: 'event.actionId' },
              ref: { var: 'event.resolutionRef' },
              proposedAt: { var: '$ordinal' },
            },
          },
          // bind the resolution fiber so declare_dividend can assert its state next transition
          addDependency({ var: 'event.resolutionRef' }),
        ],
      },
      dependencies: [],
    },

    // ISSUED -> ISSUED (declare_dividend) — phase 2 (#24): stock dividend handling once the bound
    // resolution is EXECUTED.
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'declare_dividend',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: {
        and: [
          signerIsParty('state.issuerAddress'),
          // the proposal must target this action, and its bound resolution must be EXECUTED
          {
            '==': [{ var: 'state.pendingDividend.actionId' }, { var: 'event.actionId' }],
          },
          depInState('state.pendingDividend.ref', 'EXECUTED'),
        ],
      },
      effect: {
        if: [
          { '==': [{ var: 'event.dividendType' }, 'STOCK'] },
          {
            merge: [
              { var: 'state' },
              {
                corporateActions: {
                  merge: [
                    { var: 'state.corporateActions' },
                    [
                      {
                        actionId: { var: 'event.actionId' },
                        actionType: 'STOCK_DIVIDEND',
                        actionDate: { var: 'event.paymentDate' },
                        sharesBeforeAction: { var: 'state.shareCount' },
                        sharesAfterAction: {
                          '+': [{ var: 'state.shareCount' }, { var: 'event.stockShares' }],
                        },
                        resolutionRef: { var: 'state.pendingDividend.ref' },
                      },
                    ],
                  ],
                },
                shareCount: {
                  '+': [{ var: 'state.shareCount' }, { var: 'event.stockShares' }],
                },
                // clear the consumed proposal
                pendingDividend: null,
              },
            ],
          },
          {
            merge: [
              { var: 'state' },
              // cash dividend: no share change, but still clear the consumed proposal
              { pendingDividend: null },
            ],
          },
        ],
      },
      dependencies: [],
    },

    // ISSUED -> ISSUED (remove_restriction)
    {
      from: 'ISSUED',
      to: 'ISSUED',
      eventName: 'remove_restriction',
      // authority gate — an identity role attestation (ISSUER/BOARD_MEMBER/...) layers on additively when the identity registry lands (docs/design/app-hardening-identity-integration.md §4.2)
      guard: signerIsParty('state.issuerAddress'),
      effect: {
        merge: [
          { var: 'state' },
          {
            restrictions: {
              merge: [
                { var: 'state.restrictions' },
                {
                  restrictionType: {
                    filter: [
                      { var: 'state.restrictions.restrictionType' },
                      { '!=': [{ var: '' }, { var: 'event.restrictionType' }] },
                    ],
                  },
                  isRestricted: {
                    '>': [
                      {
                        reduce: [
                          {
                            filter: [
                              { var: 'state.restrictions.restrictionType' },
                              {
                                '!=': [{ var: '' }, { var: 'event.restrictionType' }],
                              },
                            ],
                          },
                          { '+': [{ var: 'accumulator' }, 1] },
                          0,
                        ],
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
          {
            _emit: [{ name: 'RESTRICTION_REMOVED', data: { var: 'event' }, destination: 'external' }],
          },
        ],
      },
    },
  ],
});

// Derived types for consumers
export type CorpSecuritiesState = keyof typeof corpSecuritiesDef.states;
export type CorpSecuritiesEvent = (typeof corpSecuritiesDef.transitions)[number]['eventName'];
