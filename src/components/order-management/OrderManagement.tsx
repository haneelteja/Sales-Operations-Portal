import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getQueryConfig } from "@/lib/query-configs";
import { useCacheInvalidation } from "@/hooks/useCacheInvalidation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Send, Plus } from "lucide-react";
import { getWhatsAppConfig, sendWhatsAppMessage, sendProductionOrderNotification } from "@/services/whatsappService";
import { getTentativeDeliveryDays } from "@/services/invoiceConfigService";
import { logger } from "@/lib/logger";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import OrderAnalysis from "./OrderAnalysis";
import ClientAnalysis from "./ClientAnalysis";

interface OrderRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  number_of_cases: number;
  expense_date?: string;
  tentative_delivery_date: string;
  status: "pending" | "dispatched";
  created_at: string;
  updated_at: string;
}

interface DispatchRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  cases: number;
  order_date?: string;
  delivery_date: string;
}

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateRelated } = useCacheInvalidation();

  // Form state for order registration
  const [orderForm, setOrderForm] = useState({
    expense_date: new Date().toISOString().split("T")[0],
    client_id: "",
    branch: "",
    tentative_delivery_date: "",
  });
  const [skuRows, setSkuRows] = useState<{ sku: string; number_of_cases: string }[]>([
    { sku: "", number_of_cases: "" },
  ]);

  // Client autocomplete
  const [clientSearch, setClientSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const clientInputRef = useRef<HTMLDivElement>(null);

  // Filter and sort states for Current Orders table
  const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
  const debouncedOrdersSearchTerm = useDebouncedValue(ordersSearchTerm, 300);
  const [ordersColumnFilters, setOrdersColumnFilters] = useState({
    client: "",
    branch: "",
    sku: "",
    number_of_cases: "",
    expense_date: "",
    tentative_delivery_date: "",
  });
  const [ordersColumnSorts, setOrdersColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    branch: null,
    sku: null,
    number_of_cases: null,
    expense_date: 'desc',
    tentative_delivery_date: null,
  });

  // Pagination state for Current Orders
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPageSize, setOrdersPageSize] = useState(5);
  const [ordersMonthFilter, setOrdersMonthFilter] = useState('');

  // Filter and sort states for Orders Dispatched table
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");
  const debouncedDispatchSearchTerm = useDebouncedValue(dispatchSearchTerm, 300);
  const [dispatchColumnFilters, setDispatchColumnFilters] = useState({
    client: "",
    branch: "",
    sku: "",
    cases: "",
    order_date: "",
    delivery_date: "",
  });
  const [dispatchColumnSorts, setDispatchColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    branch: null,
    sku: null,
    cases: null,
    order_date: null,
    delivery_date: 'desc',
  });

  // Pagination state for Orders Dispatched
  const [dispatchPage, setDispatchPage] = useState(1);
  const [dispatchPageSize, setDispatchPageSize] = useState(5);
  const [dispatchMonthFilter, setDispatchMonthFilter] = useState('');

  const { data: tentativeDeliveryDays = 5 } = useQuery({
    queryKey: ["tentative-delivery-days"],
    queryFn: getTentativeDeliveryDays,
  });

  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["orders"],
    ...getQueryConfig("orders"),
    retry: (failureCount, error: unknown) => {
      const err = error as { message?: string; code?: string };
      if (err?.message?.includes('404') || err?.message?.includes('400') || err?.code === 'PGRST116') return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc("get_orders_sorted");
        if (error) {
          const { data: d, error: e } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
          if (!e && d) {
            return (d as Array<Record<string, unknown>>).map((o) => ({
              ...o,
              branch: o.branch,
              number_of_cases: o.number_of_cases ?? o.quantity,
              expense_date: (o.expense_date ?? o.order_date) as string | undefined,
            }));
          }
          return [];
        }
        return (data as Array<Record<string, unknown>>).map((o) => ({
          ...o,
          expense_date: (o.order_date ?? o.expense_date) as string | undefined,
        }));
      } catch {
        return [];
      }
    },
  });

  // Fetch customers for dropdown (including SKU)
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    ...getQueryConfig("customers"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch, sku")
        .eq("is_active", true)
        .order("client_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create order mutation (accepts array of orders for multiple SKUs)
  const createOrderMutation = useMutation({
    mutationFn: async (newOrders: Record<string, unknown>[]) => {
      const ordersJson = newOrders.map((o) => ({
        client: o.client,
        branch: o.branch,
        sku: o.sku,
        number_of_cases: o.number_of_cases,
        order_date: o.order_date,
        tentative_delivery_date: o.tentative_delivery_date,
        status: o.status ?? "pending",
      }));
      const { data: rpcData, error: rpcError } = await supabase.rpc("insert_orders", {
        orders_json: ordersJson,
      });
      if (!rpcError && rpcData?.ids) {
        return (rpcData.ids as string[]).map((id) => ({ id }));
      }
      const errMsg = rpcError?.message ?? "Unknown error";
      const errDetails = rpcError ? JSON.stringify({ code: rpcError.code, details: rpcError.details, hint: rpcError.hint }) : "";
      logger.error("[insert_orders] RPC failed", { message: errMsg, details: errDetails, payload: ordersJson });
      throw new Error(`Order creation failed: ${errMsg}${errDetails ? ` (${errDetails})` : ""}`);
    },
    onSuccess: (_, variables) => {
      const count = variables.length;
      toast({
        title: "Success",
        description: count === 1 ? "Order created successfully!" : `${count} orders created successfully!`,
      });
      invalidateRelated('orders');

      // Notify production WhatsApp recipients
      try {
        const client = String(variables[0]?.client ?? '');
        const branch = String(variables[0]?.branch ?? '');
        const items = variables.map((o) => ({
          sku: String(o.sku ?? ''),
          cases: Number(o.number_of_cases ?? 0),
        }));
        const orderDate = String(variables[0]?.order_date ?? new Date().toISOString().split('T')[0]);
        const deliveryDate = String(variables[0]?.tentative_delivery_date ?? '');
        sendProductionOrderNotification({ client, branch, items, orderDate, deliveryDate }).catch(() => {});
      } catch (err) {
        logger.warn('Production order notification trigger failed (non-fatal):', err);
      }
      // Reset form
      const today = new Date().toISOString().split("T")[0];
      const defaultDeliveryDate = new Date();
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + tentativeDeliveryDays);

      setOrderForm({
        expense_date: today,
        client_id: "",
        branch: "",
        tentative_delivery_date: defaultDeliveryDate.toISOString().split("T")[0],
      });
      setSkuRows([{ sku: "", number_of_cases: "" }]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  // Dispatch order mutation
  const dispatchOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: orderData } = await supabase
        .from("orders")
        .select("client, branch, sku, number_of_cases, order_date, tentative_delivery_date")
        .eq("id", orderId)
        .single();

      if (!orderData) throw new Error("Order not found");

      const { error: dispatchError } = await supabase
        .from("orders_dispatch")
        .insert([{
          client: orderData.client,
          branch: orderData.branch,
          sku: orderData.sku,
          cases: orderData.number_of_cases ?? 0,
          order_date: orderData.order_date ?? new Date().toISOString().split("T")[0],
          delivery_date: new Date().toISOString().split("T")[0],
        }]);

      if (dispatchError) throw dispatchError;

      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) throw deleteError;

      // Send "Stock Delivered" WhatsApp notification if enabled.
      try {
        const whatsappConfig = await getWhatsAppConfig();
        if (whatsappConfig.whatsapp_enabled && whatsappConfig.whatsapp_stock_delivered_enabled) {
          const clientName = (orderData.client || "").trim();
          const branch = (orderData.branch || "").trim();
          if (clientName && branch) {
            const { data: customerRows } = await supabase
              .from("customers")
              .select("id, client_name, whatsapp_number")
              .eq("client_name", clientName)
              .eq("branch", branch)
              .not("whatsapp_number", "is", null)
              .limit(1);

            const customerRow = Array.isArray(customerRows) ? customerRows[0] : customerRows;
            if (customerRow?.id && customerRow.whatsapp_number) {
              const deliveryDate = orderData.tentative_delivery_date
                ? new Date(orderData.tentative_delivery_date).toLocaleDateString("en-IN")
                : "—";
              const items = `${orderData.sku || ""} - ${orderData.number_of_cases ?? 0} cases`;
              const result = await sendWhatsAppMessage({
                customerId: customerRow.id,
                messageType: "stock_delivered",
                triggerType: "auto",
                placeholders: {
                  customerName: customerRow.client_name || clientName,
                  orderNumber: orderId.slice(0, 8),
                  deliveryDate,
                  items,
                },
              });
              if (result?.success) {
                toast({
                  title: "WhatsApp sent",
                  description: "Stock delivered notification sent to customer.",
                });
              }
            }
          }
        }
      } catch (err) {
        logger.warn("Stock delivered WhatsApp notification skipped or failed", err);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order dispatched successfully!",
      });
      invalidateRelated('orders');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dispatch order",
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order deleted successfully!",
      });
      invalidateRelated('orders');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const { data: dispatchData, isLoading: dispatchLoading, error: dispatchError } = useQuery({
    queryKey: ["orders-dispatch"],
    ...getQueryConfig("orders-dispatch"),
    retry: (failureCount, error: unknown) => {
      const err = error as { message?: string };
      if (err?.message?.includes('404') || err?.message?.includes('relation') || err?.message?.includes('does not exist')) return false;
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("orders_dispatch")
          .select("id, client, branch, sku, cases, order_date, delivery_date")
          .order("delivery_date", { ascending: false });

        if (error) {
          logger.error("[orders_dispatch] Query failed", { message: error.message, code: (error as { code?: string }).code, details: (error as { details?: string }).details });
          throw error;
        }
        return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
          ...row,
          branch: String(row.branch ?? ""),
        }));
      } catch (e) {
        logger.error("[orders_dispatch] Caught", e);
        return [];
      }
    },
  });

  const normalizedOrders = useMemo(() => {
    if (!ordersData) return [] as OrderRow[];

    return (ordersData as OrderRow[])
      .map((order) => ({
        ...order,
        client: order.client || "",
        branch: order.branch || "",
      }))
      .sort((a, b) => {
        const statusA = a.status === "pending" ? 1 : 2;
        const statusB = b.status === "pending" ? 1 : 2;
        if (statusA !== statusB) return statusA - statusB;

        const dateA = new Date(a.tentative_delivery_date).getTime();
        const dateB = new Date(b.tentative_delivery_date).getTime();
        return dateB - dateA;
      });
  }, [ordersData]);

  const renderStatus = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "dispatched") return <Badge variant="outline">Dispatched</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  // Get unique branches for selected customer
  const getAvailableBranches = useCallback((clientId: string) => {
    if (!customers || !clientId) return [];
    const selectedCustomer = customers.find(c => c.id === clientId);
    if (!selectedCustomer) return [];

    const branches = customers
      .filter(c => c.client_name === selectedCustomer.client_name)
      .map(c => c.branch)
      .filter((b): b is string => !!b && String(b).trim() !== "")
      .filter((b, index, self) => self.indexOf(b) === index)
      .sort();

    return branches;
  }, [customers]);

  // Get all available SKUs for client+branch
  const getAllAvailableSKUs = useCallback(() => {
    if (!customers || !orderForm.client_id || !orderForm.branch) return [];
    const selectedCustomer = customers.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) return [];
    return customers
      .filter(c =>
        c.client_name === selectedCustomer.client_name &&
        c.branch === orderForm.branch &&
        c.sku &&
        c.sku.trim() !== ""
      )
      .map(c => c.sku)
      .filter((sku, index, self) => self.indexOf(sku) === index)
      .sort();
  }, [customers, orderForm.client_id, orderForm.branch]);

  const allSkusSelected = useMemo(() => {
    const allAvailable = getAllAvailableSKUs();
    if (allAvailable.length === 0) return false;
    const selectedSkus = skuRows.map(r => r.sku?.trim()).filter(Boolean);
    return allAvailable.every(s => selectedSkus.includes(s));
  }, [getAllAvailableSKUs, skuRows]);

  const singleSkuMode = useMemo(() => getAllAvailableSKUs().length === 1, [getAllAvailableSKUs]);

  // Get available SKUs for a row (excludes already-selected SKUs in other rows)
  const getAvailableSKUsForRow = useCallback((currentRowIndex: number) => {
    if (!customers || !orderForm.client_id || !orderForm.branch) return [];
    const selectedCustomer = customers.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) return [];
    const allSkus = customers
      .filter(c =>
        c.client_name === selectedCustomer.client_name &&
        c.branch === orderForm.branch &&
        c.sku &&
        c.sku.trim() !== ""
      )
      .map(c => c.sku)
      .filter((sku, index, self) => self.indexOf(sku) === index)
      .sort();
    const alreadySelected = skuRows
      .map((r, i) => (i !== currentRowIndex ? r.sku?.trim() : ""))
      .filter(Boolean);
    const currentRowSku = skuRows[currentRowIndex]?.sku?.trim();
    return allSkus.filter(sku => !alreadySelected.includes(sku) || sku === currentRowSku);
  }, [customers, orderForm.client_id, orderForm.branch, skuRows]);

  // Handle order form submission
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderForm.client_id || !orderForm.branch || !orderForm.tentative_delivery_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in client, branch, and tentative delivery date",
        variant: "destructive",
      });
      return;
    }

    const validRows = skuRows.filter(
      (row) => row.sku?.trim() && row.number_of_cases && parseInt(row.number_of_cases) > 0
    );
    if (validRows.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one SKU with number of cases",
        variant: "destructive",
      });
      return;
    }
    const skuSet = new Set(validRows.map(r => r.sku.trim()));
    if (skuSet.size !== validRows.length) {
      toast({
        title: "Validation Error",
        description: "Each SKU can only be selected once per order",
        variant: "destructive",
      });
      return;
    }

    const deliveryDate = new Date(orderForm.tentative_delivery_date);
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    if (deliveryDate < todayCheck) {
      toast({
        title: "Validation Error",
        description: "Tentative delivery date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    const selectedCustomer = customers?.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Selected client not found",
        variant: "destructive",
      });
      return;
    }

    const newOrders = validRows.map((row) => ({
      client: selectedCustomer.client_name,
      branch: orderForm.branch,
      sku: row.sku.trim(),
      number_of_cases: parseInt(row.number_of_cases),
      tentative_delivery_date: orderForm.tentative_delivery_date,
      status: "pending",
      order_date: orderForm.expense_date,
    }));

    createOrderMutation.mutate(newOrders);
  };

  // Handle client change - auto-populate branch if single, reset SKU rows
  const handleClientChange = (clientId: string) => {
    if (!clientId || clientId === "") {
      setOrderForm({ ...orderForm, client_id: "", branch: "" });
      setSkuRows([{ sku: "", number_of_cases: "" }]);
      setClientSearch("");
      return;
    }
    const availableBranches = getAvailableBranches(clientId);
    const autoBranch = availableBranches.length === 1 ? availableBranches[0] : "";
    setOrderForm({ ...orderForm, client_id: clientId, branch: autoBranch });
    setSkuRows([{ sku: "", number_of_cases: "" }]);
  };

  const handleClientSelect = (clientId: string, clientName: string) => {
    setClientSearch(clientName);
    setClientDropdownOpen(false);
    handleClientChange(clientId);
  };

  const handleBranchChange = (branchValue: string) => {
    setOrderForm({ ...orderForm, branch: branchValue });
    setSkuRows([{ sku: "", number_of_cases: "" }]);
  };

  // Auto-populate single SKU when client has only one SKU for the selected branch
  useEffect(() => {
    if (!orderForm.client_id || !orderForm.branch) return;
    const allSkus = getAllAvailableSKUs();
    if (allSkus.length === 1) {
      setSkuRows([{ sku: allSkus[0], number_of_cases: "" }]);
    }
  }, [orderForm.client_id, orderForm.branch, getAllAvailableSKUs]);

  const addSkuRow = () => setSkuRows((prev) => [...prev, { sku: "", number_of_cases: "" }]);
  const removeSkuRow = (index: number) => {
    setSkuRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };
  const updateSkuRow = (index: number, field: "sku" | "number_of_cases", value: string) => {
    setSkuRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minAllowed = new Date();
    minAllowed.setDate(minAllowed.getDate() - 7);
    minAllowed.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      toast({
        title: "Validation Error",
        description: "Cannot select a future date",
        variant: "destructive",
      });
      return;
    }
    if (selectedDate < minAllowed) {
      toast({
        title: "Validation Error",
        description: "Date cannot be more than 7 days in the past",
        variant: "destructive",
      });
      return;
    }

    const deliveryDate = new Date(selectedDate);
    deliveryDate.setDate(deliveryDate.getDate() + tentativeDeliveryDays);

    const newDeliveryDate = orderForm.tentative_delivery_date || deliveryDate.toISOString().split("T")[0];
    const currentDeliveryDate = new Date(newDeliveryDate);
    if (currentDeliveryDate <= selectedDate) {
      setOrderForm({
        ...orderForm,
        expense_date: date,
        tentative_delivery_date: deliveryDate.toISOString().split("T")[0],
      });
    } else {
      setOrderForm({
        ...orderForm,
        expense_date: date,
        tentative_delivery_date: newDeliveryDate,
      });
    }
  };

  useEffect(() => {
    if (!orderForm.tentative_delivery_date) {
      const defaultDeliveryDate = new Date(orderForm.expense_date);
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + tentativeDeliveryDays);
      setOrderForm(prev => ({
        ...prev,
        tentative_delivery_date: defaultDeliveryDate.toISOString().split("T")[0],
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativeDeliveryDays]);

  const getUniqueCustomers = useCallback(() => {
    if (!customers) return [];
    const seenNames = new Set<string>();
    const unique = [];

    for (const customer of customers) {
      if (!seenNames.has(customer.client_name)) {
        seenNames.add(customer.client_name);
        unique.push(customer);
      }
    }

    return unique.sort((a, b) => a.client_name.localeCompare(b.client_name));
  }, [customers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientInputRef.current && !clientInputRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = useMemo(() => {
    const unique = getUniqueCustomers();
    if (!clientSearch.trim()) return unique;
    return unique.filter(c =>
      c.client_name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [getUniqueCustomers, clientSearch]);

  const availableOrderMonths = useMemo(() => {
    const months = new Set<string>();
    (normalizedOrders || []).forEach(o => {
      if (o.expense_date) months.add(o.expense_date.slice(0, 7));
    });
    return [...months].sort().reverse();
  }, [normalizedOrders]);

  const availableDispatchMonths = useMemo(() => {
    const months = new Set<string>();
    ((dispatchData as DispatchRow[]) || []).forEach(o => {
      if (o.delivery_date) months.add(o.delivery_date.slice(0, 7));
    });
    return [...months].sort().reverse();
  }, [dispatchData]);

  // Filtered and sorted Current Orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!normalizedOrders) return [];

    return normalizedOrders.filter(order => {
      if (ordersMonthFilter && !(order.expense_date || '').startsWith(ordersMonthFilter)) return false;
      if (debouncedOrdersSearchTerm) {
        const searchLower = debouncedOrdersSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.branch?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.number_of_cases?.toString().includes(searchLower) ||
          order.expense_date?.includes(searchLower) ||
          order.tentative_delivery_date?.includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      if (ordersColumnFilters.client && !order.client?.toLowerCase().includes(ordersColumnFilters.client.toLowerCase())) return false;
      if (ordersColumnFilters.branch && !order.branch?.toLowerCase().includes(ordersColumnFilters.branch.toLowerCase())) return false;
      if (ordersColumnFilters.sku && !order.sku?.toLowerCase().includes(ordersColumnFilters.sku.toLowerCase())) return false;
      if (ordersColumnFilters.number_of_cases && order.number_of_cases?.toString() !== ordersColumnFilters.number_of_cases) return false;
      if (ordersColumnFilters.expense_date && !order.expense_date?.includes(ordersColumnFilters.expense_date)) return false;
      if (ordersColumnFilters.tentative_delivery_date && !order.tentative_delivery_date?.includes(ordersColumnFilters.tentative_delivery_date)) return false;

      return true;
    }).sort((a, b) => {
      const sortKey = Object.keys(ordersColumnSorts).find(key => ordersColumnSorts[key] !== null);
      if (!sortKey) {
        const dateA = new Date(a.expense_date || a.created_at).getTime();
        const dateB = new Date(b.expense_date || b.created_at).getTime();
        return dateB - dateA;
      }

      const direction = ordersColumnSorts[sortKey];
      if (!direction) return 0;

      let aValue: string | number;
      let bValue: string | number;

      switch (sortKey) {
        case 'client':
          aValue = (a.client || '').toLowerCase();
          bValue = (b.client || '').toLowerCase();
          break;
        case 'branch':
          aValue = (a.branch || '').toLowerCase();
          bValue = (b.branch || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'number_of_cases':
          aValue = a.number_of_cases || 0;
          bValue = b.number_of_cases || 0;
          break;
        case 'expense_date':
          aValue = new Date(a.expense_date || a.created_at).getTime();
          bValue = new Date(b.expense_date || b.created_at).getTime();
          break;
        case 'tentative_delivery_date':
          aValue = new Date(a.tentative_delivery_date).getTime();
          bValue = new Date(b.tentative_delivery_date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [normalizedOrders, debouncedOrdersSearchTerm, ordersColumnFilters, ordersColumnSorts, ordersMonthFilter]);

  // Filtered and sorted Orders Dispatched
  const filteredAndSortedDispatch = useMemo(() => {
    if (!dispatchData) return [];

    return (dispatchData as DispatchRow[]).filter(order => {
      if (dispatchMonthFilter && !(order.delivery_date || '').startsWith(dispatchMonthFilter)) return false;

      if (debouncedDispatchSearchTerm) {
        const searchLower = debouncedDispatchSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.branch?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.cases?.toString().includes(searchLower) ||
          order.delivery_date?.includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      if (dispatchColumnFilters.client && !order.client?.toLowerCase().includes(dispatchColumnFilters.client.toLowerCase())) return false;
      if (dispatchColumnFilters.branch && !order.branch?.toLowerCase().includes(dispatchColumnFilters.branch.toLowerCase())) return false;
      if (dispatchColumnFilters.sku && !order.sku?.toLowerCase().includes(dispatchColumnFilters.sku.toLowerCase())) return false;
      if (dispatchColumnFilters.cases && order.cases?.toString() !== dispatchColumnFilters.cases) return false;
      if (dispatchColumnFilters.order_date && !order.order_date?.includes(dispatchColumnFilters.order_date)) return false;
      if (dispatchColumnFilters.delivery_date && !order.delivery_date?.includes(dispatchColumnFilters.delivery_date)) return false;

      return true;
    }).sort((a, b) => {
      const sortKey = Object.keys(dispatchColumnSorts).find(key => dispatchColumnSorts[key] !== null);
      if (!sortKey) {
        const dateA = new Date(a.delivery_date).getTime();
        const dateB = new Date(b.delivery_date).getTime();
        return dateB - dateA;
      }

      const direction = dispatchColumnSorts[sortKey];
      if (!direction) return 0;

      let aValue: string | number;
      let bValue: string | number;

      switch (sortKey) {
        case 'client':
          aValue = (a.client || '').toLowerCase();
          bValue = (b.client || '').toLowerCase();
          break;
        case 'branch':
          aValue = (a.branch || '').toLowerCase();
          bValue = (b.branch || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'cases':
          aValue = a.cases || 0;
          bValue = b.cases || 0;
          break;
        case 'order_date':
          aValue = new Date(a.order_date || a.delivery_date).getTime();
          bValue = new Date(b.order_date || b.delivery_date).getTime();
          break;
        case 'delivery_date':
          aValue = new Date(a.delivery_date).getTime();
          bValue = new Date(b.delivery_date).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [dispatchData, debouncedDispatchSearchTerm, dispatchColumnFilters, dispatchColumnSorts, dispatchMonthFilter]);

  const exportOrdersToExcel = useCallback(async () => {
    if (!filteredAndSortedOrders.length) return;

    const exportData = filteredAndSortedOrders.map((order) => ({
      Client: order.client,
      Branch: order.branch,
      SKU: order.sku,
      "Number of Cases": order.number_of_cases,
      "Order Date": order.expense_date || "",
      "Tentative Delivery Date": order.tentative_delivery_date,
      "Created At": new Date(order.created_at).toLocaleString(),
    }));

    const fileName = `Current_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Current Orders', fileName);
  }, [filteredAndSortedOrders]);

  const exportDispatchToExcel = useCallback(async () => {
    if (!filteredAndSortedDispatch.length) return;

    const exportData = filteredAndSortedDispatch.map((row) => ({
      Client: row.client,
      Branch: row.branch,
      SKU: row.sku,
      Cases: row.cases,
      "Order Date": row.order_date || "",
      "Delivery Date": row.delivery_date,
    }));

    const fileName = `Orders_Dispatch_${new Date().toISOString().split("T")[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Orders Dispatch', fileName);
  }, [filteredAndSortedDispatch]);

  const handleOrdersColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setOrdersColumnFilters(prev => ({ ...prev, [columnKey]: value }));
    setOrdersPage(1);
  }, []);

  const handleOrdersColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setOrdersColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setDispatchColumnFilters(prev => ({ ...prev, [columnKey]: value }));
    setDispatchPage(1);
  }, []);

  const handleDispatchColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setDispatchColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) newSorts[key] = null;
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  const getUniqueOrderValues = useCallback((key: keyof OrderRow) => {
    if (!normalizedOrders) return [];
    const filtered = normalizedOrders.filter(order => {
      if (key !== 'client' && ordersColumnFilters.client && !order.client?.toLowerCase().includes(ordersColumnFilters.client.toLowerCase())) return false;
      if (key !== 'branch' && ordersColumnFilters.branch && !order.branch?.toLowerCase().includes(ordersColumnFilters.branch.toLowerCase())) return false;
      if (key !== 'sku' && ordersColumnFilters.sku && !order.sku?.toLowerCase().includes(ordersColumnFilters.sku.toLowerCase())) return false;
      return true;
    });
    const values = filtered.map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [normalizedOrders, ordersColumnFilters]);

  const getUniqueDispatchValues = useCallback((key: keyof DispatchRow) => {
    if (!dispatchData) return [];
    const filtered = (dispatchData as DispatchRow[]).filter(order => {
      if (key !== 'client' && dispatchColumnFilters.client && !order.client?.toLowerCase().includes(dispatchColumnFilters.client.toLowerCase())) return false;
      if (key !== 'branch' && dispatchColumnFilters.branch && !order.branch?.toLowerCase().includes(dispatchColumnFilters.branch.toLowerCase())) return false;
      if (key !== 'sku' && dispatchColumnFilters.sku && !order.sku?.toLowerCase().includes(dispatchColumnFilters.sku.toLowerCase())) return false;
      return true;
    });
    const values = filtered.map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [dispatchData, dispatchColumnFilters]);

  const maxDate = new Date().toISOString().split("T")[0];
  const minOrderDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);
  const todayDate = maxDate;

  return (
    <div className="space-y-6 p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order Management</h2>
        </div>
      </div>

      {/* Order Registration Form */}
      <Card className="border-slate-200">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Create New Order</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          <form onSubmit={handleOrderSubmit} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="order-date" className="text-xs">Date *</Label>
                <Input
                  id="order-date"
                  type="date"
                  min={minOrderDate}
                  max={maxDate}
                  value={orderForm.expense_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1" ref={clientInputRef}>
                <Label htmlFor="order-client-search" className="text-xs">Client *</Label>
                <div className="relative">
                  <Input
                    id="order-client-search"
                    placeholder="Search client..."
                    value={clientSearch}
                    autoComplete="off"
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setClientDropdownOpen(true);
                      if (!e.target.value) handleClientChange("");
                    }}
                    onFocus={() => setClientDropdownOpen(true)}
                  />
                  {clientDropdownOpen && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className={[
                            "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                            orderForm.client_id === customer.id ? "bg-accent/50 font-medium" : "",
                          ].join(" ")}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleClientSelect(customer.id, customer.client_name);
                          }}
                        >
                          {customer.client_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {clientDropdownOpen && clientSearch.trim() && filteredCustomers.length === 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg px-3 py-2 text-sm text-muted-foreground">
                      No clients found
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="order-branch" className="text-xs">Branch *</Label>
                <SearchableSelect
                  options={getAvailableBranches(orderForm.client_id).map(b => ({ value: b, label: b }))}
                  value={orderForm.branch || ""}
                  onValueChange={handleBranchChange}
                  placeholder="Select branch"
                  disabled={!orderForm.client_id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-delivery">Tentative Delivery Date *</Label>
                <Input
                  id="order-delivery"
                  type="date"
                  min={todayDate}
                  value={orderForm.tentative_delivery_date}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                      toast({
                        title: "Validation Error",
                        description: "Tentative delivery date cannot be in the past",
                        variant: "destructive",
                      });
                      return;
                    }
                    setOrderForm({ ...orderForm, tentative_delivery_date: e.target.value });
                  }}
                  required
                />
              </div>
            </div>

            {/* SKU Rows - only shown after client and branch are selected */}
            {orderForm.client_id && orderForm.branch && <div className="space-y-1.5">
              <Label className="text-xs">SKUs *</Label>
              {singleSkuMode && (
                <p className="text-xs text-muted-foreground">
                  This client branch has only one SKU. Enter the number of cases below.
                </p>
              )}
              {skuRows.map((row, index) => (
                <div key={index} className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
                  <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}.</span>
                  {singleSkuMode ? (
                    <span className="min-w-[140px] max-w-[260px] text-xs font-medium py-1.5 px-2 rounded border bg-muted/50 truncate">
                      {row.sku || getAllAvailableSKUs()[0]}
                    </span>
                  ) : (
                    <div className="min-w-[140px] max-w-[260px] flex-none">
                      <SearchableSelect
                        options={getAvailableSKUsForRow(index).map(sku => ({ value: sku, label: sku }))}
                        value={row.sku || ""}
                        onValueChange={(value) => updateSkuRow(index, "sku", value)}
                        placeholder="Select SKU"
                        disabled={!orderForm.client_id || !orderForm.branch}
                      />
                    </div>
                  )}
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      className="h-8 text-sm"
                      value={row.number_of_cases}
                      onChange={(e) => updateSkuRow(index, "number_of_cases", e.target.value)}
                      placeholder="Cases"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkuRow(index)}
                    disabled={skuRows.length === 1 || singleSkuMode}
                    title={singleSkuMode ? "Single SKU - cannot remove" : "Remove row"}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  {index === 0 && !singleSkuMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSkuRow}
                      className="shrink-0"
                      disabled={allSkusSelected}
                      title={allSkusSelected ? "All available SKUs for this client branch are already added" : "Add another SKU"}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add SKU
                    </Button>
                  )}
                </div>
              ))}
              {allSkusSelected && !singleSkuMode && (
                <p className="text-xs text-muted-foreground">
                  All available SKUs for this client branch have been added.
                </p>
              )}
            </div>}

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="relative">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-lg font-medium text-gray-800">Current Orders</CardTitle>
            <div className="flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Search orders..."
                value={ordersSearchTerm}
                onChange={(e) => { setOrdersSearchTerm(e.target.value); setOrdersPage(1); }}
                className="w-full"
              />
            </div>
            {availableOrderMonths.length > 0 && (
              <select
                aria-label="Filter by month"
                value={ordersMonthFilter}
                onChange={e => { setOrdersMonthFilter(e.target.value); setOrdersPage(1); }}
                className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground"
              >
                <option value="">All Months</option>
                {availableOrderMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            )}
            <div className="hidden md:block ml-auto">
              <Button
                variant="outline"
                onClick={exportOrdersToExcel}
                disabled={!filteredAndSortedOrders.length}
                size="sm"
                className="whitespace-nowrap"
              >
                Export Orders
              </Button>
            </div>
          </div>
          <div className="md:hidden mt-3 flex justify-end">
            <Button
              variant="outline"
              onClick={exportOrdersToExcel}
              disabled={!filteredAndSortedOrders.length}
              size="sm"
              className="w-full sm:w-auto"
            >
              Export Orders
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ordersError && <p className="text-sm text-red-500">Failed to load orders.</p>}
          {ordersLoading ? (
            <p className="text-sm text-gray-600">Loading orders...</p>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="table-auto w-full border-collapse min-w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 transition-all duration-200">
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Client</span>
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={ordersColumnFilters.client}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('client', '')}
                          sortDirection={ordersColumnSorts.client}
                          onSortChange={(direction) => handleOrdersColumnSortChange('client', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('client') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Branch</span>
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={ordersColumnFilters.branch}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('branch', '')}
                          sortDirection={ordersColumnSorts.branch}
                          onSortChange={(direction) => handleOrdersColumnSortChange('branch', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('branch') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>SKU</span>
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={ordersColumnFilters.sku}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('sku', '')}
                          sortDirection={ordersColumnSorts.sku}
                          onSortChange={(direction) => handleOrdersColumnSortChange('sku', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('sku') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-800">
                        <span>Cases</span>
                        <ColumnFilter
                          columnKey="number_of_cases"
                          columnName="Cases"
                          filterValue={ordersColumnFilters.number_of_cases}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('number_of_cases', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('number_of_cases', '')}
                          sortDirection={ordersColumnSorts.number_of_cases}
                          onSortChange={(direction) => handleOrdersColumnSortChange('number_of_cases', direction)}
                          dataType="number"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Order Date</span>
                        <ColumnFilter
                          columnKey="expense_date"
                          columnName="Order Date"
                          filterValue={ordersColumnFilters.expense_date}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('expense_date', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('expense_date', '')}
                          sortDirection={ordersColumnSorts.expense_date}
                          onSortChange={(direction) => handleOrdersColumnSortChange('expense_date', direction)}
                          dataType="date"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Tentative Delivery Date</span>
                        <ColumnFilter
                          columnKey="tentative_delivery_date"
                          columnName="Tentative Delivery Date"
                          filterValue={ordersColumnFilters.tentative_delivery_date}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('tentative_delivery_date', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('tentative_delivery_date', '')}
                          sortDirection={ordersColumnSorts.tentative_delivery_date}
                          onSortChange={(direction) => handleOrdersColumnSortChange('tentative_delivery_date', direction)}
                          dataType="date"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-gray-800 font-semibold border-b border-blue-200/50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.slice((ordersPage - 1) * ordersPageSize, ordersPage * ordersPageSize).map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.branch || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.number_of_cases ?? "-"}</TableCell>
                      <TableCell>{order.expense_date || "-"}</TableCell>
                      <TableCell>{order.tentative_delivery_date || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatchOrderMutation.mutate(order.id)}
                            disabled={dispatchOrderMutation.isPending}
                            title="Dispatch this order"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this order?")) {
                                deleteOrderMutation.mutate(order.id);
                              }
                            }}
                            disabled={deleteOrderMutation.isPending}
                            title="Delete this order"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredAndSortedOrders.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-600 py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="flex items-center justify-between pt-2">
                <PageSizeSelector
                  pageSize={ordersPageSize}
                  onPageSizeChange={(s) => { setOrdersPageSize(s); setOrdersPage(1); }}
                  totalRecords={filteredAndSortedOrders.length}
                />
                <Pagination
                  page={ordersPage}
                  totalPages={Math.max(1, Math.ceil(filteredAndSortedOrders.length / ordersPageSize))}
                  total={filteredAndSortedOrders.length}
                  pageSize={ordersPageSize}
                  onNextPage={() => setOrdersPage(p => Math.min(p + 1, Math.ceil(filteredAndSortedOrders.length / ordersPageSize)))}
                  onPreviousPage={() => setOrdersPage(p => Math.max(p - 1, 1))}
                  onFirstPage={() => setOrdersPage(1)}
                  onLastPage={() => setOrdersPage(Math.ceil(filteredAndSortedOrders.length / ordersPageSize))}
                  onPageChange={setOrdersPage}
                  hasNextPage={ordersPage < Math.ceil(filteredAndSortedOrders.length / ordersPageSize)}
                  hasPreviousPage={ordersPage > 1}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="relative">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="text-lg font-medium text-gray-800">Orders Dispatched</CardTitle>
            <div className="flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Search dispatch records..."
                value={dispatchSearchTerm}
                onChange={(e) => { setDispatchSearchTerm(e.target.value); setDispatchPage(1); }}
                className="w-full"
              />
            </div>
            {availableDispatchMonths.length > 0 && (
              <select
                aria-label="Filter by month"
                value={dispatchMonthFilter}
                onChange={e => { setDispatchMonthFilter(e.target.value); setDispatchPage(1); }}
                className="text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-foreground"
              >
                <option value="">All Months</option>
                {availableDispatchMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            )}
            <div className="hidden md:block ml-auto">
              <Button
                variant="outline"
                onClick={exportDispatchToExcel}
                disabled={!filteredAndSortedDispatch.length}
                size="sm"
                className="whitespace-nowrap"
              >
                Export Dispatch
              </Button>
            </div>
          </div>
          <div className="md:hidden mt-3 flex justify-end">
            <Button
              variant="outline"
              onClick={exportDispatchToExcel}
              disabled={!filteredAndSortedDispatch.length}
              size="sm"
              className="w-full sm:w-auto"
            >
              Export Dispatch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dispatchError && <p className="text-sm text-red-500">Failed to load dispatch data.</p>}
          {dispatchLoading ? (
            <p className="text-sm text-gray-600">Loading dispatch data...</p>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <Table className="table-auto w-full border-collapse min-w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-green-100 via-green-50 to-green-100 hover:from-green-200 hover:via-green-100 hover:to-green-200 transition-all duration-200">
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Client</span>
                        <ColumnFilter
                          columnKey="client"
                          columnName="Client"
                          filterValue={dispatchColumnFilters.client}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('client', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('client', '')}
                          sortDirection={dispatchColumnSorts.client}
                          onSortChange={(direction) => handleDispatchColumnSortChange('client', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('client') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Branch</span>
                        <ColumnFilter
                          columnKey="branch"
                          columnName="Branch"
                          filterValue={dispatchColumnFilters.branch}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('branch', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('branch', '')}
                          sortDirection={dispatchColumnSorts.branch}
                          onSortChange={(direction) => handleDispatchColumnSortChange('branch', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('branch') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>SKU</span>
                        <ColumnFilter
                          columnKey="sku"
                          columnName="SKU"
                          filterValue={dispatchColumnFilters.sku}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('sku', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('sku', '')}
                          sortDirection={dispatchColumnSorts.sku}
                          onSortChange={(direction) => handleDispatchColumnSortChange('sku', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('sku') as string[]}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-800">
                        <span>Cases</span>
                        <ColumnFilter
                          columnKey="cases"
                          columnName="Cases"
                          filterValue={dispatchColumnFilters.cases}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('cases', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('cases', '')}
                          sortDirection={dispatchColumnSorts.cases}
                          onSortChange={(direction) => handleDispatchColumnSortChange('cases', direction)}
                          dataType="number"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Order Date</span>
                        <ColumnFilter
                          columnKey="order_date"
                          columnName="Order Date"
                          filterValue={dispatchColumnFilters.order_date}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('order_date', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('order_date', '')}
                          sortDirection={dispatchColumnSorts.order_date}
                          onSortChange={(direction) => handleDispatchColumnSortChange('order_date', direction)}
                          dataType="date"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="border-b border-green-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Delivery Date</span>
                        <ColumnFilter
                          columnKey="delivery_date"
                          columnName="Delivery Date"
                          filterValue={dispatchColumnFilters.delivery_date}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('delivery_date', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('delivery_date', '')}
                          sortDirection={dispatchColumnSorts.delivery_date}
                          onSortChange={(direction) => handleDispatchColumnSortChange('delivery_date', direction)}
                          dataType="date"
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedDispatch.slice((dispatchPage - 1) * dispatchPageSize, dispatchPage * dispatchPageSize).map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.branch || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.cases ?? "-"}</TableCell>
                      <TableCell>{order.order_date || "-"}</TableCell>
                      <TableCell>{order.delivery_date || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!filteredAndSortedDispatch.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-600 py-8">
                        No dispatch records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              <div className="flex items-center justify-between pt-2">
                <PageSizeSelector
                  pageSize={dispatchPageSize}
                  onPageSizeChange={(s) => { setDispatchPageSize(s); setDispatchPage(1); }}
                  totalRecords={filteredAndSortedDispatch.length}
                />
                <Pagination
                  page={dispatchPage}
                  totalPages={Math.max(1, Math.ceil(filteredAndSortedDispatch.length / dispatchPageSize))}
                  total={filteredAndSortedDispatch.length}
                  pageSize={dispatchPageSize}
                  onNextPage={() => setDispatchPage(p => Math.min(p + 1, Math.ceil(filteredAndSortedDispatch.length / dispatchPageSize)))}
                  onPreviousPage={() => setDispatchPage(p => Math.max(p - 1, 1))}
                  onFirstPage={() => setDispatchPage(1)}
                  onLastPage={() => setDispatchPage(Math.ceil(filteredAndSortedDispatch.length / dispatchPageSize))}
                  onPageChange={setDispatchPage}
                  hasNextPage={dispatchPage < Math.ceil(filteredAndSortedDispatch.length / dispatchPageSize)}
                  hasPreviousPage={dispatchPage > 1}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Analysis */}
      <OrderAnalysis />

      {/* Client Analysis */}
      <ClientAnalysis />

    </div>
  );
};

export default OrderManagement;
