using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class PagoMovimientoBotTests
{
    private static readonly DateTime Ahora = new(2026, 10, 9, 12, 0, 0, DateTimeKind.Utc);
    private static readonly Guid Grupo = Guid.Parse("11111111-2222-3333-4444-555555555555");

    private static PagoMovimiento CrearMovimiento() =>
        new(1, 120000m, new DateTimeOffset(2026, 10, 9, 12, 0, 0, TimeSpan.Zero), "Efectivo");

    [Fact]
    public void MarcarComoCargadoPorBot_AsignaMensajeGrupoYFechaCreacion()
    {
        var movimiento = CrearMovimiento();

        movimiento.MarcarComoCargadoPorBot("hash.123", Grupo, Ahora);

        movimiento.OrigenMensajeId.Should().Be("hash.123");
        movimiento.GrupoId.Should().Be(Grupo);
        movimiento.FechaCreacion.Should().Be(Ahora);
        movimiento.FechaCreacion!.Value.Kind.Should().Be(DateTimeKind.Utc);
        movimiento.EsDeBot.Should().BeTrue();
    }

    [Fact]
    public void MovimientoSinMarcar_NoEsDeBotNiEstaDentroDelPlazo()
    {
        var movimiento = CrearMovimiento();

        movimiento.EsDeBot.Should().BeFalse();
        movimiento.DentroDelPlazoDeAnulacion(Ahora).Should().BeFalse();
    }

    [Fact]
    public void DentroDelPlazoDeAnulacion_A23Horas59Minutos_EsVerdadero()
    {
        var movimiento = CrearMovimiento();
        movimiento.MarcarComoCargadoPorBot("hash.123", Grupo, Ahora);

        movimiento.DentroDelPlazoDeAnulacion(Ahora.AddHours(23).AddMinutes(59)).Should().BeTrue();
    }

    [Fact]
    public void DentroDelPlazoDeAnulacion_A24HorasExactas_EsFalso()
    {
        var movimiento = CrearMovimiento();
        movimiento.MarcarComoCargadoPorBot("hash.123", Grupo, Ahora);

        movimiento.DentroDelPlazoDeAnulacion(Ahora.AddHours(PagoMovimiento.HorasParaAnularPorBot)).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MarcarComoCargadoPorBot_ConOrigenNuloOBlanco_LanzaArgumentException(string? origen)
    {
        var movimiento = CrearMovimiento();

        var accion = () => movimiento.MarcarComoCargadoPorBot(origen!, Grupo, Ahora);

        accion.Should().Throw<ArgumentException>();
        movimiento.EsDeBot.Should().BeFalse();
    }

    [Fact]
    public void MarcarComoCargadoPorBot_ConGrupoVacio_LanzaArgumentException()
    {
        var movimiento = CrearMovimiento();

        var accion = () => movimiento.MarcarComoCargadoPorBot("hash.123", Guid.Empty, Ahora);

        accion.Should().Throw<ArgumentException>();
        movimiento.EsDeBot.Should().BeFalse();
    }
}
