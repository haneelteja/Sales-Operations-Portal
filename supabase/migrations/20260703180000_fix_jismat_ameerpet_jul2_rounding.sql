-- Fix Jismat Ameerpet 7/2/2025 P 500ml rounding error:
-- Elma records 103.5 + 1.5 = 105 cases. Portal stored 104 + 2 = 106 (both rounded up).
-- Factory is correctly 105. Correct the zero-amount entry from qty=2 to qty=1.

UPDATE public.sales_transactions st
SET quantity = 1
FROM public.customers c
WHERE st.customer_id = c.id
  AND c.client_name ILIKE '%ismat%' AND c.branch ILIKE '%ameerpet%'
  AND st.transaction_type = 'sale'
  AND st.transaction_date = '2025-07-02'
  AND st.sku = 'P 500 ml'
  AND st.quantity = 2
  AND st.amount = 0.00;
