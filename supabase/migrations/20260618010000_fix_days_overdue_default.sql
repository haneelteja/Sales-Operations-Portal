-- Give days_overdue a default so new schedules (which don't use it) can be inserted
ALTER TABLE payment_reminder_schedules
  ALTER COLUMN days_overdue SET DEFAULT 0;
