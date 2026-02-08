# Password Reset Flow Debugging Analysis

**Date:** January 27, 2026  
**Issue:** User redirected to login page instead of password reset screen when clicking reset link from email

---

## Root Cause Analysis

### Problem Flow

1. **Email Link Format:**
   - Reset email contains link: `https://supabase-url/auth/v1/verify?token=XXX&type=recovery&redirect_to=/reset-password`
   - Supabase verifies token and redirects to: `/reset-password#access_token=YYY&refresh_token=ZZZ&type=recovery`

2. **Route Configuration (App.tsx):**
   ```tsx
   <Route path="/reset-password" element={<ResetPassword />} />
   ```
   - Direct route to `ResetPassword` component ✅

3. **ResetPassword Component Logic (Issue Found):**
   - Component checks for tokens in URL hash/query params
   - **Line 85-88:** If no valid tokens found, immediately redirects to `/auth`
   ```tsx
   } else {
     // No valid reset tokens, redirect to login
     navigate('/auth');
   }
   ```

4. **PortalRouter Logic:**
   - Only checks for reset tokens on root route `/`
   - Does NOT handle `/reset-password` route
   - If user lands on `/reset-password` without tokens, `ResetPassword` redirects to `/auth`

### Root Causes Identified

#### **Primary Issue: Race Condition / Timing Problem**

**Problem:** The `ResetPassword` component's `useEffect` runs immediately on mount, but:
- URL hash fragments may not be fully parsed yet
- Supabase redirect might happen asynchronously
- Browser might not have processed the hash fragments when component checks

**Location:** `src/pages/ResetPassword.tsx` lines 30-94

**Evidence:**
```tsx
useEffect(() => {
  const handlePasswordReset = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const type = hashParams.get('type') || queryParams.get('type');

    if (type === 'recovery' && accessToken) {
      // Process reset...
    } else {
      // No valid reset tokens, redirect to login
      navigate('/auth'); // ❌ TOO EARLY - redirects before tokens are available
    }
  };
  handlePasswordReset();
}, [navigate, toast]);
```

#### **Secondary Issue: Missing Token Persistence**

**Problem:** If the component re-renders or the URL changes, tokens are lost and user gets redirected.

**Location:** `src/pages/ResetPassword.tsx` line 67
```tsx
// Clear the URL hash to clean up the URL
window.history.replaceState({}, document.title, window.location.pathname);
```
This clears the hash BEFORE the form is submitted, which could cause issues if component re-renders.

#### **Tertiary Issue: Supabase Auth State Change Interference**

**Problem:** `AuthContext` might be clearing session or redirecting before tokens are processed.

**Location:** `src/contexts/AuthContext.tsx` - Auth state change listener might interfere

---

## Logic Flow Review

### Expected Flow

```
1. User clicks reset link in email
   ↓
2. Supabase verifies token at /auth/v1/verify
   ↓
3. Supabase redirects to: /reset-password#access_token=XXX&type=recovery
   ↓
4. React Router loads ResetPassword component
   ↓
5. ResetPassword reads hash fragments
   ↓
6. ResetPassword calls supabase.auth.setSession() with tokens
   ↓
7. User sees password reset form
   ↓
8. User submits new password
   ↓
9. Redirect to login page
```

### Actual Flow (Broken)

```
1. User clicks reset link in email
   ↓
2. Supabase verifies token at /auth/v1/verify
   ↓
3. Supabase redirects to: /reset-password#access_token=XXX&type=recovery
   ↓
4. React Router loads ResetPassword component
   ↓
5. ResetPassword useEffect runs IMMEDIATELY
   ↓
6. Hash fragments not yet available OR check fails
   ↓
7. Component redirects to /auth (login page) ❌
```

---

## Failure Scenarios

### Scenario 1: Hash Fragments Not Available Yet
**Cause:** Browser hasn't processed hash fragments when component checks  
**Symptom:** `hashParams.get('access_token')` returns `null`  
**Result:** Immediate redirect to `/auth`

### Scenario 2: URL Format Mismatch
**Cause:** Supabase redirects with different URL format than expected  
**Symptom:** Tokens in query params instead of hash, or vice versa  
**Result:** Tokens not found, redirect to `/auth`

### Scenario 3: Token Expired During Check
**Cause:** Token expires between email click and component load  
**Symptom:** `setSession()` fails with expired error  
**Result:** Error shown, then redirect to `/auth` after 5 seconds

### Scenario 4: Auth Context Interference
**Cause:** `AuthContext` auth state listener clears session or redirects  
**Symptom:** User state changes before tokens processed  
**Result:** PortalRouter redirects to `/auth` before ResetPassword can handle tokens

### Scenario 5: Route Guard Issue
**Cause:** PortalRouter checks for reset tokens but only on `/` route  
**Symptom:** `/reset-password` route bypasses PortalRouter logic  
**Result:** ResetPassword component handles routing, but logic fails

---

## Recommended Fixes

### Fix 1: Add Delay/Retry Logic for Token Reading (HIGH PRIORITY)

**Problem:** Component checks for tokens too early  
**Solution:** Add retry logic with small delay to allow hash fragments to be processed

**Code:**
```tsx
useEffect(() => {
  const handlePasswordReset = async () => {
    // Retry logic: Check multiple times for tokens
    let retries = 0;
    const maxRetries = 5;
    const retryDelay = 100; // 100ms between retries
    
    const checkForTokens = (): { accessToken: string | null; type: string | null } => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const type = hashParams.get('type') || queryParams.get('type');
      
      return { accessToken, type };
    };
    
    const processReset = async () => {
      const { accessToken, type } = checkForTokens();
      
      if (type === 'recovery' && accessToken) {
        // Process reset...
        // ... existing logic ...
      } else if (retries < maxRetries) {
        // Retry after delay
        retries++;
        setTimeout(processReset, retryDelay);
      } else {
        // No tokens found after retries, redirect to login
        console.warn('No password reset tokens found in URL after retries');
        navigate('/auth');
      }
    };
    
    processReset();
  };

  handlePasswordReset();
}, [navigate, toast]);
```

### Fix 2: Listen to Hash Change Events (MEDIUM PRIORITY)

**Problem:** Hash fragments might arrive after component mount  
**Solution:** Listen to `hashchange` event to catch tokens when they arrive

**Code:**
```tsx
useEffect(() => {
  const handleHashChange = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (type === 'recovery' && accessToken && !isProcessing) {
      // Process reset tokens
      handlePasswordReset();
    }
  };
  
  // Check immediately
  handleHashChange();
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);
  
  return () => {
    window.removeEventListener('hashchange', handleHashChange);
  };
}, []);
```

### Fix 3: Improve Token Persistence (MEDIUM PRIORITY)

**Problem:** URL hash cleared too early  
**Solution:** Only clear hash AFTER successful password reset, not after session is set

**Code:**
```tsx
// In handleSubmit, after successful password update:
if (!error) {
  // Clear URL hash AFTER password is reset
  window.history.replaceState({}, document.title, window.location.pathname);
  // ... rest of success logic ...
}
```

### Fix 4: Add Better Error Handling (LOW PRIORITY)

**Problem:** Generic error messages don't help debug  
**Solution:** Add detailed logging and user-friendly error messages

**Code:**
```tsx
console.log('ResetPassword: Checking for tokens', {
  hash: window.location.hash,
  search: window.location.search,
  fullUrl: window.location.href
});
```

### Fix 5: Route Through PortalRouter (ALTERNATIVE)

**Problem:** `/reset-password` route bypasses PortalRouter  
**Solution:** Let PortalRouter handle all routes, including `/reset-password`

**Note:** This would require significant routing changes and might not be necessary if Fix 1-3 work.

---

## Implementation Priority

1. **Fix 1: Retry Logic** - Implement immediately (most likely to solve issue)
2. **Fix 2: Hash Change Listener** - Add as backup
3. **Fix 3: Token Persistence** - Improve user experience
4. **Fix 4: Better Logging** - Help with future debugging

---

## Validation Checklist

After implementing fixes, verify:

- [ ] User clicks reset link from email
- [ ] User lands on `/reset-password` page (not `/auth`)
- [ ] Password reset form is displayed
- [ ] No immediate redirect to login page
- [ ] Tokens are successfully read from URL hash
- [ ] Session is set correctly with `setSession()`
- [ ] User can submit new password
- [ ] After password reset, user is redirected to login
- [ ] Expired tokens show appropriate error message
- [ ] Invalid tokens show appropriate error message
- [ ] Missing tokens show appropriate error message (don't redirect immediately)

---

## Testing Scenarios

### Test 1: Valid Reset Link
1. Request password reset
2. Click link in email
3. **Expected:** Land on reset password page
4. **Actual:** (Before fix) Redirected to login ❌

### Test 2: Expired Token
1. Request password reset
2. Wait for token to expire (or use old link)
3. Click link
4. **Expected:** Error message, option to request new link
5. **Actual:** Should work correctly ✅

### Test 3: Direct URL Access
1. Navigate directly to `/reset-password` without tokens
2. **Expected:** Redirect to login with message
3. **Actual:** Should work correctly ✅

### Test 4: Hash Fragment Format
1. Manually construct URL: `/reset-password#access_token=test&type=recovery`
2. **Expected:** Component processes tokens
3. **Actual:** (Before fix) Might redirect too early ❌

---

## Additional Notes

- Supabase password reset links typically use hash fragments (`#`) not query params (`?`)
- The `redirect_to` parameter in the email link determines where Supabase redirects after verification
- Ensure `redirect_to` is set to `/reset-password` in the reset email configuration
- Check Supabase dashboard settings for Site URL and redirect URLs

---

**Document Version:** 1.0  
**Last Updated:** January 27, 2026
