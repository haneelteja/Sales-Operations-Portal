/**
 * Cache Service Implementation
 * 
 * This service provides a caching layer using Redis
 * to reduce database queries and improve performance
 */

import redis from './redis';

// ==============================================
// Cache TTL Configuration (in seconds)
// ==============================================

export const CACHE_TTL = {
  CUSTOMERS: 60 * 60, // 1 hour - rarely changes
  SKU_CONFIG: 60 * 60 * 24, // 24 hours - very stable
  PRICING: 60 * 30, // 30 minutes - moderate changes
  RECEIVABLES: 60 * 15, // 15 minutes - frequent updates
  TRANSACTIONS: 60 * 10, // 10 minutes - very frequent
  ORDERS: 60 * 5, // 5 minutes - very frequent
  USER_MANAGEMENT: 60 * 60, // 1 hour - rarely changes
  DASHBOARD_METRICS: 60 * 5, // 5 minutes - frequent updates
  FACTORY_PAYABLES: 60 * 10, // 10 minutes
  TRANSPORT_EXPENSES: 60 * 15, // 15 minutes
  LABEL_PURCHASES: 60 * 15, // 15 minutes
  LABEL_PAYMENTS: 60 * 15, // 15 minutes
} as const;

// ==============================================
// Cache Key Patterns
// ==============================================

export const CACHE_KEYS = {
  customers: {
    all: 'customers:all',
    active: 'customers:active',
    byId: (id: string) => `customers:id:${id}`,
    byClient: (clientName: string) => `customers:client:${clientName}`,
  },
  receivables: {
    all: 'receivables:all',
    byCustomer: (customerId: string) => `receivables:customer:${customerId}`,
  },
  transactions: {
    all: 'transactions:all',
    byCustomer: (customerId: string) => `transactions:customer:${customerId}`,
    byDateRange: (start: string, end: string) => `transactions:date:${start}:${end}`,
  },
  orders: {
    all: 'orders:all',
    pending: 'orders:pending',
    byStatus: (status: string) => `orders:status:${status}`,
  },
  skuConfig: {
    all: 'sku_config:all',
    bySku: (sku: string) => `sku_config:sku:${sku}`,
  },
  pricing: {
    all: 'pricing:all',
    bySku: (sku: string) => `pricing:sku:${sku}`,
    latest: (sku: string) => `pricing:latest:${sku}`,
  },
  dashboard: {
    metrics: 'dashboard:metrics',
  },
} as const;

// ==============================================
// Cache Service Class
// ==============================================

export class CacheService {
  /**
   * Get cached data
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  static async set(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  static async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      // Delete keys one by one (localStorage doesn't support batch delete)
      for (const key of keys) {
        await redis.delete(key);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results = await Promise.all(keys.map(key => this.get<T>(key)));
      return results;
    } catch (error) {
      console.error(`Cache mget error:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   */
  static async mset(items: Array<{ key: string; value: unknown; ttl: number }>): Promise<void> {
    try {
      await Promise.all(items.map(({ key, value, ttl }) => this.set(key, value, ttl)));
    } catch (error) {
      console.error(`Cache mset error:`, error);
    }
  }

  // ==============================================
  // Specific Cache Methods
  // ==============================================

  /**
   * Customers cache
   */
  static async getCustomers() {
    return this.get(CACHE_KEYS.customers.all);
  }

  static async setCustomers(customers: unknown[]) {
    return this.set(CACHE_KEYS.customers.all, customers, CACHE_TTL.CUSTOMERS);
  }

  static async getCustomerById(id: string) {
    return this.get(CACHE_KEYS.customers.byId(id));
  }

  static async setCustomerById(id: string, customer: unknown) {
    return this.set(CACHE_KEYS.customers.byId(id), customer, CACHE_TTL.CUSTOMERS);
  }

  /**
   * Receivables cache
   */
  static async getReceivables() {
    return this.get(CACHE_KEYS.receivables.all);
  }

  static async setReceivables(receivables: unknown[]) {
    return this.set(CACHE_KEYS.receivables.all, receivables, CACHE_TTL.RECEIVABLES);
  }

  /**
   * Transactions cache
   */
  static async getTransactions() {
    return this.get(CACHE_KEYS.transactions.all);
  }

  static async setTransactions(transactions: unknown[]) {
    return this.set(CACHE_KEYS.transactions.all, transactions, CACHE_TTL.TRANSACTIONS);
  }

  /**
   * Orders cache
   */
  static async getOrders() {
    return this.get(CACHE_KEYS.orders.all);
  }

  static async setOrders(orders: unknown[]) {
    return this.set(CACHE_KEYS.orders.all, orders, CACHE_TTL.ORDERS);
  }

  /**
   * Dashboard metrics cache
   */
  static async getDashboardMetrics() {
    return this.get(CACHE_KEYS.dashboard.metrics);
  }

  static async setDashboardMetrics(metrics: unknown) {
    return this.set(CACHE_KEYS.dashboard.metrics, metrics, CACHE_TTL.DASHBOARD_METRICS);
  }

  /**
   * SKU Config cache
   */
  static async getSKUConfig() {
    return this.get(CACHE_KEYS.skuConfig.all);
  }

  static async setSKUConfig(config: unknown[]) {
    return this.set(CACHE_KEYS.skuConfig.all, config, CACHE_TTL.SKU_CONFIG);
  }

  /**
   * Pricing cache
   */
  static async getPricingBySku(sku: string) {
    return this.get(CACHE_KEYS.pricing.bySku(sku));
  }

  static async setPricingBySku(sku: string, pricing: unknown[]) {
    return this.set(CACHE_KEYS.pricing.bySku(sku), pricing, CACHE_TTL.PRICING);
  }

  static async getLatestPricing(sku: string) {
    return this.get(CACHE_KEYS.pricing.latest(sku));
  }

  static async setLatestPricing(sku: string, pricing: unknown) {
    return this.set(CACHE_KEYS.pricing.latest(sku), pricing, CACHE_TTL.PRICING);
  }

  // ==============================================
  // Cache Invalidation Methods
  // ==============================================

  /**
   * Invalidate all customer-related caches
   */
  static async invalidateCustomers() {
    await Promise.all([
      this.invalidate('customers:*'),
      this.invalidate('receivables:*'),
      this.invalidate('transactions:*'),
      this.invalidate('dashboard:*'),
    ]);
  }

  /**
   * Invalidate all transaction-related caches
   */
  static async invalidateTransactions() {
    await Promise.all([
      this.invalidate('transactions:*'),
      this.invalidate('receivables:*'),
      this.invalidate('dashboard:*'),
    ]);
  }

  /**
   * Invalidate all order-related caches
   */
  static async invalidateOrders() {
    await this.invalidate('orders:*');
  }

  /**
   * Invalidate all pricing-related caches
   */
  static async invalidatePricing() {
    await this.invalidate('pricing:*');
  }

  /**
   * Invalidate dashboard cache
   */
  static async invalidateDashboard() {
    await this.invalidate('dashboard:*');
  }

  /**
   * Clear all caches (use with caution)
   */
  static async clearAll() {
    try {
      const keys = await redis.keys('*');
      for (const key of keys) {
        await redis.delete(key);
      }
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  }
}

// ==============================================
// Cache Statistics
// ==============================================

export const getCacheStats = async () => {
  try {
    const allKeys = await redis.keys('*');
    const cacheKeys = allKeys.filter(k => k.startsWith('cache:'));
    
    return {
      connected: redis.status === 'ready',
      totalKeys: cacheKeys.length,
      storageUsed: JSON.stringify(localStorage).length,
      storageQuota: '~5-10MB (browser dependent)',
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
};

