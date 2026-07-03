-- Fix sub-₹1 rounding differences vs Elma across 4 clients:
--
-- 1. Fusion Aroma (Nallagandla): payment ₹206.33 → ₹206.00
--    Outstanding: -₹0.33 → ₹0
--
-- 2. Gunugu Caters (Gowlidoddi): sale ₹9,642.50 → ₹9,643.00
--    Outstanding: ₹9,642.50 → ₹9,643
--
-- 3. Deccan kitchen (Film nagar): round all five fractional amounts
--    Sales:    ₹4,042.50→₹4,043  ₹7,507.50→₹7,508  ₹6,737.50→₹6,738
--    Payments: ₹20,398.50→₹20,399  ₹7,507.50→₹7,508
--    Net change to outstanding: sales +₹1.50, payments +₹1.00 → +₹0.50
--    Outstanding: ₹47,105.50 → ₹47,106
--
-- 4. Golden Pavilion (Banjara Hills): payment ₹27,924 → ₹27,925
--    Outstanding: ₹48,497 → ₹48,496

-- 1. Fusion Aroma payment
UPDATE public.sales_transactions
SET amount = 206.00, total_amount = 206.00
WHERE id = 'a58d3c2f-a473-4535-a02e-dfb4d50d6204';

-- 2. Gunugu Caters sale
UPDATE public.sales_transactions
SET amount = 9643.00, total_amount = 9643.00
WHERE id = '406a34c1-a0b9-4f00-af3f-e11039cdf4d4';

-- 3a. Deccan kitchen sale ₹4,042.50 (Apr 11 2025)
UPDATE public.sales_transactions
SET amount = 4043.00, total_amount = 4043.00
WHERE id = '7fc3a872-647e-4736-9927-ff39c941a623';

-- 3b. Deccan kitchen sale ₹7,507.50 (May 28 2025)
UPDATE public.sales_transactions
SET amount = 7508.00, total_amount = 7508.00
WHERE id = '307f2a85-97ec-4fbf-9241-ad1bd55fea6b';

-- 3c. Deccan kitchen sale ₹6,737.50 (Sep 23 2025)
UPDATE public.sales_transactions
SET amount = 6738.00, total_amount = 6738.00
WHERE id = '9903b1e5-038c-450d-9693-89dce7b49687';

-- 3d. Deccan kitchen payment ₹20,398.50 (May 27 2025)
UPDATE public.sales_transactions
SET amount = 20399.00, total_amount = 20399.00
WHERE id = '39f602be-1590-4ee3-b9fd-35a26b7210dc';

-- 3e. Deccan kitchen payment ₹7,507.50 (Sep 12 2025)
UPDATE public.sales_transactions
SET amount = 7508.00, total_amount = 7508.00
WHERE id = 'e70b528f-4289-4880-9ad4-b626e856e538';

-- 4. Golden Pavilion payment ₹27,924 → ₹27,925 (May 29 2026)
UPDATE public.sales_transactions
SET amount = 27925.00, total_amount = 27925.00
WHERE id = '5c3e17d9-3fa9-4f1b-891d-08378729b35b';
