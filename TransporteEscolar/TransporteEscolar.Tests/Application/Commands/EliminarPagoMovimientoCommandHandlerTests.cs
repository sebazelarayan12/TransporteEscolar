using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class EliminarPagoMovimientoCommandHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();

    private EliminarPagoMovimientoCommandHandler CrearHandler() =>
        new(_pagoRepo.Object);

    [Fact]
    public async Task Handle_PagoNoExiste_LanzaNotFoundException()
    {
        _pagoRepo.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new EliminarPagoMovimientoCommand(99, 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*PagoMensual*99*");
    }

    [Fact]
    public async Task Handle_MovimientoNoExisteEnNingunLado_LanzaNotFoundException()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m); // sin movimientos

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.GetMovimientoByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMovimiento?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new EliminarPagoMovimientoCommand(1, 99),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*PagoMovimiento*99*");
    }

    [Fact]
    public async Task Handle_MovimientoExisteEnOtroPago_LanzaValidationException()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m); // sin movimientos
        var movimientoDeOtroPago = new PagoMovimiento(2, 5000m, DateTimeOffset.UtcNow, "Efectivo");

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.GetMovimientoByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync(movimientoDeOtroPago);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new EliminarPagoMovimientoCommand(1, 99),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*no pertenece*");
    }

    [Fact]
    public async Task Handle_MovimientoValido_EliminaYGuardaCambios()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m);
        pago.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null); // movimiento.Id = 0

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        // movimientoId = 0 porque EF no asigna Id en tests (private setter)
        var result = await handler.Handle(
            new EliminarPagoMovimientoCommand(1, 0),
            CancellationToken.None);

        pago.Movimientos.Should().BeEmpty();
        _pagoRepo.Verify(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()), Times.Once);
        result.Monto.Should().Be(5000m);
    }

    [Fact]
    public async Task Handle_MovimientoEliminado_RetornaResponseConDatosDelMovimiento()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m);
        pago.AplicarPago(7000m, DateTimeOffset.UtcNow, "Transferencia", "obs test");

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new EliminarPagoMovimientoCommand(1, 0),
            CancellationToken.None);

        result.Monto.Should().Be(7000m);
        result.MedioPago.Should().Be("Transferencia");
        result.Mes.Should().Be(6);
        result.Anio.Should().Be(2025);
    }
}
