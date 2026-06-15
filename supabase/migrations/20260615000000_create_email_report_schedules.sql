-- Email report schedule configuration table
CREATE TABLE IF NOT EXISTS email_report_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL,
  label text NOT NULL,
  enabled boolean DEFAULT true,
  send_time text DEFAULT '09:00', -- HH:MM in IST (24-hour)
  recipient_email text NOT NULL DEFAULT 'nalluruhaneel@gmail.com',
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (report_type)
);

-- Seed the 3 report types
INSERT INTO email_report_schedules (report_type, label, send_time, recipient_email) VALUES
  ('orders_payment_status', 'Orders & Payment Status', '09:00', 'nalluruhaneel@gmail.com'),
  ('payment_followup',      'Payment Follow Up',       '09:00', 'nalluruhaneel@gmail.com'),
  ('credit_risk',           'Client Credit & Risk',    '09:00', 'nalluruhaneel@gmail.com')
ON CONFLICT (report_type) DO NOTHING;

-- Disable RLS (consistent with other config tables in this project)
ALTER TABLE email_report_schedules DISABLE ROW LEVEL SECURITY;

-- NOTE: Schedule the send-report-emails edge function in the Supabase Dashboard:
--   Edge Functions → send-report-emails → Schedule → "0 * * * *" (every hour)
-- The function reads send_time from this table and only sends when the IST hour matches.
