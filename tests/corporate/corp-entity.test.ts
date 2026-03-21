import { corpEntityDef } from '../../src/apps/corporate/state-machines/corp-entity.js';

describe('CorpEntity State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(corpEntityDef).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(corpEntityDef.metadata.name).toBe('CorpEntity');
      expect(corpEntityDef.metadata.app).toBe('corporate');
      expect(corpEntityDef.metadata.type).toBe('entity');
      expect(corpEntityDef.metadata.version).toBe('1.0.0');
    });

    it('should have a description', () => {
      expect(corpEntityDef.metadata.description).toContain('Master corporate record');
    });
  });

  describe('States', () => {
    it('should define all required states', () => {
      const expectedStates = ['INCORPORATING', 'ACTIVE', 'SUSPENDED', 'DISSOLVED'];
      const actualStates = Object.keys(corpEntityDef.states);
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(corpEntityDef.initialState).toBe('INCORPORATING');
    });

    it('should mark DISSOLVED as final state', () => {
      expect(corpEntityDef.states.DISSOLVED.isFinal).toBe(true);
    });

    it('should mark non-terminal states as non-final', () => {
      expect(corpEntityDef.states.INCORPORATING.isFinal).toBe(false);
      expect(corpEntityDef.states.ACTIVE.isFinal).toBe(false);
      expect(corpEntityDef.states.SUSPENDED.isFinal).toBe(false);
    });

    it('should have descriptions for all states', () => {
      Object.values(corpEntityDef.states).forEach(state => {
        expect(state.description).toBeDefined();
        expect(state.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Transitions', () => {
    it('should allow incorporate transition from INCORPORATING to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'INCORPORATING' && t.to === 'ACTIVE' && t.eventName === 'incorporate'
      );
      expect(transition).toBeDefined();
    });

    it('should allow amend_charter transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'amend_charter'
      );
      expect(transition).toBeDefined();
    });

    it('should allow update_share_class transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update_share_class'
      );
      expect(transition).toBeDefined();
    });

    it('should allow update_registered_agent transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update_registered_agent'
      );
      expect(transition).toBeDefined();
    });

    it('should allow suspend transition from ACTIVE to SUSPENDED', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'SUSPENDED' && t.eventName === 'suspend'
      );
      expect(transition).toBeDefined();
    });

    it('should allow reinstate transition from SUSPENDED to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'SUSPENDED' && t.to === 'ACTIVE' && t.eventName === 'reinstate'
      );
      expect(transition).toBeDefined();
    });

    it('should allow dissolve_voluntary transition from ACTIVE to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve_voluntary'
      );
      expect(transition).toBeDefined();
    });

    it('should allow dissolve_administrative transition from SUSPENDED to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.from === 'SUSPENDED' && t.to === 'DISSOLVED' && t.eventName === 'dissolve_administrative'
      );
      expect(transition).toBeDefined();
    });
  });

  describe('Transition Guards and Effects', () => {
    it('should have guard on incorporate transition', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'incorporate'
      );
      expect(transition?.guard).toBeDefined();
    });

    it('should have effect on incorporate transition', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'incorporate'
      );
      expect(transition?.effect).toBeDefined();
    });

    it('should emit CORPORATION_FORMED on incorporate', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'incorporate'
      );
      expect(transition?.emits).toContain('CORPORATION_FORMED');
    });

    it('should emit CHARTER_AMENDED on amend_charter', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'amend_charter'
      );
      expect(transition?.emits).toContain('CHARTER_AMENDED');
    });

    it('should emit CORPORATION_SUSPENDED on suspend', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'suspend'
      );
      expect(transition?.emits).toContain('CORPORATION_SUSPENDED');
    });

    it('should emit CORPORATION_DISSOLVED on voluntary dissolution', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'dissolve_voluntary'
      );
      expect(transition?.emits).toContain('CORPORATION_DISSOLVED');
    });
  });

  describe('Cross References', () => {
    it('should define cross references in metadata', () => {
      expect(corpEntityDef.metadata.crossReferences).toBeDefined();
    });

    it('should reference board machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.board).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.board.machine).toBe('corporate-board');
    });

    it('should reference officers machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.officers).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.officers.machine).toBe('corporate-officers');
    });

    it('should reference bylaws machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.bylaws).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.bylaws.machine).toBe('corporate-bylaws');
    });

    it('should reference shareholders machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.shareholders).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.shareholders.machine).toBe('corporate-shareholders');
    });

    it('should reference securities machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.securities).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.securities.machine).toBe('corporate-securities');
    });

    it('should reference compliance machine', () => {
      expect(corpEntityDef.metadata.crossReferences?.compliance).toBeDefined();
      expect(corpEntityDef.metadata.crossReferences?.compliance.machine).toBe('corporate-compliance');
    });
  });

  describe('Schema Validation', () => {
    it('should define createSchema with required fields', () => {
      expect(corpEntityDef.createSchema).toBeDefined();
      expect(corpEntityDef.createSchema.required).toContain('entityId');
      expect(corpEntityDef.createSchema.required).toContain('legalName');
      expect(corpEntityDef.createSchema.required).toContain('entityType');
      expect(corpEntityDef.createSchema.required).toContain('jurisdiction');
    });

    it('should define stateSchema properties', () => {
      expect(corpEntityDef.stateSchema).toBeDefined();
      expect(corpEntityDef.stateSchema.properties).toBeDefined();
      expect(corpEntityDef.stateSchema.properties.entityId).toBeDefined();
      expect(corpEntityDef.stateSchema.properties.legalName).toBeDefined();
      expect(corpEntityDef.stateSchema.properties.status).toBeDefined();
    });

    it('should mark entityId as immutable in stateSchema', () => {
      expect(corpEntityDef.stateSchema.properties.entityId.immutable).toBe(true);
    });

    it('should mark status as computed in stateSchema', () => {
      expect(corpEntityDef.stateSchema.properties.status.computed).toBe(true);
    });

    it('should define eventSchemas for all events', () => {
      expect(corpEntityDef.eventSchemas).toBeDefined();
      expect(corpEntityDef.eventSchemas.incorporate).toBeDefined();
      expect(corpEntityDef.eventSchemas.amend_charter).toBeDefined();
      expect(corpEntityDef.eventSchemas.update_share_class).toBeDefined();
      expect(corpEntityDef.eventSchemas.update_registered_agent).toBeDefined();
      expect(corpEntityDef.eventSchemas.suspend).toBeDefined();
      expect(corpEntityDef.eventSchemas.reinstate).toBeDefined();
      expect(corpEntityDef.eventSchemas.dissolve_voluntary).toBeDefined();
      expect(corpEntityDef.eventSchemas.dissolve_administrative).toBeDefined();
    });

    it('should have required fields for incorporate event', () => {
      expect(corpEntityDef.eventSchemas.incorporate.required).toContain('approvalDate');
      expect(corpEntityDef.eventSchemas.incorporate.required).toContain('stateFileNumber');
    });

    it('should have required fields for suspend event', () => {
      expect(corpEntityDef.eventSchemas.suspend.required).toContain('reason');
      expect(corpEntityDef.eventSchemas.suspend.required).toContain('suspensionDate');
    });
  });

  describe('Definitions', () => {
    it('should define ShareClass type', () => {
      expect(corpEntityDef.definitions?.ShareClass).toBeDefined();
    });

    it('should define Incorporator type', () => {
      expect(corpEntityDef.definitions?.Incorporator).toBeDefined();
    });

    it('should define CharterAmendment type', () => {
      expect(corpEntityDef.definitions?.CharterAmendment).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have dependencies on dissolve_voluntary transition', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'dissolve_voluntary'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should have dependencies on amend_charter transition', () => {
      const transition = corpEntityDef.transitions.find(
        t => t.eventName === 'amend_charter'
      );
      expect(transition?.dependencies).toBeDefined();
    });
  });
});
