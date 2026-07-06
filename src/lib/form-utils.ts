// Form utility functions used across the app.
// Only functions actively imported by other modules are kept here.

// Format currency — used by Receivables.tsx and documentGenerator.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
};

// Format date — used by Receivables.tsx and documentGenerator.ts
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
