import { supabase } from '@/integrations/supabase/client';

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
