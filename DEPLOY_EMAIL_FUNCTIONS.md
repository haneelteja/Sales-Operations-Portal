# 🚀 Deploy Email Functions - Option A (SMTP → Resend)

## Quick Deployment Guide

Since you're proceeding with **Option A**, you need to deploy:
1. `send-welcome-email-smtp` (new function)
2. `create-user` (updated function)

## Method 1: Supabase Dashboard (Easiest)

### Step 1: Deploy `send-welcome-email-smtp`

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/functions

2. **Create New Function:**
   - Click "Deploy a new function" or "Create function"
   - Function name: `send-welcome-email-smtp`
   - Copy the code from: `supabase/functions/send-welcome-email-smtp/index.ts`
   - Paste it into the editor
   - Click "Deploy"

### Step 2: Update `create-user` Function

1. **Go to `create-user` function:**
   - Find `create-user` in your functions list
   - Click "Edit" or "Update"

2. **Update the code:**
   - Copy the updated code from: `supabase/functions/create-user/index.ts`
   - Replace the existing code
   - Click "Deploy" or "Save"

## Method 2: Supabase CLI (If Authenticated)

If you have Supabase CLI authenticated:

```bash
# Login first (if not already logged in)
npx supabase login

# Deploy functions
cd supabase
npx supabase functions deploy send-welcome-email-smtp
npx supabase functions deploy create-user
```

## Verification Steps

After deployment:

1. **Check Function List:**
   - Verify `send-welcome-email-smtp` appears in your functions list
   - Verify `create-user` shows "Updated" timestamp

2. **Test Email Flow:**
   - Create a test user through User Management
   - Check Supabase Edge Function logs:
     - Go to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/functions/create-user/logs
   - Verify logs show:
     - "Trying SMTP email function first..."
     - If SMTP not configured: "SMTP function not available or failed, trying Resend..."
     - Email details logged if both fail

3. **Check Email Delivery:**
   - Verify email is received (check inbox and spam)
   - If not received, check logs for email details

## Expected Log Flow

### Scenario 1: SMTP Not Configured
```
Trying SMTP email function first...
SMTP function not available or failed, trying Resend...
✅ Welcome email sent successfully via Resend to: [email]
```

### Scenario 2: SMTP Configured and Working
```
Trying SMTP email function first...
✅ Email sent successfully via SMTP
```

### Scenario 3: Both SMTP and Resend Fail
```
Trying SMTP email function first...
SMTP function not available or failed, trying Resend...
❌ Resend fallback also failed
=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===
[Email details logged here]
```

## Troubleshooting

### Function Not Found
- Make sure function name matches exactly: `send-welcome-email-smtp`
- Check function is deployed (should appear in functions list)

### Deployment Failed
- Check for syntax errors in the code
- Verify all imports are correct
- Check Supabase dashboard for error messages

### Email Not Sending
- Check Edge Function logs for errors
- Verify environment variables are set (SMTP_USER, SMTP_PASS, RESEND_API_KEY)
- Check service quotas/limits

## Next Steps After Deployment

1. ✅ Deploy both functions
2. ✅ Test user creation
3. ✅ Verify email delivery
4. ✅ Check logs for proper fallback behavior
5. ✅ Monitor for any errors

Once deployed and tested, you can proceed with adding Mailgun (Option B) if desired!
