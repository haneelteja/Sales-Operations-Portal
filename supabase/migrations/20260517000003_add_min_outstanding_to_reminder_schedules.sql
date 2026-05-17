-- Add minimum outstanding amount threshold to payment reminder schedules.
-- Reminders will only fire for customers whose outstanding >= this amount.
ALTER TABLE payment_reminder_schedules
  ADD COLUMN IF NOT EXISTS min_outstanding_amount numeric NOT NULL DEFAULT 0
    CHECK (min_outstanding_amount >= 0);
