import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    'Overdue':    ['#fee2e2', '#991b1b'],
    'Due Soon':   ['#fef3c7', '#92400e'],
    'Over Limit': ['#fee2e2', '#991b1b'],
    'Warning':    ['#fef3c7', '#92400e'],
    'OK':         ['#dcfce7', '#166534'],
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

// ─── Email builders ──────────────────────────────────────────────────────────

type OutstandingRow = {
  customer_id: string;
  client_name: string;
  branch: string | null;
  whatsapp_number: string | null;
  outstanding: number;
  invoice_count: number;
  oldest_sale_date: string | null;
  age_days: number;
  status: 'Overdue' | 'Due Soon';
};

function buildOrdersPaymentEmail(rows: OutstandingRow[], date: string): string {
  const overdue = rows.filter(r => r.status === 'Overdue');
  const dueSoon = rows.filter(r => r.status === 'Due Soon');
  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  const tableRows = rows.map(r => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 8px;font-weight:500;">${r.client_name}</td>
      <td style="padding:7px 8px;color:#64748b;">${r.branch || '—'}</td>
      <td style="padding:7px 8px;text-align:center;">${r.invoice_count}</td>
      <td style="padding:7px 8px;font-weight:600;color:#dc2626;">${fmtINR(r.outstanding)}</td>
      <td style="padding:7px 8px;color:#64748b;white-space:nowrap;">${fmtDate(r.oldest_sale_date)}</td>
      <td style="padding:7px 8px;text-align:center;">${r.age_days}</td>
      <td style="padding:7px 8px;">${statusBadge(r.status)}</td>
    </tr>`).join('');

  const body = `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${summaryBox('Overdue', overdue.length, '#fee2e2', '#991b1b')}
      ${summaryBox('Due Soon', dueSoon.length, '#fef3c7', '#92400e')}
      ${summaryBox('Total Outstanding', fmtINR(totalOutstanding), '#f1f5f9', '#475569')}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Client</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Branch</th>
          <th style="text-align:center;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Invoices</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Outstanding</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Oldest Invoice</th>
          <th style="text-align:center;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Days</th>
          <th style="text-align:left;padding:8px;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;

  return emailShell('Orders &amp; Payment Status Report', date, body);
}

function buildPaymentFollowupEmail(rows: OutstandingRow[], date: string): string {
  const overdue = rows.filter(r => r.status === 'Overdue');
  const dueSoon = rows.filter(r => r.status === 'Due Soon');

  const section = (title: string, color: string, bg: string, items: OutstandingRow[]) => {
    if (items.length === 0) return '';
    const cards = items.map(r => `
      <div style="border:1px solid ${color}40;border-radius:8px;padding:14px 16px;margin-bottom:10px;background:${bg};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:600;font-size:14px;color:#1e293b;">${r.client_name}${r.branch ? ` <span style="color:#64748b;font-weight:400;font-size:12px;">(${r.branch})</span>` : ''}</div>
            <div style="font-size:12px;color:#64748b;margin-top:3px;">
              ${r.invoice_count} invoice${r.invoice_count !== 1 ? 's' : ''} · Oldest: ${fmtDate(r.oldest_sale_date)} · ${r.age_days} days
              ${r.whatsapp_number ? ` · 📱 ${r.whatsapp_number}` : ''}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:700;color:#dc2626;">${fmtINR(r.outstanding)}</div>
            ${statusBadge(r.status)}
          </div>
        </div>
      </div>`).join('');
    return `<h3 style="margin:20px 0 10px;font-size:15px;color:#1e293b;border-bottom:2px solid ${color};padding-bottom:6px;">${title} (${items.length})</h3>${cards}`;
  };

  const body = `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${summaryBox('Overdue', overdue.length, '#fee2e2', '#991b1b')}
      ${summaryBox('Due Soon', dueSoon.length, '#fef3c7', '#92400e')}
      ${summaryBox('Total', rows.length, '#f1f5f9', '#475569')}
    </div>
    ${section('🔴 Overdue — Action Required', '#dc2626', '#fff5f5', overdue)}
    ${section('🟡 Due Soon — Follow Up', '#d97706', '#fffbeb', dueSoon)}`;

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
      Credit limit = average monthly sales per client (based on last 90 days). Warning = 75–100% of limit used.
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

async function fetchOutstandingRows(supabase: ReturnType<typeof createClient>): Promise<OutstandingRow[]> {
  const today = Date.now();
  const DAY = 86400000;

  const [{ data: outstanding }, { data: customers }] = await Promise.all([
    supabase.rpc('get_customer_outstanding'),
    supabase.from('customers').select('id, client_name, branch, whatsapp_number').eq('is_active', true),
  ]);

  const customerMap = new Map((customers ?? []).map((c: { id: string; client_name: string; branch: string | null; whatsapp_number: string | null }) => [c.id, c]));

  return (outstanding ?? [])
    .filter((r: { outstanding: number; oldest_sale_date: string | null }) => r.outstanding > 0 && r.oldest_sale_date)
    .map((r: { customer_id: string; outstanding: number; invoice_count: number; oldest_sale_date: string | null }) => {
      const ageDays = Math.floor((today - new Date(r.oldest_sale_date!).getTime()) / DAY);
      if (ageDays < 15) return null;
      const cust = customerMap.get(r.customer_id) as { client_name: string; branch: string | null; whatsapp_number: string | null } | undefined;
      return {
        customer_id: r.customer_id,
        client_name: cust?.client_name ?? 'Unknown',
        branch: cust?.branch ?? null,
        whatsapp_number: cust?.whatsapp_number ?? null,
        outstanding: r.outstanding,
        invoice_count: r.invoice_count,
        oldest_sale_date: r.oldest_sale_date,
        age_days: ageDays,
        status: ageDays > 30 ? 'Overdue' : 'Due Soon',
      } as OutstandingRow;
    })
    .filter(Boolean) as OutstandingRow[];
}

// Payment Follow Up uses payment-pattern logic (same as the portal's Receivables Tracking view).
// For customers with ≥2 payments: classify by whether predicted next payment is overdue.
// For customers with 0–1 payments: fall back to invoice age (no pattern to calculate).
async function fetchPaymentFollowupRows(supabase: ReturnType<typeof createClient>): Promise<OutstandingRow[]> {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayMs = todayDate.getTime();
  const DAY = 86400000;

  const [{ data: outstanding }, { data: payments }, { data: customers }] = await Promise.all([
    supabase.rpc('get_customer_outstanding'),
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_date')
      .eq('transaction_type', 'payment')
      .order('transaction_date', { ascending: true }),
    supabase.from('customers').select('id, client_name, branch, whatsapp_number').eq('is_active', true),
  ]);

  const customerMap = new Map(
    (customers ?? []).map((c: { id: string; client_name: string; branch: string | null; whatsapp_number: string | null }) => [c.id, c])
  );

  // Group payment dates per customer (already ascending)
  const paymentDates = new Map<string, string[]>();
  for (const tx of (payments ?? [])) {
    if (!tx.transaction_date) continue;
    const arr = paymentDates.get(tx.customer_id) ?? [];
    arr.push(tx.transaction_date);
    paymentDates.set(tx.customer_id, arr);
  }

  const rows: OutstandingRow[] = [];

  for (const r of (outstanding ?? [])) {
    const out = (r as { customer_id: string; outstanding: number; invoice_count: number; oldest_sale_date: string | null });
    if (out.outstanding < 0.01 || !out.oldest_sale_date) continue;

    const ageDays = Math.floor((Date.now() - new Date(out.oldest_sale_date).getTime()) / DAY);
    const pmts = paymentDates.get(out.customer_id) ?? [];
    const totalPayments = pmts.length;

    let status: 'Overdue' | 'Due Soon' | null = null;

    if (totalPayments <= 1) {
      // No payment pattern available — use invoice age
      if (ageDays > 30) status = 'Overdue';
      else if (ageDays >= 15) status = 'Due Soon';
    } else {
      const firstMs = new Date(pmts[0]).setHours(0, 0, 0, 0);
      const lastMs = new Date(pmts[totalPayments - 1]).setHours(0, 0, 0, 0);
      const avgDays = Math.round((lastMs - firstMs) / ((totalPayments - 1) * DAY));

      const expDate = new Date(pmts[totalPayments - 1]);
      expDate.setDate(expDate.getDate() + avgDays);
      const expMs = expDate.setHours(0, 0, 0, 0);
      const daysOverdue = Math.max(0, Math.round((todayMs - expMs) / DAY));

      if (daysOverdue > 14) status = 'Overdue';
      else if (daysOverdue > 0) status = 'Due Soon';
      else if (todayMs >= expMs - 5 * DAY) status = 'Due Soon';
      // ON TRACK — omit from follow-up email
    }

    if (!status) continue;

    const cust = customerMap.get(out.customer_id) as { client_name: string; branch: string | null; whatsapp_number: string | null } | undefined;
    rows.push({
      customer_id: out.customer_id,
      client_name: cust?.client_name ?? 'Unknown',
      branch: cust?.branch ?? null,
      whatsapp_number: cust?.whatsapp_number ?? null,
      outstanding: out.outstanding,
      invoice_count: out.invoice_count,
      oldest_sale_date: out.oldest_sale_date,
      age_days: ageDays,
      status,
    });
  }

  return rows.sort((a, b) => b.outstanding - a.outstanding);
}

async function fetchCreditRows(supabase: ReturnType<typeof createClient>): Promise<CreditRow[]> {
  const since90 = new Date(Date.now() - 90 * 86400000).toISOString();

  const [{ data: outstanding }, { data: sales }, { data: customers }] = await Promise.all([
    supabase.rpc('get_customer_outstanding'),
    supabase.from('sales_transactions').select('customer_id, amount').eq('transaction_type', 'sale').gte('transaction_date', since90),
    supabase.from('customers').select('id, client_name, branch').eq('is_active', true),
  ]);

  const customerMap = new Map((customers ?? []).map((c: { id: string; client_name: string; branch: string | null }) => [c.id, c]));

  // Sum sales per customer (last 90 days)
  const salesMap = new Map<string, number>();
  for (const s of (sales ?? [])) {
    salesMap.set(s.customer_id, (salesMap.get(s.customer_id) ?? 0) + (s.amount ?? 0));
  }

  const outstandingMap = new Map((outstanding ?? []).map((r: { customer_id: string; outstanding: number }) => [r.customer_id, r.outstanding]));

  const rows: CreditRow[] = [];
  for (const [customerId, totalSales90d] of salesMap.entries()) {
    const creditLimit = totalSales90d / 3; // avg monthly
    const out = outstandingMap.get(customerId) ?? 0;
    if (out <= 0) continue;
    const usedPct = creditLimit > 0 ? (out / creditLimit) * 100 : 0;
    const cust = customerMap.get(customerId) as { client_name: string; branch: string | null } | undefined;
    rows.push({
      client_name: cust?.client_name ?? 'Unknown',
      branch: cust?.branch ?? null,
      credit_limit: creditLimit,
      outstanding: out,
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
      .select('*');
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
          const rows = await fetchOutstandingRows(supabase);
          subject = `Orders & Payment Status — ${dateLabel} (${rows.length} clients)`;
          html = buildOrdersPaymentEmail(rows, dateLabel);
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
