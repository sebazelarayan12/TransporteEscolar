import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

/** Guardia de rutas: sin sesión redirige al login recordando a dónde quería ir. */
export const RequireAuth = () => {
  const { autenticado } = useSession();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
