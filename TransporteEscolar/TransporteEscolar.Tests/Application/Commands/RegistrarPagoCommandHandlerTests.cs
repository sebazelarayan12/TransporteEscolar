using FluentAssertions;
using MediatR;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class RegistrarPagoCommandHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();
    private readonly Mock<ITitularRepository> _titularRepo = new();
    private readonly Mock<INotificacionService> _notifService = new();

    private RegistrarPagoCommandHandler CrearHandler() =>
        new(_pagoRepo.Object, _titularRepo.Object, _notifService.Object);

    private static Titular CrearTitular() => new("Lopez", "Maria", "Calle 123", 10000m);

    private static PagoMensualModel.RegistrarPagoRequest PayloadValido(decimal monto = 10000m) =>
        new(monto, DateTimeOffset.UtcNow, "Efectivo", null);

    [Fact]
    public async Task Handle_PagoValido_RegistraYNotifica()
    {
        var titular = CrearTitular();
        var pago = new PagoMensual(1, 6, 2025, 10000m);
        var pagos = new List<PagoMensual> { pago };

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _titularRepo.Setup(r => r.GetByIdAsync(pago.TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(pago.TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);
        _notifService.Setup(n => n.CrearNotificacionPagoRegistradoAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        var result = await handler.Handle(new RegistrarPagoCommand(1, PayloadValido(10000m)), CancellationToken.None);

        result.Should().Be(Unit.Value);
        _pagoRepo.Verify(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        _notifService.Verify(n => n.CrearNotificacionPagoRegistradoAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PagoMensualNoExiste_LanzaNotFoundException()
    {
        _pagoRepo.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(new RegistrarPagoCommand(99, PayloadValido()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*PagoMensual*99*");
    }

    [Fact]
    public async Task Handle_TitularNoExiste_LanzaNotFoundException()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m);

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _titularRepo.Setup(r => r.GetByIdAsync(pago.TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(new RegistrarPagoCommand(1, PayloadValido()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Titular*");
    }

    [Fact]
    public async Task Handle_MontoInvalido_LanzaValidationException()
    {
        var handler = CrearHandler();
        var payloadInvalido = new PagoMensualModel.RegistrarPagoRequest(0m, DateTimeOffset.UtcNow, "Efectivo", null);
        var act = async () => await handler.Handle(new RegistrarPagoCommand(1, payloadInvalido), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*monto*");
    }

    [Fact]
    public async Task Handle_MontoExcedeDeuda_LanzaValidationException()
    {
        var titular = CrearTitular();
        var pago = new PagoMensual(1, 6, 2025, 5000m);
        var pagos = new List<PagoMensual> { pago };

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _titularRepo.Setup(r => r.GetByIdAsync(pago.TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(pago.TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(new RegistrarPagoCommand(1, PayloadValido(9999m)), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }
}
