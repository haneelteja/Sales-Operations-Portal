# 📧 Supabase SMTP Email Setup Guide

## Overview

This guide shows you how to use **Gmail SMTP** (or any SMTP provider) to send emails from Supabase Edge Functions **without needing to verify a domain** in Resend.

## Why Use SMTP?

✅ **No domain verification needed** - Use Gmail SMTP with your existing Gmail account  
✅ **Works with any email provider** - Gmail, Outlook, SendGrid, etc.  
✅ **Free** - Gmail SMTP is free (with some limits)  
✅ **Simple setup** - Just configure SMTP credentials  

## Step 1: Get Gmail App Password

Since you're using Gmail, you need to create an **App Password** (not your regular Gmail password):

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/
   - Sign in with your Gmail account

2. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" if it's not already on

3. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Supabase Edge Functions"
   - Click "Generate"
   - **Copy the 16-character password** (you'll need this!)

## Step 2: Configure SMTP in Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/settings/functions
   - Scroll to "Secrets" section

2. **Add SMTP Secrets:**
   Add these environment variables:

   | Key | Value | Example |
   |-----|-------|---------|
   | `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` | `465` |
   | `SMTP_USER` | Your Gmail address | `nalluruhaneel@gmail.com` |
   | `SMTP_PASS` | Your App Password | `abcd efgh ijkl mnop` (16 chars, no spaces) |
   | `SMTP_FROM_EMAIL` | Your Gmail address | `nalluruhaneel@gmail.com` |
   | `SMTP_FROM_NAME` | Display name | `Elma Operations` |

   **Important:** For `SMTP_PASS`, use the **App Password** you generated (16 characters, remove spaces if any).

3. **Click "Save"** for each secret

## Step 3: Deploy the SMTP Email Function

Deploy the new SMTP email function:

```bash
cd supabase
npx supabase functions deploy send-welcome-email-smtp
```

Or use the Supabase Dashboard:
- Go to Edge Functions
- The function should auto-deploy, or you can manually deploy it

## Step 4: Test Email Sending

1. **Create a test user** in your application
2. **Check if email is sent** - it should work now!
3. **Check Supabase logs** for any errors

## Alternative SMTP Providers

### Gmail SMTP Settings
- **Host:** `smtp.gmail.com`
- **Port:** `465` (SSL) or `587` (TLS)
- **Username:** Your Gmail address
- **Password:** App Password (not regular password)

### Outlook/Hotmail SMTP Settings
- **Host:** `smtp-mail.outlook.com`
- **Port:** `587`
- **Username:** Your Outlook email
- **Password:** Your Outlook password

### SendGrid SMTP Settings
- **Host:** `smtp.sendgrid.net`
- **Port:** `587`
- **Username:** `apikey`
- **Password:** Your SendGrid API key

### Custom SMTP Provider
- Use your provider's SMTP settings
- Configure in Supabase secrets

## Gmail Daily Limits

Gmail has sending limits:
- **Free Gmail:** 500 emails per day
- **Google Workspace:** 2,000 emails per day

For higher volumes, consider:
- SendGrid (100 emails/day free)
- Mailgun (5,000 emails/month free)
- AWS SES (very affordable)

## Troubleshooting

### "Authentication failed"
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that the App Password is correct (16 characters, no spaces)

### "Connection timeout"
- Try port `587` instead of `465`
- Check if your firewall is blocking SMTP ports
- Verify SMTP_HOST is correct

### "Email not received"
- Check spam/junk folder
- Verify recipient email is correct
- Check Gmail sending limits (500/day for free accounts)
- Check Supabase Edge Function logs for errors

### "Function not found"
- Make sure you deployed the function: `npx supabase functions deploy send-welcome-email-smtp`
- Check function name is correct in `create-user` function

## Current Setup

The `create-user` function now:
1. **Tries SMTP first** (if configured)
2. **Falls back to Resend** (if SMTP fails or not configured)
3. **Logs email details** if both fail (for manual sending)

## Environment Variables Summary

Required for SMTP:
- ✅ `SMTP_HOST` - SMTP server hostname
- ✅ `SMTP_PORT` - SMTP port (465 or 587)
- ✅ `SMTP_USER` - SMTP username (your email)
- ✅ `SMTP_PASS` - SMTP password (App Password for Gmail)

Optional:
- `SMTP_FROM_EMAIL` - From email address (defaults to SMTP_USER)
- `SMTP_FROM_NAME` - Display name (defaults to "Elma Operations")

## Next Steps

1. ✅ Set up Gmail App Password
2. ✅ Configure SMTP secrets in Supabase
3. ✅ Deploy `send-welcome-email-smtp` function
4. ✅ Test by creating a user
5. ✅ Check email delivery

## Support

- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **SMTP Troubleshooting:** Check Supabase Edge Function logs
