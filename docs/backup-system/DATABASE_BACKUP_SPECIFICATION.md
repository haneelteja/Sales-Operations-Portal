# Database Backup System - Functional & Technical Specification

**Date:** January 27, 2026  
**Version:** 1.0  
**Status:** Implementation Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backup Strategy](#backup-strategy)
5. [Google Drive Integration](#google-drive-integration)
6. [Scheduling & Automation](#scheduling--automation)
7. [Retention Policy](#retention-policy)
8. [Application Configuration](#application-configuration)
9. [Backup Logs UI](#backup-logs-ui)
10. [Email Notifications](#email-notifications)
11. [Manual Backup Flow](#manual-backup-flow)
12. [Error Handling](#error-handling)
13. [Security & Access Control](#security--access-control)
14. [Implementation Checklist](#implementation-checklist)

---

## 1. Overview

### 1.1 Purpose
Automated daily database backup solution that securely backs up all Supabase tables and data, stores backups in Google Drive, maintains retention policies, and provides monitoring capabilities through the Application Configuration interface.

### 1.2 Key Features
- ✅ Automated daily backups at 1:00 AM
- ✅ Manual backup trigger from UI
- ✅ Google Drive storage with configurable path
- ✅ 15-day retention policy with automatic cleanup
- ✅ Comprehensive backup logs with filtering/sorting
- ✅ Email notifications on failure
- ✅ Manager role access control

### 1.3 Backup Format
- **Format:** PostgreSQL SQL dump (compressed with gzip)
- **File Extension:** `.sql.gz`
- **Naming Convention:** `DB_Backup_YYYY-MM-DD_HH-MM.sql.gz`
- **Example:** `DB_Backup_2026-01-27_01-00.sql.gz`

---

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Frontend                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Application Configuration Tab                        │  │
│  │  - Backup Logs Viewer (Dialog)                      │  │
│  │  - Backup Folder Path (Edit)                       │  │
│  │  - Notification Email (Edit)                        │  │
│  │  - Manual Backup Button                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database Tables                                      │  │
│  │  - backup_logs                                       │  │
│  │  - invoice_configurations (backup settings)         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions                                       │  │
│  │  - database-backup (main backup function)           │  │
│  │  - cleanup-old-backups (retention cleanup)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cron Jobs / Scheduled Tasks                         │  │
│  │  - Daily backup at 1:00 AM                          │  │
│  │  - Daily cleanup at 2:00 AM                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Drive                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backup Folder (Configurable Path)                   │  │
│  │  - DB_Backup_2026-01-27_01-00.sql.gz                │  │
│  │  - DB_Backup_2026-01-26_01-00.sql.gz                │  │
│  │  - ... (15 days retention)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Email Service                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Failure Notifications                                │  │
│  │  - Configurable recipient                            │  │
│  │  - Backup details & error info                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Automated Backup Flow:**
1. Cron job triggers `database-backup` Edge Function at 1:00 AM
2. Edge Function connects to Supabase database
3. Generates PostgreSQL dump using `pg_dump`
4. Compresses dump file (gzip)
5. Uploads to Google Drive in configured folder
6. Logs backup attempt in `backup_logs` table
7. On failure: Sends email notification

**Manual Backup Flow:**
1. User clicks "Run Backup" button in Application Configuration
2. Frontend calls Supabase Edge Function endpoint
3. Same process as automated backup (marked as "Manual")
4. UI updates with success/failure status

**Retention Cleanup Flow:**
1. Cron job triggers `cleanup-old-backups` at 2:00 AM
2. Lists all backups in Google Drive folder
3. Identifies backups older than 15 days
4. Deletes old backups from Google Drive
5. Updates `backup_logs` table (marks as deleted)
6. On failure: Sends email notification

---

## 3. Database Schema

### 3.1 Backup Logs Table

```sql
CREATE TABLE IF NOT EXISTS backup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('automatic', 'manual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'in_progress')),
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  google_drive_file_id VARCHAR(255),
  google_drive_path TEXT,
  failure_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- For soft delete tracking
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_backup_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
```

### 3.2 Configuration Extensions

Add backup-related configurations to `invoice_configurations` table:

```sql
-- Backup folder path in Google Drive
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_folder_path', 'MyDrive/DatabaseBackups', 'string', 'Google Drive folder path for database backups')
ON CONFLICT (config_key) DO NOTHING;

-- Backup failure notification email
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_notification_email', 'pega2023test@gmail.com', 'string', 'Email address for backup failure notifications')
ON CONFLICT (config_key) DO NOTHING;

-- Backup enabled flag (optional, for future use)
INSERT INTO invoice_configurations (config_key, config_value, config_type, description)
VALUES 
  ('backup_enabled', 'true', 'boolean', 'Enable/disable automated database backups')
ON CONFLICT (config_key) DO NOTHING;
```

### 3.3 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Managers can view all backup logs
CREATE POLICY "Managers can view backup logs"
  ON backup_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('manager', 'admin')
    )
  );

-- Policy: System can insert backup logs (via service role)
CREATE POLICY "Service role can insert backup logs"
  ON backup_logs FOR INSERT
  WITH CHECK (true);

-- Policy: System can update backup logs (via service role)
CREATE POLICY "Service role can update backup logs"
  ON backup_logs FOR UPDATE
  USING (true);
```

---

## 4. Backup Strategy

### 4.1 Backup Method

**PostgreSQL pg_dump:**
- Uses Supabase's PostgreSQL connection
- Generates complete SQL dump including:
  - Schema (tables, indexes, constraints, triggers)
  - Data (all rows)
  - Sequences
  - Functions and procedures
  - Permissions (if accessible)

**Compression:**
- Uses gzip compression
- Reduces file size by ~70-90%
- Faster upload to Google Drive

### 4.2 Backup Process

1. **Pre-backup Checks:**
   - Verify database connection
   - Check Google Drive credentials
   - Validate backup folder path exists

2. **Dump Generation:**
   ```bash
   pg_dump -h [host] -U [user] -d [database] \
     --no-owner --no-acl \
     --format=plain \
     --file=backup.sql
   ```

3. **Compression:**
   ```bash
   gzip backup.sql
   # Result: backup.sql.gz
   ```

4. **Upload to Google Drive:**
   - Use existing `GoogleDriveAdapter`
   - Upload to configured folder path
   - Store file ID for future reference

5. **Logging:**
   - Insert record in `backup_logs`
   - Update status: `success` or `failed`
   - Store file metadata

### 4.3 Backup Validation

After backup completion:
- Verify file exists in Google Drive
- Verify file size > 0
- Verify file can be downloaded
- Log validation results

---

## 5. Google Drive Integration

### 5.1 Folder Path Configuration

- **Default Path:** `MyDrive/DatabaseBackups`
- **Configurable via:** Application Configuration → Backup Folder Path
- **Validation:** Must be valid Google Drive path format
- **Auto-creation:** Folder created if doesn't exist

### 5.2 File Naming Convention

```
DB_Backup_YYYY-MM-DD_HH-MM.sql.gz

Examples:
- DB_Backup_2026-01-27_01-00.sql.gz (automatic)
- DB_Backup_2026-01-27_14-30.sql.gz (manual)
```

### 5.3 Upload Process

1. Use existing `GoogleDriveAdapter` from `src/services/cloudStorage/googleDriveAdapter.ts`
2. Create folder if doesn't exist
3. Upload compressed SQL file
4. Store file ID and path in `backup_logs`

---

## 6. Scheduling & Automation

### 6.1 Supabase Cron Jobs

**Option 1: Supabase pg_cron Extension (Recommended)**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily backup at 1:00 AM UTC
SELECT cron.schedule(
  'daily-database-backup',
  '0 1 * * *', -- 1:00 AM daily
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT].supabase.co/functions/v1/database-backup',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "scheduled"}'::jsonb
  );
  $$
);

-- Schedule daily cleanup at 2:00 AM UTC
SELECT cron.schedule(
  'daily-backup-cleanup',
  '0 2 * * *', -- 2:00 AM daily
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT].supabase.co/functions/v1/cleanup-old-backups',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

**Option 2: External Cron Service**

If pg_cron is not available, use external service:
- GitHub Actions (scheduled workflows)
- Vercel Cron Jobs
- External cron service (cron-job.org, etc.)

### 6.2 Timezone Considerations

- Cron jobs run in UTC
- 1:00 AM UTC = 6:30 AM IST (India Standard Time)
- Adjust cron schedule if different timezone required

---

## 7. Retention Policy

### 7.1 Retention Rules

- **Retention Period:** 15 days
- **Cleanup Time:** Daily at 2:00 AM (1 hour after backup)
- **Cleanup Scope:** Google Drive folder only
- **Log Retention:** Keep logs indefinitely (soft delete)

### 7.2 Cleanup Process

1. List all files in backup folder
2. Filter files matching naming pattern: `DB_Backup_*.sql.gz`
3. Extract date from filename
4. Calculate age: `current_date - file_date`
5. If age > 15 days:
   - Delete file from Google Drive
   - Update `backup_logs.deleted_at` timestamp
6. Log cleanup results

### 7.3 Cleanup Validation

- Verify file deletion succeeded
- Log number of files deleted
- Log total space freed
- Send notification if cleanup fails

---

## 8. Application Configuration

### 8.1 New Configuration Items

Add to `ApplicationConfigurationTab.tsx`:

#### 8.1.1 Database Backup (View Logs)
- **Type:** Action button
- **Label:** "View Backup Logs"
- **Action:** Opens `BackupLogsDialog`
- **Access:** Manager role only

#### 8.1.2 Backup Folder Path
- **Type:** Editable configuration
- **Key:** `backup_folder_path`
- **Default:** `MyDrive/DatabaseBackups`
- **Validation:** Google Drive path format
- **Action:** Edit button → `EditBackupFolderDialog`

#### 8.1.3 Backup Failure Notification Email
- **Type:** Editable configuration
- **Key:** `backup_notification_email`
- **Default:** `pega2023test@gmail.com`
- **Validation:** Valid email format
- **Action:** Edit button → `EditNotificationEmailDialog`

#### 8.1.4 Manual Database Backup
- **Type:** Action button
- **Label:** "Run Backup Now"
- **Action:** Triggers immediate backup
- **Loading State:** Shows spinner during backup
- **Access:** Manager role only

### 8.2 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Application Configuration                              │
├─────────────────────────────────────────────────────────┤
│  Configurations                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  S.NO │ Description              │ Action         │ │
│  ├───────┼──────────────────────────┼───────────────┤ │
│  │  1    │ Database Backup          │ [View Logs]    │ │
│  │  2    │ Backup Folder Path      │ [Edit]         │ │
│  │  3    │ Notification Email      │ [Edit]         │ │
│  │  4    │ Manual Database Backup   │ [Run Backup]   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Backup Logs UI

### 9.1 BackupLogsDialog Component

**Features:**
- Modal dialog (full-screen or large)
- Sortable table columns
- Filterable by status, type, date range
- Paginated results (20 per page)
- Export to CSV (optional)

**Table Columns:**
1. **Date & Time** (sortable)
2. **Type** (Automatic / Manual) (filterable)
3. **Status** (Success / Failed) (filterable)
4. **File Name** (clickable → download)
5. **File Size** (human-readable: MB, GB)
6. **Google Drive Path** (clickable → open in Drive)
7. **Failure Reason** (only shown if failed)

**Filters:**
- Status: All / Success / Failed
- Type: All / Automatic / Manual
- Date Range: Last 7 days / Last 30 days / Custom range

**Sorting:**
- Default: Date & Time (descending - newest first)
- Sortable columns: Date & Time, File Size, Status

### 9.2 Component Structure

```typescript
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-6xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle>Database Backup Logs</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Filters */}
      <BackupLogsFilters />
      
      {/* Table */}
      <BackupLogsTable 
        logs={filteredLogs}
        onSort={handleSort}
        onFilter={handleFilter}
      />
      
      {/* Pagination */}
      <BackupLogsPagination />
    </div>
  </DialogContent>
</Dialog>
```

---

## 10. Email Notifications

### 10.1 Notification Triggers

Email sent on:
- Backup dump failure
- Google Drive upload failure
- Retention cleanup failure
- Any critical backup system error

### 10.2 Email Content

**Subject:** `[Database Backup] Backup Failed - [Date]`

**Body Template:**
```
Database Backup Failure Alert

Date & Time: [backup_date] [backup_time]
Backup Type: [automatic/manual]
Status: Failed

Failure Details:
[detailed_error_message]

File Information:
- File Name: [file_name]
- Expected Size: [file_size]
- Google Drive Path: [drive_path]

System Information:
- Environment: [production/staging]
- Backup ID: [backup_log_id]

Please investigate and ensure backups are functioning correctly.

---
This is an automated message from Aamodha Operations Portal.
```

### 10.3 Email Service

Use existing email infrastructure:
- Supabase Edge Function for email sending
- Or integrate with existing email service (Resend, SendGrid, etc.)

---

## 11. Manual Backup Flow

### 11.1 User Action

1. User navigates to Application Configuration
2. Clicks "Run Backup Now" button
3. Button shows loading state
4. Confirmation dialog (optional): "Start backup now?"

### 11.2 Backup Execution

1. Frontend calls Edge Function: `POST /functions/v1/database-backup`
2. Request body: `{ "trigger": "manual", "triggered_by": "[user_id]" }`
3. Edge Function executes backup process
4. Returns backup status and log ID

### 11.3 UI Feedback

- **During Backup:**
  - Button disabled
  - Loading spinner
  - Toast: "Backup in progress..."

- **On Success:**
  - Toast: "Backup completed successfully!"
  - Refresh backup logs (optional)

- **On Failure:**
  - Toast: "Backup failed. Check logs for details."
  - Error details in toast

---

## 12. Error Handling

### 12.1 Error Categories

1. **Database Connection Errors**
   - Retry logic (3 attempts)
   - Log error details
   - Send notification

2. **Dump Generation Errors**
   - Log pg_dump error output
   - Verify disk space
   - Send notification

3. **Google Drive Errors**
   - Verify credentials
   - Check folder permissions
   - Retry upload (3 attempts)
   - Send notification

4. **Compression Errors**
   - Verify disk space
   - Log error
   - Send notification

5. **Cleanup Errors**
   - Log which files failed to delete
   - Continue with other files
   - Send notification

### 12.2 Error Logging

All errors logged to:
- `backup_logs.failure_reason` (user-friendly)
- Edge Function logs (detailed)
- Email notification (summary)

---

## 13. Security & Access Control

### 13.1 Role-Based Access

- **Manager Role:** Full access
  - View backup logs
  - Edit configurations
  - Trigger manual backups

- **Other Roles:** No access
  - Configuration items hidden
  - API endpoints protected

### 13.2 API Security

- Edge Functions require authentication
- Service role key for scheduled jobs
- User authentication for manual triggers
- Rate limiting on manual backup endpoint

### 13.3 Data Protection

- Backup files encrypted in transit (HTTPS)
- Google Drive encryption at rest
- No sensitive data in logs (passwords, tokens)
- Secure credential storage (Supabase secrets)

---

## 14. Implementation Checklist

### Phase 1: Database & Backend
- [ ] Create `backup_logs` table
- [ ] Add backup configurations to `invoice_configurations`
- [ ] Set up RLS policies
- [ ] Create `database-backup` Edge Function
- [ ] Create `cleanup-old-backups` Edge Function
- [ ] Implement pg_dump logic
- [ ] Implement Google Drive upload
- [ ] Implement email notification service

### Phase 2: Scheduling
- [ ] Set up pg_cron or external scheduler
- [ ] Configure daily backup job (1:00 AM)
- [ ] Configure daily cleanup job (2:00 AM)
- [ ] Test scheduled execution

### Phase 3: Frontend UI
- [ ] Add backup config items to `ApplicationConfigurationTab`
- [ ] Create `BackupLogsDialog` component
- [ ] Create `EditBackupFolderDialog` component
- [ ] Create `EditNotificationEmailDialog` component
- [ ] Implement manual backup button
- [ ] Add loading states and error handling

### Phase 4: Testing
- [ ] Test automated backup
- [ ] Test manual backup
- [ ] Test retention cleanup
- [ ] Test email notifications
- [ ] Test UI components
- [ ] Test error scenarios
- [ ] Performance testing (large databases)

### Phase 5: Documentation
- [ ] User guide for backup management
- [ ] Troubleshooting guide
- [ ] API documentation
- [ ] Deployment guide

---

## 15. Technical Considerations

### 15.1 Performance

- **Large Databases:** Use `pg_dump` with compression
- **Network:** Monitor upload times
- **Storage:** Monitor Google Drive quota
- **Timeouts:** Set appropriate timeout values

### 15.2 Monitoring

- Track backup success rate
- Monitor backup file sizes
- Alert on consecutive failures
- Track cleanup efficiency

### 15.3 Future Enhancements

- Incremental backups
- Backup encryption
- Multiple storage providers
- Backup restoration UI
- Backup verification/validation
- Backup scheduling customization

---

**Status:** Ready for Implementation  
**Next Steps:** Begin Phase 1 - Database & Backend Implementation
