# Database Backup System - Setup Guide

**Date:** January 27, 2026  
**Quick Setup Instructions**

---

## 📋 Prerequisites

- Supabase project with database access
- Google Drive integration already configured
- Manager role access to Application Configuration

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

Execute the migration file to create backup tables and configurations:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20250127000003_create_backup_system.sql
```

This will:
- Create `backup_logs` table
- Add backup configurations to `invoice_configurations`
- Set up Row Level Security policies

### Step 2: Deploy Edge Functions

Deploy the backup Edge Functions to Supabase:

```bash
# Deploy database backup function
supabase functions deploy database-backup

# Deploy cleanup function
supabase functions deploy cleanup-old-backups
```

Or deploy via Supabase Dashboard:
1. Go to **Edge Functions**
2. Create new function: `database-backup`
3. Copy code from `supabase/functions/database-backup/index.ts`
4. Create new function: `cleanup-old-backups`
5. Copy code from `supabase/functions/cleanup-old-backups/index.ts`

### Step 3: Configure Edge Function Secrets

Add required secrets in Supabase Dashboard → Edge Functions → Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbGc...` |
| `SUPABASE_ANON_KEY` | Anon/public key | `eyJhbGc...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

**Note:** `DATABASE_URL` should be in format:
```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

### Step 4: Set Up Scheduled Backups

#### Option A: Using Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily backup at 1:00 AM UTC
SELECT cron.schedule(
  'daily-database-backup',
  '0 1 * * *', -- 1:00 AM daily
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT].supabase.co/functions/v1/database-backup',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('trigger', 'automatic')
  );
  $$
);

-- Schedule daily cleanup at 2:00 AM UTC
SELECT cron.schedule(
  'daily-backup-cleanup',
  '0 2 * * *', -- 2:00 AM daily
  $$
  SELECT net.http_post(
    url := 'https://[YOUR_PROJECT].supabase.co/functions/v1/cleanup-old-backups',
    headers := jsonb_build_object(
      'Authorization', 'Bearer [SERVICE_ROLE_KEY]',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Replace:**
- `[YOUR_PROJECT]` with your Supabase project reference
- `[SERVICE_ROLE_KEY]` with your service role key

#### Option B: Using External Cron Service

If pg_cron is not available, use an external service:

1. **GitHub Actions** (if using GitHub):
   - Create `.github/workflows/daily-backup.yml`
   - Schedule with cron: `0 1 * * *` (1:00 AM UTC)

2. **Vercel Cron Jobs** (if using Vercel):
   - Add cron job in `vercel.json`
   - Schedule: `0 1 * * *`

3. **External Service** (cron-job.org, etc.):
   - Set up HTTP request to backup endpoint
   - Schedule daily at 1:00 AM UTC

### Step 5: Configure Backup Settings

1. Navigate to **Application Configuration** tab in the application
2. Configure backup settings:
   - **Backup Folder Path:** Set Google Drive folder (default: `MyDrive/DatabaseBackups`)
   - **Notification Email:** Set email for failure alerts (default: `pega2023test@gmail.com`)

### Step 6: Test Manual Backup

1. Go to **Application Configuration** tab
2. Click **"Run Backup Now"** button
3. Check backup logs to verify success
4. Verify file appears in Google Drive

---

## ✅ Verification Checklist

- [ ] Database migration executed successfully
- [ ] Edge Functions deployed
- [ ] Edge Function secrets configured
- [ ] Scheduled jobs configured (pg_cron or external)
- [ ] Backup folder path configured
- [ ] Notification email configured
- [ ] Manual backup tested successfully
- [ ] Backup logs visible in UI
- [ ] Email notification tested (trigger a failure)

---

## 🔧 Troubleshooting

### Backup Fails with "Database URL not configured"
- **Solution:** Add `DATABASE_URL` secret to Edge Functions
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Backup Fails with "Google Drive upload failed"
- **Solution:** Verify Google Drive credentials are configured
- Check `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` secrets

### Scheduled Backup Not Running
- **Solution:** Verify cron job is active
- Check Supabase logs for errors
- Verify service role key is correct in cron job

### Email Notifications Not Sending
- **Solution:** Verify email service is configured
- Check `send-email` Edge Function exists
- Verify notification email address is valid

---

## 📚 Additional Resources

- [Full Specification](./DATABASE_BACKUP_SPECIFICATION.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---

**Status:** Ready for Deployment
