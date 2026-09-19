using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class RecorridoHorarioTests
{
    [Fact]
    public void Constructor_ConDatosValidos_CreaElSnapshot()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6);

        snapshot.HorarioId.Should().Be(1);
        snapshot.Transporte.Should().Be((byte)1);
        snapshot.DistanciaTotalMetros.Should().Be(18500);
        snapshot.CantidadParadas.Should().Be(6);
        snapshot.Aportes.Should().BeEmpty();
        snapshot.FechaCalculo.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    public void Constructor_ConTransporteInvalido_Lanza(byte transporte)
    {
        var accion = () => new RecorridoHorario(1, transporte, 1000, 2);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("transporte");
    }

    [Fact]
    public void AgregarAporte_GuardaElAporteDelTitular()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6);

        snapshot.AgregarAporte(3, 1200);

        snapshot.Aportes.Should().ContainSingle();
        snapshot.Aportes.First().TitularId.Should().Be(3);
        snapshot.Aportes.First().MetrosMarginales.Should().Be(1200);
    }

    [Fact]
    public void AgregarAporte_ConMetrosNegativos_LosLlevaACero()
    {
        // El motor puede devolver una ruta más larga sin una parada que con ella,
        // por cómo optimiza el orden. Un aporte negativo no tiene sentido de negocio.
        var snapshot = new RecorridoHorario(1, 1, 18500, 6);

        snapshot.AgregarAporte(3, -500);

        snapshot.Aportes.First().MetrosMarginales.Should().Be(0);
    }

    [Fact]
    public void AgregarAporte_DosVecesElMismoTitular_ReemplazaElValor()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6);

        snapshot.AgregarAporte(3, 1200);
        snapshot.AgregarAporte(3, 900);

        snapshot.Aportes.Should().ContainSingle();
        snapshot.Aportes.First().MetrosMarginales.Should().Be(900);
    }

    [Fact]
    public void Reemplazar_ActualizaLosDatosYLimpiaLosAportes()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6);
        snapshot.AgregarAporte(3, 1200);

        snapshot.Reemplazar(20000, 7);

        snapshot.DistanciaTotalMetros.Should().Be(20000);
        snapshot.CantidadParadas.Should().Be(7);
        snapshot.Aportes.Should().BeEmpty();
    }
}
