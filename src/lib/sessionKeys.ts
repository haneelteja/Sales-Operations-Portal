/**
 * Password-recovery flow flags in sessionStorage.
 * Legacy key kept for users mid-reset after renaming from Absolute Portal branding.
 */
export const PORTAL_RECOVERY_IN_PROGRESS_KEY = 'aamodha_ops_portal_recovery_in_progress';
const LEGACY_PORTAL_RECOVERY_IN_PROGRESS_KEY = 'absolute_portal_recovery_in_progress';

export function isRecoveryInProgress(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    sessionStorage.getItem(PORTAL_RECOVERY_IN_PROGRESS_KEY) === 'true' ||
    sessionStorage.getItem(LEGACY_PORTAL_RECOVERY_IN_PROGRESS_KEY) === 'true'
  );
}

export function setRecoveryInProgress(): void {
  sessionStorage.setItem(PORTAL_RECOVERY_IN_PROGRESS_KEY, 'true');
}

export function clearRecoveryInProgress(): void {
  sessionStorage.removeItem(PORTAL_RECOVERY_IN_PROGRESS_KEY);
  sessionStorage.removeItem(LEGACY_PORTAL_RECOVERY_IN_PROGRESS_KEY);
}
