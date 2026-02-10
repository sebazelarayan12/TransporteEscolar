import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TitularResponse } from '../types/titular.types';
import { TitularDetailHeader } from './TitularDetailHeader';
import { TitularPhoneList } from './TitularPhoneList';
import { TitularPasajerosList } from './TitularPasajerosList';
import { TitularInfoSection } from './TitularInfoSection';
import { TitularPhoneModal } from './TitularPhoneModal';
import { TitularStatusModal } from './TitularStatusModal';
import { usePasajerosByTitular } from '../../pasajeros/services/pasajeros.queries';
import {
  useDeleteTitular,
  useMarkTitularTelefonoPrincipal,
  useReactivarTitular,
  useTitularTelefonos,
} from '../services/titulares.queries';
import { useToast } from '../../shared/hooks';
import { Button } from '../../shared/ui/Button';

interface TitularDetailPanelProps {
  titular: TitularResponse | null;
  onClose?: () => void;
}

export const TitularDetailPanel = ({ titular, onClose }: TitularDetailPanelProps) => {
  const [isPhoneModalOpen, setPhoneModalOpen] = useState(false);
  const [markingPhoneId, setMarkingPhoneId] = useState<number | null>(null);
  const [isDeactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setReactivateModalOpen] = useState(false);
  const titularId = titular?.id;
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const {
    data: telefonos,
    isLoading: telefonosLoading,
    error: telefonosError,
    refetch: refetchTelefonos,
  } = useTitularTelefonos(titularId);

  const {
    data: pasajeros,
    isLoading: pasajerosLoading,
    error: pasajerosError,
    refetch: refetchPasajeros,
  } = usePasajerosByTitular(titularId ?? 0);
  const { mutateAsync: markTelefonoPrincipal } = useMarkTitularTelefonoPrincipal(titularId ?? 0);
  const { mutateAsync: deleteTitular, isPending: isDeletingTitular } = useDeleteTitular();
  const { mutateAsync: reactivateTitular, isPending: isReactivatingTitular } = useReactivarTitular();
  const pasajerosCount = pasajeros?.length ?? 0;
  const statusMutationPending = isDeletingTitular || isReactivatingTitular;

  const resolveErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
    return fallback;
  };

  if (!titular) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600">person_search</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Selecciona un Titular</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Haz clic en cualquier titular de la lista para ver sus detalles y opciones
        </p>
      </div>
    );
  }

  const handleMarkPrincipal = async (telefonoId: number) => {
    if (!titularId) {
      return;
    }
    try {
      setMarkingPhoneId(telefonoId);
      await markTelefonoPrincipal(telefonoId);
      showSuccess('Teléfono marcado como principal');
    } catch (error) {
      console.error('Error al marcar teléfono principal', error);
      showError('No se pudo marcar el teléfono como principal');
    } finally {
      setMarkingPhoneId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!titular) {
      return;
    }
    try {
      await deleteTitular(titular.id);
      showSuccess('Titular inactivado correctamente');
      setDeactivateModalOpen(false);
      onClose?.();
    } catch (error) {
      const message = resolveErrorMessage(error, 'No se pudo inactivar al titular');
      console.error('Error al inactivar titular', error);
      showError(message);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!titular) {
      return;
    }
    try {
      await reactivateTitular(titular.id);
      showSuccess('Titular reactivado correctamente');
      setReactivateModalOpen(false);
      onClose?.();
    } catch (error) {
      const message = resolveErrorMessage(error, 'No se pudo reactivar al titular');
      console.error('Error al reactivar titular', error);
      showError(message);
    }
  };

  return (
    <>
      <TitularDetailHeader titular={titular} onClose={onClose} />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        <TitularPhoneList
          phones={telefonos}
          isLoading={telefonosLoading}
          error={telefonosError ? 'No se pudieron cargar los teléfonos.' : undefined}
          onRetry={refetchTelefonos}
          titularNombre={titular.nombreContacto}
          onAddPhone={titular ? () => setPhoneModalOpen(true) : undefined}
          titularId={titular.id}
          onMarkPrincipal={handleMarkPrincipal}
          markingPhoneId={markingPhoneId}
          showEditButton={false}
        />
        <TitularPasajerosList
          pasajeros={pasajeros}
          isLoading={pasajerosLoading}
          error={pasajerosError ? 'No se pudieron cargar los pasajeros.' : undefined}
          onRetry={refetchPasajeros}
          prefillTitularId={titular.id}
          prefillTitularApellido={titular.apellido}
        />
        <TitularInfoSection titular={titular} />
      </div>

      <div className="p-4 border-t border-[#e4e4e7] dark:border-[#3f3f46] bg-gray-50 dark:bg-white/5 flex flex-col sm:flex-row gap-3 sticky bottom-0">
        <Button
          variant="ghost"
          onClick={() => navigate(`/titulares/${titular.id}`)}
          disabled={statusMutationPending}
          className="w-full flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Editar
        </Button>
        <Button
          variant={titular.activo ? 'danger' : 'brand'}
          onClick={() => (titular.activo ? setDeactivateModalOpen(true) : setReactivateModalOpen(true))}
          disabled={statusMutationPending}
          className="w-full flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {titular.activo ? 'block' : 'restart_alt'}
          </span>
          {titular.activo ? 'Inactivar' : 'Reactivar'}
        </Button>
      </div>
      {titular && (
        <>
          <TitularStatusModal
            isOpen={isDeactivateModalOpen}
            titular={titular}
            pasajerosCount={pasajerosCount}
            mode="deactivate"
            onClose={() => setDeactivateModalOpen(false)}
            onConfirm={handleConfirmDeactivate}
            isPending={isDeletingTitular}
          />
          <TitularStatusModal
            isOpen={isReactivateModalOpen}
            titular={titular}
            pasajerosCount={pasajerosCount}
            mode="reactivate"
            onClose={() => setReactivateModalOpen(false)}
            onConfirm={handleConfirmReactivate}
            isPending={isReactivatingTitular}
          />
          <TitularPhoneModal
            isOpen={isPhoneModalOpen}
            onClose={() => setPhoneModalOpen(false)}
            titularApellido={titular.apellido}
            titularId={titular.id}
            onSaved={refetchTelefonos}
          />
        </>
      )}
    </>
  );
};
