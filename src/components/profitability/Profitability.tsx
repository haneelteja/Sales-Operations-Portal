import React, { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Download, TrendingUp, TrendingDown, Info, Search, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportJsonToExcel } from "@/services/export/excelExport";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfitRow {
  clientId: string | null;
  clientName: string;
  branch: string;
  cases: number;
  invoiceValue: number;
  factoryCost: number;
  labelsCost: number;
  backLabelsCost: number;
  commissionCost: number;
  overheadTransportCost: number;
  miscExpensesCost: number;
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
  backLabelsCost: string;
  commissionCost: string;
  overheadTransportCost: string;
  miscExpensesCost: string;
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
  backLabelsCost: "",
  commissionCost: "",
  overheadTransportCost: "",
  miscExpensesCost: "",
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
  "backLabelsCost",
  "commissionCost",
  "overheadTransportCost",
  "miscExpensesCost",
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
  backLabelsCost: null,
  commissionCost: null,
  overheadTransportCost: null,
  miscExpensesCost: null,
  transportCost: null,
  totalExpense: null,
  profit: null,
  margin: null,
};

interface MiscExpense {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  description: string | null;
}

const MISC_CATEGORIES = [
  "Admin Salary",
  "GST Filing",
  "Label Designing",
  "Miscellaneous",
  "Transportation",
  "WhatsApp Subscription",
];

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1; // 1-indexed
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Date period state
  const [year, setYear] = useState(CURRENT_YEAR);
  const [months, setMonths] = useState<number[]>([CURRENT_MONTH]);

  // Misc expense form state
  const [miscForm, setMiscForm] = useState({ category: MISC_CATEGORIES[0], amount: "", description: "" });

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
        .select("customer_id, amount, quantity, transaction_date, sku, customers(client_name, branch, sku)")
        .eq("transaction_type", "sale")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate);
      return (data ?? []) as Array<{
        customer_id: string;
        amount: number;
        quantity: number | null;
        transaction_date: string;
        sku: string | null;
        customers: { client_name: string; branch: string | null; sku: string | null } | null;
      }>;
    },
  });

  const { data: factoryPayablesRaw = [], isLoading: loadingFactory } = useQuery({
    queryKey: ["prof-factory", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("factory_payables")
        .select("customer_id, amount, transaction_date, customers(client_name, branch)")
        .eq("transaction_type", "production")
        .gte("transaction_date", startDate)
        .lte("transaction_date", endDate);
      return (data ?? []) as Array<{
        customer_id: string | null;
        amount: number;
        transaction_date: string;
        customers: { client_name: string; branch: string | null } | null;
      }>;
    },
  });

  const { data: labelsRaw = [], isLoading: loadingLabels } = useQuery({
    queryKey: ["prof-labels", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("label_purchases")
        .select("client_id, total_amount, purchase_date, record_type, customers(client_name, branch)")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);
      return (data ?? []) as Array<{
        client_id: string | null;
        total_amount: number;
        purchase_date: string;
        record_type: string | null;
        customers: { client_name: string; branch: string | null } | null;
      }>;
    },
  });

  const { data: backLabelsRaw = [], isLoading: loadingBackLabels } = useQuery({
    queryKey: ["prof-back-labels", startDate, endDate],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("back_label_purchases")
        .select("quantity, cost_per_label, total_amount, purchase_date")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);
      return (data ?? []) as Array<{
        quantity: number;
        cost_per_label: number;
        total_amount: number;
        purchase_date: string;
      }>;
    },
  });

  // Back label configuration — which clients require back labels and from when.
  // No date filter: config history is applied based on effective_from vs period.
  const { data: backLabelConfigRaw = [] } = useQuery({
    queryKey: ["prof-back-label-config"],
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("customer_back_label_history")
        .select("client_name, requires_back_label, effective_from");
      return (data ?? []) as Array<{
        client_name: string;
        requires_back_label: boolean;
        effective_from: string;
      }>;
    },
  });

  // SKU → bottles per case (config table, rarely changes)
  const { data: skuConfigRaw = [] } = useQuery({
    queryKey: ["prof-sku-config"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("sku_configurations")
        .select("sku, bottles_per_case");
      return (data ?? []) as Array<{ sku: string; bottles_per_case: number }>;
    },
  });

  // Commission config — active commissions; no date filter (effective dates applied in computation)
  const { data: commissionsRaw = [] } = useQuery({
    queryKey: ["prof-commissions"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("client_commissions")
        .select("customer_id, sku, amount_per_case, effective_from, effective_to, is_active")
        .eq("is_active", true);
      return (data ?? []) as Array<{
        customer_id: string;
        sku: string;
        amount_per_case: number;
        effective_from: string;
        effective_to: string | null;
        is_active: boolean;
      }>;
    },
  });

  const { data: transportRaw = [], isLoading: loadingTransport } = useQuery({
    queryKey: ["prof-transport", startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("transport_expenses")
        .select("client_id, amount, expense_date, expense_group, customers(client_name, branch)")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      return (data ?? []) as Array<{
        client_id: string | null;
        amount: number;
        expense_date: string;
        expense_group: string | null;
        customers: { client_name: string; branch: string | null } | null;
      }>;
    },
  });

  const { data: miscRaw = [], isLoading: loadingMisc } = useQuery({
    queryKey: ["prof-misc", startDate, endDate],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("misc_expenses")
        .select("id, expense_date, category, amount, description")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);
      return (data ?? []) as MiscExpense[];
    },
  });

  const isLoading =
    loadingSales || loadingFactory || loadingLabels || loadingBackLabels || loadingTransport || loadingMisc;

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addMiscMutation = useMutation({
    mutationFn: async (payload: { category: string; amount: number; description: string; expense_date: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("misc_expenses").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prof-misc"] });
      setMiscForm({ category: MISC_CATEGORIES[0], amount: "", description: "" });
      toast({ title: "Expense added" });
    },
    onError: () => toast({ title: "Failed to add expense", variant: "destructive" }),
  });

  const deleteMiscMutation = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("misc_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prof-misc"] });
      toast({ title: "Expense removed" });
    },
    onError: () => toast({ title: "Failed to remove expense", variant: "destructive" }),
  });

  // ── Core computation (period rows, unfiltered) ────────────────────────────

  const { rows, summary } = useMemo(() => {
    const sales = salesRaw.filter((r) => inPeriod(r.transaction_date, year, months));
    const factoryPayables = factoryPayablesRaw.filter((r) => inPeriod(r.transaction_date, year, months));
    const labels = labelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const backLabels = backLabelsRaw.filter((r) => inPeriod(r.purchase_date, year, months));
    const transport = transportRaw.filter((r) => inPeriod(r.expense_date, year, months));
    const miscExpenses = miscRaw.filter((r) => inPeriod(r.expense_date, year, months));
    const totalMiscExpenses = miscExpenses.reduce((s, r) => s + (r.amount ?? 0), 0);

    // Back labels: compute average cost per label for this period
    const totalBackLabelQty = backLabels.reduce((s, l) => s + (l.quantity ?? 0), 0);
    const totalBackLabelAmt = backLabels.reduce((s, l) => s + (l.total_amount ?? 0), 0);
    const avgBackLabelPrice = totalBackLabelQty > 0 ? totalBackLabelAmt / totalBackLabelQty : 0;

    // Back label config: for each client_name, find the most recent record with
    // effective_from ≤ endDate and read requires_back_label.
    const backLabelConfigMap = new Map<string, boolean>(); // lowerCase clientName → enabled
    const historyByClient = new Map<string, typeof backLabelConfigRaw[0]>();
    for (const h of backLabelConfigRaw) {
      if (h.effective_from > endDate) continue;
      const existing = historyByClient.get(h.client_name);
      if (!existing || h.effective_from > existing.effective_from) {
        historyByClient.set(h.client_name, h);
      }
    }
    for (const [name, h] of historyByClient) {
      backLabelConfigMap.set(name.toLowerCase(), h.requires_back_label);
    }

    // SKU → bottles per case lookup
    const skuBottlesMap = new Map<string, number>();
    for (const s of skuConfigRaw) {
      skuBottlesMap.set(s.sku, s.bottles_per_case);
    }

    // Front labels: direct per client. Only count record_type='purchase' with positive amount.
    // Keyed by "clientName|||branch" — same composite key used for sales rows.
    const directLabelsMap = new Map<string, number>();
    for (const l of labels) {
      if ((l.record_type ?? "purchase") !== "purchase") continue;
      if ((l.total_amount ?? 0) <= 0) continue;
      const cust = l.customers;
      if (!cust?.client_name) continue;
      const mapKey = `${cust.client_name}|||${cust.branch ?? ""}`;
      directLabelsMap.set(mapKey, (directLabelsMap.get(mapKey) ?? 0) + (l.total_amount ?? 0));
    }

    // Aggregate revenue + cases (qty) per client+branch from sales_transactions.
    // Key = "clientName|||branch" so the same client+branch always merges into one row.
    // Also capture the client's SKU from the customers join for back label calculation.
    const clientMap = new Map<string, {
      clientId: string;
      clientName: string;
      branch: string;
      sku: string | null;
      revenue: number;
      cases: number;
    }>();
    // Also build customer_id → client+branch key for later lookups
    const custKeyMap = new Map<string, string>();
    // Build customer_id + tx_sku → cases for commission calculation
    const commissionCasesMap = new Map<string, number>();
    for (const s of sales) {
      const cust = s.customers;
      const clientName = cust?.client_name ?? "Unknown";
      const branch = cust?.branch ?? "";
      const key = `${clientName}|||${branch}`;
      custKeyMap.set(s.customer_id, key);
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientId: s.customer_id,
          clientName,
          branch,
          sku: cust?.sku ?? null,
          revenue: 0,
          cases: 0,
        });
      }
      const entry = clientMap.get(key)!;
      entry.revenue += s.amount ?? 0;
      entry.cases += s.quantity ?? 0;
      // Track cases per customer+sku for commission lookup
      const txSku = s.sku ?? cust?.sku ?? null;
      if (txSku) {
        const commKey = `${s.customer_id}|||${txSku}`;
        commissionCasesMap.set(commKey, (commissionCasesMap.get(commKey) ?? 0) + (s.quantity ?? 0));
      }
    }

    // Commission per client+branch: sum applicable commissions in this period
    const commissionMap = new Map<string, number>(); // clientBranchKey → total commission
    for (const c of commissionsRaw) {
      if (c.effective_from > endDate) continue;
      if (c.effective_to && c.effective_to < startDate) continue;
      const commKey = `${c.customer_id}|||${c.sku}`;
      const commCases = commissionCasesMap.get(commKey) ?? 0;
      if (commCases === 0) continue;
      const clientBranchKey = custKeyMap.get(c.customer_id);
      if (!clientBranchKey) continue;
      commissionMap.set(clientBranchKey, (commissionMap.get(clientBranchKey) ?? 0) + commCases * c.amount_per_case);
    }

    const totalCases = [...clientMap.values()].reduce((s, v) => s + v.cases, 0);

    // Factory cost: keyed by client+branch so all SKUs for the same client+branch are summed.
    // Use the joined customers row directly so records with any customer_id for the same
    // client+branch (including duplicate customer records) are always merged correctly.
    const directFactoryMap = new Map<string, number>();
    let unlinkedFactory = 0;
    for (const f of factoryPayables) {
      if (f.customers?.client_name) {
        const mapKey = `${f.customers.client_name}|||${f.customers.branch ?? ""}`;
        directFactoryMap.set(mapKey, (directFactoryMap.get(mapKey) ?? 0) + (f.amount ?? 0));
      } else if (f.customer_id) {
        const mapKey = custKeyMap.get(f.customer_id) ?? f.customer_id;
        directFactoryMap.set(mapKey, (directFactoryMap.get(mapKey) ?? 0) + (f.amount ?? 0));
      } else {
        unlinkedFactory += f.amount ?? 0;
      }
    }

    // Transport: entries with no client go into a global overhead pool (all groups:
    // labels, general, labor, etc.) allocated proportionally by cases.
    // Entries linked to a specific client are attributed directly to that client.
    let totalOverheadTransport = 0;
    const directTransportMap = new Map<string, number>();
    for (const t of transport) {
      if (!t.client_id) {
        totalOverheadTransport += t.amount ?? 0;
      } else if (t.customers?.client_name) {
        const mapKey = `${t.customers.client_name}|||${t.customers.branch ?? ""}`;
        directTransportMap.set(mapKey, (directTransportMap.get(mapKey) ?? 0) + (t.amount ?? 0));
      } else {
        const mapKey = custKeyMap.get(t.client_id) ?? t.client_id;
        directTransportMap.set(mapKey, (directTransportMap.get(mapKey) ?? 0) + (t.amount ?? 0));
      }
    }

    // Build result rows
    const result: ProfitRow[] = [];

    for (const [clientBranchKey, entry] of clientMap.entries()) {
      const { clientId, clientName, branch, sku, revenue: invoiceValue, cases } = entry;

      const caseFraction = totalCases > 0 ? cases / totalCases : 0;
      const factoryCost =
        (directFactoryMap.get(clientBranchKey) ?? 0) +
        unlinkedFactory * caseFraction;
      const labelsCost = directLabelsMap.get(clientBranchKey) ?? 0;

      // Back labels: use formula if client is configured, else ₹0.
      // backLabelsCost = cases × bottles_per_case[sku] × avg_cost_per_label_for_period
      const hasBackLabel = backLabelConfigMap.get(clientName.toLowerCase()) ?? false;
      const bottlesPerCase = sku ? (skuBottlesMap.get(sku) ?? 0) : 0;
      const backLabelsCost = hasBackLabel ? cases * bottlesPerCase * avgBackLabelPrice : 0;

      const overheadTransportCost = totalOverheadTransport * caseFraction;
      const miscExpensesCost = totalMiscExpenses * caseFraction;

      const transportCost = directTransportMap.get(clientBranchKey) ?? 0;
      const commissionCost = commissionMap.get(clientBranchKey) ?? 0;

      const totalExpense = factoryCost + labelsCost + backLabelsCost + commissionCost + overheadTransportCost + miscExpensesCost + transportCost;
      const profit = invoiceValue - totalExpense;
      const margin = invoiceValue !== 0 ? (profit / invoiceValue) * 100 : 0;

      result.push({ clientId, clientName, branch, cases, invoiceValue, factoryCost, labelsCost, backLabelsCost, commissionCost, overheadTransportCost, miscExpensesCost, transportCost, totalExpense, profit, margin });
    }

    const summary = {
      clients: result.length,
      cases: result.reduce((s, r) => s + r.cases, 0),
      invoiceValue: result.reduce((s, r) => s + r.invoiceValue, 0),
      factoryCost: result.reduce((s, r) => s + r.factoryCost, 0),
      labelsCost: result.reduce((s, r) => s + r.labelsCost, 0),
      backLabelsCost: result.reduce((s, r) => s + r.backLabelsCost, 0),
      commissionCost: result.reduce((s, r) => s + r.commissionCost, 0),
      overheadTransportCost: totalOverheadTransport,
      miscExpensesCost: totalMiscExpenses,
      transportCost: result.reduce((s, r) => s + r.transportCost, 0),
      totalExpense: result.reduce((s, r) => s + r.totalExpense, 0),
      profit: result.reduce((s, r) => s + r.profit, 0),
    };

    return { rows: result, summary };
  }, [salesRaw, factoryPayablesRaw, labelsRaw, backLabelsRaw, backLabelConfigRaw, skuConfigRaw, commissionsRaw, transportRaw, miscRaw, year, months]);

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
      { key: "cases",                  field: "cases" },
      { key: "invoiceValue",           field: "invoiceValue" },
      { key: "factoryCost",            field: "factoryCost" },
      { key: "labelsCost",             field: "labelsCost" },
      { key: "backLabelsCost",         field: "backLabelsCost" },
      { key: "commissionCost",         field: "commissionCost" },
      { key: "overheadTransportCost",  field: "overheadTransportCost" },
      { key: "miscExpensesCost",       field: "miscExpensesCost" },
      { key: "transportCost",          field: "transportCost" },
      { key: "totalExpense",           field: "totalExpense" },
      { key: "profit",                 field: "profit" },
      { key: "margin",                 field: "margin" },
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
      "Back Labels Cost (₹)": Math.round(r.backLabelsCost),
      "Commission (₹)": Math.round(r.commissionCost),
      "Overhead Transport (₹)": Math.round(r.overheadTransportCost),
      "Misc Expenses (₹)": Math.round(r.miscExpensesCost),
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
        <SummaryCard title="Back Labels Cost" value={fmtINR(summary.backLabelsCost)} />
        <SummaryCard title="Commission" value={fmtINR(summary.commissionCost)} />
        <SummaryCard title="Overhead Transport" value={fmtINR(summary.overheadTransportCost)} />
        <SummaryCard title="Misc Expenses" value={fmtINR(summary.miscExpensesCost)} />
        <SummaryCard title="Transport Cost" value={fmtINR(summary.transportCost)} />
        <SummaryCard title="Total Expense" value={fmtINR(summary.totalExpense)} accent="red" />
      </div>

      {/* Misc / Overhead Expenses CRUD */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Misc / Overhead Expenses — {periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={miscForm.category}
                onChange={(e) => setMiscForm((p) => ({ ...p, category: e.target.value }))}
                aria-label="Expense category"
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MISC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Amount (₹)</label>
              <Input
                type="number"
                placeholder="0"
                value={miscForm.amount}
                onChange={(e) => setMiscForm((p) => ({ ...p, amount: e.target.value }))}
                className="h-8 w-28 text-sm"
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[160px]">
              <label className="text-xs text-muted-foreground">Description (optional)</label>
              <Input
                placeholder="e.g. Jul filing"
                value={miscForm.description}
                onChange={(e) => setMiscForm((p) => ({ ...p, description: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              className="h-8"
              disabled={!miscForm.amount || addMiscMutation.isPending}
              onClick={() => {
                const amt = parseFloat(miscForm.amount);
                if (isNaN(amt) || amt <= 0) return;
                const lastMonth = months.length > 0 ? Math.max(...months) : 12;
                const lastDay = new Date(year, lastMonth, 0).getDate();
                const expenseDate = `${year}-${String(lastMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                addMiscMutation.mutate({
                  category: miscForm.category,
                  amount: amt,
                  description: miscForm.description,
                  expense_date: expenseDate,
                });
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>

          {miscRaw.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="w-8" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {miscRaw.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="px-3 py-2">{e.category}</td>
                      <td className="px-3 py-2 text-muted-foreground">{e.description || "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{fmtINR(e.amount)}</td>
                      <td className="px-2 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                          disabled={deleteMiscMutation.isPending}
                          onClick={() => deleteMiscMutation.mutate(e.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No misc expenses recorded for this period.</p>
          )}
        </CardContent>
      </Card>

      {/* Allocation note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-slate-50 border rounded-md px-3 py-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Labels cost is direct per client (sum of their actual label purchases in the period).
          Back labels cost is per client: cases × bottles/case × avg cost/label — only for clients enabled in back label configuration.
          Commission is per client: cases dispatched × ₹/case from active commission configs (Configurations → Commissions).
          Overhead transport and misc expenses are allocated proportionally by cases.
          Factory and transport costs show only direct entries linked to each client.
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

                  {/* Back Labels */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Back Labels
                      <ColumnFilter
                        columnKey="backLabelsCost"
                        columnName="Back Labels"
                        filterValue={colFilters.backLabelsCost}
                        onFilterChange={(v) => handleFilterChange("backLabelsCost", v as string)}
                        onClearFilter={() => handleClearFilter("backLabelsCost")}
                        sortDirection={colSorts.backLabelsCost}
                        onSortChange={(d) => handleSortChange("backLabelsCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Commission */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Commission
                      <ColumnFilter
                        columnKey="commissionCost"
                        columnName="Commission"
                        filterValue={colFilters.commissionCost}
                        onFilterChange={(v) => handleFilterChange("commissionCost", v as string)}
                        onClearFilter={() => handleClearFilter("commissionCost")}
                        sortDirection={colSorts.commissionCost}
                        onSortChange={(d) => handleSortChange("commissionCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Overhead Transport */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Overhead Transport
                      <ColumnFilter
                        columnKey="overheadTransportCost"
                        columnName="Overhead Transport"
                        filterValue={colFilters.overheadTransportCost}
                        onFilterChange={(v) => handleFilterChange("overheadTransportCost", v as string)}
                        onClearFilter={() => handleClearFilter("overheadTransportCost")}
                        sortDirection={colSorts.overheadTransportCost}
                        onSortChange={(d) => handleSortChange("overheadTransportCost", d)}
                        dataType="number"
                      />
                    </div>
                  </TableHead>

                  {/* Misc Expenses */}
                  <TableHead className="py-2 pl-1 pr-1 font-semibold whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      Misc Expenses
                      <ColumnFilter
                        columnKey="miscExpensesCost"
                        columnName="Misc Expenses"
                        filterValue={colFilters.miscExpensesCost}
                        onFilterChange={(v) => handleFilterChange("miscExpensesCost", v as string)}
                        onClearFilter={() => handleClearFilter("miscExpensesCost")}
                        sortDirection={colSorts.miscExpensesCost}
                        onSortChange={(d) => handleSortChange("miscExpensesCost", d)}
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
                    <TableCell colSpan={14} className="text-center text-muted-foreground py-12">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-muted-foreground py-12">
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
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {fmtINR(r.factoryCost)}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.labelsCost > 0 ? fmtINR(r.labelsCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.backLabelsCost > 0 ? fmtINR(r.backLabelsCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.commissionCost > 0 ? fmtINR(r.commissionCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.overheadTransportCost > 0 ? fmtINR(r.overheadTransportCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.miscExpensesCost > 0 ? fmtINR(r.miscExpensesCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right text-muted-foreground">
                        {r.transportCost > 0 ? fmtINR(r.transportCost) : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right">
                        {fmtINR(r.totalExpense)}
                      </TableCell>
                      <TableCell className="py-2.5 px-2 text-right font-medium">
                        {fmtINR(r.invoiceValue)}
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
