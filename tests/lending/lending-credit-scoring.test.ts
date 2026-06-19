import { describe, it, expect } from '@jest/globals';
import {
  reputationScore,
  reputationCreditRule,
  buildCreditDataContext,
  reputationAuthorityClause,
} from '../../src/apps/lending/credit-scoring';
import { exprHash } from '../../src/zk/index';
import { DEFAULT_REPUTATION_CONFIG } from '../../src/apps/identity/index';

// minimal attestation stand-ins (only `delta` matters to scoring)
const att = (delta: number) => ({ delta });

describe('lending/credit-scoring — creditScore IS identity reputation', () => {
  it('reputationScore = baseReputation + Σ delta, floored at minReputation', () => {
    expect(reputationScore([])).toBe(DEFAULT_REPUTATION_CONFIG.baseReputation); // 10
    expect(reputationScore([att(5), att(2), att(3)])).toBe(20); // 10 + 5+2+3
    // floors at minReputation (0) rather than going negative
    expect(reputationScore([att(-10), att(-10)])).toBe(0);
    // honors a custom config
    expect(reputationScore([att(5)], { baseReputation: 100, minReputation: 0 })).toBe(105);
  });

  it('buildCreditDataContext sources creditScore from the borrower attestations', () => {
    const ctx = buildCreditDataContext({
      borrowerId: 'did:otto:alice',
      attestations: [att(5), att(5), att(3)],
      collateralValue: 1500,
    });
    expect(ctx).toEqual({ collateralValue: 1500, creditScore: 23, subject: 'did:otto:alice' });
  });

  it('reputationCreditRule binds collateral + score floor + the borrower subject', () => {
    const rule = reputationCreditRule({
      collateralRatioPct: 150,
      loanAmount: 1000,
      minCreditScore: 18,
      borrowerId: 'did:otto:alice',
    }) as { and: unknown[] };
    expect(rule.and).toHaveLength(3); // coverage, score floor, subject bind
    // collateral coverage: collateralValue*100 >= loanAmount*ratio
    expect(rule.and[0]).toEqual({ '>=': [{ '*': [{ var: 'collateralValue' }, 100] }, 150000] });
    // reputation floor
    expect(rule.and[1]).toEqual({ '>=': [{ var: 'creditScore' }, 18] });
    // subject binding — the score must belong to THIS identity
    expect(rule.and[2]).toEqual({ '===': [{ var: 'subject' }, 'did:otto:alice'] });
  });

  it('omitting minCreditScore still binds coverage + subject (two clauses)', () => {
    const rule = reputationCreditRule({
      collateralRatioPct: 200,
      loanAmount: 500,
      borrowerId: 'did:otto:bob',
    }) as { and: unknown[] };
    expect(rule.and).toHaveLength(2);
    expect(rule.and[1]).toEqual({ '===': [{ var: 'subject' }, 'did:otto:bob'] });
  });

  it('the borrower identity is pinned into the logicHash (reputation cannot be borrowed)', () => {
    const base = { collateralRatioPct: 150, loanAmount: 1000, minCreditScore: 18 };
    const alice = exprHash(reputationCreditRule({ ...base, borrowerId: 'did:otto:alice' }));
    const bob = exprHash(reputationCreditRule({ ...base, borrowerId: 'did:otto:bob' }));
    expect(alice).not.toBe(bob); // a different borrower ⇒ a different pinned rule
    // deterministic for the same borrower
    expect(alice).toBe(exprHash(reputationCreditRule({ ...base, borrowerId: 'did:otto:alice' })));
  });

  it('reputationAuthorityClause pins the authority pubkey as a literal (never witness-supplied)', () => {
    const authorityPubKey = `0x${'ab'.repeat(32)}`;
    expect(reputationAuthorityClause(authorityPubKey)).toEqual({
      schnorr_verify: [authorityPubKey, { var: 'scoreCommit' }, { var: 'repSig' }],
    });
  });
});
