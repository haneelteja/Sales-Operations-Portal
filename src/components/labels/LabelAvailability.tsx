import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Search, Filter, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { exportJsonToExcel } from '@/services/export/excelExport';

const DEFAULT_ROWS = 10;

interface ClientSkuLabelSummary {
  key: string;
  client_id: string;
  client_name: string;
  sku: string;
  total_labels_purchased: number;
  total_adjustments: number;
  production_labels: number;
  sales_labels: number;
  labels_used: number;
  labels_available: number;
  total_amount_spent: number;
  last_purchase_date: string;
}

type SortField = keyof Omit<ClientSkuLabelSummary, 'key' | 'client_id'>;

const LabelAvailability = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortField, setSortField] = React.useState<SortField>("client_name");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

  // 2. Active customers (for name resolution)
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name")
        .eq("is_active", true)
        .eq("is_deprecated", false)
        .order("client_name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // 3. Sales transactions (labels consumed via sales)
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

  // 4. Factory production data (labels consumed via production)
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

  const isLoading = isLoadingPurchases || isLoadingCustomers || isLoadingSales || isLoadingProduction;

  // Build per-client+SKU summaries
  const clientSkuSummaries: ClientSkuLabelSummary[] = React.useMemo(() => {
    if (!labelPurchases?.length) return [];

    const customerMap = new Map(customers?.map(c => [c.id, c.client_name]) ?? []);
    const bottlesPerCase = (sku: string) => skuConfigs?.get(sku) ?? 1;

    const summaryMap = new Map<string, ClientSkuLabelSummary>();

    // Process purchases and adjustments
    labelPurchases.forEach(p => {
      if (!p.client_id || !p.sku) return;
      const clientName = customerMap.get(p.client_id);
      if (!clientName) return;

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
          client_name: clientName,
          sku: p.sku,
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

    // Accumulate production labels (cases × bottles_per_case)
    productionData?.forEach(prod => {
      if (!prod.customer_id || !prod.sku) return;
      const entry = summaryMap.get(`${prod.customer_id}__${prod.sku}`);
      if (entry) {
        entry.production_labels += (prod.quantity || 0) * bottlesPerCase(prod.sku);
      }
    });

    // Accumulate sales labels (cases × bottles_per_case)
    salesTransactions?.forEach(sale => {
      if (!sale.customer_id || !sale.sku) return;
      const entry = summaryMap.get(`${sale.customer_id}__${sale.sku}`);
      if (entry) {
        entry.sales_labels += (sale.quantity || 0) * bottlesPerCase(sale.sku);
      }
    });

    // labels_used = max(production, sales); available = purchased + adjustments - used
    return Array.from(summaryMap.values())
      .map(s => ({
        ...s,
        labels_used: Math.max(s.production_labels, s.sales_labels),
        labels_available:
          s.total_labels_purchased +
          s.total_adjustments -
          Math.max(s.production_labels, s.sales_labels),
      }))
      .sort((a, b) => a.client_name.localeCompare(b.client_name) || a.sku.localeCompare(b.sku));
  }, [labelPurchases, customers, salesTransactions, productionData, skuConfigs]);

  // Filter and sort
  const filteredAndSortedData = React.useMemo(() => {
    const filtered = clientSkuSummaries.filter(s => {
      const matchesSearch =
        s.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sku.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "available") matchesStatus = s.labels_available > 2500;
      else if (statusFilter === "low_stock") matchesStatus = s.labels_available > 0 && s.labels_available <= 2500;
      else if (statusFilter === "out_of_stock") matchesStatus = s.labels_available <= 0;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') cmp = aVal.localeCompare(bVal);
      else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [clientSkuSummaries, searchTerm, statusFilter, sortField, sortDirection]);

  const visibleRows = isFullscreen || isExpanded
    ? filteredAndSortedData
    : filteredAndSortedData.slice(0, DEFAULT_ROWS);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const handleExport = async () => {
    const exportData = filteredAndSortedData.map(s => ({
      'Client': s.client_name,
      'SKU': s.sku,
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

  const SortTh = ({ field, children, align = 'left' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <TableHead
      className={`bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100 ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {sortField === field && <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
      </div>
    </TableHead>
  );

  const tableContent = (
    <div className="space-y-4 flex flex-col flex-1 min-h-0">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Label Availability</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Labels used = max(production, sales) per client + SKU</p>
        </div>
        <div className="flex items-center gap-3">
          {filteredAndSortedData.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {Math.min(isExpanded || isFullscreen ? filteredAndSortedData.length : DEFAULT_ROWS, filteredAndSortedData.length)} of {filteredAndSortedData.length} rows
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(fs => !fs)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by client or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available (&gt;2500)</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Shortage / Out</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading label availability...</p>
          </div>
        </div>
      ) : (
        <div className={`border rounded-lg flex flex-col ${isFullscreen ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
          <div className={isFullscreen ? "overflow-y-auto flex-1" : ""}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortTh field="client_name">Client</SortTh>
                  <SortTh field="sku">SKU</SortTh>
                  <SortTh field="total_labels_purchased" align="right">Purchased</SortTh>
                  <SortTh field="total_adjustments" align="right">Adjustments</SortTh>
                  <SortTh field="production_labels" align="right">Production</SortTh>
                  <SortTh field="sales_labels" align="right">Sales</SortTh>
                  <SortTh field="labels_used" align="right">Used (max)</SortTh>
                  <SortTh field="labels_available" align="right">Available</SortTh>
                  <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length > 0 ? (
                  visibleRows.map(s => (
                    <TableRow key={s.key}>
                      <TableCell className="font-medium">{s.client_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.sku}</TableCell>
                      <TableCell className="text-right">{s.total_labels_purchased.toLocaleString()}</TableCell>
                      <TableCell className={`text-right ${s.total_adjustments > 0 ? 'text-green-600' : s.total_adjustments < 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        {s.total_adjustments !== 0 && s.total_adjustments > 0 ? '+' : ''}{s.total_adjustments.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.production_labels.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.sales_labels.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{s.labels_used.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${s.labels_available > 2500 ? 'text-green-600' : s.labels_available > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.labels_available.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          s.labels_available > 2500
                            ? 'bg-green-100 text-green-800'
                            : s.labels_available > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {s.labels_available > 2500 ? 'Available' : s.labels_available > 0 ? 'Low Stock' : 'Shortage'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {clientSkuSummaries.length === 0
                        ? "No label data found. Record label purchases to get started."
                        : "No results match your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!isFullscreen && filteredAndSortedData.length > DEFAULT_ROWS && (
            <div className="border-t">
              <button
                type="button"
                onClick={() => setIsExpanded(e => !e)}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                {isExpanded
                  ? <><ChevronUp className="h-4 w-4" />Show less</>
                  : <><ChevronDown className="h-4 w-4" />Show all {filteredAndSortedData.length} rows</>
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open onOpenChange={() => setIsFullscreen(false)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] flex flex-col p-6 gap-0">
          <DialogHeader className="sr-only"><DialogTitle>Label Availability</DialogTitle></DialogHeader>
          {tableContent}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="space-y-6">{tableContent}</div>;
};

export default LabelAvailability;
