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
          transitions: [{ from: 'A', eventName: 'go', to: 'B', guard: 'someGuard', actions: ['act1'], metadata: { m: 1 } }],
          metadata: { def: true },
        },
        initialData: {},
        parentFiberId: 'parent-123',
      });

      expect(result.parentFiberId).toBe('parent-123');
      expect((result.definition as any).metadata).toEqual({ def: true });
      const transition = ((result.definition as any).transitions as any[])[0];
      expect(transition.guard).toBe('someGuard');
      expect(transition.actions).toEqual(['act1']);
      expect(transition.metadata).toEqual({ m: 1 });
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
