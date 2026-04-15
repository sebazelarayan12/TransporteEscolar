const DEFAULT_LOCALE = 'es-AR';

const defaultNumberFormatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const truncateNumberTowardZero = (value: number): number => {
  return Math.trunc(value);
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const truncated = truncateNumberTowardZero(value);

  if (!options) {
    return defaultNumberFormatter.format(truncated);
  }

  const formatter = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });

  return formatter.format(truncated);
};
