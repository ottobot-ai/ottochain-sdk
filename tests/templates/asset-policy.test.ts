import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  fungiblePolicy,
  nftPolicy,
  soulboundPolicy,
  customPolicy,
  sumBehavior,
  defaultStateTypeName,
} from '../../src/templates/asset-policy';
import { TOKEN_BEHAVIOR_BITS, type CreateAssetPolicy } from '../../src/ottochain/types';
import { dropNulls } from '../../src/ottochain/drop-nulls';

// The acceptance oracle: the chain-accepted riverdale golden policy JSONs.
const GOLDEN_DIR = resolve(
  __dirname,
  '../../../ottochain-riverdale-e2e/e2e-test/examples/riverdale-economy',
);
const golden = (file: string): unknown => JSON.parse(readFileSync(resolve(GOLDEN_DIR, file), 'utf8'));

describe('templates/asset-policy — behavior is summed from TOKEN_BEHAVIOR_BITS, never a literal', () => {
  it('sumBehavior matches the documented presets (T=16,S=8,C=4,E=2,G=1)', () => {
    expect(sumBehavior(['transferable', 'splittable', 'combinable'])).toBe(28); // fungible
    expect(sumBehavior(['transferable'])).toBe(16); // plain NFT
    expect(sumBehavior(['transferable', 'combinable'])).toBe(20); // goods-style NFT
    expect(sumBehavior(['governable'])).toBe(1); // soulbound
    expect(sumBehavior([])).toBe(0);
    // the named bits really are the chain bit-weights
    expect(TOKEN_BEHAVIOR_BITS).toEqual({
      transferable: 16,
      splittable: 8,
      combinable: 4,
      expirable: 2,
      governable: 1,
    });
  });

  it('defaultStateTypeName strips `.asset` and PascalCases + `State`', () => {
    expect(defaultStateTypeName('rvd.asset')).toBe('RvdState');
    expect(defaultStateTypeName('goods.asset')).toBe('GoodsState');
    expect(defaultStateTypeName('capped.asset')).toBe('CappedState');
    expect(defaultStateTypeName('my-currency.asset')).toBe('MyCurrencyState');
  });
});

describe('templates/asset-policy — reproduces the riverdale goldens exactly (deep-equal)', () => {
  it('fungiblePolicy reproduces rvd-policy.json (behavior 28, mint+burn, full morphism set)', () => {
    const out = fungiblePolicy({
      name: 'rvd.asset',
      version: '1.0.0',
      mintable: true,
      burnable: true,
    });
    expect(out).toEqual(golden('rvd-policy.json'));
  });

  it('nftPolicy reproduces goods-policy.json (behavior 20, morphisms {}, mint only)', () => {
    const out = nftPolicy({
      name: 'goods.asset',
      version: '1.0.0',
      combinable: true,
    });
    expect(out).toEqual(golden('goods-policy.json'));
  });

  it('customPolicy reproduces capped-policy.json (behavior 28, maxSupply 100, morphisms {})', () => {
    const out = customPolicy({
      name: 'capped.asset',
      version: '1.0.0',
      behavior: ['transferable', 'splittable', 'combinable'],
      supply: { maxSupply: 100, mintPolicy: { '==': [1, 1] } },
      morphisms: {},
    });
    expect(out).toEqual(golden('capped-policy.json'));
  });
});

describe('templates/asset-policy — wire invariants (no null, required fields present)', () => {
  const all: CreateAssetPolicy[] = [
    fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true }),
    nftPolicy({ name: 'goods.asset', version: '1.0.0', combinable: true }),
    soulboundPolicy({ name: 'badge.asset', version: '1.0.0' }),
    customPolicy({
      name: 'capped.asset',
      version: '1.0.0',
      behavior: ['transferable', 'splittable', 'combinable'],
      supply: { maxSupply: 100, mintPolicy: { '==': [1, 1] } },
      morphisms: {},
    }),
  ];

  it('every preset emits the required `supply` and `morphisms` (never omitted)', () => {
    for (const p of all) {
      expect(p).toHaveProperty('supply');
      expect(p).toHaveProperty('morphisms');
      expect(p.morphisms).toBeDefined();
      expect(p.supply).toBeDefined();
    }
  });

  it('no preset emits a null anywhere (dropNulls is a no-op ⇒ JCS-stable)', () => {
    for (const p of all) {
      expect(dropNulls(p as unknown as Record<string, unknown>)).toEqual(p);
      expect(JSON.stringify(p)).not.toContain('null');
    }
  });

  it('absent optionals are OMITTED, not emitted as undefined keys', () => {
    // an uncapped, non-mintable, non-burnable fungible has an EMPTY supply object
    const minimal = fungiblePolicy({ name: 'plain.asset', version: '0.0.1', stakeable: false });
    expect(minimal.supply).toEqual({}); // no maxSupply/mintPolicy/burnPolicy/decimals keys
    expect(Object.keys(minimal.supply)).toHaveLength(0);
    expect(minimal).not.toHaveProperty('metadata');
    // morphisms: only TRANSFER + FRACTIONALIZE (stakeable:false, not burnable)
    expect(Object.keys(minimal.morphisms).sort()).toEqual(['FRACTIONALIZE', 'TRANSFER']);
  });
});

describe('templates/asset-policy — preset shapes & options', () => {
  it('fungiblePolicy: mintGuard overrides the default mint guard', () => {
    const guard = { '>': [{ var: 'witness.proof' }, 0] };
    const out = fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintGuard: guard });
    expect(out.supply.mintPolicy).toEqual(guard);
    expect(out.behavior).toBe(28);
  });

  it('fungiblePolicy: decimals + maxSupply flow into supply', () => {
    const out = fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', decimals: 6, maxSupply: 1000 });
    expect(out.supply).toEqual({ maxSupply: 1000, decimals: 6 });
  });

  it('nftPolicy: plain NFT is behavior 16 with mint-only supply', () => {
    const out = nftPolicy({ name: 'art.asset', version: '1.0.0' });
    expect(out.behavior).toBe(16);
    expect(out.morphisms).toEqual({});
    expect(out.supply).toEqual({ mintPolicy: { '==': [1, 1] } });
    expect(out.stateShape).toEqual({ typeName: 'ArtState', fields: [] });
  });

  it('nftPolicy: transferable:false drops the T bit (bound collectible)', () => {
    expect(nftPolicy({ name: 'bound.asset', version: '1.0.0', transferable: false }).behavior).toBe(0);
    expect(
      nftPolicy({ name: 'bound.asset', version: '1.0.0', transferable: false, combinable: true }).behavior,
    ).toBe(4);
  });

  it('soulboundPolicy: G=1, no TRANSFER morphism, empty supply (mint closed)', () => {
    const out = soulboundPolicy({ name: 'badge.asset', version: '1.0.0' });
    expect(out.behavior).toBe(1);
    expect(out.morphisms).toEqual({});
    expect(out.supply).toEqual({});
    expect(out.stateShape).toEqual({ typeName: 'BadgeState', fields: [] });
    expect(soulboundPolicy({ name: 'badge.asset', version: '1.0.0', expirable: true }).behavior).toBe(3);
  });

  it('customPolicy: stateTypeName override + metadata pass through', () => {
    const out = customPolicy({
      name: 'thing.asset',
      version: '2.0.0',
      behavior: ['transferable', 'governable'],
      supply: {},
      morphisms: { TRANSFER: { visibility: 'GOVERNED' } },
      stateTypeName: 'CustomThing',
      metadata: { team: 'core' },
    });
    expect(out.behavior).toBe(17);
    expect(out.stateShape.typeName).toBe('CustomThing');
    expect(out.metadata).toEqual({ team: 'core' });
    expect(out.morphisms).toEqual({ TRANSFER: { visibility: 'GOVERNED' } });
  });
});

describe('templates/asset-policy — pure & deterministic (same input ⇒ identical output)', () => {
  it('repeated calls deep-equal and do not share mutable sub-objects', () => {
    const a = fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true });
    const b = fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true });
    expect(a).toEqual(b);
    // mutating one output must not affect a fresh call (no shared references)
    a.morphisms.TRANSFER.visibility = 'DISABLED';
    expect(
      fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true }).morphisms
        .TRANSFER.visibility,
    ).toBe('PUBLIC');
  });
});
