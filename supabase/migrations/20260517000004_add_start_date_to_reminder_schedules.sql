-- Add start_date so schedules only fire on or after this date.
-- NULL means the schedule is active immediately.
ALTER TABLE payment_reminder_schedules
  ADD COLUMN IF NOT EXISTS start_date date;
