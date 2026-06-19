/**
 * Tests for the LendingZkLoan state machine: lifecycle, transitions, the zk origination
 * gate structure, and the toProtoDefinition wire shape.
 */
import { describe, expect, it } from '@jest/globals';
import { lendingZkLoanDef } from '../../src/apps/lending/state-machines/lending-zk-loan';
import { getLendingDefinition, LENDING_DEFINITIONS } from '../../src/apps/lending';
import { toProtoDefinition } from '../../src/schema/fiber-app';

describe('LendingZkLoan state machine', () => {
  it('is defined via defineFiberApp with lending metadata', () => {
    expect(lendingZkLoanDef).toBeDefined();
    expect(lendingZkLoanDef.metadata.name).toBe('LendingZkLoan');
    expect(lendingZkLoanDef.metadata.app).toBe('lending');
    expect(lendingZkLoanDef.metadata.type).toBe('zkLoan');
    expect(lendingZkLoanDef.metadata.version).toBe('1.0.0');
  });

  it('cross-references the borrower, lender, collateral and debt assets', () => {
    const xrefs = lendingZkLoanDef.metadata.crossReferences!;
    expect(xrefs).toHaveProperty('borrowerIdentityId');
    expect(xrefs).toHaveProperty('lenderIdentityId');
    expect(xrefs).toHaveProperty('collateralAssetId');
    expect(xrefs).toHaveProperty('debtAssetId');
  });

  it('has the loan lifecycle states with correct finality', () => {
    expect(lendingZkLoanDef.states.REQUESTED.isFinal).toBe(false);
    expect(lendingZkLoanDef.states.COLLATERAL_LOCKED.isFinal).toBe(false);
    expect(lendingZkLoanDef.states.ACTIVE.isFinal).toBe(false);
    expect(lendingZkLoanDef.states.DEFAULTED.isFinal).toBe(false);
    expect(lendingZkLoanDef.states.REPAID.isFinal).toBe(true);
    expect(lendingZkLoanDef.states.LIQUIDATED.isFinal).toBe(true);
    expect(lendingZkLoanDef.states.CANCELLED.isFinal).toBe(true);
  });

  it('starts in REQUESTED', () => {
    expect(lendingZkLoanDef.initialState).toBe('REQUESTED');
  });

  it('requires the public loan params + the pinned rule constants on create', () => {
    const req = lendingZkLoanDef.createSchema!.required!;
    for (const k of [
      'borrower',
      'lender',
      'principalAmount',
      'collateralAssetId',
      'lendingRuleVKey',
      'lendingRuleLogicHash',
      'keccakTrue',
    ]) {
      expect(req).toContain(k);
    }
  });

  it('drives the full REQUESTED→COLLATERAL_LOCKED→ACTIVE→REPAID happy path', () => {
    const byEvent = (e: string, from?: string) =>
      lendingZkLoanDef.transitions.find((t) => t.eventName === e && (from ? t.from === from : true));

    expect(byEvent('lock_collateral')).toMatchObject({ from: 'REQUESTED', to: 'COLLATERAL_LOCKED' });
    expect(byEvent('originate')).toMatchObject({ from: 'COLLATERAL_LOCKED', to: 'ACTIVE' });
    expect(byEvent('repay')).toMatchObject({ from: 'ACTIVE', to: 'REPAID' });
  });

  it('drives the default→liquidation path', () => {
    const def = lendingZkLoanDef.transitions.find((t) => t.eventName === 'default_loan');
    const liq = lendingZkLoanDef.transitions.find((t) => t.eventName === 'liquidate');
    expect(def).toMatchObject({ from: 'ACTIVE', to: 'DEFAULTED' });
    expect(liq).toMatchObject({ from: 'DEFAULTED', to: 'LIQUIDATED' });
  });

  it('every state carries non-null { label, description, category }', () => {
    for (const [id, s] of Object.entries(lendingZkLoanDef.states)) {
      expect(s.metadata).not.toBeNull();
      const m = s.metadata as Record<string, unknown>;
      expect(typeof m.label).toBe('string');
      expect((m.label as string).length).toBeGreaterThan(0);
      expect(typeof m.description).toBe('string');
      expect(s.id).toBe(id);
    }
    // initial is 'initial', finals are 'terminal'
    expect((lendingZkLoanDef.states.REQUESTED.metadata as Record<string, unknown>).category).toBe('initial');
    for (const s of Object.values(lendingZkLoanDef.states)) {
      const cat = (s.metadata as Record<string, unknown>).category;
      if (s.isFinal) expect(cat).toBe('terminal');
      else expect(cat).not.toBe('terminal');
    }
  });

  describe('origination guard (the zk eligibility gate)', () => {
    const originate = lendingZkLoanDef.transitions.find((t) => t.eventName === 'originate')!;
    // The `as const` definition yields deeply-readonly tuples; normalize to plain JSON for
    // structural assertions (cast through unknown).
    const guardJson = originate.guard as unknown as { and: Record<string, unknown[]>[] };
    const effectJson = originate.effect as unknown as { merge: unknown[] };

    it('is an AND of the lender check, groth16_verify, and the public-value bindings', () => {
      expect(guardJson).toHaveProperty('and');
      const clauses = guardJson.and;
      // 5 clauses: lender-is-a-verified-signer, groth16_verify, exprHash bind, outputHash bind, ok bit.
      expect(clauses.length).toBe(5);
      // clause 1: only the lender may originate — bound to the chain-verified proofs[].address, NOT a
      // forgeable event.agent payload field.
      expect(clauses[0]).toEqual({
        in: [{ var: 'state.lender' }, { map: [{ var: 'proofs' }, { var: 'address' }] }],
      });
      // clause 2: groth16_verify over witness.{publicValues,proof} with the pinned vkey
      expect(clauses[1]).toHaveProperty('groth16_verify');
      const g = (clauses[1] as { groth16_verify: unknown[] }).groth16_verify;
      expect(g[0]).toEqual({ var: 'state.lendingRuleVKey' });
      expect(g[1]).toEqual({ var: 'event.witness.publicValues' });
      expect(g[2]).toEqual({ var: 'event.witness.proof' });
    });

    it('binds exprHash to the pinned lendingRuleLogicHash via cat/substr', () => {
      const clauses = guardJson.and;
      const exprBind = clauses[2]['==='] as unknown[];
      // LHS reconstructs 0x + substr(publicValues, 2, 64); RHS is the pinned logicHash.
      expect(exprBind[0]).toEqual({
        cat: ['0x', { substr: [{ var: 'event.witness.publicValues' }, 2, 64] }],
      });
      expect(exprBind[1]).toEqual({ var: 'state.lendingRuleLogicHash' });
    });

    it('binds outputHash to the pinned keccakTrue and checks the ok bit', () => {
      const clauses = guardJson.and;
      const outBind = clauses[3]['==='] as unknown[];
      expect(outBind[0]).toEqual({
        cat: ['0x', { substr: [{ var: 'event.witness.publicValues' }, 130, 64] }],
      });
      expect(outBind[1]).toEqual({ var: 'state.keccakTrue' });
      const okBind = clauses[4]['==='] as unknown[];
      expect(okBind[0]).toEqual({ substr: [{ var: 'event.witness.publicValues' }, 256, 2] });
      expect(okBind[1]).toBe('01');
    });

    it('mints the debt asset to the borrower and activates on success', () => {
      expect(effectJson.merge[0]).toEqual({ var: 'state' });
      expect(effectJson.merge[1]).toMatchObject({ status: 'ACTIVE', debtAssetId: { var: 'event.debtAssetId' } });
    });
  });

  it('moves collateral via the reserved _transferAsset effect directive (not a dropped emits block)', () => {
    const repay = lendingZkLoanDef.transitions.find((t) => t.eventName === 'repay')!;
    const liq = lendingZkLoanDef.transitions.find((t) => t.eventName === 'liquidate')!;
    // transition-level `emits` is dropped by the engine — the transfer must ride in the effect result.
    expect((repay as { emits?: unknown }).emits).toBeUndefined();
    const mergeOf = (t: unknown) =>
      (t as { effect: { merge: Record<string, unknown>[] } }).effect.merge[1];
    const repayXfer = mergeOf(repay)._transferAsset;
    const liqXfer = mergeOf(liq)._transferAsset;
    expect(repayXfer).toEqual([
      { assetId: { var: 'state.collateralAssetId' }, recipient: { var: 'state.borrower' } },
    ]);
    expect(liqXfer).toEqual([
      { assetId: { var: 'state.collateralAssetId' }, recipient: { var: 'state.lender' } },
    ]);
  });
});

describe('getLendingDefinition', () => {
  it('returns the zkLoan def by default and by key', () => {
    expect(getLendingDefinition()).toBe(lendingZkLoanDef);
    expect(getLendingDefinition('zkLoan')).toBe(lendingZkLoanDef);
    expect(LENDING_DEFINITIONS.zkLoan).toBe(lendingZkLoanDef);
  });
});

describe('LendingZkLoan toProtoDefinition wire shape', () => {
  const proto = toProtoDefinition(lendingZkLoanDef);

  it('strips SDK-only schema fields', () => {
    expect(proto).not.toHaveProperty('createSchema');
    expect(proto).not.toHaveProperty('stateSchema');
    expect(proto).not.toHaveProperty('eventSchemas');
  });

  it('keeps states as { id, isFinal } only (no metadata leak)', () => {
    for (const s of Object.values(proto.states)) {
      expect(Object.keys(s).sort()).toEqual(['id', 'isFinal']);
      expect(typeof s.id).toBe('string');
      expect(typeof s.isFinal).toBe('boolean');
    }
  });

  it('keeps transitions with from/to/eventName/guard/effect and string[] dependencies', () => {
    for (const t of proto.transitions) {
      expect(t).toHaveProperty('from');
      expect(t).toHaveProperty('to');
      expect(t).toHaveProperty('eventName');
      // dependencies, when present, are a string[] (omitted entirely when empty)
      if ('dependencies' in t && t.dependencies) {
        expect(Array.isArray(t.dependencies)).toBe(true);
      }
    }
  });

  it('does NOT reference $timestamp anywhere (loan uses $ordinal)', () => {
    const json = JSON.stringify(proto);
    expect(json).not.toContain('$timestamp');
    expect(json).toContain('$ordinal');
  });

  it('strips FiberAppMetadata from the wire proto (no metadata leak — chain-aligned)', () => {
    // toProtoDefinition drops metadata (name/version/crossReferences) so it never rides on-chain.
    expect(proto.metadata).toBeUndefined();
  });
});
