/**
 * OttoChain SDK Delegation Policy Builder
 *
 * Provides pre-built JSON Logic expressions for delegation policy enforcement.
 * These expressions match the `DelegationPredicates` on the metagraph (Scala) side,
 * ensuring consistent policy evaluation between SDK clients and on-chain validation.
 *
 * == Usage in State Machine Definitions ==
 * ```typescript
 * import { PolicyBuilder } from '@ottochain/sdk/delegation';
 *
 * // Guard that requires an active delegation with "market" scope
 * const guard = PolicyBuilder.requireDelegation('market');
 *
 * // Compose with user-defined guards
 * const composed = PolicyBuilder.and(
 *   PolicyBuilder.requireDelegation('contract'),
 *   { '>=': [{ var: 'state.balance' }, 100] }
 * );
 * ```
 *
 * == Operator Mapping ==
 * The five delegation "operators" from the spec map to these factory methods:
 * - `verify_delegation`         → {@link PolicyBuilder.isDelegationActive}
 * - `check_delegation_expiry`   → {@link PolicyBuilder.notExpired}
 * - `validate_delegation_scope` → {@link PolicyBuilder.hasScope}
 * - `revocation_check`          → {@link PolicyBuilder.notRevoked}
 * - `session_key_valid`         → {@link PolicyBuilder.sessionKeyValid}
 *
 * == Context Variables ==
 * These expressions operate on `delegation.*` context variables injected by
 * the fiber engine's `ContextProvider` when a relayer submits on behalf of a delegator:
 * - `delegation.active`          — boolean: true when delegation is active
 * - `delegation.expiresAt`       — number: snapshot ordinal when delegation expires
 * - `delegation.scope`           — string[]: authorized operation types
 * - `delegation.spendLimit`      — number: total spending cap
 * - `delegation.spendUsed`       — number: accumulated spending
 * - `delegation.spendRemaining`  — number: remaining spend allowance
 * - `delegation.delegator`       — string: DAG address of the delegating principal
 * - `delegation.relayer`         — string: DAG address of the authorized relayer
 * - `delegation.sessionKey`      — string: public key of the session key
 * - `delegation.bondedStake`     — number: collateral bonded by relayer
 *
 * @packageDocumentation
 */

/** A JSON Logic expression (a plain JSON-serializable object). */
export type JsonLogicExpression = Record<string, unknown> | boolean | number | string;

/** Reserved delegation context variable names (matches Scala ReservedKeys). */
export const DELEGATION_KEYS = {
  ACTIVE:        'delegation.active',
  EXPIRES_AT:    'delegation.expiresAt',
  SCOPE:         'delegation.scope',
  SPEND_LIMIT:   'delegation.spendLimit',
  SPEND_USED:    'delegation.spendUsed',
  SPEND_REMAIN:  'delegation.spendRemaining',
  DELEGATOR:     'delegation.delegator',
  RELAYER:       'delegation.relayer',
  SESSION_KEY:   'delegation.sessionKey',
  BONDED_STAKE:  'delegation.bondedStake',
} as const;

/**
 * Pre-built JSON Logic expressions for delegation policy enforcement.
 *
 * All returned expressions are plain JSON-serializable objects that can be
 * embedded directly in state machine transition guards and effects.
 */
export class PolicyBuilder {

  // ───────────────────────────────────────────────
  // Core Predicate Operators
  // ───────────────────────────────────────────────

  /**
   * `verify_delegation`: `delegation.active === true`
   *
   * Evaluates to `true` when a delegation credential exists and is active
   * (not revoked and within its ordinal validity window).
   */
  static isDelegationActive(): JsonLogicExpression {
    return {
      '===': [
        { var: DELEGATION_KEYS.ACTIVE, default: false },
        true,
      ],
    };
  }

  /**
   * `check_delegation_expiry`: `delegation.expiresAt >= $ordinal`
   *
   * Evaluates to `true` when the current snapshot ordinal is at or before
   * the delegation's expiry ordinal.
   */
  static notExpired(): JsonLogicExpression {
    return {
      '>=': [
        { var: DELEGATION_KEYS.EXPIRES_AT, default: 0 },
        { var: '$ordinal', default: 0 },
      ],
    };
  }

  /**
   * `validate_delegation_scope`: scope includes `operation` or `"*"` (wildcard).
   *
   * Evaluates to `true` when the delegation's scope list contains the requested
   * operation type, or contains the wildcard `"*"` that grants all operations.
   *
   * @param operation The operation to check (e.g., `"market"`, `"contract"`)
   */
  static hasScope(operation: string): JsonLogicExpression {
    return {
      or: [
        // Exact match
        {
          in: [
            operation,
            { var: DELEGATION_KEYS.SCOPE, default: [] },
          ],
        },
        // Wildcard match
        {
          in: [
            '*',
            { var: DELEGATION_KEYS.SCOPE, default: [] },
          ],
        },
      ],
    };
  }

  /**
   * `revocation_check`: delegation is not revoked.
   *
   * Equivalent to `isDelegationActive` — the delegation context sets
   * `delegation.active = false` when revoked, making this a clear semantic alias.
   */
  static notRevoked(): JsonLogicExpression {
    return PolicyBuilder.isDelegationActive();
  }

  /**
   * `session_key_valid`: first signer's address matches the authorized relayer.
   *
   * Compares `proofs[0].address` (the caller) against `delegation.relayer`
   * to ensure the session key belongs to the authorized relayer.
   */
  static sessionKeyValid(): JsonLogicExpression {
    return {
      '===': [
        { var: 'proofs.0.address', default: '' },
        { var: DELEGATION_KEYS.RELAYER, default: '' },
      ],
    };
  }

  // ───────────────────────────────────────────────
  // Spending Limit Operator
  // ───────────────────────────────────────────────

  /**
   * Spending limit check: `delegation.spendRemaining >= amount`.
   *
   * Evaluates to `true` when the remaining spending allowance is sufficient
   * for the requested amount.
   *
   * @param amountKey Context variable key for the transaction amount (default: `"amount"`)
   */
  static withinSpendLimit(amountKey: string = 'amount'): JsonLogicExpression {
    return {
      '>=': [
        { var: DELEGATION_KEYS.SPEND_REMAIN, default: 0 },
        { var: amountKey, default: 0 },
      ],
    };
  }

  /**
   * Minimum bonded stake check: `delegation.bondedStake >= minStake`.
   *
   * Useful for high-value operations that require a minimum collateral level.
   *
   * @param minStake Minimum required stake (in base units)
   */
  static hasSufficientStake(minStake: number): JsonLogicExpression {
    return {
      '>=': [
        { var: DELEGATION_KEYS.BONDED_STAKE, default: 0 },
        minStake,
      ],
    };
  }

  // ───────────────────────────────────────────────
  // Compound Operators (Common Combinations)
  // ───────────────────────────────────────────────

  /**
   * Full delegation validation: `active AND not-expired AND has-scope`.
   *
   * This is the standard guard to prepend to any state machine transition
   * that requires delegated authority. Covers all three core checks.
   *
   * @param operation The required operation scope
   */
  static requireDelegation(operation: string): JsonLogicExpression {
    return {
      and: [
        PolicyBuilder.isDelegationActive(),
        PolicyBuilder.notExpired(),
        PolicyBuilder.hasScope(operation),
      ],
    };
  }

  /**
   * Full delegation validation including spend limit check.
   *
   * @param operation  The required operation scope
   * @param amountKey  Context key for the transaction amount (default: `"amount"`)
   */
  static requireDelegationWithSpend(
    operation: string,
    amountKey: string = 'amount'
  ): JsonLogicExpression {
    return {
      and: [
        PolicyBuilder.isDelegationActive(),
        PolicyBuilder.notExpired(),
        PolicyBuilder.hasScope(operation),
        PolicyBuilder.withinSpendLimit(amountKey),
      ],
    };
  }

  /**
   * Strict delegation validation: active, not-expired, scope, session-key, and spend.
   *
   * The most complete guard that also validates the session key ownership.
   *
   * @param operation  The required operation scope
   * @param amountKey  Context key for the transaction amount
   */
  static requireStrictDelegation(
    operation: string,
    amountKey: string = 'amount'
  ): JsonLogicExpression {
    return {
      and: [
        PolicyBuilder.isDelegationActive(),
        PolicyBuilder.notExpired(),
        PolicyBuilder.hasScope(operation),
        PolicyBuilder.sessionKeyValid(),
        PolicyBuilder.withinSpendLimit(amountKey),
      ],
    };
  }

  // ───────────────────────────────────────────────
  // Composition Helpers
  // ───────────────────────────────────────────────

  /**
   * Compose two expressions with AND (both must be true).
   */
  static and(
    left: JsonLogicExpression,
    right: JsonLogicExpression
  ): JsonLogicExpression {
    return { and: [left, right] };
  }

  /**
   * Compose two expressions with OR (either must be true).
   */
  static or(
    left: JsonLogicExpression,
    right: JsonLogicExpression
  ): JsonLogicExpression {
    return { or: [left, right] };
  }

  /**
   * Negate an expression.
   */
  static not(expr: JsonLogicExpression): JsonLogicExpression {
    return { '!': [expr] };
  }

  /**
   * Allow the operation if user is the owner OR has a valid delegation.
   *
   * A common pattern: owners can always act; delegators can act within their scope.
   *
   * @param operation The required delegation scope for non-owners
   * @param ownerKey  Context key that holds the owner address (default: `"owners.0"`)
   */
  static ownerOrDelegate(
    operation: string,
    ownerKey: string = 'owners.0'
  ): JsonLogicExpression {
    return {
      or: [
        // Direct owner action
        {
          '===': [
            { var: 'proofs.0.address', default: '' },
            { var: ownerKey, default: '' },
          ],
        },
        // Delegated action
        PolicyBuilder.requireDelegation(operation),
      ],
    };
  }

  // ───────────────────────────────────────────────
  // Serialization Helpers
  // ───────────────────────────────────────────────

  /**
   * Serialize a policy expression to a compact JSON string.
   *
   * The result can be stored in state machine definitions and later
   * deserialized for evaluation.
   */
  static serialize(expr: JsonLogicExpression): string {
    return JSON.stringify(expr);
  }

  /**
   * Deserialize a policy expression from JSON string.
   *
   * @throws {SyntaxError} if the string is not valid JSON
   */
  static deserialize(json: string): JsonLogicExpression {
    return JSON.parse(json) as JsonLogicExpression;
  }
}
