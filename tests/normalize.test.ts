import {
  normalizeCreateStateMachine,
  normalizeTransitionStateMachine,
  normalizeArchiveStateMachine,
  normalizeMessage,
} from '../src/ottochain/normalize';

// Recursively assert there are no `null` object-field values anywhere in `value`.
// (Array elements may legitimately be null; only object fields are checked,
// mirroring the server's dropNulls semantics.)
function expectNoNullFields(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(expectNoNullFields);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [, v] of Object.entries(value as Record<string, unknown>)) {
      expect(v).not.toBeNull();
      expectNoNullFields(v);
    }
  }
}

describe('normalize', () => {
  describe('normalizeCreateStateMachine', () => {
    it('omits absent optional fields (no explicit nulls) to match rc.9 server', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
        },
        initialData: { key: 'value' },
      });

      // Optional fields are OMITTED, not emitted as null.
      expect(result).toEqual({
        fiberId: 'test-fiber',
        definition: {
          states: { INIT: { id: 'INIT', isFinal: false } },
          initialState: 'INIT',
          transitions: [],
        },
        initialData: { key: 'value' },
      });
      expect(result).not.toHaveProperty('parentFiberId');
      expect(result.definition).not.toHaveProperty('metadata');
      expect((result.definition as any).states.INIT).not.toHaveProperty('metadata');
      expectNoNullFields(result);
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

    it('defaults transition dependencies to empty array (kept, not stripped)', () => {
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

    it('strips FiberAppMetadata from definition.metadata (omitted, not null)', () => {
      // FiberAppMetadata has 'name' and 'app' fields — should be dropped entirely.
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

      // FiberAppMetadata is omitted from wire format (not present, not null).
      expect(result.definition).not.toHaveProperty('metadata');
      expectNoNullFields(result);
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

    it('strips null state metadata so canonical bytes match the server', () => {
      const result = normalizeCreateStateMachine({
        fiberId: 'f',
        definition: {
          states: {
            ACTIVE: { id: 'ACTIVE', isFinal: false, metadata: null },
            DONE: { id: 'DONE', isFinal: true, metadata: null },
          },
          initialState: 'ACTIVE',
          transitions: [],
          metadata: null,
        },
        initialData: {},
        parentFiberId: null,
      });

      expect((result.definition as any).states.ACTIVE).toEqual({ id: 'ACTIVE', isFinal: false });
      expect((result.definition as any).states.DONE).toEqual({ id: 'DONE', isFinal: true });
      expect(result.definition).not.toHaveProperty('metadata');
      expect(result).not.toHaveProperty('parentFiberId');
      expectNoNullFields(result);
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

    it('strips null fields nested in payload', () => {
      const result = normalizeTransitionStateMachine({
        fiberId: 'f1',
        eventName: 'go',
        payload: { keep: 1, drop: null },
        targetSequenceNumber: 5,
      });
      expect(result.payload).toEqual({ keep: 1 });
      expectNoNullFields(result);
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
      // parentFiberId is omitted (rc.9 server drops nulls)
      expect((result.CreateStateMachine as any)).not.toHaveProperty('parentFiberId');
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

    it('strips nulls from unknown message types (e.g. CreateScript initialState: null)', () => {
      const msg = { CreateScript: { fiberId: 's1', scriptProgram: {}, initialState: null, accessControl: { type: 'open' } } };
      const result = normalizeMessage(msg);
      expect((result.CreateScript as any)).not.toHaveProperty('initialState');
      expect((result.CreateScript as any).accessControl).toEqual({ type: 'open' });
      expectNoNullFields(result);
    });
  });
});
