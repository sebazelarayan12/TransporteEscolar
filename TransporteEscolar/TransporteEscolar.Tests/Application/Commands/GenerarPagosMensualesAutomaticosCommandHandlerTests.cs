using FluentAssertions;
using MediatR;
using Moq;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class GenerarPagosMensualesAutomaticosCommandHandlerTests
{
    private readonly Mock<ITitularRepository> _titularRepo = new();
    private readonly Mock<IPagoMensualRepository> _pagoRepo = new();

    private GenerarPagosMensualesAutomaticosCommandHandler CrearHandler() =>
        new(_titularRepo.Object, _pagoRepo.Object);

    // Reflection helper: Titular.Id tiene private setter, necesario para que GenerarPagos valide correctamente
    private static Titular CrearTitularConId(int id, decimal monto = 10000m)
    {
        var type = typeof(Titular);
        var ctor = type.GetConstructor(
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance,
            null, Type.EmptyTypes, null)!;
        var titular = (Titular)ctor.Invoke(null);
        type.GetProperty("Id")!.SetValue(titular, id);
        type.GetProperty("Apellido")!.SetValue(titular, "TEST");
        type.GetProperty("NombreContacto")!.SetValue(titular, "Test");
        type.GetProperty("Direccion")!.SetValue(titular, "Dir");
        type.GetProperty("MontoMensualPactado")!.SetValue(titular, monto);
        type.GetProperty("FechaAlta")!.SetValue(titular, DateTime.UtcNow);
        return titular;
    }

    private void SetupAddAsync()
    {
        _pagoRepo
            .Setup(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .Returns<PagoMensual, CancellationToken>((p, _) => Task.FromResult(p));
    }

    [Fact]
    public async Task Handle_TitularNoExiste_LanzaNotFoundException()
    {
        _titularRepo.Setup(r => r.GetByIdAsync(99, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(
            new GenerarPagosMensualesAutomaticosCommand(99, 2020),
            CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Titular*99*");
    }

    [Fact]
    public async Task Handle_AnioAnteriorSinExistentes_GeneraPagosMarzoANoviembre()
    {
        var titular = CrearTitularConId(1);
        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual>());
        SetupAddAsync();

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GenerarPagosMensualesAutomaticosCommand(1, 2020),
            CancellationToken.None);

        result.Should().Be(Unit.Value);
        _pagoRepo.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Exactly(9));
    }

    [Fact]
    public async Task Handle_PagosExistentes_SkipeaDuplicados()
    {
        var titular = CrearTitularConId(1);
        var pagosExistentes = new List<PagoMensual>
        {
            new PagoMensual(1, 3, 2020, 10000m), // marzo ya existe
            new PagoMensual(1, 4, 2020, 10000m), // abril ya existe
        };

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagosExistentes);
        SetupAddAsync();

        var handler = CrearHandler();
        await handler.Handle(
            new GenerarPagosMensualesAutomaticosCommand(1, 2020),
            CancellationToken.None);

        // 9 meses (mar-nov) menos 2 existentes = 7 nuevos
        _pagoRepo.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Exactly(7));
    }

    [Fact]
    public async Task Handle_TodosLosPagosYaExisten_NoLlamaAdd()
    {
        var titular = CrearTitularConId(1);
        var pagosExistentes = Enumerable.Range(3, 9)
            .Select(m => new PagoMensual(1, m, 2020, 10000m))
            .ToList();

        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagosExistentes);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GenerarPagosMensualesAutomaticosCommand(1, 2020),
            CancellationToken.None);

        result.Should().Be(Unit.Value);
        _pagoRepo.Verify(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_PagosGenerados_UsaMontoMensualPactadoDelTitular()
    {
        var titular = CrearTitularConId(1, monto: 15000m);
        _titularRepo.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _pagoRepo.Setup(r => r.GetByTitularIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual>());

        var pagosCapturados = new List<PagoMensual>();
        _pagoRepo.Setup(r => r.AddAsync(It.IsAny<PagoMensual>(), It.IsAny<CancellationToken>()))
            .Callback<PagoMensual, CancellationToken>((p, _) => pagosCapturados.Add(p))
            .Returns<PagoMensual, CancellationToken>((p, _) => Task.FromResult(p));

        var handler = CrearHandler();
        await handler.Handle(
            new GenerarPagosMensualesAutomaticosCommand(1, 2020),
            CancellationToken.None);

        pagosCapturados.Should().AllSatisfy(p => p.MontoGenerado.Should().Be(15000m));
    }
}
