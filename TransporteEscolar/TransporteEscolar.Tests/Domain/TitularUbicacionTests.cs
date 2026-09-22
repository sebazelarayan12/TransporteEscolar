using FluentAssertions;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Domain;

public class TitularUbicacionTests
{
    [Fact]
    public void Constructor_ConDatosValidos_CreaLaUbicacion()
    {
        var ubicacion = new TitularUbicacion(7, -26.8225289, -65.2860859, "General Lamadrid 1048", FuenteUbicacion.Manual);

        ubicacion.TitularId.Should().Be(7);
        ubicacion.Latitud.Should().Be(-26.8225289);
        ubicacion.Longitud.Should().Be(-65.2860859);
        ubicacion.DireccionNormalizada.Should().Be("General Lamadrid 1048");
        ubicacion.Fuente.Should().Be(FuenteUbicacion.Manual);
        ubicacion.FechaActualizacion.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Constructor_ConTitularIdInvalido_Lanza(int titularId)
    {
        var accion = () => new TitularUbicacion(titularId, -26.8, -65.2, null, FuenteUbicacion.Manual);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("titularId");
    }

    [Fact]
    public void Constructor_ConCoordenadaInvalida_Lanza()
    {
        var accion = () => new TitularUbicacion(1, -26.8, 999, null, FuenteUbicacion.Manual);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Constructor_SinDireccion_GuardaNull()
    {
        var ubicacion = new TitularUbicacion(1, -26.8, -65.2, "   ", FuenteUbicacion.Manual);

        ubicacion.DireccionNormalizada.Should().BeNull();
    }

    [Fact]
    public void Mover_ActualizaCoordenadasFuenteYFecha()
    {
        var ubicacion = new TitularUbicacion(1, -26.8, -65.2, "Vieja", FuenteUbicacion.Geocoder);
        var fechaOriginal = ubicacion.FechaActualizacion;

        Thread.Sleep(10);
        ubicacion.Mover(-26.9, -65.3, "Nueva", FuenteUbicacion.Manual);

        ubicacion.Latitud.Should().Be(-26.9);
        ubicacion.Longitud.Should().Be(-65.3);
        ubicacion.DireccionNormalizada.Should().Be("Nueva");
        ubicacion.Fuente.Should().Be(FuenteUbicacion.Manual);
        ubicacion.FechaActualizacion.Should().BeAfter(fechaOriginal);
    }

    [Fact]
    public void Mover_ConCoordenadaInvalida_NoModificaNada()
    {
        var ubicacion = new TitularUbicacion(1, -26.8, -65.2, "Original", FuenteUbicacion.Manual);

        var accion = () => ubicacion.Mover(999, -65.3, "Nueva", FuenteUbicacion.Manual);

        accion.Should().Throw<ArgumentOutOfRangeException>();
        ubicacion.Latitud.Should().Be(-26.8);
        ubicacion.DireccionNormalizada.Should().Be("Original");
    }

    [Fact]
    public void ObtenerCoordenada_DevuelveLaCoordenadaDelPin()
    {
        var ubicacion = new TitularUbicacion(1, -26.8225289, -65.2860859, null, FuenteUbicacion.Manual);

        var coordenada = ubicacion.ObtenerCoordenada();

        coordenada.Latitud.Should().Be(-26.8225289);
        coordenada.Longitud.Should().Be(-65.2860859);
    }
}
