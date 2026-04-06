const DEFAULT_PERIODO = '--/----';
const PERIODO_REGEX = /\(\d{2}\/\d{4}\)/;

const formatPeriodoFromFecha = (fechaIso?: string | null): string => {
  if (!fechaIso) {
    return DEFAULT_PERIODO;
  }
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) {
    return DEFAULT_PERIODO;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

export const formatNotificacionMensajeConPeriodo = (
  mensaje: string,
  fechaReferencia?: string | null,
): string => {
  const safeMensaje = mensaje?.trim() ?? '';
  const periodo = formatPeriodoFromFecha(fechaReferencia);
  const periodoToken = `(${periodo})`;

  if (!safeMensaje) {
    return periodoToken;
  }

  if (PERIODO_REGEX.test(safeMensaje)) {
    return safeMensaje.replace(PERIODO_REGEX, periodoToken);
  }

  return `${safeMensaje} ${periodoToken}`.trim();
};
