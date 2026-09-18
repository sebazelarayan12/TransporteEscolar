import { type KeyboardEvent, type RefObject, useEffect, useState } from 'react';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { computeMobileMenuAnchor, type MobileMenuAnchor } from '../helpers/card-menu.helpers';

/**
 * Estado del menú de acciones de una tarjeta. En mobile la tarjeta completa actúa
 * como disparador y el menú se ancla a su posición en pantalla.
 * `cardRef` (del elemento de la tarjeta) lo provee el componente y solo se lee en handlers y efectos.
 */
export const useGastoCardMenu = (cardRef: RefObject<HTMLElement | null>, isInteractive: boolean) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<MobileMenuAnchor | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const cardControlsMenu = isInteractive && isMobile;

  const handleMenuOpenChange = (nextOpen: boolean) => {
    setMobileMenuAnchor(nextOpen && cardControlsMenu ? computeMobileMenuAnchor(cardRef.current) : null);
    setIsMenuOpen(nextOpen);
  };

  // Si las acciones dejan de estar disponibles con el menú abierto, se cierra.
  useEffect(() => {
    if (isInteractive || !isMenuOpen) return;

    queueMicrotask(() => {
      setIsMenuOpen(false);
      setMobileMenuAnchor(null);
    });
  }, [isInteractive, isMenuOpen]);

  // Reancla el menú mobile al hacer scroll o redimensionar.
  useEffect(() => {
    if (!cardControlsMenu || !isMenuOpen) return;

    const updateAnchor = () => setMobileMenuAnchor(computeMobileMenuAnchor(cardRef.current));
    updateAnchor();

    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    return () => {
      window.removeEventListener('resize', updateAnchor);
      window.removeEventListener('scroll', updateAnchor, true);
    };
  }, [cardControlsMenu, isMenuOpen, cardRef]);

  const toggleMenu = () => handleMenuOpenChange(!isMenuOpen);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
    }
  };

  return {
    isMenuOpen,
    isMobile,
    mobileMenuAnchor,
    cardControlsMenu,
    handleMenuOpenChange,
    // Props del elemento que dispara el menú (solo cuando la tarjeta completa lo controla)
    cardTriggerProps: cardControlsMenu
      ? {
          role: 'button' as const,
          tabIndex: 0,
          'aria-haspopup': 'menu' as const,
          'aria-expanded': isMenuOpen,
          onClick: toggleMenu,
          onKeyDown: handleKeyDown,
        }
      : {},
  };
};
