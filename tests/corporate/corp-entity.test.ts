/**
 * Tests for CorpEntity state machine
 */

import { corpEntityDef } from '../../src/apps/corporate/state-machines/index';

describe('CorpEntity State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(corpEntityDef).toBeDefined();
      expect(typeof corpEntityDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(corpEntityDef.name).toBe('CorpEntity');
      expect(corpEntityDef.description).toContain('corporate');
      expect(corpEntityDef.version).toBe('1.0.0');
      expect(corpEntityDef.category).toBe('corporate-governance');
    });

    it('should have correct states', () => {
      const expectedStates = ['INCORPORATING', 'ACTIVE', 'SUSPENDED', 'DISSOLVED'];
      const actualStates = Object.keys(corpEntityDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(4);
    });

    it('should have correct initial state', () => {
      expect(corpEntityDef.initialState).toBe('INCORPORATING');
    });

    it('should have DISSOLVED as terminal state', () => {
      expect(corpEntityDef.states.DISSOLVED.terminal).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should allow incorporate transition from INCORPORATING to ACTIVE', () => {
      const transition = corpEntityDef.transitions.incorporate;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('INCORPORATING');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow amend_charter transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.amend_charter;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow update_share_class transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.update_share_class;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow update_registered_agent transition from ACTIVE to ACTIVE', () => {
      const transition = corpEntityDef.transitions.update_registered_agent;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow suspend transition from ACTIVE to SUSPENDED', () => {
      const transition = corpEntityDef.transitions.suspend;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('SUSPENDED');
    });

    it('should allow reinstate transition from SUSPENDED to ACTIVE', () => {
      const transition = corpEntityDef.transitions.reinstate;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('SUSPENDED');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow dissolve_voluntary transition from ACTIVE to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.dissolve_voluntary;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('DISSOLVED');
    });

    it('should allow dissolve_administrative transition from SUSPENDED to DISSOLVED', () => {
      const transition = corpEntityDef.transitions.dissolve_administrative;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('SUSPENDED');
      expect(transition.to).toBe('DISSOLVED');
    });
  });

  describe('Event Payloads', () => {
    it('should require approval date and state file number for incorporate', () => {
      const event = corpEntityDef.transitions.incorporate.event;
      expect(event.name).toBe('incorporate');
      expect(event.payload.approvalDate.required).toBe(true);
      expect(event.payload.stateFileNumber.required).toBe(true);
    });

    it('should require amendment details for amend_charter', () => {
      const event = corpEntityDef.transitions.amend_charter.event;
      expect(event.name).toBe('amend_charter');
      expect(event.payload.amendmentId.required).toBe(true);
      expect(event.payload.description.required).toBe(true);
      expect(event.payload.resolutionRef.required).toBe(true);
    });

    it('should require reason and date for suspend', () => {
      const event = corpEntityDef.transitions.suspend.event;
      expect(event.name).toBe('suspend');
      expect(event.payload.reason.required).toBe(true);
      expect(event.payload.suspensionDate.required).toBe(true);
    });
  });

  describe('Guards', () => {
    it('should have guards for incorporate', () => {
      const guards = corpEntityDef.transitions.incorporate.guards;
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);

      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasRequiredFormationDocs');
      expect(guardNames).toContain('hasAuthorizedShares');
    });

    it('should have cross-machine guard for amend_charter', () => {
      const guards = corpEntityDef.transitions.amend_charter.guards;
      expect(guards).toBeDefined();

      const crossMachineGuard = guards.find(
        (g) => 'crossMachine' in g && g.crossMachine
      ) as { crossMachine: { machine: string } } | undefined;
      expect(crossMachineGuard).toBeDefined();
      expect(crossMachineGuard!.crossMachine.machine).toBe('corporate-resolution');
    });

    it('should have cross-machine guards for dissolve_voluntary', () => {
      const guards = corpEntityDef.transitions.dissolve_voluntary.guards;
      expect(guards).toBeDefined();

      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('boardApproved');
      expect(guardNames).toContain('shareholdersApproved');
    });
  });

  describe('Effects', () => {
    it('should emit CORPORATION_FORMED event on incorporate', () => {
      const effects = corpEntityDef.transitions.incorporate.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('CORPORATION_FORMED');
    });

    it('should emit CHARTER_AMENDED event on amend_charter', () => {
      const effects = corpEntityDef.transitions.amend_charter.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('CHARTER_AMENDED');
    });

    it('should emit CORPORATION_SUSPENDED event on suspend', () => {
      const effects = corpEntityDef.transitions.suspend.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('CORPORATION_SUSPENDED');
    });

    it('should emit CORPORATION_DISSOLVED event on dissolve', () => {
      const effects = corpEntityDef.transitions.dissolve_voluntary.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('CORPORATION_DISSOLVED');
    });
  });

  describe('Context Schema', () => {
    it('should have entityId field', () => {
      expect(corpEntityDef.context.entityId).toBeDefined();
      expect(corpEntityDef.context.entityId.type).toBe('string');
    });

    it('should have legalName field', () => {
      expect(corpEntityDef.context.legalName).toBeDefined();
      expect(corpEntityDef.context.legalName.type).toBe('string');
    });

    it('should have entityType enum', () => {
      expect(corpEntityDef.context.entityType).toBeDefined();
      expect(corpEntityDef.context.entityType.enum).toContain('C_CORP');
      expect(corpEntityDef.context.entityType.enum).toContain('S_CORP');
      expect(corpEntityDef.context.entityType.enum).toContain('LLC');
    });

    it('should have shareStructure object', () => {
      expect(corpEntityDef.context.shareStructure).toBeDefined();
      expect(corpEntityDef.context.shareStructure.type).toBe('object');
    });
  });

  describe('Cross-Machine References', () => {
    it('should reference corporate-board', () => {
      expect(corpEntityDef.crossMachineRefs.board).toBeDefined();
      expect(corpEntityDef.crossMachineRefs.board.machine).toBe('corporate-board');
    });

    it('should reference corporate-officers', () => {
      expect(corpEntityDef.crossMachineRefs.officers).toBeDefined();
      expect(corpEntityDef.crossMachineRefs.officers.machine).toBe('corporate-officers');
    });

    it('should reference corporate-shareholders', () => {
      expect(corpEntityDef.crossMachineRefs.shareholders).toBeDefined();
      expect(corpEntityDef.crossMachineRefs.shareholders.machine).toBe('corporate-shareholders');
    });

    it('should reference corporate-securities', () => {
      expect(corpEntityDef.crossMachineRefs.securities).toBeDefined();
      expect(corpEntityDef.crossMachineRefs.securities.machine).toBe('corporate-securities');
    });
  });

  describe('Metadata', () => {
    it('should have author and license', () => {
      expect(corpEntityDef.metadata.author).toBe('OttoChain');
      expect(corpEntityDef.metadata.license).toBe('MIT');
    });

    it('should have corporate governance tags', () => {
      expect(corpEntityDef.metadata.tags).toContain('corporate');
      expect(corpEntityDef.metadata.tags).toContain('governance');
      expect(corpEntityDef.metadata.tags).toContain('entity');
    });
  });
});
