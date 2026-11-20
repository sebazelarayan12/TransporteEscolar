using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class TitularDiciembreTests
{
    private static Titular CrearTitular() => new("Garcia", "Juan", "Dir 1", 10000m);

    [Fact]
    public void GenerarPagoDiciembre_DatosValidos_CreaCuotaMes12ConMontoIndicado()
    {
        var titular = CrearTitular();

        var pago = titular.GenerarPagoDiciembre(2026, 60000m, Array.Empty<PagoMensual>());

        pago.Mes.Should().Be(12);
        pago.Anio.Should().Be(2026);
        pago.MontoGenerado.Should().Be(60000m);
        pago.Observaciones.Should().Be("Cuota de diciembre");
        pago.FechaVencimiento.Should().Be(new DateTime(2026, 12, 10, 0, 0, 0, DateTimeKind.Utc));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void GenerarPagoDiciembre_MontoMenorOIgualACero_LanzaArgumentOutOfRange(decimal monto)
    {
        var titular = CrearTitular();

        var act = () => titular.GenerarPagoDiciembre(2026, monto, Array.Empty<PagoMensual>());

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void GenerarPagoDiciembre_YaExisteCuotaMes12DelAnio_LanzaInvalidOperation()
    {
        var titular = CrearTitular();
        var existentes = new List<PagoMensual>
        {
            new(0, 12, 2026, 50000m, "Cuota manual")
        };

        var act = () => titular.GenerarPagoDiciembre(2026, 60000m, existentes);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void GenerarPagoDiciembre_CuotaMes12DeOtroAnio_NoLanza()
    {
        var titular = CrearTitular();
        var existentes = new List<PagoMensual>
        {
            new(0, 12, 2025, 50000m, "Cuota 2025")
        };

        var pago = titular.GenerarPagoDiciembre(2026, 60000m, existentes);

        pago.Anio.Should().Be(2026);
    }

    [Fact]
    public void GenerarPagos_RangoCompleto_NoCreaCuotaMes12()
    {
        var titular = CrearTitular();

        var generados = titular.GenerarPagos(
            titularId: 0,
            anio: 2026,
            mesInicio: 1,
            mesFin: 12,
            monto: 10000m,
            observacionBase: "Cuota",
            pagosExistentes: Array.Empty<PagoMensual>());

        generados.Should().NotBeEmpty();
        generados.Should().NotContain(p => p.Mes == 12);
        generados.Select(p => p.Mes).Should().OnlyContain(m => m >= 3 && m <= 11);
    }
}
