import React, { useMemo, useCallback, useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Send, Plus } from "lucide-react";
import { getWhatsAppConfig, sendWhatsAppMessage } from "@/services/whatsappService";
import { getTentativeDeliveryDays } from "@/services/invoiceConfigService";
import { logger } from "@/lib/logger";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { ColumnFilter } from "@/components/ui/column-filter";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface OrderRow {
  id: string;
  client: string;
  area: string;
  branch?: string;
  sku: string;
  number_of_cases: number;
  tentative_delivery_date: string;
  status: "pending" | "dispatched";
  created_at: string;
  updated_at: string;
}

interface DispatchRow {
  id: string;
  client: string;
  area: string;
  branch?: string;
  sku: string;
  cases: number;
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
    area: "",
    tentative_delivery_date: "",
  });
  const [skuRows, setSkuRows] = useState<{ sku: string; number_of_cases: string }[]>([
    { sku: "", number_of_cases: "" },
  ]);

  // Filter and sort states for Current Orders table
  const [ordersSearchTerm, setOrdersSearchTerm] = useState("");
  const debouncedOrdersSearchTerm = useDebouncedValue(ordersSearchTerm, 300);
  const [ordersColumnFilters, setOrdersColumnFilters] = useState({
    client: "",
    area: "",
    sku: "",
    number_of_cases: "",
    tentative_delivery_date: "",
    status: "",
  });
  const [ordersColumnSorts, setOrdersColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    area: null,
    sku: null,
    number_of_cases: null,
    tentative_delivery_date: null,
    status: null,
  });

  // Filter and sort states for Orders Dispatched table
  const [dispatchSearchTerm, setDispatchSearchTerm] = useState("");
  const debouncedDispatchSearchTerm = useDebouncedValue(dispatchSearchTerm, 300);
  const [dispatchColumnFilters, setDispatchColumnFilters] = useState({
    client: "",
    area: "",
    sku: "",
    cases: "",
    delivery_date: "",
  });
  const [dispatchColumnSorts, setDispatchColumnSorts] = useState<{
    [key: string]: 'asc' | 'desc' | null;
  }>({
    client: null,
    area: null,
    sku: null,
    cases: null,
    delivery_date: null,
  });

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
          // Fallback: try select(*) first (works with any schema), then specific columns
          const { data: d, error: e } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
          if (!e && d) {
            return (d as Array<Record<string, unknown>>).map((o) => ({
              ...o,
              area: o.area ?? o.branch,
              number_of_cases: o.number_of_cases ?? o.quantity,
            }));
          }
          return [];
        }
        return data || [];
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
        .select("id, dealer_name, area, sku")
        .eq("is_active", true)
        .order("dealer_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create order mutation (accepts array of orders for multiple SKUs)
  // Uses insert_orders RPC - run docs/migration/ADD_INSERT_ORDERS_RPC_ONLY.sql in Supabase SQL Editor once
  const createOrderMutation = useMutation({
    mutationFn: async (newOrders: Record<string, unknown>[]) => {
      const ordersJson = newOrders.map((o) => ({
        client: o.client,
        area: o.area,
        branch: o.area,
        sku: o.sku,
        number_of_cases: o.number_of_cases,
        date: o.date,
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
      // Reset form - use config for tentative delivery days
      const today = new Date().toISOString().split("T")[0];
      const defaultDeliveryDate = new Date();
      defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + tentativeDeliveryDays);
      
      setOrderForm({
        expense_date: today,
        client_id: "",
        area: "",
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
      // Get the order details first
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!orderData) throw new Error("Order not found");

      // Insert into dispatch table
      const { error: dispatchError } = await supabase
        .from("orders_dispatch")
        .insert([{
          client: orderData.client || orderData.dealer_name,
          branch: orderData.branch ?? orderData.area,
          sku: orderData.sku,
          cases: orderData.number_of_cases ?? orderData.quantity ?? 0,
          delivery_date: orderData.tentative_delivery_date ?? orderData.tentative_delivery_time,
        }]);

      if (dispatchError) throw dispatchError;

      // Delete from orders table
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (deleteError) throw deleteError;

      // Send "Stock Delivered" WhatsApp notification if enabled.
      // NOTE: Message text can be changed later via User Management → WhatsApp Configurations → templates (whatsapp_templates).
      try {
        const whatsappConfig = await getWhatsAppConfig();
        if (whatsappConfig.whatsapp_enabled && whatsappConfig.whatsapp_stock_delivered_enabled) {
          const clientName = (orderData.client || orderData.dealer_name || "").trim();
          const area = (orderData.area || "").trim();
          if (clientName && area) {
            const { data: customerRows } = await supabase
              .from("customers")
              .select("id, dealer_name, whatsapp_number")
              .eq("dealer_name", clientName)
              .eq("area", area)
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
                  customerName: customerRow.dealer_name || clientName,
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
          .select("*")
          .order("delivery_date", { ascending: false });

        if (error) {
          logger.error("[orders_dispatch] Query failed", { message: error.message, code: (error as { code?: string }).code, details: (error as { details?: string }).details });
          throw error;
        }
        return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
          ...row,
          area: String(row.area ?? row.branch ?? ""),
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
        area: order.area || order.branch || "",
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

  // Get unique areas for selected customer (exclude empty)
  const getAvailableAreas = useCallback((clientId: string) => {
    if (!customers || !clientId) return [];
    const selectedCustomer = customers.find(c => c.id === clientId);
    if (!selectedCustomer) return [];
    
    const areas = customers
      .filter(c => c.dealer_name === selectedCustomer.dealer_name)
      .map(c => c.area)
      .filter((a): a is string => !!a && String(a).trim() !== "")
      .filter((a, index, self) => self.indexOf(a) === index)
      .sort();
    
    return areas;
  }, [customers]);

  // Get all available SKUs for dealer+area (no row filter - for "all selected" check)
  const getAllAvailableSKUs = useCallback(() => {
    if (!customers || !orderForm.client_id || !orderForm.area) return [];
    const selectedCustomer = customers.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) return [];
    return customers
      .filter(c =>
        c.dealer_name === selectedCustomer.dealer_name &&
        c.area === orderForm.area &&
        c.sku &&
        c.sku.trim() !== ""
      )
      .map(c => c.sku)
      .filter((sku, index, self) => self.indexOf(sku) === index)
      .sort();
  }, [customers, orderForm.client_id, orderForm.area]);

  // Whether all available SKUs for dealer+area are selected (disable Add SKU)
  const allSkusSelected = useMemo(() => {
    const allAvailable = getAllAvailableSKUs();
    if (allAvailable.length === 0) return false;
    const selectedSkus = skuRows.map(r => r.sku?.trim()).filter(Boolean);
    return allAvailable.every(s => selectedSkus.includes(s));
  }, [getAllAvailableSKUs, skuRows]);

  // Single SKU mode: dealer has only one SKU - show simplified UI (cases only)
  const singleSkuMode = useMemo(() => getAllAvailableSKUs().length === 1, [getAllAvailableSKUs]);

  // Get available SKUs for selected customer and area (excludes SKUs already selected in other rows)
  const getAvailableSKUsForRow = useCallback((currentRowIndex: number) => {
    if (!customers || !orderForm.client_id || !orderForm.area) return [];
    const selectedCustomer = customers.find(c => c.id === orderForm.client_id);
    if (!selectedCustomer) return [];
    const allSkus = customers
      .filter(c =>
        c.dealer_name === selectedCustomer.dealer_name &&
        c.area === orderForm.area &&
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
  }, [customers, orderForm.client_id, orderForm.area, skuRows]);

  // Handle order form submission
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check required fields
    if (!orderForm.client_id || !orderForm.area || !orderForm.tentative_delivery_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in client, branch, and tentative delivery date",
        variant: "destructive",
      });
      return;
    }

    // Validation: At least one SKU row with valid SKU and cases
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
    // Validation: No duplicate SKUs in the same order
    const skuSet = new Set(validRows.map(r => r.sku.trim()));
    if (skuSet.size !== validRows.length) {
      toast({
        title: "Validation Error",
        description: "Each SKU can only be selected once per order",
        variant: "destructive",
      });
      return;
    }

    // Validation: Tentative delivery date must be greater than order date
    const orderDate = new Date(orderForm.expense_date);
    const deliveryDate = new Date(orderForm.tentative_delivery_date);
    
    if (deliveryDate <= orderDate) {
      toast({
        title: "Validation Error",
        description: "Tentative delivery date must be greater than order date",
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
      client: selectedCustomer.dealer_name,
      area: orderForm.area,
      sku: row.sku.trim(),
      number_of_cases: parseInt(row.number_of_cases),
      tentative_delivery_date: orderForm.tentative_delivery_date,
      status: "pending",
      date: orderForm.expense_date,
    }));

    createOrderMutation.mutate(newOrders);
  };

  // Handle client change - auto-populate area if single, reset SKU rows
  const handleClientChange = (clientId: string) => {
    if (!clientId || clientId === "") {
      setOrderForm({ ...orderForm, client_id: "", area: "" });
      setSkuRows([{ sku: "", number_of_cases: "" }]);
      return;
    }
    const availableAreas = getAvailableAreas(clientId);
    const autoArea = availableAreas.length === 1 ? availableAreas[0] : "";
    setOrderForm({ ...orderForm, client_id: clientId, area: autoArea });
    setSkuRows([{ sku: "", number_of_cases: "" }]);
  };

  // Handle area change - reset SKU rows
  const handleAreaChange = (areaValue: string) => {
    setOrderForm({ ...orderForm, area: areaValue });
    setSkuRows([{ sku: "", number_of_cases: "" }]);
  };

  // Auto-populate single SKU when dealer has only one SKU for the selected area
  useEffect(() => {
    if (!orderForm.client_id || !orderForm.area) return;
    const allSkus = getAllAvailableSKUs();
    if (allSkus.length === 1) {
      setSkuRows([{ sku: allSkus[0], number_of_cases: "" }]);
    }
  }, [orderForm.client_id, orderForm.area, getAllAvailableSKUs]);

  const addSkuRow = () => setSkuRows((prev) => [...prev, { sku: "", number_of_cases: "" }]);
  const removeSkuRow = (index: number) => {
    setSkuRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };
  const updateSkuRow = (index: number, field: "sku" | "number_of_cases", value: string) => {
    setSkuRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Handle date change and auto-calculate delivery
  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validation: Cannot select future date
    if (selectedDate > today) {
      toast({
        title: "Validation Error",
        description: "Cannot select a future date",
        variant: "destructive",
      });
      return;
    }

    const deliveryDate = new Date(selectedDate);
    deliveryDate.setDate(deliveryDate.getDate() + tentativeDeliveryDays);
    
    // Ensure delivery date is always set
    const newDeliveryDate = orderForm.tentative_delivery_date || deliveryDate.toISOString().split("T")[0];
    
    // If current delivery date is before or equal to new order date, update it
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

  // Initialize tentative delivery date on component mount (uses config)
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

  // Get unique customers for form dropdown (by dealer_name, not by id)
  const getUniqueCustomers = useCallback(() => {
    if (!customers) return [];
    const seenNames = new Set<string>();
    const unique = [];
    
    for (const customer of customers) {
      if (!seenNames.has(customer.dealer_name)) {
        seenNames.add(customer.dealer_name);
        unique.push(customer);
      }
    }
    
    return unique.sort((a, b) => a.dealer_name.localeCompare(b.dealer_name));
  }, [customers]);

  // Filtered and sorted Current Orders
  const filteredAndSortedOrders = useMemo(() => {
    if (!normalizedOrders) return [];

    return normalizedOrders.filter(order => {
      // Global search
      if (debouncedOrdersSearchTerm) {
        const searchLower = debouncedOrdersSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.area?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.number_of_cases?.toString().includes(searchLower) ||
          order.tentative_delivery_date?.includes(searchLower) ||
          order.status?.toLowerCase().includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (ordersColumnFilters.client && !order.client?.toLowerCase().includes(ordersColumnFilters.client.toLowerCase())) return false;
      if (ordersColumnFilters.area && !order.area?.toLowerCase().includes(ordersColumnFilters.area.toLowerCase())) return false;
      if (ordersColumnFilters.sku && !order.sku?.toLowerCase().includes(ordersColumnFilters.sku.toLowerCase())) return false;
      if (ordersColumnFilters.number_of_cases && order.number_of_cases?.toString() !== ordersColumnFilters.number_of_cases) return false;
      if (ordersColumnFilters.tentative_delivery_date && !order.tentative_delivery_date?.includes(ordersColumnFilters.tentative_delivery_date)) return false;
      if (ordersColumnFilters.status && order.status !== ordersColumnFilters.status) return false;

      return true;
    }).sort((a, b) => {
      // Apply sorting
      const sortKey = Object.keys(ordersColumnSorts).find(key => ordersColumnSorts[key] !== null);
      if (!sortKey) {
        // Default sort: status first, then date
        const statusA = a.status === "pending" ? 1 : 2;
        const statusB = b.status === "pending" ? 1 : 2;
        if (statusA !== statusB) return statusA - statusB;
        const dateA = new Date(a.tentative_delivery_date).getTime();
        const dateB = new Date(b.tentative_delivery_date).getTime();
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
        case 'area':
          aValue = (a.area || '').toLowerCase();
          bValue = (b.area || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'number_of_cases':
          aValue = a.number_of_cases || 0;
          bValue = b.number_of_cases || 0;
          break;
        case 'tentative_delivery_date':
          aValue = new Date(a.tentative_delivery_date).getTime();
          bValue = new Date(b.tentative_delivery_date).getTime();
          break;
        case 'status':
          aValue = a.status === "pending" ? 1 : 2;
          bValue = b.status === "pending" ? 1 : 2;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [normalizedOrders, debouncedOrdersSearchTerm, ordersColumnFilters, ordersColumnSorts]);

  // Filtered and sorted Orders Dispatched
  const filteredAndSortedDispatch = useMemo(() => {
    if (!dispatchData) return [];

    return (dispatchData as DispatchRow[]).filter(order => {
      // Global search
      if (debouncedDispatchSearchTerm) {
        const searchLower = debouncedDispatchSearchTerm.toLowerCase();
        const matchesGlobalSearch = (
          order.client?.toLowerCase().includes(searchLower) ||
          order.area?.toLowerCase().includes(searchLower) ||
          order.sku?.toLowerCase().includes(searchLower) ||
          order.cases?.toString().includes(searchLower) ||
          order.delivery_date?.includes(searchLower)
        );
        if (!matchesGlobalSearch) return false;
      }

      // Column filters
      if (dispatchColumnFilters.client && !order.client?.toLowerCase().includes(dispatchColumnFilters.client.toLowerCase())) return false;
      if (dispatchColumnFilters.area && !order.area?.toLowerCase().includes(dispatchColumnFilters.area.toLowerCase())) return false;
      if (dispatchColumnFilters.sku && !order.sku?.toLowerCase().includes(dispatchColumnFilters.sku.toLowerCase())) return false;
      if (dispatchColumnFilters.cases && order.cases?.toString() !== dispatchColumnFilters.cases) return false;
      if (dispatchColumnFilters.delivery_date && !order.delivery_date?.includes(dispatchColumnFilters.delivery_date)) return false;

      return true;
    }).sort((a, b) => {
      // Apply sorting
      const sortKey = Object.keys(dispatchColumnSorts).find(key => dispatchColumnSorts[key] !== null);
      if (!sortKey) {
        // Default sort: by delivery date descending
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
        case 'area':
          aValue = (a.area || '').toLowerCase();
          bValue = (b.area || '').toLowerCase();
          break;
        case 'sku':
          aValue = (a.sku || '').toLowerCase();
          bValue = (b.sku || '').toLowerCase();
          break;
        case 'cases':
          aValue = a.cases || 0;
          bValue = b.cases || 0;
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
  }, [dispatchData, debouncedDispatchSearchTerm, dispatchColumnFilters, dispatchColumnSorts]);

  // Export functions (defined after filteredAndSortedOrders and filteredAndSortedDispatch)
  const exportOrdersToExcel = useCallback(async () => {
    if (!filteredAndSortedOrders.length) return;

    const exportData = filteredAndSortedOrders.map((order) => ({
      Client: order.client,
      Branch: order.area,
      SKU: order.sku,
      "Number of Cases": order.number_of_cases,
      "Tentative Delivery Date": order.tentative_delivery_date,
      Status: order.status,
      "Created At": new Date(order.created_at).toLocaleString(),
    }));

    const fileName = `Current_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Current Orders', fileName);
  }, [filteredAndSortedOrders]);

  const exportDispatchToExcel = useCallback(async () => {
    if (!filteredAndSortedDispatch.length) return;

    const exportData = filteredAndSortedDispatch.map((row) => ({
      Client: row.client,
      Branch: row.area,
      SKU: row.sku,
      Cases: row.cases,
      "Delivery Date": row.delivery_date,
    }));

    const fileName = `Orders_Dispatch_${new Date().toISOString().split("T")[0]}.xlsx`;
    await exportJsonToExcel(exportData, 'Orders Dispatch', fileName);
  }, [filteredAndSortedDispatch]);

  // Handle column filter changes for Current Orders
  const handleOrdersColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setOrdersColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleOrdersColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setOrdersColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  // Handle column filter changes for Orders Dispatched
  const handleDispatchColumnFilterChange = useCallback((columnKey: string, value: string) => {
    setDispatchColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  const handleDispatchColumnSortChange = useCallback((columnKey: string, direction: "asc" | "desc" | null) => {
    setDispatchColumnSorts(prev => {
      const newSorts = { ...prev };
      Object.keys(newSorts).forEach(key => {
        if (key !== columnKey) {
          newSorts[key] = null;
        }
      });
      newSorts[columnKey] = direction;
      return newSorts;
    });
  }, []);

  // Get unique values for filter options
  const getUniqueOrderValues = useCallback((key: keyof OrderRow) => {
    if (!normalizedOrders) return [];
    const values = normalizedOrders.map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [normalizedOrders]);

  const getUniqueDispatchValues = useCallback((key: keyof DispatchRow) => {
    if (!dispatchData) return [];
    const values = (dispatchData as DispatchRow[]).map(order => order[key]).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [dispatchData]);

  // Get max date (today) for date input
  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 p-6 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Order Management</h2>
        </div>
      </div>

      {/* Order Registration Form - Compact */}
      <Card className="border-slate-200">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Create New Order</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          <form onSubmit={handleOrderSubmit} className="space-y-3">
            {/* Row 1: Date, Client, Branch, Tentative Delivery Date */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              <div className="space-y-1">
                <Label htmlFor="order-date" className="text-xs">Date *</Label>
                <Input
                  id="order-date"
                  type="date"
                  max={maxDate}
                  value={orderForm.expense_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="order-client" className="text-xs">Client *</Label>
                <Select value={orderForm.client_id || ""} onValueChange={handleClientChange}>
                  <SelectTrigger id="order-client">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] [&>div]:overflow-y-auto [&>div]:overflow-x-hidden [&>div::-webkit-scrollbar]:w-2 [&>div::-webkit-scrollbar-track]:bg-gray-100 [&>div::-webkit-scrollbar-thumb]:bg-gray-400 [&>div::-webkit-scrollbar-thumb]:rounded-full">
                    {getUniqueCustomers().map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.dealer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="order-area" className="text-xs">Branch *</Label>
                <Select
                  value={orderForm.area || ""}
                  onValueChange={handleAreaChange}
                  disabled={!orderForm.client_id}
                >
                  <SelectTrigger id="order-area">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] [&>div]:overflow-y-auto [&>div]:overflow-x-hidden [&>div::-webkit-scrollbar]:w-2 [&>div::-webkit-scrollbar-track]:bg-gray-100 [&>div::-webkit-scrollbar-thumb]:bg-gray-400 [&>div::-webkit-scrollbar-thumb]:rounded-full">
                    {getAvailableAreas(orderForm.client_id).map((area, index) => (
                      <SelectItem key={index} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-delivery">Tentative Delivery Date *</Label>
                <Input
                  id="order-delivery"
                  type="date"
                  min={orderForm.expense_date ? new Date(new Date(orderForm.expense_date).getTime() + 86400000).toISOString().split("T")[0] : undefined}
                  value={orderForm.tentative_delivery_date}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const orderDate = new Date(orderForm.expense_date);
                    if (selectedDate <= orderDate) {
                      toast({
                        title: "Validation Error",
                        description: "Tentative delivery date must be greater than order date",
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

            {/* SKU Rows - compact */}
            <div className="space-y-1.5">
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
                      <Select
                        value={row.sku || ""}
                        onValueChange={(value) => updateSkuRow(index, "sku", value)}
                        disabled={!orderForm.client_id || !orderForm.area}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select SKU" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {getAvailableSKUsForRow(index).map((sku, i) => (
                            <SelectItem key={i} value={sku}>
                              {sku}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            </div>

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
                onChange={(e) => setOrdersSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
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
          {/* Mobile export button */}
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
                          columnKey="area"
                          columnName="Branch"
                          filterValue={ordersColumnFilters.area}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('area', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('area', '')}
                          sortDirection={ordersColumnSorts.area}
                          onSortChange={(direction) => handleOrdersColumnSortChange('area', direction)}
                          dataType="text"
                          options={getUniqueOrderValues('area') as string[]}
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
                        <span>Delivery</span>
                        <ColumnFilter
                          columnKey="tentative_delivery_date"
                          columnName="Delivery Date"
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
                    <TableHead className="border-b border-blue-200/50 text-gray-800 font-semibold">
                      <div className="flex items-center gap-2 text-gray-800">
                        <span>Status</span>
                        <ColumnFilter
                          columnKey="status"
                          columnName="Status"
                          filterValue={ordersColumnFilters.status}
                          onFilterChange={(value) => handleOrdersColumnFilterChange('status', value as string)}
                          onClearFilter={() => handleOrdersColumnFilterChange('status', '')}
                          sortDirection={ordersColumnSorts.status}
                          onSortChange={(direction) => handleOrdersColumnSortChange('status', direction)}
                          dataType="text"
                          options={['pending', 'dispatched']}
                          triggerClassName="text-gray-800 hover:text-gray-900 hover:bg-gray-200/50"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-gray-800 font-semibold border-b border-blue-200/50">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.area || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.number_of_cases ?? "-"}</TableCell>
                      <TableCell>{order.tentative_delivery_date || "-"}</TableCell>
                      <TableCell>{renderStatus(order.status)}</TableCell>
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
                      <TableCell colSpan={7} className="text-center text-sm text-gray-600 py-8">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                onChange={(e) => setDispatchSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
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
          {/* Mobile export button */}
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
                          columnKey="area"
                          columnName="Branch"
                          filterValue={dispatchColumnFilters.area}
                          onFilterChange={(value) => handleDispatchColumnFilterChange('area', value as string)}
                          onClearFilter={() => handleDispatchColumnFilterChange('area', '')}
                          sortDirection={dispatchColumnSorts.area}
                          onSortChange={(direction) => handleDispatchColumnSortChange('area', direction)}
                          dataType="text"
                          options={getUniqueDispatchValues('area') as string[]}
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
                  {filteredAndSortedDispatch.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>{order.client || "-"}</TableCell>
                      <TableCell>{order.area || "-"}</TableCell>
                      <TableCell>{order.sku || "-"}</TableCell>
                      <TableCell className="text-right">{order.cases ?? "-"}</TableCell>
                      <TableCell>{order.delivery_date || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!filteredAndSortedDispatch.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-600 py-8">
                        No dispatch records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
