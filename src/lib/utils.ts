import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function passesMultiFilter(value: string, filter: string | string[] | null | undefined): boolean {
  if (!filter) return true;
  const filters = Array.isArray(filter) ? filter : [filter];
  return filters.length === 0 || filters.some(f => value.toLowerCase().includes(f.toLowerCase()));
}
