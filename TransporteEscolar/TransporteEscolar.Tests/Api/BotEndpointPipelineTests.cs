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
using TransporteEscolar.Api.Filters;
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

        public HostDePrueba(string? apiKey, Mock<ITitularRepository> titulares, Mock<IPasajeroRepository> pasajeros)
        {
            Host = new HostBuilder()
                .ConfigureAppConfiguration(config =>
                {
                    // Sin la entrada BotApi:ApiKey queda "no configurada" (503).
                    if (apiKey is not null)
                        config.AddInMemoryCollection(new Dictionary<string, string?> { ["BotApi:ApiKey"] = apiKey });
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

    private static async Task<HttpResponseMessage> Consultar(
        string? apiKeyConfigurada,
        string url,
        string? headerKey)
    {
        var (titulares, pasajeros) = CrearRepositorios();
        await using var host = new HostDePrueba(apiKeyConfigurada, titulares, pasajeros);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (headerKey is not null)
            request.Headers.Add(ApiKeyFilter.HeaderName, headerKey);

        return await host.Cliente.SendAsync(request);
    }

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

    [Theory]
    [InlineData(ClaveReal)]
    [InlineData(null)]
    public async Task Health_Devuelve200SinNingunHeader_ConLaKeyConfiguradaOSinConfigurar(string? configurada)
    {
        // Regresión: el filtro de API key solo aplica al BotController, nunca al resto de la API.
        var respuesta = await Consultar(configurada, "/api/health", headerKey: null);

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
