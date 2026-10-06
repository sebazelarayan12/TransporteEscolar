using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Application.Services;

public class HorarioService : IHorarioService
{
    private readonly IHorarioRepository _horarioRepository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IPasajeroHorarioRepository _pasajeroHorarioRepository;

    private readonly IColegioRepository _colegioRepository;

    public HorarioService(
        IHorarioRepository horarioRepository,
        IPasajeroRepository pasajeroRepository,
        IPasajeroHorarioRepository pasajeroHorarioRepository,
        IColegioRepository colegioRepository)
    {
        _horarioRepository = horarioRepository;
        _pasajeroRepository = pasajeroRepository;
        _pasajeroHorarioRepository = pasajeroHorarioRepository;
        _colegioRepository = colegioRepository;
    }

    public async Task<List<HorarioModel.Response>> ObtenerHorariosAsync(bool incluirInactivos = false, CancellationToken cancellationToken = default)
    {
        var horarios = incluirInactivos
            ? await _horarioRepository.GetTodosAsync(cancellationToken)
            : await _horarioRepository.GetAllAsync(cancellationToken);
        var conteos = await _pasajeroRepository.GetActivosCountByHorarioAsync(cancellationToken);

        return horarios
            .OrderBy(h => h.Orden)
            .Select(h => ToResponse(h, conteos.TryGetValue(h.Id, out var encontrado) ? encontrado : new ConteoPorTransporte(0, 0)))
            .ToList();
    }

    public async Task<HorarioModel.Response> CrearAsync(HorarioModel.CrearRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
            throw new ValidationException("Debes indicar los datos del horario");

        var etiqueta = HorarioValidator.ValidarEtiqueta(request.Etiqueta);
        HorarioValidator.ValidarSentido(request.Sentido);
        HorarioValidator.ValidarColegioId(request.ColegioId);
        if (request.Orden.HasValue)
            HorarioValidator.ValidarOrden(request.Orden.Value);

        await ValidarColegioActivoAsync(request.ColegioId, cancellationToken);
        await ValidarEtiquetaUnicaAsync(etiqueta, null, cancellationToken);

        var orden = request.Orden ?? await _horarioRepository.GetSiguienteOrdenAsync(cancellationToken);
        var horario = Horario.Crear(etiqueta, orden, request.ColegioId, request.Sentido);
        await _horarioRepository.AddAsync(horario, cancellationToken);

        // Se vuelve a leer para devolver el colegio cargado.
        var creado = await _horarioRepository.GetByIdAsync(horario.Id, cancellationToken) ?? horario;
        return await ConstruirRespuestaAsync(creado.Id, creado, cancellationToken);
    }

    public async Task<HorarioModel.Response> ActualizarAsync(int id, HorarioModel.ActualizarRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null)
            throw new ValidationException("Debes indicar los datos del horario");

        var etiqueta = HorarioValidator.ValidarEtiqueta(request.Etiqueta);
        HorarioValidator.ValidarOrden(request.Orden);
        HorarioValidator.ValidarSentido(request.Sentido);
        HorarioValidator.ValidarColegioId(request.ColegioId);

        var horario = await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync, id, nameof(Horario), cancellationToken);

        var cambiaEstructura = horario.ColegioId != request.ColegioId || horario.Sentido != request.Sentido;
        if (cambiaEstructura)
        {
            // Cambiar colegio o sentido invalida los recorridos ya calculados: solo se permite sin pasajeros activos.
            var activos = await ContarPasajerosActivosAsync(id, cancellationToken);
            if (activos > 0)
                throw new BusinessRuleException(
                    $"No se puede cambiar el colegio ni el sentido de un horario con {activos} pasajero(s) activo(s). " +
                    "Reasignalos a otro horario o creá uno nuevo.");

            await ValidarColegioActivoAsync(request.ColegioId, cancellationToken);
        }

        if (horario.Activo)
            await ValidarEtiquetaUnicaAsync(etiqueta, id, cancellationToken);

        horario.ActualizarEtiqueta(etiqueta);
        horario.ActualizarOrden(request.Orden);
        horario.AsignarColegio(request.ColegioId);
        horario.AsignarSentido(request.Sentido);
        await _horarioRepository.UpdateAsync(horario, cancellationToken);

        return await ConstruirRespuestaAsync(id, horario, cancellationToken);
    }

    public async Task DesactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var horario = await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync, id, nameof(Horario), cancellationToken);

        if (!horario.Activo)
            return;

        var activos = await ContarPasajerosActivosAsync(id, cancellationToken);
        if (activos > 0)
            throw new BusinessRuleException(
                $"No se puede desactivar un horario con {activos} pasajero(s) activo(s). Reasignalos a otro horario primero.");

        horario.Desactivar();
        await _horarioRepository.UpdateAsync(horario, cancellationToken);
    }

    public async Task ReactivarAsync(int id, CancellationToken cancellationToken = default)
    {
        var horario = await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync, id, nameof(Horario), cancellationToken);

        if (horario.Activo)
            return;

        await ValidarEtiquetaUnicaAsync(horario.Etiqueta, id, cancellationToken);

        if (horario.ColegioId is int colegioId)
        {
            var colegio = await _colegioRepository.GetByIdAsync(colegioId, cancellationToken);
            if (colegio is null || !colegio.Activo)
                throw new BusinessRuleException("No se puede reactivar el horario: su colegio está inactivo.");
        }

        horario.Reactivar();
        await _horarioRepository.UpdateAsync(horario, cancellationToken);
    }

    private static HorarioModel.Response ToResponse(Horario horario, ConteoPorTransporte conteo) =>
        new(
            horario.Id,
            horario.Etiqueta,
            horario.Orden,
            conteo.TransporteUno + conteo.TransporteDos,
            conteo,
            horario.Sentido.ToString(),
            horario.ColegioId,
            horario.Colegio?.Nombre,
            horario.Activo);

    private async Task<int> ContarPasajerosActivosAsync(int horarioId, CancellationToken cancellationToken)
    {
        var conteos = await _pasajeroRepository.GetActivosCountByHorarioAsync(cancellationToken);
        return conteos.TryGetValue(horarioId, out var conteo) ? conteo.TransporteUno + conteo.TransporteDos : 0;
    }

    private async Task ValidarColegioActivoAsync(int colegioId, CancellationToken cancellationToken)
    {
        var colegio = await _colegioRepository.GetByIdAsync(colegioId, cancellationToken);
        if (colegio is null)
            throw new ValidationException("El colegio elegido no existe");
        if (!colegio.Activo)
            throw new ValidationException("El colegio elegido está inactivo");
    }

    private async Task ValidarEtiquetaUnicaAsync(string etiqueta, int? excluirId, CancellationToken cancellationToken)
    {
        if (await _horarioRepository.ExisteEtiquetaActivaAsync(etiqueta, excluirId, cancellationToken))
            throw new ValidationException($"Ya existe un horario activo con la etiqueta \"{etiqueta}\"");
    }

    private async Task<HorarioModel.Response> ConstruirRespuestaAsync(int id, Horario horario, CancellationToken cancellationToken)
    {
        var conteos = await _pasajeroRepository.GetActivosCountByHorarioAsync(cancellationToken);
        var conteo = conteos.TryGetValue(id, out var encontrado) ? encontrado : new ConteoPorTransporte(0, 0);
        return ToResponse(horario, conteo);
    }

    public async Task<HorarioModel.PasajerosResponse> ObtenerPasajerosPorHorarioAsync(int horarioId, CancellationToken cancellationToken = default)
    {
        var horario = await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync,
            horarioId,
            nameof(Horario),
            cancellationToken);

        var pasajeros = await _pasajeroRepository.GetActivosPorHorarioAsync(horarioId, cancellationToken);

        var resumen = new HorarioModel.Resumen(horario.Id, horario.Etiqueta);

        var asignados = pasajeros
            .Select(p =>
            {
                var asignacion = p.PasajeroHorarios.First(ph => ph.HorarioId == horarioId);
                var apellido = p.Titular?.Apellido ?? string.Empty;
                return new PasajeroHorarioModel.PasajeroAsignado(
                    p.Id,
                    p.Nombre,
                    apellido,
                    $"{p.Nombre} {apellido}".Trim(),
                    asignacion.EsPrincipal,
                    asignacion.Prioridad,
                    asignacion.FechaAsignacion,
                    asignacion.Transporte);
            })
            .OrderBy(a => a.Prioridad)
            .ThenBy(a => a.Nombre)
            .ToList();

        var conteosTransporte = new ConteoPorTransporte(
            asignados.Count(a => a.Transporte == 1),
            asignados.Count(a => a.Transporte == 2));

        return new HorarioModel.PasajerosResponse(
            resumen,
            pasajeros.Select(p => p.ToResponse()).ToList(),
            new HorarioModel.PasajerosAsignados(horario.Id, horario.Etiqueta, asignados, conteosTransporte));
    }

    public async Task AsignarPasajerosAsync(int horarioId, HorarioModel.AsignacionRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ValidationException("Debes indicar los pasajeros a asignar al horario");

        var asignaciones = NormalizarAsignaciones(request);
        if (asignaciones.Count == 0)
            throw new ValidationException("No se encontraron pasajeros válidos para asignar");

        var horario = await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync,
            horarioId,
            nameof(Horario),
            cancellationToken);

        if (!horario.Activo)
            throw new ValidationException("El horario está inactivo: reactivalo antes de asignarle pasajeros");

        var ids = asignaciones.Select(a => a.PasajeroId).ToList();
        var pasajeros = await _pasajeroRepository.GetByIdsAsync(ids, cancellationToken);
        if (pasajeros.Count != ids.Count)
        {
            var existentes = pasajeros.Select(p => p.Id).ToHashSet();
            var faltante = ids.First(id => !existentes.Contains(id));
            throw new NotFoundException(nameof(Pasajero), faltante);
        }

        foreach (var pasajero in pasajeros)
        {
            if (pasajero.FechaBaja != null)
                throw new ValidationException($"El pasajero {pasajero.Nombre} está dado de baja y no puede asignarse a un horario");
        }

        await _pasajeroHorarioRepository.ExecuteInTransactionAsync(async () =>
        {
            foreach (var asignacion in asignaciones)
            {
                await ProcesarAsignacionAsync(asignacion, horarioId, cancellationToken);
            }
        });
    }

    private static List<HorarioModel.AsignacionDetalle> NormalizarAsignaciones(HorarioModel.AsignacionRequest request)
    {
        var detalles = request.Pasajeros?
            .Where(p => p.PasajeroId > 0)
            .GroupBy(p => p.PasajeroId)
            .Select(g => g.First())
            .ToList() ?? new List<HorarioModel.AsignacionDetalle>();

        if (detalles.Count == 0 && request.PasajeroIds != null)
        {
            detalles = request.PasajeroIds
                .Where(id => id > 0)
                .Distinct()
                .Select(id => new HorarioModel.AsignacionDetalle(id, false, null, request.Transporte))
                .ToList();
        }

        var transporteDefault = request.Transporte;

        return detalles
            .Select(detalle => new HorarioModel.AsignacionDetalle(
                detalle.PasajeroId,
                detalle.EsPrincipal,
                detalle.Prioridad,
                TransporteHelper.Normalizar(detalle.Transporte ?? transporteDefault)))
            .ToList();
    }

    private async Task ProcesarAsignacionAsync(HorarioModel.AsignacionDetalle detalle, int horarioId, CancellationToken cancellationToken)
    {
        var prioridad = await ResolverPrioridadAsync(detalle.PasajeroId, detalle.Prioridad, cancellationToken);
        var transporte = detalle.Transporte ?? 1;
        var asignacion = await _pasajeroHorarioRepository.GetAsync(detalle.PasajeroId, horarioId, cancellationToken);

        if (asignacion == null)
        {
            var nuevaAsignacion = new PasajeroHorario(detalle.PasajeroId, horarioId, detalle.EsPrincipal, prioridad, transporte);
            await _pasajeroHorarioRepository.AddAsync(nuevaAsignacion, cancellationToken);

            if (detalle.EsPrincipal)
            {
                await ActualizarPrincipalDesdeHorarioAsync(detalle.PasajeroId, horarioId, cancellationToken);
            }

            return;
        }

        asignacion.DefinirPrincipal(detalle.EsPrincipal);
        if (detalle.Prioridad.HasValue && detalle.Prioridad.Value > 0)
        {
            asignacion.ActualizarPrioridad(detalle.Prioridad.Value);
        }

        asignacion.ActualizarTransporte(transporte);

        if (detalle.EsPrincipal)
        {
            asignacion.ActualizarFechaAsignacion();
        }

        await _pasajeroHorarioRepository.UpdateAsync(asignacion, cancellationToken);

        if (detalle.EsPrincipal)
        {
            await ActualizarPrincipalDesdeHorarioAsync(detalle.PasajeroId, horarioId, cancellationToken);
        }
    }

    private async Task ActualizarPrincipalDesdeHorarioAsync(int pasajeroId, int horarioId, CancellationToken cancellationToken)
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

    private async Task<int> ResolverPrioridadAsync(int pasajeroId, int? prioridad, CancellationToken cancellationToken)
    {
        if (prioridad.HasValue && prioridad.Value > 0)
            return prioridad.Value;

        return await _pasajeroHorarioRepository.ObtenerSiguientePrioridadAsync(pasajeroId, cancellationToken);
    }
}
