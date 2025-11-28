/**
 * Optimized Database Hooks with Redis Caching
 * 
 * This file provides optimized versions of database hooks
 * that integrate with Redis caching for improved performance
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CacheService, CACHE_TTL } from "@/lib/cache";
import type { 
  Customer, 
  SalesTransaction, 
  FactoryPayable, 
  TransportExpense,
  LabelPurchase,
  LabelPayment,
  Order,
  UserManagementRecord
} from "@/types/database";

// Generic error handler
const handleError = (error: Error, toast: { toast: (options: { title: string; description: string; variant?: string }) => void }, operation: string) => {
  console.error(`Error ${operation}:`, error);
  toast.toast({
    title: "Error",
    description: error.message || `Failed to ${operation}`,
    variant: "destructive",
  });
};

// Generic success handler
const handleSuccess = (toast: { toast: (options: { title: string; description: string }) => void }, operation: string) => {
  toast.toast({
    title: "Success",
    description: `${operation} completed successfully`,
  });
};

// ==============================================
// OPTIMIZED CUSTOMERS HOOK
// ==============================================

export const useCustomersOptimized = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      // Try cache first
      const cached = await CacheService.getCustomers();
      if (cached) {
        return cached as Customer[];
      }

      // Fetch from database
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku, price_per_case, created_at")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      
      if (error) throw error;
      
      // Cache the result
      if (data) {
        await CacheService.setCustomers(data);
      }
      
      return data as Customer[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// ==============================================
// OPTIMIZED SALES TRANSACTIONS HOOK
// ==============================================

export const useSalesTransactionsOptimized = () => {
  return useQuery({
    queryKey: ["sales-transactions"],
    queryFn: async () => {
      // Try cache first
      const cached = await CacheService.getTransactions();
      if (cached) {
        return cached;
      }

      // Fetch from database with optimized query
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`
          id,
          customer_id,
          transaction_type,
          amount,
          quantity,
          sku,
          transaction_date,
          created_at,
          customers (
            id,
            client_name,
            branch
          )
        `)
        .order("created_at", { ascending: false })
        .limit(1000); // Limit to prevent huge queries
      
      if (error) throw error;
      
      // Cache the result
      if (data) {
        await CacheService.setTransactions(data);
      }
      
      return data as (SalesTransaction & { customers: Customer })[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
};

// ==============================================
// OPTIMIZED RECEIVABLES HOOK (Using Database Function)
// ==============================================

export const useReceivablesOptimized = () => {
  return useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      // Try cache first
      const cached = await CacheService.getReceivables();
      if (cached) {
        return cached;
      }

      // Use optimized database function
      const { data, error } = await supabase.rpc('get_customer_receivables');
      
      if (error) {
        // Fallback to client-side calculation if function doesn't exist
        const { data: transactions } = await supabase
          .from("sales_transactions")
          .select(`
            *,
            customers (
              id,
              client_name,
              branch
            )
          `)
          .order("created_at", { ascending: false });
        
        if (!transactions) return [];
        
        // Client-side calculation (fallback)
        const customerMap = new Map();
        transactions.forEach(transaction => {
          const customerId = transaction.customer_id;
          const customer = transaction.customers;
          
          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
              customer,
              totalSales: 0,
              totalPayments: 0,
              transactions: []
            });
          }
          
          const customerData = customerMap.get(customerId);
          customerData.transactions.push(transaction);
          
          if (transaction.transaction_type === 'sale') {
            customerData.totalSales += transaction.amount || 0;
          } else if (transaction.transaction_type === 'payment') {
            customerData.totalPayments += transaction.amount || 0;
          }
        });
        
        const receivables = Array.from(customerMap.values()).map(data => ({
          ...data,
          outstanding: data.totalSales - data.totalPayments
        })).filter(data => data.outstanding > 0);
        
        await CacheService.setReceivables(receivables);
        return receivables;
      }
      
      // Cache the result
      if (data) {
        await CacheService.setReceivables(data);
      }
      
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// ==============================================
// OPTIMIZED DASHBOARD METRICS HOOK
// ==============================================

export const useDashboardMetricsOptimized = () => {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      // Try cache first
      const cached = await CacheService.getDashboardMetrics();
      if (cached) {
        return cached;
      }

      // Use optimized database function if available
      const { data: functionData, error: functionError } = await supabase.rpc('get_dashboard_metrics');
      
      if (!functionError && functionData) {
        const metrics = functionData[0];
        await CacheService.setDashboardMetrics(metrics);
        return metrics;
      }

      // Fallback to individual queries
      const { count: totalClients } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { data: receivables } = await CacheService.getReceivables();
      const totalOutstanding = receivables?.reduce((sum: number, r: { outstanding?: number }) => sum + (r.outstanding || 0), 0) || 0;

      const { data: factory } = await supabase
        .from("factory_payables")
        .select("amount, transaction_type");
      
      const totalProduction = factory
        ?.filter(f => f.transaction_type === "production")
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
      
      const totalFactoryPayments = factory
        ?.filter(f => f.transaction_type === "payment")
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

      const factoryOutstanding = totalProduction - totalFactoryPayments;

      const highValueCustomers = receivables?.filter((r: { outstanding?: number }) => (r.outstanding || 0) > 50000).length || 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentTransactions } = await supabase
        .from("sales_transactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      const metrics = {
        totalClients: totalClients || 0,
        totalOutstanding,
        factoryOutstanding,
        highValueCustomers,
        recentTransactions: recentTransactions || 0
      };

      await CacheService.setDashboardMetrics(metrics);
      return metrics;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// ==============================================
// OPTIMIZED MUTATIONS WITH CACHE INVALIDATION
// ==============================================

export const useCreateCustomerOptimized = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      // Invalidate Redis cache
      await CacheService.invalidateCustomers();
      handleSuccess(toast, "Customer created");
    },
    onError: (error) => handleError(error, toast, "create customer"),
  });
};

export const useCreateSalesTransactionOptimized = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transactionData: Partial<SalesTransaction>) => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .insert(transactionData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ["sales-transactions"] });
      const previousTransactions = queryClient.getQueryData(["sales-transactions"]);
      
      queryClient.setQueryData(["sales-transactions"], (old: SalesTransaction[] | undefined): SalesTransaction[] => [
        { ...newTransaction, id: 'temp-' + Date.now() } as SalesTransaction,
        ...(old || [])
      ]);
      
      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      queryClient.setQueryData(["sales-transactions"], context?.previousTransactions);
      handleError(err, toast, "record transaction");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["receivables"] });
      // Invalidate Redis cache
      await CacheService.invalidateTransactions();
      handleSuccess(toast, "Transaction recorded");
    },
  });
};

// ==============================================
// BATCH QUERY OPTIMIZATION
// ==============================================

/**
 * Batch fetch factory pricing for multiple SKUs
 * Prevents N+1 query problem
 */
export const useFactoryPricingBatch = (skus: string[]) => {
  return useQuery({
    queryKey: ["factory-pricing-batch", skus],
    queryFn: async () => {
      if (skus.length === 0) return new Map();

      // Try cache first
      const cachedResults = await CacheService.mget(skus.map(sku => `pricing:latest:${sku}`));
      const pricingMap = new Map<string, number>();
      
      const uncachedSkus: string[] = [];
      skus.forEach((sku, index) => {
        if (cachedResults[index]) {
          pricingMap.set(sku, cachedResults[index].cost_per_case);
        } else {
          uncachedSkus.push(sku);
        }
      });

      // Fetch uncached SKUs
      if (uncachedSkus.length > 0) {
        const { data, error } = await supabase
          .from("factory_pricing")
          .select("sku, cost_per_case, pricing_date")
          .in("sku", uncachedSkus)
          .order("pricing_date", { ascending: false });

        if (error) throw error;

        // Group by SKU and get latest
        const latestBySku = new Map<string, { sku: string; [key: string]: unknown }>();
        data?.forEach(p => {
          if (!latestBySku.has(p.sku)) {
            latestBySku.set(p.sku, p);
          }
        });

        // Cache and add to map
        latestBySku.forEach((pricing, sku) => {
          pricingMap.set(sku, pricing.cost_per_case);
          CacheService.setLatestPricing(sku, pricing);
        });
      }

      return pricingMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    enabled: skus.length > 0,
  });
};

