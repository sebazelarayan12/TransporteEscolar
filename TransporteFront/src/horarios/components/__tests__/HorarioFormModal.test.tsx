import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HorarioFormModal } from '../HorarioFormModal';
import type { HorarioResponse } from '../../types/horario.types';

vi.mock('../../../recorridos/services/recorridos.queries', () => ({
  useColegios: () => ({
    data: [
      { id: 1, nombre: 'San Patricio', direccion: 'Calle 1', latitud: 0, longitud: 0 },
      { id: 2, nombre: 'Boisdron', direccion: 'Calle 2', latitud: 0, longitud: 0 },
    ],
    isLoading: false,
    isError: false,
  }),
}));

// useLockBodyScroll (Modal) llama a window.scrollTo, que jsdom no implementa.
beforeAll(() => {
  window.scrollTo = vi.fn();
});

const crearHorario =(overrides: Partial<HorarioResponse> = {}): HorarioResponse => ({
  id: 5,
  etiqueta: '8 San Patricio',
  orden: 3,
  pasajerosActivos: 0,
  conteosPorTransporte: { transporteUno: 0, transporteDos: 0 },
  sentido: 'Ida',
  colegioId: 1,
  colegioNombre: 'San Patricio',
  activo: true,
  ...overrides,
});

const renderModal = (horario: HorarioResponse | null, props: Partial<Parameters<typeof HorarioFormModal>[0]> = {}) => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onDesactivar = vi.fn().mockResolvedValue(undefined);

  render(
    <HorarioFormModal
      isOpen
      horario={horario}
      onClose={vi.fn()}
      onSave={onSave}
      onDesactivar={onDesactivar}
      isSaving={false}
      {...props}
    />,
  );

  return { onSave, onDesactivar };
};

describe('HorarioFormModal', () => {
  it('al editar parte la etiqueta en hora y descripción', () => {
    renderModal(crearHorario({ etiqueta: '13:30 Boisdron Salida' }));

    expect(screen.getByLabelText(/^Hora/)).toHaveValue('13:30');
    expect(screen.getByLabelText(/^Descripción/)).toHaveValue('Boisdron Salida');
  });

  it('con pasajeros activos bloquea colegio y sentido y muestra el aviso', () => {
    renderModal(crearHorario({ pasajerosActivos: 4 }));

    expect(screen.getByLabelText(/^Colegio/)).toBeDisabled();
    expect(screen.getByLabelText(/^Sentido/)).toBeDisabled();
    expect(screen.getByText(/4 pasajeros activos/)).toBeInTheDocument();
  });

  it('sin pasajeros activos colegio y sentido están habilitados y no hay aviso', () => {
    renderModal(crearHorario({ pasajerosActivos: 0 }));

    expect(screen.getByLabelText(/^Colegio/)).toBeEnabled();
    expect(screen.getByLabelText(/^Sentido/)).toBeEnabled();
    expect(screen.queryByText(/pasajeros? activos?:/)).not.toBeInTheDocument();
  });

  it('al enviar llama a onSave con la etiqueta armada', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(crearHorario());

    const hora = screen.getByLabelText(/^Hora/);
    await user.clear(hora);
    await user.type(hora, '8:15');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ etiqueta: '8:15 San Patricio', orden: 3, colegioId: 1, sentido: 'Ida' });
  });

  it('con pasajeros activos igual envía el colegio y el sentido originales al guardar', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(crearHorario({ pasajerosActivos: 3, colegioId: 2, sentido: 'Vuelta' }));

    const orden = screen.getByLabelText(/^Orden/);
    await user.clear(orden);
    await user.type(orden, '7');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ etiqueta: '8 San Patricio', orden: 7, colegioId: 2, sentido: 'Vuelta' });
  });

  it('con pasajeros activos no se puede desactivar el horario', () => {
    renderModal(crearHorario({ pasajerosActivos: 2 }));

    expect(screen.getByRole('button', { name: 'Desactivar horario' })).toBeDisabled();
    expect(screen.getByText(/Reasigná primero sus 2 pasajeros/)).toBeInTheDocument();
  });

  it('sin pasajeros activos pide confirmación antes de desactivar', async () => {
    const user = userEvent.setup();
    const { onDesactivar } = renderModal(crearHorario());

    await user.click(screen.getByRole('button', { name: 'Desactivar horario' }));
    expect(onDesactivar).not.toHaveBeenCalled();
    expect(screen.getByText(/No se borra nada/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Desactivar$/ }));
    await waitFor(() => expect(onDesactivar).toHaveBeenCalledTimes(1));
  });

  it('al editar el orden es obligatorio: vacío muestra el error y no llama a onSave', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(crearHorario({ orden: 3 }));

    const orden = screen.getByLabelText(/^Orden/);
    expect(orden).toHaveValue(3);
    await user.clear(orden);
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

    expect(await screen.findByText(/El orden debe ser 1 o más/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('en un horario inactivo no ofrece desactivar', () => {
    renderModal(crearHorario({ activo: false }));

    expect(screen.queryByRole('button', { name: 'Desactivar horario' })).not.toBeInTheDocument();
    expect(screen.queryByText(/No se borra nada/)).not.toBeInTheDocument();
  });

  it('en un horario inactivo con pasajeros tampoco muestra el texto de ayuda de desactivar', () => {
    renderModal(crearHorario({ activo: false, pasajerosActivos: 2 }));

    expect(screen.queryByText(/Reasigná primero sus/)).not.toBeInTheDocument();
  });

  it('en un horario inactivo el formulario sigue editable y se puede guardar', async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal(crearHorario({ activo: false }));

    const hora = screen.getByLabelText(/^Hora/);
    await user.clear(hora);
    await user.type(hora, '9');
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith({ etiqueta: '9 San Patricio', orden: 3, colegioId: 1, sentido: 'Ida' });
  });

  it('nunca ofrece borrar el horario', () => {
    renderModal(crearHorario());

    expect(screen.queryByRole('button', { name: /eliminar|borrar/i })).not.toBeInTheDocument();
  });

  describe('modo crear (horario null)', () => {
    it('muestra "Nuevo horario", arranca vacío y no ofrece desactivar', () => {
      renderModal(null);

      expect(screen.getByText('Nuevo horario')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Hora/)).toHaveValue('');
      expect(screen.getByLabelText(/^Descripción/)).toHaveValue('');
      expect(screen.getByLabelText(/^Sentido/)).toHaveValue('Ida');
      expect(screen.getByLabelText(/^Orden/)).toHaveValue(null);
      expect(screen.getByPlaceholderText('Al final (automático)')).toBeInTheDocument();
      expect(screen.getByText('Dejalo vacío para ponerlo al final')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear horario/ })).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Desactivar horario' })).not.toBeInTheDocument();
      expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    it('Colegio y Sentido están siempre habilitados', () => {
      renderModal(null);

      expect(screen.getByLabelText(/^Colegio/)).toBeEnabled();
      expect(screen.getByLabelText(/^Sentido/)).toBeEnabled();
    });

    it('con datos válidos llama a onSave con el horario nuevo', async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal(null);

      await user.type(screen.getByLabelText(/^Hora/), '14');
      await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
      await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
      const orden = screen.getByLabelText(/^Orden/);
      await user.clear(orden);
      await user.type(orden, '7');
      await user.click(screen.getByRole('button', { name: /Crear horario/ }));

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith({ etiqueta: '14 Boisdron Entrada', orden: 7, colegioId: 2, sentido: 'Ida' });
    });

    it('con el orden vacío envía orden null para que quede al final', async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal(null);

      await user.type(screen.getByLabelText(/^Hora/), '14');
      await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
      await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
      await user.click(screen.getByRole('button', { name: /Crear horario/ }));

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave).toHaveBeenCalledWith({ etiqueta: '14 Boisdron Entrada', orden: null, colegioId: 2, sentido: 'Ida' });
    });

    it('con orden 0 muestra el error y no llama a onSave', async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal(null);

      await user.type(screen.getByLabelText(/^Hora/), '14');
      await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
      await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
      await user.type(screen.getByLabelText(/^Orden/), '0');
      await user.click(screen.getByRole('button', { name: /Crear horario/ }));

      expect(await screen.findByText(/El orden debe ser 1 o más/)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('con la hora vacía no llama a onSave y muestra el error', async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal(null);

      await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
      await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
      await user.click(screen.getByRole('button', { name: /Crear horario/ }));

      expect(await screen.findByText(/Ingresá la hora/)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
