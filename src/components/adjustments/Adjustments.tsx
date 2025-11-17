import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Adjustment, MutationFunction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const Adjustments = () => {
  const [form, setForm] = useState({
    adjustment_type: "",
    amount: "",
    description: "",
    adjustment_date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adjustments } = useQuery({
    queryKey: ["adjustments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("adjustments")
        .select("*")
        .order("adjustment_date", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Omit<Adjustment, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("adjustments")
        .insert({
          ...data,
          amount: parseFloat(data.amount)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Adjustment recorded!" });
      setForm({
        adjustment_type: "",
        amount: "",
        description: "",
        adjustment_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["adjustments"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record adjustment: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adjustment_type || !form.amount || !form.description) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  const totalAdjustments = adjustments?.reduce((sum, adj) => sum + (adj.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900">Total Adjustments</h3>
        <p className="text-2xl font-bold text-yellow-600">₹{totalAdjustments.toLocaleString()}</p>
        <p className="text-sm text-yellow-700 mt-1">
          Exceptional entries affecting profit calculations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adjustment-type">Adjustment Type *</Label>
            <Input
              id="adjustment-type"
              value={form.adjustment_type}
              onChange={(e) => setForm({...form, adjustment_type: e.target.value})}
              placeholder="e.g., Bad Debt, Bonus, Penalty, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adjustment-amount">Amount (₹) *</Label>
            <Input
              id="adjustment-amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              placeholder="0.00 (use negative for deductions)"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adjustment-date">Date</Label>
            <Input
              id="adjustment-date"
              type="date"
              value={form.adjustment_date}
              onChange={(e) => setForm({...form, adjustment_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="adjustment-description">Description *</Label>
          <Textarea
            id="adjustment-description"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            placeholder="Detailed reason for this adjustment..."
          />
        </div>
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Adjustment"}
        </Button>
      </form>

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
          {adjustments?.map((adjustment) => (
            <TableRow key={adjustment.id}>
              <TableCell>{new Date(adjustment.adjustment_date).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium">{adjustment.adjustment_type}</TableCell>
              <TableCell className="max-w-xs truncate">{adjustment.description}</TableCell>
              <TableCell className={`text-right font-medium ${
                (adjustment.amount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(adjustment.amount || 0) >= 0 ? '+' : ''}₹{adjustment.amount?.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Adjustments;