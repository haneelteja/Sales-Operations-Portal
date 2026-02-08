# Factory Payables Update Fix - Root Cause Analysis & Solution

**Date:** January 27, 2026  
**Status:** ✅ Fixed

---

## Root Cause Analysis

### Problem Statement
When updating a Client Transaction, the corresponding Factory Payable record was not being updated, even though Transport Transactions were updating correctly.

### Root Cause

**Description Mismatch Issue:**

1. **During Creation:**
   - Factory payables are created with `description: customerData?.client_name` (e.g., "Aaha")
   - This is stored directly as the client name

2. **During Update:**
   - The update logic was trying to match using: `Production for ${originalDescription}`
   - If the original sales transaction description was "Sale of 10 cases", it would look for "Production for Sale of 10 cases"
   - This pattern **never matches** because factory payables use the client name, not "Production for..." format

3. **Result:**
   - The WHERE clause fails to find any matching records
   - Update silently fails (only logs a warning)
   - Factory Payable table remains unchanged

### Why Transport Updates Worked

Transport transactions use a different matching strategy:
- Match by `expense_group = "Client Sale Transport"`
- Match by `client_id` (original)
- Match by `expense_date` (original)

This is more reliable because it uses structured fields rather than free-form description text.

---

## Solution

### Improved Matching Strategy

Instead of relying on description matching (which is unreliable), use **structured identifiers**:

1. **`customer_id`** - Links factory payable to the customer
2. **`transaction_date`** - Matches the date of the transaction
3. **`sku`** - Matches the SKU being produced
4. **`transaction_type = 'production'`** - Ensures we're updating production records

### Implementation

**Before (Broken):**
```typescript
.eq("description", `Production for ${originalDescription}`)
.eq("transaction_date", originalTransactionDate);
```

**After (Fixed):**
```typescript
.eq("customer_id", originalCustomerId)
.eq("transaction_date", originalTransactionDate)
.eq("sku", editingTransaction?.sku || '')
.eq("transaction_type", "production");
```

### Additional Improvements

1. **Better Error Handling:**
   - Changed `console.warn` to `console.error` for visibility
   - Added detailed logging of update attempt parameters
   - Added success logging for verification

2. **Description Update:**
   - Update factory payable description to match new customer name if customer changed
   - Ensures consistency even if customer is updated

3. **Null Safety:**
   - Added check for `originalCustomerId` before attempting update
   - Added fallback for `sku` matching

---

## Code Changes

### File: `src/components/sales/SalesEntry.tsx`

**Lines 1614-1645:** Updated factory payables update logic

**Key Changes:**
- Use `customer_id`, `transaction_date`, `sku`, and `transaction_type` for matching
- Update `customer_id` if it changed
- Update `description` to new customer name
- Improved error logging

---

## Verification Checklist

### Test Scenarios

1. **Update Transaction Date:**
   - [ ] Edit a sale transaction and change the date
   - [ ] Verify Factory Payable `transaction_date` updates
   - [ ] Verify Transport Expense `expense_date` updates

2. **Update Customer:**
   - [ ] Edit a sale transaction and change the customer
   - [ ] Verify Factory Payable `customer_id` and `description` update
   - [ ] Verify Transport Expense `client_id` and `client_name` update

3. **Update SKU:**
   - [ ] Edit a sale transaction and change the SKU
   - [ ] Verify Factory Payable `sku` updates
   - [ ] Verify Factory Payable `amount` recalculates based on new SKU pricing

4. **Update Quantity:**
   - [ ] Edit a sale transaction and change the quantity
   - [ ] Verify Factory Payable `quantity` updates
   - [ ] Verify Factory Payable `amount` recalculates (quantity × cost_per_case)

5. **Update Description:**
   - [ ] Edit a sale transaction and change the description
   - [ ] Verify Factory Payable `description` updates to new customer name
   - [ ] Verify Transport Expense `description` updates

6. **Multiple Transactions Same Day:**
   - [ ] Create multiple sales for same customer/date/SKU
   - [ ] Edit one transaction
   - [ ] Verify only the correct Factory Payable updates (not all)

### Database Verification Queries

```sql
-- Verify Factory Payable was updated after editing a sale
SELECT 
  st.id as sales_id,
  st.transaction_date as sales_date,
  st.sku as sales_sku,
  st.description as sales_description,
  fp.id as factory_id,
  fp.transaction_date as factory_date,
  fp.sku as factory_sku,
  fp.description as factory_description,
  fp.customer_id as factory_customer_id,
  c.client_name
FROM sales_transactions st
LEFT JOIN factory_payables fp 
  ON fp.customer_id = st.customer_id
  AND fp.transaction_date = st.transaction_date
  AND fp.sku = st.sku
  AND fp.transaction_type = 'production'
LEFT JOIN customers c ON c.id = st.customer_id
WHERE st.id = '<SALES_TRANSACTION_ID>';

-- Check for orphaned factory payables (no matching sales)
SELECT fp.*
FROM factory_payables fp
LEFT JOIN sales_transactions st
  ON fp.customer_id = st.customer_id
  AND fp.transaction_date = st.transaction_date
  AND fp.sku = st.sku
  AND st.transaction_type = 'sale'
WHERE fp.transaction_type = 'production'
  AND st.id IS NULL;
```

---

## Data Consistency Strategy

### Single Source of Truth
- **Sales Transactions** table is the primary source
- Factory Payables and Transport Expenses are **derived** from sales

### Update Flow
1. Update Sales Transaction first
2. Use original values to find related Factory Payable
3. Update Factory Payable with new values
4. Use original values to find related Transport Expense
5. Update Transport Expense with new values
6. Invalidate all related queries to refresh UI

### Atomicity
- All updates happen in sequence within the same mutation
- If any update fails, the error is logged but doesn't rollback previous updates
- Consider implementing database transactions for true atomicity if needed

---

## Best Practices Applied

1. **Structured Matching:** Use foreign keys and structured fields instead of free-form text
2. **Comprehensive Logging:** Log both success and failure cases for debugging
3. **Null Safety:** Check for required values before attempting updates
4. **Error Visibility:** Use `console.error` instead of `console.warn` for critical failures
5. **Data Consistency:** Update all related tables when primary record changes

---

## Future Improvements

1. **Database Triggers:** Consider using database triggers to automatically maintain consistency
2. **Transaction Wrapper:** Wrap all updates in a database transaction for true atomicity
3. **Audit Trail:** Log all updates to an audit table for tracking changes
4. **Validation:** Add validation to ensure factory payables exist before attempting update
5. **Retry Logic:** Implement retry logic for transient failures

---

**Implementation Complete** ✅
