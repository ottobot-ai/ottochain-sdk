/**
 * @fileoverview Relayer Client for submitting delegated transactions
 */
import { GasConfig } from '../generated/ottochain/v1/delegation.js';
import { DelegationConfig as DelegationManagerConfig, SignatureResult } from './types.js';
import { DelegationManager } from './delegation-manager.js';
/**
 * Client for submitting relayed transactions on behalf of users
 */
export declare class RelayerClient {
    private config;
    private delegationManager;
    private relayerAddress;
    constructor(config: DelegationManagerConfig, relayerAddress: string, delegationManager?: DelegationManager);
    /**
     * Submit a relayed transaction using session key proof
     */
    submitWithSessionKey(transaction: Record<string, any>, delegationId: string, sessionPrivateKey: string, gasConfig?: Partial<GasConfig>, signingFunction?: (message: string) => Promise<SignatureResult>): Promise<any>;
    /**
     * Submit a relayed transaction using signed intent proof
     */
    submitWithSignedIntent(delegationId: string, intentNonce: number, conditionProof?: any, gasConfig?: Partial<GasConfig>): Promise<any>;
    /**
     * Get delegation status through delegation manager
     */
    getDelegationStatus(delegationId: string): Promise<import("./types.js").DelegationStatus>;
    /**
     * List transactions that can be relayed for a delegation
     */
    getRelayableTransactions(delegationId: string): Promise<any[]>;
    /**
     * Estimate gas for a relayed transaction
     */
    estimateGas(transaction: Record<string, any>, delegationId: string): Promise<{
        gasLimit: number;
        gasPrice?: number;
    }>;
    private createRelayedTransaction;
    private submitRelayedTransaction;
    private mergeGasConfig;
    private signWithSessionKey;
    private signAsRelayer;
    private queryBridge;
}
