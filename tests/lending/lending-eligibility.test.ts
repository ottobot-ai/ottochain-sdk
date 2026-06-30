/**
 * Tests for the eligibility-proof model: the pinned public rule, its logicHash binding, the
 * origination guard, and witness construction. Where possible the JSON-Logic is EXECUTED with
 * the real metagraph-sdk-jlvm evaluator (which supports substr/cat/===/groth16_verify) so the
 * publicValues byte offsets and the rule semantics are verified behaviorally.
 */
import { describe, expect, it } from '@jest/globals';
import * as jlvm from '@constellation-network/metagraph-sdk-jlvm';
import {
  lendingRule,
  pinLendingRule,
  buildOriginationGuard,
  buildEligibilityWitness,
} from '../../src/apps/lending/eligibility';
import { exprHash, KECCAK_TRUE, decodeJlvmPublicValues } from '../../src/zk/index';

const apply = (logic: unknown, data: unknown): unknown =>
  (jlvm.jsonLogic ?? (jlvm as { default: { apply: (l: unknown, d: unknown) => unknown } }).default).apply(logic, data);

/** Build a publicValues blob matching the JlvmPublicValues ABI layout for a given rule + ok bit. */
function makePublicValues(rule: unknown, ok: boolean): `0x${string}` {
  const strip = (h: string) => (h.startsWith('0x') ? h.slice(2) : h);
  const word = (hex: string) => strip(hex).padStart(64, '0');
  const exprH = exprHash(rule); // word 0
  const dataH = '0x' + 'ab'.repeat(32); // word 1 (private — arbitrary here)
  const outH = ok ? KECCAK_TRUE : '0x' + '00'.repeat(32); // word 2
  const okWord = '0'.repeat(62) + (ok ? '01' : '00'); // word 3 (bool right-aligned)
  return `0x${word(exprH)}${word(dataH)}${word(outH)}${okWord}` as `0x${string}`;
}

describe('lending rule', () => {
  it('encodes collateral coverage with literal bounds (no floats)', () => {
    const rule = lendingRule({ collateralRatioPct: 150, loanAmount: 1000 });
    // collateralValue * 100 >= 1000 * 150 = 150000
    expect(apply(rule, { collateralValue: 1600 })).toBe(true); // 160000 >= 150000
    expect(apply(rule, { collateralValue: 1500 })).toBe(true); // 150000 >= 150000
    expect(apply(rule, { collateralValue: 1499 })).toBe(false); // 149900 < 150000
  });

  it('ANDs a credit-score floor when provided', () => {
    const rule = lendingRule({ collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 680 });
    expect(apply(rule, { collateralValue: 1600, creditScore: 700 })).toBe(true);
    expect(apply(rule, { collateralValue: 1600, creditScore: 650 })).toBe(false); // score floor fails
    expect(apply(rule, { collateralValue: 1000, creditScore: 800 })).toBe(false); // coverage fails
  });

  it('keeps the financials PRIVATE — only collateralValue/creditScore vars, no addresses/amounts leaked into the data context', () => {
    const rule = lendingRule({ collateralRatioPct: 200, loanAmount: 5000, minCreditScore: 720 });
    // The rule references ONLY the private witness fields; the public bound is baked in as a literal.
    const json = JSON.stringify(rule);
    expect(json).toContain('collateralValue');
    expect(json).toContain('creditScore');
    expect(json).toContain(String(5000 * 200)); // 1000000 literal bound
  });
});

describe('pinLendingRule', () => {
  const vkey = ('0x' + '11'.repeat(32)) as `0x${string}`;

  it('pins logicHash = keccak256(canonicalize(rule)) and keccakTrue', () => {
    const params = { collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 680 };
    const pinned = pinLendingRule(params, vkey);
    expect(pinned.logicHash).toBe(exprHash(lendingRule(params)));
    expect(pinned.keccakTrue).toBe(KECCAK_TRUE);
    expect(pinned.vkey).toBe(vkey);
    // logicHash is a 0x + 64 hex (32-byte) keccak digest
    expect(pinned.logicHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('different bounds ⇒ different logicHash (the bounds ARE pinned)', () => {
    const a = pinLendingRule({ collateralRatioPct: 150, loanAmount: 1000 }, vkey).logicHash;
    const b = pinLendingRule({ collateralRatioPct: 200, loanAmount: 1000 }, vkey).logicHash;
    expect(a).not.toBe(b);
  });
});

describe('buildOriginationGuard — behavioral binding checks', () => {
  const rule = lendingRule({ collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 680 });
  const pinned = pinLendingRule(
    { collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 680 },
    ('0x' + '22'.repeat(32)) as `0x${string}`,
  );

  // Evaluate just the binding sub-clauses (clauses 2..4) — these do NOT need a valid proof.
  const guard = buildOriginationGuard() as { and: Record<string, unknown>[] };
  const exprBind = guard.and[1];
  const outBind = guard.and[2];
  const okBind = guard.and[3];

  const state = {
    lendingRuleVKey: pinned.vkey,
    lendingRuleLogicHash: pinned.logicHash,
    keccakTrue: pinned.keccakTrue,
  };

  it('exprHash binding is TRUE for a publicValues blob committing the pinned rule', () => {
    const pv = makePublicValues(rule, true);
    expect(apply(exprBind, { witness: { publicValues: pv }, state })).toBe(true);
  });

  it('exprHash binding is FALSE for a blob committing a DIFFERENT rule', () => {
    const otherRule = lendingRule({ collateralRatioPct: 999, loanAmount: 1 });
    const pv = makePublicValues(otherRule, true);
    expect(apply(exprBind, { witness: { publicValues: pv }, state })).toBe(false);
  });

  it('outputHash binding is TRUE iff the committed output is keccak(true)', () => {
    expect(apply(outBind, { witness: { publicValues: makePublicValues(rule, true) }, state })).toBe(true);
    expect(apply(outBind, { witness: { publicValues: makePublicValues(rule, false) }, state })).toBe(false);
  });

  it('ok-bit clause is TRUE for ok=01 and FALSE for ok=00', () => {
    expect(apply(okBind, { witness: { publicValues: makePublicValues(rule, true) } })).toBe(true);
    expect(apply(okBind, { witness: { publicValues: makePublicValues(rule, false) } })).toBe(false);
  });

  it('the slicing offsets agree with the client-side decodeJlvmPublicValues', () => {
    const pv = makePublicValues(rule, true);
    const decoded = decodeJlvmPublicValues(pv);
    expect(decoded.exprHash).toBe(pinned.logicHash);
    expect(decoded.outputHash).toBe(KECCAK_TRUE);
    expect(decoded.ok).toBe(true);
  });

  it('full guard gracefully REJECTS (false) a garbage proof (groth16_verify fails closed)', () => {
    // A real SP1 proof cannot be forged in a unit test; groth16_verify returns false for a
    // dummy proof, so the whole AND short-circuits to false — the graceful-reject path.
    const witness = buildEligibilityWitness({
      publicValues: makePublicValues(rule, true),
      proof: ('0x' + '00'.repeat(8)) as `0x${string}`,
    });
    const full = { and: [{ '===': [{ var: 'event.agent' }, { var: 'state.lender' }] }, ...guard.and] };
    const result = apply(full, {
      event: { agent: 'lenderAddr' },
      state: { ...state, lender: 'lenderAddr' },
      witness,
    });
    expect(result).toBe(false);
  });
});

describe('buildEligibilityWitness', () => {
  it('produces the { publicValues, proof } the guard reads under `witness`', () => {
    const w = buildEligibilityWitness({
      publicValues: '0xdead' as `0x${string}`,
      proof: '0xbeef' as `0x${string}`,
    });
    expect(w).toEqual({ publicValues: '0xdead', proof: '0xbeef' });
  });
});
