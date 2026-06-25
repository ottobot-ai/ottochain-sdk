/**
 * Signing-canonical parity guard.
 *
 * Locks the invariants that keep the SDK's signed `StateMachineDefinition` byte-identical
 * to what the chain re-encodes and verifies over `JCS(dropNulls(payload))`. A regression in
 * any of these silently diverges the canonical and the chain rejects every update with an
 * opaque `InvalidSignature` (empty-body HTTP 400). See docs/signing-and-publishing.md and the
 * chain's `PublishVersionSigningCanonicalSuite` / `SdkCompatibilitySuite`.
 */
import { describe, it, expect } from '@jest/globals';
import {
  toProtoDefinition,
  defineFiberApp,
  constrained,
  unconstrained,
  immutable,
} from '../../src/schema/fiber-app.js';
import { dropNulls } from '../../src/ottochain/drop-nulls.js';
import { identityUniversalDef } from '../../src/apps/identity/state-machines/identity-universal.js';
import { govUniversalDef } from '../../src/apps/governance/state-machines/governance-universal.js';
import { marketUniversalDef } from '../../src/apps/markets/state-machines/market-universal.js';

const WIRE_TRANSITION_KEYS = ['from', 'to', 'eventName', 'guard', 'effect', 'dependencies'];
// FiberAppDefinition authoring fields that have NO place on the chain wire
// `StateMachineDefinition` (the chain ignores unknowns, then re-encodes WITHOUT them).
const NON_WIRE_DEF_KEYS = ['createSchema', 'stateSchema', 'eventSchemas', 'definitions'];

describe('signing-canonical parity (SDK <-> chain wire StateMachineDefinition)', () => {
  const apps = {
    identity: identityUniversalDef,
    governance: govUniversalDef,
    markets: marketUniversalDef,
  } as const;

  for (const [name, def] of Object.entries(apps)) {
    describe(name, () => {
      const wire = toProtoDefinition(def);

      it('strips all non-wire authoring fields (createSchema/stateSchema/eventSchemas/definitions)', () => {
        for (const k of NON_WIRE_DEF_KEYS) expect(wire).not.toHaveProperty(k);
      });

      it('every transition carries ONLY the wire keys, a string[] dependencies, and no `emits`', () => {
        for (const t of wire.transitions) {
          for (const k of Object.keys(t)) expect(WIRE_TRANSITION_KEYS).toContain(k);
          expect(Array.isArray(t.dependencies)).toBe(true);
          for (const d of t.dependencies) expect(typeof d).toBe('string');
          expect(t).not.toHaveProperty('emits');
        }
      });

      it('every state projects to exactly { id, isFinal }', () => {
        for (const st of Object.values(wire.states)) {
          expect(Object.keys(st).sort()).toEqual(['id', 'isFinal']);
        }
      });

      it('contains no `$timestamp` (the chain reserves $ordinal/$epochProgress, never $timestamp)', () => {
        expect(JSON.stringify(wire)).not.toContain('$timestamp');
      });

      it('omits the `policy` key (std apps are Unconstrained == no policy key on the wire)', () => {
        expect(wire).not.toHaveProperty('policy');
        expect(JSON.stringify(wire)).not.toContain('"policy"');
      });
    });
  }

  describe('FiberPolicy projection (Unconstrained == omit, Constrained == bare set-dial object)', () => {
    const base = {
      metadata: { name: 'P', app: 'p', type: 'p', version: '1.0.0' },
      states: { A: { id: 'A', isFinal: false }, B: { id: 'B', isFinal: true } },
      initialState: 'A' as const,
      transitions: [
        { from: 'A', to: 'B', eventName: 'go', guard: { '==': [1, 1] }, effect: { var: 'state' } },
      ],
    };

    it('omits `policy` entirely when the definition is unconstrained (no policy field)', () => {
      const wire = toProtoDefinition(defineFiberApp({ ...base }));
      expect(wire).not.toHaveProperty('policy');
    });

    it('omits `policy` when `policy: unconstrained()` is set explicitly', () => {
      const wire = toProtoDefinition(defineFiberApp({ ...base, policy: unconstrained() }));
      expect(wire).not.toHaveProperty('policy');
    });

    it('omits `policy` when a constrained() has zero effective dials (empty == Unconstrained)', () => {
      const wire = toProtoDefinition(
        defineFiberApp({ ...base, policy: constrained({ maxGenerations: undefined }) }),
      );
      expect(wire).not.toHaveProperty('policy');
    });

    it('emits `policy` as a bare object of ONLY the set dials when constrained', () => {
      const wire = toProtoDefinition(
        defineFiberApp({
          ...base,
          policy: constrained({
            selfReproducing: false,
            maxGenerations: 3,
            allowedEffects: ['_emit', '_transferAsset'],
            sealedStates: ['B'],
          }),
        }),
      );
      expect(wire.policy).toEqual({
        selfReproducing: false,
        maxGenerations: 3,
        allowedEffects: ['_emit', '_transferAsset'],
        sealedStates: ['B'],
      });
    });

    it('strips unset dials so the wire matches the chain `dropNulls`-stripped Constrained', () => {
      const wire = toProtoDefinition(
        defineFiberApp({ ...base, policy: constrained({ maxGenerations: 2, transferPolicy: undefined }) }),
      );
      expect(Object.keys(wire.policy ?? {})).toEqual(['maxGenerations']);
    });

    it('emits `policy` as the bare string "Immutable" for an immutable() definition', () => {
      const wire = toProtoDefinition(defineFiberApp({ ...base, policy: immutable() }));
      expect(wire.policy).toBe('Immutable');
      // EXACT casing: the capital-I variant tag, NOT the all-caps dial value.
      expect(JSON.stringify(wire)).toContain('"policy":"Immutable"');
      expect(JSON.stringify(wire)).not.toContain('IMMUTABLE');
    });

    it('COLLAPSE: constrained({ upgradePolicy: "IMMUTABLE" }) with only that dial → "Immutable"', () => {
      // The chain collapses this exact lone-dial Constrained into the Immutable variant, so the
      // SDK must sign the bare string `"Immutable"` (not `{ upgradePolicy: "IMMUTABLE" }`) or the
      // create signature breaks against the chain's re-encoding.
      const wire = toProtoDefinition(
        defineFiberApp({ ...base, policy: constrained({ upgradePolicy: 'IMMUTABLE' }) }),
      );
      expect(wire.policy).toBe('Immutable');
      // immutable() and the collapsed constrained() are wire-identical.
      const wireDirect = toProtoDefinition(defineFiberApp({ ...base, policy: immutable() }));
      expect(JSON.stringify(wire)).toBe(JSON.stringify(wireDirect));
    });

    it('does NOT collapse upgradePolicy=IMMUTABLE when ANOTHER dial is also set (stays a dials object)', () => {
      const wire = toProtoDefinition(
        defineFiberApp({
          ...base,
          policy: constrained({ upgradePolicy: 'IMMUTABLE', maxGenerations: 2 }),
        }),
      );
      expect(typeof wire.policy).toBe('object');
      expect(wire.policy).toEqual({ maxGenerations: 2, upgradePolicy: 'IMMUTABLE' });
    });
  });

  it('toProtoDefinition drops build-time-only DependencySpec objects + emits, keeping string deps', () => {
    const def = defineFiberApp({
      metadata: { name: 'X', app: 'x', type: 'x', version: '1.0.0' },
      states: { A: { id: 'A', isFinal: false }, B: { id: 'B', isFinal: true } },
      initialState: 'A',
      transitions: [
        {
          from: 'A',
          to: 'B',
          eventName: 'go',
          guard: { '==': [1, 1] },
          effect: { var: 'state' },
          // a DependencySpec (no wire representation) interleaved with a real UUID string
          dependencies: [{ machine: 'other', instanceRef: { var: 'x' } }, 'uuid-1'],
          emits: ['SOMETHING'],
        },
      ],
    });
    const t = toProtoDefinition(def).transitions[0];
    expect(t.dependencies).toEqual(['uuid-1']); // DependencySpec dropped, string UUID kept
    expect(t).not.toHaveProperty('emits');
  });

  describe('dropNulls content-hash invariant (must match metakit JsonBinaryCodec.dropNulls)', () => {
    it('an explicit-null object field is identical to an absent one', () => {
      expect(dropNulls({ a: 1, b: null, c: { d: null, e: 2 } })).toEqual({ a: 1, c: { e: 2 } });
    });

    it('preserves array nulls (index positions are load-bearing)', () => {
      expect(dropNulls({ xs: [1, null, 3] })).toEqual({ xs: [1, null, 3] });
    });

    it('keeps false / 0 / {} / [] (only null/undefined are dropped)', () => {
      const v = { f: false, z: 0, o: {}, a: [] };
      expect(dropNulls(v)).toEqual(v);
    });
  });
});
