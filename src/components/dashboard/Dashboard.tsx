import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, memo, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnFilter } from "@/components/ui/column-filter";
import { supabase } from "@/integrations/supabase/client";
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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* All Metrics Cards - 8 tiles in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <Card className="bg-green-50 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">Total Sales</h3>
                <p className="text-2xl font-bold text-green-600">₹{profitData?.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factory Costs */}
        <Card className="bg-red-50 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-900 mb-1">Factory Costs</h3>
                <p className="text-2xl font-bold text-red-600">₹{profitData?.factoryPayables.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transport */}
        <Card className="bg-orange-50 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-orange-900 mb-1">Transport</h3>
                <p className="text-2xl font-bold text-orange-600">₹{profitData?.transportExpenses.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className={`border shadow-lg hover:shadow-xl transition-all duration-300 ${
          (profitData?.profit || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${(profitData?.profit || 0) >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  Net Profit
                </h3>
                <p className={`text-2xl font-bold ${(profitData?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₹{profitData?.profit.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Outstanding */}
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-rose-800 mb-1">Client Outstanding - Pending receivables</h3>
                <p className="text-2xl font-bold text-rose-600">₹{metrics?.totalOutstanding?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Factory Outstanding */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-purple-800 mb-1">Elma Factory Outstanding</h3>
                <p className="text-2xl font-bold text-purple-600">₹{metrics?.factoryOutstanding?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Critical Alerts - Outstanding &gt; ₹1L</h3>
                <p className="text-2xl font-bold text-amber-600">{receivables?.filter(r => r.outstanding > 100000).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale This Month */}
        <Card className="bg-teal-50 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-teal-900 mb-1">Sale This Month</h3>
                <p className="text-2xl font-bold text-teal-600">₹{monthlySales?.saleThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 4 }) ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Previous Month */}
        <Card className="bg-cyan-50 border border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-cyan-900 mb-1">Sale Previous Month</h3>
                <p className="text-2xl font-bold text-cyan-600">₹{monthlySales?.salePrevMonth.toLocaleString('en-IN', { maximumFractionDigits: 4 }) ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Outstanding All Clients */}
        <Card className="bg-rose-50 border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-rose-900 mb-1">Total Outstanding (All Clients)</h3>
                <p className="text-2xl font-bold text-rose-600">₹{metrics?.totalOutstanding?.toLocaleString('en-IN', { maximumFractionDigits: 4 }) ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card className={`border shadow-lg hover:shadow-xl transition-all duration-300 ${
          (() => {
            if (!receivables || receivables.length === 0 || !metrics) return 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200';
            const totalSales = receivables.reduce((sum, r) => sum + (r.totalSales || 0), 0);
            const totalOutstanding = metrics.totalOutstanding || 0;
            const collectionRate = totalSales > 0 ? ((totalSales - totalOutstanding) / totalSales) * 100 : 0;
            return collectionRate >= 70 ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200' : 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200';
          })()
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold mb-1 ${
                  (() => {
                    if (!receivables || receivables.length === 0 || !metrics) return 'text-sky-800';
                    const totalSales = receivables.reduce((sum, r) => sum + (r.totalSales || 0), 0);
                    const totalOutstanding = metrics.totalOutstanding || 0;
                    const collectionRate = totalSales > 0 ? ((totalSales - totalOutstanding) / totalSales) * 100 : 0;
                    return collectionRate >= 70 ? 'text-sky-800' : 'text-rose-800';
                  })()
                }`}>
                  Collection Rate - Payment efficiency
                </h3>
                <p className={`text-2xl font-bold ${
                  (() => {
                    if (!receivables || receivables.length === 0 || !metrics) return 'text-sky-600';
                    const totalSales = receivables.reduce((sum, r) => sum + (r.totalSales || 0), 0);
                    const totalOutstanding = metrics.totalOutstanding || 0;
                    const collectionRate = totalSales > 0 ? ((totalSales - totalOutstanding) / totalSales) * 100 : 0;
                    return collectionRate >= 70 ? 'text-sky-600' : 'text-rose-600';
                  })()
                }`}>
                  {receivables && receivables.length > 0 && metrics ? 
                    (() => {
                      const totalSales = receivables.reduce((sum, r) => sum + (r.totalSales || 0), 0);
                      const totalOutstanding = metrics.totalOutstanding || 0;
                      return totalSales > 0 ? Math.round(((totalSales - totalOutstanding) / totalSales) * 100) : 0;
                    })() : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
