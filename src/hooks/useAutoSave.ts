import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseAutoSaveOptions<T> {
  /** Unique key for localStorage */
  storageKey: string;
  /** Form data to save */
  data: T;
  /** Debounce delay in milliseconds (default: 2000 = 2 seconds) */
  debounceDelay?: number;
  /** Enable/disable auto-save (default: true) */
  enabled?: boolean;
  /** Callback when data is saved */
  onSave?: (data: T) => void;
  /** Callback when data is loaded */
  onLoad?: (data: T | null) => void;
  /** Custom serialization function */
  serialize?: (data: T) => string;
  /** Custom deserialization function */
  deserialize?: (serialized: string) => T;
  /** Function to check if data has changed (for optimization) */
  hasChanged?: (oldData: T, newData: T) => boolean;
}

/**
 * Hook to automatically save form data to localStorage and restore it on mount.
 * Prevents data loss from session timeouts or accidental page refreshes.
 */
export const useAutoSave = <T extends Record<string, unknown>>(
  options: UseAutoSaveOptions<T>
) => {
  const {
    storageKey,
    data,
    debounceDelay = 2000,
    enabled = true,
    onSave,
    onLoad,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    hasChanged = (old, current) => JSON.stringify(old) !== JSON.stringify(current),
  } = options;

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  // Save data to localStorage
  const saveData = useCallback(
    (dataToSave: T) => {
      if (!enabled) return;

      try {
        const serialized = serialize(dataToSave);
        
        // Only save if data has changed
        if (serialized === lastSavedDataRef.current) {
          return;
        }

        localStorage.setItem(storageKey, serialized);
        lastSavedDataRef.current = serialized;
        logger.debug(`Auto-saved data to ${storageKey}`);
        onSave?.(dataToSave);
      } catch (error) {
        logger.error(`Error saving data to ${storageKey}:`, error);
      }
    },
    [enabled, storageKey, serialize, onSave]
  );

  // Load data from localStorage
  const loadData = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const deserialized = deserialize(saved) as T;
      lastSavedDataRef.current = saved;
      logger.debug(`Loaded auto-saved data from ${storageKey}`);
      onLoad?.(deserialized);
      return deserialized;
    } catch (error) {
      logger.error(`Error loading data from ${storageKey}:`, error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [enabled, storageKey, deserialize, onLoad]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      lastSavedDataRef.current = '';
      logger.debug(`Cleared auto-saved data from ${storageKey}`);
    } catch (error) {
      logger.error(`Error clearing data from ${storageKey}:`, error);
    }
  }, [storageKey]);

  // Auto-save with debounce
  useEffect(() => {
    if (!enabled || isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      // Check if data has changed before saving
      const currentSerialized = serialize(data);
      if (currentSerialized !== lastSavedDataRef.current) {
        saveData(data);
      }
    }, debounceDelay);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [data, debounceDelay, enabled, serialize, saveData]);

  // Load data on mount
  useEffect(() => {
    if (enabled && isInitialLoadRef.current) {
      const loaded = loadData();
      isInitialLoadRef.current = false;
    }
  }, [enabled, loadData]);

  return {
    loadData,
    saveData,
    clearSavedData,
  };
};

