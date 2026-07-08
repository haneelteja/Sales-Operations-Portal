-- Fix Jul 6 2026 sale for Maryadha Ramanna Kondapur: 75 cases P 500ml
-- was entered at ₹170/case (₹12,750); Elma shows ₹190/case (₹14,250).
-- Difference of ₹1,500 caused receivables to show ₹43,580 instead of ₹45,080.
UPDATE public.sales_transactions
SET amount = 14250.00
WHERE id = '825a3544-9a85-4b7f-b1ee-4fd8e0d0f699';
