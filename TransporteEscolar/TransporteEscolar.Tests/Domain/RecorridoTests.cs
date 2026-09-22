using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class RecorridoTests
{
    private const string HashOriginal = "A1B2C3D4E5F60718";
    private const string HashDistinto = "0000000000000000";

    [Fact]
    public void Constructor_ConDatosValidos_CreaElRecorrido()
    {
        var recorrido = new Recorrido(5, 1, 3061, 336, "abc", "osrm", HashOriginal);

        recorrido.TitularId.Should().Be(5);
        recorrido.ColegioId.Should().Be(1);
        recorrido.DistanciaMetros.Should().Be(3061);
        recorrido.DuracionSegundos.Should().Be(336);
        recorrido.GeometriaPolyline.Should().Be("abc");
        recorrido.Proveedor.Should().Be("osrm");
        recorrido.HashOrigenDestino.Should().Be(HashOriginal);
        recorrido.FechaCalculo.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    [InlineData(-1, 1)]
    public void Constructor_ConIdsInvalidos_Lanza(int titularId, int colegioId)
    {
        var accion = () => new Recorrido(titularId, colegioId, 1000, 100, null, "osrm", HashOriginal);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Constructor_ConDistanciaNegativa_Lanza()
    {
        var accion = () => new Recorrido(1, 1, -5, 100, null, "osrm", HashOriginal);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("distanciaMetros");
    }

    [Fact]
    public void Constructor_SinHash_Lanza()
    {
        var accion = () => new Recorrido(1, 1, 1000, 100, null, "osrm", "  ");

        accion.Should().Throw<ArgumentException>().WithParameterName("hashOrigenDestino");
    }

    [Fact]
    public void EstaVigente_ConElMismoHash_EsVerdadero()
    {
        var recorrido = new Recorrido(1, 1, 3061, 336, null, "osrm", HashOriginal);

        recorrido.EstaVigente(HashOriginal).Should().BeTrue();
    }

    [Fact]
    public void EstaVigente_SiSeMovioElPin_EsFalso()
    {
        var recorrido = new Recorrido(1, 1, 3061, 336, null, "osrm", HashOriginal);

        recorrido.EstaVigente(HashDistinto).Should().BeFalse();
    }

    [Fact]
    public void Actualizar_ReemplazaLosDatosYLaFecha()
    {
        var recorrido = new Recorrido(1, 1, 3061, 336, "viejo", "osrm", HashOriginal);
        var fechaOriginal = recorrido.FechaCalculo;

        Thread.Sleep(10);
        recorrido.Actualizar(5000, 600, "nuevo", HashDistinto);

        recorrido.DistanciaMetros.Should().Be(5000);
        recorrido.DuracionSegundos.Should().Be(600);
        recorrido.GeometriaPolyline.Should().Be("nuevo");
        recorrido.HashOrigenDestino.Should().Be(HashDistinto);
        recorrido.FechaCalculo.Should().BeAfter(fechaOriginal);
    }

    [Fact]
    public void Actualizar_ConDistanciaNegativa_NoModificaNada()
    {
        var recorrido = new Recorrido(1, 1, 3061, 336, null, "osrm", HashOriginal);

        var accion = () => recorrido.Actualizar(-1, 600, null, HashDistinto);

        accion.Should().Throw<ArgumentOutOfRangeException>();
        recorrido.DistanciaMetros.Should().Be(3061);
    }
}
