import type { ReactNode, TouchEvent } from 'react';
import { useRef, useState } from 'react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const MobileDrawer = ({ isOpen, onClose, children }: MobileDrawerProps) => {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // Bloquear scroll del body cuando el drawer está abierto
  useLockBodyScroll(isOpen);

  const handleTouchStart = (e: TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (dragStartY === null) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    
    // Solo permitir arrastrar hacia abajo
    if (diff > 0) {
      setDragCurrentY(currentY);
      
      // Aplicar transformación al drawer
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${diff}px)`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragStartY === null || dragCurrentY === null) return;
    
    const diff = dragCurrentY - dragStartY;
    
    // Si arrastró más de 100px, cerrar el drawer
    if (diff > 100) {
      onClose();
    }
    
    // Resetear posición
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }
    
    setDragStartY(null);
    setDragCurrentY(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
