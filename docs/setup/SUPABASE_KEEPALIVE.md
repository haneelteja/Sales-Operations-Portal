# Supabase keep-alive (prevent project from pausing)

The free-tier Supabase project goes inactive after a period of no activity. This setup keeps it active with minimal traffic.

## What’s in place

1. **`public.ping()` in Supabase**  
   Migration `20260307000000_add_ping_function_for_keepalive.sql` adds a function that runs `SELECT 1`. It’s callable by `anon` so the health check doesn’t need auth.

2. **HTTP endpoint**  
   `GET /api/supabase-activity-ping` (Vercel serverless) calls `ping()` via the Supabase client.  
   - Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same as the frontend).

3. **GitHub Actions**  
   `.github/workflows/supabase-keepalive.yml` runs **twice a week** (Monday and Thursday 09:00 UTC) and calls that endpoint. You can also run it manually from the Actions tab.

## One-time setup

### 1. Apply the migration

- **CLI:** From the project root run:  
  `npx supabase db push`  
  (or apply the migration in the Supabase Dashboard SQL editor).

### 2. Set GitHub variable

- Repo → **Settings** → **Secrets and variables** → **Actions** → **Variables**
- Add: **`PRODUCTION_URL`** = your production app URL (e.g. `https://your-app.vercel.app`), **without** a trailing slash.

### 3. Vercel env (usually already set)

The API route needs:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If the portal already works in production, these are already configured in Vercel.

## Manual test

After deploy:

```bash
curl https://YOUR_PRODUCTION_URL/api/supabase-activity-ping
```

Expected: `200` and body like `{"ok":true,"ping":1}`.

## Optional: different schedule

Edit `.github/workflows/supabase-keepalive.yml` and change the `schedule` cron. Example: every Monday at 10:00 UTC:

```yaml
- cron: '0 10 * * 1'
```

Twice a week is enough to keep the project active and within free-tier usage.
