"use strict";
/**
 * Agent Identity Application
 *
 * Types and utilities for the Agent Identity system on OttoChain.
 *
 * @example
 * ```typescript
 * import { AgentState, AttestationType, AgentIdentitySchema } from '@ottochain/sdk/apps/identity';
 * import { create } from '@bufbuild/protobuf';
 *
 * const agent = create(AgentIdentitySchema, {
 *   publicKey: '...',
 *   reputation: 10,
 *   state: AgentState.REGISTERED,
 * });
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
// Re-export generated protobuf types
__exportStar(require("../../generated/ottochain/apps/identity/v1/agent_pb.js"), exports);
__exportStar(require("../../generated/ottochain/apps/identity/v1/attestation_pb.js"), exports);
// Re-export convenience types and constants
__exportStar(require("./types.js"), exports);
