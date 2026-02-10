using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class ReinscripcionService : IReinscripcionService
{
    private readonly IReinscripcionRepository _repository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IPagoMensualService _pagoMensualService;
    private static readonly string[] EstadosPermitidos = new[] { "Pendiente", "Confirmado", "NoContinua" };

    public ReinscripcionService(
        IReinscripcionRepository repository,
        IPasajeroRepository pasajeroRepository,
        IPagoMensualService pagoMensualService)
    {
        _repository = repository;
        _pasajeroRepository = pasajeroRepository;
        _pagoMensualService = pagoMensualService;
    }

    public async Task<PaginationModel.ResponsePagination<ReinscripcionModel.ResponseDetallada>> ObtenerTodosAsync(ReinscripcionModel.FilterRequest request)
    {
        if (request.PageNumber < 1)
            throw new ArgumentOutOfRangeException(nameof(request.PageNumber), "PageNumber debe ser mayor o igual a 1");

        if (request.PageSize < 1)
            throw new ArgumentOutOfRangeException(nameof(request.PageSize), "PageSize debe ser mayor o igual a 1");

        if (request.Mes < 1 || request.Mes > 12)
            throw new ArgumentOutOfRangeException(nameof(request.Mes), "Mes debe estar entre 1 y 12");

        var estadoNormalizado = NormalizarEstado(request.Estado);

        var (reinscripciones, totalCount) = await _repository.GetByAnioConDetallesPaginadoAsync(
            request.Anio,
            request.Mes,
            estadoNormalizado,
            request.PageNumber,
            request.PageSize);

        var data = reinscripciones.Select(r => new ReinscripcionModel.ResponseDetallada(
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

        return new PaginationModel.ResponsePagination<ReinscripcionModel.ResponseDetallada>(data, totalCount);
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

        await VerificarYGenerarPagosMensualesAsync(reinscripcion.PasajeroId, reinscripcion.Anio);
    }

    public async Task MarcarComoNoContinuaAsync(int id)
    {
        var reinscripcion = await _repository.GetByIdAsync(id);
        if (reinscripcion == null)
            throw new KeyNotFoundException($"Reinscripción {id} no encontrada");

        reinscripcion.MarcarComoNoContinua();
        await _repository.UpdateAsync(reinscripcion);

        await VerificarYGenerarPagosMensualesAsync(reinscripcion.PasajeroId, reinscripcion.Anio);
    }

    private static string? NormalizarEstado(string? estado)
    {
        if (string.IsNullOrWhiteSpace(estado))
            return null;

        foreach (var permitido in EstadosPermitidos)
        {
            if (string.Equals(permitido, estado, StringComparison.OrdinalIgnoreCase))
                return permitido;
        }

        throw new ArgumentException($"Estado inválido: {estado}", nameof(estado));
    }

    private async Task VerificarYGenerarPagosMensualesAsync(int pasajeroId, int anio)
    {
        var pasajero = await _pasajeroRepository.GetByIdAsync(pasajeroId);
        if (pasajero == null)
            return;

        var titularId = pasajero.TitularId;
        var pasajerosDelTitular = await _pasajeroRepository.GetByTitularIdAsync(titularId);

        if (pasajerosDelTitular == null || pasajerosDelTitular.Count == 0)
            return;

        var reinscripcionesDelAnio = pasajerosDelTitular
            .SelectMany(p => p.Reinscripciones.Where(r => r.Anio == anio))
            .ToList();

        if (reinscripcionesDelAnio.Count != pasajerosDelTitular.Count)
            return;

        var hayPendientes = reinscripcionesDelAnio.Any(r => r.Estado == "Pendiente");
        if (hayPendientes)
            return;

        var hayConfirmados = reinscripcionesDelAnio.Any(r => r.Estado == "Confirmado");
        if (!hayConfirmados)
            return;

        await _pagoMensualService.GenerarPagosMensualesAutomaticosAsync(titularId, anio);
    }
}
