using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Services;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Tests.Application.Services;

public class RecorridoServiceTests
{
    private readonly Mock<ITitularUbicacionRepository> _ubicaciones = new();
    private readonly Mock<IColegioRepository> _colegios = new();
    private readonly Mock<IRecorridoRepository> _recorridos = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IRutaProvider> _rutaProvider = new();

    private static readonly Colegio SanPatricio = CrearColegio(1, "San Patricio", -26.8158608, -65.2742406);

    private RecorridoService CrearServicio()
    {
        var options = Options.Create(new RuteoOptions
        {
            BaseUrl = "https://osrm.test",
            PausaEntreConsultasMs = 0
        });

        return new RecorridoService(
            _ubicaciones.Object,
            _colegios.Object,
            _recorridos.Object,
            _pasajeros.Object,
            _titulares.Object,
            _rutaProvider.Object,
            options,
            NullLogger<RecorridoService>.Instance);
    }

    /// <summary>Crea un colegio con el Id seteado, que normalmente asigna EF.</summary>
    private static Colegio CrearColegio(int id, string nombre, double latitud, double longitud)
    {
        var colegio = new Colegio(nombre, "Dirección", latitud, longitud);
        typeof(Colegio).GetProperty(nameof(Colegio.Id))!.SetValue(colegio, id);
        return colegio;
    }

    private void ConfigurarTitularConUbicacion(int titularId)
    {
        _ubicaciones
            .Setup(r => r.GetByTitularIdAsync(titularId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TitularUbicacion(titularId, -26.8225289, -65.2860859, null, FuenteUbicacion.Manual));
    }

    [Fact]
    public async Task RecalcularPorTitularAsync_SinUbicacion_LanzaValidationException()
    {
        _ubicaciones
            .Setup(r => r.GetByTitularIdAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TitularUbicacion?)null);

        var servicio = CrearServicio();

        var accion = async () => await servicio.RecalcularPorTitularAsync(9);

        await accion.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task RecalcularPorTitularAsync_ConDosHermanosEnElMismoColegio_ConsultaElMotorUnaSolaVez()
    {
        // Dos hermanos, mismo colegio, horarios distintos (8 y 9).
        // Son 2 viajes, pero UN solo recorrido: misma casa, mismo colegio.
        ConfigurarTitularConUbicacion(3);

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>
            {
                new(3, 1, 1),
                new(3, 1, 4)
            });

        _colegios
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SanPatricio);

        _recorridos
            .Setup(r => r.GetByTitularYColegioAsync(3, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Recorrido?)null);

        _rutaProvider
            .Setup(p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(3061, 336, "abc"));

        var servicio = CrearServicio();

        var resultado = await servicio.RecalcularPorTitularAsync(3);

        resultado.Calculados.Should().Be(1);
        _rutaProvider.Verify(
            p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RecalcularPorTitularAsync_SiElRecorridoSigueVigente_NoConsultaElMotor()
    {
        ConfigurarTitularConUbicacion(3);

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(3, 1, 1) });

        _colegios
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SanPatricio);

        var hashVigente = RecorridoHash.Calcular(
            new Coordenada(-26.8225289, -65.2860859),
            SanPatricio.ObtenerCoordenada());

        _recorridos
            .Setup(r => r.GetByTitularYColegioAsync(3, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Recorrido(3, 1, 3061, 336, "abc", "osrm", hashVigente));

        var servicio = CrearServicio();

        var resultado = await servicio.RecalcularPorTitularAsync(3);

        resultado.Omitidos.Should().Be(1);
        resultado.Calculados.Should().Be(0);
        _rutaProvider.Verify(
            p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecalcularPorTitularAsync_SiElMotorNoDevuelveRuta_CuentaComoFallidoYNoGuarda()
    {
        ConfigurarTitularConUbicacion(3);

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(3, 1, 1) });

        _colegios
            .Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SanPatricio);

        _recorridos
            .Setup(r => r.GetByTitularYColegioAsync(3, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Recorrido?)null);

        _rutaProvider
            .Setup(p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RutaCalculada?)null);

        var servicio = CrearServicio();

        var resultado = await servicio.RecalcularPorTitularAsync(3);

        resultado.Fallidos.Should().Be(1);
        _recorridos.Verify(
            r => r.UpsertAsync(It.IsAny<Recorrido>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecalcularPorTitularAsync_ConHermanosEnColegiosDistintos_CalculaDosRecorridos()
    {
        var boisdron = CrearColegio(2, "Boisdron", -26.8225289, -65.2860859);
        ConfigurarTitularConUbicacion(3);

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>
            {
                new(3, 1, 1),
                new(3, 2, 2)
            });

        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(SanPatricio);
        _colegios.Setup(r => r.GetByIdAsync(2, It.IsAny<CancellationToken>())).ReturnsAsync(boisdron);

        _recorridos
            .Setup(r => r.GetByTitularYColegioAsync(3, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Recorrido?)null);

        _rutaProvider
            .Setup(p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(3061, 336, "abc"));

        var servicio = CrearServicio();

        var resultado = await servicio.RecalcularPorTitularAsync(3);

        resultado.Calculados.Should().Be(2);
    }

    [Fact]
    public async Task RecalcularTodosAsync_InformaLosTitularesSinUbicacionSinInterrumpir()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>
            {
                new(3, 1, 1),
                new(8, 1, 1)
            });

        ConfigurarTitularConUbicacion(3);
        _ubicaciones
            .Setup(r => r.GetByTitularIdAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TitularUbicacion?)null);

        _colegios.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(SanPatricio);
        _recorridos
            .Setup(r => r.GetByTitularYColegioAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Recorrido?)null);
        _rutaProvider
            .Setup(p => p.CalcularRutaAsync(It.IsAny<Coordenada>(), It.IsAny<Coordenada>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(3061, 336, "abc"));

        var servicio = CrearServicio();

        var resultado = await servicio.RecalcularTodosAsync();

        resultado.Calculados.Should().Be(1);
        resultado.TitularesSinUbicacion.Should().BeEquivalentTo(new[] { 8 });
    }

    [Fact]
    public async Task ObtenerPorTitularAsync_CalculaLosViajesDiariosYLosKilometrosMensuales()
    {
        // 2 horarios distintos del mismo colegio => 2 viajes/día.
        // 3061 m => 3,061 km · 2 · 20 = 122,44 km/mes
        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>
            {
                new(3, 1, 1),
                new(3, 1, 5)
            });

        var recorrido = new Recorrido(3, 1, 3061, 336, "abc", "osrm", "HASH000000000000");
        typeof(Recorrido).GetProperty(nameof(Recorrido.Colegio))!.SetValue(recorrido, SanPatricio);

        _recorridos
            .Setup(r => r.GetByTitularIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido> { recorrido });

        var servicio = CrearServicio();

        var resultado = await servicio.ObtenerPorTitularAsync(3);

        resultado.Should().ContainSingle();
        resultado[0].ViajesDiarios.Should().Be(2);
        resultado[0].KilometrosMensuales.Should().Be(122.44m);
        resultado[0].ColegioNombre.Should().Be("San Patricio");
    }
}
