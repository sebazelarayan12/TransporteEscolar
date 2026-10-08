import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import { saveSession } from '../../helpers/session.storage';

const LoginSpy = () => {
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  return <p>Pantalla de login, vino de {from}</p>;
};

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/pagos']}>
      <Routes>
        <Route path="/login" element={<LoginSpy />} />
        <Route element={<RequireAuth />}>
          <Route path="/pagos" element={<p>Contenido protegido</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
});

describe('RequireAuth', () => {
  it('sin sesión redirige al login recordando la ruta de origen', () => {
    montar();

    expect(screen.getByText('Pantalla de login, vino de /pagos')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('con sesión muestra el contenido', () => {
    saveSession({ token: 'abc', expiraEn: new Date(Date.now() + 3600_000).toISOString() });

    montar();

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
