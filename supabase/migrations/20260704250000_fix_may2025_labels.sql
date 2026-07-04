-- Fix May 2025 label amounts to match Elma data.
-- Back labels already correct (avg ₹0.26 from back_label_purchases).
-- Transport ₹2,025 unlinked already in DB.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Aaha: ₹8,800 → ₹729
UPDATE public.label_purchases SET total_amount=729, cost_per_label=729, quantity=1
WHERE id='9e5a69e8-aa7a-43e5-94a5-a9b3597669a5';

-- Atias Kitchen: ₹6,480 → ₹1,020
UPDATE public.label_purchases SET total_amount=1020, cost_per_label=1020, quantity=1
WHERE id='08c3e115-4d59-454f-9253-cf7e140a516e';

-- Biryanis Ameerpet Plates ₹3,500 → ₹0 (plate/mould cost, not per-client label)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='123de3d6-5447-4755-b85d-4322057bd586';

-- Biryanis Ameerpet ₹10,800 → ₹1,908 (was bulk for all branches, now only Ameerpet)
UPDATE public.label_purchases SET total_amount=1908, cost_per_label=1908, quantity=1
WHERE id='88b2864e-bbe6-42d3-b520-adc57ab8aeab';

-- Biryanis Ameerpet ₹15,900 → ₹0 (zeroed; individual branch entries added below)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='c2827ca0-3d9d-42c2-ae5d-20eee068778e';

-- Deccan kitchen ₹6,360 → ₹3,164.28 (750ml ₹2,520 + 250ml ₹644.28)
UPDATE public.label_purchases SET total_amount=3164.28, cost_per_label=3164.28, quantity=1
WHERE id='dca5c415-8488-4736-8b77-99c03121ed0d';

-- Fusion Aroma ₹6,360 → ₹228
UPDATE public.label_purchases SET total_amount=228, cost_per_label=228, quantity=1
WHERE id='7857c944-7670-4af1-a214-394c8e75e385';

-- Jismat Dilshuknagar ₹8,440 → ₹5,454
UPDATE public.label_purchases SET total_amount=5454, cost_per_label=5454, quantity=1
WHERE id='fe103e72-6e50-489a-8adb-27b1a7e19183';

-- Jismat Dilshuknagar ₹12,800 → ₹0 (zeroed; single entry above covers Dilshuknagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='d440c193-b0ed-4e61-9f94-3fb81979e8ff';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Jismat Ameerpet
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 6750,    6750,    '2025-05-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar
  ('a24068ac-2a15-479a-8292-7422adf32f21', 1, 720,     720,     '2025-05-31', 'GMG', 'purchase'),
  -- Gismat Pragathi nagar
  ('f1e7fb82-e889-4274-9ae3-5219a5a69fe2', 1, 900,     900,     '2025-05-31', 'GMG', 'purchase'),
  -- Gismat Kondapur
  ('c23daee9-4068-4024-b50c-50cb6bbde582', 1, 2880,    2880,    '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Gachibowli
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1560,    1560,    '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Nizampet
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 900,     900,     '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Tirumalagiri
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 900,     900,     '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Warangal
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 4440,    4440,    '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Ongole
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3720,    3720,    '2025-05-31', 'GMG', 'purchase'),
  -- Biryanis Khammam
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 3000,    3000,    '2025-05-31', 'GMG', 'purchase'),
  -- Element E7
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 2580,    2580,    '2025-05-31', 'GMG', 'purchase'),
  -- Tilaks kitchen
  ('d2fa0e28-9aa8-4bf1-8e4a-dd7af460eec6', 1, 4500,    4500,    '2025-05-31', 'GMG', 'purchase'),
  -- This is it café (Sanikpuri)
  ('879dcdbc-ef73-4a73-8ce5-ed638c09f50a', 1, 3330,    3330,    '2025-05-31', 'GMG', 'purchase'),
  -- House party (Sanikpuri)
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 2664,    2664,    '2025-05-31', 'GMG', 'purchase'),
  -- Golden Pavilion
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 1239,    1239,    '2025-05-31', 'GMG', 'purchase'),
  -- Good Vibes
  ('d36be788-144a-4e83-b2f4-6894ec205964', 1, 486,     486,     '2025-05-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2025-05-31', 'Miscellaneous',   3000, 'Labels — Haneel May 2025'),
  ('2025-05-31', 'Label Designing', 3000, 'Label Design — Laya May 2025'),
  ('2025-05-31', 'GST Filing',      1000, 'GST Filing — Haneel May 2025');
