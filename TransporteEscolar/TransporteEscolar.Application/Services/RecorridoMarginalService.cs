using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Application.Services;

/// <summary>
/// Calcula el aporte marginal de cada titular: los metros que se ahorrarían si esa
/// familia no estuviera en el recorrido.
/// </summary>
/// <remarks>
/// Es la métrica honesta de costo. La distancia directa casa-colegio sobreestima a las
/// familias que viven lejos pero sobre el camino, y subestima a las que obligan a desviarse.
/// </remarks>
public class RecorridoMarginalService : IRecorridoMarginalService
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly ITitularUbicacionRepository _ubicacionRepository;
    private readonly IColegioRepository _colegioRepository;
    private readonly IRecorridoHorarioRepository _snapshotRepository;
    private readonly IRutaProvider _rutaProvider;
    private readonly RuteoOptions _options;
    private readonly ILogger<RecorridoMarginalService> _logger;

    public RecorridoMarginalService(
        IPasajeroRepository pasajeroRepository,
        ITitularUbicacionRepository ubicacionRepository,
        IColegioRepository colegioRepository,
        IRecorridoHorarioRepository snapshotRepository,
        IRutaProvider rutaProvider,
        IOptions<RuteoOptions> options,
        ILogger<RecorridoMarginalService> logger)
    {
        _pasajeroRepository = pasajeroRepository ?? throw new ArgumentNullException(nameof(pasajeroRepository));
        _ubicacionRepository = ubicacionRepository ?? throw new ArgumentNullException(nameof(ubicacionRepository));
        _colegioRepository = colegioRepository ?? throw new ArgumentNullException(nameof(colegioRepository));
        _snapshotRepository = snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));
        _rutaProvider = rutaProvider ?? throw new ArgumentNullException(nameof(rutaProvider));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RecorridoModel.RecalculoMarginalResponse> RecalcularAsync(
        CancellationToken cancellationToken = default)
    {
        var asignaciones = await _pasajeroRepository.GetAsignacionesHorarioAsync(cancellationToken);
        var ubicaciones = await _ubicacionRepository.GetAllAsync(cancellationToken);
        var colegios = await _colegioRepository.GetAllAsync(cancellationToken);

        var ubicacionPorTitular = ubicaciones.ToDictionary(u => u.TitularId, u => u.ObtenerCoordenada());
        var colegioPorId = colegios.ToDictionary(c => c.Id, c => c.ObtenerCoordenada());

        var procesados = 0;
        var consultas = 0;
        var fallidos = 0;

        var viajes = asignaciones
            .GroupBy(a => (a.HorarioId, a.Transporte, a.ColegioId))
            .OrderBy(g => g.Key.HorarioId)
            .ThenBy(g => g.Key.Transporte);

        foreach (var viaje in viajes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!colegioPorId.TryGetValue(viaje.Key.ColegioId, out var destino))
            {
                fallidos++;
                continue;
            }

            // Solo entran los titulares con pin cargado. Los demás no se pueden ubicar en la ruta.
            var participantes = viaje
                .Select(a => a.TitularId)
                .Distinct()
                .Where(ubicacionPorTitular.ContainsKey)
                .OrderBy(id => id)
                .ToList();

            if (participantes.Count == 0)
                continue;

            var paradas = participantes.Select(id => ubicacionPorTitular[id]).ToList();

            await EsperarAsync(cancellationToken);
            var rutaCompleta = await _rutaProvider.CalcularRutaOptimizadaAsync(paradas, destino, cancellationToken);
            consultas++;

            if (rutaCompleta is null)
            {
                _logger.LogWarning(
                    "No se pudo calcular la ruta completa del horario {HorarioId} transporte {Transporte}",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte);
                fallidos++;
                continue;
            }

            var snapshot = new RecorridoHorario(
                viaje.Key.HorarioId,
                viaje.Key.Transporte,
                rutaCompleta.DistanciaMetros,
                participantes.Count);

            for (var indice = 0; indice < participantes.Count; indice++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var titularId = participantes[indice];

                // Con un solo participante no hay ruta "sin él": su aporte es todo el recorrido.
                if (participantes.Count == 1)
                {
                    snapshot.AgregarAporte(titularId, rutaCompleta.DistanciaMetros);
                    break;
                }

                var paradasSinTitular = paradas
                    .Where((_, posicion) => posicion != indice)
                    .ToList();

                await EsperarAsync(cancellationToken);
                var rutaSinTitular = await _rutaProvider.CalcularRutaOptimizadaAsync(
                    paradasSinTitular,
                    destino,
                    cancellationToken);
                consultas++;

                if (rutaSinTitular is null)
                {
                    _logger.LogWarning(
                        "No se pudo calcular la ruta sin el titular {TitularId} en el horario {HorarioId}",
                        titularId,
                        viaje.Key.HorarioId);
                    continue;
                }

                snapshot.AgregarAporte(
                    titularId,
                    rutaCompleta.DistanciaMetros - rutaSinTitular.DistanciaMetros);
            }

            await _snapshotRepository.UpsertAsync(snapshot, cancellationToken);
            procesados++;
        }

        _logger.LogInformation(
            "Cálculo marginal: {Procesados} viajes, {Consultas} consultas al motor, {Fallidos} fallidos",
            procesados,
            consultas,
            fallidos);

        return new RecorridoModel.RecalculoMarginalResponse(procesados, consultas, fallidos);
    }

    private async Task EsperarAsync(CancellationToken cancellationToken)
    {
        if (_options.PausaEntreConsultasMs <= 0)
            return;

        await Task.Delay(_options.PausaEntreConsultasMs, cancellationToken).ConfigureAwait(false);
    }
}
