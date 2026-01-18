// Unified error handling utility
// Usage: import { handleError } from '@/lib/errorHandler';

export function handleError(error: unknown, context?: string): string {
  let message = 'An unexpected error occurred.';
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  if (context) {
    message = `[${context}] ${message}`;
  }
  // Optionally log to a centralized logger here
  // logger.error(message, error);
  return message;
}

// Example usage in React Query or try-catch:
// catch (error) { toast({ title: 'Error', description: handleError(error, 'Sales Entry') }); }
