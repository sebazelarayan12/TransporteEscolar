using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Application;
using TransporteEscolar.Application.Bot;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Prueba el pipeline HTTP real de <c>/api/bot/gastos</c> con un mini-host (TestServer), en el mismo estilo que
/// <c>BotEndpointPipelineTests</c>. El repositorio de gastos es un Mock; MediatR y la validación son reales.
/// </summary>
public class BotGastosPipelineTests
{
    private const string ClaveGastos = "clave-bot-gastos-123";
    private const string ClaveInasistencias = "clave-bot-inasistencias-456";
    private const string Url = "/api/bot/gastos";
    private const string MensajeId = "msg-1";
    // Lo que el bot guarda y busca en la base: el hash del id, nunca el id en claro.
    private static readonly string ClaveMensaje = BotMensajeId.Hashear(MensajeId);

    private static readonly TimeZoneInfo ZonaArgentina = TimeZoneInfo.FindSystemTimeZoneById("America/Buenos_Aires");

    /// <summary>Mini-host con controllers del assembly Api, MediatR real y el repositorio de gastos mockeado.</summary>
    private sealed class HostDePrueba : IAsyncDisposable
    {
        public IHost Host { get; }
        public HttpClient Cliente { get; }

        public HostDePrueba(
            IDictionary<string, string?> configuracion,
            Mock<IGastoRepository> gastos,
            ILoggerProvider? proveedorLog = null)
        {
            Host = new HostBuilder()
                .ConfigureAppConfiguration(config =>
                {
                    // Sin entradas ApiClients:* queda "no configurada" (503).
                    config.AddInMemoryCollection(configuracion);
                })
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    if (proveedorLog is not null)
                        logging.AddProvider(proveedorLog);
                })
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices((contexto, services) =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(BotController).Assembly);
                        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<AssemblyMarker>());
                        services.AddSingleton(gastos.Object);
                        // BotController (mismo assembly) pide estos repositorios; los GET no se ejecutan en estas pruebas.
                        services.AddSingleton(Mock.Of<ITitularRepository>());
                        services.AddSingleton(Mock.Of<IPasajeroRepository>());
                        services.AddBotApi(contexto.Configuration);
                    })
                    .Configure(app =>
                    {
                        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
                        app.UseRouting();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.UseEndpoints(endpoints => endpoints.MapControllers());
                    }))
                .Build();

            Host.Start();
            Cliente = Host.GetTestClient();
        }

        public async ValueTask DisposeAsync()
        {
            Cliente.Dispose();
            await Host.StopAsync();
            Host.Dispose();
        }
    }

    /// <summary>Log capturado: mensaje formateado y valores estructurados.</summary>
    private sealed record Registro(string Categoria, string Mensaje, IReadOnlyList<KeyValuePair<string, object?>> Valores);

    private sealed class CapturaLoggerProvider : ILoggerProvider
    {
        public List<Registro> Registros { get; } = new();

        public ILogger CreateLogger(string categoryName) => new CapturaLogger(categoryName, Registros);

        public void Dispose() { }

        private sealed class CapturaLogger(string categoria, List<Registro> registros) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                // Se copian los valores ahora: el state de ASP.NET (HostingRequestStartingLog) es una vista perezosa
                // sobre la petición y falla si se enumera después de que la petición terminó.
                var valores = (state as IReadOnlyList<KeyValuePair<string, object?>>
                               ?? new List<KeyValuePair<string, object?>>()).ToList();
                lock (registros)
                    registros.Add(new Registro(categoria, formatter(state, exception), valores));
            }
        }
    }

    private static Dictionary<string, string?> Cliente(string nombre, string? clave, params string[] scopes)
    {
        var config = new Dictionary<string, string?> { [$"ApiClients:{nombre}:Key"] = clave };
        for (var i = 0; i < scopes.Length; i++)
            config[$"ApiClients:{nombre}:Scopes:{i}"] = scopes[i];
        return config;
    }

    private static Dictionary<string, string?> Unir(params Dictionary<string, string?>[] partes) =>
        partes.SelectMany(p => p).ToDictionary(kv => kv.Key, kv => kv.Value);

    private static Dictionary<string, string?> ConClientesConfigurados() => Unir(
        Cliente("BotGastos", ClaveGastos, "bot:gastos"),
        Cliente("BotInasistencias", ClaveInasistencias, "bot:identidad"));

    private static DateOnly HoyEnArgentina() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTime.UtcNow, ZonaArgentina));

    /// <summary>Cuerpo JSON válido por defecto; cada parámetro permite romper un campo a propósito.</summary>
    private static string Cuerpo(
        string? mensajeId = MensajeId,
        string? monto = "4500.00",
        string? categoria = "Alimentacion",
        string? fecha = null,
        string? descripcion = "Super Ejemplo",
        bool conCargadoPor = false)
    {
        var campos = new Dictionary<string, object?>
        {
            ["mensajeId"] = mensajeId,
            ["monto"] = monto,
            ["categoria"] = categoria,
            ["medioPago"] = "Efectivo",
            ["estado"] = "Pagado",
            ["fecha"] = fecha ?? HoyEnArgentina().ToString("yyyy-MM-dd"),
            ["descripcion"] = descripcion,
            ["vehiculo"] = null
        };
        if (conCargadoPor)
            campos["cargadoPor"] = "bot-whatsapp";

        return JsonSerializer.Serialize(campos);
    }

    private static GastoMensual CrearGasto(int id, DateTime fecha, string? mensajeId = null, DateTime? cargadoUtc = null)
    {
        var gasto = new GastoMensual(
            fecha.Month, fecha.Year, GastoMensual.TipoVariable,
            "Alimentacion", "Super Ejemplo", 4500m, fecha, "Efectivo");
        typeof(GastoMensual).GetProperty(nameof(GastoMensual.Id))!.SetValue(gasto, id);
        if (mensajeId is not null)
            gasto.MarcarComoCargadoPorBot(mensajeId, cargadoUtc ?? DateTime.UtcNow);
        return gasto;
    }

    private static async Task<HttpResponseMessage> Enviar(
        HostDePrueba host,
        HttpMethod metodo,
        string url,
        string? clave,
        string? cuerpo = null)
    {
        using var request = new HttpRequestMessage(metodo, url);
        if (clave is not null)
            request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, clave);
        if (cuerpo is not null)
            request.Content = new StringContent(cuerpo, Encoding.UTF8, "application/json");

        return await host.Cliente.SendAsync(request);
    }

    // ----- 1. Autenticación -----

    [Fact]
    public async Task SinHeader_Devuelve401()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, clave: null, Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ClaveIncorrecta_Devuelve401()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, "clave-inventada", Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SinNingunClienteConfigurado_Devuelve503()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(new Dictionary<string, string?>(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    // ----- 2. Aislamiento de alcances -----

    [Fact]
    public async Task ClaveDeBotInasistencias_EnPostDeGastos_Devuelve403()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveInasistencias, Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClaveDeBotGastos_EnTitularPorTelefono_Devuelve403()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(
            host, HttpMethod.Get, "/api/bot/titular-por-telefono?numero=5490000000000", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    // ----- 3 y 4. Alta e idempotencia -----

    [Fact]
    public async Task PostValido_Devuelve201ConElGastoCreado()
    {
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Returns((GastoMensual guardado, CancellationToken _) =>
            {
                typeof(GastoMensual).GetProperty(nameof(GastoMensual.Id))!.SetValue(guardado, 7);
                return Task.FromResult((guardado, true));
            });
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);

        var hoy = HoyEnArgentina();
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = json.RootElement;
        raiz.GetProperty("id").GetInt32().Should().Be(7);
        raiz.GetProperty("tipo").GetString().Should().Be("Variable");
        raiz.GetProperty("categoria").GetString().Should().Be("Alimentacion");
        raiz.GetProperty("monto").GetDecimal().Should().Be(4500.00m);
        raiz.GetProperty("mes").GetInt32().Should().Be(hoy.Month);
        raiz.GetProperty("anio").GetInt32().Should().Be(hoy.Year);

        gastos.Verify(r => r.AgregarGastoDeBotAsync(
            It.Is<GastoMensual>(g => g.OrigenMensajeId == ClaveMensaje && g.OrigenMensajeId != MensajeId && g.Tipo == GastoMensual.TipoVariable),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MensajeIdYaExistente_Devuelve200ConElGastoExistente_SinVolverAGuardar()
    {
        var existente = CrearGasto(9, DateTime.UtcNow, ClaveMensaje, DateTime.UtcNow.AddMinutes(-5));
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existente);
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo());

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);

        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("id").GetInt32().Should().Be(9);
        json.RootElement.GetProperty("monto").GetDecimal().Should().Be(4500.00m);

        gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ----- 5. Validación (400) -----

    [Fact]
    public async Task MontoConComaDecimal_Devuelve400ConMensajeEnEspanol_YNoTocaElRepositorio()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo(monto: "4.500,50"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("message").GetString().Should().Contain("monto");
        gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CategoriaInventada_Devuelve400_YNoTocaElRepositorio()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo(categoria: "Inventada"));

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("message").GetString().Should().Contain("categoria");
        gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task FechaDeManana_Devuelve400_YNoTocaElRepositorio()
    {
        var manana = HoyEnArgentina().AddDays(1).ToString("yyyy-MM-dd");
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo(fecha: manana));

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("message").GetString().Should().Contain("posterior a hoy");
        gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CuerpoVacio_Devuelve400_YNoTocaElRepositorio()
    {
        var gastos = new Mock<IGastoRepository>();
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, cuerpo: "");

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ----- 6. Anulación (DELETE) -----

    [Fact]
    public async Task DeleteDeGastoDelBotReciente_Devuelve204_YLoElimina()
    {
        var gasto = CrearGasto(5, DateTime.UtcNow, MensajeId, DateTime.UtcNow);
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(gasto);
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{Url}/5", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NoContent);
        gastos.Verify(r => r.EliminarGastoMensualAsync(gasto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteDeIdInexistente_Devuelve404()
    {
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{Url}/999", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NotFound);
        gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteDeGastoCargadoDesdeLaApp_Devuelve400_YNoLoElimina()
    {
        var gastoDeLaApp = CrearGasto(6, DateTime.UtcNow);
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(6, It.IsAny<CancellationToken>()))
            .ReturnsAsync(gastoDeLaApp);
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{Url}/6", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteFueraDelPlazoDeVeinticuatroHoras_Devuelve400_YNoLoElimina()
    {
        var gastoViejo = CrearGasto(7, DateTime.UtcNow, "msg-viejo", DateTime.UtcNow.AddHours(-25));
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(gastoViejo);
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Delete, $"{Url}/7", ClaveGastos);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ----- 7. Campos extra -----

    [Fact]
    public async Task CampoExtraCargadoPor_SeIgnora_Devuelve201()
    {
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Returns((GastoMensual guardado, CancellationToken _) => Task.FromResult((guardado, true)));
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo(conCargadoPor: true));

        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ----- 8. Logs sin secretos ni datos del mensaje -----

    [Fact]
    public async Task PostValido_NiLaClaveNiElMensajeIdAparecenEnLosLogs()
    {
        var captura = new CapturaLoggerProvider();
        var gastos = new Mock<IGastoRepository>();
        gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Returns((GastoMensual guardado, CancellationToken _) => Task.FromResult((guardado, true)));
        await using var host = new HostDePrueba(ConClientesConfigurados(), gastos, captura);

        using var respuesta = await Enviar(host, HttpMethod.Post, Url, ClaveGastos, Cuerpo());
        respuesta.StatusCode.Should().Be(HttpStatusCode.Created);

        // Control: se capturaron logs, así que la ausencia de la clave y del mensajeId no es por falta de logs.
        captura.Registros.Should().NotBeEmpty();
        foreach (var registro in captura.Registros)
        {
            registro.Mensaje.Should().NotContain(ClaveGastos).And.NotContain(MensajeId);
            foreach (var (_, valor) in registro.Valores)
                (valor?.ToString() ?? string.Empty).Should().NotContain(ClaveGastos).And.NotContain(MensajeId);
        }
    }
}
