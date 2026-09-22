using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Infrastructure.Services;

/// <summary>
/// Implementación de <see cref="IRutaProvider"/> contra un servidor OSRM por HTTP.
/// </summary>
/// <remarks>
/// Este es el único lugar del sistema donde las coordenadas se invierten a (longitud, latitud).
/// La conversión la hace <see cref="Coordenada.ToOsrm"/>.
/// <para>
/// Ninguna falla del motor propaga excepción: se devuelve <c>null</c> y se registra en el log.
/// Un recorrido que no se pudo calcular no debe tumbar el recálculo de los demás.
/// </para>
/// </remarks>
public class OsrmRutaProvider : IRutaProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly RuteoOptions _options;
    private readonly ILogger<OsrmRutaProvider> _logger;

    public OsrmRutaProvider(
        HttpClient httpClient,
        IOptions<RuteoOptions> options,
        ILogger<OsrmRutaProvider> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RutaCalculada?> CalcularRutaAsync(
        Coordenada origen,
        Coordenada destino,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(origen);
        ArgumentNullException.ThrowIfNull(destino);

        var coordenadas = $"{origen.ToOsrm()};{destino.ToOsrm()}";
        var url = $"/route/v1/{_options.PerfilVehiculo}/{coordenadas}?overview=full&geometries=polyline";

        return await EjecutarAsync(url, respuesta => respuesta.Routes, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<RutaCalculada?> CalcularRutaOptimizadaAsync(
        IReadOnlyList<Coordenada> paradas,
        Coordenada destino,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(destino);

        if (paradas is null || paradas.Count == 0)
            return null;

        // Con una sola parada no hay nada que optimizar: es una ruta punto a punto.
        if (paradas.Count == 1)
            return await CalcularRutaAsync(paradas[0], destino, cancellationToken).ConfigureAwait(false);

        var puntos = paradas.Select(p => p.ToOsrm()).Append(destino.ToOsrm());
        var coordenadas = string.Join(';', puntos);

        // source=any       -> el motor elige la mejor parada inicial (fijar la primera
        //                     distorsiona la ruta: el orden de entrada es arbitrario)
        // destination=last -> termina en el colegio
        // roundtrip=false  -> no vuelve al punto de partida
        var url = $"/trip/v1/{_options.PerfilVehiculo}/{coordenadas}" +
                  "?source=any&destination=last&roundtrip=false&overview=full&geometries=polyline";

        return await EjecutarAsync(url, respuesta => respuesta.Trips, cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task<MatrizViaje?> CalcularMatricesAsync(
        IReadOnlyList<Coordenada> puntos,
        CancellationToken cancellationToken = default)
    {
        if (puntos is null || puntos.Count == 0)
            return null;

        var coordenadas = string.Join(';', puntos.Select(p => p.ToOsrm()));
        var url = $"/table/v1/{_options.PerfilVehiculo}/{coordenadas}?annotations=distance,duration";

        try
        {
            using var respuestaHttp = await _httpClient.GetAsync(url, cancellationToken).ConfigureAwait(false);

            if (!respuestaHttp.IsSuccessStatusCode)
            {
                _logger.LogWarning("OSRM respondió {StatusCode} al pedir la matriz de {Cantidad} puntos",
                    (int)respuestaHttp.StatusCode, puntos.Count);
                return null;
            }

            var cuerpo = await respuestaHttp.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            var respuesta = JsonSerializer.Deserialize<OsrmMatriz>(cuerpo, JsonOptions);

            if (respuesta is null || !string.Equals(respuesta.Code, "Ok", StringComparison.Ordinal))
            {
                _logger.LogWarning("OSRM devolvió el código {Codigo} al pedir la matriz", respuesta?.Code ?? "(sin código)");
                return null;
            }

            var distancias = ExtraerMatriz(respuesta.Distances, puntos.Count, "distancia");
            if (distancias is null)
                return null;

            var duraciones = ExtraerMatriz(respuesta.Durations, puntos.Count, "duración");
            if (duraciones is null)
                return null;

            return new MatrizViaje(distancias, duraciones);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("OSRM superó el timeout al pedir la matriz de {Cantidad} puntos", puntos.Count);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "No se pudo contactar a OSRM para la matriz");
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "La matriz de OSRM no se pudo interpretar");
            return null;
        }
    }

    /// <summary>Convierte una matriz cruda de OSRM (con posibles nulls) en una matriz de doubles, o null si es inválida.</summary>
    private double[][]? ExtraerMatriz(List<List<double?>>? filas, int cantidadPuntos, string nombre)
    {
        if (filas is null || filas.Count != cantidadPuntos)
            return null;

        var matriz = new double[cantidadPuntos][];

        for (var i = 0; i < cantidadPuntos; i++)
        {
            var fila = filas[i];
            if (fila is null || fila.Count != cantidadPuntos)
                return null;

            matriz[i] = new double[cantidadPuntos];

            for (var j = 0; j < cantidadPuntos; j++)
            {
                // OSRM manda null cuando no hay camino entre dos puntos.
                if (fila[j] is not { } valor)
                {
                    _logger.LogWarning(
                        "OSRM no encontró camino ({Nombre}) entre los puntos {Origen} y {Destino}", nombre, i, j);
                    return null;
                }

                matriz[i][j] = valor;
            }
        }

        return matriz;
    }

    private async Task<RutaCalculada?> EjecutarAsync(
        string url,
        Func<OsrmRespuesta, List<OsrmRuta>?> seleccionarRutas,
        CancellationToken cancellationToken)
    {
        try
        {
            using var respuestaHttp = await _httpClient
                .GetAsync(url, cancellationToken)
                .ConfigureAwait(false);

            if (!respuestaHttp.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "OSRM respondió {StatusCode} para {Url}",
                    (int)respuestaHttp.StatusCode,
                    url);
                return null;
            }

            var cuerpo = await respuestaHttp.Content
                .ReadAsStringAsync(cancellationToken)
                .ConfigureAwait(false);

            var respuesta = JsonSerializer.Deserialize<OsrmRespuesta>(cuerpo, JsonOptions);

            if (respuesta is null || !string.Equals(respuesta.Code, "Ok", StringComparison.Ordinal))
            {
                _logger.LogWarning(
                    "OSRM devolvió el código {Codigo} para {Url}",
                    respuesta?.Code ?? "(sin código)",
                    url);
                return null;
            }

            var ruta = seleccionarRutas(respuesta)?.FirstOrDefault();
            if (ruta is null)
            {
                _logger.LogWarning("OSRM devolvió Ok pero sin rutas para {Url}", url);
                return null;
            }

            return new RutaCalculada(
                (int)Math.Round(ruta.Distance, MidpointRounding.AwayFromZero),
                (int)Math.Round(ruta.Duration, MidpointRounding.AwayFromZero),
                ruta.Geometry);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("OSRM superó el timeout de {Timeout}s para {Url}", _options.TimeoutSegundos, url);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "No se pudo contactar a OSRM en {Url}", url);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "OSRM devolvió una respuesta que no se pudo interpretar en {Url}", url);
            return null;
        }
    }

    /// <summary>Forma de la respuesta de OSRM. Solo se mapea lo que se usa.</summary>
    private sealed class OsrmRespuesta
    {
        [JsonPropertyName("code")]
        public string? Code { get; set; }

        /// <summary>Se completa en las respuestas de <c>/route</c>.</summary>
        [JsonPropertyName("routes")]
        public List<OsrmRuta>? Routes { get; set; }

        /// <summary>Se completa en las respuestas de <c>/trip</c>.</summary>
        [JsonPropertyName("trips")]
        public List<OsrmRuta>? Trips { get; set; }
    }

    private sealed class OsrmRuta
    {
        [JsonPropertyName("distance")]
        public double Distance { get; set; }

        [JsonPropertyName("duration")]
        public double Duration { get; set; }

        [JsonPropertyName("geometry")]
        public string? Geometry { get; set; }
    }

    /// <summary>Respuesta del endpoint <c>/table</c>. Las celdas son null si no hay camino.</summary>
    private sealed class OsrmMatriz
    {
        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("distances")]
        public List<List<double?>>? Distances { get; set; }

        [JsonPropertyName("durations")]
        public List<List<double?>>? Durations { get; set; }
    }
}
