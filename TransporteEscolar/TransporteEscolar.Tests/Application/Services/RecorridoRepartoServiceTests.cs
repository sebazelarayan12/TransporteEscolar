using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Options;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Services;
using TransporteEscolar.Domain.ValueObjects;

namespace TransporteEscolar.Tests.Application.Services;

public class RecorridoRepartoServiceTests
{
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<ITitularUbicacionRepository> _ubicaciones = new();
    private readonly Mock<IColegioRepository> _colegios = new();
    private readonly Mock<IHorarioRepository> _horarios = new();
    private readonly Mock<IParadaFijaRepository> _paradasFijas = new();
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IRecorridoHorarioRepository> _snapshots = new();
    private readonly Mock<IRutaProvider> _rutaProvider = new();

    private static Colegio CrearColegio(int id)
    {
        var colegio = new Colegio("San Patricio", "Dirección", -26.8158608, -65.2742406);
        typeof(Colegio).GetProperty(nameof(Colegio.Id))!.SetValue(colegio, id);
        return colegio;
    }

    private static Horario CrearHorario(int id, string etiqueta, SentidoHorario sentido)
    {
        var horario = new Horario(etiqueta, id);
        typeof(Horario).GetProperty(nameof(Horario.Id))!.SetValue(horario, id);
        horario.AsignarSentido(sentido);
        return horario;
    }

    private static Horario CrearHorarioConColegio(int id, string etiqueta, SentidoHorario sentido, Colegio colegio)
    {
        var horario = CrearHorario(id, etiqueta, sentido);
        typeof(Horario).GetProperty(nameof(Horario.Colegio))!.SetValue(horario, colegio);
        return horario;
    }

    private static Titular CrearTitular(int id, string apellido)
    {
        var titular = new Titular(apellido, "Contacto", "Dirección", 1000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, id);
        return titular;
    }

    /// <summary>Matriz de distancias envuelta como <see cref="MatrizViaje"/> para los mocks del proveedor.
    /// Las duraciones son iguales a las distancias: no importa la magnitud real, solo que sean
    /// positivas cuando hay distancia, para que <c>DuracionTotalSegundos</c> dé mayor que cero.</summary>
    private static MatrizViaje CrearMatrizViaje(double[][] distancias) => new(distancias, distancias);

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
            _horarios.Object,
            _paradasFijas.Object,
            _titulares.Object,
            _snapshots.Object,
            _rutaProvider.Object,
            options,
            NullLogger<RecorridoRepartoService>.Instance);
    }

    /// <summary>Un horario de ida (id 1) con dos titulares (10 y 20) asignados al mismo colegio.</summary>
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

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });
    }

    /// <summary>Sin esto los tests que sí calculan necesitan marcar la parada fija a mano.</summary>
    private void ConfigurarParadaFija(int horarioId, byte transporte, int titularId)
    {
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(horarioId, transporte, titularId) });
    }

    private void ConfigurarSinParadasFijas()
    {
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija>());
    }

    [Fact]
    public async Task RecalcularAsync_RepartePorShapleyYLaSumaEsElRecorridoCompleto()
    {
        // Dos titulares: colegio en 0, uno en 5 y otro en 10 sobre la misma recta.
        // Recorrido óptimo 10 -> 5 -> colegio = 10.000 m. Shapley: 7.500 y 2.500.
        ConfigurarViajeConDosTitulares();
        ConfigurarParadaFija(1, 1, 10); // parada fija: el titular 10 (índice 0, la casa en x=10)

        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 3),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearMatrizViaje(new[]
            {
                new[] { 0d, 5000d, 10000d },
                new[] { 5000d, 0d, 5000d },
                new[] { 10000d, 5000d, 0d }
            }));

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.ConsultasRealizadas.Should().Be(1);   // una sola consulta al motor
        resultado.Pendientes.Should().BeEmpty();
        guardado!.DistanciaTotalMetros.Should().Be(10000);
        guardado.Aportes.Sum(a => a.MetrosAsignados).Should().Be(10000);
        guardado.Aportes.Should().OnlyContain(a => a.MetrosAsignados > 0);

        // Ida: el primer tramo del recorrido es cero (ahí arranca) y el tramo final (última casa
        // al colegio) es mayor a cero.
        var primeraParada = guardado.Aportes.Single(a => a.Orden == 1);
        primeraParada.MetrosTramoAnterior.Should().Be(0);
        guardado.MetrosTramoFinal.Should().BeGreaterThan(0);
        guardado.DuracionTotalSegundos.Should().BeGreaterThan(0);

        // Invariante: la suma de los tramos más el final reconstruye el total exacto en este caso
        // (sin errores de redondeo porque todas las distancias ya son enteras).
        var sumaTramos = guardado.Aportes.Sum(a => a.MetrosTramoAnterior) + guardado.MetrosTramoFinal;
        sumaTramos.Should().Be(guardado.DistanciaTotalMetros);
    }

    [Fact]
    public async Task RecalcularAsync_SiLaMatrizFalla_CuentaFallidoYNoGuarda()
    {
        ConfigurarViajeConDosTitulares();
        ConfigurarParadaFija(1, 1, 10);

        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(It.IsAny<IReadOnlyList<Coordenada>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MatrizViaje?)null);

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

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        ConfigurarParadaFija(1, 1, 10);

        // Con un solo titular la matriz es 2x2: casa -> colegio = 5000 m.
        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 2),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearMatrizViaje(new[]
            {
                new[] { 0d, 5000d },
                new[] { 5000d, 0d }
            }));

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

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        ConfigurarParadaFija(1, 1, 10);

        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(
                It.IsAny<IReadOnlyList<Coordenada>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearMatrizViaje(new[]
            {
                new[] { 0d, 5000d },
                new[] { 5000d, 0d }
            }));

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
    public async Task RecalcularAsync_SinParadaFija_NoCalculaYQuedaPendienteSinConsultarElMotor()
    {
        ConfigurarViajeConDosTitulares();
        ConfigurarSinParadasFijas();

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.ViajesProcesados.Should().Be(0);
        resultado.ConsultasRealizadas.Should().Be(0);
        resultado.Pendientes.Should().ContainSingle();
        resultado.Pendientes.Single().HorarioId.Should().Be(1);
        resultado.Pendientes.Single().Transporte.Should().Be((byte)1);
        resultado.Pendientes.Single().Motivo.Should().NotBeNullOrWhiteSpace();

        // El punto crítico: ni una sola consulta al motor de ruteo.
        _rutaProvider.Verify(
            p => p.CalcularMatricesAsync(It.IsAny<IReadOnlyList<Coordenada>>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _snapshots.Verify(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RecalcularAsync_ConParadaFijaHuerfana_QuedaPendienteConOtroMotivoYSinConsultarElMotor()
    {
        ConfigurarViajeConDosTitulares();
        // El titular 999 no está entre los participantes (10, 20): la parada fija quedó huérfana.
        ConfigurarParadaFija(1, 1, 999);

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.ViajesProcesados.Should().Be(0);
        resultado.ConsultasRealizadas.Should().Be(0);
        resultado.Pendientes.Should().ContainSingle();
        resultado.Pendientes.Single().Motivo.Should().NotBeNullOrWhiteSpace();

        _rutaProvider.Verify(
            p => p.CalcularMatricesAsync(It.IsAny<IReadOnlyList<Coordenada>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RecalcularAsync_LosDosMotivosDePendienteSonDistintos()
    {
        // Dos viajes distintos en el mismo recálculo: horario 1 sin parada fija, horario 2 con
        // parada fija huérfana. Confirma que el texto de motivo depende del caso real.
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario>
            {
                new(1, 1, 1, 10),
                new(2, 1, 1, 20)
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

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario>
            {
                CrearHorario(1, "8 San Patricio", SentidoHorario.Ida),
                CrearHorario(2, "9 San Patricio", SentidoHorario.Ida)
            });

        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(2, 1, 999) }); // huérfana: 999 no viaja en el horario 2

        var resultado = await CrearServicio().RecalcularAsync();

        resultado.Pendientes.Should().HaveCount(2);
        var motivoSinParada = resultado.Pendientes.Single(p => p.HorarioId == 1).Motivo;
        var motivoHuerfana = resultado.Pendientes.Single(p => p.HorarioId == 2).Motivo;
        motivoSinParada.Should().NotBe(motivoHuerfana);
    }

    [Fact]
    public async Task RecalcularAsync_ConHorarioDeVuelta_UsaExtremoFijoUltima()
    {
        ConfigurarViajeConDosTitulares();

        // Sobrescribe el horario del helper: mismo id, pero de vuelta.
        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "12 San Patricio", SentidoHorario.Vuelta) });

        // Parada fija: titular 10 (índice 0 dentro de los participantes ordenados [10, 20]).
        // Es exactamente el caso que ya prueba RepartoShapleyTests.Calcular_Vuelta_TerminaEnLaParadaFija
        // con esta misma matriz (MatrizEnRecta(10, 5, 0), 2, 0, ExtremoFijo.Ultima): total 10.000 m,
        // Orden = (1, 0) — el índice 0 (la parada fija) termina el recorrido.
        ConfigurarParadaFija(1, 1, 10);

        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 3),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearMatrizViaje(new[]
            {
                new[] { 0d, 5000d, 10000d },
                new[] { 5000d, 0d, 5000d },
                new[] { 10000d, 5000d, 0d }
            }));

        // No hay forma directa de espiar los argumentos de RepartoShapley.Calcular (es estático),
        // así que el chequeo indirecto es el resultado: en vuelta, la parada fija (índice 0, titular
        // 10) tiene que terminar el recorrido, y el total tiene que ser el que corresponde a
        // ExtremoFijo.Ultima con esta matriz (colegio -> 5 -> 10 = 10.000 m, no 15.000 como con Primera).
        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        guardado!.DistanciaTotalMetros.Should().Be(10000);
        // Con ExtremoFijo.Ultima el aporte del titular 10 (parada fija, índice 0) tiene que ser el
        // último en el orden real de visita.
        var aporteTitular10 = guardado.Aportes.Single(a => a.TitularId == 10);
        var ordenMaximo = guardado.Aportes.Max(a => a.Orden);
        aporteTitular10.Orden.Should().Be(ordenMaximo);

        // Vuelta: el primer tramo del recorrido es la distancia DESDE el colegio, no cero; y el
        // tramo final es cero porque el recorrido termina en una casa (no en el colegio).
        var primeraParada = guardado.Aportes.Single(a => a.Orden == 1);
        primeraParada.MetrosTramoAnterior.Should().Be(5000); // colegio -> primera casa visitada
        guardado.MetrosTramoFinal.Should().Be(0);
        guardado.DuracionTotalSegundos.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RecalcularAsync_LosAportesGuardadosLlevanElOrdenRealDeVisitaNoElIndiceProvisorio()
    {
        // Cinco titulares en las mismas posiciones que RepartoShapleyTests usa para probar que
        // Held-Karp arranca por la parada fija (índice 2) y no recorre las paradas en el orden
        // 0,1,2,3,4: ese test ya confirma Orden[0] == 2 para esta matriz. Reproducirla acá evita
        // tener que recalcular el óptimo a mano y sigue siendo un caso real de mapeo no trivial.
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario>
            {
                new(1, 1, 1, 10),
                new(1, 1, 1, 20),
                new(1, 1, 1, 30),
                new(1, 1, 1, 40),
                new(1, 1, 1, 50)
            });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(10, -26.8110, -65.2900, null, FuenteUbicacion.Manual),
                new(20, -26.8120, -65.2900, null, FuenteUbicacion.Manual),
                new(30, -26.8130, -65.2900, null, FuenteUbicacion.Manual),
                new(40, -26.8140, -65.2900, null, FuenteUbicacion.Manual),
                new(50, -26.8150, -65.2900, null, FuenteUbicacion.Manual)
            });

        _colegios
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Colegio> { CrearColegio(1) });

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        // Parada fija: titular 30, que es el índice 2 dentro de participantes ordenados
        // (10, 20, 30, 40, 50) -> índices (0, 1, 2, 3, 4).
        ConfigurarParadaFija(1, 1, 30);

        // Misma matriz (en metros) que RepartoShapleyTests.Calcular_ElOrdenContieneTodasLasParadasUnaSolaVez:
        // MatrizEnRecta(12, 7, 3, 20, 15, 0). Índice 5 es el colegio.
        var matriz = MatrizEnRecta(12000, 7000, 3000, 20000, 15000, 0);
        _rutaProvider
            .Setup(p => p.CalcularMatricesAsync(
                It.Is<IReadOnlyList<Coordenada>>(puntos => puntos.Count == 6),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(CrearMatrizViaje(matriz));

        RecorridoHorario? guardado = null;
        _snapshots
            .Setup(r => r.UpsertAsync(It.IsAny<RecorridoHorario>(), It.IsAny<CancellationToken>()))
            .Callback<RecorridoHorario, CancellationToken>((snapshot, _) => guardado = snapshot)
            .Returns(Task.CompletedTask);

        await CrearServicio().RecalcularAsync();

        guardado.Should().NotBeNull();

        // Reproducimos el cálculo real (mismo motor que usa el servicio) para obtener el Orden
        // correcto, y confirmamos que el snapshot guardado tenga la MISMA correspondencia
        // titular -> posición. Los participantes ordenados son (10,20,30,40,50) -> índices (0..4).
        var repartoEsperado = RepartoShapley.Calcular(matriz, 5, 2, ExtremoFijo.Primera);
        repartoEsperado.Should().NotBeNull();

        // El caso solo prueba lo que promete si Held-Karp NO visita las paradas en el orden de
        // sus índices (0,1,2,3,4): si lo hiciera, la posición dentro de Orden y "índice + 1" (el
        // mapeo viejo, provisorio) coincidirían para todas las paradas y el test no detectaría
        // una inversión. RepartoShapleyTests ya prueba que Orden[0] == 2 para esta matriz.
        repartoEsperado!.Orden.Should().NotEqual(new[] { 0, 1, 2, 3, 4 },
            "si Orden fuera la secuencia trivial de índices, un mapeo invertido (usar el índice " +
            "en vez de la posición) pasaría desapercibido");

        var participantesOrdenados = new[] { 10, 20, 30, 40, 50 };
        for (var posicion = 0; posicion < repartoEsperado.Orden.Count; posicion++)
        {
            var titularId = participantesOrdenados[repartoEsperado.Orden[posicion]];
            var ordenEsperado = posicion + 1;

            guardado!.Aportes.Single(a => a.TitularId == titularId).Orden.Should().Be(ordenEsperado);
        }

        // El punto crítico de MetrosTramoAnterior: tiene que estar indexado por la parada que
        // guarda, no por la posición dentro del bucle. Con un orden no trivial (Orden[0] == 2,
        // no 0) un mapeo invertido daría tramos cruzados entre titulares.
        for (var posicion = 1; posicion < repartoEsperado.Orden.Count; posicion++)
        {
            var paradaActual = repartoEsperado.Orden[posicion];
            var paradaPrevia = repartoEsperado.Orden[posicion - 1];
            var titularId = participantesOrdenados[paradaActual];
            var tramoEsperado = (int)Math.Round(matriz[paradaPrevia][paradaActual], MidpointRounding.AwayFromZero);

            guardado!.Aportes.Single(a => a.TitularId == titularId).MetrosTramoAnterior.Should().Be(tramoEsperado);
        }

        // Ida: el primer tramo del recorrido es cero (ahí arranca) y el tramo final es mayor a cero.
        var primerTitular = participantesOrdenados[repartoEsperado.Orden[0]];
        guardado!.Aportes.Single(a => a.TitularId == primerTitular).MetrosTramoAnterior.Should().Be(0);
        guardado.MetrosTramoFinal.Should().BeGreaterThan(0);
        guardado.DuracionTotalSegundos.Should().BeGreaterThan(0);

        // Invariante: la suma de los tramos más el final reconstruye el total, con la tolerancia de
        // redondeos independientes documentada en el plan (cada tramo se redondea por separado, así
        // que el acumulado puede diferir del total en, como mucho, un metro por parada).
        var sumaTramos = guardado.Aportes.Sum(a => a.MetrosTramoAnterior) + guardado.MetrosTramoFinal;
        Math.Abs(sumaTramos - guardado.DistanciaTotalMetros).Should().BeLessOrEqualTo(guardado.CantidadParadas + 1);
    }

    /// <summary>Igual al helper homónimo de RepartoShapleyTests: matriz de distancias sobre una recta.</summary>
    private static double[][] MatrizEnRecta(params double[] posiciones)
    {
        var n = posiciones.Length;
        var matriz = new double[n][];
        for (var i = 0; i < n; i++)
        {
            matriz[i] = new double[n];
            for (var j = 0; j < n; j++)
            {
                matriz[i][j] = Math.Abs(posiciones[i] - posiciones[j]);
            }
        }

        return matriz;
    }

    [Fact]
    public async Task ObtenerParadasFijasAsync_DevuelveEtiquetaDeHorarioYApellidoDeTitular()
    {
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(1, 1, 10) });

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        var titular = new Titular("Pérez", "Contacto", "Dirección", 1000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, 10);

        _titulares
            .Setup(r => r.GetByIdsAsync(It.Is<List<int>>(ids => ids.Contains(10)), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { titular });

        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        var resultado = await CrearServicio().ObtenerParadasFijasAsync();

        var fila = resultado.Should().ContainSingle().Subject;
        fila.HorarioEtiqueta.Should().Be("8 San Patricio");
        fila.TitularApellido.Should().Be("PÉREZ");
        fila.SigueViajando.Should().BeTrue();
    }

    [Fact]
    public async Task ObtenerParadasFijasAsync_MarcaSigueViajandoFalso_SiElTitularYaNoEstaEnLasAsignacionesDeEseViaje()
    {
        // El titular 10 fue marcado como parada fija, pero ya no aparece en las asignaciones de
        // ningún viaje (se dio de baja, dieron de baja a sus pasajeros, o lo sacaron del horario).
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(1, 1, 10) });

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(10, "Pérez") });

        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario>());

        var resultado = await CrearServicio().ObtenerParadasFijasAsync();

        resultado.Should().ContainSingle().Which.SigueViajando.Should().BeFalse();
    }

    [Fact]
    public async Task ObtenerParadasFijasAsync_NoFiltraLaParadaHuerfana_LaDevuelveMarcada()
    {
        // Dos paradas fijas: la del horario 1 sigue vigente, la del horario 2 quedó huérfana.
        // Ninguna se tiene que perder de la lista: la pantalla necesita ver ambas para poder avisar.
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(1, 1, 10), new(2, 1, 20) });

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario>
            {
                CrearHorario(1, "8 San Patricio", SentidoHorario.Ida),
                CrearHorario(2, "9 San Patricio", SentidoHorario.Ida)
            });

        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(10, "Pérez"), CrearTitular(20, "Gómez") });

        // Solo el titular 10 sigue en las asignaciones (horario 1); el 20 ya no aparece en ningún viaje.
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        var resultado = await CrearServicio().ObtenerParadasFijasAsync();

        resultado.Should().HaveCount(2);
        resultado.Single(p => p.HorarioId == 1).SigueViajando.Should().BeTrue();
        resultado.Single(p => p.HorarioId == 2).SigueViajando.Should().BeFalse();
    }

    [Fact]
    public async Task ObtenerParadasFijasAsync_SigueViajandoEsPorHorarioYTransporte_NoSoloPorTitular()
    {
        // La parada fija es del transporte 1, pero el titular solo viaja en el transporte 2 de ese
        // mismo horario: la tupla completa (horario, transporte, titular) tiene que fallar aunque el
        // titular exista en las asignaciones de otro vehículo.
        _paradasFijas
            .Setup(r => r.GetTodasAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ParadaFija> { new(1, 1, 10) });

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(10, "Pérez") });

        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 2, 1, 10) });

        var resultado = await CrearServicio().ObtenerParadasFijasAsync();

        resultado.Should().ContainSingle().Which.SigueViajando.Should().BeFalse();
    }

    [Fact]
    public async Task AsignarParadaFijaAsync_SiElTitularNoViajaEnEseHorarioYTransporte_Lanza()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        var accion = () => CrearServicio().AsignarParadaFijaAsync(1, 1, 999);

        await accion.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task AsignarParadaFijaAsync_SiElTitularNoTieneUbicacion_Lanza()
    {
        _pasajeros
            .Setup(r => r.GetAsignacionesHorarioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionHorario> { new(1, 1, 1, 10) });

        _ubicaciones
            .Setup(r => r.GetByTitularIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TitularUbicacion?)null);

        var accion = () => CrearServicio().AsignarParadaFijaAsync(1, 1, 10);

        await accion.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task ObtenerRecorridoViajeAsync_SinSnapshot_DevuelveNull()
    {
        _snapshots
            .Setup(r => r.GetAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RecorridoHorario?)null);

        var resultado = await CrearServicio().ObtenerRecorridoViajeAsync(1, 1);

        resultado.Should().BeNull();
    }

    [Fact]
    public async Task ObtenerRecorridoViajeAsync_DevuelveLasParadasOrdenadasPorOrden()
    {
        // Se agregan a propósito en el orden inverso al real, para que el test solo pase si el
        // servicio ordena por Orden y no confía en el orden de inserción de la colección.
        var snapshot = new RecorridoHorario(1, 1, 10000, 2, 1500, 900);
        snapshot.AgregarAporte(20, 6000, 2, 3500);
        snapshot.AgregarAporte(10, 4000, 1, 0);

        _snapshots
            .Setup(r => r.GetAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        var colegio = CrearColegio(1);
        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorarioConColegio(1, "8 San Patricio", SentidoHorario.Ida, colegio) });

        _paradasFijas
            .Setup(r => r.GetAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ParadaFija?)null);

        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(10, "Perez"), CrearTitular(20, "Gomez") });

        var resultado = await CrearServicio().ObtenerRecorridoViajeAsync(1, 1);

        resultado.Should().NotBeNull();
        resultado!.HorarioEtiqueta.Should().Be("8 San Patricio");
        resultado.Sentido.Should().Be(nameof(SentidoHorario.Ida));
        resultado.ColegioNombre.Should().Be("San Patricio");
        resultado.Paradas.Select(p => p.Orden).Should().ContainInOrder(1, 2);
        resultado.Paradas.Select(p => p.TitularId).Should().ContainInOrder(10, 20);
    }

    [Fact]
    public async Task ObtenerRecorridoViajeAsync_MarcaEsParadaFijaEnLaCorrecta()
    {
        var snapshot = new RecorridoHorario(1, 1, 10000, 2, 1500, 900);
        snapshot.AgregarAporte(10, 4000, 1, 0);
        snapshot.AgregarAporte(20, 6000, 2, 3500);

        _snapshots
            .Setup(r => r.GetAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        _horarios
            .Setup(r => r.GetConColegioAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Horario> { CrearHorario(1, "8 San Patricio", SentidoHorario.Ida) });

        _paradasFijas
            .Setup(r => r.GetAsync(1, 1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ParadaFija(1, 1, 20));

        _titulares
            .Setup(r => r.GetByIdsAsync(It.IsAny<List<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(10, "Perez"), CrearTitular(20, "Gomez") });

        var resultado = await CrearServicio().ObtenerRecorridoViajeAsync(1, 1);

        resultado!.Paradas.Single(p => p.TitularId == 20).EsParadaFija.Should().BeTrue();
        resultado.Paradas.Single(p => p.TitularId == 10).EsParadaFija.Should().BeFalse();
    }
}
