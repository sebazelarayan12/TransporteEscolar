using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Services;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Application.Services;

/// <summary>
/// Reparte los kilómetros reales de cada viaje entre los titulares que lo componen,
/// usando el valor de Shapley.
/// </summary>
/// <remarks>
/// Es la métrica honesta de costo: a diferencia del aporte marginal simple, el reparto
/// suma exactamente los kilómetros reales del recorrido y nunca da negativo. Por cada
/// viaje se hace una sola consulta al motor (la matriz de distancias); el reparto se
/// calcula después en memoria con <see cref="RepartoShapley"/>.
/// </remarks>
public class RecorridoRepartoService : IRecorridoRepartoService
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly ITitularUbicacionRepository _ubicacionRepository;
    private readonly IColegioRepository _colegioRepository;
    private readonly IRecorridoHorarioRepository _snapshotRepository;
    private readonly IRutaProvider _rutaProvider;
    private readonly RuteoOptions _options;
    private readonly ILogger<RecorridoRepartoService> _logger;

    public RecorridoRepartoService(
        IPasajeroRepository pasajeroRepository,
        ITitularUbicacionRepository ubicacionRepository,
        IColegioRepository colegioRepository,
        IRecorridoHorarioRepository snapshotRepository,
        IRutaProvider rutaProvider,
        IOptions<RuteoOptions> options,
        ILogger<RecorridoRepartoService> logger)
    {
        _pasajeroRepository = pasajeroRepository ?? throw new ArgumentNullException(nameof(pasajeroRepository));
        _ubicacionRepository = ubicacionRepository ?? throw new ArgumentNullException(nameof(ubicacionRepository));
        _colegioRepository = colegioRepository ?? throw new ArgumentNullException(nameof(colegioRepository));
        _snapshotRepository = snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));
        _rutaProvider = rutaProvider ?? throw new ArgumentNullException(nameof(rutaProvider));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RecorridoModel.RecalculoRepartoResponse> RecalcularAsync(
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
        var aproximados = 0;

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

            // Una sola consulta al motor por viaje: la matriz de distancias entre todas las
            // paradas y el colegio. El reparto se calcula después en memoria.
            var puntos = new List<Coordenada>(paradas) { destino };

            await EsperarAsync(cancellationToken);
            var matriz = await _rutaProvider.CalcularMatrizDistanciasAsync(puntos, cancellationToken);
            consultas++;

            if (matriz is null)
            {
                _logger.LogWarning(
                    "No se pudo obtener la matriz del horario {HorarioId} transporte {Transporte}",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte);
                fallidos++;
                continue;
            }

            // TODO Task 22: usar la ParadaFija real del viaje y el ExtremoFijo según Horario.Sentido.
            var reparto = RepartoShapley.Calcular(matriz, paradas.Count, 0, ExtremoFijo.Primera);

            if (reparto is null)
            {
                _logger.LogWarning(
                    "No hay recorrido posible para el horario {HorarioId} transporte {Transporte}",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte);
                fallidos++;
                continue;
            }

            if (!reparto.EsExacto)
            {
                aproximados++;
                _logger.LogInformation(
                    "El horario {HorarioId} transporte {Transporte} tiene {Cantidad} paradas: se repartió de forma aproximada",
                    viaje.Key.HorarioId,
                    viaje.Key.Transporte,
                    paradas.Count);
            }

            var snapshot = new RecorridoHorario(
                viaje.Key.HorarioId,
                viaje.Key.Transporte,
                reparto.DistanciaTotalMetros,
                participantes.Count);

            for (var indice = 0; indice < participantes.Count; indice++)
            {
                // TODO Task 22: usar reparto.Orden en vez del índice + 1 provisorio.
                snapshot.AgregarAporte(participantes[indice], reparto.MetrosPorParada[indice], indice + 1);
            }

            await _snapshotRepository.UpsertAsync(snapshot, cancellationToken);
            procesados++;
        }

        _logger.LogInformation(
            "Reparto de kilómetros: {Procesados} viajes, {Consultas} consultas al motor, {Fallidos} fallidos, {Aproximados} aproximados",
            procesados,
            consultas,
            fallidos,
            aproximados);

        return new RecorridoModel.RecalculoRepartoResponse(procesados, consultas, fallidos, aproximados);
    }

    private async Task EsperarAsync(CancellationToken cancellationToken)
    {
        if (_options.PausaEntreConsultasMs <= 0)
            return;

        await Task.Delay(_options.PausaEntreConsultasMs, cancellationToken).ConfigureAwait(false);
    }
}
