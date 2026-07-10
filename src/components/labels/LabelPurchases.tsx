import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LabelPurchase, LabelPurchaseForm, MutationFunction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, ArrowUpDown, Search, X, Download } from "lucide-react";
import { ColumnFilter } from "@/components/ui/column-filter";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { cn } from "@/lib/utils";
import { PageSizeSelector } from '@/components/ui/page-size-selector';

// ─── Client Autocomplete ──────────────────────────────────────────────────────
interface ComboboxOption { id: string; label: string; }

const ClientCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => options.find(o => o.id === value)?.label || '', [options, value]);

  useEffect(() => {
    setInputValue(selectedLabel);
  }, [selectedLabel]);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return options;
    const q = inputValue.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, inputValue]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.id);
    setInputValue(option.label);
    setOpen(false);
  };

  const handleBlur = () => {
    // Restore label of currently selected value if input doesn't match any option
    setTimeout(() => {
      setOpen(false);
      setInputValue(selectedLabel);
    }, 150);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={inputValue}
        disabled={disabled}
        onChange={e => { setInputValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      {open && !disabled && filtered.length > 0 && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow-md max-h-48 overflow-y-auto mt-1">
          {filtered.map(option => (
            <div
              key={option.id}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm",
                option.id === value && "bg-slate-50 font-medium"
              )}
              onMouseDown={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {open && !disabled && filtered.length === 0 && inputValue.trim() && (
        <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 px-3 py-2 text-sm text-muted-foreground">
          No clients found
        </div>
      )}
    </div>
  );
};

// ─── Vendor pricing entry type (mirrors EditVendorPricingDialog) ──────────────
interface VendorPricingEntry {
  vendor: string;
  sku: string;
  date?: string;
  price: number | '';
  gst: number | '';
}

// ─── Main component ───────────────────────────────────────────────────────────
const LabelPurchases = () => {
  const [form, setForm] = useState<LabelPurchaseForm>({
    vendor_id: "",
    client_id: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    description: "",
    record_type: "purchase",
    reason: "",
  });

  const [editingPurchase, setEditingPurchase] = useState<LabelPurchase | null>(null);
  const [editForm, setEditForm] = useState<LabelPurchaseForm>({
    vendor_id: "",
    client_id: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: "",
    description: "",
    record_type: "purchase",
    reason: "",
  });

  // Pagination and month filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [monthFilter, setMonthFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [columnFilters, setColumnFilters] = useState({
    vendor: "",
    client: "",
    sku: "",
    quantity: "",
    cost_per_label: "",
    total_amount: "",
    purchase_date: ""
  });
  const [columnSorts, setColumnSorts] = useState({
    purchase_date: "desc" as "asc" | "desc" | null,
    vendor: null as "asc" | "desc" | null,
    client: null as "asc" | "desc" | null,
    quantity: null as "asc" | "desc" | null,
    cost_per_label: null as "asc" | "desc" | null,
    total_amount: null as "asc" | "desc" | null
  });

  const today = new Date().toISOString().split('T')[0];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku")
        .eq("is_active", true)
        .eq("is_deprecated", false)
        .order("client_name", { ascending: true });
      return data || [];
    },
  });

  // All customers (no is_active/is_deprecated filter) for display lookups on historical purchases
  const { data: customersForLookup } = useQuery({
    queryKey: ["customers-all-for-labels-lookup"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, client_name")
        .order("client_name", { ascending: true })
        .limit(10000);
      return data || [];
    },
  });

  const { data: skuConfigs } = useQuery({
    queryKey: ["sku_configurations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sku_configurations")
        .select("sku")
        .order("sku", { ascending: true });
      return (data || []).map(d => d.sku).filter((s): s is string => Boolean(s));
    },
  });

  // All distinct SKUs for a given customer id (matches across all branches of the same dealer)
  const getSkusForCustomerId = useCallback((clientId: string) => {
    if (!clientId || !customers) return skuConfigs ?? [];
    const selected = customers.find(c => c.id === clientId);
    if (!selected) return [];
    const dealerName = selected.client_name.trim().toLowerCase();
    const skus = customers
      .filter(c => c.client_name.trim().toLowerCase() === dealerName && c.sku)
      .map(c => c.sku as string);
    return [...new Set(skus)].sort();
  }, [customers, skuConfigs]);

  const addFormSkus = useMemo(() => getSkusForCustomerId(form.client_id), [form.client_id, getSkusForCustomerId]);
  const editFormSkus = useMemo(() => getSkusForCustomerId(editForm.client_id), [editForm.client_id, getSkusForCustomerId]);

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

  // Full vendor pricing entries for price auto-fill
  const { data: vendorPricingEntries } = useQuery({
    queryKey: ["label-vendors-pricing-entries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_configurations")
        .select("config_value")
        .eq("config_key", "label_vendors")
        .maybeSingle();
      if (!data) return [] as VendorPricingEntry[];
      try {
        const parsed = JSON.parse(data.config_value || "[]");
        return Array.isArray(parsed) ? (parsed as VendorPricingEntry[]) : [];
      } catch { return [] as VendorPricingEntry[]; }
    },
  });

  // Lookup the most recent price ≤ purchaseDate for a given vendor+SKU combination
  const lookupPrice = useCallback((vendor: string, sku: string, purchaseDate: string): string => {
    if (!vendor || !sku || !purchaseDate || !vendorPricingEntries?.length) return '';
    const matching = vendorPricingEntries
      .filter(e => e.vendor === vendor && e.sku === sku && e.date && e.date <= purchaseDate)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!matching.length) return '';
    const entry = matching[0];
    const p = entry.price !== '' && entry.price !== undefined ? Number(entry.price) : null;
    if (p === null) return '';
    const gst = entry.gst !== '' && entry.gst !== undefined ? Number(entry.gst) : 0;
    return String((p * (1 + gst / 100)).toFixed(4));
  }, [vendorPricingEntries]);

  const { data: purchases } = useQuery({
    queryKey: ["label-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("id, vendor_id, client_id, sku, quantity, cost_per_label, total_amount, purchase_date, description, record_type, reason")
        .order("created_at", { ascending: false })
        .limit(10000);
      return (data || []) as LabelPurchase[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LabelPurchaseForm) => {
      const isAdj = data.record_type === 'adjustment';
      const insertData = {
        vendor_id: data.vendor_id || null,
        client_id: data.client_id || null,
        sku: data.sku || null,
        quantity: parseInt(data.quantity),
        cost_per_label: isAdj ? 0 : parseFloat(data.cost_per_label || '0'),
        total_amount: isAdj ? 0 : parseFloat(data.total_amount || '0'),
        purchase_date: data.purchase_date,
        record_type: data.record_type,
        reason: isAdj ? (data.reason?.trim() || null) : null,
        description: data.description?.trim() || null,
      };
      const { error } = await supabase.from("label_purchases").insert(insertData);
      if (error) {
        console.error("Database error:", JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: (_result, variables) => {
      const isAdj = variables.record_type === 'adjustment';
      log({ action: 'CREATE', entityType: 'label_purchase', description: isAdj ? `Label adjustment: ${variables.quantity} labels for ${variables.reason || 'count mismatch'} on ${variables.purchase_date}` : `Label purchase recorded: ${variables.quantity} labels @ ₹${variables.cost_per_label} on ${variables.purchase_date}`, newValues: { quantity: variables.quantity, cost_per_label: variables.cost_per_label, sku: variables.sku, date: variables.purchase_date, record_type: variables.record_type } });
      toast({ title: "Success", description: isAdj ? "Label adjustment recorded!" : "Label purchase recorded!" });
      setForm({
        vendor_id: "",
        client_id: "",
        sku: "",
        quantity: "",
        cost_per_label: "",
        total_amount: "",
        purchase_date: new Date().toISOString().split('T')[0],
        description: "",
        record_type: "purchase",
        reason: "",
      });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to record purchase: " + error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LabelPurchaseForm & { id: string }) => {
      const isAdj = data.record_type === 'adjustment';
      const updateData = {
        vendor_id: data.vendor_id || null,
        client_id: data.client_id || null,
        sku: data.sku || null,
        quantity: parseInt(data.quantity),
        cost_per_label: isAdj ? 0 : parseFloat(data.cost_per_label || '0'),
        total_amount: isAdj ? 0 : parseFloat(data.total_amount || '0'),
        purchase_date: data.purchase_date,
        record_type: data.record_type,
        reason: isAdj ? (data.reason?.trim() || null) : null,
        description: data.description?.trim() || null,
      };
      const { error } = await supabase.from("label_purchases").update(updateData).eq("id", data.id);
      if (error) {
        console.error("Database error:", error);
        throw error;
      }
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'label_purchase', entityId: variables.id, description: `Label purchase updated (ID: ${variables.id})`, newValues: { quantity: variables.quantity, cost_per_label: variables.cost_per_label, sku: variables.sku, date: variables.purchase_date } });
      toast({ title: "Success", description: "Label purchase updated!" });
      setEditingPurchase(null);
      setEditForm({ vendor_id: "", client_id: "", sku: "", quantity: "", cost_per_label: "", total_amount: "", purchase_date: "", description: "", record_type: "purchase", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update purchase: " + error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("label_purchases").delete().eq("id", id);
      if (error) { console.error("Database error:", error); throw error; }
    },
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'label_purchase', entityId: variables, description: `Label purchase deleted (ID: ${variables})` });
      toast({ title: "Success", description: "Label purchase deleted!" });
      queryClient.invalidateQueries({ queryKey: ["label-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["label-purchases-summary"] });
      queryClient.invalidateQueries({ queryKey: ["customers-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sales-transactions-for-availability"] });
      queryClient.invalidateQueries({ queryKey: ["sku-configurations-for-availability"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete purchase: " + error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor_id || !form.client_id || !form.quantity || !form.cost_per_label) {
      toast({ title: "Error", description: "Vendor, Client, Quantity, and Cost per Label are required", variant: "destructive" });
      return;
    }
    if (form.purchase_date < "2024-01-01" || form.purchase_date > today) {
      toast({ title: "Error", description: "Date must be between 1 Jan 2024 and today", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  // Auto-calculate total
  const handleQuantityOrCostChange = (field: string, value: string) => {
    const newForm = { ...form, [field]: value };
    if (newForm.quantity && newForm.cost_per_label) {
      newForm.total_amount = (parseFloat(newForm.quantity) * parseFloat(newForm.cost_per_label)).toString();
    }
    setForm(newForm);
  };

  // Vendor change in add form: auto-fill price from config
  const handleVendorChange = (vendor: string) => {
    const cost = lookupPrice(vendor, form.sku, form.purchase_date);
    const total = cost && form.quantity
      ? (parseFloat(cost) * parseFloat(form.quantity)).toFixed(4)
      : form.total_amount;
    setForm(prev => ({ ...prev, vendor_id: vendor, cost_per_label: cost, total_amount: cost ? total : prev.total_amount }));
  };

  // SKU change in add form: auto-fill price from config
  const handleSkuChange = (sku: string) => {
    const cost = lookupPrice(form.vendor_id, sku, form.purchase_date);
    const total = cost && form.quantity
      ? (parseFloat(cost) * parseFloat(form.quantity)).toFixed(4)
      : form.total_amount;
    setForm(prev => ({ ...prev, sku, cost_per_label: cost, total_amount: cost ? total : prev.total_amount }));
  };

  // Purchase date change in add form: re-lookup price if vendor+SKU set
  const handleDateChange = (date: string) => {
    const cost = form.vendor_id && form.sku ? lookupPrice(form.vendor_id, form.sku, date) : form.cost_per_label;
    const total = cost && form.quantity
      ? (parseFloat(cost) * parseFloat(form.quantity)).toFixed(4)
      : form.total_amount;
    setForm(prev => ({ ...prev, purchase_date: date, cost_per_label: cost || prev.cost_per_label, total_amount: cost ? total : prev.total_amount }));
  };

  // Edit form handlers
  const handleEditQuantityOrCostChange = (field: string, value: string) => {
    const newForm = { ...editForm, [field]: value };
    if (newForm.quantity && newForm.cost_per_label) {
      newForm.total_amount = (parseFloat(newForm.quantity) * parseFloat(newForm.cost_per_label)).toString();
    }
    setEditForm(newForm);
  };

  const handleEditVendorChange = (vendor: string) => {
    const cost = lookupPrice(vendor, editForm.sku, editForm.purchase_date);
    const total = cost && editForm.quantity
      ? (parseFloat(cost) * parseFloat(editForm.quantity)).toFixed(4)
      : editForm.total_amount;
    setEditForm(prev => ({ ...prev, vendor_id: vendor, cost_per_label: cost || prev.cost_per_label, total_amount: cost ? total : prev.total_amount }));
  };

  const handleEditSkuChange = (sku: string) => {
    const cost = lookupPrice(editForm.vendor_id, sku, editForm.purchase_date);
    const total = cost && editForm.quantity
      ? (parseFloat(cost) * parseFloat(editForm.quantity)).toFixed(4)
      : editForm.total_amount;
    setEditForm(prev => ({ ...prev, sku, cost_per_label: cost || prev.cost_per_label, total_amount: cost ? total : prev.total_amount }));
  };

  const handleEditClick = (purchase: LabelPurchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      vendor_id: purchase.vendor_id || "",
      client_id: purchase.client_id || "",
      sku: purchase.sku || "",
      quantity: purchase.quantity.toString(),
      cost_per_label: purchase.cost_per_label.toString(),
      total_amount: purchase.total_amount.toString(),
      purchase_date: purchase.purchase_date,
      description: purchase.description || "",
      record_type: (purchase.record_type as 'purchase' | 'adjustment') || "purchase",
      reason: purchase.reason || "",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.record_type === 'adjustment') {
      if (!editForm.client_id || !editForm.quantity) {
        toast({ title: "Error", description: "Client and Quantity are required for adjustments", variant: "destructive" });
        return;
      }
    } else {
      if (!editForm.vendor_id || !editForm.client_id || !editForm.quantity || !editForm.cost_per_label) {
        toast({ title: "Error", description: "Vendor, Client, Quantity, and Cost per Label are required", variant: "destructive" });
        return;
      }
    }
    if (editForm.purchase_date < "2024-01-01" || editForm.purchase_date > today) {
      toast({ title: "Error", description: "Date must be between 1 Jan 2024 and today", variant: "destructive" });
      return;
    }
    if (editingPurchase) {
      updateMutation.mutate({ ...editForm, id: editingPurchase.id });
    }
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  // Unique customers list for combobox
  const uniqueCustomerOptions = useMemo((): ComboboxOption[] => {
    if (!customers) return [];
    const seen = new Set<string>();
    const result: ComboboxOption[] = [];
    [...customers]
      .sort((a, b) => a.client_name.localeCompare(b.client_name))
      .forEach(c => {
        if (c.client_name?.trim()) {
          const key = c.client_name.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            result.push({ id: c.id, label: c.client_name.trim() });
          }
        }
      });
    return result;
  }, [customers]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    (purchases || []).forEach(p => {
      if (p.purchase_date) months.add(p.purchase_date.slice(0, 7));
    });
    return [...months].sort().reverse();
  }, [purchases]);

  const availableClients = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; label: string }[] = [];
    (purchases || []).forEach(p => {
      if (p.client_id && !seen.has(p.client_id)) {
        seen.add(p.client_id);
        const customer = customersForLookup?.find(c => c.id === p.client_id);
        if (customer?.client_name) result.push({ id: p.client_id, label: customer.client_name });
      }
    });
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [purchases, customersForLookup]);

  // Filter and sort purchases
  const filteredAndSortedPurchases = useMemo(() => {
    if (!purchases) return [];

    const byMonth = monthFilter
      ? purchases.filter(p => (p.purchase_date || '').startsWith(monthFilter))
      : purchases;

    const baseList = clientFilter
      ? byMonth.filter(p => p.client_id === clientFilter)
      : byMonth;

    const filtered = baseList.filter((purchase) => {
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const vendorName = purchase.vendor_id?.toLowerCase() || '';
        const customer = customersForLookup?.find(c => c.id === purchase.client_id);
        const clientName = customer?.client_name?.toLowerCase() || '';
        const skuName = purchase.sku?.toLowerCase() || '';
        const description = purchase.description?.toLowerCase() || '';
        if (!vendorName.includes(searchLower) && !clientName.includes(searchLower) && !skuName.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }

      if (columnFilters.vendor) {
        if (!(purchase.vendor_id?.toLowerCase() || '').includes(columnFilters.vendor.toLowerCase())) return false;
      }
      if (columnFilters.client) {
        const customer = customersForLookup?.find(c => c.id === purchase.client_id);
        if (!(customer?.client_name?.toLowerCase() || '').includes(columnFilters.client.toLowerCase())) return false;
      }
      if (columnFilters.sku && !(purchase.sku?.toLowerCase() || '').includes(columnFilters.sku.toLowerCase())) return false;
      if (columnFilters.quantity && purchase.quantity.toString() !== columnFilters.quantity) return false;
      if (columnFilters.cost_per_label && purchase.cost_per_label.toString() !== columnFilters.cost_per_label) return false;
      if (columnFilters.total_amount && purchase.total_amount.toString() !== columnFilters.total_amount) return false;
      if (columnFilters.purchase_date) {
        const purchaseDate = new Date(purchase.purchase_date).toLocaleDateString();
        if (!purchaseDate.includes(columnFilters.purchase_date)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      for (const [column, direction] of Object.entries(columnSorts)) {
        if (!direction) continue;
        let aValue: string | number | Date;
        let bValue: string | number | Date;
        switch (column) {
          case 'purchase_date': aValue = new Date(a.purchase_date); bValue = new Date(b.purchase_date); break;
          case 'vendor': aValue = a.vendor_id || ''; bValue = b.vendor_id || ''; break;
          case 'client': {
            const ca = customersForLookup?.find(c => c.id === a.client_id);
            const cb = customersForLookup?.find(c => c.id === b.client_id);
            aValue = ca?.client_name || ''; bValue = cb?.client_name || ''; break;
          }
          case 'quantity': aValue = a.quantity || 0; bValue = b.quantity || 0; break;
          case 'cost_per_label': aValue = a.cost_per_label || 0; bValue = b.cost_per_label || 0; break;
          case 'total_amount': aValue = a.total_amount || 0; bValue = b.total_amount || 0; break;
          default: continue;
        }
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [purchases, debouncedSearchTerm, columnFilters, columnSorts, customersForLookup, monthFilter, clientFilter]);

  const totalPurchases = useMemo(
    () => filteredAndSortedPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0),
    [filteredAndSortedPurchases]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPurchases.slice(start, start + pageSize);
  }, [filteredAndSortedPurchases, currentPage, pageSize]);

  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  }, []);

  const handleColumnSortChange = useCallback((column: string) => {
    setColumnSorts(prev => {
      const current = prev[column as keyof typeof prev];
      const next: "asc" | "desc" | null = current === "asc" ? "desc" : current === "desc" ? null : "asc";
      const reset = Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof typeof prev] = key === column ? next : null;
        return acc;
      }, {} as typeof prev);
      return reset;
    });
  }, []);

  const handleSortDir = useCallback((column: string, dir: "asc" | "desc" | null) => {
    setColumnSorts(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: null }), {} as typeof prev),
      [column]: dir,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setMonthFilter("");
    setClientFilter("");
    setCurrentPage(1);
    setColumnFilters({ client: "", vendor: "", sku: "", quantity: "", cost_per_label: "", total_amount: "", purchase_date: "" });
    setColumnSorts({ purchase_date: "desc", client: null, vendor: null, quantity: null, cost_per_label: null, total_amount: null });
  }, []);

  const handleExport = useCallback(async () => {
    const exportData = filteredAndSortedPurchases.map(purchase => {
      const customer = customersForLookup?.find(c => c.id === purchase.client_id);
      return {
        'Date': new Date(purchase.purchase_date).toLocaleDateString(),
        'Type': purchase.record_type === 'adjustment' ? 'Adjustment' : 'Purchase',
        'Client': customer?.client_name || 'N/A',
        'SKU': purchase.sku || '',
        'Quantity': purchase.quantity,
        'Cost per Label': purchase.cost_per_label,
        'Total Amount': purchase.total_amount,
        'Vendor': purchase.vendor_id || 'N/A',
        'Reason': purchase.reason || '',
        'Description': purchase.description || ''
      };
    });
    await exportJsonToExcel(exportData, 'Label Purchases', `label-purchases-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredAndSortedPurchases, customersForLookup]);

  return (
    <div className="space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Date, Client, SKU, Vendor */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="purchase-date">Date *</Label>
            <Input
              id="purchase-date"
              type="date"
              value={form.purchase_date}
              min="2024-01-01"
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <ClientCombobox
              options={uniqueCustomerOptions}
              value={form.client_id}
              onChange={(id) => setForm(prev => ({ ...prev, client_id: id, sku: "" }))}
              placeholder="Search client..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <SearchableSelect
              options={addFormSkus.map((sku) => ({ value: sku, label: sku }))}
              value={form.sku}
              onValueChange={handleSkuChange}
              placeholder={form.client_id ? "Select SKU" : "Select client first"}
              disabled={!form.client_id}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor{form.record_type === 'purchase' ? ' *' : ''}</Label>
            <SearchableSelect
              options={(labelVendors || []).map((vendor) => ({ value: vendor, label: vendor }))}
              value={form.vendor_id}
              onValueChange={handleVendorChange}
              placeholder="Select vendor"
            />
          </div>
        </div>

        {/* Row 2: Quantity, Cost per Label, Total Amount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              step="0.01"
              value={form.cost_per_label}
              onChange={(e) => handleQuantityOrCostChange("cost_per_label", e.target.value)}
              placeholder="Auto-filled from config"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-amount">Total Amount (₹)</Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional details..."
            className="min-h-[4.5rem] resize-y"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="px-8">
            {mutation.isPending ? "Recording..." : "Record Purchase"}
          </Button>
        </div>
      </form>

      {/* Table section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Label Purchases</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedPurchases.length} of {purchases?.length || 0} purchases
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            {availableMonths.length > 0 && (
              <select
                aria-label="Filter by month"
                value={monthFilter}
                onChange={e => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground"
              >
                <option value="">All Months</option>
                {availableMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            )}
            {availableClients.length > 0 && (
              <select
                aria-label="Filter by client"
                value={clientFilter}
                onChange={e => { setClientFilter(e.target.value); setCurrentPage(1); }}
                className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground max-w-[180px]"
              >
                <option value="">All Clients</option>
                {availableClients.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            )}
            <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Type */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Type</TableHead>
                {/* Date */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('purchase_date')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Date
                    <ColumnFilter columnKey="purchase_date" columnName="Date" filterValue={columnFilters.purchase_date} onFilterChange={(v) => handleColumnFilterChange('purchase_date', v)} sortDirection={columnSorts.purchase_date} onSortChange={(d) => handleSortDir('purchase_date', d)} dataType="date" />
                  </div>
                </TableHead>
                {/* Client */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('client')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Client
                    <ColumnFilter columnKey="client" columnName="Client" filterValue={columnFilters.client} onFilterChange={(v) => handleColumnFilterChange('client', v)} sortDirection={columnSorts.client} onSortChange={(d) => handleSortDir('client', d)} dataType="text" />
                  </div>
                </TableHead>
                {/* SKU */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    SKU
                    <ColumnFilter columnKey="sku" columnName="SKU" filterValue={columnFilters.sku} onFilterChange={(v) => handleColumnFilterChange('sku', v)} sortDirection={null} onSortChange={() => {}} dataType="text" />
                  </div>
                </TableHead>
                {/* Quantity */}
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('quantity')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Quantity
                    <ColumnFilter columnKey="quantity" columnName="Quantity" filterValue={columnFilters.quantity} onFilterChange={(v) => handleColumnFilterChange('quantity', v)} sortDirection={columnSorts.quantity} onSortChange={(d) => handleSortDir('quantity', d)} dataType="number" />
                  </div>
                </TableHead>
                {/* Cost */}
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('cost_per_label')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Cost/Label
                    <ColumnFilter columnKey="cost_per_label" columnName="Cost per Label" filterValue={columnFilters.cost_per_label} onFilterChange={(v) => handleColumnFilterChange('cost_per_label', v)} sortDirection={columnSorts.cost_per_label} onSortChange={(d) => handleSortDir('cost_per_label', d)} dataType="number" />
                  </div>
                </TableHead>
                {/* Total */}
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('total_amount')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Total
                    <ColumnFilter columnKey="total_amount" columnName="Total Amount" filterValue={columnFilters.total_amount} onFilterChange={(v) => handleColumnFilterChange('total_amount', v)} sortDirection={columnSorts.total_amount} onSortChange={(d) => handleSortDir('total_amount', d)} dataType="number" />
                  </div>
                </TableHead>
                {/* Vendor */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('vendor')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Vendor
                    <ColumnFilter columnKey="vendor" columnName="Vendor" filterValue={columnFilters.vendor} onFilterChange={(v) => handleColumnFilterChange('vendor', v)} sortDirection={columnSorts.vendor} onSortChange={(d) => handleSortDir('vendor', d)} dataType="text" />
                  </div>
                </TableHead>
                {/* Description */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Description</TableHead>
                {/* Actions */}
                <TableHead className="text-center bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPurchases.length > 0 ? (
                paginatedPurchases.map((purchase) => (
                  <TableRow key={purchase.id} className={purchase.record_type === 'adjustment' ? 'bg-orange-50/40' : ''}>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${purchase.record_type === 'adjustment' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {purchase.record_type === 'adjustment' ? 'Adj' : 'Purchase'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                    <TableCell>{customersForLookup?.find(c => c.id === purchase.client_id)?.client_name || 'N/A'}</TableCell>
                    <TableCell>{purchase.sku || '—'}</TableCell>
                    <TableCell className={`text-right ${purchase.quantity < 0 ? 'text-orange-600' : ''}`}>{purchase.quantity?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{purchase.record_type === 'adjustment' ? '—' : `₹${purchase.cost_per_label}`}</TableCell>
                    <TableCell className="text-right font-medium">{purchase.record_type === 'adjustment' ? '—' : `₹${purchase.total_amount?.toLocaleString('en-IN', { maximumFractionDigits: 4 })}`}</TableCell>
                    <TableCell>{purchase.vendor_id || '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={purchase.reason || purchase.description || ''}>{purchase.reason || purchase.description || '—'}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(purchase)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Label Purchase</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                              {/* Type toggle */}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setEditForm(prev => ({ ...prev, record_type: 'purchase' }))} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${editForm.record_type === 'purchase' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Purchase</button>
                                <button type="button" onClick={() => setEditForm(prev => ({ ...prev, record_type: 'adjustment', cost_per_label: '0', total_amount: '0' }))} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${editForm.record_type === 'adjustment' ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Adjustment</button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Date *</Label>
                                  <Input
                                    type="date"
                                    value={editForm.purchase_date}
                                    min="2024-01-01"
                                    max={today}
                                    onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Client *</Label>
                                  <ClientCombobox
                                    options={uniqueCustomerOptions}
                                    value={editForm.client_id}
                                    onChange={(id) => setEditForm(prev => ({ ...prev, client_id: id, sku: "" }))}
                                    placeholder="Search client..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>SKU</Label>
                                  <SearchableSelect
                                    options={editFormSkus.map((sku) => ({ value: sku, label: sku }))}
                                    value={editForm.sku}
                                    onValueChange={handleEditSkuChange}
                                    placeholder={editForm.client_id ? "Select SKU" : "Select client first"}
                                    disabled={!editForm.client_id}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Vendor{editForm.record_type === 'purchase' ? ' *' : ''}</Label>
                                  <SearchableSelect
                                    options={(labelVendors || []).map((vendor) => ({ value: vendor, label: vendor }))}
                                    value={editForm.vendor_id}
                                    onValueChange={handleEditVendorChange}
                                    placeholder="Select vendor"
                                  />
                                </div>
                              </div>

                              {editForm.record_type === 'purchase' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Quantity *</Label>
                                    <Input type="number" value={editForm.quantity} onChange={(e) => handleEditQuantityOrCostChange("quantity", e.target.value)} placeholder="Number of labels" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Cost per Label (₹) *</Label>
                                    <Input type="number" step="0.01" value={editForm.cost_per_label} onChange={(e) => handleEditQuantityOrCostChange("cost_per_label", e.target.value)} placeholder="0.0000" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Total Amount (₹)</Label>
                                    <Input type="number" step="0.01" value={editForm.total_amount} onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })} placeholder="Auto-calculated" />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Quantity * (negative = deduction)</Label>
                                    <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))} placeholder="e.g. -120 or +50" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Input value={editForm.reason} onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="e.g. count mismatch" />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  placeholder="Additional details..."
                                  className="min-h-[4.5rem] resize-y"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingPurchase(null)}>Cancel</Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? "Updating..." : "Update Purchase"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the label purchase record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-red-600 hover:bg-red-700">
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
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No label purchases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <PageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            totalRecords={filteredAndSortedPurchases.length}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedPurchases.length > 0
                ? `${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, filteredAndSortedPurchases.length)} of ${filteredAndSortedPurchases.length}`
                : '0 records'}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              ←
            </Button>
            <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(LabelPurchases);
