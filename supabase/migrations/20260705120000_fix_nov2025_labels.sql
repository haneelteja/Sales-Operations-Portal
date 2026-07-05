-- Fix November 2025 label amounts to match Elma data.
-- Back labels: 50,000 × ₹0.26 = ₹13,000 (missing from back_label_purchases — added below). avgBackLabelPrice = ₹0.26.
-- Transport costs untouched per policy.

-- ── Back label batch purchase (missing from DB) ──────────────────────────────

INSERT INTO public.back_label_purchases (quantity, cost_per_label, total_amount, purchase_date)
VALUES (50000, 0.26, 13000, '2025-11-30');

-- ── Back label config changes ─────────────────────────────────────────────────

-- 1980s Milatry Hotel: new client starting Nov 2025 (AL 750ml, 12 bottles/case × ₹0.26 = ₹249.60 for 80 cases)
-- Chaitanya's Modern Kitchen: switched to own back labels from Nov 2025 (back labels = 0 in Elma)
INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from) VALUES
  ('1980s Milatry Hotel',         true,  '2025-11-01'),
  ('Chaitanya''s Modern Kitchen', false, '2025-11-01');

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- 1980s Milatry Hotel Khajaguda: ₹1,075.45 → ₹792.96 (80 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=792.96, cost_per_label=792.96, quantity=1
WHERE id='521995f1-430e-4cba-82b0-235ef078d22a';

-- Alley 91 Nanakramguda: ₹2,378.88 → ₹0 (Elma shows 0 label cost in Nov)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='b0b6de42-1607-4f22-9c3e-245c1768a6e8';

-- Deccan kitchen Film nagar (250 EC): ₹1,327.50 → ₹540 (45 cases 750ml × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=540, cost_per_label=540, quantity=1
WHERE id='27f87031-f6b2-4f9d-8dd4-b2b1460a47e2';

-- Deccan kitchen Film nagar (250 EC): ₹731.60 → ₹0 (zeroed; entry above covers Film nagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='2f774df9-be15-4e0e-a884-ef1fcada1eda';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Aaha Khajaguda 214 cases × 12 × ₹0.90
  ('e26e6068-ded4-4927-9816-1f506657928f', 1, 2311.2,   2311.2,   '2025-11-30', 'GMG', 'purchase'),
  -- Benguluru Bhavan Kondapur 350 cases × 20 × ₹0.90
  ('69f93fbc-ffa7-4e8c-94a7-67f16290f522', 1, 6300,     6300,     '2025-11-30', 'GMG', 'purchase'),
  -- Biryanis and More Chandha Nagar 55 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 660,      660,      '2025-11-30', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 100 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1200,     1200,     '2025-11-30', 'GMG', 'purchase'),
  -- Biryanis and More Nizampet 70 cases × 12 × ₹1.00
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 840,      840,      '2025-11-30', 'GMG', 'purchase'),
  -- Biryanis and More Tirumalagiri 60 cases × 12 × ₹1.00
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 720,      720,      '2025-11-30', 'GMG', 'purchase'),
  -- Chaitanya's Modern Kitchen Khajaguda 200 cases × 20 × ₹0.826
  ('4cada784-9ab9-4f68-9571-11d59ad6af9d', 1, 3304,     3304,     '2025-11-30', 'Morya labels', 'purchase'),
  -- Element E7 Kukatpally 202 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 2424,     2424,     '2025-11-30', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 210 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 3780,     3780,     '2025-11-30', 'GMG', 'purchase'),
  -- Jismat Dilshuknagar (Gismat-Dilshuknagar) 180 cases × 20 × ₹0.90
  ('51140c9d-a79a-4504-8ba5-b4d3b3965892', 1, 3240,     3240,     '2025-11-30', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 110 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 1980,     1980,     '2025-11-30', 'GMG', 'purchase'),
  -- Gismat Kondapur 220 cases × 20 × ₹0.90
  ('e9f73706-c210-4534-83c7-b03abcc2941b', 1, 3960,     3960,     '2025-11-30', 'GMG', 'purchase'),
  -- Gismat Pragathi nagar 50 cases × 20 × ₹0.90
  ('f1e7fb82-e889-4274-9ae3-5219a5a69fe2', 1, 900,      900,      '2025-11-30', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills 40 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 396.48,   396.48,   '2025-11-30', 'Morya labels', 'purchase'),
  -- House party Sanikpuri 60 cases × 20 × ₹0.90
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 1080,     1080,     '2025-11-30', 'GMG', 'purchase'),
  -- Maryadha Ramanna Kondapur 50 cases × 20 × ₹0.90
  ('0101a4df-1391-4c23-adba-bb0739148bb8', 1, 900,      900,      '2025-11-30', 'GMG', 'purchase'),
  -- Maryadha Ramanna L B Nagar 180 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 3240,     3240,     '2025-11-30', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 105 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 1890,     1890,     '2025-11-30', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-11-30', 'Miscellaneous', 3030,  'Transport — Haneel Nov 2025'),
  ('2025-11-30', 'Admin',        13000, 'Admin Salary — Nov 2025'),
  ('2025-11-30', 'Miscellaneous', 500,   'WhatsApp Subscription — Nov 2025'),
  ('2025-11-30', 'GST Filing',    1000,  'GST Filing — Haneel Nov 2025');
