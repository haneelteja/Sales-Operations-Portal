# Environment Variables Guide

This document lists all environment variables needed for the Aamodha Elma Sync application.

## 🔴 Required Environment Variables

These are **essential** for the application to work:

### Supabase Configuration

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

**Example:**
```env
VITE_SUPABASE_URL=https://qkvmdrtfhpcvwvqjuyuu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdm1kcnRmaHBjdnd2cWp1eXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjgyMTgsImV4cCI6MjA3NDgwNDIxOH0.DJeoI0LFeMArVs5s6DV2HP0kYnjWcIVLQEbiCQr97CE
```

---

## 🟡 Optional Environment Variables

These are **optional** but recommended for production:

### Redis Configuration (For Production Caching)

```env
VITE_REDIS_HOST=your-redis-host.com
VITE_REDIS_PORT=6379
VITE_REDIS_PASSWORD=your_redis_password
```

**Note:** Currently, the app uses browser-based caching (localStorage). Redis variables are for future backend implementation.

**When to use:**
- If you set up a backend API with Redis
- For production caching with shared cache across users

---

## 📋 Vercel Environment Variables Setup

### Step 1: Add Variables in Vercel Dashboard

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add each variable:

#### For Production:
```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
Environment: Production, Preview, Development

Name: VITE_SUPABASE_ANON_KEY
Value: your_anon_key_here
Environment: Production, Preview, Development
```

#### For Redis (Optional):
```
Name: VITE_REDIS_HOST
Value: your-redis-host.com
Environment: Production

Name: VITE_REDIS_PORT
Value: 6379
Environment: Production

Name: VITE_REDIS_PASSWORD
Value: your_redis_password
Environment: Production
```

### Step 2: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic redeploy

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Set environment variables in Vercel dashboard (not in code)
- ✅ Use different Supabase projects for development and production
- ✅ Rotate keys regularly
- ✅ Use Vercel's environment variable encryption
- ✅ Limit access to environment variables

### ❌ DON'T:
- ❌ Commit `.env` files to GitHub
- ❌ Hardcode secrets in source code
- ❌ Share environment variables in public channels
- ❌ Use production keys in development

---

## 📝 Environment Variable Template

Copy this template and fill in your values:

```env
# ============================================
# REQUIRED - Supabase Configuration
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# OPTIONAL - Redis Configuration (Future)
# ============================================
# VITE_REDIS_HOST=your-redis-host.com
# VITE_REDIS_PORT=6379
# VITE_REDIS_PASSWORD=your_redis_password
```

---

## 🧪 Testing Environment Variables

### Check if variables are loaded:

```javascript
// In browser console (after deployment)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
```

### Verify in Vercel:

1. Go to **Deployments** → Latest deployment
2. Click **View Build Logs**
3. Check for any environment variable errors
4. Verify build completes successfully

---

## 🔄 Environment-Specific Configuration

### Development (Local)
- Use `.env.local` file (not committed to git)
- Can use development Supabase project
- Browser cache (localStorage)

### Production (Vercel)
- Set in Vercel dashboard
- Use production Supabase project
- Can use Redis for caching (if backend implemented)

---

## 📚 Related Documentation

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Deploy**: `QUICK_DEPLOY.md`
- **Setup Guide**: `SETUP_COMPLETE.md`

---

## 🆘 Troubleshooting

### Variable Not Found

**Error**: `VITE_SUPABASE_URL is not defined`

**Solution**:
1. Check variable name (must start with `VITE_`)
2. Verify it's set in Vercel dashboard
3. Redeploy after adding variables
4. Check build logs for errors

### Wrong Values

**Issue**: App connects to wrong Supabase project

**Solution**:
1. Verify environment variables in Vercel
2. Check Supabase project settings
3. Clear browser cache
4. Redeploy application

---

## ✅ Checklist

Before deploying:

- [ ] `VITE_SUPABASE_URL` is set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` is set in Vercel
- [ ] Variables are set for Production environment
- [ ] Variables are set for Preview environment (optional)
- [ ] No sensitive data in source code
- [ ] `.env` files are in `.gitignore`
- [ ] Tested with correct Supabase project

---

**Ready to deploy?** Set these variables in Vercel and redeploy! 🚀

