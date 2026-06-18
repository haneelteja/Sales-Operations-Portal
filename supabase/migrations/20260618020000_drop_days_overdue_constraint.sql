-- days_overdue is no longer used in the new day-of-week scheduling logic.
-- Drop the CHECK constraint and NOT NULL so new schedules can be inserted without it.
ALTER TABLE payment_reminder_schedules
  DROP CONSTRAINT IF EXISTS payment_reminder_schedules_days_overdue_check,
  ALTER COLUMN days_overdue DROP NOT NULL,
  ALTER COLUMN days_overdue SET DEFAULT 0;
