import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, Package, AlertCircle } from "lucide-react";

const Dashboard = () => {
  // Fetch summary data
  const { data: salesSummary } = useQuery({
    queryKey: ["sales-summary"],
    queryFn: async () => {
      const { data: sales } = await supabase
        .from("sales_transactions")
        .select("amount, transaction_type");
      
      const totalSales = sales
        ?.filter(s => s.transaction_type === "sale")
        .reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      
      const totalPayments = sales
        ?.filter(s => s.transaction_type === "payment")
        .reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

      return { totalSales, totalPayments, outstanding: totalSales - totalPayments };
    },
  });

  const { data: customerCount } = useQuery({
    queryKey: ["customer-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: factorySummary } = useQuery({
    queryKey: ["factory-summary"],
    queryFn: async () => {
      const { data: factory } = await supabase
        .from("factory_payables")
        .select("amount, transaction_type");
      
      const totalProduction = factory
        ?.filter(f => f.transaction_type === "production")
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
      
      const totalPayments = factory
        ?.filter(f => f.transaction_type === "payment")
        .reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

      return { totalProduction, totalPayments, outstanding: totalProduction - totalPayments };
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          customers (client_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{salesSummary?.totalSales?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding: ₹{salesSummary?.outstanding?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <p className="text-xs text-muted-foreground">Registered clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factory Production</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{factorySummary?.totalProduction?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Elma Industries</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factory Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{factorySummary?.outstanding?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Pending payments to Elma</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest sales and payment entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions?.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.transaction_type === 'sale' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium">{transaction.customers?.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.transaction_type === 'sale' ? 'Sale' : 'Payment'} - {transaction.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{transaction.amount?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;