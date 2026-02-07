using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class ReinscripcionService : IReinscripcionService
{
    private readonly IReinscripcionRepository _repository;
    private readonly IPasajeroRepository _pasajeroRepository;

    public ReinscripcionService(
        IReinscripcionRepository repository,
        IPasajeroRepository pasajeroRepository)
    {
        _repository = repository;
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<ReinscripcionModel.ResponseDetallada>> ObtenerTodosAsync(int anio)
    {
        var reinscripciones = await _repository.GetByAnioConDetallesAsync(anio);

        return reinscripciones.Select(r => new ReinscripcionModel.ResponseDetallada(
            r.Id,
            r.PasajeroId,
            r.Pasajero.Nombre,
            $"{r.Pasajero.Titular.NombreContacto} {r.Pasajero.Titular.Apellido}",
            r.Pasajero.Colegio,
            r.Pasajero.GradoCurso,
            r.Pasajero.Turno,
            r.Anio,
            r.Estado,
            r.FechaCreacion,
            r.FechaConfirmacion
        )).ToList();
    }

    public async Task<ReinscripcionModel.ResponseDetallada> ObtenerPorIdAsync(int id)
    {
        var reinscripcion = await _repository.GetByIdConDetallesAsync(id);

        if (reinscripcion == null)
            throw new KeyNotFoundException($"Reinscripción {id} no encontrada");

        return new ReinscripcionModel.ResponseDetallada(
            reinscripcion.Id,
            reinscripcion.PasajeroId,
            reinscripcion.Pasajero.Nombre,
            $"{reinscripcion.Pasajero.Titular.NombreContacto} {reinscripcion.Pasajero.Titular.Apellido}",
            reinscripcion.Pasajero.Colegio,
            reinscripcion.Pasajero.GradoCurso,
            reinscripcion.Pasajero.Turno,
            reinscripcion.Anio,
            reinscripcion.Estado,
            reinscripcion.FechaCreacion,
            reinscripcion.FechaConfirmacion
        );
    }

    public async Task<ReinscripcionModel.ResponseDetallada> CrearAsync(int pasajeroId, int anio)
    {
        // Verificar que el pasajero existe
        var pasajeroExiste = await _pasajeroRepository.ExisteAsync(pasajeroId);
        if (!pasajeroExiste)
            throw new KeyNotFoundException($"Pasajero {pasajeroId} no encontrado");

        // Verificar que no exista ya una reinscripción para este pasajero en este año
        var yaExiste = await _repository.ExisteParaPasajeroYAnioAsync(pasajeroId, anio);
        
        if (yaExiste)
            throw new InvalidOperationException($"Ya existe una reinscripción para el pasajero {pasajeroId} en el año {anio}");

        var reinscripcion = new ReinscripcionPasajero(pasajeroId, anio);
        await _repository.AddAsync(reinscripcion);

        return await ObtenerPorIdAsync(reinscripcion.Id);
    }

    public async Task ConfirmarAsync(int id)
    {
        var reinscripcion = await _repository.GetByIdAsync(id);
        if (reinscripcion == null)
            throw new KeyNotFoundException($"Reinscripción {id} no encontrada");

        reinscripcion.Confirmar();
        await _repository.UpdateAsync(reinscripcion);
    }

    public async Task MarcarComoNoContinuaAsync(int id)
    {
        var reinscripcion = await _repository.GetByIdAsync(id);
        if (reinscripcion == null)
            throw new KeyNotFoundException($"Reinscripción {id} no encontrada");

        reinscripcion.MarcarComoNoContinua();
        await _repository.UpdateAsync(reinscripcion);
    }
}
