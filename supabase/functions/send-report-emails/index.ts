import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from '../_shared/auth.ts';

// IST = UTC + 5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

function istDateString(date: Date): string {
  return toIST(date).toISOString().split('T')[0];
}

function istHour(date: Date): number {
  return toIST(date).getUTCHours();
}

function fmtINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── HTML helpers ───────────────────────────────────────────────────────────

function emailShell(title: string, date: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:900px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);color:white;padding:28px 30px;text-align:center;">
      <h1 style="margin:0;font-size:21px;">${title}</h1>
      <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${date} — Aamodha Operations Portal</p>
    </div>
    <div style="padding:24px 28px;">${body}</div>
    <div style="text-align:center;padding:14px 28px 22px;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;">
      Aamodha Operations Portal — Auto-generated daily report
    </div>
  </div>
</body></html>`;
}

function statusBadge(status: string): string {
  const map: Record<string, [string, string]> = {
    'Overdue':          ['#fee2e2', '#991b1b'],
    'Due Soon':         ['#fef3c7', '#92400e'],
    'Over Limit':       ['#fee2e2', '#991b1b'],
    'Warning':          ['#fef3c7', '#92400e'],
    'OK':               ['#dcfce7', '#166534'],
    'Delivery Overdue': ['#fee2e2', '#991b1b'],
    'Due Today':        ['#fef3c7', '#92400e'],
    'Due Tomorrow':     ['#fef3c7', '#92400e'],
    'Pending':          ['#eff6ff', '#1d4ed8'],
    'Dispatched':       ['#dcfce7', '#166534'],
    'delivered':        ['#f1f5f9', '#475569'],
    'cancelled':        ['#f1f5f9', '#94a3b8'],
  };
  const [bg, color] = map[status] ?? ['#f1f5f9', '#475569'];
  return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${status}</span>`;
}

function summaryBox(label: string, value: string | number, bg: string, color: string): string {
  return `<div style="flex:1;min-width:110px;background:${bg};border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:26px;font-weight:700;color:${color};">${value}</div>
    <div style="font-size:12px;color:${color};font-weight:500;">${label}</div>
  </div>`;
}

// ─── Orders report types & helpers ──────────────────────────────────────────

type OrderRow = {
  client: string;
  branch: string | null;
  sku: string;
  number_of_cases: number;
  order_date: string;
  tentative_delivery_date: string | null;
  days_left: number | null;
  outstanding: number;
};

type AnalysisRow = {
  client: string;
  branch: string;
  outstanding: number;
  lastOrderDate: string | null;
  avgDays: number | null;
  expectedNext: string | null;
  daysOverdue: number;
  status: 'OVERDUE' | 'DUE SOON' | 'ON TRACK' | 'Only 1 Order' | 'No Orders' | 'N/A';
};

function computeAnalysisStatus(
  totalOrders: number, expectedNext: string | null, daysOverdue: number
): AnalysisRow['status'] {
  if (totalOrders === 0) return 'No Orders';
  if (totalOrders === 1) return 'Only 1 Order';
  if (!expectedNext) return 'N/A';
  if (daysOverdue > 7) return 'OVERDUE';
  if (daysOverdue > 0) return 'DUE SOON';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp   = new Date(expectedNext); exp.setHours(0, 0, 0, 0);
  if (today.getTime() >= exp.getTime() - 3 * 86400000) return 'DUE SOON';
  return 'ON TRACK';
}

function pendingDaysLabel(days_left: number | null): string {
  if (days_left === null) return '—';
  if (days_left < 0) return `${Math.abs(days_left)}d late`;
  if (days_left === 0) return 'Today';
  if (days_left === 1) return 'Tomorrow';
  return `${days_left}d`;
}

async function fetchPendingOrders(supabase: ReturnType<typeof createClient>): Promise<OrderRow[]> {
  const [{ data: orders }, { data: outstanding }, { data: customers }] = await Promise.all([
    supabase
      .from('orders')
      .select('client, branch, sku, number_of_cases, order_date, tentative_delivery_date')
      .eq('status', 'pending')
      .order('tentative_delivery_date', { ascending: true, nullsFirst: false }),
    supabase.rpc('get_customer_outstanding'),
    supabase.from('customers').select('id, client_name, branch').limit(10000),
  ]);

  const custKeyMap = new Map<string, string>();
  for (const c of (customers ?? []) as { id: string; client_name: string; branch: string | null }[]) {
    custKeyMap.set(c.id, `${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`);
  }
  const outstandingByKey = new Map<string, number>();
  for (const r of (outstanding ?? []) as { customer_id: string; outstanding: number }[]) {
    const key = custKeyMap.get(r.customer_id);
    if (!key || r.outstanding <= 0) continue;
    outstandingByKey.set(key, (outstandingByKey.get(key) ?? 0) + r.outstanding);
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return (orders ?? []).map((o: Record<string, unknown>) => {
    const outKey     = `${((o.client as string) ?? '').toLowerCase()}|||${((o.branch as string) ?? '').toLowerCase()}`;
    const rawDelivery = o.tentative_delivery_date as string | null;
    let daysLeft: number | null = null;
    if (rawDelivery) {
      const d = new Date(rawDelivery); d.setHours(0, 0, 0, 0);
      daysLeft = Math.round((d.getTime() - todayMs) / 86400000);
    }
    return {
      client: (o.client as string) ?? '',
      branch: (o.branch as string | null) ?? null,
      sku: (o.sku as string) ?? '',
      number_of_cases: (o.number_of_cases as number) ?? 0,
      order_date: (o.order_date as string) ?? '',
      tentative_delivery_date: rawDelivery,
      days_left: daysLeft,
      outstanding: outstandingByKey.get(outKey) ?? 0,
    } as OrderRow;
  });
}

async function fetchOrderAnalysisRows(supabase: ReturnType<typeof createClient>): Promise<AnalysisRow[]> {
  const [{ data: txData }, { data: outstanding }, { data: customers }] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('transaction_type, transaction_date, customer_id')
      .limit(50000),
    supabase.rpc('get_customer_outstanding'),
    supabase.from('customers').select('id, client_name, branch, is_active').limit(10000),
  ]);

  // Active customer id → {client_name, branch}
  const custMap = new Map<string, { client_name: string; branch: string }>();
  for (const c of (customers ?? []) as { id: string; client_name: string; branch: string | null; is_active: boolean }[]) {
    if (c.is_active) custMap.set(c.id, { client_name: c.client_name, branch: c.branch ?? '' });
  }

  // Outstanding by lowercase name+branch key
  const custKeyMap = new Map<string, string>();
  for (const c of (customers ?? []) as { id: string; client_name: string; branch: string | null }[]) {
    custKeyMap.set(c.id, `${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`);
  }
  const outstandingByKey = new Map<string, number>();
  for (const r of (outstanding ?? []) as { customer_id: string; outstanding: number }[]) {
    const key = custKeyMap.get(r.customer_id);
    if (!key) continue;
    outstandingByKey.set(key, (outstandingByKey.get(key) ?? 0) + r.outstanding);
  }

  // Build unique order-date set per active client+branch (from sale transactions only)
  const dateMap = new Map<string, Set<string>>();
  for (const tx of (txData ?? []) as { transaction_type: string; transaction_date: string | null; customer_id: string }[]) {
    if (tx.transaction_type !== 'sale' || !tx.transaction_date) continue;
    const cust = custMap.get(tx.customer_id);
    if (!cust) continue;
    const key = `${cust.client_name}|||${cust.branch}`;
    const d = tx.transaction_date.split('T')[0];
    if (!dateMap.has(key)) dateMap.set(key, new Set());
    dateMap.get(key)!.add(d);
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const STATUS_ORDER: Record<string, number> = { OVERDUE: 0, 'DUE SOON': 1, 'ON TRACK': 2, 'Only 1 Order': 3, 'N/A': 4, 'No Orders': 5 };

  const rows: AnalysisRow[] = [];
  dateMap.forEach((dateSet, key) => {
    const [client, branch] = key.split('|||');
    const sorted        = [...dateSet].sort();
    const totalOrders   = sorted.length;
    const lastOrderDate = sorted[totalOrders - 1] ?? null;
    const firstOrderDate = sorted[0] ?? null;

    let avgDays: number | null     = null;
    let expectedNext: string | null = null;
    if (totalOrders > 1 && firstOrderDate && lastOrderDate) {
      const span = new Date(lastOrderDate).getTime() - new Date(firstOrderDate).getTime();
      avgDays = Math.round(span / ((totalOrders - 1) * 86400000));
      if (avgDays > 0) {
        expectedNext = new Date(new Date(lastOrderDate).getTime() + avgDays * 86400000).toISOString().split('T')[0];
      }
    }

    let daysOverdue = 0;
    if (expectedNext) {
      const expMs = new Date(expectedNext).getTime();
      if (todayMs > expMs) daysOverdue = Math.round((todayMs - expMs) / 86400000);
    }

    const outKey = `${client.toLowerCase()}|||${branch.toLowerCase()}`;
    rows.push({
      client, branch,
      outstanding:   outstandingByKey.get(outKey) ?? 0,
      lastOrderDate, avgDays, expectedNext, daysOverdue,
      status: computeAnalysisStatus(totalOrders, expectedNext, daysOverdue),
    });
  });

  return rows.sort((a, b) => {
    const so = (STATUS_ORDER[a.status] ?? 6) - (STATUS_ORDER[b.status] ?? 6);
    return so !== 0 ? so : b.daysOverdue - a.daysOverdue;
  });
}

function buildOrdersPaymentEmail(pending: OrderRow[], analysis: AnalysisRow[], date: string): string {
  const overdue = analysis.filter(r => r.status === 'OVERDUE').length;
  const dueSoon = analysis.filter(r => r.status === 'DUE SOON').length;
  const onTrack = analysis.filter(r => r.status === 'ON TRACK').length;

  // ── Pending orders table (shown only when there are pending orders) ──────────
  const pendingSection = pending.length === 0 ? '' : `
    <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 10px;">Pending Orders</h3>
    <div style="overflow-x:auto;margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#eff6ff;border-bottom:2px solid #bfdbfe;">
            <th style="padding:9px 10px;text-align:left;color:#1d4ed8;font-weight:600;">CLIENT</th>
            <th style="padding:9px 10px;text-align:left;color:#1d4ed8;font-weight:600;">BRANCH</th>
            <th style="padding:9px 10px;text-align:left;color:#1d4ed8;font-weight:600;">SKU</th>
            <th style="padding:9px 10px;text-align:center;color:#1d4ed8;font-weight:600;">CASES</th>
            <th style="padding:9px 10px;text-align:left;color:#1d4ed8;font-weight:600;">ORDER DATE</th>
            <th style="padding:9px 10px;text-align:left;color:#1d4ed8;font-weight:600;">DELIVERY DATE</th>
            <th style="padding:9px 10px;text-align:center;color:#1d4ed8;font-weight:600;">DAYS LEFT</th>
            <th style="padding:9px 10px;text-align:right;color:#1d4ed8;font-weight:600;">OUTSTANDING</th>
          </tr>
        </thead>
        <tbody>
          ${pending.map(r => {
            const dl = r.days_left;
            const dLabel = pendingDaysLabel(dl);
            const bg = dl !== null && dl < 0 ? '#fff5f5' : dl !== null && dl <= 1 ? '#fffbeb' : '#ffffff';
            const dColor = dl !== null && dl < 0 ? '#dc2626' : dl !== null && dl <= 1 ? '#92400e' : '#475569';
            return `
          <tr style="border-bottom:1px solid #e2e8f0;background:${bg};">
            <td style="padding:9px 10px;font-weight:600;color:#1e293b;">${r.client}</td>
            <td style="padding:9px 10px;color:#64748b;">${r.branch || '—'}</td>
            <td style="padding:9px 10px;">${r.sku}</td>
            <td style="padding:9px 10px;text-align:center;">${r.number_of_cases}</td>
            <td style="padding:9px 10px;color:#64748b;white-space:nowrap;">${fmtDate(r.order_date)}</td>
            <td style="padding:9px 10px;color:#64748b;white-space:nowrap;">${fmtDate(r.tentative_delivery_date)}</td>
            <td style="padding:9px 10px;text-align:center;font-weight:600;color:${dColor};">${dLabel}</td>
            <td style="padding:9px 10px;text-align:right;font-weight:700;color:${r.outstanding > 0 ? '#dc2626' : '#94a3b8'};">${r.outstanding > 0 ? fmtINR(r.outstanding) : '—'}</td>
          </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  // ── Order analysis table ─────────────────────────────────────────────────────
  const analysisRows = analysis.map(r => {
    const bg         = r.status === 'OVERDUE' ? '#fff5f5' : r.status === 'DUE SOON' ? '#fffbeb' : r.status === 'Only 1 Order' || r.status === 'No Orders' ? '#f8fafc' : '#ffffff';
    const badgeBg    = r.status === 'OVERDUE' ? '#fee2e2' : r.status === 'DUE SOON' ? '#fef3c7' : r.status === 'ON TRACK' ? '#dcfce7' : '#f1f5f9';
    const badgeColor = r.status === 'OVERDUE' ? '#991b1b' : r.status === 'DUE SOON' ? '#92400e' : r.status === 'ON TRACK' ? '#166534' : '#475569';
    const statusLabel = r.status === 'OVERDUE' ? `OVERDUE (${r.daysOverdue}d)` : r.status;
    const outColor   = r.outstanding > 0 ? '#dc2626' : r.outstanding < 0 ? '#16a34a' : '#94a3b8';
    const outLabel   = r.outstanding === 0 ? '—' : `${fmtINR(Math.abs(r.outstanding))}${r.outstanding < 0 ? ' (cr)' : ''}`;
    return `
    <tr style="border-bottom:1px solid #e2e8f0;background:${bg};">
      <td style="padding:9px 10px;font-weight:600;color:#1e293b;">${r.client}</td>
      <td style="padding:9px 10px;color:#64748b;">${r.branch || '—'}</td>
      <td style="padding:9px 10px;text-align:right;font-weight:700;color:${outColor};">${outLabel}</td>
      <td style="padding:9px 10px;color:#64748b;white-space:nowrap;">${fmtDate(r.lastOrderDate)}</td>
      <td style="padding:9px 10px;text-align:center;color:#475569;">${r.avgDays !== null ? `${r.avgDays}d` : '—'}</td>
      <td style="padding:9px 10px;color:#64748b;white-space:nowrap;">${fmtDate(r.expectedNext)}</td>
      <td style="padding:9px 10px;text-align:center;font-weight:600;color:${r.daysOverdue > 0 ? '#dc2626' : '#94a3b8'};">${r.daysOverdue > 0 ? `${r.daysOverdue}d` : '—'}</td>
      <td style="padding:9px 10px;">
        <span style="background:${badgeBg};color:${badgeColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">${statusLabel}</span>
      </td>
    </tr>`;
  }).join('');

  const body = `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${summaryBox('Pending Orders', pending.length, '#eff6ff', '#1d4ed8')}
      ${summaryBox('OVERDUE', overdue, overdue > 0 ? '#fee2e2' : '#f1f5f9', overdue > 0 ? '#991b1b' : '#475569')}
      ${summaryBox('DUE SOON', dueSoon, dueSoon > 0 ? '#fef3c7' : '#f1f5f9', dueSoon > 0 ? '#92400e' : '#475569')}
      ${summaryBox('ON TRACK', onTrack, '#dcfce7', '#166534')}
    </div>
    ${pendingSection}
    <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 10px;">Order Analysis — Expected Next Order</h3>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:9px 10px;text-align:left;color:#64748b;font-weight:600;">CLIENT</th>
            <th style="padding:9px 10px;text-align:left;color:#64748b;font-weight:600;">BRANCH</th>
            <th style="padding:9px 10px;text-align:right;color:#64748b;font-weight:600;">OUTSTANDING</th>
            <th style="padding:9px 10px;text-align:left;color:#64748b;font-weight:600;">LAST ORDER</th>
            <th style="padding:9px 10px;text-align:center;color:#64748b;font-weight:600;">AVG DAYS</th>
            <th style="padding:9px 10px;text-align:left;color:#64748b;font-weight:600;">EXPECTED NEXT</th>
            <th style="padding:9px 10px;text-align:center;color:#64748b;font-weight:600;">DAYS OVERDUE</th>
            <th style="padding:9px 10px;text-align:left;color:#64748b;font-weight:600;">STATUS</th>
          </tr>
        </thead>
        <tbody>${analysisRows}</tbody>
      </table>
    </div>`;

  return emailShell('Orders &amp; Payment Status Report', date, body);
}

// ─── Payment follow-up email (mirrors Receivables Tracker exactly) ───────────

type FollowupRow = {
  customer_id: string;
  client_name: string;
  branch: string | null;
  whatsapp_number: string | null;
  outstanding: number;
  invoice_count: number;
  oldest_sale_date: string | null;
  next_followup_date: string | null;
  comments: string | null;
  status: 'Overdue' | 'Upcoming' | 'No Date';
};

function buildPaymentFollowupEmail(rows: FollowupRow[], date: string): string {
  const overdue  = rows.filter(r => r.status === 'Overdue');
  const upcoming = rows.filter(r => r.status === 'Upcoming');
  const noDate   = rows.filter(r => r.status === 'No Date');

  const rowHtml = (r: FollowupRow, idx: number) => {
    const bg         = r.status === 'Overdue' ? '#fff5f5' : r.status === 'Upcoming' ? '#fffbeb' : '#ffffff';
    const badgeBg    = r.status === 'Overdue' ? '#fee2e2' : r.status === 'Upcoming' ? '#fef3c7' : '#f1f5f9';
    const badgeColor = r.status === 'Overdue' ? '#991b1b' : r.status === 'Upcoming' ? '#92400e'  : '#475569';
    const dateCell   = r.next_followup_date ? fmtDate(r.next_followup_date) : '—';
    const note       = r.comments ? (r.comments.length > 70 ? r.comments.slice(0, 67) + '…' : r.comments) : '—';
    return `
      <tr style="background:${bg};border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:12px;color:#94a3b8;text-align:center;">${idx}</td>
        <td style="padding:10px 12px;">
          <div style="font-weight:600;font-size:13px;color:#1e293b;">${r.client_name}</div>
          ${r.branch ? `<div style="font-size:11px;color:#94a3b8;margin-top:1px;">${r.branch}</div>` : ''}
        </td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#dc2626;text-align:right;white-space:nowrap;">${fmtINR(r.outstanding)}</td>
        <td style="padding:10px 12px;font-size:12px;color:#475569;white-space:nowrap;">${dateCell}</td>
        <td style="padding:10px 12px;font-size:12px;color:#64748b;font-style:italic;">${note}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="background:${badgeBg};color:${badgeColor};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;">${r.status}</span>
        </td>
      </tr>`;
  };

  const thead = `
    <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
      <th style="padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-align:center;">#</th>
      <th style="padding:10px 12px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">CLIENT</th>
      <th style="padding:10px 12px;font-size:11px;color:#64748b;font-weight:600;text-align:right;">OUTSTANDING</th>
      <th style="padding:10px 12px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">FOLLOW-UP DATE</th>
      <th style="padding:10px 12px;font-size:11px;color:#64748b;font-weight:600;text-align:left;">LATEST NOTE</th>
      <th style="padding:10px 12px;font-size:11px;color:#64748b;font-weight:600;text-align:center;">STATUS</th>
    </tr>`;

  const tbody = rows.map((r, i) => rowHtml(r, i + 1)).join('');

  const body = `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${summaryBox('Overdue', overdue.length, '#fee2e2', '#991b1b')}
      ${summaryBox('Upcoming', upcoming.length, '#fef3c7', '#92400e')}
      ${summaryBox('No Date', noDate.length, '#f1f5f9', '#475569')}
      ${summaryBox('Total', rows.length, '#eff6ff', '#1d4ed8')}
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-family:sans-serif;">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>`;

  return emailShell('Payment Follow Up Report', date, body);
}

type CreditRow = {
  client_name: string;
  branch: string | null;
  credit_limit: number;
  outstanding: number;
  used_pct: number;
  status: 'Over Limit' | 'Warning' | 'OK';
};

function buildCreditRiskEmail(rows: CreditRow[], date: string): string {
  const overLimit = rows.filter(r => r.status === 'Over Limit');
  const warning   = rows.filter(r => r.status === 'Warning');
  const ok        = rows.filter(r => r.status === 'OK');

  const tableRows = rows.map(r => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 8px;font-weight:500;">${r.client_name}</td>
      <td style="padding:7px 8px;color:#64748b;">${r.branch || '—'}</td>
      <td style="padding:7px 8px;color:#1e40af;">${fmtINR(r.credit_limit)}</td>
      <td style="padding:7px 8px;font-weight:600;color:#dc2626;">${fmtINR(r.outstanding)}</td>
      <td style="padding:7px 8px;text-align:center;color:#475569;">${r.used_pct.toFixed(0)}%</td>
      <td style="padding:7px 8px;">${statusBadge(r.status)}</td>
    </tr>`).join('');

  const body = `
    <p style="font-size:13px;color:#64748b;margin-bottom:16px;">
      Credit limit = average monthly sales per client (based on last 6 months). Warning = 75–100% of limit used. Clients with no recent sales but outstanding are shown at 999% (flagged as Over Limit).
    </p>
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${summaryBox('Over Limit', overLimit.length, '#fee2e2', '#991b1b')}
      ${summaryBox('Warning', warning.length, '#fef3c7', '#92400e')}
      ${summaryBox('OK', ok.length, '#dcfce7', '#166534')}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Client</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Branch</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Credit Limit</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Outstanding</th>
          <th style="text-align:center;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Used %</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;

  return emailShell('Client Credit &amp; Risk Analysis', date, body);
}

// ─── Data fetchers ───────────────────────────────────────────────────────────

// Payment Follow Up mirrors the Receivables Tracker exactly:
// status = Overdue if follow-up date has passed, Upcoming if date is set and future, No Date otherwise.
async function fetchPaymentFollowupRows(supabase: ReturnType<typeof createClient>): Promise<FollowupRow[]> {
  const todayStr = new Date().toISOString().split('T')[0];

  const [{ data: outstanding }, { data: customers }, { data: followups }] = await Promise.all([
    supabase.rpc('get_customer_outstanding'),
    supabase.from('customers').select('id, client_name, branch, whatsapp_number').eq('is_active', true).limit(10000),
    supabase.from('client_followups').select('client_name, branch, comments, next_followup_date').order('updated_at', { ascending: true }).limit(10000),
  ]);

  // customer_id → name+branch key; prefer whatsapp-bearing record per name+branch
  const custIdKeyMap = new Map<string, string>();
  const custInfoMap  = new Map<string, { client_name: string; branch: string | null; whatsapp_number: string | null }>();
  for (const c of (customers ?? []) as { id: string; client_name: string; branch: string | null; whatsapp_number: string | null }[]) {
    const key = `${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`;
    custIdKeyMap.set(c.id, key);
    const ex = custInfoMap.get(key);
    if (!ex) {
      custInfoMap.set(key, { client_name: c.client_name, branch: c.branch ?? null, whatsapp_number: c.whatsapp_number ?? null });
    } else if (!ex.whatsapp_number && c.whatsapp_number) {
      ex.whatsapp_number = c.whatsapp_number;
    }
  }

  // name+branch key → follow-up data (unique constraint guarantees one row per key)
  const followupMap = new Map<string, { comments: string | null; next_followup_date: string | null }>();
  for (const f of (followups ?? []) as { client_name: string; branch: string | null; comments: string | null; next_followup_date: string | null }[]) {
    const key = `${f.client_name.toLowerCase()}|||${(f.branch ?? '').toLowerCase()}`;
    followupMap.set(key, { comments: f.comments, next_followup_date: f.next_followup_date });
  }

  const rows: FollowupRow[] = [];
  for (const r of (outstanding ?? []) as { customer_id: string; outstanding: number; invoice_count: number; oldest_sale_date: string | null }[]) {
    if (r.outstanding < 0.01) continue;
    const nameKey = custIdKeyMap.get(r.customer_id);
    if (!nameKey) continue;
    const cust = custInfoMap.get(nameKey);
    if (!cust) continue;
    const followup     = followupMap.get(nameKey);
    const followupDate = followup?.next_followup_date ?? null;
    const status: 'Overdue' | 'Upcoming' | 'No Date' =
      !followupDate         ? 'No Date'  :
      followupDate < todayStr ? 'Overdue' : 'Upcoming';
    rows.push({
      customer_id:       r.customer_id,
      client_name:       cust.client_name,
      branch:            cust.branch,
      whatsapp_number:   cust.whatsapp_number,
      outstanding:       r.outstanding,
      invoice_count:     r.invoice_count,
      oldest_sale_date:  r.oldest_sale_date,
      next_followup_date: followupDate,
      comments:          followup?.comments ?? null,
      status,
    });
  }

  // Sort: Overdue (oldest follow-up date first) → Upcoming (soonest first) → No Date (highest outstanding first)
  return rows.sort((a, b) => {
    const order = { Overdue: 0, Upcoming: 1, 'No Date': 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    if (a.status === 'No Date') return b.outstanding - a.outstanding;
    return (a.next_followup_date ?? '').localeCompare(b.next_followup_date ?? '');
  });
}

async function fetchCreditRows(supabase: ReturnType<typeof createClient>): Promise<CreditRow[]> {
  // 6-month window gives a stable monthly average (90 days was too short and volatile)
  const since180 = new Date(Date.now() - 180 * 86400000).toISOString();

  const [{ data: outstanding }, { data: sales }, { data: customers }] = await Promise.all([
    supabase.rpc('get_customer_outstanding'),
    supabase.from('sales_transactions').select('customer_id, amount').eq('transaction_type', 'sale').gte('transaction_date', since180),
    supabase.from('customers').select('id, client_name, branch'),
  ]);

  // Build customer_id → name+branch key (same pattern as fetchPaymentFollowupRows).
  // This ensures sales on any customer_id for the same client+branch are all counted.
  const custKeyMap = new Map<string, string>();
  for (const c of (customers ?? []) as { id: string; client_name: string; branch: string | null }[]) {
    custKeyMap.set(c.id, `${c.client_name.toLowerCase()}|||${(c.branch ?? '').toLowerCase()}`);
  }
  const customerMap = new Map((customers ?? []).map((c: { id: string; client_name: string; branch: string | null }) => [c.id, c]));

  // Sum sales by name+branch key (last 6 months) across ALL customer_ids for the same client.
  const salesByKey = new Map<string, number>();
  for (const s of (sales ?? [])) {
    const key = custKeyMap.get(s.customer_id);
    if (!key) continue;
    salesByKey.set(key, (salesByKey.get(key) ?? 0) + (s.amount ?? 0));
  }

  // get_customer_outstanding returns ONE row per name+branch (deduped), so the loop
  // below produces at most one credit row per client+branch — no merging needed.
  const rows: CreditRow[] = [];
  for (const r of (outstanding ?? []) as { customer_id: string; outstanding: number }[]) {
    if (r.outstanding <= 0) continue;
    const cust = customerMap.get(r.customer_id) as { client_name: string; branch: string | null } | undefined;
    if (!cust) continue;
    const nameKey = custKeyMap.get(r.customer_id) ?? `${cust.client_name.toLowerCase()}|||${(cust.branch ?? '').toLowerCase()}`;
    const totalSales6m = salesByKey.get(nameKey) ?? 0;
    const creditLimit = totalSales6m / 6; // avg monthly over 6 months
    const usedPct = creditLimit > 0 ? (r.outstanding / creditLimit) * 100 : 999; // no recent sales = over limit
    rows.push({
      client_name: cust.client_name,
      branch: cust.branch ?? null,
      credit_limit: creditLimit,
      outstanding: r.outstanding,
      used_pct: usedPct,
      status: usedPct > 100 ? 'Over Limit' : usedPct >= 75 ? 'Warning' : 'OK',
    });
  }

  return rows.sort((a, b) => b.used_pct - a.used_pct);
}

// ─── Resend sender ───────────────────────────────────────────────────────────

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Aamodha Operations <onboarding@resend.dev>';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    let bodyJson: Record<string, unknown> = {};
    try { bodyJson = await req.json(); } catch { /* no body */ }
    const force = url.searchParams.get('force') === 'true' || bodyJson.force === true;
    const onlyType = (url.searchParams.get('type') ?? bodyJson.type ?? null) as string | null;

    const now = new Date();
    const currentISTHour = istHour(now);
    const todayIST = istDateString(now);
    const dateLabel = toIST(now).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Load schedules
    const { data: schedules, error: schErr } = await supabase
      .from('email_report_schedules')
      .select('*')
      .limit(10000);
    if (schErr) throw schErr;

    const results: Record<string, string> = {};

    for (const schedule of (schedules ?? [])) {
      if (onlyType && schedule.report_type !== onlyType) continue;
      if (!schedule.enabled) { results[schedule.report_type] = 'disabled'; continue; }

      // Check time
      const [scheduledHour] = (schedule.send_time as string).split(':').map(Number);
      if (!force && currentISTHour !== scheduledHour) {
        results[schedule.report_type] = `skipped (current IST hour ${currentISTHour} ≠ scheduled ${scheduledHour})`;
        continue;
      }

      // Check already sent today
      const lastSentIST = schedule.last_sent_at ? istDateString(new Date(schedule.last_sent_at)) : null;
      if (!force && lastSentIST === todayIST) {
        results[schedule.report_type] = 'already sent today';
        continue;
      }

      if (!resendApiKey) {
        results[schedule.report_type] = 'no RESEND_API_KEY — skipped';
        continue;
      }

      try {
        let subject = '';
        let html = '';

        if (schedule.report_type === 'orders_payment_status') {
          const [pendingOrders, analysisRows] = await Promise.all([
            fetchPendingOrders(supabase),
            fetchOrderAnalysisRows(supabase),
          ]);
          const overdue = analysisRows.filter(r => r.status === 'OVERDUE').length;
          subject = `Orders & Payment Status — ${dateLabel} (${pendingOrders.length} pending, ${overdue} overdue)`;
          html = buildOrdersPaymentEmail(pendingOrders, analysisRows, dateLabel);
        } else if (schedule.report_type === 'payment_followup') {
          const rows = await fetchPaymentFollowupRows(supabase);
          subject = `Payment Follow Up — ${dateLabel} (${rows.filter(r => r.status === 'Overdue').length} overdue)`;
          html = buildPaymentFollowupEmail(rows, dateLabel);
        } else if (schedule.report_type === 'credit_risk') {
          const rows = await fetchCreditRows(supabase);
          const overLimit = rows.filter(r => r.status === 'Over Limit').length;
          subject = `Client Credit & Risk — ${dateLabel} (${overLimit} over limit)`;
          html = buildCreditRiskEmail(rows, dateLabel);
        }

        await sendEmail(resendApiKey, fromEmail, schedule.recipient_email, subject, html);

        await supabase
          .from('email_report_schedules')
          .update({ last_sent_at: now.toISOString() })
          .eq('report_type', schedule.report_type);

        await supabase.from('email_report_logs').insert({
          report_type: schedule.report_type,
          label: schedule.label,
          recipient_email: schedule.recipient_email,
          subject,
          status: 'success',
          triggered_by: force ? 'manual' : 'scheduler',
          sent_at: now.toISOString(),
        });

        results[schedule.report_type] = `sent to ${schedule.recipient_email}`;
        console.log(`[send-report-emails] ${schedule.report_type}: sent to ${schedule.recipient_email}`);
      } catch (err) {
        await supabase.from('email_report_logs').insert({
          report_type: schedule.report_type,
          label: schedule.label,
          recipient_email: schedule.recipient_email,
          status: 'error',
          error_message: err.message,
          triggered_by: force ? 'manual' : 'scheduler',
          sent_at: now.toISOString(),
        });
        results[schedule.report_type] = `error: ${err.message}`;
        console.error(`[send-report-emails] ${schedule.report_type} failed:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, istHour: currentISTHour, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[send-report-emails] Fatal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
