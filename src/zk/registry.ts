/**
 * The expression registry binds a human name → a published JLVM rule → its `logicHash`
 * (`keccak256(canonicalize(rule))`). The `logicHash` is the load-bearing public value: it equals the
 * `exprHash` word a zk-jlvm proof commits AND the literal a semi-private guard pins. Registering a
 * rule with a LITERAL bound ("pin the bound into the rule", e.g. `{">=":[{"var":"score"},700]}`)
 * makes "the proof's exprHash == this logicHash" mean "the hidden value satisfies THIS public,
 * legible rule" — privacy of the value, transparency of the predicate.
 */
import { exprHash } from './preimage';

/** A registered rule and the public `logicHash` that pins it on-chain and in proofs. */
export interface RegisteredRule {
  /** The JLVM rule, as plain JSON (canonicalized when hashed and when fed to the prover). */
  rule: unknown;
  /** `keccak256(canonicalize(rule))` — the on-chain `logicHash` and a proof's `exprHash` word. */
  logicHash: `0x${string}`;
}

/** A client-side registry mapping rule names to their canonical `logicHash`. */
export class ExprRegistry {
  private readonly byName = new Map<string, RegisteredRule>();

  /** Register (or replace) a named rule; returns the entry with its computed `logicHash`. */
  register(name: string, rule: unknown): RegisteredRule {
    const entry: RegisteredRule = { rule, logicHash: exprHash(rule) };
    this.byName.set(name, entry);
    return entry;
  }

  /** Whether a rule is registered under `name`. */
  has(name: string): boolean {
    return this.byName.has(name);
  }

  /** The registered rule, or throw if unknown. */
  ruleOf(name: string): unknown {
    return this.require(name).rule;
  }

  /** The registered rule's `logicHash`, or throw if unknown. */
  logicHashOf(name: string): `0x${string}` {
    return this.require(name).logicHash;
  }

  /** All registered names, in insertion order. */
  names(): string[] {
    return [...this.byName.keys()];
  }

  private require(name: string): RegisteredRule {
    const entry = this.byName.get(name);
    if (!entry) throw new Error(`ExprRegistry: no rule registered under "${name}"`);
    return entry;
  }
}

/** The comparators a bound rule can pin a private value against. */
export type Comparator = '>=' | '>' | '<=' | '<' | '==' | '!=';

/**
 * A single-bound predicate `{[op]:[{var:varName}, bound]}` — the "pinned bound" a proof binds to.
 * `bound` stays a JSON primitive (number/string) so the canonical bytes the prover hashes match the
 * canonical bytes the rule registers under (bigint is not JSON-serializable — pre-encode if needed).
 */
export function boundRule(
  varName: string,
  op: Comparator,
  bound: number | string,
): Record<string, unknown> {
  return { [op]: [{ var: varName }, bound] };
}

/** `{">=":[{"var":varName}, bound]}` — "the hidden `varName` is at least `bound`". */
export const atLeast = (varName: string, bound: number | string): Record<string, unknown> =>
  boundRule(varName, '>=', bound);

/** `{"<=":[{"var":varName}, bound]}` — "the hidden `varName` is at most `bound`". */
export const atMost = (varName: string, bound: number | string): Record<string, unknown> =>
  boundRule(varName, '<=', bound);
