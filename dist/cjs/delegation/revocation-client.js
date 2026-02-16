"use strict";
/**
 * OttoChain SDK Revocation Client
 *
 * Client library for interacting with the real-time delegation revocation system.
 * Provides methods for checking revocation status, subscribing to revocation events,
 * and managing delegation revocation from client applications.
 *
 * Features:
 * - Real-time revocation status checking
 * - Event-driven revocation notifications
 * - Bulk revocation status queries
 * - Emergency revocation capabilities
 * - Circuit breaker monitoring
 * - Offline fallback mechanisms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDelegationRevocations = exports.createRevocationClient = exports.RevocationClient = exports.RevocationEventEmitter = void 0;
/**
 * Event emitter for revocation notifications
 */
class RevocationEventEmitter extends EventTarget {
    emit(type, data) {
        this.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
    on(type, listener) {
        this.addEventListener(type, listener);
    }
    off(type, listener) {
        this.removeEventListener(type, listener);
    }
}
exports.RevocationEventEmitter = RevocationEventEmitter;
/**
 * Local cache for revocation status
 */
class RevocationCache {
    constructor(ttlMs = 30000) {
        this.cache = new Map();
        this.ttlMs = ttlMs;
    }
    set(delegationId, status) {
        this.cache.set(delegationId, {
            status,
            expiresAt: Date.now() + this.ttlMs
        });
    }
    get(delegationId) {
        const entry = this.cache.get(delegationId);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(delegationId);
            return null;
        }
        return entry.status;
    }
    invalidate(delegationId) {
        this.cache.delete(delegationId);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        for (const entry of this.cache.values()) {
            if (now <= entry.expiresAt) {
                validEntries++;
            }
            else {
                expiredEntries++;
            }
        }
        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            hitRate: validEntries / (validEntries + expiredEntries) || 0
        };
    }
}
/**
 * WebSocket client for real-time revocation events
 */
class RevocationWebSocketClient {
    constructor(url, eventEmitter) {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.isConnected = false;
        this.url = url;
        this.eventEmitter = eventEmitter;
    }
    async connect() {
        try {
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                console.log('Connected to revocation event stream');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.eventEmitter.emit('connected', {});
            };
            this.ws.onmessage = (event) => {
                try {
                    const revocationEvent = JSON.parse(event.data);
                    this.handleRevocationEvent(revocationEvent);
                }
                catch (error) {
                    console.error('Error parsing revocation event:', error);
                }
            };
            this.ws.onclose = () => {
                console.log('Revocation event stream disconnected');
                this.isConnected = false;
                this.eventEmitter.emit('disconnected', {});
                this.attemptReconnect();
            };
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.eventEmitter.emit('error', { error });
            };
        }
        catch (error) {
            console.error('Failed to connect to revocation event stream:', error);
            throw error;
        }
    }
    handleRevocationEvent(event) {
        // Emit specific event types
        this.eventEmitter.emit('revocation', event);
        this.eventEmitter.emit(`revocation:${event.type}`, event);
        this.eventEmitter.emit(`revocation:${event.delegationId}`, event);
        // Emit priority-based events
        if (event.priority === 'CRITICAL' || event.priority === 'HIGH') {
            this.eventEmitter.emit('emergency-revocation', event);
        }
        console.log(`Received revocation event: ${event.type} for ${event.delegationId}`);
    }
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached. Giving up.');
            this.eventEmitter.emit('max-reconnect-attempts', {});
            return;
        }
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection attempt failed:', error);
                this.reconnectDelay *= 2; // Exponential backoff
            });
        }, this.reconnectDelay);
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }
    getConnectionState() {
        if (!this.ws)
            return 'DISCONNECTED';
        switch (this.ws.readyState) {
            case WebSocket.OPEN:
                return 'CONNECTED';
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            default:
                return 'DISCONNECTED';
        }
    }
}
/**
 * Main revocation client
 */
class RevocationClient {
    constructor(config) {
        this.eventEmitter = new RevocationEventEmitter();
        this.isInitialized = false;
        this.config = {
            enableEventSubscription: true,
            cacheEnabled: true,
            cacheTtlMs: 30000, // 30 seconds
            retryConfig: {
                maxRetries: 3,
                retryDelayMs: 1000,
                exponentialBackoff: true
            },
            offline: {
                enabled: true,
                fallbackBehavior: 'DENY'
            },
            ...config
        };
        if (this.config.cacheEnabled) {
            this.cache = new RevocationCache(this.config.cacheTtlMs);
        }
        if (this.config.enableEventSubscription && this.config.websocketUrl) {
            this.wsClient = new RevocationWebSocketClient(this.config.websocketUrl, this.eventEmitter);
        }
    }
    /**
     * Initialize the revocation client
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Test bridge connection
            await this.testConnection();
            // Connect WebSocket if enabled
            if (this.wsClient) {
                await this.wsClient.connect();
            }
            this.isInitialized = true;
            console.log('Revocation client initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize revocation client:', error);
            throw error;
        }
    }
    /**
     * Check if a delegation is revoked
     */
    async isRevoked(delegationId) {
        try {
            const status = await this.getRevocationStatus(delegationId);
            return status.isRevoked;
        }
        catch (error) {
            console.error(`Error checking revocation status for ${delegationId}:`, error);
            // Offline fallback
            if (this.config.offline?.enabled) {
                return this.config.offline.fallbackBehavior === 'DENY';
            }
            throw error;
        }
    }
    /**
     * Get detailed revocation status
     */
    async getRevocationStatus(delegationId) {
        // Check cache first
        if (this.cache) {
            const cached = this.cache.get(delegationId);
            if (cached) {
                return cached;
            }
        }
        // Fetch from API
        const status = await this.fetchRevocationStatus(delegationId);
        // Cache result
        if (this.cache) {
            this.cache.set(delegationId, status);
        }
        return status;
    }
    /**
     * Fetch revocation status from API
     */
    async fetchRevocationStatus(delegationId) {
        const url = `${this.config.bridgeUrl}/delegation/${delegationId}/revocation-status`;
        return this.withRetry(async () => {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    // Delegation not found, treat as not revoked
                    return {
                        delegationId,
                        isRevoked: false,
                        lastChecked: new Date()
                    };
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                delegationId,
                isRevoked: data.isRevoked || false,
                revokedAt: data.revokedAt ? new Date(data.revokedAt) : undefined,
                reason: data.reason,
                priority: data.priority,
                emergencyRevocation: data.emergencyRevocation,
                revokedBy: data.revokedBy,
                lastChecked: new Date()
            };
        });
    }
    /**
     * Bulk check revocation status for multiple delegations
     */
    async bulkCheckRevocation(request) {
        const start = Date.now();
        const results = new Map();
        const errors = new Map();
        // Check cache for cached results
        const uncachedIds = [];
        if (this.cache) {
            for (const delegationId of request.delegationIds) {
                const cached = this.cache.get(delegationId);
                if (cached) {
                    results.set(delegationId, cached);
                }
                else {
                    uncachedIds.push(delegationId);
                }
            }
        }
        else {
            uncachedIds.push(...request.delegationIds);
        }
        // Fetch uncached results
        if (uncachedIds.length > 0) {
            try {
                const bulkResults = await this.fetchBulkRevocationStatus(uncachedIds, request.timeoutMs);
                for (const [id, status] of bulkResults.entries()) {
                    results.set(id, status);
                    // Cache result
                    if (this.cache) {
                        this.cache.set(id, status);
                    }
                }
            }
            catch (error) {
                // Record errors for failed delegations
                for (const id of uncachedIds) {
                    errors.set(id, error instanceof Error ? error.message : 'Unknown error');
                }
            }
        }
        const totalRevoked = Array.from(results.values()).filter(status => status.isRevoked).length;
        const latencyMs = Date.now() - start;
        return {
            results,
            totalChecked: results.size,
            totalRevoked,
            latencyMs,
            errors
        };
    }
    /**
     * Fetch bulk revocation status from API
     */
    async fetchBulkRevocationStatus(delegationIds, timeoutMs) {
        const url = `${this.config.bridgeUrl}/delegation/bulk-revocation-status`;
        const requestBody = {
            delegationIds,
            timeoutMs: timeoutMs || 5000
        };
        return this.withRetry(async () => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            const results = new Map();
            for (const item of data.results || []) {
                results.set(item.delegationId, {
                    delegationId: item.delegationId,
                    isRevoked: item.isRevoked || false,
                    revokedAt: item.revokedAt ? new Date(item.revokedAt) : undefined,
                    reason: item.reason,
                    priority: item.priority,
                    emergencyRevocation: item.emergencyRevocation,
                    revokedBy: item.revokedBy,
                    lastChecked: new Date()
                });
            }
            return results;
        });
    }
    /**
     * Request emergency revocation of a delegation
     */
    async emergencyRevoke(request) {
        const url = `${this.config.bridgeUrl}/delegation/${request.delegationId}/emergency-revoke`;
        return this.withRetry(async () => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: request.reason,
                    relatedDelegations: request.relatedDelegations,
                    signature: request.signature,
                    urgency: request.urgency
                })
            });
            if (!response.ok) {
                throw new Error(`Emergency revocation failed: HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            // Invalidate cache
            if (this.cache) {
                this.cache.invalidate(request.delegationId);
                request.relatedDelegations?.forEach(id => this.cache?.invalidate(id));
            }
            return data.success === true;
        });
    }
    /**
     * Get revocation system metrics
     */
    async getMetrics() {
        const url = `${this.config.bridgeUrl}/delegation/revocation-metrics`;
        return this.withRetry(async () => {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                totalRevocations: data.totalRevocations || 0,
                emergencyRevocations: data.emergencyRevocations || 0,
                circuitBreakerTriggers: data.circuitBreakerTriggers || 0,
                averageRevocationLatency: data.averageRevocationLatency || 0,
                revocationRate: data.revocationRate || 0,
                systemHealth: data.systemHealth || 'UNKNOWN'
            };
        });
    }
    /**
     * Subscribe to revocation events
     */
    onRevocation(callback) {
        const listener = (e) => callback(e.detail);
        this.eventEmitter.on('revocation', listener);
        // Return unsubscribe function
        return () => this.eventEmitter.off('revocation', listener);
    }
    /**
     * Subscribe to emergency revocation events
     */
    onEmergencyRevocation(callback) {
        const listener = (e) => callback(e.detail);
        this.eventEmitter.on('emergency-revocation', listener);
        return () => this.eventEmitter.off('emergency-revocation', listener);
    }
    /**
     * Subscribe to revocation events for a specific delegation
     */
    onDelegationRevocation(delegationId, callback) {
        const listener = (e) => callback(e.detail);
        this.eventEmitter.on(`revocation:${delegationId}`, listener);
        return () => this.eventEmitter.off(`revocation:${delegationId}`, listener);
    }
    /**
     * Test connection to revocation service
     */
    async testConnection() {
        const url = `${this.config.bridgeUrl}/health`;
        const response = await fetch(url, {
            method: 'GET',
            timeout: 5000
        });
        if (!response.ok) {
            throw new Error(`Bridge service unavailable: ${response.status}`);
        }
    }
    /**
     * Retry wrapper for API calls
     */
    async withRetry(operation) {
        const { maxRetries, retryDelayMs, exponentialBackoff } = this.config.retryConfig;
        let lastError;
        let delay = retryDelayMs;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    break; // Last attempt failed
                }
                console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, delay));
                if (exponentialBackoff) {
                    delay *= 2;
                }
            }
        }
        throw lastError;
    }
    /**
     * Get client statistics
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            cache: this.cache?.getStats(),
            websocket: {
                enabled: !!this.wsClient,
                connected: this.wsClient?.getConnectionState() === 'CONNECTED'
            },
            config: {
                cacheEnabled: this.config.cacheEnabled,
                eventSubscriptionEnabled: this.config.enableEventSubscription,
                offlineMode: this.config.offline?.enabled
            }
        };
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache?.clear();
    }
    /**
     * Close the client and cleanup resources
     */
    async close() {
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        this.clearCache();
        this.isInitialized = false;
    }
}
exports.RevocationClient = RevocationClient;
/**
 * Create a revocation client with default configuration
 */
function createRevocationClient(bridgeUrl, options) {
    const config = {
        bridgeUrl,
        websocketUrl: bridgeUrl.replace('http', 'ws') + '/ws/revocations',
        enableEventSubscription: true,
        cacheEnabled: true,
        cacheTtlMs: 30000,
        retryConfig: {
            maxRetries: 3,
            retryDelayMs: 1000,
            exponentialBackoff: true
        },
        offline: {
            enabled: true,
            fallbackBehavior: 'DENY'
        },
        ...options
    };
    return new RevocationClient(config);
}
exports.createRevocationClient = createRevocationClient;
/**
 * Utility function to check multiple delegations quickly
 */
async function checkDelegationRevocations(bridgeUrl, delegationIds) {
    const client = createRevocationClient(bridgeUrl, {
        cacheEnabled: false, // Don't cache for one-off checks
        enableEventSubscription: false
    });
    try {
        await client.initialize();
        const result = await client.bulkCheckRevocation({ delegationIds });
        const revocationMap = new Map();
        for (const [id, status] of result.results) {
            revocationMap.set(id, status.isRevoked);
        }
        return revocationMap;
    }
    finally {
        await client.close();
    }
}
exports.checkDelegationRevocations = checkDelegationRevocations;
