/**
 * Fiber App Definition Schema
 * 
 * TypeScript-first definitions for fiber apps. This is the source of truth —
 * no JSON, no code generation. Import types directly.
 */

// =============================================================================
// Schema Field Types
// =============================================================================

export type SchemaFieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'address'    // DAG address
  | 'uri'
  | 'timestamp'  // ISO 8601
  | 'uuid'
  | 'hash'       // hex-encoded
  | 'object'
  | 'array';

export interface SchemaField {
  type: SchemaFieldType;
  description?: string;
  default?: unknown;
  
  // Constraints
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: readonly string[];
  pattern?: string;
  
  // Annotations
  immutable?: boolean;  // Cannot change after creation
  computed?: boolean;   // Managed by effects, not user-settable
  indexed?: boolean;    // Hint for indexer
  
  // Nested types
  items?: SchemaField | { $ref: string };
  properties?: Record<string, SchemaField>;
  required?: readonly string[];
}

export interface SchemaDefinition {
  type: 'object';
  required?: readonly string[];
  properties: Record<string, SchemaField>;
}

// =============================================================================
// Event Schema
// =============================================================================

export interface EventSchema {
  description?: string;
  required?: readonly string[];
  properties?: Record<string, SchemaField>;
}

// =============================================================================
// State Machine Core (matches metagraph)
// =============================================================================

export interface StateDefinition {
  id: string;
  isFinal: boolean;
  metadata?: Record<string, unknown> | null;
}

export type JsonLogicRule = Record<string, unknown>;

export interface Transition<TState extends string = string, TEvent extends string = string> {
  from: TState;
  to: TState;
  eventName: TEvent;
  guard?: JsonLogicRule;
  effect?: JsonLogicRule;
  dependencies?: readonly string[];
}

// =============================================================================
// Fiber App Definition
// =============================================================================

export interface FiberAppMetadata {
  name: string;
  app: string;
  type: string;
  version: string;
  description?: string;
}

export interface FiberAppDefinition<
  TState extends string = string,
  TEvent extends string = string
> {
  metadata: FiberAppMetadata;
  
  /** Schema for fiber creation inputs (user-provided) */
  createSchema?: {
    required?: readonly string[];
    properties: Record<string, SchemaField>;
  };
  
  /** Schema for full fiber state (includes computed fields) */
  stateSchema?: {
    properties: Record<string, SchemaField>;
  };
  
  /** Schema for each event's payload */
  eventSchemas?: Record<TEvent, EventSchema>;
  
  /** Reusable type definitions */
  definitions?: Record<string, SchemaDefinition>;
  
  /** State machine states */
  states: Record<TState, StateDefinition>;
  
  /** Initial state */
  initialState: TState;
  
  /** State transitions */
  transitions: readonly Transition<TState, TEvent>[];
}

// =============================================================================
// Helper: defineFiberApp
// =============================================================================

/**
 * Define a fiber app with full type inference.
 * 
 * @example
 * ```ts
 * const agentDef = defineFiberApp({
 *   metadata: { name: 'Agent', app: 'identity', type: 'agent', version: '1.0.0' },
 *   states: {
 *     REGISTERED: { id: 'REGISTERED', isFinal: false },
 *     ACTIVE: { id: 'ACTIVE', isFinal: false },
 *   },
 *   initialState: 'REGISTERED',
 *   transitions: [
 *     { from: 'REGISTERED', to: 'ACTIVE', eventName: 'activate' },
 *   ],
 * });
 * ```
 */
export function defineFiberApp<
  TState extends string,
  TEvent extends string,
  TDef extends FiberAppDefinition<TState, TEvent>
>(definition: TDef): TDef {
  // Runtime validation could go here
  return definition;
}

// =============================================================================
// Utilities
// =============================================================================

/** Extract state names from a fiber app definition */
export type StateNames<T extends FiberAppDefinition> = keyof T['states'] & string;

/** Extract event names from a fiber app definition */
export type EventNames<T extends FiberAppDefinition> = T['transitions'][number]['eventName'];

/** Get valid transitions from a given state */
export function getTransitionsFrom<T extends FiberAppDefinition>(
  def: T,
  state: StateNames<T>
): T['transitions'][number][] {
  return def.transitions.filter(t => t.from === state) as T['transitions'][number][];
}

/** Get valid event names from a given state */
export function getEventsFrom<T extends FiberAppDefinition>(
  def: T,
  state: StateNames<T>
): string[] {
  return getTransitionsFrom(def, state).map(t => t.eventName);
}

/** Check if a state is final */
export function isFinalState<T extends FiberAppDefinition>(
  def: T,
  state: StateNames<T>
): boolean {
  return def.states[state]?.isFinal ?? false;
}

/** Convert definition to plain JSON (for serialization) */
export function toJSON<T extends FiberAppDefinition>(def: T): object {
  return JSON.parse(JSON.stringify(def));
}
