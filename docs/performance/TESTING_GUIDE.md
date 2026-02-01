# Performance Improvements - Testing Guide

**Date:** January 27, 2026  
**Testing Scope:** Week 1 + Week 2 (Tasks 1-2)  
**Status:** Ready for Testing

---

## 🎯 Testing Objectives

Verify that all performance improvements work correctly without breaking existing functionality.

---

## 📋 Pre-Testing Checklist

- [ ] Application builds successfully (`npm run build` or `npm run dev`)
- [ ] No console errors on initial load
- [ ] All routes accessible
- [ ] Authentication works

---

## 🧪 Test Scenarios

### 1. Dashboard Module Tests

#### 1.1 Dashboard Metrics Loading
- [ ] Navigate to Dashboard
- [ ] Verify metrics cards load (Total Clients, Outstanding, etc.)
- [ ] Check Network tab - should see optimized queries
- [ ] Verify no duplicate requests for same data
- [ ] Check React Query DevTools - cache should be populated

**Expected:**
- Metrics load within 1-2 seconds
- Cache hit rate improves on subsequent visits
- No unnecessary refetches

#### 1.2 Receivables Table
- [ ] Verify receivables table loads
- [ ] Test filtering by client/branch
- [ ] Test sorting by columns
- [ ] Test pagination
- [ ] Verify export functionality

**Expected:**
- Table loads correctly
- Filters/sorts work
- Pagination works
- Export works

---

### 2. SalesEntry Module Tests

#### 2.1 Filter State Hook ✅
- [ ] Navigate to Client Transactions
- [ ] Test search functionality
- [ ] Test column filters (customer, branch, SKU, date, type, amount)
- [ ] Test sorting by columns
- [ ] Test pagination (next/previous, page numbers)
- [ ] Test "Clear All Filters" button
- [ ] Verify page resets automatically when filters change

**Expected:**
- All filters work correctly
- Sorting works correctly
- Pagination works correctly
- Page resets to 1 when filters/search change
- No console errors

#### 2.2 EditTransactionDialog ✅
- [ ] Click edit button on any transaction
- [ ] Verify dialog opens
- [ ] Verify form fields populate correctly
- [ ] Test customer change (should reset branch/SKU)
- [ ] Test branch change (should auto-populate price per case)
- [ ] Modify transaction data
- [ ] Click "Update" button
- [ ] Verify dialog closes automatically
- [ ] Verify transaction updates in table
- [ ] Verify Factory Payables table updates
- [ ] Verify Transport Expenses table updates

**Expected:**
- Dialog opens/closes correctly
- Form fields populate
- Auto-population works
- Update succeeds
- Related tables update
- No console errors

#### 2.3 Sale Form
- [ ] Navigate to "Record Sale" tab
- [ ] Select customer (verify unique list)
- [ ] Select branch (verify auto-population if single branch)
- [ ] Verify SKU dropdown appears
- [ ] Test single SKU mode (if only one SKU available)
- [ ] Test multiple SKUs mode (if multiple SKUs available)
- [ ] Add items to sale (multiple SKUs mode)
- [ ] Edit item from sales list
- [ ] Remove item from sales list
- [ ] Submit sale
- [ ] Verify form resets after submission
- [ ] Verify transaction appears in table

**Expected:**
- All form fields work
- Auto-population works
- Single/multiple SKU modes work
- Add/edit/remove items works
- Submission succeeds
- Form resets
- Transaction appears

#### 2.4 Payment Form
- [ ] Navigate to "Record Customer Payment" tab
- [ ] Select customer
- [ ] Select branch
- [ ] Enter amount
- [ ] Enter date
- [ ] Enter description
- [ ] Submit payment
- [ ] Verify form resets
- [ ] Verify payment appears in table

**Expected:**
- Form works correctly
- Submission succeeds
- Form resets
- Payment appears

#### 2.5 Transactions Table
- [ ] Verify transactions load in reverse chronological order
- [ ] Test all column filters
- [ ] Test all column sorts
- [ ] Test pagination
- [ ] Test export to Excel
- [ ] Verify delete functionality

**Expected:**
- Table loads correctly
- Filters/sorts work
- Pagination works
- Export works
- Delete works

---

### 3. OrderManagement Module Tests

#### 3.1 Query Configs
- [ ] Navigate to Order Management
- [ ] Verify orders load
- [ ] Check Network tab - should see optimized queries
- [ ] Verify cache works (navigate away and back)

**Expected:**
- Orders load correctly
- Cache improves performance
- No unnecessary refetches

#### 3.2 Cache Invalidation
- [ ] Create new order
- [ ] Verify order appears in "Current Orders" table immediately
- [ ] Dispatch order
- [ ] Verify order moves to "Orders Dispatched" table
- [ ] Delete order
- [ ] Verify order removed from table

**Expected:**
- Mutations succeed
- UI updates immediately
- Related queries refresh
- No stale data

#### 3.3 Order Form
- [ ] Fill order form
- [ ] Test date validation (no future dates)
- [ ] Test client selection (unique list)
- [ ] Test branch auto-population
- [ ] Test SKU auto-population
- [ ] Submit order
- [ ] Verify form resets

**Expected:**
- Form works correctly
- Validations work
- Auto-population works
- Submission succeeds

---

### 4. FactoryPayables Module Tests

#### 4.1 Query Configs
- [ ] Navigate to Factory Payables
- [ ] Verify transactions load
- [ ] Check Network tab - optimized queries
- [ ] Verify cache works

**Expected:**
- Data loads correctly
- Cache improves performance

#### 4.2 Cache Invalidation
- [ ] Record production
- [ ] Verify appears in table immediately
- [ ] Record payment
- [ ] Verify appears in table
- [ ] Edit transaction
- [ ] Verify updates
- [ ] Delete transaction
- [ ] Verify removed

**Expected:**
- Mutations succeed
- UI updates immediately
- Cache invalidation works

---

### 5. TransportExpenses Module Tests

#### 5.1 Cache Invalidation
- [ ] Record expense
- [ ] Verify appears in table immediately
- [ ] Edit expense
- [ ] Verify updates
- [ ] Delete expense
- [ ] Verify removed

**Expected:**
- Mutations succeed
- UI updates immediately
- Cache invalidation works

---

### 6. ConfigurationManagement Module Tests

#### 6.1 Cache Invalidation
- [ ] Add customer pricing
- [ ] Verify appears in table immediately
- [ ] Edit customer pricing
- [ ] Verify updates
- [ ] Delete customer pricing
- [ ] Verify removed
- [ ] Test factory pricing CRUD
- [ ] Test SKU configuration CRUD

**Expected:**
- All CRUD operations work
- UI updates immediately
- Cache invalidation works

---

### 7. Reports Module Tests

#### 7.1 Query Configs
- [ ] Navigate to Reports
- [ ] Test all report tabs (Factory, Client, Transport, Labels)
- [ ] Verify reports load correctly
- [ ] Check Network tab - optimized queries
- [ ] Verify cache works (reports cache longer)

**Expected:**
- Reports load correctly
- Cache improves performance
- No unnecessary refetches

---

## 🔍 Performance Testing

### Network Requests
1. Open Browser DevTools → Network tab
2. Navigate through modules
3. Check for:
   - [ ] Reduced duplicate requests
   - [ ] Cache hits (304 responses)
   - [ ] Smaller payload sizes (check Response sizes)
   - [ ] Fewer total requests

**Expected:**
- 30-50% reduction in unnecessary requests
- More cache hits
- Smaller payloads

### Cache Hit Rate
1. Install React Query DevTools (if not already installed)
2. Navigate through modules
3. Check cache:
   - [ ] Queries are cached
   - [ ] Cache hit rate improves
   - [ ] Stale time settings are respected

**Expected:**
- Cache hit rate: 30% → 50%+
- Queries respect stale time
- Cache invalidation works

### Render Performance
1. Open React DevTools → Profiler
2. Record interactions:
   - Filter changes
   - Sort changes
   - Form submissions
   - Navigation
3. Check for:
   - [ ] Reduced re-renders
   - [ ] Faster render times
   - [ ] No unnecessary renders

**Expected:**
- 5-10% reduction in re-renders
- Faster render times
- Better performance

---

## 🐛 Error Checking

### Console Errors
- [ ] No `ReferenceError` errors
- [ ] No `TypeError` errors
- [ ] No React warnings (uncontrolled/controlled components)
- [ ] No React Query errors
- [ ] No Supabase errors

### Linter Errors
- [ ] Run `npm run lint` (if available)
- [ ] Check for TypeScript errors
- [ ] Check for ESLint warnings

---

## 📊 Performance Metrics to Record

### Before Testing
- Initial load time: _____ seconds
- Average query time: _____ ms
- Cache hit rate: _____ %
- Bundle size: _____ KB

### After Testing
- Initial load time: _____ seconds
- Average query time: _____ ms
- Cache hit rate: _____ %
- Bundle size: _____ KB

### Expected Improvements
- Load time: 10-20% faster
- Query time: 30-50% faster (cached queries)
- Cache hit rate: 30% → 50%+
- Bundle size: Similar (no bundle changes yet)

---

## ✅ Test Results Checklist

### Functional Tests
- [ ] Dashboard works correctly
- [ ] SalesEntry works correctly
- [ ] OrderManagement works correctly
- [ ] FactoryPayables works correctly
- [ ] TransportExpenses works correctly
- [ ] ConfigurationManagement works correctly
- [ ] Reports work correctly

### Performance Tests
- [ ] Network requests reduced
- [ ] Cache hit rate improved
- [ ] Render performance improved
- [ ] No performance regressions

### Error Tests
- [ ] No console errors
- [ ] No linter errors
- [ ] No runtime errors
- [ ] No broken functionality

---

## 🚨 Issues Found

If you find any issues, document them here:

### Issue 1
- **Module:** ___________
- **Description:** ___________
- **Steps to Reproduce:** ___________
- **Expected:** ___________
- **Actual:** ___________

### Issue 2
- **Module:** ___________
- **Description:** ___________
- **Steps to Reproduce:** ___________
- **Expected:** ___________
- **Actual:** ___________

---

## 📝 Test Results Summary

### Overall Status
- [ ] ✅ All tests passed
- [ ] ⚠️ Some issues found (document above)
- [ ] ❌ Critical issues found

### Performance Improvements Verified
- [ ] Query optimization working
- [ ] Cache invalidation working
- [ ] Filter state hook working
- [ ] EditTransactionDialog working

### Next Steps
- [ ] Fix any issues found
- [ ] Continue with remaining Week 2 tasks
- [ ] Proceed to Week 3
- [ ] Document test results

---

**Status:** Ready for Testing  
**Estimated Time:** 30-60 minutes  
**Priority:** High (verify no regressions before continuing)
