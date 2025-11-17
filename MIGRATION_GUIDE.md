# Migration Guide - Performance Improvements

This guide will help you apply the performance improvements to your application.

## Step 1: Install Dependencies ✅

Redis dependencies have been installed:
```bash
npm install ioredis @types/ioredis
```

## Step 2: Run Database Migrations

### Option A: Using Supabase CLI (Local Development)

1. **Start Supabase locally** (if not already running):
   ```bash
   supabase start
   ```

2. **Apply migrations**:
   ```bash
   # Apply all pending migrations
   supabase migration up
   
   # Or apply specific migrations
   supabase db push
   ```

3. **Verify migrations**:
   ```bash
   # Check migration status
   supabase migration list
   ```

### Option B: Using Supabase Dashboard (Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration files in order:
   - `supabase/migrations/20250120000000_performance_indexes.sql`
   - `supabase/migrations/20250120000001_receivables_function.sql`

4. **Verify indexes were created**:
   ```sql
   SELECT 
     schemaname,
     tablename,
     indexname
   FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY tablename, indexname;
   ```

5. **Test the functions**:
   ```sql
   -- Test receivables function
   SELECT * FROM get_customer_receivables() LIMIT 5;
   
   -- Test dashboard metrics function
   SELECT * FROM get_dashboard_metrics();
   
   -- Test orders sorting function
   SELECT * FROM get_orders_sorted() LIMIT 5;
   ```

## Step 3: Set Up Redis

### For Development (Browser Cache - Already Implemented)

The current implementation uses **localStorage** as a browser-safe cache. This works immediately without any setup.

**Benefits:**
- ✅ Works immediately
- ✅ No server setup required
- ✅ Good for development

**Limitations:**
- ⚠️ Limited to ~5-10MB storage
- ⚠️ Cache is per-browser/device
- ⚠️ Not shared across users

### For Production (Redis Backend)

To use actual Redis in production, you need a backend API:

#### Option 1: Supabase Edge Functions

1. **Create a new Edge Function** for cache operations:
   ```typescript
   // supabase/functions/cache/index.ts
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
   import Redis from "https://deno.land/x/redis@v0.29.0/mod.ts"

   const redis = await Redis.connect({
     hostname: Deno.env.get("REDIS_HOST")!,
     port: parseInt(Deno.env.get("REDIS_PORT") || "6379"),
     password: Deno.env.get("REDIS_PASSWORD"),
   })

   serve(async (req) => {
     const { method, key, value, ttl } = await req.json()
     
     if (method === 'GET') {
       const cached = await redis.get(key)
       return new Response(JSON.stringify({ data: cached ? JSON.parse(cached) : null }))
     }
     
     if (method === 'SET') {
       await redis.setex(key, ttl, JSON.stringify(value))
       return new Response(JSON.stringify({ success: true }))
     }
     
     // ... other methods
   })
   ```

2. **Update cache.ts** to call the Edge Function:
   ```typescript
   import { supabase } from '@/integrations/supabase/client';
   
   static async get<T>(key: string): Promise<T | null> {
     const { data } = await supabase.functions.invoke('cache', {
       body: { method: 'GET', key }
     });
     return data?.data || null;
   }
   ```

#### Option 2: Node.js Backend API

1. **Create a simple Express server**:
   ```typescript
   // server/index.ts
   import express from 'express';
   import Redis from 'ioredis';
   
   const app = express();
   const redis = new Redis({
     host: process.env.REDIS_HOST,
     port: parseInt(process.env.REDIS_PORT || '6379'),
     password: process.env.REDIS_PASSWORD,
   });
   
   app.post('/api/cache', async (req, res) => {
     const { method, key, value, ttl } = req.body;
     
     if (method === 'GET') {
       const data = await redis.get(key);
       return res.json({ data: data ? JSON.parse(data) : null });
     }
     
     if (method === 'SET') {
       await redis.setex(key, ttl, JSON.stringify(value));
       return res.json({ success: true });
     }
     
     // ... other methods
   });
   ```

2. **Update cache.ts** to call your API:
   ```typescript
   static async get<T>(key: string): Promise<T | null> {
     const response = await fetch('/api/cache', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ method: 'GET', key })
     });
     const { data } = await response.json();
     return data as T | null;
   }
   ```

## Step 4: Update Environment Variables

Create a `.env` file in the project root:

```env
# For browser cache (current implementation)
# No variables needed - uses localStorage

# For Redis backend (when implemented)
# VITE_REDIS_API_URL=http://localhost:3000/api/cache
# Or for Supabase Edge Functions:
# VITE_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
```

## Step 5: Use Optimized Hooks

Replace existing hooks with optimized versions:

### Before:
```typescript
import { useCustomers } from '@/hooks/useDatabase';
```

### After:
```typescript
import { useCustomersOptimized } from '@/hooks/useDatabaseOptimized';
```

### Components to Update:

1. **Dashboard.tsx**:
   ```typescript
   // Replace
   const { data: receivables } = useQuery({...});
   
   // With
   import { useReceivablesOptimized } from '@/hooks/useDatabaseOptimized';
   const { data: receivables } = useReceivablesOptimized();
   ```

2. **SalesEntry.tsx**:
   ```typescript
   // Replace
   const { data: customers } = useQuery({...});
   
   // With
   import { useCustomersOptimized } from '@/hooks/useDatabaseOptimized';
   const { data: customers } = useCustomersOptimized();
   ```

3. **OrderManagement.tsx**:
   ```typescript
   // Use optimized orders query
   import { useOrdersOptimized } from '@/hooks/useDatabaseOptimized';
   ```

## Step 6: Verify Improvements

### Check Database Performance

1. **Before indexes**: Run a slow query
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM sales_transactions 
   WHERE customer_id = 'some-uuid'
   ORDER BY created_at DESC;
   ```

2. **After indexes**: Run the same query and compare execution time
   - Should see 50-80% reduction in query time

### Check Cache Performance

1. **Open browser DevTools** → Network tab
2. **Load a page** (e.g., Dashboard)
3. **Reload the page** - should see fewer API calls
4. **Check localStorage**:
   ```javascript
   // In browser console
   Object.keys(localStorage).filter(k => k.startsWith('cache:'))
   ```

### Monitor Performance

1. **Use React DevTools Profiler**:
   - Record a session
   - Check component render times
   - Should see improvements after memoization

2. **Use Lighthouse**:
   ```bash
   npm run build
   npm run preview
   # Run Lighthouse audit
   ```

## Troubleshooting

### Migration Errors

**Error**: `relation already exists`
- **Solution**: The index/function already exists. This is safe to ignore.

**Error**: `permission denied`
- **Solution**: Check RLS policies. You may need to run migrations as a superuser.

### Cache Not Working

**Issue**: Cache always returns null
- **Check**: Browser localStorage quota
- **Check**: Cache keys are being set correctly
- **Solution**: Clear localStorage and try again

### Performance Not Improved

**Check**:
1. Are indexes actually created? (run verification query)
2. Are optimized hooks being used?
3. Is cache being hit? (check localStorage)
4. Are components memoized?

## Next Steps

1. ✅ Database indexes applied
2. ✅ Browser cache working
3. ⏭️ Set up Redis backend (for production)
4. ⏭️ Update all components to use optimized hooks
5. ⏭️ Add performance monitoring
6. ⏭️ Set up CI/CD for performance testing

## Expected Results

After completing all steps:

- **Database queries**: 50-80% faster
- **Page load time**: 30-50% faster
- **API calls**: 60-80% reduction (with caching)
- **User experience**: Significantly improved

## Support

For issues or questions:
1. Check `PERFORMANCE_IMPROVEMENT_PLAN.md` for detailed explanations
2. Review `REDIS_SETUP_GUIDE.md` for Redis-specific help
3. Check migration files for SQL syntax

