-- Fix February 2026 label amounts to match Elma data.
-- No back_label_purchases batch in Feb — cost is usage-based from Jan 24 batch (₹0.26/label).
-- avgBackLabelPrice is now derived from most-recent purchase ≤ period end (code fix applied separately).
-- Transport costs untouched per policy.

-- ── UPDATES to existing label_purchases ─────────────────────────────────────

-- Alley 91 Nanakramguda: ₹2,309.14 → ₹0 (0 cases dispatched in Feb)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='10e84b98-fe4a-4f4f-9482-77994d367645';

-- Alley 91 Nanakramguda: ₹1,958.80 → ₹0 (0 cases dispatched in Feb)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='86ede915-e84e-42d8-b1f2-d07bab6e6d74';

-- Biryanis and More Ameerpet: ₹8,651.76 → ₹0 (0 cases in Feb)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='5cac7ccd-ec41-4d27-8721-ea5c6f9e1a4c';

-- Benguluru Bhavan Kondapur: ₹4,239 → ₹3,816 (212 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3816, cost_per_label=3816, quantity=1
WHERE id='6e874afc-b77d-438e-a84b-eb5cfff4393f';

-- Chaitanya's Modern Kitchen Khajaguda: ₹4,113.95 → ₹2,478 (150 cases × 20 × ₹0.826)
UPDATE public.label_purchases SET total_amount=2478, cost_per_label=2478, quantity=1
WHERE id='f9c2daf1-2360-4663-af07-34557a817599';

-- Gismat Kondapur: ₹4,469.84 → ₹3,258 (181 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3258, cost_per_label=3258, quantity=1
WHERE id='fe0d81d5-c8d3-4166-9765-e5ed81e516be';

-- Golden Pavilion Banjara Hills: ₹1,707.34 → ₹584.808 (59 cases × 12 × ₹0.826)
UPDATE public.label_purchases SET total_amount=584.808, cost_per_label=584.808, quantity=1
WHERE id='95de806b-c6ca-410f-b82a-f412d5684c3f';

-- Hiyya Chrono Jail Mandi Madhapur: ₹3,953.47 → ₹3,852 (214 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=3852, cost_per_label=3852, quantity=1
WHERE id='03c1f810-73f3-4ead-bdb8-39e5b388cbd6';

-- Hiyya Chrono Jail Mandi Madhapur: ₹3,810.93 → ₹0 (zeroed; entry above covers Madhapur)
UPDATE public.label_purchases SET total_amount=0, cost_per_label=0, quantity=1
WHERE id='fa6b6446-9451-4176-b73a-b412fafcbf66';

-- Jismat Dilshuknagar: ₹5,770.67 → ₹4,860 (270 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=4860, cost_per_label=4860, quantity=1
WHERE id='e405fedb-2508-4d19-922a-8ac32da47904';

-- This is it café Sanikpuri: ₹3,935.54 → ₹2,736 (152 cases × 20 × ₹0.90)
UPDATE public.label_purchases SET total_amount=2736, cost_per_label=2736, quantity=1
WHERE id='a6830141-0250-49f2-aa36-89612de9f08b';

-- ── INSERTS for missing per-client labels ───────────────────────────────────

INSERT INTO public.label_purchases (client_id, quantity, cost_per_label, total_amount, purchase_date, vendor_id, record_type) VALUES
  -- Biryanis and More Gachibowli 100 cases × 12 × ₹1.00
  ('8ea3202d-2fab-478a-9ca3-390cbd17f4fe', 1, 1200,     1200,     '2026-02-28', 'GMG', 'purchase'),
  -- Biryanis and More Ongole 320 cases × 12 × ₹1.00
  ('7010c9bf-8522-40f1-88fb-b97cdd5dc0b7', 1, 3840,     3840,     '2026-02-28', 'GMG', 'purchase'),
  -- Biryanis and More Warangal 335 cases × 12 × ₹1.00
  ('bb9f701c-ef79-4f46-8b2e-62c69ce1306a', 1, 4020,     4020,     '2026-02-28', 'GMG', 'purchase'),
  -- Element E7 Kukatpally 95 cases × 12 × ₹1.00
  ('654230b8-1058-46bf-b571-19774cae82a3', 1, 1140,     1140,     '2026-02-28', 'GMG', 'purchase'),
  -- Jismat Ameerpet (Gismat-Ameerpet) 130 cases × 20 × ₹0.90
  ('071556e7-be52-4caf-98a7-c0f09210978f', 1, 2340,     2340,     '2026-02-28', 'GMG', 'purchase'),
  -- Gismat Chandha Nagar 110 cases × 20 × ₹0.90
  ('54bf3b3d-63c5-494d-b992-d4976fc026fb', 1, 1980,     1980,     '2026-02-28', 'GMG', 'purchase'),
  -- Soul of South Film nagar 47 cases × 20 × ₹0.944
  ('4b35acbf-5a5d-4dfe-bba2-2ad49ae711bc', 1, 887.36,   887.36,   '2026-02-28', 'Morya labels', 'purchase');

-- ── Misc / overhead expenses ────────────────────────────────────────────────

INSERT INTO public.misc_expenses (expense_date, category, amount, description) VALUES
  ('2026-02-28', 'Miscellaneous',   2450,  'Transport — Haneel Feb 2026'),
  ('2026-02-28', 'Label Designing', 2000,  'Label Design — Laya Feb 2026'),
  ('2026-02-28', 'Admin',           13000, 'Admin Salary — Feb 2026'),
  ('2026-02-28', 'Miscellaneous',   4980,  'Alley 91 Commission — Feb 2026'),
  ('2026-02-28', 'Admin',           500,   'Admin Phone Bill — Feb 2026'),
  ('2026-02-28', 'Miscellaneous',   500,   'WhatsApp Subscription — Feb 2026'),
  ('2026-02-28', 'GST Filing',      1000,  'GST Filing — Haneel Feb 2026');
