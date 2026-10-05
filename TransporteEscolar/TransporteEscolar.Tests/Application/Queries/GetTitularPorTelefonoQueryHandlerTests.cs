using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TransporteEscolar.Application.Bot.Queries;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetTitularPorTelefonoQueryHandlerTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();

    private GetTitularPorTelefonoQueryHandler CrearHandler() =>
        new(_titulares.Object, _pasajeros.Object, NullLogger<GetTitularPorTelefonoQueryHandler>.Instance);

    private static Titular CrearTitular(int id, string apellido, string contacto, bool deBaja = false)
    {
        var titular = new Titular(apellido, contacto, "Calle 123", 15000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        if (deBaja)
            titular.DarDeBaja();
        return titular;
    }

    private void ConfigurarTelefonos(params TelefonoActivo[] telefonos)
    {
        _titulares
            .Setup(r => r.GetTelefonosActivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(telefonos.ToList());
    }

    private void ConfigurarTitulares(params Titular[] titulares)
    {
        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
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
    public async Task Handle_NumeroEnDosTitulares_DevuelveDosCoincidencias()
    {
        ConfigurarTelefonos(
            new TelefonoActivo(1, "+54 381 412-3456"),
            new TelefonoActivo(2, "543814123456"),
            new TelefonoActivo(3, "+54 381 999-0000"));
        ConfigurarTitulares(
            CrearTitular(2, "Zapata", "Laura"),
            CrearTitular(1, "Perez", "Maria"));
        ConfigurarPasajeros(
            new PasajeroActivoBasico(101, 1, "Sofia"),
            new PasajeroActivoBasico(102, 1, "Juan"),
            new PasajeroActivoBasico(201, 2, "Pedro"));

        var resultado = await CrearHandler().Handle(
            new GetTitularPorTelefonoQuery("5493814123456"), CancellationToken.None);

        resultado.Coincidencias.Should().HaveCount(2);
        // Orden determinístico: por apellido.
        resultado.Coincidencias.Select(c => c.TitularId).Should().Equal(1, 2);
        resultado.Coincidencias[0].Apellido.Should().Be("PEREZ");
        resultado.Coincidencias[0].NombreContacto.Should().Be("Maria");
        // Pasajeros ordenados por nombre.
        resultado.Coincidencias[0].Pasajeros.Select(p => p.Nombre).Should().Equal("Juan", "Sofia");
        resultado.Coincidencias[0].Pasajeros.Select(p => p.Id).Should().Equal(102, 101);
        resultado.Coincidencias[1].Pasajeros.Should().ContainSingle().Which.Nombre.Should().Be("Pedro");
    }

    [Fact]
    public async Task Handle_SinCoincidencia_DevuelveListaVacia()
    {
        ConfigurarTelefonos(new TelefonoActivo(1, "+54 381 412-3456"));

        var resultado = await CrearHandler().Handle(
            new GetTitularPorTelefonoQuery("5493815550000"), CancellationToken.None);

        resultado.Coincidencias.Should().BeEmpty();
        _titulares.Verify(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()), Times.Never);
        _pasajeros.Verify(r => r.GetNombresActivosPorTitularesAsync(
            It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("abc")]
    [InlineData("+-() ")]
    public async Task Handle_NumeroSinDigitos_LanzaValidationException(string? numero)
    {
        var accion = () => CrearHandler().Handle(new GetTitularPorTelefonoQuery(numero), CancellationToken.None);

        await accion.Should().ThrowAsync<ValidationException>();
        VerificarQueNoSeConsultoNada();
    }

    [Theory]
    [InlineData("123456789012345")]
    [InlineData("12345")]
    [InlineData("5438161234567")]
    public async Task Handle_NumeroConDigitosPeroNoNormalizable_DevuelveVacioSinConsultar(string numero)
    {
        var resultado = await CrearHandler().Handle(new GetTitularPorTelefonoQuery(numero), CancellationToken.None);

        resultado.Coincidencias.Should().BeEmpty();
        VerificarQueNoSeConsultoNada();
    }

    [Fact]
    public async Task Handle_BotMandaConNueveYBaseGuardaSinNueve_Matchea()
    {
        // Formato real de la base: +54 + área + abonado, sin el 9 móvil.
        ConfigurarTelefonos(new TelefonoActivo(7, "+543814123456"));
        ConfigurarTitulares(CrearTitular(7, "Gomez", "Ana"));
        ConfigurarPasajeros(new PasajeroActivoBasico(70, 7, "Lucia"));

        var resultado = await CrearHandler().Handle(
            new GetTitularPorTelefonoQuery("5493814123456"), CancellationToken.None);

        resultado.Coincidencias.Should().ContainSingle().Which.TitularId.Should().Be(7);
    }

    [Fact]
    public async Task Handle_TitularConDosTelefonosQueCoinciden_NoApareceDuplicado()
    {
        ConfigurarTelefonos(
            new TelefonoActivo(5, "+543814123456"),
            new TelefonoActivo(5, "+5493814123456"));
        ConfigurarTitulares(CrearTitular(5, "Rios", "Carlos"));
        ConfigurarPasajeros();

        var resultado = await CrearHandler().Handle(
            new GetTitularPorTelefonoQuery("5493814123456"), CancellationToken.None);

        resultado.Coincidencias.Should().ContainSingle();
        resultado.Coincidencias[0].Pasajeros.Should().BeEmpty();
        _titulares.Verify(r => r.GetByIdsAsync(
            It.Is<List<int>>(ids => ids.Count == 1 && ids[0] == 5),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_TitularDadoDeBajaQueDevuelveElRepositorio_SeDescarta()
    {
        ConfigurarTelefonos(new TelefonoActivo(9, "+543814123456"));
        ConfigurarTitulares(CrearTitular(9, "Baja", "Nadie", deBaja: true));

        var resultado = await CrearHandler().Handle(
            new GetTitularPorTelefonoQuery("5493814123456"), CancellationToken.None);

        resultado.Coincidencias.Should().BeEmpty();
    }

    [Fact]
    public void FormaDeLaRespuesta_NoExponeCamposProhibidos()
    {
        PropiedadesDe(typeof(BotModel.Response)).Should().BeEquivalentTo(new[] { "Coincidencias" });

        PropiedadesDe(typeof(BotModel.Coincidencia)).Should().BeEquivalentTo(
            new[] { "TitularId", "Apellido", "NombreContacto", "Pasajeros" });

        PropiedadesDe(typeof(BotModel.PasajeroBasico)).Should().BeEquivalentTo(new[] { "Id", "Nombre" });
    }

    private static string[] PropiedadesDe(Type tipo) =>
        tipo.GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.Name != "EqualityContract")
            .Select(p => p.Name)
            .ToArray();

    private void VerificarQueNoSeConsultoNada()
    {
        _titulares.Verify(r => r.GetTelefonosActivosAsync(It.IsAny<CancellationToken>()), Times.Never);
        _titulares.Verify(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()), Times.Never);
        _pasajeros.Verify(r => r.GetNombresActivosPorTitularesAsync(
            It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
