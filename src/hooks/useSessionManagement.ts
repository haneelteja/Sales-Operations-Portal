import { useEffect, useRef, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Expected session duration configuration
 * 
 * This should match Supabase JWT expiry settings:
 * - Supabase Dashboard → Authentication → Settings → JWT Settings
 * - JWT expiry should be set to 3600 seconds (60 minutes)
 * 
 * The application will log warnings if actual session duration doesn't match this value.
 */
export const EXPECTED_SESSION_DURATION_SECONDS = 3600; // 60 minutes
export const EXPECTED_SESSION_DURATION_MINUTES = 60;

interface SessionWarning {
  show: boolean;
  timeRemaining: number; // seconds
  message: string;
}

interface UseSessionManagementOptions {
  /** Interval in milliseconds to check session status (default: 60000 = 1 minute) */
  checkInterval?: number;
  /** Time in seconds before expiration to show warning (default: 300 = 5 minutes) */
  warningThreshold?: number;
  /** Time in seconds before expiration to show critical warning (default: 60 = 1 minute) */
  criticalThreshold?: number;
  /** Interval in milliseconds to refresh token (default: 300000 = 5 minutes) */
  refreshInterval?: number;
  /** Enable keep-alive by refreshing session periodically */
  enableKeepAlive?: boolean;
  /** Callback when session is about to expire */
  onSessionExpiring?: (timeRemaining: number) => void;
  /** Callback when session expires */
  onSessionExpired?: () => void;
}

export const useSessionManagement = (
  session: Session | null,
  options: UseSessionManagementOptions = {}
) => {
  const {
    checkInterval = 60000, // 1 minute
    warningThreshold = 300, // 5 minutes
    criticalThreshold = 60, // 1 minute
    refreshInterval = 300000, // 5 minutes
    enableKeepAlive = true,
    onSessionExpiring,
    onSessionExpired,
  } = options;

  const [warning, setWarning] = useState<SessionWarning>({
    show: false,
    timeRemaining: 0,
    message: '',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());
  const sessionLoggedRef = useRef<string | null>(null); // Track which session we've logged

  // Calculate time until session expires
  const getTimeUntilExpiry = useCallback((currentSession: Session | null): number => {
    if (!currentSession?.expires_at) return 0;
    const expiresAt = currentSession.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000)); // Return seconds
    
    // Calculate total session duration for verification (only once per session)
    if (currentSession.issued_at && currentSession.expires_at) {
      const sessionId = `${currentSession.issued_at}-${currentSession.expires_at}`;
      
      // Log session duration verification only once per unique session
      if (sessionLoggedRef.current !== sessionId) {
        const issuedAt = currentSession.issued_at * 1000;
        const totalDuration = Math.floor((expiresAt - issuedAt) / 1000);
        const expectedDuration = EXPECTED_SESSION_DURATION_SECONDS;
        const durationDifference = Math.abs(totalDuration - expectedDuration);
        const isCorrect = durationDifference <= 60; // Allow 1 minute tolerance
        
        logger.info('🔐 Session Duration Verification', {
          totalDurationSeconds: totalDuration,
          totalDurationMinutes: Math.floor(totalDuration / 60),
          expectedDurationSeconds: expectedDuration,
          expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
          differenceSeconds: durationDifference,
          isCorrect: isCorrect,
          expiresAt: new Date(expiresAt).toISOString(),
          issuedAt: new Date(issuedAt).toISOString(),
          timeRemainingSeconds: timeRemaining,
          timeRemainingMinutes: Math.floor(timeRemaining / 60),
        });
        
        if (!isCorrect) {
          logger.warn('⚠️ Session duration does not match expected 60 minutes', {
            actualDurationMinutes: Math.floor(totalDuration / 60),
            expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
            differenceMinutes: Math.floor(durationDifference / 60),
            note: 'Check Supabase JWT expiry settings (should be 3600 seconds)',
          });
        } else {
          console.log('✅ Session duration verified: 60 minutes configured correctly');
        }
        
        sessionLoggedRef.current = sessionId;
      }
    }
    
    return timeRemaining;
  }, []);

  // Check session status and show warnings
  const checkSessionStatus = useCallback(async () => {
    if (!session) {
      setWarning({ show: false, timeRemaining: 0, message: '' });
      return;
    }

    const timeRemaining = getTimeUntilExpiry(session);

    if (timeRemaining === 0) {
      // Session expired - log actual session duration
      if (session.issued_at && session.expires_at) {
        const issuedAt = session.issued_at * 1000;
        const expiresAt = session.expires_at * 1000;
        const actualDuration = Math.floor((expiresAt - issuedAt) / 1000);
        logger.info('⏰ Session Expired', {
          actualDurationSeconds: actualDuration,
          actualDurationMinutes: Math.floor(actualDuration / 60),
          expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
          issuedAt: new Date(issuedAt).toISOString(),
          expiredAt: new Date(expiresAt).toISOString(),
        });
      }
      
      setWarning({
        show: true,
        timeRemaining: 0,
        message: 'Your session has expired. Please sign in again.',
      });
      onSessionExpired?.();
      return;
    }

    if (timeRemaining <= criticalThreshold) {
      // Critical warning
      setWarning({
        show: true,
        timeRemaining,
        message: `Your session will expire in ${Math.ceil(timeRemaining / 60)} minute(s). Please save your work and refresh your session.`,
      });
      onSessionExpiring?.(timeRemaining);
    } else if (timeRemaining <= warningThreshold) {
      // Warning
      setWarning({
        show: true,
        timeRemaining,
        message: `Your session will expire in ${Math.ceil(timeRemaining / 60)} minute(s).`,
      });
      onSessionExpiring?.(timeRemaining);
    } else {
      // No warning needed
      setWarning({ show: false, timeRemaining, message: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, warningThreshold, criticalThreshold]);

  // Refresh session token (keep-alive)
  const refreshSession = useCallback(async () => {
    if (!session || isRefreshing) return false;

    const timeRemaining = getTimeUntilExpiry(session);
    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;

    // Only refresh if:
    // 1. Session is still valid
    // 2. Haven't refreshed recently (avoid too frequent refreshes)
    // 3. Session is within refresh window (refresh when less than 15 minutes remaining to be proactive)
    if (timeRemaining > 0 && timeSinceLastRefresh >= refreshInterval && timeRemaining < 900) {
      setIsRefreshing(true);
      try {
        logger.info('Refreshing session token (keep-alive)...');
        const { data, error } = await supabase.auth.refreshSession(session);

        if (error) {
          logger.error('Error refreshing session:', error);
          // If refresh fails, check if session is expired
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setWarning({
              show: true,
              timeRemaining: 0,
              message: 'Your session has expired. Please sign in again.',
            });
            onSessionExpired?.();
            return false;
          }
          return false;
        } else if (data?.session) {
          logger.info('Session refreshed successfully');
          lastRefreshRef.current = Date.now();
          // Clear warning if session was successfully refreshed
          setWarning(prev => {
            if (prev.show && prev.timeRemaining > 0) {
              return { show: false, timeRemaining: getTimeUntilExpiry(data.session), message: '' };
            }
            return prev;
          });
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Exception refreshing session:', error);
        return false;
      } finally {
        setIsRefreshing(false);
      }
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isRefreshing, refreshInterval]);

  // Set up interval to check session status
  useEffect(() => {
    if (!session) {
      // Clear intervals if no session
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      setWarning({ show: false, timeRemaining: 0, message: '' });
      // Reset logging flag when session ends
      sessionLoggedRef.current = null;
      return;
    }

    // Log session start with duration info (getTimeUntilExpiry will also log duration verification)
    const timeRemaining = getTimeUntilExpiry(session);
    logger.info('🔐 Session Management Initialized', {
      timeRemainingSeconds: timeRemaining,
      timeRemainingMinutes: Math.floor(timeRemaining / 60),
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
      expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
    });

    // Initial check
    checkSessionStatus();

    // Set up periodic check
    checkIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, checkInterval);

    // Set up periodic refresh (keep-alive)
    if (enableKeepAlive) {
      refreshIntervalRef.current = setInterval(() => {
        refreshSession();
      }, refreshInterval);
    }

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, checkInterval, refreshInterval, enableKeepAlive, getTimeUntilExpiry]);

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (!session) return false;
    // Force refresh by temporarily resetting lastRefreshRef
    lastRefreshRef.current = 0;
    return await refreshSession();
  }, [session, refreshSession]);

  // Dismiss warning
  const dismissWarning = useCallback(() => {
    setWarning(prev => ({ ...prev, show: false }));
  }, []);

  return {
    warning,
    isRefreshing,
    timeRemaining: getTimeUntilExpiry(session),
    refreshSession: manualRefresh,
    dismissWarning,
  };
};

