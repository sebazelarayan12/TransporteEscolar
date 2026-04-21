using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Queries;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetEstadisticasPagosMesQueryHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _repo = new();

    private GetEstadisticasPagosMesQueryHandler CrearHandler() =>
        new(_repo.Object);

    [Fact]
    public async Task Handle_SinPagos_RetornaEstadisticasEnCero()
    {
        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual>());

        var handler = CrearHandler();
        var result = await handler.Handle(new GetEstadisticasPagosMesQuery(6, 2025), CancellationToken.None);

        result.TotalPagos.Should().Be(0);
        result.CantidadPagados.Should().Be(0);
        result.CantidadPendientes.Should().Be(0);
        result.CantidadVencidos.Should().Be(0);
        result.TotalRecaudado.Should().Be(0m);
        result.TotalPendiente.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_ConPagos_CalculaEstadisticasCorrectamente()
    {
        // Pagado: 1 pago completo
        var pagoPagado = new PagoMensual(1, 6, 2025, 5000m);
        pagoPagado.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);

        // Vencido: mes pasado, sin pagar
        var pagoVencido = new PagoMensual(2, 1, 2020, 3000m);

        // Pendiente: mes futuro, sin pagar
        var futuro = DateTime.UtcNow.AddYears(5);
        var pagoPendiente = new PagoMensual(3, futuro.Month, futuro.Year, 4000m);

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { pagoPagado, pagoVencido, pagoPendiente });

        var handler = CrearHandler();
        var result = await handler.Handle(new GetEstadisticasPagosMesQuery(6, 2025), CancellationToken.None);

        result.TotalPagos.Should().Be(3);
        result.CantidadPagados.Should().Be(1);
        result.CantidadVencidos.Should().Be(1);
        result.CantidadPendientes.Should().Be(1);
        result.TotalRecaudado.Should().Be(5000m);
        result.TotalPendiente.Should().Be(7000m); // 3000 + 4000
    }

    [Fact]
    public async Task Handle_TodosPagados_CantidadVencidosYPendientesEnCero()
    {
        var pago1 = new PagoMensual(1, 6, 2025, 5000m);
        pago1.AplicarPago(5000m, DateTimeOffset.UtcNow, "Efectivo", null);
        var pago2 = new PagoMensual(2, 6, 2025, 8000m);
        pago2.AplicarPago(8000m, DateTimeOffset.UtcNow, "Transferencia", null);

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<PagoMensual> { pago1, pago2 });

        var handler = CrearHandler();
        var result = await handler.Handle(new GetEstadisticasPagosMesQuery(6, 2025), CancellationToken.None);

        result.CantidadPagados.Should().Be(2);
        result.CantidadVencidos.Should().Be(0);
        result.CantidadPendientes.Should().Be(0);
        result.TotalPendiente.Should().Be(0m);
    }
}
