-- Fix July 2025 label amounts to match Elma data.
-- Back labels already correct (avg ₹0.26: 50,000 labels × ₹0.26 = ₹13,000 on 2025-07-17).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Jismat Dilshuknagar: ₹16,800 → ₹5,040 (280 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5040, cost_per_label=5040, quantity=1
WHERE id='e8a37800-561a-4a6d-910c-f4057d98acfe';

-- Element E7 Kukatpally: ₹12,000 → ₹2,184 (182 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2184, cost_per_label=2184, quantity=1
WHERE id='159f04fe-ff28-4eda-8a4b-f88e2388c1c3';

-- Golden Pavilion: ₹2,188.90 → ₹1,077.03792 (108.66 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=1077.03792, cost_per_label=1077.03792, quantity=1
WHERE id='ff4b5026-4441-4929-8254-42255d4a5fc5';

-- House Party (wrong client, no branch) → House party Sanikpuri: ₹5,520 → ₹1,890 (105 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET client_id='f04be0ad-ed1a-4cb9-abfd-21750f9ed07b', total_amount=1890, cost_per_label=1890, quantity=1
WHERE id='d180b11c-78ea-46eb-815a-8352e252ee46';

-- Blossamin Spa Tirumalagiri: ₹3,959 → ₹876.15 (45 cases × 30 × ₹0.649)
UPDATE public.label_purchases SET total_amount=876.15, cost_per_label=876.15, quantity=1
WHERE id='87e9ae85-464e-417c-b566-a9cf16730f23';

-- Blossamin Spa: ₹3,500 → ₹0 (zeroed; entry above covers Tirumalagiri)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='d30d3bbd-6f6d-426c-99dd-fe45b12c3e3c';

-- Blossamin Spa: ₹4,800 → ₹0
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='c3865f92-d80c-4493-aeef-605b58c26bd5';

-- Mid Land (no branch) → Mid land Telangana AL 750ml: ₹8,274 → ₹816 (80 cases × 12 × ₹0.85)
UPDATE public.label_purchases SET client_id='b886e6cc-c1f6-400c-b9be-da9b163dc4be', total_amount=816, cost_per_label=816, quantity=1
WHERE id='650d19de-151a-4e01-bf11-a4386d58ac68';

-- Mid Land (no branch) → Mid land AP AL 750ml: ₹2,188.90 → ₹1,326 (130 cases × 12 × ₹0.85)
UPDATE public.label_purchases SET client_id='797f32e1-8464-42dd-b354-71c1019ce7bf', total_amount=1326, cost_per_label=1326, quantity=1
WHERE id='dcc42646-141f-4fe9-991b-3c454ca777ab';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Jismat Ameerpet (Elma: Gismat-Ameerpet) 365 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 6570,       6570,       '2025-07-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 80 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 1440,       1440,       '2025-07-31', 'GMG', 'purchase'),
  -- Gismat Pragathi nagar 50 cases × 20 × ₹0.90
  ('f1e7fb82-e889-4274-9ae3-5219a5a69fe2', 1, 900,        900,        '2025-07-31', 'GMG', 'purchase'),
  -- Gismat Kondapur 189 cases × 20 × ₹0.90
  ('e9f73706-c210-4534-83c7-b03abcc2941b', 1, 3402,       3402,       '2025-07-31', 'GMG', 'purchase'),
  -- Gismat Lakshmipuram 100 cases × 20 × ₹0.90
  ('fd2524a0-b784-40dd-9795-d4c07d99fff7', 1, 1800,       1800,       '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Gachibowli 150 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1800,       1800,       '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Nizampet 50 cases × 12 × ₹1.00
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 600,        600,        '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Tirumalagiri 50 cases × 12 × ₹1.00
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 600,        600,        '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Warangal 235 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 2820,       2820,       '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Ongole 185 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 2220,       2220,       '2025-07-31', 'GMG', 'purchase'),
  -- Biryanis Khammam 250 cases × 12 × ₹1.00
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 3000,       3000,       '2025-07-31', 'GMG', 'purchase'),
  -- Tilaks kitchen Madhapur 212 cases × 20 × ₹0.90
  ('d2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 1, 3816,       3816,       '2025-07-31', 'GMG', 'purchase'),
  -- Deccan kitchen Film nagar (Elma: 750ml) 50 cases × 12 × ₹1.00
  ('9d315841-30f0-478b-8186-15186f1098a8', 1, 600,        600,        '2025-07-31', 'GMG', 'purchase'),
  -- This is it café Sanikpuri 150 cases × 20 × ₹0.90
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 2700,       2700,       '2025-07-31', 'GMG', 'purchase'),
  -- Atias Kitchen Gandipet 45 cases × 12 × ₹1.00
  ('7e33cd87-5c7f-4155-9364-e61383ecf34a', 1, 540,        540,        '2025-07-31', 'GMG', 'purchase'),
  -- Fusion Aroma Nallagandla 27 cases × 12 × ₹1.00
  ('2e93416d-50bb-4751-85ce-66655d818df7', 1, 324,        324,        '2025-07-31', 'GMG', 'purchase'),
  -- Benguluru Bhavan Kondapur 279 cases × 20 × ₹0.90
  ('69f93fbc-ffa7-4e8c-94a7-67f16290f522', 1, 5022,       5022,       '2025-07-31', 'GMG', 'purchase'),
  -- Alley 91 Nanakramguda 46 cases × 20 × ₹0.944
  ('5a8317e2-47d0-4a1b-8fee-8aa406b10ea6', 1, 868.48,     868.48,     '2025-07-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-07-31', 'Miscellaneous',   1610,  'Transport — Haneel Jul 2025'),
  ('2025-07-31', 'Label Designing', 1000,  'Label Design — Laya Jul 2025'),
  ('2025-07-31', 'Admin',           13000, 'Admin Salary — Jul 2025'),
  ('2025-07-31', 'Label Designing', 3500,  'Plates — Jul 2025'),
  ('2025-07-31', 'GST Filing',      1000,  'GST Filing — Haneel Jul 2025');
