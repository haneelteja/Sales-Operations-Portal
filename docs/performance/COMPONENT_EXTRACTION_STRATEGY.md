# Component Extraction Strategy - SalesEntry

**Date:** January 27, 2026  
**Status:** Planning Phase  
**Component:** SalesEntry.tsx (2,670 lines → Target: ~300 lines)

---

## Analysis

### Current Structure
SalesEntry.tsx contains:
1. **Forms** (~400 lines)
   - Sale form (single SKU + multiple SKUs)
   - Payment form
   - Form validation logic

2. **Table** (~600 lines)
   - Transactions table
   - Column filters
   - Sorting
   - Pagination

3. **Filters** (~200 lines)
   - Search bar
   - Filter controls
   - Export buttons

4. **State Management** (~200 lines)
   - Multiple useState calls (now using hooks)
   - Form state
   - Filter state (now using hook)

5. **Business Logic** (~500 lines)
   - Mutations
   - Queries
   - Helper functions
   - Calculations

6. **UI Rendering** (~770 lines)
   - JSX for forms
   - JSX for tables
   - Conditional rendering

---

## Extraction Strategy

### Phase 1: Extract Forms (Current Focus) ✅
**Component:** `SalesEntryForm.tsx`
- **Size:** ~400 lines
- **Complexity:** High (many dependencies)
- **Dependencies:**
  - saleForm state
  - paymentForm state
  - salesItems state
  - currentItem state
  - isSingleSKUMode state
  - singleSKUData state
  - All form handlers
  - All helper functions
  - Mutations

**Approach:**
- Extract entire TabsContent sections
- Pass all required props
- Maintain all existing functionality

---

### Phase 2: Extract Table
**Component:** `SalesEntryTable.tsx`
- **Size:** ~600 lines
- **Complexity:** Medium
- **Dependencies:**
  - Transactions data
  - Filter state (from hook)
  - Sort state (from hook)
  - Pagination state (from hook)
  - Edit/delete handlers

**Approach:**
- Extract table rendering
- Extract column filters
- Extract pagination
- Pass data and handlers as props

---

### Phase 3: Extract Filters
**Component:** `SalesEntryFilters.tsx`
- **Size:** ~200 lines
- **Complexity:** Low
- **Dependencies:**
  - Filter state (from hook)
  - Export functions

**Approach:**
- Extract search bar
- Extract filter controls
- Extract export buttons
- Pass handlers as props

---

## Risk Assessment

### High Risk Areas
1. **Form State Management**
   - Risk: State loss or incorrect updates
   - Mitigation: Keep state in parent, pass as props

2. **Helper Functions**
   - Risk: Missing dependencies
   - Mitigation: Extract helpers to separate file or pass as props

3. **Mutations**
   - Risk: Breaking mutation logic
   - Mitigation: Keep mutations in parent, pass handlers

### Medium Risk Areas
1. **Conditional Rendering**
   - Risk: Breaking UI logic
   - Mitigation: Test all scenarios

2. **Auto-population Logic**
   - Risk: Breaking auto-fill features
   - Mitigation: Test thoroughly

---

## Implementation Plan

### Step 1: Extract SalesEntryForm ✅ (In Progress)
1. Create component file
2. Move form JSX
3. Define props interface
4. Pass all required props
5. Test functionality

### Step 2: Extract SalesEntryTable
1. Create component file
2. Move table JSX
3. Define props interface
4. Pass data and handlers
5. Test functionality

### Step 3: Extract SalesEntryFilters
1. Create component file
2. Move filter JSX
3. Define props interface
4. Pass handlers
5. Test functionality

### Step 4: Refactor Main Component
1. Simplify state management
2. Improve component composition
3. Reduce to ~300 lines
4. Test all functionality

---

## Success Criteria

- [ ] All forms work correctly
- [ ] All filters work correctly
- [ ] All tables render correctly
- [ ] Edit/delete operations work
- [ ] Export functionality works
- [ ] No console errors
- [ ] No linter errors
- [ ] Code is maintainable
- [ ] Components are reusable

---

**Status:** Planning Complete - Ready for Implementation
