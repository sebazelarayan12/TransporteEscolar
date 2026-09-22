using FluentAssertions;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Tests.Domain;

public class CalculoKilometrosTests
{
    [Fact]
    public void DiasHabilesPorMes_EsVeinte()
    {
        CalculoKilometros.DiasHabilesPorMes.Should().Be(20);
    }

    [Fact]
    public void ViajesDiarios_SinHorarios_EsCero()
    {
        CalculoKilometros.ViajesDiarios(Array.Empty<int>()).Should().Be(0);
    }

    [Fact]
    public void ViajesDiarios_DosHermanosEnElMismoHorario_CuentaUnSoloViaje()
    {
        // Caso real: dos hermanos van juntos a las 8 al San Patricio.
        // La combi hace UN viaje, no dos.
        var horariosDeLosPasajeros = new[] { 1, 1 };

        CalculoKilometros.ViajesDiarios(horariosDeLosPasajeros).Should().Be(1);
    }

    [Fact]
    public void ViajesDiarios_HermanosEnHorariosDistintosDelMismoColegio_CuentaDosViajes()
    {
        // Caso real: un hermano entra 8 y el otro 9, ambos al San Patricio.
        // Son dos búsquedas distintas, así que son dos viajes.
        var horariosDeLosPasajeros = new[] { 1, 4 };

        CalculoKilometros.ViajesDiarios(horariosDeLosPasajeros).Should().Be(2);
    }

    [Fact]
    public void ViajesDiarios_IdaYVuelta_CuentaDosViajes()
    {
        // Un solo pasajero con horario de entrada (1 = "8 San Patricio")
        // y de salida (5 = "12 San Patricio").
        var horariosDeLosPasajeros = new[] { 1, 5 };

        CalculoKilometros.ViajesDiarios(horariosDeLosPasajeros).Should().Be(2);
    }

    [Fact]
    public void ViajesDiarios_ConColeccionNula_Lanza()
    {
        var accion = () => CalculoKilometros.ViajesDiarios(null!);

        accion.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void KilometrosMensuales_CalculaDistanciaPorViajesPorDiasHabiles()
    {
        // 3060 m = 3,06 km · 2 viajes/día · 20 días = 122,4 km/mes
        var resultado = CalculoKilometros.KilometrosMensuales(3060, 2);

        resultado.Should().Be(122.4m);
    }

    [Fact]
    public void KilometrosMensuales_SinViajes_EsCero()
    {
        CalculoKilometros.KilometrosMensuales(3060, 0).Should().Be(0m);
    }

    [Theory]
    [InlineData(-1, 1)]
    [InlineData(1000, -1)]
    public void KilometrosMensuales_ConValoresNegativos_Lanza(int distanciaMetros, int viajesDiarios)
    {
        var accion = () => CalculoKilometros.KilometrosMensuales(distanciaMetros, viajesDiarios);

        accion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void PrecioPorKilometro_DivideElMontoPorLosKilometros()
    {
        var resultado = CalculoKilometros.PrecioPorKilometro(122400m, 122.4m);

        resultado.Should().Be(1000m);
    }

    [Fact]
    public void PrecioPorKilometro_ConCeroKilometros_DevuelveNull()
    {
        // Titular sin pin cargado o sin horarios asignados: no hay dato, no es cero.
        CalculoKilometros.PrecioPorKilometro(100000m, 0m).Should().BeNull();
    }

    [Fact]
    public void PrecioPorKilometro_ConKilometrosNegativos_DevuelveNull()
    {
        CalculoKilometros.PrecioPorKilometro(100000m, -5m).Should().BeNull();
    }
}
