-- Fix October 2025 label amounts to match Elma data.
-- Back labels: 53,000 × ₹0.26 = ₹13,780 on 2025-10-25 (already in back_label_purchases). avgBackLabelPrice = ₹0.26.
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Alley 91 Nanakramguda: ₹1,416 → ₹1,831.36 (combined: 77 cases 500ml + 20 cases 250ml = 97 × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=1831.36, cost_per_label=1831.36, quantity=1
WHERE id='ccdd603f-06a3-427d-b570-69e58ff93b51';

-- Benguluru Bhavan Kondapur: ₹9,840 → ₹5,760 (320 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5760, cost_per_label=5760, quantity=1
WHERE id='ea9028ea-bd72-4329-b3ed-52fa63abdaf3';

-- Biryanis and More Ameerpet: ₹15,300 → ₹0 (0 cases in Oct)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='6e9ed4fd-d305-4172-ad5f-31573efe335b';

-- Chaitanya's Modern Kitchen Khajaguda: ₹3,794.88 → ₹3,634.4 (220 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=3634.4, cost_per_label=3634.4, quantity=1
WHERE id='b841e0c0-8ea4-4824-b0a2-d8d3078438e8';

-- Chaitanya's Modern Kitchen Khajaguda: ₹4,295.20 → ₹0 (zeroed; entry above covers Khajaguda)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='955dd042-e9b3-4df6-9ead-c191521a289f';

-- Golden Pavilion Banjara Hills: ₹3,023.16 → ₹852.432 (86 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=852.432, cost_per_label=852.432, quantity=1
WHERE id='1dcb4cb9-f5ff-4590-80da-7a6d8600490b';

-- House Party (wrong client, no branch) → House party Sanikpuri: ₹8,000 → ₹2,700 (150 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET client_id='549482c2-5eb4-41db-b52b-210205fb60c0', total_amount=2700, cost_per_label=2700, quantity=1
WHERE id='382ff787-95de-457f-995f-282f96155417';

-- Jismat Dilshuknagar: ₹11,680 → ₹5,400 (300 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5400, cost_per_label=5400, quantity=1
WHERE id='271c64b8-77d4-4d2c-9ca1-46f343143d99';

-- Jismat Dilshuknagar: ₹16,800 → ₹0 (zeroed; entry above covers Dilshuknagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='3a86c217-6141-48f9-9186-6576a93a10ce';

-- Maryadha Ramanna Kondapur: ₹8,000 → ₹3,258 (181 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3258, cost_per_label=3258, quantity=1
WHERE id='672011b3-a98c-46ef-83db-698e08c6a8a5';

-- NULL client: ₹13,780 → ₹0 (already recorded in back_label_purchases for 2025-10-25)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='cb782062-b5f0-4a6c-a823-d2669d75209b';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Aaha Khajaguda 125 cases × 12 × ₹0.90
  ('e26e6068-ded4-4927-9816-1f506657928f', 1, 1350,     1350,     '2025-10-31', 'GMG', 'purchase'),
  -- Biryanis and More Chandha Nagar 50 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 600,      600,      '2025-10-31', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 100 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1200,     1200,     '2025-10-31', 'GMG', 'purchase'),
  -- Biryanis and More Ongole 300 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3600,     3600,     '2025-10-31', 'GMG', 'purchase'),
  -- Biryanis and More Warangal 320 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3840,     3840,     '2025-10-31', 'GMG', 'purchase'),
  -- Deccan kitchen Film nagar P 750ml 64 cases × 12 × ₹1.00
  ('05217e4f-cf3f-4fb0-9251-62e22fc711ee', 1, 768,      768,      '2025-10-31', 'GMG', 'purchase'),
  -- Element E7 Kukatpally 200 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 2400,     2400,     '2025-10-31', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 200 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 3600,     3600,     '2025-10-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 40 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 720,      720,      '2025-10-31', 'GMG', 'purchase'),
  -- Gismat Kondapur 100 cases × 20 × ₹0.90
  ('e9f73706-c210-4534-83c7-b03abcc2941b', 1, 1800,     1800,     '2025-10-31', 'GMG', 'purchase'),
  -- Gismat Lakshmipuram 175 cases × 20 × ₹0.90
  ('fd2524a0-b784-40dd-9795-d4c07d99fff7', 1, 3150,     3150,     '2025-10-31', 'GMG', 'purchase'),
  -- Gismat Tenali 175 cases × 20 × ₹0.90 (new branch starting Oct 2025)
  ('cbacfc44-1153-4632-b1d0-76bc5efeae49', 1, 3150,     3150,     '2025-10-31', 'GMG', 'purchase'),
  -- Gismat Main office 10 cases × 20 × ₹0.90
  ('805fb033-43ca-4169-8bca-7a9f5718ca80', 1, 180,      180,      '2025-10-31', 'GMG', 'purchase'),
  -- Maryadha Ramanna L B Nagar 100 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 1800,     1800,     '2025-10-31', 'GMG', 'purchase'),
  -- Tara South Indian Hitech City 132 cases × 20 × ₹1.00
  ('8d8deae2-c9c0-452e-a08a-f14c7c66471e', 1, 2640,     2640,     '2025-10-31', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 151 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 2718,     2718,     '2025-10-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-10-31', 'Miscellaneous',   4320,  'Transport — Haneel Oct 2025'),
  ('2025-10-31', 'Label Designing', 500,   'Label Design — Laya Oct 2025'),
  ('2025-10-31', 'Admin',           13000, 'Admin Salary — Oct 2025'),
  ('2025-10-31', 'Miscellaneous',   750,   'Alley 91 Commission — Oct 2025'),
  ('2025-10-31', 'Miscellaneous',   20000, 'Maryadha Ramanna ABS Stock — Oct 2025'),
  ('2025-10-31', 'Miscellaneous',   500,   'WhatsApp Subscription — Oct 2025'),
  ('2025-10-31', 'GST Filing',      1000,  'GST Filing — Haneel Oct 2025');
