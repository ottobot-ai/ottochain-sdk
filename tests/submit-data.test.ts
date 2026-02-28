/**
 * Tests for MetagraphClient.submitData — direct DL1 submission
 */
import { describe, it, expect } from 'vitest';
import {
  createTransitionPayload,
  signTransaction,
  createDataTransactionRequest,
  generateKeyPair,
} from '../src/index.js';
import { MetagraphClient } from '../src/ottochain/metagraph-client.js';

describe('MetagraphClient.submitData', () => {
  const keyPair = generateKeyPair();

  it('throws if no DL1 URLs configured', async () => {
    const client = new MetagraphClient({ ml0Url: 'http://localhost:9200' });
    const payload = createTransitionPayload({
      fiberId: '00000000-0000-0000-0000-000000000001',
      eventName: 'activate',
      payload: {},
      targetSequenceNumber: 0,
    });
    const signed = await signTransaction(payload, keyPair.privateKey);
    await expect(client.submitData(signed)).rejects.toThrow('dl1Url or dl1Urls is required');
  });

  it('createDataTransactionRequest produces correct DL1 shape', async () => {
    const payload = createTransitionPayload({
      fiberId: '00000000-0000-0000-0000-000000000001',
      eventName: 'activate',
      payload: {},
      targetSequenceNumber: 0,
    });
    const signed = await signTransaction(payload, keyPair.privateKey);
    const request = createDataTransactionRequest(signed);

    // DL1 expects { data: Signed<T>, fee: null }
    expect(request).toHaveProperty('data');
    expect(request).toHaveProperty('fee', null);
    expect(request.data).toBe(signed);
    expect(request.data.proofs).toHaveLength(1);
    expect(request.data.proofs[0]).toHaveProperty('id');
    expect(request.data.proofs[0]).toHaveProperty('signature');
  });

  it('works with single dl1Url config', () => {
    const client = new MetagraphClient({
      ml0Url: 'http://localhost:9200',
      dl1Url: 'http://localhost:9400',
    });
    expect(client).toBeDefined();
  });

  it('works with multiple dl1Urls config', () => {
    const client = new MetagraphClient({
      ml0Url: 'http://localhost:9200',
      dl1Urls: ['http://node1:9400', 'http://node2:9400'],
    });
    expect(client).toBeDefined();
  });
});
