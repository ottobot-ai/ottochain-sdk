# Specification: SDK Fiber State Subscription

**Status:** Specification — ready for TDD  
**Author:** @think  
**Feasibility:** @research ✅ (confirmed HIGH, 2026-02-20)  
**Card:** [SDK: Fiber State Subscription](https://trello.com/c/699633067) — Trello  
**Target file:** `src/ottochain/metagraph-client.ts`  
**Estimated size:** S/M — ~60 lines implementation, 10+ tests

---

## 1. Problem

SDK consumers need to react to fiber state changes. Currently, the only option is:

```typescript
// Boilerplate every consumer must write today:
const interval = setInterval(async () => {
  const fiber = await client.getStateMachine(fiberId);
  if (fiber?.currentState !== lastState) {
    // handle change...
  }
}, 2000);
// Must remember to clearInterval — memory leak if forgotten
```

This pattern is error-prone and repeated across applications, E2E tests, and monitoring tools. `subscribeFiberState` provides a well-designed, leak-safe primitive.

---

## 2. Prior Art in Codebase

Three existing polling patterns all converge on the same approach, validating the design:

| Source | Pattern | Notes |
|--------|---------|-------|
| `e2e.test.ts` `waitForFiber()` | Polls ML0 `/state-machines/{fiberId}` every 2s | **Direct prior art** — `subscribeFiberState` makes this permanent with cleanup |
| `e2e.test.ts` `waitForState()` | Same poll + state name comparison | Shows state-name-based comparison in use |
| `metagraph.ts` `waitForSequence()` | Polls sequenceNumber on DL1 onchain | Confirms `sequenceNumber` as canonical change primitive |
| `poller.ts` (indexer) | Polls `/checkpoint` every 60s, compares ordinals | Shows ordinal-based snapshot detection |

---

## 3. API Contract

### 3.1 Types

```typescript
// src/ottochain/metagraph-client.ts

/**
 * Options for subscribeFiberState.
 */
export interface SubscribeOptions {
  /**
   * Polling interval in milliseconds.
   * @default 2000
   */
  pollIntervalMs?: number;

  /**
   * Called when a poll fails (network error, timeout, etc.).
   * The subscription continues polling after an error.
   * @default (e) => console.warn('[subscribeFiberState]', e)
   */
  onError?: (error: Error) => void;

  /**
   * If true, fire the callback immediately after the first poll
   * even if no previous state exists (i.e., current vs. null).
   * Set false to suppress the initial callback and only fire on changes.
   * @default true
   */
  fireImmediately?: boolean;
}

/**
 * Callback invoked when fiber state is first observed or changes.
 *
 * @param current - Current fiber state, or null if fiber not found
 * @param previous - Previous fiber state, or null on first callback
 */
export type FiberStateCallback = (
  current: StateMachineFiberRecord | null,
  previous: StateMachineFiberRecord | null
) => void;

/**
 * Unsubscribe function. Stops polling immediately and prevents
 * any further callbacks from firing. Idempotent.
 */
export type Unsubscribe = () => void;
```

### 3.2 Method Signature

```typescript
class MetagraphClient {
  // ... existing methods ...

  /**
   * Subscribe to state changes for a state machine fiber.
   *
   * Polls ML0 at the configured interval, comparing sequenceNumber to detect
   * changes. Fires the callback with (current, previous) on change or on the
   * first poll (if fireImmediately is true, which is the default).
   *
   * ML0 consistency guarantee: ML0 reads from snapshot-level CalculatedState
   * (via checkpointService.get). State is never mid-transition — each poll
   * returns a complete, committed fiber state.
   *
   * Implementation uses setTimeout recursion (not setInterval) to ensure
   * polls do not overlap if a request takes longer than pollIntervalMs.
   *
   * @param fiberId - UUID of the state machine fiber to watch
   * @param callback - Called on state change or initial observation
   * @param options - Polling configuration
   * @returns Unsubscribe function — call to stop polling and prevent further callbacks
   *
   * @example
   * ```typescript
   * const unsub = client.subscribeFiberState(fiberId, (current, prev) => {
   *   if (current?.currentState === 'Completed') {
   *     console.log('Fiber completed!');
   *     unsub(); // stop watching
   *   }
   * }, { pollIntervalMs: 1000 });
   *
   * // Clean up on component unmount / process exit:
   * unsub();
   * ```
   */
  subscribeFiberState(
    fiberId: string,
    callback: FiberStateCallback,
    options?: SubscribeOptions
  ): Unsubscribe;
}
```

---

## 4. Authoritative Implementation

The following is the reference implementation. @code should write failing tests FIRST, then validate this implementation makes them pass.

```typescript
subscribeFiberState(
  fiberId: string,
  callback: FiberStateCallback,
  options?: SubscribeOptions
): Unsubscribe {
  const intervalMs = options?.pollIntervalMs ?? 2000;
  const onError = options?.onError ?? ((e: Error) => console.warn('[subscribeFiberState]', e));
  const fireImmediately = options?.fireImmediately ?? true;

  let previous: StateMachineFiberRecord | null = null;
  let lastSeqNum: number | null = null;
  let active = true;

  const poll = async (): Promise<void> => {
    if (!active) return;

    try {
      const current = await this.getStateMachine(fiberId);
      const currentSeqNum = current?.sequenceNumber ?? null;

      if (lastSeqNum === null) {
        // First poll
        lastSeqNum = currentSeqNum;
        previous = current;
        if (fireImmediately) {
          callback(current, null);
        }
      } else if (currentSeqNum !== lastSeqNum) {
        // State changed — sequenceNumber is different
        const prev = previous;
        previous = current;
        lastSeqNum = currentSeqNum;
        callback(current, prev);
      }
      // else: no change, no callback
    } catch (err) {
      try {
        onError(err instanceof Error ? err : new Error(String(err)));
      } catch {
        // Swallow errors from onError handler itself
      }
    } finally {
      // Schedule next poll ONLY if still active
      // setTimeout recursion prevents overlapping polls when requests are slow
      if (active) {
        setTimeout(poll, intervalMs);
      }
    }
  };

  // Start the first poll asynchronously (does not block the caller)
  void poll();

  // Return unsubscribe — sets active=false, preventing any further polls
  return () => {
    active = false;
  };
}
```

### 4.1 Key Design Decisions

**`setTimeout` recursion, NOT `setInterval`**
- `setInterval` fires on a wall-clock schedule regardless of whether the previous poll completed
- If a request takes 3s and the interval is 2s, `setInterval` queues a second poll while the first is still running
- `setTimeout` recursion schedules the NEXT poll only after the CURRENT one finishes — no overlap ever possible
- This is the correct pattern for async polling in JavaScript

**`active` flag (not timer handle)**
- `clearTimeout`/`clearInterval` requires capturing the timer handle and handling edge cases
- `active = false` is simpler, handles the edge case where `unsubscribe()` is called DURING an async poll
- If `unsubscribe()` is called while `await getStateMachine()` is in-flight, the poll will complete but not fire the callback and will not schedule the next poll

**`sequenceNumber` as change key (not state name)**
- State name comparison misses: same-state re-entries with different data, trigger-fired callbacks, emitted events
- `sequenceNumber` increments on every successful fiber transition — it is the canonical fiber ordinal
- Two fibers with the same `currentState` name but different `sequenceNumber` have genuinely different states

**`previous` tracked separately from `lastSeqNum`**
- Allows passing the full previous record to the callback without re-fetching
- Handles null→fiber, fiber→null, and fiber→fiber transitions

**`null` for missing fiber (not throw)**
- ML0 returns `200 + JSON null` when fiber doesn't exist (NOT 404)
- `getStateMachine()` already returns `null` for this case
- The subscription treats null as a valid state: fiber-not-found is observable
- This means subscriptions can be created BEFORE the fiber exists — useful for submit-then-watch patterns

---

## 5. Behavior Table (Error & Edge Cases)

| Scenario | Behavior |
|----------|----------|
| First poll, fiber exists, `fireImmediately=true` | `callback(fiber, null)` fired |
| First poll, fiber exists, `fireImmediately=false` | No callback; `lastSeqNum` set; wait for change |
| First poll, fiber not found (null) | `callback(null, null)` if `fireImmediately=true`; polling continues |
| Poll N: same `sequenceNumber` as poll N-1 | No callback; no state update |
| Poll N: different `sequenceNumber` | `callback(current, previous)` fired |
| Fiber transitions to `Archived` | `callback(archivedRecord, prevRecord)` fired; polling continues (no auto-stop) |
| Fiber transitions from existing to null | `callback(null, prevRecord)` fired; polling continues |
| Network error during poll | `onError(error)` called; polling continues; no callback |
| `onError` handler itself throws | Error swallowed; polling continues |
| `callback` throws | Error propagates and is CAUGHT by the `try/catch`; `onError` is called with the error; polling continues |
| `unsubscribe()` called before first poll fires | `active=false`; poll returns immediately; no callbacks ever |
| `unsubscribe()` called during `await getStateMachine()` | Poll completes; `active=false` checked in `finally`; callback NOT fired; no next poll scheduled |
| `unsubscribe()` called twice or more | Idempotent — `active` was already false, no effect |
| `pollIntervalMs` not specified | Defaults to 2000ms |
| `fireImmediately` not specified | Defaults to `true` |

---

## 6. Utility Helper: `waitForState`

A synchronous-feeling utility that can be built directly on top of `subscribeFiberState`. Include in the spec as an example, but this helper should be exported from the SDK as well:

```typescript
/**
 * Wait until a fiber reaches a specific state, with timeout.
 *
 * Returns the final fiber record, or null if timeout exceeded.
 *
 * Built on subscribeFiberState — no new polling infrastructure needed.
 *
 * @example
 * ```typescript
 * const result = await client.waitForState(fiberId, 'Completed', 30000);
 * if (!result) throw new Error('Timeout waiting for completion');
 * ```
 */
async waitForState(
  fiberId: string,
  targetState: string,
  timeoutMs: number = 30000
): Promise<StateMachineFiberRecord | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve(null);
    }, timeoutMs);

    const unsub = this.subscribeFiberState(fiberId, (current) => {
      if (current?.currentState === targetState) {
        clearTimeout(timer);
        unsub();
        resolve(current);
      }
    }, { fireImmediately: true });
  });
}
```

**Acceptance criteria for `waitForState`:**
- Returns the fiber record when target state is reached
- Returns `null` on timeout (does not throw)
- Calls `unsub()` on both success and timeout (no leak)
- Works correctly if fiber is already in target state on first poll

---

## 7. Test Suite Requirements

### 7.1 Unit Tests (mock `getStateMachine`)

```
TEST FILE: src/ottochain/__tests__/subscribe-fiber-state.test.ts

[Group 1: Core callback behavior]
TEST: "fires callback immediately with current state on first poll"
  - Mock getStateMachine → returns fiber with seqNum=1
  - Call subscribeFiberState with default options
  - Assert callback called with (fiber, null)

TEST: "does NOT fire initial callback when fireImmediately=false"
  - Mock returns fiber seqNum=1
  - Subscribe with { fireImmediately: false }
  - After first poll: assert no callback
  - Mock returns fiber seqNum=2 on next poll
  - Assert callback called with (fiber2, fiber1)

TEST: "does NOT fire callback when sequenceNumber unchanged"
  - Mock always returns same seqNum=1
  - After 3 polls: assert callback called exactly once (initial)

TEST: "fires callback when sequenceNumber changes"
  - Mock: poll 1 → seqNum=1, poll 2 → seqNum=2
  - Assert callback called twice total: (fiber1, null) then (fiber2, fiber1)

TEST: "passes correct (current, previous) values"
  - Mock: poll 1 → fiber A, poll 2 → fiber B, poll 3 → fiber C
  - Assert 3 callback calls: (A,null), (B,A), (C,B)

[Group 2: Missing fiber]
TEST: "handles fiber not found — 200+null"
  - Mock getStateMachine returns null
  - Assert callback called with (null, null)
  - Assert polling continues (subsequent polls happen)

TEST: "fiber appears after initially not found"
  - Mock: poll 1 → null, poll 2 → fiber seqNum=1
  - Assert callbacks: (null, null) then (fiber, null)
  - Note: seqNum comparison: null !== 1, so second callback fires

[Group 3: Cleanup]
TEST: "unsubscribe stops polling immediately"
  - Subscribe and immediately unsubscribe
  - Assert no callbacks fired after unsubscribe

TEST: "unsubscribe during active poll is safe"
  - Make getStateMachine delay (return after 100ms)
  - Call unsubscribe while poll is in-flight
  - Assert callback NOT fired after unsubscribe
  - Assert no further polls scheduled

TEST: "unsubscribe is idempotent"
  - const unsub = subscribeFiberState(...)
  - unsub(); unsub(); unsub();
  - No errors thrown

[Group 4: Error handling]
TEST: "network error calls onError, polling continues"
  - Mock: poll 1 → throws Error, poll 2 → returns fiber
  - Assert onError called once (for poll 1)
  - Assert callback called (for poll 2)

TEST: "callback error is caught and reported via onError"
  - Callback that throws on first invocation
  - Assert onError called with the thrown error
  - Assert second poll still fires

TEST: "default onError does not crash (console.warn)"
  - Mock throws Error
  - No onError provided
  - Assert console.warn called; no unhandled rejection

[Group 5: Timing]
TEST: "uses setTimeout recursion, not setInterval"
  - Spy on setTimeout and setInterval
  - After subscribing: assert setInterval NOT called; setTimeout called
  - After first poll completes: assert setTimeout called again

TEST: "custom pollIntervalMs is passed to setTimeout"
  - Subscribe with { pollIntervalMs: 500 }
  - Spy on setTimeout
  - Assert setTimeout called with delay=500
```

### 7.2 Integration Test (live ML0 — run in E2E suite)

```
TEST: "subscribeFiberState detects real state transition end-to-end"
  - Create fiber via client.postData(CreateStateMachine(...))
  - Subscribe to fiberId
  - Submit TransitionStateMachine event
  - Assert callback fires with updated sequenceNumber within 30s
  - Unsubscribe
```

### 7.3 `waitForState` Unit Tests

```
TEST: "resolves when target state reached"
TEST: "returns null on timeout"
TEST: "calls unsubscribe on success (no leak)"
TEST: "calls unsubscribe on timeout (no leak)"
TEST: "resolves immediately if already in target state"
```

---

## 8. Exports

The following must be exported from `src/ottochain/index.ts`:

```typescript
// New types
export type { SubscribeOptions, FiberStateCallback, Unsubscribe } from './metagraph-client.js';
```

The `subscribeFiberState` and `waitForState` methods are exported as class methods on the existing `MetagraphClient` export — no additional export needed.

---

## 9. Acceptance Criteria

- [ ] `MetagraphClient.subscribeFiberState()` implemented per §4
- [ ] `MetagraphClient.waitForState()` implemented per §6
- [ ] All 15 unit tests in §7.1 and 5 unit tests in §7.3 pass
- [ ] `SubscribeOptions`, `FiberStateCallback`, `Unsubscribe` types exported
- [ ] Implementation uses `setTimeout` recursion (NOT `setInterval`) — verifiable via test in §7.1 Group 5
- [ ] `unsubscribe` is idempotent — test proves no double-call errors
- [ ] `callback` errors are caught and routed to `onError` — not swallowed silently
- [ ] No TypeScript errors (`tsc --strict`)
- [ ] E2E integration test passes against live cluster

---

## 10. Out of Scope (Future Cards)

- **`subscribeScriptState`** — same pattern for script oracle fibers; defer to separate card
- **Multi-fiber batching** — single `/checkpoint` poll for N fibers; optimization for high-fan-out monitoring
- **SSE push** — requires new ottochain-services infrastructure; out of scope
- **Auto-stop on Archived** — intentionally NOT implemented; consumers choose their own lifecycle policy
- **Reconnect with backoff** — `onError` provides hook for consumers to implement their own backoff; SDK does not impose a policy

---

## References

- Prior art: `waitForFiber()` / `waitForState()` in `packages/bridge/test/e2e.test.ts`
- Prior art: `waitForSequence()` in `packages/bridge/src/metagraph.ts`
- ML0 source: `modules/data_l1/src/main/scala/xyz/kd5ujc/data_l1/DataL1CustomRoutes.scala`
- @think requirements: Trello card comment, 2026-02-20 14:38 CST
- @research feasibility: Trello card comment, 2026-02-20 14:45 CST
