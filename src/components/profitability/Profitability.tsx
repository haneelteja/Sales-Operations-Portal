import React, { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnFilter } from "@/components/ui/column-filter";
import { Download, TrendingUp, TrendingDown, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

interface ColFilters {
  clientName: string[];
  branch: string[];
  cases: string;
  invoiceValue: string;
  factoryCost: string;
  labelsCost: string;
  transportCost: string;
  totalExpense: string;
  profit: string;
  margin: string;
}

const EMPTY_FILTERS: ColFilters = {
  clientName: [],
  branch: [],
  cases: "",
  invoiceValue: "",
  factoryCost: "",
  labelsCost: "",
  transportCost: "",
  totalExpense: "",
  profit: "",
  margin: "",
};

const SORT_COLS = [
  "clientName",
  "branch",
  "cases",
  "invoiceValue",
  "factoryCost",
  "labelsCost",
  "transportCost",
  "totalExpense",
  "profit",
  "margin",
] as const;

type SortCol = (typeof SORT_COLS)[number];

const EMPTY_SORTS: Record<SortCol, "asc" | "desc" | null> = {
  clientName: null,
  branch: null,
  cases: null,
  invoiceValue: null,
  factoryCost: null,
  labelsCost: null,
  transportCost: null,
  totalExpense: null,
  profit: null,
  margin: null,
};

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

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  accent?: "green" | "red";
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

// ─── Main Component ───────────────────────────────────────────────────────────

const Profitability: React.FC = () => {
  // Date period state
  const [year, setYear] = useState(CURRENT_YEAR);
  const [months, setMonths] = useState<number[]>([]);

  // Table interaction state
  const [searchTerm, setSearchTerm] = useState("");
  const [colFilters, setColFilters] = useState<ColFilters>(EMPTY_FILTERS);
  const [colSorts, setColSorts] = useState<Record<SortCol, "asc" | "desc" | null>>(EMPTY_SORTS);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

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
      // back_label_purchases is not in generated types
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

  // ── Core computation (period rows, unfiltered) ────────────────────────────

  const { rows, summary } = useMemo(() => {
    const sales = salesRaw.filter((r) => inPeriod(r.transaction_date, year, months));
    const dispatch = dispatchRaw.filter((r) => inPeriod(r.delivery_date, year, months));
    const production = productionRaw.filter((r) => inPeriod(r.production_date, year, months));
    const labels = labelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const backLabels = backLabelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const transport = transportRaw.filter((r) => inPeriod(r.expense_date, year, months));

    // Global costs
    const totalFactoryCost = production.reduce(
      (sum, p) => sum + p.no_of_cases * effectiveCostPerCase(p.sku, p.production_date, pricingRaw),
      0,
    );
    const totalLabelsCost =
      labels.reduce((s, l) => s + (l.total_amount ?? 0), 0) +
      backLabels.reduce((s, l) => s + (l.total_amount ?? 0), 0);

    // Revenue per client
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

    // Dispatch cases per client
    const casesMap = new Map<string, { name: string; branch: string; cases: number }>();
    for (const d of dispatch) {
      const key = d.customer_id ?? `__name__${d.client}`;
      if (!casesMap.has(key)) {
        casesMap.set(key, { name: d.client, branch: d.branch ?? "", cases: 0 });
      }
      casesMap.get(key)!.cases += d.cases ?? 0;
    }

    const totalCases = [...casesMap.values()].reduce((s, v) => s + v.cases, 0);

    // Transport per client
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

    // Build unified client rows
    const allKeys = new Set([...revenueMap.keys(), ...casesMap.keys()]);
    const result: ProfitRow[] = [];

    for (const key of allKeys) {
      const rev = revenueMap.get(key);
      const disp = casesMap.get(key);
      const clientName = rev?.name ?? disp?.name ?? "Unknown";
      const branch = rev?.branch || disp?.branch || "";
      const invoiceValue = rev?.revenue ?? 0;
      const cases = disp?.cases ?? 0;

      const caseFraction = totalCases > 0 ? cases / totalCases : 0;
      const factoryCost = totalFactoryCost * caseFraction;
      const labelsCost = totalLabelsCost * caseFraction;

      const clientId = key.startsWith("__name__") ? null : key;
      const transportCost =
        (clientId ? (directTransportMap.get(clientId) ?? 0) : 0) +
        unlinkedTransport * caseFraction;

      const totalExpense = factoryCost + labelsCost + transportCost;
      const profit = invoiceValue - totalExpense;
      const margin = invoiceValue !== 0 ? (profit / invoiceValue) * 100 : 0;

      result.push({ clientId, clientName, branch, cases, invoiceValue, factoryCost, labelsCost, transportCost, totalExpense, profit, margin });
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

  // ── Filter option lists (derived from unfiltered rows) ────────────────────

  const uniqueClients = useMemo(
    () => [...new Set(rows.map((r) => r.clientName))].sort(),
    [rows],
  );
  const uniqueBranches = useMemo(
    () => [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort(),
    [rows],
  );

  // ── Display rows: search + column filters + sort ──────────────────────────

  const displayRows = useMemo(() => {
    let list = rows;

    // Global search (client name + branch)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q),
      );
    }

    // Column multiselect filters (client, branch)
    if (colFilters.clientName.length > 0) {
      list = list.filter((r) => colFilters.clientName.includes(r.clientName));
    }
    if (colFilters.branch.length > 0) {
      list = list.filter((r) => colFilters.branch.includes(r.branch));
    }

    // Numeric minimum-threshold filters
    const numericCols: Array<{ key: keyof ColFilters; field: keyof ProfitRow }> = [
      { key: "cases",         field: "cases" },
      { key: "invoiceValue",  field: "invoiceValue" },
      { key: "factoryCost",   field: "factoryCost" },
      { key: "labelsCost",    field: "labelsCost" },
      { key: "transportCost", field: "transportCost" },
      { key: "totalExpense",  field: "totalExpense" },
      { key: "profit",        field: "profit" },
      { key: "margin",        field: "margin" },
    ];
    for (const { key, field } of numericCols) {
      const raw = colFilters[key];
      if (typeof raw === "string" && raw !== "") {
        const threshold = parseFloat(raw);
        if (!isNaN(threshold)) {
          list = list.filter((r) => (r[field] as number) >= threshold);
        }
      }
    }

    // Column sort (single active column; default = invoice value desc)
    const activeSort = SORT_COLS.find((c) => colSorts[c] !== null);
    if (activeSort) {
      const dir = colSorts[activeSort]!;
      list = [...list].sort((a, b) => {
        let av: string | number = 0;
        let bv: string | number = 0;
        if (activeSort === "clientName") {
          av = a.clientName.toLowerCase(); bv = b.clientName.toLowerCase();
        } else if (activeSort === "branch") {
          av = a.branch.toLowerCase(); bv = b.branch.toLowerCase();
        } else {
          av = a[activeSort as keyof ProfitRow] as number;
          bv = b[activeSort as keyof ProfitRow] as number;
        }
        if (av < bv) return dir === "asc" ? -1 : 1;
        if (av > bv) return dir === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      list = [...list].sort((a, b) => b.invoiceValue - a.invoiceValue);
    }

    return list;
  }, [rows, debouncedSearch, colFilters, colSorts]);

  // ── Filtered totals (for table footer) ───────────────────────────────────

  const filteredTotals = useMemo(() => ({
    cases: displayRows.reduce((s, r) => s + r.cases, 0),
    invoiceValue: displayRows.reduce((s, r) => s + r.invoiceValue, 0),
    totalExpense: displayRows.reduce((s, r) => s + r.totalExpense, 0),
    profit: displayRows.reduce((s, r) => s + r.profit, 0),
  }), [displayRows]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleMonth = useCallback((m: number) => {
    setMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }, []);

  const handleFilterChange = useCallback((col: keyof ColFilters, value: string | string[]) => {
    setColFilters((prev) => ({ ...prev, [col]: value }));
  }, []);

  const handleClearFilter = useCallback((col: keyof ColFilters) => {
    setColFilters((prev) => ({
      ...prev,
      [col]: Array.isArray(prev[col]) ? [] : "",
    }));
  }, []);

  const handleSortChange = useCallback((col: SortCol, dir: "asc" | "desc" | null) => {
    setColSorts((prev) => {
      const next = { ...EMPTY_SORTS };
      next[col] = dir;
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (!displayRows.length) return;
    const data = displayRows.map((r) => ({
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
  }, [displayRows, year, months]);

  // ── Derived display values ────────────────────────────────────────────────

  const overallMargin =
    summary.invoiceValue > 0 ? (summary.profit / summary.invoiceValue) * 100 : 0;
  const isProfitable = summary.profit >= 0;

  const filteredMargin =
    filteredTotals.invoiceValue > 0
      ? (filteredTotals.profit / filteredTotals.invoiceValue) * 100
      : 0;
  const filteredProfitable = filteredTotals.profit >= 0;

  const periodLabel =
    months.length === 0
      ? `Full Year ${year}`
      : months.length === 1
      ? `${MONTH_LABELS[months[0] - 1]} ${year}`
      : `${months.map((m) => MONTH_LABELS[m - 1]).join(", ")} ${year}`;

  const hasActiveFilters =
    !!debouncedSearch ||
    colFilters.clientName.length > 0 ||
    colFilters.branch.length > 0 ||
    Object.values(colFilters).some((v) => typeof v === "string" && v !== "");

  // ── Render ────────────────────────────────────────────────────────────────

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
          disabled={displayRows.length === 0}
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Year</span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                aria-label="Select year"
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
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

      {/* Summary cards (period-wide, unaffected by table filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard title="Active Clients" value={summary.clients.toString()} />
        <SummaryCard title="Total Cases" value={summary.cases.toLocaleString("en-IN")} />
        <SummaryCard title="Total Invoice Value" value={fmtINR(summary.invoiceValue)} accent="green" />
        <Card className={cn(isProfitable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1">
              {isProfitable
                ? <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
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
          Factory and label costs are global and allocated to each client proportionally by their share of total dispatched cases.
          Unlinked transport is also allocated by case share.
          Numeric column filters show rows where the value is ≥ the entered threshold.
        </span>
      </div>

      {/* Per-client table */}
      <Card>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Client-wise Breakdown
              {hasActiveFilters && (
                <span className="ml-2 normal-case text-xs font-normal text-blue-600">
                  ({displayRows.length} of {rows.length} clients)
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => {
                    setSearchTerm("");
                    setColFilters(EMPTY_FILTERS);
                    setColSorts(EMPTY_SORTS);
                  }}
                >
                  Clear all filters
                </Button>
              )}
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search client or branch…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 w-56 text-sm"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  {/* Client */}
                  <TableHead className="py-2 pl-4 pr-1 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-0.5">
                      Client
                      <ColumnFilter
                        columnKey="clientName"
                        columnName="Client"
                        filterValue={colFilters.clientName}
                        onFilterChange={(v) => handleFilterChange("clientName", v)}
                        onClearFilter={() => handleClearFilter("clientName")}
                        sortDirection={colSorts.clientName}
                        onSortChange={(d) => handleSortChange("clientName", d)}
                        dataType="multiselect"
                        options={uniqueClients}
                      />
                    </div>
                  </TableHead>

                  {/* Branch */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-0.5">
                      Branch
                      <ColumnFilter
                        columnKey="branch"
                        columnName="Branch"
                        filterValue={colFilters.branch}
                        onFilterChange={(v) => handleFilterChange("branch", v)}
                        onClearFilter={() => handleClearFilter("branch")}
                        sortDirection={colSorts.branch}
                        onSortChange={(d) => handleSortChange("branch", d)}
                        dataType="multiselect"
                        options={uniqueBranches}
                      />
                    </div>
                  </TableHead>

                  {/* Cases */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Cases
                      <ColumnFilter
                        columnKey="cases"
                        columnName="Cases"
                        filterValue={colFilters.cases}
                        onFilterChange={(v) => handleFilterChange("cases", v as string)}
                        onClearFilter={() => handleClearFilter("cases")}
                        sortDirection={colSorts.cases}
                        onSortChange={(d) => handleSortChange("cases", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Invoice Value */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Invoice Value
                      <ColumnFilter
                        columnKey="invoiceValue"
                        columnName="Invoice Value"
                        filterValue={colFilters.invoiceValue}
                        onFilterChange={(v) => handleFilterChange("invoiceValue", v as string)}
                        onClearFilter={() => handleClearFilter("invoiceValue")}
                        sortDirection={colSorts.invoiceValue}
                        onSortChange={(d) => handleSortChange("invoiceValue", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Factory Cost */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Factory Cost
                      <ColumnFilter
                        columnKey="factoryCost"
                        columnName="Factory Cost"
                        filterValue={colFilters.factoryCost}
                        onFilterChange={(v) => handleFilterChange("factoryCost", v as string)}
                        onClearFilter={() => handleClearFilter("factoryCost")}
                        sortDirection={colSorts.factoryCost}
                        onSortChange={(d) => handleSortChange("factoryCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Labels Cost */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Labels Cost
                      <ColumnFilter
                        columnKey="labelsCost"
                        columnName="Labels Cost"
                        filterValue={colFilters.labelsCost}
                        onFilterChange={(v) => handleFilterChange("labelsCost", v as string)}
                        onClearFilter={() => handleClearFilter("labelsCost")}
                        sortDirection={colSorts.labelsCost}
                        onSortChange={(d) => handleSortChange("labelsCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Transport */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Transport
                      <ColumnFilter
                        columnKey="transportCost"
                        columnName="Transport"
                        filterValue={colFilters.transportCost}
                        onFilterChange={(v) => handleFilterChange("transportCost", v as string)}
                        onClearFilter={() => handleClearFilter("transportCost")}
                        sortDirection={colSorts.transportCost}
                        onSortChange={(d) => handleSortChange("transportCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Total Expense */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Total Expense
                      <ColumnFilter
                        columnKey="totalExpense"
                        columnName="Total Expense"
                        filterValue={colFilters.totalExpense}
                        onFilterChange={(v) => handleFilterChange("totalExpense", v as string)}
                        onClearFilter={() => handleClearFilter("totalExpense")}
                        sortDirection={colSorts.totalExpense}
                        onSortChange={(d) => handleSortChange("totalExpense", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Profit / Loss */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Profit / Loss
                      <ColumnFilter
                        columnKey="profit"
                        columnName="Profit / Loss"
                        filterValue={colFilters.profit}
                        onFilterChange={(v) => handleFilterChange("profit", v as string)}
                        onClearFilter={() => handleClearFilter("profit")}
                        sortDirection={colSorts.profit}
                        onSortChange={(d) => handleSortChange("profit", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Margin % */}
                  <TableHead className="py-2 pl-1 pr-4 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Margin %
                      <ColumnFilter
                        columnKey="margin"
                        columnName="Margin %"
                        filterValue={colFilters.margin}
                        onFilterChange={(v) => handleFilterChange("margin", v as string)}
                        onClearFilter={() => handleClearFilter("margin")}
                        sortDirection={colSorts.margin}
                        onSortChange={(d) => handleSortChange("margin", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      {hasActiveFilters ? "No clients match the current filters" : "No data for the selected period"}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRows.map((r) => (
                    <TableRow
                      key={`${r.clientName}|||${r.branch}`}
                      className={r.profit < 0 ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"}
                    >
                      <TableCell className="font-medium py-2.5 pl-4 pr-2 whitespace-nowrap">{r.clientName}</TableCell>
                      <TableCell className="text-muted-foreground py-2.5 px-2 whitespace-nowrap">
                        {r.branch || "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right font-mono">
                        {r.cases.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right font-medium">
                        {fmtINR(r.invoiceValue)}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {fmtINR(r.factoryCost)}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {fmtINR(r.labelsCost)}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.transportCost > 0 ? fmtINR(r.transportCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right">
                        {fmtINR(r.totalExpense)}
                      </TableCell>
                      <TableCell className={cn("py-2.5 px-2 text-right font-semibold", r.profit >= 0 ? "text-green-700" : "text-red-700")}>
                        {r.profit < 0 ? "−" : ""}{fmtINR(r.profit)}
                      </TableCell>
                      <TableCell className={cn(
                        "py-2.5 pl-2 pr-4 text-right font-medium",
                        r.margin >= 20 ? "text-green-700" : r.margin >= 0 ? "text-amber-700" : "text-red-700",
                      )}>
                        {r.margin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals footer (reflects filtered view) */}
          {displayRows.length > 0 && (
            <div className="border-t px-4 py-3 bg-slate-50 flex flex-wrap gap-x-8 gap-y-1 text-sm font-medium">
              <span className="text-muted-foreground font-normal">
                {hasActiveFilters ? `Filtered totals (${displayRows.length} clients)` : "Totals"}
              </span>
              <span>Cases: <strong>{filteredTotals.cases.toLocaleString("en-IN")}</strong></span>
              <span>Invoice: <strong>{fmtINR(filteredTotals.invoiceValue)}</strong></span>
              <span>Expense: <strong>{fmtINR(filteredTotals.totalExpense)}</strong></span>
              <span className={filteredProfitable ? "text-green-700" : "text-red-700"}>
                {filteredProfitable ? "Profit" : "Loss"}:{" "}
                <strong>{filteredProfitable ? "" : "−"}{fmtINR(filteredTotals.profit)}</strong>
              </span>
              <span className={filteredProfitable ? "text-green-700" : "text-red-700"}>
                Margin: <strong>{filteredMargin.toFixed(1)}%</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profitability;
