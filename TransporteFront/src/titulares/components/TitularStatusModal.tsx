import type { TitularResponse } from '../types/titular.types';

import { Modal } from '../../shared/ui/Modal';
import { Button } from '../../shared/ui/Button';

type TitularStatusMode = 'deactivate' | 'reactivate';

interface TitularStatusModalProps {
  isOpen: boolean;
  titular: TitularResponse;
  pasajerosCount: number;
  mode: TitularStatusMode;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const STATUS_CONFIG: Record<
  TitularStatusMode,
  {
    title: string;
    confirmLabel: string;
    confirmVariant: 'danger' | 'brand';
    icon: string;
    highlightClass: string;
    headline: (fullName: string) => string;
    subtitle: string;
    badgeColor: string;
  }
> = {
  deactivate: {
    title: 'Inactivar titular',
    confirmLabel: 'Confirmar baja',
    confirmVariant: 'danger',
    icon: 'block',
    highlightClass: 'text-red-600 dark:text-red-400',
    headline: (fullName) => `Estás a punto de inactivar a ${fullName}.`,
    subtitle: 'El titular dejará de aparecer en los listados activos y no podrás registrar nuevos pagos hasta reactivarlo nuevamente. Los datos se conservan.',
    badgeColor: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
  },
  reactivate: {
    title: 'Reactivar titular',
    confirmLabel: 'Reactivar titular',
    confirmVariant: 'brand',
    icon: 'restart_alt',
    highlightClass: 'text-[#007a8a] dark:text-[#5eead4]',
    headline: (fullName) => `¿Reactivar a ${fullName}?`,
    subtitle: 'El titular volverá a verse en los listados activos y podrás continuar registrando pagos, reinscripciones y comunicaciones habituales.',
    badgeColor: 'bg-[#e0f2f5] text-[#0f5b66] dark:bg-[#0f172a] dark:text-[#5eead4]',
  },
};

export const TitularStatusModal = ({
  isOpen,
  titular,
  pasajerosCount,
  mode,
  onClose,
  onConfirm,
  isPending,
}: TitularStatusModalProps) => {
  const config = STATUS_CONFIG[mode];
  const fullName = `${titular.nombreContacto} ${titular.apellido}`;
  const pasajerosLabel = `${pasajerosCount} ${pasajerosCount === 1 ? 'pasajero cargado' : 'pasajeros cargados'}`;

  const handleClose = () => {
    if (isPending) {
      return;
    }
    onClose();
  };

  const handleConfirm = () => {
    if (isPending) {
      return;
    }
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={config.title} maxWidth="lg">
      <div className="space-y-5">
        <div>
          <p className={`text-base font-semibold ${config.highlightClass}`}>{config.headline(fullName)}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{config.subtitle}</p>
        </div>

        <div className="rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] bg-white dark:bg-[#18181b] p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${config.badgeColor}`}>
              {mode === 'deactivate' ? 'Baja lógica' : 'Reactivación'}
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Titular</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{fullName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-[#007a8a]">location_on</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dirección</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{titular.direccion}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-[#007a8a]">groups</span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Pasajeros asociados</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{pasajerosLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={config.confirmVariant}
            disabled={isPending}
            onClick={handleConfirm}
            className="w-full sm:flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                {mode === 'deactivate' ? 'Inactivando...' : 'Reactivando...'}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
                {config.confirmLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
