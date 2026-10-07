import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { authApi } from '../../services/auth.api';
import { getSession } from '../../helpers/session.storage';

vi.mock('../../services/auth.api', () => ({
  authApi: { login: vi.fn() },
}));

const loginMock = vi.mocked(authApi.login);

const montar = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/pagos' } } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pagos" element={<p>Pantalla de pagos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('valida los campos vacíos sin llamar a la API', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresá tu usuario')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña')).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('envía las credenciales, guarda la sesión y navega al origen', async () => {
    const expiraEn = new Date(Date.now() + 3600_000).toISOString();
    loginMock.mockResolvedValue({ token: 'jwt', expiraEn });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Pantalla de pagos')).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledWith({ usuario: 'admin', password: 'secreta' });
    expect(getSession()).toEqual({ token: 'jwt', expiraEn });
  });

  it('muestra el mensaje para un 401', async () => {
    loginMock.mockRejectedValue({ status: 401, message: 'x', errors: {} });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
    await waitFor(() => expect(getSession()).toBeNull());
  });

  it('muestra el mensaje para un 503', async () => {
    loginMock.mockRejectedValue({ status: 503, message: 'x', errors: {} });
    const user = userEvent.setup();
    montar();

    await user.type(screen.getByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), 'clave');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El servidor no tiene el acceso configurado')).toBeInTheDocument();
  });
});
