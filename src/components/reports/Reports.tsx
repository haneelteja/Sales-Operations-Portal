import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';

const Reports = () => {
  const [adminComments, setAdminComments] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Receivables report
  const { data: receivables, isLoading: receivablesLoading } = useQuery({
    queryKey: ["receivables"],
    queryFn: async () => {
      // Get all transactions grouped by customer
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
      })).filter(data => data.outstanding > 0); // Only show customers with outstanding balance
    },
  });

  // Filter receivables based on search term
  const filteredReceivables = receivables?.filter((receivable) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const customerName = receivable.customer.client_name || '';
    const branch = receivable.customer.branch || '';
    const totalSales = receivable.totalSales?.toString() || '';
    const totalPayments = receivable.totalPayments?.toString() || '';
    const outstanding = receivable.outstanding?.toString() || '';
    
    return (
      customerName.toLowerCase().includes(searchLower) ||
      branch.toLowerCase().includes(searchLower) ||
      totalSales.includes(searchLower) ||
      totalPayments.includes(searchLower) ||
      outstanding.includes(searchLower)
    );
  }) || [];

  // Export filtered receivables to Excel
  const exportReceivablesToExcel = () => {
    const exportData = filteredReceivables.map((receivable) => {
      return {
        'Customer': receivable.customer.client_name || 'N/A',
        'Branch': receivable.customer.branch || 'N/A',
        'Total Sales (₹)': receivable.totalSales || 0,
        'Payments Received (₹)': receivable.totalPayments || 0,
        'Outstanding (₹)': receivable.outstanding || 0,
        'Status': receivable.outstanding > 0 ? 'Outstanding' : 'Paid',
        'Admin Notes': adminComments[receivable.customer.id] || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Receivables');
    
    const fileName = `Outstanding_Receivables_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Note: We can't use toast here since it's not imported, but the file will download
    alert(`Exported ${exportData.length} receivables to ${fileName}`);
  };

  const handleCommentChange = (customerId: string, comment: string) => {
    setAdminComments(prev => ({
      ...prev,
      [customerId]: comment
    }));
  };

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
        .select("*")
        .order("purchase_date", { ascending: false });
      
      const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      
      return { 
        purchases: purchases || [], 
        totalPurchases
      };
    },
  });

  // Profit calculation
  const profitData = {
    totalSales: clientReport?.totalSales || 0,
    factoryPayables: factoryReport?.totalProduction || 0,
    transportExpenses: transportReport?.totalExpenses || 0,
    labelExpenses: labelsReport?.totalPurchases || 0,
    profit: 0
  };
  
  profitData.profit = profitData.totalSales - (profitData.factoryPayables + profitData.transportExpenses + profitData.labelExpenses);

  // Orders Dispatch report
  const { data: ordersDispatch } = useQuery({
    queryKey: ["orders-dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_dispatch")
        .select("*")
        .order("delivery_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching orders dispatch:", error);
        return [];
      }
      
      return data || [];
    },
  });

  // Export orders dispatch to Excel
  const exportOrdersDispatchToExcel = () => {
    if (!ordersDispatch || ordersDispatch.length === 0) {
      alert("No dispatch data to export");
      return;
    }

    const exportData = ordersDispatch.map((order) => ({
      'Client': order.client,
      'Branch': order.branch,
      'SKU': order.sku,
      'Cases': order.cases,
      'Delivery Date': order.delivery_date,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders Dispatch');
    
    const fileName = `Orders_Dispatch_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert(`Exported ${exportData.length} dispatch records to ${fileName}`);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dispatch" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dispatch">Orders Dispatch</TabsTrigger>
          <TabsTrigger value="factory">Factory Report</TabsTrigger>
          <TabsTrigger value="clients">Client Report</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="transport">Transport Report</TabsTrigger>
          <TabsTrigger value="labels">Labels Report</TabsTrigger>
        </TabsList>

        <TabsContent value="dispatch" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Orders Dispatch Report</CardTitle>
                  <CardDescription>
                    All dispatched orders for all clients
                  </CardDescription>
                </div>
                <Button onClick={exportOrdersDispatchToExcel} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Cases</TableHead>
                      <TableHead>Delivery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersDispatch && ordersDispatch.length > 0 ? (
                      ordersDispatch.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.client}</TableCell>
                          <TableCell>{order.branch}</TableCell>
                          <TableCell>{order.sku}</TableCell>
                          <TableCell className="text-right">{order.cases}</TableCell>
                          <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No dispatched orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                  <TableRow className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b-2 border-orange-200 hover:bg-gradient-to-r hover:from-orange-100 hover:via-amber-100 hover:to-orange-100 transition-all duration-200">
                    <TableHead className="font-semibold text-orange-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-orange-200/50">Date</TableHead>
                    <TableHead className="font-semibold text-orange-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-orange-200/50">Type</TableHead>
                    <TableHead className="font-semibold text-orange-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-orange-200/50">Description</TableHead>
                    <TableHead className="text-right font-semibold text-orange-800 text-xs uppercase tracking-widest py-6 px-6">Amount</TableHead>
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
                  <TableRow className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-b-2 border-green-200 hover:bg-gradient-to-r hover:from-green-100 hover:via-emerald-100 hover:to-green-100 transition-all duration-200">
                    <TableHead className="font-semibold text-green-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-green-200/50">Date</TableHead>
                    <TableHead className="font-semibold text-green-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-green-200/50">Customer</TableHead>
                    <TableHead className="font-semibold text-green-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-green-200/50">Type</TableHead>
                    <TableHead className="font-semibold text-green-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-green-200/50">Description</TableHead>
                    <TableHead className="text-right font-semibold text-green-800 text-xs uppercase tracking-widest py-6 px-6">Amount</TableHead>
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

        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Client Receivables</CardTitle>
              <CardDescription>
                Outstanding balances with internal team notes for follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivablesLoading ? (
                <div className="text-center py-8">Loading receivables...</div>
              ) : receivables && receivables.length > 0 ? (
                <div className="space-y-4">
                  {/* Search Filter */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {filteredReceivables.length} of {receivables?.length || 0} customers with outstanding balance
                    </span>
                    <Button
                      onClick={exportReceivablesToExcel}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export Excel</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search receivables by customer, branch, or amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 max-w-md"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-3 py-2 text-sm border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-200 hover:bg-gradient-to-r hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-200">
                      <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">Customer</TableHead>
                      <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-red-200/50">Branch</TableHead>
                      <TableHead className="text-right font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-red-200/50">Total Sales</TableHead>
                      <TableHead className="text-right font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-red-200/50">Payments Received</TableHead>
                      <TableHead className="text-right font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-red-200/50">Outstanding</TableHead>
                      <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-red-200/50">Status</TableHead>
                      <TableHead className="font-semibold text-red-800 text-xs uppercase tracking-widest py-6 px-6 text-left">Admin/Manager Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceivables.length > 0 ? (
                      filteredReceivables.map((receivable) => (
                      <TableRow key={receivable.customer.id}>
                        <TableCell className="font-medium">
                          {receivable.customer.client_name}
                        </TableCell>
                        <TableCell>{receivable.customer.branch}</TableCell>
                        <TableCell className="text-right">
                          ₹{receivable.totalSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{receivable.totalPayments.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{receivable.outstanding.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={receivable.outstanding > 50000 ? "destructive" : "secondary"}
                          >
                            {receivable.outstanding > 50000 ? "High" : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <textarea
                            className="w-full min-w-[200px] p-2 border border-input rounded-md resize-y"
                            placeholder="Add internal notes for follow-up..."
                            value={adminComments[receivable.customer.id] || ''}
                            onChange={(e) => handleCommentChange(receivable.customer.id, e.target.value)}
                            rows={2}
                          />
                        </TableCell>
                      </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "No receivables found matching your search" : "No outstanding receivables found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No outstanding receivables found
                </p>
              )}
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
                  <TableRow className="bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border-b-2 border-purple-200 hover:bg-gradient-to-r hover:from-purple-100 hover:via-violet-100 hover:to-purple-100 transition-all duration-200">
                    <TableHead className="font-semibold text-purple-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-purple-200/50">Date</TableHead>
                    <TableHead className="font-semibold text-purple-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-purple-200/50">Description</TableHead>
                    <TableHead className="font-semibold text-purple-800 text-xs uppercase tracking-widest py-6 px-6 text-center border-r border-purple-200/50">Group</TableHead>
                    <TableHead className="text-right font-semibold text-purple-800 text-xs uppercase tracking-widest py-6 px-6">Amount</TableHead>
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
              <CardDescription>Label purchases and related expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">Total Label Purchases</p>
                <p className="text-3xl font-bold">₹{labelsReport?.totalPurchases.toLocaleString()}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Label Purchases</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 border-b-2 border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-100 hover:via-blue-100 hover:to-indigo-100 transition-all duration-200">
                        <TableHead className="font-semibold text-indigo-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-indigo-200/50">Date</TableHead>
                        <TableHead className="font-semibold text-indigo-800 text-xs uppercase tracking-widest py-6 px-6 text-left border-r border-indigo-200/50">Vendor</TableHead>
                        <TableHead className="text-right font-semibold text-indigo-800 text-xs uppercase tracking-widest py-6 px-6 border-r border-indigo-200/50">Quantity (cases)</TableHead>
                        <TableHead className="text-right font-semibold text-indigo-800 text-xs uppercase tracking-widest py-6 px-6">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labelsReport?.purchases.slice(0, 5).map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                          <TableCell>{purchase.vendor_id || 'N/A'}</TableCell>
                          <TableCell className="text-right">{purchase.quantity}</TableCell>
                          <TableCell className="text-right">₹{purchase.total_amount?.toLocaleString()}</TableCell>
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