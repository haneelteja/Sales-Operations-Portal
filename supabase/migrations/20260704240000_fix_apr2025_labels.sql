-- Fix April 2025 label amounts to match Elma data.
-- Problems found:
--   1. House Party label linked to wrong customer (branch="" instead of Sanikpuri), wrong amount
--   2. This is it café label linked to wrong customer (lowercase/no-branch record), wrong amount
--   3. Element E7 and Tilaks kitchen have no label entries
--   4. Golden Pavilion has ₹1,152 but Elma shows ₹0 direct labels (their labels are overhead)

-- 1. Fix House Party: correct client_id → House party Sanikpuri (549482c2), set ₹1,206
UPDATE public.label_purchases
SET client_id      = '549482c2-5eb4-41db-b52b-210205fb60c0',
    total_amount   = 1206.00,
    cost_per_label = 1206.00,
    quantity       = 1
WHERE id = '1b95f7d1-b03c-4c7f-bf02-a672a588e7df';

-- 2. Fix This is it café: correct client_id → This is it café Sanikpuri (879dcdbc), set ₹1,818
UPDATE public.label_purchases
SET client_id      = '879dcdbc-ef73-4a73-8ce5-ed638c09f50a',
    total_amount   = 1818.00,
    cost_per_label = 1818.00,
    quantity       = 1
WHERE id = 'f93cafd4-b84c-42b5-9ae9-50fa967b97eb';

-- 3. Zero out Golden Pavilion direct labels (₹1,152 → ₹0); their labels are overhead
UPDATE public.label_purchases
SET total_amount   = 0.00,
    cost_per_label = 0.00,
    quantity       = 1
WHERE id = 'b15a2d4f-1b0c-42d7-805e-5f244c9077d0';

-- 4. Add missing Element E7 label purchase for April 2025 (₹2,732.40)
INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type)
VALUES ('654230b8-1058-46bf-b571-19774cae82a3', 1, 2732.40, 2732.40, '2025-04-30', 'GMG', 'purchase');

-- 5. Add missing Tilaks kitchen label purchase for April 2025 (₹3,042)
INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type)
VALUES ('d2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 1, 3042.00, 3042.00, '2025-04-30', 'GMG', 'purchase');

-- 6. Add overhead label costs to misc_expenses so they appear in the profitability overhead section
--    These match the Elma's bottom-section overhead entries for April 2025.
INSERT INTO public.misc_expenses (expense_date, category, amount, description)
VALUES
  ('2025-04-30', 'Miscellaneous', 5470.00, 'Label overhead — Apr 2025'),
  ('2025-04-30', 'Miscellaneous', 2067.00, 'Golden Pavilion & other labels overhead — Apr 2025'),
  ('2025-04-30', 'Label Designing', 3000.00, 'Label Design — Apr 2025');
