import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './app/MainLayout';
import { DashboardPage } from './app/DashboardPage';
import { TitularesListPage } from './titulares/pages/TitularesListPage';
import { TitularDetailPage } from './titulares/pages/TitularDetailPage';
import { PasajerosListPage } from './pasajeros/pages/PasajerosListPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="titulares" element={<TitularesListPage />} />
            <Route path="titulares/:id" element={<TitularDetailPage />} />
            <Route path="pasajeros" element={<PasajerosListPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
