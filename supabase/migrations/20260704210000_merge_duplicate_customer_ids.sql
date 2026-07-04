-- Merge duplicate customer records for Maryadha Ramanna.
-- Two branches each had an extra unused customer_id with split transactions.
--
-- Kondapur: 99657314 had 3 payments; 0101a4df had all sales + 1 payment.
--   → move 99657314 payments to 0101a4df, delete 99657314.
-- L B Nagar: ebeffa46 had only 1 adjustment label record; 587eee6f had all activity.
--   → move label_purchase to 587eee6f, delete ebeffa46.

-- 1. Migrate Kondapur payments to the primary ID
UPDATE public.sales_transactions
SET customer_id = '0101a4df-1391-4c23-adba-bb0739148bb8'
WHERE customer_id = '99657314-2541-4cc0-8455-a80d9b7ec659';

-- 2. Migrate L B Nagar label adjustment to the primary ID
UPDATE public.label_purchases
SET client_id = '587eee6f-9afa-4f07-a920-baaa7ed0cc2b'
WHERE client_id = 'ebeffa46-9c42-43e3-8cee-fb6b617da591';

-- 3. Delete the now-empty duplicate customer records
DELETE FROM public.customers WHERE id = '99657314-2541-4cc0-8455-a80d9b7ec659';
DELETE FROM public.customers WHERE id = 'ebeffa46-9c42-43e3-8cee-fb6b617da591';
