"use strict";
/**
 * Corporate Governance type definitions
 *
 * TypeScript interfaces for corporate governance state machines covering
 * entity lifecycle, board management, shareholder meetings, officers,
 * bylaws, committees, resolutions, proxy voting, securities, and compliance.
 *
 * @see corporate/*.json for JSON state machine definitions
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORPORATE_DEFINITIONS = void 0;
// ---------------------------------------------------------------------------
// State Machine Imports
// ---------------------------------------------------------------------------
const corporate_entity_json_1 = __importDefault(require("./corporate/corporate-entity.json"));
const corporate_board_json_1 = __importDefault(require("./corporate/corporate-board.json"));
const corporate_shareholders_json_1 = __importDefault(require("./corporate/corporate-shareholders.json"));
const corporate_officers_json_1 = __importDefault(require("./corporate/corporate-officers.json"));
const corporate_bylaws_json_1 = __importDefault(require("./corporate/corporate-bylaws.json"));
const corporate_committee_json_1 = __importDefault(require("./corporate/corporate-committee.json"));
const corporate_resolution_json_1 = __importDefault(require("./corporate/corporate-resolution.json"));
const corporate_proxy_json_1 = __importDefault(require("./corporate/corporate-proxy.json"));
const corporate_securities_json_1 = __importDefault(require("./corporate/corporate-securities.json"));
const corporate_compliance_json_1 = __importDefault(require("./corporate/corporate-compliance.json"));
/**
 * Corporate governance state machine definitions.
 */
exports.CORPORATE_DEFINITIONS = {
    Entity: corporate_entity_json_1.default,
    Board: corporate_board_json_1.default,
    Shareholders: corporate_shareholders_json_1.default,
    Officers: corporate_officers_json_1.default,
    Bylaws: corporate_bylaws_json_1.default,
    Committee: corporate_committee_json_1.default,
    Resolution: corporate_resolution_json_1.default,
    Proxy: corporate_proxy_json_1.default,
    Securities: corporate_securities_json_1.default,
    Compliance: corporate_compliance_json_1.default,
};
