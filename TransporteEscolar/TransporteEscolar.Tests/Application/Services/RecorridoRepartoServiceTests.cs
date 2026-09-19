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

public class RecorridoRepartoServiceTests
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

    private RecorridoRepartoService CrearServicio()
    {
        var options = Options.Create(new RuteoOptions
        {
            BaseUrl = "https://osrm.test",
            PausaEntreConsultasMs = 0
        });

        return new RecorridoRepartoService(
            _pasajeros.Object,
            _ubicaciones.Object,
            _colegios.Object,
            _snapshots.Object,
            _rutaProvider.Object,
            options,
            NullLogger<RecorridoRepartoService>.Instance);
    }

    /// <summary>Un horario con dos titulares (10 y 20) asignados al mismo colegio.</summary>
    private void ConfigurarViajeConDosTitulares()
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
    }

    [Fact]
    public async Task RecalcularAsync_RepartePorShapleyYLaSumaEsElRecorridoCompleto()
    {
        // Dos titulares: colegio en 0, uno en 5 y otro en 10 sobre la misma recta.
        // Recorrido óptimo 10 -> 5 -> colegio = 10.000 m. Shapley: 7.500 y 2.500.
        ConfigurarViajeConDosTitulares();

        _rutaProvider
            .Setup(p => p.CalcularMatrizDistanciasAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 3),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new[] { 0d, 5000d, 10000d },
                new[] { 5000d, 0d, 5000d },
                new[] { 10000d, 5000d, 0d }
            });

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.ConsultasRealizadas.Should().Be(1);   // una sola consulta al motor
        guardado!.DistanciaTotalMetros.Should().Be(10000);
        guardado.Aportes.Sum(a => a.MetrosAsignados).Should().Be(10000);
        guardado.Aportes.Should().OnlyContain(a => a.MetrosAsignados > 0);
    }

    [Fact]
    public async Task RecalcularAsync_SiLaMatrizFalla_CuentaFallidoYNoGuarda()
    {
        ConfigurarViajeConDosTitulares();

        _rutaProvider
            .Setup(p => p.CalcularMatrizDistanciasAsync(It.IsAny<IReadOnlyList<Coordenada>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((double[][]?)null);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.Fallidos.Should().Be(1);
        _snapshots.Verify(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()), Times.Never);
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

        // Con un solo titular la matriz es 2x2: casa -> colegio = 5000 m.
        _rutaProvider
            .Setup(p => p.CalcularMatrizDistanciasAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 2),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new[] { 0d, 5000d },
                new[] { 5000d, 0d }
            });

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        // Con un solo participante no hay reparto que hacer: el aporte es el recorrido entero.
        guardado!.Aportes.Single().MetrosAsignados.Should().Be(5000);
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
            .Setup(p => p.CalcularMatrizDistanciasAsync(
                It.IsAny<IReadOnlyList<Coordenada>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new[] { 0d, 5000d },
                new[] { 5000d, 0d }
            });

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        guardado!.CantidadParadas.Should().Be(1);
        guardado.Aportes.Should().ContainSingle();
    }
}
