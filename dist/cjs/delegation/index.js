"use strict";
/**
 * @fileoverview OttoChain SDK Delegation Management
 *
 * High-level API for creating, signing, and managing delegations on OttoChain.
 * Supports both session key and signed intent delegation approaches.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitRelayedTransaction = exports.RevokeDelegation = exports.SubmitSignedIntent = exports.RegisterSessionKey = exports.CreateDelegation = exports.FeePaymentMethod = exports.DelegationApproach = exports.RelayedTransaction = exports.DelegationRevocation = exports.SignedIntent = exports.SessionKey = exports.DelegationScope = exports.DelegationAuthority = exports.RelayerClient = exports.DelegationBuilder = exports.DelegationManager = void 0;
var delegation_manager_js_1 = require("./delegation-manager.js");
Object.defineProperty(exports, "DelegationManager", { enumerable: true, get: function () { return delegation_manager_js_1.DelegationManager; } });
var delegation_builder_js_1 = require("./delegation-builder.js");
Object.defineProperty(exports, "DelegationBuilder", { enumerable: true, get: function () { return delegation_builder_js_1.DelegationBuilder; } });
var relayer_client_js_1 = require("./relayer-client.js");
Object.defineProperty(exports, "RelayerClient", { enumerable: true, get: function () { return relayer_client_js_1.RelayerClient; } });
// Re-export generated protobuf types for convenience
var delegation_js_1 = require("../generated/ottochain/v1/delegation.js");
Object.defineProperty(exports, "DelegationAuthority", { enumerable: true, get: function () { return delegation_js_1.DelegationAuthority; } });
Object.defineProperty(exports, "DelegationScope", { enumerable: true, get: function () { return delegation_js_1.DelegationScope; } });
Object.defineProperty(exports, "SessionKey", { enumerable: true, get: function () { return delegation_js_1.SessionKey; } });
Object.defineProperty(exports, "SignedIntent", { enumerable: true, get: function () { return delegation_js_1.SignedIntent; } });
Object.defineProperty(exports, "DelegationRevocation", { enumerable: true, get: function () { return delegation_js_1.DelegationRevocation; } });
Object.defineProperty(exports, "RelayedTransaction", { enumerable: true, get: function () { return delegation_js_1.RelayedTransaction; } });
Object.defineProperty(exports, "DelegationApproach", { enumerable: true, get: function () { return delegation_js_1.DelegationApproach; } });
Object.defineProperty(exports, "FeePaymentMethod", { enumerable: true, get: function () { return delegation_js_1.FeePaymentMethod; } });
Object.defineProperty(exports, "CreateDelegation", { enumerable: true, get: function () { return delegation_js_1.CreateDelegation; } });
Object.defineProperty(exports, "RegisterSessionKey", { enumerable: true, get: function () { return delegation_js_1.RegisterSessionKey; } });
Object.defineProperty(exports, "SubmitSignedIntent", { enumerable: true, get: function () { return delegation_js_1.SubmitSignedIntent; } });
Object.defineProperty(exports, "RevokeDelegation", { enumerable: true, get: function () { return delegation_js_1.RevokeDelegation; } });
Object.defineProperty(exports, "SubmitRelayedTransaction", { enumerable: true, get: function () { return delegation_js_1.SubmitRelayedTransaction; } });
