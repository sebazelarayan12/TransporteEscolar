import { type RefObject, useEffect, useRef } from 'react';

/**
 * Ejecuta `onOutside` cuando se hace click fuera del elemento referenciado.
 * Solo escucha mientras `enabled` sea true.
 */
export const useClickOutside = (ref: RefObject<HTMLElement | null>, enabled: boolean, onOutside: () => void) => {
  const onOutsideRef = useRef(onOutside);

  useEffect(() => {
    onOutsideRef.current = onOutside;
  });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideRef.current();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [enabled, ref]);
};
