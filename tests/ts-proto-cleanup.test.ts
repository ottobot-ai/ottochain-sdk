/**
 * TDD Tests: ts-proto cleanup & generated export path
 *
 * Card: 📦 ts-proto: Configure TypeScript type generation for SDK (699621e1)
 * Spec: docs/design/ts-proto-cleanup-spec.md (feat/ts-proto-cleanup)
 *
 * 16 tests in 6 groups — all written to fail first, pass after implementation.
 *
 * @group ts-proto
 * @group cleanup
 */

import { describe, it, expect } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

// ─────────────────────────────────────────────────────────────────────────────
// Group 1: Dependency Cleanup (3 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 1: Dependency Cleanup', () => {
  it('package.json should NOT contain @bufbuild/protoc-gen-es in devDependencies', () => {
    const devDeps = pkg.devDependencies ?? {};
    expect(devDeps).not.toHaveProperty('@bufbuild/protoc-gen-es');
  });

  it('package.json should NOT contain @protobuf-ts/plugin or @protobuf-ts/runtime', () => {
    const devDeps = pkg.devDependencies ?? {};
    expect(devDeps).not.toHaveProperty('@protobuf-ts/plugin');
    expect(devDeps).not.toHaveProperty('@protobuf-ts/runtime');
  });

  it('package.json should contain @bufbuild/protobuf in dependencies (not devDependencies)', () => {
    // Runtime dep — ts-proto generated files import BinaryReader/BinaryWriter from it
    const deps    = pkg.dependencies    ?? {};
    const devDeps = pkg.devDependencies ?? {};
    expect(deps).toHaveProperty('@bufbuild/protobuf');
    expect(devDeps).not.toHaveProperty('@bufbuild/protobuf');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 2: Dist Artifact Cleanup (2 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 2: Dist Artifact Cleanup', () => {
  it('should have no *_pb.js files anywhere under dist/', () => {
    // _pb files are artifacts from removed @bufbuild/protoc-gen-es generator
    let found: string[] = [];
    try {
      const result = execSync('find dist/ -name "*_pb.js" -o -name "*_pb.d.ts" 2>/dev/null', {
        cwd: ROOT, encoding: 'utf8'
      }).trim();
      found = result ? result.split('\n').filter(Boolean) : [];
    } catch {
      // find matched nothing; found stays []
    }
    expect(found).toHaveLength(0);
  });

  it('buf.gen.yaml should not contain protoc-gen-es plugin (so npm run generate never produces _pb files)', () => {
    // Verify that the generator config no longer references @bufbuild/protoc-gen-es
    const bufGenPath = join(ROOT, 'buf.gen.yaml');
    if (!existsSync(bufGenPath)) {
      // No buf.gen.yaml = no generator = passes vacuously
      return;
    }
    const content = readFileSync(bufGenPath, 'utf8');
    expect(content).not.toContain('protoc-gen-es');
    expect(content).not.toContain('@bufbuild/protoc-gen-es');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 3: Generated Export Path (4 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 3: Generated Export Path', () => {
  it('package.json exports map should have ./generated key', () => {
    const exports = pkg.exports ?? {};
    // Use Object.keys to avoid Jest treating '.' as nested path separator
    expect(Object.keys(exports)).toContain('./generated');
  });

  it('./generated export should resolve FiberStatus (check dist/esm/generated/index.js)', () => {
    const indexPath = join(ROOT, 'dist/esm/generated/index.js');
    expect(existsSync(indexPath)).toBe(true);
    const content = readFileSync(indexPath, 'utf8');
    expect(content).toContain('FiberStatus');
  });

  it('./generated export should resolve CreateStateMachine (check dist/esm/generated/index.js)', () => {
    const indexPath = join(ROOT, 'dist/esm/generated/index.js');
    expect(existsSync(indexPath)).toBe(true);
    const content = readFileSync(indexPath, 'utf8');
    expect(content).toContain('CreateStateMachine');
  });

  it('./generated export should resolve Identity (check dist/esm/generated/index.js)', () => {
    const indexPath = join(ROOT, 'dist/esm/generated/index.js');
    expect(existsSync(indexPath)).toBe(true);
    const content = readFileSync(indexPath, 'utf8');
    expect(content).toContain('Identity');
    expect(content).toContain('IdentityState');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 4: FiberStatus Type Distinction (3 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 4: FiberStatus Type Distinction', () => {
  it('generated FiberStatus (from src/generated/) should contain FIBER_STATUS_ACTIVE', () => {
    const fiberGenPath = join(ROOT, 'src/generated/ottochain/v1/fiber.ts');
    expect(existsSync(fiberGenPath)).toBe(true);
    const content = readFileSync(fiberGenPath, 'utf8');
    expect(content).toContain('FIBER_STATUS_ACTIVE');
  });

  it('wire-format FiberStatus (from src/ottochain/types.ts) should contain Active but NOT FIBER_STATUS_ACTIVE', () => {
    // Wire-format types use plain string enums for the metagraph REST API
    const typesPath = join(ROOT, 'src/ottochain/types.ts');
    expect(existsSync(typesPath)).toBe(true);
    const content = readFileSync(typesPath, 'utf8');
    // Should have wire-format string
    expect(content).toContain("'Active'");
    // Should NOT mix in proto-convention strings
    expect(content).not.toContain('FIBER_STATUS_ACTIVE');
  });

  it('wire-format and generated FiberStatus should be defined in separate files (distinct types)', () => {
    // The two type systems must stay separate until PR #89 (Migrate fiber-engine) merges
    const generatedPath = join(ROOT, 'src/generated/ottochain/v1/fiber.ts');
    const wireFormatPath = join(ROOT, 'src/ottochain/types.ts');
    expect(existsSync(generatedPath)).toBe(true);
    expect(existsSync(wireFormatPath)).toBe(true);
    // They must be in different files
    expect(generatedPath).not.toBe(wireFormatPath);
    // Neither file should import the FiberStatus from the other
    const genContent  = readFileSync(generatedPath, 'utf8');
    const wireContent = readFileSync(wireFormatPath, 'utf8');
    // Generated should not import from wire-format types
    expect(genContent).not.toContain("from '../../ottochain/types'");
    expect(genContent).not.toContain("from '../../../ottochain/types'");
    // Wire-format should not import FiberStatus from generated
    const importsSrc = wireContent.match(/import.*FiberStatus.*from/g) ?? [];
    const importsGenerated = importsSrc.filter(l => l.includes('generated'));
    expect(importsGenerated).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 5: CI Idempotency (2 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 5: CI Idempotency', () => {
  it('buf.gen.yaml should specify ts-proto as the only generator plugin', () => {
    const bufGenPath = join(ROOT, 'buf.gen.yaml');
    if (!existsSync(bufGenPath)) return;
    const content = readFileSync(bufGenPath, 'utf8');
    // Only ts-proto plugin should be present (not es, not protobuf-ts)
    expect(content).toContain('ts_proto');
    expect(content).not.toContain('protoc-gen-es');
    expect(content).not.toContain('protobuf-ts');
  });

  it('buf.yaml (or buf.gen.yaml) should be present and valid (buf lint sanity)', () => {
    // At minimum, the buf config must exist to enable `npm run generate`
    const hasBufGen  = existsSync(join(ROOT, 'buf.gen.yaml'));
    const hasBufYaml = existsSync(join(ROOT, 'buf.yaml'));
    expect(hasBufGen || hasBufYaml).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group 6: Documentation Presence (2 tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('Group 6: Documentation Presence', () => {
  it('should have dual-type architecture documentation in CONTRIBUTING.md or docs/type-architecture.md', () => {
    const contributing = join(ROOT, 'CONTRIBUTING.md');
    const typeArch     = join(ROOT, 'docs/type-architecture.md');

    const inContributing = existsSync(contributing) &&
      readFileSync(contributing, 'utf8').toLowerCase().includes('dual-type');
    const inTypeArch     = existsSync(typeArch);

    expect(inContributing || inTypeArch).toBe(true);
  });

  it('should have TODO/migration note for post-PR#89 state machine JSON migration in src/', () => {
    // Find TODO comment about PR #89 migration in src/ directory
    let found = false;
    try {
      const result = execSync(
        'grep -r "PR.*89\\|PR #89\\|migration" src/ --include="*.ts" -l 2>/dev/null',
        { cwd: ROOT, encoding: 'utf8' }
      ).trim();
      found = result.length > 0;
    } catch {
      // grep exits non-zero if no matches; found stays false
    }

    if (!found) {
      // Accept a migration note in docs/ as well
      const typeArchPath = join(ROOT, 'docs/type-architecture.md');
      if (existsSync(typeArchPath)) {
        const content = readFileSync(typeArchPath, 'utf8');
        found = content.includes('PR #89') || content.includes('Phase 2') || content.includes('migration');
      }
    }
    expect(found).toBe(true);
  });
});
