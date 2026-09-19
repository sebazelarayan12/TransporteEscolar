using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Domain.ValueObjects;
using TransporteEscolar.Infrastructure.Services;

namespace TransporteEscolar.Tests.Infrastructure;

public class OsrmRutaProviderTests
{
    private static readonly Coordenada Casa = new(-26.8225289, -65.2860859);
    private static readonly Coordenada Colegio = new(-26.8158608, -65.2742406);

    /// <summary>Respuesta real del demo de OSRM para el tramo Boisdron - San Patricio.</summary>
    private const string RespuestaOk = """
    {"code":"Ok","routes":[{"distance":3060.6,"duration":335.8,"geometry":"abc123"}]}
    """;

    private const string RespuestaSinRuta = """
    {"code":"NoRoute","message":"Impossible route between points"}
    """;

    private static (OsrmRutaProvider Provider, List<Uri> UrlsLlamadas) CrearProvider(
        HttpStatusCode codigo,
        string cuerpo)
    {
        var urls = new List<Uri>();
        var handler = new Mock<HttpMessageHandler>();

        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .Callback<HttpRequestMessage, CancellationToken>((request, _) => urls.Add(request.RequestUri!))
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = codigo,
                Content = new StringContent(cuerpo)
            });

        var httpClient = new HttpClient(handler.Object)
        {
            BaseAddress = new Uri("https://osrm.test")
        };

        var options = Options.Create(new RuteoOptions
        {
            BaseUrl = "https://osrm.test",
            TimeoutSegundos = 20,
            PerfilVehiculo = "driving"
        });

        var provider = new OsrmRutaProvider(httpClient, options, NullLogger<OsrmRutaProvider>.Instance);
        return (provider, urls);
    }

    [Fact]
    public async Task CalcularRutaAsync_ConRespuestaOk_DevuelveDistanciaRedondeadaAEnteros()
    {
        var (provider, _) = CrearProvider(HttpStatusCode.OK, RespuestaOk);

        var resultado = await provider.CalcularRutaAsync(Casa, Colegio);

        resultado.Should().NotBeNull();
        resultado!.DistanciaMetros.Should().Be(3061);
        resultado.DuracionSegundos.Should().Be(336);
        resultado.GeometriaPolyline.Should().Be("abc123");
    }

    [Fact]
    public async Task CalcularRutaAsync_ArmaLaUrlConLongitudAntesDeLatitud()
    {
        // OSRM espera lon,lat. Invertir el orden devuelve rutas en otro continente.
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, RespuestaOk);

        await provider.CalcularRutaAsync(Casa, Colegio);

        urls.Should().ContainSingle();
        urls[0].AbsoluteUri.Should().Contain("-65.2860859,-26.8225289;-65.2742406,-26.8158608");
    }

    [Fact]
    public async Task CalcularRutaAsync_CuandoOsrmNoEncuentraRuta_DevuelveNull()
    {
        var (provider, _) = CrearProvider(HttpStatusCode.OK, RespuestaSinRuta);

        var resultado = await provider.CalcularRutaAsync(Casa, Colegio);

        resultado.Should().BeNull();
    }

    [Fact]
    public async Task CalcularRutaAsync_ConErrorHttp_DevuelveNull()
    {
        var (provider, _) = CrearProvider(HttpStatusCode.ServiceUnavailable, "");

        var resultado = await provider.CalcularRutaAsync(Casa, Colegio);

        resultado.Should().BeNull();
    }

    [Fact]
    public async Task CalcularRutaOptimizadaAsync_ConUnaSolaParada_DelegaEnLaRutaSimple()
    {
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, RespuestaOk);

        var resultado = await provider.CalcularRutaOptimizadaAsync(new[] { Casa }, Colegio);

        resultado.Should().NotBeNull();
        urls[0].AbsoluteUri.Should().Contain("/route/v1/");
    }

    [Fact]
    public async Task CalcularRutaOptimizadaAsync_SinParadas_DevuelveNullSinLlamarAOsrm()
    {
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, RespuestaOk);

        var resultado = await provider.CalcularRutaOptimizadaAsync(Array.Empty<Coordenada>(), Colegio);

        resultado.Should().BeNull();
        urls.Should().BeEmpty();
    }

    [Fact]
    public async Task CalcularRutaOptimizadaAsync_ConVariasParadas_UsaElEndpointTrip()
    {
        const string respuestaTrip = """
        {"code":"Ok","trips":[{"distance":8200.4,"duration":900.2,"geometry":"xyz"}]}
        """;
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, respuestaTrip);

        var resultado = await provider.CalcularRutaOptimizadaAsync(
            new[] { Casa, new Coordenada(-26.7300, -65.2800) },
            Colegio);

        resultado.Should().NotBeNull();
        resultado!.DistanciaMetros.Should().Be(8200);
        urls[0].AbsoluteUri.Should().Contain("/trip/v1/");
        urls[0].AbsoluteUri.Should().Contain("source=any");
        urls[0].AbsoluteUri.Should().Contain("destination=last");
        urls[0].AbsoluteUri.Should().Contain("roundtrip=false");
    }

    private const string RespuestaMatriz = """
    {"code":"Ok","distances":[[0,3060.6],[3055.2,0]]}
    """;

    [Fact]
    public async Task CalcularMatrizDistanciasAsync_ConRespuestaOk_DevuelveLaMatriz()
    {
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, RespuestaMatriz);

        var matriz = await provider.CalcularMatrizDistanciasAsync(new[] { Casa, Colegio });

        matriz.Should().NotBeNull();
        matriz![0][1].Should().Be(3060.6);
        matriz[1][0].Should().Be(3055.2);
        urls[0].AbsoluteUri.Should().Contain("/table/v1/");
        urls[0].AbsoluteUri.Should().Contain("annotations=distance");
        urls[0].AbsoluteUri.Should().Contain("-65.2860859,-26.8225289");
    }

    [Fact]
    public async Task CalcularMatrizDistanciasAsync_ConParInalcanzable_DevuelveNull()
    {
        const string conNulo = """
        {"code":"Ok","distances":[[0,null],[3055.2,0]]}
        """;
        var (provider, _) = CrearProvider(HttpStatusCode.OK, conNulo);

        var matriz = await provider.CalcularMatrizDistanciasAsync(new[] { Casa, Colegio });

        matriz.Should().BeNull();
    }

    [Fact]
    public async Task CalcularMatrizDistanciasAsync_SinPuntos_DevuelveNullSinLlamarAOsrm()
    {
        var (provider, urls) = CrearProvider(HttpStatusCode.OK, RespuestaMatriz);

        var matriz = await provider.CalcularMatrizDistanciasAsync(Array.Empty<Coordenada>());

        matriz.Should().BeNull();
        urls.Should().BeEmpty();
    }
}
