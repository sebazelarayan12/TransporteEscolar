using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TransporteEscolar.Api.Authentication;
using TransporteEscolar.Api.Options;

namespace TransporteEscolar.Tests.Api;

public class TokenServiceTests
{
    private const string Secreto = "secreto-de-prueba-con-mas-de-32-bytes-0123456789";

    private static TokenService Crear(string? secreto = Secreto, int dias = 30) =>
        new(Microsoft.Extensions.Options.Options.Create(new JwtOptions { Secret = secreto, DiasValidez = dias }));

    private static SigningCredentials Firma(string secreto, string algoritmo = SecurityAlgorithms.HmacSha256) =>
        new(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secreto)), algoritmo);

    private static string TokenManual(SigningCredentials firma, DateTime desde, DateTime hasta) =>
        new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            JwtOptions.Issuer, JwtOptions.Audience,
            new[] { new Claim(JwtRegisteredClaimNames.Sub, "admin"), new Claim(TokenService.ClaimTipo, TokenService.TipoPersona) },
            desde, hasta, firma));

    private static bool Valida(TokenService servicio, string token)
    {
        try
        {
            new JwtSecurityTokenHandler().ValidateToken(token, servicio.ParametrosDeValidacion(), out _);
            return true;
        }
        catch (SecurityTokenException)
        {
            return false;
        }
    }

    [Fact]
    public void Emitir_TokenValido_ContieneTipoPersonaYSub()
    {
        var servicio = Crear();

        var (token, _) = servicio.Emitir("admin");

        var principal = new JwtSecurityTokenHandler()
            .ValidateToken(token, servicio.ParametrosDeValidacion(), out _);
        principal.FindFirst(TokenService.ClaimTipo)!.Value.Should().Be(TokenService.TipoPersona);
        principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            .Should().Be("admin");
    }

    [Fact]
    public void Emitir_ExpiraA30DiasPorDefecto()
    {
        var (_, expira) = Crear().Emitir("admin");

        expira.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void Emitir_RespetaDiasValidezConfigurado()
    {
        var (_, expira) = Crear(dias: 7).Emitir("admin");

        expira.Should().BeCloseTo(DateTime.UtcNow.AddDays(7), TimeSpan.FromMinutes(1));
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("", false)]
    [InlineData("1234567890123456789012345678901", false)] // 31 bytes
    [InlineData("12345678901234567890123456789012", true)] // 32 bytes
    public void Configurado_DependeDelLargoDelSecreto(string? secreto, bool esperado)
    {
        Crear(secreto).Configurado.Should().Be(esperado);
    }

    [Fact]
    public void Emitir_SinConfigurar_LanzaInvalidOperationException()
    {
        var accion = () => Crear(null).Emitir("admin");

        accion.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void TokenFirmadoConOtroSecreto_NoValida()
    {
        var ahora = DateTime.UtcNow;
        var token = TokenManual(Firma("otro-secreto-distinto-con-mas-de-32-bytes-999"), ahora, ahora.AddDays(1));

        Valida(Crear(), token).Should().BeFalse();
    }

    [Fact]
    public void TokenExpirado_NoValida()
    {
        var ahora = DateTime.UtcNow;
        var token = TokenManual(Firma(Secreto), ahora.AddDays(-2), ahora.AddDays(-1));

        Valida(Crear(), token).Should().BeFalse();
    }

    [Fact]
    public void TokenConAlgoritmoDistintoDeHS256_NoValida()
    {
        var ahora = DateTime.UtcNow;
        var token = TokenManual(Firma(Secreto, SecurityAlgorithms.HmacSha384), ahora, ahora.AddDays(1));

        Valida(Crear(), token).Should().BeFalse();
    }

    [Fact]
    public void SinSecreto_NingunTokenValida()
    {
        var token = TokenManual(Firma(Secreto), DateTime.UtcNow, DateTime.UtcNow.AddDays(1));

        Valida(Crear(null), token).Should().BeFalse();
    }
}
