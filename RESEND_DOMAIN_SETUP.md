# Resend Domain Setup Guide

## Issue Identified

**Error:** `You can only send testing emails to your own email address (nalluruhaneel@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the from address to an email using this domain.`

**Root Cause:** Resend free tier only allows sending emails to your own verified email address. To send to other recipients, you need to verify a domain.

---

## Solution Options

### Option 1: Verify Domain in Resend (Recommended for Production)

This allows you to send emails to any recipient.

#### Step 1: Verify Your Domain

1. **Go to Resend Domains:**
   - https://resend.com/domains

2. **Add Domain:**
   - Click "Add Domain"
   - Enter your domain (e.g., `yourdomain.com` or `aamodha.com`)
   - Click "Add"

3. **Add DNS Records:**
   - Resend will provide DNS records to add
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add the DNS records:
     - **SPF Record** (TXT)
     - **DKIM Records** (TXT)
     - **DMARC Record** (TXT) - Optional but recommended

4. **Wait for Verification:**
   - DNS propagation can take 24-48 hours
   - Resend will verify automatically
   - Status will change to "Verified" when ready

#### Step 2: Update Edge Function

Once domain is verified, update the `from` address:

1. **Edit:** `supabase/functions/send-welcome-email-resend/index.ts`
2. **Change line 125:**
   ```typescript
   from: 'Elma Operations <noreply@yourdomain.com>', // Replace with your verified domain
   ```
3. **Redeploy the function**

#### Step 3: Test

1. Create a test user
2. Verify email is sent successfully
3. Check Resend dashboard for delivery status

---

### Option 2: Use Resend's Test Mode (Temporary Workaround)

For testing purposes, you can send emails to your own address and forward them manually.

**Limitation:** Only works for `nalluruhaneel@gmail.com`

---

### Option 3: Use Supabase Email Service (Alternative)

Instead of Resend, use Supabase's built-in email service:

1. **Configure SMTP in Supabase:**
   - Dashboard → Settings → Auth → SMTP Settings
   - Configure your SMTP provider (Gmail, SendGrid, etc.)

2. **Update Edge Function:**
   - Modify `send-welcome-email-resend` to use Supabase email API
   - Or use Supabase's `auth.admin.inviteUserByEmail()` method

---

## Current Status

- ✅ **RESEND_API_KEY:** Configured correctly
- ✅ **Email Function:** Deployed and working
- ⚠️ **Domain Verification:** Required to send to other recipients
- ⚠️ **From Address:** Currently using Resend test domain (`onboarding@resend.dev`)

---

## Quick Fix for Testing

Until domain is verified, you can:

1. **Send emails manually:**
   - Check Edge Function logs for email details
   - Copy credentials from logs
   - Send email manually to user

2. **Use your own email for testing:**
   - Create test users with `nalluruhaneel@gmail.com`
   - Emails will be sent successfully

---

## Domain Verification Checklist

- [ ] Domain added to Resend
- [ ] DNS records added to domain registrar
- [ ] Domain verified in Resend dashboard
- [ ] `from` address updated in Edge Function
- [ ] Function redeployed
- [ ] Test email sent successfully

---

## DNS Records Example

Resend will provide specific records, but typically:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [DKIM key provided by Resend]

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

---

## Next Steps

1. **For Production:** Verify domain in Resend (Option 1)
2. **For Testing:** Use manual email sending or test with your own email
3. **Update Function:** Change `from` address once domain is verified
4. **Redeploy:** Deploy updated function after domain verification

---

## Support

- **Resend Documentation:** https://resend.com/docs
- **Domain Verification:** https://resend.com/domains
- **Resend Dashboard:** https://resend.com













