-- Fix March 2026 client transaction discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Delete duplicate Tara South Indian 3/4 entry (qty=11, ₹2,090).
-- This entry was entered twice — once on 3/4 (wrong) and once on 3/20 (correct per Elma).
DELETE FROM public.sales_transactions WHERE id = '4423aab8-a3fd-4a8c-aed4-7f5b5ba68b6b';

-- Fix 2: Tawalogy 3/19 sale amount — DB ₹7,830 should be ₹8,370.
UPDATE public.sales_transactions SET amount = 8370.00 WHERE id = '987db540-3098-4f4b-b5e4-f20df7689bb4';

-- Fix 3: Tawalogy 3/23 payment amount — DB ₹7,830 should be ₹8,370.
UPDATE public.sales_transactions SET amount = 8370.00 WHERE id = 'f8b4a33d-3988-4a2f-93ce-e2952ddb79fa';

-- Fix 4: Intercity-Bachupally SKU — all March sale entries show 'EL 500 ml', should be '250 EC'.
UPDATE public.sales_transactions SET sku = '250 EC' WHERE id IN (
  'ac5566f3-b3d8-496e-bd40-b1d39c2f22fd', -- 3/1
  'cbf6ee7b-f3a9-4d70-b1dd-dc9db645c880', -- 3/2
  '2cf55b1e-ef55-45fe-bf1d-776c44fa0bdd', -- 3/3
  '4846e58a-ccd4-4cdc-8b30-5b3ecf5a1759', -- 3/4
  'db1f9031-bbf0-449d-b671-422fd4336a8b', -- 3/5
  '70641f60-a3ef-4ffa-99c1-85a9eea64b7d', -- 3/6
  '541df912-4eb1-47e1-bcee-239b8fe624ce', -- 3/7
  '29b1e942-0d3e-4feb-8144-cc5d0da8c264', -- 3/8
  'dcd44745-116e-402b-9f78-3fa2517002e1', -- 3/9
  '6781561a-cd87-46e0-bae7-d6049ad3e3bb', -- 3/10
  'ee191f76-8c16-49f2-b978-7c5fd622e5ba', -- 3/11
  'a88651af-abb8-4717-ae33-386d1b22a5c0'  -- 3/12
);

-- Insert 1: Missing ₹0 stock adjustment — Gismat-Dilshuknagar 3/1 qty=-6 (P 500 ml).
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-03-01',
       (SELECT id FROM public.customers WHERE client_name = 'Jismat' AND branch = 'Dilshuknagar' LIMIT 1),
       'sale', 'P 500 ml', -6, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2026-03-01'
    AND c.client_name = 'Jismat' AND c.branch = 'Dilshuknagar'
    AND st.quantity = -6
);

-- Insert 2: Missing ₹0 stock adjustment — Gismat-Kondapur 3/20 qty=-2 (P 500 ml).
INSERT INTO public.sales_transactions (transaction_date, customer_id, transaction_type, sku, quantity, amount)
SELECT '2026-03-20',
       (SELECT id FROM public.customers WHERE client_name = 'Gismat' AND branch = 'Kondapur' LIMIT 1),
       'sale', 'P 500 ml', -2, 0.00
WHERE NOT EXISTS (
  SELECT 1 FROM public.sales_transactions st
  JOIN public.customers c ON st.customer_id = c.id
  WHERE st.transaction_date = '2026-03-20'
    AND c.client_name = 'Gismat' AND c.branch = 'Kondapur'
    AND st.quantity = -2
);
