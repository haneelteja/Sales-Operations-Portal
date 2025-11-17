# Database Schema Verification Report

## Supabase Configuration Updated
- **New URL**: https://qkvmdrtfhpcvwvqjuyuu.supabase.co
- **New Anon Key**: Updated in `src/integrations/supabase/client.ts`

## Tables Found in Code vs Types

### ✅ Tables Present in Types (`types.ts`)
1. **adjustments** - ✅ Complete
2. **customers** - ✅ Complete
3. **factory_payables** - ✅ Complete (includes `quantity`, `customer_id`, `sku`)
4. **factory_pricing** - ✅ Complete
5. **label_design_costs** - ✅ Complete
6. **label_purchases** - ✅ Complete
7. **label_vendors** - ✅ Complete
8. **profiles** - ✅ Complete
9. **sales_transactions** - ✅ Complete (includes `total_amount`, `branch`)
10. **sku_configurations** - ✅ Complete
11. **transport_expenses** - ⚠️ Potentially Missing Columns (see below)

### ❌ Tables Missing from Types
1. **label_payments** - ❌ Used in code but NOT in types.ts
   - Used in: `src/components/labels/LabelPayments.tsx`
   - Expected columns (from migrations):
     - id (UUID)
     - vendor_id (TEXT) - Note: Migration shows vendor TEXT, but code uses vendor_id
     - payment_amount (DECIMAL)
     - payment_method (TEXT)
     - payment_date (DATE/TIMESTAMP)
     - description (TEXT, nullable)
     - created_at (TIMESTAMP)
     - updated_at (TIMESTAMP)

### ⚠️ Schema Mismatches Found

#### 1. transport_expenses Table
**Expected columns (based on code usage):**
- id ✅
- amount ✅
- description ✅
- expense_date ✅
- expense_group ✅
- client_id ✅ (nullable)
- branch ⚠️ (nullable) - Present in types.ts
- created_at ✅
- updated_at ✅
- **client_name** ❌ - Used in code but NOT in types.ts

**Code references to `client_name`:**
- `src/components/sales/SalesEntry.tsx:1200` - Sets `client_name` in insert
- Code expects: `client_name: selectedCustomer?.client_name || 'N/A'`

#### 2. label_payments Table Schema
**Expected schema (from migrations):**
```sql
CREATE TABLE label_payments (
  id UUID PRIMARY KEY,
  vendor_id TEXT NOT NULL,  -- or vendor TEXT?
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Note:** Migration shows `vendor TEXT` but code uses `vendor_id TEXT`

## Action Items

### 1. Add Missing `label_payments` Table to types.ts
The table is used but not defined in the types file.

### 2. Add Missing `client_name` Column to transport_expenses
The code tries to insert/use `client_name` but it's not in the types.

### 3. Verify Database Schema Matches Code Expectations
Run these queries on your Supabase project to verify:

```sql
-- Check transport_expenses columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transport_expenses' 
ORDER BY ordinal_position;

-- Check if label_payments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'label_payments';

-- Check label_payments columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'label_payments' 
ORDER BY ordinal_position;
```

### 4. Update types.ts File
Once you verify the actual schema in Supabase, update the `types.ts` file to match.

## Next Steps

1. ✅ **COMPLETED**: Updated Supabase URL and anon key
2. **TODO**: Verify actual database schema in new Supabase project
3. **TODO**: Update types.ts with correct schema for:
   - `label_payments` table (if it exists)
   - `client_name` column in `transport_expenses` (if it exists)
4. **TODO**: Create missing tables/columns if they don't exist
5. **TODO**: Test application connectivity to new Supabase project

