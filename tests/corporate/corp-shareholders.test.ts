import { corpShareholdersDef } from '../../src/apps/corporate/state-machines/corp-shareholders.js';

describe('CorpShareholders State Machine', () => {
  describe('Definition Structure', () => {
    it('should exist and be properly defined', () => {
      expect(corpShareholdersDef).toBeDefined();
    });

    it('should have correct metadata', () => {
      expect(corpShareholdersDef.metadata.name).toBe('CorpShareholders');
      expect(corpShareholdersDef.metadata.app).toBe('corporate');
      expect(corpShareholdersDef.metadata.type).toBe('shareholders');
      expect(corpShareholdersDef.metadata.version).toBe('1.0.0');
    });

    it('should have a description', () => {
      expect(corpShareholdersDef.metadata.description).toContain('Shareholder meeting');
    });
  });

  describe('States', () => {
    it('should define all required states', () => {
      const expectedStates = ['SCHEDULED', 'RECORD_DATE_SET', 'PROXY_PERIOD', 'IN_SESSION', 'VOTING', 'CLOSED'];
      const actualStates = Object.keys(corpShareholdersDef.states);
      expectedStates.forEach((state) => {
        expect(actualStates).toContain(state);
      });
    });

    it('should have correct initial state', () => {
      expect(corpShareholdersDef.initialState).toBe('SCHEDULED');
    });

    it('should mark CLOSED as final state', () => {
      expect(corpShareholdersDef.states.CLOSED.isFinal).toBe(true);
    });

    it('should mark non-terminal states as non-final', () => {
      expect(corpShareholdersDef.states.SCHEDULED.isFinal).toBe(false);
      expect(corpShareholdersDef.states.RECORD_DATE_SET.isFinal).toBe(false);
      expect(corpShareholdersDef.states.PROXY_PERIOD.isFinal).toBe(false);
      expect(corpShareholdersDef.states.IN_SESSION.isFinal).toBe(false);
      expect(corpShareholdersDef.states.VOTING.isFinal).toBe(false);
    });

    it('should have descriptions for all states', () => {
      Object.values(corpShareholdersDef.states).forEach((state) => {
        expect(state.description).toBeDefined();
        expect(state.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Transitions', () => {
    it('should allow propose_schedule_annual transition from SCHEDULED to SCHEDULED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'SCHEDULED' && t.to === 'SCHEDULED' && t.eventName === 'propose_schedule_annual',
      );
      expect(transition).toBeDefined();
    });

    it('should allow schedule_annual transition from SCHEDULED to SCHEDULED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'SCHEDULED' && t.to === 'SCHEDULED' && t.eventName === 'schedule_annual',
      );
      expect(transition).toBeDefined();
    });

    it('should allow schedule_special transition from SCHEDULED to SCHEDULED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'SCHEDULED' && t.to === 'SCHEDULED' && t.eventName === 'schedule_special',
      );
      expect(transition).toBeDefined();
    });

    it('should allow set_record_date transition from SCHEDULED to RECORD_DATE_SET', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'SCHEDULED' && t.to === 'RECORD_DATE_SET' && t.eventName === 'set_record_date',
      );
      expect(transition).toBeDefined();
    });

    it('should allow register_eligible_shareholders transition from RECORD_DATE_SET to RECORD_DATE_SET', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) =>
          t.from === 'RECORD_DATE_SET' &&
          t.to === 'RECORD_DATE_SET' &&
          t.eventName === 'register_eligible_shareholders',
      );
      expect(transition).toBeDefined();
    });

    it('should allow open_proxy_period transition from RECORD_DATE_SET to PROXY_PERIOD', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'RECORD_DATE_SET' && t.to === 'PROXY_PERIOD' && t.eventName === 'open_proxy_period',
      );
      expect(transition).toBeDefined();
    });

    it('should allow add_agenda_item from multiple states', () => {
      const fromScheduled = corpShareholdersDef.transitions.find(
        (t) => t.from === 'SCHEDULED' && t.eventName === 'add_agenda_item',
      );
      const fromRecordDateSet = corpShareholdersDef.transitions.find(
        (t) => t.from === 'RECORD_DATE_SET' && t.eventName === 'add_agenda_item',
      );
      const fromProxyPeriod = corpShareholdersDef.transitions.find(
        (t) => t.from === 'PROXY_PERIOD' && t.eventName === 'add_agenda_item',
      );
      expect(fromScheduled).toBeDefined();
      expect(fromRecordDateSet).toBeDefined();
      expect(fromProxyPeriod).toBeDefined();
    });

    it('should allow open_meeting transition from PROXY_PERIOD to IN_SESSION', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'PROXY_PERIOD' && t.to === 'IN_SESSION' && t.eventName === 'open_meeting',
      );
      expect(transition).toBeDefined();
    });

    it('should allow open_polls transition from IN_SESSION to VOTING', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'IN_SESSION' && t.to === 'VOTING' && t.eventName === 'open_polls',
      );
      expect(transition).toBeDefined();
    });

    it('should allow cast_vote transition from VOTING to VOTING', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'VOTING' && t.eventName === 'cast_vote',
      );
      expect(transition).toBeDefined();
    });

    it('should allow close_polls transition from VOTING to IN_SESSION', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'IN_SESSION' && t.eventName === 'close_polls',
      );
      expect(transition).toBeDefined();
    });

    it('should allow certify_results transition from IN_SESSION to CLOSED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'IN_SESSION' && t.to === 'CLOSED' && t.eventName === 'certify_results',
      );
      expect(transition).toBeDefined();
    });

    it('should allow adjourn_without_action from IN_SESSION to CLOSED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'IN_SESSION' && t.to === 'CLOSED' && t.eventName === 'adjourn_without_action',
      );
      expect(transition).toBeDefined();
    });

    it('should allow adjourn_without_action from VOTING to CLOSED', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'VOTING' && t.to === 'CLOSED' && t.eventName === 'adjourn_without_action',
      );
      expect(transition).toBeDefined();
    });
  });

  describe('Transition Guards and Effects', () => {
    it('should have guard on open_meeting transition', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'open_meeting');
      expect(transition?.guard).toBeDefined();
    });

    it('should have effect on cast_vote transition', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'cast_vote');
      expect(transition?.effect).toBeDefined();
    });

    it('should emit SHAREHOLDER_MEETING_SCHEDULED on schedule_annual', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'schedule_annual');
      expect(JSON.stringify(transition?.effect)).toContain('SHAREHOLDER_MEETING_SCHEDULED');
    });

    it('should emit SPECIAL_MEETING_SCHEDULED on schedule_special', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'schedule_special');
      expect(JSON.stringify(transition?.effect)).toContain('SPECIAL_MEETING_SCHEDULED');
    });

    it('should emit RECORD_DATE_SET on set_record_date', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'set_record_date');
      expect(JSON.stringify(transition?.effect)).toContain('RECORD_DATE_SET');
    });

    it('should emit PROXY_PERIOD_OPENED on open_proxy_period', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'open_proxy_period');
      expect(JSON.stringify(transition?.effect)).toContain('PROXY_PERIOD_OPENED');
    });

    it('should emit SHAREHOLDER_MEETING_OPENED on open_meeting', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'open_meeting');
      expect(JSON.stringify(transition?.effect)).toContain('SHAREHOLDER_MEETING_OPENED');
    });

    it('should emit MEETING_RESULTS_CERTIFIED on certify_results', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'certify_results');
      expect(JSON.stringify(transition?.effect)).toContain('MEETING_RESULTS_CERTIFIED');
    });

    it('should emit MEETING_ADJOURNED on adjourn_without_action', () => {
      const transition = corpShareholdersDef.transitions.find(
        (t) => t.from === 'IN_SESSION' && t.eventName === 'adjourn_without_action',
      );
      expect(JSON.stringify(transition?.effect)).toContain('MEETING_ADJOURNED');
    });
  });

  describe('Cross References', () => {
    it('should define cross references in metadata', () => {
      expect(corpShareholdersDef.metadata.crossReferences).toBeDefined();
    });

    it('should reference entity machine', () => {
      expect(corpShareholdersDef.metadata.crossReferences?.entity).toBeDefined();
      expect(corpShareholdersDef.metadata.crossReferences?.entity.machine).toBe('corporate-entity');
    });

    it('should reference proxies machine', () => {
      expect(corpShareholdersDef.metadata.crossReferences?.proxies).toBeDefined();
      expect(corpShareholdersDef.metadata.crossReferences?.proxies.machine).toBe('corporate-proxy');
    });

    it('should reference resolutions machine', () => {
      expect(corpShareholdersDef.metadata.crossReferences?.resolutions).toBeDefined();
      expect(corpShareholdersDef.metadata.crossReferences?.resolutions.machine).toBe('corporate-resolution');
    });

    it('should reference securities machine', () => {
      expect(corpShareholdersDef.metadata.crossReferences?.securities).toBeDefined();
      expect(corpShareholdersDef.metadata.crossReferences?.securities.machine).toBe('corporate-securities');
    });
  });

  describe('Schema Validation', () => {
    it('should define createSchema with required fields', () => {
      expect(corpShareholdersDef.createSchema).toBeDefined();
      expect(corpShareholdersDef.createSchema.required).toContain('meetingId');
      expect(corpShareholdersDef.createSchema.required).toContain('entityId');
    });

    it('should define stateSchema properties', () => {
      expect(corpShareholdersDef.stateSchema).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.meetingId).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.entityId).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.status).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.eligibleVoters).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.votes).toBeDefined();
    });

    it('should mark meetingId as immutable in stateSchema', () => {
      expect(corpShareholdersDef.stateSchema.properties.meetingId.immutable).toBe(true);
    });

    it('should mark entityId as immutable in stateSchema', () => {
      expect(corpShareholdersDef.stateSchema.properties.entityId.immutable).toBe(true);
    });

    it('should mark status as computed in stateSchema', () => {
      expect(corpShareholdersDef.stateSchema.properties.status.computed).toBe(true);
    });

    it('should define eventSchemas for all events', () => {
      expect(corpShareholdersDef.eventSchemas).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.propose_schedule_annual).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.schedule_annual).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.schedule_special).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.set_record_date).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.register_eligible_shareholders).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.open_proxy_period).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.add_agenda_item).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.open_meeting).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.open_polls).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.cast_vote).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.close_polls).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.certify_results).toBeDefined();
      expect(corpShareholdersDef.eventSchemas.adjourn_without_action).toBeDefined();
    });

    it('should have required fields for schedule_annual event', () => {
      expect(corpShareholdersDef.eventSchemas.schedule_annual.required).toContain('meetingId');
      expect(corpShareholdersDef.eventSchemas.schedule_annual.required).toContain('entityId');
      expect(corpShareholdersDef.eventSchemas.schedule_annual.required).toContain('fiscalYear');
      expect(corpShareholdersDef.eventSchemas.schedule_annual.required).toContain('scheduledDate');
    });

    it('should carry boardResolutionRef on the propose_schedule_annual (phase 1) event', () => {
      // boardResolutionRef moved to phase 1 (#24): propose_schedule_annual binds it via _addDependency
      expect(corpShareholdersDef.eventSchemas.propose_schedule_annual.required).toContain('boardResolutionRef');
      expect(corpShareholdersDef.eventSchemas.propose_schedule_annual.required).toContain('meetingId');
    });

    it('should have required fields for cast_vote event', () => {
      expect(corpShareholdersDef.eventSchemas.cast_vote.required).toContain('voteId');
      expect(corpShareholdersDef.eventSchemas.cast_vote.required).toContain('agendaItemId');
      expect(corpShareholdersDef.eventSchemas.cast_vote.required).toContain('voterId');
      expect(corpShareholdersDef.eventSchemas.cast_vote.required).toContain('shareholderId');
      expect(corpShareholdersDef.eventSchemas.cast_vote.required).toContain('shareClass');
    });

    it('should have required fields for certify_results event', () => {
      expect(corpShareholdersDef.eventSchemas.certify_results.required).toContain('certifiedAt');
      expect(corpShareholdersDef.eventSchemas.certify_results.required).toContain('certifiedBy');
      expect(corpShareholdersDef.eventSchemas.certify_results.required).toContain('certificateRef');
    });
  });

  describe('Definitions', () => {
    it('should define CalledBy type', () => {
      expect(corpShareholdersDef.definitions?.CalledBy).toBeDefined();
    });

    it('should define NoticeInfo type', () => {
      expect(corpShareholdersDef.definitions?.NoticeInfo).toBeDefined();
    });

    it('should define RecordDate type', () => {
      expect(corpShareholdersDef.definitions?.RecordDate).toBeDefined();
    });

    it('should define EligibleVoter type', () => {
      expect(corpShareholdersDef.definitions?.EligibleVoter).toBeDefined();
    });

    it('should define QuorumRequirements type', () => {
      expect(corpShareholdersDef.definitions?.QuorumRequirements).toBeDefined();
    });

    it('should define AgendaItem type', () => {
      expect(corpShareholdersDef.definitions?.AgendaItem).toBeDefined();
    });

    it('should define ProxyPeriod type', () => {
      expect(corpShareholdersDef.definitions?.ProxyPeriod).toBeDefined();
    });

    it('should define Vote type', () => {
      expect(corpShareholdersDef.definitions?.Vote).toBeDefined();
    });

    it('should define VoteTally type', () => {
      expect(corpShareholdersDef.definitions?.VoteTally).toBeDefined();
    });

    it('should define Inspector type', () => {
      expect(corpShareholdersDef.definitions?.Inspector).toBeDefined();
    });

    it('should define SessionInfo type', () => {
      expect(corpShareholdersDef.definitions?.SessionInfo).toBeDefined();
    });

    it('should define Certification type', () => {
      expect(corpShareholdersDef.definitions?.Certification).toBeDefined();
    });
  });

  describe('Two-phase annual-meeting scheduling (#24)', () => {
    it('propose_schedule_annual binds the board resolution via _addDependency', () => {
      const propose = corpShareholdersDef.transitions.find((t) => t.eventName === 'propose_schedule_annual');
      expect(propose).toBeDefined();
      const effectStr = JSON.stringify(propose?.effect);
      expect(effectStr).toContain('_addDependency');
      expect(effectStr).toContain('boardResolutionRef');
    });

    it('schedule_annual gates on the bound resolution reaching EXECUTED (depInState), not a dropped object-dep', () => {
      const transition = corpShareholdersDef.transitions.find((t) => t.eventName === 'schedule_annual');
      const guardStr = JSON.stringify(transition?.guard);
      // dynamic currentStateId assert on the bound resolution + the recorded proposal match
      expect(guardStr).toContain('EXECUTED');
      expect(guardStr).toContain('pendingschedule_annual');
      // the dropped object-form dependency is gone — gating now lives in the guard
      expect(transition?.dependencies).toEqual([]);
    });
  });

  describe('Authorization (identity hardening)', () => {
    const guardOf = (eventName: string) =>
      JSON.stringify(corpShareholdersDef.transitions.find((t) => t.eventName === eventName)?.guard);

    it('should pin registrar as a required, immutable authority address', () => {
      expect(corpShareholdersDef.createSchema.required).toContain('registrar');
      expect(corpShareholdersDef.createSchema.properties.registrar.type).toBe('address');
      expect(corpShareholdersDef.createSchema.properties.registrar.immutable).toBe(true);
      expect(corpShareholdersDef.stateSchema.properties.registrar).toBeDefined();
      expect(corpShareholdersDef.stateSchema.properties.registrar.immutable).toBe(true);
    });

    it('should add an address of record to the EligibleVoter definition', () => {
      expect(corpShareholdersDef.definitions?.EligibleVoter.properties?.address.type).toBe('address');
    });

    it('should accept an address per shareholder in register_eligible_shareholders event', () => {
      const shItems = corpShareholdersDef.eventSchemas.register_eligible_shareholders.properties.shareholders.items as {
        properties: Record<string, { type?: string }>;
      };
      expect(shItems.properties.address.type).toBe('address');
    });

    it('should gate register_eligible_shareholders on the pinned registrar via proofs', () => {
      const g = guardOf('register_eligible_shareholders');
      expect(g).toContain('state.registrar');
      expect(g).toContain('proofs');
      expect(g).not.toBe(JSON.stringify({ '==': [1, 1] }));
    });

    it('should bind cast_vote to a roster entry whose address signed (matched-entry shareholderId)', () => {
      const g = guardOf('cast_vote');
      expect(g).toContain('state.eligibleVoters');
      // the matched roster entry's address must be among the verified signers
      expect(g).toContain('proofs');
      expect(g).toContain('"var":"address"');
      // event.shareholderId is now only a roster lookup key, bound to that entry's address
      expect(g).toContain('event.shareholderId');
    });
  });
});
