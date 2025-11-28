import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnFilter } from "@/components/ui/column-filter";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  CreditCard,
  Eye,
  Phone,
  Download
} from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { toast } = useToast();
  
  // Filter and sort states for Client Receivables Outstanding table
  const [receivablesSearchTerm, setReceivablesSearchTerm] = useState("");
  const [receivablesColumnFilters, setReceivablesColumnFilters] = useState({
    client: "",
    branch: "",
    totalSales: "",
    payments: "",
    outstanding: "",
    priority: "",
  });
  const [receivablesColumnSorts, setReceivablesColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    branch: null,
    totalSales: null,
    payments: null,
    outstanding: null,
    priority: null,
  });

  // Fetch profit data for Profitability Summary
  const { data: profitData } = useQuery({
    queryKey: ["dashboard-profit"],
    queryFn: async () => {
      // Get client transactions
      const { data: clientTransactions } = await supabase
        .from("sales_transactions")
        .select("amount, transaction_type");
      
      const totalSales = clientTransactions?.filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      // Get factory payables
      const { data: factoryTransactions } = await supabase
        .from("factory_payables")
        .select("amount, transaction_type");
      
      const factoryPayables = factoryTransactions?.filter(t => t.transaction_type === 'production')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      // Get transport expenses
      const { data: transportExpenses } = await supabase
        .from("transport_expenses")
        .select("amount");
      
      const transportTotal = transportExpenses?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      // Get label expenses
      const { data: labelPurchases } = await supabase
        .from("label_purchases")
        .select("total_amount");
      
      const labelExpenses = labelPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      
      const profit = totalSales - (factoryPayables + transportTotal);
      
      return {
        totalSales,
        factoryPayables,
        transportExpenses: transportTotal,
        profit
      };
    },
  });

  // Fetch client receivables data
  const { data: receivables } = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
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

  // Fetch key metrics - depends on receivables being loaded
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics", receivables],
    queryFn: async () => {
      // Total clients
      const { count: totalClients } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // Total outstanding from receivables (wait for receivables to be available)
      const totalOutstanding = receivables?.reduce((sum, r) => sum + (r.outstanding || 0), 0) || 0;

      // Factory outstanding
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

      // High value customers (outstanding > 50000)
      const highValueCustomers = receivables?.filter(r => (r.outstanding || 0) > 50000).length || 0;

      // Recent transactions count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentTransactions } = await supabase
        .from("sales_transactions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      return {
        totalClients: totalClients || 0,
        totalOutstanding,
        factoryOutstanding,
        highValueCustomers,
        recentTransactions: recentTransactions || 0
      };
    },
    enabled: receivables !== undefined, // Only run when receivables is loaded
  });

  // Filter and sort handlers for Client Receivables Outstanding
  const handleReceivablesColumnFilterChange = (columnKey: string, value: string) => {
    setReceivablesColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  const handleReceivablesColumnSortChange = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setReceivablesColumnSorts(prev => {
      const newSorts = { ...prev };
      // Clear other sorts
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  const clearAllReceivablesFilters = () => {
    setReceivablesSearchTerm("");
    setReceivablesColumnFilters({
      client: "",
      branch: "",
      totalSales: "",
      payments: "",
      outstanding: "",
      priority: "",
    });
    setReceivablesColumnSorts({
      client: null,
      branch: null,
      totalSales: null,
      payments: null,
      outstanding: null,
      priority: null,
    });
  };

  // Filtered and sorted Client Receivables Outstanding
  const filteredAndSortedReceivables = useMemo(() => {
    if (!receivables) return [];

    return receivables.filter(receivable => {
      // Global search
      if (receivablesSearchTerm) {
        const searchLower = receivablesSearchTerm.toLowerCase();
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
      if (receivablesColumnFilters.branch && !receivable.customer.branch?.toLowerCase().includes(receivablesColumnFilters.branch.toLowerCase())) return false;
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
        case 'branch':
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
  }, [receivables, receivablesSearchTerm, receivablesColumnFilters, receivablesColumnSorts]);

  // Export Client Receivables Outstanding to Excel
  const exportReceivablesToExcel = () => {
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
      'Branch': receivable.customer.branch || 'N/A',
      'Total Sales': receivable.totalSales || 0,
      'Payments': receivable.totalPayments || 0,
      'Outstanding': receivable.outstanding || 0,
      'Priority': receivable.outstanding > 100000 ? 'Critical' : receivable.outstanding > 50000 ? 'High' : 'Medium',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Receivables');
    
    const fileName = `Client_Receivables_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} receivables to ${fileName}`,
    });
  };

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
                <p className="text-2xl font-bold text-green-600">₹{profitData?.totalSales.toLocaleString() || 0}</p>
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
                <p className="text-2xl font-bold text-red-600">₹{profitData?.factoryPayables.toLocaleString() || 0}</p>
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
                <p className="text-2xl font-bold text-orange-600">₹{profitData?.transportExpenses.toLocaleString() || 0}</p>
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
                  ₹{profitData?.profit.toLocaleString() || 0}
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
                <p className="text-2xl font-bold text-rose-600">₹{metrics?.totalOutstanding?.toLocaleString() || 0}</p>
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
                <p className="text-2xl font-bold text-purple-600">₹{metrics?.factoryOutstanding?.toLocaleString() || 0}</p>
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

      {/* Client Receivables Outstanding Table */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 text-red-800 rounded-t-lg border-b-2 border-red-200">
          <div className="flex justify-between items-center">
            <div>
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-red-600" />
            <span>Client Receivables Outstanding</span>
          </CardTitle>
          <CardDescription className="text-red-600">
                Priority collection targets - {filteredAndSortedReceivables?.length || 0} clients with outstanding balances
          </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={clearAllReceivablesFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
              <Button onClick={exportReceivablesToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="p-4 border-b border-red-200">
            <Input
              placeholder="Search receivables..."
              value={receivablesSearchTerm}
              onChange={(e) => setReceivablesSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-200 hover:bg-gradient-to-r hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-200">
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">
                    <div className="flex items-center gap-2">
                      Client
                      <ColumnFilter
                        columnKey="client"
                        columnName="Client"
                        filterValue={receivablesColumnFilters.client}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('client', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('client', '')}
                        sortDirection={receivablesColumnSorts.client}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('client', direction)}
                        dataType="text"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">
                    <div className="flex items-center gap-2">
                      Branch
                      <ColumnFilter
                        columnKey="branch"
                        columnName="Branch"
                        filterValue={receivablesColumnFilters.branch}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('branch', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('branch', '')}
                        sortDirection={receivablesColumnSorts.branch}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('branch', direction)}
                        dataType="text"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">
                    <div className="flex items-center gap-2 justify-end">
                      Total Sales
                      <ColumnFilter
                        columnKey="totalSales"
                        columnName="Total Sales"
                        filterValue={receivablesColumnFilters.totalSales}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('totalSales', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('totalSales', '')}
                        sortDirection={receivablesColumnSorts.totalSales}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('totalSales', direction)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">
                    <div className="flex items-center gap-2 justify-end">
                      Payments
                      <ColumnFilter
                        columnKey="payments"
                        columnName="Payments"
                        filterValue={receivablesColumnFilters.payments}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('payments', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('payments', '')}
                        sortDirection={receivablesColumnSorts.payments}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('payments', direction)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">
                    <div className="flex items-center gap-2 justify-end">
                      Outstanding
                      <ColumnFilter
                        columnKey="outstanding"
                        columnName="Outstanding"
                        filterValue={receivablesColumnFilters.outstanding}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('outstanding', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('outstanding', '')}
                        sortDirection={receivablesColumnSorts.outstanding}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('outstanding', direction)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-red-200/50">
                    <div className="flex items-center gap-2 justify-center">
                      Priority
                      <ColumnFilter
                        columnKey="priority"
                        columnName="Priority"
                        filterValue={receivablesColumnFilters.priority}
                        onFilterChange={(value) => handleReceivablesColumnFilterChange('priority', value as string)}
                        onClearFilter={() => handleReceivablesColumnFilterChange('priority', '')}
                        sortDirection={receivablesColumnSorts.priority}
                        onSortChange={(direction) => handleReceivablesColumnSortChange('priority', direction)}
                        dataType="text"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedReceivables.map((receivable, index) => (
                  <TableRow 
                    key={receivable.customer.id} 
                    className={`hover:bg-red-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-red-50/30'
                    }`}
                  >
                    <TableCell className="font-semibold text-slate-800 py-4 px-6">
                      {receivable.customer.client_name}
                    </TableCell>
                    <TableCell className="text-slate-600 py-4 px-6">
                      {receivable.customer.branch || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600 py-4 px-6">
                      ₹{receivable.totalSales.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-600 py-4 px-6">
                      ₹{receivable.totalPayments.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 py-4 px-6">
                      ₹{receivable.outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <Badge 
                        variant={receivable.outstanding > 100000 ? "destructive" : 
                                receivable.outstanding > 50000 ? "default" : "secondary"}
                        className="font-semibold"
                      >
                        {receivable.outstanding > 100000 ? "Critical" : 
                         receivable.outstanding > 50000 ? "High" : "Medium"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <div className="flex justify-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Call Client">
                          <Phone className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAndSortedReceivables.length === 0 && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 text-center border-t border-red-200">
              <p className="text-red-600 text-sm">
                No receivables found matching the current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;