using FluentAssertions;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Application.Validation;

public class HorarioValidatorTests
{
    [Theory]
    [InlineData("8 San Patricio")]
    [InlineData("08 San Patricio")]
    [InlineData("8:15 San Patricio")]
    [InlineData("13:30 Boisdron Salida")]
    [InlineData("0 Madrugada")]
    [InlineData("23:59 Ultimo")]
    public void ValidarEtiqueta_AceptaHoraMasDescripcion(string etiqueta)
    {
        HorarioValidator.ValidarEtiqueta(etiqueta).Should().Be(etiqueta);
    }

    [Fact]
    public void ValidarEtiqueta_DevuelveLaEtiquetaRecortada()
    {
        HorarioValidator.ValidarEtiqueta("   8 San Patricio  ").Should().Be("8 San Patricio");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("San Patricio")]
    [InlineData("8")]
    [InlineData("8 ")]
    [InlineData("24 San Patricio")]
    [InlineData("8:60 San Patricio")]
    [InlineData("8:5 San Patricio")]
    [InlineData("8San Patricio")]
    public void ValidarEtiqueta_RechazaFormatosInvalidos(string? etiqueta)
    {
        var accion = () => HorarioValidator.ValidarEtiqueta(etiqueta);

        accion.Should().Throw<ValidationException>();
    }

    [Fact]
    public void ValidarEtiqueta_RechazaMasDeCienCaracteres()
    {
        var etiqueta = "8 " + new string('a', 100);

        var accion = () => HorarioValidator.ValidarEtiqueta(etiqueta);

        accion.Should().Throw<ValidationException>().WithMessage("*100*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ValidarOrden_RechazaMenoresAUno(int orden)
    {
        var accion = () => HorarioValidator.ValidarOrden(orden);

        accion.Should().Throw<ValidationException>();
    }

    [Fact]
    public void ValidarSentido_RechazaValoresInexistentes()
    {
        var accion = () => HorarioValidator.ValidarSentido((SentidoHorario)99);

        accion.Should().Throw<ValidationException>();
    }

    [Theory]
    [InlineData(SentidoHorario.Ida)]
    [InlineData(SentidoHorario.Vuelta)]
    public void ValidarSentido_AceptaIdaYVuelta(SentidoHorario sentido)
    {
        var accion = () => HorarioValidator.ValidarSentido(sentido);

        accion.Should().NotThrow();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void ValidarColegioId_RechazaIdsInvalidos(int colegioId)
    {
        var accion = () => HorarioValidator.ValidarColegioId(colegioId);

        accion.Should().Throw<ValidationException>();
    }
}
