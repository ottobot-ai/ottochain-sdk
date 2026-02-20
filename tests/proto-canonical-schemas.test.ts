/**
 * TDD Tests for Proto Canonical Schema Definitions
 * 
 * These tests define the expected behavior for canonical proto schema definitions
 * for OttoChain models, specifically focusing on delegation credentials and 
 * calculated state extensions as specified by @think.
 * 
 * Card: 📐 Proto: Define canonical proto schemas for all OttoChain models (#699621e02b30219827052ee1)
 * Epic: Proto-first model unification
 * Context: DelegationCredential proto (11 fields, ordinal-based), CalculatedState.delegations field 3 added
 * 
 * @group tdd
 * @group proto-schema
 * @group delegation
 */

import { describe, it, expect, beforeEach } from '@jest/testing-library/jest-dom';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Import current proto-generated types
import { CalculatedState, StateMachineFiberRecord, ScriptFiberRecord } from '../src/generated/ottochain/v1/records';
import { Delegation, DelegationStatus, DelegationScope, SessionKey } from '../src/generated/ottochain/apps/delegation/v1/delegation';

// Types that should be implemented based on the specification
interface DelegationCredential {
  delegationId: string;
  delegatorAddress: string;
  delegateAddress: string;
  sessionKeyId: string;
  createdAtOrdinal: number;        // Ordinal-based (not Timestamp)
  expiresAtOrdinal: number;        // Ordinal-based (not Timestamp)  
  spendUsed: string;              // Missing from current API Delegation
  stakeBonded: string;            // Missing from current API Delegation
  spendLimit: string;             // Missing from current API Delegation
  isRevoked: boolean;             // Missing from current API Delegation
  scope: DelegationScope;         // Reuses existing scope definition
}

interface ExtendedCalculatedState {
  stateMachines: { [key: string]: StateMachineFiberRecord };
  scripts: { [key: string]: ScriptFiberRecord };
  delegations: { [key: string]: DelegationCredential }; // Field 3 - Missing from current proto
}

interface ProtoFieldAnalysis {
  fieldNumber: number;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  description?: string;
}

interface ProtoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldCount: number;
  reservedRanges?: Array<{start: number, end: number}>;
}

describe('Proto Canonical Schemas: Current State Analysis', () => {
  
  describe('Existing Proto Files Structure', () => {
    it('should have delegation.proto with API-layer Delegation message', () => {
      // ARRANGE: Expected proto file path
      const protoPath = join(process.cwd(), 'proto/ottochain/apps/delegation/v1/delegation.proto');
      
      // ACT & ASSERT: File exists
      expect(existsSync(protoPath)).toBe(true);
      
      const content = readFileSync(protoPath, 'utf8');
      
      // ASSERT: Contains API-layer Delegation with Timestamps (not ordinals)
      expect(content).toContain('message Delegation');
      expect(content).toContain('google.protobuf.Timestamp created_at');
      expect(content).toContain('google.protobuf.Timestamp expires_at');
      expect(content).toContain('string delegation_id = 1');
      expect(content).toContain('string delegator_address = 2');
      expect(content).toContain('string delegate_address = 3');
    });

    it('should have records.proto with CalculatedState missing delegations field', () => {
      // ARRANGE: Expected proto file path
      const protoPath = join(process.cwd(), 'proto/ottochain/v1/records.proto');
      
      // ACT & ASSERT: File exists and structure
      expect(existsSync(protoPath)).toBe(true);
      
      const content = readFileSync(protoPath, 'utf8');
      
      // ASSERT: CalculatedState exists but only has state_machines and scripts
      expect(content).toContain('message CalculatedState');
      expect(content).toContain('map<string, StateMachineFiberRecord> state_machines = 1');
      expect(content).toContain('map<string, ScriptFiberRecord> scripts = 2');
      
      // ASSERT: Missing delegations field 3
      expect(content).not.toContain('delegations = 3');
      expect(content).not.toContain('DelegationCredential');
    });

    it('should generate TypeScript types from current proto definitions', () => {
      // ARRANGE: Current generated types
      const currentCalcState: CalculatedState = {
        stateMachines: {},
        scripts: {}
      };
      
      // ACT & ASSERT: Current structure validation
      expect(currentCalcState).toHaveProperty('stateMachines');
      expect(currentCalcState).toHaveProperty('scripts');
      
      // ASSERT: Missing delegations property
      expect(currentCalcState).not.toHaveProperty('delegations');
      
      // ASSERT: API Delegation uses Timestamps
      const apiDelegation: Partial<Delegation> = {
        delegationId: 'test123',
        delegatorAddress: 'DAG123...',
        delegateAddress: 'DAG456...'
      };
      expect(typeof apiDelegation.delegationId).toBe('string');
    });
  });

  describe('Proto Field Analysis and Validation', () => {
    it('should analyze existing Delegation message field structure', () => {
      // ARRANGE: Current API Delegation fields (from proto inspection)
      const expectedFields: ProtoFieldAnalysis[] = [
        { fieldNumber: 1, fieldName: 'delegation_id', fieldType: 'string', isRequired: true },
        { fieldNumber: 2, fieldName: 'delegator_address', fieldType: 'string', isRequired: true },
        { fieldNumber: 3, fieldName: 'delegate_address', fieldType: 'string', isRequired: true },
        { fieldNumber: 4, fieldName: 'session_key', fieldType: 'SessionKey', isRequired: false },
        { fieldNumber: 5, fieldName: 'scope', fieldType: 'DelegationScope', isRequired: false },
        { fieldNumber: 6, fieldName: 'created_at', fieldType: 'google.protobuf.Timestamp', isRequired: false },
        { fieldNumber: 7, fieldName: 'expires_at', fieldType: 'google.protobuf.Timestamp', isRequired: false },
        { fieldNumber: 8, fieldName: 'status', fieldType: 'DelegationStatus', isRequired: false },
        { fieldNumber: 9, fieldName: 'nonce', fieldType: 'uint64', isRequired: false },
        { fieldNumber: 10, fieldName: 'user_signature', fieldType: 'string', isRequired: false }
      ];
      
      // ACT: Analyze proto structure
      const analysis = analyzeProtoMessageFields('ottochain.apps.delegation.v1.Delegation');
      
      // ASSERT: Field structure matches expectation
      expect(analysis.fieldCount).toBe(expectedFields.length);
      expect(analysis.isValid).toBe(true);
      
      for (const expectedField of expectedFields) {
        const foundField = analysis.fields?.find(f => f.fieldNumber === expectedField.fieldNumber);
        expect(foundField).toBeDefined();
        expect(foundField?.fieldName).toBe(expectedField.fieldName);
        expect(foundField?.fieldType).toBe(expectedField.fieldType);
      }
    });

    it('should validate proper field numbering ranges', () => {
      // ARRANGE: Proto field numbering rules
      const coreFieldRange = { start: 1, end: 15 };     // Core fields: 1-15
      const extensionRange = { start: 16, end: 99 };    // Extensions: 16-99
      const reservedRange = { start: 19000, end: 19999 }; // Google reserved
      
      // ACT: Validate field numbering
      const validation = validateProtoFieldNumbering('ottochain.apps.delegation.v1.Delegation');
      
      // ASSERT: All fields use proper numbering
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      // ASSERT: No fields in reserved ranges
      const hasReservedFields = validation.warnings?.some(w => 
        w.includes('reserved') || w.includes('19000')
      );
      expect(hasReservedFields).toBeFalsy();
    });

    it('should identify missing fields in API vs state layer comparison', () => {
      // ARRANGE: Fields that exist in Scala state layer but not in API proto
      const missingInAPILayer = [
        'spendUsed',     // Tracks actual spend against limits
        'stakeBonded',   // Amount bonded for this delegation  
        'spendLimit',    // Maximum total spending allowed
        'isRevoked',     // Revocation status (boolean vs enum)
        'sessionKey'     // Direct key rather than nested object
      ];
      
      // ACT: Compare API proto vs expected state layer fields
      const comparison = compareAPIvsStateLayerFields();
      
      // ASSERT: Missing fields identified
      expect(comparison.missingInAPI).toEqual(expect.arrayContaining(missingInAPILayer));
      expect(comparison.apiUsesCaseNaming).toBe(true);
      expect(comparison.stateUsesOrdinals).toBe(true);
      expect(comparison.apiUsesTimestamps).toBe(true);
    });
  });
});

describe('Proto Canonical Schemas: Required DelegationCredential Message', () => {
  
  describe('DelegationCredential Proto Definition', () => {
    it('should define DelegationCredential message with 11 ordinal-based fields', () => {
      // ARRANGE: Expected DelegationCredential fields based on spec
      const expectedFields: ProtoFieldAnalysis[] = [
        { fieldNumber: 1, fieldName: 'delegation_id', fieldType: 'string', isRequired: true },
        { fieldNumber: 2, fieldName: 'delegator_address', fieldType: 'string', isRequired: true },
        { fieldNumber: 3, fieldName: 'delegate_address', fieldType: 'string', isRequired: true },
        { fieldNumber: 4, fieldName: 'session_key_id', fieldType: 'string', isRequired: true },
        { fieldNumber: 5, fieldName: 'created_at_ordinal', fieldType: 'int64', isRequired: true },
        { fieldNumber: 6, fieldName: 'expires_at_ordinal', fieldType: 'int64', isRequired: true },
        { fieldNumber: 7, fieldName: 'spend_used', fieldType: 'string', isRequired: false }, // Amount type
        { fieldNumber: 8, fieldName: 'stake_bonded', fieldType: 'string', isRequired: false }, // Amount type
        { fieldNumber: 9, fieldName: 'spend_limit', fieldType: 'string', isRequired: false }, // Amount type
        { fieldNumber: 10, fieldName: 'is_revoked', fieldType: 'bool', isRequired: false },
        { fieldNumber: 11, fieldName: 'scope', fieldType: 'DelegationScope', isRequired: false }
      ];
      
      // ACT: Check if DelegationCredential message exists
      const credentialExists = protoMessageExists('ottochain.v1.DelegationCredential');
      
      // ASSERT: DelegationCredential should exist (will fail until implemented)
      expect(credentialExists).toBe(true);
      
      if (credentialExists) {
        const analysis = analyzeProtoMessageFields('ottochain.v1.DelegationCredential');
        
        // ASSERT: Should have exactly 11 fields
        expect(analysis.fieldCount).toBe(11);
        
        // ASSERT: All expected fields present with correct types
        for (const expectedField of expectedFields) {
          const foundField = analysis.fields?.find(f => f.fieldNumber === expectedField.fieldNumber);
          expect(foundField).toBeDefined();
          expect(foundField?.fieldName).toBe(expectedField.fieldName);
          expect(foundField?.fieldType).toBe(expectedField.fieldType);
        }
        
        // ASSERT: Uses ordinals not timestamps
        const hasOrdinalFields = analysis.fields?.some(f => f.fieldName.includes('_ordinal'));
        const hasTimestampFields = analysis.fields?.some(f => f.fieldType.includes('Timestamp'));
        
        expect(hasOrdinalFields).toBe(true);
        expect(hasTimestampFields).toBe(false);
      }
    });

    it('should place DelegationCredential in correct proto package', () => {
      // ARRANGE: Expected package structure
      const expectedPackage = 'ottochain.v1';
      const expectedProtoFile = 'proto/ottochain/v1/records.proto'; // Core state records
      
      // ACT: Check proto file and package
      const packageLocation = getProtoMessagePackage('DelegationCredential');
      
      // ASSERT: Correct package placement
      expect(packageLocation).toBe(expectedPackage);
      
      // ASSERT: In records.proto (state layer) not delegation.proto (API layer)
      const isInRecordsProto = isMessageInProtoFile('DelegationCredential', expectedProtoFile);
      const isInDelegationProto = isMessageInProtoFile('DelegationCredential', 
        'proto/ottochain/apps/delegation/v1/delegation.proto');
      
      expect(isInRecordsProto).toBe(true);
      expect(isInDelegationProto).toBe(false);
    });

    it('should generate correct TypeScript interface from DelegationCredential proto', () => {
      // ARRANGE: Expected TypeScript interface
      const expectedTSInterface = {
        delegationId: 'string',
        delegatorAddress: 'string', 
        delegateAddress: 'string',
        sessionKeyId: 'string',
        createdAtOrdinal: 'number',
        expiresAtOrdinal: 'number',
        spendUsed: 'string | undefined',
        stakeBonded: 'string | undefined', 
        spendLimit: 'string | undefined',
        isRevoked: 'boolean | undefined',
        scope: 'DelegationScope | undefined'
      };
      
      // ACT: Check generated TypeScript types
      const tsInterfaceExists = tsTypeExists('DelegationCredential');
      expect(tsInterfaceExists).toBe(true);
      
      if (tsInterfaceExists) {
        // ASSERT: Correct TypeScript field types
        const credential: DelegationCredential = {
          delegationId: 'test123',
          delegatorAddress: 'DAG123...',
          delegateAddress: 'DAG456...',
          sessionKeyId: 'session789',
          createdAtOrdinal: 1000000,
          expiresAtOrdinal: 1001000,
          spendUsed: '0',
          stakeBonded: '100000',
          spendLimit: '500000',
          isRevoked: false,
          scope: {
            allowedOperations: ['transfer'],
            allowedContracts: [],
            maxTransactionAmount: '1000',
            maxTotalAmount: '10000',
            minReputationScore: 50
          }
        };
        
        expect(typeof credential.delegationId).toBe('string');
        expect(typeof credential.createdAtOrdinal).toBe('number');
        expect(typeof credential.expiresAtOrdinal).toBe('number');
        expect(typeof credential.isRevoked).toBe('boolean');
      }
    });

    it('should validate DelegationCredential business logic constraints', () => {
      // ARRANGE: Test credential with various constraint scenarios
      const validCredential: DelegationCredential = {
        delegationId: 'valid123',
        delegatorAddress: 'DAG1234567890abcdef1234567890abcdef12345678',
        delegateAddress: 'DAG9876543210fedcba9876543210fedcba87654321',
        sessionKeyId: 'session456',
        createdAtOrdinal: 1000000,
        expiresAtOrdinal: 1001000,
        spendUsed: '0',
        stakeBonded: '50000',
        spendLimit: '100000',
        isRevoked: false,
        scope: {
          allowedOperations: ['transfer', 'vote'],
          allowedContracts: [],
          maxTransactionAmount: '10000',
          maxTotalAmount: '100000',
          minReputationScore: 70
        }
      };
      
      // ACT & ASSERT: Valid credential passes validation
      expect(() => validateDelegationCredential(validCredential)).not.toThrow();
      
      // Test constraint violations
      const invalidCredentials = [
        // Expired delegation
        { ...validCredential, expiresAtOrdinal: 999999 },
        // Spend used > spend limit
        { ...validCredential, spendUsed: '200000', spendLimit: '100000' },
        // Revoked delegation
        { ...validCredential, isRevoked: true },
        // Invalid DAG address format
        { ...validCredential, delegatorAddress: 'invalid_address' },
        // Missing required fields
        { ...validCredential, delegationId: '' }
      ];
      
      for (const invalidCredential of invalidCredentials) {
        expect(() => validateDelegationCredential(invalidCredential)).toThrow();
      }
    });
  });

  describe('State Layer vs API Layer Distinction', () => {
    it('should differentiate API Delegation vs DelegationCredential purposes', () => {
      // ARRANGE: API layer vs State layer comparison
      const apiDelegation = {
        purpose: 'external_interface',
        timestampBased: true,
        humanReadable: true,
        includes: ['user_signature', 'nonce', 'validation_errors'],
        excludes: ['spend_used', 'stake_bonded', 'ordinal_timing']
      };
      
      const stateCredential = {
        purpose: 'internal_state_tracking',
        ordinalBased: true,
        machineOptimized: true,
        includes: ['spend_used', 'stake_bonded', 'ordinal_timing', 'revocation_status'],
        excludes: ['user_signature', 'validation_errors', 'human_readable_timestamps']
      };
      
      // ACT: Analyze layer separation
      const layerAnalysis = analyzeAPIvsStateLayers();
      
      // ASSERT: Clear separation of concerns
      expect(layerAnalysis.apiLayer.timestampBased).toBe(true);
      expect(layerAnalysis.stateLayer.ordinalBased).toBe(true);
      expect(layerAnalysis.hasFieldOverlap).toBe(false); // Minimal overlap by design
      expect(layerAnalysis.conversionMappingExists).toBe(true); // Can convert between them
    });

    it('should support conversion between API and State representations', () => {
      // ARRANGE: API Delegation
      const apiDelegation: Delegation = {
        delegationId: 'test123',
        delegatorAddress: 'DAG123...',
        delegateAddress: 'DAG456...',
        sessionKey: {
          sessionKeyId: 'session789',
          publicKey: 'pubkey123',
          createdAt: { seconds: 1234567890, nanos: 0 },
          expiresAt: { seconds: 1234567890 + 3600, nanos: 0 },
          isActive: true
        },
        scope: {
          allowedOperations: ['transfer'],
          allowedContracts: [],
          maxTransactionAmount: '1000',
          maxTotalAmount: '10000',
          minReputationScore: 50
        },
        createdAt: { seconds: 1234567890, nanos: 0 },
        expiresAt: { seconds: 1234567890 + 3600, nanos: 0 },
        status: DelegationStatus.DELEGATION_STATUS_ACTIVE,
        nonce: 12345,
        userSignature: 'signature123'
      };
      
      // ACT: Convert API to State representation
      const stateCredential = convertAPIToStateCredential(apiDelegation, {
        currentOrdinal: 1000000,
        spendUsed: '250',
        stakeBonded: '10000'
      });
      
      // ASSERT: Proper conversion
      expect(stateCredential.delegationId).toBe(apiDelegation.delegationId);
      expect(stateCredential.delegatorAddress).toBe(apiDelegation.delegatorAddress);
      expect(stateCredential.delegateAddress).toBe(apiDelegation.delegateAddress);
      
      // ASSERT: Timestamp to ordinal conversion  
      expect(typeof stateCredential.createdAtOrdinal).toBe('number');
      expect(typeof stateCredential.expiresAtOrdinal).toBe('number');
      expect(stateCredential.createdAtOrdinal).toBeGreaterThan(0);
      
      // ASSERT: State-specific fields populated
      expect(stateCredential.spendUsed).toBe('250');
      expect(stateCredential.stakeBonded).toBe('10000');
      expect(typeof stateCredential.isRevoked).toBe('boolean');
      
      // Reverse conversion
      const backToAPI = convertStateToAPICredential(stateCredential);
      expect(backToAPI.delegationId).toBe(stateCredential.delegationId);
      expect(backToAPI.createdAt?.seconds).toBeDefined();
    });

    it('should handle ordinal-to-timestamp conversion edge cases', () => {
      // ARRANGE: Various ordinal scenarios
      const testCases = [
        { ordinal: 0, description: 'genesis ordinal' },
        { ordinal: 1, description: 'first ordinal' },
        { ordinal: 1000000, description: 'typical ordinal' },
        { ordinal: Number.MAX_SAFE_INTEGER, description: 'maximum safe ordinal' }
      ];
      
      for (const testCase of testCases) {
        // ACT: Convert ordinal to timestamp
        const timestamp = ordinalToTimestamp(testCase.ordinal);
        
        // ASSERT: Valid timestamp
        expect(timestamp.seconds).toBeGreaterThanOrEqual(0);
        expect(timestamp.nanos).toBeGreaterThanOrEqual(0);
        expect(timestamp.nanos).toBeLessThan(1_000_000_000);
        
        // ACT: Convert back to ordinal
        const backToOrdinal = timestampToOrdinal(timestamp);
        
        // ASSERT: Round-trip conversion (within acceptable tolerance)
        const tolerance = 100; // Ordinals within 100 of original
        expect(Math.abs(backToOrdinal - testCase.ordinal)).toBeLessThanOrEqual(tolerance);
      }
    });
  });
});

describe('Proto Canonical Schemas: CalculatedState Extension', () => {
  
  describe('CalculatedState Delegations Field', () => {
    it('should add delegations field as field number 3 to CalculatedState', () => {
      // ARRANGE: Expected CalculatedState fields
      const expectedFields = [
        { fieldNumber: 1, fieldName: 'state_machines', fieldType: 'map<string, StateMachineFiberRecord>' },
        { fieldNumber: 2, fieldName: 'scripts', fieldType: 'map<string, ScriptFiberRecord>' },
        { fieldNumber: 3, fieldName: 'delegations', fieldType: 'map<string, DelegationCredential>' } // NEW
      ];
      
      // ACT: Analyze current CalculatedState structure
      const analysis = analyzeProtoMessageFields('ottochain.v1.CalculatedState');
      
      // ASSERT: Should have 3 fields (currently fails - only has 2)
      expect(analysis.fieldCount).toBe(3);
      
      // ASSERT: Delegations field exists at field number 3
      const delegationsField = analysis.fields?.find(f => f.fieldNumber === 3);
      expect(delegationsField).toBeDefined();
      expect(delegationsField?.fieldName).toBe('delegations');
      expect(delegationsField?.fieldType).toBe('map<string, DelegationCredential>');
    });

    it('should generate TypeScript interface with delegations field', () => {
      // ARRANGE: Expected TypeScript interface structure
      const expectedInterface = {
        stateMachines: '{ [key: string]: StateMachineFiberRecord }',
        scripts: '{ [key: string]: ScriptFiberRecord }',
        delegations: '{ [key: string]: DelegationCredential }' // NEW field
      };
      
      // ACT: Create extended CalculatedState instance
      const extendedState: ExtendedCalculatedState = {
        stateMachines: {},
        scripts: {},
        delegations: {} // This field should be generated from proto
      };
      
      // ASSERT: All expected properties exist
      expect(extendedState).toHaveProperty('stateMachines');
      expect(extendedState).toHaveProperty('scripts');
      expect(extendedState).toHaveProperty('delegations');
      
      // ASSERT: Delegations field has correct type structure
      const testDelegation: DelegationCredential = {
        delegationId: 'test123',
        delegatorAddress: 'DAG123...',
        delegateAddress: 'DAG456...',
        sessionKeyId: 'session789',
        createdAtOrdinal: 1000000,
        expiresAtOrdinal: 1001000,
        spendUsed: '0',
        stakeBonded: '50000',
        spendLimit: '100000',
        isRevoked: false,
        scope: {
          allowedOperations: ['transfer'],
          allowedContracts: [],
          maxTransactionAmount: '1000',
          maxTotalAmount: '10000',
          minReputationScore: 50
        }
      };
      
      extendedState.delegations['test123'] = testDelegation;
      expect(extendedState.delegations['test123'].delegationId).toBe('test123');
    });

    it('should maintain backward compatibility with existing CalculatedState usage', () => {
      // ARRANGE: Existing code that uses CalculatedState
      const existingState: CalculatedState = {
        stateMachines: {
          'fiber1': {
            fiberId: 'fiber1',
            creationOrdinal: 1000,
            previousUpdateOrdinal: 1000,
            latestUpdateOrdinal: 1000,
            definition: undefined,
            currentState: 'active',
            stateData: undefined,
            stateDataHash: 'hash123',
            sequenceNumber: 1,
            owners: ['DAG123...'],
            status: 0, // FIBER_STATUS_UNSPECIFIED
            lastReceipt: undefined,
            parentFiberId: undefined,
            childFiberIds: []
          }
        },
        scripts: {}
      };
      
      // ACT: Extend to include delegations
      const extendedState: ExtendedCalculatedState = {
        ...existingState,
        delegations: {
          'delegation123': {
            delegationId: 'delegation123',
            delegatorAddress: 'DAG123...',
            delegateAddress: 'DAG456...',
            sessionKeyId: 'session789',
            createdAtOrdinal: 1000500,
            expiresAtOrdinal: 1010000,
            spendUsed: '1000',
            stakeBonded: '25000',
            spendLimit: '50000',
            isRevoked: false,
            scope: {
              allowedOperations: ['transfer', 'vote'],
              allowedContracts: [],
              maxTransactionAmount: '5000',
              maxTotalAmount: '50000',
              minReputationScore: 60
            }
          }
        }
      };
      
      // ASSERT: Backward compatibility maintained
      expect(extendedState.stateMachines).toEqual(existingState.stateMachines);
      expect(extendedState.scripts).toEqual(existingState.scripts);
      
      // ASSERT: New functionality available
      expect(Object.keys(extendedState.delegations)).toHaveLength(1);
      expect(extendedState.delegations['delegation123'].spendUsed).toBe('1000');
    });

    it('should support efficient delegation queries and updates', () => {
      // ARRANGE: CalculatedState with multiple delegations
      const stateWithDelegations: ExtendedCalculatedState = {
        stateMachines: {},
        scripts: {},
        delegations: {
          'active123': createMockDelegationCredential('active123', false, '1000'),
          'active456': createMockDelegationCredential('active456', false, '500'),
          'revoked789': createMockDelegationCredential('revoked789', true, '0'),
          'expired999': createMockDelegationCredential('expired999', false, '0', 999000) // Expired
        }
      };
      
      // ACT: Query operations
      const activeDelegations = queryActiveDelegations(stateWithDelegations, 1000000);
      const delegationsBySpender = queryDelegationsByUser(stateWithDelegations, 'DAG123...');
      const totalSpend = calculateTotalSpendForUser(stateWithDelegations, 'DAG123...');
      
      // ASSERT: Efficient querying
      expect(activeDelegations).toHaveLength(2); // active123, active456 (not revoked or expired)
      expect(delegationsBySpender).toHaveLength(4); // All delegations for this user
      expect(parseFloat(totalSpend)).toBeGreaterThan(0);
      
      // ACT: Update operations
      const updated = updateDelegationSpend(stateWithDelegations, 'active123', '1500');
      
      // ASSERT: State update efficiency
      expect(updated.delegations['active123'].spendUsed).toBe('1500');
      expect(updated.delegations['active456'].spendUsed).toBe('500'); // Unchanged
    });
  });

  describe('Proto Generation and Validation', () => {
    it('should generate valid protobuf from extended CalculatedState', () => {
      // ARRANGE: Extended state with all field types
      const fullState: ExtendedCalculatedState = {
        stateMachines: {
          'sm1': createMockStateMachine('sm1')
        },
        scripts: {
          'script1': createMockScript('script1')  
        },
        delegations: {
          'del1': createMockDelegationCredential('del1', false, '1000')
        }
      };
      
      // ACT: Serialize and deserialize
      const serialized = serializeCalculatedState(fullState);
      const deserialized = deserializeCalculatedState(serialized);
      
      // ASSERT: Round-trip integrity
      expect(deserialized.stateMachines).toEqual(fullState.stateMachines);
      expect(deserialized.scripts).toEqual(fullState.scripts);
      expect(deserialized.delegations).toEqual(fullState.delegations);
      
      // ASSERT: Proper field numbers in binary encoding
      const fieldNumbers = extractProtobufFieldNumbers(serialized);
      expect(fieldNumbers).toContain(1); // state_machines
      expect(fieldNumbers).toContain(2); // scripts
      expect(fieldNumbers).toContain(3); // delegations
    });

    it('should validate proto package naming conventions', () => {
      // ARRANGE: Expected package structure
      const expectedPackages = {
        'DelegationCredential': 'ottochain.v1',
        'CalculatedState': 'ottochain.v1',
        'Delegation': 'ottochain.apps.delegation.v1',
        'StateMachineFiberRecord': 'ottochain.v1',
        'ScriptFiberRecord': 'ottochain.v1'
      };
      
      // ACT & ASSERT: Validate each message package
      for (const [messageName, expectedPackage] of Object.entries(expectedPackages)) {
        const actualPackage = getProtoMessagePackage(messageName);
        expect(actualPackage).toBe(expectedPackage);
      }
    });

    it('should enforce field numbering and reserved ranges', () => {
      // ARRANGE: Proto field numbering rules
      const rules = {
        coreFields: { start: 1, end: 15 },
        extensionFields: { start: 16, end: 99 },
        userReserved: { start: 100, end: 999 },
        googleReserved: { start: 19000, end: 19999 }
      };
      
      // ACT: Validate field numbering for all messages
      const messages = ['DelegationCredential', 'CalculatedState', 'StateMachineFiberRecord'];
      
      for (const messageName of messages) {
        const validation = validateProtoFieldNumbering(messageName);
        
        // ASSERT: No fields in reserved ranges
        expect(validation.isValid).toBe(true);
        expect(validation.errors).not.toContain(expect.stringContaining('reserved'));
        
        // ASSERT: Core fields use 1-15 range efficiently
        const coreFieldCount = validation.fieldNumbers?.filter(n => n >= 1 && n <= 15).length || 0;
        expect(coreFieldCount).toBeGreaterThan(0);
      }
    });
  });
});

describe('Proto Canonical Schemas: Integration and Testing', () => {
  
  describe('Cross-Protocol Compatibility', () => {
    it('should maintain compatibility with existing OttoChain protocols', () => {
      // ARRANGE: Existing protocol messages
      const protocolMessages = [
        'ottochain.v1.StateMachineFiberRecord',
        'ottochain.v1.ScriptFiberRecord', 
        'ottochain.apps.delegation.v1.Delegation',
        'ottochain.apps.governance.v1.Proposal',
        'ottochain.apps.markets.v1.Market'
      ];
      
      // ACT: Validate protocol compatibility
      for (const messageName of protocolMessages) {
        const compatibility = validateProtocolCompatibility(messageName);
        
        // ASSERT: Backward compatibility maintained
        expect(compatibility.isBackwardCompatible).toBe(true);
        expect(compatibility.breakingChanges).toHaveLength(0);
        expect(compatibility.deprecatedFields).toBeInstanceOf(Array);
      }
    });

    it('should support proper proto import relationships', () => {
      // ARRANGE: Expected import dependencies
      const expectedImports = {
        'records.proto': [
          'ottochain/v1/fiber.proto',
          'google/protobuf/struct.proto'
        ],
        'delegation.proto': [
          'google/protobuf/timestamp.proto',
          'ottochain/v1/common.proto'
        ]
      };
      
      // ACT & ASSERT: Validate import structure
      for (const [protoFile, expectedDeps] of Object.entries(expectedImports)) {
        const actualImports = getProtoImports(protoFile);
        
        for (const expectedDep of expectedDeps) {
          expect(actualImports).toContain(expectedDep);
        }
        
        // ASSERT: No circular imports
        const hasCircularImports = detectCircularImports(protoFile);
        expect(hasCircularImports).toBe(false);
      }
    });
  });

  describe('Code Generation and Build Process', () => {
    it('should generate clean TypeScript without conflicts', () => {
      // ARRANGE: Generated TypeScript validation
      const generatedFiles = [
        'src/generated/ottochain/v1/records.ts',
        'src/generated/ottochain/apps/delegation/v1/delegation.ts'
      ];
      
      // ACT: Validate generated TypeScript
      for (const file of generatedFiles) {
        const tsValidation = validateGeneratedTypeScript(file);
        
        // ASSERT: Clean generation
        expect(tsValidation.hasTypeErrors).toBe(false);
        expect(tsValidation.hasNamingConflicts).toBe(false);
        expect(tsValidation.exportsAllExpectedTypes).toBe(true);
      }
    });

    it('should support proper build toolchain integration', () => {
      // ARRANGE: Build process validation
      const buildSteps = [
        'proto_compilation',
        'typescript_generation', 
        'type_checking',
        'bundling',
        'testing'
      ];
      
      // ACT & ASSERT: Each build step succeeds
      for (const step of buildSteps) {
        const result = validateBuildStep(step);
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('Performance and Efficiency', () => {
    it('should maintain efficient serialization/deserialization', () => {
      // ARRANGE: Large CalculatedState for performance testing
      const largeState: ExtendedCalculatedState = {
        stateMachines: {},
        scripts: {},
        delegations: {}
      };
      
      // Create 1000 delegations for performance test
      for (let i = 0; i < 1000; i++) {
        largeState.delegations[`del_${i}`] = createMockDelegationCredential(`del_${i}`, false, `${i * 100}`);
      }
      
      // ACT: Performance measurement
      const startTime = performance.now();
      const serialized = serializeCalculatedState(largeState);
      const serializationTime = performance.now() - startTime;
      
      const deserializeStartTime = performance.now();
      const deserialized = deserializeCalculatedState(serialized);
      const deserializationTime = performance.now() - deserializeStartTime;
      
      // ASSERT: Performance benchmarks
      expect(serializationTime).toBeLessThan(100); // < 100ms for 1000 delegations
      expect(deserializationTime).toBeLessThan(100);
      expect(deserialized.delegations).toHaveProperty('del_999');
      expect(Object.keys(deserialized.delegations)).toHaveLength(1000);
    });

    it('should optimize memory usage for large state objects', () => {
      // ARRANGE: Memory usage test
      const memoryBefore = getMemoryUsage();
      
      // ACT: Create and process large state
      const state = createLargeCalculatedState(10000); // 10k delegations
      const processed = processCalculatedState(state);
      
      const memoryAfter = getMemoryUsage();
      const memoryDelta = memoryAfter - memoryBefore;
      
      // ASSERT: Reasonable memory usage
      expect(memoryDelta).toBeLessThan(100 * 1024 * 1024); // < 100MB for 10k delegations
      expect(processed.delegations).toBeDefined();
    });
  });
});

// Mock helper functions (these would be implemented in the actual proto framework)

function analyzeProtoMessageFields(messageName: string): { 
  fieldCount: number; 
  isValid: boolean; 
  fields?: ProtoFieldAnalysis[] 
} {
  // Mock implementation - would analyze actual proto files
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateProtoFieldNumbering(messageName: string): ProtoValidationResult {
  // Mock implementation - would validate field numbering rules
  throw new Error('Not yet implemented - TDD test should fail');
}

function compareAPIvsStateLayerFields(): {
  missingInAPI: string[];
  apiUsesCaseNaming: boolean;
  stateUsesOrdinals: boolean;
  apiUsesTimestamps: boolean;
} {
  return {
    missingInAPI: ['spendUsed', 'stakeBonded', 'spendLimit', 'isRevoked'],
    apiUsesCaseNaming: true,
    stateUsesOrdinals: true,
    apiUsesTimestamps: true
  };
}

function protoMessageExists(messageName: string): boolean {
  // Mock implementation - would check if proto message exists
  return false; // Will fail until DelegationCredential is implemented
}

function getProtoMessagePackage(messageName: string): string {
  // Mock implementation - would return proto package for message
  throw new Error('Not yet implemented - TDD test should fail');
}

function isMessageInProtoFile(messageName: string, filePath: string): boolean {
  // Mock implementation - would check if message is in specific proto file
  throw new Error('Not yet implemented - TDD test should fail');
}

function tsTypeExists(typeName: string): boolean {
  // Mock implementation - would check if TypeScript type exists
  return false; // Will fail until implemented
}

function validateDelegationCredential(credential: DelegationCredential): void {
  // Mock implementation - would validate business logic constraints
  throw new Error('Not yet implemented - TDD test should fail');
}

function analyzeAPIvsStateLayers(): {
  apiLayer: { timestampBased: boolean };
  stateLayer: { ordinalBased: boolean };
  hasFieldOverlap: boolean;
  conversionMappingExists: boolean;
} {
  // Mock implementation - would analyze layer separation
  throw new Error('Not yet implemented - TDD test should fail');
}

function convertAPIToStateCredential(
  apiDelegation: Delegation, 
  stateContext: { currentOrdinal: number; spendUsed: string; stakeBonded: string }
): DelegationCredential {
  // Mock implementation - would convert API to state representation
  throw new Error('Not yet implemented - TDD test should fail');
}

function convertStateToAPICredential(stateCredential: DelegationCredential): Delegation {
  // Mock implementation - would convert state to API representation  
  throw new Error('Not yet implemented - TDD test should fail');
}

function ordinalToTimestamp(ordinal: number): { seconds: number; nanos: number } {
  // Mock implementation - would convert ordinal to timestamp
  throw new Error('Not yet implemented - TDD test should fail');
}

function timestampToOrdinal(timestamp: { seconds: number; nanos: number }): number {
  // Mock implementation - would convert timestamp to ordinal
  throw new Error('Not yet implemented - TDD test should fail');
}

function queryActiveDelegations(state: ExtendedCalculatedState, currentOrdinal: number): DelegationCredential[] {
  // Mock implementation - would query active delegations
  throw new Error('Not yet implemented - TDD test should fail');
}

function queryDelegationsByUser(state: ExtendedCalculatedState, userAddress: string): DelegationCredential[] {
  // Mock implementation - would query delegations by user
  throw new Error('Not yet implemented - TDD test should fail');
}

function calculateTotalSpendForUser(state: ExtendedCalculatedState, userAddress: string): string {
  // Mock implementation - would calculate total spend
  throw new Error('Not yet implemented - TDD test should fail');
}

function updateDelegationSpend(
  state: ExtendedCalculatedState, 
  delegationId: string, 
  newSpendAmount: string
): ExtendedCalculatedState {
  // Mock implementation - would update delegation spend
  throw new Error('Not yet implemented - TDD test should fail');
}

function createMockDelegationCredential(
  id: string, 
  isRevoked: boolean, 
  spendUsed: string,
  expiresAtOrdinal: number = 1001000
): DelegationCredential {
  return {
    delegationId: id,
    delegatorAddress: 'DAG123...',
    delegateAddress: 'DAG456...',
    sessionKeyId: `session_${id}`,
    createdAtOrdinal: 1000000,
    expiresAtOrdinal,
    spendUsed,
    stakeBonded: '50000',
    spendLimit: '100000',
    isRevoked,
    scope: {
      allowedOperations: ['transfer'],
      allowedContracts: [],
      maxTransactionAmount: '10000',
      maxTotalAmount: '100000',
      minReputationScore: 50
    }
  };
}

function createMockStateMachine(id: string): StateMachineFiberRecord {
  // Mock implementation - would create mock state machine
  throw new Error('Not yet implemented - TDD test should fail');
}

function createMockScript(id: string): ScriptFiberRecord {
  // Mock implementation - would create mock script
  throw new Error('Not yet implemented - TDD test should fail');
}

function serializeCalculatedState(state: ExtendedCalculatedState): Uint8Array {
  // Mock implementation - would serialize to protobuf
  throw new Error('Not yet implemented - TDD test should fail');
}

function deserializeCalculatedState(data: Uint8Array): ExtendedCalculatedState {
  // Mock implementation - would deserialize from protobuf
  throw new Error('Not yet implemented - TDD test should fail');
}

function extractProtobufFieldNumbers(data: Uint8Array): number[] {
  // Mock implementation - would extract field numbers from binary data
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateProtocolCompatibility(messageName: string): {
  isBackwardCompatible: boolean;
  breakingChanges: string[];
  deprecatedFields: string[];
} {
  // Mock implementation - would validate protocol compatibility
  throw new Error('Not yet implemented - TDD test should fail');
}

function getProtoImports(protoFile: string): string[] {
  // Mock implementation - would get proto import dependencies
  throw new Error('Not yet implemented - TDD test should fail');
}

function detectCircularImports(protoFile: string): boolean {
  // Mock implementation - would detect circular imports
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateGeneratedTypeScript(filePath: string): {
  hasTypeErrors: boolean;
  hasNamingConflicts: boolean;
  exportsAllExpectedTypes: boolean;
} {
  // Mock implementation - would validate generated TypeScript
  throw new Error('Not yet implemented - TDD test should fail');
}

function validateBuildStep(step: string): { success: boolean; errors: string[] } {
  // Mock implementation - would validate build process step
  throw new Error('Not yet implemented - TDD test should fail');
}

function getMemoryUsage(): number {
  // Mock implementation - would get current memory usage
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

function createLargeCalculatedState(delegationCount: number): ExtendedCalculatedState {
  // Mock implementation - would create large state for testing
  throw new Error('Not yet implemented - TDD test should fail');
}

function processCalculatedState(state: ExtendedCalculatedState): ExtendedCalculatedState {
  // Mock implementation - would process state
  throw new Error('Not yet implemented - TDD test should fail');
}