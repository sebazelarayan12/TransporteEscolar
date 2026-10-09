using FluentAssertions;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Tests.Domain;

public class ReparticionPagosTests
{
    private static PagoMensual CrearPago(decimal monto = 10000m, int mes = 6, int anio = 2025)
        => new PagoMensual(1, mes, anio, monto);

    [Fact]
    public void Planificar_UnaCuotaQueAlcanza_DevuelveUnItemSinSobrante()
    {
        var pago = CrearPago(monto: 10000m, mes: 9, anio: 2026);

        var resultado = ReparticionPagos.Planificar(10000m, new[] { pago });

        resultado.Items.Should().HaveCount(1);
        resultado.Items[0].Pago.Should().BeSameAs(pago);
        resultado.Items[0].Aplicado.Should().Be(10000m);
        resultado.Sobrante.Should().Be(0m);
    }

    [Fact]
    public void Planificar_CubreDosCuotas_OrdenaPorAnioYMesCruzandoDeAnio()
    {
        // Lista desordenada: 01/2026 llega primero y 11/2025 al final
        var enero2026 = CrearPago(monto: 10000m, mes: 1, anio: 2026);
        var diciembre2025 = CrearPago(monto: 10000m, mes: 12, anio: 2025);
        var noviembre2025 = CrearPago(monto: 10000m, mes: 11, anio: 2025);

        var resultado = ReparticionPagos.Planificar(25000m, new[] { enero2026, diciembre2025, noviembre2025 });

        resultado.Items.Should().HaveCount(3);
        resultado.Items[0].Pago.Should().BeSameAs(noviembre2025);
        resultado.Items[0].Aplicado.Should().Be(10000m);
        resultado.Items[1].Pago.Should().BeSameAs(diciembre2025);
        resultado.Items[1].Aplicado.Should().Be(10000m);
        resultado.Items[2].Pago.Should().BeSameAs(enero2026);
        resultado.Items[2].Aplicado.Should().Be(5000m);
        resultado.Items[2].SaldoDespues.Should().Be(5000m);
        resultado.Sobrante.Should().Be(0m);
    }

    [Fact]
    public void Planificar_CuotaConPagoPrevioParcial_UsaElSaldoNoElMontoGenerado()
    {
        var octubre = CrearPago(monto: 10000m, mes: 10, anio: 2025);
        octubre.AplicarPago(4000m, DateTimeOffset.UtcNow, "Efectivo", null);
        var noviembre = CrearPago(monto: 10000m, mes: 11, anio: 2025);

        var resultado = ReparticionPagos.Planificar(7000m, new[] { octubre, noviembre });

        resultado.Items.Should().HaveCount(2);
        resultado.Items[0].SaldoAntes.Should().Be(6000m);
        resultado.Items[0].Aplicado.Should().Be(6000m);
        resultado.Items[0].SaldoDespues.Should().Be(0m);
        resultado.Items[1].SaldoAntes.Should().Be(10000m);
        resultado.Items[1].Aplicado.Should().Be(1000m);
        resultado.Items[1].SaldoDespues.Should().Be(9000m);
        resultado.Sobrante.Should().Be(0m);
    }

    [Fact]
    public void Planificar_CuotasYaPagadas_SeOmiten()
    {
        var pagada = CrearPago(monto: 5000m, mes: 8, anio: 2025);
        pagada.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);
        var pendiente = CrearPago(monto: 5000m, mes: 9, anio: 2025);

        var resultado = ReparticionPagos.Planificar(3000m, new[] { pagada, pendiente });

        resultado.Items.Should().HaveCount(1);
        resultado.Items[0].Pago.Should().BeSameAs(pendiente);
        resultado.Items[0].Aplicado.Should().Be(3000m);
        resultado.Sobrante.Should().Be(0m);
    }

    [Fact]
    public void Planificar_MontoExactoALaDeudaTotal_SobranteCeroYSaldosEnCero()
    {
        var uno = CrearPago(monto: 5000m, mes: 4, anio: 2025);
        var dos = CrearPago(monto: 5000m, mes: 5, anio: 2025);

        var resultado = ReparticionPagos.Planificar(10000m, new[] { uno, dos });

        resultado.Sobrante.Should().Be(0m);
        resultado.Items.Should().HaveCount(2);
        resultado.Items.Should().OnlyContain(i => i.SaldoDespues == 0m);
    }

    [Fact]
    public void Planificar_MontoMayorQueLaDeuda_AplicaTodosLosSaldosYDevuelveSobrante()
    {
        var uno = CrearPago(monto: 5000m, mes: 4, anio: 2025);
        var dos = CrearPago(monto: 5000m, mes: 5, anio: 2025);

        var resultado = ReparticionPagos.Planificar(12000m, new[] { uno, dos });

        resultado.Items.Should().HaveCount(2);
        resultado.Items.Should().OnlyContain(i => i.Aplicado == 5000m && i.SaldoDespues == 0m);
        resultado.Sobrante.Should().Be(2000m);
    }

    [Fact]
    public void Planificar_SinCuotasPendientes_ItemsVacioYSobranteIgualAlMonto()
    {
        var pagada = CrearPago(monto: 1000m);
        pagada.AplicarPago(1000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var resultado = ReparticionPagos.Planificar(500m, new[] { pagada });

        resultado.Items.Should().BeEmpty();
        resultado.Sobrante.Should().Be(500m);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-100)]
    public void Planificar_MontoCeroONegativo_LanzaArgumentOutOfRange(decimal monto)
    {
        var pago = CrearPago();

        var act = () => ReparticionPagos.Planificar(monto, new[] { pago });

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Planificar_NoModificaLasCuotas()
    {
        var pago = CrearPago(monto: 10000m, mes: 9, anio: 2026);
        var totalAntes = pago.TotalPagado();
        var movimientosAntes = pago.Movimientos.Count;

        ReparticionPagos.Planificar(15000m, new[] { pago });

        pago.TotalPagado().Should().Be(totalAntes);
        pago.Movimientos.Count.Should().Be(movimientosAntes);
    }
}
