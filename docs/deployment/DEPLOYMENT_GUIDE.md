# Deployment Guide

This guide will help you deploy the Aamodha Elma Sync application to GitHub and Vercel.

## Part 1: GitHub Setup

### Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Fill in the details:
   - **Repository name**: `aamodha-elma-sync` (or your preferred name)
   - **Description**: "Operations portal for Aamodha Elma"
   - **Visibility**: Choose Private or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **Create repository**

### Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
# Navigate to project directory
cd "/Users/haneelnalluru/Lovable - aamodha elma sync application/aamodha-elma-sync"

# Check current remote (if any)
git remote -v

# Remove existing remote if you want a fresh start
git remote remove origin

# Add your new GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/aamodha-elma-sync.git
# Replace YOUR_USERNAME with your GitHub username

# Add all files (including new performance improvements)
git add .

# Commit all changes
git commit -m "Initial commit: Aamodha Elma Sync Application with performance improvements"

# Push to GitHub
git push -u origin main
```

**Note**: If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

### Step 3: Verify on GitHub

1. Go to your repository on GitHub
2. Verify all files are uploaded
3. Check that sensitive files (`.env`, `node_modules`) are NOT in the repository

---

## Part 2: Vercel Deployment

### Step 1: Create Vercel Account

1. Go to [Vercel](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Project

1. In Vercel dashboard, click **Add New** → **Project**
2. Find and select your `aamodha-elma-sync` repository
3. Click **Import**

### Step 3: Configure Project Settings

Vercel should auto-detect Vite, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

In the Vercel project settings, add these environment variables:

1. Go to **Settings** → **Environment Variables**
2. Add the following:

```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_REDIS_HOST = (optional, for production Redis)
VITE_REDIS_PORT = (optional)
```

**Important**: 
- Use the same Supabase credentials as your development
- For production, consider using a separate Supabase project
- Never commit `.env` files to GitHub

### Step 5: Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually 2-3 minutes)
3. Once deployed, you'll get a URL like: `https://aamodha-elma-sync.vercel.app`

### Step 6: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain name (e.g., `app.aamodhaelma.com`)
4. Follow DNS configuration instructions:
   - Add a CNAME record pointing to `cname.vercel-dns.com`
   - Or add A records as specified by Vercel
5. Wait for DNS propagation (can take up to 24 hours)
6. Vercel will automatically provision SSL certificate

---

## Part 3: Post-Deployment

### Verify Deployment

1. Visit your Vercel URL
2. Test the application:
   - Login functionality
   - Data loading
   - All major features

### Set Up Automatic Deployments

Vercel automatically deploys on:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment

### Monitor Deployments

1. Go to **Deployments** tab in Vercel
2. View build logs
3. Check for any errors

### Performance Monitoring

1. Enable Vercel Analytics (optional, paid feature)
2. Use browser DevTools to check performance
3. Monitor Core Web Vitals

---

## Troubleshooting

### Build Fails

**Error**: `Module not found`
- **Solution**: Check that all dependencies are in `package.json`

**Error**: `Environment variable not found`
- **Solution**: Add all required env vars in Vercel dashboard

**Error**: `Build timeout`
- **Solution**: Check build logs, may need to optimize build process

### Deployment Issues

**Error**: `404 on routes`
- **Solution**: Verify `vercel.json` has correct rewrite rules

**Error**: `CORS errors`
- **Solution**: Check Supabase CORS settings, add Vercel domain to allowed origins

### Domain Issues

**DNS not resolving**
- **Solution**: Wait 24-48 hours for DNS propagation
- Check DNS records are correct

**SSL certificate not issued**
- **Solution**: Wait a few minutes, Vercel auto-provisions SSL
- Check domain is correctly configured

---

## Environment-Specific Configuration

### Development
- Uses local Supabase instance or development project
- Browser cache (localStorage)
- Hot reload enabled

### Production
- Uses production Supabase project
- Can use Redis for caching (via backend API)
- Optimized builds
- CDN caching

---

## Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] Supabase RLS policies are configured
- [ ] API keys are not exposed in client code
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Domain has valid SSL certificate

---

## Next Steps

1. ✅ Code pushed to GitHub
2. ✅ Deployed to Vercel
3. ⏭️ Set up custom domain
4. ⏭️ Configure production Supabase project
5. ⏭️ Set up monitoring and analytics
6. ⏭️ Configure CI/CD for automated testing

---

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Check build logs in Vercel dashboard
- Review GitHub Actions (if configured)

