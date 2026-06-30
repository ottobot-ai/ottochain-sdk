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
      expectedStates.forEach((state) => {
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
      Object.values(corpEntityDef.states).forEach((state) => {
        expect(state.description).toBeDefined();
        expect(state.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Transitions', () => {
    it('should allow incorporate transition from INCORPORATING to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'INCORPORATING' && t.to === 'ACTIVE' && t.eventName === 'incorporate',
      );
      expect(transition).toBeDefined();
    });

    it('should allow amend_charter transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'amend_charter',
      );
      expect(transition).toBeDefined();
    });

    it('should allow update_share_class transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update_share_class',
      );
      expect(transition).toBeDefined();
    });

    it('should allow update_registered_agent transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update_registered_agent',
      );
      expect(transition).toBeDefined();
    });

    it('should allow suspend transition from ACTIVE to SUSPENDED', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'SUSPENDED' && t.eventName === 'suspend',
      );
      expect(transition).toBeDefined();
    });

    it('should allow reinstate transition from SUSPENDED to ACTIVE', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'SUSPENDED' && t.to === 'ACTIVE' && t.eventName === 'reinstate',
      );
      expect(transition).toBeDefined();
    });

    it('should allow dissolve_voluntary transition from ACTIVE to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'ACTIVE' && t.to === 'DISSOLVED' && t.eventName === 'dissolve_voluntary',
      );
      expect(transition).toBeDefined();
    });

    it('should allow dissolve_administrative transition from SUSPENDED to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.find(
        (t) => t.from === 'SUSPENDED' && t.to === 'DISSOLVED' && t.eventName === 'dissolve_administrative',
      );
      expect(transition).toBeDefined();
    });
  });

  describe('Transition Guards and Effects', () => {
    it('should have guard on incorporate transition', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'incorporate');
      expect(transition?.guard).toBeDefined();
    });

    it('should have effect on incorporate transition', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'incorporate');
      expect(transition?.effect).toBeDefined();
    });

    it('should emit CORPORATION_FORMED on incorporate', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'incorporate');
      expect(JSON.stringify(transition?.effect)).toContain('CORPORATION_FORMED');
    });

    it('should emit CHARTER_AMENDED on amend_charter', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'amend_charter');
      expect(JSON.stringify(transition?.effect)).toContain('CHARTER_AMENDED');
    });

    it('should emit CORPORATION_SUSPENDED on suspend', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'suspend');
      expect(JSON.stringify(transition?.effect)).toContain('CORPORATION_SUSPENDED');
    });

    it('should emit CORPORATION_DISSOLVED on voluntary dissolution', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'dissolve_voluntary');
      expect(JSON.stringify(transition?.effect)).toContain('CORPORATION_DISSOLVED');
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

  describe('Two-phase resolution gating (#24)', () => {
    it('propose_amend_charter binds the approving resolution via _addDependency', () => {
      const propose = corpEntityDef.transitions.find((t) => t.eventName === 'propose_amend_charter');
      expect(propose).toBeDefined();
      const effectStr = JSON.stringify(propose?.effect);
      expect(effectStr).toContain('_addDependency');
      expect(effectStr).toContain('event.resolutionRef');
    });

    it('amend_charter gates on the bound resolution reaching EXECUTED (depInState), not a dropped object-dep', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'amend_charter');
      const guardStr = JSON.stringify(transition?.guard);
      // dynamic currentStateId assert on the bound resolution + the recorded proposal match
      expect(guardStr).toContain('EXECUTED');
      expect(guardStr).toContain('pendingAmendCharter');
      // the dropped object-form dependency is gone — gating now lives in the guard
      expect(transition?.dependencies).toEqual([]);
    });

    it('propose_dissolve_voluntary binds BOTH executing resolutions via _addDependency', () => {
      const propose = corpEntityDef.transitions.find((t) => t.eventName === 'propose_dissolve_voluntary');
      expect(propose).toBeDefined();
      const effectStr = JSON.stringify(propose?.effect);
      expect(effectStr).toContain('_addDependency');
      expect(effectStr).toContain('event.boardResolutionRef');
      expect(effectStr).toContain('event.shareholderResolutionRef');
    });

    it('dissolve_voluntary gates on BOTH bound resolutions reaching EXECUTED (depInState), not dropped object-deps', () => {
      const transition = corpEntityDef.transitions.find((t) => t.eventName === 'dissolve_voluntary');
      const guardStr = JSON.stringify(transition?.guard);
      expect(guardStr).toContain('EXECUTED');
      expect(guardStr).toContain('pendingDissolveVoluntary');
      // both bound resolutions are asserted via depInState
      expect(guardStr).toContain('pendingDissolveVoluntary.boardRef');
      expect(guardStr).toContain('pendingDissolveVoluntary.shareholderRef');
      // the dropped object-form dependencies are gone — gating now lives in the guard
      expect(transition?.dependencies).toEqual([]);
    });
  });

  describe('Authorization (identity hardening)', () => {
    const guardOf = (eventName: string) =>
      JSON.stringify(corpEntityDef.transitions.find((t) => t.eventName === eventName)?.guard);
    const createProps = corpEntityDef.createSchema.properties as Record<string, { type?: string; immutable?: boolean }>;
    const stateProps = corpEntityDef.stateSchema.properties as Record<string, { type?: string; immutable?: boolean }>;

    it.each(['charterAuthority', 'boardAuthority', 'shareholderAuthority', 'stateAuthority'])(
      'should pin %s as a required, immutable authority address',
      (field) => {
        expect(corpEntityDef.createSchema.required).toContain(field);
        expect(createProps[field].type).toBe('address');
        expect(createProps[field].immutable).toBe(true);
        expect(stateProps[field]).toBeDefined();
        expect(stateProps[field].immutable).toBe(true);
      },
    );

    it('should gate amend_charter on state.charterAuthority and drop the event.resolutionRef non-null check', () => {
      const g = guardOf('amend_charter');
      expect(g).toContain('state.charterAuthority');
      expect(g).toContain('proofs');
      expect(g).not.toContain('event.resolutionRef');
    });

    it('should require BOTH board and shareholder authority to dissolve_voluntary', () => {
      const g = guardOf('dissolve_voluntary');
      expect(g).toContain('state.boardAuthority');
      expect(g).toContain('state.shareholderAuthority');
      expect(g).toContain('proofs');
    });

    it('should gate update_registered_agent and reinstate on the board authority', () => {
      expect(guardOf('update_registered_agent')).toContain('state.boardAuthority');
      expect(guardOf('reinstate')).toContain('state.boardAuthority');
    });

    it('should gate state-initiated suspend and dissolve_administrative on the state authority', () => {
      expect(guardOf('suspend')).toContain('state.stateAuthority');
      expect(guardOf('dissolve_administrative')).toContain('state.stateAuthority');
    });

    it('should NOT leave any privileged guard as constant-true {==:[1,1]}', () => {
      const tautology = JSON.stringify({ '==': [1, 1] });
      for (const ev of [
        'amend_charter',
        'update_registered_agent',
        'suspend',
        'reinstate',
        'dissolve_voluntary',
        'dissolve_administrative',
      ]) {
        expect(guardOf(ev)).not.toBe(tautology);
      }
    });
  });
});
