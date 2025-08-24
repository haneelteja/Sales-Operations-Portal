import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const TransportExpenses = () => {
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    client_id: "",
    branch: "",
    expense_group: "",
    amount: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("client_name");
      return data || [];
    },
  });

  const { data: expenses } = useQuery({
    queryKey: ["transport-expenses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transport_expenses")
        .select(`
          *,
          customers (
            client_name
          )
        `)
        .order("expense_date", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("transport_expenses")
        .insert({
          ...data,
          amount: parseFloat(data.amount)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transport expense recorded!" });
      setForm({
        expense_date: new Date().toISOString().split('T')[0],
        client_id: "",
        branch: "",
        expense_group: "",
        amount: ""
      });
      queryClient.invalidateQueries({ queryKey: ["transport-expenses"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record expense: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.branch || !form.amount) {
      toast({ 
        title: "Error", 
        description: "Client, Branch, and Amount are required",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900">Total Transport Expenses</h3>
        <p className="text-2xl font-bold text-blue-600">₹{totalExpenses.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({...form, expense_date: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={form.client_id}
              onChange={(e) => setForm({...form, client_id: e.target.value})}
            >
              <option value="">Select a client</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.client_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch">Branch *</Label>
            <Input
              id="branch"
              value={form.branch}
              onChange={(e) => setForm({...form, branch: e.target.value})}
              placeholder="Branch name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₹) *</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense-group">Expense Group</Label>
            <Input
              id="expense-group"
              value={form.expense_group}
              onChange={(e) => setForm({...form, expense_group: e.target.value})}
              placeholder="e.g., Delivery, Fuel, etc."
            />
          </div>
        </div>
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Expense"}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Group</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses?.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
              <TableCell>{expense.customers?.client_name || 'N/A'}</TableCell>
              <TableCell>{expense.branch}</TableCell>
              <TableCell>{expense.expense_group}</TableCell>
              <TableCell className="text-right font-medium">₹{expense.amount?.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransportExpenses;