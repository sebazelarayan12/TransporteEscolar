import { useSyncExternalStore } from 'react';

const noopUnsubscribe = () => undefined;

/** true mientras el viewport cumple la media query; se actualiza al redimensionar. */
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return noopUnsubscribe;

      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
