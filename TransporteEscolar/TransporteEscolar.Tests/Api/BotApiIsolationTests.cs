using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.Filters;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Guardián de aislamiento: la protección por API key es solo del BotController.
/// Límite conocido: no detecta un filtro global agregado a futuro en Program.cs (el mini-host de
/// los tests de pipeline no ejecuta el Program real); eso se verifica con un curl real tras el deploy.
/// </summary>
public class BotApiIsolationTests
{
    private static IEnumerable<Type> ControllersDelAssemblyApi() =>
        typeof(BotController).Assembly
            .GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

    private static bool ApuntaAApiKeyFilter(Attribute atributo) => atributo switch
    {
        ServiceFilterAttribute sf => sf.ServiceType == typeof(ApiKeyFilter),
        TypeFilterAttribute tf => tf.ImplementationType == typeof(ApiKeyFilter),
        _ => false
    };

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

    [Fact]
    public void SeEncuentranControllersEnElAssemblyApi()
    {
        // Evita que el guardián pase en vacío si cambia el descubrimiento de controllers.
        ControllersDelAssemblyApi().Should().Contain(typeof(BotController));
        ControllersDelAssemblyApi().Should().Contain(typeof(HealthController));
    }

    [Fact]
    public void NingunControllerSalvoBotTieneApiKeyFilterNiAuthorize()
    {
        var infracciones = ControllersDelAssemblyApi()
            .Where(c => c != typeof(BotController))
            .SelectMany(AtributosDe)
            .Where(x => ApuntaAApiKeyFilter(x.Atributo) || x.Atributo is AuthorizeAttribute)
            .Select(x => $"{x.Donde}: {x.Atributo.GetType().Name}")
            .ToList();

        infracciones.Should().BeEmpty("la API key es solo para BotController y no hay autenticación global");
    }

    [Fact]
    public void BotController_TieneApiKeyFilterAplicadoANivelDeClase()
    {
        typeof(BotController)
            .GetCustomAttributes(typeof(ServiceFilterAttribute), inherit: false)
            .Cast<ServiceFilterAttribute>()
            .Should().ContainSingle(a => a.ServiceType == typeof(ApiKeyFilter));
    }
}
