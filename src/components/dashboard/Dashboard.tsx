import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  CreditCard,
  Eye,
  Phone
} from "lucide-react";

const Dashboard = () => {
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
      
      const profit = totalSales - (factoryPayables + transportTotal + labelExpenses);
      
      return {
        totalSales,
        factoryPayables,
        transportExpenses: transportTotal,
        labelExpenses,
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

  // Fetch key metrics
  const { data: metrics } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      // Total clients
      const { count: totalClients } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // Total outstanding from receivables
      const totalOutstanding = receivables?.reduce((sum, r) => sum + r.outstanding, 0) || 0;

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
      const highValueCustomers = receivables?.filter(r => r.outstanding > 50000).length || 0;

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
  });


  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Profitability Summary - Moved from Reports */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-blue-800 rounded-t-lg border-b-2 border-blue-200">
          <CardTitle className="text-xl font-bold">Profitability Summary</CardTitle>
          <CardDescription className="text-blue-600">
            Overall profit calculation for Aamodha Enterprises
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Total Sales</h3>
              <p className="text-xl font-bold text-green-600">₹{profitData?.totalSales.toLocaleString() || 0}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900">Factory Costs</h3>
              <p className="text-xl font-bold text-red-600">₹{profitData?.factoryPayables.toLocaleString() || 0}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900">Transport</h3>
              <p className="text-xl font-bold text-orange-600">₹{profitData?.transportExpenses.toLocaleString() || 0}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900">Labels</h3>
              <p className="text-xl font-bold text-purple-600">₹{profitData?.labelExpenses.toLocaleString() || 0}</p>
            </div>
            <div className={`border rounded-lg p-4 ${
              (profitData?.profit || 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-semibold ${(profitData?.profit || 0) >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                Net Profit
              </h3>
              <p className={`text-xl font-bold ${(profitData?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{profitData?.profit.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">

        {/* Client Outstanding */}
        <Card className="bg-gradient-to-br from-red-500 to-pink-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Client Outstanding</CardTitle>
            <DollarSign className="h-6 w-6 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">₹{metrics?.totalOutstanding?.toLocaleString() || 0}</div>
            <p className="text-xs text-white/80 mt-1">Pending receivables</p>
          </CardContent>
        </Card>

        {/* Factory Outstanding */}
        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Factory Outstanding</CardTitle>
            <Building2 className="h-6 w-6 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">₹{metrics?.factoryOutstanding?.toLocaleString() || 0}</div>
            <p className="text-xs text-white/80 mt-1">Due to Elma Industries</p>
          </CardContent>
        </Card>

      </div>

      {/* Additional Insights Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Critical Alerts</p>
                <p className="text-2xl font-bold text-white">{receivables?.filter(r => r.outstanding > 100000).length || 0}</p>
                <p className="text-white/60 text-xs">Outstanding &gt; ₹1L</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-white" />
              <div>
                <p className="text-white/80 text-sm">Collection Rate</p>
                <p className="text-2xl font-bold text-white">
                  {metrics?.totalOutstanding > 0 ? 
                    Math.round(((receivables?.reduce((sum, r) => sum + r.totalSales, 0) || 0) - metrics.totalOutstanding) / (receivables?.reduce((sum, r) => sum + r.totalSales, 0) || 1) * 100) : 0}%
                </p>
                <p className="text-white/60 text-xs">Payment efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Receivables Outstanding Table */}
      <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 text-red-800 rounded-t-lg border-b-2 border-red-200">
          <CardTitle className="text-xl font-bold flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-red-600" />
            <span>Client Receivables Outstanding</span>
          </CardTitle>
          <CardDescription className="text-red-600">
            Priority collection targets - {receivables?.length || 0} clients with outstanding balances
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-200 hover:bg-gradient-to-r hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-200">
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">Client</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">Branch</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">Total Sales</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">Payments</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-right border-r border-red-200/50">Outstanding</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-red-200/50">Priority</TableHead>
                  <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables?.slice(0, 10).map((receivable, index) => (
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
          
          {receivables && receivables.length > 10 && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 text-center border-t border-red-200">
              <p className="text-red-600 text-sm">
                Showing top 10 clients by outstanding amount. 
                <span className="font-semibold text-red-800"> {receivables.length - 10} more clients</span> with outstanding balances.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;