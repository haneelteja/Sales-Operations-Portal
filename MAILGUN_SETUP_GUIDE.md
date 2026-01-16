# 📧 Mailgun Setup Guide

## Overview

Mailgun offers **5,000 emails/month free** - the highest free tier among email services! This guide will help you set up Mailgun for sending welcome emails.

## Why Mailgun?

- ✅ **5,000 emails/month free** - Best free tier available
- ✅ Developer-friendly API
- ✅ Excellent deliverability
- ✅ Good documentation
- ✅ Transactional email focus
- ✅ Flexible pricing

## Step-by-Step Setup

### Step 1: Sign Up for Mailgun

1. **Go to Mailgun:**
   - Visit: https://www.mailgun.com/
   - Click "Sign Up" or "Start Free"

2. **Create Account:**
   - Enter your email address
   - Create a password
   - Verify your email

3. **Complete Setup:**
   - Fill in your account details
   - Select your use case (Transactional emails)
   - Complete the onboarding

### Step 2: Verify Your Domain

**Important:** Mailgun requires domain verification to send emails.

1. **Go to Domains:**
   - In Mailgun dashboard, go to "Sending" → "Domains"
   - Click "Add New Domain"

2. **Add Your Domain:**
   - Enter your domain (e.g., `elma.com`, `aamodha.com`)
   - Select domain type: "Send emails" (not "Receive emails")
   - Click "Add Domain"

3. **Add DNS Records:**
   Mailgun will show you DNS records to add. Go to your domain registrar and add:

   **SPF Record (TXT):**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:mailgun.org ~all
   ```

   **DKIM Records (TXT):**
   ```
   Type: TXT
   Name: [provided by Mailgun, e.g., k1._domainkey]
   Value: [provided by Mailgun]
   ```

   **MX Record (Optional - for receiving):**
   ```
   Type: MX
   Name: @
   Value: mxa.mailgun.org (Priority: 10)
   Value: mxb.mailgun.org (Priority: 10)
   ```

4. **Wait for Verification:**
   - DNS changes can take 5 minutes to 48 hours
   - Mailgun will automatically verify when DNS is ready
   - Status will show "Verified" when complete

### Step 3: Get API Key

1. **Go to API Keys:**
   - In Mailgun dashboard, go to "Settings" → "API Keys"
   - Find your "Private API key" (starts with `key-`)
   - **Copy this key** - you'll need it!

2. **Note Your Domain:**
   - Copy your verified domain name (e.g., `mg.elma.com` or `mail.elma.com`)
   - This is your `MAILGUN_DOMAIN`

### Step 4: Configure in Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/settings/functions
   - Scroll to "Secrets" section

2. **Add Mailgun Secrets:**
   Add these environment variables:

   | Secret Name | Value | Example |
   |------------|-------|---------|
   | `MAILGUN_API_KEY` | Your Private API key | `key-1234567890abcdef...` |
   | `MAILGUN_DOMAIN` | Your verified domain | `mg.elma.com` |
   | `MAILGUN_FROM_EMAIL` | From email address | `noreply@elma.com` |
   | `MAILGUN_FROM_NAME` | Display name | `Elma Operations` |

   **Important:**
   - `MAILGUN_API_KEY`: Your Private API key from Mailgun dashboard
   - `MAILGUN_DOMAIN`: Your verified domain (e.g., `mg.elma.com`)
   - `MAILGUN_FROM_EMAIL`: Use an email from your verified domain (e.g., `noreply@elma.com`)
   - `MAILGUN_FROM_NAME`: Display name for emails

3. **Click "Save"** for each secret

### Step 5: Deploy the Mailgun Function

Deploy the Mailgun email function:

```bash
cd supabase
npx supabase functions deploy send-welcome-email-mailgun
```

Or use the Supabase Dashboard:
- Go to Edge Functions
- The function should auto-deploy, or you can manually deploy it

### Step 6: Test Email Sending

1. **Create a test user** in your application
2. **Check if email is sent** - it should work now!
3. **Check Mailgun dashboard** for delivery status
4. **Check Supabase logs** for any errors

## Current Fallback Chain

Your email system now tries in this order:

1. **SMTP (Gmail)** - If configured
2. **Mailgun** - If SMTP fails or not configured ✅ **NEW**
3. **Resend** - If Mailgun fails or not configured

## Mailgun Free Tier Limits

- **5,000 emails/month** - Free forever
- **First 3 months:** 5,000 emails/month
- **After 3 months:** Still free, but may have some limitations
- **No credit card required** for free tier

## Troubleshooting

### "Domain not verified"
- Check DNS records are correct
- Wait 24-48 hours for DNS propagation
- Use DNS checker tools to verify records are live
- Make sure you're using the correct domain format (e.g., `mg.elma.com`)

### "Authentication failed"
- Verify `MAILGUN_API_KEY` is correct (starts with `key-`)
- Check that you're using the Private API key, not Public
- Ensure the API key hasn't been revoked

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check Mailgun dashboard for delivery status
- Verify `MAILGUN_FROM_EMAIL` uses your verified domain
- Check Mailgun sending limits (5,000/month)

### "Function not found"
- Make sure you deployed: `npx supabase functions deploy send-welcome-email-mailgun`
- Check function name is correct in `create-user` function

## Mailgun Dashboard Features

- **Analytics:** Track email opens, clicks, bounces
- **Logs:** See all sent emails and their status
- **Webhooks:** Get real-time delivery notifications
- **Suppressions:** Manage bounces and unsubscribes

## Next Steps

1. ✅ Set up Mailgun account
2. ✅ Verify your domain
3. ✅ Configure secrets in Supabase
4. ✅ Deploy the function
5. ✅ Test email sending
6. ✅ Monitor Mailgun dashboard for delivery

## Support

- **Mailgun Documentation:** https://documentation.mailgun.com/
- **Mailgun Support:** support@mailgun.com
- **Domain Verification:** https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain

## Quick Reference

**Mailgun API Endpoint:**
```
https://api.mailgun.net/v3/{domain}/messages
```

**Required Secrets:**
- `MAILGUN_API_KEY` - Your Private API key
- `MAILGUN_DOMAIN` - Your verified domain

**Optional Secrets:**
- `MAILGUN_FROM_EMAIL` - From email (defaults to `noreply@{domain}`)
- `MAILGUN_FROM_NAME` - Display name (defaults to "Elma Operations")
