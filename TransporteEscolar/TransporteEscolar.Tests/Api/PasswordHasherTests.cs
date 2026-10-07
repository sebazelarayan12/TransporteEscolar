using FluentAssertions;
using TransporteEscolar.Api.Authentication;

namespace TransporteEscolar.Tests.Api;

public class PasswordHasherTests
{
    // Generado con: node scripts/generar-credenciales-auth.mjs "prueba-123" (no es un secreto: es un hash con sal).
    private const string HashDelScript =
        "pbkdf2-sha256$600000$cITGF6RAUw/1Via9sdfmbA==$Vx9cMesaMKKXSvmKD+PQck2W1XfSw/y7k8zQDhi1CCI=";

    [Fact]
    public void Hashear_Verificar_RoundTripCorrecto()
    {
        var hash = PasswordHasher.Hashear("mi-clave");

        PasswordHasher.Verificar("mi-clave", hash).Should().BeTrue();
    }

    [Fact]
    public void Verificar_PasswordIncorrecta_DevuelveFalse()
    {
        var hash = PasswordHasher.Hashear("mi-clave");

        PasswordHasher.Verificar("otra-clave", hash).Should().BeFalse();
    }

    [Fact]
    public void Hashear_TieneElFormatoEsperado_YLaSalEsAleatoria()
    {
        var uno = PasswordHasher.Hashear("mi-clave");
        var dos = PasswordHasher.Hashear("mi-clave");

        uno.Should().StartWith("pbkdf2-sha256$600000$");
        uno.Split('$').Should().HaveCount(4);
        uno.Should().NotBe(dos);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("x")]
    [InlineData("md5$600000$c2Fs$aGFzaA==")]
    [InlineData("pbkdf2-sha256$abc$c2Fs$aGFzaA==")]
    [InlineData("pbkdf2-sha256$0$c2Fs$aGFzaA==")]
    [InlineData("pbkdf2-sha256$600000$!!!no-base64!!!$aGFzaA==")]
    [InlineData("pbkdf2-sha256$600000$c2Fs$!!!no-base64!!!")]
    [InlineData("pbkdf2-sha256$600000$c2Fs")]
    [InlineData("pbkdf2-sha256$600000$$")]
    public void Verificar_HashMalFormado_NoLanzaYDevuelveFalse(string? hashGuardado)
    {
        var accion = () => PasswordHasher.Verificar("cualquiera", hashGuardado);

        accion.Should().NotThrow();
        PasswordHasher.Verificar("cualquiera", hashGuardado).Should().BeFalse();
    }

    [Fact]
    public void Verificar_HashGeneradoPorElScript_EsCompatible()
    {
        PasswordHasher.Verificar("prueba-123", HashDelScript).Should().BeTrue();
        PasswordHasher.Verificar("otra", HashDelScript).Should().BeFalse();
    }
}
