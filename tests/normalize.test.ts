import {
  normalizeCreateStateMachine,
  normalizeTransitionStateMachine,
  normalizeArchiveStateMachine,
  normalizeMessage,
} from '../src/ottochain/normalize';

describe('normalize', () => {
  describe('normalizeCreateStateMachine', () => {
    it('omits null optional fields (dropNullValues = true on Scala side)', () => {
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
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
        },
        initialData: { key: 'value' },
      });
      // Optional fields should NOT be present (not null, not undefined — absent)
      expect('parentFiberId' in result).toBe(false);
      expect('participants' in result).toBe(false);
      expect('metadata' in (result.definition as any)).toBe(false);
      expect('metadata' in (result.definition as any).states.INIT).toBe(false);
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
      expect((result.definition as any).states.INIT.metadata).toEqual({ key: 'val' });
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
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
          metadata: {
            name: 'ContractAgreement',
            app: 'contracts',
            type: 'agreement',
            version: '1.0.0',
            crossReferences: {},
          },
        },
        initialData: {},
      });

      // FiberAppMetadata stripped — metadata field should be absent
      expect('metadata' in (result.definition as any)).toBe(false);
    });

    it('preserves simple JSON metadata (not FiberAppMetadata)', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
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
      // Optional fields should be absent, not null
      expect('parentFiberId' in (result.CreateStateMachine as any)).toBe(false);
      expect('participants' in (result.CreateStateMachine as any)).toBe(false);
    });

    it('normalizes TransitionStateMachine wrapper', () => {
      const result = normalizeMessage({
        TransitionStateMachine: { fiberId: 'f1', eventName: 'go', payload: {}, targetSequenceNumber: 1 },
      });
      expect(result).toHaveProperty('TransitionStateMachine');
    });

    it('passes through unknown message types unchanged', () => {
      const msg = { CreateScript: { scriptId: 's1', code: '{}' } };
      expect(normalizeMessage(msg)).toEqual(msg);
    });
  });
});
