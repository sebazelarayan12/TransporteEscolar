using FluentAssertions;
using Moq;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Pasajeros.Commands;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Tests.Application.Commands;

public class UpdatePasajeroCommandHandlerTests
{
    private readonly Mock<IPasajeroRepository> _pasajeros = new();
    private readonly Mock<IHorarioRepository> _horarios = new();

    private UpdatePasajeroCommandHandler CrearHandler() => new(_pasajeros.Object, _horarios.Object);

    private Pasajero CrearPasajeroConHorarios(int id, params (int horarioId, bool principal)[] horarios)
    {
        var pasajero = new Pasajero(1, "Julia", "Colegio", "5 grado", "Tarde");
        typeof(Pasajero).GetProperty(nameof(Pasajero.Id))!.SetValue(pasajero, id);
        var prioridad = 1;
        foreach (var (horarioId, principal) in horarios)
        {
            pasajero.AsignarOActualizarHorario(horarioId, principal, prioridad++, PasajeroHorario.NormalizarTransporte(null));
        }

        _pasajeros.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(pasajero);
        return pasajero;
    }

    private static PasajeroModel.UpdateRequest Payload(int? horarioId) =>
        new("Julia Editada", "Colegio", "5 grado", "Tarde", "obs", horarioId);

    // Regresión: el front edita solo los datos personales y no manda horarioId.
    // Antes, null se interpretaba como "quitar el horario" y se perdía una asignación.
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Handle_SinHorarioId_ConservaLosHorariosAsignados(bool conPrincipal)
    {
        var pasajero = CrearPasajeroConHorarios(2, (8, conPrincipal), (1, false));

        await CrearHandler().Handle(new UpdatePasajeroCommand(2, Payload(null)), CancellationToken.None);

        pasajero.Nombre.Should().Be("Julia Editada");
        pasajero.PasajeroHorarios.Select(ph => ph.HorarioId).Should().BeEquivalentTo(new[] { 8, 1 });
        pasajero.PasajeroHorarios.Any(ph => ph.EsPrincipal).Should().Be(conPrincipal);
        _pasajeros.Verify(r => r.UpdateAsync(pasajero, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_SinHorarioId_ConUnSoloHorarioSinPrincipal_NoLoQuita()
    {
        var pasajero = CrearPasajeroConHorarios(2, (8, false));

        await CrearHandler().Handle(new UpdatePasajeroCommand(2, Payload(null)), CancellationToken.None);

        pasajero.PasajeroHorarios.Should().ContainSingle(ph => ph.HorarioId == 8);
    }

    [Fact]
    public async Task Handle_ConHorarioId_LoAsignaComoPrincipal()
    {
        var pasajero = CrearPasajeroConHorarios(2, (8, false));
        _horarios.Setup(r => r.ExisteAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        await CrearHandler().Handle(new UpdatePasajeroCommand(2, Payload(1)), CancellationToken.None);

        pasajero.PasajeroHorarios.Single(ph => ph.EsPrincipal).HorarioId.Should().Be(1);
        pasajero.PasajeroHorarios.Select(ph => ph.HorarioId).Should().BeEquivalentTo(new[] { 8, 1 });
    }
}
