-- Add opening_balance to customers so pre-portal historical balances can be recorded.
-- This is a client+branch-level value; all SKU rows for the same pair share it.
-- The outstanding trigger will use this as the starting point for the running sum,
-- making total_amount on every sales_transaction reflect the true historical balance.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS opening_balance numeric NOT NULL DEFAULT 0;
