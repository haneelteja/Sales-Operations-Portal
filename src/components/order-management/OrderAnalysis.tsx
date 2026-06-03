import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getQueryConfig } from "@/lib/query-configs";
import { ColumnFilter } from "@/components/ui/column-filter";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Download } from "lucide-react";

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

const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  "DUE SOON": 1,
  "ON TRACK": 2,
  "Only 1 Order": 3,
  "N/A": 4,
  "No Orders": 5,
};

const STATUS_OPTIONS = ["OVERDUE", "DUE SOON", "ON TRACK", "Only 1 Order", "N/A", "No Orders"];

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

function StatusBadge({ status, daysOverdue }: { status: string; daysOverdue: number }) {
  if (status === "OVERDUE")
    return <Badge variant="destructive">OVERDUE ({daysOverdue}d)</Badge>;
  if (status === "DUE SOON")
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">DUE SOON</Badge>;
  if (status === "ON TRACK")
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">ON TRACK</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const OrderAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [colFilters, setColFilters] = useState({
    client: "",
    branch: "",
    outstanding: "",
    lastOrderDate: "",
    avgDays: "",
    expectedNext: "",
    status: "",
  });

  const [colSorts, setColSorts] = useState<Record<string, "asc" | "desc" | null>>({
    client: null,
    branch: null,
    outstanding: null,
    lastOrderDate: null,
    avgDays: null,
    expectedNext: null,
    daysOverdue: null,
    status: null,
  });

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    setColFilters((prev) => ({ ...prev, [key]: Array.isArray(value) ? value[0] ?? "" : value }));
    setPage(1);
  }, []);

  const handleSortChange = useCallback((key: string, direction: "asc" | "desc" | null) => {
    setColSorts((prev) => {
      const next: Record<string, "asc" | "desc" | null> = {};
      Object.keys(prev).forEach((k) => { next[k] = null; });
      next[key] = direction;
      return next;
    });
  }, []);

  // ── Data Queries ──────────────────────────────────────────────────────────────

  const { data: rawTx = [] } = useQuery({
    queryKey: ["order-analysis-transactions"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select("transaction_type, amount, transaction_date, customers(client_name, branch)");
      return (data || []) as Array<{
        transaction_type: string;
        amount: number | null;
        transaction_date: string | null;
        customers: { client_name: string; branch: string } | null;
      }>;
    },
  });

  // ── Compute base analysis rows ────────────────────────────────────────────────

  const baseRows = useMemo<AnalysisRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateMap = new Map<string, string[]>();
    const outstandingMap = new Map<string, number>();

    rawTx.forEach((tx) => {
      const cust = tx.customers;
      if (!cust?.client_name) return;
      const key = `${cust.client_name.trim()}|||${(cust.branch || "").trim()}`;

      // Outstanding balance
      const prev = outstandingMap.get(key) ?? 0;
      const amt = tx.amount ?? 0;
      outstandingMap.set(
        key,
        tx.transaction_type === "sale" ? prev + amt : tx.transaction_type === "payment" ? prev - amt : prev
      );

      // Order date history — only from sale transactions
      if (tx.transaction_type === "sale" && tx.transaction_date) {
        const d = tx.transaction_date.split("T")[0];
        if (d && d !== "null") {
          const arr = dateMap.get(key);
          if (arr) arr.push(d);
          else dateMap.set(key, [d]);
        }
      }
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
          daysOverdue = Math.round((today.getTime() - expMs) / 86400000);
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

    // Default sort: OVERDUE first, then by daysOverdue desc
    return result.sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 6) - (STATUS_ORDER[b.status] ?? 6);
      if (so !== 0) return so;
      return b.daysOverdue - a.daysOverdue;
    });
  }, [rawTx]);

  // ── Unique values for filter dropdowns ────────────────────────────────────────

  const uniqueClients = useMemo(() => [...new Set(baseRows.map((r) => r.client))].sort(), [baseRows]);
  const uniqueBranches = useMemo(() => [...new Set(baseRows.map((r) => r.branch).filter(Boolean))].sort(), [baseRows]);

  // ── Filter + sort ─────────────────────────────────────────────────────────────

  const filteredRows = useMemo(() => {
    let rows = baseRows;

    // Global search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.client.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          (r.lastOrderDate || "").includes(q) ||
          (r.expectedNext || "").includes(q) ||
          (r.avgDays !== null ? String(r.avgDays) : "").includes(q)
      );
    }

    // Column filters
    if (colFilters.client) rows = rows.filter((r) => r.client.toLowerCase().includes(colFilters.client.toLowerCase()));
    if (colFilters.branch) rows = rows.filter((r) => r.branch.toLowerCase().includes(colFilters.branch.toLowerCase()));
    if (colFilters.outstanding) {
      const n = parseFloat(colFilters.outstanding);
      if (!isNaN(n)) rows = rows.filter((r) => Math.round(r.outstanding) === Math.round(n));
    }
    if (colFilters.lastOrderDate) rows = rows.filter((r) => (r.lastOrderDate || "").startsWith(colFilters.lastOrderDate));
    if (colFilters.avgDays) {
      const n = parseInt(colFilters.avgDays);
      if (!isNaN(n)) rows = rows.filter((r) => r.avgDays === n);
    }
    if (colFilters.expectedNext) rows = rows.filter((r) => (r.expectedNext || "").startsWith(colFilters.expectedNext));
    if (colFilters.status) rows = rows.filter((r) => r.status === colFilters.status);

    // Column sort
    const sortKey = Object.keys(colSorts).find((k) => colSorts[k] !== null);
    if (sortKey) {
      const dir = colSorts[sortKey]!;
      rows = [...rows].sort((a, b) => {
        let av: string | number = 0;
        let bv: string | number = 0;
        switch (sortKey) {
          case "client":       av = a.client.toLowerCase(); bv = b.client.toLowerCase(); break;
          case "branch":       av = a.branch.toLowerCase(); bv = b.branch.toLowerCase(); break;
          case "outstanding":  av = a.outstanding; bv = b.outstanding; break;
          case "lastOrderDate":av = a.lastOrderDate ?? ""; bv = b.lastOrderDate ?? ""; break;
          case "avgDays":      av = a.avgDays ?? -1; bv = b.avgDays ?? -1; break;
          case "expectedNext": av = a.expectedNext ?? ""; bv = b.expectedNext ?? ""; break;
          case "daysOverdue":  av = a.daysOverdue; bv = b.daysOverdue; break;
          case "status":       av = STATUS_ORDER[a.status] ?? 6; bv = STATUS_ORDER[b.status] ?? 6; break;
        }
        if (av < bv) return dir === "asc" ? -1 : 1;
        if (av > bv) return dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [baseRows, debouncedSearch, colFilters, colSorts]);

  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * pageSize, page * pageSize),
    [filteredRows, page, pageSize]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  // ── Export ────────────────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!filteredRows.length) return;
    const data = filteredRows.map((r) => ({
      Client: r.client,
      Branch: r.branch || "",
      "Outstanding (₹)": Math.round(r.outstanding),
      "Last Order Date": r.lastOrderDate ?? "",
      "Avg Days Between Orders": r.avgDays ?? "",
      "Expected Next Order": r.expectedNext ?? "",
      "Days Overdue": r.daysOverdue || "",
      Status: r.status,
      "Total Orders": r.totalOrders,
    }));
    await exportJsonToExcel(data, "Order Analysis", `Order_Analysis_${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [filteredRows]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Order Analysis — Expected Next Order</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per client &amp; branch · Avg days between orders based on client transaction history
            </p>
          </div>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search analysis..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!filteredRows.length}
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Client
                    <ColumnFilter
                      columnKey="client"
                      columnName="Client"
                      filterValue={colFilters.client}
                      onFilterChange={(v) => handleFilterChange("client", v)}
                      onClearFilter={() => handleFilterChange("client", "")}
                      sortDirection={colSorts.client}
                      onSortChange={(d) => handleSortChange("client", d)}
                      dataType="text"
                      options={uniqueClients}
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Branch
                    <ColumnFilter
                      columnKey="branch"
                      columnName="Branch"
                      filterValue={colFilters.branch}
                      onFilterChange={(v) => handleFilterChange("branch", v)}
                      onClearFilter={() => handleFilterChange("branch", "")}
                      sortDirection={colSorts.branch}
                      onSortChange={(d) => handleSortChange("branch", d)}
                      dataType="text"
                      options={uniqueBranches}
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    Outstanding (₹)
                    <ColumnFilter
                      columnKey="outstanding"
                      columnName="Outstanding"
                      filterValue={colFilters.outstanding}
                      onFilterChange={(v) => handleFilterChange("outstanding", v)}
                      onClearFilter={() => handleFilterChange("outstanding", "")}
                      sortDirection={colSorts.outstanding}
                      onSortChange={(d) => handleSortChange("outstanding", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Last Order
                    <ColumnFilter
                      columnKey="lastOrderDate"
                      columnName="Last Order"
                      filterValue={colFilters.lastOrderDate}
                      onFilterChange={(v) => handleFilterChange("lastOrderDate", v)}
                      onClearFilter={() => handleFilterChange("lastOrderDate", "")}
                      sortDirection={colSorts.lastOrderDate}
                      onSortChange={(d) => handleSortChange("lastOrderDate", d)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    Avg Days
                    <ColumnFilter
                      columnKey="avgDays"
                      columnName="Avg Days"
                      filterValue={colFilters.avgDays}
                      onFilterChange={(v) => handleFilterChange("avgDays", v)}
                      onClearFilter={() => handleFilterChange("avgDays", "")}
                      sortDirection={colSorts.avgDays}
                      onSortChange={(d) => handleSortChange("avgDays", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Expected Next
                    <ColumnFilter
                      columnKey="expectedNext"
                      columnName="Expected Next"
                      filterValue={colFilters.expectedNext}
                      onFilterChange={(v) => handleFilterChange("expectedNext", v)}
                      onClearFilter={() => handleFilterChange("expectedNext", "")}
                      sortDirection={colSorts.expectedNext}
                      onSortChange={(d) => handleSortChange("expectedNext", d)}
                      dataType="date"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    Days Overdue
                    <ColumnFilter
                      columnKey="daysOverdue"
                      columnName="Days Overdue"
                      filterValue={""}
                      onFilterChange={() => {}}
                      onClearFilter={() => {}}
                      sortDirection={colSorts.daysOverdue}
                      onSortChange={(d) => handleSortChange("daysOverdue", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Status
                    <ColumnFilter
                      columnKey="status"
                      columnName="Status"
                      filterValue={colFilters.status}
                      onFilterChange={(v) => handleFilterChange("status", v)}
                      onClearFilter={() => handleFilterChange("status", "")}
                      sortDirection={colSorts.status}
                      onSortChange={(d) => handleSortChange("status", d)}
                      dataType="text"
                      options={STATUS_OPTIONS}
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No order data available
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row) => (
                  <TableRow
                    key={`${row.client}|||${row.branch}`}
                    className={
                      row.status === "OVERDUE"
                        ? "bg-red-50 hover:bg-red-100"
                        : row.status === "DUE SOON"
                        ? "bg-amber-50 hover:bg-amber-100"
                        : "hover:bg-slate-50"
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
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <PageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            totalRecords={filteredRows.length}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filteredRows.length}
            pageSize={pageSize}
            onNextPage={() => setPage((p) => Math.min(p + 1, totalPages))}
            onPreviousPage={() => setPage((p) => Math.max(p - 1, 1))}
            onFirstPage={() => setPage(1)}
            onLastPage={() => setPage(totalPages)}
            onPageChange={setPage}
            hasNextPage={page < totalPages}
            hasPreviousPage={page > 1}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderAnalysis;
