/**
 * Tests for the message-layer ApplyMorphism lint (src/ottochain/morphism-lint.ts).
 *
 * Each rule gets a FAILING case (exactly that finding fires) plus CLEAN cases that
 * must NOT fire it. Messages are minimal, hand-built ApplyMorphism records.
 */

import { describe, it, expect } from '@jest/globals';
import { lintApplyMorphism, MORPHISM_LINT_CODES, type LintViolation } from '../../src/ottochain/morphism-lint.js';
import type { ApplyMorphism } from '../../src/ottochain/types.js';

const has = (vs: LintViolation[], code: string) => vs.some((v) => v.code === code);
const errors = (vs: LintViolation[]) => vs.filter((v) => v.severity === 'error');
const warns = (vs: LintViolation[]) => vs.filter((v) => v.severity === 'warn');

/** Minimal Compose morphism; callers override fields. */
function compose(extra: Partial<ApplyMorphism> = {}): ApplyMorphism {
  return { assetId: 'A', kind: 'COMPOSE', targetSequenceNumber: 1, ...extra };
}

describe('lintApplyMorphism', () => {
  // -------------------------------------------------------------------------
  // error: duplicate otherAssetIds
  // -------------------------------------------------------------------------
  describe('duplicate-id error', () => {
    it('FAIL: a duplicated counter-party id is an error', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B', 'C', 'B'], nonce: 5 }));
      expect(has(vs, MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID)).toBe(true);
      expect(errors(vs).length).toBeGreaterThanOrEqual(1);
      const dup = vs.find((v) => v.code === MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID)!;
      expect(dup.path).toBe('otherAssetIds[2]');
      expect(dup.message).toContain('"B"');
    });

    it('reports one finding per distinct duplicated id', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B', 'B', 'C', 'C', 'C'], nonce: 5 }));
      const dups = vs.filter((v) => v.code === MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID);
      expect(dups.length).toBe(2);
    });

    it('CLEAN: distinct ids do not fire the duplicate error', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B', 'C', 'D'], nonce: 5 }));
      expect(has(vs, MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // error: self-composition (otherAssetIds includes assetId)
  // -------------------------------------------------------------------------
  describe('self-id error', () => {
    it('FAIL: otherAssetIds including the source assetId is an error', () => {
      const vs = lintApplyMorphism(compose({ assetId: 'A', otherAssetIds: ['B', 'A'], nonce: 5 }));
      expect(has(vs, MORPHISM_LINT_CODES.SELF_COMPOSE)).toBe(true);
      const self = vs.find((v) => v.code === MORPHISM_LINT_CODES.SELF_COMPOSE)!;
      expect(self.severity).toBe('error');
      expect(self.path).toBe('otherAssetIds[1]');
    });

    it('CLEAN: otherAssetIds without the source id does not fire self-compose', () => {
      const vs = lintApplyMorphism(compose({ assetId: 'A', otherAssetIds: ['B', 'C'], nonce: 5 }));
      expect(has(vs, MORPHISM_LINT_CODES.SELF_COMPOSE)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // error: otherAssetIds set on a non-composing kind
  // -------------------------------------------------------------------------
  describe('wrong-kind error', () => {
    it('FAIL: otherAssetIds on a TRANSFER is an error (field ignored)', () => {
      const vs = lintApplyMorphism({
        assetId: 'A',
        kind: 'TRANSFER',
        targetSequenceNumber: 1,
        otherAssetIds: ['B'],
      });
      expect(has(vs, MORPHISM_LINT_CODES.OTHER_IDS_IGNORED)).toBe(true);
      expect(vs.find((v) => v.code === MORPHISM_LINT_CODES.OTHER_IDS_IGNORED)!.path).toBe('otherAssetIds');
    });

    it('CLEAN: no otherAssetIds on a TRANSFER is fine', () => {
      const vs = lintApplyMorphism({
        assetId: 'A',
        kind: 'TRANSFER',
        targetSequenceNumber: 1,
        recipient: { Wallet: { address: 'DAG2' } },
      });
      expect(vs).toHaveLength(0);
    });

    it('CLEAN: otherAssetIds on POOL does not fire wrong-kind', () => {
      const vs = lintApplyMorphism(compose({ kind: 'POOL', otherAssetIds: ['B'], nonce: 1 }));
      expect(has(vs, MORPHISM_LINT_CODES.OTHER_IDS_IGNORED)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // warn: composing with counter-parties but no consent nonce
  // -------------------------------------------------------------------------
  describe('compose-without-nonce warning', () => {
    it('WARN: COMPOSE with otherAssetIds and no nonce warns (not an error)', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B'] }));
      expect(has(vs, MORPHISM_LINT_CODES.COMPOSE_NO_NONCE)).toBe(true);
      expect(errors(vs)).toHaveLength(0);
      expect(warns(vs)).toHaveLength(1);
      expect(vs[0].path).toBe('nonce');
    });

    it('WARN: POOL with otherAssetIds and no nonce warns', () => {
      const vs = lintApplyMorphism(compose({ kind: 'POOL', otherAssetIds: ['B', 'C'] }));
      expect(has(vs, MORPHISM_LINT_CODES.COMPOSE_NO_NONCE)).toBe(true);
    });

    it('CLEAN: COMPOSE with a nonce does not warn', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B'], nonce: 7 }));
      expect(has(vs, MORPHISM_LINT_CODES.COMPOSE_NO_NONCE)).toBe(false);
      expect(vs).toHaveLength(0);
    });

    it('CLEAN: nonce === 0 is treated as present (not a missing-nonce warning)', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: ['B'], nonce: 0 }));
      expect(has(vs, MORPHISM_LINT_CODES.COMPOSE_NO_NONCE)).toBe(false);
    });

    it('CLEAN: same-holder compose (otherAssetIds empty) does not warn', () => {
      const vs = lintApplyMorphism(compose({ otherAssetIds: [] }));
      expect(vs).toHaveLength(0);
    });

    it('CLEAN: COMPOSE with no otherAssetIds field at all does not warn', () => {
      const vs = lintApplyMorphism(compose());
      expect(vs).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // non-composing kinds without otherAssetIds are always clean
  // -------------------------------------------------------------------------
  describe('non-Compose kinds', () => {
    it.each(['TRANSFER', 'BURN', 'FRACTIONALIZE', 'DECOMPOSE', 'WRAP', 'STAKE'] as const)(
      'CLEAN: %s with no otherAssetIds is clean',
      (kind) => {
        const vs = lintApplyMorphism({ assetId: 'A', kind, targetSequenceNumber: 1 });
        expect(vs).toHaveLength(0);
      },
    );
  });

  // -------------------------------------------------------------------------
  // combined: multiple findings can fire together
  // -------------------------------------------------------------------------
  it('reports duplicate + self + no-nonce together on one message', () => {
    const vs = lintApplyMorphism(compose({ assetId: 'A', otherAssetIds: ['A', 'B', 'B'] }));
    expect(has(vs, MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID)).toBe(true);
    expect(has(vs, MORPHISM_LINT_CODES.SELF_COMPOSE)).toBe(true);
    expect(has(vs, MORPHISM_LINT_CODES.COMPOSE_NO_NONCE)).toBe(true);
    expect(errors(vs).length).toBe(2); // duplicate + self
    expect(warns(vs).length).toBe(1); // no-nonce
  });

  it('is pure — does not mutate the input message', () => {
    const msg = compose({ otherAssetIds: ['B', 'C'], nonce: 3 });
    const snapshot = JSON.stringify(msg);
    lintApplyMorphism(msg);
    expect(JSON.stringify(msg)).toBe(snapshot);
  });
});
