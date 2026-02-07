import { Link } from 'react-router-dom';
import type { TitularResponse } from '../types/titular.types';
import { TitularDetailHeader } from './TitularDetailHeader';
import { TitularPhoneList } from './TitularPhoneList';
import { TitularPasajerosList } from './TitularPasajerosList';
import { TitularInfoSection } from './TitularInfoSection';
import { usePasajerosByTitular } from '../../pasajeros/services/pasajeros.queries';
import { useTitularTelefonos } from '../services/titulares.queries';

interface TitularDetailPanelProps {
  titular: TitularResponse | null;
  onClose?: () => void;
}

export const TitularDetailPanel = ({ titular, onClose }: TitularDetailPanelProps) => {
  const titularId = titular?.id;
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
        />
        <TitularPasajerosList
          pasajeros={pasajeros}
          isLoading={pasajerosLoading}
          error={pasajerosError ? 'No se pudieron cargar los pasajeros.' : undefined}
          onRetry={refetchPasajeros}
        />
        <TitularInfoSection titular={titular} />
      </div>

      <div className="p-4 border-t border-[#e4e4e7] dark:border-[#3f3f46] bg-gray-50 dark:bg-white/5 flex gap-3 sticky bottom-0">
        <Link to={`/titulares/${titular.id}`} className="flex-1">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
        </Link>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white dark:bg-[#27272a] border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 font-bold text-sm shadow-sm hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 transition-colors">
          <span className="material-symbols-outlined text-[18px]">block</span>
          Inactivar
        </button>
      </div>
    </>
  );
};
