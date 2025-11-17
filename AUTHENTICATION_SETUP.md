# 🔐 Authentication Setup - Complete Guide

## Current Status
- ✅ User exists in Supabase Auth: `nalluruhaneel@gmail.com`
- ❌ User missing from user_management table
- ❌ Authentication failing in application

## Solution

### Step 1: Get User ID from Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select project: `yltbknkksjgtexluhtau`
3. Navigate to: **Authentication** → **Users**
4. Find: `nalluruhaneel@gmail.com`
5. **Copy the User ID** (UUID format like `12345678-1234-1234-1234-123456789abc`)

### Step 2: Update User Management Record
1. Open: `final_user_setup.cjs`
2. Replace `YOUR_USER_ID_HERE` with the actual User ID from Step 1
3. Run: `node final_user_setup.cjs`

### Step 3: Start Application
```bash
./fix_auth_and_start.sh
```

## After Setup
- ✅ User can sign in with: `nalluruhaneel@gmail.com`
- ✅ Password: (whatever you set in Supabase Dashboard)
- ✅ All application features will work
- ✅ No more authentication errors

## Quick Commands
```bash
# 1. Get User ID from Supabase Dashboard (manual)
# 2. Update final_user_setup.cjs with User ID
# 3. Create user management record
node final_user_setup.cjs

# 4. Start application
./fix_auth_and_start.sh
```

## Troubleshooting
- If you get "Invalid login credentials", check the password in Supabase Dashboard
- If you get "User not found", make sure the User ID is correct
- If you get foreign key errors, the User ID doesn't exist in auth.users

## Success Indicators
- ✅ No more "Invalid login credentials" errors
- ✅ User can sign in successfully
- ✅ All tabs work properly
- ✅ No more authentication-related console errors





