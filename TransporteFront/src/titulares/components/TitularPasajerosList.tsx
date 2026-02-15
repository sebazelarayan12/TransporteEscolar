import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionHeader, Spinner, Alert } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useUpdatePasajero } from '../../pasajeros/services/pasajeros.queries';
import { PasajeroEditModal } from '../../pasajeros/components/PasajeroEditModal';
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

const getInitial = (nombreCompleto: string) => {
  return nombreCompleto.trim().charAt(0).toUpperCase();
};

const getColorClass = (id: number) => {
  const palette = [
    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200',
    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200',
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200',
    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200',
  ];
  return palette[id % palette.length];
};

export const TitularPasajerosList = ({ 
  pasajeros, 
  isLoading, 
  error, 
  onRetry, 
  showAddButton = true, 
  prefillTitularApellido, 
  prefillTitularId 
}: TitularPasajerosListProps) => {
  const { showSuccess, showError } = useToast();
  const [editingPasajero, setEditingPasajero] = useState<PasajeroResponse | null>(null);
  const updatePasajero = useUpdatePasajero();

  const cantidad = pasajeros?.length ?? 0;
  const prefillState =
    typeof prefillTitularId === 'number' || prefillTitularApellido
      ? {
          ...(typeof prefillTitularId === 'number' ? { titularId: prefillTitularId } : {}),
          ...(prefillTitularApellido ? { titularApellido: prefillTitularApellido } : {}),
        }
      : undefined;

  const handleEditPasajero = (pasajero: PasajeroResponse) => {
    if (pasajero.activo) {
      setEditingPasajero(pasajero);
    }
  };

  const handleSavePasajero = async (data: UpdatePasajeroFormData) => {
    if (!editingPasajero) return;

    try {
      await updatePasajero.mutateAsync({
        id: editingPasajero.id,
        data,
      });
      showSuccess('Pasajero actualizado correctamente');
      setEditingPasajero(null);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Error al actualizar el pasajero';
      showError(errorMessage);
    }
  };

  return (
    <section>
      {showAddButton && (
        <SectionHeader 
          icon="school" 
          title="Pasajeros Asociados"
          badge={cantidad.toString()}
        />
      )}
      <div className="grid grid-cols-1 gap-3">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        )}

        {!isLoading && error && (
          <Alert variant="error" className="text-xs sm:text-sm">
            <div className="flex flex-col gap-2">
              <span>No pudimos cargar los pasajeros asociados.</span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="self-start text-xs font-bold text-[#007a8a] hover:text-[#00626e]"
                >
                  Reintentar
                </button>
              )}
            </div>
          </Alert>
        )}

        {!isLoading && !error && cantidad === 0 && (
          <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center text-sm text-gray-500">
            Este titular no tiene pasajeros vinculados.
          </div>
        )}

        {!isLoading && !error && cantidad > 0 && (
          <>
          {pasajeros!.map((pasajero) => (
            <div 
              key={pasajero.id}
              className="p-3 rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] bg-white dark:bg-[#27272a] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Botón de editar en esquina superior derecha */}
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={() => handleEditPasajero(pasajero)}
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
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 dark:bg-white/5 p-1.5 rounded-md border border-gray-100 dark:border-gray-700">
                    <span className="material-symbols-outlined text-[14px] text-[#007a8a]">schedule</span>
                    <span className="truncate font-semibold text-gray-700 dark:text-gray-300">
                      {pasajero.horarioDescripcion || pasajero.horario?.etiqueta || 'Sin horario'}
                    </span>
                    <span className="text-gray-500">Turno {pasajero.turno}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </>
        )}

        {showAddButton && (
          <Link
            to="/pasajeros/nuevo"
            state={prefillState}
            aria-label="Vincular pasajero"
            className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-[#007a8a] hover:border-[#007a8a] hover:bg-[#007a8a]/5 transition-all flex items-center justify-center gap-2 text-sm font-medium h-20"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Vincular Pasajero
          </Link>
        )}
      </div>

      {/* Modal de Edición */}
      {editingPasajero && (
        <PasajeroEditModal
          pasajero={editingPasajero}
          isOpen={!!editingPasajero}
          onClose={() => setEditingPasajero(null)}
          onSave={handleSavePasajero}
          isSaving={updatePasajero.isPending}
        />
      )}
    </section>
  );
};
