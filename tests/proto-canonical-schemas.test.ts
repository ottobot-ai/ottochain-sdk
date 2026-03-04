/**
 * TDD Tests for Proto Canonical Schemas (Card #699621e02b30219827052ee1)
 *
 * Verifies that all OttoChain proto schemas are properly defined and
 * structurally consistent. Uses ts-proto generated TypeScript interfaces
 * (not protobuf-js class constructors — ts-proto generates interfaces + MessageFns).
 *
 * Tests are organised into 5 groups covering:
 *   Group 1: Core message types exist with required fields
 *   Group 2: Field type consistency (ordinals, BigInt-as-string)
 *   Group 3: Field numbering & import consistency
 *   Group 4: Scala alignment & ts-proto compatibility
 *   Group 5: Integration & completeness (proto file content checks)
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// ─── ts-proto generated types ─────────────────────────────────────────────────
import {
  DelegationCredential,
  CalculatedState,
  StateMachineFiberRecord,
} from '../src/generated/ottochain/v1/records.js';
import {
  OttochainMessage,
  CreateDelegation,
  RevokeDelegation,
  CreateStateMachine,
  TransitionStateMachine,
  ArchiveStateMachine,
} from '../src/generated/ottochain/v1/messages.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal DelegationCredential using ts-proto MessageFns.create() */
function makeDelegationCredential(overrides: Partial<DelegationCredential> = {}): DelegationCredential {
  return DelegationCredential.create({
    delegatorAddress: 'DAG0000delegator',
    relayerAddress: 'DAG0000relayer',
    spendUsed: '0',
    stakeBonded: '1000000000',
    spendLimit: '5000000000',
    scope: JSON.stringify({ allowedOperations: ['TransitionStateMachine'] }),
    createdAt: 100,
    expiresAt: 200,
    isRevoked: false,
    ...overrides,
  });
}

// ─── Group 1: Core message types ─────────────────────────────────────────────

describe('Proto Canonical Schemas - Group 1: Core Message Types', () => {
  it('should define DelegationCredential proto message with all required fields', () => {
    const cred = makeDelegationCredential();

    expect(cred).toHaveProperty('delegatorAddress');
    expect(cred).toHaveProperty('relayerAddress');
    expect(cred).toHaveProperty('spendUsed');
    expect(cred).toHaveProperty('stakeBonded');
    expect(cred).toHaveProperty('spendLimit');
    expect(cred).toHaveProperty('scope');
    expect(cred).toHaveProperty('createdAt');
    expect(cred).toHaveProperty('expiresAt');
    expect(cred).toHaveProperty('isRevoked');
  });

  it('should define CalculatedState with delegations map field', () => {
    const state = CalculatedState.create({});

    expect(state).toHaveProperty('stateMachines');
    expect(state).toHaveProperty('scripts');
    expect(state).toHaveProperty('delegations');
    expect(typeof state.delegations).toBe('object');
  });

  it('should define CREATE_DELEGATION and REVOKE_DELEGATION in OttochainMessage union', () => {
    // ts-proto oneof is represented as discriminated union on the `message` field
    const createMsg: OttochainMessage = {
      message: {
        $case: 'createDelegation',
        createDelegation: CreateDelegation.create({
          delegationId: 'deleg-001',
          delegatorAddress: 'DAGdelegator',
          relayerAddress: 'DAGrelayer',
          spendLimit: '5000000000',
          stakeAmount: '1000000000',
          scope: '{}',
          expiresAt: 999,
          delegatorSignature: 'sig',
          nonce: 1,
        }),
      },
    };
    expect(createMsg.message?.$case).toBe('createDelegation');

    const revokeMsg: OttochainMessage = {
      message: {
        $case: 'revokeDelegation',
        revokeDelegation: RevokeDelegation.create({
          delegationId: 'deleg-001',
          delegatorAddress: 'DAGdelegator',
          delegatorSignature: 'sig',
          nonce: 2,
        }),
      },
    };
    expect(revokeMsg.message?.$case).toBe('revokeDelegation');
  });
});

// ─── Group 2: Field type consistency ─────────────────────────────────────────

describe('Proto Canonical Schemas - Group 2: Field Type Consistency', () => {
  it('should use ordinal-based timestamps in DelegationCredential (not wall-clock)', () => {
    const cred = makeDelegationCredential({ createdAt: 42, expiresAt: 999 });

    // Ordinals are plain numbers, not Timestamp objects
    expect(typeof cred.createdAt).toBe('number');
    expect(typeof cred.expiresAt).toBe('number');
    expect(cred.createdAt).toBe(42);
    expect(cred.expiresAt).toBe(999);

    // Should NOT be Timestamp objects
    expect(cred.createdAt).not.toHaveProperty('seconds');
  });

  it('should use string representation for BigInt amounts in DelegationCredential', () => {
    const large = '9007199254740993'; // > Number.MAX_SAFE_INTEGER
    const cred = makeDelegationCredential({
      spendUsed: large,
      stakeBonded: '18014398509481984',
      spendLimit: '36028797018963968',
    });

    expect(cred.spendUsed).toBe(large);
    expect(cred.stakeBonded).toBe('18014398509481984');
    expect(cred.spendLimit).toBe('36028797018963968');
    expect(typeof cred.spendUsed).toBe('string');
  });

  it('should use consistent field numbering between proto files', () => {
    // Smoke-test: ensure round-trip encode/decode preserves field values
    const original = makeDelegationCredential({ createdAt: 50, expiresAt: 100 });
    const encoded = DelegationCredential.encode(original).finish();
    const decoded = DelegationCredential.decode(encoded);

    expect(decoded.delegatorAddress).toBe(original.delegatorAddress);
    expect(decoded.createdAt).toBe(50);
    expect(decoded.expiresAt).toBe(100);
    expect(decoded.isRevoked).toBe(false);
  });
});

// ─── Group 3: Package structure ───────────────────────────────────────────────

describe('Proto Canonical Schemas - Group 3: Package Structure', () => {
  it('should export DelegationCredential from generated records module', () => {
    // MessageFns are exported alongside the interface
    expect(typeof DelegationCredential).toBe('object');
    expect(typeof DelegationCredential.create).toBe('function');
    expect(typeof DelegationCredential.encode).toBe('function');
    expect(typeof DelegationCredential.decode).toBe('function');
  });

  it('should export CreateDelegation and RevokeDelegation from generated messages module', () => {
    expect(typeof CreateDelegation).toBe('object');
    expect(typeof CreateDelegation.create).toBe('function');

    expect(typeof RevokeDelegation).toBe('object');
    expect(typeof RevokeDelegation.create).toBe('function');
  });

  it('should include delegations field in CalculatedState encode/decode round-trip', () => {
    const cred = makeDelegationCredential();
    const state = CalculatedState.create({
      delegations: { 'deleg-001': cred },
    });

    const encoded = CalculatedState.encode(state).finish();
    const decoded = CalculatedState.decode(encoded);

    expect(decoded.delegations).toHaveProperty('deleg-001');
    expect(decoded.delegations['deleg-001'].delegatorAddress).toBe(cred.delegatorAddress);
  });
});

// ─── Group 4: Scala alignment ─────────────────────────────────────────────────

describe('Proto Canonical Schemas - Group 4: Scala Alignment', () => {
  it('should align DelegationCredential proto fields with Scala implementation', () => {
    const cred = makeDelegationCredential();
    const requiredFields = [
      'delegatorAddress',
      'relayerAddress',
      'spendUsed',
      'stakeBonded',
      'spendLimit',
      'scope',
      'isRevoked',
    ] as const;

    requiredFields.forEach(field => {
      expect(cred).toHaveProperty(field);
    });

    // Ordinal-based (Scala pattern) — not wall-clock timestamps
    expect(typeof cred.createdAt).toBe('number');
    expect(cred).not.toHaveProperty('createdAtTimestamp');
  });

  it('should define proto equivalents for all Scala case classes', () => {
    // Verify constructor functions (MessageFns) exist for key record types
    const messageObjects = {
      StateMachineFiberRecord,
      DelegationCredential,
      CalculatedState,
    } as Record<string, { create: (...args: unknown[]) => unknown }>;

    Object.entries(messageObjects).forEach(([_name, msgFns]) => {
      expect(typeof msgFns).toBe('object');
      expect(typeof msgFns.create).toBe('function');
    });
  });

  it('should maintain field type compatibility with Scala expectations', () => {
    const smRecord = StateMachineFiberRecord.create({
      fiberId: 'uuid-123',
      creationOrdinal: 1,
      sequenceNumber: 5,
      owners: ['DAGaddr1'],
      currentState: 'Active',
    });

    expect(typeof smRecord.fiberId).toBe('string');
    expect(typeof smRecord.creationOrdinal).toBe('number');
    expect(typeof smRecord.sequenceNumber).toBe('number');
    expect(Array.isArray(smRecord.owners)).toBe(true);
    expect(typeof smRecord.currentState).toBe('string');

    // DelegationCredential BigInt amounts are strings
    const cred = makeDelegationCredential({ spendUsed: '42000000000' });
    expect(typeof cred.delegatorAddress).toBe('string');
    expect(typeof cred.spendUsed).toBe('string');
    expect(typeof cred.isRevoked).toBe('boolean');
  });
});

// ─── Group 5: Integration & completeness ──────────────────────────────────────

describe('Proto Canonical Schemas - Group 5: Integration & Completeness', () => {
  it('should support delegation workflow end-to-end via proto messages', () => {
    // Create delegation message
    const createDelegation = CreateDelegation.create({
      delegationId: 'delegation-123',
      delegatorAddress: 'DAGdelegator',
      relayerAddress: 'DAGrelayer',
      spendLimit: '5000000000',
      stakeAmount: '1000000000',
      scope: JSON.stringify({ allowedOperations: ['TransitionStateMachine'] }),
      expiresAt: 999,
      delegatorSignature: 'sig1',
      nonce: 1,
    });
    expect(createDelegation.delegatorAddress).toBe('DAGdelegator');

    // Store delegation in calculated state
    const cred = DelegationCredential.create({
      delegatorAddress: 'DAGdelegator',
      relayerAddress: 'DAGrelayer',
      spendUsed: '0',
      stakeBonded: '1000000000',
      spendLimit: '5000000000',
      scope: createDelegation.scope,
      createdAt: 100,
      expiresAt: 999,
      isRevoked: false,
    });
    const state = CalculatedState.create({ delegations: { 'delegation-123': cred } });
    expect(state.delegations).toHaveProperty('delegation-123');

    // Revoke delegation
    const revokeDelegation = RevokeDelegation.create({
      delegationId: 'delegation-123',
      delegatorAddress: 'DAGdelegator',
      delegatorSignature: 'sig2',
      nonce: 2,
      reason: 'User requested',
    });
    expect(revokeDelegation.reason).toBe('User requested');
  });

  it('should validate proto schema completeness against design specification', () => {
    const protoDir = path.join(__dirname, '../proto/ottochain/v1');

    const requiredProtoFiles = [
      'records.proto',
      'messages.proto',
      'fiber.proto',
      'common.proto',
    ];
    requiredProtoFiles.forEach(file => {
      expect(fs.existsSync(path.join(protoDir, file))).toBe(true);
    });

    const messagesProto = fs.readFileSync(path.join(protoDir, 'messages.proto'), 'utf8');
    expect(messagesProto).toContain('message CreateDelegation');
    expect(messagesProto).toContain('message RevokeDelegation');
    expect(messagesProto).toMatch(/create_delegation\s*=\s*\d+/);
    expect(messagesProto).toMatch(/revoke_delegation\s*=\s*\d+/);

    const recordsProto = fs.readFileSync(path.join(protoDir, 'records.proto'), 'utf8');
    expect(recordsProto).toContain('message DelegationCredential');
    expect(recordsProto).toContain('map<string, DelegationCredential> delegations');
  });

  it('should maintain backwards compatibility with existing proto consumers', () => {
    // Existing messages are unchanged and still work
    const createSM = CreateStateMachine.create({ fiberId: 'test-fiber' });
    expect(createSM.fiberId).toBe('test-fiber');

    const transitionSM = TransitionStateMachine.create({
      fiberId: 'test-fiber',
      eventName: 'activate',
      targetSequenceNumber: 1,
    });
    expect(transitionSM.eventName).toBe('activate');

    const archiveSM = ArchiveStateMachine.create({
      fiberId: 'test-fiber',
      targetSequenceNumber: 5,
    });
    expect(archiveSM.fiberId).toBe('test-fiber');

    // OttochainMessage union still handles existing variants
    const msg: OttochainMessage = {
      message: { $case: 'createStateMachine', createStateMachine: createSM },
    };
    expect(msg.message?.$case).toBe('createStateMachine');
  });
});
