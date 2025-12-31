/**
 * Redis Cache Client Configuration
 * 
 * IMPORTANT: Redis cannot be accessed directly from the browser.
 * This implementation requires a backend API to proxy Redis calls.
 * 
 * For now, this uses localStorage as a fallback cache.
 * To use Redis, you need to:
 * 1. Create a backend API (Node.js/Express) that connects to Redis
 * 2. Create API endpoints for cache operations
 * 3. Update cache.ts to call these API endpoints instead
 * 
 * Alternatively, use Supabase Edge Functions or a serverless function
 * to handle Redis caching server-side.
 */

// Browser-safe cache implementation using localStorage as fallback
// For production, implement a backend API that uses Redis

class BrowserCache {
  private prefix = 'cache:';
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      // Check if expired
      if (parsed.expires && parsed.expires < Date.now()) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return parsed.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      const item = {
        value,
        expires: ttl > 0 ? Date.now() + (ttl * 1000) : null,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, clearing old cache entries');
        this.clearOldEntries();
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const cacheKey = key.replace(this.prefix, '');
          // Simple pattern matching (supports * wildcard)
          if (this.matchPattern(cacheKey, pattern)) {
            keys.push(cacheKey);
          }
        }
      }
      return keys;
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  private clearOldEntries(): void {
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.expires && parsed.expires < Date.now()) {
              keysToDelete.push(key);
            }
          }
        } catch {
          // Skip invalid entries
        }
      }
    }
    keysToDelete.forEach(key => localStorage.removeItem(key));
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  get status(): string {
    return 'ready';
  }

  async disconnect(): Promise<void> {
    // No-op for browser cache
  }
}

// Use browser cache for now (localStorage-based)
// Replace with Redis API calls when backend is ready
const redis = new BrowserCache();

export default redis;

// ==============================================
// Redis Health Check
// ==============================================

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
};

// ==============================================
// Redis Connection Status
// ==============================================

export const getRedisStatus = () => {
  return {
    status: redis.status,
    isReady: redis.status === 'ready',
  };
};

