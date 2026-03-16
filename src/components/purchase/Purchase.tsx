/**
 * Purchase Landing Page
 * For purchasing preforms, caps, shrink - Item, Quantity, Cost, Vendor, Description
 * Item dropdown is configurable in Application Configuration
 * When Preforms is selected, SKU dropdown appears (from sku_configurations)
 */

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getListConfig } from "@/services/invoiceConfigService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { exportJsonToExcel } from "@/services/export/excelExport";

interface MaterialPurchase {
  id: string;
  item: string;
  sku?: string | null;
  quantity: number;
  cost_per_unit: number;
  total_amount: number;
  vendor: string | null;
  description: string | null;
  purchase_date: string;
  created_at: string;
}

const Purchase = () => {
  const [form, setForm] = useState({
    item: "",
    sku: "",
    quantity: "",
    cost_per_unit: "",
    vendor: "",
    description: "",
    purchase_date: new Date().toISOString().split("T")[0],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchaseItems = [] } = useQuery({
    queryKey: ["purchase-items-config"],
    queryFn: () => getListConfig("purchase_items"),
  });

  const { data: availableSKUs = [] } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => r.sku).filter(Boolean);
    },
  });

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["material-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_purchases")
        .select("*")
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MaterialPurchase[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const qty = parseFloat(data.quantity);
      const cost = parseFloat(data.cost_per_unit);
      const total = qty * cost;
      const { error } = await supabase.from("material_purchases").insert({
        item: data.item,
        sku: data.item === "Preforms" && data.sku?.trim() ? data.sku.trim() : null,
        quantity: qty,
        cost_per_unit: cost,
        total_amount: total,
        vendor: data.vendor?.trim() || null,
        description: data.description?.trim() || null,
        purchase_date: data.purchase_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase recorded!" });
      setForm({
        item: "",
        sku: "",
        quantity: "",
        cost_per_unit: "",
        vendor: "",
        description: "",
        purchase_date: new Date().toISOString().split("T")[0],
      });
      queryClient.invalidateQueries({ queryKey: ["material-purchases"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.item?.trim()) {
      toast({ title: "Error", description: "Item is required", variant: "destructive" });
      return;
    }
    if (form.item === "Preforms" && !form.sku?.trim()) {
      toast({ title: "Error", description: "SKU is required when Item is Preforms", variant: "destructive" });
      return;
    }
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.cost_per_unit);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Error", description: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast({ title: "Error", description: "Enter a valid cost", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const exportToExcel = useCallback(async () => {
    const exportData = purchases.map((p) => ({
      Date: new Date(p.purchase_date).toLocaleDateString(),
      Item: p.item,
      SKU: p.sku || "",
      Quantity: p.quantity,
      "Cost per Unit (₹)": p.cost_per_unit,
      "Total Amount (₹)": p.total_amount,
      Vendor: p.vendor || "",
      Description: p.description || "",
    }));
    await exportJsonToExcel(exportData, 'Purchases', `Purchases_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Export Successful", description: `Exported ${exportData.length} purchases` });
  }, [purchases, toast]);

  const totalAmount = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
    [purchases]
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Purchase</h2>
        <p className="text-sm text-muted-foreground">
          Record purchases of preforms, caps, shrink
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Date, Item, (SKU if Preforms), Quantity, Cost per unit, Total cost (auto) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Date</Label>
            <Input
              id="purchase_date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Select
              value={form.item}
              onValueChange={(v) => setForm({ ...form, item: v, sku: "" })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {purchaseItems.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
                {purchaseItems.length === 0 && (
                  <SelectItem value="_none" disabled>
                    Configure in Application Configuration
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {form.item === "Preforms" && (
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Select
                value={form.sku}
                onValueChange={(v) => setForm({ ...form, sku: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {availableSKUs.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  {availableSKUs.length === 0 && (
                    <SelectItem value="_none" disabled>
                      Add SKUs in Application Configuration
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost per Unit (₹) *</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              value={form.cost_per_unit}
              onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Total Cost (₹)</Label>
            <div className="h-10 px-3 flex items-center rounded-md border bg-muted/50 text-sm font-medium">
              ₹{((parseFloat(form.quantity) || 0) * (parseFloat(form.cost_per_unit) || 0)).toLocaleString() || "0"}
            </div>
          </div>
        </div>

        {/* Row 2: Vendor, Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="Vendor name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Recording..." : "Record Purchase"}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Purchase History</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Total: ₹{totalAmount.toLocaleString()}
            </span>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Cost/Unit (₹)</TableHead>
                <TableHead className="text-right">Total (₹)</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No purchases recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>{p.item}</TableCell>
                    <TableCell>{p.sku || "-"}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">₹{p.cost_per_unit?.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{p.total_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>{p.vendor || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.description || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
