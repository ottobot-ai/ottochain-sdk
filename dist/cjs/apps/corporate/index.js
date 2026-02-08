"use strict";
/**
 * Corporate Governance Application
 *
 * Types and utilities for corporate entity management on OttoChain.
 *
 * @example
 * ```typescript
 * import {
 *   EntityType,
 *   EntityState,
 *   CorporateEntity,
 *   getCorporateDefinition
 * } from '@ottochain/sdk/apps/corporate';
 *
 * const entityDef = getCorporateDefinition('Entity');
 * const boardDef = getCorporateDefinition('Board');
 * ```
 *
 * @packageDocumentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorporateDefinition = exports.CORPORATE_DEFINITIONS = exports.resolutionStatusToJSON = exports.resolutionStatusFromJSON = exports.boardMeetingTypeToJSON = exports.boardMeetingTypeFromJSON = exports.officerStatusToJSON = exports.officerStatusFromJSON = exports.directorStatusToJSON = exports.directorStatusFromJSON = exports.entityStateToJSON = exports.entityStateFromJSON = exports.entityTypeToJSON = exports.entityTypeFromJSON = exports.ProposeResolutionRequest = exports.IssueSharesRequest = exports.AppointDirectorRequest = exports.CreateEntityRequest = exports.ComplianceRequirement = exports.FilingRecord = exports.CorporateCompliance = exports.SecurityTransfer = exports.SecurityIssuance = exports.CorporateSecurities = exports.ResolutionVote = exports.CorporateResolution = exports.ShareHolding = exports.Shareholder = exports.CorporateShareholders = exports.OfficerAction = exports.Officer = exports.CorporateOfficers = exports.MeetingAttendee = exports.BoardMeeting = exports.QuorumRules = exports.SeatInfo = exports.Director = exports.CorporateBoard = exports.ShareStructure = exports.Incorporator = exports.RegisteredAgent = exports.CorporateEntity = exports.ShareClass = exports.Jurisdiction = exports.ResolutionStatus = exports.BoardMeetingType = exports.OfficerStatus = exports.DirectorStatus = exports.EntityState = exports.EntityType = void 0;
// Re-export generated protobuf types (source of truth)
var corporate_js_1 = require("../../generated/ottochain/apps/corporate/v1/corporate.js");
Object.defineProperty(exports, "EntityType", { enumerable: true, get: function () { return corporate_js_1.EntityType; } });
Object.defineProperty(exports, "EntityState", { enumerable: true, get: function () { return corporate_js_1.EntityState; } });
Object.defineProperty(exports, "DirectorStatus", { enumerable: true, get: function () { return corporate_js_1.DirectorStatus; } });
Object.defineProperty(exports, "OfficerStatus", { enumerable: true, get: function () { return corporate_js_1.OfficerStatus; } });
Object.defineProperty(exports, "BoardMeetingType", { enumerable: true, get: function () { return corporate_js_1.BoardMeetingType; } });
Object.defineProperty(exports, "ResolutionStatus", { enumerable: true, get: function () { return corporate_js_1.ResolutionStatus; } });
Object.defineProperty(exports, "Jurisdiction", { enumerable: true, get: function () { return corporate_js_1.Jurisdiction; } });
Object.defineProperty(exports, "ShareClass", { enumerable: true, get: function () { return corporate_js_1.ShareClass; } });
Object.defineProperty(exports, "CorporateEntity", { enumerable: true, get: function () { return corporate_js_1.CorporateEntity; } });
Object.defineProperty(exports, "RegisteredAgent", { enumerable: true, get: function () { return corporate_js_1.RegisteredAgent; } });
Object.defineProperty(exports, "Incorporator", { enumerable: true, get: function () { return corporate_js_1.Incorporator; } });
Object.defineProperty(exports, "ShareStructure", { enumerable: true, get: function () { return corporate_js_1.ShareStructure; } });
Object.defineProperty(exports, "CorporateBoard", { enumerable: true, get: function () { return corporate_js_1.CorporateBoard; } });
Object.defineProperty(exports, "Director", { enumerable: true, get: function () { return corporate_js_1.Director; } });
Object.defineProperty(exports, "SeatInfo", { enumerable: true, get: function () { return corporate_js_1.SeatInfo; } });
Object.defineProperty(exports, "QuorumRules", { enumerable: true, get: function () { return corporate_js_1.QuorumRules; } });
Object.defineProperty(exports, "BoardMeeting", { enumerable: true, get: function () { return corporate_js_1.BoardMeeting; } });
Object.defineProperty(exports, "MeetingAttendee", { enumerable: true, get: function () { return corporate_js_1.MeetingAttendee; } });
Object.defineProperty(exports, "CorporateOfficers", { enumerable: true, get: function () { return corporate_js_1.CorporateOfficers; } });
Object.defineProperty(exports, "Officer", { enumerable: true, get: function () { return corporate_js_1.Officer; } });
Object.defineProperty(exports, "OfficerAction", { enumerable: true, get: function () { return corporate_js_1.OfficerAction; } });
Object.defineProperty(exports, "CorporateShareholders", { enumerable: true, get: function () { return corporate_js_1.CorporateShareholders; } });
Object.defineProperty(exports, "Shareholder", { enumerable: true, get: function () { return corporate_js_1.Shareholder; } });
Object.defineProperty(exports, "ShareHolding", { enumerable: true, get: function () { return corporate_js_1.ShareHolding; } });
Object.defineProperty(exports, "CorporateResolution", { enumerable: true, get: function () { return corporate_js_1.CorporateResolution; } });
Object.defineProperty(exports, "ResolutionVote", { enumerable: true, get: function () { return corporate_js_1.ResolutionVote; } });
Object.defineProperty(exports, "CorporateSecurities", { enumerable: true, get: function () { return corporate_js_1.CorporateSecurities; } });
Object.defineProperty(exports, "SecurityIssuance", { enumerable: true, get: function () { return corporate_js_1.SecurityIssuance; } });
Object.defineProperty(exports, "SecurityTransfer", { enumerable: true, get: function () { return corporate_js_1.SecurityTransfer; } });
Object.defineProperty(exports, "CorporateCompliance", { enumerable: true, get: function () { return corporate_js_1.CorporateCompliance; } });
Object.defineProperty(exports, "FilingRecord", { enumerable: true, get: function () { return corporate_js_1.FilingRecord; } });
Object.defineProperty(exports, "ComplianceRequirement", { enumerable: true, get: function () { return corporate_js_1.ComplianceRequirement; } });
Object.defineProperty(exports, "CreateEntityRequest", { enumerable: true, get: function () { return corporate_js_1.CreateEntityRequest; } });
Object.defineProperty(exports, "AppointDirectorRequest", { enumerable: true, get: function () { return corporate_js_1.AppointDirectorRequest; } });
Object.defineProperty(exports, "IssueSharesRequest", { enumerable: true, get: function () { return corporate_js_1.IssueSharesRequest; } });
Object.defineProperty(exports, "ProposeResolutionRequest", { enumerable: true, get: function () { return corporate_js_1.ProposeResolutionRequest; } });
Object.defineProperty(exports, "entityTypeFromJSON", { enumerable: true, get: function () { return corporate_js_1.entityTypeFromJSON; } });
Object.defineProperty(exports, "entityTypeToJSON", { enumerable: true, get: function () { return corporate_js_1.entityTypeToJSON; } });
Object.defineProperty(exports, "entityStateFromJSON", { enumerable: true, get: function () { return corporate_js_1.entityStateFromJSON; } });
Object.defineProperty(exports, "entityStateToJSON", { enumerable: true, get: function () { return corporate_js_1.entityStateToJSON; } });
Object.defineProperty(exports, "directorStatusFromJSON", { enumerable: true, get: function () { return corporate_js_1.directorStatusFromJSON; } });
Object.defineProperty(exports, "directorStatusToJSON", { enumerable: true, get: function () { return corporate_js_1.directorStatusToJSON; } });
Object.defineProperty(exports, "officerStatusFromJSON", { enumerable: true, get: function () { return corporate_js_1.officerStatusFromJSON; } });
Object.defineProperty(exports, "officerStatusToJSON", { enumerable: true, get: function () { return corporate_js_1.officerStatusToJSON; } });
Object.defineProperty(exports, "boardMeetingTypeFromJSON", { enumerable: true, get: function () { return corporate_js_1.boardMeetingTypeFromJSON; } });
Object.defineProperty(exports, "boardMeetingTypeToJSON", { enumerable: true, get: function () { return corporate_js_1.boardMeetingTypeToJSON; } });
Object.defineProperty(exports, "resolutionStatusFromJSON", { enumerable: true, get: function () { return corporate_js_1.resolutionStatusFromJSON; } });
Object.defineProperty(exports, "resolutionStatusToJSON", { enumerable: true, get: function () { return corporate_js_1.resolutionStatusToJSON; } });
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
 * Get the state machine definition for a corporate type.
 */
function getCorporateDefinition(type) {
    const def = exports.CORPORATE_DEFINITIONS[type];
    if (!def) {
        throw new Error(`Unknown corporate type: ${type}`);
    }
    return def;
}
exports.getCorporateDefinition = getCorporateDefinition;
