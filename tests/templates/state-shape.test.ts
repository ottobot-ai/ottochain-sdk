import { describe, it, expect } from '@jest/globals';
import { seedState, declaredFields, type StateShape } from '../../src/templates/state-shape';

// The acceptance oracle: the chain-accepted seeded accumulators from the riverdale green lane.
// consumer.initial.json
const consumerInitialGolden = {
  balance: 100000,
  loanBalance: 0,
  purchaseCount: 0,
  paymentsMade: 0,
  activeListings: 0,
  marketplaceSales: 0,
  taxesPaid: 0,
  status: 'ACTIVE',
};

// A StateShape whose defaults are exactly the golden seeded values.
const consumerShape: StateShape = {
  fields: {
    balance: { default: 100000, type: 'integer' },
    loanBalance: { default: 0, type: 'integer' },
    purchaseCount: { default: 0, type: 'integer' },
    paymentsMade: { default: 0, type: 'integer' },
    activeListings: { default: 0, type: 'integer' },
    marketplaceSales: { default: 0, type: 'integer' },
    taxesPaid: { default: 0, type: 'integer' },
    status: { default: 'ACTIVE', type: 'string' },
  },
};

describe('templates/state-shape — declared defaults seed initialData (F5)', () => {
  it('seedState reproduces consumer.initial.json from the declared defaults', () => {
    expect(seedState(consumerShape)).toEqual(consumerInitialGolden);
  });

  it('seedState overlays overrides onto the defaults (override wins)', () => {
    expect(seedState(consumerShape, { balance: 250, status: 'debt_current' })).toEqual({
      ...consumerInitialGolden,
      balance: 250,
      status: 'debt_current',
    });
  });

  it('seedState emits a concrete value for every declared field — never null/undefined', () => {
    const seeded = seedState(consumerShape);
    for (const v of Object.values(seeded)) {
      expect(v).not.toBeNull();
      expect(v).not.toBeUndefined();
    }
  });

  it('seedState ignores overrides for undeclared fields (only declared fields emitted)', () => {
    const seeded = seedState(consumerShape, { notAField: 'nope' });
    expect(seeded).toEqual(consumerInitialGolden);
    expect(seeded).not.toHaveProperty('notAField');
  });

  it('seedState is pure/deterministic — same inputs, identical output across calls', () => {
    expect(seedState(consumerShape, { balance: 7 })).toEqual(seedState(consumerShape, { balance: 7 }));
  });

  it('declaredFields returns the 8 declared consumer field names', () => {
    expect(declaredFields(consumerShape)).toEqual(
      new Set([
        'balance',
        'loanBalance',
        'purchaseCount',
        'paymentsMade',
        'activeListings',
        'marketplaceSales',
        'taxesPaid',
        'status',
      ]),
    );
  });
});
