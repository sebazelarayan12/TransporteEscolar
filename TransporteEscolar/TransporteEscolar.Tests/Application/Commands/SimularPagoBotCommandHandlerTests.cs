using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Bot.Commands;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class SimularPagoBotCommandHandlerTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPagoMensualRepository> _pagos = new();

    private SimularPagoBotCommandHandler CrearHandler() => new(_titulares.Object, _pagos.Object);

    private static BotPagoModel.SimularRequest Pedido(int? titularId = 1, string? monto = "150000.00") =>
        new(titularId, monto);

    private static Titular CrearTitular(int id = 1)
    {
        var titular = new Titular("Perez", "Ana", "Calle 1", 120000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        return titular;
    }

    private static PagoMensual CrearCuota(int titularId, int mes, int anio, int id, decimal montoGenerado = 120000m)
    {
        var pago = new PagoMensual(titularId, mes, anio, montoGenerado);
        typeof(PagoMensual).GetProperty(nameof(PagoMensual.Id))!.SetValue(pago, id);
        return pago;
    }

    private void SetupTitularExistente(Titular titular) =>
        _titulares.Setup(r => r.GetByIdAsync(titular.Id, It.IsAny<CancellationToken>())).ReturnsAsync(titular);

    [Fact]
    public async Task Simula_el_reparto_de_dos_cuotas_con_los_numeros_exactos()
    {
        var titular = CrearTitular();
        SetupTitularExistente(titular);
        // El repositorio devuelve las cuotas en orden descendente, como el real.
        _pagos.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { CrearCuota(1, 10, 2026, 12), CrearCuota(1, 9, 2026, 11) });

        var resultado = await CrearHandler().Handle(new SimularPagoBotCommand(Pedido()), CancellationToken.None);

        resultado.TitularId.Should().Be(1);
        resultado.Apellido.Should().Be(titular.Apellido);
        resultado.Monto.Should().Be(150000m);
        resultado.Reparto.Should().BeEquivalentTo(new[]
        {
            new BotPagoModel.RepartoItem(2026, 9, 120000m, 0m),
            new BotPagoModel.RepartoItem(2026, 10, 30000m, 90000m),
        }, options => options.WithStrictOrdering());
    }

    [Fact]
    public async Task Monto_mayor_a_la_deuda_lanza_ValidationException_con_el_sobrante()
    {
        SetupTitularExistente(CrearTitular());
        _pagos.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { CrearCuota(1, 9, 2026, 11) });

        var accion = () => CrearHandler().Handle(new SimularPagoBotCommand(Pedido(monto: "130000.00")), CancellationToken.None);

        var error = await accion.Should().ThrowAsync<ValidationException>();
        error.Which.Message.Should().Contain("Sobrante");
        error.Which.Message.Should().Contain("Sobrante: 10000.");
    }

    [Fact]
    public async Task Sin_cuotas_pendientes_lanza_ValidationException()
    {
        SetupTitularExistente(CrearTitular());
        _pagos.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual>());

        var accion = () => CrearHandler().Handle(new SimularPagoBotCommand(Pedido()), CancellationToken.None);

        await accion.Should().ThrowAsync<ValidationException>()
            .WithMessage("No hay cuotas pendientes para este titular.");
    }

    [Fact]
    public async Task Titular_inexistente_lanza_NotFoundException()
    {
        _titulares.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync((Titular?)null);

        var accion = () => CrearHandler().Handle(new SimularPagoBotCommand(Pedido()), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Titular_dado_de_baja_lanza_NotFoundException()
    {
        var titular = CrearTitular();
        titular.DarDeBaja();
        SetupTitularExistente(titular);

        var accion = () => CrearHandler().Handle(new SimularPagoBotCommand(Pedido()), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task Simular_no_escribe_nada()
    {
        SetupTitularExistente(CrearTitular());
        _pagos.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { CrearCuota(1, 9, 2026, 11) });

        await CrearHandler().Handle(new SimularPagoBotCommand(Pedido(monto: "50000.00")), CancellationToken.None);

        _pagos.Verify(r => r.GuardarPagoDeBotAsync(It.IsAny<CancellationToken>()), Times.Never);
        _pagos.Verify(r => r.EliminarMovimientosAsync(It.IsAny<IReadOnlyCollection<PagoMovimiento>>(), It.IsAny<CancellationToken>()), Times.Never);
        _pagos.Verify(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
        _pagos.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
