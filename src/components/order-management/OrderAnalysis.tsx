import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getQueryConfig } from "@/lib/query-configs";

interface AnalysisRow {
  client: string;
  branch: string;
  outstanding: number;
  lastOrderDate: string | null;
  avgDays: number | null;
  expectedNext: string | null;
  daysOverdue: number;
  status: string;
  totalOrders: number;
}

function daysDiff(from: number, to: number) {
  return Math.round((to - from) / 86400000);
}

function computeStatus(totalOrders: number, expectedNext: string | null, daysOverdue: number): string {
  if (totalOrders === 0) return "No Orders";
  if (totalOrders === 1) return "Only 1 Order";
  if (!expectedNext) return "N/A";
  if (daysOverdue > 7) return "OVERDUE";
  if (daysOverdue > 0) return "DUE SOON";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expectedNext);
  exp.setHours(0, 0, 0, 0);
  if (today.getTime() >= exp.getTime() - 3 * 86400000) return "DUE SOON";
  return "ON TRACK";
}

const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  "DUE SOON": 1,
  "ON TRACK": 2,
  "Only 1 Order": 3,
  "N/A": 4,
  "No Orders": 5,
};

function StatusBadge({ status, daysOverdue }: { status: string; daysOverdue: number }) {
  if (status === "OVERDUE")
    return <Badge variant="destructive">OVERDUE ({daysOverdue}d)</Badge>;
  if (status === "DUE SOON")
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">DUE SOON</Badge>;
  if (status === "ON TRACK")
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">ON TRACK</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

const OrderAnalysis: React.FC = () => {
  const { data: rawOrders = [] } = useQuery({
    queryKey: ["orders"],
    ...getQueryConfig("orders"),
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("client, branch, date, created_at");
      return (data || []) as Array<{ client: string; branch: string; date: string | null; created_at: string }>;
    },
  });

  const { data: rawDispatch = [] } = useQuery({
    queryKey: ["orders-dispatch"],
    ...getQueryConfig("orders-dispatch"),
    queryFn: async () => {
      const { data } = await supabase
        .from("orders_dispatch")
        .select("client, branch, delivery_date");
      return (data || []) as Array<{ client: string; branch: string; delivery_date: string }>;
    },
  });

  const { data: rawTx = [] } = useQuery({
    queryKey: ["order-analysis-outstanding"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select("transaction_type, amount, customers(client_name, branch)");
      return (data || []) as Array<{
        transaction_type: string;
        amount: number | null;
        customers: { client_name: string; branch: string } | null;
      }>;
    },
  });

  const rows = useMemo<AnalysisRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect all order dates per client+branch key
    const dateMap = new Map<string, string[]>();
    const addDate = (client: string, branch: string, date: string | null | undefined) => {
      if (!client || !date) return;
      const d = date.split("T")[0];
      if (!d || d === "null") return;
      const key = `${client.trim()}|||${(branch || "").trim()}`;
      const arr = dateMap.get(key);
      if (arr) arr.push(d);
      else dateMap.set(key, [d]);
    };

    rawOrders.forEach((o) => addDate(o.client, o.branch, o.date || o.created_at));
    rawDispatch.forEach((d) => addDate(d.client, d.branch, d.delivery_date));

    // Outstanding per client+branch
    const outstandingMap = new Map<string, number>();
    rawTx.forEach((tx) => {
      const cust = tx.customers;
      if (!cust?.client_name) return;
      const key = `${cust.client_name.trim()}|||${(cust.branch || "").trim()}`;
      const prev = outstandingMap.get(key) ?? 0;
      const amt = tx.amount ?? 0;
      outstandingMap.set(
        key,
        tx.transaction_type === "sale" ? prev + amt : tx.transaction_type === "payment" ? prev - amt : prev
      );
    });

    const result: AnalysisRow[] = [];

    dateMap.forEach((dates, key) => {
      const [client, branch] = key.split("|||");
      const sorted = [...new Set(dates)].sort();
      const totalOrders = sorted.length;
      const lastOrderDate = sorted[totalOrders - 1] ?? null;
      const firstOrderDate = sorted[0] ?? null;

      let avgDays: number | null = null;
      let expectedNext: string | null = null;

      if (totalOrders > 1 && firstOrderDate && lastOrderDate) {
        const firstMs = new Date(firstOrderDate).getTime();
        const lastMs = new Date(lastOrderDate).getTime();
        avgDays = Math.round((lastMs - firstMs) / ((totalOrders - 1) * 86400000));
        if (avgDays > 0) {
          expectedNext = new Date(lastMs + avgDays * 86400000).toISOString().split("T")[0];
        }
      }

      let daysOverdue = 0;
      if (expectedNext) {
        const expMs = new Date(expectedNext).getTime();
        if (today.getTime() > expMs) {
          daysOverdue = daysDiff(expMs, today.getTime());
        }
      }

      result.push({
        client,
        branch,
        outstanding: outstandingMap.get(key) ?? 0,
        lastOrderDate,
        avgDays,
        expectedNext,
        daysOverdue,
        status: computeStatus(totalOrders, expectedNext, daysOverdue),
        totalOrders,
      });
    });

    return result.sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 6) - (STATUS_ORDER[b.status] ?? 6);
      if (so !== 0) return so;
      return b.daysOverdue - a.daysOverdue;
    });
  }, [rawOrders, rawDispatch, rawTx]);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Order Analysis — Expected Next Order</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Per client &amp; branch · Avg days between orders based on full order history (pending + dispatched)
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="py-2 px-4">Client</TableHead>
                <TableHead className="py-2 px-4">Branch</TableHead>
                <TableHead className="py-2 px-4 text-right">Outstanding (₹)</TableHead>
                <TableHead className="py-2 px-4">Last Order</TableHead>
                <TableHead className="py-2 px-4 text-right">Avg Days</TableHead>
                <TableHead className="py-2 px-4">Expected Next</TableHead>
                <TableHead className="py-2 px-4 text-right">Days Overdue</TableHead>
                <TableHead className="py-2 px-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No order data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={`${row.client}|||${row.branch}`}
                    className={
                      row.status === "OVERDUE"
                        ? "bg-red-50 hover:bg-red-100"
                        : row.status === "DUE SOON"
                        ? "bg-amber-50 hover:bg-amber-100"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium py-2 px-4">{row.client}</TableCell>
                    <TableCell className="text-muted-foreground py-2 px-4">{row.branch || "—"}</TableCell>
                    <TableCell className="text-right py-2 px-4">
                      <span
                        className={
                          row.outstanding > 0
                            ? "font-medium text-red-600"
                            : row.outstanding < 0
                            ? "font-medium text-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {row.outstanding === 0
                          ? "—"
                          : `₹${Math.round(Math.abs(row.outstanding)).toLocaleString("en-IN")}${row.outstanding < 0 ? " (cr)" : ""}`}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-4 text-sm">{fmtDate(row.lastOrderDate)}</TableCell>
                    <TableCell className="text-right py-2 px-4 text-sm">
                      {row.avgDays !== null ? `${row.avgDays}d` : "—"}
                    </TableCell>
                    <TableCell className="py-2 px-4 text-sm">{fmtDate(row.expectedNext)}</TableCell>
                    <TableCell className="text-right py-2 px-4 text-sm font-medium">
                      {row.daysOverdue > 0 ? (
                        <span className="text-red-600">{row.daysOverdue}d</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <StatusBadge status={row.status} daysOverdue={row.daysOverdue} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderAnalysis;
