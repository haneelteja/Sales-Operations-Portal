import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface SessionWarningProps {
  /** Custom className for styling */
  className?: string;
  /** Position of the warning (default: 'top-right') */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const SessionWarning = ({ className = '', position = 'top-right' }: SessionWarningProps) => {
  const { session } = useAuth();
  const { warning, isRefreshing, refreshSession, dismissWarning } = useSessionManagement(session, {
    warningThreshold: 300, // 5 minutes
    criticalThreshold: 60, // 1 minute
    enableKeepAlive: true,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(warning.show);
  }, [warning.show]);

  if (!isVisible || !warning.show) return null;

  const isCritical = warning.timeRemaining <= 60;
  const minutesRemaining = Math.ceil(warning.timeRemaining / 60);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  const handleRefresh = async () => {
    const success = await refreshSession();
    if (success) {
      dismissWarning();
    }
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] w-full max-w-md animate-in slide-in-from-top-2 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <Alert 
        variant={isCritical ? 'destructive' : 'default'} 
        className={`shadow-2xl border-2 ${isCritical ? 'border-red-500 animate-pulse' : 'border-yellow-500'}`}
      >
        <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} />
        <AlertTitle className="flex items-center justify-between">
          <span className="font-bold">{isCritical ? '⚠️ Session Expiring Soon!' : '⏰ Session Warning'}</span>
          {!isCritical && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={dismissWarning}
              aria-label="Dismiss warning"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="space-y-3 mt-2">
          <p className="font-medium">{warning.message}</p>
          {warning.timeRemaining > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                variant={isCritical ? 'default' : 'outline'}
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {minutesRemaining} minute(s) remaining
                </span>
                {isCritical && (
                  <span className="text-xs text-red-600 font-medium">
                    Save your work now!
                  </span>
                )}
              </div>
            </div>
          )}
          {warning.timeRemaining === 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-sm text-red-800 font-medium">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

