using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class PasajeroService : IPasajeroService
{
    private readonly IPasajeroRepository _repository;
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualService _pagoMensualService;
    private readonly IHorarioRepository _horarioRepository;
    private readonly IPasajeroHorarioRepository _pasajeroHorarioRepository;
    private readonly INotificacionService _notificacionService;

    public PasajeroService(
        IPasajeroRepository repository,
        ITitularRepository titularRepository,
        IPagoMensualService pagoMensualService,
        IHorarioRepository horarioRepository,
        IPasajeroHorarioRepository pasajeroHorarioRepository,
        INotificacionService notificacionService)
    {
        _repository = repository;
        _titularRepository = titularRepository;
        _pagoMensualService = pagoMensualService;
        _horarioRepository = horarioRepository;
        _pasajeroHorarioRepository = pasajeroHorarioRepository;
        _notificacionService = notificacionService;
    }

    public async Task<PasajeroModel.Response?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var pasajero = await _repository.GetByIdAsync(id, cancellationToken);
        return pasajero != null ? PasajeroMapper.MapearAResponse(pasajero) : null;
    }

    public async Task<List<PasajeroModel.Response>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetAllAsync(cancellationToken);
        return pasajeros.Select(PasajeroMapper.MapearAResponse).ToList();
    }

    public async Task<List<PasajeroModel.Response>> ObtenerActivosAsync(CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetActivosAsync(cancellationToken);
        return pasajeros.Select(PasajeroMapper.MapearAResponse).ToList();
    }

    public async Task<List<PasajeroModel.Response>> ObtenerActivosDisponiblesParaReinscripcionAsync(int anio, CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetActivosDisponiblesParaReinscripcionAsync(anio, cancellationToken);
        return pasajeros.Select(PasajeroMapper.MapearAResponse).ToList();
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
            .Select(PasajeroMapper.MapearAResponse)
            .ToList();

        return new PaginationModel.ResponsePagination<PasajeroModel.Response>(
            pasajerosPaginados,
            totalCount);
    }

    public async Task<List<PasajeroModel.Response>> ObtenerPorTitularAsync(int titularId, CancellationToken cancellationToken = default)
    {
        var pasajeros = await _repository.GetByTitularIdAsync(titularId, cancellationToken);
        return pasajeros.Select(PasajeroMapper.MapearAResponse).ToList();
    }

    public async Task<PasajeroModel.Response> CrearAsync(PasajeroModel.Request dto, CancellationToken cancellationToken = default)
    {
        PasajeroValidator.Validate(dto);

        var titular = await _titularRepository.GetByIdAsync(dto.TitularId, cancellationToken);
        if (titular == null)
            throw new NotFoundException(nameof(Titular), dto.TitularId);

        await ValidarHorarioAsync(dto.HorarioId, cancellationToken);

        var pasajero = new Pasajero(
            dto.TitularId, 
            dto.Nombre, 
            dto.Colegio, 
            dto.GradoCurso, 
            dto.Turno, 
            dto.Observaciones,
            dto.FechaAlta);

        Pasajero pasajeroCreado = pasajero;

        await _pasajeroHorarioRepository.ExecuteInTransactionAsync(async () =>
        {
            pasajeroCreado = await _repository.AddAsync(pasajero, cancellationToken);

            if (dto.HorarioId.HasValue)
            {
                await CrearAsignacionSiNoExisteAsync(
                    pasajeroCreado.Id,
                    dto.HorarioId.Value,
                    true,
                    null,
                    1,
                    cancellationToken);
                await MarcarPrincipalAsync(pasajeroCreado.Id, dto.HorarioId.Value, cancellationToken);
            }
        });

        var pasajeroCompleto = await _repository.GetByIdAsync(pasajeroCreado.Id, cancellationToken) ?? pasajeroCreado;

        // Crear notificación de pasajero creado
        var titularNombre = $"{titular.NombreContacto} {titular.Apellido}".Trim();
        await _notificacionService.CrearNotificacionPasajeroCreadoAsync(
            pasajeroCompleto.Nombre,
            titularNombre,
            pasajeroCompleto.Id,
            cancellationToken);

        return PasajeroMapper.MapearAResponse(pasajeroCompleto);
    }

    public async Task ActualizarAsync(int id, PasajeroModel.UpdateRequest dto, CancellationToken cancellationToken = default)
    {
        PasajeroValidator.ValidateUpdate(dto);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, id, nameof(Pasajero), cancellationToken);

        await ValidarHorarioAsync(dto.HorarioId, cancellationToken);

        pasajero.ActualizarDatos(dto.Nombre, dto.Colegio, dto.GradoCurso, dto.Turno, dto.Observaciones);

        await _pasajeroHorarioRepository.ExecuteInTransactionAsync(async () =>
        {
            await _repository.UpdateAsync(pasajero, cancellationToken);
            await ActualizarHorarioPrincipalAsync(pasajero.Id, dto.HorarioId, cancellationToken);
        });
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

    public async Task<PasajeroModel.Response> AgregarHorarioAsync(int pasajeroId, PasajeroHorarioModel.AsignacionRequest dto, CancellationToken cancellationToken = default)
    {
        PasajeroHorarioValidator.Validate(dto);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        await ValidarHorarioAsync(dto.HorarioId, cancellationToken);
        var transporte = TransporteHelper.Normalizar(dto.Transporte);

        await _pasajeroHorarioRepository.ExecuteInTransactionAsync(async () =>
        {
            var existente = await _pasajeroHorarioRepository.GetAsync(pasajeroId, dto.HorarioId, cancellationToken);
            if (existente != null)
            {
                existente.DefinirPrincipal(dto.EsPrincipal);
                if (dto.Prioridad.HasValue && dto.Prioridad.Value > 0)
                {
                    existente.ActualizarPrioridad(dto.Prioridad.Value);
                }

                existente.ActualizarTransporte(transporte);

                if (dto.EsPrincipal)
                {
                    existente.ActualizarFechaAsignacion();
                }

                await _pasajeroHorarioRepository.UpdateAsync(existente, cancellationToken);

                if (dto.EsPrincipal)
                {
                    await MarcarPrincipalAsync(pasajeroId, dto.HorarioId, cancellationToken);
                }

                return;
            }

            await CrearAsignacionSiNoExisteAsync(
                pasajeroId,
                dto.HorarioId,
                dto.EsPrincipal,
                dto.Prioridad,
                transporte,
                cancellationToken);

            if (dto.EsPrincipal)
            {
                await MarcarPrincipalAsync(pasajeroId, dto.HorarioId, cancellationToken);
            }
        });

        var actualizado = await _repository.GetByIdAsync(pasajeroId, cancellationToken) ?? pasajero;
        return PasajeroMapper.MapearAResponse(actualizado);
    }

    public async Task QuitarHorarioAsync(int pasajeroId, int horarioId, CancellationToken cancellationToken = default)
    {
        if (horarioId <= 0)
            throw new ValidationException("HorarioId inválido");

        await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        var asignacion = await _pasajeroHorarioRepository.GetAsync(pasajeroId, horarioId, cancellationToken);
        if (asignacion == null)
            throw new NotFoundException(nameof(PasajeroHorario), horarioId);

        await _pasajeroHorarioRepository.ExecuteInTransactionAsync(async () =>
        {
            var eraPrincipal = asignacion.EsPrincipal;
            await _pasajeroHorarioRepository.RemoveAsync(asignacion, cancellationToken);

            if (eraPrincipal)
            {
                await PromoverSiguientePrincipalAsync(pasajeroId, cancellationToken);
            }
        });
    }

    public async Task QuitarHorarioPrincipalAsync(int pasajeroId, CancellationToken cancellationToken = default)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _repository.GetByIdAsync, pasajeroId, nameof(Pasajero), cancellationToken);

        var principal = pasajero.PasajeroHorarios
            .FirstOrDefault(ph => ph.EsPrincipal)
            ?? pasajero.PasajeroHorarios.FirstOrDefault();

        if (principal == null)
            return;

        await QuitarHorarioAsync(pasajeroId, principal.HorarioId, cancellationToken);
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

    private async Task ActualizarHorarioPrincipalAsync(int pasajeroId, int? horarioId, CancellationToken cancellationToken)
    {
        if (!horarioId.HasValue)
        {
            await RemoverPrincipalAsync(pasajeroId, cancellationToken);
            return;
        }

        await CrearAsignacionSiNoExisteAsync(pasajeroId, horarioId.Value, true, null, 1, cancellationToken);
        await MarcarPrincipalAsync(pasajeroId, horarioId.Value, cancellationToken);
    }

    private async Task RemoverPrincipalAsync(int pasajeroId, CancellationToken cancellationToken)
    {
        var asignaciones = await _pasajeroHorarioRepository.GetByPasajeroIdAsync(pasajeroId, cancellationToken);
        if (asignaciones.Count == 0)
            return;

        var seActualizo = false;
        foreach (var asignacion in asignaciones.Where(a => a.EsPrincipal))
        {
            asignacion.DefinirPrincipal(false);
            seActualizo = true;
        }

        if (seActualizo)
        {
            await _pasajeroHorarioRepository.UpdateRangeAsync(asignaciones, cancellationToken);
        }
    }

    private async Task CrearAsignacionSiNoExisteAsync(int pasajeroId, int horarioId, bool esPrincipal, int? prioridad, byte transporte, CancellationToken cancellationToken)
    {
        var existente = await _pasajeroHorarioRepository.GetAsync(pasajeroId, horarioId, cancellationToken);
        if (existente != null)
            return;

        var prioridadCalculada = await ResolverPrioridadAsync(pasajeroId, prioridad, cancellationToken);
        var asignacion = new PasajeroHorario(pasajeroId, horarioId, esPrincipal, prioridadCalculada, transporte);
        await _pasajeroHorarioRepository.AddAsync(asignacion, cancellationToken);
    }

    private async Task MarcarPrincipalAsync(int pasajeroId, int horarioId, CancellationToken cancellationToken)
    {
        var asignaciones = await _pasajeroHorarioRepository.GetByPasajeroIdAsync(pasajeroId, cancellationToken);
        if (asignaciones.Count == 0)
            return;

        foreach (var asignacion in asignaciones)
        {
            var esPrincipal = asignacion.HorarioId == horarioId;
            asignacion.DefinirPrincipal(esPrincipal);
            if (esPrincipal)
            {
                asignacion.ActualizarFechaAsignacion();
            }
        }

        await _pasajeroHorarioRepository.UpdateRangeAsync(asignaciones, cancellationToken);
    }

    private async Task PromoverSiguientePrincipalAsync(int pasajeroId, CancellationToken cancellationToken)
    {
        var restantes = await _pasajeroHorarioRepository.GetByPasajeroIdAsync(pasajeroId, cancellationToken);
        if (restantes.Count == 0)
            return;

        var siguiente = restantes.First();
        if (!siguiente.EsPrincipal)
        {
            siguiente.DefinirPrincipal(true);
            siguiente.ActualizarFechaAsignacion();
            await _pasajeroHorarioRepository.UpdateAsync(siguiente, cancellationToken);
        }
    }

    private async Task<int> ResolverPrioridadAsync(int pasajeroId, int? prioridad, CancellationToken cancellationToken)
    {
        if (prioridad.HasValue && prioridad.Value > 0)
            return prioridad.Value;

        return await _pasajeroHorarioRepository.ObtenerSiguientePrioridadAsync(pasajeroId, cancellationToken);
    }

    private async Task ValidarHorarioAsync(int? horarioId, CancellationToken cancellationToken)
    {
        if (!horarioId.HasValue)
            return;

        var existe = await _horarioRepository.ExisteAsync(horarioId.Value, cancellationToken);
        if (!existe)
            throw new NotFoundException(nameof(Horario), horarioId.Value);
    }
}
