import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { exportJsonToExcel } from "@/services/export/excelExport";

interface BackLabelPurchase {
  id: string;
  purchase_date: string;
  quantity: number;
  cost_per_label: number;
  total_amount: number;
  vendor_id: string | null;
  description: string | null;
}

interface HistoryRow {
  id: string;
  client_name: string;
  requires_back_label: boolean;
  effective_from: string;
  created_at: string;
}

const emptyPurchaseForm = (today: string) => ({
  purchase_date: today,
  quantity: "",
  cost_per_label: "",
  total_amount: "",
  vendor_id: "",
  description: "",
});

const BackLabels = () => {
  const today = new Date().toISOString().split("T")[0];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyPurchaseForm(today));
  const [editingPurchase, setEditingPurchase] = useState<BackLabelPurchase | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyPurchaseForm(today));
  const [toggleForm, setToggleForm] = useState({ client_name: "", effective_from: today });
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: labelVendors = [] } = useQuery({
    queryKey: ["label-vendors-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_configurations")
        .select("config_value")
        .eq("config_key", "label_vendors")
        .maybeSingle();
      if (!data) return [] as string[];
      try {
        const parsed = JSON.parse(data.config_value || "[]");
        return (Array.isArray(parsed)
          ? parsed.map((e: unknown) =>
              typeof e === "string" ? e : (e as { vendor?: string })?.vendor
            ).filter((v): v is string => !!v)
          : []
        ).sort() as string[];
      } catch { return [] as string[]; }
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["back-label-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("back_label_purchases")
        .select("id, purchase_date, quantity, cost_per_label, total_amount, vendor_id, description")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return (data || []) as BackLabelPurchase[];
    },
  });

  const { data: historyRows = [] } = useQuery({
    queryKey: ["back-label-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_back_label_history")
        .select("id, client_name, requires_back_label, effective_from, created_at")
        .order("client_name", { ascending: true })
        .order("effective_from", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as HistoryRow[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, client_name")
        .eq("is_active", true)
        .eq("is_deprecated", false);
      return data || [];
    },
  });

  const { data: productionRows = [] } = useQuery({
    queryKey: ["factory-payables-production-for-back-labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_payables")
        .select("customer_id, transaction_date, sku, quantity")
        .eq("transaction_type", "production");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bottlesPerCaseMap = new Map<string, number>() } = useQuery({
    queryKey: ["factory-pricing-bottles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_pricing")
        .select("sku, bottles_per_case")
        .order("pricing_date", { ascending: false });
      if (error) return new Map<string, number>();
      const map = new Map<string, number>();
      data?.forEach((r) => {
        if (r.sku && r.bottles_per_case && !map.has(r.sku)) map.set(r.sku, r.bottles_per_case);
      });
      return map;
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const clientNames = useMemo(() => {
    const seen = new Set<string>();
    return customers
      .filter((c) => c.client_name?.trim())
      .map((c) => c.client_name.trim())
      .filter((n) => { if (seen.has(n)) return false; seen.add(n); return true; })
      .sort();
  }, [customers]);

  // Most recent history row per client (historyRows sorted by effective_from DESC already)
  const currentStatusByClient = useMemo(() => {
    const map = new Map<string, HistoryRow>();
    historyRows.forEach((row) => { if (!map.has(row.client_name)) map.set(row.client_name, row); });
    return map;
  }, [historyRows]);

  const historyByClient = useMemo(() => {
    const map = new Map<string, HistoryRow[]>();
    historyRows.forEach((row) => {
      const arr = map.get(row.client_name) || [];
      arr.push(row);
      map.set(row.client_name, arr);
    });
    return map;
  }, [historyRows]);

  const configuredClients = useMemo(
    () => [...historyByClient.keys()].sort(),
    [historyByClient]
  );

  const stockSummary = useMemo(() => {
    const totalPurchased = purchases.reduce((s, p) => s + (p.quantity || 0), 0);

    const customerIdToName = new Map(customers.map((c) => [c.id, c.client_name]));

    let totalConsumed = 0;
    productionRows.forEach((row) => {
      if (!row.customer_id || !row.quantity || !row.sku) return;
      const clientName = customerIdToName.get(row.customer_id);
      if (!clientName) return;
      const history = historyByClient.get(clientName);
      if (!history) return;
      const productionDate = (row.transaction_date || "").split("T")[0];
      // Most recent entry where effective_from <= productionDate
      const active = history.find((h) => h.effective_from <= productionDate);
      if (!active?.requires_back_label) return;
      totalConsumed += row.quantity * (bottlesPerCaseMap.get(row.sku) || 1);
    });

    return { totalPurchased, totalConsumed, netStock: totalPurchased - totalConsumed };
  }, [purchases, productionRows, customers, historyByClient, bottlesPerCaseMap]);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const invalidatePurchases = () => queryClient.invalidateQueries({ queryKey: ["back-label-purchases"] });
  const invalidateHistory = () => queryClient.invalidateQueries({ queryKey: ["back-label-history"] });

  const addPurchaseMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from("back_label_purchases").insert({
        purchase_date: f.purchase_date,
        quantity: parseInt(f.quantity),
        cost_per_label: parseFloat(f.cost_per_label),
        total_amount: parseFloat(f.total_amount),
        vendor_id: f.vendor_id || null,
        description: f.description?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Back label purchase recorded!" });
      setForm(emptyPurchaseForm(today));
      invalidatePurchases();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePurchaseMutation = useMutation({
    mutationFn: async (f: typeof editForm & { id: string }) => {
      const { error } = await supabase
        .from("back_label_purchases")
        .update({
          purchase_date: f.purchase_date,
          quantity: parseInt(f.quantity),
          cost_per_label: parseFloat(f.cost_per_label),
          total_amount: parseFloat(f.total_amount),
          vendor_id: f.vendor_id || null,
          description: f.description?.trim() || null,
        })
        .eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Back label purchase updated!" });
      setEditDialogOpen(false);
      setEditingPurchase(null);
      invalidatePurchases();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("back_label_purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase deleted!" });
      invalidatePurchases();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async (row: { client_name: string; requires_back_label: boolean; effective_from: string }) => {
      const { error } = await supabase.from("customer_back_label_history").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Back label configuration updated!" });
      invalidateHistory();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_back_label_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "History entry deleted!" });
      invalidateHistory();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const calcTotal = (qty: string, cost: string) =>
    qty && cost ? (parseFloat(qty) * parseFloat(cost)).toFixed(4) : "";

  const handleFormChange = (field: "quantity" | "cost_per_label", value: string) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      next.total_amount = calcTotal(next.quantity, next.cost_per_label);
      return next;
    });

  const handleEditFormChange = (field: "quantity" | "cost_per_label", value: string) =>
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };
      next.total_amount = calcTotal(next.quantity, next.cost_per_label);
      return next;
    });

  const handleEditClick = (p: BackLabelPurchase) => {
    setEditingPurchase(p);
    setEditForm({
      purchase_date: p.purchase_date,
      quantity: p.quantity.toString(),
      cost_per_label: p.cost_per_label.toString(),
      total_amount: p.total_amount.toString(),
      vendor_id: p.vendor_id || "",
      description: p.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleAddClientConfig = () => {
    if (!toggleForm.client_name) {
      toast({ title: "Error", description: "Please select a client", variant: "destructive" });
      return;
    }
    toggleMutation.mutate({
      client_name: toggleForm.client_name,
      requires_back_label: true,
      effective_from: toggleForm.effective_from,
    });
    setToggleForm({ client_name: "", effective_from: today });
  };

  const handleExport = async () => {
    const rows = purchases.map((p) => ({
      "Purchase Date": new Date(p.purchase_date).toLocaleDateString(),
      Quantity: p.quantity,
      "Cost per Label (₹)": p.cost_per_label,
      "Total Amount (₹)": p.total_amount,
      Vendor: p.vendor_id || "",
      Description: p.description || "",
    }));
    await exportJsonToExcel(rows, "Back Label Purchases", `back-label-purchases-${today}.xlsx`);
  };

  const vendorOptions = labelVendors.map((v) => ({ value: v, label: v }));

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockSummary.totalPurchased.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">labels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockSummary.totalConsumed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">bottles produced for back-label clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stockSummary.netStock >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stockSummary.netStock.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">labels remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Configuration */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Client Back Label Configuration</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Each change creates a dated record. Production from the effective date onward counts toward back label consumption; prior production does not.
          </p>
        </div>

        {/* Add / enable a client */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="space-y-2 min-w-[200px] flex-1">
            <Label>Client</Label>
            <SearchableSelect
              options={clientNames.map((n) => ({ value: n, label: n }))}
              value={toggleForm.client_name}
              onValueChange={(v) => setToggleForm((prev) => ({ ...prev, client_name: v }))}
              placeholder="Select client..."
            />
          </div>
          <div className="space-y-2">
            <Label>Effective From</Label>
            <Input
              type="date"
              value={toggleForm.effective_from}
              min="2024-01-01"
              max={today}
              onChange={(e) => setToggleForm((prev) => ({ ...prev, effective_from: e.target.value }))}
            />
          </div>
          <Button onClick={handleAddClientConfig} disabled={toggleMutation.isPending}>
            Enable Back Label
          </Button>
        </div>

        {configuredClients.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Client</TableHead>
                  <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Current Status</TableHead>
                  <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Since</TableHead>
                  <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configuredClients.map((clientName) => {
                  const current = currentStatusByClient.get(clientName);
                  const history = historyByClient.get(clientName) || [];
                  const isExpanded = expandedClient === clientName;
                  return (
                    <React.Fragment key={clientName}>
                      <TableRow>
                        <TableCell className="font-medium">{clientName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${current?.requires_back_label ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                            {current?.requires_back_label ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {current ? new Date(current.effective_from).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={current?.requires_back_label ? "outline" : "default"}
                              disabled={toggleMutation.isPending}
                              onClick={() =>
                                toggleMutation.mutate({
                                  client_name: clientName,
                                  requires_back_label: !current?.requires_back_label,
                                  effective_from: today,
                                })
                              }
                            >
                              {current?.requires_back_label ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedClient(isExpanded ? null : clientName)}
                              className="flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-slate-50/50">
                          <TableCell colSpan={4} className="py-3 px-8">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Toggle History</p>
                            <div className="space-y-1">
                              {history.map((h) => (
                                <div key={h.id} className="flex items-center gap-4 text-sm py-1">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.requires_back_label ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                                    {h.requires_back_label ? "Enabled" : "Disabled"}
                                  </span>
                                  <span className="text-muted-foreground">from {new Date(h.effective_from).toLocaleDateString()}</span>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 ml-auto">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete history entry?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This removes the "{h.requires_back_label ? "Enabled" : "Disabled"}" entry from{" "}
                                          {new Date(h.effective_from).toLocaleDateString()} for {clientName}. This will affect consumption calculations.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteHistoryMutation.mutate(h.id)} className="bg-red-600 hover:bg-red-700">
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Purchases */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Record Back Label Purchase</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.quantity || !form.cost_per_label) {
              toast({ title: "Error", description: "Quantity and Cost per Label are required", variant: "destructive" });
              return;
            }
            addPurchaseMutation.mutate(form);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Purchase Date *</Label>
              <Input
                type="date"
                value={form.purchase_date}
                min="2024-01-01"
                max={today}
                onChange={(e) => setForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={form.quantity}
                placeholder="Number of labels"
                onChange={(e) => handleFormChange("quantity", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cost per Label (₹) *</Label>
              <Input
                type="number"
                step="0.0001"
                value={form.cost_per_label}
                placeholder="0.0000"
                onChange={(e) => handleFormChange("cost_per_label", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.total_amount}
                placeholder="Auto-calculated"
                onChange={(e) => setForm((prev) => ({ ...prev, total_amount: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <SearchableSelect
                options={vendorOptions}
                value={form.vendor_id}
                onValueChange={(v) => setForm((prev) => ({ ...prev, vendor_id: v }))}
                placeholder="Select vendor"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Purchase details..."
                className="min-h-[2.5rem] resize-y"
                rows={1}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={addPurchaseMutation.isPending} className="px-8">
              {addPurchaseMutation.isPending ? "Recording..." : "Record Purchase"}
            </Button>
          </div>
        </form>

        {purchases.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{purchases.length} purchases recorded</p>
              <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Date</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">Quantity</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">Cost/Label</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">Total</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Vendor</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">Description</TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{p.cost_per_label}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{p.total_amount.toLocaleString("en-IN", { maximumFractionDigits: 4 })}
                      </TableCell>
                      <TableCell>{p.vendor_id || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {p.description || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this purchase?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the back label purchase record from{" "}
                                  {new Date(p.purchase_date).toLocaleDateString()}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePurchaseMutation.mutate(p.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingPurchase(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Back Label Purchase</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editForm.quantity || !editForm.cost_per_label) {
                toast({ title: "Error", description: "Quantity and Cost per Label are required", variant: "destructive" });
                return;
              }
              if (editingPurchase) updatePurchaseMutation.mutate({ ...editForm, id: editingPurchase.id });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={editForm.purchase_date}
                  min="2024-01-01"
                  max={today}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => handleEditFormChange("quantity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cost per Label (₹) *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={editForm.cost_per_label}
                  onChange={(e) => handleEditFormChange("cost_per_label", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.total_amount}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, total_amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <SearchableSelect
                  options={vendorOptions}
                  value={editForm.vendor_id}
                  onValueChange={(v) => setEditForm((prev) => ({ ...prev, vendor_id: v }))}
                  placeholder="Select vendor"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePurchaseMutation.isPending}>
                {updatePurchaseMutation.isPending ? "Updating..." : "Update Purchase"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackLabels;
