-- Fix April 2026 label amounts to match Elma data.
-- Back label price still ₹0.26/label (Jan 2026 batch in use — no new purchase in Apr).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Angana Caters Hyderabad: ₹3,320 → ₹1,726.34
UPDATE public.label_purchases SET total_amount=1726.34, cost_per_label=1726.34, quantity=1
WHERE id='9af3f978-2a2c-4291-84e3-ca51a291f6fb';

-- Benguluru Bhavan Kondapur Apr-28: ₹3,918 → ₹4,500 (250 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=4500, cost_per_label=4500, quantity=1
WHERE id='de18344b-14d8-43e8-a1e1-a09b7a8bbd2b';

-- Benguluru Bhavan Kondapur Apr-15: ₹2,992 → ₹0 (zeroed; Apr-28 entry covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='fd365a20-f987-47df-89ae-0fd6bfa39577';

-- Biryanis and More Ameerpet: ₹8,832 → ₹0 (0 cases in Apr)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='d5679c21-a193-4620-9a11-5d2bf6755acf';

-- Chaitanya's Modern Kitchen Khajaguda: ₹3,883 → ₹3,304 (200 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=3304, cost_per_label=3304, quantity=1
WHERE id='030ebc27-585f-4d37-ad03-a00235a0d556';

-- Element E7 Kukatpally: ₹3,641 → ₹2,232 (186 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2232, cost_per_label=2232, quantity=1
WHERE id='84f987c6-1e79-4336-bdad-5d6d2b801111';

-- First Cut Gowlidoddi: ₹3,320 → ₹804.76 (62 cases per Elma)
UPDATE public.label_purchases SET total_amount=804.76, cost_per_label=804.76, quantity=1
WHERE id='3182a530-50a2-45a6-995d-c833ae3e4466';

-- Gismat Chandha Nagar: ₹2,029.60 → ₹3,060 (170 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3060, cost_per_label=3060, quantity=1
WHERE id='43a639ae-5182-4e61-8add-cb8969d48fe3';

-- Gismat Kondapur: ₹3,936 → ₹3,060 (170 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3060, cost_per_label=3060, quantity=1
WHERE id='4787d9db-28d3-443a-b172-9399f17bb158';

-- Golden Pavilion Banjara Hills: ₹1,836 → ₹921.816 (93 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=921.816, cost_per_label=921.816, quantity=1
WHERE id='d377f01a-7420-4c42-8b80-6ae962125dc5';

-- Hiyya Chrono Jail Mandi Madhapur: ₹2,992 → ₹3,240 (180 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3240, cost_per_label=3240, quantity=1
WHERE id='2c69709c-9de6-415d-9f8a-31b1eae53eb0';

-- Iron hill café Apr-11 JSR Printers: ₹1,500 → ₹0 (design cost moved to misc_expenses)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='61d13625-9c1b-4fd9-b7b4-52320628fe58';

-- Iron hill café Apr-28 Morya: ₹2,974 → ₹2,492.16 (132 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=2492.16, cost_per_label=2492.16, quantity=1
WHERE id='e028430b-310e-4619-afcf-122504f4f5d1';

-- Iron hill café Apr-14 Morya: ₹2,065 → ₹0 (zeroed; Apr-28 entry covers Madhapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='9b43e8cf-780c-401f-a9bf-a4bd769da80c';

-- Jismat Ameerpet: ₹3,953.47 → ₹0 (0 cases in Apr)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='874dc84e-a286-4f63-aa0f-2f61189d4c56';

-- Jismat Dilshuknagar: ₹4,327 → ₹5,580 (310 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5580, cost_per_label=5580, quantity=1
WHERE id='c5a734a3-6115-4164-b65a-b8805b4075e8';

-- Maryadha Ramanna Kondapur: ₹1,977 → ₹1,638 (91 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=1638, cost_per_label=1638, quantity=1
WHERE id='0b1d8733-b2ef-470a-97b7-d8efab3445f3';

-- Soul of South Film nagar: ₹1,977 → ₹944 (50 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=944, cost_per_label=944, quantity=1
WHERE id='79c0bb7d-7c97-44e8-8301-4b9a3b5bf3e7';

-- Thatha Kottu Tiffins Madhapur: ₹2,013 → ₹944 (50 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=944, cost_per_label=944, quantity=1
WHERE id='31c18e4c-8c74-4585-a6ca-caf917026ae5';

-- This is it café Sanikpuri: ₹1,959 → ₹2,448 (136 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2448, cost_per_label=2448, quantity=1
WHERE id='84befaf6-e43c-4930-836e-37514ffecce4';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Alley 91 Nanakramguda: 25 cases 500ml × 20 × ₹0.944 + 85 cases 250ml × 30 × ₹0.944 = ₹2,879.20
  ('5a8317e2-47d0-4a1b-8fee-8aa406b10ea6', 1, 2879.2,   2879.2,   '2026-04-30', 'Morya labels', 'purchase'),
  -- Biryanis and More Gachibowli: 100 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1200,     1200,     '2026-04-30', 'GMG', 'purchase'),
  -- Biryanis and More Warangal: 320 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3840,     3840,     '2026-04-30', 'GMG', 'purchase'),
  -- Illuzion Jubilee Hills: 141 cases × 12 × ₹0.944
  ('fb97d055-47fa-48ad-9fbf-817bfce59006', 1, 1597.248, 1597.248, '2026-04-30', 'Morya labels', 'purchase'),
  -- Maryadha Ramanna L B Nagar: 154 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 2772,     2772,     '2026-04-30', 'GMG', 'purchase'),
  -- Soul of South Financial District: 64 cases × 20 × ₹0.944
  ('c66dbbc1-95da-46bf-a01e-4d5758901dcd', 1, 1208.32,  1208.32,  '2026-04-30', 'Morya labels', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-04-30', 'Miscellaneous',   2920,  'Transport — Haneel Apr 2026'),
  ('2026-04-30', 'Label Designing', 1000,  'Label Design — Laya Apr 2026'),
  ('2026-04-30', 'Admin',           13000, 'Admin Salary — Apr 2026'),
  ('2026-04-30', 'Miscellaneous',   900,   'Website Purchase — Apr 2026'),
  ('2026-04-30', 'Label Designing', 1200,  'Iron Hill Label Design — Apr 2026'),
  ('2026-04-30', 'Miscellaneous',   1000,  'Alley 91 Commission — Apr 2026'),
  ('2026-04-30', 'Admin',           500,   'Admin Phone Bill — Apr 2026'),
  ('2026-04-30', 'Miscellaneous',   600,   'WhatsApp Subscription — Apr 2026'),
  ('2026-04-30', 'GST Filing',      1000,  'GST Filing — Haneel Apr 2026');
