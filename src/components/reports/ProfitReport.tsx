/**
 * ProfitReport — Year-wise pivot profit analysis
 *
 * Join strategy audit (2026-05-13):
 *   factory_payables.customer_id — nullable, added after initial schema (gaps for older records)
 *   transport_expenses.client_id  — nullable, added after initial schema (gaps for older records)
 *   label_purchases.client_id     — present
 *   sales_transactions.customer_id — consistent
 *   branch_id does not exist in any table; area/branch is plain text everywhere
 *   → PRIMARY join: customer_id UUID where available
 *   → FALLBACK: dealer_name + area text match (known tech debt — silent mismatch risk on spelling)
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import {
  Download, ChevronDown, ChevronRight, AlertTriangle, Loader2, TrendingUp, TrendingDown,
} from "lucide-react";
import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientRow {
  key: string;
  customerId?: string;
  clientName: string;
  branch: string;
  productionCost: number;
  transportCost: number;
  labelsCost: number;
  totalExpense: number;
  invoiceAmount: number;
  profit: number;
}

interface MiscExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface UnresolvedTx {
  clientName: string;
  branch: string;
  sku?: string;
  invoiceDate: string;
  deliveryDate?: string;
  amount: number;
  mismatches: string[];
}

interface MonthData {
  monthKey: string;
  label: string;
  clientRows: ClientRow[];
  miscExpenses: MiscExpense[];
  unresolvedTxs: UnresolvedTx[];
  totals: {
    productionCost: number;
    transportCost: number;
    labelsCost: number;
    totalExpense: number;
    invoiceAmount: number;
    miscTotal: number;
    netProfit: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getDateRange(year: number, isFY: boolean) {
  return isFY
    ? { start: `${year}-04-01`, end: `${year + 1}-03-31` }
    : { start: `${year}-01-01`, end: `${year}-12-31` };
}

function getMonths(start: string, end: string) {
  const months: Array<{ monthKey: string; label: string }> = [];
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push({
      monthKey: `${y}-${String(m).padStart(2, "0")}`,
      label: `${MONTH_NAMES[m - 1]} ${y}`,
    });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function isoMonthKey(date: string) {
  return date?.slice(0, 7) ?? "";
}

function clientKey(customerId: string | null | undefined, name: string, area: string) {
  return customerId ?? `${name.trim().toLowerCase()}|${area.trim().toLowerCase()}`;
}

// ─── Data processing ──────────────────────────────────────────────────────────

interface RawSale {
  id: string;
  customer_id: string;
  transaction_date: string;
  amount: number | null;
  transaction_type: string;
  sku: string | null;
  customers: { dealer_name: string; area: string } | null;
}

interface RawFactory {
  id: string;
  customer_id: string | null;
  transaction_date: string;
  amount: number | null;
  transaction_type: string;
}

interface RawTransport {
  id: string;
  client_id: string | null;
  area: string | null;
  expense_date: string;
  amount: number | null;
  expense_group: string | null;
  description: string | null;
}

interface RawLabel {
  id: string;
  client_id: string | null;
  purchase_date: string;
  total_amount: number | null;
  sku: string | null;
  description: string | null;
}

interface RawOrder {
  id: string;
  client: string;
  area: string | null;
  sku: string | null;
  tentative_delivery_date: string | null;
}

interface RawDispatch {
  id: string;
  client: string;
  area: string;
  sku: string;
  delivery_date: string;
}

function processData(
  sales: RawSale[],
  factory: RawFactory[],
  transport: RawTransport[],
  labels: RawLabel[],
  orders: RawOrder[],
  dispatches: RawDispatch[],
  months: Array<{ monthKey: string; label: string }>,
  customers: Array<{ id: string; dealer_name: string; area: string }>,
): MonthData[] {
  // Build customer lookup id → { dealer_name, area }
  const custById = new Map(customers.map(c => [c.id, c]));

  // Build delivery date lookup: "clientName|area|sku" → Set of delivery dates (ISO strings)
  const deliveryDates = new Map<string, Set<string>>();
  const addDelivery = (client: string, area: string, sku: string | null, date: string) => {
    const k = `${client.trim().toLowerCase()}|${(area ?? "").trim().toLowerCase()}|${(sku ?? "").trim().toLowerCase()}`;
    if (!deliveryDates.has(k)) deliveryDates.set(k, new Set());
    deliveryDates.get(k)!.add(date);
  };
  orders.forEach(o => {
    if (o.tentative_delivery_date) addDelivery(o.client, o.area ?? "", o.sku, o.tentative_delivery_date);
  });
  dispatches.forEach(d => addDelivery(d.client, d.area, d.sku, d.delivery_date));

  const hasMatchingDelivery = (clientName: string, area: string, sku: string | null, date: string) => {
    const k = `${clientName.trim().toLowerCase()}|${area.trim().toLowerCase()}|${(sku ?? "").trim().toLowerCase()}`;
    return deliveryDates.get(k)?.has(date) ?? false;
  };

  // Only production-type factory records count as cost
  const factoryProd = factory.filter(f => f.transaction_type === "production");

  // Transport: split client-linked vs misc (no client_id)
  const transportClient = transport.filter(t => t.client_id != null);
  const transportMisc = transport.filter(t => t.client_id == null);

  return months.map(({ monthKey, label }) => {
    // ── Sales for this month ──────────────────────────────────────────────────
    const monthSales = sales.filter(
      s => s.transaction_type === "sale" && isoMonthKey(s.transaction_date) === monthKey
    );

    // Split resolved vs unresolved based on delivery date matching
    const resolvedSales: RawSale[] = [];
    const unresolvedTxs: UnresolvedTx[] = [];

    monthSales.forEach(sale => {
      const cust = custById.get(sale.customer_id);
      const name = cust?.dealer_name ?? "Unknown";
      const area = cust?.area ?? "";
      const matched = hasMatchingDelivery(name, area, sale.sku, sale.transaction_date);

      if (matched) {
        resolvedSales.push(sale);
      } else {
        // Find closest delivery date for UI display
        const lookupKey = `${name.trim().toLowerCase()}|${area.trim().toLowerCase()}|${(sale.sku ?? "").trim().toLowerCase()}`;
        const knownDates = deliveryDates.get(lookupKey);
        const mismatches: string[] = [];
        let deliveryDate: string | undefined;
        if (knownDates && knownDates.size > 0) {
          deliveryDate = [...knownDates].sort().at(-1);
          mismatches.push("Invoice date ≠ Delivery date");
        } else {
          mismatches.push("No matching order/dispatch found");
        }
        unresolvedTxs.push({
          clientName: name,
          branch: area,
          sku: sale.sku ?? undefined,
          invoiceDate: sale.transaction_date,
          deliveryDate,
          amount: sale.amount ?? 0,
          mismatches,
        });
      }
    });

    // ── Group resolved sales by customer key ──────────────────────────────────
    const clientMap = new Map<string, ClientRow>();
    resolvedSales.forEach(sale => {
      const cust = custById.get(sale.customer_id);
      const name = cust?.dealer_name ?? "Unknown";
      const area = cust?.area ?? "";
      const key = clientKey(sale.customer_id, name, area);
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          key,
          customerId: sale.customer_id,
          clientName: name,
          branch: area,
          productionCost: 0,
          transportCost: 0,
          labelsCost: 0,
          totalExpense: 0,
          invoiceAmount: 0,
          profit: 0,
        });
      }
      clientMap.get(key)!.invoiceAmount += sale.amount ?? 0;
    });

    // ── Aggregate factory costs ────────────────────────────────────────────────
    factoryProd
      .filter(f => isoMonthKey(f.transaction_date) === monthKey)
      .forEach(f => {
        if (!f.customer_id) return;
        const cust = custById.get(f.customer_id);
        if (!cust) return;
        const key = clientKey(f.customer_id, cust.dealer_name, cust.area);
        if (clientMap.has(key)) {
          clientMap.get(key)!.productionCost += f.amount ?? 0;
        }
        // Factory costs for months/customers with no sale still allocated to that client row
        // only if the client already appeared via resolved sales; unlinked factory cost → ignored
      });

    // ── Aggregate transport costs (client-linked) ─────────────────────────────
    transportClient
      .filter(t => isoMonthKey(t.expense_date) === monthKey)
      .forEach(t => {
        // Lookup customer by client_id
        const cust = custById.get(t.client_id!);
        if (!cust) return;
        const key = clientKey(t.client_id, cust.dealer_name, cust.area);
        if (clientMap.has(key)) {
          clientMap.get(key)!.transportCost += t.amount ?? 0;
        }
      });

    // ── Aggregate labels costs ────────────────────────────────────────────────
    labels
      .filter(l => isoMonthKey(l.purchase_date) === monthKey && l.client_id != null)
      .forEach(l => {
        const cust = custById.get(l.client_id!);
        if (!cust) return;
        const key = clientKey(l.client_id, cust.dealer_name, cust.area);
        if (clientMap.has(key)) {
          clientMap.get(key)!.labelsCost += l.total_amount ?? 0;
        }
      });

    // ── Compute derived fields ─────────────────────────────────────────────────
    const clientRows = [...clientMap.values()].map(r => ({
      ...r,
      totalExpense: r.productionCost + r.transportCost + r.labelsCost,
      profit: r.invoiceAmount - (r.productionCost + r.transportCost + r.labelsCost),
    }));

    // ── Misc / overhead expenses ──────────────────────────────────────────────
    const miscExpenses: MiscExpense[] = transportMisc
      .filter(t => isoMonthKey(t.expense_date) === monthKey)
      .map(t => ({
        id: t.id,
        category: t.expense_group ?? "Misc",
        description: t.description ?? "",
        amount: t.amount ?? 0,
        date: t.expense_date,
      }));

    const miscTotal = miscExpenses.reduce((s, e) => s + e.amount, 0);

    const totals = clientRows.reduce(
      (acc, r) => ({
        productionCost: acc.productionCost + r.productionCost,
        transportCost: acc.transportCost + r.transportCost,
        labelsCost: acc.labelsCost + r.labelsCost,
        totalExpense: acc.totalExpense + r.totalExpense,
        invoiceAmount: acc.invoiceAmount + r.invoiceAmount,
        miscTotal: acc.miscTotal,
        netProfit: acc.netProfit,
      }),
      { productionCost: 0, transportCost: 0, labelsCost: 0, totalExpense: 0, invoiceAmount: 0, miscTotal, netProfit: 0 },
    );
    totals.netProfit = totals.invoiceAmount - totals.totalExpense - miscTotal;

    return { monthKey, label, clientRows, miscExpenses, unresolvedTxs, totals };
  });
}

// ─── MonthBlock ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function MonthBlock({ data }: { data: MonthData }) {
  const [open, setOpen] = useState(true);
  const [miscOpen, setMiscOpen] = useState(false);
  const [unresolvedOpen, setUnresolvedOpen] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.clientRows.length / PAGE_SIZE));
  const pageRows = data.clientRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const { totals } = data;
  const hasData = data.clientRows.length > 0 || data.miscExpenses.length > 0;

  const profitColor = totals.netProfit >= 0 ? "text-green-700" : "text-red-700";
  const profitSign = totals.netProfit >= 0 ? "+" : "-";

  return (
    <Card className="overflow-hidden">
      {/* Month header */}
      <CardHeader
        className="py-3 px-4 cursor-pointer bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <CardTitle className="text-base">{data.label}</CardTitle>
            {data.unresolvedTxs.length > 0 && (
              <Badge variant="outline" className="text-amber-700 border-amber-400 gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {data.unresolvedTxs.length} unresolved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">
              Invoice: <span className="font-semibold text-foreground">{fmt(totals.invoiceAmount)}</span>
            </span>
            <span className="text-muted-foreground">
              Expense: <span className="font-semibold text-foreground">{fmt(totals.totalExpense + totals.miscTotal)}</span>
            </span>
            <span className={`font-bold ${profitColor}`}>
              {profitSign}{fmt(totals.netProfit)}&nbsp;
              {totals.netProfit >= 0 ? <TrendingUp className="inline h-4 w-4" /> : <TrendingDown className="inline h-4 w-4" />}
            </span>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="p-0">
          {!hasData ? (
            <p className="text-muted-foreground text-sm p-4">No resolved transactions in this period.</p>
          ) : (
            <>
              {/* Client rows table */}
              {data.clientRows.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50 border-b-2 border-blue-200">
                        <TableHead className="font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Client</TableHead>
                        <TableHead className="font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Branch</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Production Cost</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Transport &amp; Delivery</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Labels Cost</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Total Expense</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Invoice Amount</TableHead>
                        <TableHead className="text-right font-semibold text-blue-800 text-xs uppercase tracking-wide px-4 py-3">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map(row => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium px-4 py-2">{row.clientName}</TableCell>
                          <TableCell className="text-muted-foreground px-4 py-2">{row.branch}</TableCell>
                          <TableCell className="text-right px-4 py-2">{fmt(row.productionCost)}</TableCell>
                          <TableCell className="text-right px-4 py-2">{fmt(row.transportCost)}</TableCell>
                          <TableCell className="text-right px-4 py-2">{fmt(row.labelsCost)}</TableCell>
                          <TableCell className="text-right px-4 py-2">{fmt(row.totalExpense)}</TableCell>
                          <TableCell className="text-right px-4 py-2">{fmt(row.invoiceAmount)}</TableCell>
                          <TableCell className={`text-right font-semibold px-4 py-2 ${row.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {row.profit >= 0 ? "+" : "-"}{fmt(row.profit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.clientRows.length > PAGE_SIZE && (
                    <div className="px-4">
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={data.clientRows.length}
                        pageSize={PAGE_SIZE}
                        onNextPage={() => setPage(p => Math.min(p + 1, totalPages))}
                        onPreviousPage={() => setPage(p => Math.max(p - 1, 1))}
                        onFirstPage={() => setPage(1)}
                        onLastPage={() => setPage(totalPages)}
                        onPageChange={setPage}
                        hasNextPage={page < totalPages}
                        hasPreviousPage={page > 1}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Misc / Overhead expenses */}
              {data.miscExpenses.length > 0 && (
                <div className="border-t">
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 w-full hover:bg-orange-100 transition-colors"
                    onClick={() => setMiscOpen(o => !o)}
                  >
                    {miscOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    Misc / Overhead Expenses ({data.miscExpenses.length} items — {fmt(totals.miscTotal)})
                  </button>
                  {miscOpen && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-orange-50">
                          <TableHead className="text-xs uppercase tracking-wide text-orange-800 px-4 py-2">Date</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-orange-800 px-4 py-2">Category</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-orange-800 px-4 py-2">Description</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide text-orange-800 px-4 py-2">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.miscExpenses.map(e => (
                          <TableRow key={e.id}>
                            <TableCell className="px-4 py-2 text-sm">{new Date(e.date).toLocaleDateString("en-IN")}</TableCell>
                            <TableCell className="px-4 py-2 text-sm">{e.category}</TableCell>
                            <TableCell className="px-4 py-2 text-sm text-muted-foreground">{e.description || "—"}</TableCell>
                            <TableCell className="text-right px-4 py-2 text-sm">{fmt(e.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Unresolved transactions */}
              {data.unresolvedTxs.length > 0 && (
                <div className="border-t">
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 w-full hover:bg-amber-100 transition-colors"
                    onClick={() => setUnresolvedOpen(o => !o)}
                  >
                    {unresolvedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <AlertTriangle className="h-4 w-4" />
                    Unresolved Transactions — {data.unresolvedTxs.length} records excluded from calculation
                  </button>
                  {unresolvedOpen && (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50">
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Client</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Branch</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">SKU</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Invoice Date</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Delivery Date</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Amount</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide text-amber-800 px-4 py-2">Issue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.unresolvedTxs.map((tx, i) => (
                          <TableRow key={i} className="bg-amber-50/50">
                            <TableCell className="px-4 py-2 text-sm font-medium">{tx.clientName}</TableCell>
                            <TableCell className="px-4 py-2 text-sm">{tx.branch}</TableCell>
                            <TableCell className="px-4 py-2 text-sm text-muted-foreground">{tx.sku ?? "—"}</TableCell>
                            <TableCell className="px-4 py-2 text-sm">{tx.invoiceDate}</TableCell>
                            <TableCell className="px-4 py-2 text-sm text-muted-foreground">{tx.deliveryDate ?? "—"}</TableCell>
                            <TableCell className="text-right px-4 py-2 text-sm">{fmt(tx.amount)}</TableCell>
                            <TableCell className="px-4 py-2 text-xs text-amber-700">{tx.mismatches.join(", ")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* Month total row */}
              <div className="border-t bg-slate-50 px-4 py-3">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Production</span>
                    <p className="font-semibold">{fmt(totals.productionCost)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Transport + Labels + Misc</span>
                    <p className="font-semibold">{fmt(totals.transportCost + totals.labelsCost + totals.miscTotal)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Total Invoice</span>
                    <p className="font-semibold">{fmt(totals.invoiceAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Month Net Profit</span>
                    <p className={`font-bold text-base ${profitColor}`}>
                      {profitSign}{fmt(totals.netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfitReport() {
  const [isFY, setIsFY] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Load available years from sales_transactions
  const { data: yearOptions = [] } = useQuery<number[]>({
    queryKey: ["profit-available-years"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sales_transactions")
        .select("transaction_date")
        .eq("transaction_type", "sale")
        .order("transaction_date", { ascending: true });
      if (!data?.length) return [];
      const years = new Set<number>();
      data.forEach(r => {
        const d = new Date(r.transaction_date);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          // For FY starting April: if month < April, it belongs to previous FY year
          years.add(y);
          if (d.getMonth() < 3) years.add(y - 1); // Apr start
        }
      });
      return [...years].sort((a, b) => b - a);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select most recent year
  const effectiveYear = selectedYear ?? yearOptions[0] ?? new Date().getFullYear();
  const { start, end } = getDateRange(effectiveYear, isFY);

  // Main data fetch for selected year
  const { data: yearData, isLoading } = useQuery({
    queryKey: ["profit-year-data", effectiveYear, isFY],
    enabled: yearOptions.length > 0,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const [
        { data: sales },
        { data: factory },
        { data: transport },
        { data: labels },
        { data: customers },
        { data: orders },
        { data: dispatches },
      ] = await Promise.all([
        supabase
          .from("sales_transactions")
          .select("id, customer_id, transaction_date, amount, transaction_type, sku, customers(dealer_name, area)")
          .gte("transaction_date", start)
          .lte("transaction_date", end)
          .eq("transaction_type", "sale"),
        supabase
          .from("factory_payables")
          .select("id, customer_id, transaction_date, amount, transaction_type")
          .gte("transaction_date", start)
          .lte("transaction_date", end)
          .eq("transaction_type", "production"),
        supabase
          .from("transport_expenses")
          .select("id, client_id, area, expense_date, amount, expense_group, description")
          .gte("expense_date", start)
          .lte("expense_date", end),
        supabase
          .from("label_purchases")
          .select("id, client_id, purchase_date, total_amount, sku, description")
          .gte("purchase_date", start)
          .lte("purchase_date", end),
        supabase
          .from("customers")
          .select("id, dealer_name, area"),
        supabase
          .from("orders")
          .select("id, client, area, sku, tentative_delivery_date")
          .gte("tentative_delivery_date", start)
          .lte("tentative_delivery_date", end),
        supabase
          .from("orders_dispatch")
          .select("id, client, area, sku, delivery_date")
          .gte("delivery_date", start)
          .lte("delivery_date", end),
      ]);

      return {
        sales: (sales ?? []) as RawSale[],
        factory: (factory ?? []) as RawFactory[],
        transport: (transport ?? []) as RawTransport[],
        labels: (labels ?? []) as RawLabel[],
        customers: (customers ?? []) as Array<{ id: string; dealer_name: string; area: string }>,
        orders: (orders ?? []) as RawOrder[],
        dispatches: (dispatches ?? []) as RawDispatch[],
      };
    },
  });

  const months = useMemo(() => getMonths(start, end), [start, end]);

  const monthData = useMemo(() => {
    if (!yearData) return [];
    return processData(
      yearData.sales,
      yearData.factory,
      yearData.transport,
      yearData.labels,
      yearData.orders,
      yearData.dispatches,
      months,
      yearData.customers,
    );
  }, [yearData, months]);

  // Year totals
  const yearTotals = useMemo(() => monthData.reduce(
    (acc, m) => ({
      productionCost: acc.productionCost + m.totals.productionCost,
      transportCost: acc.transportCost + m.totals.transportCost,
      labelsCost: acc.labelsCost + m.totals.labelsCost,
      totalExpense: acc.totalExpense + m.totals.totalExpense,
      invoiceAmount: acc.invoiceAmount + m.totals.invoiceAmount,
      miscTotal: acc.miscTotal + m.totals.miscTotal,
      netProfit: acc.netProfit + m.totals.netProfit,
    }),
    { productionCost: 0, transportCost: 0, labelsCost: 0, totalExpense: 0, invoiceAmount: 0, miscTotal: 0, netProfit: 0 },
  ), [monthData]);

  // Export handler
  const handleExport = useCallback(async () => {
    const wb = new ExcelJS.Workbook();

    // Sheet 1: Main profit data
    const mainSheet = wb.addWorksheet("Profit Analysis");
    mainSheet.columns = [
      { header: "Month", key: "month", width: 16 },
      { header: "Client", key: "client", width: 22 },
      { header: "Branch", key: "branch", width: 16 },
      { header: "Production Cost", key: "production", width: 16 },
      { header: "Transport & Delivery", key: "transport", width: 20 },
      { header: "Labels Cost", key: "labels", width: 14 },
      { header: "Total Expense", key: "totalExpense", width: 16 },
      { header: "Invoice Amount", key: "invoice", width: 16 },
      { header: "Profit", key: "profit", width: 14 },
    ];
    monthData.forEach(m => {
      m.clientRows.forEach(r => {
        mainSheet.addRow({
          month: m.label,
          client: r.clientName,
          branch: r.branch,
          production: r.productionCost,
          transport: r.transportCost,
          labels: r.labelsCost,
          totalExpense: r.totalExpense,
          invoice: r.invoiceAmount,
          profit: r.profit,
        });
      });
      // Misc row separator
      m.miscExpenses.forEach(e => {
        mainSheet.addRow({
          month: m.label,
          client: `[Misc] ${e.category}`,
          branch: "",
          production: 0,
          transport: e.amount,
          labels: 0,
          totalExpense: e.amount,
          invoice: 0,
          profit: -e.amount,
        });
      });
      // Month total
      mainSheet.addRow({
        month: `${m.label} — TOTAL`,
        client: "",
        branch: "",
        production: m.totals.productionCost,
        transport: m.totals.transportCost + m.totals.miscTotal,
        labels: m.totals.labelsCost,
        totalExpense: m.totals.totalExpense + m.totals.miscTotal,
        invoice: m.totals.invoiceAmount,
        profit: m.totals.netProfit,
      });
      mainSheet.addRow({});
    });

    // Sheet 2: Unresolved transactions
    const unresolvedSheet = wb.addWorksheet("Unresolved Transactions");
    unresolvedSheet.columns = [
      { header: "Month", key: "month", width: 16 },
      { header: "Client", key: "client", width: 22 },
      { header: "Branch", key: "branch", width: 16 },
      { header: "SKU", key: "sku", width: 14 },
      { header: "Invoice Date", key: "invoiceDate", width: 14 },
      { header: "Delivery Date", key: "deliveryDate", width: 14 },
      { header: "Amount", key: "amount", width: 14 },
      { header: "Issue", key: "issue", width: 40 },
    ];
    monthData.forEach(m => {
      m.unresolvedTxs.forEach(tx => {
        unresolvedSheet.addRow({
          month: m.label,
          client: tx.clientName,
          branch: tx.branch,
          sku: tx.sku ?? "",
          invoiceDate: tx.invoiceDate,
          deliveryDate: tx.deliveryDate ?? "",
          amount: tx.amount,
          issue: tx.mismatches.join("; "),
        });
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = isFY ? `FY_${effectiveYear}-${String(effectiveYear + 1).slice(2)}` : `CY_${effectiveYear}`;
    a.download = `Profit_Report_${label}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [monthData, isFY, effectiveYear]);

  const yearLabel = isFY
    ? `FY ${effectiveYear}–${String(effectiveYear + 1).slice(2)}`
    : `${effectiveYear}`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* CY / FY toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${!isFY ? "text-foreground" : "text-muted-foreground"}`}>
            Calendar Year
          </span>
          <Switch checked={isFY} onCheckedChange={setIsFY} />
          <span className={`text-sm font-medium ${isFY ? "text-foreground" : "text-muted-foreground"}`}>
            Financial Year (Apr–Mar)
          </span>
        </div>

        {/* Year picker */}
        <Select
          value={String(effectiveYear)}
          onValueChange={v => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(y => (
              <SelectItem key={y} value={String(y)}>
                {isFY ? `FY ${y}–${String(y + 1).slice(2)}` : String(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 ml-auto">
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Loading profit data for {yearLabel}…</p>
          </div>
        </div>
      )}

      {!isLoading && monthData.length > 0 && (
        <>
          {/* Month blocks */}
          <div className="space-y-3">
            {monthData.map(m => (
              <MonthBlock key={m.monthKey} data={m} />
            ))}
          </div>

          {/* Year total */}
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base text-slate-100">
                Year Total — {yearLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Total Production</p>
                  <p className="font-semibold text-slate-100">{fmt(yearTotals.productionCost)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Transport + Labels + Misc</p>
                  <p className="font-semibold text-slate-100">
                    {fmt(yearTotals.transportCost + yearTotals.labelsCost + yearTotals.miscTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Total Invoiced</p>
                  <p className="font-semibold text-slate-100">{fmt(yearTotals.invoiceAmount)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Net Year Profit</p>
                  <p className={`font-bold text-xl ${yearTotals.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {yearTotals.netProfit >= 0 ? "+" : "-"}{fmt(yearTotals.netProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && monthData.length === 0 && yearOptions.length === 0 && (
        <p className="text-center text-muted-foreground py-16">No sales data found to generate profit report.</p>
      )}
    </div>
  );
}
