using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Application.Recorridos.Queries;

/// <summary>Análisis de kilómetros y precio por kilómetro de todos los titulares activos.</summary>
public sealed record GetAnalisisKilometrosQuery : IRequest<RecorridoModel.AnalisisResponse>;

public sealed class GetAnalisisKilometrosQueryHandler
    : IRequestHandler<GetAnalisisKilometrosQuery, RecorridoModel.AnalisisResponse>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IRecorridoRepository _recorridoRepository;
    private readonly ITitularUbicacionRepository _ubicacionRepository;
    private readonly IPasajeroRepository _pasajeroRepository;

    public GetAnalisisKilometrosQueryHandler(
        ITitularRepository titularRepository,
        IRecorridoRepository recorridoRepository,
        ITitularUbicacionRepository ubicacionRepository,
        IPasajeroRepository pasajeroRepository)
    {
        _titularRepository = titularRepository;
        _recorridoRepository = recorridoRepository;
        _ubicacionRepository = ubicacionRepository;
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<RecorridoModel.AnalisisResponse> Handle(
        GetAnalisisKilometrosQuery request,
        CancellationToken cancellationToken)
    {
        // Cuatro consultas en total, sin N+1: todo se cruza en memoria.
        var titulares = await _titularRepository.GetAllAsync(cancellationToken);
        var recorridos = await _recorridoRepository.GetAllAsync(cancellationToken);
        var ubicaciones = await _ubicacionRepository.GetAllAsync(cancellationToken);
        var asignaciones = await _pasajeroRepository.GetAsignacionesColegioAsync(null, cancellationToken);

        var titularesConUbicacion = ubicaciones.Select(u => u.TitularId).ToHashSet();

        var recorridosPorTitular = recorridos
            .GroupBy(r => r.TitularId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // (titularId, colegioId) -> ids de horario. La clave del cálculo de viajes diarios.
        var horariosPorTitularColegio = asignaciones
            .GroupBy(a => (a.TitularId, a.ColegioId))
            .ToDictionary(g => g.Key, g => g.Select(a => a.HorarioId).ToList());

        var filas = new List<RecorridoModel.AnalisisFila>();

        foreach (var titular in titulares.Where(t => t.FechaBaja is null))
        {
            var recorridosDelTitular = recorridosPorTitular.TryGetValue(titular.Id, out var encontrados)
                ? encontrados
                : new List<Domain.Entities.Recorrido>();

            var kilometros = 0m;
            var colegios = new List<string>();

            foreach (var recorrido in recorridosDelTitular)
            {
                var horarios = horariosPorTitularColegio.TryGetValue((titular.Id, recorrido.ColegioId), out var ids)
                    ? ids
                    : new List<int>();

                var viajesDiarios = CalculoKilometros.ViajesDiarios(horarios);
                kilometros += CalculoKilometros.KilometrosMensuales(recorrido.DistanciaMetros, viajesDiarios);

                if (recorrido.Colegio is not null)
                {
                    colegios.Add(recorrido.Colegio.Nombre);
                }
            }

            filas.Add(new RecorridoModel.AnalisisFila(
                titular.Id,
                titular.Apellido,
                titular.MontoMensualPactado,
                colegios.Distinct().OrderBy(c => c).ToList(),
                kilometros,
                CalculoKilometros.PrecioPorKilometro(titular.MontoMensualPactado, kilometros),
                titularesConUbicacion.Contains(titular.Id)));
        }

        var kilometrosTotales = filas.Sum(f => f.KilometrosMensuales);
        var recaudacionTotal = filas.Sum(f => f.MontoMensual);

        // Los titulares sin kilómetros van al final: no tienen dato, no son "los más baratos".
        var ordenadas = filas
            .OrderBy(f => f.PrecioPorKilometro.HasValue ? 0 : 1)
            .ThenBy(f => f.PrecioPorKilometro)
            .ThenBy(f => f.Apellido)
            .ToList();

        return new RecorridoModel.AnalisisResponse(
            ordenadas,
            kilometrosTotales,
            recaudacionTotal,
            CalculoKilometros.PrecioPorKilometro(recaudacionTotal, kilometrosTotales),
            filas.Count(f => !f.TieneUbicacion));
    }
}
