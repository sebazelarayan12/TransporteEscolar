using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TransporteEscolar.Application.Bot;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class RegistrarPagoBotCommandHandlerTests
{
    // 2026-10-08 15:00 UTC = 12:00 en Argentina (mismo día).
    private static readonly DateTimeOffset Ahora = new(2026, 10, 8, 15, 0, 0, TimeSpan.Zero);

    private const string MensajeIdCrudo = "msg-1";
    private static readonly string ClaveMensaje = BotMensajeId.Hashear(MensajeIdCrudo);

    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPagoMensualRepository> _pagos = new();
    private readonly Mock<INotificacionService> _notificaciones = new();

    private sealed class RelojFijo : TimeProvider
    {
        private readonly DateTimeOffset _ahora;

        public RelojFijo(DateTimeOffset ahora) => _ahora = ahora;

        public override DateTimeOffset GetUtcNow() => _ahora;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private RegistrarPagoBotCommandHandler CrearHandler() =>
        new(_titulares.Object, _pagos.Object, _notificaciones.Object, new RelojFijo(Ahora),
            NullLogger<RegistrarPagoBotCommandHandler>.Instance);

    private static BotPagoModel.RegistrarRequest Pedido(
        string monto = "150000.00",
        string fecha = "2026-10-08",
        string mensajeId = MensajeIdCrudo) =>
        new(mensajeId, 1, monto, "Efectivo", fecha);

    private static Titular CrearTitular(int id = 1)
    {
        var titular = new Titular("Perez", "Ana", "Calle 1", 120000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        return titular;
    }

    private static PagoMensual CrearCuota(int mes, int anio, int id, decimal montoGenerado = 120000m)
    {
        var pago = new PagoMensual(1, mes, anio, montoGenerado);
        typeof(PagoMensual).GetProperty(nameof(PagoMensual.Id))!.SetValue(pago, id);
        return pago;
    }

    /// <summary>Movimiento del bot ya aplicado a la cuota, con su navegación al pago (como lo devuelve el repositorio).</summary>
    private static PagoMovimiento CrearMovimientoDeBot(PagoMensual pago, decimal monto, int id, Guid grupo)
    {
        var movimiento = pago.AplicarPago(monto, Ahora, "Efectivo", null);
        movimiento.MarcarComoCargadoPorBot(ClaveMensaje, grupo, Ahora.UtcDateTime.AddHours(-2));
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.Id))!.SetValue(movimiento, id);
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.PagoMensual))!.SetValue(movimiento, pago);
        return movimiento;
    }

    private void SetupTitularYPagos(Titular titular, List<PagoMensual> pagos)
    {
        _titulares.Setup(r => r.GetByIdAsync(titular.Id, It.IsAny<CancellationToken>())).ReturnsAsync(titular);
        _pagos.Setup(r => r.GetByTitularIdAsync(titular.Id, It.IsAny<CancellationToken>())).ReturnsAsync(pagos);
    }

    private void SetupSinExistentes() =>
        _pagos.Setup(r => r.GetMovimientosPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>());

    private void SetupGuardadoOk() =>
        _pagos.Setup(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);

    [Fact]
    public async Task Pago_de_una_sola_cuota_crea_un_movimiento_marcado_como_del_bot()
    {
        var titular = CrearTitular();
        var cuota = CrearCuota(9, 2026, 11);
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota });
        SetupSinExistentes();
        SetupGuardadoOk();

        var resultado = await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "50000.00")), CancellationToken.None);

        resultado.Creado.Should().BeTrue();
        resultado.Pago.Monto.Should().Be(50000m);
        var movimiento = cuota.Movimientos.Should().ContainSingle().Subject;
        movimiento.EsDeBot.Should().BeTrue();
        movimiento.OrigenMensajeId.Should().Be(BotMensajeId.Hashear(MensajeIdCrudo));
        movimiento.GrupoId.Should().NotBeNull().And.NotBe(Guid.Empty);
        movimiento.GrupoId.Should().Be(resultado.Pago.GrupoId);
        movimiento.FechaCreacion.Should().Be(Ahora.UtcDateTime);
        movimiento.FechaPago.Should().Be(Ahora);
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Once);
        _pagos.Verify(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Pago_que_cubre_dos_cuotas_usa_un_mismo_grupo_y_los_saldos_correctos()
    {
        var titular = CrearTitular();
        var cuota9 = CrearCuota(9, 2026, 11);
        var cuota10 = CrearCuota(10, 2026, 12);
        // Orden descendente, como el repositorio real.
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota10, cuota9 });
        SetupSinExistentes();
        SetupGuardadoOk();

        var resultado = await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido()), CancellationToken.None);

        var grupo = resultado.Pago.GrupoId;
        grupo.Should().NotBe(Guid.Empty);
        resultado.Pago.Movimientos.Should().HaveCount(2);
        resultado.Pago.Movimientos[0].Should().Match<BotPagoModel.MovimientoItem>(m =>
            m.Anio == 2026 && m.Mes == 9 && m.Aplicado == 120000m && m.SaldoRestante == 0m);
        resultado.Pago.Movimientos[1].Should().Match<BotPagoModel.MovimientoItem>(m =>
            m.Anio == 2026 && m.Mes == 10 && m.Aplicado == 30000m && m.SaldoRestante == 90000m);
        cuota9.Movimientos.Single().GrupoId.Should().Be(grupo);
        cuota10.Movimientos.Single().GrupoId.Should().Be(grupo);
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Mensaje_ya_existente_devuelve_los_movimientos_sin_crear_ni_notificar()
    {
        var titular = CrearTitular();
        var cuota = CrearCuota(9, 2026, 11);
        var grupo = Guid.NewGuid();
        var existente = CrearMovimientoDeBot(cuota, 60000m, 77, grupo);
        // Pago no del bot sobre la misma cuota: cuenta para el saldo actual (120000 - 60000 - 20000).
        cuota.AplicarPago(20000m, Ahora, "Efectivo", null);
        _pagos.Setup(r => r.GetMovimientosPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { existente });

        var resultado = await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido()), CancellationToken.None);

        resultado.Creado.Should().BeFalse();
        resultado.Pago.GrupoId.Should().Be(grupo);
        resultado.Pago.Monto.Should().Be(60000m);
        resultado.Pago.Movimientos.Should().ContainSingle()
            .Which.Should().Match<BotPagoModel.MovimientoItem>(m =>
                m.Id == 77 && m.Anio == 2026 && m.Mes == 9 && m.Aplicado == 60000m && m.SaldoRestante == 40000m);
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
        _pagos.Verify(r => r.GetByTitularIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _notificaciones.Verify(r => r.CrearNotificacionPagoBotAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<IReadOnlyList<string>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Carrera_en_el_guardado_devuelve_Creado_false_con_los_existentes()
    {
        var titular = CrearTitular();
        var cuota = CrearCuota(9, 2026, 11);
        var grupo = Guid.NewGuid();
        // Instancia aparte: el otro pedido ya guardó su movimiento; la cuota del handler sigue con saldo.
        var existente = CrearMovimientoDeBot(CrearCuota(9, 2026, 11), 120000m, 77, grupo);
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota });
        _pagos.SetupSequence(r => r.GetMovimientosPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>())
            .ReturnsAsync(new List<PagoMovimiento> { existente });
        _pagos.Setup(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var resultado = await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "120000.00")), CancellationToken.None);

        resultado.Creado.Should().BeFalse();
        resultado.Pago.GrupoId.Should().Be(grupo);
        _notificaciones.Verify(r => r.CrearNotificacionPagoBotAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<IReadOnlyList<string>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Monto_mayor_a_la_deuda_lanza_ValidationException_y_no_guarda()
    {
        var titular = CrearTitular();
        SetupTitularYPagos(titular, new List<PagoMensual> { CrearCuota(9, 2026, 11) });
        SetupSinExistentes();

        var accion = () => CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "130000.00")), CancellationToken.None);

        await accion.Should().ThrowAsync<ValidationException>();
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Fecha_de_hoy_usa_el_instante_actual()
    {
        var titular = CrearTitular();
        var cuota = CrearCuota(9, 2026, 11);
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota });
        SetupSinExistentes();
        SetupGuardadoOk();

        await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "50000.00", fecha: "2026-10-08")), CancellationToken.None);

        cuota.Movimientos.Single().FechaPago.Should().Be(Ahora);
    }

    [Fact]
    public async Task Fecha_anterior_usa_las_12_horas_con_offset_menos_tres()
    {
        var titular = CrearTitular();
        var cuota = CrearCuota(9, 2026, 11);
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota });
        SetupSinExistentes();
        SetupGuardadoOk();

        await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "50000.00", fecha: "2026-10-07")), CancellationToken.None);

        cuota.Movimientos.Single().FechaPago.Should().Be(new DateTimeOffset(2026, 10, 7, 12, 0, 0, TimeSpan.FromHours(-3)));
    }

    [Fact]
    public async Task Notifica_con_los_periodos_cubiertos_y_el_id_de_la_primera_cuota()
    {
        var titular = CrearTitular();
        var cuota9 = CrearCuota(9, 2026, 11);
        var cuota10 = CrearCuota(10, 2026, 12);
        SetupTitularYPagos(titular, new List<PagoMensual> { cuota10, cuota9 });
        SetupSinExistentes();
        SetupGuardadoOk();

        await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido()), CancellationToken.None);

        _notificaciones.Verify(r => r.CrearNotificacionPagoBotAsync(
            titular.Apellido,
            150000m,
            It.Is<IReadOnlyList<string>>(p => p.SequenceEqual(new[] { "09/2026", "10/2026" })),
            11,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Si_falla_la_notificacion_igual_devuelve_el_resultado()
    {
        var titular = CrearTitular();
        SetupTitularYPagos(titular, new List<PagoMensual> { CrearCuota(9, 2026, 11) });
        SetupSinExistentes();
        SetupGuardadoOk();
        _notificaciones
            .Setup(r => r.CrearNotificacionPagoBotAsync(
                It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<IReadOnlyList<string>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("push caído"));

        var resultado = await CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "50000.00")), CancellationToken.None);

        resultado.Creado.Should().BeTrue();
        resultado.Pago.Monto.Should().Be(50000m);
    }

    [Fact]
    public async Task Titular_inexistente_lanza_NotFoundException()
    {
        _titulares.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync((Titular?)null);
        SetupSinExistentes();

        var accion = () => CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido()), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Titular_dado_de_baja_lanza_NotFoundException()
    {
        var titular = CrearTitular();
        titular.DarDeBaja();
        _titulares.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(titular);
        SetupSinExistentes();

        var accion = () => CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido()), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Pedido_invalido_lanza_ValidationException_sin_tocar_repositorios()
    {
        var accion = () => CrearHandler().Handle(new RegistrarPagoBotCommand(Pedido(monto: "abc")), CancellationToken.None);

        await accion.Should().ThrowAsync<ValidationException>();
        _titulares.VerifyNoOtherCalls();
        _pagos.VerifyNoOtherCalls();
        _notificaciones.VerifyNoOtherCalls();
    }
}
