import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './shared/ui';
import { MainLayout } from './app/MainLayout';
import { DashboardPage } from './app/DashboardPage';
import { NotFoundPage } from './app/NotFoundPage';
import { TitularesListPage } from './titulares/pages/TitularesListPage';
import { TitularDetailPage } from './titulares/pages/TitularDetailPage';
import { TitularCreatePage } from './titulares/pages/TitularCreatePage';
import { PasajerosListPage } from './pasajeros/pages/PasajerosListPage';
import { PasajeroCreatePage } from './pasajeros/pages/PasajeroCreatePage';
import { PagosListPage } from './pagos';
import { ReinscripcionesListPage } from './reinscripciones';

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
              <Route path="pagos" element={<PagosListPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
