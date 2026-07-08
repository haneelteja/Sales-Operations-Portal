import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Search, Maximize2, Minimize2, SlidersHorizontal } from "lucide-react";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { useToast } from "@/hooks/use-toast";

interface ClientSkuLabelSummary {
  key: string;
  client_id: string;
  client_name: string;
  sku: string;
  is_deprecated: boolean;
  total_labels_purchased: number;
  total_adjustments: number;
  production_labels: number;
  sales_labels: number;
  labels_used: number;
  labels_available: number;
  total_amount_spent: number;
  last_purchase_date: string;
}

const LabelAvailability = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const [adjusting, setAdjusting] = React.useState<ClientSkuLabelSummary | null>(null);
  const [adjForm, setAdjForm] = React.useState({
    quantity: "",
    reason: "",
    vendor_id: "",
    date: new Date().toISOString().split('T')[0],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Label purchases + adjustments
  const { data: labelPurchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["label-purchases-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("client_id, sku, quantity, total_amount, purchase_date, record_type")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // 2. All active customers including deprecated — no is_deprecated filter so we can split them
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, is_deprecated")
        .eq("is_active", true)
        .order("client_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Sales transactions
  const { data: salesTransactions, isLoading: isLoadingSales } = useQuery({
    queryKey: ["sales-transactions-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select("customer_id, sku, quantity")
        .eq("transaction_type", "sale")
        .not("customer_id", "is", null)
        .not("sku", "is", null)
        .gt("quantity", 0);
      if (error) throw error;
      return data || [];
    },
  });

  // 4. Factory production data
  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ["factory-production-for-labels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_payables")
        .select("customer_id, sku, quantity")
        .eq("transaction_type", "production")
        .not("customer_id", "is", null)
        .gt("quantity", 0);
      if (error) throw error;
      return data || [];
    },
  });

  // 5. SKU configurations for bottles_per_case
  const { data: skuConfigs } = useQuery({
    queryKey: ["sku-configurations-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku, bottles_per_case");
      if (error) throw error;
      const map = new Map<string, number>();
      data?.forEach(r => { if (r.sku && r.bottles_per_case) map.set(r.sku, r.bottles_per_case); });
      return map;
    },
  });

  // 6. Label vendors for adjustment source dropdown
  const { data: labelVendors } = useQuery({
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
        if (!Array.isArray(parsed)) return [] as string[];
        const vendors = parsed.map((e: unknown) =>
          typeof e === 'string' ? e : (e as { vendor?: string })?.vendor
        ).filter((v): v is string => !!v);
        return [...new Set(vendors)].sort() as string[];
      } catch { return [] as string[]; }
    },
  });

  // Adjustment mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjusting) throw new Error("No row selected");
      const qty = parseInt(adjForm.quantity);
      if (isNaN(qty) || qty === 0) throw new Error("Quantity must be a non-zero number");
      const { error } = await supabase.from("label_purchases").insert({
        client_id: adjusting.client_id,
        sku: adjusting.sku,
        quantity: qty,
        cost_per_label: 0,
        total_amount: 0,
        purchase_date: adjForm.date,
        vendor_id: adjForm.vendor_id || null,
        record_type: 'adjustment',
        reason: adjForm.reason?.trim() || null,
        description: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Adjustment recorded", description: `${adjForm.quantity > '0' ? '+' : ''}${adjForm.quantity} labels for ${adjusting?.client_name} / ${adjusting?.sku}` });
      setAdjusting(null);
      setAdjForm({ quantity: "", reason: "", vendor_id: "", date: today });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isLoading = isLoadingPurchases || isLoadingCustomers || isLoadingSales || isLoadingProduction;

  // Build per-client+SKU summaries (all clients, including deprecated)
  const clientSkuSummaries: ClientSkuLabelSummary[] = React.useMemo(() => {
    if (!labelPurchases?.length) return [];

    const customerMap = new Map(
      customers?.map(c => [c.id, { client_name: c.client_name, is_deprecated: c.is_deprecated ?? false }]) ?? []
    );
    const bottlesPerCase = (sku: string) => skuConfigs?.get(sku) ?? 1;

    const summaryMap = new Map<string, ClientSkuLabelSummary>();

    labelPurchases.forEach(p => {
      if (!p.client_id || !p.sku) return;
      const customerInfo = customerMap.get(p.client_id);
      if (!customerInfo) return;

      const key = `${p.client_id}__${p.sku}`;
      const isAdj = (p.record_type as string) === 'adjustment';
      const qty = p.quantity || 0;

      const existing = summaryMap.get(key);
      if (existing) {
        if (isAdj) {
          existing.total_adjustments += qty;
        } else {
          existing.total_labels_purchased += qty;
          existing.total_amount_spent += p.total_amount || 0;
          if (p.purchase_date && p.purchase_date > existing.last_purchase_date) {
            existing.last_purchase_date = p.purchase_date;
          }
        }
      } else {
        summaryMap.set(key, {
          key,
          client_id: p.client_id,
          client_name: customerInfo.client_name,
          sku: p.sku,
          is_deprecated: customerInfo.is_deprecated,
          total_labels_purchased: isAdj ? 0 : qty,
          total_adjustments: isAdj ? qty : 0,
          production_labels: 0,
          sales_labels: 0,
          labels_used: 0,
          labels_available: 0,
          total_amount_spent: isAdj ? 0 : (p.total_amount || 0),
          last_purchase_date: p.purchase_date || '',
        });
      }
    });

    productionData?.forEach(prod => {
      if (!prod.customer_id || !prod.sku) return;
      const entry = summaryMap.get(`${prod.customer_id}__${prod.sku}`);
      if (entry) entry.production_labels += (prod.quantity || 0) * bottlesPerCase(prod.sku);
    });

    salesTransactions?.forEach(sale => {
      if (!sale.customer_id || !sale.sku) return;
      const entry = summaryMap.get(`${sale.customer_id}__${sale.sku}`);
      if (entry) entry.sales_labels += (sale.quantity || 0) * bottlesPerCase(sale.sku);
    });

    return Array.from(summaryMap.values())
      .map(s => ({
        ...s,
        labels_used: Math.max(s.production_labels, s.sales_labels),
        labels_available:
          s.total_labels_purchased +
          s.total_adjustments -
          Math.max(s.production_labels, s.sales_labels),
      }))
      .filter(s => s.sku !== 'Plates');
  }, [labelPurchases, customers, salesTransactions, productionData, skuConfigs]);

  // Split into 3 groups, each sorted by labels_available ascending (least available first)
  const { activeRows, zeroStockRows, deprecatedRows } = React.useMemo(() => {
    const search = searchTerm.toLowerCase();
    const filtered = clientSkuSummaries.filter(s =>
      !search ||
      s.client_name.toLowerCase().includes(search) ||
      s.sku.toLowerCase().includes(search)
    );

    const byAvailable = (a: ClientSkuLabelSummary, b: ClientSkuLabelSummary) =>
      a.labels_available - b.labels_available;

    const deprecated = filtered.filter(s => s.is_deprecated).sort(byAvailable);
    const rest = filtered.filter(s => !s.is_deprecated);
    const zeroStock = rest
      .filter(s => s.labels_available === 0 || s.total_labels_purchased === 0)
      .sort(byAvailable);
    const active = rest
      .filter(s => s.labels_available !== 0 && s.total_labels_purchased > 0)
      .sort(byAvailable);

    return { activeRows: active, zeroStockRows: zeroStock, deprecatedRows: deprecated };
  }, [clientSkuSummaries, searchTerm]);

  const openAdjustDialog = (row: ClientSkuLabelSummary) => {
    setAdjusting(row);
    setAdjForm({ quantity: "", reason: "", vendor_id: "", date: today });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjForm.quantity);
    if (isNaN(qty) || qty === 0) {
      toast({ title: "Error", description: "Enter a non-zero quantity (negative to deduct)", variant: "destructive" });
      return;
    }
    adjustMutation.mutate();
  };

  const handleExport = async () => {
    const allRows = [...activeRows, ...zeroStockRows, ...deprecatedRows];
    const exportData = allRows.map(s => ({
      'Client': s.client_name,
      'SKU': s.sku,
      'Status': s.is_deprecated ? 'Deprecated' : s.labels_available === 0 || s.total_labels_purchased === 0 ? 'Zero Stock' : 'Active',
      'Labels Purchased': s.total_labels_purchased,
      'Adjustments': s.total_adjustments,
      'Production Labels': s.production_labels,
      'Sales Labels': s.sales_labels,
      'Labels Used (max)': s.labels_used,
      'Labels Available': s.labels_available,
      'Last Purchase': s.last_purchase_date ? new Date(s.last_purchase_date).toLocaleDateString() : '',
    }));
    await exportJsonToExcel(exportData, 'Label Availability', `label-availability-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const availableColor = (n: number) =>
    n > 2500 ? 'text-green-600' : n > 0 ? 'text-yellow-600' : 'text-red-600';

  const availableBadge = (n: number) =>
    n > 2500 ? 'bg-green-100 text-green-800' : n > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

  const availableLabel = (n: number) =>
    n > 2500 ? 'Available' : n > 0 ? 'Low Stock' : 'Shortage';

  const tableHeaders = (
    <TableHeader>
      <TableRow>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Client</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">SKU</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Purchased</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Adjustments</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Production</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Sales</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Used (max)</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-right">Available ↑</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Status</TableHead>
        <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 text-center">Action</TableHead>
      </TableRow>
    </TableHeader>
  );

  const renderRows = (rows: ClientSkuLabelSummary[]) =>
    rows.map(s => (
      <TableRow key={s.key}>
        <TableCell className="font-medium">{s.client_name}</TableCell>
        <TableCell className="text-muted-foreground text-sm">{s.sku}</TableCell>
        <TableCell className="text-right">{s.total_labels_purchased.toLocaleString()}</TableCell>
        <TableCell className={`text-right ${s.total_adjustments > 0 ? 'text-green-600' : s.total_adjustments < 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
          {s.total_adjustments > 0 ? '+' : ''}{s.total_adjustments.toLocaleString()}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">{s.production_labels.toLocaleString()}</TableCell>
        <TableCell className="text-right text-muted-foreground">{s.sales_labels.toLocaleString()}</TableCell>
        <TableCell className="text-right font-medium">{s.labels_used.toLocaleString()}</TableCell>
        <TableCell className={`text-right font-semibold ${availableColor(s.labels_available)}`}>
          {s.labels_available.toLocaleString()}
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs ${availableBadge(s.labels_available)}`}>
            {availableLabel(s.labels_available)}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAdjustDialog(s)}
            className="gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Adjust
          </Button>
        </TableCell>
      </TableRow>
    ));

  const emptyRow = (msg: string) => (
    <TableRow>
      <TableCell colSpan={10} className="text-center text-muted-foreground py-6 text-sm">{msg}</TableCell>
    </TableRow>
  );

  const tableContent = (
    <div className="space-y-6 flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Label Availability</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used = max(production, sales) · Click <span className="font-medium">Adjust</span> on any row to record a count correction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(fs => !fs)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by client or SKU..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading label availability...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table 1 — Active */}
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Active ({activeRows.length})</h4>
              <p className="text-xs text-muted-foreground">Clients with label purchases — sorted least available first</p>
            </div>
            <div className="border rounded-lg">
              <Table>
                {tableHeaders}
                <TableBody>
                  {activeRows.length > 0 ? renderRows(activeRows) : emptyRow("No active label entries.")}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Table 2 — Zero Stock */}
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-500">Zero Stock ({zeroStockRows.length})</h4>
              <p className="text-xs text-muted-foreground">Available = 0 or no purchases recorded yet</p>
            </div>
            <div className="border rounded-lg opacity-80">
              <Table>
                {tableHeaders}
                <TableBody>
                  {zeroStockRows.length > 0 ? renderRows(zeroStockRows) : emptyRow("No zero-stock entries.")}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Table 3 — Deprecated */}
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-400">Deprecated ({deprecatedRows.length})</h4>
              <p className="text-xs text-muted-foreground">Clients marked as deprecated in Configurations</p>
            </div>
            <div className="border rounded-lg opacity-60">
              <Table>
                {tableHeaders}
                <TableBody>
                  {deprecatedRows.length > 0 ? renderRows(deprecatedRows) : emptyRow("No deprecated client entries.")}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Adjustment dialog */}
      <Dialog open={!!adjusting} onOpenChange={open => { if (!open) setAdjusting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Label Adjustment</DialogTitle>
          </DialogHeader>

          {adjusting && (
            <form onSubmit={handleAdjustSubmit} className="space-y-5">
              <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
                <div className="text-sm font-medium">{adjusting.client_name}</div>
                <div className="text-xs text-muted-foreground">{adjusting.sku}</div>
              </div>

              <div className="rounded-lg border px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current available</span>
                <span className={`text-xl font-bold ${availableColor(adjusting.labels_available)}`}>
                  {adjusting.labels_available.toLocaleString()} labels
                </span>
              </div>

              {adjusting.labels_available < 0 && (
                <p className="text-xs text-red-600 -mt-2">
                  Balance is negative — labels were used before the purchase was recorded, or a count mismatch exists.
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="adj-date">Date *</Label>
                <Input
                  id="adj-date"
                  type="date"
                  value={adjForm.date}
                  min="2024-01-01"
                  max={today}
                  onChange={e => setAdjForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-qty">Quantity * <span className="font-normal text-muted-foreground">(use negative to deduct)</span></Label>
                <Input
                  id="adj-qty"
                  type="number"
                  value={adjForm.quantity}
                  onChange={e => setAdjForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="e.g. -120 or +50"
                  autoFocus
                />
                {adjForm.quantity && !isNaN(parseInt(adjForm.quantity)) && (
                  <p className="text-xs text-muted-foreground">
                    New balance after adjustment:{' '}
                    <span className={`font-semibold ${availableColor(adjusting.labels_available + parseInt(adjForm.quantity))}`}>
                      {(adjusting.labels_available + parseInt(adjForm.quantity)).toLocaleString()} labels
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-reason">Reason</Label>
                <Input
                  id="adj-reason"
                  value={adjForm.reason}
                  onChange={e => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. count mismatch, label size issue"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-vendor">Source / Vendor <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <select
                  id="adj-vendor"
                  title="Source / Vendor"
                  value={adjForm.vendor_id}
                  onChange={e => setAdjForm(f => ({ ...f, vendor_id: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— none —</option>
                  {(labelVendors || []).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button>
                <Button type="submit" disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? "Saving..." : "Record Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open onOpenChange={() => setIsFullscreen(false)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] flex flex-col p-6 gap-0 overflow-y-auto">
          <DialogHeader className="sr-only"><DialogTitle>Label Availability</DialogTitle></DialogHeader>
          {tableContent}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="space-y-6">{tableContent}</div>;
};

export default LabelAvailability;
