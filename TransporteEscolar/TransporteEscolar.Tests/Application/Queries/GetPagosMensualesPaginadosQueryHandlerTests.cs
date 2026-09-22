using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Queries;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetPagosMensualesPaginadosQueryHandlerTests
{
    private readonly Mock<IPagoMensualRepository> _repo = new();

    private GetPagosMensualesPaginadosQueryHandler CrearHandler() =>
        new(_repo.Object);

    private static PagoMensual CrearPagoConTitular(string apellido, string nombre = "", int mes = 6, int anio = 2025)
    {
        var pago = new PagoMensual(1, mes, anio, 10000m);

        // Asignamos el Titular via reflection para simular navegacion EF
        var titularType = typeof(Titular);
        var titularCtor = titularType.GetConstructor(
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance,
            null, Type.EmptyTypes, null)!;
        var titular = (Titular)titularCtor.Invoke(null);
        titularType.GetProperty("Id")!.SetValue(titular, 1);
        titularType.GetProperty("Apellido")!.SetValue(titular, apellido.ToUpperInvariant());
        titularType.GetProperty("NombreContacto")!.SetValue(titular, nombre);
        titularType.GetProperty("Direccion")!.SetValue(titular, "Dir");
        titularType.GetProperty("MontoMensualPactado")!.SetValue(titular, 10000m);
        titularType.GetProperty("FechaAlta")!.SetValue(titular, DateTime.UtcNow);
        titularType.GetProperty("Telefonos")!.SetValue(titular, new List<TitularTelefono>());

        var pagoType = typeof(PagoMensual);
        pagoType.GetProperty("Titular")!.SetValue(pago, titular);

        return pago;
    }

    private static PagoMensual CrearPagoVencido(string apellido)
    {
        // Mes claramente pasado, sin pagar -> EstaVencido() true.
        var fechaVieja = DateTime.UtcNow.AddMonths(-3);
        return CrearPagoConTitular(apellido, mes: fechaVieja.Month, anio: fechaVieja.Year);
    }

    private static PagoMensual CrearPagoPendiente(string apellido)
    {
        // Mes claramente futuro, sin pagar -> ni pagado ni vencido.
        var fechaFutura = DateTime.UtcNow.AddYears(5);
        return CrearPagoConTitular(apellido, mes: fechaFutura.Month, anio: fechaFutura.Year);
    }

    private static PagoMensual CrearPagoPagado(string apellido)
    {
        var pago = CrearPagoConTitular(apellido);
        pago.AplicarPago(10000m, DateTimeOffset.UtcNow, "Efectivo", null);
        return pago;
    }

    [Fact]
    public async Task Handle_SinFiltro_RetornaTodosLosPagosDelMes()
    {
        var pagos = new List<PagoMensual>
        {
            CrearPagoConTitular("Garcia"),
            CrearPagoConTitular("Lopez"),
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 20),
            CancellationToken.None);

        result.TotalCount.Should().Be(2);
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_ConFiltroSearch_RetornaSoloCoincidencias()
    {
        // "Garciamontez" contiene "garcia" como prefijo → 2 coincidencias, "Lopez" no
        var pagos = new List<PagoMensual>
        {
            CrearPagoConTitular("Garcia"),
            CrearPagoConTitular("Lopez"),
            CrearPagoConTitular("Garciamontez"),
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: "Garcia", PageNumber: 1, PageSize: 20),
            CancellationToken.None);

        result.TotalCount.Should().Be(2); // Garcia y Garciamontez
        result.Data.Should().HaveCount(2);
        result.Data.Should().AllSatisfy(p => p.TitularApellido.ToLower().Should().Contain("garcia"));
    }

    [Fact]
    public async Task Handle_SearchSinCoincidencias_RetornaListaVacia()
    {
        var pagos = new List<PagoMensual> { CrearPagoConTitular("Garcia") };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: "Inexistente", PageNumber: 1, PageSize: 20),
            CancellationToken.None);

        result.TotalCount.Should().Be(0);
        result.Data.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_PaginacionPageSize2_RetornaPrimerasPagina()
    {
        var pagos = Enumerable.Range(1, 5)
            .Select(i => CrearPagoConTitular($"Titular{i:D2}"))
            .ToList();

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 2),
            CancellationToken.None);

        result.TotalCount.Should().Be(5);
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_PaginacionSegundaPagina_RetornaElementosCorrectos()
    {
        var pagos = Enumerable.Range(1, 5)
            .Select(i => CrearPagoConTitular($"Titular{i:D2}"))
            .ToList();

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 2, PageSize: 2),
            CancellationToken.None);

        result.TotalCount.Should().Be(5);
        result.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_SearchInsensibleAMayusculas_EncuentraCoincidencias()
    {
        var pagos = new List<PagoMensual> { CrearPagoConTitular("GONZALEZ") };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: "gonzalez", PageNumber: 1, PageSize: 20),
            CancellationToken.None);

        result.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task Handle_EstadoVencido_EscenarioReal_TraeLosVencidosAunqueQuedenFueraDeLaPagina1SinFiltrar()
    {
        // Escenario real reportado: 40 pagos del mes, sólo 3 vencidos, ubicados de modo que
        // caigan en la posición 38-40 (fuera de la página 1 de 20 si el filtro se aplicara
        // después de paginar, que es justamente el bug que se corrige).
        var pagos = new List<PagoMensual>();
        for (var i = 0; i < 37; i++)
        {
            pagos.Add(CrearPagoPagado($"Pagado{i:D2}"));
        }
        for (var i = 0; i < 3; i++)
        {
            pagos.Add(CrearPagoVencido($"Vencido{i:D2}"));
        }

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 20, Estado: "vencido"),
            CancellationToken.None);

        result.TotalCount.Should().Be(3);
        result.Data.Should().HaveCount(3);
        result.Data.Should().AllSatisfy(p => p.EstaVencido.Should().BeTrue());
    }

    [Fact]
    public async Task Handle_EstadoPagado_RetornaSoloPagados()
    {
        var pagos = new List<PagoMensual>
        {
            CrearPagoPagado("Pagado"),
            CrearPagoVencido("Vencido"),
            CrearPagoPendiente("Pendiente"),
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 20, Estado: "pagado"),
            CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Data.Should().ContainSingle();
        result.Data.Should().AllSatisfy(p => p.EstaPagado.Should().BeTrue());
    }

    [Fact]
    public async Task Handle_EstadoPendiente_RetornaSoloNoPagadosNiVencidos()
    {
        var pagos = new List<PagoMensual>
        {
            CrearPagoPagado("Pagado"),
            CrearPagoVencido("Vencido"),
            CrearPagoPendiente("Pendiente"),
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 20, Estado: "pendiente"),
            CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Data.Should().ContainSingle();
        result.Data.Should().AllSatisfy(p => p.EstaPagado.Should().BeFalse());
        result.Data.Should().AllSatisfy(p => p.EstaVencido.Should().BeFalse());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("cualquiera")]
    public async Task Handle_EstadoNuloOInvalido_NoFiltra(string? estado)
    {
        var pagos = new List<PagoMensual>
        {
            CrearPagoPagado("Pagado"),
            CrearPagoVencido("Vencido"),
            CrearPagoPendiente("Pendiente"),
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: null, PageNumber: 1, PageSize: 20, Estado: estado),
            CancellationToken.None);

        result.TotalCount.Should().Be(3);
        result.Data.Should().HaveCount(3);
    }

    [Fact]
    public async Task Handle_SearchYEstadoCombinados_AplicaAmbosFiltros()
    {
        var pagos = new List<PagoMensual>
        {
            CrearPagoVencido("Garcia"),   // coincide search + estado
            CrearPagoPagado("Garcia"),    // coincide search, no estado
            CrearPagoVencido("Lopez"),    // coincide estado, no search
        };

        _repo.Setup(r => r.GetByMesAnioAsync(6, 2025, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagos);

        var handler = CrearHandler();
        var result = await handler.Handle(
            new GetPagosMensualesPaginadosQuery(Mes: 6, Anio: 2025, Search: "Garcia", PageNumber: 1, PageSize: 20, Estado: "vencido"),
            CancellationToken.None);

        result.TotalCount.Should().Be(1);
        result.Data.Should().ContainSingle();
        result.Data[0].TitularApellido.Should().Be("GARCIA");
        result.Data[0].EstaVencido.Should().BeTrue();
    }
}
