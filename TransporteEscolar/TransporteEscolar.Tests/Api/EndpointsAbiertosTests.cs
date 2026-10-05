using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using TransporteEscolar.Api.Controllers;
using TransporteEscolar.Api.Filters;

namespace TransporteEscolar.Tests.Api;

/// <summary>
/// Red de seguridad de la autenticación: enumera por reflexión todos los endpoints de escritura
/// (POST, PUT, PATCH, DELETE) de los controllers y exige que cada uno esté protegido o figure en la
/// lista explícita de abiertos conocidos.
/// <para>
/// La lista funciona como un trinquete: solo puede ENCOGERSE. Un endpoint de escritura nuevo
/// que no exija autenticación hace fallar el primer test; un endpoint que ya se protegió o se eliminó y
/// sigue en la lista hace fallar el segundo. Así la deuda de seguridad nunca crece sin que alguien lo decida
/// a propósito, y se ve cuándo se paga.
/// </para>
/// <para>
/// "Protegido" significa: <c>[Authorize]</c> o <c>[ServiceFilter(typeof(ApiKeyFilter))]</c> en el método o en el
/// controller, salvo que el método tenga <c>[AllowAnonymous]</c>. Cuando se agregue una política de
/// autorización por defecto (FallbackPolicy) hay que adaptar <see cref="ExigeAutenticacion"/>.
/// </para>
/// </summary>
public class EndpointsAbiertosTests
{
    private static readonly string[] VerbosDeEscritura = ["POST", "PUT", "PATCH", "DELETE"];

    /// <summary>
    /// Escrituras que HOY no exigen autenticación. Formato: "VERBO ruta" tal como la arma el controller.
    /// Al proteger o eliminar un endpoint, quitarlo de acá (el segundo test lo exige).
    /// </summary>
    private static readonly string[] EscriturasAbiertasConocidas =
    [
        "DELETE api/Gastos/fijos/{templateId:int}",
        "DELETE api/Gastos/variables/{id:int}",
        "DELETE api/Ingresos/fijos/{templateId:int}",
        "DELETE api/Ingresos/variables/{id:int}",
        "DELETE api/Notificaciones/{id}",
        "DELETE api/PagosMensuales/{pagoMensualId}/movimientos/{movimientoId}",
        "DELETE api/Pasajeros/{id}",
        "DELETE api/Pasajeros/{id}/horario",
        "DELETE api/Pasajeros/{id}/horarios/{horarioId}",
        "DELETE api/Recorridos/horarios/{horarioId}/transportes/{transporte}/parada-fija",
        "DELETE api/Titulares/{id}",
        "DELETE api/Titulares/{id}/telefonos/{telefonoId}",
        "DELETE api/Titulares/{id}/ubicacion",
        "PATCH api/Reinscripciones/{id}/confirmar",
        "PATCH api/Reinscripciones/{id}/no-continua",
        "PATCH api/Reinscripciones/{id}/pendiente",
        "POST api/Gastos/fijos",
        "POST api/Gastos/variables",
        "POST api/Ingresos/fijos",
        "POST api/Ingresos/variables",
        "POST api/PagosMensuales",
        "POST api/PagosMensuales/{id}/registrar-pago",
        "POST api/Pasajeros",
        "POST api/Pasajeros/{id}/horarios",
        "POST api/Pasajeros/{id}/reactivar",
        "POST api/Pasajeros/{id}/reinscripciones",
        "POST api/Recorridos/recalcular",
        "POST api/Recorridos/recalcular-reparto",
        "POST api/Reinscripciones",
        "POST api/Titulares",
        "POST api/Titulares/{id}/reactivar",
        "POST api/Titulares/{id}/telefonos",
        "POST api/push-subscriptions/subscribe",
        "POST api/push-subscriptions/unsubscribe",
        "PUT api/Gastos/fijos/{templateId:int}",
        "PUT api/Gastos/variables/{id:int}/marcar-pagado",
        "PUT api/Horarios/{id}/asignaciones",
        "PUT api/Ingresos/fijos/{templateId:int}",
        "PUT api/Notificaciones/marcar-todas-leidas",
        "PUT api/Notificaciones/ultima-actualizacion",
        "PUT api/Notificaciones/{id}/marcar-leida",
        "PUT api/PagosMensuales/titulares/{titularId}/ajustar-monto",
        "PUT api/PagosMensuales/{id}/observaciones",
        "PUT api/Pasajeros/{id}",
        "PUT api/Pasajeros/{id}/reinscripciones/{reinscripcionId}/confirmar",
        "PUT api/Pasajeros/{id}/reinscripciones/{reinscripcionId}/no-continua",
        "PUT api/Recorridos/horarios/{horarioId}/transportes/{transporte}/parada-fija",
        "PUT api/Titulares/{id}",
        "PUT api/Titulares/{id}/telefonos/{telefonoId}",
        "PUT api/Titulares/{id}/telefonos/{telefonoId}/marcar-principal",
        "PUT api/Titulares/{id}/ubicacion",
    ];

    private sealed record Endpoint(string Clave, MethodInfo Metodo, bool Protegido);

    [Fact]
    public void Toda_escritura_exige_autenticacion_o_figura_en_la_lista_de_abiertas_conocidas()
    {
        var abiertasNoDeclaradas = EnumerarEscrituras()
            .Where(e => !e.Protegido && !EscriturasAbiertasConocidas.Contains(e.Clave))
            .Select(e => e.Clave)
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        abiertasNoDeclaradas.Should().BeEmpty(
            "toda escritura nueva debe exigir autenticación; si es una excepción deliberada, agregarla a " +
            nameof(EscriturasAbiertasConocidas) + " con una razón. Faltan:\n" +
            string.Join("\n", abiertasNoDeclaradas.Select(c => $"        \"{c}\",")));
    }

    [Fact]
    public void La_lista_de_abiertas_conocidas_no_tiene_entradas_obsoletas()
    {
        var escrituras = EnumerarEscrituras().ToDictionary(e => e.Clave);

        var inexistentes = EscriturasAbiertasConocidas
            .Where(c => !escrituras.ContainsKey(c))
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        var yaProtegidas = EscriturasAbiertasConocidas
            .Where(c => escrituras.TryGetValue(c, out var e) && e.Protegido)
            .OrderBy(c => c, StringComparer.Ordinal)
            .ToList();

        inexistentes.Should().BeEmpty(
            "estas entradas ya no corresponden a ningún endpoint (se eliminó o cambió la ruta); quitarlas de la lista");
        yaProtegidas.Should().BeEmpty(
            "estos endpoints ya exigen autenticación; quitarlos de la lista para que el trinquete no retroceda");
    }

    [Fact]
    public void La_lista_de_abiertas_conocidas_no_tiene_duplicados()
    {
        var duplicadas = EscriturasAbiertasConocidas
            .GroupBy(c => c)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        duplicadas.Should().BeEmpty();
    }

    [Fact]
    public void El_enumerador_encuentra_endpoints_de_escritura_y_reconoce_los_protegidos()
    {
        // Guarda contra un falso verde: si la reflexión dejara de encontrar endpoints, los otros tests
        // pasarían en vacío. El endpoint del bot es GET (no cuenta como escritura) pero sirve para
        // comprobar que la detección de [ServiceFilter(typeof(ApiKeyFilter))] funciona.
        EnumerarEscrituras().Should().NotBeEmpty();

        var metodoBot = typeof(BotController).GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Single(m => m.GetCustomAttributes<HttpMethodAttribute>().Any());
        ExigeAutenticacion(metodoBot).Should().BeTrue("BotController está protegido con ApiKeyFilter");
    }

    private static IEnumerable<Endpoint> EnumerarEscrituras()
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
                    foreach (var verbo in http.HttpMethods.Where(v => VerbosDeEscritura.Contains(v, StringComparer.OrdinalIgnoreCase)))
                    {
                        var ruta = string.IsNullOrEmpty(http.Template)
                            ? rutaBase
                            : $"{rutaBase.TrimEnd('/')}/{http.Template.TrimStart('/')}";

                        yield return new Endpoint(
                            $"{verbo.ToUpperInvariant()} {ruta.Trim('/')}",
                            metodo,
                            ExigeAutenticacion(metodo));
                    }
                }
            }
        }
    }

    private static bool ExigeAutenticacion(MethodInfo metodo)
    {
        if (metodo.GetCustomAttributes<AllowAnonymousAttribute>(inherit: true).Any())
            return false;

        var tipo = metodo.DeclaringType!;

        bool Exige(ICustomAttributeProvider origen) =>
            origen.GetCustomAttributes(inherit: true).OfType<IAuthorizeData>().Any()
            || origen.GetCustomAttributes(inherit: true)
                .OfType<ServiceFilterAttribute>()
                .Any(f => f.ServiceType == typeof(ApiKeyFilter));

        return Exige(metodo) || Exige(tipo);
    }
}
