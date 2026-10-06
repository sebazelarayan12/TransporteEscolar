using System.Net;
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
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Application;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Prueba el pipeline HTTP real de la ruta del bot con un mini-host (TestServer).
/// NO usa el <c>Program</c> real: su Main ejecuta <c>Database.Migrate()</c> contra Npgsql, que no
/// funciona con InMemory. Sí corre el <c>GlobalExceptionHandlerMiddleware</c> real antes del routing,
/// así se comprueba el status code real (401/503 no deben terminar en 500).
/// </summary>
public class BotEndpointPipelineTests
{
    private const string ClaveReal = "clave-de-prueba-123";
    private const string Ruta = "/api/bot/titular-por-telefono";

    /// <summary>Host mínimo con controllers del assembly Api, MediatR real y repositorios Moq.</summary>
    private sealed class HostDePrueba : IAsyncDisposable
    {
        public IHost Host { get; }
        public HttpClient Cliente { get; }

        public HostDePrueba(
            IDictionary<string, string?> configuracion,
            Mock<ITitularRepository> titulares,
            Mock<IPasajeroRepository> pasajeros)
        {
            Host = new HostBuilder()
                .ConfigureAppConfiguration(config =>
                {
                    // Sin entradas BotApi:ApiKey ni ApiClients:* queda "no configurada" (503).
                    config.AddInMemoryCollection(configuracion);
                })
                .ConfigureLogging(logging => logging.ClearProviders())
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices((contexto, services) =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(BotController).Assembly);
                        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<AssemblyMarker>());
                        services.AddSingleton(titulares.Object);
                        services.AddSingleton(pasajeros.Object);
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

    private static Titular CrearTitular(int id, string apellido, string contacto)
    {
        var titular = new Titular(apellido, contacto, "Calle 123", 15000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        return titular;
    }

    // Repositorios con un caso realista: la base guarda el número sin el 9 móvil.
    private static (Mock<ITitularRepository> Titulares, Mock<IPasajeroRepository> Pasajeros) CrearRepositorios()
    {
        var titulares = new Mock<ITitularRepository>();
        titulares
            .Setup(r => r.GetTelefonosActivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TelefonoActivo> { new(62, "+543814123456") });
        titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(62, "Perez", "María") });

        var pasajeros = new Mock<IPasajeroRepository>();
        pasajeros
            .Setup(r => r.GetNombresActivosPorTitularesAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PasajeroActivoBasico>
            {
                new(102, 62, "Sofia"),
                new(101, 62, "Juan")
            });

        return (titulares, pasajeros);
    }

    // Caso común: clave heredada BotApi:ApiKey (null = sin entrada de configuración).
    private static Task<HttpResponseMessage> Consultar(
        string? apiKeyConfigurada,
        string url,
        string? headerKey)
    {
        var config = new Dictionary<string, string?>();
        if (apiKeyConfigurada is not null)
            config["BotApi:ApiKey"] = apiKeyConfigurada;

        return Consultar(config, url, headerKey is null ? Array.Empty<string>() : new[] { headerKey });
    }

    private static async Task<HttpResponseMessage> Consultar(
        IDictionary<string, string?> configuracion,
        string url,
        params string[] valoresHeader)
    {
        var (titulares, pasajeros) = CrearRepositorios();
        await using var host = new HostDePrueba(configuracion, titulares, pasajeros);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (valoresHeader.Length > 0)
            request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, valoresHeader);

        return await host.Cliente.SendAsync(request);
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

    private const string UrlValida = Ruta + "?numero=5493814123456";

    [Fact]
    public async Task SinHeader_Devuelve401()
    {
        var respuesta = await Consultar(ClaveReal, $"{Ruta}?numero=5493814123456", headerKey: null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task KeyIncorrecta_Devuelve401()
    {
        var respuesta = await Consultar(ClaveReal, $"{Ruta}?numero=5493814123456", headerKey: "incorrecta");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SinKey_SinNumero_Devuelve401_LaAutorizacionVaAntesDeLaValidacion()
    {
        var respuesta = await Consultar(ClaveReal, Ruta, headerKey: null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task KeyNoConfigurada_ConHeaderPresente_Devuelve503(string? configurada)
    {
        var respuesta = await Consultar(configurada, $"{Ruta}?numero=5493814123456", headerKey: ClaveReal);

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task KeyCorrecta_NumeroValido_Devuelve200ConElJsonDelContrato()
    {
        var respuesta = await Consultar(ClaveReal, $"{Ruta}?numero=5493814123456", headerKey: ClaveReal);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);

        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        var raiz = json.RootElement;
        raiz.EnumerateObject().Select(p => p.Name).Should().Equal("coincidencias");

        var coincidencias = raiz.GetProperty("coincidencias");
        coincidencias.GetArrayLength().Should().Be(1);

        var coincidencia = coincidencias[0];
        coincidencia.EnumerateObject().Select(p => p.Name)
            .Should().BeEquivalentTo("titularId", "apellido", "nombreContacto", "pasajeros");
        coincidencia.GetProperty("titularId").GetInt32().Should().Be(62);
        coincidencia.GetProperty("apellido").GetString().Should().Be("PEREZ");
        coincidencia.GetProperty("nombreContacto").GetString().Should().Be("María");

        var pasajeros = coincidencia.GetProperty("pasajeros");
        pasajeros.GetArrayLength().Should().Be(2);
        pasajeros[0].EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo("id", "nombre");
        pasajeros[0].GetProperty("id").GetInt32().Should().Be(101);
        pasajeros[0].GetProperty("nombre").GetString().Should().Be("Juan");
        pasajeros[1].GetProperty("id").GetInt32().Should().Be(102);
        pasajeros[1].GetProperty("nombre").GetString().Should().Be("Sofia");
    }

    [Theory]
    [InlineData("")]
    [InlineData("?numero=")]
    [InlineData("?numero=abc")]
    public async Task KeyCorrecta_NumeroAusenteOSinDigitos_Devuelve400(string query)
    {
        var respuesta = await Consultar(ClaveReal, Ruta + query, headerKey: ClaveReal);

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task KeyCorrecta_NumeroConDigitosPeroNoNormalizable_Devuelve200ConCoincidenciasVacio()
    {
        // 15 dígitos, estilo id @lid de WhatsApp.
        var respuesta = await Consultar(ClaveReal, $"{Ruta}?numero=123456789012345", headerKey: ClaveReal);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(await respuesta.Content.ReadAsStringAsync());
        json.RootElement.GetProperty("coincidencias").GetArrayLength().Should().Be(0);
    }

    // ----- Casos portados de ApiKeyFilterTests (borrado) -----

    [Fact]
    public async Task HeaderVacio_Devuelve401()
    {
        var respuesta = await Consultar(ClaveReal, UrlValida, headerKey: "");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("x")]
    [InlineData("clave-de-prueba-12")]
    [InlineData("clave-de-prueba-1234")]
    [InlineData("una-clave-incorrecta-mucho-mas-larga-que-la-real-0123456789")]
    public async Task KeyIncorrectaDeDistintoLargo_Devuelve401SinExcepcion(string recibida)
    {
        var respuesta = await Consultar(ClaveReal, UrlValida, headerKey: recibida);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HeaderRepetido_Devuelve401AunqueUnoSeaCorrecto()
    {
        var config = new Dictionary<string, string?> { ["BotApi:ApiKey"] = ClaveReal };

        var respuesta = await Consultar(config, UrlValida, ClaveReal, ClaveReal);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task KeyNoConfigurada_SinHeader_TambienDevuelve503(string? configurada)
    {
        var respuesta = await Consultar(configurada, UrlValida, headerKey: null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    // ----- Clientes con alcances -----

    [Fact]
    public async Task ClienteBotInasistenciasConScope_ClaveCorrecta_Devuelve200()
    {
        var config = Cliente("BotInasistencias", "clave-cliente-bot", "bot:identidad");

        var respuesta = await Consultar(config, UrlValida, "clave-cliente-bot");

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ClienteSinElScopeDelBot_ClaveCorrecta_Devuelve403()
    {
        var config = Cliente("BotLocal", "clave-bot-local", "lectura:bot-local");

        var respuesta = await Consultar(config, UrlValida, "clave-bot-local");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClaveDeBotLocalConviviendoConBotInasistencias_Da403_YLaDelBot_Da200()
    {
        var config = Unir(
            Cliente("BotInasistencias", "clave-cliente-bot", "bot:identidad"),
            Cliente("BotLocal", "clave-bot-local", "lectura:bot-local"));

        var conLocal = await Consultar(config, UrlValida, "clave-bot-local");
        var conBot = await Consultar(config, UrlValida, "clave-cliente-bot");

        conLocal.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        conBot.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ClienteExplicitoGanaSobreElAliasHeredado()
    {
        var config = Unir(
            Cliente("BotInasistencias", "clave-A", "bot:identidad"),
            new Dictionary<string, string?> { ["BotApi:ApiKey"] = "clave-B" });

        var conA = await Consultar(config, UrlValida, "clave-A");
        var conB = await Consultar(config, UrlValida, "clave-B");

        conA.StatusCode.Should().Be(HttpStatusCode.OK);
        conB.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SoloBotLocalConfigurado_ClaveInventadaOSinHeader_Devuelve401()
    {
        var config = Cliente("BotLocal", "clave-bot-local", "lectura:bot-local");

        var inventada = await Consultar(config, UrlValida, "clave-inventada");
        var sinHeader = await Consultar(config, UrlValida);

        inventada.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        sinHeader.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ClienteConKeyEnBlanco_SeIgnora_Devuelve503()
    {
        var config = Cliente("BotLocal", "   ", "bot:identidad");

        var respuesta = await Consultar(config, UrlValida, "cualquier-cosa");

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Theory]
    [InlineData(ClaveReal)]
    [InlineData(null)]
    public async Task Health_Devuelve200SinNingunHeader_ConLaKeyConfiguradaOSinConfigurar(string? configurada)
    {
        // Regresión: la autorización por API key solo aplica al BotController, nunca al resto de la API.
        var respuesta = await Consultar(configurada, "/api/health", headerKey: null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
