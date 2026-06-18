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

const DEFAULT_ROWS = 5;

interface ClientLabelSummary {
  client_id: string;
  client_name: string;
  total_labels_purchased: number;
  labels_used: number;
  labels_available: number;
  total_amount_spent: number;
  last_purchase_date: string;
}

const LabelAvailability = () => {
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortField, setSortField] = React.useState<keyof ClientLabelSummary>("client_name");

  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Fetch all label purchases
  const { data: labelPurchases, isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["label-purchases-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("client_id, quantity, total_amount, purchase_date")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      
      return data || [];
    },
  });

  // Fetch customers separately
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

  // Fetch sales transactions
  const { data: salesTransactions, isLoading: isLoadingSales } = useQuery({
    queryKey: ["sales-transactions-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select("customer_id, sku, quantity, transaction_date")
        .not("customer_id", "is", null)
        .not("sku", "is", null);

      if (error) throw error;
      
      return data || [];
    },
  });

  // Fetch factory pricing to get bottles_per_case for each SKU
  const { data: factoryPricing } = useQuery({
    queryKey: ["factory-pricing-for-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("factory_pricing")
        .select("sku, bottles_per_case")
        .order("pricing_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching factory pricing:", error);
        return [];
      }
      
      // Get the latest bottles_per_case for each SKU
      const skuMap = new Map<string, number>();
      data?.forEach((item) => {
        if (item.sku && item.bottles_per_case && !skuMap.has(item.sku)) {
          skuMap.set(item.sku, item.bottles_per_case);
        }
      });
      
      return skuMap;
    },
  });

  // Get available SKUs from customers table (client-specific SKUs)
  const getAvailableSKUs = React.useCallback(() => {
    if (!customers) return [];
    
    // Get all unique SKUs from customers table
    const seenSKUs = new Set<string>();
    const uniqueSKUs: { sku: string; client_name: string; branch: string }[] = [];

    customers.forEach(customer => {
      if (customer.sku && customer.sku.trim() !== '') {
        const trimmedSKU = customer.sku.trim();
        const skuKey = `${customer.client_name}_${customer.branch}_${trimmedSKU}`;

        if (!seenSKUs.has(skuKey)) {
          seenSKUs.add(skuKey);
          uniqueSKUs.push({
            sku: trimmedSKU,
            client_name: customer.client_name,
            branch: customer.branch || ''
          });
        }
      }
    });
    
    return uniqueSKUs.sort((a, b) => a.sku.localeCompare(b.sku));
  }, [customers]);

  const isLoading = isLoadingPurchases || isLoadingCustomers || isLoadingSales;

  // Calculate per-client label summaries from label purchases and sales
  const clientSummaries: ClientLabelSummary[] = React.useMemo(() => {
    if (!labelPurchases || labelPurchases.length === 0) {
      return [];
    }

    const summaryMap = new Map<string, ClientLabelSummary>();

    // Process label purchases — group by client (dealer_name)
    labelPurchases.forEach((purchase) => {
      if (!purchase.client_id) return;
      const customer = customers?.find(c => c.id === purchase.client_id);
      if (!customer) return;

      const key = customer.client_name;
      const existing = summaryMap.get(key);

      if (existing) {
        existing.total_labels_purchased += purchase.quantity || 0;
        existing.total_amount_spent += purchase.total_amount || 0;
        if (new Date(purchase.purchase_date) > new Date(existing.last_purchase_date)) {
          existing.last_purchase_date = purchase.purchase_date;
        }
      } else {
        summaryMap.set(key, {
          client_id: purchase.client_id,
          client_name: customer.client_name,
          total_labels_purchased: purchase.quantity || 0,
          labels_used: 0,
          labels_available: 0,
          total_amount_spent: purchase.total_amount || 0,
          last_purchase_date: purchase.purchase_date,
        });
      }
    });

    // Calculate labels used from sales — sum (cases * bottles_per_case) per client
    if (salesTransactions) {
      salesTransactions.forEach((sale) => {
        if (!sale.customer_id || !sale.sku) return;
        const customer = customers?.find(c => c.id === sale.customer_id);
        if (!customer) return;

        const bottlesPerCase = factoryPricing?.get(sale.sku) || 1;
        const labelsUsed = (sale.quantity || 0) * bottlesPerCase;
        const key = customer.client_name;
        const existing = summaryMap.get(key);

        if (existing) {
          existing.labels_used += labelsUsed;
        } else {
          summaryMap.set(key, {
            client_id: sale.customer_id,
            client_name: customer.client_name,
            total_labels_purchased: 0,
            labels_used: labelsUsed,
            labels_available: -labelsUsed,
            total_amount_spent: 0,
            last_purchase_date: sale.transaction_date,
          });
        }
      });
    }

    // Compute labels_available and sort by client name
    return Array.from(summaryMap.values())
      .map(s => ({ ...s, labels_available: s.total_labels_purchased - s.labels_used }))
      .sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [labelPurchases, customers, salesTransactions, factoryPricing]);

  // Filter and sort the data
  const filteredAndSortedData = React.useMemo(() => {
    const filtered = clientSummaries.filter((summary) => {
      // Search filter
      const matchesSearch =
        summary.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "available") {
        matchesStatus = summary.labels_available > 2500;
      } else if (statusFilter === "low_stock") {
        matchesStatus = summary.labels_available > 0 && summary.labels_available <= 2500;
      } else if (statusFilter === "out_of_stock") {
        matchesStatus = summary.labels_available <= 0;
      }
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [clientSummaries, searchTerm, statusFilter, sortField, sortDirection]);

  const visibleRows = isFullscreen ? filteredAndSortedData : (isExpanded ? filteredAndSortedData : filteredAndSortedData.slice(0, DEFAULT_ROWS));

  // Handle sort — collapse back to default when sorting changes
  const handleSort = (field: keyof ClientLabelSummary) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export to Excel
  const handleExport = async () => {
    const exportData = filteredAndSortedData.map(item => ({
      'Client': item.client_name,
      'Labels Purchased': item.total_labels_purchased,
      'Labels Used': item.labels_used,
      'Labels Available': item.labels_available,
      'Last Purchase': new Date(item.last_purchase_date).toLocaleDateString(),
      'Status': item.labels_available > 2500 ? 'Available' : item.labels_available > 0 ? 'Low Stock' : item.labels_available < 0 ? 'Shortage' : 'Out of Stock'
    }));

    await exportJsonToExcel(exportData, 'Label Availability', `label-availability-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tableContent = (
    <div className="space-y-4 flex flex-col flex-1 min-h-0">
      {/* Header row */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Label Availability Summary</h3>
        <div className="flex items-center gap-3">
          {filteredAndSortedData.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(isExpanded || isFullscreen ? filteredAndSortedData.length : DEFAULT_ROWS, filteredAndSortedData.length)} of {filteredAndSortedData.length} clients
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(fs => !fs)}
            title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by client..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading label availability data...</p>
          </div>
        </div>
      ) : (
        <div className={`border rounded-lg flex flex-col ${isFullscreen ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
          <div className={isFullscreen ? "overflow-y-auto flex-1" : ""}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center gap-2">
                      Client
                      {sortField === 'client_name' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('total_labels_purchased')}
                  >
                    <div className="flex items-center gap-2">
                      Labels Purchased
                      {sortField === 'total_labels_purchased' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('labels_used')}
                  >
                    <div className="flex items-center gap-2">
                      Labels Used
                      {sortField === 'labels_used' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('labels_available')}
                  >
                    <div className="flex items-center gap-2">
                      Labels Available
                      {sortField === 'labels_available' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('last_purchase_date')}
                  >
                    <div className="flex items-center gap-2">
                      Last Purchase
                      {sortField === 'last_purchase_date' && (
                        <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length > 0 ? (
                  visibleRows.map((summary, index) => (
                    <TableRow key={`${summary.client_name}_${index}`}>
                      <TableCell className="font-medium">{summary.client_name}</TableCell>
                      <TableCell className="font-medium">{summary.total_labels_purchased.toLocaleString()}</TableCell>
                      <TableCell>{summary.labels_used.toLocaleString()}</TableCell>
                      <TableCell className={`font-medium ${summary.labels_available > 0 ? 'text-green-600' : summary.labels_available < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {summary.labels_available.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(summary.last_purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          summary.labels_available > 2500
                            ? 'bg-green-100 text-green-800'
                            : summary.labels_available > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : summary.labels_available < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {summary.labels_available > 2500 ? 'Available' : summary.labels_available > 0 ? 'Low Stock' : summary.labels_available < 0 ? 'Shortage' : 'Out of Stock'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {clientSummaries.length === 0
                        ? "No label data found. Start by recording some label purchases in the Labels Purchase tab."
                        : "No results found matching your search criteria. Try adjusting your filters."
                      }
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
                {isExpanded ? (
                  <><ChevronUp className="h-4 w-4" />Show less</>
                ) : (
                  <><ChevronDown className="h-4 w-4" />Show all {filteredAndSortedData.length} clients</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open={true} onOpenChange={() => setIsFullscreen(false)}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] flex flex-col p-6 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Label Availability Summary</DialogTitle>
          </DialogHeader>
          {tableContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      {tableContent}
    </div>
  );
};

export default LabelAvailability;
