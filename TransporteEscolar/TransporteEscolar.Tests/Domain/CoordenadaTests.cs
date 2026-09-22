using System.Globalization;
using FluentAssertions;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Tests.Domain;

public class CoordenadaTests
{
    [Fact]
    public void Constructor_ConCoordenadasValidas_AsignaValores()
    {
        var coordenada = new Coordenada(-26.8158608, -65.2742406);

        coordenada.Latitud.Should().Be(-26.8158608);
        coordenada.Longitud.Should().Be(-65.2742406);
    }

    [Theory]
    [InlineData(-90.1)]
    [InlineData(90.1)]
    [InlineData(double.NaN)]
    [InlineData(double.PositiveInfinity)]
    public void Constructor_ConLatitudInvalida_Lanza(double latitud)
    {
        var accion = () => new Coordenada(latitud, 0);

        accion.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("latitud");
    }

    [Theory]
    [InlineData(-180.1)]
    [InlineData(180.1)]
    [InlineData(double.NaN)]
    public void Constructor_ConLongitudInvalida_Lanza(double longitud)
    {
        var accion = () => new Coordenada(0, longitud);

        accion.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("longitud");
    }

    [Fact]
    public void ToOsrm_DevuelveLongitudPrimeroYLatitudDespues()
    {
        var coordenada = new Coordenada(-26.8158608, -65.2742406);

        coordenada.ToOsrm().Should().Be("-65.2742406,-26.8158608");
    }

    [Fact]
    public void ToOsrm_ConCulturaQueUsaComaDecimal_UsaPuntoIgual()
    {
        // En es-AR el separador decimal es la coma. Si ToOsrm usara la cultura
        // actual, la URL de OSRM se rompería. Este test protege ese caso.
        var culturaOriginal = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = new CultureInfo("es-AR");
            var coordenada = new Coordenada(-26.5, -65.25);

            coordenada.ToOsrm().Should().Be("-65.25,-26.5");
        }
        finally
        {
            CultureInfo.CurrentCulture = culturaOriginal;
        }
    }

    [Fact]
    public void Igualdad_DosCoordenadasConMismosValores_SonIguales()
    {
        var a = new Coordenada(-26.5, -65.25);
        var b = new Coordenada(-26.5, -65.25);

        a.Should().Be(b);
    }
}
