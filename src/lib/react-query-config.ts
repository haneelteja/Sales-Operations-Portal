import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized React Query configuration
 * Reduces unnecessary network requests and improves caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache retention (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on component mount if data is fresh
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchInterval: false, // No automatic polling
    },
    mutations: {
      retry: 1, // Retry failed mutations once
      onError: (error) => {
        // Global error handling for mutations
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Helper to invalidate related queries when data changes
 */
export const invalidateRelatedQueries = (table: string) => {
  const invalidationMap: Record<string, string[]> = {
    'sales_transactions': ['sales-transactions', 'receivables', 'dashboard-metrics', 'dashboard-profit'],
    'customers': ['customers', 'receivables'],
    'factory_payables': ['factory-payables', 'dashboard-profit', 'dashboard-metrics'],
    'transport_expenses': ['transport-expenses', 'dashboard-profit'],
    'orders': ['orders', 'orders-dispatch'],
    'orders_dispatch': ['orders-dispatch'],
    'factory_pricing': ['factory-pricing'],
    'label_purchases': ['label-purchases', 'label-availability', 'dashboard-profit'],
    'label_payments': ['label-payments'],
  };
  
  const queriesToInvalidate = invalidationMap[table] || [table];
  queriesToInvalidate.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

