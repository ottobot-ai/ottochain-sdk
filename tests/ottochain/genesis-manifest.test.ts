import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildGenesisManifest,
  GENESIS_MANIFEST_VERSION,
  type GenesisManifest,
  type GenesisPackage,
  type MessageShape,
} from '../../src/ottochain/genesis-manifest';

const REPO_ROOT = resolve(__dirname, '..', '..');

function loadArchive(app: string, file: string): Record<string, unknown> {
  const path = resolve(REPO_ROOT, 'src', 'apps', app, 'state-machines', 'json-archive', file);
  return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
}

/** Strip the convention-only `dependencies: []` / state `metadata: null` /
 *  top-level `metadata` so two definitions can be compared on their
 *  consensus-relevant content (the chain decodes these to identical values). */
function canonicalDef(def: Record<string, unknown>): Record<string, unknown> {
  const states = (def.states ?? {}) as Record<string, Record<string, unknown>>;
  const strippedStates: Record<string, unknown> = {};
  for (const [k, st] of Object.entries(states)) {
    strippedStates[k] = { id: st.id, isFinal: st.isFinal ?? false };
  }
  const transitions = (def.transitions ?? []) as Record<string, unknown>[];
  return {
    states: strippedStates,
    initialState: def.initialState,
    transitions: transitions.map((t) => ({
      from: t.from,
      to: t.to,
      eventName: t.eventName,
      guard: t.guard,
      effect: t.effect,
    })),
  };
}

describe('genesis manifest', () => {
  const manifest: GenesisManifest = buildGenesisManifest();
  const byName = new Map(manifest.packages.map((p) => [p.name, p] as const));

  it('has the expected version and three std packages', () => {
    expect(manifest.version).toBe(GENESIS_MANIFEST_VERSION);
    expect(manifest.version).toBe(1);
    expect(manifest.packages).toHaveLength(3);
    expect([...byName.keys()].sort()).toEqual([
      'std.governance.package',
      'std.identity.package',
      'std.markets.package',
    ]);
  });

  it('every package name is well-formed: std.<app>.package', () => {
    for (const pkg of manifest.packages) {
      // RegistryName: "<labels>.<tld>", tld === "package", first label "std".
      expect(pkg.name.endsWith('.package')).toBe(true);
      const labels = pkg.name.slice(0, -'.package'.length);
      expect(labels.length).toBeGreaterThan(0);
      const parts = labels.split('.');
      expect(parts[0]).toBe('std');
      // Each label: lowercase alphanumeric + hyphen, no leading/trailing hyphen.
      for (const label of parts) {
        expect(label).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/);
      }
      // Chain RegistryName.MaxLength.
      expect(pkg.name.length).toBeLessThanOrEqual(253);
    }
  });

  it('every package carries content and the required scalar fields', () => {
    for (const pkg of manifest.packages) {
      expect(typeof pkg.semver).toBe('string');
      expect(pkg.semver).toMatch(/^\d+\.\d+\.\d+$/);
      expect(typeof pkg.strict).toBe('boolean');
      expect(pkg.strict).toBe(false);
      expect(pkg.metadata).toEqual({});
      expect(pkg.machineShape).toBeDefined();
      expect(pkg.definition).toBeDefined();
    }
  });

  it('every machineShape.stateMessage has a non-empty, well-formed field list', () => {
    for (const pkg of manifest.packages) {
      const sm: MessageShape = pkg.machineShape.stateMessage;
      expect(sm.typeName.trim().length).toBeGreaterThan(0);
      expect(sm.fields.length).toBeGreaterThan(0);

      const numbers = sm.fields.map((f) => f.number);
      // Unique field numbers, within proto range, outside the reserved window.
      expect(new Set(numbers).size).toBe(numbers.length);
      for (const f of sm.fields) {
        expect(f.name.trim().length).toBeGreaterThan(0);
        expect(f.typeName.trim().length).toBeGreaterThan(0);
        expect(f.number).toBeGreaterThanOrEqual(1);
        expect(f.number).toBeLessThanOrEqual(536870911);
        expect(f.number < 19000 || f.number > 19999).toBe(true);
        expect(typeof f.repeated).toBe('boolean');
        expect(typeof f.optional).toBe('boolean');
      }
    }
  });

  it('commands are empty for this first cut (flagged follow-up)', () => {
    for (const pkg of manifest.packages) {
      expect(pkg.machineShape.commands).toEqual({});
    }
  });

  it('stateMessage typeNames match the chain conformance suite', () => {
    expect(byName.get('std.identity.package')!.machineShape.stateMessage.typeName).toBe(
      'ottochain.apps.identity.v1.Identity',
    );
    expect(byName.get('std.governance.package')!.machineShape.stateMessage.typeName).toBe(
      'ottochain.apps.governance.v1.Proposal',
    );
    expect(byName.get('std.markets.package')!.machineShape.stateMessage.typeName).toBe(
      'ottochain.apps.markets.v1.Market',
    );
  });

  describe('definitions', () => {
    const checkWireShape = (pkg: GenesisPackage) => {
      const def = pkg.definition;
      expect(Object.keys(def.states).length).toBeGreaterThan(0);
      expect(typeof def.initialState).toBe('string');
      expect(def.states[def.initialState]).toBeDefined();
      expect(Array.isArray(def.transitions)).toBe(true);
      expect(def.transitions.length).toBeGreaterThan(0);
      // Wire convention: explicit nulls / empty deps, no FiberAppMetadata.
      expect(def.metadata).toBeNull();
      for (const st of Object.values(def.states)) {
        expect(typeof st.id).toBe('string');
        expect(typeof st.isFinal).toBe('boolean');
        expect(st.metadata).toBeNull();
      }
      for (const t of def.transitions) {
        expect(typeof t.from).toBe('string');
        expect(typeof t.to).toBe('string');
        expect(typeof t.eventName).toBe('string');
        expect(t.guard).toBeDefined();
        expect(t.effect).toBeDefined();
        expect(Array.isArray(t.dependencies)).toBe(true);
      }
    };

    it('each definition is a valid wire StateMachineDefinition', () => {
      for (const pkg of manifest.packages) checkWireShape(pkg);
    });

    it('each definition round-trips through JSON unchanged', () => {
      for (const pkg of manifest.packages) {
        const roundTripped = JSON.parse(JSON.stringify(pkg.definition));
        expect(roundTripped).toEqual(pkg.definition);
      }
    });

    it('governance definition matches the checked-in json-archive (content)', () => {
      const archive = loadArchive('governance', 'governance-universal.json');
      const pkg = byName.get('std.governance.package')!;
      expect(canonicalDef(pkg.definition as unknown as Record<string, unknown>)).toEqual(canonicalDef(archive));
    });

    it('markets definition matches the checked-in json-archive (content)', () => {
      const archive = loadArchive('markets', 'market-universal.json');
      const pkg = byName.get('std.markets.package')!;
      expect(canonicalDef(pkg.definition as unknown as Record<string, unknown>)).toEqual(canonicalDef(archive));
    });
  });

  it('the whole manifest is JSON-serializable and round-trips', () => {
    const json = JSON.stringify(manifest);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual(manifest);
  });
});
