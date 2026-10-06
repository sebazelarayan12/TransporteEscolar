using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Prueba el <see cref="ApiClientLoggingMiddleware"/> con un mini-host (TestServer) y un logger de captura
/// en memoria. Lo más importante: el log nunca debe contener el query string (teléfono) ni la clave.
/// </summary>
public class ApiClientLoggingMiddlewareTests
{
    private const string ClaveBot = "clave-secreta-del-bot-987";

    /// <summary>Un log capturado: mensaje formateado y valores estructurados.</summary>
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
                var valores = state as IReadOnlyList<KeyValuePair<string, object?>>
                              ?? new List<KeyValuePair<string, object?>>();
                lock (registros)
                    registros.Add(new Registro(categoria, formatter(state, exception), valores));
            }
        }
    }

    private static Dictionary<string, string?> ConfigBot() => new()
    {
        ["ApiClients:BotInasistencias:Key"] = ClaveBot,
        ["ApiClients:BotInasistencias:Scopes:0"] = "bot:identidad"
    };

    /// <summary>Hace un GET con el header opcional y devuelve solo los logs del middleware.</summary>
    private static async Task<List<Registro>> Pedir(string url, string? apiKey, string? segundaApiKey = null)
    {
        var captura = new CapturaLoggerProvider();

        using var host = new HostBuilder()
            .ConfigureAppConfiguration(config => config.AddInMemoryCollection(ConfigBot()))
            .ConfigureLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddProvider(captura);
            })
            .ConfigureWebHost(web => web
                .UseTestServer()
                .ConfigureServices((contexto, services) =>
                {
                    services.AddRouting();
                    services.AddBotApi(contexto.Configuration);
                })
                .Configure(app =>
                {
                    app.UseRouting();
                    app.UseAuthentication();
                    app.UseMiddleware<ApiClientLoggingMiddleware>();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapGet("/api/prueba", () => "ok");
                        endpoints.MapGet("/health", () => "ok");
                    });
                }))
            .Build();

        await host.StartAsync();
        try
        {
            using var cliente = host.GetTestClient();
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            if (apiKey is not null)
                request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, apiKey);
            if (segundaApiKey is not null)
                request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, segundaApiKey);

            using var respuesta = await cliente.SendAsync(request);
            respuesta.EnsureSuccessStatusCode();
        }
        finally
        {
            await host.StopAsync();
        }

        return captura.Registros
            .Where(r => r.Categoria == typeof(ApiClientLoggingMiddleware).FullName)
            .ToList();
    }

    private static object? Valor(Registro registro, string nombre) =>
        registro.Valores.Single(v => v.Key == nombre).Value;

    [Fact]
    public async Task SinHeader_RegistraClienteAnonimoYLaRuta()
    {
        var logs = await Pedir("/api/prueba", apiKey: null);

        var log = logs.Should().ContainSingle().Subject;
        Valor(log, "Cliente").Should().Be("anonimo");
        Valor(log, "Ruta").Should().Be("/api/prueba");
        Valor(log, "Metodo").Should().Be("GET");
        Valor(log, "Status").Should().Be(200);
        log.Mensaje.Should().Be("Pedido GET /api/prueba cliente=anonimo status=200");
    }

    [Fact]
    public async Task ConLaClaveCorrecta_RegistraElNombreDelCliente()
    {
        var logs = await Pedir("/api/prueba", ClaveBot);

        var log = logs.Should().ContainSingle().Subject;
        Valor(log, "Cliente").Should().Be("BotInasistencias");
    }

    [Fact]
    public async Task ConClaveDesconocida_RegistraClaveInvalida()
    {
        var logs = await Pedir("/api/prueba", "clave-que-no-existe");

        var log = logs.Should().ContainSingle().Subject;
        Valor(log, "Cliente").Should().Be("clave-invalida");
    }

    [Fact]
    public async Task ConHeaderRepetido_SeRegistraComoClaveInvalida()
    {
        // Header repetido (aunque uno sea correcto): el handler no autentica, se documenta como "clave-invalida".
        var logs = await Pedir("/api/prueba", ClaveBot, ClaveBot);

        var log = logs.Should().ContainSingle().Subject;
        Valor(log, "Cliente").Should().Be("clave-invalida");
    }

    [Fact]
    public async Task ConQueryString_ElLogNoContieneElNumeroNiElQuery()
    {
        const string numero = "5493815551234";

        var logs = await Pedir($"/api/prueba?numero={numero}", ClaveBot);

        var log = logs.Should().ContainSingle().Subject;
        log.Mensaje.Should().NotContain(numero).And.NotContain("numero").And.NotContain("?");
        foreach (var (clave, valor) in log.Valores)
        {
            clave.Should().NotContain("numero");
            (valor?.ToString() ?? string.Empty).Should().NotContain(numero).And.NotContain("?");
        }
        Valor(log, "Ruta").Should().Be("/api/prueba");
    }

    [Fact]
    public async Task PedidoAHealth_NoGeneraLogDelMiddleware()
    {
        var logs = await Pedir("/health", apiKey: null);

        logs.Should().BeEmpty();
    }

    [Theory]
    [InlineData(ClaveBot)]
    [InlineData("clave-que-no-existe")]
    public async Task ElLogNuncaContieneLaClaveEnviada(string claveEnviada)
    {
        var logs = await Pedir("/api/prueba?numero=5493815551234", claveEnviada);
        // Control: el log existe, así que la ausencia de la clave no es por falta de log.

        var log = logs.Should().ContainSingle().Subject;
        log.Mensaje.Should().NotContain(claveEnviada);
        foreach (var (_, valor) in log.Valores)
            (valor?.ToString() ?? string.Empty).Should().NotContain(claveEnviada);
    }
}
