using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Bot.Queries;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetCuotasPendientesBotQueryHandlerTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPagoMensualRepository> _pagos = new();

    private GetCuotasPendientesBotQueryHandler CrearHandler() =>
        new(_titulares.Object, _pagos.Object);

    private static Titular CrearTitular(int id, bool deBaja = false)
    {
        var titular = new Titular("Perez", "Ana", "Calle 1", 120000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        if (deBaja)
            titular.DarDeBaja();
        return titular;
    }

    private static PagoMensual CrearCuota(int titularId, int anio, int mes, decimal monto, decimal pagado = 0m)
    {
        var cuota = new PagoMensual(titularId, mes, anio, monto);
        if (pagado > 0)
            cuota.AplicarPago(pagado, DateTimeOffset.UtcNow, "Efectivo", null);
        return cuota;
    }

    private void ConfigurarTitular(Titular? titular)
    {
        _titulares
            .Setup(r => r.GetByIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(titular);
    }

    private void ConfigurarCuotas(params PagoMensual[] cuotas)
    {
        _pagos
            .Setup(r => r.GetByTitularIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(cuotas.ToList());
    }

    [Fact]
    public async Task Handle_DevuelveSoloCuotasConSaldoPendiente()
    {
        ConfigurarTitular(CrearTitular(1));
        ConfigurarCuotas(
            CrearCuota(1, 2026, 8, 120000m, pagado: 120000m),
            CrearCuota(1, 2026, 9, 120000m));

        var resultado = await CrearHandler().Handle(new GetCuotasPendientesBotQuery(1), CancellationToken.None);

        resultado.Cuotas.Should().ContainSingle()
            .Which.Should().BeEquivalentTo(new { Anio = 2026, Mes = 9, MontoGenerado = 120000m, SaldoPendiente = 120000m });
    }

    [Fact]
    public async Task Handle_CuotasDescendentesDelRepositorio_SeDevuelvenAscendentes()
    {
        ConfigurarTitular(CrearTitular(1));
        ConfigurarCuotas(
            CrearCuota(1, 2026, 10, 120000m),
            CrearCuota(1, 2026, 9, 120000m),
            CrearCuota(1, 2025, 12, 100000m));

        var resultado = await CrearHandler().Handle(new GetCuotasPendientesBotQuery(1), CancellationToken.None);

        resultado.Cuotas.Select(c => (c.Anio, c.Mes)).Should().Equal((2025, 12), (2026, 9), (2026, 10));
    }

    [Fact]
    public async Task Handle_IncluyeTitularIdApellidoYSaldoParcial()
    {
        ConfigurarTitular(CrearTitular(1));
        ConfigurarCuotas(CrearCuota(1, 2026, 9, 120000m, pagado: 20000m));

        var resultado = await CrearHandler().Handle(new GetCuotasPendientesBotQuery(1), CancellationToken.None);

        resultado.TitularId.Should().Be(1);
        resultado.Apellido.Should().Be("PEREZ");
        resultado.Cuotas.Should().ContainSingle().Which.SaldoPendiente.Should().Be(100000m);
    }

    [Fact]
    public async Task Handle_SinCuotasPendientes_DevuelveListaVacia()
    {
        ConfigurarTitular(CrearTitular(1));
        ConfigurarCuotas(CrearCuota(1, 2026, 9, 120000m, pagado: 120000m));

        var resultado = await CrearHandler().Handle(new GetCuotasPendientesBotQuery(1), CancellationToken.None);

        resultado.Cuotas.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_TitularInexistente_LanzaNotFoundException()
    {
        ConfigurarTitular(null);

        var accion = () => CrearHandler().Handle(new GetCuotasPendientesBotQuery(99), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _pagos.Verify(r => r.GetByTitularIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_TitularDeBaja_LanzaNotFoundException()
    {
        ConfigurarTitular(CrearTitular(1, deBaja: true));

        var accion = () => CrearHandler().Handle(new GetCuotasPendientesBotQuery(1), CancellationToken.None);

        await accion.Should().ThrowAsync<NotFoundException>();
        _pagos.Verify(r => r.GetByTitularIdAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
