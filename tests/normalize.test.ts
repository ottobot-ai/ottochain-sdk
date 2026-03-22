import {
  normalizeCreateStateMachine,
  normalizeTransitionStateMachine,
  normalizeArchiveStateMachine,
  normalizeMessage,
} from '../src/ottochain/normalize';

describe('normalize', () => {
  describe('normalizeCreateStateMachine', () => {
    it('adds explicit nulls for missing optional fields', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
        },
        initialData: { key: 'value' },
      });

      expect(result).toEqual({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false, metadata: null } },
          initialState: 'INIT',
          transitions: [],
          metadata: null,
        },
        initialData: { key: 'value' },
        parentFiberId: null,
      });
    });

    it('preserves provided optional fields', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: true, metadata: { key: 'val' } } },
          initialState: 'INIT',
          transitions: [
            {
              from: 'A',
              to: 'B',
              eventName: 'go',
              guard: { '==': [1, 1] },
              effect: { merge: [{ var: 'state' }, { updated: true }] },
              dependencies: ['uuid-1', 'uuid-2'],
            },
          ],
          metadata: { def: true },
        },
        initialData: {},
        parentFiberId: 'parent-123',
      });

      expect(result.parentFiberId).toBe('parent-123');
      expect((result.definition as any).metadata).toEqual({ def: true });
      const transition = ((result.definition as any).transitions as any[])[0];
      expect(transition.guard).toEqual({ '==': [1, 1] });
      expect(transition.effect).toEqual({ merge: [{ var: 'state' }, { updated: true }] });
      expect(transition.dependencies).toEqual(['uuid-1', 'uuid-2']);
    });

    it('defaults transition dependencies to empty array', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [
            { from: 'A', to: 'B', eventName: 'go', guard: { '==': [1, 1] }, effect: { var: 'state' } },
          ],
        },
        initialData: {},
      });

      const transition = ((result.definition as any).transitions as any[])[0];
      expect(transition.dependencies).toEqual([]);
    });

    it('defaults initialData to empty object', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'f',
        definition: { states: {}, initialState: 'X', transitions: [] },
      });
      expect(result.initialData).toEqual({});
    });

    it('strips FiberAppMetadata from definition.metadata', () => {
      // FiberAppMetadata has 'name' and 'app' fields — should be stripped to null
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
          // This is FiberAppMetadata, not wire format metadata
          metadata: {
            name: 'ContractAgreement',
            app: 'contracts',
            type: 'agreement',
            version: '1.0.0',
            description: 'Two-party agreement with completion attestation',
            crossReferences: {
              proposerIdentityId: { machine: 'identity-agent', description: 'proposer' },
            },
          },
        },
        initialData: {},
      });

      // FiberAppMetadata should be stripped to null for wire format
      expect((result.definition as any).metadata).toBeNull();
    });

    it('preserves simple JSON metadata (not FiberAppMetadata)', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
          // Simple JSON metadata without 'name' and 'app' should pass through
          metadata: { customField: 'value', version: 2 },
        },
        initialData: {},
      });

      expect((result.definition as any).metadata).toEqual({ customField: 'value', version: 2 });
    });
  });

  describe('normalizeTransitionStateMachine', () => {
    it('passes through all required fields', () => {
      const result = normalizeTransitionStateMachine({
        fiberId: 'f1',
        eventName: 'go',
        payload: { amount: 100 },
        targetSequenceNumber: 5,
      });
      expect(result).toEqual({
        fiberId: 'f1',
        eventName: 'go',
        payload: { amount: 100 },
        targetSequenceNumber: 5,
      });
    });

    it('preserves empty object payload', () => {
      const result = normalizeTransitionStateMachine({
        fiberId: 'f1',
        eventName: 'go',
        payload: {},
        targetSequenceNumber: 5,
      });
      expect(result.payload).toEqual({});
    });
  });

  describe('normalizeArchiveStateMachine', () => {
    it('passes through all required fields', () => {
      const result = normalizeArchiveStateMachine({
        fiberId: 'f1',
        targetSequenceNumber: 3,
      });
      expect(result).toEqual({
        fiberId: 'f1',
        targetSequenceNumber: 3,
      });
    });
  });

  describe('normalizeMessage', () => {
    it('normalizes CreateStateMachine wrapper', () => {
      const result = normalizeMessage({
        CreateStateMachine: {
          fiberId: 'f1',
          definition: { states: {}, initialState: 'X', transitions: [] },
          initialData: {},
        },
      });
      expect(result).toHaveProperty('CreateStateMachine');
      expect((result.CreateStateMachine as any).parentFiberId).toBeNull();
      expect('participants' in (result.CreateStateMachine as any)).toBe(false);
    });

    it('normalizes TransitionStateMachine wrapper', () => {
      const result = normalizeMessage({
        TransitionStateMachine: { fiberId: 'f1', eventName: 'go', payload: {}, targetSequenceNumber: 1 },
      });
      expect(result).toHaveProperty('TransitionStateMachine');
      expect((result.TransitionStateMachine as any).payload).toEqual({});
      expect((result.TransitionStateMachine as any).targetSequenceNumber).toBe(1);
    });

    it('normalizes ArchiveStateMachine wrapper', () => {
      const result = normalizeMessage({
        ArchiveStateMachine: { fiberId: 'f1', targetSequenceNumber: 2 },
      });
      expect(result).toHaveProperty('ArchiveStateMachine');
      expect((result.ArchiveStateMachine as any).targetSequenceNumber).toBe(2);
    });

    it('passes through unknown message types unchanged', () => {
      const msg = { CreateScript: { scriptId: 's1', code: '{}' } };
      expect(normalizeMessage(msg)).toEqual(msg);
    });
  });
});
