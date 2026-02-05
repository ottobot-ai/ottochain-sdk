/**
 * Ottochain SDK
 *
 * Unified SDK combining metakit framework operations with ottochain domain types.
 *
 * Structure:
 * - `metakit` — Signing, encoding, hashing, and network clients for Constellation metagraphs
 * - `generated` — Protobuf-generated types (source of truth)
 * - `apps/identity` — Agent Identity application types
 * - `apps/contracts` — Contract application types
 *
 * @packageDocumentation
 */
export * from './metakit/index.js';
export * from './generated/index.js';
