-- payment_reminder_schedules: one row per automated reminder window
CREATE TABLE IF NOT EXISTS payment_reminder_schedules (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text         NOT NULL,
  days_overdue   integer      NOT NULL CHECK (days_overdue > 0),
  send_time_ist  varchar(5)   NOT NULL DEFAULT '10:00',
  is_enabled     boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT chk_prs_send_time CHECK (send_time_ist ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);

CREATE INDEX IF NOT EXISTS idx_prs_is_enabled ON payment_reminder_schedules (is_enabled);

ALTER TABLE payment_reminder_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on payment_reminder_schedules" ON payment_reminder_schedules;
CREATE POLICY "Allow all on payment_reminder_schedules" ON payment_reminder_schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION set_prs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prs_updated_at ON payment_reminder_schedules;
CREATE TRIGGER trg_prs_updated_at
  BEFORE UPDATE ON payment_reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION set_prs_updated_at();

INSERT INTO payment_reminder_schedules (name, days_overdue, send_time_ist, is_enabled) VALUES
  ('3-Day Reminder',  3,  '10:00', true),
  ('7-Day Reminder',  7,  '10:00', true),
  ('15-Day Reminder', 15, '10:00', false)
ON CONFLICT DO NOTHING;

-- payment_reminder_logs: one row per reminder attempt per customer
CREATE TABLE IF NOT EXISTS payment_reminder_logs (
  id                      uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id             uuid         REFERENCES payment_reminder_schedules(id) ON DELETE SET NULL,
  customer_id             uuid         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name           text         NOT NULL,
  outstanding_amount      numeric      NOT NULL,
  whatsapp_message_log_id uuid,
  status                  varchar(10)  NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  failure_reason          text,
  triggered_at            timestamptz  NOT NULL DEFAULT now(),
  created_at              timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prl_triggered_at ON payment_reminder_logs (triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_prl_customer_id  ON payment_reminder_logs (customer_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_prl_schedule_id  ON payment_reminder_logs (schedule_id, triggered_at DESC);

ALTER TABLE payment_reminder_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on payment_reminder_logs" ON payment_reminder_logs;
CREATE POLICY "Allow all on payment_reminder_logs" ON payment_reminder_logs
  FOR ALL USING (true) WITH CHECK (true);
