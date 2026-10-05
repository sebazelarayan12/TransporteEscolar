using FluentAssertions;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Tests.Domain;

public class TelefonoNormalizadorTests
{
    [Theory]
    [InlineData("+5493814123456", "3814123456")]
    [InlineData("5493814123456", "3814123456")]
    [InlineData("+54 381 412-3456", "3814123456")]
    [InlineData("543814123456", "3814123456")]
    [InlineData("03814123456", "3814123456")]
    [InlineData("(381) 412 3456", "3814123456")]
    [InlineData("3814123456", "3814123456")]
    [InlineData("549 11 6123 4567", "1161234567")]
    [InlineData("0054 9 381 412 3456", "3814123456")]
    public void ANacional_ConFormatosValidos_DevuelveDiezDigitos(string entrada, string esperado)
    {
        TelefonoNormalizador.ANacional(entrada).Should().Be(esperado);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public void ANacional_SinDigitos_DevuelveNull(string? entrada)
    {
        TelefonoNormalizador.ANacional(entrada).Should().BeNull();
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("123456789012345")]
    [InlineData("5438161234567")]
    public void ANacional_SiNoQuedanExactamenteDiezDigitos_DevuelveNull(string entrada)
    {
        TelefonoNormalizador.ANacional(entrada).Should().BeNull();
    }

    [Fact]
    public void ANacional_DosFormatosDelMismoNumero_DanLaMismaCanonica()
    {
        var delBot = TelefonoNormalizador.ANacional("5493814123456");
        var guardado = TelefonoNormalizador.ANacional("+54 381 412-3456");

        delBot.Should().NotBeNull();
        delBot.Should().Be(guardado);
    }

    [Theory]
    [InlineData("3814123456", "…3456")]
    [InlineData("1161234567", "…4567")]
    [InlineData("123", "…123")]
    [InlineData("", "…")]
    [InlineData(null, "…")]
    public void UltimosCuatro_EnmascaraElNumero(string? canonico, string esperado)
    {
        TelefonoNormalizador.UltimosCuatro(canonico).Should().Be(esperado);
    }
}
