-- Fix 18 transport_expenses rows that were entered without a vendor/group.
-- Three buckets:
--   1. Intercity Bachupally trips (Nov–Dec 2025) — delivered via Porter
--   2. Client-specific deliveries/labour — Client Sale Transport
--   3. Label pickup trips — labels

-- 1. Eight Intercity Bachupally deliveries → Porter
UPDATE public.transport_expenses
SET transport_vendor = 'Porter',
    expense_group    = 'Porter'
WHERE id IN (
  'd8794ee8-a7f1-49a3-8446-5ce38a228627',
  '2473c754-a286-464e-be85-9df8ac4a908b',
  'e09009b1-8d6f-4a8f-b317-9d407bfca029',
  '23ee4a8f-fd7d-40d1-b31b-d8a101071f11',
  '7b020dbd-543c-41fe-8402-999316adfe50',
  '637b0b03-900a-4342-83ce-070d5fc13851',
  '6345f8b8-45d6-443d-9f28-c523ee1e8e31',
  '906d55df-92f5-4779-a127-227ccce17e30'
);

-- 2. Six client-named deliveries/labour → Client Sale Transport
UPDATE public.transport_expenses
SET expense_group = 'Client Sale Transport'
WHERE id IN (
  '37e7a375-7c7f-42b2-94a1-632341075719',  -- This is It café Transport (Feb 26)
  '874f5d48-1b60-4653-bb8f-d8944d860fb4',  -- Benguluru Bhavan Transport (Mar 26)
  '3edf44fd-c2f4-4ead-a957-21d64f4e346a',  -- Gismat-Ameerpet Transport (Mar 26)
  '3ea7d8e1-de63-4689-ab91-2a1d026a3c05',  -- Elma 250ml Transport (May 26)
  '58a67945-8339-481e-8624-de11d645b1ca',  -- Biryanis and More-Warangal Transport (Jun 26)
  'eeb0e653-cd5a-47a0-ac1b-3fc46bccfe32'   -- Chaitanya's Modern Kitchen Labour (Jun 26)
);

-- 3. Four label pickup trips → labels
UPDATE public.transport_expenses
SET expense_group = 'labels'
WHERE id IN (
  'fbdd2c72-04e8-4659-999a-2944ab723d6d',  -- Morya Labels Transport (Jun 14 26)
  '17f7ad38-0655-4d16-9804-0ea0104704cd',  -- Labels Transport (Jun 14 26)
  '1539a321-ab71-4a77-b4a6-37e45eb94379',  -- Morya Labels Transport (Jun 26 26)
  'b4e48f74-400a-4a09-bbd3-bed3281f261f'   -- Labels Transport (Jun 26 26)
);
