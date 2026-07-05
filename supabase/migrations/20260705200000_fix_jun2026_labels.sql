-- Fix June 2026 label amounts to match Elma data.
-- Back label price still ₹0.26/label (Jan 2026 batch in use — no new purchase in Jun).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Ballu Kitchen Kondapur Jun-14: ₹3,775.06 → ₹2,676 (223 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2676, cost_per_label=2676, quantity=1
WHERE id='ec0b0542-4b25-49b7-9620-97731cf16cf7';

-- Ballu Kitchen Kondapur Jun-04: ₹3,730 → ₹0 (zeroed; Jun-14 entry covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='f2246a4b-e629-4ee3-afb3-763f2c0e046f';

-- Benguluru Bhavan Kondapur: ₹2,832 → ₹5,418 (301 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5418, cost_per_label=5418, quantity=1
WHERE id='46e700f2-69ca-4dbb-8da4-181effe83887';

-- Biryanis and More Ameerpet Jun-10: ₹5,097.60 → ₹0 (0 cases in Jun)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='0b53be0b-4b0f-444e-8fb6-7243eb5d120d';

-- Biryanis and More Ameerpet Jun-18: ₹5,842.42 → ₹0 (0 cases in Jun)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='23f2d5cb-ceb4-45bc-ad30-a46d31a76796';

-- Chandhu Poda Marriage Order Ongole: ₹2,689.46 → ₹2,888.64 (153 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=2888.64, cost_per_label=2888.64, quantity=1
WHERE id='b2dfcad4-fa93-47e5-8c63-44ddf0335351';

-- Hiyya Chrono Jail Mandi Madhapur Jun-14: ₹2,012.61 → ₹3,528 (196 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3528, cost_per_label=3528, quantity=1
WHERE id='0d8bb8c7-33ea-4ea9-8a11-a2006dd47e7b';

-- Hiyya Chrono Jail Mandi Madhapur Jun-10: ₹1,888 → ₹0 (zeroed; Jun-14 entry covers Madhapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='468efa20-752f-4fb6-8ece-aa268fb51441';

-- Hiyya Dino Mandi Kukatpally: ₹3,776 → ₹6,282 (349 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=6282, cost_per_label=6282, quantity=1
WHERE id='f8838e6b-15ca-4401-af17-6313e6a530c1';

-- Iron hill café Madhapur: ₹2,048 → ₹3,001.92 (159 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=3001.92, cost_per_label=3001.92, quantity=1
WHERE id='7d42e0bf-73a4-4a50-94b8-b29c18a4131e';

-- Jismat Dilshuknagar: ₹3,776 → ₹5,094 (283 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5094, cost_per_label=5094, quantity=1
WHERE id='914a6c4c-1c19-4541-9e94-da3541240e9e';

-- Maryadha Ramanna Kondapur: ₹2,137 → ₹1,188 (66 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=1188, cost_per_label=1188, quantity=1
WHERE id='1bff509b-9c68-4a19-a0d7-faa19a792bff';

-- Soul of South Film nagar: ₹2,012.61 → ₹944 (50 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=944, cost_per_label=944, quantity=1
WHERE id='dedccc27-b522-46ed-b53c-c08a9d2c2ff9';

-- Sri Sri Group Khammam row 1: ₹3,752.40 → ₹1,320 (Sri Sri 1000ml: 110 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=1320, cost_per_label=1320, quantity=1
WHERE id='0f983ab9-01ff-4fa3-b345-833e2c9bb3f5';

-- Sri Sri Group Khammam row 2: ₹4,060.14 → ₹3,039.68 (Sri Sri 500ml: 161 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=3039.68, cost_per_label=3039.68, quantity=1
WHERE id='1af9bd4e-87b5-451a-82cc-4b88b4309953';

-- This is it café Sanikpuri: ₹2,065.47 → ₹2,700 (150 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2700, cost_per_label=2700, quantity=1
WHERE id='39044503-e6fd-4fc7-8956-1cc0597a2661';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Alley 91 Nanakramguda 250ml: 67 cases × 30 × ₹0.944 (500ml 0 cases in Jun)
  ('5a8317e2-47d0-4a1b-8fee-8aa406b10ea6', 1, 1897.44, 1897.44, '2026-06-30', 'Morya labels', 'purchase'),
  -- Biryanis and More Gachibowli: 150 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1800,    1800,    '2026-06-30', 'GMG', 'purchase'),
  -- Biryanis and More Khammam: 300 cases × 12 × ₹1.00
  ('b230e01b-b426-4494-92a9-c4045fe6fc64', 1, 3600,    3600,    '2026-06-30', 'GMG', 'purchase'),
  -- Biryanis and More Ongole: 170 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 2040,    2040,    '2026-06-30', 'GMG', 'purchase'),
  -- Biryanis and More Warangal: 300 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3600,    3600,    '2026-06-30', 'GMG', 'purchase'),
  -- Chaitanya's Modern Kitchen Khajaguda: 212 cases × 20 × ₹0.826
  ('04935f42-d9ec-4ae2-b433-8737f4270eff', 1, 3502.24, 3502.24, '2026-06-30', 'Morya labels', 'purchase'),
  -- Element E7 Kukatpally: 200 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 2400,    2400,    '2026-06-30', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar: 159 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 2862,    2862,    '2026-06-30', 'GMG', 'purchase'),
  -- Gismat Kondapur: 200 cases × 20 × ₹0.90
  ('e9f73706-c210-4534-83c7-b03abcc2941b', 1, 3600,    3600,    '2026-06-30', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills: 61 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 604.632, 604.632, '2026-06-30', 'Morya labels', 'purchase'),
  -- Illuzion Jubilee Hills: 67 cases × 12 × ₹0.944
  ('fb97d055-47fa-48ad-9fbf-817bfce59006', 1, 758.976, 758.976, '2026-06-30', 'Morya labels', 'purchase'),
  -- Tawalogy Gandipet: 36 cases × 12 × ₹1.00
  ('6ce0fbbb-bda1-415b-81eb-9c31ee9be062', 1, 432,     432,     '2026-06-30', 'GMG', 'purchase'),
  -- Thatha Kottu Tiffins Madhapur: 153 cases × 20 × ₹0.944
  ('ba30fb78-709e-4273-8f77-96f2e8418163', 1, 2888.64, 2888.64, '2026-06-30', 'Morya labels', 'purchase'),
  -- Soul of South Financial District: 40 cases × 20 × ₹0.944
  ('c66dbbc1-95da-46bf-a01e-4d5758901dcd', 1, 755.2,   755.2,   '2026-06-30', 'Morya labels', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-06-30', 'Miscellaneous',   3930,  'Transport — Haneel Jun 2026'),
  ('2026-06-30', 'Label Designing', 5000,  'Label Design — Laya Jun 2026'),
  ('2026-06-30', 'Admin',           13000, 'Admin Salary — Jun 2026'),
  ('2026-06-30', 'Admin',           500,   'Admin Phone Bill — Jun 2026'),
  ('2026-06-30', 'Miscellaneous',   600,   'WhatsApp Subscription — Jun 2026'),
  ('2026-06-30', 'GST Filing',      1000,  'GST Filing — Haneel Jun 2026');
