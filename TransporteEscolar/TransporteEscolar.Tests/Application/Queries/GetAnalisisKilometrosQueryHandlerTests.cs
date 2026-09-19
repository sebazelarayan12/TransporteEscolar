using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Recorridos.Queries;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;

namespace TransporteEscolar.Tests.Application.Queries;

public class GetAnalisisKilometrosQueryHandlerTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IRecorridoRepository> _recorridos = new();
    private readonly Mock<ITitularUbicacionRepository> _ubicaciones = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<IRecorridoHorarioRepository> _recorridoHorarios = new();

    public GetAnalisisKilometrosQueryHandlerTests()
    {
        // Por defecto no hay snapshots de reparto calculados.
        _recorridoHorarios
            .Setup(r => r.GetAllConAportesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RecorridoHorario>());
    }

    private static T ConId<T>(T entidad, int id)
    {
        typeof(T).GetProperty("Id")!.SetValue(entidad, id);
        return entidad;
    }

    private static Titular CrearTitular(int id, string apellido, decimal monto)
        => ConId(new Titular(apellido, "Contacto", "Dirección", monto), id);

    private static Colegio CrearColegio(int id, string nombre)
        => ConId(new Colegio(nombre, "Dirección", -26.8, -65.2), id);

    private static Recorrido CrearRecorrido(int titularId, Colegio colegio, int distanciaMetros)
    {
        var recorrido = new Recorrido(titularId, colegio.Id, distanciaMetros, 300, null, "osrm", "HASH000000000000");
        typeof(Recorrido).GetProperty(nameof(Recorrido.Colegio))!.SetValue(recorrido, colegio);
        return recorrido;
    }

    private GetAnalisisKilometrosQueryHandler CrearHandler()
        => new(
            _titulares.Object,
            _recorridos.Object,
            _ubicaciones.Object,
            _pasajeros.Object,
            _recorridoHorarios.Object);

    [Fact]
    public async Task Handle_CalculaElPrecioPorKilometroDeCadaTitular()
    {
        var sanPatricio = CrearColegio(1, "San Patricio");

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(3, "PEREZ", 122440m) });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido> { CrearRecorrido(3, sanPatricio, 3061) });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(3, -26.8, -65.2, null, FuenteUbicacion.Manual)
            });

        // Dos horarios distintos del mismo colegio => 2 viajes/día.
        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(3, 1, 1), new(3, 1, 5) });

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        var fila = resultado.Filas.Should().ContainSingle().Subject;
        fila.Apellido.Should().Be("PEREZ");
        fila.KilometrosMensuales.Should().Be(122.44m);     // 3,061 km · 2 · 20
        fila.PrecioPorKilometro.Should().Be(1000m);         // 122440 / 122,44
        fila.Colegios.Should().BeEquivalentTo(new[] { "San Patricio" });
        fila.TieneUbicacion.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_TitularSinUbicacion_ApareceConKilometrosEnCeroYPrecioNulo()
    {
        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(8, "GOMEZ", 90000m) });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido>());

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>());

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>());

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        var fila = resultado.Filas.Should().ContainSingle().Subject;
        fila.KilometrosMensuales.Should().Be(0m);
        fila.PrecioPorKilometro.Should().BeNull();
        fila.TieneUbicacion.Should().BeFalse();
        resultado.TitularesSinUbicacion.Should().Be(1);
    }

    [Fact]
    public async Task Handle_ExcluyeTitularesDadosDeBaja()
    {
        var baja = CrearTitular(9, "BAJA", 50000m);
        baja.DarDeBaja();

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { baja });

        _recorridos.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<Recorrido>());
        _ubicaciones.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<TitularUbicacion>());
        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio>());

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        resultado.Filas.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_SumaLosTotalesYCalculaElPromedioGlobal()
    {
        var sanPatricio = CrearColegio(1, "San Patricio");

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular>
            {
                CrearTitular(1, "UNO", 100000m),
                CrearTitular(2, "DOS", 50000m)
            });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido>
            {
                CrearRecorrido(1, sanPatricio, 5000),
                CrearRecorrido(2, sanPatricio, 2500)
            });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(1, -26.8, -65.2, null, FuenteUbicacion.Manual),
                new(2, -26.8, -65.2, null, FuenteUbicacion.Manual)
            });

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(1, 1, 1), new(2, 1, 1) });

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        // 5 km · 1 · 20 = 100 ; 2,5 km · 1 · 20 = 50 ; total 150
        resultado.KilometrosTotales.Should().Be(150m);
        resultado.RecaudacionTotal.Should().Be(150000m);
        resultado.PrecioPromedioPorKilometro.Should().Be(1000m);
    }

    [Fact]
    public async Task Handle_OrdenaDeMenorAMayorPrecioPorKilometroYDejaLosSinDatoAlFinal()
    {
        var sanPatricio = CrearColegio(1, "San Patricio");

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular>
            {
                CrearTitular(1, "CARO", 200000m),
                CrearTitular(2, "BARATO", 20000m),
                CrearTitular(3, "SINPIN", 50000m)
            });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido>
            {
                CrearRecorrido(1, sanPatricio, 5000),
                CrearRecorrido(2, sanPatricio, 5000)
            });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(1, -26.8, -65.2, null, FuenteUbicacion.Manual),
                new(2, -26.8, -65.2, null, FuenteUbicacion.Manual)
            });

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(1, 1, 1), new(2, 1, 1) });

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        resultado.Filas.Select(f => f.Apellido).Should().ContainInOrder("BARATO", "CARO", "SINPIN");
    }

    [Fact]
    public async Task Handle_ConSnapshotsDeReparto_CalculaKilometrosYPrecioAsignado()
    {
        var sanPatricio = CrearColegio(1, "San Patricio");

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(3, "PEREZ", 100000m) });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido> { CrearRecorrido(3, sanPatricio, 3000) });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(3, -26.8, -65.2, null, FuenteUbicacion.Manual)
            });

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(3, 1, 1) });

        var snapshot = new RecorridoHorario(1, 1, 10000, 2);
        snapshot.AgregarAporte(3, 2500);

        _recorridoHorarios
            .Setup(r => r.GetAllConAportesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RecorridoHorario> { snapshot });

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        var fila = resultado.Filas.Should().ContainSingle().Subject;
        fila.KilometrosAsignadosMensuales.Should().Be(50m);     // 2,5 km · 1 · 20
        fila.PrecioPorKilometroAsignado.Should().Be(2000m);       // 100000 / 50
    }

    [Fact]
    public async Task Handle_SinSnapshotsDeReparto_LosKilometrosAsignadosSonCeroYElPrecioEsNulo()
    {
        var sanPatricio = CrearColegio(1, "San Patricio");

        _titulares
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Titular> { CrearTitular(3, "PEREZ", 100000m) });

        _recorridos
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Recorrido> { CrearRecorrido(3, sanPatricio, 3000) });

        _ubicaciones
            .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TitularUbicacion>
            {
                new(3, -26.8, -65.2, null, FuenteUbicacion.Manual)
            });

        _pasajeros
            .Setup(r => r.GetAsignacionesColegioAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<AsignacionColegio> { new(3, 1, 1) });

        var resultado = await CrearHandler().Handle(new GetAnalisisKilometrosQuery(), CancellationToken.None);

        var fila = resultado.Filas.Should().ContainSingle().Subject;
        fila.KilometrosAsignadosMensuales.Should().Be(0m);
        fila.PrecioPorKilometroAsignado.Should().BeNull();
    }
}
