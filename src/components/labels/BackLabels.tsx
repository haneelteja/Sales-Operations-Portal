import React, { useState, useMemo, useCallback } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
import { ColumnFilter } from "@/components/ui/column-filter";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Download, ChevronDown, ChevronRight, Search, X } from "lucide-react";
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
  const log = useAuditLog();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyPurchaseForm(today));
  const [editingPurchase, setEditingPurchase] = useState<BackLabelPurchase | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyPurchaseForm(today));
  const [toggleForm, setToggleForm] = useState({ client_name: "", effective_from: today });
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // ── Table filter / sort / pagination state ────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [monthFilter, setMonthFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnFilters, setColumnFilters] = useState({
    purchase_date: "", quantity: "", cost_per_label: "", total_amount: "", vendor: "", description: "",
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    purchase_date: "desc", quantity: null, cost_per_label: null, total_amount: null, vendor: null, description: null,
  });

  const handleColumnFilterChange = useCallback((col: string, val: string) =>
    setColumnFilters((prev) => ({ ...prev, [col]: val })), []);

  const handleSortDir = useCallback((col: string, dir: "asc" | "desc" | null) =>
    setColumnSorts((prev) => ({
      ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: null }), {} as typeof prev),
      [col]: dir,
    })), []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setMonthFilter("");
    setCurrentPage(1);
    setColumnFilters({ purchase_date: "", quantity: "", cost_per_label: "", total_amount: "", vendor: "", description: "" });
    setColumnSorts({ purchase_date: "desc", quantity: null, cost_per_label: null, total_amount: null, vendor: null, description: null });
  }, []);

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
        .order("purchase_date", { ascending: false })
        .limit(10000);
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
        .order("created_at", { ascending: false })
        .limit(10000);
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
        .eq("transaction_type", "production")
        .limit(10000);
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

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    purchases.forEach((p) => { if (p.purchase_date) months.add(p.purchase_date.slice(0, 7)); });
    return [...months].sort().reverse();
  }, [purchases]);

  const filteredAndSortedPurchases = useMemo(() => {
    let list = purchases;

    if (monthFilter) list = list.filter((p) => p.purchase_date.startsWith(monthFilter));

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((p) =>
        new Date(p.purchase_date).toLocaleDateString().includes(q) ||
        p.quantity.toString().includes(q) ||
        (p.vendor_id || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    if (columnFilters.purchase_date) {
      list = list.filter((p) => new Date(p.purchase_date).toLocaleDateString().includes(columnFilters.purchase_date));
    }
    if (columnFilters.quantity) list = list.filter((p) => p.quantity.toString() === columnFilters.quantity);
    if (columnFilters.cost_per_label) list = list.filter((p) => p.cost_per_label.toString() === columnFilters.cost_per_label);
    if (columnFilters.total_amount) list = list.filter((p) => p.total_amount.toString() === columnFilters.total_amount);
    if (columnFilters.vendor) list = list.filter((p) => (p.vendor_id || "").toLowerCase().includes(columnFilters.vendor.toLowerCase()));
    if (columnFilters.description) list = list.filter((p) => (p.description || "").toLowerCase().includes(columnFilters.description.toLowerCase()));

    const activeSort = Object.entries(columnSorts).find(([, d]) => d !== null);
    if (activeSort) {
      const [col, dir] = activeSort;
      list = [...list].sort((a, b) => {
        let av: string | number, bv: string | number;
        switch (col) {
          case "purchase_date": av = a.purchase_date; bv = b.purchase_date; break;
          case "quantity": av = a.quantity; bv = b.quantity; break;
          case "cost_per_label": av = a.cost_per_label; bv = b.cost_per_label; break;
          case "total_amount": av = a.total_amount; bv = b.total_amount; break;
          case "vendor": av = a.vendor_id || ""; bv = b.vendor_id || ""; break;
          case "description": av = a.description || ""; bv = b.description || ""; break;
          default: return 0;
        }
        if (av < bv) return dir === "asc" ? -1 : 1;
        if (av > bv) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [purchases, debouncedSearch, monthFilter, columnFilters, columnSorts]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPurchases.slice(start, start + pageSize);
  }, [filteredAndSortedPurchases, currentPage, pageSize]);

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
    onSuccess: (_result, variables) => {
      log({ action: 'CREATE', entityType: 'back_label_purchase', description: `Back label purchase recorded: ${variables.quantity} labels @ ₹${variables.cost_per_label} on ${variables.purchase_date}`, newValues: { quantity: variables.quantity, cost_per_label: variables.cost_per_label, date: variables.purchase_date } });
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
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'back_label_purchase', entityId: variables.id, description: `Back label purchase updated (ID: ${variables.id})`, newValues: { quantity: variables.quantity, cost_per_label: variables.cost_per_label, date: variables.purchase_date } });
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
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'back_label_purchase', entityId: variables, description: `Back label purchase deleted (ID: ${variables})` });
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
    onSuccess: (_result, variables) => {
      log({ action: 'CREATE', entityType: 'back_label_config', description: `Back label config updated: ${variables.client_name} — requires_back_label: ${variables.requires_back_label} from ${variables.effective_from}`, newValues: { client_name: variables.client_name, requires_back_label: variables.requires_back_label, effective_from: variables.effective_from } });
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
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'back_label_config', entityId: variables, description: `Back label config entry deleted (ID: ${variables})` });
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
          <div className="space-y-3">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedPurchases.length} of {purchases.length} purchases
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search purchases..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 w-52"
                  />
                </div>
                {availableMonths.length > 0 && (
                  <select
                    aria-label="Filter by month"
                    value={monthFilter}
                    onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                    className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground"
                  >
                    <option value="">All Months</option>
                    {availableMonths.map((m) => {
                      const [y, mo] = m.split("-");
                      const label = new Date(Number(y), Number(mo) - 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
                      return <option key={m} value={m}>{label}</option>;
                    })}
                  </select>
                )}
                {(searchTerm || monthFilter || Object.values(columnFilters).some(Boolean)) && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="flex items-center gap-1">
                    <X className="h-4 w-4" /> Clear Filters
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
                  <Download className="h-4 w-4" /> Export Excel
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">
                      <div className="flex items-center gap-1">
                        Date
                        <ColumnFilter columnKey="purchase_date" columnName="Date" filterValue={columnFilters.purchase_date} onFilterChange={(v) => { handleColumnFilterChange("purchase_date", v); setCurrentPage(1); }} sortDirection={columnSorts.purchase_date} onSortChange={(d) => handleSortDir("purchase_date", d)} dataType="date" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Quantity
                        <ColumnFilter columnKey="quantity" columnName="Quantity" filterValue={columnFilters.quantity} onFilterChange={(v) => { handleColumnFilterChange("quantity", v); setCurrentPage(1); }} sortDirection={columnSorts.quantity} onSortChange={(d) => handleSortDir("quantity", d)} dataType="number" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Cost/Label
                        <ColumnFilter columnKey="cost_per_label" columnName="Cost/Label" filterValue={columnFilters.cost_per_label} onFilterChange={(v) => { handleColumnFilterChange("cost_per_label", v); setCurrentPage(1); }} sortDirection={columnSorts.cost_per_label} onSortChange={(d) => handleSortDir("cost_per_label", d)} dataType="number" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Total
                        <ColumnFilter columnKey="total_amount" columnName="Total" filterValue={columnFilters.total_amount} onFilterChange={(v) => { handleColumnFilterChange("total_amount", v); setCurrentPage(1); }} sortDirection={columnSorts.total_amount} onSortChange={(d) => handleSortDir("total_amount", d)} dataType="number" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">
                      <div className="flex items-center gap-1">
                        Vendor
                        <ColumnFilter columnKey="vendor" columnName="Vendor" filterValue={columnFilters.vendor} onFilterChange={(v) => { handleColumnFilterChange("vendor", v); setCurrentPage(1); }} sortDirection={columnSorts.vendor} onSortChange={(d) => handleSortDir("vendor", d)} dataType="text" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4">
                      <div className="flex items-center gap-1">
                        Description
                        <ColumnFilter columnKey="description" columnName="Description" filterValue={columnFilters.description} onFilterChange={(v) => { handleColumnFilterChange("description", v); setCurrentPage(1); }} sortDirection={columnSorts.description} onSortChange={(d) => handleSortDir("description", d)} dataType="text" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-slate-50 text-slate-700 py-3 px-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.purchase_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{p.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{p.cost_per_label}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{p.total_amount.toLocaleString("en-IN", { maximumFractionDigits: 4 })}
                        </TableCell>
                        <TableCell>{p.vendor_id || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={p.description || ""}>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No purchases match the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-1">
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                totalRecords={filteredAndSortedPurchases.length}
              />
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {filteredAndSortedPurchases.length > 0
                    ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredAndSortedPurchases.length)} of ${filteredAndSortedPurchases.length}`
                    : "0 records"}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>←</Button>
                <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>→</Button>
              </div>
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
