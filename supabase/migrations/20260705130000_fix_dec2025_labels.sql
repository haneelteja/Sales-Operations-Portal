-- Fix December 2025 label amounts to match Elma data.
-- Back labels: 50,000 × ₹0.26 = ₹13,000 on 2025-12-06 (already in back_label_purchases). avgBackLabelPrice = ₹0.26.
-- Transport costs untouched per policy.

-- ── Back label config — new clients starting Dec 2025 ───────────────────────

INSERT INTO public.customer_back_label_history (client_name, requires_back_label, effective_from) VALUES
  ('Hiyya Chrono Jail Mandi', true, '2025-12-01'),
  ('Tawalogy',                true, '2025-12-01'),
  ('Soul of South',           true, '2025-12-01');

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- 1980s Milatry Hotel Khajaguda: ₹1,065.54 → ₹0 (0 cases in Dec)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='27e01821-040a-4e4b-b521-bcc03f2d0d3d';

-- Alley 91 Nanakramguda: ₹814.50 → ₹3,870.4 (combined: 130 cases 500ml + 75 cases 250ml = 205 × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=3870.4, cost_per_label=3870.4, quantity=1
WHERE id='5244b5ba-acbe-47ca-9fea-dfa80df6fda9';

-- Benguluru Bhavan Kondapur: ₹9,600 → ₹4,284 (238 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=4284, cost_per_label=4284, quantity=1
WHERE id='ab822b75-ece3-4427-b689-a705e84e8571';

-- Biryanis and More Ameerpet: ₹14,500 → ₹0 (0 cases in Dec)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='20881d75-aadf-41ef-9657-f9058dc792c2';

-- Chaitanya's Modern Kitchen Khajaguda: ₹5,556.38 → ₹3,766.56 (228 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=3766.56, cost_per_label=3766.56, quantity=1
WHERE id='3ead3516-ab6c-467c-92d3-ab1f9bec6fbf';

-- Gismat Kondapur: ₹3,823.20 → ₹1,890 (105 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=1890, cost_per_label=1890, quantity=1
WHERE id='c3b3fdfa-477d-4dff-a4be-758642a33fc6';

-- Gismat Kondapur: ₹7,665.28 → ₹0 (zeroed; entry above covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='8c99f140-a5f9-4a76-96e8-1032bdadbc26';

-- Hiyya Chrono Jail Mandi Madhapur: ₹3,823.20 → ₹3,546 (197 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3546, cost_per_label=3546, quantity=1
WHERE id='ba7b9deb-220d-41bc-a792-15bc5f85b12f';

-- Hiyya Chrono Jail Mandi Madhapur: ₹5,823.54 → ₹0 (zeroed; entry above covers Madhapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='b67e0a98-03ef-44b6-8293-3ee56972d4c6';

-- Maryadha Ramanna Kondapur: ₹8,800 → ₹504 (28 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=504, cost_per_label=504, quantity=1
WHERE id='5b5a5450-e3b1-4c86-8df9-b3cd049acb88';

-- Tawalogy Gandipet: ₹3,157.68 → ₹600 (50 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=600, cost_per_label=600, quantity=1
WHERE id='ded3ea1b-6d72-4954-a640-7f1897ba384e';

-- Tawalogy Gandipet: ₹572.06 → ₹0 (zeroed; entry above covers Gandipet)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='02ef1267-e845-4431-9763-47108c32f2dc';

-- NULL client: ₹13,000 → ₹0 (already recorded in back_label_purchases for 2025-12-06)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='696730d7-3472-46e9-bb2a-a03c06b3fa41';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Biryanis and More Chandha Nagar 70 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 840,      840,      '2025-12-31', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 135 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1620,     1620,     '2025-12-31', 'GMG', 'purchase'),
  -- Biryanis and More Khammam 350 cases × 12 × ₹1.00
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 4200,     4200,     '2025-12-31', 'GMG', 'purchase'),
  -- Biryanis and More Ongole 350 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 4200,     4200,     '2025-12-31', 'GMG', 'purchase'),
  -- Biryanis and More Warangal 330 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3960,     3960,     '2025-12-31', 'GMG', 'purchase'),
  -- Deccan kitchen Film nagar P 750ml 67 cases × 12 × ₹1.00
  ('05217e4f-cf3f-4fb0-9251-62e22fc711ee', 1, 804,      804,      '2025-12-31', 'GMG', 'purchase'),
  -- Element E7 Kukatpally 100 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 1200,     1200,     '2025-12-31', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 80 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 1440,     1440,     '2025-12-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 75 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 1350,     1350,     '2025-12-31', 'GMG', 'purchase'),
  -- Jismat Dilshuknagar (Gismat-Dilshuknagar) 385 cases × 20 × ₹0.90
  ('51140c9d-a79a-4504-8ba5-b4d3b3965892', 1, 6930,     6930,     '2025-12-31', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills 113 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 1120.056, 1120.056, '2025-12-31', 'Morya labels', 'purchase'),
  -- House party Sanikpuri 102 cases × 20 × ₹0.90 (per Elma; DB has 52 cases)
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 1836,     1836,     '2025-12-31', 'GMG', 'purchase'),
  -- Soul of South Film nagar 54 cases × 20 × ₹0.944
  ('4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc', 1, 1019.52,  1019.52,  '2025-12-31', 'Morya labels', 'purchase'),
  -- Tara South Indian Hitech City 136 cases × 20 × ₹1.00
  ('8d8deae2-c9c0-452e-a08a-f14c7c66471e', 1, 2720,     2720,     '2025-12-31', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 139 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 2502,     2502,     '2025-12-31', 'GMG', 'purchase'),
  -- Tilaks kitchen Madhapur 239 cases × 20 × ₹0.90 (per Elma; DB has 189 cases)
  ('d2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 1, 4302,     4302,     '2025-12-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-12-31', 'Miscellaneous',   2870,  'Transport — Haneel Dec 2025'),
  ('2025-12-31', 'Label Designing', 2500,  'Label Design — Laya Dec 2025'),
  ('2025-12-31', 'Admin',           13000, 'Admin Salary — Dec 2025'),
  ('2025-12-31', 'Miscellaneous',   1500,  'Alley 91 Commission — Dec 2025'),
  ('2025-12-31', 'Miscellaneous',   4000,  'Vehicle Fine for Invoice — Dec 2025'),
  ('2025-12-31', 'Miscellaneous',   500,   'WhatsApp Subscription — Dec 2025'),
  ('2025-12-31', 'GST Filing',      1000,  'GST Filing — Haneel Dec 2025');
