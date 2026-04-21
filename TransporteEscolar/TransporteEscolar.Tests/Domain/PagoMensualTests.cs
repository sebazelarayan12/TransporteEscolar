using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class PagoMensualTests
{
    private static PagoMensual CrearPago(decimal montoGenerado = 10000m, int mes = 6, int anio = 2025)
        => new PagoMensual(titularId: 1, mes: mes, anio: anio, montoGenerado: montoGenerado);

    // ── TotalPagado ──────────────────────────────────────────────────────────

    [Fact]
    public void TotalPagado_SinMovimientos_RetornaCero()
    {
        var pago = CrearPago();
        pago.TotalPagado().Should().Be(0m);
    }

    [Fact]
    public void TotalPagado_ConVariosMovimientos_RetornaSuma()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        pago.AplicarPago(3000m, DateTimeOffset.UtcNow, "Efectivo", null);
        pago.AplicarPago(7000m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.TotalPagado().Should().Be(10000m);
    }

    // ── EstaPagado ───────────────────────────────────────────────────────────

    [Fact]
    public void EstaPagado_SinPagos_RetornaFalse()
    {
        var pago = CrearPago();
        pago.EstaPagado().Should().BeFalse();
    }

    [Fact]
    public void EstaPagado_PagoParcial_RetornaFalse()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.EstaPagado().Should().BeFalse();
    }

    [Fact]
    public void EstaPagado_PagoExacto_RetornaTrue()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        pago.AplicarPago(10000m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.EstaPagado().Should().BeTrue();
    }

    // ── EstaVencido ──────────────────────────────────────────────────────────

    [Fact]
    public void EstaVencido_PagadoYVencimientoPasado_RetornaFalse()
    {
        // Enero 2020 -> vencimiento 10/01/2020, ya pasó
        var pago = CrearPago(montoGenerado: 100m, mes: 1, anio: 2020);
        pago.AplicarPago(100m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.EstaVencido().Should().BeFalse();
    }

    [Fact]
    public void EstaVencido_NoPagadoYVencimientoPasado_RetornaTrue()
    {
        // Enero 2020 -> vencimiento 10/01/2020, ya pasó y no está pagado
        var pago = CrearPago(montoGenerado: 100m, mes: 1, anio: 2020);

        pago.EstaVencido().Should().BeTrue();
    }

    [Fact]
    public void EstaVencido_NoPagadoYVencimientoFuturo_RetornaFalse()
    {
        var futuro = DateTime.UtcNow.AddYears(5);
        var pago = CrearPago(montoGenerado: 100m, mes: futuro.Month, anio: futuro.Year);

        pago.EstaVencido().Should().BeFalse();
    }

    // ── SaldoPendiente ───────────────────────────────────────────────────────

    [Fact]
    public void SaldoPendiente_SinPagos_EsIgualAlMontoGenerado()
    {
        var pago = CrearPago(montoGenerado: 8500m);
        pago.SaldoPendiente().Should().Be(8500m);
    }

    [Fact]
    public void SaldoPendiente_ConPagoParcial_RetornaDiferencia()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        pago.AplicarPago(4000m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.SaldoPendiente().Should().Be(6000m);
    }

    [Fact]
    public void SaldoPendiente_Pagado_RetornaCero()
    {
        var pago = CrearPago(montoGenerado: 5000m);
        pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);

        pago.SaldoPendiente().Should().Be(0m);
    }

    // ── AplicarPago ──────────────────────────────────────────────────────────

    [Fact]
    public void AplicarPago_MontoValido_AgregaMovimiento()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        var mov = pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Transferencia", "obs");

        mov.Monto.Should().Be(5000m);
        mov.MedioPago.Should().Be("Transferencia");
        pago.Movimientos.Should().HaveCount(1);
    }

    [Fact]
    public void AplicarPago_MontoCero_LanzaExcepcion()
    {
        var pago = CrearPago();
        var act = () => pago.AplicarPago(0m, DateTimeOffset.UtcNow, "Efectivo", null);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void AplicarPago_MontoNegativo_LanzaExcepcion()
    {
        var pago = CrearPago();
        var act = () => pago.AplicarPago(-100m, DateTimeOffset.UtcNow, "Efectivo", null);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void AplicarPago_PagoYaSaldado_LanzaExcepcion()
    {
        var pago = CrearPago(montoGenerado: 1000m);
        pago.AplicarPago(1000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var act = () => pago.AplicarPago(100m, DateTimeOffset.UtcNow, "Efectivo", null);
        act.Should().Throw<InvalidOperationException>().WithMessage("*saldo pendiente*");
    }

    [Fact]
    public void AplicarPago_MontoMayorAlSaldo_LanzaExcepcion()
    {
        var pago = CrearPago(montoGenerado: 1000m);
        var act = () => pago.AplicarPago(9999m, DateTimeOffset.UtcNow, "Efectivo", null);

        act.Should().Throw<InvalidOperationException>().WithMessage("*excede el saldo*");
    }

    [Fact]
    public void AplicarPago_PagoParcialSinObservacion_AgregaTextoParcial()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        var mov = pago.AplicarPago(3000m, DateTimeOffset.UtcNow, "Efectivo", null);

        mov.Observaciones.Should().Be("Pago parcial");
    }

    [Fact]
    public void AplicarPago_PagoParcialConObservacion_AnexaTextoParcial()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        var mov = pago.AplicarPago(3000m, DateTimeOffset.UtcNow, "Efectivo", "cuota especial");

        mov.Observaciones.Should().Be("cuota especial (Pago parcial)");
    }

    [Fact]
    public void AplicarPago_PagoTotal_NoModificaObservacion()
    {
        var pago = CrearPago(montoGenerado: 5000m);
        var mov = pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", "pago completo");

        mov.Observaciones.Should().Be("pago completo");
    }

    // ── EliminarMovimiento ───────────────────────────────────────────────────

    [Fact]
    public void EliminarMovimiento_ExisteMov_LoRemueveYLoRetorna()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        var mov = pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var eliminado = pago.EliminarMovimiento(mov.Id);

        eliminado.Should().Be(mov);
        pago.Movimientos.Should().BeEmpty();
    }

    [Fact]
    public void EliminarMovimiento_IdInexistente_LanzaExcepcion()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        var act = () => pago.EliminarMovimiento(9999);

        act.Should().Throw<InvalidOperationException>().WithMessage("*no pertenece*");
    }

    // ── ActualizarMontoGenerado ──────────────────────────────────────────────

    [Fact]
    public void ActualizarMontoGenerado_MontoValido_ActualizaValor()
    {
        var pago = CrearPago(montoGenerado: 5000m);
        pago.ActualizarMontoGenerado(8000m);

        pago.MontoGenerado.Should().Be(8000m);
    }

    [Fact]
    public void ActualizarMontoGenerado_MontoCero_LanzaExcepcion()
    {
        var pago = CrearPago();
        var act = () => pago.ActualizarMontoGenerado(0m);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void ActualizarMontoGenerado_MontoMenorAlTotalPagado_LanzaExcepcion()
    {
        var pago = CrearPago(montoGenerado: 10000m);
        pago.AplicarPago(6000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var act = () => pago.ActualizarMontoGenerado(5000m);
        act.Should().Throw<InvalidOperationException>().WithMessage("*menor al total pagado*");
    }

    // ── AgregarAnotacion ─────────────────────────────────────────────────────

    [Fact]
    public void AgregarAnotacion_SinObservacionPrevia_SetearTexto()
    {
        var pago = CrearPago();
        pago.AgregarAnotacion("nota inicial");

        pago.Observaciones.Should().Be("nota inicial");
    }

    [Fact]
    public void AgregarAnotacion_ConObservacionPrevia_AnexaConSeparador()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m, "primera nota");
        pago.AgregarAnotacion("segunda nota");

        pago.Observaciones.Should().Be("primera nota | segunda nota");
    }

    [Fact]
    public void AgregarAnotacion_TextoVacio_NoModificaObservaciones()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m, "existente");
        pago.AgregarAnotacion("   ");

        pago.Observaciones.Should().Be("existente");
    }

    // ── FechaVencimiento ─────────────────────────────────────────────────────

    [Fact]
    public void Constructor_FechaVencimiento_EsDia10DelMes()
    {
        var pago = CrearPago(mes: 8, anio: 2025);

        pago.FechaVencimiento.Day.Should().Be(10);
        pago.FechaVencimiento.Month.Should().Be(8);
        pago.FechaVencimiento.Year.Should().Be(2025);
    }
}
