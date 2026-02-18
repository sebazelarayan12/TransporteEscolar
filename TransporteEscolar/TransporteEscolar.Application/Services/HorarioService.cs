using System.Linq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Services;

public class HorarioService : IHorarioService
{
    private readonly IHorarioRepository _horarioRepository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IPasajeroHorarioRepository _pasajeroHorarioRepository;

    public HorarioService(
        IHorarioRepository horarioRepository,
        IPasajeroRepository pasajeroRepository,
        IPasajeroHorarioRepository pasajeroHorarioRepository)
    {
        _horarioRepository = horarioRepository;
        _pasajeroRepository = pasajeroRepository;
        _pasajeroHorarioRepository = pasajeroHorarioRepository;
    }

    public async Task<List<HorarioModel.Response>> ObtenerHorariosAsync(CancellationToken cancellationToken = default)
    {
        var horarios = await _horarioRepository.GetAllAsync(cancellationToken);
        var conteos = await _pasajeroRepository.GetActivosCountByHorarioAsync(cancellationToken);

        return horarios
            .OrderBy(h => h.Orden)
            .Select(h =>
            {
                var conteo = conteos.TryGetValue(h.Id, out var encontrado)
                    ? encontrado
                    : new ConteoPorTransporte(0, 0);

                return new HorarioModel.Response(
                    h.Id,
                    h.Etiqueta,
                    h.Orden,
                    conteo.TransporteUno + conteo.TransporteDos,
                    conteo);
            })
            .ToList();
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
            pasajeros.Select(PasajeroMapper.MapearAResponse).ToList(),
            new HorarioModel.PasajerosAsignados(horario.Id, horario.Etiqueta, asignados, conteosTransporte));
    }

    public async Task AsignarPasajerosAsync(int horarioId, HorarioModel.AsignacionRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
            throw new ValidationException("Debes indicar los pasajeros a asignar al horario");

        var asignaciones = NormalizarAsignaciones(request);
        if (asignaciones.Count == 0)
            throw new ValidationException("No se encontraron pasajeros válidos para asignar");

        await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync,
            horarioId,
            nameof(Horario),
            cancellationToken);

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
