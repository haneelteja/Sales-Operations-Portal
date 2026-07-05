-- Fix May 2026 label amounts to match Elma data.
-- Back label price still ₹0.26/label (Jan 2026 batch in use — no new purchase in May).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Alley 91 Nanakramguda May-05 row A: → ₹2,256.16 (55 cases 500ml × 20 × ₹0.944 + 43 cases 250ml × 30 × ₹0.944)
UPDATE public.label_purchases SET total_amount=2256.16, cost_per_label=2256.16, quantity=1
WHERE id='06220a7d-151d-45b8-98aa-5b69e840474e';

-- Alley 91 Nanakramguda May-05 row B: ₹3,379.99 → ₹0 (zeroed; row above covers combined)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='779c38de-591d-4757-b5a0-088f30285918';

-- Angana Caters Hyderabad: ₹2,354 → ₹0 (0 cases in May)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='e55f38f8-5c05-4780-adac-5aa6277154e1';

-- Benguluru Bhavan Kondapur: ₹3,918 → ₹4,950 (275 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=4950, cost_per_label=4950, quantity=1
WHERE id='1033d744-b218-4c67-8255-ee8deba52cb6';

-- Biryanis and More Ameerpet: ₹5,932 → ₹0 (0 cases in May)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='ca8b1a4d-de3c-4d2a-ae0a-396a37039839';

-- Chaitanya's Modern Kitchen Khajaguda: ₹3,936 → ₹3,436.16 (208 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=3436.16, cost_per_label=3436.16, quantity=1
WHERE id='b1726ad7-861a-438e-8bbc-d8df4e73c36c';

-- Element E7 Kukatpally: ₹3,529 → ₹2,616 (218 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=2616, cost_per_label=2616, quantity=1
WHERE id='30873b42-6712-45fc-8969-c4edbbce22f6';

-- Gismat Kondapur May-16: ₹2,974 → ₹3,780 (210 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3780, cost_per_label=3780, quantity=1
WHERE id='d2816046-a399-4111-9835-38e95d485d51';

-- Gismat Kondapur May-25: ₹3,936 → ₹0 (zeroed; May-16 entry covers Kondapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='1a5e3643-0807-4347-94fb-73ae14900b3c';

-- Hiyya Chrono Jail Mandi Madhapur: ₹3,009 → ₹5,580 (310 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5580, cost_per_label=5580, quantity=1
WHERE id='aeb9da8f-ce7b-4fb4-849e-b81cfd300228';

-- Hiyya Dino Mandi Kukatpally May-08: ₹3,804 → ₹5,418 (301 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5418, cost_per_label=5418, quantity=1
WHERE id='82cc2d78-a838-494f-8376-ba2ada158b97';

-- Hiyya Dino Mandi Kukatpally May-19: ₹3,918 → ₹0 (zeroed; May-08 entry covers Hiyya Dino)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='108858a7-38d7-421d-ad7b-dfa1ed2b8a51';

-- Hiyya Dino Mandi Kukatpally May-06 Haneel: ₹1,800 → ₹0 (design cost moved to misc_expenses)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='1e87c891-ba84-4544-a34d-dd3ce10b6e62';

-- Illuzion Jubilee Hills: ₹2,644.40 → ₹736.32 (65 cases × 12 × ₹0.944)
UPDATE public.label_purchases SET total_amount=736.32, cost_per_label=736.32, quantity=1
WHERE id='ec1b57af-4346-4cd6-a0fd-526b13b29f2f';

-- Jismat Dilshuknagar: ₹5,165 → ₹5,760 (320 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=5760, cost_per_label=5760, quantity=1
WHERE id='227e605b-baa9-4aa4-af0a-19c6a02ecdb1';

-- Maryadha Ramanna Kondapur: ₹4,880 → ₹900 (50 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=900, cost_per_label=900, quantity=1
WHERE id='53db192b-0f1f-4317-ab66-bc8e6134c659';

-- Soul of South Film nagar: ₹3,383 → ₹1,699.20 (90 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=1699.2, cost_per_label=1699.2, quantity=1
WHERE id='06572e24-eda6-42df-9a37-a0a8abfd269f';

-- Tawalogy Gandipet: ₹1,982 → ₹600 (50 cases × 12 × ₹1.00)
UPDATE public.label_purchases SET total_amount=600, cost_per_label=600, quantity=1
WHERE id='5776879f-dcd7-4b49-a478-7ce2b779fed0';

-- Thatha Kottu Tiffins Madhapur May-08: ₹1,973 → ₹2,208.96 (117 cases × 20 × ₹0.944)
UPDATE public.label_purchases SET total_amount=2208.96, cost_per_label=2208.96, quantity=1
WHERE id='21314c75-6f0c-4ca7-a9f6-102bf781921c';

-- Thatha Kottu Tiffins Madhapur May-25: ₹2,048 → ₹0 (zeroed; May-08 entry covers Madhapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='cf34f049-bb7e-45f5-9dd5-51faa3b2ba39';

-- This is it café Sanikpuri: ₹1,982 → ₹2,466 (137 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2466, cost_per_label=2466, quantity=1
WHERE id='87eeb10a-bb64-44db-8b05-311bad6a5dfe';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Biryanis and More Gachibowli: 70 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 840,     840,     '2026-05-31', 'GMG', 'purchase'),
  -- Biryanis and More Ongole: 315 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3780,    3780,    '2026-05-31', 'GMG', 'purchase'),
  -- Biryanis and More Warangal: 280 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 3360,    3360,    '2026-05-31', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar: 128 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 2304,    2304,    '2026-05-31', 'GMG', 'purchase'),
  -- Golden Pavilion Banjara Hills: 150 cases × 12 × ₹0.826
  ('19a0035e-cee5-4d54-92c8-93184cda4fd3', 1, 1486.8,  1486.8,  '2026-05-31', 'Morya labels', 'purchase'),
  -- Happy Monkeys Nagole: 54 cases × 20 × ₹0.944
  ('6164583a-8656-4057-9e85-ac3599f18eeb', 1, 1019.52, 1019.52, '2026-05-31', 'Morya labels', 'purchase'),
  -- House party Sanikpuri: 37 cases × 20 × ₹0.90
  ('549482c2-5eb4-41db-b52b-210205fb60c0', 1, 666,     666,     '2026-05-31', 'GMG', 'purchase'),
  -- Iron hill café Madhapur: 107 cases × 20 × ₹0.944
  ('a90ba20e-eb4d-4259-b57f-4e19327ebf5e', 1, 2020.16, 2020.16, '2026-05-31', 'Morya labels', 'purchase'),
  -- Maryadha Ramanna L B Nagar: 135 cases × 20 × ₹0.90
  ('587eee6f-9afa-4f07-a920-baaa7ed0cc2b', 1, 2430,    2430,    '2026-05-31', 'GMG', 'purchase'),
  -- Soul of South Financial District: 107 cases × 20 × ₹0.944
  ('c66dbbc1-95da-46bf-a01e-4d5758901dcd', 1, 2020.16, 2020.16, '2026-05-31', 'Morya labels', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-05-31', 'Miscellaneous',   8440,  'Transport — Haneel May 2026'),
  ('2026-05-31', 'Label Designing', 2750,  'Hiyya Dino Label Design — May 2026'),
  ('2026-05-31', 'Label Designing', 2500,  'Label Design — Laya May 2026'),
  ('2026-05-31', 'Admin',           13000, 'Admin Salary — May 2026'),
  ('2026-05-31', 'Admin',           500,   'Admin Phone Bill — May 2026'),
  ('2026-05-31', 'Miscellaneous',   600,   'WhatsApp Subscription — May 2026'),
  ('2026-05-31', 'GST Filing',      1000,  'GST Filing — Haneel May 2026');
