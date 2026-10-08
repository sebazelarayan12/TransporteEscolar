using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Middleware;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Pipeline HTTP real de la seguridad de la Fase 2 con un mini-host (TestServer): registra con los métodos reales
/// <c>AddBotApi</c> + <c>AddSeguridadApi</c> + CORS y arma los middlewares en el MISMO orden de <c>Program.cs</c>.
/// Los endpoints son mínimos (no hay base de datos): uno sin atributos (cae en la política general), uno anónimo,
/// uno con la política del bot local y uno con la política del bot de inasistencias.
/// </summary>
public class SeguridadApiPipelineTests
{
    private const string Secreto = "secreto-de-prueba-con-mas-de-32-bytes-0123456789";
    private const string OtroSecreto = "otro-secreto-distinto-con-mas-de-32-bytes-9876543210";
    private const string ClaveBotInasistencias = "clave-bot-inasistencias-ZZ1";
    private const string ClaveBotLocal = "clave-bot-local-QQ2";
    private const string OrigenPermitido = "https://front.ejemplo.test";

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

        public HostDePrueba(bool enforce)
        {
            var configuracion = new Dictionary<string, string?>
            {
                ["Auth:Enforce"] = enforce ? "true" : "false",
                ["Jwt:Secret"] = Secreto,
                ["ApiClients:BotInasistencias:Key"] = ClaveBotInasistencias,
                ["ApiClients:BotInasistencias:Scopes:0"] = ApiClientCatalog.ScopeBotIdentidad,
                ["ApiClients:BotLocal:Key"] = ClaveBotLocal,
                ["ApiClients:BotLocal:Scopes:0"] = ApiClientCatalog.ScopeLecturaBotLocal
            };

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
                        services.AddRouting();
                        services.AddBotApi(contexto.Configuration);
                        services.AddSeguridadApi(contexto.Configuration);
                        services.AddCors(opciones => opciones.AddPolicy("AllowFrontend", politica => politica
                            .WithOrigins(OrigenPermitido)
                            .AllowAnyHeader()
                            .AllowAnyMethod()));
                    })
                    .Configure(app =>
                    {
                        // Mismo orden que Program.cs.
                        app.UseMiddleware<ApiClientLoggingMiddleware>();
                        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
                        app.UseCors("AllowFrontend");
                        app.UseRouting();
                        app.UseAuthentication();
                        app.UseAuthorization();
                        app.UseEndpoints(endpoints =>
                        {
                            // Sin atributos: cae en la FallbackPolicy.
                            endpoints.MapGet("/api/prueba", () => "ok");
                            endpoints.MapGet("/api/publico", () => "ok").AllowAnonymous();
                            endpoints.MapGet("/api/bot-local", () => "ok")
                                .RequireAuthorization(ApiPolicies.LecturaBotLocal);
                            endpoints.MapGet("/api/bot-identidad", () => "ok")
                                .RequireAuthorization(ApiPolicies.BotIdentidad);
                        });
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

    private static string TokenDePersona(string secreto = Secreto) =>
        new TokenService(Microsoft.Extensions.Options.Options.Create(new JwtOptions { Secret = secreto }))
            .Emitir("admin").Token;

    private static string TokenExpirado()
    {
        var clave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secreto));
        var ahora = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer: JwtOptions.Issuer,
            audience: JwtOptions.Audience,
            claims: new[] { new Claim(TokenService.ClaimTipo, TokenService.TipoPersona) },
            notBefore: ahora.AddHours(-2),
            expires: ahora.AddHours(-1),
            signingCredentials: new SigningCredentials(clave, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task<HttpStatusCode> Pedir(
        HostDePrueba host, string ruta, string? bearer = null, string? apiKey = null, string? bearerCrudo = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ruta);
        if (bearer is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        if (bearerCrudo is not null)
            request.Headers.TryAddWithoutValidation("Authorization", bearerCrudo);
        if (apiKey is not null)
            request.Headers.Add(ApiKeyAuthenticationHandler.HeaderName, apiKey);

        using var respuesta = await host.Cliente.SendAsync(request);
        return respuesta.StatusCode;
    }

    // ----- 1) Política general (Enforce=true) -----

    [Fact]
    public async Task Enforce_PoliticaGeneral_SinToken_Devuelve401()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba")).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Enforce_PoliticaGeneral_ConTokenDePersonaValido_Devuelve200()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba", bearer: TokenDePersona())).Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Enforce_PoliticaGeneral_ConTokenExpirado_Devuelve401()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba", bearer: TokenExpirado())).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Enforce_PoliticaGeneral_ConTokenFirmadoConOtroSecreto_Devuelve401()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba", bearer: TokenDePersona(OtroSecreto))).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("Bearer basura")]
    [InlineData("Bearer ")]
    [InlineData("Bearer a.b.c")]
    [InlineData("Basic YWRtaW46YWRtaW4=")]
    public async Task Enforce_PoliticaGeneral_ConBasuraEnElHeader_Devuelve401(string header)
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba", bearerCrudo: header)).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Enforce_PoliticaGeneral_ConClaveApiKeyValida_NoDejaPasar()
    {
        // La política general solo autentica con JWT (Bearer): una ApiKey, por válida que sea, no es una persona.
        // Se rechaza con 401 (el esquema ApiKey ni siquiera se evalúa en endpoints sin política propia).
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/prueba", apiKey: ClaveBotInasistencias)).Should().Be(HttpStatusCode.Unauthorized);
        (await Pedir(host, "/api/prueba", apiKey: ClaveBotLocal)).Should().Be(HttpStatusCode.Unauthorized);
    }

    // ----- 2) Modo observación (Enforce=false) -----

    [Fact]
    public async Task Observacion_PoliticaGeneral_SinToken_Devuelve200_YRegistraQueHabriaRechazado_SinQueryString()
    {
        await using var host = new HostDePrueba(enforce: false);

        (await Pedir(host, "/api/prueba?token=valor-secreto-en-query&otro=1")).Should().Be(HttpStatusCode.OK);

        var logs = host.Logs.Mensajes.ToList();
        // El mensaje propio del handler lleva método y ruta, nunca la query string. (El log del framework
        // "Request starting ..." sí la incluye, por eso se revisa solo el mensaje del handler.)
        var observacion = logs.Where(m => m.Contains("Modo observación")).ToList();
        observacion.Should().ContainSingle().Which.Should().Be("Modo observación: habría rechazado GET /api/prueba");
    }

    [Fact]
    public async Task Observacion_TokenInvalidoOExpirado_TambienDevuelve200()
    {
        await using var host = new HostDePrueba(enforce: false);

        (await Pedir(host, "/api/prueba", bearer: TokenExpirado())).Should().Be(HttpStatusCode.OK);
        (await Pedir(host, "/api/prueba", bearerCrudo: "Bearer basura")).Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Observacion_PersonaLogueada_NoRegistraNingunRechazo()
    {
        await using var host = new HostDePrueba(enforce: false);

        (await Pedir(host, "/api/prueba", bearer: TokenDePersona())).Should().Be(HttpStatusCode.OK);

        host.Logs.Mensajes.Should().NotContain(m => m.Contains("Modo observación"));
    }

    // ----- 3) Anónimos -----

    [Fact]
    public async Task Enforce_EndpointAnonimo_SinToken_Devuelve200()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/publico")).Should().Be(HttpStatusCode.OK);
    }

    // ----- 4) Bot local -----

    [Fact]
    public async Task Enforce_BotLocal_ClienteBotLocalConScope_Devuelve200()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-local", apiKey: ClaveBotLocal)).Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Enforce_BotLocal_ClaveDeBotInasistencias_Devuelve403()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-local", apiKey: ClaveBotInasistencias)).Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Enforce_BotLocal_TokenDePersona_Devuelve200()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-local", bearer: TokenDePersona())).Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Enforce_BotLocal_SinCredenciales_Devuelve401()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-local")).Should().Be(HttpStatusCode.Unauthorized);
    }

    // ----- 5) Bot de inasistencias: su política no depende de Enforce -----

    [Fact]
    public async Task Enforce_BotIdentidad_TokenDePersona_NoDejaPasar()
    {
        // La política del bot solo autentica con ApiKey: el JWT de una persona no se evalúa y no tiene el
        // alcance bot:identidad. Se rechaza (401 porque no llega ninguna credencial ApiKey).
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-identidad", bearer: TokenDePersona())).Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Enforce_BotIdentidad_ClaveSinElAlcance_Devuelve403()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-identidad", apiKey: ClaveBotLocal)).Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Enforce_BotIdentidad_ClaveDelBotDeInasistencias_Devuelve200()
    {
        await using var host = new HostDePrueba(enforce: true);

        (await Pedir(host, "/api/bot-identidad", apiKey: ClaveBotInasistencias)).Should().Be(HttpStatusCode.OK);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task BotIdentidad_ConOSinEnforce_ClaveFaltante_Devuelve401_YClaveCorrecta_Devuelve200(bool enforce)
    {
        await using var host = new HostDePrueba(enforce);

        (await Pedir(host, "/api/bot-identidad")).Should().Be(HttpStatusCode.Unauthorized);
        (await Pedir(host, "/api/bot-identidad", apiKey: "clave-inventada")).Should().Be(HttpStatusCode.Unauthorized);
        (await Pedir(host, "/api/bot-identidad", apiKey: ClaveBotInasistencias)).Should().Be(HttpStatusCode.OK);
    }

    // ----- 6) Preflight CORS -----

    [Fact]
    public async Task Enforce_PreflightCors_Devuelve204ConAllowOrigin_NoDevuelve401()
    {
        await using var host = new HostDePrueba(enforce: true);

        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/prueba");
        request.Headers.Add("Origin", OrigenPermitido);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "authorization");

        using var respuesta = await host.Cliente.SendAsync(request);

        respuesta.StatusCode.Should().Be(HttpStatusCode.NoContent);
        respuesta.Headers.TryGetValues("Access-Control-Allow-Origin", out var origen).Should().BeTrue();
        origen.Should().ContainSingle().Which.Should().Be(OrigenPermitido);
    }

    // ----- 7) Secretos fuera de los logs -----

    [Fact]
    public async Task Enforce_NiElTokenNiLasClavesAparecenEnLosLogs()
    {
        await using var host = new HostDePrueba(enforce: true);
        var token = TokenDePersona();
        var otroToken = TokenDePersona(OtroSecreto);

        await Pedir(host, "/api/prueba", bearer: token);
        await Pedir(host, "/api/prueba", bearer: otroToken);
        await Pedir(host, "/api/prueba", bearer: TokenExpirado());
        await Pedir(host, "/api/prueba", apiKey: ClaveBotInasistencias);
        await Pedir(host, "/api/bot-local", apiKey: ClaveBotLocal);
        await Pedir(host, "/api/bot-local", apiKey: ClaveBotInasistencias);
        await Pedir(host, "/api/bot-identidad", apiKey: "clave-inventada-XYZ");

        var logs = string.Join("\n", host.Logs.Mensajes);
        logs.Should().NotBeEmpty("el mini-host registra los pedidos; sin logs la prueba pasaría en vacío");

        foreach (var prohibido in new[]
                 {
                     token, otroToken, Secreto, OtroSecreto, ClaveBotInasistencias, ClaveBotLocal, "clave-inventada-XYZ"
                 })
        {
            logs.Should().NotContain(prohibido);
        }
    }
}
