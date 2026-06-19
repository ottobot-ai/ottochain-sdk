import { corpBoardDef } from '../../src/apps/corporate/state-machines/corp-board.js';

describe('CorpBoard State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(corpBoardDef).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(corpBoardDef.metadata.name).toBe('CorpBoard');
      expect(corpBoardDef.metadata.app).toBe('corporate');
      expect(corpBoardDef.metadata.type).toBe('board');
      expect(corpBoardDef.metadata.version).toBe('1.0.0');
    });

    it('should have a description', () => {
      expect(corpBoardDef.metadata.description).toContain('Board of directors');
    });
  });

  describe('States', () => {
    it('should define all required states', () => {
      const expectedStates = ['ACTIVE', 'IN_MEETING', 'QUORUM_LOST'];
      const actualStates = Object.keys(corpBoardDef.states);
      expectedStates.forEach(state => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(corpBoardDef.initialState).toBe('ACTIVE');
    });

    it('should mark all states as non-final', () => {
      expect(corpBoardDef.states.ACTIVE.isFinal).toBe(false);
      expect(corpBoardDef.states.IN_MEETING.isFinal).toBe(false);
      expect(corpBoardDef.states.QUORUM_LOST.isFinal).toBe(false);
    });

    it('should have descriptions for all states', () => {
      Object.values(corpBoardDef.states).forEach(state => {
        expect(state.description).toBeDefined();
        expect(state.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Transitions', () => {
    it('should allow elect_director transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'elect_director'
      );
      expect(transition).toBeDefined();
    });

    it('should allow resign_director transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'resign_director'
      );
      expect(transition).toBeDefined();
    });

    it('should allow resign_director transition from IN_MEETING to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'IN_MEETING' && t.to === 'ACTIVE' && t.eventName === 'resign_director'
      );
      expect(transition).toBeDefined();
    });

    it('should allow remove_for_cause transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'remove_for_cause'
      );
      expect(transition).toBeDefined();
    });

    it('should allow designate_chair transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'designate_chair'
      );
      expect(transition).toBeDefined();
    });

    it('should allow call_meeting transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'call_meeting'
      );
      expect(transition).toBeDefined();
    });

    it('should allow record_attendance transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'record_attendance'
      );
      expect(transition).toBeDefined();
    });

    it('should allow open_meeting transition from ACTIVE to IN_MEETING', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'IN_MEETING' && t.eventName === 'open_meeting'
      );
      expect(transition).toBeDefined();
    });

    it('should allow director_departs transition from IN_MEETING to IN_MEETING', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'IN_MEETING' && t.to === 'IN_MEETING' && t.eventName === 'director_departs'
      );
      expect(transition).toBeDefined();
    });

    it('should allow quorum_lost transition from IN_MEETING to QUORUM_LOST', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'IN_MEETING' && t.to === 'QUORUM_LOST' && t.eventName === 'quorum_lost'
      );
      expect(transition).toBeDefined();
    });

    it('should allow quorum_restored transition from QUORUM_LOST to IN_MEETING', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'QUORUM_LOST' && t.to === 'IN_MEETING' && t.eventName === 'quorum_restored'
      );
      expect(transition).toBeDefined();
    });

    it('should allow adjourn transition from IN_MEETING to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'IN_MEETING' && t.to === 'ACTIVE' && t.eventName === 'adjourn'
      );
      expect(transition).toBeDefined();
    });

    it('should allow adjourn transition from QUORUM_LOST to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'QUORUM_LOST' && t.to === 'ACTIVE' && t.eventName === 'adjourn'
      );
      expect(transition).toBeDefined();
    });

    it('should allow update_seats transition from ACTIVE to ACTIVE', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.to === 'ACTIVE' && t.eventName === 'update_seats'
      );
      expect(transition).toBeDefined();
    });
  });

  describe('Transition Guards and Effects', () => {
    it('should have guard on elect_director transition', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'elect_director'
      );
      expect(transition?.guard).toBeDefined();
    });

    it('should have effect on elect_director transition', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'elect_director'
      );
      expect(transition?.effect).toBeDefined();
    });

    it('should emit DIRECTOR_ELECTED on elect_director', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'elect_director'
      );
      expect(transition?.emits).toContain('DIRECTOR_ELECTED');
    });

    it('should emit DIRECTOR_RESIGNED on resign_director', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'ACTIVE' && t.eventName === 'resign_director'
      );
      expect(transition?.emits).toContain('DIRECTOR_RESIGNED');
    });

    it('should emit DIRECTOR_REMOVED on remove_for_cause', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'remove_for_cause'
      );
      expect(transition?.emits).toContain('DIRECTOR_REMOVED');
    });

    it('should emit BOARD_MEETING_SCHEDULED on call_meeting', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'call_meeting'
      );
      expect(transition?.emits).toContain('BOARD_MEETING_SCHEDULED');
    });

    it('should emit BOARD_MEETING_OPENED on open_meeting', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'open_meeting'
      );
      expect(transition?.emits).toContain('BOARD_MEETING_OPENED');
    });

    it('should emit BOARD_QUORUM_LOST on quorum_lost', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'quorum_lost'
      );
      expect(transition?.emits).toContain('BOARD_QUORUM_LOST');
    });

    it('should emit BOARD_MEETING_ADJOURNED on adjourn', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.from === 'IN_MEETING' && t.eventName === 'adjourn'
      );
      expect(transition?.emits).toContain('BOARD_MEETING_ADJOURNED');
    });
  });

  describe('Cross References', () => {
    it('should define cross references in metadata', () => {
      expect(corpBoardDef.metadata.crossReferences).toBeDefined();
    });

    it('should reference entity machine', () => {
      expect(corpBoardDef.metadata.crossReferences?.entity).toBeDefined();
      expect(corpBoardDef.metadata.crossReferences?.entity.machine).toBe('corporate-entity');
    });

    it('should reference resolutions machine', () => {
      expect(corpBoardDef.metadata.crossReferences?.resolutions).toBeDefined();
      expect(corpBoardDef.metadata.crossReferences?.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference committees machine', () => {
      expect(corpBoardDef.metadata.crossReferences?.committees).toBeDefined();
      expect(corpBoardDef.metadata.crossReferences?.committees.machine).toBe('corporate-committee');
    });

    it('should reference officers machine', () => {
      expect(corpBoardDef.metadata.crossReferences?.officers).toBeDefined();
      expect(corpBoardDef.metadata.crossReferences?.officers.machine).toBe('corporate-officers');
    });
  });

  describe('Schema Validation', () => {
    it('should define createSchema with required fields', () => {
      expect(corpBoardDef.createSchema).toBeDefined();
      expect(corpBoardDef.createSchema.required).toContain('boardId');
      expect(corpBoardDef.createSchema.required).toContain('entityId');
      expect(corpBoardDef.createSchema.required).toContain('seats');
    });

    it('should define stateSchema properties', () => {
      expect(corpBoardDef.stateSchema).toBeDefined();
      expect(corpBoardDef.stateSchema.properties).toBeDefined();
      expect(corpBoardDef.stateSchema.properties.boardId).toBeDefined();
      expect(corpBoardDef.stateSchema.properties.entityId).toBeDefined();
      expect(corpBoardDef.stateSchema.properties.directors).toBeDefined();
      expect(corpBoardDef.stateSchema.properties.status).toBeDefined();
    });

    it('should mark boardId as immutable in stateSchema', () => {
      expect(corpBoardDef.stateSchema.properties.boardId.immutable).toBe(true);
    });

    it('should mark entityId as immutable in stateSchema', () => {
      expect(corpBoardDef.stateSchema.properties.entityId.immutable).toBe(true);
    });

    it('should mark status as computed in stateSchema', () => {
      expect(corpBoardDef.stateSchema.properties.status.computed).toBe(true);
    });

    it('should define eventSchemas for all events', () => {
      expect(corpBoardDef.eventSchemas).toBeDefined();
      expect(corpBoardDef.eventSchemas.elect_director).toBeDefined();
      expect(corpBoardDef.eventSchemas.resign_director).toBeDefined();
      expect(corpBoardDef.eventSchemas.remove_for_cause).toBeDefined();
      expect(corpBoardDef.eventSchemas.designate_chair).toBeDefined();
      expect(corpBoardDef.eventSchemas.call_meeting).toBeDefined();
      expect(corpBoardDef.eventSchemas.record_attendance).toBeDefined();
      expect(corpBoardDef.eventSchemas.open_meeting).toBeDefined();
      expect(corpBoardDef.eventSchemas.director_departs).toBeDefined();
      expect(corpBoardDef.eventSchemas.quorum_lost).toBeDefined();
      expect(corpBoardDef.eventSchemas.quorum_restored).toBeDefined();
      expect(corpBoardDef.eventSchemas.adjourn).toBeDefined();
      expect(corpBoardDef.eventSchemas.update_seats).toBeDefined();
    });

    it('should have required fields for elect_director event', () => {
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('directorId');
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('name');
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('termStart');
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('termEnd');
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('isIndependent');
      expect(corpBoardDef.eventSchemas.elect_director.required).toContain('electionResolutionRef');
    });

    it('should have required fields for call_meeting event', () => {
      expect(corpBoardDef.eventSchemas.call_meeting.required).toContain('meetingId');
      expect(corpBoardDef.eventSchemas.call_meeting.required).toContain('type');
      expect(corpBoardDef.eventSchemas.call_meeting.required).toContain('scheduledDate');
      expect(corpBoardDef.eventSchemas.call_meeting.required).toContain('calledBy');
      expect(corpBoardDef.eventSchemas.call_meeting.required).toContain('noticeDate');
    });
  });

  describe('Definitions', () => {
    it('should define Director type', () => {
      expect(corpBoardDef.definitions?.Director).toBeDefined();
    });

    it('should define Meeting type', () => {
      expect(corpBoardDef.definitions?.Meeting).toBeDefined();
    });

    it('should define Attendee type', () => {
      expect(corpBoardDef.definitions?.Attendee).toBeDefined();
    });

    it('should define MeetingRecord type', () => {
      expect(corpBoardDef.definitions?.MeetingRecord).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should have dependencies on remove_for_cause transition', () => {
      const transition = corpBoardDef.transitions.find(
        t => t.eventName === 'remove_for_cause'
      );
      expect(transition?.dependencies).toBeDefined();
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization (identity hardening)', () => {
    const guardOf = (eventName: string) =>
      JSON.stringify(corpBoardDef.transitions.find(t => t.eventName === eventName)?.guard);

    it('should pin authorizedRemovers as a required address-set createSchema/stateSchema field', () => {
      expect(corpBoardDef.createSchema.required).toContain('authorizedRemovers');
      expect(corpBoardDef.createSchema.properties.authorizedRemovers.type).toBe('array');
      expect(corpBoardDef.createSchema.properties.authorizedRemovers.items).toEqual({ type: 'address' });
      expect(corpBoardDef.stateSchema.properties.authorizedRemovers).toBeDefined();
    });

    it('should gate remove_for_cause on a verified member of state.authorizedRemovers', () => {
      const g = guardOf('remove_for_cause');
      expect(g).toContain('state.authorizedRemovers');
      expect(g).toContain('proofs');
      // director lookup retained as a key only
      expect(g).toContain('state.directors');
    });

    it('should still declare a TODO for the #24-deferred resolution-EXECUTED assert', () => {
      // The runtime-dep resolution-state assert is intentionally deferred (#24); the resolution
      // dependency object remains on the transition until bare-UUID + machines.<id> asserts land.
      const transition = corpBoardDef.transitions.find(t => t.eventName === 'remove_for_cause');
      expect(transition?.dependencies?.length).toBeGreaterThan(0);
    });

    it('should gate elect_director vacancy solely on state.seats.vacant and not event.isFillingVacancy', () => {
      const g = guardOf('elect_director');
      expect(g).toContain('state.seats.vacant');
      expect(g).not.toContain('event.isFillingVacancy');
    });
  });
});
