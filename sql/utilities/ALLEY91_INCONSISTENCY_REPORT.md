# Alley 91 Transaction Inconsistency Analysis

**Date:** January 27, 2026  
**Customer:** Alley 91  
**Branch:** Nanakram

---

## Identified Inconsistencies

Based on the image analysis, here are the inconsistencies found:

### 1. **Missing Customer Outstanding Value** (Critical)
**Location:** Transaction dated `7/1/2025`  
**Issue:** The "Customer Outstanding (₹)" column is blank for this transaction  
**Impact:** 
- Cannot track cumulative balance accurately
- Breaks chronological outstanding calculation
- Affects financial reporting accuracy

**Details:**
- Date: `7/1/2025`
- Type: Nanakram sale
- SKU: 500 P
- Quantity: 46 cases
- Amount: ₹9,200
- **Outstanding: BLANK** ❌

---

### 2. **Non-Chronological Date Ordering** (High Priority)
**Issue:** Transactions are not sorted chronologically in the display  
**Impact:**
- Makes it difficult to track outstanding balance progression
- Can lead to incorrect cumulative calculations if sorted incorrectly
- Confusing for users trying to understand payment history

**Examples:**
- `1/9/2026` appears before `10/10/2025`
- `12/23/2025` appears before `12/4/2025`
- `7/1/2025` appears after later dates

**Root Cause:** 
- Transactions may be sorted by `created_at` instead of `transaction_date`
- Multiple transactions on the same date may be in wrong order

---

### 3. **Potential Data Quality Issues**

#### Missing Required Fields
- Some transactions may have missing SKU (for sales)
- Some transactions may have missing quantity (for sales)
- Some transactions may have missing amounts

#### Amount Validation
- All amounts should be positive (transaction_type indicates direction)
- Negative amounts would indicate data entry error

#### Transaction Type Validation
- All transactions should have `transaction_type` = 'sale' or 'payment'
- Invalid types would break calculations

---

## SQL Queries to Run

### Step 1: Validation Query
Run `VALIDATE_ALLEY91_TRANSACTIONS.sql` to identify all inconsistencies.

This will show:
- All transactions in chronological order
- Calculated outstanding balance for each transaction
- List of all inconsistencies found
- Summary statistics

### Step 2: Review Results
Carefully review the validation results before running fixes.

### Step 3: Fix Query (After Review)
Run `FIX_ALLEY91_TRANSACTIONS.sql` to automatically fix common issues.

**⚠️ WARNING:** Some fixes may require manual review:
- Missing amounts may need to be set manually
- Missing SKUs may need to be verified
- Date corrections may need verification

---

## Expected Outcome After Fixes

1. **All transactions have valid amounts** (> 0)
2. **All transactions have valid dates**
3. **All sales have SKU and quantity**
4. **All transactions are in chronological order**
5. **Customer outstanding is calculated correctly** for each transaction

---

## Manual Review Required

After running the fix script, manually review:

1. **Transaction on 7/1/2025:**
   - Verify amount is correct (₹9,200)
   - Verify SKU is correct (500 P)
   - Verify quantity is correct (46 cases)
   - Calculate what the outstanding should be based on previous transactions

2. **Date Ordering:**
   - Verify all transactions are in correct chronological order
   - Check that `created_at` is used as tiebreaker for same-date transactions

3. **Outstanding Balance:**
   - Verify the calculated outstanding matches expected values
   - Check for any anomalies in the progression

---

## How to Run in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `VALIDATE_ALLEY91_TRANSACTIONS.sql`
3. Run the query
4. Review all result sets
5. If fixes are needed, copy and paste `FIX_ALLEY91_TRANSACTIONS.sql`
6. Review the verification results
7. Run the final chronological view query to confirm

---

## Notes

- The outstanding balance is calculated as: `Sum of Sales - Sum of Payments` chronologically
- Negative outstanding values indicate customer has overpaid (credit balance)
- All amounts should be positive; transaction_type indicates whether it's a sale (+) or payment (-)
