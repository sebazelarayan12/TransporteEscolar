import type { ReactNode, TouchEvent } from 'react';
import { useRef } from 'react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const CLOSE_DRAG_THRESHOLD_PX = 100;

export const MobileDrawer = ({ isOpen, onClose, children }: MobileDrawerProps) => {
  // Los valores del arrastre solo se leen en handlers, no se muestran: refs en vez de state
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll del body cuando el drawer está abierto
  useLockBodyScroll(isOpen);

  const handleTouchStart = (e: TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (dragStartY.current === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;

    // Solo permitir arrastrar hacia abajo
    if (diff > 0) {
      dragCurrentY.current = currentY;

      // Aplicar transformación al drawer
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${diff}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY.current === null || dragCurrentY.current === null) return;

    const diff = dragCurrentY.current - dragStartY.current;

    // Si arrastró más de 100px, cerrar el drawer
    if (diff > CLOSE_DRAG_THRESHOLD_PX) {
      onClose();
    }

    // Resetear posición
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }

    dragStartY.current = null;
    dragCurrentY.current = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar panel"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="relative w-full bg-white dark:bg-[#27272a] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up transition-transform"
        style={{ touchAction: 'none' }}
      >
        {/* Handle para arrastrar */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Contenido del drawer */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
