-- Fix stock SKU and branch mismatches identified during make-to-order reconciliation (2026-07-01).

-- === SKU FIXES IN sales_transactions ===

-- Chaitanya's Modern Kitchen: P 500 ml → AL 500 ml (factory entries use AL 500 ml)
UPDATE public.sales_transactions SET sku = 'AL 500 ml' WHERE id = 'f5b42bae-ec1b-417e-821e-90b75a42cd83'; -- 8/25 qty 20
UPDATE public.sales_transactions SET sku = 'AL 500 ml' WHERE id = '433d61e4-92f2-4822-832e-9420a6d7abe1'; -- 9/18 qty 29
UPDATE public.sales_transactions SET sku = 'AL 500 ml' WHERE id = 'd60064ab-07bc-4939-a2e5-3721528ee3cb'; -- 10/19 qty 120

-- Alley 91: P 250 ml → 250 EC (factory entries use 250 EC)
UPDATE public.sales_transactions SET sku = '250 EC'    WHERE id = '50744697-5223-45fa-99ec-2241c5173ab7'; -- 8/21 qty 10
UPDATE public.sales_transactions SET sku = '250 EC'    WHERE id = '5a932fb8-fc95-4b5d-8261-ba72bf9f9397'; -- 10/7 qty 10

-- === SKU FIX IN factory_payables ===

-- English café 4/18: AL 750 ml → P 750 ml (sales entry uses P 750 ml)
UPDATE public.factory_payables SET sku = 'P 750 ml'   WHERE id = '0a6d870b-692d-43a7-a210-fb69b07d2169'; -- qty 69

-- === CUSTOMER_ID / BRANCH FIXES IN factory_payables ===

-- Gismat 11/7: wrong branch → Pragathi Nagar
UPDATE public.factory_payables SET customer_id = 'f1e7fb82-e889-4274-9ae3-5219a5a69fe2'
WHERE id = '8af02835-40d6-4e54-b624-ab18c28fafa0';

-- Gismat 12/15: wrong branch → Chandha Nagar
UPDATE public.factory_payables SET customer_id = '54bf3b3d-63c5-494d-b992-d4976fc026fb'
WHERE id = '8d9c9f95-9afc-404e-bd79-52f5f7e122f3';

-- Soul of South 1/23: wrong branch → Film Nagar
UPDATE public.factory_payables SET customer_id = '1794596c-a254-4c0e-b8fb-f97028516116'
WHERE id = 'b2e40087-ef31-4b77-a26a-31e27cdca0dc';

-- === CUSTOMER_ID FIX IN sales_transactions ===

-- Deccan kitchen 12/5: wrong customer_id row → P 750 ml pricing row (Film Nagar)
UPDATE public.sales_transactions SET customer_id = '05217e4f-cf3f-4fb0-9251-62e22fc711ee'
WHERE id = '8f570fd7-7d0c-478d-894a-2226d98493b7';

-- === DELETE SPURIOUS FACTORY ENTRY ===

-- Tilaks kitchen 12/13: not in Elma ledger
DELETE FROM public.factory_payables
WHERE id = '4e64fdcb-b175-4266-bc72-daaa5c21b098';

-- === FIX MALFORMED SALES ENTRY ===

-- Tilaks kitchen 12/31: entry exists (amount ₹18,530, transaction_type=sale) but qty=0 and sku=NULL
UPDATE public.sales_transactions
SET quantity = 109, sku = 'P 500 ml'
WHERE id = '72963dda-bcdb-4d61-8917-2c615cbd4e19';
