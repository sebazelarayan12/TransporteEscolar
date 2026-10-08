using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Commands;

public class AnularGastoBotCommandHandlerTests
{
    private static readonly DateTimeOffset Ahora = new(2026, 10, 8, 15, 0, 0, TimeSpan.Zero);

    private readonly Mock<IGastoRepository> _gastos = new();

    private sealed class RelojFijo : TimeProvider
    {
        private readonly DateTimeOffset _ahora;

        public RelojFijo(DateTimeOffset ahora) => _ahora = ahora;

        public override DateTimeOffset GetUtcNow() => _ahora;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private AnularGastoBotCommandHandler CrearHandler() => new(_gastos.Object, new RelojFijo(Ahora));

    private GastoMensual ConfigurarGasto(string tipo, TimeSpan? antiguedadBot)
    {
        var gasto = new GastoMensual(
            10, 2026, tipo, "Otros", "Gasto", 100m,
            new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc), "Efectivo", EstadoPagoGasto.Pagado);
        typeof(GastoMensual).GetProperty(nameof(GastoMensual.Id))!.SetValue(gasto, 5);

        if (antiguedadBot is not null)
            gasto.MarcarComoCargadoPorBot("msg-1", Ahora.UtcDateTime - antiguedadBot.Value);

        _gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(gasto);
        return gasto;
    }

    [Fact]
    public async Task Gasto_del_bot_de_hace_1_hora_se_elimina()
    {
        var gasto = ConfigurarGasto(GastoMensual.TipoVariable, TimeSpan.FromHours(1));

        await CrearHandler().Handle(new AnularGastoBotCommand(5), CancellationToken.None);

        _gastos.Verify(r => r.EliminarGastoMensualAsync(gasto, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(24)]
    [InlineData(25)]
    public async Task Gasto_del_bot_fuera_de_plazo_lanza_BusinessRuleException(int horas)
    {
        ConfigurarGasto(GastoMensual.TipoVariable, TimeSpan.FromHours(horas));

        var accion = () => CrearHandler().Handle(new AnularGastoBotCommand(5), CancellationToken.None);

        await accion.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Pasó el plazo para anular este gasto (24 horas). Borralo desde la app.");
        _gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Gasto_de_la_app_sin_OrigenMensajeId_lanza_BusinessRuleException()
    {
        ConfigurarGasto(GastoMensual.TipoVariable, antiguedadBot: null);

        var accion = () => CrearHandler().Handle(new AnularGastoBotCommand(5), CancellationToken.None);

        await accion.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Solo se pueden anular gastos cargados por el bot.");
        _gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Gasto_fijo_lanza_BusinessRuleException()
    {
        ConfigurarGasto(GastoMensual.TipoFijo, TimeSpan.FromHours(1));

        var accion = () => CrearHandler().Handle(new AnularGastoBotCommand(5), CancellationToken.None);

        await accion.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Solo se pueden anular gastos cargados por el bot.");
        _gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Id_inexistente_lanza_NotFoundException()
    {
        _gastos
            .Setup(r => r.ObtenerGastoMensualPorIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GastoMensual?)null);

        var accion = () => CrearHandler().Handle(new AnularGastoBotCommand(999), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _gastos.Verify(r => r.EliminarGastoMensualAsync(It.IsAny<GastoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
