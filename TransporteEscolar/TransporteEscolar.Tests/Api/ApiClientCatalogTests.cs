using FluentAssertions;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Tests.Api;

public class ApiClientCatalogTests
{
    private static readonly IReadOnlyDictionary<string, ApiClientOptions> SinClientes =
        new Dictionary<string, ApiClientOptions>();

    private static ApiClientOptions Opciones(string? clave, params string[] scopes) =>
        new() { Key = clave, Scopes = scopes.ToList() };

    [Fact]
    public void SinNadaConfigurado_NoHayClientes_YResolverDevuelveNull()
    {
        var catalogo = new ApiClientCatalog(SinClientes, null);

        catalogo.HayClientes.Should().BeFalse();
        catalogo.Resolver("cualquiera").Should().BeNull();
    }

    [Fact]
    public void AliasHeredado_CreaBotInasistenciasConScopeBotIdentidad()
    {
        var catalogo = new ApiClientCatalog(SinClientes, "clave-heredada");

        catalogo.HayClientes.Should().BeTrue();
        var cliente = catalogo.Resolver("clave-heredada");
        cliente.Should().NotBeNull();
        cliente!.Name.Should().Be("BotInasistencias");
        cliente.Scopes.Should().Equal("bot:identidad");
    }

    [Fact]
    public void BotInasistenciasExplicito_GanaSobreElAlias()
    {
        var configurados = new Dictionary<string, ApiClientOptions>
        {
            ["BotInasistencias"] = Opciones("clave-explicita", "bot:identidad")
        };

        var catalogo = new ApiClientCatalog(configurados, "clave-heredada");

        catalogo.Resolver("clave-explicita").Should().NotBeNull();
        catalogo.Resolver("clave-heredada").Should().BeNull();
    }

    [Fact]
    public void ClientesConClaveEnBlanco_SeIgnoran()
    {
        var configurados = new Dictionary<string, ApiClientOptions>
        {
            ["Nulo"] = Opciones(null, "bot:identidad"),
            ["Vacio"] = Opciones("", "bot:identidad"),
            ["Blanco"] = Opciones("   ", "bot:identidad")
        };

        var catalogo = new ApiClientCatalog(configurados, "  ");

        catalogo.HayClientes.Should().BeFalse();
    }

    [Fact]
    public void Resolver_DistingueDosClientes_YDevuelveSusScopes()
    {
        var configurados = new Dictionary<string, ApiClientOptions>
        {
            ["BotInasistencias"] = Opciones("clave-bot", "bot:identidad"),
            ["BotLocal"] = Opciones("clave-local", "lectura:bot-local", "otro:scope")
        };

        var catalogo = new ApiClientCatalog(configurados, null);

        var bot = catalogo.Resolver("clave-bot")!;
        bot.Name.Should().Be("BotInasistencias");
        bot.Scopes.Should().Equal("bot:identidad");

        var local = catalogo.Resolver("clave-local")!;
        local.Name.Should().Be("BotLocal");
        local.Scopes.Should().Equal("lectura:bot-local", "otro:scope");
    }

    [Theory]
    [InlineData("x")]
    [InlineData("clave-bo")]
    [InlineData("clave-bot-con-largo-distinto-0123456789")]
    public void ClaveDeDistintoLargo_DevuelveNullSinExcepcion(string recibida)
    {
        var configurados = new Dictionary<string, ApiClientOptions>
        {
            ["BotInasistencias"] = Opciones("clave-bot", "bot:identidad")
        };
        var catalogo = new ApiClientCatalog(configurados, null);

        var accion = () => catalogo.Resolver(recibida);

        accion.Should().NotThrow();
        catalogo.Resolver(recibida).Should().BeNull();
    }
}
