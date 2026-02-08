# Backup Folder Path Fix - Deployment Guide

**Date:** January 27, 2026  
**Issue:** Backup files were saving to root drive instead of configured folder path  
**Status:** ✅ Fixed and ready for deployment

---

## 🔧 What Was Fixed

### Problem
- Backup files were being uploaded directly to Google Drive root
- The `backup_folder_path` configuration was not being respected
- `google-drive-upload` Edge Function only accepted `folderId`, not `folderPath`

### Solution
1. **Updated `google-drive-upload` Edge Function:**
   - Now accepts `folderPath` parameter in addition to `folderId`
   - Automatically resolves folder path to folder ID
   - Creates folder hierarchy if it doesn't exist

2. **Added Helper Functions:**
   - `resolveFolderPath()`: Parses and creates folder structure
   - `findFolder()`: Finds existing folders by name
   - `createFolderInDrive()`: Creates new folders in Google Drive

3. **Updated `database-backup` Function:**
   - Now correctly handles response fields from `google-drive-upload`
   - Properly stores file URLs and paths in backup logs

---

## 📋 Deployment Steps

### Step 1: Deploy Updated Edge Function

**Option A: Using Supabase CLI (Recommended)**
```bash
# Navigate to project root
cd "c:\Users\Haneel Teja\Cursor Applications\Aamodha-Operations-Portal---V1"

# Deploy the updated function
supabase functions deploy google-drive-upload
```

**Option B: Using Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** → **google-drive-upload**
4. Click **"Deploy"** or **"Update"**
5. Copy the contents of `supabase/functions/google-drive-upload/index.ts`
6. Paste into the function editor
7. Click **"Deploy"**

### Step 2: Verify Edge Function Secrets

Ensure these secrets are configured in Supabase Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

**To check/update secrets:**
1. Go to **Edge Functions** → **Secrets**
2. Verify all required secrets are present
3. Add any missing secrets

### Step 3: Configure Backup Folder Path

1. Go to **Application Configuration** tab in your app
2. Find **"Backup Folder Path (Google Drive)"**
3. Click **"Edit"**
4. Set the folder path (e.g., `MyDrive/DatabaseBackups` or `DatabaseBackups`)
5. Click **"Save"**

**Note:** The function will automatically:
- Remove "MyDrive/" prefix if present (it's just a display name)
- Create the folder if it doesn't exist
- Upload backups to that folder

### Step 4: Test the Fix

1. **Run Manual Backup:**
   - Go to **Application Configuration** → **Database Backup**
   - Click **"Run Backup Now"**
   - Wait for completion

2. **Verify in Backup Logs:**
   - Click **"View Backup Logs"**
   - Check the latest backup entry:
     - Status should be **"Success"**
     - Google Drive path should show the correct folder path
     - File name should be present

3. **Verify in Google Drive:**
   - Open Google Drive
   - Navigate to the configured folder (e.g., `DatabaseBackups`)
   - Confirm the backup file is there (not in root)
   - File name format: `DB_Backup_YYYY-MM-DD_HH-MM.sql.gz`

---

## ✅ Verification Checklist

- [ ] Edge Function deployed successfully
- [ ] All required secrets are configured
- [ ] Backup folder path is configured in Application Configuration
- [ ] Manual backup test completed successfully
- [ ] Backup file appears in correct Google Drive folder (not root)
- [ ] Backup logs show correct folder path
- [ ] No errors in Edge Function logs

---

## 🐛 Troubleshooting

### Issue: Backup still saves to root
**Solution:**
- Verify the `backup_folder_path` configuration is set correctly
- Check Edge Function logs for errors
- Ensure the folder path doesn't contain invalid characters

### Issue: Folder not created
**Solution:**
- Check Google Drive API permissions
- Verify `GOOGLE_REFRESH_TOKEN` is valid
- Check Edge Function logs for authentication errors

### Issue: Edge Function deployment failed
**Solution:**
- Verify all required secrets are set
- Check function code syntax
- Review Supabase Dashboard error messages

---

## 📝 Technical Details

### How Folder Path Resolution Works

1. **Path Normalization:**
   ```
   Input: "MyDrive/DatabaseBackups"
   Normalized: "DatabaseBackups"
   ```

2. **Folder Creation:**
   - Checks if "DatabaseBackups" exists in root
   - If not, creates it
   - Returns folder ID

3. **File Upload:**
   - Uploads file with `parents: [folderId]`
   - File is placed in the correct folder

### Example Flow

```
Configuration: "MyDrive/DatabaseBackups"
  ↓
Normalize: "DatabaseBackups"
  ↓
Find/Create: Folder ID "abc123..."
  ↓
Upload: File with parents: ["abc123..."]
  ↓
Result: File in "DatabaseBackups" folder ✅
```

---

## 🔄 Next Steps After Deployment

1. **Monitor First Few Backups:**
   - Verify they all save to the correct folder
   - Check backup logs for consistency

2. **Set Up Scheduled Backups:**
   - Follow `docs/backup-system/CRON_SETUP.md`
   - Configure daily backups at 1:00 AM

3. **Test Cleanup Function:**
   - Verify old backups are deleted after 15 days
   - Check that cleanup respects folder path

---

## 📚 Related Documentation

- `docs/backup-system/DEPLOY_EDGE_FUNCTIONS.md` - General Edge Function deployment
- `docs/backup-system/SETUP_GUIDE.md` - Complete backup system setup
- `docs/backup-system/CRON_SETUP.md` - Scheduled backup configuration

---

**Status:** Ready for deployment  
**Last Updated:** January 27, 2026
