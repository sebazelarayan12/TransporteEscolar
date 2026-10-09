using FluentAssertions;
using MediatR;
using Moq;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Commands;

public class AnularPagoBotCommandHandlerTests
{
    // 2026-10-08 15:00 UTC.
    private static readonly DateTimeOffset Ahora = new(2026, 10, 8, 15, 0, 0, TimeSpan.Zero);
    private static readonly Guid Grupo = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private readonly Mock<IPagoMensualRepository> _pagos = new();

    private sealed class RelojFijo : TimeProvider
    {
        private readonly DateTimeOffset _ahora;

        public RelojFijo(DateTimeOffset ahora) => _ahora = ahora;

        public override DateTimeOffset GetUtcNow() => _ahora;

        public override TimeZoneInfo LocalTimeZone => TimeZoneInfo.Utc;
    }

    private AnularPagoBotCommandHandler CrearHandler() => new(_pagos.Object, new RelojFijo(Ahora));

    private static PagoMovimiento CrearMovimientoDeBot(int id, DateTime creadoUtc, Guid? grupo = null)
    {
        var movimiento = new PagoMovimiento(1, 50000m, Ahora, "Efectivo");
        movimiento.MarcarComoCargadoPorBot("hash.1", grupo ?? Grupo, creadoUtc);
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.Id))!.SetValue(movimiento, id);
        return movimiento;
    }

    private static PagoMovimiento CrearMovimientoManual(int id)
    {
        var movimiento = new PagoMovimiento(1, 1000m, Ahora, "Efectivo");
        typeof(PagoMovimiento).GetProperty(nameof(PagoMovimiento.Id))!.SetValue(movimiento, id);
        return movimiento;
    }

    [Fact]
    public async Task Grupo_reciente_de_dos_movimientos_del_bot_se_elimina_una_vez()
    {
        var movimientos = new List<PagoMovimiento>
        {
            CrearMovimientoDeBot(1, Ahora.UtcDateTime.AddHours(-1)),
            CrearMovimientoDeBot(2, Ahora.UtcDateTime.AddHours(-1)),
        };
        _pagos.Setup(r => r.GetMovimientosPorGrupoIdAsync(Grupo, It.IsAny<CancellationToken>())).ReturnsAsync(movimientos);

        var resultado = await CrearHandler().Handle(new AnularPagoBotCommand(Grupo), CancellationToken.None);

        resultado.Should().Be(Unit.Value);
        _pagos.Verify(r => r.EliminarMovimientosAsync(
            It.Is<IReadOnlyCollection<PagoMovimiento>>(c => c.Count == 2 && c.Contains(movimientos[0]) && c.Contains(movimientos[1])),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Grupo_inexistente_lanza_NotFoundException()
    {
        _pagos.Setup(r => r.GetMovimientosPorGrupoIdAsync(Grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>());

        var accion = () => CrearHandler().Handle(new AnularPagoBotCommand(Grupo), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Movimiento_de_24_horas_exactas_no_se_anula()
    {
        _pagos.Setup(r => r.GetMovimientosPorGrupoIdAsync(Grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento> { CrearMovimientoDeBot(1, Ahora.UtcDateTime.AddHours(-24)) });

        var accion = () => CrearHandler().Handle(new AnularPagoBotCommand(Grupo), CancellationToken.None);

        await accion.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Pasó el plazo para anular este pago (24 horas). Anulalo desde la app.");
        _pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Grupo_mezclado_con_un_movimiento_que_no_es_del_bot_no_elimina_nada()
    {
        _pagos.Setup(r => r.GetMovimientosPorGrupoIdAsync(Grupo, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMovimiento>
            {
                CrearMovimientoDeBot(1, Ahora.UtcDateTime.AddHours(-1)),
                CrearMovimientoManual(2),
            });

        var accion = () => CrearHandler().Handle(new AnularPagoBotCommand(Grupo), CancellationToken.None);

        await accion.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("Solo se pueden anular pagos cargados por el bot.");
        _pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
