using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Bot;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Application.Commands;

public class RegistrarGastoBotCommandHandlerTests
{
    // 2026-10-08 15:00 UTC = 12:00 en Argentina (mismo día).
    private static readonly DateTimeOffset Ahora = new(2026, 10, 8, 15, 0, 0, TimeSpan.Zero);

    private const string MensajeIdCrudo = "msg-1";
    private static readonly string ClaveMensaje = BotMensajeId.Hashear(MensajeIdCrudo);

    private readonly Mock<IGastoRepository> _gastos = new();

    private sealed class RelojFijo : TimeProvider
    {
        private readonly DateTimeOffset _ahora;

        public RelojFijo(DateTimeOffset ahora) => _ahora = ahora;

        public override DateTimeOffset GetUtcNow() => _ahora;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private RegistrarGastoBotCommandHandler CrearHandler() => new(_gastos.Object, new RelojFijo(Ahora));

    private static BotGastoModel.RegistrarRequest Pedido(string fecha = "2026-10-08", string mensajeId = MensajeIdCrudo) =>
        new(mensajeId, "4500.00", "Combustible", "Efectivo", "Pagado", fecha, "Nafta Ducato", "ducato");

    private static GastoMensual CrearExistente(string claveMensaje)
    {
        var gasto = new GastoMensual(
            10, 2026, GastoMensual.TipoVariable, "Otros", "Existente", 100m,
            new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc), "Efectivo", EstadoPagoGasto.Pagado);
        gasto.MarcarComoCargadoPorBot(claveMensaje, Ahora.UtcDateTime.AddHours(-2));
        typeof(GastoMensual).GetProperty(nameof(GastoMensual.Id))!.SetValue(gasto, 77);
        return gasto;
    }

    [Fact]
    public async Task Alta_nueva_crea_el_gasto_del_bot()
    {
        GastoMensual? guardado = null;
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        _gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Callback<GastoMensual, CancellationToken>((g, _) => guardado = g)
            .ReturnsAsync((GastoMensual g, CancellationToken _) => (g, true));

        var resultado = await CrearHandler().Handle(new RegistrarGastoBotCommand(Pedido()), CancellationToken.None);

        resultado.Creado.Should().BeTrue();
        resultado.Gasto.Tipo.Should().Be("Variable");
        resultado.Gasto.Mes.Should().Be(10);
        resultado.Gasto.Anio.Should().Be(2026);
        resultado.Gasto.Monto.Should().Be(4500m);
        resultado.Gasto.Vehiculo.Should().Be("Ducato");
        guardado.Should().NotBeNull();
        guardado!.Tipo.Should().Be("Variable");
        guardado.Observaciones.Should().BeNull();
        guardado.EsDeBot.Should().BeTrue();
        guardado.OrigenMensajeId.Should().Be(ClaveMensaje);
        guardado.FechaCreacion.Should().Be(Ahora.UtcDateTime);
        _gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Alta_nueva_guarda_el_hash_del_id_y_nunca_el_id_en_claro()
    {
        GastoMensual? guardado = null;
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        _gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Callback<GastoMensual, CancellationToken>((g, _) => guardado = g)
            .ReturnsAsync((GastoMensual g, CancellationToken _) => (g, true));

        await CrearHandler().Handle(new RegistrarGastoBotCommand(Pedido()), CancellationToken.None);

        guardado.Should().NotBeNull();
        guardado!.OrigenMensajeId.Should().Be(BotMensajeId.Hashear(MensajeIdCrudo));
        guardado.OrigenMensajeId.Should().NotBe(MensajeIdCrudo);
        _gastos.Verify(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()), Times.Once);
        _gastos.Verify(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(MensajeIdCrudo, It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Mensaje_ya_existente_devuelve_el_existente_sin_crear()
    {
        var existente = CrearExistente(ClaveMensaje);
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existente);

        var resultado = await CrearHandler().Handle(new RegistrarGastoBotCommand(Pedido()), CancellationToken.None);

        resultado.Creado.Should().BeFalse();
        resultado.Gasto.Id.Should().Be(77);
        resultado.Gasto.Descripcion.Should().Be("Existente");
        _gastos.Verify(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Carrera_en_el_repositorio_devuelve_Creado_false()
    {
        var existente = CrearExistente(ClaveMensaje);
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(ClaveMensaje, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        _gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((existente, false));

        var resultado = await CrearHandler().Handle(new RegistrarGastoBotCommand(Pedido()), CancellationToken.None);

        resultado.Creado.Should().BeFalse();
        resultado.Gasto.Id.Should().Be(77);
    }

    [Fact]
    public async Task Pedido_invalido_lanza_ValidationException_y_no_toca_el_repositorio()
    {
        var pedido = Pedido() with { Monto = "abc" };

        var accion = () => CrearHandler().Handle(new RegistrarGastoBotCommand(pedido), CancellationToken.None);

        await accion.Should().ThrowAsync<ValidationException>();
        _gastos.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Mes_y_anio_salen_de_la_fecha_aunque_sea_de_otro_mes()
    {
        GastoMensual? guardado = null;
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        _gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .Callback<GastoMensual, CancellationToken>((g, _) => guardado = g)
            .ReturnsAsync((GastoMensual g, CancellationToken _) => (g, true));

        var resultado = await CrearHandler().Handle(
            new RegistrarGastoBotCommand(Pedido(fecha: "2026-09-30")), CancellationToken.None);

        resultado.Gasto.Mes.Should().Be(9);
        resultado.Gasto.Anio.Should().Be(2026);
        guardado!.Mes.Should().Be(9);
        guardado.Fecha.Should().Be(new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task La_fecha_de_hoy_se_calcula_en_hora_argentina()
    {
        // 2026-10-09 01:00 UTC = 2026-10-08 22:00 en Argentina: el 9 todavía es futuro, el 8 es hoy.
        var reloj = new RelojFijo(new DateTimeOffset(2026, 10, 9, 1, 0, 0, TimeSpan.Zero));
        var handler = new RegistrarGastoBotCommandHandler(_gastos.Object, reloj);
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorOrigenMensajeIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);
        _gastos
            .Setup(r => r.AgregarGastoDeBotAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual g, CancellationToken _) => (g, true));

        var futuro = () => handler.Handle(new RegistrarGastoBotCommand(Pedido(fecha: "2026-10-09")), CancellationToken.None);
        await futuro.Should().ThrowAsync<ValidationException>();

        var hoy = await handler.Handle(new RegistrarGastoBotCommand(Pedido(fecha: "2026-10-08")), CancellationToken.None);
        hoy.Creado.Should().BeTrue();
    }
}
