-- Gismat Main office (customer_id 805fb033-43ca-4169-8bca-7a9f5718ca80):
--   Factory dispatched 10 cases P 500 ml on 27-Oct-2025 (factory_payables row exists).
--   The corresponding sale (₹1,700) and payment (₹1,700 on 6-Jan-2026) were never
--   entered in sales_transactions, leaving 10 phantom cases in Available Inventory.
--   Elma ledger confirms both entries; inserting them here to reconcile.

INSERT INTO sales_transactions (
  customer_id,
  transaction_type,
  sku,
  quantity,
  amount,
  total_amount,
  transaction_date,
  branch,
  description
) VALUES
  (
    '805fb033-43ca-4169-8bca-7a9f5718ca80',
    'sale',
    'P 500 ml',
    10,
    1700,
    1700,
    '2025-10-27',
    'Main office',
    'Elma reconciliation: 10 cases P 500 ml dispatched 27-Oct-2025'
  ),
  (
    '805fb033-43ca-4169-8bca-7a9f5718ca80',
    'payment',
    NULL,
    NULL,
    1700,
    1700,
    '2026-01-06',
    'Main office',
    'Elma reconciliation: payment received against Oct-2025 sale'
  );
