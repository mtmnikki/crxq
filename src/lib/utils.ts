/**
 * Utility functions for className manipulation and other common operations
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and deduplicates Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}