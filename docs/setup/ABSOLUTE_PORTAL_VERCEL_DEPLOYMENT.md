# Absolute Portal – Vercel Deployment & Next Steps

Use this when deploying **Absolute_Portal** to Vercel with a **new Supabase project** and **new Gmail/Google Drive** for invoices.

---

## 1. Vercel – New Project Settings

| Field | Value |
|-------|--------|
| **Import from** | GitHub → `haneelteja/Absolute_Portal` |
| **Branch** | `main` |
| **Team** | Vercel Team / haneel teja's projects |
| **Plan** | Hobby |
| **Project Name** | `absolute-portal` (or `absolute-portal-production`) |
| **Framework Preset** | **Vite** |
| **Root Directory** | `./` (leave default) |
| **Build Command** | `npm run build` *(see note below)* |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Build command note

- **Recommended:** `npm run build`  
  Vercel does a clean install; no need to `rm -rf node_modules` or reinstall.
- If you hit cache issues later, you can use:  
  `npm ci && npm run build`  
  Do **not** use `rm -rf node_modules .vite dist && npm install && npm run build` unless you have a specific reason (slower and redundant).

---

## 2. Vercel – Environment Variables

Add these in **Settings → Environment Variables**. Apply to **Production**, **Preview**, and **Development** unless noted.

| Key | Value | Notes |
|-----|--------|--------|
| `VITE_SUPABASE_URL` | `https://YOUR_NEW_PROJECT.supabase.co` | From new Supabase project (Settings → API → Project URL) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon/public key) | From new Supabase project (Settings → API → anon public) |
| `VITE_APP_URL` | `https://absolute-portal.vercel.app` | Your Vercel app URL (for password reset links). Update after first deploy if different. |

**Optional (only if you use them):**

| Key | Value |
|-----|--------|
| `VITE_USE_RESEND_EMAIL` | `true` (if using Resend for auth emails) |
| `VITE_USE_MOCK_AUTH` | Leave unset in production |

**Do not** put Supabase **service_role** key or Google credentials in Vercel. Those belong only in Supabase Edge Function secrets.

---

## 3. Next Steps – New Supabase Project (DB)

1. **Create project**
   - [Supabase Dashboard](https://supabase.com/dashboard) → **New project**.
   - Name e.g. `absolute-portal` or `abs-portal-prod`.
   - Set strong DB password and region; create.

2. **Run migrations**
   - In your local repo (Absolute_Portal or this repo), link and push migrations:
     ```bash
     cd path/to/Absolute_Portal
     npx supabase link --project-ref YOUR_NEW_PROJECT_REF
     npx supabase db push
     ```
   - Or run SQL manually: open **SQL Editor** in Supabase and run migration files from `supabase/migrations/` in order (by filename timestamp).

3. **Get keys for Vercel**
   - **Settings → API**: copy **Project URL** → `VITE_SUPABASE_URL`.
   - Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`.
   - Add both in Vercel (see section 2).

4. **Auth (optional)**
   - **Authentication → URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://absolute-portal.vercel.app`).
   - Add **Redirect URLs** for auth (e.g. `https://absolute-portal.vercel.app/**`, `https://absolute-portal.vercel.app/reset-password`).

---

## 4. Next Steps – New Gmail / Google Drive (Invoices)

Invoice storage uses **Supabase Edge Functions** that upload to **Google Drive**. Credentials live in **Supabase**, not Vercel.

1. **Create / choose Gmail**
   - Use a dedicated Gmail for Absolute Portal (e.g. `invoices.absoluteportal@gmail.com`).

2. **Google Cloud project**
   - [Google Cloud Console](https://console.cloud.google.com/) → create a project (e.g. “Absolute Portal”).
   - **APIs & Services → Library**: enable **Google Drive API**.
   - **APIs & Services → Credentials**: create **OAuth 2.0 Client ID**.
     - Application type: **Web application**.
     - Authorized redirect URIs: add `https://developers.google.com/oauthplayground` (for playground) and any Supabase callback if required.
   - Copy **Client ID** and **Client Secret**.

3. **Get refresh token**
   - [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
   - ⚙️ → “Use your own OAuth credentials” → paste Client ID and Client Secret.
   - In left panel, **Drive API v3** → select scope `https://www.googleapis.com/auth/drive.file`.
   - “Authorize APIs” → sign in with your Gmail → “Exchange authorization code for tokens”.
   - Copy the **Refresh token** (`1//...`).

4. **Store in Supabase (not Vercel)**
   - Supabase Dashboard → your **new** Absolute Portal project → **Project Settings → Edge Functions → Secrets**.
   - Add:
     - `GOOGLE_CLIENT_ID` = Client ID
     - `GOOGLE_CLIENT_SECRET` = Client Secret
     - `GOOGLE_REFRESH_TOKEN` = Refresh token

5. **Deploy Edge Functions**
   - Deploy the invoice/Drive functions (e.g. `google-drive-token`, `google-drive-upload`) to this **new** Supabase project so they use the new secrets.  
   - See `docs/invoice-generation/SETUP_CHECKLIST.md` for function names and test steps.

---

## 5. After First Deploy

1. **Set production URL**
   - In Vercel: note the live URL (e.g. `https://absolute-portal.vercel.app`).
   - Update `VITE_APP_URL` in Vercel if you used a placeholder.
   - In Supabase: set **Site URL** and **Redirect URLs** to that URL.

2. **Redeploy**
   - Vercel → **Deployments** → **Redeploy** (or push a commit) so the app picks up env and Supabase URL.

3. **Smoke test**
   - Open the app → sign up / sign in.
   - Confirm password reset email works if you use it.
   - If you use invoice generation, generate one and confirm it appears in the new Google Drive.

---

## 6. Quick Reference

| What | Where |
|------|--------|
| Frontend env (Supabase URL, anon key, app URL) | **Vercel** → Settings → Environment Variables |
| DB and auth config | **Supabase** project for Absolute Portal |
| Google Drive (invoices) credentials | **Supabase** → Edge Functions → Secrets |
| Build / output | Vercel: Build = `npm run build`, Output = `dist` |

---

**Last updated:** January 2025
