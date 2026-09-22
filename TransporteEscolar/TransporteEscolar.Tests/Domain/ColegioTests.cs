using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class ColegioTests
{
    [Fact]
    public void Constructor_ConDatosValidos_CreaColegioActivo()
    {
        var colegio = new Colegio("San Patricio", "Avenida Aconquija 631", -26.8158608, -65.2742406);

        colegio.Nombre.Should().Be("San Patricio");
        colegio.Direccion.Should().Be("Avenida Aconquija 631");
        colegio.Latitud.Should().Be(-26.8158608);
        colegio.Longitud.Should().Be(-65.2742406);
        colegio.Activo.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Constructor_SinNombre_Lanza(string? nombre)
    {
        var accion = () => new Colegio(nombre!, "Una dirección", -26.8, -65.2);

        accion.Should().Throw<ArgumentException>().WithParameterName("nombre");
    }

    [Fact]
    public void Constructor_RecortaEspaciosDelNombre()
    {
        var colegio = new Colegio("  San Patricio  ", "Dirección", -26.8, -65.2);

        colegio.Nombre.Should().Be("San Patricio");
    }

    [Fact]
    public void Constructor_ConCoordenadaInvalida_Lanza()
    {
        var accion = () => new Colegio("San Patricio", "Dirección", -200, -65.2);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void ObtenerCoordenada_DevuelveLaCoordenadaDelColegio()
    {
        var colegio = new Colegio("Boisdron", "General Lamadrid 1048", -26.8225289, -65.2860859);

        var coordenada = colegio.ObtenerCoordenada();

        coordenada.Latitud.Should().Be(-26.8225289);
        coordenada.Longitud.Should().Be(-65.2860859);
    }

    [Fact]
    public void ActualizarUbicacion_CambiaLasCoordenadas()
    {
        var colegio = new Colegio("San Patricio", "Dirección", -26.8, -65.2);

        colegio.ActualizarUbicacion(-26.9, -65.3);

        colegio.Latitud.Should().Be(-26.9);
        colegio.Longitud.Should().Be(-65.3);
    }

    [Fact]
    public void ActualizarUbicacion_ConCoordenadaInvalida_NoModificaNada()
    {
        var colegio = new Colegio("San Patricio", "Dirección", -26.8, -65.2);

        var accion = () => colegio.ActualizarUbicacion(999, -65.3);

        accion.Should().Throw<ArgumentOutOfRangeException>();
        colegio.Latitud.Should().Be(-26.8);
        colegio.Longitud.Should().Be(-65.2);
    }
}
