/**
 * Privacy Application — note-layer privacy primitives.
 *
 * Σ-protocol / ZK-backed fibers that carry real privacy on the OttoChain note
 * layer. The flagship is `sigma-mixer`, a CDS OR-of-`dhtuple` ring mixer whose
 * anonymity comes from a `sigma_verify` ring proof and whose double-spend safety
 * comes from a witness-bound nullifier (`Nf = x_j·H`, `H` a NUMS base of unknown
 * dlog w.r.t. `G`).
 *
 * The std-lib UTXO primitive is `shielded-note-pool` ({@link notePoolDef}): a
 * fixed-denomination Tornado-style private asset pool over the `zk-shielded`
 * Groth16 circuit. ⚠ UNAUDITED / TEST-ASSETS-ONLY (BN254 ~100-bit, single trusted
 * relayer for root advancement) — see note-pool.ts.
 *
 * @example
 * ```typescript
 * import { getPrivacyDefinition, PRIVACY_DEFINITIONS, sigmaDdhRingOf, notePoolDef } from '@ottochain/sdk/apps/privacy';
 *
 * const mixerDef = getPrivacyDefinition('sigma-mixer');
 * // Build a custom n-member OR-of-dhtuple proposition for an audited H:
 * const prop = sigmaDdhRingOf('state.points', 'event.nullifier', G_HEX, H_HEX, 8);
 * // Instantiate a shielded note-pool (pin the circuit vkey + denomination + relayer):
 * const pool = notePoolDef({ vkey, depth: 8, denom: 100, poolPolicyRef, feeAsset, relayer });
 * ```
 *
 * @packageDocumentation
 */

import {
  mixerDdhRingDef,
  sigmaDdhRingOf,
  notePoolDef,
  NOTE_POOL_STATE,
  PV_LAYOUT,
  ZERO_WORD,
  pvField,
  pmtMembership,
  type NotePoolOptions,
  type ShieldedSpendPayload,
  type TransferPayload,
  type UnshieldPayload,
  type NoteMintedPayload,
} from './state-machines/index.js';
import type { FiberAppDefinition } from '../../schema/fiber-app.js';

export {
  mixerDdhRingDef,
  sigmaDdhRingOf,
  notePoolDef,
  NOTE_POOL_STATE,
  PV_LAYOUT,
  ZERO_WORD,
  pvField,
  pmtMembership,
  type NotePoolOptions,
  type ShieldedSpendPayload,
  type TransferPayload,
  type UnshieldPayload,
  type NoteMintedPayload,
};

/**
 * A documented DEFAULT shielded-note-pool instance for the registry/lint surface, with PLACEHOLDER
 * pin values (the real vkey comes from the SP1 `zk-shielded` toolchain; relayer/policy are
 * deployment-specific). Downstream callers should build their own via {@link notePoolDef}; this
 * instance exists so the privacy app group exposes a concrete `shielded-note-pool` definition.
 * ⚠ UNAUDITED / TEST-ASSETS-ONLY.
 */
export const shieldedNotePoolDef = notePoolDef({
  vkey: ZERO_WORD,
  depth: 8,
  denom: 100,
  poolPolicyRef: 'std.privacy.note-pool',
  feeAsset: ZERO_WORD,
  relayer: 'DAG0000000000000000000000000000000000000000',
});

/** All privacy (note-layer) state machine definitions. */
export const PRIVACY_DEFINITIONS = {
  'sigma-mixer': mixerDdhRingDef,
  'shielded-note-pool': shieldedNotePoolDef,
} as const;

export type PrivacyDefType = keyof typeof PRIVACY_DEFINITIONS;

/**
 * Get a privacy state machine definition by type.
 * @param type - 'sigma-mixer' (default) | 'shielded-note-pool'.
 */
export function getPrivacyDefinition(type: PrivacyDefType = 'sigma-mixer'): FiberAppDefinition {
  return PRIVACY_DEFINITIONS[type];
}
