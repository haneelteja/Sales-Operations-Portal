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

const LabelPurchases = () => {
  const [form, setForm] = useState({
    vendor_id: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors } = useQuery({
    queryKey: ["label-vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("label_vendors").select("*").order("vendor_name");
      return data || [];
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["label-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select(`
          *,
          label_vendors (
            vendor_name,
            label_type
          )
        `)
        .order("purchase_date", { ascending: false });
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("label_purchases")
        .insert({
          ...data,
          quantity: parseInt(data.quantity),
          cost_per_label: parseFloat(data.cost_per_label),
          total_amount: parseFloat(data.total_amount)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label purchase recorded!" });
      setForm({
        vendor_id: "",
        quantity: "",
        cost_per_label: "",
        total_amount: "",
        purchase_date: new Date().toISOString().split('T')[0],
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record purchase: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor_id || !form.quantity || !form.cost_per_label) {
      toast({ 
        title: "Error", 
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }
    mutation.mutate(form);
  };

  // Auto-calculate total amount
  const handleQuantityOrCostChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    if (newForm.quantity && newForm.cost_per_label) {
      newForm.total_amount = (parseFloat(newForm.quantity) * parseFloat(newForm.cost_per_label)).toString();
    }
    setForm(newForm);
  };

  const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900">Total Label Purchases</h3>
        <p className="text-2xl font-bold text-green-600">₹{totalPurchases.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Select value={form.vendor_id} onValueChange={(value) => setForm({...form, vendor_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name} - {vendor.label_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => handleQuantityOrCostChange("quantity", e.target.value)}
              placeholder="Number of labels"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cost-per-label">Cost per Label (₹) *</Label>
            <Input
              id="cost-per-label"
              type="number"
              step="0.0001"
              value={form.cost_per_label}
              onChange={(e) => handleQuantityOrCostChange("cost_per_label", e.target.value)}
              placeholder="0.0000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount (₹)</Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => setForm({...form, total_amount: e.target.value})}
              placeholder="Auto-calculated"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase-date">Purchase Date</Label>
            <Input
              id="purchase-date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({...form, purchase_date: e.target.value})}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            placeholder="Purchase details..."
          />
        </div>
        
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Purchase"}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Cost/Label</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases?.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {purchase.label_vendors?.vendor_name}
                {purchase.label_vendors?.label_type && ` (${purchase.label_vendors.label_type})`}
              </TableCell>
              <TableCell className="text-right">{purchase.quantity?.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{purchase.cost_per_label}</TableCell>
              <TableCell className="text-right font-medium">₹{purchase.total_amount?.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabelPurchases;