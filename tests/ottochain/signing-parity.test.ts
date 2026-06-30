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
      transitions: [{ from: 'A', to: 'B', eventName: 'go', guard: { '==': [1, 1] }, effect: { var: 'state' } }],
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
      const wire = toProtoDefinition(defineFiberApp({ ...base, policy: constrained({ maxGenerations: undefined }) }));
      expect(wire).not.toHaveProperty('policy');
    });

    it('emits `policy` as a bare object of ONLY the set dials when constrained', () => {
      const wire = toProtoDefinition(
        defineFiberApp({
          ...base,
          policy: constrained({
            selfReproducing: false,
            maxGenerations: 3,
            allowedEffects: ['EMIT', 'TRANSFER'],
            sealedStates: ['B'],
          }),
        }),
      );
      expect(wire.policy).toEqual({
        selfReproducing: false,
        maxGenerations: 3,
        allowedEffects: ['EMIT', 'TRANSFER'],
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
      // EXACT casing: the capital-I policy-VARIANT tag, NOT the lowercase upgradePolicy dial value.
      expect(JSON.stringify(wire)).toContain('"policy":"Immutable"');
      // The lowercase dial value "immutable" must NOT appear anywhere on the wire.
      expect(JSON.stringify(wire)).not.toContain('"immutable"');
    });

    it('COLLAPSE: constrained({ upgradePolicy: "immutable" }) with only that dial → "Immutable"', () => {
      // The chain collapses this exact lone-dial Constrained (LOWERCASE `"immutable"` dial value)
      // into the `Immutable` variant, so the SDK must sign the capital-I bare string `"Immutable"`
      // (not `{ upgradePolicy: "immutable" }`) or the create signature breaks against the chain's
      // re-encoding.
      const wire = toProtoDefinition(defineFiberApp({ ...base, policy: constrained({ upgradePolicy: 'immutable' }) }));
      expect(wire.policy).toBe('Immutable');
      // immutable() and the collapsed constrained() are wire-identical.
      const wireDirect = toProtoDefinition(defineFiberApp({ ...base, policy: immutable() }));
      expect(JSON.stringify(wire)).toBe(JSON.stringify(wireDirect));
    });

    it('does NOT collapse upgradePolicy="immutable" when ANOTHER dial is also set (stays a dials object)', () => {
      const wire = toProtoDefinition(
        defineFiberApp({
          ...base,
          policy: constrained({ upgradePolicy: 'immutable', maxGenerations: 2 }),
        }),
      );
      expect(typeof wire.policy).toBe('object');
      // Stays a dials object with the LOWERCASE dial value verbatim.
      expect(wire.policy).toEqual({ maxGenerations: 2, upgradePolicy: 'immutable' });
    });
  });

  // Each dial's EXACT chain wire encoding (FiberPolicy.scala). Casing / shape divergence
  // silently breaks the create signature, so these are byte-for-byte assertions.
  describe('dial wire encodings (EXACT chain FiberPolicy.scala parity)', () => {
    const base = {
      metadata: { name: 'P', app: 'p', type: 'p', version: '1.0.0' },
      states: { A: { id: 'A', isFinal: false }, B: { id: 'B', isFinal: true } },
      initialState: 'A' as const,
      transitions: [{ from: 'A', to: 'B', eventName: 'go', guard: { '==': [1, 1] }, effect: { var: 'state' } }],
    };
    const policyOf = (dials: Parameters<typeof constrained>[0]) =>
      toProtoDefinition(defineFiberApp({ ...base, policy: constrained(dials) })).policy;

    it('allowedEffects: UPPERCASE EffectKind tokens, verbatim', () => {
      expect(policyOf({ allowedEffects: ['TRIGGER', 'SPAWN', 'EMIT', 'TRANSFER', 'DEPENDENCY'] })).toEqual({
        allowedEffects: ['TRIGGER', 'SPAWN', 'EMIT', 'TRANSFER', 'DEPENDENCY'],
      });
    });

    it('spawnOwnerPolicy: UPPERCASE SpawnOwnerPolicy token', () => {
      expect(policyOf({ spawnOwnerPolicy: 'SUBSETOFPARENT' })).toEqual({ spawnOwnerPolicy: 'SUBSETOFPARENT' });
    });

    it('transferPolicy: nested object of recipient allowlists', () => {
      expect(
        policyOf({
          transferPolicy: {
            allowedRecipientFibers: ['11111111-1111-1111-1111-111111111111'],
            allowedRecipientWallets: ['DAG0000000000000000000000000000000000000000'],
          },
        }),
      ).toEqual({
        transferPolicy: {
          allowedRecipientFibers: ['11111111-1111-1111-1111-111111111111'],
          allowedRecipientWallets: ['DAG0000000000000000000000000000000000000000'],
        },
      });
    });

    it('dependencyPolicy: nested object with REQUIRED UPPERCASE mode + optional allowed', () => {
      expect(
        policyOf({
          dependencyPolicy: { mode: 'ALLOWLIST', allowed: ['22222222-2222-2222-2222-222222222222'] },
        }),
      ).toEqual({
        dependencyPolicy: { mode: 'ALLOWLIST', allowed: ['22222222-2222-2222-2222-222222222222'] },
      });
      // FROZEN with no allowed list — mode alone.
      expect(policyOf({ dependencyPolicy: { mode: 'FROZEN' } })).toEqual({
        dependencyPolicy: { mode: 'FROZEN' },
      });
    });

    it('upgradePolicy: LOWERCASE bare tags', () => {
      expect(policyOf({ upgradePolicy: 'appendOnly' })).toEqual({ upgradePolicy: 'appendOnly' });
      expect(policyOf({ upgradePolicy: 'arbitrary' })).toEqual({ upgradePolicy: 'arbitrary' });
      // lowercase "immutable" is the DIAL VALUE (distinct from the policy-level "Immutable" variant).
      expect(policyOf({ upgradePolicy: 'immutable', maxGenerations: 1 })).toEqual({
        upgradePolicy: 'immutable',
        maxGenerations: 1,
      });
    });

    it('upgradePolicy: Governed object { authority } with the Signers MigrationAuthority arm', () => {
      expect(
        policyOf({
          upgradePolicy: { authority: { addresses: ['DAG0000000000000000000000000000000000000000'] } },
        }),
      ).toEqual({
        upgradePolicy: { authority: { addresses: ['DAG0000000000000000000000000000000000000000'] } },
      });
    });

    it('migrationAuthority: Signers arm = { addresses }, Role arm = { registryFiberId, roleField }', () => {
      expect(policyOf({ migrationAuthority: { addresses: ['DAG0000000000000000000000000000000000000000'] } })).toEqual({
        migrationAuthority: { addresses: ['DAG0000000000000000000000000000000000000000'] },
      });
      expect(
        policyOf({
          migrationAuthority: { registryFiberId: '33333333-3333-3333-3333-333333333333', roleField: 'admins' },
        }),
      ).toEqual({
        migrationAuthority: { registryFiberId: '33333333-3333-3333-3333-333333333333', roleField: 'admins' },
      });
    });

    it('version: a bare SemVer STRING (not an object)', () => {
      const policy = policyOf({ version: '1.2.3' });
      expect(policy).toEqual({ version: '1.2.3' });
      expect(typeof (policy as { version: unknown }).version).toBe('string');
    });

    it('compatibleWith: nested { min, max } SemVer-string window', () => {
      expect(policyOf({ compatibleWith: { min: '1.0.0', max: '2.0.0' } })).toEqual({
        compatibleWith: { min: '1.0.0', max: '2.0.0' },
      });
    });

    it('a rich multi-dial policy round-trips byte-identically through JSON', () => {
      const rich = constrained({
        selfReproducing: true,
        allowedEffects: ['EMIT', 'TRANSFER'],
        spawnOwnerPolicy: 'INHERITPARENT',
        maxGenerations: 3,
        maxSpawnFanout: 5,
        acceptedCallers: ['44444444-4444-4444-4444-444444444444'],
        sealedStates: ['B'],
        transferPolicy: { allowedRecipientWallets: ['DAG0000000000000000000000000000000000000000'] },
        dependencyPolicy: { mode: 'OPEN' },
        upgradePolicy: 'appendOnly',
        version: '2.1.0',
        compatibleWith: { min: '2.0.0' },
        interfaces: ['iVotable', 'iStakeable'],
        migrationAuthority: { registryFiberId: '55555555-5555-5555-5555-555555555555', roleField: 'gov' },
      });
      const wire = toProtoDefinition(defineFiberApp({ ...base, policy: rich }));
      expect(wire.policy).toEqual({
        selfReproducing: true,
        allowedEffects: ['EMIT', 'TRANSFER'],
        spawnOwnerPolicy: 'INHERITPARENT',
        maxGenerations: 3,
        maxSpawnFanout: 5,
        acceptedCallers: ['44444444-4444-4444-4444-444444444444'],
        sealedStates: ['B'],
        transferPolicy: { allowedRecipientWallets: ['DAG0000000000000000000000000000000000000000'] },
        dependencyPolicy: { mode: 'OPEN' },
        upgradePolicy: 'appendOnly',
        version: '2.1.0',
        compatibleWith: { min: '2.0.0' },
        interfaces: ['iVotable', 'iStakeable'],
        migrationAuthority: { registryFiberId: '55555555-5555-5555-5555-555555555555', roleField: 'gov' },
      });
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
