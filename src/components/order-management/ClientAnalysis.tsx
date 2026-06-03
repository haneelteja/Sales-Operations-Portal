import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColumnFilter } from "@/components/ui/column-filter";
import { Pagination } from "@/components/ui/pagination";
import { PageSizeSelector } from "@/components/ui/page-size-selector";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Download } from "lucide-react";

interface ClientAnalysisRow {
  client: string;
  branch: string;
  clientRisk: number;
  creditLimit: number;
  utilization: number;
  status: string;
  outstanding: number;
}

const STATUS_ORDER: Record<string, number> = {
  "OVER LIMIT": 0,
  WARNING: 1,
  CAUTION: 2,
  OK: 3,
  "No History": 4,
};

const STATUS_OPTIONS = ["OVER LIMIT", "WARNING", "CAUTION", "OK", "No History"];

function computeCreditStatus(creditLimit: number, utilization: number): string {
  if (creditLimit === 0) return "No History";
  if (utilization > 1) return "OVER LIMIT";
  if (utilization > 0.8) return "WARNING";
  if (utilization > 0.6) return "CAUTION";
  return "OK";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "OVER LIMIT")
    return <Badge variant="destructive">⛔ OVER LIMIT</Badge>;
  if (status === "WARNING")
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">⚠️ WARNING</Badge>;
  if (status === "CAUTION")
    return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">🟡 CAUTION</Badge>;
  if (status === "OK")
    return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">✅ OK</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const ClientAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [colFilters, setColFilters] = useState({ client: "", branch: "", status: "" });

  const [colSorts, setColSorts] = useState<Record<string, "asc" | "desc" | null>>({
    client: null,
    branch: null,
    clientRisk: null,
    creditLimit: null,
    utilization: null,
    status: null,
  });

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    setColFilters((prev) => ({ ...prev, [key]: Array.isArray(value) ? (value[0] ?? "") : value }));
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

  const { data: rawTx = [] } = useQuery({
    queryKey: ["client-analysis-tx"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select("transaction_type, amount, transaction_date, customers(client_name, branch, is_deprecated)")
        .order("transaction_date", { ascending: true });
      return (data ?? []) as Array<{
        transaction_type: string;
        amount: number | null;
        transaction_date: string | null;
        customers: { client_name: string; branch: string; is_deprecated: boolean } | null;
      }>;
    },
  });

  const baseRows = useMemo<ClientAnalysisRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    interface Bucket {
      txs: Array<{ type: string; amount: number; date: string }>;
      monthsSet: Set<string>;
    }

    const buckets = new Map<string, Bucket>();

    for (const tx of rawTx) {
      const cust = tx.customers;
      if (!cust?.client_name) continue;
      if (cust.is_deprecated) continue;
      const key = `${cust.client_name.trim()}|||${(cust.branch ?? "").trim()}`;
      if (!buckets.has(key)) buckets.set(key, { txs: [], monthsSet: new Set() });
      const b = buckets.get(key)!;
      if (tx.transaction_date) {
        b.txs.push({ type: tx.transaction_type, amount: tx.amount ?? 0, date: tx.transaction_date });
        b.monthsSet.add(tx.transaction_date.substring(0, 7));
      }
    }

    const result: ClientAnalysisRow[] = [];

    for (const [key, b] of buckets) {
      const [client, branch] = key.split("|||");

      // Compute metrics from chronologically-sorted transactions
      let totalRevenue = 0;
      let totalPaid = 0;
      let runningBalance = 0;
      let riskScore = 0;

      for (const tx of b.txs) {
        const amt = tx.amount;
        if (tx.type === "sale") {
          totalRevenue += amt;
          runningBalance += amt;
        } else if (tx.type === "payment") {
          totalPaid += amt;
          runningBalance -= amt;
        }
        // Aged outstanding exposure: how long has this balance been sitting?
        // Each transaction checkpoint where the client owes us money contributes
        // (days since that transaction) × (current balance) / 10000 to risk.
        if (runningBalance > 0) {
          const txMs = new Date(tx.date).setHours(0, 0, 0, 0);
          const daysSince = Math.max(0, Math.round((todayMs - txMs) / 86400000));
          riskScore += (daysSince * runningBalance) / 10000;
        }
      }

      const outstanding = totalRevenue - totalPaid;
      const monthsActive = b.monthsSet.size || 1;
      const avgMonthlyRevenue = totalRevenue / monthsActive;
      const paymentRatio = totalRevenue > 0 ? totalPaid / totalRevenue : 0;
      const creditLimit = Math.round(avgMonthlyRevenue * 2 * paymentRatio);
      const utilization = creditLimit > 0 ? outstanding / creditLimit : 0;
      const status = computeCreditStatus(creditLimit, utilization);

      result.push({
        client,
        branch,
        clientRisk: Math.round(riskScore),
        creditLimit,
        utilization,
        status,
        outstanding,
      });
    }

    return result.sort((a, b) => {
      const so = (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5);
      if (so !== 0) return so;
      return b.utilization - a.utilization;
    });
  }, [rawTx]);

  const uniqueClients = useMemo(() => [...new Set(baseRows.map((r) => r.client))].sort(), [baseRows]);
  const uniqueBranches = useMemo(() => [...new Set(baseRows.map((r) => r.branch).filter(Boolean))].sort(), [baseRows]);

  const filteredRows = useMemo(() => {
    let rows = baseRows;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.client.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
      );
    }

    if (colFilters.client) rows = rows.filter((r) => r.client.toLowerCase().includes(colFilters.client.toLowerCase()));
    if (colFilters.branch) rows = rows.filter((r) => r.branch.toLowerCase().includes(colFilters.branch.toLowerCase()));
    if (colFilters.status) rows = rows.filter((r) => r.status === colFilters.status);

    const sortKey = Object.keys(colSorts).find((k) => colSorts[k] !== null);
    if (sortKey) {
      const dir = colSorts[sortKey]!;
      rows = [...rows].sort((a, b) => {
        let av: string | number = 0;
        let bv: string | number = 0;
        switch (sortKey) {
          case "client":      av = a.client.toLowerCase();       bv = b.client.toLowerCase();       break;
          case "branch":      av = a.branch.toLowerCase();       bv = b.branch.toLowerCase();       break;
          case "clientRisk":  av = a.clientRisk;                 bv = b.clientRisk;                 break;
          case "creditLimit": av = a.creditLimit;                bv = b.creditLimit;                break;
          case "utilization": av = a.utilization;                bv = b.utilization;                break;
          case "status":      av = STATUS_ORDER[a.status] ?? 5;  bv = STATUS_ORDER[b.status] ?? 5;  break;
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

  const handleExport = useCallback(async () => {
    if (!filteredRows.length) return;
    const exportData = filteredRows.map((r) => ({
      Client: r.client,
      Branch: r.branch || "",
      "Client Risk Score": r.clientRisk,
      "Credit Limit (₹)": r.creditLimit,
      "Utilization %": `${(r.utilization * 100).toFixed(1)}%`,
      "Credit Limit Status": r.status,
      "Outstanding (₹)": Math.round(r.outstanding),
    }));
    await exportJsonToExcel(
      exportData,
      "Client Analysis",
      `Client_Analysis_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  }, [filteredRows]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Client Analysis — Credit &amp; Risk</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Per client &amp; branch · Credit limit = Avg monthly revenue × 2 × payment ratio · Risk = aged outstanding exposure score
            </p>
          </div>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search clients..."
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
                    Client Risk
                    <ColumnFilter
                      columnKey="clientRisk"
                      columnName="Client Risk"
                      filterValue=""
                      onFilterChange={() => {}}
                      onClearFilter={() => {}}
                      sortDirection={colSorts.clientRisk}
                      onSortChange={(d) => handleSortChange("clientRisk", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    Credit Limit
                    <ColumnFilter
                      columnKey="creditLimit"
                      columnName="Credit Limit"
                      filterValue=""
                      onFilterChange={() => {}}
                      onClearFilter={() => {}}
                      sortDirection={colSorts.creditLimit}
                      onSortChange={(d) => handleSortChange("creditLimit", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    Utilization %
                    <ColumnFilter
                      columnKey="utilization"
                      columnName="Utilization %"
                      filterValue=""
                      onFilterChange={() => {}}
                      onClearFilter={() => {}}
                      sortDirection={colSorts.utilization}
                      onSortChange={(d) => handleSortChange("utilization", d)}
                      dataType="number"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-2 px-4">
                  <div className="flex items-center gap-1">
                    Credit Limit Status
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No client data available
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row) => (
                  <TableRow
                    key={`${row.client}|||${row.branch}`}
                    className={
                      row.status === "OVER LIMIT"
                        ? "bg-red-50 hover:bg-red-100"
                        : row.status === "WARNING"
                        ? "bg-amber-50 hover:bg-amber-100"
                        : row.status === "CAUTION"
                        ? "bg-yellow-50 hover:bg-yellow-100"
                        : "hover:bg-slate-50"
                    }
                  >
                    <TableCell className="font-medium py-2 px-4">{row.client}</TableCell>
                    <TableCell className="text-muted-foreground py-2 px-4">{row.branch || "—"}</TableCell>
                    <TableCell className="text-right py-2 px-4 font-mono text-sm">
                      {row.clientRisk.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right py-2 px-4 text-sm font-medium">
                      {row.creditLimit > 0 ? fmtINR(row.creditLimit) : "—"}
                    </TableCell>
                    <TableCell className="text-right py-2 px-4 text-sm">
                      {row.creditLimit > 0 ? (
                        <span
                          className={
                            row.utilization > 1
                              ? "font-bold text-red-600"
                              : row.utilization > 0.8
                              ? "font-medium text-amber-700"
                              : row.utilization > 0.6
                              ? "font-medium text-yellow-700"
                              : "text-foreground"
                          }
                        >
                          {(row.utilization * 100).toFixed(1)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-4">
                      <StatusBadge status={row.status} />
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

export default ClientAnalysis;
