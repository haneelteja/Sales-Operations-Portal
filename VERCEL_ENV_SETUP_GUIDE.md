# Vercel Environment Variables Setup Guide

**Date:** January 27, 2026  
**Purpose:** Configure Supabase environment variables in Vercel dashboard

---

## Step-by-Step Instructions

### Step 1: Access Vercel Dashboard

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in to your Vercel account
3. Navigate to your project dashboard

---

### Step 2: Navigate to Environment Variables

1. Click on your project: **Sales-Operations-Portal** (or your project name)
2. Click on **Settings** in the top navigation bar
3. In the left sidebar, click on **Environment Variables**

---

### Step 3: Add First Environment Variable (VITE_SUPABASE_URL)

1. Click the **"Add New"** button (or **"Add"** button)
2. Fill in the form:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://your-project-id.supabase.co` (Get this from Supabase Dashboard → Settings → API)
   - **Environment:** Select all three:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
3. Click **"Save"**

---

### Step 4: Add Second Environment Variable (VITE_SUPABASE_ANON_KEY)

1. Click the **"Add New"** button again
2. Fill in the form:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `your_supabase_anon_key_here` (Get this from Supabase Dashboard → Settings → API → anon/public key)
   - **Environment:** Select all three:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
3. Click **"Save"**

---

### Step 5: Verify Variables Are Added

You should now see two environment variables listed:

```
VITE_SUPABASE_URL                    [Production, Preview, Development]
VITE_SUPABASE_ANON_KEY              [Production, Preview, Development]
```

---

### Step 6: Redeploy Your Application

**Important:** Environment variables are only available to new deployments. You need to redeploy:

#### Option A: Redeploy via Dashboard
1. Go to the **Deployments** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu
4. Click **"Redeploy"**
5. Confirm the redeployment

#### Option B: Push a New Commit
1. Make a small change (like updating a comment)
2. Commit and push to your repository
3. Vercel will automatically deploy with the new environment variables

#### Option C: Trigger Manual Deployment
1. Go to **Deployments** tab
2. Click **"Create Deployment"**
3. Select your branch (e.g., `User-Management` or `main`)
4. Click **"Deploy"**

---

## Visual Guide

### Environment Variables Page Layout

```
┌─────────────────────────────────────────────────┐
│  Settings > Environment Variables               │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Add New] button                               │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Name: VITE_SUPABASE_URL                    │ │
│  │ Value: https://your-project-id.supabase.co │ │
│  │ Environment: ☑ Production                  │ │
│  │            ☑ Preview                      │ │
│  │            ☑ Development                  │ │
│  │ [Save] [Cancel]                            │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Important Notes

### ✅ Do's:
- ✅ Add variables to **all three environments** (Production, Preview, Development)
- ✅ Use exact variable names: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Copy the values exactly as provided (no extra spaces)
- ✅ Redeploy after adding variables

### ❌ Don'ts:
- ❌ Don't use `NEXT_PUBLIC_` prefix (this is a Vite project, not Next.js)
- ❌ Don't add variables to only one environment
- ❌ Don't forget to redeploy after adding variables

---

## Troubleshooting

### Issue: Variables not working after deployment

**Solution:**
1. Verify variables are added correctly in Vercel dashboard
2. Check that variables are enabled for the correct environment
3. Redeploy the application
4. Check deployment logs for any errors

### Issue: "Missing required Supabase environment variables" error

**Possible Causes:**
1. Variables not added to Vercel
2. Variables added but not redeployed
3. Wrong variable names (should be `VITE_` not `NEXT_PUBLIC_`)
4. Variables only added to one environment

**Solution:**
1. Double-check variable names match exactly
2. Ensure variables are added to all environments
3. Redeploy the application

### Issue: Variables work locally but not in production

**Solution:**
1. Verify variables are added to **Production** environment in Vercel
2. Check that you've redeployed after adding variables
3. Check Vercel deployment logs for environment variable loading

---

## Verification Checklist

After completing the setup, verify:

- [ ] `VITE_SUPABASE_URL` is added to Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` is added to Vercel
- [ ] Both variables are enabled for Production, Preview, and Development
- [ ] Application has been redeployed after adding variables
- [ ] Application loads without environment variable errors
- [ ] Supabase connection works in production

---

## Quick Reference

### Variable Names (Vite Project)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Variable Values
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**⚠️ SECURITY NOTE:** Never commit actual credentials to the repository. Always use placeholders in documentation and set real values in Vercel dashboard or `.env` files (which are gitignored).

### Environments to Enable
- ☑️ Production
- ☑️ Preview  
- ☑️ Development

---

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)

---

**Need Help?** If you encounter any issues, check:
1. Vercel deployment logs
2. Browser console for errors
3. Network tab for failed API calls
