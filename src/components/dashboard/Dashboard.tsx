import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, memo, useCallback } from "react";
import BusinessAnalyticsChart from "./BusinessAnalyticsChart";
import ClientOverviewPanel from "./ClientOverviewPanel";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnFilter } from "@/components/ui/column-filter";
import { supabase } from "@/integrations/supabase/client";
import { fetchReceivablesTracking, type FetchResult as ReceivablesFetchResult } from "@/lib/receivablesUtils";
import { getQueryConfig } from "@/lib/query-configs";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Building2,
  CreditCard,
  Eye,
  Phone,
  Download,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportJsonToExcel } from "@/services/export/excelExport";

const Dashboard = memo(() => {
  const { toast } = useToast();
  
  // Filter and sort states for Client Receivables Outstanding table
  const [receivablesSearchTerm, setReceivablesSearchTerm] = useState("");
  const debouncedReceivablesSearchTerm = useDebouncedValue(receivablesSearchTerm, 300);
  const [receivablesColumnFilters, setReceivablesColumnFilters] = useState({
    client: "",
    area: "",
    totalSales: "",
    payments: "",
    outstanding: "",
    priority: "",
  });
  const [receivablesColumnSorts, setReceivablesColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    area: null,
    totalSales: null,
    payments: null,
    outstanding: null,
    priority: null,
  });

  // Inventory table state
  const [inventorySearch, setInventorySearch] = useState("");
  const debouncedInventorySearch = useDebouncedValue(inventorySearch, 200);
  const [inventorySort, setInventorySort] = useState<{ col: 'clientName' | 'branch' | 'sku' | 'stock'; dir: 'asc' | 'desc' } | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Single RPC replacing 8 separate Supabase calls (profit, monthly-sales, metrics counts)
  const { data: aggregates } = useQuery({
    queryKey: ["dashboard-aggregates"],
    ...getQueryConfig("dashboard-profit"),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_aggregates');
      if (error) throw error;
      return data as {
        total_sales: number;
        factory_payables: number;
        factory_payments: number;
        transport_expenses: number;
        label_expenses: number;
        total_clients: number;
        recent_transactions: number;
        sale_this_month: number;
        sale_prev_month: number;
      };
    },
  });

  // Derive profit card values from aggregates (no extra DB call)
  const profitData = useMemo(() => {
    if (!aggregates) return null;
    return {
      totalSales: aggregates.total_sales,
      factoryPayables: aggregates.factory_payables,
      transportExpenses: aggregates.transport_expenses,
      profit: aggregates.total_sales - aggregates.factory_payables - aggregates.transport_expenses,
    };
  }, [aggregates]);

  // Derive monthly KPI values from aggregates (no extra DB call)
  const monthlySales = useMemo(() => {
    if (!aggregates) return null;
    return {
      saleThisMonth: aggregates.sale_this_month,
      salePrevMonth: aggregates.sale_prev_month,
    };
  }, [aggregates]);

  // Fetch inventory: factory production qty minus sales qty per client (only where stock > 0)
  const { data: inventoryRows } = useQuery({
    queryKey: ["dashboard-inventory"],
    ...getQueryConfig("dashboard-inventory"),
    queryFn: async () => {
      const [{ data: prodRows }, { data: salesRows }] = await Promise.all([
        supabase
          .from("factory_payables")
          .select("customer_id, sku, quantity, customers(client_name, branch)")
          .eq("transaction_type", "production")
          .not("customer_id", "is", null),
        supabase
          .from("sales_transactions")
          .select("customer_id, sku, quantity, customers(client_name, branch)")
          .eq("transaction_type", "sale"),
      ]);

      // Sum production per (customer_id, sku)
      const prodMap = new Map<string, { clientName: string; branch: string; sku: string; qty: number }>();
      for (const r of prodRows ?? []) {
        const key = `${r.customer_id}|||${r.sku ?? ""}`;
        const existing = prodMap.get(key);
        const clientName = (r.customers as { client_name?: string } | null)?.client_name ?? "";
        const area = (r.customers as { branch?: string } | null)?.branch ?? "";
        if (existing) {
          existing.qty += r.quantity ?? 0;
        } else {
          prodMap.set(key, { clientName, branch: area, sku: r.sku ?? "", qty: r.quantity ?? 0 });
        }
      }

      // Sum sales per (customer_id, sku)
      const salesMap = new Map<string, number>();
      for (const r of salesRows ?? []) {
        const key = `${r.customer_id}|||${r.sku ?? ""}`;
        salesMap.set(key, (salesMap.get(key) ?? 0) + (r.quantity ?? 0));
      }

      // Compute inventory; only return rows where stock > 0
      const result: { clientName: string; branch: string; sku: string; stock: number }[] = [];
      for (const [key, prod] of prodMap.entries()) {
        const sold = salesMap.get(key) ?? 0;
        const stock = prod.qty - sold;
        if (stock > 0) {
          result.push({ clientName: prod.clientName, branch: prod.branch, sku: prod.sku, stock });
        }
      }
      return result.sort((a, b) => a.clientName.localeCompare(b.clientName));
    },
  });

  // Pagination state for receivables table
  const [receivablesPage, setReceivablesPage] = useState(1);
  const receivablesPageSize = 25;

  // Fetch client receivables data (limited to recent transactions for performance)
  const { data: receivables } = useQuery({
    queryKey: ["receivables"],
    ...getQueryConfig("receivables"),
    queryFn: async () => {
      // Limit to last 90 days or max 2000 records for performance
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: transactions } = await supabase
        .from("sales_transactions")
        .select(`
          id,
          customer_id,
          transaction_type,
          amount,
          transaction_date,
          created_at,
          customers (
            id,
            client_name,
            branch
          )
        `)
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000); // Safety limit

      if (!transactions) return [];

      // Group transactions by customer and calculate outstanding amounts chronologically
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

      // Calculate outstanding amounts chronologically for each customer
      const calculateCumulativeOutstanding = (
        customerTxs: Array<{
          transaction_type: 'sale' | 'payment';
          amount: number | null;
          transaction_date: string;
          created_at: string;
        }>
      ) => {
        // Sort all transactions chronologically (oldest first)
        const sortedTxs = customerTxs.sort((a, b) => {
          const dateA = new Date(a.transaction_date).getTime();
          const dateB = new Date(b.transaction_date).getTime();
          if (dateA === dateB) {
            // If same date, sort by created_at to maintain order
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return dateA - dateB;
        });
        
        let cumulativeOutstanding = 0;
        sortedTxs.forEach(transaction => {
          if (transaction.transaction_type === 'sale') {
            cumulativeOutstanding += transaction.amount || 0;
          } else if (transaction.transaction_type === 'payment') {
            cumulativeOutstanding -= transaction.amount || 0;
          }
        });
        
        return cumulativeOutstanding;
      };

      // Convert to array and calculate outstanding amounts chronologically
      return Array.from(customerMap.values()).map(data => ({
        ...data,
        outstanding: calculateCumulativeOutstanding(data.transactions)
      })).filter(data => data.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);
    },
  });

  // Payment follow-up counts — uses same data + payment-pattern logic as Receivables Tracker
  const { data: receivablesTracking } = useQuery<ReceivablesFetchResult>({
    queryKey: ['receivables-tracking'],
    queryFn: fetchReceivablesTracking,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const paymentFollowupMetrics = useMemo(() => {
    if (!receivablesTracking) return null;
    let overdue = 0;
    let dueSoon = 0;
    for (const row of receivablesTracking.rows) {
      if (row.outstanding <= 0) continue;
      if (row.paymentStatus === 'OVERDUE') overdue++;
      else if (row.paymentStatus === 'DUE SOON') dueSoon++;
    }
    return { overdue, dueSoon };
  }, [receivablesTracking]);

  // Credit & Risk metrics — credit limit per client = avg monthly sales (totalSales / 3 months)
  const creditRiskMetrics = useMemo(() => {
    if (!receivables) return null;
    let overLimit = 0;
    let warning = 0;
    let totalCreditLimit = 0;
    let clientCount = 0;
    for (const r of receivables) {
      const creditLimit = (r.totalSales || 0) / 3;
      totalCreditLimit += creditLimit;
      clientCount++;
      if (r.outstanding > creditLimit) overLimit++;
      else if (r.outstanding > creditLimit * 0.75) warning++;
    }
    const avgCreditLimit = clientCount > 0 ? totalCreditLimit / clientCount : 0;
    return { overLimit, warning, avgCreditLimit };
  }, [receivables]);

  // Derive metrics from aggregates + receivables (no extra DB call)
  const metrics = useMemo(() => {
    if (!aggregates) return null;
    const totalOutstanding = receivables?.reduce((sum, r) => sum + (r.outstanding || 0), 0) || 0;
    const highValueCustomers = receivables?.filter(r => (r.outstanding || 0) > 50000).length || 0;
    return {
      totalClients: aggregates.total_clients,
      totalOutstanding,
      factoryOutstanding: aggregates.factory_payables - aggregates.factory_payments,
      highValueCustomers,
      recentTransactions: aggregates.recent_transactions,
    };
  }, [aggregates, receivables]);

  // Filter and sort handlers for Client Receivables Outstanding
  const handleReceivablesColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setReceivablesColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleReceivablesColumnSortChange = useCallback((columnKey: string, direction: 'asc' | 'desc' | null) => {
    setReceivablesColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  const clearAllReceivablesFilters = useCallback(() => {
    setReceivablesSearchTerm("");
    setReceivablesColumnFilters({
      client: "",
      area: "",
      totalSales: "",
      payments: "",
      outstanding: "",
      priority: "",
    });
    setReceivablesColumnSorts({
      client: null,
      area: null,
      totalSales: null,
      payments: null,
      outstanding: null,
      priority: null,
    });
  }, []);

  // Filtered and sorted Client Receivables Outstanding
  const filteredAndSortedReceivables = useMemo(() => {
    if (!receivables) return [];

    return receivables.filter(receivable => {
      // Global search (using debounced value)
      if (debouncedReceivablesSearchTerm) {
        const searchLower = debouncedReceivablesSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          receivable.customer.client_name?.toLowerCase().includes(searchLower) ||
          receivable.customer.branch?.toLowerCase().includes(searchLower) ||
          receivable.totalSales?.toString().includes(searchLower) ||
          receivable.totalPayments?.toString().includes(searchLower) ||
          receivable.outstanding?.toString().includes(searchLower) ||
          (receivable.outstanding > 100000 ? "critical" : receivable.outstanding > 50000 ? "high" : "medium").includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (receivablesColumnFilters.client && !receivable.customer.client_name?.toLowerCase().includes(receivablesColumnFilters.client.toLowerCase())) return false;
      if (receivablesColumnFilters.area && !receivable.customer.branch?.toLowerCase().includes(receivablesColumnFilters.area.toLowerCase())) return false; // filter key stays 'area' for UI compat
      if (receivablesColumnFilters.totalSales && receivable.totalSales?.toString() !== receivablesColumnFilters.totalSales) return false;
      if (receivablesColumnFilters.payments && receivable.totalPayments?.toString() !== receivablesColumnFilters.payments) return false;
      if (receivablesColumnFilters.outstanding && receivable.outstanding?.toString() !== receivablesColumnFilters.outstanding) return false;
      if (receivablesColumnFilters.priority) {
        const priority = receivable.outstanding > 100000 ? "critical" : receivable.outstanding > 50000 ? "high" : "medium";
        if (!priority.includes(receivablesColumnFilters.priority.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      const activeSort = Object.entries(receivablesColumnSorts).find(([_, direction]) => direction !== null);
      if (!activeSort) {
        // Default sort by outstanding descending
        return (b.outstanding || 0) - (a.outstanding || 0);
      }

      const [columnKey, direction] = activeSort;
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (columnKey) {
        case 'client':
          aValue = a.customer.client_name || '';
          bValue = b.customer.client_name || '';
          break;
        case 'area':
          aValue = a.customer.branch || '';
          bValue = b.customer.branch || '';
          break;
        case 'totalSales':
          aValue = a.totalSales || 0;
          bValue = b.totalSales || 0;
          break;
        case 'payments':
          aValue = a.totalPayments || 0;
          bValue = b.totalPayments || 0;
          break;
        case 'outstanding':
          aValue = a.outstanding || 0;
          bValue = b.outstanding || 0;
          break;
        case 'priority':
          aValue = a.outstanding > 100000 ? 3 : a.outstanding > 50000 ? 2 : 1;
          bValue = b.outstanding > 100000 ? 3 : b.outstanding > 50000 ? 2 : 1;
          break;
        default:
          return 0;
      }

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [receivables, debouncedReceivablesSearchTerm, receivablesColumnFilters, receivablesColumnSorts]);

  // Paginated receivables for display
  const paginatedReceivables = useMemo(() => {
    const startIndex = (receivablesPage - 1) * receivablesPageSize;
    const endIndex = startIndex + receivablesPageSize;
    return filteredAndSortedReceivables.slice(startIndex, endIndex);
  }, [filteredAndSortedReceivables, receivablesPage, receivablesPageSize]);

  const receivablesTotalPages = Math.ceil(filteredAndSortedReceivables.length / receivablesPageSize);

  // Export Client Receivables Outstanding to Excel
  const exportReceivablesToExcel = useCallback(async () => {
    if (!filteredAndSortedReceivables || filteredAndSortedReceivables.length === 0) {
      toast({
        title: "No Data",
        description: "No receivables to export.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredAndSortedReceivables.map(receivable => ({
      'Client': receivable.customer.client_name || '',
      'Branch': receivable.customer.branch || 'N/A', // branch from customers table
      'Total Sales': receivable.totalSales || 0,
      'Payments': receivable.totalPayments || 0,
      'Outstanding': receivable.outstanding || 0,
      'Priority': receivable.outstanding > 100000 ? 'Critical' : receivable.outstanding > 50000 ? 'High' : 'Medium',
    }));

    const fileName = `Client_Receivables_${new Date().toISOString().split('T')[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Client Receivables', fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} receivables to ${fileName}`,
    });
  }, [filteredAndSortedReceivables, toast]);

  // Compact currency formatter: ₹1.2L / ₹45K / ₹999
  const fmtCur = (n: number) => {
    if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(2)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* KPI Tiles — 2 rows of 5, left-accent design */}
      <div className="space-y-2">
        {/* Row 1: Financials */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Factory Outstanding */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <Building2 className="h-9 w-9 text-purple-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Factory Outstanding</p>
              <p className="text-xl font-bold text-purple-700 mt-1 leading-none tabular-nums">{fmtCur(metrics?.factoryOutstanding ?? 0)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Elma payable</p>
            </div>
          </div>

          {/* Client Outstanding */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <DollarSign className="h-9 w-9 text-rose-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Client Outstanding</p>
              <p className="text-xl font-bold text-rose-700 mt-1 leading-none tabular-nums">{fmtCur(metrics?.totalOutstanding ?? 0)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Pending receivables</p>
            </div>
          </div>

          {/* Sale This Month */}
          {(() => {
            const thisM = monthlySales?.saleThisMonth ?? 0;
            const prevM = monthlySales?.salePrevMonth ?? 0;
            const pct = prevM > 0 ? Math.round(((thisM - prevM) / prevM) * 100) : 0;
            const up = pct >= 0;
            return (
              <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
                <TrendingUp className="h-9 w-9 text-teal-200 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Sale This Month</p>
                  <p className="text-xl font-bold text-teal-700 mt-1 leading-none tabular-nums">{fmtCur(thisM)}</p>
                  <p className={`text-[10px] mt-0.5 font-medium ${up ? 'text-teal-500' : 'text-rose-500'}`}>{up ? '▲' : '▼'} {Math.abs(pct)}% vs last month</p>
                </div>
              </div>
            );
          })()}

          {/* Sale Previous Month */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <TrendingUp className="h-9 w-9 text-cyan-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Sale Prev Month</p>
              <p className="text-xl font-bold text-cyan-700 mt-1 leading-none tabular-nums">{fmtCur(monthlySales?.salePrevMonth ?? 0)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Prior period</p>
            </div>
          </div>

          {/* Collection Rate */}
          {(() => {
            const totalSales = receivables?.reduce((sum, r) => sum + (r.totalSales || 0), 0) ?? 0;
            const totalOutstanding = metrics?.totalOutstanding ?? 0;
            const rate = totalSales > 0 ? Math.round(((totalSales - totalOutstanding) / totalSales) * 100) : 0;
            const good = rate >= 70;
            // Width in 10% steps so Tailwind includes the classes at build time
            const BAR_WIDTHS = ['w-0','w-[10%]','w-[20%]','w-[30%]','w-[40%]','w-[50%]','w-[60%]','w-[70%]','w-[80%]','w-[90%]','w-full'] as const;
            const barWClass = BAR_WIDTHS[Math.round(Math.min(100, Math.max(0, rate)) / 10)];
            return (
              <div className={`bg-white rounded-xl border border-gray-100 border-l-4 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3 ${good ? 'border-l-sky-500' : 'border-l-rose-500'}`}>
                <CreditCard className={`h-9 w-9 shrink-0 ${good ? 'text-sky-200' : 'text-rose-200'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Collection Rate</p>
                  <p className={`text-xl font-bold mt-1 leading-none tabular-nums ${good ? 'text-sky-700' : 'text-rose-700'}`}>{rate}%</p>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${good ? 'bg-sky-400' : 'bg-rose-400'} ${barWClass}`} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Row 2: Alerts & Risk */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Critical Alerts */}
          {(() => {
            const count = receivables?.filter(r => r.outstanding > 100000).length || 0;
            return (
              <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Critical Alerts</p>
                  <p className="text-xl font-bold text-amber-700 mt-1 leading-none tabular-nums">{count}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Outstanding &gt; ₹1L</p>
                </div>
              </div>
            );
          })()}

          {/* Payment Overdue */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Payment Overdue</p>
              <p className="text-xl font-bold text-red-700 mt-1 leading-none tabular-nums">{paymentFollowupMetrics?.overdue ?? 0}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Past due date</p>
            </div>
          </div>

          {/* Due Soon */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Due Soon</p>
              <p className="text-xl font-bold text-orange-700 mt-1 leading-none tabular-nums">{paymentFollowupMetrics?.dueSoon ?? 0}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Within expected window</p>
            </div>
          </div>

          {/* Over Credit Limit */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-rose-600 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Over Credit Limit</p>
              <p className="text-xl font-bold text-rose-700 mt-1 leading-none tabular-nums">{creditRiskMetrics?.overLimit ?? 0}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Exceeds monthly avg</p>
            </div>
          </div>

          {/* Caution / Warning */}
          <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-yellow-400 shadow-sm hover:shadow-md transition-all p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-none">Caution / Warning</p>
              <p className="text-xl font-bold text-yellow-700 mt-1 leading-none tabular-nums">{creditRiskMetrics?.warning ?? 0}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">At 75–100% of limit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {inventoryRows && inventoryRows.length > 0 && (() => {
        const q = debouncedInventorySearch.toLowerCase();
        const filtered = inventoryRows.filter(r =>
          !q ||
          r.clientName.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.sku.toLowerCase().includes(q) ||
          r.stock.toString().includes(q)
        );

        // Group filtered rows by clientName
        type SkuRow = { sku: string; branch: string; stock: number };
        type Group = { clientName: string; branch: string; skus: SkuRow[]; total: number };
        const groupMap = new Map<string, Group>();
        for (const row of filtered) {
          if (!groupMap.has(row.clientName)) {
            groupMap.set(row.clientName, { clientName: row.clientName, branch: row.branch, skus: [], total: 0 });
          }
          const g = groupMap.get(row.clientName)!;
          g.skus.push({ sku: row.sku, branch: row.branch, stock: row.stock });
          g.total += row.stock;
        }
        let groups: Group[] = [...groupMap.values()];

        // Sort groups
        if (inventorySort) {
          groups = [...groups].sort((a, b) => {
            let av: string | number, bv: string | number;
            if (inventorySort.col === 'stock') { av = a.total; bv = b.total; }
            else if (inventorySort.col === 'sku') { av = a.skus.length; bv = b.skus.length; }
            else if (inventorySort.col === 'branch') { av = a.branch; bv = b.branch; }
            else { av = a.clientName; bv = b.clientName; }
            const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
            return inventorySort.dir === 'asc' ? cmp : -cmp;
          });
        }

        const toggleSort = (col: 'clientName' | 'branch' | 'sku' | 'stock') => {
          setInventorySort(prev =>
            prev?.col === col
              ? prev.dir === 'asc' ? { col, dir: 'desc' } : null
              : { col, dir: 'asc' }
          );
        };

        const toggleExpand = (clientName: string) => {
          setExpandedClients(prev => {
            const next = new Set(prev);
            if (next.has(clientName)) next.delete(clientName); else next.add(clientName);
            return next;
          });
        };

        const SortIcon = ({ col }: { col: string }) => {
          if (inventorySort?.col !== col) return <span className="ml-1 text-gray-300">↕</span>;
          return <span className="ml-1">{inventorySort.dir === 'asc' ? '↑' : '↓'}</span>;
        };

        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-base">Available Inventory</CardTitle>
                <Input
                  placeholder="Search inventory..."
                  value={inventorySearch}
                  onChange={e => setInventorySearch(e.target.value)}
                  className="w-56 h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('clientName')}>
                      Client <SortIcon col="clientName" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('branch')}>
                      Branch <SortIcon col="branch" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => toggleSort('sku')}>
                      SKU <SortIcon col="sku" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 text-right" onClick={() => toggleSort('stock')}>
                      Stock (Cases) <SortIcon col="stock" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No results</TableCell>
                    </TableRow>
                  ) : groups.map((group) => {
                    const isExpanded = expandedClients.has(group.clientName);
                    const multi = group.skus.length > 1;
                    return (
                      <>
                        <TableRow
                          key={group.clientName}
                          className={`${multi ? 'cursor-pointer' : ''} hover:bg-muted/50 ${isExpanded ? 'bg-muted/20 font-medium' : ''}`}
                          onClick={() => multi && toggleExpand(group.clientName)}
                        >
                          <TableCell className="w-8 text-muted-foreground pl-3">
                            {multi
                              ? isExpanded
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                              : null}
                          </TableCell>
                          <TableCell className="font-medium">{group.clientName}</TableCell>
                          <TableCell>{group.branch}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {multi ? `${group.skus.length} SKUs` : group.skus[0].sku}
                          </TableCell>
                          <TableCell className="text-right font-medium">{group.total}</TableCell>
                        </TableRow>
                        {isExpanded && group.skus.map((item, j) => (
                          <TableRow key={`${group.clientName}-${j}`} className="bg-muted/10 hover:bg-muted/20">
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-muted-foreground text-xs">{item.branch}</TableCell>
                            <TableCell className="text-sm pl-6 text-muted-foreground">↳ {item.sku}</TableCell>
                            <TableCell className="text-right text-sm">{item.stock}</TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })()}

      <BusinessAnalyticsChart />

      <ClientOverviewPanel />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
