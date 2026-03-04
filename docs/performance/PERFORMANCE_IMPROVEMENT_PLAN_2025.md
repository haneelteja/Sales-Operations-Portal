# Performance Architecture & Improvement Plan
## Aamodha Operations Portal

**Date:** March 2025  
**Architecture:** React 18 + TypeScript + Vite (Frontend) | Supabase/PostgreSQL (Backend)  
**Note:** This app uses Supabase (PostgreSQL), not SQL Server. Redis is installed but not used (browser-only app).

---

## Executive Summary

| Category | Current State | Target |
|----------|---------------|--------|
| **Initial Load** | ~800KB–1MB | < 200KB |
| **DB Queries** | N+1 patterns in Transport | 40–60% reduction |
| **Re-renders** | Large components, inline handlers | 30–50% reduction |
| **Cache** | React Query only; CacheService unused | Add server-side Redis via Edge Functions |
| **Lazy Loading** | OrderManagement not lazy | All routes lazy |

---

## 1. Code Quality Improvements

### 1.1 React Component Optimization

#### P1: Fix Deprecated `cacheTime` → `gcTime` (TanStack Query v5)

**Impact:** Prevents deprecation warnings; aligns with v5 API  
**Effort:** Low (5 min)

**Locations:**
- `src/components/sales/SalesEntry.tsx` (lines 345, 939)
- `src/hooks/useDatabase.ts` (line 48)

```typescript
// ❌ Before (deprecated)
cacheTime: 600000,

// ✅ After
gcTime: 600000,
```

---

#### P2: Lazy Load OrderManagement

**Impact:** 50–70% faster initial load; smaller main bundle  
**Effort:** Low (2 min)

**File:** `src/pages/Index.tsx`

```typescript
// ❌ Before - OrderManagement loads with main bundle
import OrderManagement from "@/components/order-management/OrderManagement";

// ✅ After
const OrderManagement = lazy(() => import("@/components/order-management/OrderManagement"));
```

---

#### P3: Split Large Components

**Impact:** 40–50% fewer re-renders; better maintainability  
**Effort:** High

| Component | Lines | Suggested Split |
|-----------|-------|-----------------|
| `SalesEntry.tsx` | ~2900 | `SalesEntryForm`, `SalesTransactionsTable`, `PaymentForm`, `EditTransactionDialog` |
| `ConfigurationManagement.tsx` | ~1800 | `DealerManagement`, `FactoryPricing`, `SkuConfig`, `TransportConfig` |
| `FactoryPayables.tsx` | ~1050 | `ProductionForm`, `PaymentForm`, `FactoryTransactionsTable` |

**Pattern:**

```typescript
// src/components/sales/SalesEntryForm.tsx
export const SalesEntryForm = memo(({ form, onFormChange, onSubmit, customers }: Props) => {
  // Form logic only
});

// src/components/sales/SalesEntry.tsx
const SalesEntry = () => {
  const [form, setForm] = useState(...);
  return (
    <>
      <SalesEntryForm form={form} onFormChange={setForm} ... />
      <SalesTransactionsTable ... />
    </>
  );
};
```

---

#### P4: Memoize AuthContext Value

**Impact:** Reduces re-renders of all auth consumers  
**Effort:** Low

**File:** `src/contexts/AuthContext.tsx`

Ensure the context value is memoized and stable:

```typescript
const value = useMemo(() => ({
  user, session, profile, loading,
  signIn, signOut, signUp, resetPassword, updatePassword,
  requiresPasswordReset, clearPasswordResetRequirement,
}), [user, session, profile, loading, /* ... */]);
```

---

#### P5: Fix EmbeddedOrderManagement QueryClient

**Impact:** Shared cache; avoids duplicate fetches  
**Effort:** Medium

`EmbeddedOrderManagement` creates its own `QueryClient`. Use the app’s `QueryClient` via `useQueryClient()` or pass it as a prop.

---

### 1.2 Anti-Patterns & Memory Leaks

| Issue | Location | Fix |
|-------|----------|-----|
| Inline function in `map` | Various table `onClick` handlers | `useCallback` |
| Missing cleanup in `useEffect` | ResetPassword retry loop | Clear timeouts on unmount |
| Large object in dependency array | `useMemo`/`useEffect` deps | Use primitive keys or `useRef` |

---

### 1.3 Backend / Edge Functions

**Async best practices:**
- Edge Functions use `serve()`; ensure `await` on all async calls.
- Add try/catch and structured error responses.
- Use `AbortController` for long-running operations.

---

## 2. Database (PostgreSQL / Supabase)

### 2.1 Query Optimization

#### P1: N+1 in TransportExpenses

**Impact:** 40–60% fewer queries  
**Effort:** Medium

**File:** `src/components/transport/TransportExpenses.tsx`

**Current:** Per-expense query for `sales_transactions` (N+1).

**Fix:** Batch via RPC or single query with join:

```sql
-- Create RPC: get_latest_sales_by_client_area
CREATE OR REPLACE FUNCTION get_latest_sales_by_client_area(pairs JSONB)
RETURNS TABLE (customer_id UUID, area TEXT, sku TEXT, quantity INTEGER)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (st.customer_id, COALESCE(st.area, st.branch))
    st.customer_id, COALESCE(st.area, st.branch), st.sku, st.quantity
  FROM sales_transactions st
  WHERE st.transaction_type = 'sale'
    AND (st.customer_id, COALESCE(st.area, st.branch)) IN (
      SELECT (p->>'customer_id')::UUID, p->>'area'
      FROM jsonb_array_elements(pairs) p
    )
  ORDER BY st.customer_id, COALESCE(st.area, st.branch), st.transaction_date DESC;
END;
$$;
```

```typescript
// In TransportExpenses - batch fetch
const pairs = expenseData
  .filter(e => e.client_id && e.area)
  .map(e => ({ customer_id: e.client_id, area: e.area }));
const { data: sales } = await supabase.rpc('get_latest_sales_by_client_area', { pairs });
```

---

#### P2: Parameterized Queries

Supabase client uses parameterized queries by default. Avoid raw SQL with string concatenation.

---

#### P2: Indexes (Already Present)

Indexes exist for:
- `sales_transactions`: customer_id, transaction_type, transaction_date, created_at, sku
- `factory_payables`: transaction_type, transaction_date, sku, customer_id
- `transport_expenses`: expense_date, client_id
- `orders`: status, tentative_delivery_date, client, created_at

**Recommendation:** Add composite index if `get_customer_receivables` is slow:

```sql
CREATE INDEX IF NOT EXISTS idx_sales_transactions_receivables 
  ON sales_transactions(customer_id, transaction_type, transaction_date DESC);
```

---

#### P3: Pagination

**Impact:** Lower data transfer and memory  
**Effort:** Medium

For large tables (e.g. `sales_transactions`), use `range()`:

```typescript
const { data } = await supabase
  .from('sales_transactions')
  .select('*')
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('created_at', { ascending: false });
```

---

### 2.2 Connection Pooling

Supabase manages pooling. For high concurrency, consider:
- Supabase connection pooler (transaction vs session mode)
- Read replicas for heavy read workloads (if available)

---

## 3. Cache Management

### 3.1 Current State

| Layer | Implementation | Status |
|-------|----------------|--------|
| React Query | In-memory | ✅ Active |
| Redis (ioredis) | Installed | ❌ Not used (browser app) |
| CacheService | `src/lib/cache.ts` | ❌ Not imported |
| localStorage | `redis.ts` → BrowserCache | Fallback only |

### 3.2 Recommendations

#### Option A: Server-Side Redis via Supabase Edge Functions

**Use for:**
- Session data
- Config (SKU, pricing)
- Dashboard metrics (short TTL)

**Pattern:** Edge Function reads from Redis; invalidates on write.

```typescript
// Edge Function: get-cached-metrics
const cached = await redis.get('dashboard:metrics');
if (cached) return new Response(cached);
const data = await fetchFromDb();
await redis.setex('dashboard:metrics', 300, JSON.stringify(data));
return new Response(JSON.stringify(data));
```

#### Option B: React Query as Primary Cache

**Current:** Already configured in `query-configs.ts`.

**Improvements:**
- Add `production-records` to `getQueryConfig` if missing.
- Use `staleTime` and `gcTime` per data type.
- Add `persistQueryClient` for offline support (optional).

### 3.3 Cache Invalidation

**Current:** `useCacheInvalidation` maps tables → query keys.

**Recommendation:** Ensure all mutation paths call `invalidateRelated()`:

```typescript
// After any mutation
invalidateRelated('sales_transactions');
invalidateRelated('factory_payables');
```

### 3.4 TTL Guidelines

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Customers | 10 min | Rarely changes |
| SKU config | 30 min | Very stable |
| Transactions | 30 s | Frequent updates |
| Orders | 1 min | Moderate |
| Dashboard metrics | 1 min | Near real-time |

---

## 4. Application Performance

### 4.1 Profiling

**React:**
- React DevTools Profiler
- `useEffect` with `console.time` for render cycles

**Build:**
```bash
npm run build
npm run analyze:bundle
```

### 4.2 Code Splitting

**Current:** Manual chunks in `vite.config.ts`:
- ui-vendor, supabase-vendor, form-vendor, utils-vendor, charts-vendor

**Recommendation:** Add `xlsx` and `recharts` to separate chunks:

```typescript
// vite.config.ts
manualChunks: {
  // ... existing
  'xlsx-vendor': ['xlsx'],
  'charts-vendor': ['recharts'],
}
```

### 4.3 API Pagination

**Recommendation:** Add `limit` and `offset` to all list endpoints; use infinite scroll or virtualized lists for large tables.

### 4.4 Monitoring

| Tool | Purpose |
|------|---------|
| Web Vitals | LCP, FID, CLS |
| Sentry | Error tracking |
| Vercel Analytics | Real User Monitoring |
| React Query DevTools | Cache inspection |

---

## 5. Prioritized Improvement List

| # | Improvement | Impact | Effort | Priority |
|---|-------------|--------|--------|----------|
| 1 | Fix cacheTime → gcTime | Low | 5 min | P0 |
| 2 | Lazy load OrderManagement | High | 2 min | P0 |
| 3 | Fix N+1 in TransportExpenses | High | 2–4 hrs | P0 |
| 4 | Add QueryClient defaults in App | Medium | 15 min | P1 |
| 5 | Split SalesEntry | High | 1–2 days | P1 |
| 6 | Memoize AuthContext value | Medium | 15 min | P1 |
| 7 | Add pagination to large tables | Medium | 4–8 hrs | P1 |
| 8 | Integrate CacheService or Redis Edge Function | Medium | 1–2 days | P2 |
| 9 | Split ConfigurationManagement | Medium | 1 day | P2 |
| 10 | Add React Query DevTools (dev only) | Low | 5 min | P2 |

---

## 6. Sample Code Snippets

### 6.1 QueryClient Defaults

```typescript
// src/App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 6.2 Debounced Search

```typescript
// Already exists: useDebouncedValue
const debouncedSearch = useDebouncedValue(searchTerm, 300);
const filtered = useMemo(() => 
  data.filter(d => d.name.includes(debouncedSearch)),
  [data, debouncedSearch]
);
```

### 6.3 Virtualized List (for large tables)

```typescript
// Consider @tanstack/react-virtual for 1000+ rows
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 7. Tooling Recommendations

| Tool | Purpose |
|------|---------|
| **Lighthouse** | Performance audits |
| **Bundle Analyzer** | `rollup-plugin-visualizer` |
| **React DevTools Profiler** | Render profiling |
| **TanStack Query DevTools** | Cache debugging |
| **Sentry** | Error tracking |
| **Vercel Speed Insights** | Web Vitals |

---

## 8. Expected KPIs

| Metric | Current | Target |
|--------|---------|--------|
| **LCP** | ~3–4s | < 2.5s |
| **FID** | < 100ms | < 100ms |
| **CLS** | < 0.1 | < 0.1 |
| **Initial JS** | ~800KB | < 200KB |
| **DB queries / page load** | 10–20 | 3–5 |
| **Time to Interactive** | ~4s | < 2s |

---

## 9. Quick Wins (Do First)

1. Replace `cacheTime` with `gcTime` in `SalesEntry.tsx` and `useDatabase.ts`.
2. Lazy load `OrderManagement` in `Index.tsx`.
3. Configure `QueryClient` defaults in `App.tsx`.
4. Add `@tanstack/react-query-devtools` in development.

---

**Document Version:** 1.0  
**Last Updated:** March 2025
