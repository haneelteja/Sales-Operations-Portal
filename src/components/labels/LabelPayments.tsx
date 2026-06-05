import React, { useState, useMemo, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Download, Search, ArrowUpDown, X } from "lucide-react";
import { ColumnFilter } from "@/components/ui/column-filter";
import { exportJsonToExcel } from '@/services/export/excelExport';
import { PageSizeSelector } from '@/components/ui/page-size-selector';

interface LabelPayment {
  id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  vendor_id: string;
  description?: string;
}

interface LabelPaymentForm {
  payment_amount: string;
  payment_date: string;
  payment_method: string;
  vendor_id: string;
  description: string;
}

const LabelPayments = () => {
  const [form, setForm] = useState<LabelPaymentForm>({
    payment_amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    vendor_id: "",
    description: ""
  });

  const [editingPayment, setEditingPayment] = useState<LabelPayment | null>(null);
  const [editForm, setEditForm] = useState<LabelPaymentForm>({
    payment_amount: "",
    payment_date: "",
    payment_method: "",
    vendor_id: "",
    description: ""
  });

  // Pagination and month filter state for payments table
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(5);
  const [paymentsMonthFilter, setPaymentsMonthFilter] = useState('');

  // Vendor outstanding sort state
  const [vendorOutstandingSearch, setVendorOutstandingSearch] = useState("");
  const [vendorOutstandingSortField, setVendorOutstandingSortField] = useState<"vendor_name" | "total_purchased" | "total_paid" | "outstanding">("vendor_name");
  const [vendorOutstandingSortDirection, setVendorOutstandingSortDirection] = useState<"asc" | "desc">("asc");

  // Payments table search + per-column filters + sorts
  const [paymentsSearch, setPaymentsSearch] = useState("");
  const debouncedPaymentsSearch = useDebouncedValue(paymentsSearch, 300);

  const [columnFilters, setColumnFilters] = useState({
    payment_date: "",
    vendor: "",
    payment_amount: "",
    payment_method: "",
    description: "",
  });

  const [columnSorts, setColumnSorts] = useState({
    payment_date: "desc" as "asc" | "desc" | null,
    vendor: null as "asc" | "desc" | null,
    payment_amount: null as "asc" | "desc" | null,
    payment_method: null as "asc" | "desc" | null,
  });

  const today = new Date().toISOString().split('T')[0];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const log = useAuditLog();

  // Fetch label vendors from configuration
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

  // Get all label purchases for vendor outstanding calculation
  const { data: purchases } = useQuery({
    queryKey: ["label-purchases-for-outstanding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("vendor_id, total_amount, purchase_date")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["label-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_payments")
        .select("id, payment_amount, payment_date, payment_method, vendor_id, description")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LabelPaymentForm) => {
      const { error } = await supabase
        .from("label_payments")
        .insert({
          payment_amount: parseFloat(data.payment_amount),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          vendor_id: data.vendor_id,
          description: data.description || null
        });
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'CREATE', entityType: 'label_payment', description: `Label payment recorded: ₹${variables.payment_amount} via ${variables.payment_method} on ${variables.payment_date}`, newValues: { amount: variables.payment_amount, method: variables.payment_method, date: variables.payment_date } });
      toast({ title: "Success", description: "Label payment recorded!" });
      setForm({
        payment_amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "",
        vendor_id: "",
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to record payment: " + error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & LabelPaymentForm) => {
      const { error } = await supabase
        .from("label_payments")
        .update({
          payment_amount: parseFloat(data.payment_amount),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          vendor_id: data.vendor_id,
          description: data.description || null
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'UPDATE', entityType: 'label_payment', entityId: variables.id, description: `Label payment updated: ₹${variables.payment_amount} via ${variables.payment_method}`, newValues: { amount: variables.payment_amount, method: variables.payment_method, date: variables.payment_date } });
      toast({ title: "Success", description: "Label payment updated!" });
      setEditingPayment(null);
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update payment: " + error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("label_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      log({ action: 'DELETE', entityType: 'label_payment', entityId: variables, description: `Label payment deleted (ID: ${variables})` });
      toast({ title: "Success", description: "Label payment deleted!" });
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to delete payment: " + error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payment_amount || !form.payment_method || !form.vendor_id) {
      toast({ title: "Error", description: "Payment Amount, Payment Method, and Vendor are required", variant: "destructive" });
      return;
    }
    if (form.payment_date < "2024-01-01" || form.payment_date > today) {
      toast({ title: "Error", description: "Payment Date must be between 1 Jan 2024 and today", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const handleEditClick = (payment: LabelPayment) => {
    setEditingPayment(payment);
    setEditForm({
      payment_amount: payment.payment_amount.toString(),
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      vendor_id: payment.vendor_id,
      description: payment.description || ""
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.payment_date < "2024-01-01" || editForm.payment_date > today) {
      toast({ title: "Error", description: "Payment Date must be between 1 Jan 2024 and today", variant: "destructive" });
      return;
    }
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, ...editForm });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this label payment?")) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate vendor outstanding amounts
  const vendorOutstanding = React.useMemo(() => {
    if (!purchases || !payments) return [];

    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const normalizeVendorName = (name: string) => name.trim().toLowerCase();

    const vendorMap = new Map<string, { vendor_name: string; total_purchased: number; total_paid: number; outstanding: number }>();

    purchases.forEach((purchase) => {
      if (purchase.vendor_id && typeof purchase.vendor_id === 'string') {
        const vendorName = isUUID(purchase.vendor_id) ? 'GMG' : purchase.vendor_id.trim();
        const normalizedName = normalizeVendorName(vendorName);
        const totalAmount = parseFloat(purchase.total_amount) || 0;
        const existing = vendorMap.get(normalizedName);
        if (existing) {
          existing.total_purchased += totalAmount;
        } else {
          vendorMap.set(normalizedName, { vendor_name: vendorName, total_purchased: totalAmount, total_paid: 0, outstanding: 0 });
        }
      }
    });

    payments.forEach((payment) => {
      if (payment.vendor_id && typeof payment.vendor_id === 'string') {
        const vendorName = isUUID(payment.vendor_id) ? 'GMG' : payment.vendor_id.trim();
        const normalizedName = normalizeVendorName(vendorName);
        const paymentAmount = parseFloat(payment.payment_amount) || 0;
        const existing = vendorMap.get(normalizedName);
        if (existing) {
          existing.total_paid += paymentAmount;
        } else {
          vendorMap.set(normalizedName, { vendor_name: vendorName, total_purchased: 0, total_paid: paymentAmount, outstanding: 0 });
        }
      }
    });

    const outstandingData = Array.from(vendorMap.values()).map(vendor => ({
      ...vendor,
      outstanding: vendor.total_purchased - vendor.total_paid
    }));

    return outstandingData.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
  }, [purchases, payments]);

  const filteredAndSortedVendorOutstanding = React.useMemo(() => {
    const filtered = vendorOutstanding.filter((vendor) =>
      vendor.vendor_name.toLowerCase().includes(vendorOutstandingSearch.toLowerCase())
    );
    filtered.sort((a, b) => {
      const aValue = a[vendorOutstandingSortField];
      const bValue = b[vendorOutstandingSortField];
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') comparison = aValue.localeCompare(bValue);
      else if (typeof aValue === 'number' && typeof bValue === 'number') comparison = aValue - bValue;
      return vendorOutstandingSortDirection === 'asc' ? comparison : -comparison;
    });
    return filtered;
  }, [vendorOutstanding, vendorOutstandingSearch, vendorOutstandingSortField, vendorOutstandingSortDirection]);

  const availablePaymentMonths = useMemo(() => {
    const months = new Set<string>();
    (payments || []).forEach(p => {
      if (p.payment_date) months.add(p.payment_date.slice(0, 7));
    });
    return [...months].sort().reverse();
  }, [payments]);

  // Filter and sort payments with per-column filters
  const filteredAndSortedPayments = React.useMemo(() => {
    if (!payments) return [];

    const baseList = paymentsMonthFilter
      ? payments.filter(p => (p.payment_date || '').startsWith(paymentsMonthFilter))
      : payments;

    const filtered = baseList.filter((payment) => {
      // Global search
      if (debouncedPaymentsSearch) {
        const q = debouncedPaymentsSearch.toLowerCase();
        const matches =
          payment.vendor_id.toLowerCase().includes(q) ||
          payment.payment_method.toLowerCase().includes(q) ||
          (payment.description?.toLowerCase() || '').includes(q);
        if (!matches) return false;
      }

      // Per-column filters
      if (columnFilters.vendor && !payment.vendor_id.toLowerCase().includes(columnFilters.vendor.toLowerCase())) return false;
      if (columnFilters.payment_method && !payment.payment_method.toLowerCase().includes(columnFilters.payment_method.toLowerCase())) return false;
      if (columnFilters.description && !(payment.description?.toLowerCase() || '').includes(columnFilters.description.toLowerCase())) return false;
      if (columnFilters.payment_amount && payment.payment_amount.toString() !== columnFilters.payment_amount) return false;
      if (columnFilters.payment_date) {
        const dateStr = new Date(payment.payment_date).toLocaleDateString();
        if (!dateStr.includes(columnFilters.payment_date)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      for (const [column, direction] of Object.entries(columnSorts)) {
        if (!direction) continue;
        let aValue: string | number | Date;
        let bValue: string | number | Date;
        switch (column) {
          case 'payment_date': aValue = new Date(a.payment_date); bValue = new Date(b.payment_date); break;
          case 'vendor': aValue = a.vendor_id || ''; bValue = b.vendor_id || ''; break;
          case 'payment_amount': aValue = a.payment_amount || 0; bValue = b.payment_amount || 0; break;
          case 'payment_method': aValue = a.payment_method || ''; bValue = b.payment_method || ''; break;
          default: continue;
        }
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [payments, debouncedPaymentsSearch, columnFilters, columnSorts, paymentsMonthFilter]);

  const handleVendorOutstandingSort = (field: "vendor_name" | "total_purchased" | "total_paid" | "outstanding") => {
    if (vendorOutstandingSortField === field) {
      setVendorOutstandingSortDirection(vendorOutstandingSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setVendorOutstandingSortField(field);
      setVendorOutstandingSortDirection('asc');
    }
  };

  const handleColumnFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
    setPaymentsPage(1);
  }, []);

  const handleColumnSortChange = useCallback((column: string) => {
    setColumnSorts(prev => {
      const current = prev[column as keyof typeof prev];
      const next: "asc" | "desc" | null = current === "asc" ? "desc" : current === "desc" ? null : "asc";
      return Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof typeof prev] = key === column ? next : null;
        return acc;
      }, {} as typeof prev);
    });
  }, []);

  const handleSortDir = useCallback((column: string, dir: "asc" | "desc" | null) => {
    setColumnSorts(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: null }), {} as typeof prev),
      [column]: dir,
    }));
  }, []);

  const clearPaymentFilters = useCallback(() => {
    setPaymentsSearch("");
    setPaymentsMonthFilter("");
    setPaymentsPage(1);
    setColumnFilters({ payment_date: "", vendor: "", payment_amount: "", payment_method: "", description: "" });
    setColumnSorts({ payment_date: "desc", vendor: null, payment_amount: null, payment_method: null });
  }, []);

  const paymentsTotalPages = Math.max(1, Math.ceil(filteredAndSortedPayments.length / paymentsPageSize));
  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * paymentsPageSize;
    return filteredAndSortedPayments.slice(start, start + paymentsPageSize);
  }, [filteredAndSortedPayments, paymentsPage, paymentsPageSize]);

  const handleExportVendorOutstanding = async () => {
    const exportData = filteredAndSortedVendorOutstanding.map(vendor => ({
      'Vendor': vendor.vendor_name,
      'Total Purchased (₹)': vendor.total_purchased,
      'Total Paid (₹)': vendor.total_paid,
      'Outstanding (₹)': vendor.outstanding
    }));
    await exportJsonToExcel(exportData, 'Vendor Outstanding', `vendor-outstanding-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPayments = async () => {
    const exportData = filteredAndSortedPayments.map(payment => ({
      'Payment Date': new Date(payment.payment_date).toLocaleDateString(),
      'Vendor': payment.vendor_id,
      'Amount (₹)': payment.payment_amount,
      'Method': payment.payment_method,
      'Description': payment.description || ''
    }));
    await exportJsonToExcel(exportData, 'Label Payments', `label-payments-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="payment-date">Payment Date *</Label>
            <Input
              id="payment-date"
              type="date"
              value={form.payment_date}
              min="2024-01-01"
              max={today}
              onChange={(e) => setForm({...form, payment_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <SearchableSelect
              options={(labelVendors || []).map((vendor) => ({ value: vendor, label: vendor }))}
              value={form.vendor_id}
              onValueChange={(value) => setForm({...form, vendor_id: value})}
              placeholder="Select a vendor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount (₹) *</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              value={form.payment_amount}
              onChange={(e) => setForm({...form, payment_amount: e.target.value})}
              placeholder="Enter payment amount"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <SearchableSelect
              options={[
                { value: "Cash", label: "Cash" },
                { value: "Bank Transfer", label: "Bank Transfer" },
                { value: "UPI", label: "UPI" },
              ]}
              value={form.payment_method}
              onValueChange={(value) => setForm({...form, payment_method: value})}
              placeholder="Select payment method"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              placeholder="Enter description (optional)"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending} className="px-8">
            {mutation.isPending ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>

      {/* Vendor Outstanding Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Vendor Outstanding</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={vendorOutstandingSearch}
                onChange={(e) => setVendorOutstandingSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={handleExportVendorOutstanding} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleVendorOutstandingSort('vendor_name')}
                >
                  <div className="flex items-center gap-2">
                    Vendor
                    {vendorOutstandingSortField === 'vendor_name' && (
                      <span className="text-xs">{vendorOutstandingSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleVendorOutstandingSort('total_purchased')}
                >
                  <div className="flex items-center gap-2">
                    Total Purchased (₹)
                    {vendorOutstandingSortField === 'total_purchased' && (
                      <span className="text-xs">{vendorOutstandingSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleVendorOutstandingSort('total_paid')}
                >
                  <div className="flex items-center gap-2">
                    Total Paid (₹)
                    {vendorOutstandingSortField === 'total_paid' && (
                      <span className="text-xs">{vendorOutstandingSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleVendorOutstandingSort('outstanding')}
                >
                  <div className="flex items-center gap-2">
                    Outstanding (₹)
                    {vendorOutstandingSortField === 'outstanding' && (
                      <span className="text-xs">{vendorOutstandingSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedVendorOutstanding.length > 0 ? (
                filteredAndSortedVendorOutstanding.map((vendor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                    <TableCell>₹{vendor.total_purchased.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</TableCell>
                    <TableCell>₹{vendor.total_paid.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</TableCell>
                    <TableCell className={`font-medium ${vendor.outstanding > 0 ? 'text-red-600' : vendor.outstanding < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      ₹{vendor.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {vendorOutstanding.length === 0 ? "No vendor data available" : "No vendors found matching your search criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Label Payments Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">Label Payments</h3>
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedPayments.length} of {payments?.length || 0} payments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={paymentsSearch}
                onChange={(e) => { setPaymentsSearch(e.target.value); setPaymentsPage(1); }}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            {availablePaymentMonths.length > 0 && (
              <select
                aria-label="Filter by month"
                value={paymentsMonthFilter}
                onChange={e => { setPaymentsMonthFilter(e.target.value); setPaymentsPage(1); }}
                className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground"
              >
                <option value="">All Months</option>
                {availablePaymentMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            )}
            <Button variant="outline" onClick={clearPaymentFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
            <Button onClick={handleExportPayments} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Payment Date */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('payment_date')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Payment Date
                    <ColumnFilter
                      columnKey="payment_date"
                      columnName="Payment Date"
                      filterValue={columnFilters.payment_date}
                      onFilterChange={(v) => handleColumnFilterChange('payment_date', v)}
                      sortDirection={columnSorts.payment_date}
                      onSortChange={(d) => handleSortDir('payment_date', d)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                {/* Vendor */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('vendor')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Vendor
                    <ColumnFilter
                      columnKey="vendor"
                      columnName="Vendor"
                      filterValue={columnFilters.vendor}
                      onFilterChange={(v) => handleColumnFilterChange('vendor', v)}
                      sortDirection={columnSorts.vendor}
                      onSortChange={(d) => handleSortDir('vendor', d)}
                      dataType="text"
                    />
                  </div>
                </TableHead>
                {/* Amount */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('payment_amount')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Amount (₹)
                    <ColumnFilter
                      columnKey="payment_amount"
                      columnName="Amount"
                      filterValue={columnFilters.payment_amount}
                      onFilterChange={(v) => handleColumnFilterChange('payment_amount', v)}
                      sortDirection={columnSorts.payment_amount}
                      onSortChange={(d) => handleSortDir('payment_amount', d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                {/* Method */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleColumnSortChange('payment_method')} className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Method
                    <ColumnFilter
                      columnKey="payment_method"
                      columnName="Method"
                      filterValue={columnFilters.payment_method}
                      onFilterChange={(v) => handleColumnFilterChange('payment_method', v)}
                      sortDirection={columnSorts.payment_method}
                      onSortChange={(d) => handleSortDir('payment_method', d)}
                      dataType="text"
                    />
                  </div>
                </TableHead>
                {/* Description */}
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Description</TableHead>
                {/* Actions */}
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPayments.length > 0 ? (
                paginatedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.vendor_id || 'N/A'}</TableCell>
                    <TableCell className="font-medium">₹{payment.payment_amount.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{payment.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(payment)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(payment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {payments && payments.length === 0
                      ? "No label payments found"
                      : "No payments found matching your search criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <PageSizeSelector
            pageSize={paymentsPageSize}
            onPageSizeChange={(s) => { setPaymentsPageSize(s); setPaymentsPage(1); }}
            totalRecords={filteredAndSortedPayments.length}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedPayments.length > 0
                ? `${((paymentsPage - 1) * paymentsPageSize) + 1}–${Math.min(paymentsPage * paymentsPageSize, filteredAndSortedPayments.length)} of ${filteredAndSortedPayments.length}`
                : '0 records'}
            </span>
            <Button variant="outline" size="sm" disabled={paymentsPage === 1} onClick={() => setPaymentsPage(p => p - 1)}>←</Button>
            <span className="text-sm font-medium px-2">{paymentsPage} / {paymentsTotalPages}</span>
            <Button variant="outline" size="sm" disabled={paymentsPage === paymentsTotalPages} onClick={() => setPaymentsPage(p => p + 1)}>→</Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Edit Label Payment</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-date">Payment Date *</Label>
                  <Input
                    id="edit-payment-date"
                    type="date"
                    value={editForm.payment_date}
                    min="2024-01-01"
                    max={today}
                    onChange={(e) => setEditForm({...editForm, payment_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-vendor">Vendor *</Label>
                  <SearchableSelect
                    options={(labelVendors || []).map((vendor) => ({ value: vendor, label: vendor }))}
                    value={editForm.vendor_id}
                    onValueChange={(value) => setEditForm({...editForm, vendor_id: value})}
                    placeholder="Select a vendor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-payment-amount">Payment Amount (₹) *</Label>
                  <Input
                    id="edit-payment-amount"
                    type="number"
                    step="0.01"
                    value={editForm.payment_amount}
                    onChange={(e) => setEditForm({...editForm, payment_amount: e.target.value})}
                    placeholder="Enter payment amount"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-payment-method">Payment Method *</Label>
                  <SearchableSelect
                    options={[
                      { value: "Cash", label: "Cash" },
                      { value: "Bank Transfer", label: "Bank Transfer" },
                      { value: "UPI", label: "UPI" },
                    ]}
                    value={editForm.payment_method}
                    onValueChange={(value) => setEditForm({...editForm, payment_method: value})}
                    placeholder="Select payment method"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Enter description (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingPayment(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelPayments;
