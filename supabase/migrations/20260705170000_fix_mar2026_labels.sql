-- Fix March 2026 label amounts to match Elma data.
-- No new back_label_purchases batch in Mar — cost uses Jan 24 batch price (₹0.26/label).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Biryanis and More Ameerpet: ₹10,136 → ₹0 (0 cases dispatched in Mar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='8d2338a8-1bad-4d1f-8f36-ada5232b1400';

-- Biryanis and More Ameerpet: ₹9,797 → ₹0 (0 cases dispatched in Mar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='37539598-f4b4-475f-8428-21283f97953a';

-- Chaitanya's Modern Kitchen Khajaguda: ₹3,864.74 → ₹1,685.04 (102 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=1685.04, cost_per_label=1685.04, quantity=1
WHERE id='9056ddba-22dd-4f71-a2f0-525a8057c7a7';

-- Element E7 Kukatpally: ₹3,572 → ₹2,592 (216 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2592, cost_per_label=2592, quantity=1
WHERE id='791a52bf-4729-4e44-a53e-4a9594cd4cde';

-- Element E7 Kukatpally: ₹1,910 → ₹0 (zeroed; entry above covers Kukatpally)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='af09ced6-764c-44df-a7dc-33ba2c540f8e';

-- Gismat Kondapur: ₹3,864.74 → ₹2,628 (146 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2628, cost_per_label=2628, quantity=1
WHERE id='473b677d-622e-4733-9f16-63d9f1377b48';

-- Gismat Kondapur: ₹3,792.99 → ₹0 (zeroed; entry above covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='6ab2d06a-8d73-4c89-a3f4-30d0e48f9594';

-- Hiyya Vizag: ₹5,752.74 → ₹0 (not in Elma Mar 2026 data)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='b9060ed7-16c1-4e0c-97fd-ebe1684a25e7';

-- Jismat Dilshuknagar: ₹5,752.74 → ₹5,850 (325 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5850, cost_per_label=5850, quantity=1
WHERE id='ea5a46dc-7824-49f3-8c2d-97fc72d583ec';

-- Soul of South Film nagar: ₹1,989.95 → ₹0 (0 cases dispatched in Mar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='547acab6-9554-4ed9-9016-262439cb0e60';

-- Tara South Indian Kitchen Hitech City: ₹3,009.47 → ₹820
UPDATE public.label_purchases SET total_amount=820, cost_per_label=820, quantity=1
WHERE id='750c8100-a313-4e87-bc33-8185c5a89b94';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Alley 91 Nanakramguda combined 500ml+250ml cases × ₹0.944
  ('5a8317e2-47d0-4a1b-8fee-8aa406b10ea6', 1, 2076.8,  2076.8,  '2026-03-31', 'Morya labels', 'purchase'),
  -- Benguluru Bhavan Kondapur 205 cases × 20 × ₹0.90
  ('69f93fbc-ffa7-4e8c-94a7-67f16290f522', 1, 3690,    3690,    '2026-03-31', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 115 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1380,    1380,    '2026-03-31', 'GMG', 'purchase'),
  -- Biryanis and More Khammam 360 cases × 12 × ₹1.00
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 4320,    4320,    '2026-03-31', 'GMG', 'purchase'),
  -- Biryanis and More Nizampet 40 cases × 12 × ₹1.00
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 480,     480,     '2026-03-31', 'GMG', 'purchase'),
  -- Biryanis and More Ongole 310 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3720,    3720,    '2026-03-31', 'GMG', 'purchase'),
  -- Biryanis and More Tirumalagiri 40 cases × 12 × ₹1.00
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 480,     480,     '2026-03-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 50 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 900,     900,     '2026-03-31', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 644.28,  644.28,  '2026-03-31', 'Morya labels', 'purchase'),
  -- Hiyya Chrono Jail Mandi Madhapur 133 cases × 20 × ₹0.90
  ('4cf0c485-a5f7-4978-a311-ac3ae99d85c4', 1, 2394,    2394,    '2026-03-31', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 50 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 900,     900,     '2026-03-31', 'GMG', 'purchase'),
  -- Maryadha Ramanna Kondapur 84 cases × 12 × ₹1.00
  ('0101a4df-1391-4c23-adba-bb0739148bb8', 1, 1008,    1008,    '2026-03-31', 'GMG', 'purchase'),
  -- Tawalogy Gandipet 30 cases × 20 × ₹0.90
  ('6ce0fbbb-bda1-415b-81eb-9c31ee9be062', 1, 540,     540,     '2026-03-31', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 100 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 1800,    1800,    '2026-03-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-03-31', 'Miscellaneous',   2650,  'Transport — Haneel Mar 2026'),
  ('2026-03-31', 'Label Designing', 1500,  'Label Design — Laya Mar 2026'),
  ('2026-03-31', 'Admin',           13000, 'Admin Salary — Mar 2026'),
  ('2026-03-31', 'Admin',           500,   'Admin Phone Bill — Mar 2026'),
  ('2026-03-31', 'Miscellaneous',   500,   'WhatsApp Subscription — Mar 2026'),
  ('2026-03-31', 'GST Filing',      1000,  'GST Filing — Haneel Mar 2026');
