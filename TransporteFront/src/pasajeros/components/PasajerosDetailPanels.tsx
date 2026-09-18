import { MobileDrawer } from '../../shared/ui/MobileDrawer';
import type { PasajeroResponse } from '../types/pasajero.types';
import { PasajeroDetailPanel } from './PasajeroDetailPanel';

interface PasajerosDetailPanelsProps {
  selectedPasajero: PasajeroResponse | null;
  isPanelExpanded: boolean;
  showMobileDrawer: boolean;
  onClosePanel: () => void;
  onCloseDrawer: () => void;
  onExpandPanel: () => void;
}

/**
 * Paneles de detalle del pasajero: lateral en desktop (con overlay y botón flotante en LG)
 * y drawer inferior en mobile.
 */
export const PasajerosDetailPanels = ({
  selectedPasajero,
  isPanelExpanded,
  showMobileDrawer,
  onClosePanel,
  onCloseDrawer,
  onExpandPanel,
}: PasajerosDetailPanelsProps) => (
  <>
    {/* Desktop Side Panel - Sticky con altura fija y scroll */}
    <div className={`hidden lg:block ${isPanelExpanded ? '' : 'lg:hidden xl:block'}`}>
      <div
        className={`
          flex h-[600px] flex-col overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]
          lg:fixed lg:right-0 lg:top-0 lg:z-50 lg:h-screen lg:w-80 lg:rounded-none lg:shadow-2xl xl:w-96
          xl:sticky xl:top-6 xl:h-[600px] xl:w-full xl:rounded-2xl xl:shadow-sm
        `}
      >
        <div className="flex-1 overflow-y-auto">
          <PasajeroDetailPanel pasajero={selectedPasajero} onClose={onClosePanel} />
        </div>
      </div>
    </div>

    {/* Overlay para LG cuando el panel está expandido */}
    {isPanelExpanded && selectedPasajero && (
      <button
        type="button"
        aria-label="Cerrar panel de detalle de pasajero"
        onClick={onClosePanel}
        className="fixed inset-0 z-40 hidden cursor-default bg-black/50 transition-opacity duration-300 lg:block xl:hidden"
      />
    )}

    {/* Botón flotante para abrir panel en LG */}
    {selectedPasajero && !isPanelExpanded && (
      <button
        type="button"
        onClick={onExpandPanel}
        className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-[#007a8a] px-6 py-3 text-white shadow-lg transition hover:scale-105 hover:bg-[#00626e] lg:flex xl:hidden"
      >
        <span className="material-symbols-outlined text-[20px]">info</span>
        <span className="text-sm font-bold">Ver Detalles</span>
      </button>
    )}

    {/* Mobile Drawer - From Bottom */}
    <MobileDrawer isOpen={showMobileDrawer && !!selectedPasajero} onClose={onCloseDrawer}>
      {selectedPasajero && <PasajeroDetailPanel pasajero={selectedPasajero} onClose={onCloseDrawer} />}
    </MobileDrawer>
  </>
);
