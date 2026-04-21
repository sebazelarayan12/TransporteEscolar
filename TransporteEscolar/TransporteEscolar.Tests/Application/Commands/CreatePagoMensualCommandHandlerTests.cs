using FluentAssertions;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class CreatePagoMensualCommandHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();
    private readonly Mock<ITitularRepository> _titularRepo = new();

    private CreatePagoMensualCommandHandler CrearHandler() =>
        new(_pagoRepo.Object, _titularRepo.Object);

    private static Titular CrearTitular() => new("Garcia", "Juan", "Dir 1", 10000m);

    private static PagoMensualModel.Request RequestValido(int titularId = 1) =>
        new(titularId, Mes: 6, Anio: 2025, MontoGenerado: 10000m, Observaciones: null);

    [Fact]
    public async Task Handle_DatosValidos_RetornaPagoMensualResponse()
    {
        var titular = CrearTitular();
        var pagoCreado = new PagoMensual(1, 6, 2025, 10000m);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularMesAnioAsync(1, 6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);
        _pagoRepo.Setup(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagoCreado);

        var handler = CrearHandler();
        var result = await handler.Handle(new CreatePagoMensualCommand(RequestValido()), CancellationToken.None);

        result.Should().NotBeNull();
        result.Mes.Should().Be(6);
        result.Anio.Should().Be(2025);
        result.MontoGenerado.Should().Be(10000m);
    }

    [Fact]
    public async Task Handle_TitularNoExiste_LanzaNotFoundException()
    {
        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(new CreatePagoMensualCommand(RequestValido()), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Titular*");
    }

    [Fact]
    public async Task Handle_PagoYaExisteParaElPeriodo_LanzaValidationException()
    {
        var titular = CrearTitular();
        var pagoExistente = new PagoMensual(1, 6, 2025, 10000m);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularMesAnioAsync(1, 6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagoExistente);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(new CreatePagoMensualCommand(RequestValido()), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>().WithMessage("*Ya existe*");
    }

    [Fact]
    public async Task Handle_RequestConDatosInvalidos_LanzaValidationException()
    {
        var requestInvalida = new PagoMensualModel.Request(TitularId: 0, Mes: 6, Anio: 2025, MontoGenerado: 10000m, Observaciones: null);
        var handler = CrearHandler();
        var act = async () => await handler.Handle(new CreatePagoMensualCommand(requestInvalida), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_CreacionExitosa_LlamaAddAsyncUnaVez()
    {
        var titular = CrearTitular();
        var pago = new PagoMensual(1, 6, 2025, 10000m);

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularMesAnioAsync(1, 6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);
        _pagoRepo.Setup(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pago);

        var handler = CrearHandler();
        await handler.Handle(new CreatePagoMensualCommand(RequestValido()), CancellationToken.None);

        _pagoRepo.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
