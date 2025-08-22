import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const LabelDesignCosts = () => {
  const [form, setForm] = useState({
    customer_id: "",
    design_description: "",
    cost: "",
    design_date: new Date().toISOString().split('T')[0]
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

  const { data: designCosts } = useQuery({
    queryKey: ["label-design-costs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_design_costs")
        .select(`
          *,
          customers (
            client_name,
            branch
          )
        `)
        .order("design_date", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("label_design_costs")
        .insert({
          ...data,
          cost: parseFloat(data.cost)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label design cost recorded!" });
      setForm({
        customer_id: "",
        design_description: "",
        cost: "",
        design_date: new Date().toISOString().split('T')[0]
      });
      queryClient.invalidateQueries({ queryKey: ["label-design-costs"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record design cost: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_id || !form.design_description || !form.cost) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  const totalDesignCosts = designCosts?.reduce((sum, cost) => sum + (cost.cost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900">Total Design Costs</h3>
        <p className="text-2xl font-bold text-purple-600">₹{totalDesignCosts.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={form.customer_id} onValueChange={(value) => setForm({...form, customer_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.client_name} - {customer.branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost">Design Cost (₹) *</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({...form, cost: e.target.value})}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="design-date">Design Date</Label>
            <Input
              id="design-date"
              type="date"
              value={form.design_date}
              onChange={(e) => setForm({...form, design_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="design-description">Design Description *</Label>
          <Textarea
            id="design-description"
            value={form.design_description}
            onChange={(e) => setForm({...form, design_description: e.target.value})}
            placeholder="Describe the label design work..."
          />
        </div>
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Design Cost"}
        </Button>
      </form>

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
          {designCosts?.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>{new Date(cost.design_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {cost.customers?.client_name}
                {cost.customers?.branch && ` - ${cost.customers.branch}`}
              </TableCell>
              <TableCell className="max-w-xs truncate">{cost.design_description}</TableCell>
              <TableCell className="text-right font-medium">₹{cost.cost?.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabelDesignCosts;