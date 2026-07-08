/**
 * Message-layer advisory lint for an {@link ApplyMorphism} transaction (asset-model.md §7; chain
 * audit finding C2, enforced in `AssetCombiner`).
 *
 * Purpose
 * -------
 * The definition-scoped {@link ../schema/guard-lint.ts | guard-lint} walks fiber-app DEFINITIONS; it
 * never sees an `ApplyMorphism` MESSAGE, so a malformed / no-consent `Compose` slips past it. This
 * linter closes that gap at the transaction-builder layer: hand it the `ApplyMorphism` you are about
 * to sign and it flags the two classes of C2 mistake the chain rejects.
 *
 * The chain rule being mirrored (C2, `Compose`/`Pool` only):
 *   - `otherAssetIds` must be free of duplicates and must NOT include the source `assetId`
 *     (the old self/duplicate-inflation path — rejected unconditionally, holder-independent).
 *   - every counter-party the signer does NOT hold requires a live {@link AuthorizeCompose} `nonce`;
 *     a same-holder / all-signer-owned compose needs none.
 *
 * ERRORS are statically certain (the chain rejects regardless of who holds what). WARNINGS are
 * heuristic — the signer's holdings/ownership are unknown at build time, so a missing consent nonce
 * cannot be proven fatal (a same-holder compose is legitimately nonce-less).
 *
 * This is a PURE, non-throwing advisory. It is deliberately NOT wired into
 * {@link createApplyMorphismPayload} (which must stay non-breaking and side-effect-free); call it
 * explicitly before signing, or in your app's own pre-flight checks.
 */

import type { ApplyMorphism } from './types.js';
// Reuse guard-lint's finding shape + severity levels so both linters emit a consistent finding type.
import type { LintViolation, LintSeverity } from '../schema/guard-lint.js';

export type { LintViolation, LintSeverity } from '../schema/guard-lint.js';

/** Stable rule codes for {@link lintApplyMorphism} — referenced by tests and report tooling. */
export const MORPHISM_LINT_CODES = {
  /** `otherAssetIds` contains a duplicate id (chain rejects — inflation path). */
  DUPLICATE_OTHER_ID: 'morphism-duplicate-other-id',
  /** `otherAssetIds` includes the source `assetId` (self-composition — chain rejects). */
  SELF_COMPOSE: 'morphism-self-compose',
  /** `otherAssetIds` is non-empty but `kind` ignores it (not Compose/Pool — likely a mistake). */
  OTHER_IDS_IGNORED: 'morphism-other-ids-ignored',
  /** Compose/Pool with counter-parties and no consent `nonce` (rejected IF any part is not signer-owned). */
  COMPOSE_NO_NONCE: 'morphism-compose-no-nonce',
} as const;

/** The morphism kinds whose semantics READ `otherAssetIds` (fold counter-party parts into a composite). */
const COMPOSING_KINDS: ReadonlySet<ApplyMorphism['kind']> = new Set(['COMPOSE', 'POOL']);

function finding(severity: LintSeverity, code: string, message: string, path: string): LintViolation {
  return { severity, code, message, path };
}

/**
 * Lint a single {@link ApplyMorphism} message. Pure and non-throwing. Returns every finding
 * (`error` + `warn`); callers decide the policy (e.g. block on any `error`, surface `warn`s).
 *
 * ERRORS (statically certain — the chain rejects unconditionally, holder-independent):
 *   - {@link MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID} — `otherAssetIds` contains a duplicate id.
 *   - {@link MORPHISM_LINT_CODES.SELF_COMPOSE} — `otherAssetIds` includes the source `assetId`.
 *   - {@link MORPHISM_LINT_CODES.OTHER_IDS_IGNORED} — `otherAssetIds` is non-empty but `kind` is not
 *     `COMPOSE`/`POOL` (the field is ignored for other kinds — a likely authoring mistake).
 *
 * WARNINGS (heuristic — holder/ownership unknown at build time):
 *   - {@link MORPHISM_LINT_CODES.COMPOSE_NO_NONCE} — a `COMPOSE`/`POOL` with a non-empty
 *     `otherAssetIds` and NO `nonce`. IF any counter-party is not signer-owned the chain rejects it
 *     (C2); attach the reveal half of an {@link AuthorizeCompose} handshake as `nonce`. A same-holder
 *     compose (all parts signer-owned) is legitimately nonce-less — hence a warning, not an error.
 */
export function lintApplyMorphism(msg: ApplyMorphism): LintViolation[] {
  const out: LintViolation[] = [];
  const ids = msg.otherAssetIds ?? [];
  const isComposing = COMPOSING_KINDS.has(msg.kind);

  // ---- error: duplicate ids in otherAssetIds ---------------------------------
  // One finding per DISTINCT duplicated id (path points at its first repeat occurrence).
  const seen = new Set<string>();
  const dupReported = new Set<string>();
  ids.forEach((id, i) => {
    if (seen.has(id) && !dupReported.has(id)) {
      dupReported.add(id);
      out.push(
        finding(
          'error',
          MORPHISM_LINT_CODES.DUPLICATE_OTHER_ID,
          `otherAssetIds contains duplicate id "${id}". The chain rejects a Compose/Pool whose ` +
            `otherAssetIds has duplicates (the old inflation path). List each counter-party asset once.`,
          `otherAssetIds[${i}]`,
        ),
      );
    }
    seen.add(id);
  });

  // ---- error: otherAssetIds includes the source assetId (self-composition) ----
  const selfIdx = ids.indexOf(msg.assetId);
  if (selfIdx !== -1) {
    out.push(
      finding(
        'error',
        MORPHISM_LINT_CODES.SELF_COMPOSE,
        `otherAssetIds includes the source assetId "${msg.assetId}" (self-composition). The chain ` +
          `rejects this unconditionally. otherAssetIds must list only the OTHER parts folded into the composite.`,
        `otherAssetIds[${selfIdx}]`,
      ),
    );
  }

  // ---- error: otherAssetIds set but kind ignores it ---------------------------
  if (ids.length > 0 && !isComposing) {
    out.push(
      finding(
        'error',
        MORPHISM_LINT_CODES.OTHER_IDS_IGNORED,
        `otherAssetIds is non-empty but kind is "${msg.kind}", which ignores otherAssetIds entirely ` +
          `(only COMPOSE/POOL fold in counter-party parts). This is almost certainly a mistake — set ` +
          `kind to COMPOSE/POOL, or drop otherAssetIds.`,
        'otherAssetIds',
      ),
    );
  }

  // ---- warn: composing with counter-parties but no consent nonce --------------
  // nonce === 0 is a valid live nonce; only an OMITTED nonce (undefined/null) triggers the warning.
  if (isComposing && ids.length > 0 && msg.nonce == null) {
    out.push(
      finding(
        'warn',
        MORPHISM_LINT_CODES.COMPOSE_NO_NONCE,
        `${msg.kind} folds in otherAssetIds but carries no consent nonce. If ANY counter-party asset ` +
          `is not held by the signer, the chain REJECTS this (C2): attach the reveal half of an ` +
          `AuthorizeCompose handshake as \`nonce\`. A same-holder compose (all parts signer-owned) ` +
          `needs none, so this is advisory.`,
        'nonce',
      ),
    );
  }

  return out;
}
