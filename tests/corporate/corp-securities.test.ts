import { corpSecuritiesDef } from '../../src/apps/corporate/state-machines/corp-securities.js';

describe('CorpSecurities State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(corpSecuritiesDef).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(corpSecuritiesDef.metadata.name).toBe('CorpSecurities');
      expect(corpSecuritiesDef.metadata.app).toBe('corporate');
      expect(corpSecuritiesDef.metadata.type).toBe('securities');
      expect(corpSecuritiesDef.metadata.version).toBe('1.0.0');
    });

    it('should have a description', () => {
      expect(corpSecuritiesDef.metadata.description).toContain('Securities state machine');
    });
  });

  describe('States', () => {
    it('should define all required states', () => {
      const expectedStates = ['AUTHORIZED', 'ISSUED', 'TREASURY', 'TRANSFERRED', 'RETIRED'];
      const actualStates = Object.keys(corpSecuritiesDef.states);
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(corpSecuritiesDef.initialState).toBe('AUTHORIZED');
    });

    it('should mark RETIRED as final state', () => {
      expect(corpSecuritiesDef.states.RETIRED.isFinal).toBe(true);
    });

    it('should mark non-terminal states as non-final', () => {
      expect(corpSecuritiesDef.states.AUTHORIZED.isFinal).toBe(false);
      expect(corpSecuritiesDef.states.ISSUED.isFinal).toBe(false);
      expect(corpSecuritiesDef.states.TREASURY.isFinal).toBe(false);
      expect(corpSecuritiesDef.states.TRANSFERRED.isFinal).toBe(false);
    });

    it('should have descriptions for all states', () => {
      Object.values(corpSecuritiesDef.states).forEach(state => {
        expect(state.description).toBeDefined();
        expect(state.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Transitions', () => {
    it('should allow authorize_shares transition from AUTHORIZED to AUTHORIZED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'AUTHORIZED' && t.to === 'AUTHORIZED' && t.eventName === 'authorize_shares'
      );
      expect(transition).toBeDefined();
    });

    it('should allow issue_shares transition from AUTHORIZED to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'AUTHORIZED' && t.to === 'ISSUED' && t.eventName === 'issue_shares'
      );
      expect(transition).toBeDefined();
    });

    it('should allow initiate_transfer transition from ISSUED to TRANSFERRED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'TRANSFERRED' && t.eventName === 'initiate_transfer'
      );
      expect(transition).toBeDefined();
    });

    it('should allow complete_transfer transition from TRANSFERRED to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'TRANSFERRED' && t.to === 'ISSUED' && t.eventName === 'complete_transfer'
      );
      expect(transition).toBeDefined();
    });

    it('should allow repurchase transition from ISSUED to TREASURY', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'TREASURY' && t.eventName === 'repurchase'
      );
      expect(transition).toBeDefined();
    });

    it('should allow reissue_from_treasury transition from TREASURY to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'TREASURY' && t.to === 'ISSUED' && t.eventName === 'reissue_from_treasury'
      );
      expect(transition).toBeDefined();
    });

    it('should allow retire transition from ISSUED to RETIRED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'RETIRED' && t.eventName === 'retire'
      );
      expect(transition).toBeDefined();
    });

    it('should allow retire transition from TREASURY to RETIRED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'TREASURY' && t.to === 'RETIRED' && t.eventName === 'retire'
      );
      expect(transition).toBeDefined();
    });

    it('should allow stock_split transition from ISSUED to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'ISSUED' && t.eventName === 'stock_split'
      );
      expect(transition).toBeDefined();
    });

    it('should allow declare_dividend transition from ISSUED to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'ISSUED' && t.eventName === 'declare_dividend'
      );
      expect(transition).toBeDefined();
    });

    it('should allow remove_restriction transition from ISSUED to ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.to === 'ISSUED' && t.eventName === 'remove_restriction'
      );
      expect(transition).toBeDefined();
    });
  });

  describe('Transition Guards and Effects', () => {
    it('should have guard on issue_shares transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'issue_shares'
      );
      expect(transition?.guard).toBeDefined();
    });

    it('should have effect on issue_shares transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'issue_shares'
      );
      expect(transition?.effect).toBeDefined();
    });

    it('should have guard on initiate_transfer transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'initiate_transfer'
      );
      expect(transition?.guard).toBeDefined();
    });

    it('should emit SHARES_ISSUED on issue_shares', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'issue_shares'
      );
      expect(transition?.emits).toContain('SHARES_ISSUED');
    });

    it('should emit TRANSFER_INITIATED on initiate_transfer', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'initiate_transfer'
      );
      expect(transition?.emits).toContain('TRANSFER_INITIATED');
    });

    it('should emit TRANSFER_COMPLETED on complete_transfer', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'complete_transfer'
      );
      expect(transition?.emits).toContain('TRANSFER_COMPLETED');
    });

    it('should emit SHARES_REPURCHASED on repurchase', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'repurchase'
      );
      expect(transition?.emits).toContain('SHARES_REPURCHASED');
    });

    it('should emit TREASURY_SHARES_REISSUED on reissue_from_treasury', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'reissue_from_treasury'
      );
      expect(transition?.emits).toContain('TREASURY_SHARES_REISSUED');
    });

    it('should emit SHARES_RETIRED on retire', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.eventName === 'retire'
      );
      expect(transition?.emits).toContain('SHARES_RETIRED');
    });

    it('should emit STOCK_SPLIT_APPLIED on stock_split', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'stock_split'
      );
      expect(transition?.emits).toContain('STOCK_SPLIT_APPLIED');
    });

    it('should emit RESTRICTION_REMOVED on remove_restriction', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'remove_restriction'
      );
      expect(transition?.emits).toContain('RESTRICTION_REMOVED');
    });
  });

  describe('Cross References', () => {
    it('should define cross references in metadata', () => {
      expect(corpSecuritiesDef.metadata.crossReferences).toBeDefined();
    });

    it('should reference entity machine', () => {
      expect(corpSecuritiesDef.metadata.crossReferences?.entity).toBeDefined();
      expect(corpSecuritiesDef.metadata.crossReferences?.entity.machine).toBe('corporate-entity');
    });

    it('should reference resolutions machine', () => {
      expect(corpSecuritiesDef.metadata.crossReferences?.resolutions).toBeDefined();
      expect(corpSecuritiesDef.metadata.crossReferences?.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference shareholders machine', () => {
      expect(corpSecuritiesDef.metadata.crossReferences?.shareholders).toBeDefined();
      expect(corpSecuritiesDef.metadata.crossReferences?.shareholders.machine).toBe('corporate-shareholders');
    });
  });

  describe('Schema Validation', () => {
    it('should define createSchema with required fields', () => {
      expect(corpSecuritiesDef.createSchema).toBeDefined();
      expect(corpSecuritiesDef.createSchema.required).toContain('securityId');
      expect(corpSecuritiesDef.createSchema.required).toContain('entityId');
      expect(corpSecuritiesDef.createSchema.required).toContain('shareClass');
      expect(corpSecuritiesDef.createSchema.required).toContain('shareClassName');
      expect(corpSecuritiesDef.createSchema.required).toContain('shareCount');
      expect(corpSecuritiesDef.createSchema.required).toContain('parValue');
    });

    it('should define stateSchema properties', () => {
      expect(corpSecuritiesDef.stateSchema).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.securityId).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.entityId).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.shareClass).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.shareCount).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.holder).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.restrictions).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.status).toBeDefined();
    });

    it('should mark securityId as immutable in stateSchema', () => {
      expect(corpSecuritiesDef.stateSchema.properties.securityId.immutable).toBe(true);
    });

    it('should mark entityId as immutable in stateSchema', () => {
      expect(corpSecuritiesDef.stateSchema.properties.entityId.immutable).toBe(true);
    });

    it('should mark status as computed in stateSchema', () => {
      expect(corpSecuritiesDef.stateSchema.properties.status.computed).toBe(true);
    });

    it('should define eventSchemas for all events', () => {
      expect(corpSecuritiesDef.eventSchemas).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.authorize_shares).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.issue_shares).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.initiate_transfer).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.complete_transfer).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.repurchase).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.reissue_from_treasury).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.retire).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.stock_split).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.declare_dividend).toBeDefined();
      expect(corpSecuritiesDef.eventSchemas.remove_restriction).toBeDefined();
    });

    it('should have required fields for authorize_shares event', () => {
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('securityId');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('entityId');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('shareClass');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('shareClassName');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('shareCount');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('parValue');
      expect(corpSecuritiesDef.eventSchemas.authorize_shares.required).toContain('authorizedDate');
    });

    it('should have required fields for issue_shares event', () => {
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('holderId');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('holderType');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('holderName');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('issuanceDate');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('form');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('boardResolutionRef');
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('consideration');
    });

    it('should have required fields for retire event', () => {
      expect(corpSecuritiesDef.eventSchemas.retire.required).toContain('retiredDate');
      expect(corpSecuritiesDef.eventSchemas.retire.required).toContain('retirementMethod');
      expect(corpSecuritiesDef.eventSchemas.retire.required).toContain('boardResolutionRef');
    });

    it('should have required fields for stock_split event', () => {
      expect(corpSecuritiesDef.eventSchemas.stock_split.required).toContain('actionId');
      expect(corpSecuritiesDef.eventSchemas.stock_split.required).toContain('splitRatio');
      expect(corpSecuritiesDef.eventSchemas.stock_split.required).toContain('effectiveDate');
      expect(corpSecuritiesDef.eventSchemas.stock_split.required).toContain('resolutionRef');
      expect(corpSecuritiesDef.eventSchemas.stock_split.required).toContain('newShareCount');
    });
  });

  describe('Definitions', () => {
    it('should define Holder type', () => {
      expect(corpSecuritiesDef.definitions?.Holder).toBeDefined();
    });

    it('should define Restrictions type', () => {
      expect(corpSecuritiesDef.definitions?.Restrictions).toBeDefined();
    });

    it('should define Authorization type', () => {
      expect(corpSecuritiesDef.definitions?.Authorization).toBeDefined();
    });

    it('should define IssuanceDetails type', () => {
      expect(corpSecuritiesDef.definitions?.IssuanceDetails).toBeDefined();
    });

    it('should define TransferRecord type', () => {
      expect(corpSecuritiesDef.definitions?.TransferRecord).toBeDefined();
    });

    it('should define CorporateAction type', () => {
      expect(corpSecuritiesDef.definitions?.CorporateAction).toBeDefined();
    });

    it('should define RetirementDetails type', () => {
      expect(corpSecuritiesDef.definitions?.RetirementDetails).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have dependencies on issue_shares transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'issue_shares'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should have dependencies on repurchase transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'repurchase'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should have dependencies on reissue_from_treasury transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'reissue_from_treasury'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should have dependencies on retire transition from ISSUED', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.from === 'ISSUED' && t.eventName === 'retire'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should have dependencies on declare_dividend transition', () => {
      const transition = corpSecuritiesDef.transitions.find(
        t => t.eventName === 'declare_dividend'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });
  });
});
