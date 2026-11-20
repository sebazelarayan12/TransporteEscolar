using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Diciembre.DTOs;
using TransporteEscolar.Application.Diciembre.Queries;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;

namespace TransporteEscolar.Tests.Application.Diciembre;

public class GetDiciembreQueryHandlerTests
{
    private const int Anio = 2026;

    private readonly Mock<IConfirmacionDiciembreRepository> _repo = new();

    private GetDiciembreQueryHandler CrearHandler() => new(_repo.Object);

    private static DiciembreTitularDatos Fila(int titularId, bool? va, DiciembreCuotaDatos? cuota = null) =>
        new(titularId, "PEREZ", $"Contacto {titularId}", 120000m, new[] { "Juan", "Sofi" }, va, cuota);

    [Fact]
    public async Task Handle_MapeaLosTresEstadosCorrectamente()
    {
        _repo.Setup(r => r.GetListadoAsync(Anio, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos>
            {
                Fila(1, null),
                Fila(2, true, new DiciembreCuotaDatos(10, 60000m, 20000m)),
                Fila(3, false)
            });

        var handler = CrearHandler();
        var resultado = await handler.Handle(new GetDiciembreQuery(Anio), CancellationToken.None);

        resultado.Anio.Should().Be(Anio);
        resultado.Titulares.Select(t => t.Estado).Should().Equal(
            DiciembreEstados.Pendiente,
            DiciembreEstados.Va,
            DiciembreEstados.NoVa);
    }

    [Fact]
    public async Task Handle_CuotaSinConfirmacion_SeMarcaComoPreexistente()
    {
        _repo.Setup(r => r.GetListadoAsync(Anio, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos>
            {
                Fila(1, null, new DiciembreCuotaDatos(10, 50000m, 0m))
            });

        var handler = CrearHandler();
        var resultado = await handler.Handle(new GetDiciembreQuery(Anio), CancellationToken.None);

        var item = resultado.Titulares.Single();
        item.Estado.Should().Be(DiciembreEstados.Pendiente);
        item.CuotaPreexistente.Should().BeTrue();
        item.MontoDiciembre.Should().Be(50000m);
        item.PagoMensualId.Should().Be(10);
    }

    [Fact]
    public async Task Handle_CuotaConfirmada_NoEsPreexistente()
    {
        _repo.Setup(r => r.GetListadoAsync(Anio, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos>
            {
                Fila(1, true, new DiciembreCuotaDatos(10, 60000m, 25000m))
            });

        var handler = CrearHandler();
        var resultado = await handler.Handle(new GetDiciembreQuery(Anio), CancellationToken.None);

        var item = resultado.Titulares.Single();
        item.Estado.Should().Be(DiciembreEstados.Va);
        item.CuotaPreexistente.Should().BeFalse();
        item.MontoDiciembre.Should().Be(60000m);
        item.TotalPagado.Should().Be(25000m);
        item.Pasajeros.Should().Equal("Juan", "Sofi");
        item.MontoPactado.Should().Be(120000m);
    }

    [Fact]
    public async Task Handle_SinCuota_DejaMontoYPagoEnNuloYTotalEnCero()
    {
        _repo.Setup(r => r.GetListadoAsync(Anio, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos> { Fila(1, false) });

        var handler = CrearHandler();
        var resultado = await handler.Handle(new GetDiciembreQuery(Anio), CancellationToken.None);

        var item = resultado.Titulares.Single();
        item.Estado.Should().Be(DiciembreEstados.NoVa);
        item.MontoDiciembre.Should().BeNull();
        item.PagoMensualId.Should().BeNull();
        item.TotalPagado.Should().Be(0m);
        item.CuotaPreexistente.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_SinAnio_UsaElAnioEnCurso()
    {
        var anioActual = DateTime.UtcNow.Year;
        _repo.Setup(r => r.GetListadoAsync(anioActual, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DiciembreTitularDatos>());

        var handler = CrearHandler();
        var resultado = await handler.Handle(new GetDiciembreQuery(null), CancellationToken.None);

        resultado.Anio.Should().Be(anioActual);
        resultado.Titulares.Should().BeEmpty();
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(2101)]
    public async Task Handle_AnioFueraDeRango_LanzaValidationException(int anio)
    {
        var handler = CrearHandler();
        var act = async () => await handler.Handle(new GetDiciembreQuery(anio), CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }
}
