using FluentAssertions;
using Moq;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Pasajeros.Commands;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Enums;
using TransporteEscolar.Domain.Exceptions;

namespace TransporteEscolar.Tests.Application.Commands;

public class ReactivarPasajeroCommandHandlerTests
{
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<IPasajeroHorarioRepository> _asignaciones = new();
    private readonly Mock<IHorarioRepository> _horarios = new();

    private ReactivarPasajeroCommandHandler CrearHandler() =>
        new(_pasajeros.Object, _asignaciones.Object, _horarios.Object);

    private static Pasajero CrearPasajeroDeBaja(int id, string nombre)
    {
        var pasajero = new Pasajero(1, nombre, "Colegio", "1°", "Mañana");
        typeof(Pasajero).GetProperty(nameof(Pasajero.Id))!.SetValue(pasajero, id);
        pasajero.DarDeBaja();
        return pasajero;
    }

    private static Horario CrearHorario(int id, string etiqueta, bool activo)
    {
        var horario = Horario.Crear(etiqueta, id, 1, SentidoHorario.Ida);
        typeof(Horario).GetProperty(nameof(Horario.Id))!.SetValue(horario, id);
        if (!activo) horario.Desactivar();
        return horario;
    }

    private void ConfigurarAsignaciones(int pasajeroId, params int[] horarioIds)
    {
        _asignaciones
            .Setup(r => r.GetByPasajeroIdAsync(pasajeroId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(horarioIds
                .Select((h, i) => new PasajeroHorario(pasajeroId, h, i == 0, i + 1))
                .ToList());
    }

    private void ConfigurarHorariosInactivos(params Horario[] inactivos)
    {
        _horarios
            .Setup(r => r.GetInactivosPorIdsAsync(It.IsAny<IEnumerable<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<int> ids, CancellationToken _) =>
                inactivos.Where(h => ids.Contains(h.Id)).ToList());
    }

    [Fact]
    public async Task Handle_ConHorarioInactivoAsignado_LanzaYNoReactivaNiGuarda()
    {
        var pasajero = CrearPasajeroDeBaja(5, "Lucía");
        var fechaBaja = pasajero.FechaBaja;
        _pasajeros.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(pasajero);
        ConfigurarAsignaciones(5, 8, 9);
        ConfigurarHorariosInactivos(CrearHorario(9, "9 San Patricio", activo: false));

        var accion = () => CrearHandler().Handle(new ReactivarPasajeroCommand(5), CancellationToken.None);

        var excepcion = await accion.Should().ThrowAsync<BusinessRuleException>();
        excepcion.Which.Message.Should().Contain("Lucía").And.Contain("9 San Patricio");
        pasajero.FechaBaja.Should().Be(fechaBaja);
        _pasajeros.Verify(r => r.UpdateAsync(It.IsAny<Pasajero>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ConHorariosActivos_ReactivaYGuarda()
    {
        var pasajero = CrearPasajeroDeBaja(5, "Lucía");
        _pasajeros.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(pasajero);
        ConfigurarAsignaciones(5, 8, 9);
        ConfigurarHorariosInactivos(); // ninguno inactivo

        await CrearHandler().Handle(new ReactivarPasajeroCommand(5), CancellationToken.None);

        pasajero.FechaBaja.Should().BeNull();
        _pasajeros.Verify(r => r.UpdateAsync(pasajero, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SinHorarios_ReactivaYGuarda()
    {
        var pasajero = CrearPasajeroDeBaja(5, "Lucía");
        _pasajeros.Setup(r => r.GetByIdAsync(5, It.IsAny<CancellationToken>())).ReturnsAsync(pasajero);
        ConfigurarAsignaciones(5);
        ConfigurarHorariosInactivos();

        await CrearHandler().Handle(new ReactivarPasajeroCommand(5), CancellationToken.None);

        pasajero.FechaBaja.Should().BeNull();
        _pasajeros.Verify(r => r.UpdateAsync(pasajero, It.IsAny<CancellationToken>()), Times.Once);
    }
}
