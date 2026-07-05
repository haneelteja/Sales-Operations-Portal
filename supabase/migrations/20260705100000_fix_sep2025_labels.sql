-- Fix September 2025 label amounts to match Elma data.
-- Back labels: 50,000 × ₹0.26 = ₹13,000 on 2025-09-20 (already in back_label_purchases). avgBackLabelPrice = ₹0.26.
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Alley 91 Nanakramguda: ₹1,180 → ₹1,623.68 (combined: 64 cases 500ml + 22 cases 250ml = 86 × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=1623.68, cost_per_label=1623.68, quantity=1
WHERE id='0205b812-7136-4c97-8601-2e1cc9b60faf';

-- Benguluru Bhavan Kondapur: ₹8,800 → ₹7,362 (409 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=7362, cost_per_label=7362, quantity=1
WHERE id='04f964cb-6983-453d-a5e5-2e95c9d81b3d';

-- Chaitanya's Modern Kitchen Khajaguda: ₹3,270.96 → ₹925.12 (56 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=925.12, cost_per_label=925.12, quantity=1
WHERE id='e9f46d71-f39e-4c1f-b5b1-126416e38af0';

-- Deccan kitchen Film nagar (250 EC): ₹590 → ₹578.2 (35 cases 250ml per Elma)
UPDATE public.label_purchases SET total_amount=578.2, cost_per_label=578.2, quantity=1
WHERE id='e08ad57e-797a-4813-9266-9b86159aee33';

-- Golden Pavilion Banjara Hills: ₹1,569.40 → ₹832.608 (84 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=832.608, cost_per_label=832.608, quantity=1
WHERE id='6df6c0dd-6bba-4e22-ba69-a492e319d3c6';

-- Jismat Dilshuknagar: ₹8,560 → ₹7,110 (395 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=7110, cost_per_label=7110, quantity=1
WHERE id='0e0c4b8c-bc65-4710-9600-caeda8d6c0d9';

-- Mid Land (no branch): ₹4,212.60 → ₹0 (Mid land has 0 cases in Sep)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='51ed21fb-1bf6-45d7-944a-8f4d77652e6c';

-- this is it café (wrong client, no branch) → This is it café Sanikpuri: ₹8,800 → ₹1,692 (94 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET client_id='879dcdbc-ef73-4a73-8ce5-ed638c09f50a', total_amount=1692, cost_per_label=1692, quantity=1
WHERE id='712e1938-46b2-43c7-8094-ceefd8085a5c';

-- NULL client: ₹13,000 → ₹0 (already recorded in back_label_purchases for 2025-09-20)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='d8ec2fa3-8277-40df-917a-bc1446ee0016';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Atias Kitchen Gandipet 42 cases × 12 × ₹1.00
  ('7e33cd87-5c7f-4155-9364-e61383ecf34a', 1, 504,      504,      '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Chandha Nagar 50 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 600,      600,      '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 100 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1200,     1200,     '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Khammam 300 cases × 12 × ₹1.00
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 3600,     3600,     '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Narakoduru 175 cases × 12 × ₹1.00
  ('654f35a4-1047-472c-80e9-72749958423f', 1, 2100,     2100,     '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Nizampet 50 cases × 12 × ₹1.00
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 600,      600,      '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Ongole 325 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3900,     3900,     '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Tirumalagiri 50 cases × 12 × ₹1.00
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 600,      600,      '2025-09-30', 'GMG', 'purchase'),
  -- Biryanis and More Warangal 250 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3000,     3000,     '2025-09-30', 'GMG', 'purchase'),
  -- Deccan kitchen Film nagar P 750ml 55 cases × 12 × ₹1.00
  ('05217e4f-cf3f-4fb0-9251-62e22fc711ee', 1, 660,      660,      '2025-09-30', 'Morya labels', 'purchase'),
  -- Element E7 Kukatpally 75 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 900,      900,      '2025-09-30', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 170 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 3060,     3060,     '2025-09-30', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 50 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 900,      900,      '2025-09-30', 'GMG', 'purchase'),
  -- Gismat Kondapur 185 cases × 20 × ₹0.90
  ('e9f73706-c210-4534-83c7-b03abcc2941b', 1, 3330,     3330,     '2025-09-30', 'GMG', 'purchase'),
  -- Gismat Lakshmipuram 200 cases × 20 × ₹0.90
  ('fd2524a0-b784-40dd-9795-d4c07d99fff7', 1, 3600,     3600,     '2025-09-30', 'GMG', 'purchase'),
  -- Gismat Pragathi nagar 50 cases × 20 × ₹0.90
  ('f1e7fb82-e889-4274-9ae3-5219a5a69fe2', 1, 900,      900,      '2025-09-30', 'GMG', 'purchase'),
  -- House party Sanikpuri 75 cases × 20 × ₹0.90
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 1350,     1350,     '2025-09-30', 'GMG', 'purchase'),
  -- Maryadha Ramanna Kondapur 100 cases × 20 × ₹0.90
  ('0101a4df-1391-4c23-adba-bb0739148bb8', 1, 1800,     1800,     '2025-09-30', 'GMG', 'purchase'),
  -- Maryadha Ramanna L B Nagar 130 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 2340,     2340,     '2025-09-30', 'GMG', 'purchase'),
  -- Tilaks kitchen Madhapur 98 cases × 20 × ₹0.90
  ('d2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 1, 1764,     1764,     '2025-09-30', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-09-30', 'Miscellaneous', 2386,  'Transport — Haneel Sep 2025'),
  ('2025-09-30', 'Admin',        13000, 'Admin Salary — Sep 2025'),
  ('2025-09-30', 'Miscellaneous', 13000, 'Maryadha Ramanna ABS Stock — Sep 2025'),
  ('2025-09-30', 'Miscellaneous', 1500,  'Alley 91 Commission — Sep 2025'),
  ('2025-09-30', 'GST Filing',    1000,  'GST Filing — Haneel Sep 2025');
