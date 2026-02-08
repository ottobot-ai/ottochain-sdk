"use strict";
/**
 * Generated Protobuf Types
 *
 * Auto-generated from proto/ definitions.
 * DO NOT EDIT - regenerate with `npm run generate`
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
exports.ResolutionStatus = exports.BoardMeetingType = exports.OfficerStatus = exports.DirectorStatus = exports.EntityState = exports.EntityType = exports.VoteChoice = exports.ProposalStatus = exports.DAOStatus = exports.DAOType = void 0;
// Core types
__exportStar(require("./ottochain/v1/common_pb.js"), exports);
__exportStar(require("./ottochain/v1/fiber_pb.js"), exports);
__exportStar(require("./ottochain/v1/messages_pb.js"), exports);
__exportStar(require("./ottochain/v1/records_pb.js"), exports);
// App: Identity
__exportStar(require("./ottochain/apps/identity/v1/agent_pb.js"), exports);
__exportStar(require("./ottochain/apps/identity/v1/attestation_pb.js"), exports);
// App: Contracts
__exportStar(require("./ottochain/apps/contracts/v1/contract_pb.js"), exports);
// App: Markets
__exportStar(require("./ottochain/apps/markets/v1/market_pb.js"), exports);
// App: Oracles
__exportStar(require("./ottochain/apps/oracles/v1/oracle_pb.js"), exports);
// App: Governance (selective export to avoid conflicts)
var governance_pb_js_1 = require("./ottochain/apps/governance/v1/governance_pb.js");
Object.defineProperty(exports, "DAOType", { enumerable: true, get: function () { return governance_pb_js_1.DAOType; } });
Object.defineProperty(exports, "DAOStatus", { enumerable: true, get: function () { return governance_pb_js_1.DAOStatus; } });
Object.defineProperty(exports, "ProposalStatus", { enumerable: true, get: function () { return governance_pb_js_1.ProposalStatus; } });
Object.defineProperty(exports, "VoteChoice", { enumerable: true, get: function () { return governance_pb_js_1.VoteChoice; } });
// App: Corporate (selective export to avoid conflicts with Address)
var corporate_pb_js_1 = require("./ottochain/apps/corporate/v1/corporate_pb.js");
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return corporate_pb_js_1.EntityType; } });
Object.defineProperty(exports, "EntityState", { enumerable: true, get: function () { return corporate_pb_js_1.EntityState; } });
Object.defineProperty(exports, "DirectorStatus", { enumerable: true, get: function () { return corporate_pb_js_1.DirectorStatus; } });
Object.defineProperty(exports, "OfficerStatus", { enumerable: true, get: function () { return corporate_pb_js_1.OfficerStatus; } });
Object.defineProperty(exports, "BoardMeetingType", { enumerable: true, get: function () { return corporate_pb_js_1.BoardMeetingType; } });
Object.defineProperty(exports, "ResolutionStatus", { enumerable: true, get: function () { return corporate_pb_js_1.ResolutionStatus; } });
