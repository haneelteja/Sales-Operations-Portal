# 🚀 Quick SMTP Setup - No Domain Needed!

## Perfect Solution: Use Gmail SMTP

You can send emails to **any address** (including Gmail) using **your Gmail account** - no domain verification needed!

## 3 Simple Steps

### Step 1: Get Gmail App Password (2 minutes)

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Enable 2-Step Verification if prompted
4. Create App Password:
   - Select "Mail" → "Other (Custom name)"
   - Name: "Supabase"
   - Click "Generate"
   - **Copy the 16-character password**

### Step 2: Add Secrets in Supabase (1 minute)

Go to: https://supabase.com/dashboard/project/qkvmdrtfhpcvwvqjuyuu/settings/functions

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `nalluruhaneel@gmail.com` (your Gmail) |
| `SMTP_PASS` | `[Your 16-char App Password]` |
| `SMTP_FROM_EMAIL` | `nalluruhaneel@gmail.com` |
| `SMTP_FROM_NAME` | `Elma Operations` |

### Step 3: Deploy Function (1 minute)

```bash
cd supabase
npx supabase functions deploy send-welcome-email-smtp
```

## That's It! ✅

Now when you create a user, emails will be sent via Gmail SMTP to **any email address** (Gmail, Outlook, etc.)!

## Gmail Limits

- **Free Gmail:** 500 emails/day
- **Google Workspace:** 2,000 emails/day

For higher volumes, see `SUPABASE_SMTP_SETUP.md` for other providers.

## Troubleshooting

**"Authentication failed"**
- Use App Password, not your regular Gmail password
- Make sure 2-Step Verification is enabled

**"Email not received"**
- Check spam folder
- Verify you haven't hit Gmail's daily limit (500/day)

## Need More Help?

See `SUPABASE_SMTP_SETUP.md` for detailed instructions.
