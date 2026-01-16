# 🚀 Deploy Updated Email Functions

## What Was Updated

✅ **Email Template** - New cleaner design with updated styling  
✅ **Subject Line** - Changed to "Your Access to Elma Operations Portal"  
✅ **All Functions Updated** - SMTP, Resend, and Mailgun functions

## 📋 Deployment Checklist

### Step 1: Deploy Updated Functions (5 minutes)

#### Option A: Supabase Dashboard (Recommended)

1. **Go to Supabase Functions:**
   - Navigate to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/functions

2. **Update `send-welcome-email-smtp`:**
   - Find `send-welcome-email-smtp` in the functions list
   - Click "Edit" or "Update"
   - Copy the entire code from: `supabase/functions/send-welcome-email-smtp/index.ts`
   - Replace the existing code
   - Click "Deploy" or "Save"

3. **Update `send-welcome-email-resend`:**
   - Find `send-welcome-email-resend` in the functions list
   - Click "Edit" or "Update"
   - Copy the entire code from: `supabase/functions/send-welcome-email-resend/index.ts`
   - Replace the existing code
   - Click "Deploy" or "Save"

4. **Update `create-user` (if not already updated):**
   - Find `create-user` in the functions list
   - Click "Edit" or "Update"
   - Copy the entire code from: `supabase/functions/create-user/index.ts`
   - Replace the existing code
   - Click "Deploy" or "Save"

#### Option B: Supabase CLI (If Authenticated)

```bash
# Navigate to project root
cd "c:\Users\Haneel Teja\Cursor Applications\Aamodha-Operations-Portal---V1"

# Deploy updated functions
npx supabase functions deploy send-welcome-email-smtp --project-ref qkvmdrtfhpcvwvqjuyuu
npx supabase functions deploy send-welcome-email-resend --project-ref qkvmdrtfhpcvwvqjuyuu
npx supabase functions deploy create-user --project-ref qkvmdrtfhpcvwvqjuyuu
```

### Step 2: Verify Deployment (2 minutes)

1. **Check Function Status:**
   - Go to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/functions
   - Verify all functions show "Updated" timestamp
   - Check for any deployment errors

2. **Verify Function Code:**
   - Open each function and verify the new template is present
   - Look for the new subject line: "Your Access to Elma Operations Portal"
   - Check for the new HTML template with updated styling

### Step 3: Test Email Sending (3 minutes)

1. **Create a Test User:**
   - Go to your application's User Management page
   - Create a new user with a test email address
   - Fill in all required fields
   - Click "Create User"

2. **Check Function Logs:**
   - Go to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/functions/create-user/logs
   - Look for:
     - `✅ Email sent successfully via SMTP` (if SMTP configured)
     - OR `✅ Welcome email sent successfully via Resend` (if Resend fallback)
     - Check that subject line shows: "Your Access to Elma Operations Portal"

3. **Verify Email Received:**
   - Check the test email inbox (and spam folder)
   - Verify email has:
     - ✅ New subject line: "Your Access to Elma Operations Portal"
     - ✅ New template design (cleaner styling)
     - ✅ Updated text content
     - ✅ Login credentials displayed correctly

## ✅ Success Criteria

You'll know everything is working when:

- ✅ All functions deployed successfully
- ✅ Test user creation succeeds
- ✅ Email is received with new template
- ✅ Subject line is "Your Access to Elma Operations Portal"
- ✅ Email displays correctly in inbox

## 🔍 What Changed in the Email

### Before:
- Subject: "Welcome to Elma Operations Portal - Your Login Credentials"
- Gradient header with emoji
- Different styling and colors

### After:
- Subject: "Your Access to Elma Operations Portal"
- Clean blue header (#1e3a8a)
- Simplified, professional design
- Updated text: "Your user account has been successfully created..."
- Button text: "Login to Portal"
- Footer: "Regards, Elma Manufacturing Pvt. Ltd."

## 🐛 Troubleshooting

### Function Not Updating?
- Make sure you copied the entire code from the file
- Check for syntax errors in the Supabase dashboard
- Try redeploying the function

### Email Not Received?
- Check spam folder
- Verify SMTP/Resend configuration
- Check function logs for errors
- Verify email address is correct

### Template Not Showing?
- Clear browser cache
- Check function logs to see which email service was used
- Verify the function code was updated correctly

## 📝 Quick Reference

**Functions to Update:**
1. `send-welcome-email-smtp`
2. `send-welcome-email-resend`
3. `create-user` (if not already updated)

**New Subject Line:**
```
Your Access to Elma Operations Portal
```

**Key Template Changes:**
- Header color: `#1e3a8a` (solid blue)
- Password background: `#fee2e2` (light red)
- Warning background: `#fff7ed` (light orange)
- Button: "Login to Portal"

---

**Ready to Deploy?** Follow Step 1 above to update all functions!
