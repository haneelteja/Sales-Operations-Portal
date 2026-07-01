-- Fix Gismat ₹1,700 payment on 1/6/2026 incorrectly tagged to Main office — move to Kondapur.
UPDATE public.sales_transactions
SET customer_id = 'c6e0f10d-a131-449e-bcd1-c5c67f28c2ed'
WHERE id = '2c8b0c7c-a018-4e9c-9001-070603f0b090';
