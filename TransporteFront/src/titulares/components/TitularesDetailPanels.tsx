import type { TitularResponse } from '../types/titular.types';
import { TitularDetailPanel } from './TitularDetailPanel';

interface TitularesDetailPanelsProps {
  selectedTitular: TitularResponse | null;
  isPanelExpanded: boolean;
  showMobileDrawer: boolean;
  onClosePanel: () => void;
  onCloseMobileDrawer: () => void;
  onExpandPanel: () => void;
}

/**
 * Paneles de detalle del titular: lateral en desktop (con overlay y botón flotante en LG)
 * y drawer inferior en mobile.
 */
export const TitularesDetailPanels = ({
  selectedTitular,
  isPanelExpanded,
  showMobileDrawer,
  onClosePanel,
  onCloseMobileDrawer,
  onExpandPanel,
}: TitularesDetailPanelsProps) => (
  <>
    {/* Desktop Side Panel - Sticky con altura fija y scroll */}
    <div className={`hidden lg:block ${isPanelExpanded ? '' : 'lg:hidden xl:block'}`}>
      <div
        className={`
          flex h-[600px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]
          lg:fixed lg:right-0 lg:top-0 lg:z-50 lg:h-screen lg:w-[400px] lg:rounded-none lg:shadow-2xl
          xl:sticky xl:top-6 xl:h-[600px] xl:w-full xl:rounded-xl xl:shadow-sm
        `}
      >
        <div className="flex-1 overflow-y-auto">
          <TitularDetailPanel titular={selectedTitular} onClose={onClosePanel} />
        </div>
      </div>
    </div>

    {/* Overlay para LG cuando el panel está expandido */}
    {isPanelExpanded && selectedTitular && (
      <button
        type="button"
        aria-label="Cerrar panel de detalle de titular"
        onClick={onClosePanel}
        className="fixed inset-0 z-40 hidden cursor-default bg-black/50 transition-opacity duration-300 lg:block xl:hidden"
      />
    )}

    {/* Botón flotante para abrir panel en LG */}
    {selectedTitular && !isPanelExpanded && (
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
    {showMobileDrawer && selectedTitular && (
      <div className="fixed inset-0 z-50 flex items-end lg:hidden">
        <button
          type="button"
          aria-label="Cerrar panel flotante del titular"
          onClick={onCloseMobileDrawer}
          className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        />
        <div className="relative flex max-h-[85vh] w-full animate-slide-up flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#27272a]">
          <div className="flex justify-center pb-2 pt-3">
            <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <TitularDetailPanel titular={selectedTitular} onClose={onCloseMobileDrawer} />
        </div>
      </div>
    )}
  </>
);
