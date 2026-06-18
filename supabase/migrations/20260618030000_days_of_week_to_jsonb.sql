-- integer[] has PostgREST serialisation quirks; jsonb handles JS arrays natively
ALTER TABLE payment_reminder_schedules
  ALTER COLUMN days_of_week DROP DEFAULT;

ALTER TABLE payment_reminder_schedules
  ALTER COLUMN days_of_week TYPE jsonb
    USING to_jsonb(days_of_week);

ALTER TABLE payment_reminder_schedules
  ALTER COLUMN days_of_week SET DEFAULT '[1,2,3,4,5]'::jsonb;
