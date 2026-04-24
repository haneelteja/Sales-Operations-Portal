import { useEffect, useRef, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Expected session duration configuration
 *
 * This should match Supabase JWT expiry settings:
 * - Supabase Dashboard -> Authentication -> Settings -> JWT Settings
 * - JWT expiry should be set to 3600 seconds (60 minutes)
 *
 * The application will log warnings if actual session duration doesn't match this value.
 */
export const EXPECTED_SESSION_DURATION_SECONDS = 3600;
export const EXPECTED_SESSION_DURATION_MINUTES = 60;

interface SessionWarning {
  show: boolean;
  timeRemaining: number;
  message: string;
}

interface UseSessionManagementOptions {
  checkInterval?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  refreshInterval?: number;
  enableKeepAlive?: boolean;
  onSessionExpiring?: (timeRemaining: number) => void;
  onSessionExpired?: () => void;
}

export const useSessionManagement = (
  session: Session | null,
  options: UseSessionManagementOptions = {}
) => {
  const {
    checkInterval = 60000,
    warningThreshold = 300,
    criticalThreshold = 60,
    refreshInterval = 300000,
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
  const sessionDurationLoggedRef = useRef<string | null>(null);
  const sessionInitLoggedRef = useRef<string | null>(null);

  const getSessionId = useCallback((currentSession: Session | null) => {
    if (!currentSession) return null;
    return `${currentSession.issued_at ?? 'unknown'}-${currentSession.expires_at ?? 'unknown'}`;
  }, []);

  const getTimeUntilExpiry = useCallback((currentSession: Session | null): number => {
    if (!currentSession?.expires_at) return 0;

    const expiresAt = currentSession.expires_at * 1000;
    const now = Date.now();
    const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

    if (currentSession.issued_at && currentSession.expires_at) {
      const sessionId = getSessionId(currentSession);

      if (sessionDurationLoggedRef.current !== sessionId) {
        const issuedAt = currentSession.issued_at * 1000;
        const totalDuration = Math.floor((expiresAt - issuedAt) / 1000);
        const durationDifference = Math.abs(totalDuration - EXPECTED_SESSION_DURATION_SECONDS);
        const isCorrect = durationDifference <= 60;

        logger.info('Session Duration Verification', {
          totalDurationSeconds: totalDuration,
          totalDurationMinutes: Math.floor(totalDuration / 60),
          expectedDurationSeconds: EXPECTED_SESSION_DURATION_SECONDS,
          expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
          differenceSeconds: durationDifference,
          isCorrect,
          expiresAt: new Date(expiresAt).toISOString(),
          issuedAt: new Date(issuedAt).toISOString(),
          timeRemainingSeconds: timeRemaining,
          timeRemainingMinutes: Math.floor(timeRemaining / 60),
        });

        if (!isCorrect) {
          logger.warn('Session duration does not match expected 60 minutes', {
            actualDurationMinutes: Math.floor(totalDuration / 60),
            expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
            differenceMinutes: Math.floor(durationDifference / 60),
            note: 'Check Supabase JWT expiry settings (should be 3600 seconds)',
          });
        }

        sessionDurationLoggedRef.current = sessionId;
      }
    }

    return timeRemaining;
  }, [getSessionId]);

  const checkSessionStatus = useCallback(async () => {
    if (!session) {
      setWarning({ show: false, timeRemaining: 0, message: '' });
      return;
    }

    const timeRemaining = getTimeUntilExpiry(session);

    if (timeRemaining === 0) {
      if (session.issued_at && session.expires_at) {
        const issuedAt = session.issued_at * 1000;
        const expiresAt = session.expires_at * 1000;
        const actualDuration = Math.floor((expiresAt - issuedAt) / 1000);

        logger.info('Session Expired', {
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
      setWarning({
        show: true,
        timeRemaining,
        message: `Your session will expire in ${Math.ceil(timeRemaining / 60)} minute(s). Please save your work and refresh your session.`,
      });
      onSessionExpiring?.(timeRemaining);
    } else if (timeRemaining <= warningThreshold) {
      setWarning({
        show: true,
        timeRemaining,
        message: `Your session will expire in ${Math.ceil(timeRemaining / 60)} minute(s).`,
      });
      onSessionExpiring?.(timeRemaining);
    } else {
      setWarning({ show: false, timeRemaining, message: '' });
    }
  }, [session, warningThreshold, criticalThreshold, getTimeUntilExpiry, onSessionExpired, onSessionExpiring]);

  const refreshSession = useCallback(async () => {
    if (!session || isRefreshing) return false;

    const timeRemaining = getTimeUntilExpiry(session);
    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;

    if (timeRemaining > 0 && timeSinceLastRefresh >= refreshInterval && timeRemaining < 900) {
      setIsRefreshing(true);
      try {
        logger.info('Refreshing session token (keep-alive)...');
        const { data, error } = await supabase.auth.refreshSession(session);

        if (error) {
          logger.error('Error refreshing session:', error);
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
        }

        if (data?.session) {
          logger.info('Session refreshed successfully');
          lastRefreshRef.current = Date.now();
          setWarning((prev) => {
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

  useEffect(() => {
    if (!session) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      setWarning({ show: false, timeRemaining: 0, message: '' });
      sessionDurationLoggedRef.current = null;
      sessionInitLoggedRef.current = null;
      return;
    }

    const sessionId = getSessionId(session);
    if (enableKeepAlive && sessionInitLoggedRef.current !== sessionId) {
      const timeRemaining = getTimeUntilExpiry(session);
      logger.info('Session Management Initialized', {
        timeRemainingSeconds: timeRemaining,
        timeRemainingMinutes: Math.floor(timeRemaining / 60),
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown',
        expectedDurationMinutes: EXPECTED_SESSION_DURATION_MINUTES,
      });
      sessionInitLoggedRef.current = sessionId;
    }

    checkSessionStatus();

    checkIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, checkInterval);

    if (enableKeepAlive) {
      refreshIntervalRef.current = setInterval(() => {
        refreshSession();
      }, refreshInterval);
    }

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
  }, [session, checkInterval, refreshInterval, enableKeepAlive, getSessionId, getTimeUntilExpiry, checkSessionStatus, refreshSession]);

  const manualRefresh = useCallback(async () => {
    if (!session) return false;
    lastRefreshRef.current = 0;
    return await refreshSession();
  }, [session, refreshSession]);

  const dismissWarning = useCallback(() => {
    setWarning((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    warning,
    isRefreshing,
    timeRemaining: getTimeUntilExpiry(session),
    refreshSession: manualRefresh,
    dismissWarning,
  };
};
