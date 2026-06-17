-- Replace days_overdue-based schedule with day-of-week + threshold approach.
-- days_of_week: array of JS day numbers (0=Sun,1=Mon,...,6=Sat)
-- is_recurring: true = fires every matching weekday; false = fires once then disables itself

ALTER TABLE payment_reminder_schedules
  ADD COLUMN IF NOT EXISTS days_of_week integer[] DEFAULT '{1,2,3,4,5}'::integer[],
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT true;

-- Back-fill existing rows with sensible defaults (Mon–Fri, recurring)
UPDATE payment_reminder_schedules
SET
  days_of_week = '{1,2,3,4,5}'::integer[],
  is_recurring = true
WHERE days_of_week IS NULL OR is_recurring IS NULL;
