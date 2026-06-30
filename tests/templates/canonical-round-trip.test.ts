/**
 * Golden canonical round-trip — the load-bearing guard (handoff §5 step 6, CLAUDE.md rule #1).
 *
 * The chain signs/verifies every update over `JCS(dropNulls(payload))`. A template that shifts that
 * canonical by one byte breaks the create/publish signature with an opaque `InvalidSignature` (HTTP 400).
 *
 * Proof technique (mirrors the repo's `tests/signing.test.ts` signing-parity convention): ECDSA signing
 * here is deterministic (RFC 6979), so two payloads produce the SAME signature under ONE key IFF their
 * `JCS(dropNulls(.))` bytes are byte-identical. We therefore sign each builder output and its checked-in
 * green-lane golden with the same key and assert equal signatures — i.e. the template emits the EXACT
 * canonical the chain already accepts in the green lane. Reuses the real SDK signing path
 * (`signDataUpdate`, which applies `dropNulls` then RFC-8785 canonicalizes), not a re-derived JCS.
 */
import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateKeyPair } from '@constellation-network/metagraph-sdk';
import { signDataUpdate } from '../../src/signing';
import { dropNulls } from '../../src/ottochain/drop-nulls';
import { fungiblePolicy, nftPolicy, customPolicy } from '../../src/templates/asset-policy';
import { machine, transition, effect } from '../../src/templates/machine';
import { defineFiberApp } from '../../src/schema/fiber-app';
import type { MachineShape } from '../../src/ottochain/types';

const GOLDEN_DIR = resolve(__dirname, '../fixtures/riverdale-economy');
const golden = (file: string): unknown => JSON.parse(readFileSync(resolve(GOLDEN_DIR, file), 'utf8'));

// One fresh key; deterministic signatures ⇒ equal signature == byte-identical signed canonical.
const key = generateKeyPair().privateKey;
const signsIdentically = (a: unknown, b: unknown): void =>
  expect(signDataUpdate(a, key).signature).toBe(signDataUpdate(b, key).signature);

describe('templates — golden canonical round-trip (signed JCS(dropNulls) == green-lane fixture)', () => {
  it('fungiblePolicy → byte-identical canonical to rvd-policy.json', () => {
    signsIdentically(
      fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true }),
      golden('rvd-policy.json'),
    );
  });

  it('nftPolicy → byte-identical canonical to goods-policy.json', () => {
    signsIdentically(
      nftPolicy({ name: 'goods.asset', version: '1.0.0', combinable: true }),
      golden('goods-policy.json'),
    );
  });

  it('customPolicy → byte-identical canonical to capped-policy.json', () => {
    signsIdentically(
      customPolicy({
        name: 'capped.asset',
        version: '1.0.0',
        behavior: ['transferable', 'splittable', 'combinable'],
        supply: { maxSupply: 100, mintPolicy: { '==': [1, 1] } },
        morphisms: {},
      }),
      golden('capped-policy.json'),
    );
  });

  it('policy output carries NO null leaf — dropNulls is a no-op, so the canonical is stable', () => {
    const policy = fungiblePolicy({ name: 'rvd.asset', version: '1.0.0', mintable: true, burnable: true });
    expect(dropNulls(policy)).toEqual(policy);
    expect(JSON.stringify(policy)).not.toContain('null');
  });

  it('machine() publish + create definitions sign identically (verified binding at the byte level)', () => {
    const schemaShape: MachineShape = { stateMessage: { typeName: 'MState', fields: [] }, commands: {} };
    const app = defineFiberApp({
      metadata: { name: 'M', app: 'riverdale', type: 'm', version: '1.0.0' },
      states: { A: { id: 'A', isFinal: false }, B: { id: 'B', isFinal: false } },
      initialState: 'A',
      transitions: [transition({ from: 'A', to: 'B', on: 'go', effect: effect({ status: 'B' }) })],
    });
    const m = machine({ name: 'm.package', version: '1.0.0', app, schemaShape });
    signsIdentically(m.publishVersion().definition, m.create({ fiberId: 'f', initialData: {} }).definition);
  });
});
