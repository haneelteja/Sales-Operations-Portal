-- Fix June 2025 label amounts to match Elma data.
-- Back labels already correct (avg ₹0.26 from back_label_purchases).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Jismat Dilshuknagar: ₹10,000 → ₹4,680
UPDATE public.label_purchases SET total_amount=4680, cost_per_label=4680, quantity=1
WHERE id='c3bc414e-cafb-445b-a8ff-a63fe52f0e85';

-- Biryanis Ameerpet: ₹15,500 → ₹0 (0 cases in Jun)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='86e590e0-bf34-4659-85f0-017c4d605098';

-- Benguluru Bhavan Kondapur: ₹14,000 → ₹792
UPDATE public.label_purchases SET total_amount=792, cost_per_label=792, quantity=1
WHERE id='633f3c1f-54e9-498a-9ed9-c46b1aa926be';

-- Benguluru Bhavan Kondapur: ₹3,500 → ₹0 (zeroed; entry above covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='f85e8344-b376-4c0d-8ad6-7d4e6eeb82a0';

-- Golden Pavilion: ₹0 → ₹446.04 (45 cases AL 750ml × 12 × ₹0.826/label)
UPDATE public.label_purchases SET total_amount=446.04, cost_per_label=446.04, quantity=1
WHERE id='3ae76438-727a-43ce-9568-1b6205277f24';

-- Good Vibes: ₹0 → ₹360
UPDATE public.label_purchases SET total_amount=360, cost_per_label=360, quantity=1
WHERE id='c49012cb-ac31-44a2-94a5-db5ac5364320';

-- Tilaks kitchen: ₹8,000 → ₹2,214
UPDATE public.label_purchases SET total_amount=2214, cost_per_label=2214, quantity=1
WHERE id='7a8cfe11-e96f-4d9a-8561-c8d7cda6b3ef';

-- Tara South Indian: ₹3,500 → ₹3,400
UPDATE public.label_purchases SET total_amount=3400, cost_per_label=3400, quantity=1
WHERE id='de88f3ee-b626-4718-9155-cbb346e78cab';

-- Tara South Indian: ₹8,240 → ₹0 (zeroed; entry above covers Hitech City)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='7a80f6b1-46d9-4ab2-bc5b-8ae5411fb5b2';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Jismat Ameerpet (Elma: Gismat-Ameerpet) 248 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 4464,    4464,    '2025-06-30', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 170 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 3060,    3060,    '2025-06-30', 'GMG', 'purchase'),
  -- Gismat Pragathi nagar 50 cases × 20 × ₹0.90
  ('f1e7fb82-e889-4274-9ae3-5219a5a69fe2', 1, 900,     900,     '2025-06-30', 'GMG', 'purchase'),
  -- Gismat Lakshmipuram 160 cases × 20 × ₹0.90
  ('fd2524a0-b784-40dd-9795-d4c07d99fff7', 1, 2880,    2880,    '2025-06-30', 'GMG', 'purchase'),
  -- Biryanis Gachibowli 115 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1380,    1380,    '2025-06-30', 'GMG', 'purchase'),
  -- Biryanis Narakoduru 160 cases × 12 × ₹1.00
  ('654f35a4-1047-472c-80e9-72749958423f', 1, 1920,    1920,    '2025-06-30', 'GMG', 'purchase'),
  -- This is it café Sanikpuri (Elma: 42 cases × 20 × ₹0.90)
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 756,     756,     '2025-06-30', 'GMG', 'purchase'),
  -- House party Sanikpuri (Elma: 60 cases × 20 × ₹0.90)
  ('f04be0ad-ed1a-4cb9-abfd-21750f9ed07b', 1, 1080,    1080,    '2025-06-30', 'GMG', 'purchase'),
  -- Element E7 Kukatpally 255 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 3060,    3060,    '2025-06-30', 'GMG', 'purchase'),
  -- Fusion Aroma Nallagandla 20 cases × 12 × ₹1.00
  ('2e93416d-50bb-4751-85ce-66655d818df7', 1, 240,     240,     '2025-06-30', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-06-30', 'Miscellaneous',   980,  'Transport — Haneel Jun 2025'),
  ('2025-06-30', 'Miscellaneous',   5000, 'Labels — Haneel Jun 2025'),
  ('2025-06-30', 'Label Designing', 1500, 'Label Design — Laya Jun 2025'),
  ('2025-06-30', 'Label Designing', 7000, 'Plates — Jun 2025'),
  ('2025-06-30', 'GST Filing',      1000, 'GST Filing — Haneel Jun 2025');
