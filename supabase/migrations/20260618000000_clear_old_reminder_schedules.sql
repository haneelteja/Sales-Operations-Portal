-- Remove all old days_overdue-based schedules so users start fresh
-- with the new day-of-week configuration.
DELETE FROM payment_reminder_schedules;
