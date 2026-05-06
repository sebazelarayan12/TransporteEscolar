import { titularesApi } from '../services/titulares.api';
import type { TitularResponse } from '../types/titular.types';

export async function exportarContactosVcf(titularesActivos: TitularResponse[]): Promise<void> {
  const telefonosPorTitular = await Promise.all(
    titularesActivos.map((t) =>
      titularesApi
        .getTelefonos(t.id)
        .then((tel) => ({ titular: t, telefonos: tel }))
        .catch(() => ({ titular: t, telefonos: [] })),
    ),
  );

  const vcfParts = telefonosPorTitular.map(({ titular, telefonos }) => {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${titular.apellido};;;;`, `FN:${titular.apellido}`];
    for (const tel of telefonos.filter((t) => t.activo)) {
      lines.push(`TEL;TYPE=CELL:${tel.numeroE164}`);
    }
    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  const blob = new Blob([vcfParts.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'titulares.vcf';
  a.click();
  URL.revokeObjectURL(url);
}
