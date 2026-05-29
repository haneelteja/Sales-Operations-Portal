import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportJsonToExcel } from "@/services/export/excelExport";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfitRow {
  clientId: string | null;
  clientName: string;
  branch: string;
  cases: number;
  invoiceValue: number;
  factoryCost: number;
  labelsCost: number;
  transportCost: number;
  totalExpense: number;
  profit: number;
  margin: number;
}

type SortKey = Exclude<keyof ProfitRow, "clientId" | "clientName" | "branch">;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 3 + i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateRange(year: number, months: number[]) {
  if (months.length === 0) {
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
  }
  const sorted = [...months].sort((a, b) => a - b);
  const maxM = sorted[sorted.length - 1];
  const lastDay = new Date(year, maxM, 0).getDate();
  return {
    startDate: `${year}-${String(sorted[0]).padStart(2, "0")}-01`,
    endDate: `${year}-${String(maxM).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function inPeriod(dateStr: string | null | undefined, year: number, months: number[]): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (d.getFullYear() !== year) return false;
  return months.length === 0 || months.includes(d.getMonth() + 1);
}

function effectiveCostPerCase(
  sku: string,
  productionDate: string,
  pricing: Array<{ sku: string; cost_per_case: number | null; pricing_date: string }>,
): number {
  const best = pricing
    .filter((p) => p.sku === sku && p.pricing_date <= productionDate && p.cost_per_case != null)
    .sort((a, b) => b.pricing_date.localeCompare(a.pricing_date))[0];
  return best?.cost_per_case ?? 0;
}

const fmtINR = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  accent?: "green" | "red" | "none";
}) {
  return (
    <Card className={cn(
      accent === "green" && "border-green-200 bg-green-50",
      accent === "red" && "border-red-200 bg-red-50",
    )}>
      <CardContent className="pt-4 pb-4 px-4">
        <p className={cn(
          "text-xs font-medium uppercase tracking-wide",
          accent === "green" ? "text-green-700" : accent === "red" ? "text-red-700" : "text-muted-foreground",
        )}>
          {title}
        </p>
        <p className={cn(
          "text-xl font-bold mt-1 truncate",
          accent === "green" && "text-green-700",
          accent === "red" && "text-red-700",
        )}>
          {value}
        </p>
        {sub && (
          <p className={cn(
            "text-xs mt-0.5",
            accent === "green" ? "text-green-600" : accent === "red" ? "text-red-600" : "text-muted-foreground",
          )}>
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SortableHead({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
  right,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (col: SortKey) => void;
  right?: boolean;
}) {
  const active = sortKey === col;
  return (
    <TableHead
      className={cn("py-2 px-4 font-semibold cursor-pointer select-none whitespace-nowrap", right && "text-right")}
      onClick={() => onSort(col)}
    >
      <div className={cn("flex items-center gap-1", right && "justify-end")}>
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Profitability: React.FC = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [months, setMonths] = useState<number[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("invoiceValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { startDate, endDate } = useMemo(() => buildDateRange(year, months), [year, months]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: salesRaw = [], isLoading: loadingSales } = useQuery({
    queryKey: ["prof-sales", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select("customer_id, total_amount, transaction_date, customers(client_name, branch)")
        .eq("transaction_type", "sale")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate);
      return (data ?? []) as Array<{
        customer_id: string;
        total_amount: number;
        transaction_date: string;
        customers: { client_name: string; branch: string | null } | null;
      }>;
    },
  });

  const { data: dispatchRaw = [], isLoading: loadingDispatch } = useQuery({
    queryKey: ["prof-dispatch", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders_dispatch")
        .select("customer_id, client, branch, cases, delivery_date")
        .not("delivery_date", "is", null)
        .gte("delivery_date", startDate)
        .lte("delivery_date", endDate);
      return (data ?? []) as Array<{
        customer_id: string | null;
        client: string;
        branch: string | null;
        cases: number;
        delivery_date: string;
      }>;
    },
  });

  const { data: productionRaw = [], isLoading: loadingProd } = useQuery({
    queryKey: ["prof-production", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("production")
        .select("no_of_cases, sku, production_date")
        .gte("production_date", startDate)
        .lte("production_date", endDate);
      return (data ?? []) as Array<{
        no_of_cases: number;
        sku: string;
        production_date: string;
      }>;
    },
  });

  const { data: pricingRaw = [] } = useQuery({
    queryKey: ["prof-pricing"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_pricing")
        .select("sku, cost_per_case, pricing_date");
      return (data ?? []) as Array<{
        sku: string;
        cost_per_case: number | null;
        pricing_date: string;
      }>;
    },
  });

  const { data: labelsRaw = [], isLoading: loadingLabels } = useQuery({
    queryKey: ["prof-labels", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("total_amount, purchase_date")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);
      return (data ?? []) as Array<{ total_amount: number; purchase_date: string }>;
    },
  });

  const { data: backLabelsRaw = [], isLoading: loadingBackLabels } = useQuery({
    queryKey: ["prof-back-labels", startDate, endDate],
    queryFn: async () => {
      // back_label_purchases is not in generated types, cast needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("back_label_purchases")
        .select("total_amount, purchase_date")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);
      return (data ?? []) as Array<{ total_amount: number; purchase_date: string }>;
    },
  });

  const { data: transportRaw = [], isLoading: loadingTransport } = useQuery({
    queryKey: ["prof-transport", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("transport_expenses")
        .select("client_id, amount, expense_date")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      return (data ?? []) as Array<{
        client_id: string | null;
        amount: number;
        expense_date: string;
      }>;
    },
  });

  const isLoading =
    loadingSales || loadingDispatch || loadingProd || loadingLabels || loadingBackLabels || loadingTransport;

  // ── Computation ────────────────────────────────────────────────────────────

  const { rows, summary } = useMemo(() => {
    // Re-filter by specific months when selection is non-contiguous
    const sales = salesRaw.filter((r) => inPeriod(r.transaction_date, year, months));
    const dispatch = dispatchRaw.filter((r) => inPeriod(r.delivery_date, year, months));
    const production = productionRaw.filter((r) => inPeriod(r.production_date, year, months));
    const labels = labelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const backLabels = backLabelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const transport = transportRaw.filter((r) => inPeriod(r.expense_date, year, months));

    // ── Global costs ─────────────────────────────────────────────────────────
    const totalFactoryCost = production.reduce(
      (sum, p) => sum + p.no_of_cases * effectiveCostPerCase(p.sku, p.production_date, pricingRaw),
      0,
    );
    const totalLabelsCost =
      labels.reduce((s, l) => s + (l.total_amount ?? 0), 0) +
      backLabels.reduce((s, l) => s + (l.total_amount ?? 0), 0);

    // ── Revenue per client (from sales_transactions) ──────────────────────────
    const revenueMap = new Map<string, { name: string; branch: string; revenue: number }>();
    for (const s of sales) {
      const cust = s.customers;
      const key = s.customer_id;
      if (!revenueMap.has(key)) {
        revenueMap.set(key, {
          name: cust?.client_name ?? "Unknown",
          branch: cust?.branch ?? "",
          revenue: 0,
        });
      }
      revenueMap.get(key)!.revenue += s.total_amount ?? 0;
    }

    // ── Dispatch cases per client ─────────────────────────────────────────────
    const casesMap = new Map<string, { name: string; branch: string; cases: number }>();
    for (const d of dispatch) {
      // Prefer customer_id as key; fall back to client name
      const key = d.customer_id ?? `__name__${d.client}`;
      if (!casesMap.has(key)) {
        casesMap.set(key, { name: d.client, branch: d.branch ?? "", cases: 0 });
      }
      casesMap.get(key)!.cases += d.cases ?? 0;
    }

    const totalCases = [...casesMap.values()].reduce((s, v) => s + v.cases, 0);

    // ── Transport per client ──────────────────────────────────────────────────
    const directTransportMap = new Map<string, number>();
    let unlinkedTransport = 0;
    for (const t of transport) {
      if (t.client_id) {
        directTransportMap.set(
          t.client_id,
          (directTransportMap.get(t.client_id) ?? 0) + (t.amount ?? 0),
        );
      } else {
        unlinkedTransport += t.amount ?? 0;
      }
    }

    // ── Build unified client rows ─────────────────────────────────────────────
    const allKeys = new Set([...revenueMap.keys(), ...casesMap.keys()]);
    const result: ProfitRow[] = [];

    for (const key of allKeys) {
      const rev = revenueMap.get(key);
      const disp = casesMap.get(key);
      const clientName = rev?.name ?? disp?.name ?? "Unknown";
      const branch = rev?.branch || disp?.branch || "";
      const invoiceValue = rev?.revenue ?? 0;
      const cases = disp?.cases ?? 0;

      // Proportional allocation of global costs (by case share)
      const caseFraction = totalCases > 0 ? cases / totalCases : 0;
      const factoryCost = totalFactoryCost * caseFraction;
      const labelsCost = totalLabelsCost * caseFraction;

      // Transport: direct (linked) + proportional share of unlinked transport
      const clientId = key.startsWith("__name__") ? null : key;
      const transportCost =
        (clientId ? (directTransportMap.get(clientId) ?? 0) : 0) +
        unlinkedTransport * caseFraction;

      const totalExpense = factoryCost + labelsCost + transportCost;
      const profit = invoiceValue - totalExpense;
      const margin = invoiceValue !== 0 ? (profit / invoiceValue) * 100 : 0;

      result.push({
        clientId,
        clientName,
        branch,
        cases,
        invoiceValue,
        factoryCost,
        labelsCost,
        transportCost,
        totalExpense,
        profit,
        margin,
      });
    }

    const summary = {
      clients: result.length,
      cases: result.reduce((s, r) => s + r.cases, 0),
      invoiceValue: result.reduce((s, r) => s + r.invoiceValue, 0),
      factoryCost: totalFactoryCost,
      labelsCost: totalLabelsCost,
      transportCost: result.reduce((s, r) => s + r.transportCost, 0),
      totalExpense: result.reduce((s, r) => s + r.totalExpense, 0),
      profit: result.reduce((s, r) => s + r.profit, 0),
    };

    return { rows: result, summary };
  }, [salesRaw, dispatchRaw, productionRaw, pricingRaw, labelsRaw, backLabelsRaw, transportRaw, year, months]);

  // ── Sorted rows ────────────────────────────────────────────────────────────

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [rows, sortKey, sortDir]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleMonth = useCallback((m: number) => {
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }, []);

  const handleSort = useCallback(
    (col: SortKey) => {
      if (sortKey === col) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(col);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  const handleExport = useCallback(async () => {
    if (!sortedRows.length) return;
    const data = sortedRows.map((r) => ({
      Client: r.clientName,
      Branch: r.branch || "—",
      "Cases Dispatched": r.cases,
      "Invoice Value (₹)": Math.round(r.invoiceValue),
      "Factory Cost (₹)": Math.round(r.factoryCost),
      "Labels Cost (₹)": Math.round(r.labelsCost),
      "Transport Cost (₹)": Math.round(r.transportCost),
      "Total Expense (₹)": Math.round(r.totalExpense),
      "Profit / Loss (₹)": Math.round(r.profit),
      "Margin (%)": r.margin.toFixed(1) + "%",
    }));
    const suffix =
      months.length > 0
        ? `_${months.map((m) => MONTH_LABELS[m - 1]).join("-")}`
        : "_Full_Year";
    await exportJsonToExcel(data, "Profitability", `Profitability_${year}${suffix}.xlsx`);
  }, [sortedRows, year, months]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const overallMargin =
    summary.invoiceValue > 0 ? (summary.profit / summary.invoiceValue) * 100 : 0;
  const isProfitable = summary.profit >= 0;

  const periodLabel =
    months.length === 0
      ? `Full Year ${year}`
      : months.length === 1
      ? `${MONTH_LABELS[months[0] - 1]} ${year}`
      : `${months.map((m) => MONTH_LABELS[m - 1]).join(", ")} ${year}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profitability</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Revenue vs expense analysis by client · {periodLabel}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={sortedRows.length === 0}
          className="shrink-0"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export Excel
        </Button>
      </div>

      {/* Date filter card */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Year selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Year</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                aria-label="Select year"
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-0.5">Months</span>
              <Button
                size="sm"
                variant={months.length === 0 ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setMonths([])}
              >
                All
              </Button>
              {MONTH_LABELS.map((label, i) => (
                <Button
                  key={label}
                  size="sm"
                  variant={months.includes(i + 1) ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => toggleMonth(i + 1)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard title="Active Clients" value={summary.clients.toString()} />
        <SummaryCard title="Total Cases" value={summary.cases.toLocaleString("en-IN")} />
        <SummaryCard title="Total Invoice Value" value={fmtINR(summary.invoiceValue)} accent="green" />
        <Card className={cn(isProfitable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1">
              {isProfitable ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              )}
              <p className={cn("text-xs font-medium uppercase tracking-wide", isProfitable ? "text-green-700" : "text-red-700")}>
                Net Profit
              </p>
            </div>
            <p className={cn("text-xl font-bold mt-1", isProfitable ? "text-green-700" : "text-red-700")}>
              {isProfitable ? "" : "−"}{fmtINR(summary.profit)}
            </p>
            <p className={cn("text-xs mt-0.5", isProfitable ? "text-green-600" : "text-red-600")}>
              {overallMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
        <SummaryCard title="Factory Cost" value={fmtINR(summary.factoryCost)} />
        <SummaryCard title="Labels Cost" value={fmtINR(summary.labelsCost)} />
        <SummaryCard title="Transport Cost" value={fmtINR(summary.transportCost)} />
        <SummaryCard title="Total Expense" value={fmtINR(summary.totalExpense)} accent="red" />
      </div>

      {/* Allocation note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 border rounded-md px-3 py-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Factory and label costs are global and allocated to each client proportionally based on their share of total dispatched cases.
          Transport costs linked directly to a client are applied as-is; unlinked transport is also allocated by case share.
        </span>
      </div>

      {/* Per-client table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Client-wise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="py-2 px-4 font-semibold whitespace-nowrap">Client</TableHead>
                  <TableHead className="py-2 px-4 font-semibold whitespace-nowrap">Branch</TableHead>
                  <SortableHead label="Cases" col="cases" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Invoice Value" col="invoiceValue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Factory Cost" col="factoryCost" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Labels Cost" col="labelsCost" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Transport" col="transportCost" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Total Expense" col="totalExpense" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Profit / Loss" col="profit" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                  <SortableHead label="Margin %" col="margin" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} right />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : sortedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      No data for the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((r) => (
                    <TableRow
                      key={`${r.clientName}|||${r.branch}`}
                      className={r.profit < 0 ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}
                    >
                      <TableCell className="font-medium py-2.5 px-4 whitespace-nowrap">{r.clientName}</TableCell>
                      <TableCell className="text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                        {r.branch || "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right font-mono">
                        {r.cases.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right font-medium">
                        {fmtINR(r.invoiceValue)}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right text-muted-foreground">
                        {fmtINR(r.factoryCost)}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right text-muted-foreground">
                        {fmtINR(r.labelsCost)}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right text-muted-foreground">
                        {r.transportCost > 0 ? fmtINR(r.transportCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-4 text-right">
                        {fmtINR(r.totalExpense)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-2.5 px-4 text-right font-semibold",
                          r.profit >= 0 ? "text-green-700" : "text-red-700",
                        )}
                      >
                        {r.profit < 0 ? "−" : ""}
                        {fmtINR(r.profit)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "py-2.5 px-4 text-right font-medium",
                          r.margin >= 20
                            ? "text-green-700"
                            : r.margin >= 0
                            ? "text-amber-700"
                            : "text-red-700",
                        )}
                      >
                        {r.margin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals footer */}
          {sortedRows.length > 0 && (
            <div className="border-t px-4 py-3 bg-slate-50 flex flex-wrap gap-x-8 gap-y-1 text-sm font-medium">
              <span className="text-muted-foreground font-normal">Totals</span>
              <span>Cases: <strong>{summary.cases.toLocaleString("en-IN")}</strong></span>
              <span>Invoice: <strong>{fmtINR(summary.invoiceValue)}</strong></span>
              <span>Expense: <strong>{fmtINR(summary.totalExpense)}</strong></span>
              <span className={isProfitable ? "text-green-700" : "text-red-700"}>
                {isProfitable ? "Profit" : "Loss"}:{" "}
                <strong>
                  {isProfitable ? "" : "−"}
                  {fmtINR(summary.profit)}
                </strong>
              </span>
              <span className={isProfitable ? "text-green-700" : "text-red-700"}>
                Margin: <strong>{overallMargin.toFixed(1)}%</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profitability;
