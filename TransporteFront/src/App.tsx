import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './shared/ui/ToastProvider';
import { ErrorBoundary } from './shared/ui/ErrorBoundary';
import { PrivacyModeProvider } from './shared/hooks/usePrivacyMode';
import { MainLayout } from './app/MainLayout';
import { RequireAuth } from './auth/components/RequireAuth';
import { SESSION_EVENT, getSession } from './auth/helpers/session.storage';
import { Spinner } from './shared/ui/Spinner';
import {
  subscribeToPush,
  isPushSupported,
  isSubscribedToPush,
  getNotificationPermission,
  iniciarSincronizacionTokenPush,
} from './notificaciones/services/push.service';

const DashboardPage = lazy(() =>
  import('./app/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);
const TitularesListPage = lazy(() =>
  import('./titulares/pages/TitularesListPage').then((module) => ({ default: module.TitularesListPage }))
);
const TitularDetailPage = lazy(() =>
  import('./titulares/pages/TitularDetailPage').then((module) => ({ default: module.TitularDetailPage }))
);
const TitularCreatePage = lazy(() =>
  import('./titulares/pages/TitularCreatePage').then((module) => ({ default: module.TitularCreatePage }))
);
const PasajerosListPage = lazy(() =>
  import('./pasajeros/pages/PasajerosListPage').then((module) => ({ default: module.PasajerosListPage }))
);
const PasajeroCreatePage = lazy(() =>
  import('./pasajeros/pages/PasajeroCreatePage').then((module) => ({ default: module.PasajeroCreatePage }))
);
const ReinscripcionesListPage = lazy(() =>
  import('./reinscripciones/pages/ReinscripcionesListPage').then((module) => ({ default: module.ReinscripcionesListPage }))
);
const HorariosPage = lazy(() =>
  import('./horarios/pages/HorariosPage').then((module) => ({ default: module.HorariosPage }))
);
// const ReinscripcionCreatePage = lazy(() =>
//   import('./reinscripciones/pages/ReinscripcionCreatePage').then((module) => ({ default: module.ReinscripcionCreatePage }))
// );
const PagosListPage = lazy(() =>
  import('./pagos/pages/PagosListPage').then((module) => ({ default: module.PagosListPage }))
);
const PagosMovimientosPage = lazy(() =>
  import('./pagos/pages/PagosMovimientosPage').then((module) => ({ default: module.PagosMovimientosPage }))
);
const GastosControlPage = lazy(() =>
  import('./gastos/pages/GastosControlPage').then((module) => ({ default: module.GastosControlPage }))
);
const AnalisisKilometrosPage = lazy(() =>
  import('./recorridos/pages/AnalisisKilometrosPage').then((module) => ({ default: module.AnalisisKilometrosPage }))
);
const LoginPage = lazy(() =>
  import('./auth/pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import('./app/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);

// Configuración de TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  // Sin sesión (cierre manual o token vencido) se vacía el caché: los datos del servidor no deben
  // quedar en memoria para quien entre después en el mismo navegador.
  useEffect(() => {
    const alCambiarSesion = () => {
      if (!getSession()) queryClient.clear();
    };
    window.addEventListener(SESSION_EVENT, alCambiarSesion);
    return () => window.removeEventListener(SESSION_EVENT, alCambiarSesion);
  }, []);

  useEffect(() => {
    if (!isPushSupported() || getNotificationPermission() === 'denied') return;
    iniciarSincronizacionTokenPush();
    isSubscribedToPush().then((alreadySubscribed) => {
      if (!alreadySubscribed) subscribeToPush();
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PrivacyModeProvider>
        <ToastProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<Spinner size="lg" />}>
                      <LoginPage />
                    </Suspense>
                  }
                />
                <Route element={<RequireAuth />}>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="titulares" element={<TitularesListPage />} />
                    <Route path="titulares/nuevo" element={<TitularCreatePage />} />
                    <Route path="titulares/:id" element={<TitularDetailPage />} />
                    <Route path="pasajeros" element={<PasajerosListPage />} />
                    <Route path="pasajeros/nuevo" element={<PasajeroCreatePage />} />
                    <Route path="horarios" element={<HorariosPage />} />
                    <Route path="reinscripciones" element={<ReinscripcionesListPage />} />
                    {/* <Route path="reinscripciones/nueva" element={<ReinscripcionCreatePage />} /> */}
                    <Route path="pagos" element={<PagosListPage />} />
                    <Route path="pagos/movimientos" element={<PagosMovimientosPage />} />
                    <Route path="gastos" element={<GastosControlPage />} />
                    <Route path="recorridos" element={<AnalisisKilometrosPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </ToastProvider>
      </PrivacyModeProvider>
    </QueryClientProvider>
  );
}

export default App;
