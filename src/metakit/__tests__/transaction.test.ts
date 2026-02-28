import {
  createStateMachinePayload,
  createScriptPayload,
  createTransitionPayload,
  createArchivePayload,
  createInvokeScriptPayload,
  signTransaction,
  addTransactionSignature,
  getPublicKeyForRegistration,
} from '../transaction.js';
import { generateKeyPair } from '../wallet.js';

describe('transaction helpers', () => {
  describe('createStateMachinePayload', () => {
    it('creates a properly structured create message', () => {
      const result = createStateMachinePayload({
        fiberId: 'test-fiber',
        definition: { states: { CREATED: {} }, initialState: 'CREATED' },
        initialData: { owner: 'DAG123' },
      });
      expect(result).toEqual({
        CreateStateMachine: {
          fiberId: 'test-fiber',
          definition: { states: { CREATED: {} }, initialState: 'CREATED' },
          initialData: { owner: 'DAG123' },
        },
      });
    });

    it('defaults initialData to empty object', () => {
      const result = createStateMachinePayload({
        fiberId: 'f',
        definition: { states: {} },
      });
      expect(result.CreateStateMachine.initialData).toEqual({});
    });

    it('includes parentFiberId when provided', () => {
      const result = createStateMachinePayload({
        fiberId: 'child',
        definition: {},
        parentFiberId: 'parent',
      });
      expect(result.CreateStateMachine.parentFiberId).toBe('parent');
    });

    it('omits parentFiberId when not provided', () => {
      const result = createStateMachinePayload({
        fiberId: 'f',
        definition: {},
      });
      expect(result.CreateStateMachine).not.toHaveProperty('parentFiberId');
    });
  });

  describe('createScriptPayload', () => {
    it('creates a properly structured script message', () => {
      const result = createScriptPayload({
        fiberId: 'script-fiber',
        scriptProgram: { methods: { inc: { '+': [{ var: 'state.value' }, 1] } } },
        initialState: { value: 0 },
        accessControl: { type: 'open' },
      });
      expect(result).toEqual({
        CreateScript: {
          fiberId: 'script-fiber',
          scriptProgram: { methods: { inc: { '+': [{ var: 'state.value' }, 1] } } },
          initialState: { value: 0 },
          accessControl: { type: 'open' },
        },
      });
    });

    it('defaults accessControl to open', () => {
      const result = createScriptPayload({
        fiberId: 'f',
        scriptProgram: {},
      });
      expect(result.CreateScript.accessControl).toEqual({ type: 'open' });
    });

    it('defaults initialState to null', () => {
      const result = createScriptPayload({
        fiberId: 'f',
        scriptProgram: {},
      });
      expect(result.CreateScript.initialState).toBeNull();
    });

    it('accepts array initialState', () => {
      const result = createScriptPayload({
        fiberId: 'f',
        scriptProgram: {},
        initialState: [1, 2, 3],
      });
      expect(result.CreateScript.initialState).toEqual([1, 2, 3]);
    });
  });

  describe('createTransitionPayload', () => {
    it('creates a properly structured transition message', () => {
      const result = createTransitionPayload({
        fiberId: 'test-fiber',
        eventName: 'activate',
        payload: { key: 'value' },
        targetSequenceNumber: 5,
      });
      expect(result).toEqual({
        TransitionStateMachine: {
          fiberId: 'test-fiber',
          eventName: 'activate',
          payload: { key: 'value' },
          targetSequenceNumber: 5,
        },
      });
    });

    it('defaults payload to empty object', () => {
      const result = createTransitionPayload({
        fiberId: 'test-fiber',
        eventName: 'activate',
        targetSequenceNumber: 0,
      });
      expect(result.TransitionStateMachine.payload).toEqual({});
    });
  });

  describe('createArchivePayload', () => {
    it('creates a properly structured archive message', () => {
      const result = createArchivePayload({
        fiberId: 'test-fiber',
        targetSequenceNumber: 3,
      });
      expect(result).toEqual({
        ArchiveStateMachine: {
          fiberId: 'test-fiber',
          targetSequenceNumber: 3,
        },
      });
    });
  });

  describe('createInvokeScriptPayload', () => {
    it('creates a properly structured invoke script message', () => {
      const result = createInvokeScriptPayload({
        fiberId: 'test-fiber',
        method: 'compute',
        args: { x: 1 },
        targetSequenceNumber: 2,
      });
      expect(result).toEqual({
        InvokeScript: {
          fiberId: 'test-fiber',
          method: 'compute',
          args: { x: 1 },
          targetSequenceNumber: 2,
        },
      });
    });

    it('defaults args to empty object', () => {
      const result = createInvokeScriptPayload({
        fiberId: 'f',
        method: 'm',
        targetSequenceNumber: 0,
      });
      expect(result.InvokeScript.args).toEqual({});
    });
  });

  describe('signTransaction', () => {
    it('returns a Signed object with value and proofs', async () => {
      const keyPair = generateKeyPair();
      const message = createTransitionPayload({
        fiberId: 'test',
        eventName: 'activate',
        targetSequenceNumber: 0,
      });
      const signed = await signTransaction(message, keyPair.privateKey);
      expect(signed.value).toEqual(message);
      expect(signed.proofs).toHaveLength(1);
      expect(signed.proofs[0]).toHaveProperty('id');
      expect(signed.proofs[0]).toHaveProperty('signature');
      expect(signed.proofs[0].id).toHaveLength(128);
    });
  });

  describe('addTransactionSignature', () => {
    it('adds a second proof to existing signed object', async () => {
      const kp1 = generateKeyPair();
      const kp2 = generateKeyPair();
      const message = createTransitionPayload({
        fiberId: 'test',
        eventName: 'activate',
        targetSequenceNumber: 0,
      });
      const signed = await signTransaction(message, kp1.privateKey);
      const multiSigned = await addTransactionSignature(signed, kp2.privateKey);
      expect(multiSigned.proofs).toHaveLength(2);
      expect(multiSigned.proofs[0].id).not.toEqual(multiSigned.proofs[1].id);
      expect(multiSigned.value).toEqual(message);
    });
  });

  describe('getPublicKeyForRegistration', () => {
    it('returns 128-char public key without prefix', () => {
      const keyPair = generateKeyPair();
      const pubId = getPublicKeyForRegistration(keyPair.privateKey);
      expect(pubId).toHaveLength(128);
      expect(pubId).not.toMatch(/^04/);
    });
  });
});
