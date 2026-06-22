-- Indexes for common filter/sort columns to improve query performance

-- sales_transactions
create index if not exists idx_sales_transactions_date
  on sales_transactions (transaction_date desc);

create index if not exists idx_sales_transactions_customer
  on sales_transactions (customer_id);

-- factory_payables
create index if not exists idx_factory_payables_date
  on factory_payables (transaction_date desc);

create index if not exists idx_factory_payables_customer
  on factory_payables (customer_id);

-- label_purchases
create index if not exists idx_label_purchases_date
  on label_purchases (purchase_date desc);

create index if not exists idx_label_purchases_client
  on label_purchases (client_id);

-- back_label_purchases
create index if not exists idx_back_label_purchases_date
  on back_label_purchases (purchase_date desc);

-- transport_expenses
create index if not exists idx_transport_expenses_date
  on transport_expenses (expense_date desc);

-- orders
create index if not exists idx_orders_date
  on orders (order_date desc);

create index if not exists idx_orders_customer
  on orders (customer_id);
