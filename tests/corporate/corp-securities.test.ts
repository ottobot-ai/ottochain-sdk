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

    // Emits are relocated into the transition effect as a reserved `_emit` directive (the chain
    // `Transition` has no `emits` field, so transition-level `emits` were silently dropped). Assert the
    // event name now rides in the effect JSON.
    const effectOf = (eventName: string, from?: string) =>
      JSON.stringify(
        corpSecuritiesDef.transitions.find(
          t => t.eventName === eventName && (from === undefined || t.from === from)
        )?.effect
      );

    it('should emit SHARES_ISSUED on issue_shares', () => {
      const e = effectOf('issue_shares');
      expect(e).toContain('_emit');
      expect(e).toContain('SHARES_ISSUED');
    });

    it('should emit TRANSFER_INITIATED on initiate_transfer', () => {
      const e = effectOf('initiate_transfer');
      expect(e).toContain('_emit');
      expect(e).toContain('TRANSFER_INITIATED');
    });

    it('should emit TRANSFER_COMPLETED on complete_transfer', () => {
      const e = effectOf('complete_transfer');
      expect(e).toContain('_emit');
      expect(e).toContain('TRANSFER_COMPLETED');
    });

    it('should emit SHARES_REPURCHASED on repurchase', () => {
      const e = effectOf('repurchase');
      expect(e).toContain('_emit');
      expect(e).toContain('SHARES_REPURCHASED');
    });

    it('should emit TREASURY_SHARES_REISSUED on reissue_from_treasury', () => {
      const e = effectOf('reissue_from_treasury');
      expect(e).toContain('_emit');
      expect(e).toContain('TREASURY_SHARES_REISSUED');
    });

    it('should emit SHARES_RETIRED on retire', () => {
      const e = effectOf('retire', 'ISSUED');
      expect(e).toContain('_emit');
      expect(e).toContain('SHARES_RETIRED');
    });

    it('should emit STOCK_SPLIT_APPLIED on stock_split', () => {
      const e = effectOf('stock_split');
      expect(e).toContain('_emit');
      expect(e).toContain('STOCK_SPLIT_APPLIED');
    });

    it('should emit RESTRICTION_REMOVED on remove_restriction', () => {
      const e = effectOf('remove_restriction');
      expect(e).toContain('_emit');
      expect(e).toContain('RESTRICTION_REMOVED');
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
      expect(corpSecuritiesDef.eventSchemas.issue_shares.required).toContain('consideration');
      // boardResolutionRef moved to the phase-1 propose_issue event (two-phase #24 gating)
      expect(corpSecuritiesDef.eventSchemas.propose_issue.required).toContain('boardResolutionRef');
    });

    it('should have required fields for retire event', () => {
      expect(corpSecuritiesDef.eventSchemas.retire.required).toContain('retiredDate');
      expect(corpSecuritiesDef.eventSchemas.retire.required).toContain('retirementMethod');
      // boardResolutionRef moved to the phase-1 propose_retire event (two-phase #24 gating)
      expect(corpSecuritiesDef.eventSchemas.propose_retire.required).toContain('boardResolutionRef');
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

  // The dropped object-form `dependencies` (which the chain silently never gated) are replaced by the
  // two-phase #24 pattern: a phase-1 `propose_<X>` transition binds the dependency fiber via the reserved
  // `_addDependency` effect directive and records a `pending<X>` object; the gated `<X>` transition then
  // asserts the bound dependency's state via `depInState` (which renders the required lifecycle state into
  // the guard JSON) and carries an empty `dependencies` array.
  describe('Dependencies (two-phase #24 gating)', () => {
    const transition = (eventName: string, from?: string) =>
      corpSecuritiesDef.transitions.find(
        t => t.eventName === eventName && (from === undefined || t.from === from)
      );
    const effectJson = (eventName: string, from?: string) =>
      JSON.stringify(transition(eventName, from)?.effect);
    const guardJson = (eventName: string, from?: string) =>
      JSON.stringify(transition(eventName, from)?.guard);

    it.each([
      ['issue_shares', 'propose_issue', 'pendingIssue', 'EXECUTED'],
      ['repurchase', 'propose_repurchase', 'pendingRepurchase', 'EXECUTED'],
      ['reissue_from_treasury', 'propose_reissue', 'pendingReissue', 'EXECUTED'],
      ['declare_dividend', 'propose_dividend', 'pendingDividend', 'EXECUTED'],
    ])(
      '%s is two-phased: %s binds via _addDependency and the gated guard asserts %s in %s',
      (gated, propose, pending, requiredState) => {
        // phase 1: the propose transition binds the dependency fiber
        expect(effectJson(propose)).toContain('_addDependency');
        // phase 2: the gated transition asserts the bound state and no longer uses object-form deps
        const g = guardJson(gated);
        expect(g).toContain(pending);
        expect(g).toContain(requiredState);
        expect(transition(gated)?.dependencies).toEqual([]);
      }
    );

    it('retire (both from-states) is two-phased via propose_retire / pendingRetire', () => {
      expect(effectJson('propose_retire', 'ISSUED')).toContain('_addDependency');
      expect(effectJson('propose_retire', 'TREASURY')).toContain('_addDependency');
      for (const from of ['ISSUED', 'TREASURY']) {
        const g = guardJson('retire', from);
        expect(g).toContain('pendingRetire');
        expect(g).toContain('EXECUTED');
        expect(transition('retire', from)?.dependencies).toEqual([]);
      }
    });

    it('issue_shares additionally asserts the parent entity is ACTIVE via depInState', () => {
      const g = guardJson('issue_shares');
      expect(g).toContain('state.entityId');
      expect(g).toContain('ACTIVE');
    });
  });

  describe('Authorization (identity hardening)', () => {
    const guardOf = (eventName: string, from?: string) =>
      JSON.stringify(
        corpSecuritiesDef.transitions.find(
          t => t.eventName === eventName && (from === undefined || t.from === from)
        )?.guard
      );

    it('should pin issuerAddress as a required, immutable createSchema/stateSchema field', () => {
      expect(corpSecuritiesDef.createSchema.required).toContain('issuerAddress');
      expect(corpSecuritiesDef.createSchema.properties.issuerAddress.type).toBe('address');
      expect(corpSecuritiesDef.createSchema.properties.issuerAddress.immutable).toBe(true);
      expect(corpSecuritiesDef.stateSchema.properties.issuerAddress).toBeDefined();
      expect(corpSecuritiesDef.stateSchema.properties.issuerAddress.immutable).toBe(true);
    });

    it('should expose a holder walletAddress in the Holder definition', () => {
      expect(corpSecuritiesDef.definitions?.Holder.properties?.walletAddress.type).toBe('address');
    });

    it('should NOT leave any state-changing guard as constant-true {==:[1,1]}', () => {
      const tautology = JSON.stringify({ '==': [1, 1] });
      for (const t of corpSecuritiesDef.transitions) {
        expect(JSON.stringify(t.guard)).not.toBe(tautology);
      }
    });

    it.each([
      'authorize_shares',
      'issue_shares',
      'reissue_from_treasury',
      'stock_split',
      'declare_dividend',
      'remove_restriction',
      'complete_transfer',
    ])('should gate issuer-privileged %s on the verified signer of state.issuerAddress', (ev) => {
      const g = guardOf(ev);
      expect(g).toContain('state.issuerAddress');
      expect(g).toContain('proofs');
    });

    it.each(['retire'])('should gate %s (both from-states) on state.issuerAddress', (ev) => {
      const issued = guardOf(ev, 'ISSUED');
      const treasury = guardOf(ev, 'TREASURY');
      expect(issued).toContain('state.issuerAddress');
      expect(treasury).toContain('state.issuerAddress');
      expect(issued).toContain('proofs');
      expect(treasury).toContain('proofs');
    });

    it('should gate holder-initiated initiate_transfer on the current holder wallet ∈ proofs while preserving restriction checks', () => {
      const g = guardOf('initiate_transfer');
      expect(g).toContain('state.holder.walletAddress');
      expect(g).toContain('proofs');
      // restriction / rofr logic preserved
      expect(g).toContain('state.restrictions');
    });

    it('should gate holder-initiated repurchase on the current holder wallet ∈ proofs', () => {
      const g = guardOf('repurchase');
      expect(g).toContain('state.holder.walletAddress');
      expect(g).toContain('proofs');
    });

    it('should no longer read the forgeable event identity in any guard', () => {
      // Authorization must bind to proofs/state, never to attacker-supplied event identity. The two-phase
      // #24 gated transitions (issue_shares / reissue_from_treasury) DO read event.holderId — but only as
      // the proposal-correlation KEY (`state.pending<X>.holderId == event.holderId`), exactly the corp-board
      // `state.pendingRemoval.directorId == event.directorId` pattern. Authorization there is the separate
      // signerIsParty(...) clause. So exempt those correlation-key reads while keeping every other guard
      // strictly free of forgeable event identity.
      const correlationKeyGated = new Set(['issue_shares', 'reissue_from_treasury']);
      for (const t of corpSecuritiesDef.transitions) {
        if (correlationKeyGated.has(t.eventName)) {
          // the event.holderId read must be a correlation match against the recorded proposal, not auth
          const g = JSON.stringify(t.guard);
          expect(g).toContain('proofs'); // authorization still binds to verified signers
          expect(g).toMatch(/pending\w+\.holderId/); // and the event read is the proposal-key match
        } else {
          expect(JSON.stringify(t.guard)).not.toContain('event.holderId');
        }
      }
    });
  });
});
