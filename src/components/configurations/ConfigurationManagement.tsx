import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import type { Customer } from "@/types";
import { AddDealerDialog } from "./AddDealerDialog";
import { ClientContactsDialog } from "./ClientContactsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserX, UserCheck, Download, ArrowUpDown, MoreHorizontal, BookOpen, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ColumnFilter } from "@/components/ui/column-filter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { exportLedger } from '@/lib/ledgerExport';
import { logger } from '@/lib/logger';

const ConfigurationManagement = () => {
  const [dealerDialogState, setDealerDialogState] = useState<{
    open: boolean;
    initialClientName?: string;
    initialBranch?: string;
  }>({ open: false });
  const [exportingLedgerFor, setExportingLedgerFor] = useState<string | null>(null);
  const [contactsTarget, setContactsTarget] = useState<{ clientName: string; branch: string } | null>(null);
  const [openingBalanceTarget, setOpeningBalanceTarget] = useState<{ clientName: string; branch: string; current: number } | null>(null);
  const [openingBalanceInput, setOpeningBalanceInput] = useState("");

  const [showLatestOnly, setShowLatestOnly] = useState(true);

  // Filtering and sorting state for customers
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState({
    client_name: "",
    branch: "",
    sku: "",
    pricing_date: "",
    price_per_case: "",
    price_per_bottle: ""
  });
  const [columnSorts, setColumnSorts] = useState<Record<string, "asc" | "desc" | null>>({
    client_name: null,
    branch: null,
    sku: null,
    pricing_date: null,
    price_per_case: null,
    price_per_bottle: null
  });

  useEffect(() => {
    if (!contactsTarget) {
      const t = setTimeout(() => {
        document.body.style.removeProperty('pointer-events');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [contactsTarget]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();
  const { invalidateRelated } = useCacheInvalidation();

  // Customer Management queries and mutations
  const { data: customers, error: customersError } = useQuery({
    queryKey: ["customers-management"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, client_name, branch, sku, price_per_case, price_per_bottle, mrp_per_bottle, whatsapp_number, gst_number, pricing_date, is_active, opening_balance, created_at, updated_at")
          .order("client_name", { ascending: true });

        if (error) {
          logger.error('Error fetching customers:', error);
          throw new Error(handleSupabaseError(error));
        }

        return data || [];
      } catch (error) {
        logger.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch customers",
          variant: "destructive"
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Deactivate all rows for a client+branch
  const deactivateCustomerMutation = useMutation({
    mutationFn: async ({ clientName, branch }: { clientName: string; branch: string | null }) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false })
        .eq("client_name", clientName)
        .eq("branch", branch ?? "");
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables.clientName, description: `Client deactivated: ${variables.clientName} — ${variables.branch}` });
      toast({ title: "Success", description: "Client deactivated." });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to deactivate: " + error.message, variant: "destructive" });
    },
  });

  // Hard delete for pricing rows (configuration data only — no financial records affected)
  const deletePricingRowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'client_configuration', entityId: variables, description: `Pricing row deleted (ID: ${variables})` });
      toast({ title: "Deleted", description: "Pricing row deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete pricing row: " + error.message, variant: "destructive" });
    },
  });

  // Reactivate all rows for a client+branch
  const reactivateCustomerMutation = useMutation({
    mutationFn: async ({ clientName, branch }: { clientName: string; branch: string | null }) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: true })
        .eq("client_name", clientName)
        .eq("branch", branch ?? "");
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables.clientName, description: `Client reactivated: ${variables.clientName} — ${variables.branch}` });
      toast({ title: "Success", description: "Client reactivated." });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to reactivate: " + error.message, variant: "destructive" });
    },
  });

  // Opening balance mutation — updates ALL rows for the client+branch pair
  const setOpeningBalanceMutation = useMutation({
    mutationFn: async ({ clientName, branch, amount }: { clientName: string; branch: string; amount: number }) => {
      const { error } = await supabase
        .from("customers")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ opening_balance: amount } as any)
        .eq("client_name", clientName)
        .eq("branch", branch);
      if (error) throw error;

      // Trigger outstanding recalculation so total_amount includes the new offset
      await supabase.rpc("recalculate_outstanding_for_client", {
        p_client_name: clientName,
        p_branch: branch,
      });
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables.clientName, description: `Opening balance set to ₹${variables.amount} for ${variables.clientName} — ${variables.branch}` });
      toast({ title: "Opening balance saved", description: `Outstanding totals for ${variables.clientName} (${variables.branch}) have been recalculated.` });
      setOpeningBalanceTarget(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to save opening balance: " + error.message, variant: "destructive" });
    },
  });

  // Filter and sort customers (memoized for performance)
  const filteredAndSortedCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer) => {
    const clientName = customer.client_name || '';
    const area = customer.branch || '';
    const sku = customer.sku || '';
    const pricingDate = customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '';
    const pricePerCase = customer.price_per_case?.toString() || '';
    const pricePerBottle = customer.price_per_bottle?.toString() || '';
    const createdDate = new Date(customer.created_at).toLocaleDateString();
    
    // Global search filter (using debounced value)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesGlobalSearch = (
        clientName.toLowerCase().includes(searchLower) ||
        area.toLowerCase().includes(searchLower) ||
        sku.toLowerCase().includes(searchLower) ||
        pricingDate.includes(searchLower) ||
        pricePerCase.includes(searchLower) ||
        pricePerBottle.includes(searchLower) ||
        createdDate.includes(searchLower)
      );
      if (!matchesGlobalSearch) return false;
    }
    
    // Column-specific filters
    if (columnFilters.client_name && !clientName.toLowerCase().includes(columnFilters.client_name.toLowerCase())) return false;
    if (columnFilters.branch && !area.toLowerCase().includes(columnFilters.branch.toLowerCase())) return false;
    if (columnFilters.sku && !sku.toLowerCase().includes(columnFilters.sku.toLowerCase())) return false;
    if (columnFilters.pricing_date && pricingDate !== columnFilters.pricing_date) return false;
    if (columnFilters.price_per_case && !pricePerCase.includes(columnFilters.price_per_case)) return false;
    if (columnFilters.price_per_bottle && !pricePerBottle.includes(columnFilters.price_per_bottle)) return false;
    
    return true;
  }).sort((a, b) => {
    // Default sorting: Active first, then Client Name → Branch → SKU → Pricing Date
    const activeSort = Object.entries(columnSorts).find(([_, direction]) => direction !== null);

    // If no manual sort is applied, use default sorting
    if (!activeSort) {
      // 1. Sort by is_active (active first)
      if (a.is_active !== b.is_active) {
        return a.is_active ? -1 : 1; // Active customers first
      }

      // 2. Sort by client_name
      const clientNameA = (a.client_name || '').toLowerCase();
      const clientNameB = (b.client_name || '').toLowerCase();
      if (clientNameA !== clientNameB) {
        return clientNameA < clientNameB ? -1 : 1;
      }

      // 3. Sort by branch
      const areaA = (a.branch || '').toLowerCase();
      const areaB = (b.branch || '').toLowerCase();
      if (areaA !== areaB) {
        return areaA < areaB ? -1 : 1;
      }
      
      // 4. Sort by SKU
      const skuA = (a.sku || '').toLowerCase();
      const skuB = (b.sku || '').toLowerCase();
      if (skuA !== skuB) {
        return skuA < skuB ? -1 : 1;
      }
      
      // 5. Sort by pricing_date (newest first)
      const dateA = new Date(a.pricing_date || 0).getTime();
      const dateB = new Date(b.pricing_date || 0).getTime();
      return dateB - dateA; // Newest first
    }

    // Manual sorting (when user clicks column headers)
    const [columnKey, direction] = activeSort;
    let valueA: string | number, valueB: string | number;

    switch (columnKey) {
      case 'client_name':
        valueA = (a.client_name || '').toLowerCase();
        valueB = (b.client_name || '').toLowerCase();
        break;
      case 'branch':
        valueA = (a.branch || '').toLowerCase();
        valueB = (b.branch || '').toLowerCase();
        break;
      case 'sku':
        valueA = (a.sku || '').toLowerCase();
        valueB = (b.sku || '').toLowerCase();
        break;
      case 'pricing_date':
        valueA = new Date(a.pricing_date || 0).getTime();
        valueB = new Date(b.pricing_date || 0).getTime();
        break;
      case 'price_per_case':
        valueA = a.price_per_case || 0;
        valueB = b.price_per_case || 0;
        break;
      case 'price_per_bottle':
        valueA = a.price_per_bottle || 0;
        valueB = b.price_per_bottle || 0;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
    });
  }, [customers, debouncedSearchTerm, columnFilters, columnSorts]);

  // When showLatestOnly is on, keep only the latest pricing_date per (client_name, branch, sku)
  const displayedCustomers = useMemo(() => {
    if (!showLatestOnly) return filteredAndSortedCustomers;
    const latestIds = new Map<string, { id: string; date: number }>();
    filteredAndSortedCustomers.forEach((c) => {
      const key = `${c.client_name}|||${c.branch ?? ''}|||${c.sku ?? ''}`;
      const d = new Date(c.pricing_date || 0).getTime();
      const cur = latestIds.get(key);
      if (!cur || d > cur.date) latestIds.set(key, { id: c.id, date: d });
    });
    const ids = new Set(Array.from(latestIds.values()).map((v) => v.id));
    return filteredAndSortedCustomers.filter((c) => ids.has(c.id));
  }, [filteredAndSortedCustomers, showLatestOnly]);

  // Group by client+branch for the default (latest-only) view
  interface CustomerGroup {
    groupKey: string;
    client_name: string;
    branch: string | null;
    is_active: boolean;
    opening_balance?: number;
    rows: Customer[];
  }

  const groupedDisplayedCustomers = useMemo((): CustomerGroup[] => {
    const map = new Map<string, CustomerGroup>();
    displayedCustomers.forEach((c) => {
      const key = `${c.client_name}|||${c.branch ?? ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { groupKey: key, client_name: c.client_name, branch: c.branch, is_active: c.is_active, opening_balance: c.opening_balance, rows: [c] });
      } else {
        existing.rows.push(c);
        if (c.is_active) existing.is_active = true;
      }
    });
    return Array.from(map.values());
  }, [displayedCustomers]);

  // Handle column filter changes
  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Handle column sort changes
  const handleColumnSortChange = (columnKey: string, direction: "asc" | "desc" | null) => {
    setColumnSorts(prev => {
      const newSorts = { ...prev };
      // Reset all other columns
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setColumnFilters({
      client_name: "",
      branch: "",
      sku: "",
      pricing_date: "",
      price_per_case: "",
      price_per_bottle: ""
    });
    setColumnSorts({
      client_name: null,
      branch: null,
      sku: null,
      pricing_date: null,
      price_per_case: null,
      price_per_bottle: null
    });
  };

  // Export all transactions for a specific client as a ledger
  const exportClientLedger = async (customer: Customer) => {
    setExportingLedgerFor(customer.id);
    try {
      const { data, error } = await supabase
        .from('sales_transactions')
        .select('transaction_date, transaction_type, sku, quantity, amount, description, customers(client_name, branch)')
        .eq('customer_id', customer.id)
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      const rows = (data || []).map((tx) => {
        const c = tx.customers as { client_name?: string; branch?: string } | null;
        return {
          date: tx.transaction_date,
          clientName: c?.client_name || customer.client_name || 'Unknown',
          branch: c?.branch || customer.branch || '',
          type: tx.transaction_type || 'sale',
          sku: tx.sku,
          cases: tx.quantity,
          amount: tx.amount || 0,
          description: tx.description,
        };
      });

      if (rows.length === 0) {
        toast({ title: 'No transactions', description: `No transactions found for ${customer.client_name}.` });
        return;
      }

      const clientLabel = customer.branch ? `${customer.client_name} — ${customer.branch}` : customer.client_name;
      const dateStr = new Date().toISOString().split('T')[0];
      const safeName = (customer.client_name || 'client').replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportLedger(rows, `Ledger_${safeName}_${dateStr}.xlsx`, `Client Ledger — ${clientLabel}`);
    } catch (err) {
      toast({ title: 'Export failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setExportingLedgerFor(null);
    }
  };

  // Export filtered data to Excel
  const exportCustomersToExcel = async () => {
    const exportData = displayedCustomers.map((customer) => ({
      'Client name': customer.client_name || '',
      'Branch': customer.branch || '',
      'SKU': customer.sku || '',
      'Pricing Date': customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '',
      'Price per Case': customer.price_per_case ? `₹${customer.price_per_case}` : '',
      'Price per Bottle': customer.price_per_bottle ? `₹${customer.price_per_bottle}` : ''
    })) || [];

    await exportJsonToExcel(exportData, 'Customers', `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportMrpToCsv = () => {
    if (!customers) return;

    const latestByKey = new Map<string, typeof customers[0]>();
    customers
      .filter((c) => c.is_active && !!c.sku?.trim())
      .forEach((c) => {
        const key = `${c.client_name}|||${c.branch ?? ''}|||${c.sku ?? ''}`;
        const existing = latestByKey.get(key);
        if (!existing) {
          latestByKey.set(key, c);
        } else {
          const dNew = new Date((c as { pricing_date?: string | null }).pricing_date || 0).getTime();
          const dOld = new Date((existing as { pricing_date?: string | null }).pricing_date || 0).getTime();
          if (dNew >= dOld) latestByKey.set(key, c);
        }
      });

    const rows = Array.from(latestByKey.values()).sort((a, b) => {
      const n = (a.client_name || '').localeCompare(b.client_name || '');
      if (n !== 0) return n;
      const b2 = (a.branch || '').localeCompare(b.branch || '');
      if (b2 !== 0) return b2;
      return (a.sku || '').localeCompare(b.sku || '');
    });

    const headers = ['Client', 'Branch', 'SKU', 'MRP per Bottle (₹)', 'Pricing Date'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csvLines = [
      headers.join(','),
      ...rows.map((r) => [
        escape(r.client_name || ''),
        escape(r.branch || ''),
        escape(r.sku || ''),
        (r as { mrp_per_bottle?: number | null }).mrp_per_bottle != null
          ? String((r as { mrp_per_bottle?: number | null }).mrp_per_bottle)
          : '',
        (r as { pricing_date?: string | null }).pricing_date
          ? new Date((r as { pricing_date?: string | null }).pricing_date!).toLocaleDateString('en-IN')
          : '',
      ].join(',')),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRP_List_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeactivate = (args: { clientName: string; branch: string | null }) => {
    deactivateCustomerMutation.mutate(args);
  };

  const handleReactivate = (args: { clientName: string; branch: string | null }) => {
    reactivateCustomerMutation.mutate(args);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Client management</h2>
        <Button onClick={() => setDealerDialogState({ open: true })}>
          Add client
        </Button>
      </div>

      <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client list</CardTitle>
                  <CardDescription>
                    Registered clients and branches with pricing
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {showLatestOnly
                      ? `${groupedDisplayedCustomers.length} clients`
                      : `${displayedCustomers.length} of ${customers?.length || 0} rows`}
                    {showLatestOnly && filteredAndSortedCustomers.length !== displayedCustomers.length && (
                      <span className="ml-1 text-xs text-muted-foreground/70">
                        ({filteredAndSortedCustomers.length - displayedCustomers.length} older hidden)
                      </span>
                    )}
                  </span>
                  <Button
                    onClick={exportCustomersToExcel}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button
                    onClick={exportMrpToCsv}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export MRP
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search customers by name, branch, SKU, pricing date, or amount..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      id="latest-only"
                      checked={showLatestOnly}
                      onCheckedChange={setShowLatestOnly}
                    />
                    <Label htmlFor="latest-only" className="text-sm cursor-pointer whitespace-nowrap">
                      Latest prices only
                    </Label>
                  </div>
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Client name
                        <ColumnFilter
                          columnKey="client_name"
                          columnName="Client name"
                          filterValue={columnFilters.client_name}
                          onFilterChange={(value) => handleColumnFilterChange('client_name', value)}
                          onSortChange={(direction) => handleColumnSortChange('client_name', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Branch
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={columnFilters.branch}
                          onFilterChange={(value) => handleColumnFilterChange('branch', value)}
                          onSortChange={(direction) => handleColumnSortChange('branch', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          SKU
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={columnFilters.sku}
                          onFilterChange={(value) => handleColumnFilterChange('sku', value)}
                          onSortChange={(direction) => handleColumnSortChange('sku', direction)}
                          dataType="text"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Pricing Date
                        <ColumnFilter
                          columnKey="pricing_date"
                          columnName="Pricing Date"
                          filterValue={columnFilters.pricing_date}
                          onFilterChange={(value) => handleColumnFilterChange('pricing_date', value)}
                          onSortChange={(direction) => handleColumnSortChange('pricing_date', direction)}
                          dataType="date"
                        />
                      </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          Price per Case
                        <ColumnFilter
                          columnKey="price_per_case"
                          columnName="Price per Case"
                          filterValue={columnFilters.price_per_case}
                          onFilterChange={(value) => handleColumnFilterChange('price_per_case', value)}
                          onSortChange={(direction) => handleColumnSortChange('price_per_case', direction)}
                          dataType="number"
                        />
                      </div>
                      </TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          Price per Bottle
                        <ColumnFilter
                          columnKey="price_per_bottle"
                          columnName="Price per Bottle"
                          filterValue={columnFilters.price_per_bottle}
                          onFilterChange={(value) => handleColumnFilterChange('price_per_bottle', value)}
                          onSortChange={(direction) => handleColumnSortChange('price_per_bottle', direction)}
                          dataType="number"
                        />
                      </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showLatestOnly ? (
                      // Grouped view — one row per client+branch
                      groupedDisplayedCustomers.length > 0 ? (
                        groupedDisplayedCustomers.map((group) => {
                          const firstRow = group.rows[0];
                          return (
                            <TableRow key={group.groupKey}>
                              <TableCell className="font-medium">{group.client_name}</TableCell>
                              <TableCell>{group.branch}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {group.rows.map(r => (
                                    <Badge key={r.id} variant="outline" className="text-xs font-normal w-fit">{r.sku || '—'}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1.5">
                                  {group.rows.map(r => (
                                    <div key={r.id} className="text-sm leading-5">
                                      {r.pricing_date ? new Date(r.pricing_date).toLocaleDateString() : '-'}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col gap-1.5 items-end">
                                  {group.rows.map(r => (
                                    <div key={r.id} className="text-sm leading-5">
                                      {r.price_per_case ? `₹${r.price_per_case}` : '-'}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col gap-1.5 items-end">
                                  {group.rows.map(r => (
                                    <div key={r.id} className="text-sm leading-5">
                                      {r.price_per_bottle ? `₹${r.price_per_bottle}` : '-'}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={group.is_active ? "default" : "secondary"}>
                                  {group.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setDealerDialogState({ open: true, initialClientName: group.client_name, initialBranch: group.branch ?? undefined })}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setContactsTarget({ clientName: group.client_name, branch: group.branch ?? '' })}>
                                      <Users className="mr-2 h-4 w-4" />
                                      Manage contacts
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => exportClientLedger(firstRow)}
                                      disabled={exportingLedgerFor === firstRow?.id}
                                    >
                                      <BookOpen className="mr-2 h-4 w-4" />
                                      {exportingLedgerFor === firstRow?.id ? 'Exporting…' : 'Export Ledger'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setOpeningBalanceInput((group.opening_balance ?? 0).toString());
                                        setOpeningBalanceTarget({ clientName: group.client_name, branch: group.branch ?? '', current: group.opening_balance ?? 0 });
                                      }}
                                    >
                                      <ArrowUpDown className="mr-2 h-4 w-4" />
                                      Set Opening Balance
                                    </DropdownMenuItem>
                                    {group.is_active ? (
                                      <DropdownMenuItem onClick={() => handleDeactivate({ clientName: group.client_name, branch: group.branch })} className="text-orange-600">
                                        <UserX className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem onClick={() => handleReactivate({ clientName: group.client_name, branch: group.branch })} className="text-green-600">
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Reactivate
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow key="no-customers">
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchTerm || Object.values(columnFilters).some(f => f !== '') ? "No customers found matching your filters" : "No customers found"}
                          </TableCell>
                        </TableRow>
                      )
                    ) : (
                      // Individual rows view (history mode — showLatestOnly off)
                      displayedCustomers.length > 0 ? (
                        displayedCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.client_name}</TableCell>
                            <TableCell>{customer.branch}</TableCell>
                            <TableCell>{customer.sku || '-'}</TableCell>
                            <TableCell>{customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-right">{customer.price_per_case ? `₹${customer.price_per_case}` : '-'}</TableCell>
                            <TableCell className="text-right">{customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={customer.is_active ? "default" : "secondary"}>
                                {customer.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDealerDialogState({ open: true, initialClientName: customer.client_name, initialBranch: customer.branch ?? undefined })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setContactsTarget({ clientName: customer.client_name, branch: customer.branch ?? '' })}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage contacts
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => exportClientLedger(customer)} disabled={exportingLedgerFor === customer.id}>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    {exportingLedgerFor === customer.id ? 'Exporting…' : 'Export Ledger'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setOpeningBalanceInput((customer.opening_balance ?? 0).toString());
                                      setOpeningBalanceTarget({ clientName: customer.client_name, branch: customer.branch ?? '', current: customer.opening_balance ?? 0 });
                                    }}
                                  >
                                    <ArrowUpDown className="mr-2 h-4 w-4" />
                                    Set Opening Balance
                                  </DropdownMenuItem>
                                  {customer.is_active ? (
                                    <DropdownMenuItem onClick={() => handleDeactivate({ clientName: customer.client_name, branch: customer.branch })} className="text-orange-600">
                                      <UserX className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handleReactivate({ clientName: customer.client_name, branch: customer.branch })} className="text-green-600">
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-red-700 font-medium" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete pricing row
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete pricing row?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This permanently removes the pricing row for <strong>{customer.client_name} – {customer.branch} – {customer.sku}</strong> dated {customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '—'}. This only affects pricing configuration — no sales transactions will be changed.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deletePricingRowMutation.mutate(customer.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow key="no-customers">
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchTerm || Object.values(columnFilters).some(filter => filter !== '') ? "No customers found matching your filters" : "No customers found"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
      {/* Add / Edit client dialog */}
      <AddDealerDialog
        open={dealerDialogState.open}
        onOpenChange={(v) => { if (!v) setDealerDialogState({ open: false }); }}
        initialClientName={dealerDialogState.initialClientName}
        initialBranch={dealerDialogState.initialBranch}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["customers-management"] });
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }}
      />

      {contactsTarget && (
        <ClientContactsDialog
          open={!!contactsTarget}
          onOpenChange={(v) => { if (!v) setContactsTarget(null); }}
          clientName={contactsTarget.clientName}
          branch={contactsTarget.branch}
        />
      )}

      {/* Opening Balance dialog */}
      <Dialog
        open={!!openingBalanceTarget}
        onOpenChange={(v) => { if (!v) setOpeningBalanceTarget(null); }}
      >
        <DialogContent className="max-w-sm" aria-describedby="ob-desc">
          <DialogHeader>
            <DialogTitle>Set Opening Balance</DialogTitle>
            <DialogDescription id="ob-desc">
              {openingBalanceTarget && (
                <>
                  Historical balance for <strong>{openingBalanceTarget.clientName}</strong> ({openingBalanceTarget.branch}) before the first transaction in this portal.
                  This updates all outstanding totals immediately.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ob-amount">Opening Balance (₹ DR)</Label>
              <Input
                id="ob-amount"
                type="number"
                step="0.01"
                min={0}
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(e.target.value)}
                placeholder="e.g. 57200"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Enter the amount the client owed before any portal transactions. Leave 0 if starting fresh.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpeningBalanceTarget(null)}>Cancel</Button>
            <Button
              disabled={setOpeningBalanceMutation.isPending}
              onClick={() => {
                if (!openingBalanceTarget) return;
                const amount = parseFloat(openingBalanceInput) || 0;
                setOpeningBalanceMutation.mutate({
                  clientName: openingBalanceTarget.clientName,
                  branch: openingBalanceTarget.branch,
                  amount,
                });
              }}
            >
              {setOpeningBalanceMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default memo(ConfigurationManagement);
