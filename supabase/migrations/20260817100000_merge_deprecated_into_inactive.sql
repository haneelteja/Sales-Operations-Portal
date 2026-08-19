-- Consolidate the two disable mechanisms into one.
-- "deprecated" was a second way to hide a client; "inactive" is the single
-- source of truth going forward. Merge all deprecated rows → inactive so no
-- data is lost, then the application code stops reading is_deprecated entirely.

UPDATE public.customers
SET is_active = false
WHERE is_deprecated = true
  AND is_active = true;

-- is_deprecated column stays (migrations are append-only) but will no longer
-- be written or read by the application.
