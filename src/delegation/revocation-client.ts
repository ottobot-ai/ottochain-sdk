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
  signature: string; // Cryptographic signature for authorization
  urgency: 'HIGH' | 'CRITICAL';
}

export interface RevocationMetrics {
  totalRevocations: number;
  emergencyRevocations: number;
  circuitBreakerTriggers: number;
  averageRevocationLatency: number;
  revocationRate: number; // revocations per hour
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
}

/**
 * Event emitter for revocation notifications
 */
export class RevocationEventEmitter extends EventTarget {
  emit(type: string, data: any): void {
    this.dispatchEvent(new CustomEvent(type, { detail: data }));
  }

  on(type: string, listener: (event: CustomEvent) => void): void {
    this.addEventListener(type, listener as EventListener);
  }

  off(type: string, listener: (event: CustomEvent) => void): void {
    this.removeEventListener(type, listener as EventListener);
  }
}

/**
 * Local cache for revocation status
 */
class RevocationCache {
  private cache = new Map<string, { status: RevocationStatus; expiresAt: number }>();
  private ttlMs: number;

  constructor(ttlMs: number = 30000) { // 30 seconds default
    this.ttlMs = ttlMs;
  }

  set(delegationId: string, status: RevocationStatus): void {
    this.cache.set(delegationId, {
      status,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  get(delegationId: string): RevocationStatus | null {
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

  invalidate(delegationId: string): void {
    this.cache.delete(delegationId);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        validEntries++;
      } else {
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
  private ws: WebSocket | null = null;
  private url: string;
  private eventEmitter: RevocationEventEmitter;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private _isConnected = false;

  get connected(): boolean {
    return this._isConnected;
  }

  constructor(url: string, eventEmitter: RevocationEventEmitter) {
    this.url = url;
    this.eventEmitter = eventEmitter;
  }

  async connect(): Promise<void> {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('Connected to revocation event stream');
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.eventEmitter.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const revocationEvent = JSON.parse(event.data) as RevocationEvent;
          this.handleRevocationEvent(revocationEvent);
        } catch (error) {
          console.error('Error parsing revocation event:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('Revocation event stream disconnected');
        this._isConnected = false;
        this.eventEmitter.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.eventEmitter.emit('error', { error });
      };

    } catch (error) {
      console.error('Failed to connect to revocation event stream:', error);
      throw error;
    }
  }

  private handleRevocationEvent(event: RevocationEvent): void {
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

  private attemptReconnect(): void {
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

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
  }

  getConnectionState(): 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' {
    if (!this.ws) return 'DISCONNECTED';
    
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
export class RevocationClient {
  private config: RevocationClientConfig;
  private cache?: RevocationCache;
  private eventEmitter = new RevocationEventEmitter();
  private wsClient?: RevocationWebSocketClient;
  private isInitialized = false;

  constructor(config: RevocationClientConfig) {
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
  async initialize(): Promise<void> {
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

    } catch (error) {
      console.error('Failed to initialize revocation client:', error);
      throw error;
    }
  }

  /**
   * Check if a delegation is revoked
   */
  async isRevoked(delegationId: string): Promise<boolean> {
    try {
      const status = await this.getRevocationStatus(delegationId);
      return status.isRevoked;
    } catch (error) {
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
  async getRevocationStatus(delegationId: string): Promise<RevocationStatus> {
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
  private async fetchRevocationStatus(delegationId: string): Promise<RevocationStatus> {
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

      const data = await response.json() as any;
      
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
  async bulkCheckRevocation(request: BulkRevocationRequest): Promise<BulkRevocationResponse> {
    const start = Date.now();
    const results = new Map<string, RevocationStatus>();
    const errors = new Map<string, string>();

    // Check cache for cached results
    const uncachedIds: string[] = [];
    
    if (this.cache) {
      for (const delegationId of request.delegationIds) {
        const cached = this.cache.get(delegationId);
        if (cached) {
          results.set(delegationId, cached);
        } else {
          uncachedIds.push(delegationId);
        }
      }
    } else {
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
      } catch (error) {
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
  private async fetchBulkRevocationStatus(delegationIds: string[], timeoutMs?: number): Promise<Map<string, RevocationStatus>> {
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

      const data = await response.json() as any;
      const results = new Map<string, RevocationStatus>();

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
  async emergencyRevoke(request: EmergencyRevocationRequest): Promise<boolean> {
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

      const data = await response.json() as any;
      
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
  async getMetrics(): Promise<RevocationMetrics> {
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

      const data = await response.json() as any;
      
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
  onRevocation(callback: (event: RevocationEvent) => void): () => void {
    const listener = (e: CustomEvent) => callback(e.detail);
    this.eventEmitter.on('revocation', listener);
    
    // Return unsubscribe function
    return () => this.eventEmitter.off('revocation', listener);
  }

  /**
   * Subscribe to emergency revocation events
   */
  onEmergencyRevocation(callback: (event: RevocationEvent) => void): () => void {
    const listener = (e: CustomEvent) => callback(e.detail);
    this.eventEmitter.on('emergency-revocation', listener);
    
    return () => this.eventEmitter.off('emergency-revocation', listener);
  }

  /**
   * Subscribe to revocation events for a specific delegation
   */
  onDelegationRevocation(delegationId: string, callback: (event: RevocationEvent) => void): () => void {
    const listener = (e: CustomEvent) => callback(e.detail);
    this.eventEmitter.on(`revocation:${delegationId}`, listener);
    
    return () => this.eventEmitter.off(`revocation:${delegationId}`, listener);
  }

  /**
   * Test connection to revocation service
   */
  private async testConnection(): Promise<void> {
    const url = `${this.config.bridgeUrl}/health`;
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: 5000
    } as any);

    if (!response.ok) {
      throw new Error(`Bridge service unavailable: ${response.status}`);
    }
  }

  /**
   * Retry wrapper for API calls
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    const { maxRetries, retryDelayMs, exponentialBackoff } = this.config.retryConfig!;
    
    let lastError: Error;
    let delay = retryDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
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

    throw lastError!;
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
  clearCache(): void {
    this.cache?.clear();
  }

  /**
   * Close the client and cleanup resources
   */
  async close(): Promise<void> {
    if (this.wsClient) {
      this.wsClient.disconnect();
    }
    
    this.clearCache();
    this.isInitialized = false;
  }
}

/**
 * Create a revocation client with default configuration
 */
export function createRevocationClient(bridgeUrl: string, options?: Partial<RevocationClientConfig>): RevocationClient {
  const config: RevocationClientConfig = {
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

/**
 * Utility function to check multiple delegations quickly
 */
export async function checkDelegationRevocations(
  bridgeUrl: string, 
  delegationIds: string[]
): Promise<Map<string, boolean>> {
  const client = createRevocationClient(bridgeUrl, { 
    cacheEnabled: false, // Don't cache for one-off checks
    enableEventSubscription: false 
  });
  
  try {
    await client.initialize();
    const result = await client.bulkCheckRevocation({ delegationIds });
    
    const revocationMap = new Map<string, boolean>();
    for (const [id, status] of result.results) {
      revocationMap.set(id, status.isRevoked);
    }
    
    return revocationMap;
  } finally {
    await client.close();
  }
}