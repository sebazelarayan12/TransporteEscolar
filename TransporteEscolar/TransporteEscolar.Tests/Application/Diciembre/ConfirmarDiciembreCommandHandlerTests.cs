using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Diciembre.Commands;
using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Diciembre;

public class ConfirmarDiciembreCommandHandlerTests
{
    private const int TitularId = 1;
    private const int Anio = 2026;

    private readonly Mock<ITitularRepository> _titularRepo = new();
    private readonly Mock<IConfirmacionDiciembreRepository> _repo = new();

    private ConfirmarDiciembreCommandHandler CrearHandler() =>
        new(_titularRepo.Object, _repo.Object);

    private static Titular CrearTitularActivo() => new("Garcia", "Juan", "Dir 1", 120000m);

    private void ConfigurarTitularElegible(Titular titular)
    {
        _titularRepo.Setup(r => r.GetByIdAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
        _repo.Setup(r => r.TienePasajerosActivosAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
    }

    private void ConfigurarListado(bool? va, DiciembreCuotaDatos? cuota)
    {
        _repo.Setup(r => r.GetListadoAsync(Anio, TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos>
            {
                new(TitularId, "GARCIA", "Juan", 120000m, new[] { "Pedro" }, va, cuota)
            });
    }

    private static ConfirmarDiciembreCommand Comando(bool va, decimal? monto) =>
        new(TitularId, Anio, va, monto);

    [Fact]
    public async Task Handle_Va_SinCuotaPrevia_CreaCuotaConMontoYConfirmacion()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PagoMensual?)null);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConfirmacionDiciembre?)null);
        ConfigurarListado(true, new DiciembreCuotaDatos(0, 60000m, 0m));

        var handler = CrearHandler();
        await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        _repo.Verify(r => r.AgregarCuota(It.Is<PagoMensual>(p =>
            p.Mes == 12 && p.Anio == Anio && p.MontoGenerado == 60000m)), Times.Once);
        _repo.Verify(r => r.AgregarConfirmacion(It.Is<ConfirmacionDiciembre>(c =>
            c.Va && c.Monto == 60000m)), Times.Once);
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_Va_AdoptaCuotaPreexistenteYActualizaSuMonto()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        var cuotaManual = new PagoMensual(TitularId, 12, Anio, 50000m, "Cuota manual");
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuotaManual);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConfirmacionDiciembre?)null);
        ConfigurarListado(true, new DiciembreCuotaDatos(0, 60000m, 0m));

        var handler = CrearHandler();
        await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        cuotaManual.MontoGenerado.Should().Be(60000m);
        _repo.Verify(r => r.AgregarCuota(It.IsAny<PagoMensual>()), Times.Never);
        _repo.Verify(r => r.AgregarConfirmacion(It.Is<ConfirmacionDiciembre>(c =>
            c.Va && c.Monto == 60000m)), Times.Once);
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_Va_MontoMenorAlTotalPagado_RechazaSinGuardar()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        var cuota = new PagoMensual(TitularId, 12, Anio, 60000m);
        cuota.AplicarPago(40000m, DateTimeOffset.UtcNow, "Efectivo", null);
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuota);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConfirmacionDiciembre?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, 30000m), CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleException>();
        cuota.MontoGenerado.Should().Be(60000m);
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_NoVa_SinPagos_EliminaLaCuotaYRegistraLaDecision()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        var cuota = new PagoMensual(TitularId, 12, Anio, 60000m);
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuota);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConfirmacionDiciembre?)null);
        ConfigurarListado(false, null);

        var handler = CrearHandler();
        await handler.Handle(Comando(false, null), CancellationToken.None);

        _repo.Verify(r => r.EliminarCuota(cuota), Times.Once);
        _repo.Verify(r => r.AgregarConfirmacion(It.Is<ConfirmacionDiciembre>(c =>
            !c.Va && c.Monto == null)), Times.Once);
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_NoVa_ConPagosRegistrados_LanzaBusinessRuleSinTocarLaCuota()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        var cuota = new PagoMensual(TitularId, 12, Anio, 60000m);
        cuota.AplicarPago(20000m, DateTimeOffset.UtcNow, "Efectivo", null);
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuota);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConfirmacionDiciembre?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(false, null), CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleException>()
            .WithMessage("*ya tiene pagos registrados*");
        _repo.Verify(r => r.EliminarCuota(It.IsAny<PagoMensual>()), Times.Never);
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_RepetirElMismoVa_EsIdempotenteSinDuplicarNada()
    {
        ConfigurarTitularElegible(CrearTitularActivo());
        var cuota = new PagoMensual(TitularId, 12, Anio, 60000m);
        var confirmacion = new ConfirmacionDiciembre(TitularId, Anio, true, 60000m, cuota, DateTime.UtcNow);
        _repo.Setup(r => r.GetCuotaDiciembreAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuota);
        _repo.Setup(r => r.GetConfirmacionAsync(TitularId, Anio, It.IsAny<CancellationToken>()))
            .ReturnsAsync(confirmacion);
        ConfigurarListado(true, new DiciembreCuotaDatos(0, 60000m, 0m));

        var handler = CrearHandler();
        await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        cuota.MontoGenerado.Should().Be(60000m);
        _repo.Verify(r => r.AgregarCuota(It.IsAny<PagoMensual>()), Times.Never);
        _repo.Verify(r => r.AgregarConfirmacion(It.IsAny<ConfirmacionDiciembre>()), Times.Never);
        _repo.Verify(r => r.EliminarCuota(It.IsAny<PagoMensual>()), Times.Never);
        confirmacion.Va.Should().BeTrue();
        confirmacion.Monto.Should().Be(60000m);
    }

    [Fact]
    public async Task Handle_TitularInexistente_LanzaNotFound()
    {
        _titularRepo.Setup(r => r.GetByIdAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Titular?)null);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_TitularDadoDeBaja_LanzaBusinessRule()
    {
        var titular = CrearTitularActivo();
        titular.DarDeBaja();
        _titularRepo.Setup(r => r.GetByIdAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleException>();
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_TitularSinPasajerosActivos_LanzaBusinessRule()
    {
        _titularRepo.Setup(r => r.GetByIdAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearTitularActivo());
        _repo.Setup(r => r.TienePasajerosActivosAsync(TitularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, 60000m), CancellationToken.None);

        await act.Should().ThrowAsync<BusinessRuleException>();
        _repo.Verify(r => r.GuardarCambiosAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(2101)]
    public async Task Handle_AnioFueraDeRango_LanzaValidationException(int anio)
    {
        var handler = CrearHandler();
        var act = async () => await handler.Handle(new ConfirmarDiciembreCommand(TitularId, anio, false, null), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_VaSinMonto_LanzaValidationException()
    {
        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, null), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(10000001)]
    public async Task Handle_VaConMontoFueraDeRango_LanzaValidationException(decimal monto)
    {
        var handler = CrearHandler();
        var act = async () => await handler.Handle(Comando(true, monto), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }
}
