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
// ---------------------------------------------------------------------------
// State Machine Imports
// ---------------------------------------------------------------------------
import CorporateEntityDefinition from './state-machines/corporate-entity.json';
import CorporateBoardDefinition from './state-machines/corporate-board.json';
import CorporateShareholdersDefinition from './state-machines/corporate-shareholders.json';
import CorporateOfficersDefinition from './state-machines/corporate-officers.json';
import CorporateBylawsDefinition from './state-machines/corporate-bylaws.json';
import CorporateCommitteeDefinition from './state-machines/corporate-committee.json';
import CorporateResolutionDefinition from './state-machines/corporate-resolution.json';
import CorporateProxyDefinition from './state-machines/corporate-proxy.json';
import CorporateSecuritiesDefinition from './state-machines/corporate-securities.json';
import CorporateComplianceDefinition from './state-machines/corporate-compliance.json';
/**
 * Corporate governance state machine definitions.
 */
export const CORPORATE_DEFINITIONS = {
    Entity: CorporateEntityDefinition,
    Board: CorporateBoardDefinition,
    Shareholders: CorporateShareholdersDefinition,
    Officers: CorporateOfficersDefinition,
    Bylaws: CorporateBylawsDefinition,
    Committee: CorporateCommitteeDefinition,
    Resolution: CorporateResolutionDefinition,
    Proxy: CorporateProxyDefinition,
    Securities: CorporateSecuritiesDefinition,
    Compliance: CorporateComplianceDefinition,
};
