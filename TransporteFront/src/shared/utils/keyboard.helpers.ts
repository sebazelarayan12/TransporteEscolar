import type { KeyboardEvent } from 'react';

/**
 * Devuelve un handler de teclado que ejecuta `action` al presionar Enter o Espacio.
 * Útil para elementos no nativamente interactivos (filas, tarjetas) que ya tienen onClick.
 */
export const onActivationKey =
  (action: () => void) =>
  (event: KeyboardEvent<HTMLElement>): void => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };
