import { describe, expect, it } from '@jest/globals';
import { toProtoDefinition, defineFiberApp } from '../../src/schema/fiber-app';
import { contractAgreementDef } from '../../src/apps/contracts';

describe('toProtoDefinition', () => {
  it('strips SDK-only fields', () => {
    const proto = toProtoDefinition(contractAgreementDef);

    // Should NOT have SDK-only fields
    expect(proto).not.toHaveProperty('createSchema');
    expect(proto).not.toHaveProperty('stateSchema');
    expect(proto).not.toHaveProperty('eventSchemas');

    // Should have proto fields
    expect(proto.states).toBeDefined();
    expect(proto.initialState).toBeDefined();
    expect(proto.transitions).toBeDefined();
  });

  it('preserves states with id and isFinal', () => {
    const proto = toProtoDefinition(contractAgreementDef);

    expect(Object.keys(proto.states).length).toBeGreaterThan(0);
    for (const state of Object.values(proto.states)) {
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('isFinal');
      expect(typeof state.id).toBe('string');
      expect(typeof state.isFinal).toBe('boolean');
    }
  });

  it('preserves transitions with required fields', () => {
    const proto = toProtoDefinition(contractAgreementDef);

    expect(proto.transitions.length).toBeGreaterThan(0);
    for (const transition of proto.transitions) {
      expect(transition).toHaveProperty('eventName');
      expect(transition).toHaveProperty('from');
      expect(transition).toHaveProperty('to');
    }
  });

  it('does NOT project FiberAppMetadata onto the wire (keeps logicHash packaging-independent)', () => {
    const proto = toProtoDefinition(contractAgreementDef);

    // FiberAppMetadata (name/app/type/version/description/crossReferences) is SDK packaging info.
    // Projecting it would make the on-chain canonical + the registry logicHash depend on packaging
    // fields, so it is deliberately omitted — the chain `metadata` stays absent (`None`).
    expect(proto.metadata).toBeUndefined();
  });

  it('handles definition without optional fields', () => {
    const minimalDef = defineFiberApp({
      metadata: {
        name: 'minimal',
        app: 'test',
        type: 'minimal',
        version: '1.0.0',
        description: 'Minimal test definition',
      },
      states: {
        INIT: { id: 'INIT', isFinal: false },
        DONE: { id: 'DONE', isFinal: true },
      },
      initialState: 'INIT',
      transitions: [
        {
          eventName: 'complete',
          from: 'INIT',
          to: 'DONE',
        },
      ],
    });

    const proto = toProtoDefinition(minimalDef);

    expect(proto.states).toBeDefined();
    expect(proto.initialState).toBe('INIT');
    expect(proto.transitions).toHaveLength(1);
    expect(proto.metadata).toBeUndefined();
  });

  it('includes transition guards and effects when present', () => {
    const defWithGuards = defineFiberApp({
      metadata: {
        name: 'guarded',
        app: 'test',
        type: 'guarded',
        version: '1.0.0',
        description: 'Definition with guards',
      },
      states: {
        INIT: { id: 'INIT', isFinal: false },
        DONE: { id: 'DONE', isFinal: true },
      },
      initialState: 'INIT',
      transitions: [
        {
          eventName: 'complete',
          from: 'INIT',
          to: 'DONE',
          guard: { '==': [{ var: 'ready' }, true] },
          effect: { merge: [{ var: 'context' }, { completed: true }] },
        },
      ],
    });

    const proto = toProtoDefinition(defWithGuards);

    expect(proto.transitions[0].guard).toEqual({ '==': [{ var: 'ready' }, true] });
    expect(proto.transitions[0].effect).toEqual({
      merge: [{ var: 'context' }, { completed: true }],
    });
  });
});
