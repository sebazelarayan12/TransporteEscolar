using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TransporteEscolar.Api.Filters;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Tests.Api;

public class ApiKeyFilterTests
{
    private const string ClaveReal = "clave-de-prueba-123";

    private static ApiKeyFilter CrearFiltro(string? apiKey) =>
        new(Options.Create(new BotApiOptions { ApiKey = apiKey }), NullLogger<ApiKeyFilter>.Instance);

    // Arma el contexto a mano: el filtro solo lee el header, no necesita host.
    private static AuthorizationFilterContext CrearContexto(params string[] valoresHeader)
    {
        var httpContext = new DefaultHttpContext();
        if (valoresHeader.Length > 0)
            httpContext.Request.Headers[ApiKeyFilter.HeaderName] = valoresHeader;

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        return new AuthorizationFilterContext(actionContext, new List<IFilterMetadata>());
    }

    [Fact]
    public void SinHeader_Devuelve401()
    {
        var contexto = CrearContexto();

        CrearFiltro(ClaveReal).OnAuthorization(contexto);

        contexto.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public void HeaderVacio_Devuelve401()
    {
        var contexto = CrearContexto("");

        CrearFiltro(ClaveReal).OnAuthorization(contexto);

        contexto.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public void KeyIncorrecta_Devuelve401()
    {
        var contexto = CrearContexto("otra-clave-123456789");

        CrearFiltro(ClaveReal).OnAuthorization(contexto);

        contexto.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Theory]
    [InlineData("x")]
    [InlineData("clave-de-prueba-12")]
    [InlineData("clave-de-prueba-1234")]
    [InlineData("una-clave-incorrecta-mucho-mas-larga-que-la-real-0123456789")]
    public void KeyIncorrectaDeDistintoLargo_Devuelve401SinExcepcion(string recibida)
    {
        var contexto = CrearContexto(recibida);

        var accion = () => CrearFiltro(ClaveReal).OnAuthorization(contexto);

        accion.Should().NotThrow();
        contexto.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public void HeaderConDosValores_Devuelve401AunqueUnoSeaCorrecto()
    {
        var contexto = CrearContexto(ClaveReal, ClaveReal);

        CrearFiltro(ClaveReal).OnAuthorization(contexto);

        contexto.Result.Should().BeOfType<UnauthorizedResult>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void KeyNoConfigurada_Devuelve503AunqueElHeaderVenga(string? configurada)
    {
        // Config primero: aunque el request traiga cualquier header, no se abre el endpoint.
        var contexto = CrearContexto("cualquier-cosa");

        var accion = () => CrearFiltro(configurada).OnAuthorization(contexto);

        accion.Should().NotThrow();
        var resultado = contexto.Result.Should().BeOfType<StatusCodeResult>().Subject;
        resultado.StatusCode.Should().Be(503);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void KeyNoConfigurada_SinHeader_TambienDevuelve503(string? configurada)
    {
        var contexto = CrearContexto();

        CrearFiltro(configurada).OnAuthorization(contexto);

        contexto.Result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(503);
    }

    [Fact]
    public void KeyCorrecta_NoAsignaResultYElRequestSigue()
    {
        var contexto = CrearContexto(ClaveReal);

        var accion = () => CrearFiltro(ClaveReal).OnAuthorization(contexto);

        accion.Should().NotThrow();
        contexto.Result.Should().BeNull();
    }
}
