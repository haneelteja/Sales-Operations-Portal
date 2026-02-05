# Configurable Database Backup Settings — Functional & Technical Specification

**Version:** 1.0  
**Date:** January 27, 2026  
**Status:** Implementation-ready  
**Audience:** Backend, React frontend, QA/UAT, DevOps

---

## 1. Objective & Scope

**Objective:** Design and implement configurable database backup settings so authorized users can manage the **Google Drive backup folder path** and **backup execution time** from the Application Configuration landing page. Changes must be validated, persisted, and applied immediately (no restart).

**Module:** Application Configuration (under User Management)  
**UI Entry:** Application Configuration → Configurations table  
**Access:** Manager/Admin only (role-based).

---

## 2. Configurations Table (Landing Page)

### 2.1 Table Structure

| Column   | Description                          |
|----------|--------------------------------------|
| **S.NO** | Serial number (1-based)              |
| **Description** | Configuration name/description |
| **Action** | Edit button (or control) per row   |

### 2.2 Backup-Related Rows

The following items **must** appear in this table:

| S.NO (example) | Description | Action | Config key |
|----------------|-------------|--------|------------|
| — | Database Backup Folder Path (Google Drive) | Edit | `backup_folder_path` |
| — | Database Backup Time | Edit | `backup_schedule_time_ist` |

Other backup-related settings (e.g. notification email, retention) may appear in the same table or in a dedicated Backup section; at minimum the two above are in the Configurations table.

### 2.3 UI Behavior

- Only Manager/Admin can see and use the Application Configuration page (existing RLS and role checks).
- Edit opens the corresponding modal (folder path or backup time).
- No application restart; changes take effect on next backup run / scheduler cycle.

---

## 3. Database Backup Folder Path (Google Drive)

### 3.1 Default & Storage

- **Default value:** `MyDrive/Invoice`
- **Stored in:** `invoice_configurations.config_value` where `config_key = 'backup_folder_path'`
- **Type:** string

### 3.2 Modal Dialog Behavior

- **Trigger:** Click Edit on the "Database Backup Folder Path (Google Drive)" row.
- **Title:** e.g. "Edit Backup Folder Path"
- **Content:**
  - Show current folder path in an input.
  - Allow edit; placeholder e.g. "MyDrive/Invoice" or "MyDrive/DatabaseBackups".
- **Actions:** Save, Cancel.
- **On Save:**
  - Validate path (see Validation).
  - Call API to update `backup_folder_path`.
  - On success: close dialog, show success toast, refresh config; changes apply immediately for the next backup.
- **On Cancel:** Close dialog without saving; reset input to current value.

### 3.3 Validation Rules (Folder Path)

- **Required:** Non-empty after trim.
- **Format:** Valid Google Drive–style path:
  - Allowed: letters, numbers, spaces, `/`, `-`, `_`
  - No `..`, no leading/trailing slash (or define one canonical form).
- **Length:** e.g. max 255 characters.
- **Invalid input:** Show inline error and/or toast; do not save.

### 3.4 Error Handling

- **Validation failure:** Message e.g. "Invalid folder path format. Use format: FolderName/SubFolder or MyDrive/FolderName".
- **Save failure (network/API):** Toast with error; keep dialog open so user can retry or cancel.
- **Permissions:** Only Manager/Admin can open the dialog and call update API (enforced by RLS and UI).

---

## 4. Database Backup Time

### 4.1 Default & Storage

- **Default value:** `14:00` (2:00 PM IST).
- **Stored in:** `invoice_configurations.config_value` where `config_key = 'backup_schedule_time_ist'`
- **Format:** `HH:MM` in 24-hour format, interpreted as **IST (India Standard Time)**.
- **Type:** string

### 4.2 Modal Dialog Behavior

- **Trigger:** Click Edit on the "Database Backup Time" row.
- **Title:** e.g. "Edit Backup Execution Time"
- **Content:**
  - Show current backup time (e.g. time input or dropdown).
  - Show timezone explicitly: e.g. "Time (IST – India Standard Time)".
  - Time picker: 24-hour or 12-hour with AM/PM; stored as HH:MM.
- **Actions:** Save, Cancel.
- **On Save:**
  - Validate time (see Validation).
  - Call API to update `backup_schedule_time_ist`.
  - On success: close dialog, show success toast, refresh config. **Reschedule:** New time applies on next scheduler run (see Scheduler Update Logic).
- **On Cancel:** Close without saving.

### 4.3 Validation Rules (Backup Time)

- **Format:** `HH:MM` 24-hour (e.g. 00:00–23:59), or equivalent from time picker.
- **Range:** 00:00 to 23:59.
- **Invalid input:** Clear message; do not save.

### 4.4 Error Handling

- **Validation failure:** e.g. "Please enter a valid time in HH:MM format (IST)."
- **Save failure:** Toast with error; keep dialog open.
- **Scheduler update:** If the system uses a “scheduler runner” that reads this value, no separate “reschedule” API is needed; document that the new time is used on the next runner cycle.

---

## 5. Scheduler Update Logic

### 5.1 Immediate Effect Without Restart

- **Folder path:** Edge function `database-backup` reads `backup_folder_path` from the database at run time. Changing the path in the UI updates the DB; the **next** backup run uses the new path. No restart.
- **Backup time:** The scheduled job must use the stored time each time it runs.

### 5.2 Recommended Approach: Time-Driven Runner

- **Option A – Fixed cron + runner:**  
  A cron job runs on a fixed schedule (e.g. every 15 minutes). An edge function (e.g. `backup-scheduler`) is invoked, reads `backup_schedule_time_ist` and `backup_enabled`, and if the current time in IST matches the configured time (e.g. within the same 15-minute window), it calls `database-backup` with `trigger: 'automatic'`.  
  When the user changes the backup time, only the config row is updated; the next runner cycle uses the new time. **No cron reschedule** is required; “reschedule” means “new time applies from next run.”

- **Option B – Single daily cron at fixed UTC:**  
  If backup time is fixed at 2:00 PM IST (08:30 UTC), cron stays `30 8 * * *`. Configurable time would then require either a runner (Option A) or an external scheduler that re-reads config and adjusts cron (complex). Option A is preferred for configurable time.

### 5.3 Data Flow

1. User edits backup time and saves → `backup_schedule_time_ist` updated in DB.
2. Scheduler runner (e.g. every 15 min) runs → reads `backup_schedule_time_ist` and `backup_enabled`.
3. If current IST time matches configured time → invoke `database-backup` with `trigger: 'automatic'`.
4. `database-backup` reads `backup_folder_path` (and other settings) from DB and runs backup to that path.

---

## 6. Data Model for Backup Configurations

### 6.1 Table: `invoice_configurations`

Backup settings are stored as rows:

| config_key | config_value (example) | config_type | description |
|------------|-------------------------|-------------|-------------|
| backup_folder_path | MyDrive/Invoice | string | Google Drive folder path for database backups |
| backup_schedule_time_ist | 14:00 | string | Daily backup execution time in IST (HH:MM 24h) |
| backup_notification_email | … | string | Email for backup failure notifications |
| backup_enabled | true | boolean | Enable/disable automated backups |
| backup_retention_days | 15 | number | Days to retain backup files |

### 6.2 Audit (Who Changed, When)

- **updated_by:** UUID of the user who last updated the row (set on UPDATE from frontend).
- **updated_at:** Timestamp of last update (trigger-maintained).
- No separate audit table is required for this spec; optional future: dedicated `config_audit_log` if full history is needed.

---

## 7. Role-Based Access Control

- **View Application Configuration:** Manager, Admin only (existing).
- **Edit backup folder path:** Manager, Admin only; enforce in UI (hide/disable Edit for others) and in API (RLS on `invoice_configurations` UPDATE).
- **Edit backup time:** Same as above.
- **Trigger manual backup:** Manager, Admin only (existing).

---

## 8. Validation & Error Handling Summary

| Field | Validation | On failure |
|-------|------------|------------|
| Backup folder path | Non-empty, format, max length | Inline/toast; no save |
| Backup time | HH:MM, 00:00–23:59 | Inline/toast; no save |

- **Save failures:** Toast with server/network error; dialog remains open.
- **Success:** Toast “Configuration updated successfully” (or equivalent); close dialog; refresh config.

---

## 9. Existing Backups

- Changing folder path or time **must not** move, rename, or delete existing backup files.
- New backups use the new path; old backups remain in the previous path until retention/cleanup runs (if applicable).

---

## 10. Implementation Notes

### 10.1 Backend

- Ensure `backup_schedule_time_ist` exists in `invoice_configurations` (migration), default `14:00`.
- `database-backup` and cleanup already read config at runtime; no change needed for folder path.
- If using a scheduler runner: implement edge function that reads `backup_schedule_time_ist`, compares with current IST, and calls `database-backup` when matched.

### 10.2 Frontend (React)

- Configurations table: include rows for `backup_folder_path` and `backup_schedule_time_ist` with Edit.
- **EditBackupFolderDialog:** Already exists; ensure default/placeholder is MyDrive/Invoice where appropriate.
- **EditBackupTimeDialog:** New component; time input (e.g. `<input type="time" />`), timezone label IST, validate HH:MM, call `updateBackupScheduleTime`.
- **backupService:** Add `updateBackupScheduleTime(value: string)`, `validateBackupScheduleTime(value: string)`, and include `backup_schedule_time_ist` in `BackupConfig` and `getBackupConfig`.

### 10.3 QA / UAT

- Edit folder path: valid path saves and next backup uses it; invalid path shows error and does not save.
- Edit backup time: valid time saves; invalid time shows error; confirm time is stored and (if runner exists) next run at that time triggers backup.
- Only Manager/Admin can see and use Edit.
- Success toast and dialog close on save; error toast and dialog stay open on failure.
- Existing backup files unchanged after path/time change.

---

## 11. User Stories (Summary)

1. **As** a Manager, **I want** to edit the database backup folder path in Google Drive **so that** new backups go to the correct folder.  
   **Acceptance:** Edit modal, validation, save, immediate effect for next backup.

2. **As** a Manager, **I want** to set the daily backup execution time (IST) **so that** backups run at a convenient time.  
   **Acceptance:** Edit modal, time picker, IST displayed, validation, save, new time used on next scheduler run.

3. **As** a Manager, **I want** to see clear errors when validation or save fails **so that** I can correct and retry.  
   **Acceptance:** Inline/toast errors; dialog remains open on save failure.

---

**End of specification.**
