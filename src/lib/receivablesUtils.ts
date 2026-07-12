import { supabase } from '@/integrations/supabase/client';

// ── Receivables tracking types & data fetching ────────────────────────────────

export interface RawRow {
  key: string;
  customerId: string;
  dealerName: string;
  branch: string;
  outstanding: number;
  lastPaymentDate: string | null;
  comments: string;
  nextFollowupDate: string;
  totalPayments: number;
  firstPaymentDate: string | null;
  avgDaysBetweenPayments: number | null;
  expectedNextPayment: string | null;
  paymentDaysOverdue: number | null;
  paymentStatus: string;
}

export interface FetchResult {
  rows: RawRow[];
  collectionsThisMonth: number;
}

interface SummaryRow {
  customer_id: string;
  client_name: string;
  branch: string;
  outstanding: string | number;
  payment_count: string | number;
  last_payment_date: string | null;
  first_payment_date: string | null;
  payments_this_month: string | number;
}

export async function fetchReceivablesTracking(): Promise<FetchResult> {
  const [summaryResult, followupResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).rpc('get_receivables_summary'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('client_followups')
      .select('dealer_name, branch, comments, next_followup_date')
      .limit(10000),
  ]);

  if (summaryResult.error) throw summaryResult.error;

  const summaryRows = (summaryResult.data ?? []) as SummaryRow[];
  const followups = (followupResult.data ?? []) as Array<{
    dealer_name: string;
    branch: string;
    comments: string | null;
    next_followup_date: string | null;
  }>;

  const followupMap = new Map<string, { comments: string; nextFollowupDate: string }>();
  for (const f of followups) {
    followupMap.set(`${f.dealer_name.toLowerCase()}|||${f.branch.toLowerCase()}`, {
      comments: f.comments ?? '',
      nextFollowupDate: f.next_followup_date ?? '',
    });
  }

  let collectionsThisMonth = 0;
  for (const r of summaryRows) {
    collectionsThisMonth += Number(r.payments_this_month);
  }

  const todayForCalc = new Date();
  todayForCalc.setHours(0, 0, 0, 0);

  const rows: RawRow[] = [];
  for (const r of summaryRows) {
    const outstanding = Number(r.outstanding);
    if (outstanding < 0.01) continue;

    const key = `${r.client_name.toLowerCase()}|||${r.branch.toLowerCase()}`;
    const totalPayments = Number(r.payment_count);
    const firstPaymentDate = r.first_payment_date ?? null;
    const lastPmtDate = r.last_payment_date ?? null;

    let avgDaysBetweenPayments: number | null = null;
    let expectedNextPayment: string | null = null;
    let paymentDaysOverdue: number | null = null;

    if (totalPayments > 1 && firstPaymentDate && lastPmtDate) {
      const firstMs = new Date(firstPaymentDate).setHours(0, 0, 0, 0);
      const lastMs = new Date(lastPmtDate).setHours(0, 0, 0, 0);
      avgDaysBetweenPayments = Math.round((lastMs - firstMs) / ((totalPayments - 1) * 86400000));

      const expDate = new Date(lastPmtDate);
      expDate.setDate(expDate.getDate() + avgDaysBetweenPayments);
      expectedNextPayment = expDate.toISOString().split('T')[0];

      const expMs = new Date(expectedNextPayment).setHours(0, 0, 0, 0);
      paymentDaysOverdue = Math.max(0, Math.round((todayForCalc.getTime() - expMs) / 86400000));
    }

    let paymentStatus: string;
    if (totalPayments === 0) {
      paymentStatus = 'No Payments';
    } else if (totalPayments === 1) {
      paymentStatus = 'Only 1 Payment';
    } else if (paymentDaysOverdue === null) {
      paymentStatus = 'N/A';
    } else if (paymentDaysOverdue > 14) {
      paymentStatus = 'OVERDUE';
    } else if (paymentDaysOverdue > 0) {
      paymentStatus = 'DUE SOON';
    } else if (expectedNextPayment) {
      const expMs = new Date(expectedNextPayment).setHours(0, 0, 0, 0);
      paymentStatus = todayForCalc.getTime() >= expMs - 5 * 86400000 ? 'DUE SOON' : 'ON TRACK';
    } else {
      paymentStatus = 'ON TRACK';
    }

    const followup = followupMap.get(key) ?? { comments: '', nextFollowupDate: '' };
    rows.push({
      key,
      customerId: r.customer_id,
      dealerName: r.client_name,
      branch: r.branch,
      outstanding,
      lastPaymentDate: lastPmtDate,
      comments: followup.comments,
      nextFollowupDate: followup.nextFollowupDate,
      totalPayments,
      firstPaymentDate,
      avgDaysBetweenPayments,
      expectedNextPayment,
      paymentDaysOverdue,
      paymentStatus,
    });
  }

  return { rows, collectionsThisMonth };
}

// ── Shared types ──────────────────────────────────────────────────────────────

export interface FollowupNote {
  id: string;
  note: string;
  followup_date: string | null;
  created_at: string;
  created_by: string | null;
}

export interface LedgerRow {
  date: string;
  particulars: string;
  sku: string | null;
  cases: number | null;
  debit: number | null;
  credit: number | null;
  balance: number;
}

export function currentFY(): { from: string; to: string } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed; April = 3
  const fyYear = month >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${fyYear}-04-01`, to: `${fyYear + 1}-03-31` };
}

export async function fetchFollowupNotes(customerId: string): Promise<FollowupNote[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('client_followup_notes')
    .select('id, note, followup_date, created_at, created_by')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FollowupNote[];
}

export async function insertFollowupNote(
  customerId: string,
  note: string,
  followupDate: string | null,
  createdBy?: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('client_followup_notes')
    .insert({ customer_id: customerId, note, followup_date: followupDate || null, created_by: createdBy || null });
  if (error) throw error;
}

export async function fetchLedgerRows(
  customerId: string,
  from: string,
  to: string,
): Promise<{ openingBalance: number; rows: LedgerRow[] }> {
  const { data, error } = await supabase
    .from('sales_transactions')
    .select('transaction_date, transaction_type, sku, quantity, amount, description')
    .eq('customer_id', customerId)
    .in('transaction_type', ['sale', 'payment'])
    .lte('transaction_date', to)
    .order('transaction_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;

  // Match the DB trigger's same-date ordering: payments before sales, then created_at.
  // This ensures per-row balance values align with what the trigger stored in total_amount.
  const all = (data ?? []).sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) return 0;
    const typeRank = (t: string) => t === 'payment' ? 0 : 1;
    return typeRank(a.transaction_type) - typeRank(b.transaction_type);
  });
  const before = all.filter(tx => tx.transaction_date < from);
  const inRange = all.filter(tx => tx.transaction_date >= from);

  let openingBalance = 0;
  for (const tx of before) {
    const amt = tx.amount ?? 0;
    openingBalance += tx.transaction_type === 'sale' ? amt : -amt;
  }

  let balance = openingBalance;
  const rows: LedgerRow[] = inRange.map(tx => {
    const isSale = tx.transaction_type === 'sale';
    const debit = isSale ? (tx.amount ?? 0) : null;
    const credit = isSale ? null : (tx.amount ?? 0);
    balance += (debit ?? 0) - (credit ?? 0);
    return {
      date: tx.transaction_date,
      particulars: isSale
        ? `Stock Delivered${tx.description ? ` — ${tx.description}` : ''}`
        : `Payment Received${tx.description ? ` — ${tx.description}` : ''}`,
      sku: tx.sku,
      cases: tx.quantity,
      debit,
      credit,
      balance,
    };
  });

  return { openingBalance, rows };
}
