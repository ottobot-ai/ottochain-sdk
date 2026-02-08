"use strict";
/**
 * Corporate Governance Application
 *
 * State machines and types for corporate entity management including
 * board governance, shareholder meetings, securities, and compliance.
 *
 * @example
 * ```typescript
 * import { getCorporateDefinition } from '@ottochain/sdk/apps/corporate';
 *
 * // Get state machine definition for corporate entity
 * const entityDef = getCorporateDefinition('Entity');
 * const boardDef = getCorporateDefinition('Board');
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorporateDefinition = exports.CORPORATE_DEFINITIONS = exports.ResolutionStatusProto = exports.BoardMeetingTypeProto = exports.OfficerStatusProto = exports.DirectorStatusProto = exports.EntityStateProto = exports.EntityTypeProto = void 0;
__exportStar(require("./types.js"), exports);
// Proto-generated types (prefixed to avoid conflicts with TS types)
var corporate_pb_js_1 = require("../../generated/ottochain/apps/corporate/v1/corporate_pb.js");
Object.defineProperty(exports, "EntityTypeProto", { enumerable: true, get: function () { return corporate_pb_js_1.EntityType; } });
Object.defineProperty(exports, "EntityStateProto", { enumerable: true, get: function () { return corporate_pb_js_1.EntityState; } });
Object.defineProperty(exports, "DirectorStatusProto", { enumerable: true, get: function () { return corporate_pb_js_1.DirectorStatus; } });
Object.defineProperty(exports, "OfficerStatusProto", { enumerable: true, get: function () { return corporate_pb_js_1.OfficerStatus; } });
Object.defineProperty(exports, "BoardMeetingTypeProto", { enumerable: true, get: function () { return corporate_pb_js_1.BoardMeetingType; } });
Object.defineProperty(exports, "ResolutionStatusProto", { enumerable: true, get: function () { return corporate_pb_js_1.ResolutionStatus; } });
// ---------------------------------------------------------------------------
// State Machine JSON Definitions
// ---------------------------------------------------------------------------
const corporate_entity_json_1 = __importDefault(require("./state-machines/corporate-entity.json"));
const corporate_board_json_1 = __importDefault(require("./state-machines/corporate-board.json"));
const corporate_shareholders_json_1 = __importDefault(require("./state-machines/corporate-shareholders.json"));
const corporate_officers_json_1 = __importDefault(require("./state-machines/corporate-officers.json"));
const corporate_securities_json_1 = __importDefault(require("./state-machines/corporate-securities.json"));
const corporate_compliance_json_1 = __importDefault(require("./state-machines/corporate-compliance.json"));
const corporate_bylaws_json_1 = __importDefault(require("./state-machines/corporate-bylaws.json"));
const corporate_committee_json_1 = __importDefault(require("./state-machines/corporate-committee.json"));
const corporate_proxy_json_1 = __importDefault(require("./state-machines/corporate-proxy.json"));
const corporate_resolution_json_1 = __importDefault(require("./state-machines/corporate-resolution.json"));
/**
 * Corporate state machine definitions mapped by type.
 */
exports.CORPORATE_DEFINITIONS = {
    Entity: corporate_entity_json_1.default,
    Board: corporate_board_json_1.default,
    Shareholders: corporate_shareholders_json_1.default,
    Officers: corporate_officers_json_1.default,
    Securities: corporate_securities_json_1.default,
    Compliance: corporate_compliance_json_1.default,
    Bylaws: corporate_bylaws_json_1.default,
    Committee: corporate_committee_json_1.default,
    Proxy: corporate_proxy_json_1.default,
    Resolution: corporate_resolution_json_1.default,
};
/**
 * Get the state machine definition for a corporate governance type.
 *
 * @param type - Corporate type (Entity, Board, Shareholders, etc.)
 * @returns The state machine definition JSON
 */
function getCorporateDefinition(type) {
    const def = exports.CORPORATE_DEFINITIONS[type];
    if (!def) {
        throw new Error(`Unknown corporate type: ${type}`);
    }
    return def;
}
exports.getCorporateDefinition = getCorporateDefinition;
