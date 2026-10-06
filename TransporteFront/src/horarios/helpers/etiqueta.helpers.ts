/**
 * La etiqueta de un horario es "hora + descripción" ("8 San Patricio", "13:30 Boisdron Salida").
 * HorariosGrid y el backend (HorarioValidator) comparten esta forma: no cambiarla sin cambiar los tres.
 */
const ETIQUETA_REGEX = /^(\d{1,2}(?::\d{2})?)\s+(.*)$/;

export const dividirEtiqueta = (etiqueta: string): { hora: string; descripcion: string } => {
  const limpia = etiqueta.trim();
  const match = limpia.match(ETIQUETA_REGEX);

  if (!match) {
    return { hora: '', descripcion: limpia };
  }

  return { hora: match[1], descripcion: match[2].trim() };
};

export const armarEtiqueta = (hora: string, descripcion: string): string =>
  `${hora.trim()} ${descripcion.trim()}`;
