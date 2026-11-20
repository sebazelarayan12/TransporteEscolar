import { Amount } from '../../shared/ui/Amount';
import { Button } from '../../shared/ui/Button';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { LoadingScreen } from '../../shared/ui/Spinner';
import { useToast } from '../../shared/hooks/useToast';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import { buildConfirmarDiciembreRequest, buildResumenDiciembre } from '../helpers/diciembre.helpers';
import type { DiciembreFormData } from '../schemas/diciembre.schema';
import { useConfirmarDiciembre, useDiciembreList } from '../services/diciembre.queries';
import type { DiciembreTitularItem } from '../types/diciembre.types';
import { DiciembreRow } from './DiciembreRow';

interface DiciembreTabProps {
  anio: number;
}

export const DiciembreTab = ({ anio }: DiciembreTabProps) => {
  const { showSuccess, showError } = useToast();
  const diciembreQuery = useDiciembreList(anio);
  const confirmarDiciembre = useConfirmarDiciembre();

  const handleGuardar = async (titular: DiciembreTitularItem, values: DiciembreFormData) => {
    try {
      await confirmarDiciembre.mutateAsync({
        titularId: titular.titularId,
        body: buildConfirmarDiciembreRequest(anio, values.decision, values.monto),
      });
      showSuccess(`Diciembre de ${getTitularApellidoDisplay(titular.apellido, titular.nombreContacto)} guardado`);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'No se pudo registrar la decisión de diciembre';
      showError(errorMessage);
    }
  };

  const isSavingTitular = (titularId: number) =>
    confirmarDiciembre.isPending && confirmarDiciembre.variables?.titularId === titularId;

  return (
    <section className="rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="space-y-1 border-b border-[#e1e8ec] px-6 py-5 dark:border-white/5">
        <h2 className="text-lg font-semibold text-[#0f181a] dark:text-white">Diciembre {anio}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confirmá titular por titular si va en diciembre y fijá el monto de su cuota.
        </p>
      </div>

      {diciembreQuery.isError && (
        <div className="space-y-4 p-6">
          <ErrorState message="Error al cargar la información de diciembre" />
          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => diciembreQuery.refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {!diciembreQuery.isError && diciembreQuery.isPending && (
        <div className="p-6">
          <LoadingScreen message="Cargando titulares..." />
        </div>
      )}

      {diciembreQuery.data && !diciembreQuery.isError && (
        <DiciembreContenido
          titulares={diciembreQuery.data.titulares}
          isSavingTitular={isSavingTitular}
          onGuardar={handleGuardar}
        />
      )}
    </section>
  );
};

interface DiciembreContenidoProps {
  titulares: DiciembreTitularItem[];
  isSavingTitular: (titularId: number) => boolean;
  onGuardar: (titular: DiciembreTitularItem, values: DiciembreFormData) => Promise<void>;
}

const DiciembreContenido = ({ titulares, isSavingTitular, onGuardar }: DiciembreContenidoProps) => {
  if (titulares.length === 0) {
    return (
      <div className="p-6">
        <EmptyState message="No hay titulares activos con pasajeros para diciembre." />
      </div>
    );
  }

  const resumen = buildResumenDiciembre(titulares);
  const resumenItems = [
    { label: 'Pendientes', value: String(resumen.pendientes) },
    { label: 'Van', value: String(resumen.van) },
    { label: 'No van', value: String(resumen.noVan) },
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {resumenItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e1e8ec] p-4 dark:border-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-1 text-xl font-bold text-[#0f181a] dark:text-white">{item.value}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-2xl border border-[#e1e8ec] p-4 md:col-span-1 dark:border-white/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total esperado</p>
          <p className="mt-1 text-xl font-bold text-[#0f181a] dark:text-white">
            <Amount value={resumen.totalEsperado} />
          </p>
        </div>
      </div>

      {titulares.map((titular) => (
        <DiciembreRow
          key={`${titular.titularId}-${titular.estado}-${titular.montoDiciembre ?? 'sin-monto'}`}
          titular={titular}
          isSaving={isSavingTitular(titular.titularId)}
          onGuardar={(values) => onGuardar(titular, values)}
        />
      ))}
    </div>
  );
};
