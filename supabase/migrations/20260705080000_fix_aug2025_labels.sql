-- Fix August 2025 label amounts to match Elma data.
-- Back label avg ₹0.26/label continues (50,000 × ₹0.26 = ₹13,000 on 2025-08-19).
-- Transport costs untouched per policy.

-- ── Back label config changes ────────────────────────────────────────────────

-- Gismat/Jismat branches switched to own back labels from Aug 2025 — disable in DB.
-- The profitability code picks the most-recent row with effective_from ≤ period end,
-- so inserting false entries here overrides the May-2025 true entries for Aug onwards.
INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from) VALUES
  ('Gismat',  false, '2025-08-01'),
  ('Jismat',  false, '2025-08-01');

-- New clients with back labels starting Aug 2025
INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from) VALUES
  ('Chaitanya''s Modern Kitchen', true, '2025-08-01'),
  ('Maryadha Ramanna',            true, '2025-08-01');

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Jismat Dilshuknagar: ₹10,800 → ₹3,600 (200 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3600, cost_per_label=3600, quantity=1
WHERE id='bcb1dd0c-f3c9-42eb-a2ca-b4f0aba69fac';

-- Jismat Dilshuknagar: ₹12,560 → ₹0 (zeroed; entry above covers Dilshuknagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='2d3df181-2a1a-46d1-9f46-3918df6b67d2';

-- Biryanis Ameerpet: ₹12,700 → ₹0 (0 cases in Aug)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='57d389a0-38e3-44db-abb4-bf6641872f96';

-- Chandhu Poda Marriage Order: ₹4,608 → ₹4,731.21
UPDATE public.label_purchases SET total_amount=4731.21, cost_per_label=4731.21, quantity=1
WHERE id='9a934c89-2ef8-4088-9552-cdcfe9fd110a';

-- Gismat Kondapur: ₹3,500.04 → ₹2,700 (150 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2700, cost_per_label=2700, quantity=1
WHERE id='32a2d5c7-5992-4dfa-a1c4-21f2fdf0925b';

-- Maryadha Ramanna Kondapur: ₹8,000 → ₹3,690 (205 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3690, cost_per_label=3690, quantity=1
WHERE id='7e5c8c24-3085-444c-bb5f-be06db3f8b76';

-- Tilaks kitchen: ₹10,160 → ₹4,230 (235 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=4230, cost_per_label=4230, quantity=1
WHERE id='6f288b49-8181-4b1b-bed2-f628b3b58381';

-- Alley 91 Nanakramguda: ₹0 → ₹1,132.80
-- (Elma: "Alley 91" 50 cases ₹944 + "Alley 91-250ml" 10 cases ₹188.80 = 60 cases combined)
UPDATE public.label_purchases SET total_amount=1132.80, cost_per_label=1132.80, quantity=1
WHERE id='1bbccf3f-7206-48ba-9ace-6770a9edf7a0';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Jismat Ameerpet (Elma: Gismat-Ameerpet) 190 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 3420,    3420,    '2025-08-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 50 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 900,     900,     '2025-08-31', 'GMG', 'purchase'),
  -- Gismat Lakshmipuram 150 cases × 20 × ₹0.90
  ('fd2524a0-b784-40dd-9795-d4c07d99fff7', 1, 2700,    2700,    '2025-08-31', 'GMG', 'purchase'),
  -- Biryanis Gachibowli 185 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 2220,    2220,    '2025-08-31', 'GMG', 'purchase'),
  -- Biryanis Chandha Nagar 50 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 600,     600,     '2025-08-31', 'GMG', 'purchase'),
  -- Chaitanya's Modern Kitchen 20 cases × 20 × ₹0.826
  ('04935f42-d9ec-4ae2-b433-8737f4270eff', 1, 330.40,  330.40,  '2025-08-31', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 92 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 1656,    1656,    '2025-08-31', 'GMG', 'purchase'),
  -- House party Sanikpuri (80-case customer) 80 cases × 20 × ₹0.90
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 1440,    1440,    '2025-08-31', 'GMG', 'purchase'),
  -- Golden Pavilion 125 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 1239,    1239,    '2025-08-31', 'GMG', 'purchase'),
  -- Element E7 Kukatpally 252 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 3024,    3024,    '2025-08-31', 'GMG', 'purchase'),
  -- Fusion Aroma Nallagandla 40 cases × 12 × ₹1.00
  ('2e93416d-50bb-4751-85ce-66655d818df7', 1, 480,     480,     '2025-08-31', 'GMG', 'purchase'),
  -- Benguluru Bhavan Kondapur 340 cases × 20 × ₹0.90
  ('69f93fbc-ffa7-4e8c-94a7-67f16290f522', 1, 6120,    6120,    '2025-08-31', 'GMG', 'purchase'),
  -- Mid land Telangana 750ml 505 cases × 12 × ₹0.85
  ('b886e6cc-c1f6-400c-b9be-da9b163dc4be', 1, 5151,    5151,    '2025-08-31', 'GMG', 'purchase'),
  -- Jagan Pan House (combined 1000ml+500ml) ₹1,152 + ₹480
  ('2f89a535-1fcb-4e67-9031-d1d15181e5a6', 1, 1632,    1632,    '2025-08-31', 'GMG', 'purchase'),
  -- Maryadha Ramanna L B Nagar 145 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 2610,    2610,    '2025-08-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-08-31', 'Miscellaneous',   4050,  'Transport — Haneel Aug 2025'),
  ('2025-08-31', 'Label Designing', 16000, 'Almond 500ml Die — Aug 2025'),
  ('2025-08-31', 'Label Designing', 1000,  'Label Design — Laya Aug 2025'),
  ('2025-08-31', 'Admin',           13000, 'Admin Salary — Aug 2025'),
  ('2025-08-31', 'Label Designing', 7000,  'Plates — Aug 2025'),
  ('2025-08-31', 'GST Filing',      1000,  'GST Filing — Haneel Aug 2025');
