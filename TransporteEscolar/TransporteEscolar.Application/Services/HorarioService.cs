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

    public HorarioService(
        IHorarioRepository horarioRepository,
        IPasajeroRepository pasajeroRepository)
    {
        _horarioRepository = horarioRepository;
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<List<HorarioModel.Response>> ObtenerHorariosAsync(CancellationToken cancellationToken = default)
    {
        var horarios = await _horarioRepository.GetAllAsync(cancellationToken);
        var conteos = await _pasajeroRepository.GetActivosCountByHorarioAsync(cancellationToken);

        return horarios
            .OrderBy(h => h.Orden)
            .Select(h => new HorarioModel.Response(
                h.Id,
                h.Etiqueta,
                h.Orden,
                conteos.TryGetValue(h.Id, out var total) ? total : 0))
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

        return new HorarioModel.PasajerosResponse(
            new HorarioModel.Resumen(horario.Id, horario.Etiqueta),
            pasajeros.Select(PasajeroMapper.MapearAResponse).ToList());
    }

    public async Task AsignarPasajerosAsync(int horarioId, HorarioModel.AsignacionRequest request, CancellationToken cancellationToken = default)
    {
        if (request?.PasajeroIds == null)
            throw new ValidationException("Debes indicar los pasajeros a asignar al horario");

        var ids = request.PasajeroIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (ids.Count == 0)
            throw new ValidationException("No se encontraron pasajeros válidos para asignar");

        await RepositoryHelper.GetByIdOrThrowAsync(
            _horarioRepository.GetByIdAsync,
            horarioId,
            nameof(Horario),
            cancellationToken);

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

            pasajero.AsignarHorario(horarioId);
        }

        await _pasajeroRepository.UpdateRangeAsync(pasajeros, cancellationToken);
    }
}
