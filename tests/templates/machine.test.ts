import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transition, effect, machine } from '../../src/templates/machine';
import { defineFiberApp } from '../../src/schema/fiber-app';
import { transferAsset } from '../../src/schema/effects';
import type { MachineShape } from '../../src/ottochain/types';

// The riverdale golden — the chain-accepted form `transition()`/`effect()` must reproduce byte-for-byte
// (key order is irrelevant; JCS sorts keys, so deep equality is the right oracle). Vendored fixture.
const CONSUMER_DEF = JSON.parse(
  readFileSync(
    resolve(__dirname, '../fixtures/riverdale-economy/consumer.definition.json'),
    'utf8',
  ),
) as { transitions: Record<string, unknown>[] };

describe('templates/machine — effect()', () => {
  it('merges the state-update + directive fragments into ONE flat map', () => {
    expect(effect({ a: 1 }, { _x: 2 })).toEqual({ a: 1, _x: 2 });
  });

  it('with no directives is just the state update', () => {
    expect(effect({ a: 1 })).toEqual({ a: 1 });
  });

  it('is NOT merge-wrapped (flat map, no `merge` key)', () => {
    expect(effect({ status: 'X' }, { _triggers: [] })).not.toHaveProperty('merge');
  });

  it('later directives override earlier keys (Object.assign semantics)', () => {
    expect(effect({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
});

describe('templates/machine — transition()', () => {
  it('maps `on` -> `eventName`, defaults guard to {"==":[1,1]} and dependencies to []', () => {
    const t = transition({ from: 'A', to: 'B', on: 'go' });
    expect(t.eventName).toBe('go');
    expect(t.guard).toEqual({ '==': [1, 1] });
    expect(t.dependencies).toEqual([]);
  });

  it('passes guard / effect / dependencies through', () => {
    const eff = effect({ status: 'X' });
    expect(
      transition({ from: 'A', to: 'B', on: 'go', guard: { '!': [false] }, effect: eff, dependencies: ['uuid-1'] }),
    ).toEqual({
      from: 'A',
      to: 'B',
      eventName: 'go',
      guard: { '!': [false] },
      effect: { status: 'X' },
      dependencies: ['uuid-1'],
    });
  });

  it('deep-equals the riverdale `buy` transition (golden index 1)', () => {
    const buyTriggers = {
      _triggers: [
        {
          targetMachineId: { var: 'event.retailerId' },
          eventName: 'process_sale',
          payload: {
            buyerId: { var: 'machineId' },
            quantity: { var: 'event.quantity' },
            goodsAssetId: { var: 'event.goodsAssetId' },
          },
        },
      ],
    };

    const built = transition({
      from: 'debt_current',
      to: 'debt_current',
      on: 'buy',
      guard: { '==': [1, 1] },
      effect: effect(
        { status: 'debt_current', purchaseCount: { '+': [{ var: 'state.purchaseCount' }, 1] } },
        buyTriggers,
        { _transferAsset: [{ assetId: { var: 'event.payAssetId' }, recipient: { var: 'event.retailerId' } }] },
      ),
      dependencies: [],
    });

    expect(built).toEqual(CONSUMER_DEF.transitions[1]);
  });

  it('composes the same `buy` transition using the existing transferAsset() builder', () => {
    const built = transition({
      from: 'debt_current',
      to: 'debt_current',
      on: 'buy',
      effect: effect(
        { status: 'debt_current', purchaseCount: { '+': [{ var: 'state.purchaseCount' }, 1] } },
        {
          _triggers: [
            {
              targetMachineId: { var: 'event.retailerId' },
              eventName: 'process_sale',
              payload: {
                buyerId: { var: 'machineId' },
                quantity: { var: 'event.quantity' },
                goodsAssetId: { var: 'event.goodsAssetId' },
              },
            },
          ],
        },
        transferAsset([{ assetId: { var: 'event.payAssetId' }, recipient: { var: 'event.retailerId' } }]),
      ),
    });

    expect(built).toEqual(CONSUMER_DEF.transitions[1]);
  });
});

describe('templates/machine — machine() verified binding', () => {
  const schemaShape: MachineShape = {
    stateMessage: { typeName: 'ConsumerState', fields: [] },
    commands: {},
  };

  const app = defineFiberApp({
    metadata: { name: 'Consumer', app: 'riverdale', type: 'consumer', version: '1.0.0' },
    states: {
      ACTIVE: { id: 'ACTIVE', isFinal: false },
      debt_current: { id: 'debt_current', isFinal: false },
    },
    initialState: 'ACTIVE',
    transitions: [
      transition({
        from: 'ACTIVE',
        to: 'debt_current',
        on: 'loan_funded',
        effect: effect({ status: 'debt_current', loanBalance: { var: 'event.amount' } }),
      }),
    ],
  });

  const m = machine({ name: 'consumer.package', version: '1.0.0', app, schemaShape });

  it('publish, create, upgrade, and wireDefinition share ONE definition object (===)', () => {
    expect(m.publishVersion().definition).toBe(m.wireDefinition());
    expect(m.create({ fiberId: 'fid', initialData: {} }).definition).toBe(m.wireDefinition());
    expect(m.upgradeFrom({ fiberId: 'fid', targetSequenceNumber: 1 }).newDefinition).toBe(m.wireDefinition());
  });

  it('publishVersion().definition toEqual create().definition toEqual wireDefinition()', () => {
    const pub = m.publishVersion();
    const cre = m.create({ fiberId: 'fid', initialData: {} });
    expect(pub.definition).toEqual(cre.definition);
    expect(cre.definition).toEqual(m.wireDefinition());
  });

  it('publishVersion conforms to PublishMachineVersion (name/version/machineShape/strict + schemaB64)', () => {
    const pub = m.publishVersion();
    expect(pub.name).toBe('consumer.package');
    expect(pub.version).toBe('1.0.0');
    expect(pub.machineShape).toBe(schemaShape);
    expect(pub.strict).toBe(false); // REQUIRED, defaults to false
    expect(pub.schemaB64).toBe(''); // REQUIRED, defaults to empty base64
    expect(pub).not.toHaveProperty('metadata'); // OMITTED when absent
  });

  it('publishVersion respects strict / metadata / schemaB64 options', () => {
    const pub = m.publishVersion({ strict: true, metadata: { docs: 'https://x' }, schemaB64: 'AAAA' });
    expect(pub.strict).toBe(true);
    expect(pub.metadata).toEqual({ docs: 'https://x' });
    expect(pub.schemaB64).toBe('AAAA');
  });

  it('create references name@version via schemaRef and OMITS absent optionals', () => {
    const cre = m.create({ fiberId: 'fid', initialData: { purchaseCount: 0 } });
    expect(cre.schemaRef).toEqual({ name: 'consumer.package', version: { Exact: { version: '1.0.0' } } });
    expect(cre.fiberId).toBe('fid');
    expect(cre.initialData).toEqual({ purchaseCount: 0 });
    expect(cre).not.toHaveProperty('participants');
    expect(cre).not.toHaveProperty('parentFiberId');
  });

  it('create includes participants / parentFiberId when provided', () => {
    const cre = m.create({
      fiberId: 'fid',
      initialData: {},
      participants: ['0xabc'],
      parentFiberId: 'parent-id',
    });
    expect(cre.participants).toEqual(['0xabc']);
    expect(cre.parentFiberId).toBe('parent-id');
  });

  it('upgradeFrom OMITS migration when absent, INCLUDES it (never null) when present', () => {
    const up1 = m.upgradeFrom({ fiberId: 'fid', targetSequenceNumber: 3 });
    expect(up1).not.toHaveProperty('migration');
    expect(up1.targetRef).toEqual({ name: 'consumer.package', version: { Exact: { version: '1.0.0' } } });
    expect(up1.targetSequenceNumber).toBe(3);

    const up2 = m.upgradeFrom({
      fiberId: 'fid',
      targetSequenceNumber: 3,
      migration: { merge: [{ var: '' }, { loyaltyPoints: 0 }] },
    });
    expect(up2.migration).toEqual({ merge: [{ var: '' }, { loyaltyPoints: 0 }] });
  });

  it('is pure/deterministic: same machine emits identical bodies across calls', () => {
    expect(m.publishVersion()).toEqual(m.publishVersion());
    expect(m.create({ fiberId: 'fid', initialData: {} })).toEqual(
      m.create({ fiberId: 'fid', initialData: {} }),
    );
  });
});
