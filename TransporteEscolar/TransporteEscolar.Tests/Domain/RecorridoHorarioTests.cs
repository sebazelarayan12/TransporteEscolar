using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class RecorridoHorarioTests
{
    [Fact]
    public void Constructor_ConDatosValidos_CreaElSnapshot()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 1200, 1800);

        snapshot.HorarioId.Should().Be(1);
        snapshot.Transporte.Should().Be((byte)1);
        snapshot.DistanciaTotalMetros.Should().Be(18500);
        snapshot.CantidadParadas.Should().Be(6);
        snapshot.MetrosTramoFinal.Should().Be(1200);
        snapshot.DuracionTotalSegundos.Should().Be(1800);
        snapshot.Aportes.Should().BeEmpty();
        snapshot.FechaCalculo.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    public void Constructor_ConTransporteInvalido_Lanza(byte transporte)
    {
        var accion = () => new RecorridoHorario(1, transporte, 1000, 2, 0, 0);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("transporte");
    }

    [Fact]
    public void Constructor_ConMetrosTramoFinalNegativo_Lanza()
    {
        var accion = () => new RecorridoHorario(1, 1, 1000, 2, -1, 0);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("metrosTramoFinal");
    }

    [Fact]
    public void Constructor_ConDuracionNegativa_Lanza()
    {
        var accion = () => new RecorridoHorario(1, 1, 1000, 2, 0, -1);

        accion.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("duracionTotalSegundos");
    }

    [Fact]
    public void AgregarAporte_GuardaElAporteDelTitular()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, 1200, 1, 0);

        snapshot.Aportes.Should().ContainSingle();
        snapshot.Aportes.First().TitularId.Should().Be(3);
        snapshot.Aportes.First().MetrosAsignados.Should().Be(1200);
        snapshot.Aportes.First().Orden.Should().Be(1);
        snapshot.Aportes.First().MetrosTramoAnterior.Should().Be(0);
    }

    [Fact]
    public void AgregarAporte_GuardaElMetrosTramoAnteriorDelTitular()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, 1200, 2, 850);

        snapshot.Aportes.First().MetrosTramoAnterior.Should().Be(850);
    }

    [Fact]
    public void AgregarAporte_ConMetrosNegativos_LosLlevaACero()
    {
        // El valor de Shapley nunca da negativo; este es un caso defensivo, no esperado.
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, -500, 1, 0);

        snapshot.Aportes.First().MetrosAsignados.Should().Be(0);
    }

    [Fact]
    public void AgregarAporte_DosVecesElMismoTitular_ReemplazaElValor()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, 1200, 1, 0);
        snapshot.AgregarAporte(3, 900, 1, 0);

        snapshot.Aportes.Should().ContainSingle();
        snapshot.Aportes.First().MetrosAsignados.Should().Be(900);
    }

    [Fact]
    public void AgregarAporte_ConOrdenesDistintos_ConservaElOrdenDeCadaTitular()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, 1200, 2, 500);
        snapshot.AgregarAporte(5, 800, 1, 0);

        snapshot.Aportes.Single(a => a.TitularId == 3).Orden.Should().Be(2);
        snapshot.Aportes.Single(a => a.TitularId == 5).Orden.Should().Be(1);
    }

    [Fact]
    public void AgregarAporte_DosVecesElMismoTitular_ActualizaElOrden()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);

        snapshot.AgregarAporte(3, 1200, 2, 500);
        snapshot.AgregarAporte(3, 900, 1, 0);

        snapshot.Aportes.Single().Orden.Should().Be(1);
    }

    [Fact]
    public void Reemplazar_ActualizaLosDatosYLimpiaLosAportes()
    {
        var snapshot = new RecorridoHorario(1, 1, 18500, 6, 0, 0);
        snapshot.AgregarAporte(3, 1200, 1, 0);

        snapshot.Reemplazar(20000, 7);

        snapshot.DistanciaTotalMetros.Should().Be(20000);
        snapshot.CantidadParadas.Should().Be(7);
        snapshot.Aportes.Should().BeEmpty();
    }
}
