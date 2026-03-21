/**
 * Tests for CorpShareholders state machine
 */

import { corpShareholdersDef } from '../../src/apps/corporate/state-machines/index';

describe('CorpShareholders State Machine', () => {
  describe('Definition Structure', () => {
    it('should be defined', () => {
      expect(corpShareholdersDef).toBeDefined();
      expect(typeof corpShareholdersDef).toBe('object');
    });

    it('should have correct metadata', () => {
      expect(corpShareholdersDef.name).toBe('CorpShareholders');
      expect(corpShareholdersDef.description).toContain('Shareholder meeting');
      expect(corpShareholdersDef.version).toBe('1.0.0');
      expect(corpShareholdersDef.category).toBe('corporate-governance');
    });

    it('should have correct states', () => {
      const expectedStates = [
        'SCHEDULED',
        'RECORD_DATE_SET',
        'PROXY_PERIOD',
        'IN_SESSION',
        'VOTING',
        'CLOSED',
      ];
      const actualStates = Object.keys(corpShareholdersDef.states);

      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
      expect(actualStates).toHaveLength(6);
    });

    it('should have correct initial state', () => {
      expect(corpShareholdersDef.initialState).toBe('SCHEDULED');
    });

    it('should have CLOSED as terminal state', () => {
      expect(corpShareholdersDef.states.CLOSED.terminal).toBe(true);
    });
  });

  describe('Meeting Scheduling Transitions', () => {
    it('should allow schedule_annual transition', () => {
      const transition = corpShareholdersDef.transitions.schedule_annual;
      expect(transition).toBeDefined();
      expect(transition.from).toBe(null);
      expect(transition.to).toBe('SCHEDULED');
    });

    it('should allow schedule_special transition', () => {
      const transition = corpShareholdersDef.transitions.schedule_special;
      expect(transition).toBeDefined();
      expect(transition.from).toBe(null);
      expect(transition.to).toBe('SCHEDULED');
    });

    it('should allow set_record_date transition', () => {
      const transition = corpShareholdersDef.transitions.set_record_date;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('SCHEDULED');
      expect(transition.to).toBe('RECORD_DATE_SET');
    });
  });

  describe('Proxy Period Transitions', () => {
    it('should allow register_eligible_shareholders transition', () => {
      const transition = corpShareholdersDef.transitions.register_eligible_shareholders;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('RECORD_DATE_SET');
      expect(transition.to).toBe('RECORD_DATE_SET');
    });

    it('should allow open_proxy_period transition', () => {
      const transition = corpShareholdersDef.transitions.open_proxy_period;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('RECORD_DATE_SET');
      expect(transition.to).toBe('PROXY_PERIOD');
    });

    it('should allow add_agenda_item transition from multiple states', () => {
      const transition = corpShareholdersDef.transitions.add_agenda_item;
      expect(transition).toBeDefined();
      expect(transition.from).toContain('SCHEDULED');
      expect(transition.from).toContain('RECORD_DATE_SET');
      expect(transition.from).toContain('PROXY_PERIOD');
    });
  });

  describe('Meeting Session Transitions', () => {
    it('should allow open_meeting transition', () => {
      const transition = corpShareholdersDef.transitions.open_meeting;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('PROXY_PERIOD');
      expect(transition.to).toBe('IN_SESSION');
    });

    it('should allow open_polls transition', () => {
      const transition = corpShareholdersDef.transitions.open_polls;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('IN_SESSION');
      expect(transition.to).toBe('VOTING');
    });

    it('should allow cast_vote transition', () => {
      const transition = corpShareholdersDef.transitions.cast_vote;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('VOTING');
      expect(transition.to).toBe('VOTING');
    });

    it('should allow close_polls transition', () => {
      const transition = corpShareholdersDef.transitions.close_polls;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('VOTING');
      expect(transition.to).toBe('IN_SESSION');
    });

    it('should allow certify_results transition', () => {
      const transition = corpShareholdersDef.transitions.certify_results;
      expect(transition).toBeDefined();
      expect(transition.from).toBe('IN_SESSION');
      expect(transition.to).toBe('CLOSED');
    });

    it('should allow adjourn_without_action transition', () => {
      const transition = corpShareholdersDef.transitions.adjourn_without_action;
      expect(transition).toBeDefined();
      expect(transition.from).toContain('IN_SESSION');
      expect(transition.from).toContain('VOTING');
      expect(transition.to).toBe('CLOSED');
    });
  });

  describe('Event Payloads', () => {
    it('should require meeting details for schedule_annual', () => {
      const event = corpShareholdersDef.transitions.schedule_annual.event;
      expect(event.name).toBe('schedule_annual');
      expect(event.payload.meetingId.required).toBe(true);
      expect(event.payload.entityId.required).toBe(true);
      expect(event.payload.fiscalYear.required).toBe(true);
      expect(event.payload.scheduledDate.required).toBe(true);
    });

    it('should require vote details for cast_vote', () => {
      const event = corpShareholdersDef.transitions.cast_vote.event;
      expect(event.name).toBe('cast_vote');
      expect(event.payload.voteId.required).toBe(true);
      expect(event.payload.agendaItemId.required).toBe(true);
      expect(event.payload.voterId.required).toBe(true);
      expect(event.payload.shareholderId.required).toBe(true);
      expect(event.payload.shareClass.required).toBe(true);
    });

    it('should support agenda item types', () => {
      const event = corpShareholdersDef.transitions.add_agenda_item.event;
      const typeField = event.payload.type;
      // Type is defined as a string field (validated at runtime by business logic)
      expect(typeField.type).toBe('string');
      expect(typeField.required).toBe(true);
    });

    it('should support vote required types', () => {
      const event = corpShareholdersDef.transitions.add_agenda_item.event;
      const voteRequiredField = event.payload.voteRequired;
      // Vote required is defined as a string field (validated at runtime by business logic)
      expect(voteRequiredField.type).toBe('string');
      expect(voteRequiredField.required).toBe(true);
    });
  });

  describe('Guards', () => {
    it('should guard schedule_annual with board approval', () => {
      const guards = corpShareholdersDef.transitions.schedule_annual.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('boardApproved');
    });

    it('should guard open_meeting for quorum', () => {
      const guards = corpShareholdersDef.transitions.open_meeting.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('quorumPresentOrRepresented');
    });

    it('should guard cast_vote for eligible voter', () => {
      const guards = corpShareholdersDef.transitions.cast_vote.guards;
      const guardNames = guards.map((g: { name: string }) => g.name);
      expect(guardNames).toContain('isEligibleVoter');
      expect(guardNames).toContain('hasNotAlreadyVoted');
    });
  });

  describe('Effects', () => {
    it('should emit SHAREHOLDER_MEETING_SCHEDULED event', () => {
      const effects = corpShareholdersDef.transitions.schedule_annual.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('SHAREHOLDER_MEETING_SCHEDULED');
    });

    it('should emit RECORD_DATE_SET event', () => {
      const effects = corpShareholdersDef.transitions.set_record_date.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('RECORD_DATE_SET');
    });

    it('should emit PROXY_PERIOD_OPENED event', () => {
      const effects = corpShareholdersDef.transitions.open_proxy_period.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('PROXY_PERIOD_OPENED');
    });

    it('should emit SHAREHOLDER_MEETING_OPENED event', () => {
      const effects = corpShareholdersDef.transitions.open_meeting.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('SHAREHOLDER_MEETING_OPENED');
    });

    it('should emit MEETING_RESULTS_CERTIFIED event', () => {
      const effects = corpShareholdersDef.transitions.certify_results.effects;
      const emitEffect = effects.find(
        (e) => 'type' in e && e.type === 'EMIT_EVENT'
      ) as { type: string; eventType: string } | undefined;
      expect(emitEffect).toBeDefined();
      expect(emitEffect!.eventType).toBe('MEETING_RESULTS_CERTIFIED');
    });
  });

  describe('Context Schema', () => {
    it('should have meetingId field', () => {
      expect(corpShareholdersDef.context.meetingId).toBeDefined();
      expect(corpShareholdersDef.context.meetingId.type).toBe('string');
    });

    it('should have meetingType enum', () => {
      expect(corpShareholdersDef.context.meetingType).toBeDefined();
      expect(corpShareholdersDef.context.meetingType.enum).toContain('ANNUAL');
      expect(corpShareholdersDef.context.meetingType.enum).toContain('SPECIAL');
    });

    it('should have eligibleVoters array', () => {
      expect(corpShareholdersDef.context.eligibleVoters).toBeDefined();
      expect(corpShareholdersDef.context.eligibleVoters.type).toBe('array');
    });

    it('should have quorumRequirements object', () => {
      expect(corpShareholdersDef.context.quorumRequirements).toBeDefined();
      expect(corpShareholdersDef.context.quorumRequirements.type).toBe('object');
    });

    it('should have agenda array', () => {
      expect(corpShareholdersDef.context.agenda).toBeDefined();
      expect(corpShareholdersDef.context.agenda.type).toBe('array');
    });

    it('should have votes array', () => {
      expect(corpShareholdersDef.context.votes).toBeDefined();
      expect(corpShareholdersDef.context.votes.type).toBe('array');
    });

    it('should have voteTallies array', () => {
      expect(corpShareholdersDef.context.voteTallies).toBeDefined();
      expect(corpShareholdersDef.context.voteTallies.type).toBe('array');
    });

    it('should have certification object', () => {
      expect(corpShareholdersDef.context.certification).toBeDefined();
      expect(corpShareholdersDef.context.certification.nullable).toBe(true);
    });
  });

  describe('Cross-Machine References', () => {
    it('should reference corporate-entity', () => {
      expect(corpShareholdersDef.crossMachineRefs.entity).toBeDefined();
      expect(corpShareholdersDef.crossMachineRefs.entity.machine).toBe('corporate-entity');
    });

    it('should reference corporate-proxy', () => {
      expect(corpShareholdersDef.crossMachineRefs.proxies).toBeDefined();
      expect(corpShareholdersDef.crossMachineRefs.proxies.machine).toBe('corporate-proxy');
    });

    it('should reference corporate-resolution', () => {
      expect(corpShareholdersDef.crossMachineRefs.resolutions).toBeDefined();
      expect(corpShareholdersDef.crossMachineRefs.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference corporate-securities', () => {
      expect(corpShareholdersDef.crossMachineRefs.securities).toBeDefined();
      expect(corpShareholdersDef.crossMachineRefs.securities.machine).toBe('corporate-securities');
    });
  });

  describe('Metadata', () => {
    it('should have author and license', () => {
      expect(corpShareholdersDef.metadata.author).toBe('OttoChain');
      expect(corpShareholdersDef.metadata.license).toBe('MIT');
    });

    it('should have shareholder-specific tags', () => {
      expect(corpShareholdersDef.metadata.tags).toContain('corporate');
      expect(corpShareholdersDef.metadata.tags).toContain('governance');
      expect(corpShareholdersDef.metadata.tags).toContain('shareholders');
      expect(corpShareholdersDef.metadata.tags).toContain('voting');
      expect(corpShareholdersDef.metadata.tags).toContain('proxy');
    });
  });
});
