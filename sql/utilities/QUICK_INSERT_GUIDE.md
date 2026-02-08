# Quick Guide: Insert Missing July 1, 2025 Sale

## Current Status
- ❌ July 1, 2025 sale transaction is **MISSING**
- ✅ August 11, 2025 payment of ₹9,200 exists
- ⚠️ Outstanding balance is incorrect: **-₹48,432.85**

## To Insert the Missing Transaction

### Option 1: Using INSERT_MISSING_JULY_SALE.sql

1. Open `INSERT_MISSING_JULY_SALE.sql`
2. Scroll to **Step 3** (around line 48)
3. **Uncomment** the INSERT statement by removing:
   - The opening `/*` 
   - The closing `*/`
4. Run Step 3 in Supabase SQL Editor
5. Run Steps 4-6 to verify

### Option 2: Direct INSERT (Copy & Paste)

```sql
INSERT INTO sales_transactions (
    customer_id,
    transaction_date,
    transaction_type,
    amount,
    total_amount,
    quantity,
    sku,
    description,
    branch,
    created_at,
    updated_at
)
SELECT 
    (SELECT id FROM customers WHERE LOWER(client_name) LIKE '%alley%91%' OR LOWER(client_name) = 'alley 91' LIMIT 1) as customer_id,
    '2025-07-01'::DATE as transaction_date,
    'sale' as transaction_type,
    9200.00 as amount,
    9200.00 as total_amount,
    46 as quantity,
    '500 P' as sku,
    'Sale of 46.00 cases' as description,
    'Nanakram' as branch,
    NOW() as created_at,
    NOW() as updated_at
WHERE NOT EXISTS (
    SELECT 1 FROM sales_transactions st
    INNER JOIN customers c ON st.customer_id = c.id
    WHERE (LOWER(c.client_name) LIKE '%alley%91%' OR LOWER(c.client_name) = 'alley 91')
      AND st.transaction_date = '2025-07-01'
      AND st.transaction_type = 'sale'
      AND st.amount = 9200.00
      AND st.quantity = 46
      AND st.sku = '500 P'
);
```

## Expected Results After Insertion

### Transaction Timeline (First Few)
- **Jul 1, 2025:** Sale ₹9,200 (SKU: 500 P, 46 cases) → **Outstanding: ₹9,200** ✅
- **Aug 11, 2025:** Payment ₹9,200 → **Outstanding: ₹0** ✅
- **Aug 21, 2025:** Sale ₹1,998.50 → **Outstanding: ₹1,998.50**
- ... (continues)

### Final Outstanding
- **Before:** -₹48,432.85
- **After:** -₹39,232.85
- **Change:** +₹9,200 (outstanding increases, becomes less negative)

## Verification

After insertion, run Step 5 again to see:
- ✅ July 1 transaction appears first
- ✅ Outstanding starts at ₹9,200
- ✅ August 11 payment brings it to ₹0
- ✅ Final outstanding is -₹39,232.85

## Safety Features

- ✅ **Duplicate Prevention:** The `WHERE NOT EXISTS` clause prevents inserting duplicates
- ✅ **Safe to Run Multiple Times:** Won't create duplicate transactions
- ✅ **No Data Loss:** Only adds missing transaction, doesn't modify existing ones
