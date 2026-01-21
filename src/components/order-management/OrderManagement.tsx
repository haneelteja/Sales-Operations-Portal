import React, { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface OrderRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  number_of_cases: number;
  tentative_delivery_date: string;
  status: "pending" | "dispatched";
  created_at: string;
  updated_at: string;
  client_name?: string;
}

interface DispatchRow {
  id: string;
  client: string;
  branch: string;
  sku: string;
  cases: number;
  delivery_date: string;
}

const OrderManagement: React.FC = () => {
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_orders_sorted");
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("orders")
          .select(
            `id, client_name, client, branch, sku, number_of_cases, tentative_delivery_date, status, created_at, updated_at`
          )
          .order("status", { ascending: true })
          .order("tentative_delivery_date", { ascending: false });

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }
      return data || [];
    },
  });

  const { data: dispatchData, isLoading: dispatchLoading, error: dispatchError } = useQuery({
    queryKey: ["orders-dispatch"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders_dispatch")
        .select("id, client, branch, sku, cases, delivery_date")
        .order("delivery_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const normalizedOrders = useMemo(() => {
    if (!ordersData) return [] as OrderRow[];

    return (ordersData as OrderRow[])
      .map((order) => ({
        ...order,
        client: order.client || order.client_name || "",
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

  const exportOrdersToExcel = useCallback(() => {
    if (!normalizedOrders.length) return;

    const exportData = normalizedOrders.map((order) => ({
      Client: order.client,
      Branch: order.branch,
      SKU: order.sku,
      "Number of Cases": order.number_of_cases,
      "Tentative Delivery Date": order.tentative_delivery_date,
      Status: order.status,
      "Created At": new Date(order.created_at).toLocaleString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Orders");
    const fileName = `Current_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [normalizedOrders]);

  const exportDispatchToExcel = useCallback(() => {
    if (!dispatchData || !dispatchData.length) return;

    const exportData = (dispatchData as DispatchRow[]).map((row) => ({
      Client: row.client,
      Branch: row.branch,
      SKU: row.sku,
      Cases: row.cases,
      "Delivery Date": row.delivery_date,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders Dispatch");
    const fileName = `Orders_Dispatch_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [dispatchData]);

  const renderStatus = (status: string) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "dispatched") return <Badge variant="outline">Dispatched</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Order Management</h2>
          <p className="text-sm text-gray-600">Read-only summary of orders and dispatches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hover:bg-gray-100" onClick={exportOrdersToExcel} disabled={!normalizedOrders.length}>
            Export Orders
          </Button>
          <Button variant="outline" className="hover:bg-gray-100" onClick={exportDispatchToExcel} disabled={!dispatchData?.length}>
            Export Dispatch
          </Button>
        </div>
      </div>

      <Card className="border rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Current Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersError && <p className="text-sm text-red-500">Failed to load orders.</p>}
          {ordersLoading ? (
            <p className="text-sm text-gray-600">Loading orders...</p>
          ) : (
            <Table className="table-auto w-full border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b">Client</TableHead>
                  <TableHead className="border-b">Branch</TableHead>
                  <TableHead className="border-b">SKU</TableHead>
                  <TableHead className="border-b text-right">Cases</TableHead>
                  <TableHead className="border-b">Delivery</TableHead>
                  <TableHead className="border-b">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-100">
                    <TableCell>{order.client || "-"}</TableCell>
                    <TableCell>{order.branch || "-"}</TableCell>
                    <TableCell>{order.sku || "-"}</TableCell>
                    <TableCell className="text-right">{order.number_of_cases ?? "-"}</TableCell>
                    <TableCell>{order.tentative_delivery_date || "-"}</TableCell>
                    <TableCell>{renderStatus(order.status)}</TableCell>
                  </TableRow>
                ))}
                {!normalizedOrders.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-gray-600">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Orders Dispatch</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatchError && <p className="text-sm text-red-500">Failed to load dispatch data.</p>}
          {dispatchLoading ? (
            <p className="text-sm text-gray-600">Loading dispatch data...</p>
          ) : (
            <Table className="table-auto w-full border-collapse">
              <TableHeader>
                <TableRow>
                  <TableHead className="border-b">Client</TableHead>
                  <TableHead className="border-b">Branch</TableHead>
                  <TableHead className="border-b">SKU</TableHead>
                  <TableHead className="border-b text-right">Cases</TableHead>
                  <TableHead className="border-b">Delivery Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(dispatchData as DispatchRow[] | undefined)?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-100">
                    <TableCell>{order.client || "-"}</TableCell>
                    <TableCell>{order.branch || "-"}</TableCell>
                    <TableCell>{order.sku || "-"}</TableCell>
                    <TableCell className="text-right">{order.cases ?? "-"}</TableCell>
                    <TableCell>{order.delivery_date || "-"}</TableCell>
                  </TableRow>
                ))}
                {!dispatchData?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-gray-600">
                      No dispatch records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
