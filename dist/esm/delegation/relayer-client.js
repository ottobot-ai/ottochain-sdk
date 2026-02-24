/**
 * @fileoverview Relayer Client for submitting delegated transactions
 */
import { RelayedTransaction, SessionKeyProof, SignedIntentProof, GasConfig, FeePaymentMethod, SubmitRelayedTransaction } from '../generated/ottochain/v1/delegation.js';
import { DelegationManager } from './delegation-manager.js';
import { hashMessage, isValidAddress, retryWithBackoff } from './utils.js';
/**
 * Client for submitting relayed transactions on behalf of users
 */
export class RelayerClient {
    constructor(config, relayerAddress, delegationManager) {
        if (!isValidAddress(relayerAddress)) {
            throw new Error('Invalid relayer address format');
        }
        this.config = {
            timeout: 30000,
            ...config
        };
        this.relayerAddress = relayerAddress;
        this.delegationManager = delegationManager || new DelegationManager(config);
    }
    /**
     * Submit a relayed transaction using session key proof
     */
    async submitWithSessionKey(transaction, delegationId, sessionPrivateKey, gasConfig, signingFunction) {
        // Get session key from delegation manager
        const sessionKey = this.delegationManager.getSessionKey(delegationId);
        if (!sessionKey) {
            throw new Error(`Session key not found for delegation ${delegationId}`);
        }
        // Validate session key hasn't expired
        if (sessionKey.sessionExpiresAt && new Date() >= sessionKey.sessionExpiresAt) {
            throw new Error('Session key has expired');
        }
        // Create transaction signature with session key
        const transactionMessage = JSON.stringify(transaction, Object.keys(transaction).sort());
        const hashedMessage = hashMessage(transactionMessage);
        // If signing function provided, use it; otherwise use session key directly
        let transactionSignature;
        if (signingFunction) {
            const signatureResult = await signingFunction(hashedMessage);
            transactionSignature = signatureResult.signature;
        }
        else {
            // In a real implementation, this would sign with the session private key
            // For now, we'll generate a placeholder signature
            transactionSignature = this.signWithSessionKey(hashedMessage, sessionPrivateKey);
        }
        // Create session key proof
        const sessionKeyProof = SessionKeyProof.create({
            sessionKey,
            transactionSignature
        });
        // Create relayed transaction
        const relayedTx = await this.createRelayedTransaction({
            transaction,
            delegationProof: {
                type: 'session_key',
                proof: sessionKeyProof
            },
            gasConfig: this.mergeGasConfig(gasConfig),
            relayerAddress: this.relayerAddress
        });
        // Submit to bridge
        return this.submitRelayedTransaction(relayedTx);
    }
    /**
     * Submit a relayed transaction using signed intent proof
     */
    async submitWithSignedIntent(delegationId, intentNonce, conditionProof, gasConfig) {
        // Get signed intent from delegation manager
        const signedIntents = this.delegationManager.getSignedIntents(delegationId);
        const signedIntent = signedIntents.find(intent => intent.intentNonce === intentNonce);
        if (!signedIntent) {
            throw new Error(`Signed intent with nonce ${intentNonce} not found for delegation ${delegationId}`);
        }
        // Validate signed intent hasn't expired
        if (signedIntent.intentExpiresAt && new Date() >= signedIntent.intentExpiresAt) {
            throw new Error('Signed intent has expired');
        }
        // Create signed intent proof
        const signedIntentProof = SignedIntentProof.create({
            signedIntent,
            conditionProof
        });
        // Create relayed transaction
        const relayedTx = await this.createRelayedTransaction({
            transaction: signedIntent.transaction || {},
            delegationProof: {
                type: 'signed_intent',
                proof: signedIntentProof
            },
            gasConfig: this.mergeGasConfig(gasConfig),
            relayerAddress: this.relayerAddress
        });
        // Submit to bridge
        return this.submitRelayedTransaction(relayedTx);
    }
    /**
     * Get delegation status through delegation manager
     */
    async getDelegationStatus(delegationId) {
        return this.delegationManager.getDelegationStatus(delegationId);
    }
    /**
     * List transactions that can be relayed for a delegation
     */
    async getRelayableTransactions(delegationId) {
        const signedIntents = this.delegationManager.getSignedIntents(delegationId);
        // Filter out expired intents
        const now = new Date();
        return signedIntents.filter(intent => !intent.intentExpiresAt || intent.intentExpiresAt > now).map(intent => ({
            intentNonce: intent.intentNonce,
            transaction: intent.transaction,
            expiresAt: intent.intentExpiresAt,
            executionConditions: intent.executionConditions
        }));
    }
    /**
     * Estimate gas for a relayed transaction
     */
    async estimateGas(transaction, delegationId) {
        try {
            const response = await this.queryBridge('/delegation/estimate-gas', {
                transaction,
                delegationId,
                relayerAddress: this.relayerAddress
            });
            return {
                gasLimit: response.gasLimit,
                gasPrice: response.gasPrice
            };
        }
        catch (error) {
            // Fallback to default values if estimation fails
            return {
                gasLimit: this.config.defaultGasConfig?.gasLimit || 500000,
                gasPrice: this.config.defaultGasConfig?.gasPrice
            };
        }
    }
    async createRelayedTransaction(options) {
        // Create relayer signature
        const relayerSignatureData = {
            transaction: options.transaction,
            delegationProof: options.delegationProof,
            gasConfig: options.gasConfig,
            relayerAddress: options.relayerAddress,
            timestamp: new Date().toISOString()
        };
        const relayerMessage = JSON.stringify(relayerSignatureData, Object.keys(relayerSignatureData).sort());
        const hashedRelayerMessage = hashMessage(relayerMessage);
        // In a real implementation, this would sign with the relayer's private key
        const relayerSignature = this.signAsRelayer(hashedRelayerMessage);
        // Create relayed transaction with proper delegation proof
        const relayedTxData = {
            transaction: options.transaction,
            gasConfig: options.gasConfig,
            relayerAddress: options.relayerAddress,
            relayerSignature
        };
        // Add delegation proof based on type
        if (options.delegationProof.type === 'session_key') {
            relayedTxData.delegationProof = {
                $case: 'sessionKeyProof',
                sessionKeyProof: options.delegationProof.proof
            };
        }
        else {
            relayedTxData.delegationProof = {
                $case: 'signedIntentProof',
                signedIntentProof: options.delegationProof.proof
            };
        }
        return RelayedTransaction.create(relayedTxData);
    }
    async submitRelayedTransaction(relayedTx) {
        const submitMessage = SubmitRelayedTransaction.create({ relayedTx });
        return retryWithBackoff(async () => {
            const response = await fetch(`${this.config.bridgeUrl}/delegation/submit-relayed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitMessage),
                signal: AbortSignal.timeout(this.config.timeout)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Relayed transaction submission failed: ${response.status} ${errorText}`);
            }
            return response.json();
        }, 3, 5000); // 3 retries with 5 second base delay
    }
    mergeGasConfig(gasConfig) {
        const defaultConfig = this.config.defaultGasConfig || {
            gasLimit: 500000,
            paymentMethod: FeePaymentMethod.FEE_PAYMENT_METHOD_RELAYER_PAYS
        };
        return GasConfig.create({
            gasLimit: gasConfig?.gasLimit || defaultConfig.gasLimit,
            gasPrice: gasConfig?.gasPrice || defaultConfig.gasPrice,
            paymentMethod: gasConfig?.paymentMethod || defaultConfig.paymentMethod
        });
    }
    signWithSessionKey(message, sessionPrivateKey) {
        // Placeholder implementation
        // In a real implementation, this would use the session private key to sign
        return `0x${message.slice(0, 64)}session${sessionPrivateKey.slice(-32)}`;
    }
    signAsRelayer(message) {
        // Placeholder implementation
        // In a real implementation, this would use the relayer's private key to sign
        return `0x${message.slice(0, 64)}relayer${this.relayerAddress.slice(-32)}`;
    }
    async queryBridge(path, data) {
        const url = `${this.config.bridgeUrl}${path}`;
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.config.timeout)
        };
        if (data) {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Bridge query failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}
