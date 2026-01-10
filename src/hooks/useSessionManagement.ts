import { useEffect, useRef, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

  // Calculate time until session expires
  const getTimeUntilExpiry = useCallback((currentSession: Session | null): number => {
    if (!currentSession?.expires_at) return 0;
    const expiresAt = currentSession.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    return Math.max(0, Math.floor((expiresAt - now) / 1000)); // Return seconds
  }, []);

  // Check session status and show warnings
  const checkSessionStatus = useCallback(async () => {
    if (!session) {
      setWarning({ show: false, timeRemaining: 0, message: '' });
      return;
    }

    const timeRemaining = getTimeUntilExpiry(session);

    if (timeRemaining === 0) {
      // Session expired
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
  }, [session, warningThreshold, criticalThreshold, getTimeUntilExpiry, onSessionExpiring, onSessionExpired]);

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
  }, [session, isRefreshing, refreshInterval, getTimeUntilExpiry, onSessionExpired]);

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
      return;
    }

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
  }, [session, checkInterval, refreshInterval, enableKeepAlive, checkSessionStatus, refreshSession]);

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

