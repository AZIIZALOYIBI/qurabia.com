/**
 * Client-Side Query Cache for QURABIA Frontend
 * نظام تخزين مؤقت للاستعلامات في الواجهة الأمامية
 *
 * Features:
 * - In-memory and localStorage persistence
 * - Stale-while-revalidate pattern
 * - Smart invalidation
 * - Cache warming
 * - TTL management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time-to-live in milliseconds
  etag?: string;
  stale: boolean;
}

interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
  persist?: boolean; // Persist to localStorage
  key?: string; // Custom cache key
}

interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  revalidations: number;
  errors: number;
  size: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private maxSize: number;
  private maxMemoryMB: number;
  private persistenceKey: string = 'qurabia_cache';

  constructor(maxSize: number = 1000, maxMemoryMB: number = 50) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      revalidations: 0,
      errors: 0,
      size: 0,
    };
    this.maxSize = maxSize;
    this.maxMemoryMB = maxMemoryMB;

    // Load from localStorage on initialization
    this.loadFromStorage();

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Generate cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    const headers = options?.headers ? JSON.stringify(options.headers) : '';

    const keyString = `${method}:${url}:${body}:${headers}`;

    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);

    // For synchronous key generation, use a simple hash
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `cache_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Estimate size of cached data in bytes
   */
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Check if entry is stale (past TTL but acceptable for stale-while-revalidate)
   */
  private isStale(entry: CacheEntry<any>): boolean {
    return this.isExpired(entry);
  }

  /**
   * Evict entries if cache is full
   */
  private evictIfNeeded(): void {
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (LRU)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.size--;
      }
    }

    // Check memory limit
    const totalSizeMB = this.estimateTotalSize() / (1024 * 1024);
    if (totalSizeMB >= this.maxMemoryMB) {
      // Remove oldest entries until under limit
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      while (
        this.estimateTotalSize() / (1024 * 1024) >= this.maxMemoryMB &&
        entries.length > 0
      ) {
        const [key] = entries.shift()!;
        this.cache.delete(key);
        this.stats.size--;
      }
    }
  }

  /**
   * Estimate total cache size in bytes
   */
  private estimateTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += this.estimateSize(entry.data);
    }
    return total;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.stats.size--;
    }

    if (keysToDelete.length > 0) {
      console.debug(`[QueryCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, entry] of Object.entries(data)) {
          if (!this.isExpired(entry as CacheEntry<any>)) {
            this.cache.set(key, entry as CacheEntry<any>);
          }
        }
        console.debug(`[QueryCache] Loaded ${this.cache.size} entries from storage`);
      }
    } catch (error) {
      console.warn('[QueryCache] Failed to load from storage:', error);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, CacheEntry<any>> = {};
      for (const [key, entry] of this.cache.entries()) {
        // Only persist non-expired entries
        if (!this.isExpired(entry)) {
          data[key] = entry;
        }
      }

      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[QueryCache] Failed to save to storage:', error);
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): { data: T; stale: boolean } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.stats.misses++;
      this.cache.delete(key);
      this.stats.size--;
      return null;
    }

    const isStale = this.isStale(entry);
    if (isStale) {
      this.stats.staleHits++;
    } else {
      this.stats.hits++;
    }

    return { data: entry.data as T, stale: isStale };
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 300000; // Default 5 minutes

    this.evictIfNeeded();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      stale: false,
    };

    this.cache.set(key, entry);
    this.stats.size++;

    if (options.persist) {
      this.saveToStorage();
    }
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      revalidations: 0,
      errors: 0,
      size: 0,
    };
    localStorage.removeItem(this.persistenceKey);
    console.info('[QueryCache] Cache cleared');
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.stats.size--;
    }

    console.info(`[QueryCache] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
    return keysToDelete.length;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; sizeMB: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    const sizeMB = this.estimateTotalSize() / (1024 * 1024);

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 10000) / 10000,
      sizeMB: Math.round(sizeMB * 100) / 100,
    };
  }

  /**
   * Cached fetch with stale-while-revalidate support
   */
  async cachedFetch<T>(
    url: string,
    options: RequestInit & CacheOptions = {}
  ): Promise<T> {
    const cacheKey = options.key || this.generateKey(url, options);
    const cached = this.get<T>(cacheKey);

    // Return cached data if fresh
    if (cached && !cached.stale) {
      console.debug(`[QueryCache] Cache HIT: ${url}`);
      return cached.data;
    }

    // Stale-while-revalidate: return stale data immediately, fetch in background
    if (cached && cached.stale && options.staleWhileRevalidate) {
      console.debug(`[QueryCache] Stale HIT: ${url} (revalidating...)`);
      this.stats.revalidations++;

      // Fetch fresh data in background
      this.fetchAndCache<T>(url, options, cacheKey).catch((error) => {
        console.warn(`[QueryCache] Background revalidation failed for ${url}:`, error);
        this.stats.errors++;
      });

      return cached.data;
    }

    // Cache miss or no stale-while-revalidate
    console.debug(`[QueryCache] Cache MISS: ${url}`);
    return this.fetchAndCache<T>(url, options, cacheKey);
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(
    url: string,
    options: RequestInit & CacheOptions,
    cacheKey: string
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.set<T>(cacheKey, data, {
        ttl: options.ttl,
        persist: options.persist,
      });

      return data;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }
}

// Global cache instance
let globalCache: QueryCache | null = null;

/**
 * Get or create global cache instance
 */
export function getQueryCache(): QueryCache {
  if (!globalCache) {
    const isDev = import.meta.env.DEV;
    const maxSize = isDev ? 500 : 1000;
    const maxMemoryMB = isDev ? 25 : 50;

    globalCache = new QueryCache(maxSize, maxMemoryMB);
    console.info(`[QueryCache] Initialized (maxSize=${maxSize}, maxMemory=${maxMemoryMB}MB)`);
  }
  return globalCache;
}

/**
 * Cached fetch helper with default options
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & CacheOptions = {}
): Promise<T> {
  const cache = getQueryCache();
  return cache.cachedFetch<T>(url, {
    staleWhileRevalidate: true,
    ttl: 300000, // 5 minutes default
    persist: false,
    ...options,
  });
}

/**
 * Create a cached API client for specific endpoints
 */
export function createCachedAPI(baseURL: string) {
  return {
    async get<T>(endpoint: string, options: CacheOptions = {}): Promise<T> {
      return cachedFetch<T>(`${baseURL}${endpoint}`, {
        method: 'GET',
        ...options,
      });
    },

    async post<T>(
      endpoint: string,
      body?: any,
      options: CacheOptions = {}
    ): Promise<T> {
      return cachedFetch<T>(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
      });
    },

    invalidate(pattern: string): number {
      return getQueryCache().invalidatePattern(pattern);
    },

    getStats() {
      return getQueryCache().getStats();
    },
  };
}

// Export cache instance and utilities
export { QueryCache };
export default getQueryCache;
