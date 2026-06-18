-- Add columns required by the new day-of-week scheduling UI
ALTER TABLE payment_reminder_schedules
  ADD COLUMN IF NOT EXISTS min_outstanding_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date date;
