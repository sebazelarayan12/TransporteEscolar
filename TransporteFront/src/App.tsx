import { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './shared/ui/ToastProvider';
import { MainLayout } from './app/MainLayout';

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
// const ReinscripcionCreatePage = lazy(() =>
//   import('./reinscripciones/pages/ReinscripcionCreatePage').then((module) => ({ default: module.ReinscripcionCreatePage }))
// );
const PagosListPage = lazy(() =>
  import('./pagos/pages/PagosListPage').then((module) => ({ default: module.PagosListPage }))
);
const PagosMovimientosPage = lazy(() =>
  import('./pagos/pages/PagosMovimientosPage').then((module) => ({ default: module.PagosMovimientosPage }))
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
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="titulares" element={<TitularesListPage />} />
              <Route path="titulares/nuevo" element={<TitularCreatePage />} />
              <Route path="titulares/:id" element={<TitularDetailPage />} />
              <Route path="pasajeros" element={<PasajerosListPage />} />
              <Route path="pasajeros/nuevo" element={<PasajeroCreatePage />} />
              <Route path="reinscripciones" element={<ReinscripcionesListPage />} />
              {/* <Route path="reinscripciones/nueva" element={<ReinscripcionCreatePage />} /> */}
              <Route path="pagos" element={<PagosListPage />} />
              <Route path="pagos/movimientos" element={<PagosMovimientosPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
