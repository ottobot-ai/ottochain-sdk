/**
 * TDD Tests for SDK Fiber State Subscription
 * 
 * These tests define the expected behavior for the fiber state subscription system
 * as described in the card requirements and context from @think.
 * 
 * Card: SDK: Fiber State Subscription (#699633067429a9ada0267d75)
 * 
 * @group tdd
 * @group fiber-subscription
 * @group sdk
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/testing-library/jest-dom';

// Types that should be implemented based on the specification
interface SubscribeOptions {
  interval?: number;           // Polling interval in ms, default 1000
  fireImmediately?: boolean;   // Fire callback immediately with current state
  onError?: (error: Error) => void; // Error callback for network issues
}

interface FiberState {
  fiberId: string;
  currentState: { value: string };
  stateData: Record<string, any>;
  sequenceNumber: number;      // Key field for change detection
  status: 'ACTIVE' | 'ARCHIVED';
  isFinal: boolean;
}

interface MetagraphClient {
  subscribeFiberState(
    fiberId: string, 
    callback: (state: FiberState | null) => void, 
    options?: SubscribeOptions
  ): () => void; // Returns unsubscribe function

  waitForState(
    fiberId: string,
    stateName: string,
    timeoutMs?: number
  ): Promise<FiberState>;

  // Existing methods that subscription depends on
  getStateMachine(fiberId: string): Promise<FiberState | null>;
}

type StateCallback = (state: FiberState | null) => void;
type UnsubscribeFunction = () => void;

describe('SDK Fiber State Subscription: Core API', () => {
  let mockClient: MetagraphClient;
  let mockGetStateMachine: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.useFakeTimers();
    
    // Mock the existing getStateMachine method
    mockGetStateMachine = jest.fn();
    
    mockClient = {
      getStateMachine: mockGetStateMachine,
      subscribeFiberState: jest.fn(),
      waitForState: jest.fn()
    } as any;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('subscribeFiberState Method', () => {
    it('should be available on MetagraphClient', () => {
      // ARRANGE: Client instance
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      
      // ACT & ASSERT: Method exists
      expect(typeof client.subscribeFiberState).toBe('function');
    });

    it('should return an unsubscribe function', () => {
      // ARRANGE: Client and subscription
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      const callback = jest.fn();
      
      // ACT: Subscribe to fiber state
      const unsubscribe = client.subscribeFiberState('test-fiber-123', callback);
      
      // ASSERT: Returns function
      expect(typeof unsubscribe).toBe('function');
    });

    it('should start polling immediately when subscribed', async () => {
      // ARRANGE: Mock client and fiber state
      const testFiber: FiberState = {
        fiberId: 'test-fiber-123',
        currentState: { value: 'active' },
        stateData: { owner: 'DAGuser123...' },
        sequenceNumber: 5,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValue(testFiber);
      const callback = jest.fn();
      
      // ACT: Subscribe
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      
      // Fast-forward first poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promises resolve
      
      // ASSERT: getStateMachine called
      expect(mockGetStateMachine).toHaveBeenCalledWith('test-fiber-123');
      expect(mockGetStateMachine).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should fire callback with current state on first poll', async () => {
      // ARRANGE: Mock fiber state
      const testFiber: FiberState = {
        fiberId: 'test-fiber-123',
        currentState: { value: 'pending' },
        stateData: { submittedAt: 1000 },
        sequenceNumber: 3,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValue(testFiber);
      const callback = jest.fn();
      
      // ACT: Subscribe and advance timer
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Callback fired with state
      expect(callback).toHaveBeenCalledWith(testFiber);
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should use setTimeout recursion, not setInterval', async () => {
      // ARRANGE: Mock setTimeout and clearTimeout
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'test-fiber',
        currentState: { value: 'active' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      const callback = jest.fn();
      
      // ACT: Subscribe
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      
      // Advance through multiple polls
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }
      
      // ASSERT: setTimeout used (recursive), not setInterval
      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(setIntervalSpy).not.toHaveBeenCalled();
      
      // ASSERT: Multiple setTimeout calls (recursive pattern)
      expect(setTimeoutSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
      
      unsubscribe();
      setTimeoutSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    it('should detect state changes via sequenceNumber', async () => {
      // ARRANGE: Fiber state that changes
      const initialState: FiberState = {
        fiberId: 'test-fiber-123',
        currentState: { value: 'pending' },
        stateData: { amount: 100 },
        sequenceNumber: 5,
        status: 'ACTIVE',
        isFinal: false
      };
      
      const updatedState: FiberState = {
        ...initialState,
        currentState: { value: 'approved' },
        stateData: { amount: 100, approvedBy: 'DAGmanager456...' },
        sequenceNumber: 6 // Changed sequence number
      };
      
      mockGetStateMachine.mockResolvedValueOnce(initialState);
      mockGetStateMachine.mockResolvedValueOnce(initialState); // No change
      mockGetStateMachine.mockResolvedValueOnce(updatedState); // State changed
      
      const callback = jest.fn();
      
      // ACT: Subscribe and advance through polls
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      
      // First poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Second poll (no change)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Third poll (state changed)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Callback called only on initial poll and change
      expect(callback).toHaveBeenCalledTimes(2); // Initial + change
      expect(callback).toHaveBeenNthCalledWith(1, initialState);
      expect(callback).toHaveBeenNthCalledWith(2, updatedState);
      
      unsubscribe();
    });

    it('should stop polling when unsubscribe is called', async () => {
      // ARRANGE: Mock state
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'test-fiber',
        currentState: { value: 'active' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      const callback = jest.fn();
      
      // ACT: Subscribe and then unsubscribe
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      
      // First poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Unsubscribe
      unsubscribe();
      
      // More time passes
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      
      // ASSERT: Only first poll occurred
      expect(mockGetStateMachine).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle fiber not found gracefully', async () => {
      // ARRANGE: getStateMachine returns null (fiber not found)
      mockGetStateMachine.mockResolvedValue(null);
      const callback = jest.fn();
      
      // ACT: Subscribe to non-existent fiber
      const unsubscribe = subscribeFiberState('nonexistent-fiber', callback);
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Callback called with null, no error thrown
      expect(callback).toHaveBeenCalledWith(null);
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should continue polling after fiber not found', async () => {
      // ARRANGE: Fiber not found initially, then found
      const foundState: FiberState = {
        fiberId: 'delayed-fiber',
        currentState: { value: 'created' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValueOnce(null); // Not found
      mockGetStateMachine.mockResolvedValueOnce(foundState); // Found
      
      const callback = jest.fn();
      
      // ACT: Subscribe and advance through polls
      const unsubscribe = subscribeFiberState('delayed-fiber', callback);
      
      // First poll (not found)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Second poll (found)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Both null and found state reported
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, null);
      expect(callback).toHaveBeenNthCalledWith(2, foundState);
      
      unsubscribe();
    });

    it('should not crash on network errors', async () => {
      // ARRANGE: getStateMachine rejects with network error
      const networkError = new Error('Network timeout');
      mockGetStateMachine.mockRejectedValueOnce(networkError);
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'test-fiber',
        currentState: { value: 'active' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      const callback = jest.fn();
      
      // ACT: Subscribe with network error
      const unsubscribe = subscribeFiberState('test-fiber-123', callback);
      
      // First poll (network error)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Second poll (success)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Subscription continues after error
      expect(callback).toHaveBeenCalledTimes(1); // Only successful call
      expect(mockGetStateMachine).toHaveBeenCalledTimes(2); // Both calls made
      
      unsubscribe();
    });
  });

  describe('SubscribeOptions Configuration', () => {
    it('should use custom polling interval when specified', async () => {
      // ARRANGE: Custom 500ms interval
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'test-fiber',
        currentState: { value: 'active' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      const callback = jest.fn();
      
      // ACT: Subscribe with custom interval
      const unsubscribe = subscribeFiberState('test-fiber-123', callback, { interval: 500 });
      
      // Advance by custom interval
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      // ASSERT: Poll occurred at custom interval
      expect(mockGetStateMachine).toHaveBeenCalledTimes(1);
      
      // Advance by another interval
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      expect(mockGetStateMachine).toHaveBeenCalledTimes(2);
      
      unsubscribe();
    });

    it('should fire immediately when fireImmediately=true', async () => {
      // ARRANGE: Fiber state
      const testFiber: FiberState = {
        fiberId: 'immediate-fiber',
        currentState: { value: 'ready' },
        stateData: { initialized: true },
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValue(testFiber);
      const callback = jest.fn();
      
      // ACT: Subscribe with fireImmediately
      const unsubscribe = subscribeFiberState('immediate-fiber', callback, { fireImmediately: true });
      
      // Don't advance timers yet
      await Promise.resolve();
      
      // ASSERT: Callback fired immediately before first interval
      expect(callback).toHaveBeenCalledWith(testFiber);
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should call onError callback for network failures', async () => {
      // ARRANGE: Network error and error callback
      const networkError = new Error('Connection refused');
      mockGetStateMachine.mockRejectedValue(networkError);
      
      const callback = jest.fn();
      const onError = jest.fn();
      
      // ACT: Subscribe with error handler
      const unsubscribe = subscribeFiberState('test-fiber-123', callback, { onError });
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Error callback called
      expect(onError).toHaveBeenCalledWith(networkError);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled(); // State callback not called on error
      
      unsubscribe();
    });

    it('should continue polling after error when onError provided', async () => {
      // ARRANGE: Error then success
      const networkError = new Error('Temporary failure');
      const successState: FiberState = {
        fiberId: 'recovery-fiber',
        currentState: { value: 'recovered' },
        stateData: {},
        sequenceNumber: 2,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockRejectedValueOnce(networkError);
      mockGetStateMachine.mockResolvedValue(successState);
      
      const callback = jest.fn();
      const onError = jest.fn();
      
      // ACT: Subscribe with error handling
      const unsubscribe = subscribeFiberState('recovery-fiber', callback, { onError });
      
      // First poll (error)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Second poll (success)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Error handled, then success
      expect(onError).toHaveBeenCalledWith(networkError);
      expect(callback).toHaveBeenCalledWith(successState);
      
      unsubscribe();
    });

    it('should not fire callback for same sequenceNumber', async () => {
      // ARRANGE: Same state returned multiple times
      const unchangedState: FiberState = {
        fiberId: 'unchanged-fiber',
        currentState: { value: 'stable' },
        stateData: { value: 42 },
        sequenceNumber: 10,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValue(unchangedState);
      const callback = jest.fn();
      
      // ACT: Subscribe and poll multiple times
      const unsubscribe = subscribeFiberState('unchanged-fiber', callback);
      
      // Multiple polls
      for (let i = 0; i < 5; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }
      
      // ASSERT: Callback only fired once (initial)
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(unchangedState);
      expect(mockGetStateMachine).toHaveBeenCalledTimes(5); // All polls made
      
      unsubscribe();
    });
  });

  describe('Multiple Subscriptions', () => {
    it('should handle multiple concurrent subscriptions', async () => {
      // ARRANGE: Two different fibers
      const fiber1: FiberState = {
        fiberId: 'fiber-1',
        currentState: { value: 'state1' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      const fiber2: FiberState = {
        fiberId: 'fiber-2',
        currentState: { value: 'state2' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockImplementation((fiberId) => {
        return Promise.resolve(fiberId === 'fiber-1' ? fiber1 : fiber2);
      });
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      // ACT: Subscribe to both fibers
      const unsubscribe1 = subscribeFiberState('fiber-1', callback1);
      const unsubscribe2 = subscribeFiberState('fiber-2', callback2);
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Both subscriptions work independently
      expect(callback1).toHaveBeenCalledWith(fiber1);
      expect(callback2).toHaveBeenCalledWith(fiber2);
      expect(mockGetStateMachine).toHaveBeenCalledWith('fiber-1');
      expect(mockGetStateMachine).toHaveBeenCalledWith('fiber-2');
      
      unsubscribe1();
      unsubscribe2();
    });

    it('should unsubscribe independently', async () => {
      // ARRANGE: Two subscriptions
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'test-fiber',
        currentState: { value: 'active' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      // ACT: Subscribe and unsubscribe one
      const unsubscribe1 = subscribeFiberState('same-fiber', callback1);
      const unsubscribe2 = subscribeFiberState('same-fiber', callback2);
      
      // First poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Unsubscribe first
      unsubscribe1();
      
      // Second poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Second subscription continues
      expect(callback1).toHaveBeenCalledTimes(1); // Stopped
      expect(callback2).toHaveBeenCalledTimes(2); // Continued
      
      unsubscribe2();
    });
  });
});

describe('SDK Fiber State Subscription: waitForState Helper', () => {
  let mockClient: MetagraphClient;
  let mockGetStateMachine: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockGetStateMachine = jest.fn();
    mockClient = {
      getStateMachine: mockGetStateMachine,
      subscribeFiberState: jest.fn(),
      waitForState: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('waitForState Method', () => {
    it('should be available on MetagraphClient', () => {
      // ARRANGE: Client instance
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      
      // ACT & ASSERT: Method exists
      expect(typeof client.waitForState).toBe('function');
    });

    it('should resolve immediately if fiber is already in target state', async () => {
      // ARRANGE: Fiber already in target state
      const targetState: FiberState = {
        fiberId: 'ready-fiber',
        currentState: { value: 'completed' },
        stateData: { result: 'success' },
        sequenceNumber: 5,
        status: 'ACTIVE',
        isFinal: true
      };
      
      mockGetStateMachine.mockResolvedValue(targetState);
      
      // ACT: Wait for state
      const result = waitForState('ready-fiber', 'completed');
      
      // Let initial check complete
      await Promise.resolve();
      
      // ASSERT: Resolves immediately
      await expect(result).resolves.toEqual(targetState);
    });

    it('should wait for state transition and resolve', async () => {
      // ARRANGE: Fiber transitions from pending to approved
      const pendingState: FiberState = {
        fiberId: 'transition-fiber',
        currentState: { value: 'pending' },
        stateData: { submitted: true },
        sequenceNumber: 3,
        status: 'ACTIVE',
        isFinal: false
      };
      
      const approvedState: FiberState = {
        ...pendingState,
        currentState: { value: 'approved' },
        stateData: { submitted: true, approvedBy: 'DAGmanager123...' },
        sequenceNumber: 4
      };
      
      // First call returns pending, second call returns approved
      mockGetStateMachine.mockResolvedValueOnce(pendingState);
      mockGetStateMachine.mockResolvedValue(approvedState);
      
      // ACT: Wait for approved state
      const resultPromise = waitForState('transition-fiber', 'approved');
      
      // Initial check (pending)
      await Promise.resolve();
      
      // Advance timer for next poll
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // ASSERT: Resolves with approved state
      await expect(resultPromise).resolves.toEqual(approvedState);
    });

    it('should timeout if state is not reached', async () => {
      // ARRANGE: Fiber never reaches target state
      const stuckState: FiberState = {
        fiberId: 'stuck-fiber',
        currentState: { value: 'processing' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      mockGetStateMachine.mockResolvedValue(stuckState);
      
      // ACT: Wait with short timeout
      const resultPromise = waitForState('stuck-fiber', 'completed', 2000);
      
      // Advance past timeout
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
      
      // ASSERT: Rejects with timeout error
      await expect(resultPromise).rejects.toThrow('Timeout waiting for state "completed" on fiber "stuck-fiber"');
    });

    it('should reject if fiber is not found', async () => {
      // ARRANGE: Fiber doesn't exist
      mockGetStateMachine.mockResolvedValue(null);
      
      // ACT: Wait for state on non-existent fiber
      const resultPromise = waitForState('missing-fiber', 'any-state');
      
      await Promise.resolve();
      
      // ASSERT: Rejects with fiber not found error
      await expect(resultPromise).rejects.toThrow('Fiber "missing-fiber" not found');
    });

    it('should use default timeout of 30 seconds', async () => {
      // ARRANGE: Fiber that never transitions
      mockGetStateMachine.mockResolvedValue({
        fiberId: 'timeout-test',
        currentState: { value: 'waiting' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      });
      
      // ACT: Wait without explicit timeout
      const resultPromise = waitForState('timeout-test', 'ready');
      
      // Advance by default timeout (30 seconds)
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      
      // ASSERT: Times out after default period
      await expect(resultPromise).rejects.toThrow('Timeout waiting for state');
    });

    it('should clean up subscription on resolution', async () => {
      // ARRANGE: Fiber that transitions quickly
      const initialState: FiberState = {
        fiberId: 'quick-fiber',
        currentState: { value: 'starting' },
        stateData: {},
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      const finalState: FiberState = {
        ...initialState,
        currentState: { value: 'finished' },
        sequenceNumber: 2,
        isFinal: true
      };
      
      mockGetStateMachine.mockResolvedValueOnce(initialState);
      mockGetStateMachine.mockResolvedValue(finalState);
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // ACT: Wait for state
      const resultPromise = waitForState('quick-fiber', 'finished');
      
      await Promise.resolve();
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      await resultPromise;
      
      // ASSERT: Cleanup occurred
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});

describe('SDK Fiber State Subscription: Integration Tests', () => {
  let mockClient: MetagraphClient;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('End-to-End Subscription Flow', () => {
    it('should handle complete approval workflow', async () => {
      // ARRANGE: Document approval workflow
      const states = [
        {
          currentState: { value: 'draft' },
          stateData: { documentId: 'doc123', author: 'DAGuser123...' },
          sequenceNumber: 1
        },
        {
          currentState: { value: 'submitted' },
          stateData: { documentId: 'doc123', author: 'DAGuser123...', submittedAt: 1000 },
          sequenceNumber: 2
        },
        {
          currentState: { value: 'approved' },
          stateData: { 
            documentId: 'doc123', 
            author: 'DAGuser123...', 
            submittedAt: 1000,
            approvedBy: 'DAGmanager456...',
            approvedAt: 1001
          },
          sequenceNumber: 3
        }
      ];
      
      let stateIndex = 0;
      const mockGetStateMachine = jest.fn().mockImplementation(() => {
        const baseState = {
          fiberId: 'approval-workflow',
          status: 'ACTIVE' as const,
          isFinal: stateIndex === 2
        };
        return Promise.resolve({ ...baseState, ...states[Math.min(stateIndex++, 2)] });
      });
      
      // Mock the subscription implementation
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      client.getStateMachine = mockGetStateMachine;
      
      const stateHistory: (FiberState | null)[] = [];
      const callback = (state: FiberState | null) => stateHistory.push(state);
      
      // ACT: Subscribe to workflow
      const unsubscribe = client.subscribeFiberState('approval-workflow', callback);
      
      // Simulate workflow progression
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }
      
      // ASSERT: Captured all state transitions
      expect(stateHistory).toHaveLength(3);
      expect(stateHistory[0]?.currentState.value).toBe('draft');
      expect(stateHistory[1]?.currentState.value).toBe('submitted');
      expect(stateHistory[2]?.currentState.value).toBe('approved');
      expect(stateHistory[2]?.isFinal).toBe(true);
      
      unsubscribe();
    });

    it('should handle subscription + waitForState combination', async () => {
      // ARRANGE: Subscription for monitoring + waitForState for specific transition
      const progressStates = [
        { currentState: { value: 'initializing' }, sequenceNumber: 1 },
        { currentState: { value: 'processing' }, sequenceNumber: 2 },
        { currentState: { value: 'validating' }, sequenceNumber: 3 },
        { currentState: { value: 'completed' }, sequenceNumber: 4, isFinal: true }
      ];
      
      let progressIndex = 0;
      const mockGetStateMachine = jest.fn().mockImplementation(() => {
        const baseState = {
          fiberId: 'long-running-task',
          stateData: { progress: progressIndex * 25 },
          status: 'ACTIVE' as const,
          isFinal: progressIndex === 3
        };
        const current = { ...baseState, ...progressStates[Math.min(progressIndex++, 3)] };
        return Promise.resolve(current);
      });
      
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      client.getStateMachine = mockGetStateMachine;
      
      const progressUpdates: string[] = [];
      
      // ACT: Start subscription for monitoring
      const unsubscribe = client.subscribeFiberState('long-running-task', (state) => {
        if (state) progressUpdates.push(state.currentState.value);
      });
      
      // Wait for completion using waitForState
      const completionPromise = client.waitForState('long-running-task', 'completed');
      
      // Advance through states
      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }
      
      const finalState = await completionPromise;
      
      // ASSERT: Both subscription and waitForState work together
      expect(progressUpdates).toEqual(['initializing', 'processing', 'validating', 'completed']);
      expect(finalState.currentState.value).toBe('completed');
      expect(finalState.isFinal).toBe(true);
      
      unsubscribe();
    });

    it('should handle network interruption and recovery', async () => {
      // ARRANGE: Network fails then recovers
      const normalState: FiberState = {
        fiberId: 'network-test',
        currentState: { value: 'running' },
        stateData: { uptime: 1000 },
        sequenceNumber: 1,
        status: 'ACTIVE',
        isFinal: false
      };
      
      const recoveredState: FiberState = {
        ...normalState,
        stateData: { uptime: 2000 },
        sequenceNumber: 2
      };
      
      const mockGetStateMachine = jest.fn();
      // Normal -> Error -> Error -> Recovered
      mockGetStateMachine.mockResolvedValueOnce(normalState);
      mockGetStateMachine.mockRejectedValueOnce(new Error('Network error'));
      mockGetStateMachine.mockRejectedValueOnce(new Error('Still down'));
      mockGetStateMachine.mockResolvedValue(recoveredState);
      
      const client = createMetagraphClient({ baseUrl: 'http://localhost:4000' });
      client.getStateMachine = mockGetStateMachine;
      
      const states: (FiberState | null)[] = [];
      const errors: Error[] = [];
      
      // ACT: Subscribe with error handling
      const unsubscribe = client.subscribeFiberState('network-test', 
        (state) => states.push(state),
        { 
          onError: (error) => errors.push(error)
        }
      );
      
      // Progress through network issues
      for (let i = 0; i < 4; i++) {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      }
      
      // ASSERT: Handled errors gracefully and recovered
      expect(states).toHaveLength(2); // Normal + recovered
      expect(errors).toHaveLength(2); // Two network errors
      expect(states[0]).toEqual(normalState);
      expect(states[1]).toEqual(recoveredState);
      
      unsubscribe();
    });
  });
});

// Mock helper functions (these would be implemented in the actual SDK)

function createMetagraphClient(config: { baseUrl: string }): MetagraphClient {
  // Mock implementation - would create real client
  throw new Error('Not yet implemented - TDD test should fail');
}

function subscribeFiberState(
  fiberId: string, 
  callback: StateCallback, 
  options?: SubscribeOptions
): UnsubscribeFunction {
  // Mock implementation - would implement actual subscription logic
  throw new Error('Not yet implemented - TDD test should fail');
}

function waitForState(
  fiberId: string,
  stateName: string,
  timeoutMs: number = 30000
): Promise<FiberState> {
  // Mock implementation - would implement waitForState helper
  throw new Error('Not yet implemented - TDD test should fail');
}