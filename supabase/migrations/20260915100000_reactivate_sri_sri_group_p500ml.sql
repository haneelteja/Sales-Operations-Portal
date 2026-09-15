-- Add P 500 ml pricing row for Sri Sri group / Khammam.
-- Row was missing entirely (deleted). Client confirmed still ordering this SKU at ₹180/case.
-- price_per_case is a generated column (price_per_bottle × bottles_per_case).
-- P 500 ml has 20 bottles/case → price_per_bottle = 180/20 = ₹9.
INSERT INTO public.customers (client_name, branch, sku, price_per_bottle, bottles_per_case, pricing_date, is_active, is_deprecated)
VALUES ('Sri Sri group', 'Khammam', 'P 500 ml', 9, 20, '2026-06-17', true, false)
ON CONFLICT DO NOTHING;
