/**
 * Tests for CorpSecurities state machine
 */

import { corpSecuritiesDef } from '../../src/apps/corporate/state-machines/index';

describe('CorpSecurities State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(corpSecuritiesDef).toBeDefined();
      expect(typeof corpSecuritiesDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(corpSecuritiesDef.name).toBe('CorpSecurities');
      expect(corpSecuritiesDef.description).toContain('Securities');
      expect(corpSecuritiesDef.version).toBe('1.0.0');
      expect(corpSecuritiesDef.category).toBe('corporate-governance');
    });

    it('should have correct states', () => {
      const expectedStates = [
        'AUTHORIZED',
        'ISSUED',
        'TREASURY',
        'TRANSFERRED',
        'RETIRED',
      ];
      const actualStates = Object.keys(corpSecuritiesDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(5);
    });

    it('should have correct initial state', () => {
      expect(corpSecuritiesDef.initialState).toBe('AUTHORIZED');
    });

    it('should have RETIRED as terminal state', () => {
      expect(corpSecuritiesDef.states.RETIRED.terminal).toBe(true);
    });
  });

  describe('Authorization and Issuance Transitions', () => {
    it('should allow authorize_shares transition', () => {
      const transition = corpSecuritiesDef.transitions.authorize_shares;
      expect(transition).toBeDefined();
      expect(transition.from).toBe(null);
      expect(transition.to).toBe('AUTHORIZED');
    });

    it('should allow issue_shares transition', () => {
      const transition = corpSecuritiesDef.transitions.issue_shares;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('AUTHORIZED');
      expect(transition.to).toBe('ISSUED');
    });
  });

  describe('Transfer Transitions', () => {
    it('should allow initiate_transfer transition', () => {
      const transition = corpSecuritiesDef.transitions.initiate_transfer;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ISSUED');
      expect(transition.to).toBe('TRANSFERRED');
    });

    it('should allow complete_transfer transition', () => {
      const transition = corpSecuritiesDef.transitions.complete_transfer;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('TRANSFERRED');
      expect(transition.to).toBe('ISSUED');
    });
  });

  describe('Treasury Transitions', () => {
    it('should allow repurchase transition', () => {
      const transition = corpSecuritiesDef.transitions.repurchase;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ISSUED');
      expect(transition.to).toBe('TREASURY');
    });

    it('should allow reissue_from_treasury transition', () => {
      const transition = corpSecuritiesDef.transitions.reissue_from_treasury;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('TREASURY');
      expect(transition.to).toBe('ISSUED');
    });
  });

  describe('Retirement Transitions', () => {
    it('should allow retire transition from multiple states', () => {
      const transition = corpSecuritiesDef.transitions.retire;
      expect(transition).toBeDefined();
      expect(transition.from).toContain('ISSUED');
      expect(transition.from).toContain('TREASURY');
      expect(transition.to).toBe('RETIRED');
    });
  });

  describe('Corporate Action Transitions', () => {
    it('should allow stock_split transition', () => {
      const transition = corpSecuritiesDef.transitions.stock_split;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ISSUED');
      expect(transition.to).toBe('ISSUED');
    });

    it('should allow declare_dividend transition', () => {
      const transition = corpSecuritiesDef.transitions.declare_dividend;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ISSUED');
      expect(transition.to).toBe('ISSUED');
    });

    it('should allow remove_restriction transition', () => {
      const transition = corpSecuritiesDef.transitions.remove_restriction;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ISSUED');
      expect(transition.to).toBe('ISSUED');
    });
  });

  describe('Event Payloads', () => {
    it('should require share details for authorize_shares', () => {
      const event = corpSecuritiesDef.transitions.authorize_shares.event;
      expect(event.name).toBe('authorize_shares');
      expect(event.payload.securityId.required).toBe(true);
      expect(event.payload.entityId.required).toBe(true);
      expect(event.payload.shareClass.required).toBe(true);
      expect(event.payload.shareCount.required).toBe(true);
      expect(event.payload.parValue.required).toBe(true);
    });

    it('should require holder details for issue_shares', () => {
      const event = corpSecuritiesDef.transitions.issue_shares.event;
      expect(event.name).toBe('issue_shares');
      expect(event.payload.holderId.required).toBe(true);
      expect(event.payload.holderType.required).toBe(true);
      expect(event.payload.holderName.required).toBe(true);
      expect(event.payload.issuanceDate.required).toBe(true);
      expect(event.payload.form.required).toBe(true);
      expect(event.payload.boardResolutionRef.required).toBe(true);
    });

    it('should support security form types', () => {
      const event = corpSecuritiesDef.transitions.issue_shares.event;
      expect(event.payload.form.enum).toContain('CERTIFICATED');
      expect(event.payload.form.enum).toContain('BOOK_ENTRY');
      expect(event.payload.form.enum).toContain('DRS');
    });

    it('should require transfer details for initiate_transfer', () => {
      const event = corpSecuritiesDef.transitions.initiate_transfer.event;
      expect(event.name).toBe('initiate_transfer');
      expect(event.payload.transferId.required).toBe(true);
      expect(event.payload.toHolderId.required).toBe(true);
      expect(event.payload.toHolderName.required).toBe(true);
      expect(event.payload.transferType.required).toBe(true);
      expect(event.payload.transferDate.required).toBe(true);
    });

    it('should support dividend types', () => {
      const event = corpSecuritiesDef.transitions.declare_dividend.event;
      expect(event.payload.dividendType.enum).toContain('CASH');
      expect(event.payload.dividendType.enum).toContain('STOCK');
    });
  });

  describe('Guards', () => {
    it('should guard issue_shares with resolution and entity state', () => {
      const guards = corpSecuritiesDef.transitions.issue_shares.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasIssuanceResolution');
      expect(guardNames).toContain('entityIsActive');
    });

    it('should guard initiate_transfer for restrictions', () => {
      const guards = corpSecuritiesDef.transitions.initiate_transfer.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('restrictionsCleared');
      expect(guardNames).toContain('rofrSatisfied');
    });

    it('should guard repurchase with resolution', () => {
      const guards = corpSecuritiesDef.transitions.repurchase.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasRepurchaseResolution');
    });

    it('should guard retire with resolution', () => {
      const guards = corpSecuritiesDef.transitions.retire.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasRetirementResolution');
    });

    it('should guard declare_dividend with resolution', () => {
      const guards = corpSecuritiesDef.transitions.declare_dividend.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasDividendResolution');
    });
  });

  describe('Effects', () => {
    it('should emit SHARES_ISSUED event', () => {
      const effects = corpSecuritiesDef.transitions.issue_shares.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('SHARES_ISSUED');
    });

    it('should emit TRANSFER_INITIATED event', () => {
      const effects = corpSecuritiesDef.transitions.initiate_transfer.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('TRANSFER_INITIATED');
    });

    it('should emit TRANSFER_COMPLETED event', () => {
      const effects = corpSecuritiesDef.transitions.complete_transfer.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('TRANSFER_COMPLETED');
    });

    it('should emit SHARES_REPURCHASED event', () => {
      const effects = corpSecuritiesDef.transitions.repurchase.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('SHARES_REPURCHASED');
    });

    it('should emit TREASURY_SHARES_REISSUED event', () => {
      const effects = corpSecuritiesDef.transitions.reissue_from_treasury.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('TREASURY_SHARES_REISSUED');
    });

    it('should emit SHARES_RETIRED event', () => {
      const effects = corpSecuritiesDef.transitions.retire.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('SHARES_RETIRED');
    });

    it('should emit STOCK_SPLIT_APPLIED event', () => {
      const effects = corpSecuritiesDef.transitions.stock_split.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('STOCK_SPLIT_APPLIED');
    });

    it('should emit RESTRICTION_REMOVED event', () => {
      const effects = corpSecuritiesDef.transitions.remove_restriction.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('RESTRICTION_REMOVED');
    });
  });

  describe('Context Schema', () => {
    it('should have securityId field', () => {
      expect(corpSecuritiesDef.context.securityId).toBeDefined();
      expect(corpSecuritiesDef.context.securityId.type).toBe('string');
    });

    it('should have entityId field', () => {
      expect(corpSecuritiesDef.context.entityId).toBeDefined();
      expect(corpSecuritiesDef.context.entityId.type).toBe('string');
    });

    it('should have shareClass field', () => {
      expect(corpSecuritiesDef.context.shareClass).toBeDefined();
      expect(corpSecuritiesDef.context.shareClass.type).toBe('string');
    });

    it('should have shareCount field', () => {
      expect(corpSecuritiesDef.context.shareCount).toBeDefined();
      expect(corpSecuritiesDef.context.shareCount.type).toBe('integer');
    });

    it('should have holder object', () => {
      expect(corpSecuritiesDef.context.holder).toBeDefined();
      expect(corpSecuritiesDef.context.holder.nullable).toBe(true);
    });

    it('should have restrictions object', () => {
      expect(corpSecuritiesDef.context.restrictions).toBeDefined();
      expect(corpSecuritiesDef.context.restrictions.type).toBe('object');
    });

    it('should support restriction types', () => {
      const restrictionTypes =
        corpSecuritiesDef.context.restrictions.properties.restrictionType.items.enum;
      expect(restrictionTypes).toContain('RULE_144');
      expect(restrictionTypes).toContain('REG_D');
      expect(restrictionTypes).toContain('LOCK_UP');
      expect(restrictionTypes).toContain('VESTING');
      expect(restrictionTypes).toContain('RIGHT_OF_FIRST_REFUSAL');
    });

    it('should have transferHistory array', () => {
      expect(corpSecuritiesDef.context.transferHistory).toBeDefined();
      expect(corpSecuritiesDef.context.transferHistory.type).toBe('array');
    });

    it('should have corporateActions array', () => {
      expect(corpSecuritiesDef.context.corporateActions).toBeDefined();
      expect(corpSecuritiesDef.context.corporateActions.type).toBe('array');
    });

    it('should support corporate action types', () => {
      const actionTypes =
        corpSecuritiesDef.context.corporateActions.items.properties.actionType.enum;
      expect(actionTypes).toContain('STOCK_SPLIT');
      expect(actionTypes).toContain('REVERSE_SPLIT');
      expect(actionTypes).toContain('STOCK_DIVIDEND');
      expect(actionTypes).toContain('CONVERSION');
      expect(actionTypes).toContain('RECLASSIFICATION');
    });
  });

  describe('Cross-Machine References', () => {
    it('should reference corporate-entity', () => {
      expect(corpSecuritiesDef.crossMachineRefs.entity).toBeDefined();
      expect(corpSecuritiesDef.crossMachineRefs.entity.machine).toBe('corporate-entity');
    });

    it('should reference corporate-resolution', () => {
      expect(corpSecuritiesDef.crossMachineRefs.resolutions).toBeDefined();
      expect(corpSecuritiesDef.crossMachineRefs.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference corporate-shareholders', () => {
      expect(corpSecuritiesDef.crossMachineRefs.shareholders).toBeDefined();
      expect(corpSecuritiesDef.crossMachineRefs.shareholders.machine).toBe('corporate-shareholders');
    });
  });

  describe('Metadata', () => {
    it('should have author and license', () => {
      expect(corpSecuritiesDef.metadata.author).toBe('OttoChain');
      expect(corpSecuritiesDef.metadata.license).toBe('MIT');
    });

    it('should have securities-specific tags', () => {
      expect(corpSecuritiesDef.metadata.tags).toContain('corporate');
      expect(corpSecuritiesDef.metadata.tags).toContain('governance');
      expect(corpSecuritiesDef.metadata.tags).toContain('securities');
      expect(corpSecuritiesDef.metadata.tags).toContain('stock');
      expect(corpSecuritiesDef.metadata.tags).toContain('equity');
    });
  });
});
