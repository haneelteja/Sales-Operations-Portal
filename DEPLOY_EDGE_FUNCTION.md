# Deploy Updated Edge Function

The `create-user` Edge Function has been updated with improved error handling. You need to deploy it to Supabase.

## Option 1: Deploy via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Find the `create-user` function
4. Click on it to open the function editor
5. Copy the contents of `supabase/functions/create-user/index.ts`
6. Paste it into the editor
7. Click **Deploy** or **Save**

## Option 2: Install Supabase CLI and Deploy

### Install Supabase CLI

**Windows (PowerShell):**
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

**Or download from:** https://github.com/supabase/cli/releases

### Deploy Function

```bash
# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref yltbknkksjgtexluhtau

# Deploy the function
supabase functions deploy create-user
```

## Verify Environment Variables

Make sure these environment variables are set in your Supabase project:

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Ensure these are set:
   - `SUPABASE_URL` (usually auto-set)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin operations)
   - `APP_URL` (optional, for email links)

## Test the Function

After deployment, try creating a user again through the User Management interface. Check the Edge Function logs in the Supabase dashboard for detailed error messages if issues persist.

## Check Function Logs

1. Go to **Edge Functions** → **create-user**
2. Click on **Logs** tab
3. Look for error messages with details about what failed

The updated function now provides more detailed error messages including:
- Error codes
- Error messages
- Error details
- Error hints

This will help identify the exact issue if deployment doesn't resolve the 500 error.
