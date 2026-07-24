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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserX, UserCheck, Download, ArrowUpDown, MoreHorizontal, BookOpen, Users, ArchiveX, ArchiveRestore } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ColumnFilter } from "@/components/ui/column-filter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { exportLedger } from '@/lib/ledgerExport';
import { logger } from '@/lib/logger';

const ConfigurationManagement = () => {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isAddDealerOpen, setIsAddDealerOpen] = useState(false);
  const [exportingLedgerFor, setExportingLedgerFor] = useState<string | null>(null);
  const [contactsTarget, setContactsTarget] = useState<{ clientName: string; branch: string } | null>(null);
  
  // Additional state for advanced customer management
  const [editForm, setEditForm] = useState({
    client_name: "",
    branch: "",
    sku: "",
    price_per_case: "",
    price_per_bottle: "",
    mrp_per_bottle: "",
    whatsapp_number: "",
    pricing_date: "",
  });

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

  // Radix Dialog sets pointer-events:none on body while open; restore it if cleanup is missed
  useEffect(() => {
    if (!isEditCustomerOpen) {
      const t = setTimeout(() => {
        document.body.style.removeProperty('pointer-events');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isEditCustomerOpen]);

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
          .select("id, client_name, branch, sku, price_per_case, price_per_bottle, mrp_per_bottle, whatsapp_number, gst_number, pricing_date, is_active, is_deprecated, created_at, updated_at")
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

  // Get available SKUs from Application Configurations (sku_configurations) for Edit Customer dropdown
  const { data: availableSKUs = [], isLoading: availableSKUsLoading } = useQuery({
    queryKey: ["sku-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sku_configurations")
        .select("sku, bottles_per_case")
        .order("sku", { ascending: true });
      if (error) throw new Error(handleSupabaseError(error));
      const seen = new Set<string>();
      return (data || [])
        .filter((r) => r.sku && !seen.has((r.sku as string).toLowerCase()) && (seen.add((r.sku as string).toLowerCase()), true))
        .map((r) => ({ sku: (r.sku as string).trim(), bottles_per_case: Number(r.bottles_per_case) || 0 }))
        .sort((a, b) => a.sku.localeCompare(b.sku));
    },
    retry: 2,
  });

  // Update customer mutation (edit form)
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string } & typeof editForm) => {
      // Check if the 4-column unique key would conflict with another row
      if (data.client_name && data.branch && data.sku && data.pricing_date) {
        const { data: existingCustomers, error: checkError } = await supabase
          .from("customers")
          .select("id")
          .eq("client_name", data.client_name)
          .eq("branch", data.branch)
          .eq("sku", data.sku)
          .eq("pricing_date", data.pricing_date)
          .neq("id", data.id)
          .limit(1);

        if (checkError) {
          logger.error('Error checking for duplicates:', checkError);
        } else if (existingCustomers && existingCustomers.length > 0) {
          throw new Error(`A pricing row for "${data.client_name}" / "${data.branch}" / "${data.sku}" on ${data.pricing_date} already exists.`);
        }
      }

      const updateData: Partial<{
        client_name: string;
        branch: string;
        sku: string | null;
        price_per_bottle: number | null;
        mrp_per_bottle: number | null;
        whatsapp_number: string | null;
        pricing_date: string | null;
      }> = {};
      
      // Only include fields that are provided
      if (data.client_name) updateData.client_name = data.client_name;
      if (data.branch !== undefined) updateData.branch = data.branch;
      if (data.sku !== undefined) updateData.sku = data.sku;
      // price_per_case is a generated column — never include it in UPDATE
      if (data.price_per_bottle !== undefined) {
        updateData.price_per_bottle = data.price_per_bottle ? parseFloat(data.price_per_bottle) : null;
      }
      if (data.whatsapp_number !== undefined) {
        updateData.whatsapp_number = data.whatsapp_number || null;
      }
      if (data.mrp_per_bottle !== undefined) {
        (updateData as Record<string, unknown>).mrp_per_bottle = data.mrp_per_bottle ? parseFloat(data.mrp_per_bottle) : null;
      }
      if (data.pricing_date) updateData.pricing_date = data.pricing_date;

      const { data: updatedData, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", data.id)
        .select();

      if (error) {
        logger.error('Update error:', error);

        // Handle 409 conflict (unique constraint violation)
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error(`A customer with client name "${data.client_name}" and branch "${data.branch}" already exists. Please use different values.`);
        }

        throw error;
      }

    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables.id, description: `Client configuration updated: ${variables.client_name} — ${variables.branch}`, newValues: { client_name: variables.client_name, branch: variables.branch, sku: variables.sku, price_per_case: variables.price_per_case } });
      toast({ title: "Success", description: "Customer updated successfully!" });
      setIsEditCustomerOpen(false);
      setEditingCustomer(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update customer: " + (error as { message?: string }).message,
        variant: "destructive"
      });
    },
  });

  // Deactivate customer mutation
  const deactivateCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables, description: `Client deactivated (ID: ${variables})` });
      toast({ title: "Success", description: "Customer deactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  // Delete functionality removed - using soft delete (deactivate) only

  // Reactivate customer mutation
  const reactivateCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables, description: `Client reactivated (ID: ${variables})` });
      toast({ title: "Success", description: "Customer reactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to reactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  const softDeleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer deactivated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to deactivate customer: " + error.message,
        variant: "destructive"
      });
    },
  });

  const setDeprecatedMutation = useMutation({
    mutationFn: async ({ id, deprecated }: { id: string; deprecated: boolean }) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_deprecated: deprecated })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'client_configuration', entityId: variables.id, description: `Client ${variables.deprecated ? 'marked as deprecated' : 'restored from deprecated'} (ID: ${variables.id})` });
      toast({ title: "Success", description: variables.deprecated ? "Client marked as deprecated and hidden from order forms." : "Client restored — now visible in order forms." });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-management"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update deprecated status: " + error.message, variant: "destructive" });
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

    // Latest row per (client_name, branch, sku), excluding deprecated
    const latestByKey = new Map<string, typeof customers[0]>();
    customers
      .filter((c) => !c.is_deprecated && c.is_active && !!c.sku?.trim())
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

  // Handler functions for advanced customer management
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      client_name: customer.client_name || "",
      branch: customer.branch || "",
      sku: customer.sku || "",
      price_per_case: customer.price_per_case?.toString() || "",
      price_per_bottle: customer.price_per_bottle?.toString() || "",
      mrp_per_bottle: (customer as { mrp_per_bottle?: number | null }).mrp_per_bottle?.toString() || "",
      whatsapp_number: customer.whatsapp_number || "",
      pricing_date: customer.pricing_date || new Date().toISOString().split('T')[0],
    });
    setIsEditCustomerOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      ...editForm,
    });
  };

  const handleDeactivate = (id: string) => {
    deactivateCustomerMutation.mutate(id);
  };

  // Delete functionality removed - using soft delete (deactivate) only

  const handleReactivate = (id: string) => {
    reactivateCustomerMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Client management</h2>
        <Button onClick={() => setIsAddDealerOpen(true)}>
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
                    {displayedCustomers.length} of {customers?.length || 0} rows
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
                    {displayedCustomers.length > 0 ? (
                      displayedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.client_name}</TableCell>
                        <TableCell>{customer.branch}</TableCell>
                        <TableCell>{customer.sku || '-'}</TableCell>
                        <TableCell>{customer.pricing_date ? new Date(customer.pricing_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">
                          {customer.price_per_case ? `₹${customer.price_per_case}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.price_per_bottle ? `₹${customer.price_per_bottle}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={customer.is_active ? "default" : "secondary"}>
                              {customer.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {customer.is_deprecated && (
                              <Badge variant="destructive" className="text-xs">Deprecated</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setContactsTarget({
                                  clientName: customer.client_name,
                                  branch: customer.branch,
                                })
                              }
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Manage contacts
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => exportClientLedger(customer)}
                              disabled={exportingLedgerFor === customer.id}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              {exportingLedgerFor === customer.id ? 'Exporting…' : 'Export Ledger'}
                            </DropdownMenuItem>
                            {customer.is_active ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(customer.id)}
                                className="text-orange-600"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(customer.id)}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {customer.is_deprecated ? (
                              <DropdownMenuItem
                                onClick={() => setDeprecatedMutation.mutate({ id: customer.id, deprecated: false })}
                                className="text-blue-600"
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Restore (remove deprecated)
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setDeprecatedMutation.mutate({ id: customer.id, deprecated: true })}
                                className="text-red-600"
                              >
                                <ArchiveX className="mr-2 h-4 w-4" />
                                Mark as Deprecated
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  ) : (
                    <TableRow key="no-customers">
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || Object.values(columnFilters).some(filter => filter !== '')
                          ? "No customers found matching your filters"
                          : "No customers found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
      {/* Add client dialog */}
      <AddDealerDialog
        open={isAddDealerOpen}
        onOpenChange={setIsAddDealerOpen}
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

      {/* Edit client dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="edit-client-desc" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription id="edit-client-desc">Update client details and pricing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-client-name">Client name *</Label>
                <Input
                  id="edit-client-name"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm({...editForm, client_name: e.target.value})}
                  placeholder="Customer company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-pricing-date">Pricing date</Label>
                <Input
                  id="edit-pricing-date"
                  type="date"
                  value={editForm.pricing_date}
                  onChange={(e) => setEditForm({...editForm, pricing_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-area">Branch</Label>
                <Input
                  id="edit-area"
                  value={editForm.branch}
                  onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                  placeholder="Branch or location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Select
                  value={editForm.sku || "__none__"}
                  onValueChange={(v) => {
                    const sku = v === "__none__" ? "" : v;
                    const opt = availableSKUs.find((o) => o.sku === sku);
                    const ppb = parseFloat(editForm.price_per_bottle);
                    const ppc = opt && !isNaN(ppb) ? (ppb * opt.bottles_per_case).toFixed(4) : editForm.price_per_case;
                    setEditForm({ ...editForm, sku, price_per_case: ppc });
                  }}
                  disabled={availableSKUsLoading}
                >
                  <SelectTrigger id="edit-sku">
                    <SelectValue placeholder="Select SKU" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select SKU</SelectItem>
                    {availableSKUs.map((o) => (
                      <SelectItem key={o.sku} value={o.sku}>{o.sku}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price-per-bottle">Price per Bottle (₹)</Label>
                <Input
                  id="edit-price-per-bottle"
                  type="number"
                  step="0.01"
                  value={editForm.price_per_bottle}
                  onChange={(e) => {
                    const ppb = parseFloat(e.target.value);
                    const opt = availableSKUs.find((o) => o.sku === editForm.sku);
                    const ppc = opt && !isNaN(ppb) ? (ppb * opt.bottles_per_case).toFixed(4) : editForm.price_per_case;
                    setEditForm({ ...editForm, price_per_bottle: e.target.value, price_per_case: ppc });
                  }}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price-per-case">Price per Case (₹)</Label>
                <Input
                  id="edit-price-per-case"
                  type="number"
                  step="0.01"
                  value={editForm.price_per_case}
                  readOnly
                  className="bg-muted"
                  placeholder="Auto-calculated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-whatsapp-number">WhatsApp Number</Label>
                <Input
                  id="edit-whatsapp-number"
                  type="tel"
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm({...editForm, whatsapp_number: e.target.value})}
                  placeholder="+919876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-mrp-per-bottle">MRP per Bottle (₹)</Label>
                <Input
                  id="edit-mrp-per-bottle"
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.mrp_per_bottle}
                  onChange={(e) => setEditForm({ ...editForm, mrp_per_bottle: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCustomerOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(ConfigurationManagement);
