/**
 * State-shape-with-defaults — the SDK half of Proposal 01's "declared state shape" (removes F5).
 *
 * A declared shape carries a `default` (and optional `type`) per field. It seeds `initialData` so every
 * accumulator starts at a concrete value — a counter read via `{ '+': [{ var: 'state.x' }, ...] }` never
 * resolves `null` because `x` was never written. It also yields the set of declared field names for
 * Proposal 01's var-path checks.
 */

import type { SchemaFieldType } from '../schema/fiber-app.js';

export interface StateShape {
  fields: Record<string, { default: unknown; type?: SchemaFieldType }>;
}

/**
 * Build `initialData` by overlaying `overrides` onto each field's declared `default`.
 * Every declared field gets a concrete value, so no field reads `null` at runtime. An override for a
 * field replaces that field's default; overrides for undeclared fields are ignored (only declared fields
 * are emitted). Determinism: pure function of its inputs, stable key order (declared order).
 *
 * @example seedState({ fields: { purchaseCount: { default: 0 }, status: { default: 'ACTIVE' } } })
 *          // => { purchaseCount: 0, status: 'ACTIVE' }
 */
export function seedState(shape: StateShape, overrides?: Record<string, unknown>): Record<string, unknown> {
  const seeded: Record<string, unknown> = {};
  for (const [name, field] of Object.entries(shape.fields)) {
    seeded[name] =
      overrides !== undefined && Object.prototype.hasOwnProperty.call(overrides, name)
        ? overrides[name]
        : field.default;
  }
  return seeded;
}

/**
 * The set of declared state-field names — the fields the effects may read.
 * Feeds Proposal 01's var-path checks (a `{ var: 'state.foo' }` whose `foo` is not declared is suspect).
 */
export function declaredFields(shape: StateShape): Set<string> {
  return new Set(Object.keys(shape.fields));
}
