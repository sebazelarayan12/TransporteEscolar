using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Controllers;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Guardián de aislamiento. Desde la Fase 2 hay una política general que cierra todo endpoint sin atributo, así
/// que los <c>[Authorize(Policy = ...)]</c> solo existen para abrir un camino ApiKey puntual:
/// <list type="bullet">
/// <item><see cref="BotController"/> completo, con la política <c>BotIdentidad</c>.</item>
/// <item>Exactamente 4 GET del bot local, con la política <c>LecturaBotLocal</c> (persona o ApiKey con alcance).</item>
/// </list>
/// Cualquier otro <c>[Authorize]</c>, <c>[ServiceFilter]</c> o <c>[TypeFilter]</c> es una puerta nueva y debe
/// decidirse a propósito.
/// Límite conocido: el mini-host de los tests de pipeline no ejecuta el Program real; eso se verifica con un curl
/// real tras el deploy.
/// </summary>
public class BotApiIsolationTests
{
    // Las 4 acciones del bot local que aceptan ApiKey, como "Controller.Accion" con su verbo y ruta esperados.
    private static readonly string[] AccionesDelBotLocal =
    [
        "PagosMensualesController.GET api/PagosMensuales/pendientes",
        "PagosMensualesController.GET api/PagosMensuales/vencidos",
        "TitularesController.GET api/Titulares/activos",
        "TitularesController.GET api/Titulares/{id}/telefonos"
    ];

    private static IEnumerable<Type> ControllersDelAssemblyApi() =>
        typeof(BotController).Assembly
            .GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

    private static bool EsAutorizacionOFiltroDeServicio(Attribute atributo) =>
        atributo is AuthorizeAttribute or ServiceFilterAttribute or TypeFilterAttribute;

    // Atributos a nivel de clase y de cada acción (incluye heredados).
    private static IEnumerable<(string Donde, Attribute Atributo)> AtributosDe(Type controller)
    {
        foreach (var a in controller.GetCustomAttributes(inherit: true).OfType<Attribute>())
            yield return (controller.Name, a);

        var metodos = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        foreach (var metodo in metodos)
            foreach (var a in metodo.GetCustomAttributes(inherit: true).OfType<Attribute>())
                yield return ($"{controller.Name}.{metodo.Name}", a);
    }

    // Identifica una acción por controller + verbo + ruta (la ruta distingue sobrecargas y es estable).
    private static string Identificar(Type controller, HttpMethodAttribute http)
    {
        var nombre = controller.Name[..^"Controller".Length];
        var rutaBase = (controller.GetCustomAttribute<RouteAttribute>()?.Template ?? string.Empty)
            .Replace("[controller]", nombre, StringComparison.OrdinalIgnoreCase);
        var ruta = string.IsNullOrEmpty(http.Template)
            ? rutaBase
            : $"{rutaBase.TrimEnd('/')}/{http.Template.TrimStart('/')}";
        return $"{controller.Name}.{http.HttpMethods.Single().ToUpperInvariant()} {ruta.Trim('/')}";
    }

    [Fact]
    public void SeEncuentranControllersEnElAssemblyApi()
    {
        // Evita que el guardián pase en vacío si cambia el descubrimiento de controllers.
        ControllersDelAssemblyApi().Should().Contain(typeof(BotController));
        ControllersDelAssemblyApi().Should().Contain(typeof(HealthController));
    }

    [Fact]
    public void NingunControllerSalvoBotTieneServiceFilterNiTypeFilter()
    {
        var infracciones = ControllersDelAssemblyApi()
            .SelectMany(AtributosDe)
            .Where(x => x.Atributo is ServiceFilterAttribute or TypeFilterAttribute)
            .Select(x => $"{x.Donde}: {x.Atributo.GetType().Name}")
            .ToList();

        infracciones.Should().BeEmpty("la autenticación es por esquemas y políticas, no por filtros caseros");
    }

    [Fact]
    public void LosUnicosAuthorizeFueraDeBotController_SonLas4AccionesDelBotLocalConLaPoliticaLecturaBotLocal()
    {
        var encontradas = new List<string>();
        var infracciones = new List<string>();

        foreach (var controller in ControllersDelAssemblyApi()
                     .Where(c => c != typeof(BotController) && c != typeof(BotGastosController)))
        {
            // [Authorize] a nivel de clase en cualquier otro controller cerraría o abriría toda la clase a la vez.
            foreach (var a in controller.GetCustomAttributes(inherit: true).OfType<Attribute>()
                         .Where(EsAutorizacionOFiltroDeServicio))
                infracciones.Add($"{controller.Name}: {a.GetType().Name} a nivel de clase");

            var metodos = controller.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
            foreach (var metodo in metodos)
            {
                foreach (var autorizacion in metodo.GetCustomAttributes(inherit: true).OfType<AuthorizeAttribute>())
                {
                    var http = metodo.GetCustomAttributes<HttpMethodAttribute>().SingleOrDefault();
                    var id = http is null ? $"{controller.Name}.{metodo.Name}" : Identificar(controller, http);

                    if (autorizacion.Policy == ApiPolicies.LecturaBotLocal)
                        encontradas.Add(id);
                    else
                        infracciones.Add($"{id}: [Authorize(Policy = \"{autorizacion.Policy}\")]");
                }
            }
        }

        infracciones.Should().BeEmpty("solo BotController y los 4 GET del bot local llevan [Authorize] propio");
        encontradas.OrderBy(x => x, StringComparer.Ordinal).Should().Equal(
            AccionesDelBotLocal.OrderBy(x => x, StringComparer.Ordinal),
            "la política LecturaBotLocal abre un camino ApiKey; solo estas 4 lecturas deben tenerla");
    }

    [Fact]
    public void BotController_TieneAuthorizeConLaPoliticaBotIdentidadANivelDeClase()
    {
        typeof(BotController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: false)
            .Cast<AuthorizeAttribute>()
            .Should().ContainSingle(a => a.Policy == ApiPolicies.BotIdentidad);
    }

    [Fact]
    public void BotGastosController_TieneAuthorizeConLaPoliticaBotGastosANivelDeClase()
    {
        typeof(BotGastosController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: false)
            .Cast<AuthorizeAttribute>()
            .Should().ContainSingle(a => a.Policy == ApiPolicies.BotGastos);
    }
}
