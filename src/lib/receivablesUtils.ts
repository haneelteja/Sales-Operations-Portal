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

export async function fetchReceivablesTracking(): Promise<FetchResult> {
  const [txResult, custResult, followupResult] = await Promise.all([
    supabase
      .from('sales_transactions')
      .select('customer_id, transaction_type, amount, transaction_date'),
    supabase
      .from('customers')
      .select('id, client_name, branch'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('client_followups')
      .select('dealer_name, branch, comments, next_followup_date'),
  ]);

  if (txResult.error) throw txResult.error;
  if (custResult.error) throw custResult.error;

  const transactions = txResult.data ?? [];
  const customers = custResult.data ?? [];
  const followups = (followupResult.data ?? []) as Array<{
    dealer_name: string;
    branch: string;
    comments: string | null;
    next_followup_date: string | null;
  }>;

  const customerMap = new Map<string, { dealerName: string; branch: string }>();
  for (const c of customers) {
    customerMap.set(c.id, {
      dealerName: (c.client_name || 'Unknown') as string,
      branch: (c.branch || '') as string,
    });
  }

  const followupMap = new Map<string, { comments: string; nextFollowupDate: string }>();
  for (const f of followups) {
    followupMap.set(`${f.dealer_name.toLowerCase()}|||${f.branch.toLowerCase()}`, {
      comments: f.comments ?? '',
      nextFollowupDate: f.next_followup_date ?? '',
    });
  }

  const groups = new Map<string, {
    customerId: string;
    dealerName: string;
    branch: string;
    sales: number;
    payments: number;
    lastPaymentDate: string | null;
    paymentCount: number;
    firstPaymentDate: string | null;
  }>();

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';
  let collectionsThisMonth = 0;

  for (const tx of transactions) {
    const customer = customerMap.get(tx.customer_id);
    if (!customer) continue;

    const key = `${customer.dealerName.toLowerCase()}|||${customer.branch.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, {
        customerId: tx.customer_id,
        dealerName: customer.dealerName,
        branch: customer.branch,
        sales: 0,
        payments: 0,
        lastPaymentDate: null,
        paymentCount: 0,
        firstPaymentDate: null,
      });
    }
    const g = groups.get(key)!;

    if (tx.transaction_type === 'sale') {
      g.sales += tx.amount ?? 0;
    } else if (tx.transaction_type === 'payment') {
      g.payments += tx.amount ?? 0;
      g.paymentCount += 1;
      const txDate = tx.transaction_date ?? null;
      if (txDate) {
        if (!g.firstPaymentDate || txDate < g.firstPaymentDate) g.firstPaymentDate = txDate;
        if (!g.lastPaymentDate || txDate > g.lastPaymentDate) g.lastPaymentDate = txDate;
      }
      if ((tx.transaction_date ?? '') >= monthStart) {
        collectionsThisMonth += tx.amount ?? 0;
      }
    }
  }

  const todayForCalc = new Date();
  todayForCalc.setHours(0, 0, 0, 0);

  const rows: RawRow[] = [];
  for (const [key, g] of groups) {
    const outstanding = g.sales - g.payments;
    if (outstanding < 0.01) continue;

    const totalPayments = g.paymentCount;
    const firstPaymentDate = g.firstPaymentDate;
    const lastPmtDate = g.lastPaymentDate;

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
      customerId: g.customerId,
      dealerName: g.dealerName,
      branch: g.branch,
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
    .order('transaction_date', { ascending: true });
  if (error) throw error;

  const all = data ?? [];
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
