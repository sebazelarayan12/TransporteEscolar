using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Pipeline HTTP real del login con un mini-host (TestServer), con el <c>GlobalExceptionHandlerMiddleware</c>
/// real. Las opciones y el <see cref="TokenService"/> se registran a mano (el DI real llega en otra tarea).
/// </summary>
public class AuthLoginPipelineTests
{
    private const string Ruta = "/api/auth/login";
    private const string Usuario = "admin";
    private const string Password = "prueba-123";
    private const string Secreto = "secreto-de-prueba-con-mas-de-32-bytes-0123456789";

    // Hash de bajo costo solo para que los tests sean rápidos; el formato es el mismo.
    private static readonly string Hash = PasswordHasherParaTests();

    private static string PasswordHasherParaTests() => PasswordHasher.Hashear(Password, iteraciones: 1000);

    private sealed class ProveedorDeLogsEnMemoria : ILoggerProvider
    {
        public ConcurrentQueue<string> Mensajes { get; } = new();

        public ILogger CreateLogger(string categoryName) => new Registro(Mensajes);

        public void Dispose() { }

        private sealed class Registro(ConcurrentQueue<string> mensajes) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter) =>
                mensajes.Enqueue(formatter(state, exception) + (exception is null ? "" : exception.ToString()));
        }
    }

    private sealed class HostDePrueba : IAsyncDisposable
    {
        public IHost Host { get; }
        public HttpClient Cliente { get; }
        public ProveedorDeLogsEnMemoria Logs { get; } = new();

        public HostDePrueba(IDictionary<string, string?> configuracion)
        {
            Host = new HostBuilder()
                .ConfigureAppConfiguration(config => config.AddInMemoryCollection(configuracion))
                .ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.AddProvider(Logs);
                })
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices((contexto, services) =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(AuthController).Assembly);
                        services.Configure<AuthOptions>(contexto.Configuration.GetSection(AuthOptions.SectionName));
                        services.Configure<JwtOptions>(contexto.Configuration.GetSection(JwtOptions.SectionName));
                        services.AddSingleton<TokenService>();
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

    private static Dictionary<string, string?> ConfigCompleta() => new()
    {
        ["Auth:Usuario"] = Usuario,
        ["Auth:PasswordHash"] = Hash,
        ["Jwt:Secret"] = Secreto
    };

    private static async Task<(HttpResponseMessage Respuesta, string Cuerpo, HostDePrueba Host)> Login(
        Dictionary<string, string?> config, object? cuerpo)
    {
        var host = new HostDePrueba(config);
        using HttpContent contenido = cuerpo is null
            ? new StringContent("", System.Text.Encoding.UTF8, "application/json")
            : JsonContent.Create(cuerpo);
        var respuesta = await host.Cliente.PostAsync(Ruta, contenido);
        return (respuesta, await respuesta.Content.ReadAsStringAsync(), host);
    }

    [Fact]
    public async Task CredencialesCorrectas_Devuelve200ConTokenYExpiracionA30Dias()
    {
        var (respuesta, cuerpo, host) = await Login(ConfigCompleta(), new { usuario = Usuario, password = Password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.OK);
        using var json = JsonDocument.Parse(cuerpo);
        json.RootElement.GetProperty("token").GetString().Should().NotBeNullOrWhiteSpace();
        json.RootElement.GetProperty("expiraEn").GetDateTime().ToUniversalTime()
            .Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task PasswordIncorrecta_Devuelve401ConMensajeGenerico()
    {
        var (respuesta, cuerpo, host) = await Login(ConfigCompleta(), new { usuario = Usuario, password = "incorrecta" });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        using var json = JsonDocument.Parse(cuerpo);
        json.RootElement.GetProperty("message").GetString().Should().Be("Usuario o contraseña incorrectos");
    }

    [Fact]
    public async Task UsuarioIncorrecto_Devuelve401ConElMismoMensaje()
    {
        var (respuesta, cuerpo, host) = await Login(ConfigCompleta(), new { usuario = "otro", password = Password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        using var json = JsonDocument.Parse(cuerpo);
        json.RootElement.GetProperty("message").GetString().Should().Be("Usuario o contraseña incorrectos");
    }

    [Fact]
    public async Task CuerpoVacio_Devuelve400()
    {
        var (respuesta, _, host) = await Login(ConfigCompleta(), null);
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("", "x")]
    [InlineData("admin", "")]
    [InlineData(null, null)]
    public async Task CamposVacios_Devuelve400(string? usuario, string? password)
    {
        var (respuesta, _, host) = await Login(ConfigCompleta(), new { usuario, password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SinPasswordHash_Devuelve503()
    {
        var config = ConfigCompleta();
        config.Remove("Auth:PasswordHash");

        var (respuesta, _, host) = await Login(config, new { usuario = Usuario, password = Password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task SinUsuarioConfigurado_Devuelve503()
    {
        var config = ConfigCompleta();
        config.Remove("Auth:Usuario");

        var (respuesta, _, host) = await Login(config, new { usuario = Usuario, password = Password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task SecretoDe10Caracteres_Devuelve503()
    {
        var config = ConfigCompleta();
        config["Jwt:Secret"] = "0123456789";

        var (respuesta, _, host) = await Login(config, new { usuario = Usuario, password = Password });
        await using var _ = host;

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task RespuestasDeErrorYLogs_NoContienenPasswordHashNiSecreto()
    {
        // Se ejercitan todos los caminos de error y el exitoso en el mismo host.
        await using var host = new HostDePrueba(ConfigCompleta());
        var cuerpos = new List<string>();
        foreach (var body in new object[]
                 {
                     new { usuario = Usuario, password = "intento-incorrecto-xyz" },
                     new { usuario = "intruso", password = Password },
                     new { usuario = "", password = "" }
                 })
        {
            using var contenido = JsonContent.Create(body);
            var respuesta = await host.Cliente.PostAsync(Ruta, contenido);
            cuerpos.Add(await respuesta.Content.ReadAsStringAsync());
        }

        using var ok = JsonContent.Create(new { usuario = Usuario, password = Password });
        var exito = await host.Cliente.PostAsync(Ruta, ok);
        var tokenEmitido = JsonDocument.Parse(await exito.Content.ReadAsStringAsync())
            .RootElement.GetProperty("token").GetString()!;

        var logs = string.Join("\n", host.Logs.Mensajes);
        var errores = string.Join("\n", cuerpos);

        foreach (var prohibido in new[] { Password, "intento-incorrecto-xyz", Hash, Secreto, tokenEmitido })
        {
            errores.Should().NotContain(prohibido);
            logs.Should().NotContain(prohibido);
        }
    }

    [Fact]
    public async Task SinConfigurar_LosLogsNoContienenLaPassword()
    {
        await using var host = new HostDePrueba(new Dictionary<string, string?>());
        using var contenido = JsonContent.Create(new { usuario = Usuario, password = Password });

        var respuesta = await host.Cliente.PostAsync(Ruta, contenido);

        respuesta.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        string.Join("\n", host.Logs.Mensajes).Should().NotContain(Password);
        (await respuesta.Content.ReadAsStringAsync()).Should().NotContain(Password);
    }

    [Fact]
    public async Task Get_Devuelve405()
    {
        await using var host = new HostDePrueba(ConfigCompleta());

        var respuesta = await host.Cliente.GetAsync(Ruta);

        respuesta.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }
}
