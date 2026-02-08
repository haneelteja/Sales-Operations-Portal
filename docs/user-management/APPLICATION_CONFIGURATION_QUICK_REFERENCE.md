# Application Configuration Tab - Quick Reference Guide

**For:** Developers, QA Testers, Business Analysts  
**Version:** 2.0  
**Last Updated:** January 27, 2026

---

## 🎯 Quick Overview

A new **Application Configuration** tab under User Management that allows Manager-role users to manage application-level invoice-related settings. This is **separate** from the existing Configurations tab (which handles SKU management).

---

## 📋 Key Requirements Summary

### Access Control
- **Who:** Manager and Admin roles only
- **Where:** User Management → Application Configuration Tab
- **What:** View and edit application-level invoice configurations

### Important Distinction
- **Existing Configurations Tab:** SKU management (customers, factory pricing) - **UNCHANGED**
- **New Application Configuration Tab:** Invoice settings (folder paths, auto-generation) - **NEW**

### Configurations (2 total)

| # | Configuration | Action | Default Value |
|---|--------------|--------|---------------|
| 1 | Invoice folder path in Google Drive | Edit Button | `MyDrive/Invoice` |
| 2 | Enable Auto Invoice Generation | Toggle Switch | `true` (enabled) |

---

## 🎨 UI Components

### Tab Location
```
User Management
├── Users Tab (existing)
└── Application Configuration Tab (new)
```

### Table Structure
```
┌──────┬──────────────────────────────┬──────────────┐
│ S.NO │ Description                  │ Action       │
├──────┼──────────────────────────────┼──────────────┤
│  1   │ Invoice folder path...       │ [Edit]       │
│  2   │ Enable Auto Invoice...       │ [Toggle]     │
└──────┴──────────────────────────────┴──────────────┘
```

### Edit Dialog (Folder Path)
- **Trigger:** Click "Edit" button
- **Fields:** Folder Path (text input)
- **Validation:** Google Drive format, max 255 chars
- **Buttons:** Cancel, Save
- **Default:** `MyDrive/Invoice`

### Toggle Switch (Auto Generation)
- **States:** ON (enabled) / OFF (disabled)
- **Behavior:** Immediate save on toggle
- **Impact:** Controls automatic invoice generation on sale transactions

---

## 🔧 Technical Details

### Database Table
```sql
invoice_configurations
├── id (UUID, PK)
├── config_key (VARCHAR, UNIQUE)
├── config_value (TEXT)
├── config_type (VARCHAR: 'string'|'boolean'|'number')
├── description (TEXT)
├── updated_by (UUID, FK to auth.users)
├── updated_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

### Initial Data
```sql
INSERT INTO invoice_configurations VALUES
  ('invoice_folder_path', 'MyDrive/Invoice', 'string', '...'),
  ('auto_invoice_generation_enabled', 'true', 'boolean', '...');
```

### API Endpoints
- `GET /rest/v1/invoice_configurations` - Fetch all
- `PATCH /rest/v1/invoice_configurations?id=eq.{id}` - Update one

### Service Functions
```typescript
getInvoiceConfigurations(): Promise<InvoiceConfiguration[]>
updateInvoiceConfiguration(id: string, config_value: string): Promise<InvoiceConfiguration>
getInvoiceFolderPath(): Promise<string>
isAutoInvoiceEnabled(): Promise<boolean>
```

---

## ✅ Acceptance Criteria Checklist

### Functional
- [ ] Application Configuration tab visible to Manager/Admin only
- [ ] Tab located under User Management (separate from main Configurations tab)
- [ ] Table shows exactly 3 columns (S.NO, Description, Action)
- [ ] Two configurations displayed correctly
- [ ] Edit dialog opens with current value
- [ ] Folder path validation works
- [ ] Toggle switch saves immediately
- [ ] Search filters configurations
- [ ] Pagination works correctly
- [ ] Changes take effect immediately
- [ ] Existing Configurations tab (SKU management) remains unaffected

### Non-Functional
- [ ] Role-based access enforced
- [ ] Loading states shown during operations
- [ ] Success/error toasts displayed
- [ ] Responsive design (mobile-friendly)
- [ ] No console errors

---

## 🧪 Test Scenarios

### Scenario 1: Manager Views Application Configuration
1. Login as Manager
2. Navigate to User Management
3. Click Application Configuration tab
4. **Expected:** Table shows 2 configurations

### Scenario 2: Manager Edits Folder Path
1. Click "Edit" for folder path
2. Change path to "MyDrive/Invoices/2026"
3. Click "Save"
4. **Expected:** Dialog closes, toast shows success, table updates

### Scenario 3: Manager Toggles Auto Generation
1. Toggle "Enable Auto Invoice Generation" to OFF
2. **Expected:** Switch moves to OFF position, toast shows "disabled"
3. Record a sale transaction
4. **Expected:** Invoice NOT auto-generated
5. Toggle back to ON
6. Record another sale
7. **Expected:** Invoice auto-generated

### Scenario 4: Client Cannot Access
1. Login as Client role
2. Navigate to User Management
3. **Expected:** Application Configuration tab NOT visible

### Scenario 5: Existing Configurations Tab Unaffected
1. Login as Manager
2. Navigate to main Configurations tab (not User Management)
3. **Expected:** SKU-related configurations visible
4. **Expected:** NO invoice-related configurations visible

### Scenario 6: Invalid Folder Path
1. Click "Edit" for folder path
2. Enter invalid path: "C:\Invoice"
3. Click "Save"
4. **Expected:** Validation error shown, dialog stays open

---

## 🚀 Implementation Steps

### Phase 1: Database Setup
1. Create `invoice_configurations` table
2. Insert default configurations
3. Set up RLS policies
4. Test database operations

### Phase 2: Backend/Service Layer
1. Create `invoiceConfigService.ts`
2. Implement CRUD functions
3. Add validation logic
4. Write unit tests

### Phase 3: UI Components
1. Add Application Configuration tab to UserManagement
2. Create ApplicationConfigurationTab component
3. Create ConfigurationsTable component
4. Create EditFolderPathDialog component
5. Create AutoInvoiceToggle component
6. Add search and pagination

### Phase 4: Integration
1. Integrate with SalesEntry component (check auto-generation config)
2. Update Google Drive adapter (use folder path config)
3. Test immediate effect
4. End-to-end testing

### Phase 5: QA & Deployment
1. QA testing
2. Bug fixes
3. User acceptance testing
4. Deploy to production

---

## 📝 Notes for Developers

### Key Files to Create/Modify

**New Files:**
- `src/components/user-management/ApplicationConfigurationTab.tsx`
- `src/components/user-management/ConfigurationsTable.tsx`
- `src/components/user-management/EditFolderPathDialog.tsx`
- `src/services/invoiceConfigService.ts`
- `supabase/migrations/YYYYMMDD_create_invoice_configurations.sql`

**Modify Files:**
- `src/components/user-management/UserManagement.tsx` (add tab)
- `src/components/sales/SalesEntry.tsx` (check auto-generation config)
- `src/services/cloudStorage/googleDriveAdapter.ts` (use folder path config)

### Important Considerations

1. **Separation:** Application Configuration tab is separate from existing Configurations tab
2. **No Caching:** Configuration values should be read fresh (or very short TTL)
3. **Immediate Effect:** Changes must apply without app restart
4. **Validation:** Folder path must follow Google Drive format
5. **Access Control:** Enforce Manager role at component and database level

---

## 🐛 Common Issues & Solutions

### Issue: Changes not taking effect immediately
**Solution:** Ensure configuration service reads from database, not cache

### Issue: Client can see Application Configuration tab
**Solution:** Check role-based access control in UserManagement component

### Issue: Invalid folder path saves successfully
**Solution:** Add client-side and server-side validation

### Issue: Toggle switch doesn't update
**Solution:** Check React Query mutation and optimistic update logic

### Issue: Existing Configurations tab affected
**Solution:** Verify no shared state or components between tabs

---

## 📞 Support & Questions

For questions or clarifications, refer to:
- Full Specification: `docs/user-management/APPLICATION_CONFIGURATION_SPECIFICATION.md`
- Rollback Verification: `docs/user-management/ROLLBACK_VERIFICATION.md`
- Technical Lead: [Contact Info]
- Product Owner: [Contact Info]

---

**Last Updated:** January 27, 2026
