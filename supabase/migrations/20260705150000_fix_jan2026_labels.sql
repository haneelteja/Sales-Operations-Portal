-- Fix January 2026 label amounts to match Elma data.
-- Back labels: 48,000 × ₹0.26 = ₹12,480 on 2026-01-24 (already in back_label_purchases). avgBackLabelPrice = ₹0.26.
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Alley 91 Nanakramguda: ₹2,496.88 → ₹5,607.36 (combined: 114 cases 500ml × 20 × ₹0.944 = ₹2,152.32 + 122 cases 250ml × 30 × ₹0.944 = ₹3,455.04)
UPDATE public.label_purchases SET total_amount=5607.36, cost_per_label=5607.36, quantity=1
WHERE id='047b7018-fcaf-4ead-935b-7ab076da274c';

-- Alley 91 Nanakramguda: ₹1,357.06 → ₹0 (zeroed; entry above covers Nanakramguda)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='6572ee45-82fd-404d-8666-4c7a80902514';

-- Biryanis and More Ameerpet: ₹3,192 → ₹0 (0 cases in Jan)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='306a6f8b-0775-4079-bcc6-387fd4dc83d3';

-- Element E7 Kukatpally: ₹5,325.58 → ₹2,820 (235 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2820, cost_per_label=2820, quantity=1
WHERE id='831afba5-3c33-4d6d-bdae-c2ad3b22bf44';

-- Gismat Kondapur: ₹3,027.41 → ₹1,980 (110 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=1980, cost_per_label=1980, quantity=1
WHERE id='4e2c7a82-7d2e-44da-9c59-778004cdb2b0';

-- Gismat Kondapur: ₹1,735.07 → ₹0 (zeroed; entry above covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='7409e53f-2f22-4dcd-9c78-dd2517f0f38f';

-- Happy Monkeys Nagole: ₹1,994.67 → ₹944 (50 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=944, cost_per_label=944, quantity=1
WHERE id='f374a0bc-c1c0-4380-81ad-7752f2193a00';

-- Happy Monkeys Nagole: ₹1,596 → ₹0 (zeroed; entry above covers Nagole)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='8f65a773-1c32-437e-97ed-a40a336a5b56';

-- Illuzion Jubilee Hills: ₹2,684.74 → ₹0 (not in Elma Jan 2026 data)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='d3d6a955-f9a4-4f63-8ee9-fbf73016b598';

-- Jismat Dilshuknagar: ₹8,637.60 → ₹5,940 (330 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5940, cost_per_label=5940, quantity=1
WHERE id='1f2b8c09-d176-47ba-a903-d4ff85707ee9';

-- Jismat Dilshuknagar: ₹3,334.21 → ₹0 (zeroed; entry above covers Dilshuknagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='a1bb4a81-d5af-4cc7-9b20-6aa7bdb2468e';

-- Soul of South Film nagar: ₹2,101.34 → ₹1,585.92 (84 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=1585.92, cost_per_label=1585.92, quantity=1
WHERE id='3c1d10b1-5873-4af5-a9a9-538eed1f738d';

-- Soul of South Film nagar: ₹1,750.18 → ₹0 (zeroed; entry above covers Film nagar)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='a0e1262f-b696-4530-a2c0-30fa56cc02af';

-- This is it café Sanikpuri: ₹3,044.40 → ₹1,710 (95 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=1710, cost_per_label=1710, quantity=1
WHERE id='780de11f-e185-4233-98af-a5b3ff81a9ea';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Benguluru Bhavan Kondapur 304 cases × 20 × ₹0.90
  ('69f93fbc-ffa7-4e8c-94a7-67f16290f522', 1, 5472,     5472,     '2026-01-31', 'GMG', 'purchase'),
  -- Biryanis and More Chandha Nagar 99 cases × 12 × ₹1.00
  ('a91e976b-4612-4c9c-a363-6ad941ae093e', 1, 1188,     1188,     '2026-01-31', 'GMG', 'purchase'),
  -- Biryanis and More Gachibowli 80 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 960,      960,      '2026-01-31', 'GMG', 'purchase'),
  -- Biryanis and More Nizampet 50 cases × 12 × ₹1.00
  ('05d11a46-38df-4a75-af73-4db2f2d951ad', 1, 600,      600,      '2026-01-31', 'GMG', 'purchase'),
  -- Biryanis and More Tirumalagiri 50 cases × 12 × ₹1.00
  ('4a1f31b5-f70a-4218-9b1e-cc617bd2f307', 1, 600,      600,      '2026-01-31', 'GMG', 'purchase'),
  -- Chaitanya's Modern Kitchen Khajaguda 117 cases × 20 × ₹0.826
  ('4cada784-9ab9-4f68-9571-11d59ad6af9d', 1, 1932.84,  1932.84,  '2026-01-31', 'Morya labels', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 70 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 1260,     1260,     '2026-01-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 100 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 1800,     1800,     '2026-01-31', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills 99 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 981.288,  981.288,  '2026-01-31', 'Morya labels', 'purchase'),
  -- Hiyya Chrono Jail Mandi Madhapur 100 cases × 20 × ₹0.90
  ('4cf0c485-a5f7-4978-a311-ac3ae99d85c4', 1, 1800,     1800,     '2026-01-31', 'GMG', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-01-31', 'Miscellaneous',   4160,  'Transport — Haneel Jan 2026'),
  ('2026-01-31', 'Label Designing', 2000,  'Label Design — Laya Jan 2026'),
  ('2026-01-31', 'Admin',           13000, 'Admin Salary — Jan 2026'),
  ('2026-01-31', 'Miscellaneous',   2600,  'Alley 91 Commission — Jan 2026'),
  ('2026-01-31', 'Admin',           500,   'Admin Phone Bill — Jan 2026'),
  ('2026-01-31', 'Miscellaneous',   500,   'WhatsApp Subscription — Jan 2026'),
  ('2026-01-31', 'GST Filing',      1000,  'GST Filing — Haneel Jan 2026');
