using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Bot.Queries;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetTitularesParaPagosBotQueryHandlerTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();

    private GetTitularesParaPagosBotQueryHandler CrearHandler() =>
        new(_titulares.Object, _pasajeros.Object);

    private static Titular CrearTitular(int id, string apellido, string contacto, bool deBaja = false)
    {
        var titular = new Titular(apellido, contacto, "Calle 123", 15000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        if (deBaja)
            titular.DarDeBaja();
        return titular;
    }

    private void ConfigurarTitulares(params Titular[] titulares)
    {
        _titulares
            .Setup(r => r.GetActivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(titulares.ToList());
    }

    private void ConfigurarPasajeros(params PasajeroActivoBasico[] pasajeros)
    {
        _pasajeros
            .Setup(r => r.GetNombresActivosPorTitularesAsync(
                It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(pasajeros.ToList());
    }

    [Fact]
    public async Task Handle_VariosTitulares_OrdenaPorApellidoYNombreDeContacto()
    {
        ConfigurarTitulares(
            CrearTitular(2, "Zapata", "Laura"),
            CrearTitular(1, "Perez", "Maria"),
            CrearTitular(3, "Perez", "Ana"));
        ConfigurarPasajeros();

        var resultado = await CrearHandler().Handle(new GetTitularesParaPagosBotQuery(), CancellationToken.None);

        resultado.Select(t => t.TitularId).Should().Equal(3, 1, 2);
        resultado[0].Apellido.Should().Be("PEREZ");
        resultado[0].NombreContacto.Should().Be("Ana");
    }

    [Fact]
    public async Task Handle_PasajerosDelTitular_SeDevuelvenOrdenadosPorNombre()
    {
        ConfigurarTitulares(CrearTitular(1, "Perez", "Maria"));
        ConfigurarPasajeros(
            new PasajeroActivoBasico(101, 1, "Sofia"),
            new PasajeroActivoBasico(102, 1, "Juan"));

        var resultado = await CrearHandler().Handle(new GetTitularesParaPagosBotQuery(), CancellationToken.None);

        resultado.Should().ContainSingle();
        resultado[0].Pasajeros.Should().Equal("Juan", "Sofia");
    }

    [Fact]
    public async Task Handle_TitularDeBaja_NoAparece()
    {
        ConfigurarTitulares(
            CrearTitular(1, "Perez", "Maria"),
            CrearTitular(2, "Zapata", "Laura", deBaja: true));
        ConfigurarPasajeros(new PasajeroActivoBasico(201, 2, "Pedro"));

        var resultado = await CrearHandler().Handle(new GetTitularesParaPagosBotQuery(), CancellationToken.None);

        resultado.Select(t => t.TitularId).Should().Equal(1);
    }

    [Fact]
    public async Task Handle_TitularSinPasajeros_DevuelveListaVacioDePasajeros()
    {
        ConfigurarTitulares(CrearTitular(1, "Perez", "Maria"));
        ConfigurarPasajeros();

        var resultado = await CrearHandler().Handle(new GetTitularesParaPagosBotQuery(), CancellationToken.None);

        resultado.Should().ContainSingle().Which.Pasajeros.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_SinTitulares_DevuelveListaVaciaSinConsultarPasajeros()
    {
        ConfigurarTitulares();

        var resultado = await CrearHandler().Handle(new GetTitularesParaPagosBotQuery(), CancellationToken.None);

        resultado.Should().BeEmpty();
        _pasajeros.Verify(r => r.GetNombresActivosPorTitularesAsync(
            It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
