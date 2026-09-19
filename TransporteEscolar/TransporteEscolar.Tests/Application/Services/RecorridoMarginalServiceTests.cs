using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Tests.Application.Services;

public class RecorridoMarginalServiceTests
{
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<ITitularUbicacionRepository> _ubicaciones = new();
    private readonly Mock<IColegioRepository> _colegios = new();
    private readonly Mock<IRecorridoHorarioRepository> _snapshots = new();
    private readonly Mock<IRutaProvider> _rutaProvider = new();

    private static Colegio CrearColegio(int id)
    {
        var colegio = new Colegio("San Patricio", "Dirección", -26.8158608, -65.2742406);
        typeof(Colegio).GetProperty(nameof(Colegio.Id))!.SetValue(colegio, id);
        return colegio;
    }

    private RecorridoMarginalService CrearServicio()
    {
        var options = Options.Create(new RuteoOptions
        {
            BaseUrl = "https://osrm.test",
            PausaEntreConsultasMs = 0
        });

        return new RecorridoMarginalService(
            _pasajeros.Object,
            _ubicaciones.Object,
            _colegios.Object,
            _snapshots.Object,
            _rutaProvider.Object,
            options,
            NullLogger<RecorridoMarginalService>.Instance);
    }

    [Fact]
    public async Task RecalcularAsync_CalculaElAporteComoLaDiferenciaEntreLaRutaCompletaYLaRutaSinEsaParada()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario>
            {
                new(1, 1, 1, 10),
                new(1, 1, 1, 20)
            });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(10, -26.8200, -65.2900, null, FuenteUbicacion.Manual),
                new(20, -26.8300, -65.3000, null, FuenteUbicacion.Manual)
            });

        _colegios
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Colegio> { CrearColegio(1) });

        // Ruta completa (2 paradas) = 10000 m. Sin una parada (1 parada) = 8000 m.
        _rutaProvider
            .Setup(p => p.CalcularRutaOptimizadaAsync(
                It.Is<IReadOnlyList<Coordenada>>(paradas => paradas.Count == 2),
                It.IsAny<Coordenada>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(10000, 1200, null));

        _rutaProvider
            .Setup(p => p.CalcularRutaOptimizadaAsync(
                It.Is<IReadOnlyList<Coordenada>>(paradas => paradas.Count == 1),
                It.IsAny<Coordenada>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(8000, 900, null));

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.HorariosProcesados.Should().Be(1);
        resultado.ConsultasRealizadas.Should().Be(3); // 1 completa + 2 sin cada titular

        guardado.Should().NotBeNull();
        guardado!.DistanciaTotalMetros.Should().Be(10000);
        guardado.CantidadParadas.Should().Be(2);
        guardado.Aportes.Should().HaveCount(2);
        guardado.Aportes.Should().OnlyContain(a => a.MetrosMarginales == 2000);
    }

    [Fact]
    public async Task RecalcularAsync_ConUnSoloTitularEnElViaje_ElAporteEsTodoElRecorrido()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(10, -26.8200, -65.2900, null, FuenteUbicacion.Manual)
            });

        _colegios
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Colegio> { CrearColegio(1) });

        _rutaProvider
            .Setup(p => p.CalcularRutaOptimizadaAsync(
                It.Is<IReadOnlyList<Coordenada>>(paradas => paradas.Count == 1),
                It.IsAny<Coordenada>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(5000, 600, null));

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        // Sin él no hay viaje: el aporte marginal es el recorrido entero.
        guardado!.Aportes.Single().MetrosMarginales.Should().Be(5000);
    }

    [Fact]
    public async Task RecalcularAsync_IgnoraTitularesSinUbicacion()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario>
            {
                new(1, 1, 1, 10),
                new(1, 1, 1, 99)
            });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(10, -26.8200, -65.2900, null, FuenteUbicacion.Manual)
            });

        _colegios
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Colegio> { CrearColegio(1) });

        _rutaProvider
            .Setup(p => p.CalcularRutaOptimizadaAsync(
                It.IsAny<IReadOnlyList<Coordenada>>(),
                It.IsAny<Coordenada>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RutaCalculada(5000, 600, null));

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        guardado!.CantidadParadas.Should().Be(1);
        guardado.Aportes.Should().ContainSingle();
    }

    [Fact]
    public async Task RecalcularAsync_SiElMotorFallaEnLaRutaCompleta_CuentaFallidoYNoGuarda()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(10, -26.8200, -65.2900, null, FuenteUbicacion.Manual)
            });

        _colegios
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Colegio> { CrearColegio(1) });

        _rutaProvider
            .Setup(p => p.CalcularRutaOptimizadaAsync(
                It.IsAny<IReadOnlyList<Coordenada>>(),
                It.IsAny<Coordenada>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RutaCalculada?)null);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.Fallidos.Should().Be(1);
        _snapshots.Verify(
            r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
