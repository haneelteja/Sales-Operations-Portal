import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  // Factory transactions report
  const { data: factoryReport } = useQuery({
    queryKey: ["factory-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_payables")
        .select("*")
        .order("transaction_date", { ascending: false });
      
      const totalProduction = data?.filter(t => t.transaction_type === 'production')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalPayments = data?.filter(t => t.transaction_type === 'payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      return { transactions: data || [], totalProduction, totalPayments };
    },
  });

  // Client transactions report
  const { data: clientReport } = useQuery({
    queryKey: ["client-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          customers (client_name, branch)
        `)
        .order("transaction_date", { ascending: false });
      
      const totalSales = data?.filter(t => t.transaction_type === 'sale')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalPayments = data?.filter(t => t.transaction_type === 'payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      return { transactions: data || [], totalSales, totalPayments };
    },
  });

  // Transport report
  const { data: transportReport } = useQuery({
    queryKey: ["transport-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transport_expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      
      const totalExpenses = data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      return { expenses: data || [], totalExpenses };
    },
  });

  // Labels report
  const { data: labelsReport } = useQuery({
    queryKey: ["labels-report"],
    queryFn: async () => {
      const { data: purchases } = await supabase
        .from("label_purchases")
        .select(`
          *,
          label_vendors (vendor_name, label_type)
        `)
        .order("purchase_date", { ascending: false });

      const { data: designs } = await supabase
        .from("label_design_costs")
        .select(`
          *,
          customers (client_name)
        `)
        .order("design_date", { ascending: false });
      
      const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const totalDesigns = designs?.reduce((sum, d) => sum + (d.cost || 0), 0) || 0;
      
      return { 
        purchases: purchases || [], 
        designs: designs || [], 
        totalPurchases, 
        totalDesigns 
      };
    },
  });

  // Profit calculation
  const profitData = {
    totalSales: clientReport?.totalSales || 0,
    factoryPayables: factoryReport?.totalProduction || 0,
    transportExpenses: transportReport?.totalExpenses || 0,
    labelExpenses: (labelsReport?.totalPurchases || 0) + (labelsReport?.totalDesigns || 0),
    profit: 0
  };
  
  profitData.profit = profitData.totalSales - (profitData.factoryPayables + profitData.transportExpenses + profitData.labelExpenses);

  return (
    <div className="space-y-6">
      {/* Profit Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Summary</CardTitle>
          <CardDescription>
            Overall profit calculation for Aamodha Enterprises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">Total Sales</h3>
              <p className="text-xl font-bold text-green-600">₹{profitData.totalSales.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900">Factory Costs</h3>
              <p className="text-xl font-bold text-red-600">₹{profitData.factoryPayables.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900">Transport</h3>
              <p className="text-xl font-bold text-orange-600">₹{profitData.transportExpenses.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900">Labels</h3>
              <p className="text-xl font-bold text-purple-600">₹{profitData.labelExpenses.toLocaleString()}</p>
            </div>
            <div className={`border rounded-lg p-4 ${
              profitData.profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className={`font-semibold ${profitData.profit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                Net Profit
              </h3>
              <p className={`text-xl font-bold ${profitData.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ₹{profitData.profit.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="factory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="factory">Factory Report</TabsTrigger>
          <TabsTrigger value="clients">Client Report</TabsTrigger>
          <TabsTrigger value="transport">Transport Report</TabsTrigger>
          <TabsTrigger value="labels">Labels Report</TabsTrigger>
        </TabsList>

        <TabsContent value="factory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factory Transactions - Elma Industries</CardTitle>
              <CardDescription>Production costs and payments to Elma Industries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Production</p>
                  <p className="text-2xl font-bold">₹{factoryReport?.totalProduction.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Payments Made</p>
                  <p className="text-2xl font-bold">₹{factoryReport?.totalPayments.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{((factoryReport?.totalProduction || 0) - (factoryReport?.totalPayments || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factoryReport?.transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.transaction_type}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">₹{transaction.amount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Transactions</CardTitle>
              <CardDescription>Sales and payments from Aamodha customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">₹{clientReport?.totalSales.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Payments Received</p>
                  <p className="text-2xl font-bold">₹{clientReport?.totalPayments.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{((clientReport?.totalSales || 0) - (clientReport?.totalPayments || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientReport?.transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.customers?.client_name}</TableCell>
                      <TableCell>{transaction.transaction_type}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">₹{transaction.amount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transport Expenses</CardTitle>
              <CardDescription>All transport and delivery costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">Total Transport Expenses</p>
                <p className="text-3xl font-bold">₹{transportReport?.totalExpenses.toLocaleString()}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportReport?.expenses.slice(0, 10).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.expense_group}</TableCell>
                      <TableCell className="text-right">₹{expense.amount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Label Expenses</CardTitle>
              <CardDescription>Label purchases and design costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Label Purchases</p>
                  <p className="text-2xl font-bold">₹{labelsReport?.totalPurchases.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Design Costs</p>
                  <p className="text-2xl font-bold">₹{labelsReport?.totalDesigns.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Recent Label Purchases</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labelsReport?.purchases.slice(0, 5).map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                          <TableCell>{purchase.label_vendors?.vendor_name}</TableCell>
                          <TableCell className="text-right">{purchase.quantity}</TableCell>
                          <TableCell className="text-right">₹{purchase.total_amount?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recent Design Costs</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labelsReport?.designs.slice(0, 5).map((design) => (
                        <TableRow key={design.id}>
                          <TableCell>{new Date(design.design_date).toLocaleDateString()}</TableCell>
                          <TableCell>{design.customers?.client_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{design.design_description}</TableCell>
                          <TableCell className="text-right">₹{design.cost?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;