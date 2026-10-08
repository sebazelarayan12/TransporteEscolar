using FluentAssertions;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Domain;

public class GastoMensualBotTests
{
    private static readonly DateTime Ahora = new(2026, 10, 8, 12, 0, 0, DateTimeKind.Utc);

    private static GastoMensual CrearGasto() =>
        new(10, 2026, GastoMensual.TipoVariable, "Combustible", "Nafta", 4500m,
            new DateTime(2026, 10, 8), "Efectivo", EstadoPagoGasto.Pagado);

    [Fact]
    public void MarcarComoCargadoPorBot_AsignaMensajeIdYFechaCreacion()
    {
        var gasto = CrearGasto();

        gasto.MarcarComoCargadoPorBot("wamid.123", Ahora);

        gasto.OrigenMensajeId.Should().Be("wamid.123");
        gasto.FechaCreacion.Should().Be(Ahora);
        gasto.FechaCreacion!.Value.Kind.Should().Be(DateTimeKind.Utc);
        gasto.EsDeBot.Should().BeTrue();
    }

    [Fact]
    public void GastoSinMarcar_NoEsDeBotNiEstaDentroDelPlazo()
    {
        var gasto = CrearGasto();

        gasto.EsDeBot.Should().BeFalse();
        gasto.DentroDelPlazoDeAnulacion(Ahora).Should().BeFalse();
    }

    [Fact]
    public void DentroDelPlazoDeAnulacion_A23Horas59Minutos_EsVerdadero()
    {
        var gasto = CrearGasto();
        gasto.MarcarComoCargadoPorBot("wamid.123", Ahora);

        gasto.DentroDelPlazoDeAnulacion(Ahora.AddHours(23).AddMinutes(59)).Should().BeTrue();
    }

    [Fact]
    public void DentroDelPlazoDeAnulacion_A24HorasExactas_EsFalso()
    {
        var gasto = CrearGasto();
        gasto.MarcarComoCargadoPorBot("wamid.123", Ahora);

        gasto.DentroDelPlazoDeAnulacion(Ahora.AddHours(GastoMensual.HorasParaAnularPorBot)).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MarcarComoCargadoPorBot_ConMensajeIdNuloOBlanco_LanzaArgumentException(string? mensajeId)
    {
        var gasto = CrearGasto();

        var accion = () => gasto.MarcarComoCargadoPorBot(mensajeId!, Ahora);

        accion.Should().Throw<ArgumentException>();
        gasto.EsDeBot.Should().BeFalse();
    }
}
