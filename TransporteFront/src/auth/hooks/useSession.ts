import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { SESSION_EVENT, clearSession, getSession } from '../helpers/session.storage';

const suscribir = (onChange: () => void) => {
  window.addEventListener(SESSION_EVENT, onChange);
  return () => window.removeEventListener(SESSION_EVENT, onChange);
};

// Snapshot primitivo (token o '') para que useSyncExternalStore compare por valor.
const leerToken = () => getSession()?.token ?? '';

export const useSession = () => {
  const navigate = useNavigate();
  const autenticado = useSyncExternalStore(suscribir, leerToken, () => '') !== '';

  const cerrarSesion = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return { autenticado, cerrarSesion };
};
