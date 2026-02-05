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
// Metakit utilities (signing, hashing, HTTP client)
export * from './metakit/index.js';
// Generated protobuf types (canonical definitions)
export * from './generated/index.js';
