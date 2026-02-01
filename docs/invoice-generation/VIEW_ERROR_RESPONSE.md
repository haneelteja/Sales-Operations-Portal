# How to View Detailed Error Response

## 🔍 Current Situation

The function is returning a 500 error, but the raw log doesn't show the actual error response body. The enhanced error logging should show exactly what's wrong with your secrets.

---

## ✅ Step 1: View the Actual Error Response

### Option A: Check Function Test Response (Easiest)

1. **Go to Supabase Dashboard:**
   - Navigate to **Edge Functions** → `google-drive-token`
   - Click **Invoke** tab (or **Test** tab)

2. **Look at the Response Body:**
   - After clicking "Invoke Function", you should see a response section
   - **Copy the entire JSON response** - it should look like:
     ```json
     {
       "error": "Token refresh failed: Unauthorized",
       "reason": "Client ID, Client Secret, or Refresh Token mismatch",
       "actualClientSecretPrefix": "GOCSPX-",
       "actualClientSecretSuffix": "_wYb",
       "clientSecretMatches": true/false,
       ...
     }
     ```

3. **Key Fields to Check:**
   - `actualClientSecretPrefix`: Should be `"GOCSPX-"`
   - `actualClientSecretSuffix`: Should be `"_wYb"`
   - `clientSecretMatches`: Should be `true` if secret is correct

---

### Option B: Check Function Logs

1. **Go to Function Logs:**
   - Navigate to **Edge Functions** → `google-drive-token`
   - Click **Logs** tab
   - Find the most recent invocation (should be at the top)

2. **Look for These Log Entries:**
   - `"Token refresh error:"` - Shows basic debug info
   - `"Detailed unauthorized_client error:"` - Shows the full error with secret comparison

3. **Check the Log Details:**
   - Expand the log entry
   - Look for `actualClientSecretPrefix` and `actualClientSecretSuffix`
   - Compare with expected values

---

## 🔍 Step 2: Interpret the Error Response

### If `clientSecretMatches: false`:

**This means your Client Secret is wrong.**

**Fix:**
1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your OAuth Client ID
3. Click **Show** next to "Client secret"
4. Copy the **EXACT** value
5. Update `GOOGLE_CLIENT_SECRET` in Supabase secrets

### If `clientSecretMatches: true` but still failing:

**This means the Refresh Token is wrong or expired.**

**Fix:**
1. Get a new refresh token from OAuth Playground
2. Update `GOOGLE_REFRESH_TOKEN` in Supabase secrets

### If `clientIdMatches: false`:

**This means your Client ID is wrong.**

**Fix:**
1. Update `GOOGLE_CLIENT_ID` to: `616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com`

---

## 📋 What to Share

When asking for help, please share:

1. **The full JSON error response** from the function test
2. **OR** the log entry showing `"Detailed unauthorized_client error"`
3. Specifically these fields:
   - `actualClientSecretPrefix`
   - `actualClientSecretSuffix`
   - `clientSecretMatches`
   - `clientIdMatches`

This will help identify exactly which secret is wrong.

---

## 🎯 Expected Values

**If everything is correct, you should see:**

```json
{
  "actualClientId": "616700014543-pk3qsecv9cj5g0gbug1b08hqbfk7q79q.apps.googleusercontent.com",
  "clientIdMatches": true,
  "actualClientSecretPrefix": "GOCSPX-",
  "actualClientSecretSuffix": "_wYb",
  "clientSecretMatches": true,
  "refreshTokenPreview": "1//04C3UHP...",
  "refreshTokenLength": 103
}
```

**If any of these don't match, that's your problem!**
