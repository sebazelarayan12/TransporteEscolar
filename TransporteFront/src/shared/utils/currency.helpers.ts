/**
 * Currency formatting utilities
 * Centralized currency formatting to avoid duplication across components
 */

const DEFAULT_LOCALE = 'es-AR';
const DEFAULT_CURRENCY = 'ARS';

const currencyFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  style: 'currency',
  currency: DEFAULT_CURRENCY,
  minimumFractionDigits: 2,
});

/**
 * Formats a number as Argentine Peso currency
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$ 1.234,56")
 */
export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};

/**
 * Parses a currency string back to a number
 * Handles both "." and "," as decimal separators
 * @param value - The currency string to parse
 * @returns Parsed number or NaN if invalid
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned);
};
