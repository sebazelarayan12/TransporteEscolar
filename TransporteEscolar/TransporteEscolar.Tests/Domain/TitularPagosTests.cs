using FluentAssertions;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Domain;

public class TitularPagosTests
{
    private static Titular CrearTitular() => new Titular("Garcia", "Juan", "Av. Siempre Viva 123", 10000m);

    private static PagoMensual CrearPago(decimal monto = 10000m, int mes = 6, int anio = 2025)
        => new PagoMensual(1, mes, anio, monto);

    // ── RegistrarPago ────────────────────────────────────────────────────────

    [Fact]
    public void RegistrarPago_UnPagoPendiente_SaldaCorrectamente()
    {
        var titular = CrearTitular();
        var pago = CrearPago(monto: 10000m);
        var pagos = new List<PagoMensual> { pago };

        var actualizados = titular.RegistrarPago(10000m, DateTimeOffset.UtcNow, "Efectivo", null, pagos);

        actualizados.Should().HaveCount(1);
        pago.EstaPagado().Should().BeTrue();
    }

    [Fact]
    public void RegistrarPago_MontoDistribuidoEnVariasCuotas_SaldaEnOrden()
    {
        var titular = CrearTitular();
        var pago1 = CrearPago(monto: 5000m, mes: 4, anio: 2025);
        var pago2 = CrearPago(monto: 5000m, mes: 5, anio: 2025);
        var pagos = new List<PagoMensual> { pago2, pago1 }; // desordenados intencionalmente

        titular.RegistrarPago(10000m, DateTimeOffset.UtcNow, "Transferencia", null, pagos);

        pago1.EstaPagado().Should().BeTrue();
        pago2.EstaPagado().Should().BeTrue();
    }

    [Fact]
    public void RegistrarPago_MontoCero_LanzaExcepcion()
    {
        var titular = CrearTitular();
        var pago = CrearPago();

        var act = () => titular.RegistrarPago(0m, DateTimeOffset.UtcNow, "Efectivo", null, new[] { pago });
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void RegistrarPago_SinPagosDisponibles_LanzaExcepcion()
    {
        var titular = CrearTitular();

        var act = () => titular.RegistrarPago(1000m, DateTimeOffset.UtcNow, "Efectivo", null, new List<PagoMensual>());
        act.Should().Throw<InvalidOperationException>().WithMessage("*No hay pagos disponibles*");
    }

    [Fact]
    public void RegistrarPago_TodosLosPagosYaSaldados_LanzaExcepcion()
    {
        var titular = CrearTitular();
        var pago = CrearPago(monto: 1000m);
        pago.AplicarPago(1000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var act = () => titular.RegistrarPago(500m, DateTimeOffset.UtcNow, "Efectivo", null, new[] { pago });
        act.Should().Throw<InvalidOperationException>().WithMessage("*No hay pagos pendientes*");
    }

    [Fact]
    public void RegistrarPago_MontoExcedeLaDeuda_LanzaExcepcion()
    {
        var titular = CrearTitular();
        var pago = CrearPago(monto: 1000m);

        var act = () => titular.RegistrarPago(9999m, DateTimeOffset.UtcNow, "Efectivo", null, new[] { pago });
        act.Should().Throw<InvalidOperationException>().WithMessage("*excede la deuda total*");
    }

    [Fact]
    public void RegistrarPago_PagoParcial_SoloActualizaPagosAfectados()
    {
        var titular = CrearTitular();
        var pago1 = CrearPago(monto: 5000m, mes: 4, anio: 2025);
        var pago2 = CrearPago(monto: 5000m, mes: 5, anio: 2025);

        var actualizados = titular.RegistrarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null, new[] { pago1, pago2 });

        actualizados.Should().HaveCount(1);
        pago1.EstaPagado().Should().BeTrue();
        pago2.EstaPagado().Should().BeFalse();
    }

    // ── AjustarMonto ─────────────────────────────────────────────────────────

    [Fact]
    public void AjustarMonto_SoloPendientes_ActualizaMontoTitularYCuotas()
    {
        var titular = CrearTitular(); // MontoMensualPactado = 10000
        var pagoPagado = CrearPago(monto: 10000m, mes: 3, anio: 2025);
        pagoPagado.AplicarPago(10000m, DateTimeOffset.UtcNow, "Efectivo", null);
        var pagoPendiente = CrearPago(monto: 10000m, mes: 4, anio: 2025);

        var resultado = titular.AjustarMonto(12000m, aplicarSoloPendientes: true, motivo: null, pagos: new[] { pagoPagado, pagoPendiente });

        titular.MontoMensualPactado.Should().Be(12000m);
        resultado.MontoAnterior.Should().Be(10000m);
        resultado.MontoNuevo.Should().Be(12000m);
        pagoPendiente.MontoGenerado.Should().Be(12000m);
        pagoPagado.MontoGenerado.Should().Be(10000m); // no tocado
    }

    [Fact]
    public void AjustarMonto_TodosLosPagos_ActualizaTodos()
    {
        var titular = CrearTitular();
        var pago1 = CrearPago(monto: 10000m, mes: 3, anio: 2025);
        var pago2 = CrearPago(monto: 10000m, mes: 4, anio: 2025);

        titular.AjustarMonto(15000m, aplicarSoloPendientes: false, motivo: null, pagos: new[] { pago1, pago2 });

        pago1.MontoGenerado.Should().Be(15000m);
        pago2.MontoGenerado.Should().Be(15000m);
    }

    [Fact]
    public void AjustarMonto_ConMotivo_AgregaAnotacionEnCadaCuota()
    {
        var titular = CrearTitular();
        var pago = CrearPago(monto: 10000m);

        titular.AjustarMonto(12000m, aplicarSoloPendientes: false, motivo: "aumento tarifas", pagos: new[] { pago });

        pago.Observaciones.Should().Contain("aumento tarifas");
    }

    [Fact]
    public void AjustarMonto_MontoMenorAlTotalPagado_LanzaExcepcion()
    {
        var titular = CrearTitular();
        var pago = CrearPago(monto: 10000m);
        pago.AplicarPago(8000m, DateTimeOffset.UtcNow, "Efectivo", null);

        var act = () => titular.AjustarMonto(5000m, aplicarSoloPendientes: false, motivo: null, pagos: new[] { pago });
        act.Should().Throw<InvalidOperationException>().WithMessage("*menor al total pagado*");
    }

    [Fact]
    public void AjustarMonto_SinPagos_ActualizaSoloElTitular()
    {
        var titular = CrearTitular();

        var resultado = titular.AjustarMonto(15000m, aplicarSoloPendientes: true, motivo: null, pagos: Array.Empty<PagoMensual>());

        titular.MontoMensualPactado.Should().Be(15000m);
        resultado.PagosActualizados.Should().BeEmpty();
    }

    // ── GenerarPagos ─────────────────────────────────────────────────────────

    [Fact]
    public void GenerarPagos_SinExistentes_CreaDesdeMarzoHastaFin()
    {
        var titular = CrearTitular();
        // Usamos reflection para setear el Id porque tiene private setter
        var titularId = 1;

        // Crear titular con id = 1 via un workaround: invocamos via constructor reflection
        var type = typeof(Titular);
        var ctorPrivado = type.GetConstructor(
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance,
            null, Type.EmptyTypes, null)!;

        var titularConId = (Titular)ctorPrivado.Invoke(null);

        var idProp = type.GetProperty("Id")!;
        idProp.SetValue(titularConId, titularId);
        // Seteamos los campos necesarios
        type.GetProperty("Apellido")!.SetValue(titularConId, "TEST");
        type.GetProperty("NombreContacto")!.SetValue(titularConId, "Test");
        type.GetProperty("Direccion")!.SetValue(titularConId, "Dir");
        type.GetProperty("MontoMensualPactado")!.SetValue(titularConId, 10000m);
        type.GetProperty("FechaAlta")!.SetValue(titularConId, DateTime.UtcNow);

        var result = titularConId.GenerarPagos(titularId, 2025, 3, 11, 10000m, "ciclo 2025", Array.Empty<PagoMensual>());

        result.Should().HaveCount(9); // meses 3 a 11
    }

    [Fact]
    public void GenerarPagos_ConExistentes_SkipearMesesDuplicados()
    {
        var type = typeof(Titular);
        var ctorPrivado = type.GetConstructor(
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance,
            null, Type.EmptyTypes, null)!;
        var titular = (Titular)ctorPrivado.Invoke(null);
        type.GetProperty("Id")!.SetValue(titular, 1);
        type.GetProperty("Apellido")!.SetValue(titular, "TEST");
        type.GetProperty("NombreContacto")!.SetValue(titular, "Test");
        type.GetProperty("Direccion")!.SetValue(titular, "Dir");
        type.GetProperty("MontoMensualPactado")!.SetValue(titular, 10000m);
        type.GetProperty("FechaAlta")!.SetValue(titular, DateTime.UtcNow);
        type.GetProperty("Telefonos")!.SetValue(titular, new List<TitularTelefono>());

        var pagoExistente = new PagoMensual(1, 3, 2025, 10000m); // marzo ya existe

        var result = titular.GenerarPagos(1, 2025, 3, 5, 10000m, "ciclo", new[] { pagoExistente });

        result.Should().HaveCount(2); // abril y mayo
        result.Select(p => p.Mes).Should().NotContain(3);
    }
}
