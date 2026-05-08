using FluentAssertions;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class AjustarMontoTitularCommandHandlerTests
{
    private readonly Mock<ITitularRepository> _titularRepo = new();
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();
    private readonly Mock<ITransactionManager> _txManager = new();
    private readonly Mock<INotificacionService> _notifService = new();

    private AjustarMontoTitularCommandHandler CrearHandler() =>
        new(_titularRepo.Object, _pagoRepo.Object, _txManager.Object, _notifService.Object);

    private void SetupTransaccion()
    {
        var scopeMock = new Mock<ITransactionScope>();
        scopeMock.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        scopeMock.Setup(t => t.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        scopeMock.Setup(t => t.DisposeAsync()).Returns(ValueTask.CompletedTask);
        _txManager.Setup(t => t.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopeMock.Object);
    }

    private static Titular CrearTitular() => new("Perez", "Carlos", "Av. Test 456", 10000m);

    [Fact]
    public async Task Handle_TitularNoExiste_LanzaNotFoundException()
    {
        _titularRepo.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new AjustarMontoTitularCommand(99, new PagoMensualModel.AjusteTitularRequest(12000m)),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Titular*99*");
    }

    [Fact]
    public async Task Handle_MontoInvalido_LanzaValidationException()
    {
        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new AjustarMontoTitularCommand(1, new PagoMensualModel.AjusteTitularRequest(0m)),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_AjusteValido_RetornaResponseConDatosCorrectos()
    {
        SetupTransaccion();

        var titular = CrearTitular(); // MontoMensualPactado = 10000
        var pagoPendiente = new PagoMensual(1, 6, 2025, 10000m);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { pagoPendiente });
        _titularRepo.Setup(r => r.UpdateAsync(titular, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _pagoRepo.Setup(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _notifService.Setup(n => n.CrearNotificacionAjusteMontoAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new AjustarMontoTitularCommand(1, new PagoMensualModel.AjusteTitularRequest(12000m, true, null)),
            CancellationToken.None);

        result.TitularId.Should().Be(1);
        result.MontoAnterior.Should().Be(10000m);
        result.MontoNuevo.Should().Be(12000m);
        result.CantidadCuotasActualizadas.Should().Be(1);
    }

    [Fact]
    public async Task Handle_AjusteValido_LlamaUpdateEnTitularYPagos()
    {
        SetupTransaccion();

        var titular = CrearTitular();
        var pago = new PagoMensual(1, 6, 2025, 10000m);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { pago });
        _titularRepo.Setup(r => r.UpdateAsync(titular, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _pagoRepo.Setup(r => r.UpdateAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _notifService.Setup(n => n.CrearNotificacionAjusteMontoAsync(
            It.IsAny<string>(), It.IsAny<decimal>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        await handler.Handle(
            new AjustarMontoTitularCommand(1, new PagoMensualModel.AjusteTitularRequest(15000m, true, null)),
            CancellationToken.None);

        _titularRepo.Verify(r => r.UpdateAsync(titular, It.IsAny<CancellationToken>()), Times.Once);
        _pagoRepo.Verify(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_MontoMenorAlTotalPagado_LanzaValidationException()
    {
        SetupTransaccion();

        var titular = CrearTitular();
        var pago = new PagoMensual(1, 6, 2025, 10000m);
        pago.AplicarPago(8000m, DateTimeOffset.UtcNow, "Efectivo", null);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { pago });

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new AjustarMontoTitularCommand(1, new PagoMensualModel.AjusteTitularRequest(5000m, false, null)),
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*menor al total pagado*");
    }

    [Fact]
    public async Task Handle_ErrorEnRepositorioDePagos_HaceRollback()
    {
        var scopeMock = new Mock<ITransactionScope>();
        scopeMock.Setup(t => t.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        scopeMock.Setup(t => t.RollbackAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        scopeMock.Setup(t => t.DisposeAsync()).Returns(ValueTask.CompletedTask);
        _txManager.Setup(t => t.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopeMock.Object);

        var titular = CrearTitular();
        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("error de base de datos"));

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new AjustarMontoTitularCommand(1, new PagoMensualModel.AjusteTitularRequest(12000m)),
            CancellationToken.None);

        await act.Should().ThrowAsync<Exception>();
        scopeMock.Verify(t => t.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
