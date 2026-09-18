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
import { Button } from '../../shared/ui/Button';
import { formatPhoneNumber } from '../helpers/phone.helpers';
import { useTitularPhones } from '../hooks/useTitularPhones';
import { useTitularStatusActions } from '../hooks/useTitularStatusActions';

interface TitularDetailPanelProps {
  titular: TitularResponse | null;
  onClose?: () => void;
}

const EmptyTitularPanel = () => (
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

interface WhatsappPrincipalCardProps {
  principalNumber?: string;
  disabled: boolean;
  onClick: () => void;
}

const WhatsappPrincipalCard = ({ principalNumber, disabled, onClick }: WhatsappPrincipalCardProps) => (
  <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4 shadow-sm dark:border-green-900/40 dark:bg-green-900/10">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-green-900 dark:text-green-200">WhatsApp principal</p>
        <p className="mt-1 text-xs text-green-800/80 dark:text-green-200/70">
          {principalNumber
            ? `Se usará ${formatPhoneNumber(principalNumber)}`
            : 'Define un teléfono principal activo para habilitar esta acción.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-300"
        aria-label="Contactar por WhatsApp"
        title={disabled ? 'Agrega un teléfono principal' : 'Abrir WhatsApp'}
      >
        <span className="material-symbols-outlined text-[18px]">chat</span>
        <span>WhatsApp</span>
      </button>
    </div>
  </div>
);

interface TitularDetailFooterProps {
  activo: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

const TitularDetailFooter = ({ activo, disabled, onEdit, onDeactivate, onReactivate }: TitularDetailFooterProps) => (
  <div className="p-4 border-t border-[#e4e4e7] dark:border-[#3f3f46] bg-gray-50 dark:bg-white/5 flex flex-col sm:flex-row gap-3 sticky bottom-0">
    <Button
      variant="secondary"
      onClick={onEdit}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2"
    >
      <span className="material-symbols-outlined text-[18px]">edit</span>
      Editar
    </Button>
    <Button
      variant={activo ? 'danger' : 'brand'}
      onClick={activo ? onDeactivate : onReactivate}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2"
    >
      <span className="material-symbols-outlined text-[18px]">{activo ? 'block' : 'restart_alt'}</span>
      {activo ? 'Inactivar' : 'Reactivar'}
    </Button>
  </div>
);

export const TitularDetailPanel = ({ titular, onClose }: TitularDetailPanelProps) => {
  const [isPhoneModalOpen, setPhoneModalOpen] = useState(false);
  const navigate = useNavigate();
  const phones = useTitularPhones(titular?.id);
  const status = useTitularStatusActions(titular, onClose);
  const {
    data: pasajeros,
    isLoading: pasajerosLoading,
    error: pasajerosError,
    refetch: refetchPasajeros,
  } = usePasajerosByTitular(titular?.id ?? 0);

  if (!titular) {
    return <EmptyTitularPanel />;
  }

  const pasajerosCount = pasajeros?.length ?? 0;

  return (
    <>
      <TitularDetailHeader titular={titular} onClose={onClose} />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        <WhatsappPrincipalCard
          principalNumber={phones.principalPhone?.numeroE164}
          disabled={phones.whatsappDisabled}
          onClick={phones.openWhatsapp}
        />
        <TitularPhoneList
          phones={phones.telefonos}
          isLoading={phones.isLoading}
          error={phones.hasError ? 'No se pudieron cargar los teléfonos.' : undefined}
          onRetry={phones.refetch}
          onAddPhone={() => setPhoneModalOpen(true)}
          titularId={titular.id}
          onMarkPrincipal={phones.markPrincipal}
          markingPhoneId={phones.markingPhoneId}
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

      <TitularDetailFooter
        activo={titular.activo}
        disabled={status.isPending}
        onEdit={() => navigate(`/titulares/${titular.id}`)}
        onDeactivate={status.openDeactivate}
        onReactivate={status.openReactivate}
      />

      <TitularStatusModal
        isOpen={status.isDeactivateOpen}
        titular={titular}
        pasajerosCount={pasajerosCount}
        mode="deactivate"
        onClose={status.closeDeactivate}
        onConfirm={status.confirmDeactivate}
        isPending={status.isDeactivating}
      />
      <TitularStatusModal
        isOpen={status.isReactivateOpen}
        titular={titular}
        pasajerosCount={pasajerosCount}
        mode="reactivate"
        onClose={status.closeReactivate}
        onConfirm={status.confirmReactivate}
        isPending={status.isReactivating}
      />
      <TitularPhoneModal
        isOpen={isPhoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        titularApellido={titular.apellido}
        titularId={titular.id}
        onSaved={phones.refetch}
      />
    </>
  );
};
