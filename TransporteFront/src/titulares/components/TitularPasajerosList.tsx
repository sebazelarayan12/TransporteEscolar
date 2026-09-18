import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../../shared/ui/SectionHeader';
import { Spinner } from '../../shared/ui/Spinner';
import { Alert } from '../../shared/ui/Alert';
import { useToast } from '../../shared/hooks/useToast';
import { useUpdatePasajero } from '../../pasajeros/services/pasajeros.queries';
import { PasajeroEditModal } from '../../pasajeros/components/PasajeroEditModal';
import { PasajeroHorarioBadges } from '../../pasajeros/components/PasajeroHorarioBadges';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import type { UpdatePasajeroFormData } from '../../pasajeros/schemas/pasajero.schema';

interface TitularPasajerosListProps {
  pasajeros?: PasajeroResponse[];
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  showAddButton?: boolean;
  prefillTitularApellido?: string;
  prefillTitularId?: number;
}

const AVATAR_PALETTE = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200',
];

const getInitial = (nombreCompleto: string) => nombreCompleto.trim().charAt(0).toUpperCase();
const getColorClass = (id: number) => AVATAR_PALETTE[id % AVATAR_PALETTE.length];

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Error al actualizar el pasajero';

/** Estado del pasajero en edición y guardado de sus cambios. */
const usePasajeroEdit = () => {
  const { showSuccess, showError } = useToast();
  const [editing, setEditing] = useState<PasajeroResponse | null>(null);
  const updatePasajero = useUpdatePasajero();

  const save = async (data: UpdatePasajeroFormData) => {
    if (!editing) return;

    try {
      await updatePasajero.mutateAsync({ id: editing.id, data });
      showSuccess('Pasajero actualizado correctamente');
      setEditing(null);
    } catch (error: unknown) {
      showError(getErrorMessage(error));
    }
  };

  return {
    editing,
    isSaving: updatePasajero.isPending,
    // Solo se puede editar un pasajero activo
    start: (pasajero: PasajeroResponse) => pasajero.activo && setEditing(pasajero),
    cancel: () => setEditing(null),
    save,
  };
};

interface PasajeroItemProps {
  pasajero: PasajeroResponse;
  onEdit: (pasajero: PasajeroResponse) => void;
}

const PasajeroItem = ({ pasajero, onEdit }: PasajeroItemProps) => (
  <div className="p-3 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
    {/* Botón de editar en esquina superior derecha */}
    <div className="absolute top-2 right-2">
      <button
        type="button"
        onClick={() => onEdit(pasajero)}
        disabled={!pasajero.activo}
        title={pasajero.activo ? 'Editar pasajero' : 'Inactivo'}
        aria-label="Editar pasajero"
        className="p-1.5 rounded-lg text-gray-400 dark:text-gray-300 hover:text-[#007a8a] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </button>
    </div>

    {pasajero.activo && (
      <div className="absolute top-2 right-12">
        <span className="block size-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#27272a]" />
      </div>
    )}

    <div className="flex items-start gap-3">
      <div className={`size-12 rounded-lg ${getColorClass(pasajero.id)} flex items-center justify-center text-lg font-bold`}>
        {getInitial(pasajero.nombreCompleto)}
      </div>
      <div className="flex flex-col w-full pr-8">
        <h5 className="font-bold text-gray-900 dark:text-white text-sm">{pasajero.nombreCompleto}</h5>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {pasajero.colegio} · {pasajero.gradoCurso}
        </p>
        <div className="flex flex-col gap-1 rounded-md border border-gray-100 bg-gray-50 p-1.5 text-xs dark:border-gray-700 dark:bg-white/5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Horarios</span>
          <PasajeroHorarioBadges horarios={pasajero.horariosAsignados} size="sm" maxVisible={2} />
        </div>
      </div>
    </div>
  </div>
);

interface PasajerosContentProps {
  pasajeros?: PasajeroResponse[];
  isLoading: boolean;
  error?: string;
  onRetry?: () => void;
  onEdit: (pasajero: PasajeroResponse) => void;
}

const PasajerosContent = ({ pasajeros = [], isLoading, error, onRetry, onEdit }: PasajerosContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="text-xs sm:text-sm">
        <div className="flex flex-col gap-2">
          <span>No pudimos cargar los pasajeros asociados.</span>
          {onRetry && (
            <button onClick={onRetry} className="self-start text-xs font-bold text-[#007a8a] hover:text-[#00626e]">
              Reintentar
            </button>
          )}
        </div>
      </Alert>
    );
  }

  if (pasajeros.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-sm text-gray-500">
        Este titular no tiene pasajeros vinculados.
      </div>
    );
  }

  return (
    <>
      {pasajeros.map((pasajero) => (
        <PasajeroItem key={pasajero.id} pasajero={pasajero} onEdit={onEdit} />
      ))}
    </>
  );
};

export const TitularPasajerosList = ({
  pasajeros,
  isLoading,
  error,
  onRetry,
  showAddButton = true,
  prefillTitularApellido,
  prefillTitularId,
}: TitularPasajerosListProps) => {
  const edit = usePasajeroEdit();

  const prefillState = {
    ...(typeof prefillTitularId === 'number' ? { titularId: prefillTitularId } : {}),
    ...(prefillTitularApellido ? { titularApellido: prefillTitularApellido } : {}),
  };

  return (
    <section>
      {showAddButton && <SectionHeader icon="school" title="Pasajeros Asociados" badge={(pasajeros?.length ?? 0).toString()} />}
      <div className="grid grid-cols-1 gap-3">
        <PasajerosContent
          pasajeros={pasajeros}
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          onEdit={edit.start}
        />

        {showAddButton && (
          <Link
            to="/pasajeros/nuevo"
            state={Object.keys(prefillState).length > 0 ? prefillState : undefined}
            aria-label="Vincular pasajero"
            className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-[#007a8a] hover:border-[#007a8a] hover:bg-[#007a8a]/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium h-20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Vincular Pasajero
          </Link>
        )}
      </div>

      {edit.editing && (
        <PasajeroEditModal
          pasajero={edit.editing}
          isOpen
          onClose={edit.cancel}
          onSave={edit.save}
          isSaving={edit.isSaving}
        />
      )}
    </section>
  );
};
