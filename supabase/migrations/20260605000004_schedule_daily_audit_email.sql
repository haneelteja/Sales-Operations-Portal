-- Enable pg_cron and pg_net for scheduled tasks (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- NOTE: The daily audit email cron job must be configured in the Supabase Dashboard:
--   Edge Functions → send-daily-audit-email → Schedule → "0 18 * * *" (11:30 PM IST)
-- OR run this after setting the GUC variables in your Supabase project settings.
