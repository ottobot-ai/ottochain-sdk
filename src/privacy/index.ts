/**
 * Privacy: shield any fiber app into a zk-jlvm-shielded private-state pool.
 * See docs/design/zk-private-contract-state-rfc.md.
 */
export { shieldApp, SHIELDED_POOL_STATE, type ShieldOptions } from './shield-app.js';
export { sealedBidAccountDef, shieldedSealedBidDef, vickreyAuctionDef } from './sealed-bid.js';
