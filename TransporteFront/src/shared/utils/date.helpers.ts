/**
 * Formatea una fecha DateOnly recibida del backend (formato YYYY-MM-DD)
 * sin conversión de timezone que causaría restar un día.
 * 
 * @param dateOnlyISO - Fecha en formato ISO "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss"
 * @param options - Opciones de formato para toLocaleDateString
 * @returns Fecha formateada según las opciones especificadas
 * 
 * @example
 * formatDateOnly("2026-02-11") // "11 de febrero de 2026"
 * formatDateOnly("2026-02-11T00:00:00") // "11 de febrero de 2026"
 */
export const formatDateOnly = (
  dateOnlyISO: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string => {
  // Parse YYYY-MM-DD sin conversión de timezone
  const [year, month, day] = dateOnlyISO.split('T')[0].split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-AR', options);
};

/**
 * Formatea una fecha DateOnly en formato corto (dd/MM/yyyy)
 * 
 * @param dateOnlyISO - Fecha en formato ISO "YYYY-MM-DD"
 * @returns Fecha en formato corto "11/02/2026"
 */
export const formatDateOnlyShort = (dateOnlyISO: string): string => {
  return formatDateOnly(dateOnlyISO, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formatea una fecha DateOnly en formato compacto (día mes año)
 * 
 * @param dateOnlyISO - Fecha en formato ISO "YYYY-MM-DD"
 * @returns Fecha en formato compacto "11 feb 2026"
 */
export const formatDateOnlyCompact = (dateOnlyISO: string): string => {
  return formatDateOnly(dateOnlyISO, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formatea una fecha/hora ISO (DateTime) a "11 feb 2026 - 14:30"
 * Retorna el valor original si no se puede parsear
 */
export const formatDateTime = (isoDateTime: string): string => {
  if (!isoDateTime) {
    return isoDateTime;
  }

  const parsed = new Date(isoDateTime);

  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }

  const dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const datePart = dateFormatter.format(parsed).replace('.', '');
  const timePart = timeFormatter.format(parsed);

  return `${datePart.toLowerCase()} - ${timePart}`;
};
