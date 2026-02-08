# Deploy Backup System Edge Functions

**Quick deployment guide for database backup Edge Functions**

---

## 🚀 Deployment Steps

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd "c:\Users\Haneel Teja\Cursor Applications\Aamodha-Operations-Portal---V1"

# Deploy database-backup function
supabase functions deploy database-backup

# Deploy cleanup-old-backups function
supabase functions deploy cleanup-old-backups

# Deploy backup-scheduler (optional; use when backup time is configurable from Application Configuration)
supabase functions deploy backup-scheduler
```

### Option 2: Using Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. **Function 1: `database-backup`**
   - Name: `database-backup`
   - Copy code from: `supabase/functions/database-backup/index.ts`
   - Paste into the editor
   - Click **"Deploy"**
4. **Function 2: `cleanup-old-backups`**
   - Name: `cleanup-old-backups`
   - Copy code from: `supabase/functions/cleanup-old-backups/index.ts`
   - Paste into the editor
   - Click **"Deploy"**
5. **Function 3 (optional): `backup-scheduler`** — for configurable backup time from Application Configuration
   - Name: `backup-scheduler`
   - Copy code from: `supabase/functions/backup-scheduler/index.ts`
   - Click **"Deploy"**
   - Schedule to run every 15 minutes (see CRON_SETUP.md)

---

## 🔐 Configure Edge Function Secrets

After deploying, add these secrets in **Supabase Dashboard** → **Edge Functions** → **Secrets**:

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | Dashboard → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | Dashboard → Settings → API → service_role key |
| `SUPABASE_ANON_KEY` | Anon/public key | Dashboard → Settings → API → anon key |
| `DATABASE_URL` | PostgreSQL connection string | Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` |

**To get DATABASE_URL:**
1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string (it includes password)

---

## ✅ Verify Deployment

### Test database-backup function:

```bash
curl -X POST https://[YOUR_PROJECT].supabase.co/functions/v1/database-backup \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "manual"}'
```

### Test cleanup-old-backups function:

```bash
curl -X POST https://[YOUR_PROJECT].supabase.co/functions/v1/cleanup-old-backups \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Or test via Supabase Dashboard:
1. Go to **Edge Functions** → Select function
2. Click **"Invoke"** tab
3. Click **"Invoke function"**

---

## 📋 Next Steps

1. ✅ Edge Functions deployed
2. ✅ Secrets configured
3. ⏭️ Set up scheduled backups (see `CRON_SETUP.md`)
4. ⏭️ Test manual backup from Application Configuration tab
5. ⏭️ Verify backup logs appear in UI

---

**Status:** Ready for Deployment
