# Cron Job Setup for Database Backups

**Quick Reference for Scheduling Automated Backups**

> **Note:** Supabase does **not** provide a built-in Cron UI for Edge Functions. You must schedule runs using either **pg_cron** inside the database (if available on your plan) or an **external scheduler** (cron-job.org, GitHub Actions, Vercel Cron, etc.).

---

## Complete setup (fix 401 on cron-job.org)

If your cron-job.org test run returns **401 Unauthorized**, do these three steps:

| Step | Action |
|------|--------|
| 1 | **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**. Add secret: **Name** = `BACKUP_CRON_SECRET`, **Value** = a long random string (e.g. generate with PowerShell: `-join ((48..57) + (65..90) + (97..122) \| Get-Random -Count 32 \| ForEach-Object { [char]$_ })`). |
| 2 | **Redeploy:** `supabase functions deploy backup-scheduler` |
| 3 | **cron-job.org** → Edit job → **Request headers**. Add: **Key** = `x-backup-cron-secret`, **Value** = the **exact same** string from step 1 (no `Bearer `, no quotes). Set schedule to every 15 minutes. Save and run **Perform test run**. |

You should get **200** and JSON like `{"triggered":false,"reason":"Current time does not match schedule"}` — that means the cron is working; the backup will run when the clock matches your configured backup time (e.g. 14:00 IST).

**Current setup:** Backup scheduler runs **every 15 minutes** (`*/15 * * * *`). It checks the configured `backup_schedule_time_ist` (e.g. 14:00) and triggers **database-backup** only when the current IST time matches. You can change the backup time later in Application Configuration without changing cron.

**Configurable backup time:** Use **backup-scheduler** (runs every 15 min, reads `backup_schedule_time_ist` from Application Configuration).  
**Fixed 2:00 PM IST:** Use direct call to **database-backup** at `30 8 * * *` (see Option 1B).

---

## If you don't have pg_cron (recommended: external cron)

Many Supabase projects don't have **pg_cron** enabled or prefer not to use it. Use one of these instead:

| Method | Best for |
|--------|----------|
| **cron-job.org** | Easiest: free, no code, just URL + headers (see Option 4) |
| **GitHub Actions** | If your repo is on GitHub (see Option 2) |
| **Vercel Cron** | If the app is on Vercel (see Option 3) |

**URL to call for configurable backup time (backup-scheduler every 15 min):**
```
POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/backup-scheduler
Authorization: Bearer [YOUR_CRON_SECRET]
Content-Type: application/json
Body: {}
```

**Schedule:** Every 15 minutes → `*/15 * * * *` (in cron-job.org use "Every 15 minutes" or equivalent).

### Secret-based auth (recommended for cron-job.org)

The **backup-scheduler** function uses a **shared secret** instead of the Supabase JWT, so you don't need the legacy service_role key.

1. **Create a secret**  
   Use a long random string (e.g. 32+ characters). Example: `openssl rand -hex 24` or any password generator.

2. **Add it in Supabase**  
   Dashboard → **Edge Functions** → **backup-scheduler** → **Secrets** (or **Settings** → **Edge Function Secrets**).  
   Add: **Name** = `BACKUP_CRON_SECRET`, **Value** = your chosen secret.

3. **Redeploy the function** (so the secret is available):
   ```bash
   supabase functions deploy backup-scheduler
   ```

4. **In cron-job.org**  
   Request headers (use **one** of these):
   - **Recommended:** **Key** = `x-backup-cron-secret`, **Value** = your exact secret (no `Bearer `).
   - **Or:** **Key** = `Authorization`, **Value** = `Bearer YOUR_SAME_SECRET` (word `Bearer`, space, then the secret).

5. **Test run**  
   Use "Perform test run" in cron-job.org; you should get **200** and a JSON body (e.g. `triggered: false, reason: "Current time does not match schedule"` is normal outside the backup window).

---

## Option 1A: Configurable Backup Time (backup-scheduler) — pg_cron (if available)

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

## Option 4: External Cron Service (no pg_cron needed)

### Using cron-job.org (configurable backup time — recommended)

1. Create a free account at https://cron-job.org
2. Create a new cron job:
   - **Title:** e.g. `Backup Scheduler (Supabase)`
   - **URL:** `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/backup-scheduler`
   - **Schedule:** Every 15 minutes (e.g. "Every 15 minutes" or `*/15 * * * *`)
   - **Request Method:** POST
   - **Request Headers:**
     - `Authorization` = `Bearer [SERVICE_ROLE_KEY]`
     - `Content-Type` = `application/json`
   - **Request Body:** `{}` (empty JSON)
3. Save. The scheduler will run every 15 minutes; the Edge Function will trigger **database-backup** only when the current IST time matches your Application Configuration **backup_schedule_time_ist** (e.g. 14:00).

### Using cron-job.org (fixed 2:00 PM IST only)

1. Create a cron job:
   - **URL:** `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/database-backup`
   - **Schedule:** Daily at 08:30 UTC (= 2:00 PM IST) → `30 8 * * *`
   - **Method:** POST
   - **Headers:** `Authorization: Bearer [SERVICE_ROLE_KEY]`, `Content-Type: application/json`
   - **Body:** `{"trigger": "automatic"}`
2. Optionally add a second job for cleanup at 09:30 UTC: URL `.../functions/v1/cleanup-old-backups`, same headers, body `{}`.

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
