import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HorarioFormModal } from '../../components/HorarioFormModal';
import { useHorarioEdicion } from '../useHorarioEdicion';

const crearMutateAsync = vi.fn();
const showSuccess = vi.fn();
const showError = vi.fn();

vi.mock('../../../shared/hooks/useToast', () => ({
  useToast: () => ({ showSuccess, showError }),
}));

vi.mock('../../services/horarios.queries', () => ({
  useCrearHorario: () => ({ mutateAsync: crearMutateAsync, isPending: false }),
  useActualizarHorario: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDesactivarHorario: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReactivarHorario: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../../recorridos/services/recorridos.queries', () => ({
  useColegios: () => ({
    data: [{ id: 2, nombre: 'Boisdron', direccion: 'Calle 2', latitud: 0, longitud: 0 }],
    isLoading: false,
    isError: false,
  }),
}));

beforeAll(() => {
  window.scrollTo = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Monta el modal igual que HorariosPage: con la key y las props que entrega el hook.
const Harness = () => {
  const edicion = useHorarioEdicion();

  return (
    <>
      <button type="button" onClick={edicion.abrirCreacion}>
        Abrir creación
      </button>
      <HorarioFormModal
        key={edicion.modalKey}
        isOpen={edicion.modalAbierto}
        horario={edicion.horarioEditando}
        onClose={edicion.cerrarModal}
        onSave={edicion.guardar}
        onDesactivar={edicion.desactivar}
        isSaving={edicion.isSaving}
      />
    </>
  );
};

describe('useHorarioEdicion (crear)', () => {
  it('el formulario de creación se reinicia al volver a abrirlo', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir creación' }));
    await user.type(screen.getByLabelText(/^Hora/), '14');
    await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
    await user.click(screen.getByRole('button', { name: /Cancelar/ }));

    await user.click(screen.getByRole('button', { name: 'Abrir creación' }));

    expect(screen.getByLabelText(/^Hora/)).toHaveValue('');
    expect(screen.getByLabelText(/^Descripción/)).toHaveValue('');
  });

  it('al crear con éxito llama a la API, avisa y cierra el modal', async () => {
    crearMutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir creación' }));
    await user.type(screen.getByLabelText(/^Hora/), '14');
    await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
    await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
    await user.click(screen.getByRole('button', { name: /Crear horario/ }));

    await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Horario creado'));
    expect(crearMutateAsync).toHaveBeenCalledWith({
      etiqueta: '14 Boisdron Entrada',
      orden: null,
      colegioId: 2,
      sentido: 'Ida',
    });
    expect(screen.queryByLabelText(/^Hora/)).not.toBeInTheDocument();
  });

  it('si el backend rechaza, muestra el mensaje tal cual y deja el modal abierto', async () => {
    crearMutateAsync.mockRejectedValue({ message: 'Ya existe un horario con esa etiqueta' });
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Abrir creación' }));
    await user.type(screen.getByLabelText(/^Hora/), '14');
    await user.type(screen.getByLabelText(/^Descripción/), 'Boisdron Entrada');
    await user.selectOptions(screen.getByLabelText(/^Colegio/), '2');
    await user.click(screen.getByRole('button', { name: /Crear horario/ }));

    await waitFor(() => expect(showError).toHaveBeenCalledWith('Ya existe un horario con esa etiqueta'));
    expect(showSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Hora/)).toBeInTheDocument();
  });
});
