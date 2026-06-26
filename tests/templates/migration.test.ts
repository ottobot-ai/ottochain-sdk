import { describe, it, expect } from '@jest/globals';
import { seedFields, migration } from '../../src/templates/migration';

// The acceptance oracle: the chain-accepted golden migration from the riverdale green lane.
// retailer-migration.json === { merge: [{ var: '' }, { loyaltyPoints: 0 }] }
const retailerMigrationGolden = { merge: [{ var: '' }, { loyaltyPoints: 0 }] };

describe('templates/migration — bare-state-root transforms (F9)', () => {
  it('seedFields emits {merge:[{var:""},fields]} — byte-equal to retailer-migration.json', () => {
    expect(seedFields({ loyaltyPoints: 0 })).toEqual(retailerMigrationGolden);
  });

  it('seedFields pins the BARE-state root {var:""}, not state.x like an effect', () => {
    const m = seedFields({ loyaltyPoints: 0 }) as { merge: [{ var: string }, unknown] };
    expect(m.merge[0]).toEqual({ var: '' });
    // the field key is read top-level — no `state.` prefix leaks into the migration
    expect(JSON.stringify(m)).not.toContain('state.');
  });

  it('seedFields carries multiple fields and arbitrary value types', () => {
    expect(seedFields({ loyaltyPoints: 0, tier: 'gold', active: true })).toEqual({
      merge: [{ var: '' }, { loyaltyPoints: 0, tier: 'gold', active: true }],
    });
  });

  it('seedFields is pure/deterministic — same input, identical output across calls', () => {
    expect(seedFields({ loyaltyPoints: 0 })).toEqual(seedFields({ loyaltyPoints: 0 }));
  });

  it('migration exposes the bare-state root and builds a general transform', () => {
    expect(migration((s) => ({ merge: [s, { x: 1 }] }))).toEqual({ merge: [{ var: '' }, { x: 1 }] });
  });

  it('migration passes {var:""} into the builder so a field reads top-level', () => {
    expect(migration((s) => s)).toEqual({ var: '' });
    expect(migration((s) => ({ cat: [s, '-suffix'] }))).toEqual({ cat: [{ var: '' }, '-suffix'] });
  });
});
