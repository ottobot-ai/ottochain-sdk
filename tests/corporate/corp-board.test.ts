/**
 * Tests for CorpBoard state machine
 */

import { corpBoardDef } from '../../src/apps/corporate/state-machines/index';

describe('CorpBoard State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(corpBoardDef).toBeDefined();
      expect(typeof corpBoardDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(corpBoardDef.name).toBe('CorpBoard');
      expect(corpBoardDef.description).toContain('Board of directors');
      expect(corpBoardDef.version).toBe('1.0.0');
      expect(corpBoardDef.category).toBe('corporate-governance');
    });

    it('should have correct states', () => {
      const expectedStates = ['ACTIVE', 'IN_MEETING', 'QUORUM_LOST'];
      const actualStates = Object.keys(corpBoardDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(3);
    });

    it('should have correct initial state', () => {
      expect(corpBoardDef.initialState).toBe('ACTIVE');
    });
  });

  describe('Director Management Transitions', () => {
    it('should allow elect_director transition', () => {
      const transition = corpBoardDef.transitions.elect_director;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow resign_director transition from multiple states', () => {
      const transition = corpBoardDef.transitions.resign_director;
      expect(transition).toBeDefined();
      expect(transition.from).toContain('ACTIVE');
      expect(transition.from).toContain('IN_MEETING');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow remove_for_cause transition', () => {
      const transition = corpBoardDef.transitions.remove_for_cause;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow designate_chair transition', () => {
      const transition = corpBoardDef.transitions.designate_chair;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });
  });

  describe('Meeting Management Transitions', () => {
    it('should allow call_meeting transition', () => {
      const transition = corpBoardDef.transitions.call_meeting;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow record_attendance transition', () => {
      const transition = corpBoardDef.transitions.record_attendance;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });

    it('should allow open_meeting transition', () => {
      const transition = corpBoardDef.transitions.open_meeting;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('IN_MEETING');
    });

    it('should allow director_departs transition', () => {
      const transition = corpBoardDef.transitions.director_departs;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('IN_MEETING');
      expect(transition.to).toBe('IN_MEETING');
    });

    it('should allow quorum_lost transition', () => {
      const transition = corpBoardDef.transitions.quorum_lost;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('IN_MEETING');
      expect(transition.to).toBe('QUORUM_LOST');
    });

    it('should allow quorum_restored transition', () => {
      const transition = corpBoardDef.transitions.quorum_restored;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('QUORUM_LOST');
      expect(transition.to).toBe('IN_MEETING');
    });

    it('should allow adjourn transition from multiple states', () => {
      const transition = corpBoardDef.transitions.adjourn;
      expect(transition).toBeDefined();
      expect(transition.from).toContain('IN_MEETING');
      expect(transition.from).toContain('QUORUM_LOST');
      expect(transition.to).toBe('ACTIVE');
    });
  });

  describe('Board Structure Management', () => {
    it('should allow update_seats transition', () => {
      const transition = corpBoardDef.transitions.update_seats;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('ACTIVE');
      expect(transition.to).toBe('ACTIVE');
    });
  });

  describe('Event Payloads', () => {
    it('should require director details for elect_director', () => {
      const event = corpBoardDef.transitions.elect_director.event;
      expect(event.name).toBe('elect_director');
      expect(event.payload.directorId.required).toBe(true);
      expect(event.payload.name.required).toBe(true);
      expect(event.payload.termStart.required).toBe(true);
      expect(event.payload.termEnd.required).toBe(true);
      expect(event.payload.isIndependent.required).toBe(true);
    });

    it('should require meeting details for call_meeting', () => {
      const event = corpBoardDef.transitions.call_meeting.event;
      expect(event.name).toBe('call_meeting');
      expect(event.payload.meetingId.required).toBe(true);
      expect(event.payload.type.required).toBe(true);
      expect(event.payload.scheduledDate.required).toBe(true);
      expect(event.payload.calledBy.required).toBe(true);
    });

    it('should support meeting types enum', () => {
      const event = corpBoardDef.transitions.call_meeting.event;
      expect(event.payload.type.enum).toContain('REGULAR');
      expect(event.payload.type.enum).toContain('SPECIAL');
      expect(event.payload.type.enum).toContain('ANNUAL');
      expect(event.payload.type.enum).toContain('ORGANIZATIONAL');
    });
  });

  describe('Guards', () => {
    it('should guard elect_director for available seats', () => {
      const guards = corpBoardDef.transitions.elect_director.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasAvailableSeat');
      expect(guardNames).toContain('hasElectionResolution');
      expect(guardNames).toContain('notAlreadyDirector');
    });

    it('should guard open_meeting for quorum', () => {
      const guards = corpBoardDef.transitions.open_meeting.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('hasPendingMeeting');
      expect(guardNames).toContain('quorumPresent');
    });

    it('should guard call_meeting for sufficient notice', () => {
      const guards = corpBoardDef.transitions.call_meeting.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('sufficientNotice');
      expect(guardNames).toContain('noConflictingMeeting');
    });

    it('should guard update_seats to not reduce below filled', () => {
      const guards = corpBoardDef.transitions.update_seats.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('seatsNotLessThanFilled');
    });
  });

  describe('Effects', () => {
    it('should emit DIRECTOR_ELECTED event', () => {
      const effects = corpBoardDef.transitions.elect_director.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('DIRECTOR_ELECTED');
    });

    it('should emit DIRECTOR_RESIGNED event', () => {
      const effects = corpBoardDef.transitions.resign_director.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('DIRECTOR_RESIGNED');
    });

    it('should emit BOARD_MEETING_SCHEDULED event', () => {
      const effects = corpBoardDef.transitions.call_meeting.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('BOARD_MEETING_SCHEDULED');
    });

    it('should emit BOARD_MEETING_OPENED event', () => {
      const effects = corpBoardDef.transitions.open_meeting.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('BOARD_MEETING_OPENED');
    });

    it('should emit BOARD_QUORUM_LOST event', () => {
      const effects = corpBoardDef.transitions.quorum_lost.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('BOARD_QUORUM_LOST');
    });

    it('should update seat counts on elect_director', () => {
      const effects = corpBoardDef.transitions.elect_director.effects as unknown as Array<{ type: string; path?: string }>;
      const incrementEffect = effects.find(
        (e) => e.type === 'INCREMENT' && e.path === 'seats.filled'
      );
      const decrementEffect = effects.find(
        (e) => e.type === 'DECREMENT' && e.path === 'seats.vacant'
      );
      expect(incrementEffect).toBeDefined();
      expect(decrementEffect).toBeDefined();
    });
  });

  describe('Context Schema', () => {
    it('should have boardId field', () => {
      expect(corpBoardDef.context.boardId).toBeDefined();
      expect(corpBoardDef.context.boardId.type).toBe('string');
    });

    it('should have entityId field', () => {
      expect(corpBoardDef.context.entityId).toBeDefined();
      expect(corpBoardDef.context.entityId.type).toBe('string');
    });

    it('should have directors array', () => {
      expect(corpBoardDef.context.directors).toBeDefined();
      expect(corpBoardDef.context.directors.type).toBe('array');
    });

    it('should have seats object', () => {
      expect(corpBoardDef.context.seats).toBeDefined();
      expect(corpBoardDef.context.seats.type).toBe('object');
    });

    it('should have quorumRules object', () => {
      expect(corpBoardDef.context.quorumRules).toBeDefined();
      expect(corpBoardDef.context.quorumRules.type).toBe('object');
    });

    it('should have currentMeeting object', () => {
      expect(corpBoardDef.context.currentMeeting).toBeDefined();
      expect(corpBoardDef.context.currentMeeting.nullable).toBe(true);
    });

    it('should have meetingHistory array', () => {
      expect(corpBoardDef.context.meetingHistory).toBeDefined();
      expect(corpBoardDef.context.meetingHistory.type).toBe('array');
    });
  });

  describe('Cross-Machine References', () => {
    it('should reference corporate-entity', () => {
      expect(corpBoardDef.crossMachineRefs.entity).toBeDefined();
      expect(corpBoardDef.crossMachineRefs.entity.machine).toBe('corporate-entity');
    });

    it('should reference corporate-resolution', () => {
      expect(corpBoardDef.crossMachineRefs.resolutions).toBeDefined();
      expect(corpBoardDef.crossMachineRefs.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference corporate-committee', () => {
      expect(corpBoardDef.crossMachineRefs.committees).toBeDefined();
      expect(corpBoardDef.crossMachineRefs.committees.machine).toBe('corporate-committee');
    });
  });

  describe('Metadata', () => {
    it('should have author and license', () => {
      expect(corpBoardDef.metadata.author).toBe('OttoChain');
      expect(corpBoardDef.metadata.license).toBe('MIT');
    });

    it('should have board-specific tags', () => {
      expect(corpBoardDef.metadata.tags).toContain('corporate');
      expect(corpBoardDef.metadata.tags).toContain('governance');
      expect(corpBoardDef.metadata.tags).toContain('board');
      expect(corpBoardDef.metadata.tags).toContain('directors');
    });
  });
});
