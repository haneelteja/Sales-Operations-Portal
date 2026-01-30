/**
 * Query-specific configurations for React Query
 * Optimizes cache settings based on data volatility
 */

export const queryConfigs = {
  // Static data - cache longer (rarely changes)
  customers: {
    staleTime: 10 * 60 * 1000, // 10 minutes - data considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  skuConfig: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  factoryPricing: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Dynamic data - shorter cache (frequent updates)
  transactions: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount for fresh data
  },
  
  recentTransactions: {
    staleTime: 10 * 1000, // 10 seconds - very fresh
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true, // Refetch when user returns
    refetchOnMount: true,
  },
  
  orders: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  factoryPayables: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  transportExpenses: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  receivables: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  // Dashboard metrics - moderate cache
  dashboardMetrics: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  
  dashboardProfit: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  },
  
  // Reports - longer cache (less frequent access)
  reports: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // User management - moderate cache
  userManagement: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
} as const;

/**
 * Helper to get query config by key
 */
export function getQueryConfig(key: string) {
  // Map query keys to configs
  const keyMap: Record<string, keyof typeof queryConfigs> = {
    'customers': 'customers',
    'customers-for-availability': 'customers',
    'sku-configurations': 'skuConfig',
    'sku-configurations-for-availability': 'skuConfig',
    'factory-pricing': 'factoryPricing',
    'sales-transactions': 'transactions',
    'recent-transactions': 'recentTransactions',
    'orders': 'orders',
    'current-orders': 'orders',
    'orders-dispatch': 'orders',
    'factory-transactions': 'factoryPayables',
    'factory-summary': 'factoryPayables',
    'transport-expenses': 'transportExpenses',
    'receivables': 'receivables',
    'dashboard-metrics': 'dashboardMetrics',
    'dashboard-profit': 'dashboardProfit',
    'factory-report': 'reports',
    'client-report': 'reports',
    'transport-report': 'reports',
    'labels-report': 'reports',
    'user-management': 'userManagement',
  };
  
  const configKey = keyMap[key] || 'transactions'; // Default to transactions config
  return queryConfigs[configKey];
}
