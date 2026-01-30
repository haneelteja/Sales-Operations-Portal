/**
 * Hook for managing React Query cache invalidation
 * Ensures related queries are invalidated when data changes
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Map of table names to related query keys that should be invalidated
 */
const invalidationMap: Record<string, string[]> = {
  'sales_transactions': [
    'sales-transactions',
    'recent-transactions',
    'receivables',
    'dashboard-metrics',
    'dashboard-profit',
    'client-report',
  ],
  'customers': [
    'customers',
    'customers-for-availability',
    'receivables',
    'sku-configurations-for-availability',
  ],
  'factory_payables': [
    'factory-transactions',
    'factory-summary',
    'factory-report',
    'dashboard-profit',
    'dashboard-metrics',
  ],
  'transport_expenses': [
    'transport-expenses',
    'transport-report',
    'dashboard-profit',
    'dashboard-metrics',
  ],
  'orders': [
    'orders',
    'current-orders',
    'orders-dispatch',
  ],
  'factory_pricing': [
    'factory-pricing',
  ],
  'sku_configurations': [
    'sku-configurations',
    'sku-configurations-for-availability',
  ],
  'label_purchases': [
    'label-purchases',
    'labels-report',
    'dashboard-profit',
  ],
  'label_payments': [
    'label-payments',
    'labels-report',
  ],
};

/**
 * Hook for cache invalidation
 * 
 * @example
 * const { invalidateRelated } = useCacheInvalidation();
 * 
 * const mutation = useMutation({
 *   mutationFn: async (data) => {
 *     await supabase.from('sales_transactions').insert(data);
 *   },
 *   onSuccess: () => {
 *     invalidateRelated('sales_transactions');
 *   },
 * });
 */
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();
  
  /**
   * Invalidate all queries related to a table
   */
  const invalidateRelated = useCallback((table: string) => {
    const queriesToInvalidate = invalidationMap[table] || [table];
    
    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ 
        queryKey: [queryKey],
        refetchType: 'active', // Only refetch active queries
      });
    });
  }, [queryClient]);
  
  /**
   * Invalidate a specific query by key
   */
  const invalidateQuery = useCallback((queryKey: string | string[]) => {
    queryClient.invalidateQueries({ 
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      refetchType: 'active',
    });
  }, [queryClient]);
  
  /**
   * Invalidate all queries (use sparingly)
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ refetchType: 'active' });
  }, [queryClient]);
  
  /**
   * Remove queries from cache (without refetching)
   */
  const removeQueries = useCallback((queryKey: string | string[]) => {
    queryClient.removeQueries({ 
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    });
  }, [queryClient]);
  
  /**
   * Prefetch related queries (for better UX)
   */
  const prefetchRelated = useCallback(async (table: string) => {
    const queriesToPrefetch = invalidationMap[table] || [];
    
    // Only prefetch commonly accessed queries
    const commonQueries = ['customers', 'factory-pricing', 'sku-configurations'];
    const queriesToPrefetchFiltered = queriesToPrefetch.filter(key => 
      commonQueries.includes(key)
    );
    
    // Prefetch logic would go here if needed
    // For now, just return
    return Promise.resolve();
  }, []);
  
  return {
    invalidateRelated,
    invalidateQuery,
    invalidateAll,
    removeQueries,
    prefetchRelated,
  };
};
