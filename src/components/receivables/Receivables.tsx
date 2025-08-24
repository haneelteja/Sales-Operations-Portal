import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Receivables = () => {
  const [adminComments, setAdminComments] = useState<{[key: string]: string}>({});
  const { data: receivables, isLoading } = useQuery({
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

      // Group transactions by customer and calculate outstanding amounts
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

      // Convert to array and calculate outstanding amounts
      return Array.from(customerMap.values()).map(data => ({
        ...data,
        outstanding: data.totalSales - data.totalPayments
      })).filter(data => data.outstanding > 0); // Only show customers with outstanding balance
    },
  });

  const handleCommentChange = (customerId: string, comment: string) => {
    setAdminComments(prev => ({
      ...prev,
      [customerId]: comment
    }));
  };

  const { data: allTransactions } = useQuery({
    queryKey: ["all-customer-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          customers (
            client_name,
            branch
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  if (isLoading) {
    return <div>Loading receivables...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Client Receivables</CardTitle>
          <CardDescription>
            Outstanding balances with internal team notes for follow-up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivables && receivables.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Payments Received</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin/Manager Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((receivable) => (
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
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No outstanding receivables found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Receivables;