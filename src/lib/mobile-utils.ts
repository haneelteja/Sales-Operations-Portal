// Mobile utility functions and responsive design helpers

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

// Mobile-optimized spacing
export const MOBILE_SPACING = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const;

// Touch-friendly sizes
export const TOUCH_SIZES = {
  button: '44px',      // Minimum touch target size
  icon: '24px',        // Standard icon size
  input: '48px',       // Input field height
  card: '56px',        // Card minimum height
} as const;

// Mobile-optimized table configurations
export const MOBILE_TABLE_CONFIG = {
  maxColumns: 4,
  priorityColumns: ['date', 'amount', 'type'], // Columns to show on mobile
  collapsibleColumns: ['description', 'details'], // Columns to hide on mobile
} as const;

// Responsive grid configurations
export const RESPONSIVE_GRID = {
  mobile: 'grid-cols-1',
  tablet: 'md:grid-cols-2',
  desktop: 'lg:grid-cols-3 xl:grid-cols-4',
} as const;

// Mobile navigation configuration
export const MOBILE_NAV_CONFIG = {
  maxVisibleItems: 5,
  collapsibleThreshold: 6,
  iconOnlyMode: true,
} as const;

// Touch gesture helpers
export const TOUCH_GESTURES = {
  swipeThreshold: 50,
  longPressThreshold: 500,
  doubleTapThreshold: 300,
} as const;

// Mobile-optimized form configurations
export const MOBILE_FORM_CONFIG = {
  maxFieldsPerRow: 1,
  stackVertically: true,
  useFullWidth: true,
  largeTouchTargets: true,
} as const;

// Performance optimizations for mobile
export const MOBILE_PERFORMANCE = {
  lazyLoadThreshold: 10, // Items to load at once
  virtualScrollThreshold: 50, // Enable virtual scrolling after this many items
  debounceDelay: 300, // Search input debounce
  animationDuration: 200, // Reduced animation duration for mobile
} as const;

// Mobile-specific CSS classes
export const MOBILE_CLASSES = {
  container: 'px-4 sm:px-6 lg:px-8',
  card: 'p-4 sm:p-6',
  button: 'h-11 min-h-[44px] px-4 text-sm',
  input: 'h-11 min-h-[44px] px-3 text-base',
  table: 'text-sm',
  tableCell: 'px-2 py-3',
  tableHeader: 'px-2 py-3 text-xs font-medium',
  modal: 'mx-4 sm:mx-0 max-w-sm sm:max-w-md',
  sidebar: 'w-64 sm:w-72',
  header: 'h-14 px-4',
} as const;

// Import React hooks
import { useState, useEffect } from 'react';

// Mobile detection hook
export const useMobileDetection = () => {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isTabletDevice, setIsTabletDevice] = useState(false);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobileDevice(isMobile());
      setIsTabletDevice(isTablet());
      setIsDesktopDevice(isDesktop());
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobileDevice, isTabletDevice, isDesktopDevice };
};
