export const DEFAULT_TITULAR_LABEL = 'Sin titular';

const cleanValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return value.trim();
};

export const getApellidoFromString = (nombre?: string | null): string => {
  const normalized = cleanValue(nombre);
  if (!normalized) {
    return DEFAULT_TITULAR_LABEL;
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return DEFAULT_TITULAR_LABEL;
  }

  const lastToken = parts[parts.length - 1];
  return lastToken || DEFAULT_TITULAR_LABEL;
};

export const getTitularApellidoDisplay = (
  apellido?: string | null,
  nombreFallback?: string | null,
): string => {
  const normalizedApellido = cleanValue(apellido);
  if (normalizedApellido) {
    return normalizedApellido;
  }

  return getApellidoFromString(nombreFallback);
};
