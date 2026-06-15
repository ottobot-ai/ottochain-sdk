/**
 * Tests for OttoChain MetagraphClient and snapshot utilities
 */
import { MetagraphClient } from '../src/ottochain/metagraph-client';
import {
  extractOnChainState,
  getLogsForFiber,
  getEventReceipts,
  getScriptInvocations,
} from '../src/ottochain/snapshot';
import {
  getSnapshotOnChainState,
  getLatestOnChainState,
  decodeOnChainState,
} from '../src/ottochain/snapshot';

// Mock HttpClient
jest.mock('@constellation-network/metagraph-sdk/network', () => {
  return {
    HttpClient: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      post: jest.fn(),
    })),
    NetworkError: class NetworkError extends Error {
      statusCode?: number;
      constructor(msg: string, code?: number) {
        super(msg);
        this.statusCode = code;
      }
    },
  };
});

describe('MetagraphClient', () => {
  let client: MetagraphClient;
  let mockMl0Get: jest.Mock;
  let mockDl1Post: jest.Mock;

  beforeEach(() => {
    client = new MetagraphClient({
      ml0Url: 'http://localhost:9200',
      dl1Url: 'http://localhost:9400',
    });
    // Access the internal HttpClient mock
    mockMl0Get = (client as any).ml0.get;
    mockDl1Post = (client as any).dl1.post;
  });

  it('constructs with required ml0Url', () => {
    expect(() => new MetagraphClient({ ml0Url: 'http://localhost:9200' })).not.toThrow();
  });

  it('constructs with dl1Urls array', () => {
    const c = new MetagraphClient({
      ml0Url: 'http://localhost:9200',
      dl1Urls: ['http://node1:9400', 'http://node2:9400'],
    });
    expect(c).toBeDefined();
  });

  describe('getOnChain', () => {
    it('fetches and returns on-chain state', async () => {
      const mockState = { fibers: {}, scripts: {} };
      mockMl0Get.mockResolvedValue(mockState);
      const result = await client.getOnChain();
      expect(result).toEqual(mockState);
      expect(mockMl0Get).toHaveBeenCalledWith('/data-application/v1/onchain');
    });
  });

  describe('getCheckpoint', () => {
    it('fetches latest checkpoint', async () => {
      const checkpoint = { ordinal: 100, hash: 'abc123' };
      mockMl0Get.mockResolvedValue(checkpoint);
      const result = await client.getCheckpoint();
      expect(result).toEqual(checkpoint);
    });
  });

  describe('getStateMachines', () => {
    it('returns all state machines when no status filter', async () => {
      const machines = { 'fiber-1': { status: 'Active' } };
      mockMl0Get.mockResolvedValue(machines);
      const result = await client.getStateMachines();
      expect(result).toEqual(machines);
    });
  });

  describe('getStateMachine', () => {
    it('returns null for 404', async () => {
      const { NetworkError } = require('@constellation-network/metagraph-sdk/network');
      mockMl0Get.mockRejectedValue(new NetworkError('Not found', 404));
      const result = await client.getStateMachine('nonexistent');
      expect(result).toBeNull();
    });

    it('throws for non-404 errors', async () => {
      const { NetworkError } = require('@constellation-network/metagraph-sdk/network');
      mockMl0Get.mockRejectedValue(new NetworkError('Server error', 500));
      await expect(client.getStateMachine('f1')).rejects.toThrow('Server error');
    });
  });

  describe('getScript', () => {
    it('returns null for 404', async () => {
      const { NetworkError } = require('@constellation-network/metagraph-sdk/network');
      mockMl0Get.mockRejectedValue(new NetworkError('Not found', 404));
      const result = await client.getScript('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getLatestOrdinal', () => {
    it('extracts ordinal from snapshot info', async () => {
      mockMl0Get.mockResolvedValue({ value: { ordinal: 42 } });
      const result = await client.getLatestOrdinal();
      expect(result).toBe(42);
    });
  });

  describe('getStateMachineEvents', () => {
    it('fetches events for a fiber', async () => {
      const events = [{ eventName: 'create', ordinal: 1 }];
      mockMl0Get.mockResolvedValue(events);
      const result = await client.getStateMachineEvents('fiber-1');
      expect(result).toEqual(events);
      expect(mockMl0Get).toHaveBeenCalledWith('/data-application/v1/state-machines/fiber-1/events');
    });
  });

  describe('getScripts', () => {
    it('fetches all scripts without filter', async () => {
      const scripts = { 's1': { status: 'Active' } };
      mockMl0Get.mockResolvedValue(scripts);
      const result = await client.getScripts();
      expect(result).toEqual(scripts);
      expect(mockMl0Get).toHaveBeenCalledWith('/data-application/v1/scripts');
    });

    it('fetches scripts with status filter', async () => {
      mockMl0Get.mockResolvedValue({});
      await client.getScripts('Active' as any);
      expect(mockMl0Get).toHaveBeenCalledWith('/data-application/v1/scripts?status=Active');
    });
  });

  describe('getScriptInvocations', () => {
    it('fetches invocations for a script', async () => {
      const invocations = [{ method: 'eval', result: true }];
      mockMl0Get.mockResolvedValue(invocations);
      const result = await client.getScriptInvocations('s1');
      expect(result).toEqual(invocations);
      expect(mockMl0Get).toHaveBeenCalledWith('/data-application/v1/scripts/s1/invocations');
    });
  });

  describe('getLatestSnapshotOnChainState', () => {
    it('fetches and decodes latest snapshot on-chain state', async () => {
      const onChain = { latestLogs: {}, stateMachineFibers: {}, scriptFibers: {} };
      const jsonBytes = Array.from(new TextEncoder().encode(JSON.stringify(onChain)));
      mockMl0Get.mockResolvedValue({ value: { dataApplication: { onChainState: jsonBytes } } });
      const result = await client.getLatestSnapshotOnChainState();
      expect(result).toEqual(onChain);
    });

    it('returns null when no dataApplication', async () => {
      mockMl0Get.mockResolvedValue({ value: {} });
      const result = await client.getLatestSnapshotOnChainState();
      expect(result).toBeNull();
    });
  });

  describe('getSnapshotOnChainState', () => {
    it('fetches snapshot by ordinal', async () => {
      const onChain = { latestLogs: {}, stateMachineFibers: {}, scriptFibers: {} };
      const jsonBytes = Array.from(new TextEncoder().encode(JSON.stringify(onChain)));
      mockMl0Get.mockResolvedValue({ value: { dataApplication: { onChainState: jsonBytes } } });
      const result = await client.getSnapshotOnChainState(42);
      expect(result).toEqual(onChain);
      expect(mockMl0Get).toHaveBeenCalledWith('/snapshots/42');
    });
  });

  describe('postData', () => {
    it('submits data to primary DL1', async () => {
      mockDl1Post.mockResolvedValue({ hash: 'txhash123' });
      const result = await client.postData({ value: 'test', proofs: [] });
      expect(result).toEqual({ hash: 'txhash123' });
    });

    it('throws when no DL1 configured', async () => {
      const noData = new MetagraphClient({ ml0Url: 'http://localhost:9200' });
      await expect(noData.postData({ test: true })).rejects.toThrow('dl1Url is required');
    });
  });

  describe('submitData', () => {
    it('submits signed data to single DL1', async () => {
      const mockDl1ClientPost = (client as any).dl1Clients[0]?.post || mockDl1Post;
      mockDl1ClientPost.mockResolvedValue({ hash: 'hash456' });
      const signed = { value: { test: true }, proofs: [{ id: 'abc', signature: 'def' }] };
      const result = await client.submitData(signed);
      expect(result).toEqual({ hash: 'hash456' });
    });

    it('throws when no DL1 configured', async () => {
      const noData = new MetagraphClient({ ml0Url: 'http://localhost:9200' });
      const signed = { value: { test: true }, proofs: [{ id: 'abc', signature: 'def' }] };
      await expect(noData.submitData(signed)).rejects.toThrow('dl1Url or dl1Urls is required');
    });

    it('tries all DL1 nodes with multi-URL config', async () => {
      const multi = new MetagraphClient({
        ml0Url: 'http://localhost:9200',
        dl1Urls: ['http://node1:9400', 'http://node2:9400'],
      });
      const clients = (multi as any).dl1Clients;
      clients[0].post.mockRejectedValue(new Error('node1 down'));
      clients[1].post.mockResolvedValue({ hash: 'from-node2' });
      const signed = { value: { x: 1 }, proofs: [{ id: 'a', signature: 'b' }] };
      const result = await multi.submitData(signed);
      expect(result).toEqual({ hash: 'from-node2' });
    });

    it('rejects when all DL1 nodes fail', async () => {
      const multi = new MetagraphClient({
        ml0Url: 'http://localhost:9200',
        dl1Urls: ['http://node1:9400', 'http://node2:9400'],
      });
      const clients = (multi as any).dl1Clients;
      clients[0].post.mockRejectedValue(new Error('node1 down'));
      clients[1].post.mockRejectedValue(new Error('node2 down'));
      const signed = { value: { x: 1 }, proofs: [{ id: 'a', signature: 'b' }] };
      await expect(multi.submitData(signed)).rejects.toThrow('All DL1 nodes failed');
    });
  });
});

describe('Snapshot utilities', () => {
  // Match actual OnChain type: { latestLogs: Record<string, FiberLogEntry[]>, ... }
  const mockEventReceipt = {
    fiberId: 'fiber-1',
    sequenceNumber: 0,
    eventName: 'create',
    ordinal: 1,
    fromState: 'INIT',
    toState: 'ACTIVE',
    success: true,
  };

  const mockScriptInvocation = {
    fiberId: 'fiber-1',
    method: 'evaluate',
    args: { x: 1 },
    result: { output: true },
    gasUsed: 100,
  };

  const mockOnChain = {
    latestLogs: {
      'fiber-1': [mockEventReceipt, mockScriptInvocation],
    },
    stateMachineFibers: {},
    scriptFibers: {},
  };

  describe('extractOnChainState', () => {
    it('extracts state from snapshot with dataApplication (bytes)', () => {
      // onChainState is a byte array that decodes via UTF-8 → JSON.parse
      const jsonBytes = Array.from(new TextEncoder().encode(JSON.stringify(mockOnChain)));
      const snapshot = {
        value: {
          dataApplication: {
            onChainState: jsonBytes,
          },
        },
      } as any;
      const result = extractOnChainState(snapshot);
      expect(result).toEqual(mockOnChain);
    });

    it('returns null for snapshot without dataApplication', () => {
      const snapshot = { value: {} } as any;
      expect(extractOnChainState(snapshot)).toBeNull();
    });

    it('returns null for snapshot without onChainState', () => {
      const snapshot = { value: { dataApplication: {} } } as any;
      expect(extractOnChainState(snapshot)).toBeNull();
    });
  });

  describe('getLogsForFiber', () => {
    it('returns log entries for existing fiber', () => {
      const logs = getLogsForFiber(mockOnChain as any, 'fiber-1');
      expect(logs).toHaveLength(2);
    });

    it('returns empty array for non-existent fiber', () => {
      expect(getLogsForFiber(mockOnChain as any, 'nonexistent')).toEqual([]);
    });
  });

  describe('getEventReceipts', () => {
    it('filters to EventReceipt entries only', () => {
      const receipts = getEventReceipts(mockOnChain as any, 'fiber-1');
      expect(receipts).toHaveLength(1);
      expect(receipts[0].eventName).toBe('create');
    });

    it('returns empty array for non-existent fiber', () => {
      expect(getEventReceipts(mockOnChain as any, 'nonexistent')).toEqual([]);
    });
  });

  describe('getScriptInvocations', () => {
    it('filters to ScriptInvocation entries only', () => {
      const invocations = getScriptInvocations(mockOnChain as any, 'fiber-1');
      expect(invocations).toHaveLength(1);
      expect(invocations[0].method).toBe('evaluate');
    });

    it('returns empty array for non-existent fiber', () => {
      expect(getScriptInvocations(mockOnChain as any, 'nonexistent')).toEqual([]);
    });
  });

  describe('decodeOnChainState', () => {
    it('decodes UTF-8 bytes to OnChain object', () => {
      const data = { latestLogs: {}, stateMachineFibers: {} };
      const bytes = new TextEncoder().encode(JSON.stringify(data));
      const result = decodeOnChainState(bytes);
      expect(result).toEqual(data);
    });
  });

  describe('getSnapshotOnChainState', () => {
    it('fetches snapshot by ordinal from standalone function', async () => {
      const { HttpClient } = require('@constellation-network/metagraph-sdk/network');
      const onChain = { latestLogs: {}, stateMachineFibers: {} };
      const jsonBytes = Array.from(new TextEncoder().encode(JSON.stringify(onChain)));
      HttpClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({ value: { dataApplication: { onChainState: jsonBytes } } }),
      }));
      const result = await getSnapshotOnChainState('http://localhost:9200', 10);
      expect(result).toEqual(onChain);
    });
  });

  describe('getLatestOnChainState', () => {
    it('fetches latest snapshot from standalone function', async () => {
      const { HttpClient } = require('@constellation-network/metagraph-sdk/network');
      const onChain = { latestLogs: {}, scriptFibers: {} };
      const jsonBytes = Array.from(new TextEncoder().encode(JSON.stringify(onChain)));
      HttpClient.mockImplementation(() => ({
        get: jest.fn().mockResolvedValue({ value: { dataApplication: { onChainState: jsonBytes } } }),
      }));
      const result = await getLatestOnChainState('http://localhost:9200');
      expect(result).toEqual(onChain);
    });
  });
});
