"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Core producer-validator framework
__exportStar(require("./producer-validator.js"), exports);
// Validation workflow primitives
__exportStar(require("./workflows.js"), exports);
// DFA State Machine + JSON Logic Integration
__exportStar(require("./state-machines.js"), exports);
// 16-Type Token Behavior Matrix
__exportStar(require("./token-types.js"), exports);
// Integration patterns  
__exportStar(require("./integration.js"), exports);
