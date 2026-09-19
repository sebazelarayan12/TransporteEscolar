using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Application.Services;

/// <summary>
/// Orquesta el cálculo de recorridos. Es el único punto del sistema que decide
/// cuándo se consulta al motor de ruteo.
/// </summary>
/// <remarks>
/// Regla central: solo se consulta el motor cuando el hash del par origen/destino cambió.
/// Gracias a eso, renderizar pantallas nunca genera tráfico hacia OSRM.
/// Las consultas se hacen en serie, con una pausa configurable, para respetar el límite
/// de 1 request por segundo del servidor público.
/// </remarks>
public class RecorridoService : IRecorridoService
{
    private const string NombreProveedor = "osrm";

    private readonly ITitularUbicacionRepository _ubicacionRepository;
    private readonly IColegioRepository _colegioRepository;
    private readonly IRecorridoRepository _recorridoRepository;
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IRutaProvider _rutaProvider;
    private readonly RuteoOptions _options;
    private readonly ILogger<RecorridoService> _logger;

    public RecorridoService(
        ITitularUbicacionRepository ubicacionRepository,
        IColegioRepository colegioRepository,
        IRecorridoRepository recorridoRepository,
        IPasajeroRepository pasajeroRepository,
        IRutaProvider rutaProvider,
        IOptions<RuteoOptions> options,
        ILogger<RecorridoService> logger)
    {
        _ubicacionRepository = ubicacionRepository ?? throw new ArgumentNullException(nameof(ubicacionRepository));
        _colegioRepository = colegioRepository ?? throw new ArgumentNullException(nameof(colegioRepository));
        _recorridoRepository = recorridoRepository ?? throw new ArgumentNullException(nameof(recorridoRepository));
        _pasajeroRepository = pasajeroRepository ?? throw new ArgumentNullException(nameof(pasajeroRepository));
        _rutaProvider = rutaProvider ?? throw new ArgumentNullException(nameof(rutaProvider));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RecorridoModel.RecalculoResponse> RecalcularPorTitularAsync(
        int titularId,
        CancellationToken cancellationToken = default)
    {
        var ubicacion = await _ubicacionRepository.GetByTitularIdAsync(titularId, cancellationToken);

        if (ubicacion is null)
            throw new ValidationException(
                "El titular no tiene una ubicación cargada. Marcá la casa en el mapa antes de calcular los kilómetros.");

        var asignaciones = await _pasajeroRepository.GetAsignacionesColegioAsync(titularId, cancellationToken);

        var acumulador = new Acumulador();
        await ProcesarTitularAsync(ubicacion, asignaciones, acumulador, cancellationToken);

        return acumulador.ToResponse();
    }

    public async Task<RecorridoModel.RecalculoResponse> RecalcularTodosAsync(
        CancellationToken cancellationToken = default)
    {
        var asignaciones = await _pasajeroRepository.GetAsignacionesColegioAsync(null, cancellationToken);
        var acumulador = new Acumulador();

        var porTitular = asignaciones
            .GroupBy(a => a.TitularId)
            .OrderBy(g => g.Key);

        foreach (var grupo in porTitular)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var ubicacion = await _ubicacionRepository.GetByTitularIdAsync(grupo.Key, cancellationToken);

            if (ubicacion is null)
            {
                acumulador.SinUbicacion.Add(grupo.Key);
                continue;
            }

            await ProcesarTitularAsync(ubicacion, grupo.ToList(), acumulador, cancellationToken);
        }

        _logger.LogInformation(
            "Recálculo completo: {Calculados} calculados, {Omitidos} vigentes, {Fallidos} fallidos, {SinUbicacion} sin pin",
            acumulador.Calculados,
            acumulador.Omitidos,
            acumulador.Fallidos,
            acumulador.SinUbicacion.Count);

        return acumulador.ToResponse();
    }

    public async Task<List<RecorridoModel.Response>> ObtenerPorTitularAsync(
        int titularId,
        CancellationToken cancellationToken = default)
    {
        var asignaciones = await _pasajeroRepository.GetAsignacionesColegioAsync(titularId, cancellationToken);
        var recorridos = await _recorridoRepository.GetByTitularIdAsync(titularId, cancellationToken);

        var horariosPorColegio = asignaciones
            .GroupBy(a => a.ColegioId)
            .ToDictionary(g => g.Key, g => g.Select(a => a.HorarioId).ToList());

        return recorridos
            .Select(recorrido =>
            {
                var horarios = horariosPorColegio.TryGetValue(recorrido.ColegioId, out var encontrados)
                    ? encontrados
                    : new List<int>();

                var viajesDiarios = CalculoKilometros.ViajesDiarios(horarios);

                return new RecorridoModel.Response(
                    recorrido.ColegioId,
                    recorrido.Colegio?.Nombre ?? string.Empty,
                    recorrido.DistanciaMetros,
                    recorrido.DuracionSegundos,
                    viajesDiarios,
                    CalculoKilometros.KilometrosMensuales(recorrido.DistanciaMetros, viajesDiarios),
                    recorrido.GeometriaPolyline,
                    recorrido.FechaCalculo);
            })
            .OrderBy(r => r.ColegioNombre)
            .ToList();
    }

    /// <summary>
    /// Recalcula todos los colegios de un titular. Un colegio que falla no interrumpe a los demás.
    /// </summary>
    private async Task ProcesarTitularAsync(
        TitularUbicacion ubicacion,
        IReadOnlyCollection<AsignacionColegio> asignaciones,
        Acumulador acumulador,
        CancellationToken cancellationToken)
    {
        var colegioIds = asignaciones
            .Select(a => a.ColegioId)
            .Distinct()
            .OrderBy(id => id);

        var origen = ubicacion.ObtenerCoordenada();

        foreach (var colegioId in colegioIds)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var colegio = await _colegioRepository.GetByIdAsync(colegioId, cancellationToken);
            if (colegio is null)
            {
                _logger.LogWarning("El colegio {ColegioId} no existe; se omite el recorrido", colegioId);
                acumulador.Fallidos++;
                continue;
            }

            var destino = colegio.ObtenerCoordenada();
            var hashActual = RecorridoHash.Calcular(origen, destino);

            var existente = await _recorridoRepository.GetByTitularYColegioAsync(
                ubicacion.TitularId,
                colegioId,
                cancellationToken);

            if (existente is not null && existente.EstaVigente(hashActual))
            {
                acumulador.Omitidos++;
                continue;
            }

            await EsperarEntreConsultasAsync(cancellationToken);

            var ruta = await _rutaProvider.CalcularRutaAsync(origen, destino, cancellationToken);

            if (ruta is null)
            {
                _logger.LogWarning(
                    "El motor no devolvió ruta para el titular {TitularId} hacia el colegio {ColegioId}",
                    ubicacion.TitularId,
                    colegioId);
                acumulador.Fallidos++;
                continue;
            }

            var recorrido = new Recorrido(
                ubicacion.TitularId,
                colegioId,
                ruta.DistanciaMetros,
                ruta.DuracionSegundos,
                ruta.GeometriaPolyline,
                NombreProveedor,
                hashActual);

            await _recorridoRepository.UpsertAsync(recorrido, cancellationToken);
            acumulador.Calculados++;
        }
    }

    private async Task EsperarEntreConsultasAsync(CancellationToken cancellationToken)
    {
        if (_options.PausaEntreConsultasMs <= 0)
            return;

        await Task.Delay(_options.PausaEntreConsultasMs, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Contadores de una corrida de recálculo.</summary>
    private sealed class Acumulador
    {
        public int Calculados { get; set; }
        public int Omitidos { get; set; }
        public int Fallidos { get; set; }
        public List<int> SinUbicacion { get; } = new();

        public RecorridoModel.RecalculoResponse ToResponse()
            => new(Calculados, Omitidos, Fallidos, SinUbicacion.AsReadOnly());
    }
}
