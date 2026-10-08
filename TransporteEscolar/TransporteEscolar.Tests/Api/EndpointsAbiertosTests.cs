using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TransporteEscolar.Api.DependencyInjection;
using TransporteEscolar.Api.Controllers;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Red de seguridad del modelo "todo cerrado por omisión": desde la Fase 2 existe una política general
/// (<c>FallbackPolicy</c>) que exige una persona logueada en todo endpoint sin atributo propio, así que ya no hay
/// endpoints abiertos por omisión ni lista de "abiertos conocidos".
/// <para>
/// Lo que sí puede abrir un endpoint es <c>[AllowAnonymous]</c>. Este test enumera por reflexión TODOS los
/// endpoints (todos los verbos) que lo llevan, en el método o en el controller, y exige que sean exactamente
/// los tres públicos por diseño. Agregar otro anónimo obliga a decidirlo a propósito, tocando esta lista.
/// </para>
/// </summary>
public class EndpointsAbiertosTests
{
    /// <summary>Únicos endpoints anónimos permitidos. Formato: "VERBO ruta" tal como la arma el enumerador.</summary>
    private static readonly string[] AnonimosPermitidos =
    [
        "GET api/Health",
        "GET api/push-subscriptions/vapid-public-key",
        "POST api/auth/login"
    ];

    private static readonly string[] VerbosDeEscritura = ["POST", "PUT", "PATCH", "DELETE"];

    private sealed record Endpoint(string Verbo, string Clave, MethodInfo Metodo, bool Anonimo);

    [Fact]
    public void Los_unicos_endpoints_anonimos_son_login_health_y_vapid_public_key()
    {
        var anonimos = EnumerarEndpoints()
            .Where(e => e.Anonimo)
            .Select(e => e.Clave)
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        anonimos.Should().Equal(
            AnonimosPermitidos.OrderBy(c => c, StringComparer.Ordinal),
            "solo login, health y la clave pública VAPID son públicos; todo lo demás exige autenticación");
    }

    [Fact]
    public void La_politica_general_exige_autenticacion()
    {
        var configuracion = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBotApi(configuracion);
        services.AddSeguridadApi(configuracion);
        using var proveedor = services.BuildServiceProvider();

        var politica = proveedor.GetRequiredService<IAuthorizationPolicyProvider>()
            .GetFallbackPolicyAsync().GetAwaiter().GetResult();

        politica.Should().NotBeNull("sin FallbackPolicy los endpoints nuevos nacerían abiertos");
        politica!.AuthenticationSchemes.Should().Contain(JwtBearerDefaults.AuthenticationScheme);
        politica.Requirements.Should().NotBeEmpty();
    }

    [Fact]
    public void El_enumerador_encuentra_endpoints_de_escritura_y_reconoce_los_protegidos()
    {
        // Guarda contra un falso verde: si la reflexión dejara de encontrar endpoints, el test de anónimos
        // pasaría en vacío.
        var endpoints = EnumerarEndpoints().ToList();

        endpoints.Where(e => VerbosDeEscritura.Contains(e.Verbo)).Should().NotBeEmpty();
        endpoints.Should().Contain(e => e.Clave == "POST api/auth/login" && e.Anonimo,
            "el enumerador debe reconocer [AllowAnonymous] de clase");

        var metodoBot = typeof(BotController).GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Single(m => m.GetCustomAttributes<HttpMethodAttribute>().Any());
        typeof(BotController).GetCustomAttributes(inherit: true).OfType<IAuthorizeData>().Should().NotBeEmpty(
            "BotController sigue protegido con [Authorize] (política ApiKey)");
        EsAnonimo(metodoBot).Should().BeFalse();
    }

    // Se omitió Ningun_endpoint_de_escritura_usa_ServiceFilter_ni_TypeFilter_de_autenticacion_casera: es redundante,
    // BotApiIsolationTests ya prohíbe [ServiceFilter] y [TypeFilter] en todos los controllers.

    private static IEnumerable<Endpoint> EnumerarEndpoints()
    {
        var controllers = typeof(BotController).Assembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

        foreach (var controller in controllers)
        {
            var nombre = controller.Name.EndsWith("Controller", StringComparison.Ordinal)
                ? controller.Name[..^"Controller".Length]
                : controller.Name;
            var rutaBase = (controller.GetCustomAttribute<RouteAttribute>()?.Template ?? string.Empty)
                .Replace("[controller]", nombre, StringComparison.OrdinalIgnoreCase);

            var metodos = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            foreach (var metodo in metodos)
            {
                foreach (var http in metodo.GetCustomAttributes<HttpMethodAttribute>())
                {
                    foreach (var verbo in http.HttpMethods)
                    {
                        var ruta = string.IsNullOrEmpty(http.Template)
                            ? rutaBase
                            : $"{rutaBase.TrimEnd('/')}/{http.Template.TrimStart('/')}";
                        var verboNormalizado = verbo.ToUpperInvariant();

                        yield return new Endpoint(
                            verboNormalizado,
                            $"{verboNormalizado} {ruta.Trim('/')}",
                            metodo,
                            EsAnonimo(metodo));
                    }
                }
            }
        }
    }

    // [AllowAnonymous] en el método o en el controller (incluye heredados).
    private static bool EsAnonimo(MethodInfo metodo) =>
        metodo.GetCustomAttributes<AllowAnonymousAttribute>(inherit: true).Any()
        || metodo.DeclaringType!.GetCustomAttributes<AllowAnonymousAttribute>(inherit: true).Any();
}
