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
        participants: null,
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
  });

  describe('normalizeTransitionStateMachine', () => {
    it('adds null for missing eventData', () => {
      const result = normalizeTransitionStateMachine({
        fiberId: 'f1',
        eventName: 'go',
        fiberOrdinal: 5,
      });
      expect(result).toEqual({
        fiberId: 'f1',
        eventName: 'go',
        eventData: null,
        fiberOrdinal: 5,
      });
    });

    it('preserves provided eventData', () => {
      const result = normalizeTransitionStateMachine({
        fiberId: 'f1',
        eventName: 'go',
        eventData: { amount: 100 },
        fiberOrdinal: 5,
      });
      expect(result.eventData).toEqual({ amount: 100 });
    });
  });

  describe('normalizeArchiveStateMachine', () => {
    it('adds null for missing reason', () => {
      const result = normalizeArchiveStateMachine({ fiberId: 'f1' });
      expect(result).toEqual({ fiberId: 'f1', reason: null });
    });

    it('preserves provided reason', () => {
      const result = normalizeArchiveStateMachine({ fiberId: 'f1', reason: 'completed' });
      expect(result.reason).toBe('completed');
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
      expect((result.CreateStateMachine as any).participants).toBeNull();
    });

    it('normalizes TransitionStateMachine wrapper', () => {
      const result = normalizeMessage({
        TransitionStateMachine: { fiberId: 'f1', eventName: 'go', fiberOrdinal: 1 },
      });
      expect(result).toHaveProperty('TransitionStateMachine');
      expect((result.TransitionStateMachine as any).eventData).toBeNull();
    });

    it('normalizes ArchiveStateMachine wrapper', () => {
      const result = normalizeMessage({
        ArchiveStateMachine: { fiberId: 'f1' },
      });
      expect(result).toHaveProperty('ArchiveStateMachine');
      expect((result.ArchiveStateMachine as any).reason).toBeNull();
    });

    it('passes through unknown message types unchanged', () => {
      const msg = { CreateScript: { scriptId: 's1', code: '{}' } };
      expect(normalizeMessage(msg)).toEqual(msg);
    });
  });
});
