/* eslint-disable react-refresh/only-export-components -- Provider + hook comparten contexto, ver ToastProvider/useToast para el mismo patrón */
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface PrivacyModeContextValue {
  hidden: boolean;
  toggle: () => void;
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | undefined>(undefined);

interface PrivacyModeProviderProps {
  children: ReactNode;
}

export const PrivacyModeProvider = ({ children }: PrivacyModeProviderProps) => {
  const [hidden, setHidden] = useState(false);

  // Value memoizado: todos los <Amount> de la app consumen este contexto
  const value = useMemo<PrivacyModeContextValue>(
    () => ({ hidden, toggle: () => setHidden((prev) => !prev) }),
    [hidden],
  );

  return <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>;
};

export const usePrivacyMode = (): PrivacyModeContextValue => {
  const context = useContext(PrivacyModeContext);
  if (!context) {
    throw new Error('usePrivacyMode debe usarse dentro de PrivacyModeProvider');
  }
  return context;
};
