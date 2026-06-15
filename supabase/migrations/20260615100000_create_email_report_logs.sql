CREATE TABLE IF NOT EXISTS email_report_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL,
  label text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'success', -- 'success' | 'error'
  error_message text,
  triggered_by text DEFAULT 'scheduler', -- 'scheduler' | 'manual'
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE email_report_logs DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_report_logs_sent_at ON email_report_logs (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_report_logs_report_type ON email_report_logs (report_type);
