using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class ParadaFijaTests
{
    [Fact]
    public void Constructor_ConDatosValidos_CreaLaParadaFija()
    {
        var paradaFija = new ParadaFija(1, 1, 10);

        paradaFija.HorarioId.Should().Be(1);
        paradaFija.Transporte.Should().Be((byte)1);
        paradaFija.TitularId.Should().Be(10);
        paradaFija.FechaAsignacion.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    public void Constructor_ConTransporteInvalido_Lanza(byte transporte)
    {
        var accion = () => new ParadaFija(1, transporte, 10);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("transporte");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_ConHorarioIdInvalido_Lanza(int horarioId)
    {
        var accion = () => new ParadaFija(horarioId, 1, 10);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("horarioId");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_ConTitularIdInvalido_Lanza(int titularId)
    {
        var accion = () => new ParadaFija(1, 1, titularId);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("titularId");
    }

    [Fact]
    public void ReasignarTitular_CambiaElTitularYActualizaLaFecha()
    {
        var paradaFija = new ParadaFija(1, 1, 10);
        var fechaOriginal = paradaFija.FechaAsignacion;

        Thread.Sleep(10);
        paradaFija.ReasignarTitular(20);

        paradaFija.TitularId.Should().Be(20);
        paradaFija.FechaAsignacion.Should().BeAfter(fechaOriginal);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ReasignarTitular_ConTitularIdInvalido_Lanza(int titularId)
    {
        var paradaFija = new ParadaFija(1, 1, 10);

        var accion = () => paradaFija.ReasignarTitular(titularId);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("titularId");
    }
}
