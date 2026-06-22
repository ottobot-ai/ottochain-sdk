/**
 * Privacy Application — note-layer privacy primitives.
 *
 * Σ-protocol / ZK-backed fibers that carry real privacy on the OttoChain note
 * layer. The flagship is `sigma-mixer`, a CDS OR-of-`dhtuple` ring mixer whose
 * anonymity comes from a `sigma_verify` ring proof and whose double-spend safety
 * comes from a witness-bound nullifier (`Nf = x_j·H`, `H` a NUMS base of unknown
 * dlog w.r.t. `G`).
 *
 * @example
 * ```typescript
 * import { getPrivacyDefinition, PRIVACY_DEFINITIONS, sigmaDdhRingOf } from '@ottochain/sdk/apps/privacy';
 *
 * const mixerDef = getPrivacyDefinition('sigma-mixer');
 * // Build a custom n-member OR-of-dhtuple proposition for an audited H:
 * const prop = sigmaDdhRingOf('state.points', 'event.nullifier', G_HEX, H_HEX, 8);
 * ```
 *
 * @packageDocumentation
 */

import { mixerDdhRingDef, sigmaDdhRingOf } from "./state-machines/index.js";
import type { FiberAppDefinition } from "../../schema/fiber-app.js";

export { mixerDdhRingDef, sigmaDdhRingOf };

/** All privacy (note-layer) state machine definitions. */
export const PRIVACY_DEFINITIONS = {
  "sigma-mixer": mixerDdhRingDef,
} as const;

export type PrivacyDefType = keyof typeof PRIVACY_DEFINITIONS;

/**
 * Get a privacy state machine definition by type.
 * @param type - 'sigma-mixer' (default).
 */
export function getPrivacyDefinition(
  type: PrivacyDefType = "sigma-mixer",
): FiberAppDefinition {
  return PRIVACY_DEFINITIONS[type];
}
