# Cron Job Setup for Database Backups

**Quick Reference for Scheduling Automated Backups**

**Current setup:** Backup scheduler runs **every 15 minutes** (`*/15 * * * *`). It checks the configured `backup_schedule_time_ist` (e.g. 14:00) and triggers **database-backup** only when the current IST time matches. You can change the backup time later in Application Configuration without changing cron.

**Configurable backup time:** Use **backup-scheduler** (runs every 15 min, reads `backup_schedule_time_ist` from Application Configuration).  
**Fixed 2:00 PM IST:** Use direct call to **database-backup** at `30 8 * * *` (see Option 1B).

---

## Option 1A: Configurable Backup Time (backup-scheduler) — Recommended

The **backup-scheduler** edge function runs every 15 minutes, reads `backup_schedule_time_ist` and `backup_enabled` from the database, and triggers **database-backup** only when the current time in IST matches the configured time. This allows the "Database Backup Time" setting in Application Configuration to control when the backup runs.

### Prerequisites
- Supabase project with pg_cron (or external cron)
- Service role key
- Migration applied: `backup_schedule_time_ist` in `invoice_configurations` (default 14:00)

### 1. Deploy the backup-scheduler function
```bash
supabase functions deploy backup-scheduler
```

### 2. Schedule the scheduler (every 15 minutes)
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'backup-scheduler-every-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/backup-scheduler',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 3. Schedule daily cleanup (e.g. 09:30 UTC)
```sql
SELECT cron.schedule(
  'daily-backup-cleanup',
  '30 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cleanup-old-backups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Option 1B: Fixed 2:00 PM IST (direct database-backup)

If you do **not** need configurable time and always want backup at 2:00 PM IST:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'daily-database-backup-2pm-ist',
  '30 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/database-backup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'automatic')
  );
  $$
);

SELECT cron.schedule(
  'daily-backup-cleanup',
  '30 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/cleanup-old-backups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

### Replace Placeholders (all options)
- `[YOUR_PROJECT_REF]` - Your Supabase project reference
- `[SERVICE_ROLE_KEY]` - Your Supabase service role key

### Verify Jobs
```sql
SELECT * FROM cron.job;

SELECT * FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname IN ('backup-scheduler-every-15min', 'daily-database-backup-2pm-ist', 'daily-backup-cleanup'))
ORDER BY start_time DESC LIMIT 20;
```

### Remove Jobs (if needed)
```sql
SELECT cron.unschedule('backup-scheduler-every-15min');
SELECT cron.unschedule('daily-database-backup-2pm-ist');
SELECT cron.unschedule('daily-backup-cleanup');
```

---

## Option 2: GitHub Actions

**Configurable time:** Run backup-scheduler every 15 minutes.  
**Fixed 2 PM IST:** Run database-backup once daily at 08:30 UTC.

Example for **configurable time** (backup-scheduler every 15 min):
```yaml
name: Backup Scheduler (Configurable Time)

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  scheduler:
    runs-on: ubuntu-latest
    steps:
      - name: Run backup-scheduler
        run: |
          curl -s -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/backup-scheduler
```

Example for **fixed 2:00 PM IST** (single daily backup):
```yaml
name: Daily Database Backup (2 PM IST)

on:
  schedule:
    - cron: '30 8 * * *'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Backup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger": "automatic"}' \
            https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/database-backup
```

**Secrets Required:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`

---

## Option 3: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "30 8 * * *"
    },
    {
      "path": "/api/cleanup",
      "schedule": "30 9 * * *"
    }
  ]
}
```

Create API routes:
- `api/backup.ts` - Calls backup Edge Function
- `api/cleanup.ts` - Calls cleanup Edge Function

---

## Option 4: External Cron Service

### Using cron-job.org:

1. Create account at https://cron-job.org
2. Create new cron job:
   - **URL:** `https://[PROJECT].supabase.co/functions/v1/database-backup`
   - **Schedule:** `30 8 * * *` (08:30 UTC = 2:00 PM IST)
   - **Method:** POST
   - **Headers:**
     - `Authorization: Bearer [SERVICE_ROLE_KEY]`
     - `Content-Type: application/json`
   - **Body:** `{"trigger": "automatic"}`

3. Repeat for cleanup job (e.g. `30 9 * * *` = 09:30 UTC)

---

## Timezone Notes

- Cron schedules use **UTC**.
- **2:00 PM IST (required):** IST = UTC+5:30 → 2:00 PM IST = **08:30 UTC** → cron **`30 8 * * *`**.
- **1:00 AM IST:** 1:00 AM IST = 19:30 UTC (previous day) → cron `30 19 * * *`.

---

## Testing Cron Jobs

### Manual Trigger (pg_cron):
```sql
-- Manually trigger backup job
SELECT cron.schedule('test-backup', 'now', $$SELECT 1$$);
```

### Manual Trigger (HTTP):
```bash
curl -X POST \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "automatic"}' \
  https://[PROJECT].supabase.co/functions/v1/database-backup
```

---

**Status:** Ready for Configuration
