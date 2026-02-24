/**
 * TDD Tests for Proto Canonical Schemas (Card #699621e02b30219827052ee1)
 * 
 * These tests verify that all OttoChain proto schemas are properly defined
 * and structurally consistent between TypeScript SDK and Scala implementations.
 * 
 * Tests are organized into 5 groups covering 15 test cases total.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock generated proto types (these should fail until schemas are implemented)
interface DelegationCredential {
  delegatorAddress: string;
  relayerAddress: string;
  spendUsed: string;  // BigInt as string
  stakeBonded: string;  // BigInt as string
  spendLimit: string;  // BigInt as string
  scope: string;  // JSON string
  sessionKey?: string;
  createdAt: number;  // ordinal
  expiresAt: number;  // ordinal
  isRevoked: boolean;
  revokedAt?: number;  // ordinal
}

interface CalculatedState {
  stateMachines: Record<string, any>;
  scripts: Record<string, any>;
  delegations: Record<string, DelegationCredential>;  // This field should be missing initially
}

interface OttochainMessage {
  createStateMachine?: any;
  transitionStateMachine?: any;
  archiveStateMachine?: any;
  createScript?: any;
  invokeScript?: any;
  createDelegation?: any;  // Should be missing initially
  revokeDelegation?: any;  // Should be missing initially
}

describe('Proto Canonical Schemas - Group 1: Core Message Types', () => {
  it('should define DelegationCredential proto message with all required fields', () => {
    // This test should FAIL until DelegationCredential proto is added
    expect(() => {
      // Try to import generated DelegationCredential type
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      const delegationCredential = new records.DelegationCredential();
      
      // Verify all required fields exist
      expect(delegationCredential).toHaveProperty('delegatorAddress');
      expect(delegationCredential).toHaveProperty('relayerAddress'); 
      expect(delegationCredential).toHaveProperty('spendUsed');
      expect(delegationCredential).toHaveProperty('stakeBonded');
      expect(delegationCredential).toHaveProperty('spendLimit');
      expect(delegationCredential).toHaveProperty('scope');
      expect(delegationCredential).toHaveProperty('createdAt');
      expect(delegationCredential).toHaveProperty('expiresAt');
      expect(delegationCredential).toHaveProperty('isRevoked');
    }).not.toThrow();
  });

  it('should define CalculatedState with delegations map field', () => {
    // This test should FAIL until delegations field is added to CalculatedState
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      const calculatedState = new records.CalculatedState();
      
      expect(calculatedState).toHaveProperty('stateMachines');
      expect(calculatedState).toHaveProperty('scripts');
      expect(calculatedState).toHaveProperty('delegations');  // Should fail - field missing
      
      // Verify delegations is a map type
      expect(typeof calculatedState.delegations).toBe('object');
    }).not.toThrow();
  });

  it('should define CREATE_DELEGATION and REVOKE_DELEGATION in OttochainMessage union', () => {
    // This test should FAIL until delegation message variants are added
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/messages_pb';
      const messages = require(protoPath);
      const ottochainMessage = new messages.OttochainMessage();
      
      // Check that delegation message variants exist
      expect(ottochainMessage).toHaveProperty('createDelegation');  // Should fail
      expect(ottochainMessage).toHaveProperty('revokeDelegation');  // Should fail
      
      // Verify they're part of the oneof union
      const messageCase = ottochainMessage.getMessageCase();
      const validCases = [
        'create_state_machine',
        'transition_state_machine', 
        'archive_state_machine',
        'create_script',
        'invoke_script',
        'create_delegation',  // Should fail
        'revoke_delegation'   // Should fail
      ];
      expect(validCases).toContain(messageCase);
    }).not.toThrow();
  });
});

describe('Proto Canonical Schemas - Group 2: Field Type Consistency', () => {
  it('should use ordinal-based timestamps in DelegationCredential (not wall-clock)', () => {
    // This test should FAIL if using Timestamp instead of ordinals
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      const delegationCredential = new records.DelegationCredential();
      
      // Verify timestamp fields are ordinal numbers, not google.protobuf.Timestamp
      expect(typeof delegationCredential.createdAt).toBe('number');  
      expect(typeof delegationCredential.expiresAt).toBe('number');
      expect(typeof delegationCredential.revokedAt).toBe('number');
      
      // Should NOT be Timestamp objects
      expect(delegationCredential.createdAt).not.toHaveProperty('seconds');
      expect(delegationCredential.createdAt).not.toHaveProperty('nanos');
    }).not.toThrow();
  });

  it('should use string representation for BigInt amounts in DelegationCredential', () => {
    // This test should FAIL if using int64 instead of string for large amounts
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      const delegationCredential = new records.DelegationCredential();
      
      // Set large amounts that exceed safe integer range
      delegationCredential.spendUsed = '9007199254740992';  // 2^53
      delegationCredential.stakeBonded = '18014398509481984';  // 2^54
      delegationCredential.spendLimit = '36028797018963968';  // 2^55
      
      // Verify values are preserved exactly (no precision loss)
      expect(delegationCredential.spendUsed).toBe('9007199254740992');
      expect(delegationCredential.stakeBonded).toBe('18014398509481984');
      expect(delegationCredential.spendLimit).toBe('36028797018963968');
    }).not.toThrow();
  });

  it('should use consistent field numbering between proto files', () => {
    // This test should FAIL if field numbers overlap or are inconsistent
    expect(() => {
      // Verify DelegationCredential doesn't use reserved field numbers
      const delegationProto = fs.readFileSync(
        path.join(__dirname, '../proto/ottochain/v1/records.proto'), 
        'utf8'
      );
      
      // Check that DelegationCredential message exists in proto file
      expect(delegationProto).toContain('message DelegationCredential');
      
      // Verify field numbers are in reserved range (e.g., fields 50-60 reserved for delegation)
      const fieldPattern = /(\w+)\s*=\s*(\d+)/g;
      let match;
      const usedFields: number[] = [];
      
      while ((match = fieldPattern.exec(delegationProto)) !== null) {
        const fieldNumber = parseInt(match[2]);
        usedFields.push(fieldNumber);
        
        // Verify delegation fields use designated range
        expect(fieldNumber).toBeGreaterThan(0);
        expect(fieldNumber).toBeLessThan(1000);  // Proto field number limit
      }
      
      // No duplicate field numbers
      const uniqueFields = [...new Set(usedFields)];
      expect(uniqueFields).toHaveLength(usedFields.length);
    }).not.toThrow();
  });
});

describe('Proto Canonical Schemas - Group 3: Package Structure', () => {
  it('should follow ottochain.v1 package naming convention', () => {
    // This test should FAIL if packages don't follow naming convention
    expect(() => {
      const protoFiles = [
        '../proto/ottochain/v1/records.proto',
        '../proto/ottochain/v1/messages.proto',
        '../proto/ottochain/v1/fiber.proto',
        '../proto/ottochain/v1/common.proto'
      ];
      
      protoFiles.forEach(filePath => {
        const protoContent = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
        
        // Verify package declaration
        expect(protoContent).toContain('package ottochain.v1;');
        
        // Verify syntax version
        expect(protoContent).toContain('syntax = "proto3";');
      });
    }).not.toThrow();
  });

  it('should maintain import consistency across proto files', () => {
    // This test should FAIL if imports are missing or inconsistent
    expect(() => {
      const messagesProto = fs.readFileSync(
        path.join(__dirname, '../proto/ottochain/v1/messages.proto'),
        'utf8'
      );
      
      const recordsProto = fs.readFileSync(
        path.join(__dirname, '../proto/ottochain/v1/records.proto'),
        'utf8'
      );
      
      // Verify cross-references are imported
      if (messagesProto.includes('CreateDelegation')) {
        // If messages.proto defines delegation messages, records.proto should import it
        expect(recordsProto).toContain('import "ottochain/v1/messages.proto"');
      }
      
      if (recordsProto.includes('DelegationCredential')) {
        // If records.proto defines DelegationCredential, it should be importable
        expect(recordsProto).toContain('import "google/protobuf/');
      }
    }).not.toThrow();
  });

  it('should generate TypeScript interfaces without compilation errors', () => {
    // This test should FAIL if proto generation fails
    expect(() => {
      // Attempt to regenerate proto files
      execSync('cd ' + path.dirname(__dirname) + ' && npm run generate:proto', {
        stdio: 'pipe'
      });
      
      // Verify generated files exist
      const generatedDir = path.join(__dirname, '../src/generated/ottochain/v1');
      expect(fs.existsSync(path.join(generatedDir, 'records_pb.ts'))).toBe(true);
      expect(fs.existsSync(path.join(generatedDir, 'messages_pb.ts'))).toBe(true);
      
      // Verify TypeScript compilation
      execSync('cd ' + path.dirname(__dirname) + ' && npx tsc --noEmit', {
        stdio: 'pipe'
      });
    }).not.toThrow();
  });
});

describe('Proto Canonical Schemas - Group 4: Scala Alignment', () => {
  it('should align DelegationCredential proto fields with Scala implementation', () => {
    // This test should FAIL until proto matches Scala model structure
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      const delegationCredential = new records.DelegationCredential();
      
      // Verify alignment with Scala DelegationCredential structure
      // (Based on context: Scala uses ordinals + specific field set)
      const requiredFields = [
        'delegatorAddress',  // matches Scala delegatorAddr
        'relayerAddress',    // matches Scala relayerAddr  
        'spendUsed',         // matches Scala spendUsed
        'stakeBonded',       // matches Scala stakeBonded
        'spendLimit',        // missing in current proto
        'scope',             // missing in current proto
        'sessionKey',        // missing in current proto
        'isRevoked'          // missing in current proto
      ];
      
      requiredFields.forEach(field => {
        expect(delegationCredential).toHaveProperty(field);
      });
      
      // Verify ordinal-based timestamps (Scala pattern) not wall-clock (API pattern)
      expect(typeof delegationCredential.createdAt).toBe('number');
      expect(delegationCredential).not.toHaveProperty('createdAtTimestamp');
    }).not.toThrow();
  });

  it('should define proto equivalents for all Scala case classes', () => {
    // This test should FAIL until all Scala models have proto equivalents
    expect(() => {
      // Map of Scala classes that should have proto equivalents
      const expectedProtoMessages = [
        'StateMachineFiberRecord',  // ✅ Already exists
        'ScriptFiberRecord',        // ✅ Already exists  
        'DelegationCredential',     // ❌ Should fail - missing
        'FiberCommit',              // ✅ Already exists
        'CalculatedState'           // ✅ Exists but missing delegations field
      ];
      
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      
      expectedProtoMessages.forEach(messageName => {
        expect(records).toHaveProperty(messageName);
        
        // Verify it's a constructor function (proto message class)
        expect(typeof records[messageName]).toBe('function');
        
        // Verify it can be instantiated
        const instance = new records[messageName]();
        expect(instance).toBeDefined();
      });
    }).not.toThrow();
  });

  it('should maintain field type compatibility with ScalaPB generated types', () => {
    // This test should FAIL if TypeScript types don't match Scala expectations  
    expect(() => {
      const protoPath = '../src/generated/ottochain/v1/records_pb';
      const records = require(protoPath);
      
      // Test StateMachineFiberRecord compatibility
      const smRecord = new records.StateMachineFiberRecord();
      
      // Verify field types match Scala expectations
      expect(typeof smRecord.fiberId).toBe('string');           // Scala: String
      expect(typeof smRecord.creationOrdinal).toBe('number');   // Scala: Long -> BigInt
      expect(typeof smRecord.sequenceNumber).toBe('number');    // Scala: FiberOrdinal
      expect(Array.isArray(smRecord.owners)).toBe(true);        // Scala: List[Address]
      expect(typeof smRecord.currentState).toBe('string');      // Scala: StateId
      
      // If DelegationCredential exists, test its types
      if (records.DelegationCredential) {
        const delegation = new records.DelegationCredential();
        expect(typeof delegation.delegatorAddress).toBe('string');  // Scala: Address
        expect(typeof delegation.relayerAddress).toBe('string');    // Scala: Address
        expect(typeof delegation.spendUsed).toBe('string');         // Scala: BigInt -> String
        expect(typeof delegation.isRevoked).toBe('boolean');        // Scala: Boolean
      }
    }).not.toThrow();
  });
});

describe('Proto Canonical Schemas - Group 5: Integration & Completeness', () => {
  it('should support delegation workflow end-to-end via proto messages', () => {
    // This test should FAIL until complete delegation proto support exists
    expect(() => {
      const messagesPath = '../src/generated/ottochain/v1/messages_pb';
      const recordsPath = '../src/generated/ottochain/v1/records_pb';
      
      const messages = require(messagesPath);
      const records = require(recordsPath);
      
      // Test delegation creation workflow
      const createDelegation = new messages.CreateDelegation();
      createDelegation.delegatorAddress = '0x1234567890abcdef';
      createDelegation.relayerAddress = '0xabcdef1234567890';
      createDelegation.scope = JSON.stringify({
        allowedOperations: ['CreateFiber', 'TransitionFiber'],
        maxGasPerTx: 100000
      });
      
      // Test delegation storage
      const calculatedState = new records.CalculatedState();
      const delegationRecord = new records.DelegationCredential();
      calculatedState.delegations['delegation-123'] = delegationRecord;
      
      // Test revocation workflow  
      const revokeDelegation = new messages.RevokeDelegation();
      revokeDelegation.delegationId = 'delegation-123';
      revokeDelegation.reason = 'User requested';
      
      // All operations should succeed
      expect(createDelegation.delegatorAddress).toBe('0x1234567890abcdef');
      expect(calculatedState.delegations).toHaveProperty('delegation-123');
      expect(revokeDelegation.reason).toBe('User requested');
    }).not.toThrow();
  });

  it('should validate proto schema completeness against design specification', () => {
    // This test should FAIL until all spec requirements are implemented
    expect(() => {
      // Verify all proto files mentioned in spec exist
      const requiredProtoFiles = [
        '../proto/ottochain/v1/records.proto',
        '../proto/ottochain/v1/messages.proto',
        '../proto/ottochain/v1/fiber.proto',
        '../proto/ottochain/v1/common.proto'
      ];
      
      requiredProtoFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
      
      // Verify delegation-related messages are complete
      const messagesProto = fs.readFileSync(
        path.join(__dirname, '../proto/ottochain/v1/messages.proto'),
        'utf8'
      );
      
      // Should contain delegation message definitions
      expect(messagesProto).toContain('message CreateDelegation');  // Should fail
      expect(messagesProto).toContain('message RevokeDelegation');  // Should fail
      
      // OttochainMessage should include delegation variants
      expect(messagesProto).toMatch(/create_delegation\s*=\s*\d+/);  // Should fail
      expect(messagesProto).toMatch(/revoke_delegation\s*=\s*\d+/);  // Should fail
      
      // Verify records proto is complete
      const recordsProto = fs.readFileSync(
        path.join(__dirname, '../proto/ottochain/v1/records.proto'),
        'utf8'
      );
      
      expect(recordsProto).toContain('message DelegationCredential');  // Should fail
      expect(recordsProto).toContain('map<string, DelegationCredential> delegations');  // Should fail
    }).not.toThrow();
  });

  it('should maintain backwards compatibility with existing proto consumers', () => {
    // This test should FAIL if new proto changes break existing consumers
    expect(() => {
      // Test that existing messages still work
      const messagesPath = '../src/generated/ottochain/v1/messages_pb';
      const messages = require(messagesPath);
      
      // Existing message types should remain functional
      const createSM = new messages.CreateStateMachine();
      createSM.fiberId = 'test-fiber';
      expect(createSM.fiberId).toBe('test-fiber');
      
      const transitionSM = new messages.TransitionStateMachine();
      transitionSM.fiberId = 'test-fiber';
      transitionSM.eventName = 'transition';
      expect(transitionSM.eventName).toBe('transition');
      
      const archiveSM = new messages.ArchiveStateMachine();
      archiveSM.fiberId = 'test-fiber';
      expect(archiveSM.fiberId).toBe('test-fiber');
      
      // Union message should work with existing variants
      const ottochainMsg = new messages.OttochainMessage();
      ottochainMsg.createStateMachine = createSM;
      expect(ottochainMsg.createStateMachine).toBe(createSM);
      
      // Adding new variants shouldn't break existing ones
      expect(ottochainMsg.createStateMachine.fiberId).toBe('test-fiber');
    }).not.toThrow();
  });
});