using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class PasajeroService : IPasajeroService
{
    private readonly IPasajeroRepository _repository;
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualService _pagoMensualService;

    public PasajeroService(
        IPasajeroRepository repository,
        ITitularRepository titularRepository,
        IPagoMensualService pagoMensualService)
    {
        _repository = repository;
        _titularRepository = titularRepository;
        _pagoMensualService = pagoMensualService;
    }

    public async Task<PasajeroModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var pasajero = await _repository.GetByIdAsync(id, cancellationToken);
        return pasajero != null ? MapearAResponse(pasajero) : null;
    }

    public async Task<List<PasajeroModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetAllAsync(cancellationToken);
        return pasajeros.Select(MapearAResponse).ToList();
    }

    public async Task<List<PasajeroModel.Response>> ObtenerActivosAsync(CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetActivosAsync(cancellationToken);
        return pasajeros.Select(MapearAResponse).ToList();
    }

    public async Task<List<PasajeroModel.Response>> ObtenerActivosDisponiblesParaReinscripcionAsync(int anio, CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetActivosDisponiblesParaReinscripcionAsync(anio, cancellationToken);
        return pasajeros.Select(MapearAResponse).ToList();
    }

    public async Task<PaginationModel.ResponsePagination<PasajeroModel.Response>> ObtenerPaginadosAsync(
        PaginationModel.FilterRequest request, 
        CancellationToken cancellationToken = default)
    {
        // Obtener todos los pasajeros activos
        var pasajerosActivos = await _repository.GetActivosAsync(cancellationToken);

        // Aplicar filtro de búsqueda si existe
        var pasajerosFiltrados = pasajerosActivos.AsQueryable();
        
        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchLower = request.Search.ToLower();
            pasajerosFiltrados = pasajerosFiltrados.Where(p => 
                p.Nombre.ToLower().Contains(searchLower) ||
                p.Titular.Apellido.ToLower().Contains(searchLower) ||
                p.Colegio.ToLower().Contains(searchLower));
        }

        // Ordenar por nombre
        var pasajerosOrdenados = pasajerosFiltrados.OrderBy(p => p.Nombre);

        // Obtener el total antes de paginar
        var totalCount = pasajerosOrdenados.Count();

        // Aplicar paginación
        var pasajerosPaginados = pasajerosOrdenados
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(MapearAResponse)
            .ToList();

        return new PaginationModel.ResponsePagination<PasajeroModel.Response>(
            pasajerosPaginados,
            totalCount);
    }

    public async Task<List<PasajeroModel.Response>> ObtenerPorTitularAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetByTitularIdAsync(titularId, cancellationToken);
        return pasajeros.Select(MapearAResponse).ToList();
    }

    public async Task<PasajeroModel.Response> CrearAsync(PasajeroModel.Request dto, CancellationToken cancellationToken = default)
    {
        PasajeroValidator.Validate(dto);

        var titular = await _titularRepository.GetByIdAsync(dto.TitularId, cancellationToken);
        if (titular == null)
            throw new NotFoundException(nameof(Titular), dto.TitularId);

        var pasajero = new Pasajero(
            dto.TitularId, 
            dto.Nombre, 
            dto.Colegio, 
            dto.GradoCurso, 
            dto.Turno, 
            dto.Observaciones,
            dto.FechaAlta);

        var pasajeroCreado = await _repository.AddAsync(pasajero, cancellationToken);
        return MapearAResponse(pasajeroCreado);
    }

    public async Task ActualizarAsync(int id, PasajeroModel.UpdateRequest dto, CancellationToken cancellationToken = default)
    {
        PasajeroValidator.ValidateUpdate(dto);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Pasajero), cancellationToken);

        pasajero.ActualizarDatos(dto.Nombre, dto.Colegio, dto.GradoCurso, dto.Turno, dto.Observaciones);
        await _repository.UpdateAsync(pasajero, cancellationToken);
    }

    public async Task DarDeBajaAsync(int id, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Pasajero), cancellationToken);

        pasajero.DarDeBaja();
        await _repository.UpdateAsync(pasajero, cancellationToken);
    }

    public async Task ReactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Pasajero), cancellationToken);

        pasajero.Reactivar();
        await _repository.UpdateAsync(pasajero, cancellationToken);
    }

    // Gestión de reinscripciones
    public async Task<List<ReinscripcionModel.Response>> ObtenerReinscripcionesAsync(int pasajeroId, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        return pasajero.Reinscripciones
            .Select(r => new ReinscripcionModel.Response(
                r.Id, r.PasajeroId, r.Anio, r.Estado, r.FechaCreacion, r.FechaConfirmacion))
            .ToList();
    }

    public async Task<ReinscripcionModel.Response> CrearReinscripcionAsync(int pasajeroId, ReinscripcionModel.Request dto, CancellationToken cancellationToken = default)
    {
        ReinscripcionValidator.Validate(dto);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        var existe = pasajero.Reinscripciones.Any(r => r.Anio == dto.Anio);
        if (existe)
            throw new ValidationException($"Ya existe una reinscripción para el año {dto.Anio}");

        var reinscripcion = new ReinscripcionPasajero(pasajeroId, dto.Anio);
        pasajero.Reinscripciones.Add(reinscripcion);

        await _repository.UpdateAsync(pasajero, cancellationToken);

        return new ReinscripcionModel.Response(
            reinscripcion.Id, reinscripcion.PasajeroId, reinscripcion.Anio, 
            reinscripcion.Estado, reinscripcion.FechaCreacion, reinscripcion.FechaConfirmacion);
    }

    public async Task ConfirmarReinscripcionAsync(int pasajeroId, int reinscripcionId, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        var reinscripcion = pasajero.Reinscripciones.FirstOrDefault(r => r.Id == reinscripcionId);
        if (reinscripcion == null)
            throw new NotFoundException(nameof(ReinscripcionPasajero), reinscripcionId);

        reinscripcion.Confirmar();
        await _repository.UpdateAsync(pasajero, cancellationToken);


        // TODO: Verificar si se deben generar pagos mensuales automáticamente
        // await VerificarYGenerarPagosMensualesAsync(pasajero.TitularId, reinscripcion.Anio, cancellationToken);
    }

    public async Task MarcarComoNoContinuaAsync(int pasajeroId, int reinscripcionId, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        var reinscripcion = pasajero.Reinscripciones.FirstOrDefault(r => r.Id == reinscripcionId);
        if (reinscripcion == null)
            throw new NotFoundException(nameof(ReinscripcionPasajero), reinscripcionId);

        reinscripcion.MarcarComoNoContinua();
        await _repository.UpdateAsync(pasajero, cancellationToken);
    }

    private static PasajeroModel.Response MapearAResponse(Pasajero pasajero)
    {
        var apellido = pasajero.Titular?.Apellido ?? string.Empty;
        return new(
            pasajero.Id, 
            pasajero.TitularId, 
            pasajero.Nombre, 
            apellido,
            $"{pasajero.Nombre} {apellido}", 
            pasajero.Colegio, 
            pasajero.GradoCurso,
            pasajero.Turno, 
            pasajero.Observaciones, 
            pasajero.FechaAlta, 
            pasajero.FechaBaja,
            pasajero.FechaBaja == null, 
            apellido);
    }
}
