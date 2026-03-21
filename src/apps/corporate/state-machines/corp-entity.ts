import { defineFiberApp } from '../../../schema/fiber-app.js';

/**
 * Master corporate record tracking the lifecycle of a business entity from incorporation through dissolution.
 * Manages legal identity, share structure, and corporate status.
 */
export const corpEntityDef = defineFiberApp({
  metadata: {
    name: 'CorpEntity',
    app: 'corporate',
    type: 'entity',
    version: '1.0.0',
    description: 'Master corporate record tracking the lifecycle of a business entity from incorporation through dissolution. Manages legal identity, share structure, and corporate status.',
  },

  createSchema: {
    required: ['entityId', 'legalName', 'entityType', 'jurisdiction'] as const,
    properties: {
      entityId: {
        type: 'string',
        description: 'Unique identifier for this corporate entity',
        immutable: true,
      },
      legalName: {
        type: 'string',
        description: 'Full legal name of the corporation',
      },
      tradeName: {
        type: 'string',
        nullable: true,
        description: 'DBA or trade name if different',
      },
      entityType: {
        type: 'string',
        enum: ['C_CORP', 'S_CORP', 'B_CORP', 'LLC', 'LP', 'LLP'] as const,
        description: 'Legal entity type',
      },
      jurisdiction: {
        type: 'object',
        properties: {
          state: { type: 'string', description: 'State of incorporation (e.g., DE, NV, WY)' },
          country: { type: 'string', default: 'USA' },
          foreignQualifications: {
            type: 'array',
            items: { type: 'string' },
            description: 'States where foreign qualified to do business',
          },
        },
      },
      fiscalYearEnd: {
        type: 'string',
        description: 'Fiscal year end (MM-DD format)',
      },
      registeredAgent: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { type: 'object' },
          phone: { type: 'string' },
          email: { type: 'string' },
          effectiveDate: { type: 'string', format: 'date' },
        },
      },
      principalOffice: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zip: { type: 'string' },
          country: { type: 'string', default: 'USA' },
        },
      },
      shareStructure: {
        type: 'object',
        properties: {
          classes: {
            type: 'array',
            items: { $ref: '#/definitions/ShareClass' },
          },
          totalAuthorized: { type: 'integer', description: 'Sum of all authorized shares' },
          totalIssued: { type: 'integer' },
          totalOutstanding: { type: 'integer' },
        },
      },
      incorporators: {
        type: 'array',
        items: { $ref: '#/definitions/Incorporator' },
      },
      ein: {
        type: 'string',
        nullable: true,
        description: 'Federal EIN',
      },
      stateIds: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'State-specific entity IDs keyed by state code',
      },
    },
  },

  stateSchema: {
    properties: {
      entityId: { type: 'string', immutable: true },
      legalName: { type: 'string' },
      tradeName: { type: 'string', nullable: true },
      entityType: { type: 'string' },
      jurisdiction: { type: 'object' },
      formationDate: { type: 'string', format: 'date', computed: true },
      fiscalYearEnd: { type: 'string' },
      registeredAgent: { type: 'object' },
      principalOffice: { type: 'object' },
      shareStructure: { type: 'object' },
      incorporators: { type: 'array' },
      ein: { type: 'string', nullable: true },
      stateIds: { type: 'object' },
      status: {
        type: 'string',
        enum: ['INCORPORATING', 'ACTIVE', 'SUSPENDED', 'DISSOLVED'] as const,
        computed: true,
      },
      suspensionReason: { type: 'string', nullable: true, computed: true },
      suspensionDate: { type: 'string', format: 'date', nullable: true, computed: true },
      dissolutionDate: { type: 'string', format: 'date', nullable: true, computed: true },
      dissolutionReason: { type: 'string', nullable: true, computed: true },
      charterAmendments: {
        type: 'array',
        items: { $ref: '#/definitions/CharterAmendment' },
        computed: true,
      },
      createdAt: { type: 'timestamp', computed: true },
      updatedAt: { type: 'timestamp', computed: true },
    },
  },

  eventSchemas: {
    incorporate: {
      description: 'State approves articles of incorporation, corporation comes into existence',
      required: ['approvalDate', 'stateFileNumber'] as const,
      properties: {
        approvalDate: { type: 'string', format: 'date' },
        stateFileNumber: { type: 'string' },
        certificateOfIncorporation: { type: 'string', description: 'Document reference' },
      },
    },
    amend_charter: {
      description: 'Amend the certificate/articles of incorporation (requires shareholder approval for most amendments)',
      required: ['amendmentId', 'description', 'amendmentType', 'resolutionRef', 'effectiveDate', 'filedDate'] as const,
      properties: {
        amendmentId: { type: 'string' },
        description: { type: 'string' },
        amendmentType: {
          type: 'string',
          enum: ['NAME_CHANGE', 'SHARE_AUTHORIZATION', 'PURPOSE_CHANGE', 'OTHER'] as const,
        },
        resolutionRef: { type: 'string', description: 'Reference to board/shareholder resolution' },
        effectiveDate: { type: 'string', format: 'date' },
        filedDate: { type: 'string', format: 'date' },
        newShareAuthorization: { type: 'object', nullable: true, description: 'If increasing/changing authorized shares' },
        newLegalName: { type: 'string', nullable: true },
      },
    },
    update_share_class: {
      description: 'Update authorized shares for an existing class or add new class (requires charter amendment)',
      required: ['classId', 'className', 'authorized', 'parValue', 'votingRights', 'charterAmendmentRef'] as const,
      properties: {
        classId: { type: 'string' },
        className: { type: 'string' },
        authorized: { type: 'integer' },
        parValue: { type: 'number' },
        votingRights: { type: 'boolean' },
        votesPerShare: { type: 'number', default: 1 },
        liquidationPreference: { type: 'number', nullable: true },
        dividendRate: { type: 'number', nullable: true },
        convertible: { type: 'boolean', default: false },
        charterAmendmentRef: { type: 'string' },
      },
    },
    update_registered_agent: {
      description: 'Change the registered agent on file with the state',
      required: ['name', 'address', 'effectiveDate'] as const,
      properties: {
        name: { type: 'string' },
        address: { type: 'object' },
        phone: { type: 'string' },
        email: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date' },
        filingConfirmation: { type: 'string', description: 'State filing confirmation number' },
      },
    },
    suspend: {
      description: 'State suspends corporate powers (typically for tax/filing noncompliance)',
      required: ['reason', 'suspensionDate'] as const,
      properties: {
        reason: {
          type: 'string',
          enum: ['FRANCHISE_TAX_DELINQUENT', 'ANNUAL_REPORT_MISSING', 'REGISTERED_AGENT_LAPSE', 'ADMINISTRATIVE', 'OTHER'] as const,
        },
        suspensionDate: { type: 'string', format: 'date' },
        stateNotice: { type: 'string', description: 'Reference to state notice' },
        cureDeadline: { type: 'string', format: 'date', nullable: true },
      },
    },
    reinstate: {
      description: 'Cure deficiencies and reinstate corporate powers',
      required: ['reinstatementDate', 'curativeActions', 'stateConfirmation'] as const,
      properties: {
        reinstatementDate: { type: 'string', format: 'date' },
        curativeActions: { type: 'array', items: { type: 'string' }, description: 'List of actions taken to cure' },
        stateConfirmation: { type: 'string' },
        penaltiesPaid: { type: 'number', nullable: true },
      },
    },
    dissolve_voluntary: {
      description: 'Voluntary dissolution approved by board and shareholders',
      required: ['dissolutionDate', 'boardResolutionRef', 'shareholderResolutionRef'] as const,
      properties: {
        dissolutionDate: { type: 'string', format: 'date' },
        boardResolutionRef: { type: 'string' },
        shareholderResolutionRef: { type: 'string' },
        windingUpPlan: { type: 'string', description: 'Reference to winding up plan' },
        certificateOfDissolution: { type: 'string' },
      },
    },
    dissolve_administrative: {
      description: 'Administrative dissolution by state after prolonged suspension',
      required: ['dissolutionDate', 'stateOrder', 'reason'] as const,
      properties: {
        dissolutionDate: { type: 'string', format: 'date' },
        stateOrder: { type: 'string' },
        reason: { type: 'string' },
      },
    },
  },

  definitions: {
    ShareClass: {
      type: 'object',
      properties: {
        className: { type: 'string', description: 'e.g., Common, Series A Preferred' },
        classId: { type: 'string' },
        authorized: { type: 'integer', description: 'Total shares authorized' },
        issued: { type: 'integer', description: 'Shares currently issued' },
        outstanding: { type: 'integer', description: 'Issued minus treasury' },
        treasury: { type: 'integer', description: 'Shares held by company' },
        parValue: { type: 'number', description: 'Par value per share' },
        votingRights: { type: 'boolean', description: 'Whether class has voting rights' },
        votesPerShare: { type: 'number', default: 1 },
        liquidationPreference: { type: 'number', nullable: true, description: 'Liquidation preference multiple' },
        dividendRate: { type: 'number', nullable: true, description: 'Annual dividend rate %' },
        convertible: { type: 'boolean', default: false },
        conversionRatio: { type: 'number', nullable: true },
        antidilution: {
          type: 'string',
          enum: ['NONE', 'BROAD_BASED', 'NARROW_BASED', 'FULL_RATCHET'] as const,
          nullable: true,
        },
      },
    },
    Incorporator: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { type: 'object' },
        signatureDate: { type: 'string', format: 'date' },
      },
    },
    CharterAmendment: {
      type: 'object',
      properties: {
        amendmentId: { type: 'string' },
        description: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date' },
        resolutionRef: { type: 'string', description: 'Reference to approving resolution' },
        filedDate: { type: 'string', format: 'date' },
      },
    },
  },

  states: {
    INCORPORATING: { id: 'INCORPORATING', isFinal: false, description: 'Initial state during formation process. Articles filed but not yet approved by state.' },
    ACTIVE: { id: 'ACTIVE', isFinal: false, description: 'Corporation is in good standing and authorized to conduct business.' },
    SUSPENDED: { id: 'SUSPENDED', isFinal: false, description: 'Corporate powers suspended due to compliance failure (tax, filings, etc). Can be reinstated.' },
    DISSOLVED: { id: 'DISSOLVED', isFinal: true, description: 'Corporation has been legally dissolved. Terminal state.' },
  },

  initialState: 'INCORPORATING',

  transitions: [
    // INCORPORATING -> ACTIVE
    {
      from: 'INCORPORATING',
      to: 'ACTIVE',
      eventName: 'incorporate',
      guard: {
        and: [
          { '!=': [{ var: 'state.legalName' }, null] },
          { '!=': [{ var: 'state.jurisdiction.state' }, null] },
          { '!=': [{ var: 'state.registeredAgent' }, null] },
          { '>': [{ var: 'state.incorporators.length' }, 0] },
          { '>': [{ var: 'state.shareStructure.classes.length' }, 0] },
          { '>': [{ var: 'state.shareStructure.totalAuthorized' }, 0] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            formationDate: { var: 'event.approvalDate' },
            updatedAt: { var: '$timestamp' },
          },
        ],
      },
      emits: ['CORPORATION_FORMED'],
    },

    // ACTIVE -> ACTIVE (amend_charter)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'amend_charter',
      guard: { '!=': [{ var: 'event.resolutionRef' }, null] },
      dependencies: [
        {
          machine: 'corporate-resolution',
          instanceRef: { var: 'event.resolutionRef' },
          requiredState: 'EXECUTED',
        },
      ],
      effect: {
        merge: [
          { var: 'state' },
          {
            charterAmendments: {
              cat: [
                { var: 'state.charterAmendments' },
                [
                  {
                    amendmentId: { var: 'event.amendmentId' },
                    description: { var: 'event.description' },
                    effectiveDate: { var: 'event.effectiveDate' },
                    resolutionRef: { var: 'event.resolutionRef' },
                    filedDate: { var: 'event.filedDate' },
                  },
                ],
              ],
            },
            legalName: {
              if: [
                { '!=': [{ var: 'event.newLegalName' }, null] },
                { var: 'event.newLegalName' },
                { var: 'state.legalName' },
              ],
            },
            updatedAt: { var: '$timestamp' },
          },
        ],
      },
      emits: ['CHARTER_AMENDED'],
    },

    // ACTIVE -> ACTIVE (update_share_class)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'update_share_class',
      guard: {
        some: [
          { var: 'state.charterAmendments' },
          { '==': [{ var: '.amendmentId' }, { var: 'event.charterAmendmentRef' }] },
        ],
      },
      effect: {
        merge: [
          { var: 'state' },
          {
            shareStructure: {
              merge: [
                { var: 'state.shareStructure' },
                {
                  classes: {
                    map: [
                      { var: 'state.shareStructure.classes' },
                      {
                        if: [
                          { '==': [{ var: '.classId' }, { var: 'event.classId' }] },
                          {
                            classId: { var: 'event.classId' },
                            className: { var: 'event.className' },
                            authorized: { var: 'event.authorized' },
                            issued: 0,
                            outstanding: 0,
                            treasury: 0,
                            parValue: { var: 'event.parValue' },
                            votingRights: { var: 'event.votingRights' },
                            votesPerShare: { var: 'event.votesPerShare' },
                            liquidationPreference: { var: 'event.liquidationPreference' },
                            dividendRate: { var: 'event.dividendRate' },
                            convertible: { var: 'event.convertible' },
                          },
                          { var: '' },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },

    // ACTIVE -> ACTIVE (update_registered_agent)
    {
      from: 'ACTIVE',
      to: 'ACTIVE',
      eventName: 'update_registered_agent',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            registeredAgent: {
              name: { var: 'event.name' },
              address: { var: 'event.address' },
              phone: { var: 'event.phone' },
              email: { var: 'event.email' },
              effectiveDate: { var: 'event.effectiveDate' },
            },
          },
        ],
      },
      emits: ['REGISTERED_AGENT_CHANGED'],
    },

    // ACTIVE -> SUSPENDED
    {
      from: 'ACTIVE',
      to: 'SUSPENDED',
      eventName: 'suspend',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'SUSPENDED',
            suspensionReason: { var: 'event.reason' },
            suspensionDate: { var: 'event.suspensionDate' },
          },
        ],
      },
      emits: ['CORPORATION_SUSPENDED'],
    },

    // SUSPENDED -> ACTIVE
    {
      from: 'SUSPENDED',
      to: 'ACTIVE',
      eventName: 'reinstate',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'ACTIVE',
            suspensionReason: null,
            suspensionDate: null,
          },
        ],
      },
      emits: ['CORPORATION_REINSTATED'],
    },

    // ACTIVE -> DISSOLVED (voluntary)
    {
      from: 'ACTIVE',
      to: 'DISSOLVED',
      eventName: 'dissolve_voluntary',
      guard: { '==': [1, 1] },
      dependencies: [
        {
          machine: 'corporate-resolution',
          instanceRef: { var: 'event.boardResolutionRef' },
          requiredState: 'EXECUTED',
        },
        {
          machine: 'corporate-resolution',
          instanceRef: { var: 'event.shareholderResolutionRef' },
          requiredState: 'EXECUTED',
        },
      ],
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISSOLVED',
            dissolutionDate: { var: 'event.dissolutionDate' },
            dissolutionReason: 'VOLUNTARY',
          },
        ],
      },
      emits: ['CORPORATION_DISSOLVED'],
    },

    // SUSPENDED -> DISSOLVED (administrative)
    {
      from: 'SUSPENDED',
      to: 'DISSOLVED',
      eventName: 'dissolve_administrative',
      guard: { '==': [1, 1] },
      effect: {
        merge: [
          { var: 'state' },
          {
            status: 'DISSOLVED',
            dissolutionDate: { var: 'event.dissolutionDate' },
            dissolutionReason: { cat: ['ADMINISTRATIVE: ', { var: 'event.reason' }] },
          },
        ],
      },
      emits: ['CORPORATION_DISSOLVED'],
    },
  ],

  crossReferences: {
    board: { machine: 'corporate-board', description: 'Board of directors for this entity', foreignKey: 'entityId' },
    officers: { machine: 'corporate-officers', description: 'Executive officers for this entity', foreignKey: 'entityId' },
    bylaws: { machine: 'corporate-bylaws', description: 'Governing bylaws for this entity', foreignKey: 'entityId' },
    shareholders: { machine: 'corporate-shareholders', description: 'Shareholder meeting instances', foreignKey: 'entityId' },
    securities: { machine: 'corporate-securities', description: 'Stock issuance records', foreignKey: 'entityId' },
    compliance: { machine: 'corporate-compliance', description: 'Regulatory compliance tracking', foreignKey: 'entityId' },
  },
});

// Derived types for consumers
export type CorpEntityState = keyof typeof corpEntityDef.states;
export type CorpEntityEvent = typeof corpEntityDef.transitions[number]['eventName'];
