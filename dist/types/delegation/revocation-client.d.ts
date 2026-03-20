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
/// <reference types="node" />
export interface RevocationClientConfig {
    bridgeUrl: string;
    websocketUrl?: string;
    enableEventSubscription?: boolean;
    cacheEnabled?: boolean;
    cacheTtlMs?: number;
    retryConfig?: {
        maxRetries: number;
        retryDelayMs: number;
        exponentialBackoff: boolean;
    };
    offline?: {
        enabled: boolean;
        fallbackBehavior: 'ALLOW' | 'DENY';
    };
}
export interface RevocationStatus {
    delegationId: string;
    isRevoked: boolean;
    revokedAt?: Date;
    reason?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    emergencyRevocation?: boolean;
    revokedBy?: string;
    lastChecked: Date;
}
export interface RevocationEvent {
    type: 'REVOKED' | 'EMERGENCY_REVOKED' | 'CIRCUIT_BREAKER_TRIGGERED';
    delegationId: string;
    timestamp: Date;
    reason: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    metadata?: {
        relatedDelegations?: string[];
        suspiciousActivity?: {
            type: string;
            severity: number;
            description: string;
        };
    };
}
export interface BulkRevocationRequest {
    delegationIds: string[];
    priority?: 'NORMAL' | 'HIGH';
    timeoutMs?: number;
}
export interface BulkRevocationResponse {
    results: Map<string, RevocationStatus>;
    totalChecked: number;
    totalRevoked: number;
    latencyMs: number;
    errors: Map<string, string>;
}
export interface EmergencyRevocationRequest {
    delegationId: string;
    reason: string;
    relatedDelegations?: string[];
    signature: string;
    urgency: 'HIGH' | 'CRITICAL';
}
export interface RevocationMetrics {
    totalRevocations: number;
    emergencyRevocations: number;
    circuitBreakerTriggers: number;
    averageRevocationLatency: number;
    revocationRate: number;
    systemHealth: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
}
/**
 * Event emitter for revocation notifications
 */
export declare class RevocationEventEmitter extends EventTarget {
    emit(type: string, data: any): void;
    on(type: string, listener: (event: CustomEvent) => void): void;
    off(type: string, listener: (event: CustomEvent) => void): void;
}
/**
 * Main revocation client
 */
export declare class RevocationClient {
    private config;
    private cache?;
    private eventEmitter;
    private wsClient?;
    private isInitialized;
    constructor(config: RevocationClientConfig);
    /**
     * Initialize the revocation client
     */
    initialize(): Promise<void>;
    /**
     * Check if a delegation is revoked
     */
    isRevoked(delegationId: string): Promise<boolean>;
    /**
     * Get detailed revocation status
     */
    getRevocationStatus(delegationId: string): Promise<RevocationStatus>;
    /**
     * Fetch revocation status from API
     */
    private fetchRevocationStatus;
    /**
     * Bulk check revocation status for multiple delegations
     */
    bulkCheckRevocation(request: BulkRevocationRequest): Promise<BulkRevocationResponse>;
    /**
     * Fetch bulk revocation status from API
     */
    private fetchBulkRevocationStatus;
    /**
     * Request emergency revocation of a delegation
     */
    emergencyRevoke(request: EmergencyRevocationRequest): Promise<boolean>;
    /**
     * Get revocation system metrics
     */
    getMetrics(): Promise<RevocationMetrics>;
    /**
     * Subscribe to revocation events
     */
    onRevocation(callback: (event: RevocationEvent) => void): () => void;
    /**
     * Subscribe to emergency revocation events
     */
    onEmergencyRevocation(callback: (event: RevocationEvent) => void): () => void;
    /**
     * Subscribe to revocation events for a specific delegation
     */
    onDelegationRevocation(delegationId: string, callback: (event: RevocationEvent) => void): () => void;
    /**
     * Test connection to revocation service
     */
    private testConnection;
    /**
     * Retry wrapper for API calls
     */
    private withRetry;
    /**
     * Get client statistics
     */
    getStats(): {
        initialized: boolean;
        cache: {
            totalEntries: number;
            validEntries: number;
            expiredEntries: number;
            hitRate: number;
        } | undefined;
        websocket: {
            enabled: boolean;
            connected: boolean;
        };
        config: {
            cacheEnabled: boolean | undefined;
            eventSubscriptionEnabled: boolean | undefined;
            offlineMode: boolean | undefined;
        };
    };
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Close the client and cleanup resources
     */
    close(): Promise<void>;
}
/**
 * Create a revocation client with default configuration
 */
export declare function createRevocationClient(bridgeUrl: string, options?: Partial<RevocationClientConfig>): RevocationClient;
/**
 * Utility function to check multiple delegations quickly
 */
export declare function checkDelegationRevocations(bridgeUrl: string, delegationIds: string[]): Promise<Map<string, boolean>>;
