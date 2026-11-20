using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Comprueba que <c>DiciembreController</c>, sin <c>[Authorize]</c> propio, queda protegido por la FallbackPolicy JWT.
/// Las peticiones sin token se rechazan antes de llegar a la acción, así que no hace falta registrar repositorios.
/// </summary>
public class DiciembreSeguridadPipelineTests
{
    private const string Secreto = "secreto-de-prueba-diciembre-0123456789abcdef";

    private sealed class HostDePrueba : IAsyncDisposable
    {
        public IHost Host { get; }
        public HttpClient Cliente { get; }

        public HostDePrueba()
        {
            var configuracion = new Dictionary<string, string?>
            {
                ["Auth:Enforce"] = "true",
                ["Jwt:Secret"] = Secreto
            };

            Host = new HostBuilder()
                .ConfigureAppConfiguration(config => config.AddInMemoryCollection(configuracion))
                .ConfigureLogging(logging => logging.ClearProviders())
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices((contexto, services) =>
                    {
                        services.AddRouting();
                        services.AddControllers()
                            .AddApplicationPart(typeof(DiciembreController).Assembly);
                        services.AddBotApi(contexto.Configuration);
                        services.AddSeguridadApi(contexto.Configuration);
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

    [Fact]
    public async Task GetDiciembre_SinToken_DevuelveUnauthorized()
    {
        await using var host = new HostDePrueba();

        var respuesta = await host.Cliente.GetAsync("/api/diciembre?anio=2026");

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ConfirmarDiciembre_SinToken_DevuelveUnauthorized()
    {
        await using var host = new HostDePrueba();
        var cuerpo = new StringContent("{\"anio\":2026,\"va\":true,\"monto\":60000}", Encoding.UTF8, "application/json");

        var respuesta = await host.Cliente.PutAsync("/api/diciembre/titulares/1", cuerpo);

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
