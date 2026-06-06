-- Link sales_transactions back to the invoice that covers them.
-- For multi-SKU sales a single invoice covers multiple transactions;
-- this column lets every transaction row reference that invoice directly.
alter table sales_transactions
  add column if not exists invoice_id uuid references invoices(id) on delete set null;

create index if not exists idx_sales_transactions_invoice_id on sales_transactions(invoice_id);
