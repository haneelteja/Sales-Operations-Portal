import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Download, Search, Filter } from "lucide-react";
import * as XLSX from 'xlsx';

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

  // State for filtering and sorting
  const [vendorOutstandingSearch, setVendorOutstandingSearch] = useState("");
  const [vendorOutstandingSortField, setVendorOutstandingSortField] = useState<"vendor_name" | "total_purchased" | "total_paid" | "outstanding">("vendor_name");
  const [vendorOutstandingSortDirection, setVendorOutstandingSortDirection] = useState<"asc" | "desc">("asc");
  
  const [paymentsSearch, setPaymentsSearch] = useState("");
  const [paymentsSortField, setPaymentsSortField] = useState<"payment_date" | "vendor_id" | "payment_amount" | "payment_method">("payment_date");
  const [paymentsSortDirection, setPaymentsSortDirection] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get unique vendors from label_purchases only (actual vendors used in purchases)
  const { data: purchaseVendors } = useQuery({
    queryKey: ["purchase-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("vendor_id")
        .not("vendor_id", "is", null);
      
      if (!data) return [];
      
      // Get unique vendor names
      const uniqueVendors = [...new Set(data.map(p => p.vendor_id).filter(Boolean))];
      return uniqueVendors.map((vendorName, index) => ({
        id: `vendor_${index}`,
        vendor_name: vendorName
      }));
    },
  });

  // Get all label purchases for vendor outstanding calculation
  const { data: purchases } = useQuery({
    queryKey: ["label-purchases-for-outstanding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_purchases")
        .select("*")
        .order("purchase_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching purchases:", error);
        return [];
      }
      
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["label-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_payments")
        .select("*")
        .order("payment_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching payments:", error);
        return [];
      }
      
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LabelPaymentForm) => {
      // Get vendor name from the selected vendor ID
      const selectedVendor = getUniqueVendors().find(v => v.id === data.vendor_id);
      const vendorName = selectedVendor?.vendor_name || data.vendor_id;
      
      const { error } = await supabase
        .from("label_payments")
        .insert({
          payment_amount: parseFloat(data.payment_amount),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          vendor_id: vendorName, // Store vendor name as text
          description: data.description || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label payment recorded!" });
      setForm({
        payment_amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "",
        vendor_id: "",
        description: ""
      });
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-vendors"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to record payment: " + error.message,
        variant: "destructive"
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string } & LabelPaymentForm) => {
      // Get vendor name from the selected vendor ID
      const selectedVendor = getUniqueVendors().find(v => v.id === data.vendor_id);
      const vendorName = selectedVendor?.vendor_name || data.vendor_id;
      
      const { error } = await supabase
        .from("label_payments")
        .update({
          payment_amount: parseFloat(data.payment_amount),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          vendor_id: vendorName, // Store vendor name as text
          description: data.description || null
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label payment updated!" });
      setEditingPayment(null);
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to update payment: " + error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("label_payments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Label payment deleted!" });
      queryClient.invalidateQueries({ queryKey: ["label-payments"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to delete payment: " + error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.payment_amount || !form.payment_method || !form.vendor_id) {
      toast({ 
        title: "Error", 
        description: "Payment Amount, Payment Method, and Vendor are required",
        variant: "destructive"
      });
      return;
    }
    
    mutation.mutate(form);
  };

  const handleEditClick = (payment: LabelPayment) => {
    setEditingPayment(payment);
    
    // Find the vendor ID that matches the vendor name
    const vendorId = getUniqueVendors().find(v => v.vendor_name === payment.vendor_id)?.id || payment.vendor_id;
    
    setEditForm({
      payment_amount: payment.payment_amount.toString(),
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      vendor_id: vendorId,
      description: payment.description || ""
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, ...editForm });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this label payment?")) {
      deleteMutation.mutate(id);
    }
  };


  // Get unique vendors (case-insensitive) from purchases only
  const getUniqueVendors = () => {
    if (!purchaseVendors || purchaseVendors.length === 0) return [];
    
    const seenVendors = new Set<string>();
    const uniqueVendors: typeof purchaseVendors = [];
    
    purchaseVendors.forEach(vendor => {
      if (vendor.vendor_name && vendor.vendor_name.trim() !== '') {
        const trimmedName = vendor.vendor_name.trim();
        const lowerCaseName = trimmedName.toLowerCase();
        
        if (!seenVendors.has(lowerCaseName)) {
          seenVendors.add(lowerCaseName);
          uniqueVendors.push(vendor);
        }
      }
    });
    
    return uniqueVendors.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
  };

  const totalPayments = payments?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;

  // Calculate vendor outstanding amounts
  const vendorOutstanding = React.useMemo(() => {
    if (!purchases || !payments) return [];

    // Helper function to check if a string is a UUID
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Helper function to normalize vendor names (case-insensitive matching)
    const normalizeVendorName = (name: string) => {
      return name.trim().toLowerCase();
    };

    // Get all unique vendors from purchases
    const vendorMap = new Map<string, { vendor_name: string; total_purchased: number; total_paid: number; outstanding: number }>();

    // Calculate total purchased per vendor
    purchases.forEach((purchase) => {
      // Handle both UUID and text vendor_ids
      if (purchase.vendor_id && typeof purchase.vendor_id === 'string') {
        let vendorName = '';
        
        if (isUUID(purchase.vendor_id)) {
          // For UUID vendor_ids, map to vendor name
          vendorName = 'GMG'; // Maps UUID to GMG vendor
        } else {
          // For text vendor_ids, use directly
          vendorName = purchase.vendor_id.trim();
        }
        
        const normalizedName = normalizeVendorName(vendorName);
        const totalAmount = parseFloat(purchase.total_amount) || 0;
        
        const existing = vendorMap.get(normalizedName);
        if (existing) {
          existing.total_purchased += totalAmount;
        } else {
          vendorMap.set(normalizedName, {
            vendor_name: vendorName,
            total_purchased: totalAmount,
            total_paid: 0,
            outstanding: 0
          });
        }
      }
    });

    // Calculate total paid per vendor
    payments.forEach((payment) => {
      // Handle both UUID and text vendor_ids
      if (payment.vendor_id && typeof payment.vendor_id === 'string') {
        let vendorName = '';
        
        if (isUUID(payment.vendor_id)) {
          // For UUID vendor_ids, use the same fallback approach
          vendorName = 'GMG'; // Maps UUID to GMG vendor
        } else {
          // For text vendor_ids, use directly
          vendorName = payment.vendor_id.trim();
        }
        
        const normalizedName = normalizeVendorName(vendorName);
        const paymentAmount = parseFloat(payment.payment_amount) || 0;
        
        const existing = vendorMap.get(normalizedName);
        if (existing) {
          existing.total_paid += paymentAmount;
        } else {
          // Vendor exists in payments but not in purchases
          vendorMap.set(normalizedName, {
            vendor_name: vendorName,
            total_purchased: 0,
            total_paid: paymentAmount,
            outstanding: 0
          });
        }
      }
    });

    // Calculate outstanding amounts
    const outstandingData = Array.from(vendorMap.values()).map(vendor => ({
      ...vendor,
      outstanding: vendor.total_purchased - vendor.total_paid
    }));

    return outstandingData.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
  }, [purchases, payments]);

  // Filter and sort vendor outstanding data
  const filteredAndSortedVendorOutstanding = React.useMemo(() => {
    const filtered = vendorOutstanding.filter((vendor) => {
      return vendor.vendor_name.toLowerCase().includes(vendorOutstandingSearch.toLowerCase());
    });

    filtered.sort((a, b) => {
      const aValue = a[vendorOutstandingSortField];
      const bValue = b[vendorOutstandingSortField];
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      
      return vendorOutstandingSortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [vendorOutstanding, vendorOutstandingSearch, vendorOutstandingSortField, vendorOutstandingSortDirection]);

  // Filter and sort payments data
  const filteredAndSortedPayments = React.useMemo(() => {
    if (!payments) return [];

    const filtered = payments.filter((payment) => {
      return (
        payment.vendor_id.toLowerCase().includes(paymentsSearch.toLowerCase()) ||
        payment.payment_method.toLowerCase().includes(paymentsSearch.toLowerCase()) ||
        payment.description?.toLowerCase().includes(paymentsSearch.toLowerCase())
      );
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (paymentsSortField) {
        case 'payment_date':
          aValue = new Date(a.payment_date).getTime();
          bValue = new Date(b.payment_date).getTime();
          break;
        case 'vendor_id':
          aValue = a.vendor_id;
          bValue = b.vendor_id;
          break;
        case 'payment_amount':
          aValue = a.payment_amount;
          bValue = b.payment_amount;
          break;
        case 'payment_method':
          aValue = a.payment_method;
          bValue = b.payment_method;
          break;
        default:
          aValue = a.payment_date;
          bValue = b.payment_date;
      }
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }
      
      return paymentsSortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [payments, paymentsSearch, paymentsSortField, paymentsSortDirection]);

  // Handle sort functions
  const handleVendorOutstandingSort = (field: "vendor_name" | "total_purchased" | "total_paid" | "outstanding") => {
    if (vendorOutstandingSortField === field) {
      setVendorOutstandingSortDirection(vendorOutstandingSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setVendorOutstandingSortField(field);
      setVendorOutstandingSortDirection('asc');
    }
  };

  const handlePaymentsSort = (field: "payment_date" | "vendor_id" | "payment_amount" | "payment_method") => {
    if (paymentsSortField === field) {
      setPaymentsSortDirection(paymentsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPaymentsSortField(field);
      setPaymentsSortDirection('asc');
    }
  };

  // Export functions
  const handleExportVendorOutstanding = () => {
    const exportData = filteredAndSortedVendorOutstanding.map(vendor => ({
      'Vendor': vendor.vendor_name,
      'Total Purchased (₹)': vendor.total_purchased,
      'Total Paid (₹)': vendor.total_paid,
      'Outstanding (₹)': vendor.outstanding
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Outstanding');
    XLSX.writeFile(wb, `vendor-outstanding-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPayments = () => {
    const exportData = filteredAndSortedPayments.map(payment => ({
      'Payment Date': new Date(payment.payment_date).toLocaleDateString(),
      'Vendor': payment.vendor_id,
      'Amount (₹)': payment.payment_amount,
      'Method': payment.payment_method,
      'Description': payment.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Label Payments');
    XLSX.writeFile(wb, `label-payments-${new Date().toISOString().split('T')[0]}.xlsx`);
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
              onChange={(e) => setForm({...form, payment_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor *</Label>
            <Select 
              value={form.vendor_id} 
              onValueChange={(value) => setForm({...form, vendor_id: value})}
            >
              <SelectTrigger id="vendor">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {getUniqueVendors().map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select 
              value={form.payment_method} 
              onValueChange={(value) => setForm({...form, payment_method: value})}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableCell>₹{vendor.total_purchased.toLocaleString()}</TableCell>
                    <TableCell>₹{vendor.total_paid.toLocaleString()}</TableCell>
                    <TableCell className={`font-medium ${vendor.outstanding > 0 ? 'text-red-600' : vendor.outstanding < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      ₹{vendor.outstanding.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    {vendorOutstanding.length === 0 
                      ? "No vendor data available"
                      : "No vendors found matching your search criteria."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Label Payments</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={paymentsSearch}
                onChange={(e) => setPaymentsSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={handleExportPayments} variant="outline" size="sm">
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
                  onClick={() => handlePaymentsSort('payment_date')}
                >
                  <div className="flex items-center gap-2">
                    Payment Date
                    {paymentsSortField === 'payment_date' && (
                      <span className="text-xs">{paymentsSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handlePaymentsSort('vendor_id')}
                >
                  <div className="flex items-center gap-2">
                    Vendor
                    {paymentsSortField === 'vendor_id' && (
                      <span className="text-xs">{paymentsSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handlePaymentsSort('payment_amount')}
                >
                  <div className="flex items-center gap-2">
                    Amount (₹)
                    {paymentsSortField === 'payment_amount' && (
                      <span className="text-xs">{paymentsSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4 cursor-pointer hover:bg-slate-100"
                  onClick={() => handlePaymentsSort('payment_method')}
                >
                  <div className="flex items-center gap-2">
                    Method
                    {paymentsSortField === 'payment_method' && (
                      <span className="text-xs">{paymentsSortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
                <TableHead className="bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Description</TableHead>
                <TableHead className="text-right bg-slate-50 border-slate-200 text-slate-700 py-3 px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPayments && filteredAndSortedPayments.length > 0 ? (
                filteredAndSortedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {payment.vendor_id || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">₹{payment.payment_amount.toLocaleString()}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{payment.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(payment)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                        >
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
                      : "No payments found matching your search criteria."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                    onChange={(e) => setEditForm({...editForm, payment_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-vendor">Vendor *</Label>
                  <Select 
                    value={editForm.vendor_id} 
                    onValueChange={(value) => setEditForm({...editForm, vendor_id: value})}
                  >
                    <SelectTrigger id="edit-vendor">
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueVendors().map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.vendor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={editForm.payment_method} 
                    onValueChange={(value) => setEditForm({...editForm, payment_method: value})}
                  >
                    <SelectTrigger id="edit-payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingPayment(null)}
                >
                  Cancel
                </Button>
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
