/**
 * Asset Model Framework for OttoChain
 * 
 * This module provides the foundational producer-validator separation framework
 * for building secure, decentralized asset management systems on OttoChain.
 * 
 * ## Architecture
 * 
 * The framework implements clean separation between:
 * - **Producers**: Create and maintain data, but cannot unilaterally validate
 * - **Validators**: Govern and validate state transitions with authority
 * 
 * This eliminates double-signing risks by ensuring no single entity can both
 * produce data AND validate its own transactions.
 * 
 * ## Core Components
 * 
 * 1. **Producer-Validator Framework**: Role definitions and relationships
 * 2. **Validation Workflows**: Request/response patterns for governance
 * 3. **Multi-Party Coordination**: Complex multi-participant scenarios
 * 4. **Integration Patterns**: OttoChain fiber system integration
 * 
 * @example Basic Producer Registration
 * ```typescript
 * import { 
 *   ProducerRegistrationRequest, 
 *   RelationshipType 
 * } from '@ottochain/sdk/types/asset-model';
 * 
 * const registrationRequest: ProducerRegistrationRequest = {
 *   producerId: 'producer-001',
 *   address: '0x123...',
 *   capabilities: ['asset_creation', 'asset_modification'],
 *   bondAmount: 100,
 *   termsHash: 'hash-of-terms',
 *   signature: 'signature'
 * };
 * ```
 * 
 * @example Validation Workflow
 * ```typescript
 * import { 
 *   ValidationRequest, 
 *   ValidationDecision 
 * } from '@ottochain/sdk/types/asset-model';
 * 
 * // Producer requests validation
 * const request: ValidationRequest = {
 *   id: 'req-001',
 *   producerId: 'producer-001',
 *   validatorIds: ['validator-001'],
 *   assetId: 'asset-123',
 *   validationType: 'asset_transfer',
 *   payload: transferData,
 *   requestedAt: new Date().toISOString(),
 *   expiresAt: expiryTime,
 *   signature: 'producer-signature'
 * };
 * 
 * // Validator responds
 * const response: ValidationResponse = {
 *   requestId: 'req-001',
 *   validatorId: 'validator-001',
 *   decision: ValidationDecision.APPROVED,
 *   reason: 'Transfer meets all requirements',
 *   rulesApplied: ['transfer_limit', 'reputation_check'],
 *   respondedAt: new Date().toISOString(),
 *   signature: 'validator-signature'
 * };
 * ```
 * 
 * @packageDocumentation
 */

// Core producer-validator framework
export * from './producer-validator.js';

// Validation workflow primitives
export * from './workflows.js';

// Integration patterns  
export * from './integration.js';