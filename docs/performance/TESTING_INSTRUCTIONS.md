# Performance Improvements - Testing Instructions

**Date:** January 27, 2026  
**Testing Scope:** Week 1 + Week 2 (Tasks 1-2)

---

## 🚀 Getting Started

### 1. Start the Application
```bash
npm run dev
# or
npm start
```

### 2. Open Browser DevTools
- **Chrome/Edge:** F12 or Right-click → Inspect
- **Firefox:** F12 or Right-click → Inspect Element
- **Safari:** Cmd+Option+I

### 3. Enable React DevTools (Optional but Recommended)
- Install React DevTools browser extension
- Install React Query DevTools (if available)

---

## 📋 Step-by-Step Testing

### Step 1: Verify Application Loads (2 minutes)

1. Navigate to the application
2. Login (if required)
3. Check browser console for errors
4. Verify dashboard loads

**✅ Pass Criteria:**
- Application loads without errors
- No console errors
- Dashboard displays correctly

---

### Step 2: Test Dashboard Module (3 minutes)

1. Navigate to Dashboard
2. Verify metrics cards load:
   - Total Clients
   - Total Outstanding
   - Profitability Summary
3. Check Receivables table loads
4. Test filtering/sorting (if available)

**✅ Pass Criteria:**
- All metrics display
- Table loads correctly
- No console errors

**🔍 Performance Check:**
- Open Network tab
- Check query response times
- Verify cache is working (check React Query DevTools)

---

### Step 3: Test SalesEntry Module - Filters (5 minutes)

1. Navigate to "Client Transactions" (SalesEntry)
2. **Test Search:**
   - Type in search box
   - Verify results filter
   - Verify page resets to 1
3. **Test Column Filters:**
   - Filter by customer
   - Filter by branch
   - Filter by SKU
   - Filter by date
   - Filter by type
   - Filter by amount
   - Verify page resets to 1 for each filter
4. **Test Sorting:**
   - Sort by date (asc/desc)
   - Sort by customer (asc/desc)
   - Sort by amount (asc/desc)
   - Verify sorting works
5. **Test Pagination:**
   - Click "Next"
   - Click "Previous"
   - Click page numbers
   - Verify pagination works
6. **Test Clear Filters:**
   - Apply multiple filters
   - Click "Clear All Filters"
   - Verify all filters clear
   - Verify page resets to 1

**✅ Pass Criteria:**
- All filters work correctly
- Sorting works correctly
- Pagination works correctly
- Page resets automatically on filter changes
- No console errors

---

### Step 4: Test SalesEntry Module - Edit Dialog (5 minutes)

1. **Open Edit Dialog:**
   - Click edit button (pencil icon) on any transaction
   - Verify dialog opens
   - Verify form fields populate with transaction data

2. **Test Form Fields:**
   - Verify date field has correct value
   - Verify customer dropdown shows correct customer
   - Verify branch dropdown shows correct branch
   - Verify SKU field has correct value
   - Verify quantity field has correct value
   - Verify amount field has correct value
   - Verify description field has correct value

3. **Test Customer Change:**
   - Change customer
   - Verify branch resets
   - Verify SKU resets
   - Verify price per case updates

4. **Test Branch Change:**
   - Select different branch
   - Verify price per case auto-populates

5. **Test Update:**
   - Modify some fields (e.g., amount, description)
   - Click "Update" button
   - Verify dialog closes automatically
   - Verify transaction updates in table
   - Verify Factory Payables table updates (if applicable)
   - Verify Transport Expenses table updates (if applicable)

**✅ Pass Criteria:**
- Dialog opens/closes correctly
- Form fields populate correctly
- Auto-population works
- Update succeeds
- Related tables update
- No console errors

---

### Step 5: Test SalesEntry Module - Forms (10 minutes)

#### 5.1 Sale Form
1. Navigate to "Record Sale" tab
2. **Test Customer Selection:**
   - Click customer dropdown
   - Verify unique customer list (no duplicates)
   - Select a customer
3. **Test Branch Selection:**
   - Verify branch dropdown appears
   - If single branch, verify auto-population
   - If multiple branches, verify dropdown works
   - Select a branch
4. **Test SKU Availability:**
   - If no SKUs: Verify "No SKUs Available" message
   - If single SKU: Verify single SKU mode form appears
   - If multiple SKUs: Verify multiple SKUs mode form appears
5. **Test Single SKU Mode (if applicable):**
   - Verify SKU field is read-only
   - Enter quantity
   - Verify amount auto-calculates
   - Enter description
   - Click "Record Sale"
   - Verify form resets
   - Verify transaction appears in table
6. **Test Multiple SKUs Mode (if applicable):**
   - Select SKU from dropdown
   - Enter quantity
   - Verify amount auto-calculates
   - Enter description
   - Click "+ Add Item"
   - Verify item appears in sales items list
   - Add more items
   - Edit an item from list
   - Remove an item from list
   - Click "Record X Sales"
   - Verify form resets
   - Verify transactions appear in table

**✅ Pass Criteria:**
- All form fields work
- Auto-population works
- Single/multiple SKU modes work
- Add/edit/remove items works
- Submission succeeds
- Form resets
- Transactions appear

#### 5.2 Payment Form
1. Navigate to "Record Customer Payment" tab
2. Select customer
3. Select branch
4. Enter amount
5. Enter date (verify no future dates allowed)
6. Enter description
7. Click "Record Payment"
8. Verify form resets
9. Verify payment appears in table

**✅ Pass Criteria:**
- Form works correctly
- Date validation works
- Submission succeeds
- Form resets
- Payment appears

---

### Step 6: Test Other Modules (10 minutes)

#### 6.1 OrderManagement
1. Navigate to Order Management
2. Create an order
3. Verify appears in "Current Orders" table immediately
4. Dispatch order
5. Verify moves to "Orders Dispatched" table
6. Test filters/sorting
7. Test export

**✅ Pass Criteria:**
- Orders create/dispatch correctly
- UI updates immediately
- Filters/sorts work
- Export works

#### 6.2 FactoryPayables
1. Navigate to Factory Payables
2. Record production
3. Verify appears in table immediately
4. Record payment
5. Verify appears in table
6. Edit transaction
7. Verify updates
8. Delete transaction
9. Verify removed

**✅ Pass Criteria:**
- All CRUD operations work
- UI updates immediately
- Cache invalidation works

#### 6.3 TransportExpenses
1. Navigate to Transport Expenses
2. Record expense
3. Verify appears in table immediately
4. Edit expense
5. Verify updates
6. Delete expense
7. Verify removed

**✅ Pass Criteria:**
- All CRUD operations work
- UI updates immediately

#### 6.4 ConfigurationManagement
1. Navigate to Configuration Management
2. Test Customer Pricing CRUD
3. Test Factory Pricing CRUD
4. Test SKU Configuration CRUD
5. Verify all updates appear immediately

**✅ Pass Criteria:**
- All CRUD operations work
- UI updates immediately

#### 6.5 Reports
1. Navigate to Reports
2. Test all report tabs:
   - Factory Report
   - Client Report
   - Transport Report
   - Labels Report
3. Verify reports load correctly
4. Test filters/exports

**✅ Pass Criteria:**
- Reports load correctly
- Filters/exports work

---

### Step 7: Performance Verification (5 minutes)

1. **Network Tab:**
   - Open DevTools → Network tab
   - Navigate through modules
   - Check for:
     - Fewer duplicate requests
     - Cache hits (304 responses)
     - Smaller payload sizes

2. **React Query DevTools:**
   - Check cache status
   - Verify queries are cached
   - Check cache hit rate

3. **React Profiler (Optional):**
   - Record interactions
   - Check for reduced re-renders
   - Verify performance improvements

**✅ Pass Criteria:**
- Network requests reduced
- Cache hit rate improved
- No performance regressions

---

## 🐛 Common Issues & Solutions

### Issue: Console shows "Select is changing from uncontrolled to controlled"
**Solution:** This should be fixed. If you see it, check:
- Select components have `value={field || ""}` pattern
- No undefined values passed to Select

### Issue: Filter doesn't reset page
**Solution:** This should be fixed. Filter hook automatically resets page.

### Issue: Edit dialog doesn't close after update
**Solution:** This should be fixed. Dialog is now controlled and closes on success.

### Issue: Cache not invalidating
**Solution:** Check that mutations use `invalidateRelated()` hook.

---

## ✅ Final Checklist

### Functional
- [ ] All modules work correctly
- [ ] All forms work correctly
- [ ] All filters work correctly
- [ ] All tables render correctly
- [ ] Edit/delete operations work
- [ ] Export functionality works

### Performance
- [ ] Network requests reduced
- [ ] Cache hit rate improved
- [ ] No performance regressions

### Errors
- [ ] No console errors
- [ ] No linter errors
- [ ] No runtime errors

---

## 📊 Test Results Template

### Test Date: ___________
### Tester: ___________

### Results:
- **Functional Tests:** [ ] Pass [ ] Fail
- **Performance Tests:** [ ] Pass [ ] Fail
- **Error Tests:** [ ] Pass [ ] Fail

### Issues Found:
1. ___________
2. ___________
3. ___________

### Performance Metrics:
- Initial Load Time: _____ seconds
- Cache Hit Rate: _____ %
- Network Requests: _____ (reduced by _____ %)

### Overall Status:
- [ ] ✅ Ready to continue
- [ ] ⚠️ Issues found (fix before continuing)
- [ ] ❌ Critical issues (rollback needed)

---

**Status:** Ready for Testing  
**Estimated Time:** 30-60 minutes  
**Priority:** High
