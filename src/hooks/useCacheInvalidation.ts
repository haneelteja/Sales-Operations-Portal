/**
 * Hook for managing React Query cache invalidation
 * Ensures related queries are invalidated when data changes
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryConfigs } from '@/lib/query-configs';

/**
 * Map of table names to related query keys that should be invalidated
 */
const invalidationMap: Record<string, string[]> = {
  'sales_transactions': [
    'sales-transactions',
    'recent-transactions',
    'receivables',
    'receivables-management',
    'receivables-tracking',
    'customer-receivables',
    'dashboard-aggregates',
    'client-report',
  ],
  'customers': [
    'customers',
    'customers-for-availability',
    'customers-management',
    'receivables',
    'sku-configurations-for-availability',
    'dashboard-aggregates',
  ],
  'factory_payables': [
    'factory-transactions',
    'factory-summary',
    'factory-report',
    'dashboard-aggregates',
    'production-records',
  ],
  'transport_expenses': [
    'transport-expenses',
    'transport-report',
    'dashboard-aggregates',
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
    'dashboard-aggregates',
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
   * Prefetch related queries — loads static config data into cache before it's needed
   */
  const prefetchRelated = useCallback(async (table: string) => {
    const queriesToPrefetch = invalidationMap[table] || [];
    const commonQueries = new Set(['customers', 'factory-pricing', 'sku-configurations']);
    const targets = queriesToPrefetch.filter(key => commonQueries.has(key));

    await Promise.all(targets.map(key => {
      if (key === 'customers') {
        return queryClient.prefetchQuery({
          queryKey: ['customers'],
          ...queryConfigs.customers,
          queryFn: () =>
            supabase
              .from('customers')
              .select('id, client_name, branch, sku, price_per_case, pricing_date, created_at, whatsapp_number')
              .eq('is_active', true)
              .eq('is_deprecated', false)
              .order('client_name', { ascending: true })
              .then(({ data, error }) => { if (error) throw error; return data ?? []; }),
        });
      }
      if (key === 'sku-configurations') {
        return queryClient.prefetchQuery({
          queryKey: ['sku-configurations'],
          ...queryConfigs.skuConfig,
          queryFn: () =>
            supabase
              .from('sku_configurations')
              .select('sku, bottles_per_case')
              .order('sku', { ascending: true })
              .then(({ data, error }) => { if (error) throw error; return data ?? []; }),
        });
      }
      if (key === 'factory-pricing') {
        return queryClient.prefetchQuery({
          queryKey: ['factory-pricing'],
          ...queryConfigs.factoryPricing,
          queryFn: () =>
            supabase
              .from('factory_pricing')
              .select('*')
              .order('pricing_date', { ascending: false })
              .then(({ data, error }) => { if (error) throw error; return data ?? []; }),
        });
      }
      return Promise.resolve();
    }));
  }, [queryClient]);
  
  return {
    invalidateRelated,
    invalidateQuery,
    invalidateAll,
    removeQueries,
    prefetchRelated,
  };
};
