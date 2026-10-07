import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../MainLayout';
import { PrivacyModeProvider } from '../../shared/hooks/usePrivacyMode';
import { getSession, saveSession } from '../../auth/helpers/session.storage';

vi.mock('../../notificaciones/components/NotificacionesDropdown', () => ({
  NotificacionesDropdown: () => null,
}));

beforeEach(() => {
  localStorage.clear();
});

describe('MainLayout: cerrar sesión', () => {
  it('el botón limpia la sesión y vuelve al login', async () => {
    saveSession({ token: 'abc', expiraEn: new Date(Date.now() + 3600_000).toISOString() });
    const user = userEvent.setup();

    render(
      <PrivacyModeProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/login" element={<p>Pantalla de login</p>} />
            <Route path="/" element={<MainLayout />} />
          </Routes>
        </MemoryRouter>
      </PrivacyModeProvider>,
    );

    const botones = screen.getAllByRole('button', { name: 'Cerrar sesión' });
    await user.click(botones[0]);

    expect(getSession()).toBeNull();
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
  });
});
