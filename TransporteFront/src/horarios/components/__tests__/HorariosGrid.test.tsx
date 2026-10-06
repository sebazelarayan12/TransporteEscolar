import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HorariosGrid } from '../HorariosGrid';
import type { HorarioResponse } from '../../types/horario.types';

const crearHorario = (overrides: Partial<HorarioResponse> = {}): HorarioResponse => ({
  id: 1,
  etiqueta: '8 San Patricio',
  orden: 1,
  pasajerosActivos: 0,
  conteosPorTransporte: { transporteUno: 0, transporteDos: 0 },
  sentido: 'Ida',
  colegioId: 1,
  colegioNombre: 'San Patricio',
  activo: true,
  ...overrides,
});

const renderGrid = (horarios: HorarioResponse[]) => {
  const onSelectHorario = vi.fn();
  const onEditar = vi.fn();
  const onReactivar = vi.fn();

  render(
    <HorariosGrid
      horarios={horarios}
      onSelectHorario={onSelectHorario}
      onEditar={onEditar}
      onReactivar={onReactivar}
    />,
  );

  return { onSelectHorario, onEditar, onReactivar };
};

describe('HorariosGrid', () => {
  it('una tarjeta activa muestra Gestionar y no muestra Reactivar', () => {
    renderGrid([crearHorario()]);

    expect(screen.getByRole('button', { name: /^Gestionar/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reactivar/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
  });

  it('una tarjeta inactiva muestra la insignia y Reactivar, sin ningún Gestionar', () => {
    renderGrid([crearHorario({ activo: false })]);

    expect(screen.getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reactivar/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gestionar/ })).not.toBeInTheDocument();
  });

  it('los botones Editar y Reactivar de una tarjeta inactiva no quedan atenuados', () => {
    renderGrid([crearHorario({ activo: false })]);

    const editar = screen.getByRole('button', { name: /Editar horario/ });
    const reactivar = screen.getByRole('button', { name: /Reactivar horario/ });

    expect(editar.closest('.opacity-60')).toBeNull();
    expect(reactivar.closest('.opacity-60')).toBeNull();
  });

  it('clic en Editar llama a onEditar con ese horario', async () => {
    const user = userEvent.setup();
    const horario = crearHorario({ id: 7, etiqueta: '13:30 Boisdron Salida' });
    const { onEditar } = renderGrid([crearHorario(), horario]);

    await user.click(screen.getByRole('button', { name: 'Editar horario 13:30 Boisdron Salida' }));

    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(onEditar).toHaveBeenCalledWith(horario);
  });

  it('clic en Reactivar llama a onReactivar con ese horario', async () => {
    const user = userEvent.setup();
    const horario = crearHorario({ id: 9, etiqueta: '17 Boisdron', activo: false });
    const { onReactivar } = renderGrid([crearHorario(), horario]);

    await user.click(screen.getByRole('button', { name: 'Reactivar horario 17 Boisdron' }));

    expect(onReactivar).toHaveBeenCalledTimes(1);
    expect(onReactivar).toHaveBeenCalledWith(horario);
  });

  it('el contador cuenta solo los horarios activos', () => {
    renderGrid([
      crearHorario({ id: 1 }),
      crearHorario({ id: 2, etiqueta: '9 Boisdron' }),
      crearHorario({ id: 3, etiqueta: '10 Otro', activo: false }),
    ]);

    expect(screen.getByText('2 horarios activos')).toBeInTheDocument();
  });
});
