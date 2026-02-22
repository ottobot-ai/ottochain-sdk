/**
 * Agent Profile — State Machine Definition
 *
 * States: registered → active ↔ suspended → deactivated
 *
 * Note: uses plain string from/to (not proto { value } wrappers)
 * to match the existing agent-identity state machine convention.
 */

export interface AgentProfileTransition {
  from: string;
  to: string;
  eventName: string;
  guard: unknown | null;
  effect: unknown | null;
}

export interface AgentProfileStateMachine {
  states: Record<string, { isFinal: boolean; metadata?: unknown | null }>;
  initialState: string;
  transitions: AgentProfileTransition[];
  metadata?: Record<string, unknown>;
}

export function getAgentStateMachineDefinition(): AgentProfileStateMachine {
  return {
    metadata: {
      name: 'AgentProfile',
      description: 'Decentralized agent identity with reputation and lifecycle management',
      version: '1.0.0',
    },
    states: {
      registered:   { isFinal: false, metadata: null },
      active:       { isFinal: false, metadata: null },
      suspended:    { isFinal: false, metadata: null },
      deactivated:  { isFinal: true,  metadata: null },
    },
    initialState: 'registered',
    transitions: [
      { from: 'registered',  to: 'active',      eventName: 'activate',   guard: null, effect: null },
      { from: 'active',      to: 'suspended',   eventName: 'suspend',    guard: null, effect: null },
      { from: 'suspended',   to: 'active',      eventName: 'reactivate', guard: null, effect: null },
      { from: 'active',      to: 'deactivated', eventName: 'deactivate', guard: null, effect: null },
      { from: 'suspended',   to: 'deactivated', eventName: 'deactivate', guard: null, effect: null },
    ],
  };
}
