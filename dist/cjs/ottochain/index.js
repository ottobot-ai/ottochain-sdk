"use strict";
/**
 * Ottochain SDK
 *
 * Domain-specific types and clients for the ottochain metagraph.
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetagraphClient = exports.extractOnChainState = exports.getOracleInvocations = exports.getEventReceipts = exports.getLogsForFiber = exports.getLatestOnChainState = exports.getSnapshotOnChainState = exports.decodeOnChainState = exports.proto = void 0;
// Re-export generated protobuf types
exports.proto = __importStar(require("../generated/index.js"));
var snapshot_js_1 = require("./snapshot.js");
Object.defineProperty(exports, "decodeOnChainState", { enumerable: true, get: function () { return snapshot_js_1.decodeOnChainState; } });
Object.defineProperty(exports, "getSnapshotOnChainState", { enumerable: true, get: function () { return snapshot_js_1.getSnapshotOnChainState; } });
Object.defineProperty(exports, "getLatestOnChainState", { enumerable: true, get: function () { return snapshot_js_1.getLatestOnChainState; } });
Object.defineProperty(exports, "getLogsForFiber", { enumerable: true, get: function () { return snapshot_js_1.getLogsForFiber; } });
Object.defineProperty(exports, "getEventReceipts", { enumerable: true, get: function () { return snapshot_js_1.getEventReceipts; } });
Object.defineProperty(exports, "getOracleInvocations", { enumerable: true, get: function () { return snapshot_js_1.getOracleInvocations; } });
Object.defineProperty(exports, "extractOnChainState", { enumerable: true, get: function () { return snapshot_js_1.extractOnChainState; } });
var metagraph_client_js_1 = require("./metagraph-client.js");
Object.defineProperty(exports, "MetagraphClient", { enumerable: true, get: function () { return metagraph_client_js_1.MetagraphClient; } });
