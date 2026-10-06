using FluentAssertions;
using MediatR;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.PagosMensuales.Commands;
using TransporteEscolar.Application.Services;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Services;

public class TitularServiceReactivarTests
{
    private readonly Mock<ITitularRepository> _titulares = new();
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<INotificacionService> _notificaciones = new();
    private readonly Mock<IPagoMensualRepository> _pagos = new();
    private readonly Mock<ISender> _sender = new();
    private readonly Mock<IPasajeroHorarioRepository> _asignaciones = new();
    private readonly Mock<IHorarioRepository> _horarios = new();

    private TitularService CrearServicio() =>
        new(_titulares.Object, _pasajeros.Object, _notificaciones.Object, _pagos.Object,
            _sender.Object, _asignaciones.Object, _horarios.Object);

    private static Titular CrearTitularDeBaja()
    {
        var titular = new Titular("Pérez", "Contacto", "Dirección", 1000m);
        typeof(Titular).GetProperty(nameof(Titular.Id))!.SetValue(titular, 1);
        titular.DarDeBaja();
        return titular;
    }

    private static Pasajero CrearPasajero(int id, string nombre, bool deBaja)
    {
        var pasajero = new Pasajero(1, nombre, "Colegio", "1°", "Mañana");
        typeof(Pasajero).GetProperty(nameof(Pasajero.Id))!.SetValue(pasajero, id);
        if (deBaja) pasajero.DarDeBaja();
        return pasajero;
    }

    private static Horario CrearHorario(int id, string etiqueta, bool activo)
    {
        var horario = Horario.Crear(etiqueta, id, 1, SentidoHorario.Ida);
        typeof(Horario).GetProperty(nameof(Horario.Id))!.SetValue(horario, id);
        if (!activo) horario.Desactivar();
        return horario;
    }

    private void Configurar(Titular titular, List<Pasajero> pasajeros, params Horario[] inactivos)
    {
        _titulares.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(titular);
        _pasajeros.Setup(r => r.GetTodosByTitularIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(pasajeros);

        foreach (var pasajero in pasajeros)
        {
            // Cada pasajero tiene una asignación al horario 9 (el que puede estar inactivo).
            _asignaciones
                .Setup(r => r.GetByPasajeroIdAsync(pasajero.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<PasajeroHorario> { new(pasajero.Id, 9, true, 1) });
        }

        _horarios
            .Setup(r => r.GetInactivosPorIdsAsync(It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<int> ids, CancellationToken _) =>
                inactivos.Where(h => ids.Contains(h.Id)).ToList());
    }

    [Fact]
    public async Task ReactivarAsync_ConPasajeroEnHorarioInactivo_LanzaYNoCambiaNada()
    {
        var titular = CrearTitularDeBaja();
        var fechaBajaTitular = titular.FechaBaja;
        var pasajeroDeBaja = CrearPasajero(10, "Lucía", deBaja: true);
        var fechaBajaPasajero = pasajeroDeBaja.FechaBaja;
        Configurar(titular, new List<Pasajero> { pasajeroDeBaja }, CrearHorario(9, "9 San Patricio", activo: false));

        var accion = () => CrearServicio().ReactivarAsync(1);

        var excepcion = await accion.Should().ThrowAsync<BusinessRuleException>();
        excepcion.Which.Message.Should().Contain("Lucía").And.Contain("9 San Patricio");
        titular.FechaBaja.Should().Be(fechaBajaTitular);
        pasajeroDeBaja.FechaBaja.Should().Be(fechaBajaPasajero);
        _titulares.Verify(r => r.UpdateAsync(It.IsAny<Titular>(), It.IsAny<CancellationToken>()), Times.Never);
        _pasajeros.Verify(r => r.UpdateAsync(It.IsAny<Pasajero>(), It.IsAny<CancellationToken>()), Times.Never);
        _sender.Verify(s => s.Send(It.IsAny<GenerarPagosMensualesAutomaticosCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReactivarAsync_ConVariosProblemas_ElMensajeListaATodosLosPasajeros()
    {
        var titular = CrearTitularDeBaja();
        var primero = CrearPasajero(10, "Lucía", deBaja: true);
        var segundo = CrearPasajero(11, "Mateo", deBaja: true);
        Configurar(titular, new List<Pasajero> { primero, segundo }, CrearHorario(9, "9 San Patricio", activo: false));

        var accion = () => CrearServicio().ReactivarAsync(1);

        var excepcion = await accion.Should().ThrowAsync<BusinessRuleException>();
        excepcion.Which.Message.Should().Contain("Lucía").And.Contain("Mateo");
        _pasajeros.Verify(r => r.UpdateAsync(It.IsAny<Pasajero>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReactivarAsync_ElPasajeroActivoNoSeValida_SoloLosDadosDeBaja()
    {
        // Un pasajero que ya estaba activo no entra en la reactivación, así que su horario no importa.
        var titular = CrearTitularDeBaja();
        var activo = CrearPasajero(10, "Lucía", deBaja: false);
        var deBaja = CrearPasajero(11, "Mateo", deBaja: true);
        Configurar(titular, new List<Pasajero> { activo, deBaja });
        _asignaciones
            .Setup(r => r.GetByPasajeroIdAsync(10, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No debería consultarse al pasajero activo"));

        await CrearServicio().ReactivarAsync(1);

        titular.FechaBaja.Should().BeNull();
        deBaja.FechaBaja.Should().BeNull();
    }

    [Fact]
    public async Task ReactivarAsync_SinHorariosInactivos_ReactivaTodoComoAntes()
    {
        var titular = CrearTitularDeBaja();
        var pasajeroDeBaja = CrearPasajero(10, "Lucía", deBaja: true);
        Configurar(titular, new List<Pasajero> { pasajeroDeBaja });

        await CrearServicio().ReactivarAsync(1);

        titular.FechaBaja.Should().BeNull();
        pasajeroDeBaja.FechaBaja.Should().BeNull();
        _pasajeros.Verify(r => r.UpdateAsync(pasajeroDeBaja, It.IsAny<CancellationToken>()), Times.Once);
        _titulares.Verify(r => r.UpdateAsync(titular, It.IsAny<CancellationToken>()), Times.Once);
        _sender.Verify(s => s.Send(It.IsAny<GenerarPagosMensualesAutomaticosCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
