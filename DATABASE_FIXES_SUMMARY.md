# Database Fixes Summary

## Issues Fixed

### 1. Missing RPC Function: `get_orders_sorted`
**Problem**: The application was calling `get_orders_sorted()` RPC function which didn't exist in the database, causing 404 errors.

**Solution**: Created migration file `supabase/migrations/20250117000000_create_get_orders_sorted_function.sql`

**Action Required**: Run this migration on your Supabase database.

### 2. Orders Table Column Mismatches
**Problem**: Code was using `order_date` and `client_name` columns that don't exist in the orders table. The actual schema uses `client` (not `client_name`) and doesn't have `order_date`.

**Fixed Files**:
- `src/components/order-management/OrderManagement.tsx`
  - Changed `order_date` → removed (using `created_at` for date display)
  - Changed `client_name` → `client`
  - Updated all queries, inserts, updates, and UI displays

### 3. Factory Pricing Query Syntax Errors
**Problem**: Queries using `.order("sku")` without proper syntax were causing 400 errors.

**Fixed Files**:
- `src/components/configurations/ConfigurationManagement.tsx` - Fixed 2 queries
- `src/components/factory/FactoryPayables.tsx` - Fixed 1 query
- `src/components/sales/SalesEntry.tsx` - Fixed 1 query

**Change**: `.order("sku")` → `.order("sku", { ascending: true })`

### 4. Factory Pricing Column Name Inconsistencies
**Problem**: Code was mixing `price_per_case` and `cost_per_case` for factory_pricing table. The correct column is `cost_per_case` (which is a generated column).

**Fixed Files**:
- `src/components/sales/SalesEntry.tsx` - Changed 3 instances from `price_per_case` to `cost_per_case` for factory_pricing queries

**Note**: `price_per_case` is still used correctly for the `customers` table - only factory_pricing needed the fix.

## Database Migration Required

You need to run the following migration on your Supabase database:

**File**: `supabase/migrations/20250117000000_create_get_orders_sorted_function.sql`

This creates the `get_orders_sorted()` RPC function that returns orders sorted by:
1. Status (pending first, then dispatched)
2. Tentative delivery date (most recent first)

### To Apply the Migration:

1. **If using Supabase CLI locally**:
   ```bash
   supabase db push
   ```

2. **If using Supabase Dashboard**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/migrations/20250117000000_create_get_orders_sorted_function.sql`
   - Run the SQL in the editor

3. **If using remote Supabase**:
   - Connect to your database and run the migration SQL directly

## Verification

After applying the migration, verify:

1. The function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_orders_sorted';
   ```

2. Test the function:
   ```sql
   SELECT * FROM get_orders_sorted();
   ```

## Additional Notes

- All code changes have been made to match the current database schema
- The `factory_pricing` table uses `cost_per_case` (generated column) - this is correct
- The `orders` table uses `client` (not `client_name`) and doesn't have `order_date` - this is correct
- All `.order()` calls now use proper syntax: `.order("column", { ascending: true/false })`

## Testing Recommendations

After applying the migration, test:
1. Order Management page - should load orders without errors
2. Factory Pricing queries - should work without 400 errors
3. Sales Entry - should fetch factory pricing correctly
4. Configuration Management - should load factory pricing data



