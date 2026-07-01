-- Fix June 2026 client transaction discrepancies vs Elma ledger (2026-07-01).

-- Fix 1: Thatha Kottu Tiffins 6/3 qty — DB has 55, Elma shows 54 (54 × ₹170 = ₹9,180).
UPDATE public.sales_transactions SET quantity = 54 WHERE id = 'f0b55e02-d413-492b-aba0-3654ad5e36f0';

-- Delete 1: Tilaks kitchen 6/8 sale (qty=98, ₹16,660) — not in Elma, does not exist.
DELETE FROM public.sales_transactions WHERE id = '48f1a56a-a756-4a4d-9c46-34dac80ce45f';
