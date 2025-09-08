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
    client_id: "",
    vendor_id: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    payment_amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    description: ""
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

  const { data: skuConfigs } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data } = await supabase.from("sku_configurations").select("*").order("sku");
      return data || [];
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["label-vendors"],
    queryFn: async () => {
      const { data } = await supabase.from("label_vendors").select("id, vendor_name").order("vendor_name");
      return data || [];
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["label-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("*")
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
          total_amount: parseFloat(data.total_amount),
          payment_amount: data.payment_amount ? parseFloat(data.payment_amount) : null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label purchase recorded!" });
      setForm({
        client_id: "",
        vendor_id: "",
        sku: "",
        quantity: "",
        cost_per_label: "",
        total_amount: "",
        payment_amount: "",
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
    if (!form.client_id || !form.vendor_id || !form.sku || !form.quantity || !form.cost_per_label) {
      toast({ 
        title: "Error", 
        description: "Client, Vendor, SKU, Quantity, and Cost per Label are required",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="vendor">Vendor *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
            >
              <option value="">Select a vendor</option>
              {vendors?.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={form.sku}
              onChange={(e) => setForm({...form, sku: e.target.value})}
            >
              <option value="">Select SKU</option>
              {skuConfigs?.map((sku) => (
                <option key={sku.id} value={sku.sku}>
                  {sku.sku}
                </option>
              ))}
            </select>
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
            <Label htmlFor="payment-amount">Payment for Labels (₹)</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              value={form.payment_amount}
              onChange={(e) => setForm({...form, payment_amount: e.target.value})}
              placeholder="Payment amount"
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
            <TableHead>Client</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Cost/Label</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases?.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
              <TableCell>{customers?.find((c) => c.id === purchase.client_id)?.client_name || 'N/A'}</TableCell>
              <TableCell>{purchase.sku}</TableCell>
              <TableCell className="text-right">{purchase.quantity?.toLocaleString()}</TableCell>
              <TableCell className="text-right">₹{purchase.cost_per_label}</TableCell>
              <TableCell className="text-right font-medium">₹{purchase.total_amount?.toLocaleString()}</TableCell>
              <TableCell className="text-right">{purchase.payment_amount ? `₹${purchase.payment_amount.toLocaleString()}` : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabelPurchases;