using FluentAssertions;
using MediatR;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class ActualizarPagoMensualObservacionesCommandHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();

    private ActualizarPagoMensualObservacionesCommandHandler CrearHandler() =>
        new(_pagoRepo.Object);

    [Fact]
    public async Task Handle_PagoNoExiste_LanzaNotFoundException()
    {
        _pagoRepo.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new ActualizarPagoMensualObservacionesCommand(99, new PagoMensualModel.UpdateObservacionesRequest("obs")),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*PagoMensual*99*");
    }

    [Fact]
    public async Task Handle_DatosValidos_ActualizaObservacionesEnEntidad()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m);

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        await handler.Handle(
            new ActualizarPagoMensualObservacionesCommand(1, new PagoMensualModel.UpdateObservacionesRequest("nueva observacion")),
            CancellationToken.None);

        pago.Observaciones.Should().Be("nueva observacion");
    }

    [Fact]
    public async Task Handle_ObservacionNull_LimpiaCampoEnEntidad()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m, "obs previa");

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        await handler.Handle(
            new ActualizarPagoMensualObservacionesCommand(1, new PagoMensualModel.UpdateObservacionesRequest(null)),
            CancellationToken.None);

        pago.Observaciones.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ActualizacionExitosa_LlamaUpdateAsyncYRetornaUnit()
    {
        var pago = new PagoMensual(1, 6, 2025, 10000m);

        _pagoRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);
        _pagoRepo.Setup(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new ActualizarPagoMensualObservacionesCommand(1, new PagoMensualModel.UpdateObservacionesRequest("obs")),
            CancellationToken.None);

        result.Should().Be(Unit.Value);
        _pagoRepo.Verify(r => r.UpdateAsync(pago, It.IsAny<CancellationToken>()), Times.Once);
    }
}
