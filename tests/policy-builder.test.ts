/**
 * Tests for the PolicyBuilder — JLVM delegation policy expression factory.
 *
 * Validates that:
 * 1. Each of the 5 "delegation operators" produces the correct JSON Logic structure
 * 2. Compound operators combine predicates correctly
 * 3. Composition helpers (and, or, not) work as expected
 * 4. Serialization round-trips cleanly
 *
 * Note: These tests verify the JSON Logic *structure*, not evaluation.
 * Evaluation is tested on the metagraph side (Scala DelegationPredicatesSuite).
 */

import {
  PolicyBuilder,
  DELEGATION_KEYS,
  type JsonLogicExpression,
} from '../src/delegation/policy-builder.js';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Check that an expression is an object with the given root operator key.
 */
function hasOp(expr: JsonLogicExpression, op: string): boolean {
  return typeof expr === 'object' && expr !== null && op in expr;
}

function getOp(expr: JsonLogicExpression, op: string): unknown[] {
  if (typeof expr !== 'object' || expr === null || !(op in expr)) {
    throw new Error(`Expression does not have operator "${op}": ${JSON.stringify(expr)}`);
  }
  return (expr as Record<string, unknown[]>)[op];
}

// ─────────────────────────────────────────────
// Core Operators
// ─────────────────────────────────────────────

describe('PolicyBuilder.isDelegationActive — verify_delegation', () => {
  it('produces strict-equal expression comparing delegation.active to true', () => {
    const expr = PolicyBuilder.isDelegationActive();
    expect(hasOp(expr, '===')).toBe(true);
    const [left, right] = getOp(expr, '===');
    expect((left as Record<string, unknown>)['var']).toBe(DELEGATION_KEYS.ACTIVE);
    expect(right).toBe(true);
  });

  it('uses false as default when delegation context is absent', () => {
    const expr = PolicyBuilder.isDelegationActive();
    const [left] = getOp(expr, '===');
    expect((left as Record<string, unknown>)['default']).toBe(false);
  });
});

describe('PolicyBuilder.notExpired — check_delegation_expiry', () => {
  it('produces a >= expression: expiresAt >= $ordinal', () => {
    const expr = PolicyBuilder.notExpired();
    expect(hasOp(expr, '>=')).toBe(true);
    const [left, right] = getOp(expr, '>=');
    expect((left as Record<string, unknown>)['var']).toBe(DELEGATION_KEYS.EXPIRES_AT);
    expect((right as Record<string, unknown>)['var']).toBe('$ordinal');
  });

  it('defaults both operands to 0 when context is absent', () => {
    const expr = PolicyBuilder.notExpired();
    const [left, right] = getOp(expr, '>=');
    expect((left as Record<string, unknown>)['default']).toBe(0);
    expect((right as Record<string, unknown>)['default']).toBe(0);
  });
});

describe('PolicyBuilder.hasScope — validate_delegation_scope', () => {
  it('produces an or expression for exact match and wildcard', () => {
    const expr = PolicyBuilder.hasScope('market');
    expect(hasOp(expr, 'or')).toBe(true);
    const [exact, wildcard] = getOp(expr, 'or') as JsonLogicExpression[];
    // Exact match: in ['market', delegation.scope]
    expect(hasOp(exact, 'in')).toBe(true);
    const [opVal] = getOp(exact, 'in') as unknown[];
    expect(opVal).toBe('market');
    // Wildcard: in ['*', delegation.scope]
    expect(hasOp(wildcard, 'in')).toBe(true);
    const [wildcardVal] = getOp(wildcard, 'in') as unknown[];
    expect(wildcardVal).toBe('*');
  });

  it('uses delegation.scope as the search target', () => {
    const expr = PolicyBuilder.hasScope('contract');
    const [exact] = getOp(expr, 'or') as JsonLogicExpression[];
    const [, scopeVar] = getOp(exact, 'in') as Record<string, unknown>[];
    expect(scopeVar['var']).toBe(DELEGATION_KEYS.SCOPE);
  });
});

describe('PolicyBuilder.notRevoked — revocation_check', () => {
  it('produces the same expression as isDelegationActive', () => {
    const notRevoked = PolicyBuilder.notRevoked();
    const active = PolicyBuilder.isDelegationActive();
    expect(JSON.stringify(notRevoked)).toBe(JSON.stringify(active));
  });
});

describe('PolicyBuilder.sessionKeyValid — session_key_valid', () => {
  it('produces a strict-equal expression comparing proofs.0.address to delegation.relayer', () => {
    const expr = PolicyBuilder.sessionKeyValid();
    expect(hasOp(expr, '===')).toBe(true);
    const [left, right] = getOp(expr, '===');
    expect((left as Record<string, unknown>)['var']).toBe('proofs.0.address');
    expect((right as Record<string, unknown>)['var']).toBe(DELEGATION_KEYS.RELAYER);
  });
});

// ─────────────────────────────────────────────
// Spending Limit
// ─────────────────────────────────────────────

describe('PolicyBuilder.withinSpendLimit', () => {
  it('produces a >= expression: spendRemaining >= amount (default key)', () => {
    const expr = PolicyBuilder.withinSpendLimit();
    expect(hasOp(expr, '>=')).toBe(true);
    const [left, right] = getOp(expr, '>=');
    expect((left as Record<string, unknown>)['var']).toBe(DELEGATION_KEYS.SPEND_REMAIN);
    expect((right as Record<string, unknown>)['var']).toBe('amount');
  });

  it('supports custom amount key', () => {
    const expr = PolicyBuilder.withinSpendLimit('tx.value');
    const [, right] = getOp(expr, '>=');
    expect((right as Record<string, unknown>)['var']).toBe('tx.value');
  });
});

describe('PolicyBuilder.hasSufficientStake', () => {
  it('produces a >= expression: bondedStake >= minStake', () => {
    const expr = PolicyBuilder.hasSufficientStake(2000);
    expect(hasOp(expr, '>=')).toBe(true);
    const [left, right] = getOp(expr, '>=');
    expect((left as Record<string, unknown>)['var']).toBe(DELEGATION_KEYS.BONDED_STAKE);
    expect(right).toBe(2000);
  });
});

// ─────────────────────────────────────────────
// Compound Operators
// ─────────────────────────────────────────────

describe('PolicyBuilder.requireDelegation', () => {
  it('combines isDelegationActive, notExpired, and hasScope with AND', () => {
    const expr = PolicyBuilder.requireDelegation('market');
    expect(hasOp(expr, 'and')).toBe(true);
    const conditions = getOp(expr, 'and') as JsonLogicExpression[];
    expect(conditions).toHaveLength(3);
    // First: isDelegationActive
    expect(hasOp(conditions[0], '===')).toBe(true);
    // Second: notExpired
    expect(hasOp(conditions[1], '>=')).toBe(true);
    // Third: hasScope
    expect(hasOp(conditions[2], 'or')).toBe(true);
  });
});

describe('PolicyBuilder.requireDelegationWithSpend', () => {
  it('adds withinSpendLimit to the requireDelegation conditions', () => {
    const expr = PolicyBuilder.requireDelegationWithSpend('market');
    const conditions = getOp(expr, 'and') as JsonLogicExpression[];
    expect(conditions).toHaveLength(4);
    // Last: withinSpendLimit
    const last = conditions[3];
    expect(hasOp(last, '>=')).toBe(true);
    const [, right] = getOp(last, '>=');
    expect((right as Record<string, unknown>)['var']).toBe('amount');
  });

  it('supports custom amount key', () => {
    const expr = PolicyBuilder.requireDelegationWithSpend('market', 'tx.value');
    const conditions = getOp(expr, 'and') as JsonLogicExpression[];
    const last = conditions[3];
    const [, right] = getOp(last, '>=');
    expect((right as Record<string, unknown>)['var']).toBe('tx.value');
  });
});

describe('PolicyBuilder.requireStrictDelegation', () => {
  it('includes all 5 conditions including sessionKeyValid', () => {
    const expr = PolicyBuilder.requireStrictDelegation('market');
    const conditions = getOp(expr, 'and') as JsonLogicExpression[];
    expect(conditions).toHaveLength(5);
    // Fourth: sessionKeyValid (===)
    const sessionCheck = conditions[3];
    expect(hasOp(sessionCheck, '===')).toBe(true);
    const [left] = getOp(sessionCheck, '===') as Record<string, unknown>[];
    expect(left['var']).toBe('proofs.0.address');
  });
});

describe('PolicyBuilder.ownerOrDelegate', () => {
  it('produces an or expression between owner check and delegation check', () => {
    const expr = PolicyBuilder.ownerOrDelegate('market');
    expect(hasOp(expr, 'or')).toBe(true);
    const [ownerCheck, delegateCheck] = getOp(expr, 'or') as JsonLogicExpression[];
    // Owner check: proofs.0.address === owners.0
    expect(hasOp(ownerCheck, '===')).toBe(true);
    // Delegate check: requireDelegation (and)
    expect(hasOp(delegateCheck, 'and')).toBe(true);
  });

  it('supports custom owner key', () => {
    const expr = PolicyBuilder.ownerOrDelegate('market', 'state.creator');
    const [ownerCheck] = getOp(expr, 'or') as JsonLogicExpression[];
    const [, right] = getOp(ownerCheck, '===') as Record<string, unknown>[];
    expect(right['var']).toBe('state.creator');
  });
});

// ─────────────────────────────────────────────
// Composition Helpers
// ─────────────────────────────────────────────

describe('PolicyBuilder.and', () => {
  it('wraps two expressions in an and array', () => {
    const left = PolicyBuilder.isDelegationActive();
    const right = PolicyBuilder.notExpired();
    const combined = PolicyBuilder.and(left, right);
    expect(hasOp(combined, 'and')).toBe(true);
    const [l, r] = getOp(combined, 'and');
    expect(JSON.stringify(l)).toBe(JSON.stringify(left));
    expect(JSON.stringify(r)).toBe(JSON.stringify(right));
  });
});

describe('PolicyBuilder.or', () => {
  it('wraps two expressions in an or array', () => {
    const left = PolicyBuilder.hasScope('market');
    const right = PolicyBuilder.hasScope('contract');
    const combined = PolicyBuilder.or(left, right);
    expect(hasOp(combined, 'or')).toBe(true);
    const ops = getOp(combined, 'or');
    expect(ops).toHaveLength(2);
  });
});

describe('PolicyBuilder.not', () => {
  it('wraps an expression in a negation', () => {
    const expr = PolicyBuilder.isDelegationActive();
    const negated = PolicyBuilder.not(expr);
    expect(hasOp(negated, '!')).toBe(true);
    const [inner] = getOp(negated, '!');
    expect(JSON.stringify(inner)).toBe(JSON.stringify(expr));
  });
});

// ─────────────────────────────────────────────
// Serialization
// ─────────────────────────────────────────────

describe('PolicyBuilder serialization', () => {
  it('serialize/deserialize round-trips cleanly', () => {
    const expr = PolicyBuilder.requireDelegation('market');
    const json = PolicyBuilder.serialize(expr);
    const restored = PolicyBuilder.deserialize(json);
    expect(JSON.stringify(restored)).toBe(JSON.stringify(expr));
  });

  it('serialize produces valid JSON', () => {
    const expr = PolicyBuilder.requireDelegationWithSpend('market', 'tx.amount');
    const json = PolicyBuilder.serialize(expr);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('deserialize throws on invalid JSON', () => {
    expect(() => PolicyBuilder.deserialize('not json!')).toThrow(SyntaxError);
  });
});

// ─────────────────────────────────────────────
// DELEGATION_KEYS constants
// ─────────────────────────────────────────────

describe('DELEGATION_KEYS', () => {
  it('all keys use delegation. prefix', () => {
    for (const [, value] of Object.entries(DELEGATION_KEYS)) {
      expect(value).toMatch(/^delegation\./);
    }
  });

  it('has all 10 expected keys', () => {
    const keys = Object.keys(DELEGATION_KEYS);
    expect(keys).toHaveLength(10);
  });
});
