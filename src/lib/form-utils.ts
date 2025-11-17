// Common form utilities and validation functions

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  validation?: ValidationRule;
  options?: { value: string; label: string }[];
}

// Common validation rules
export const validationRules = {
  required: (value: unknown): string | null => {
    if (!value || value.toString().trim() === '') {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  phone: (value: string): string | null => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },
  
  minLength: (min: number) => (value: string): string | null => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string): string | null => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },
  
  positiveNumber: (value: unknown): string | null => {
    const num = parseFloat(String(value));
    if (value && (isNaN(num) || num <= 0)) {
      return 'Must be a positive number';
    }
    return null;
  },
  
  integer: (value: unknown): string | null => {
    const num = parseInt(String(value));
    if (value && (isNaN(num) || !Number.isInteger(parseFloat(String(value))))) {
      return 'Must be a whole number';
    }
    return null;
  },
};

// Validate a single field
export const validateField = (value: unknown, rules: ValidationRule): string | null => {
  if (rules.required && validationRules.required(value)) {
    return validationRules.required(value);
  }
  
  if (rules.minLength && validationRules.minLength(rules.minLength)(value)) {
    return validationRules.minLength(rules.minLength)(value);
  }
  
  if (rules.maxLength && validationRules.maxLength(rules.maxLength)(value)) {
    return validationRules.maxLength(rules.maxLength)(value);
  }
  
  if (rules.pattern && value && !rules.pattern.test(value)) {
    return 'Invalid format';
  }
  
  if (rules.custom) {
    return rules.custom(value);
  }
  
  return null;
};

// Validate entire form
export const validateForm = (data: Record<string, unknown>, fields: FormField[]): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  fields.forEach(field => {
    const value = data[field.name];
    const rules: ValidationRule = {
      required: field.required,
      ...field.validation,
    };
    
    const error = validateField(value, rules);
    if (error) {
      errors[field.name] = error;
    }
  });
  
  return errors;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date for input
export const formatDateForInput = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Get today's date in input format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get date N days from today
export const getDateNDaysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Calculate amount from quantity and price
export const calculateAmount = (quantity: number, price: number): number => {
  return quantity * price;
};

// Round to 2 decimal places
export const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Debounce function
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: unknown): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert to title case
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

