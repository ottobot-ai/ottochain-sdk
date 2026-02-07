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
import CorporateEntityDefinition from './corporate/corporate-entity.json';
import CorporateBoardDefinition from './corporate/corporate-board.json';
import CorporateShareholdersDefinition from './corporate/corporate-shareholders.json';
import CorporateOfficersDefinition from './corporate/corporate-officers.json';
import CorporateBylawsDefinition from './corporate/corporate-bylaws.json';
import CorporateCommitteeDefinition from './corporate/corporate-committee.json';
import CorporateResolutionDefinition from './corporate/corporate-resolution.json';
import CorporateProxyDefinition from './corporate/corporate-proxy.json';
import CorporateSecuritiesDefinition from './corporate/corporate-securities.json';
import CorporateComplianceDefinition from './corporate/corporate-compliance.json';
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
