using MediatR;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record ReactivarPasajeroCommand(int PasajeroId) : IRequest<Unit>;

public sealed class ReactivarPasajeroCommandHandler : IRequestHandler<ReactivarPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IPasajeroHorarioRepository _pasajeroHorarioRepository;
    private readonly IHorarioRepository _horarioRepository;

    public ReactivarPasajeroCommandHandler(
        IPasajeroRepository pasajeroRepository,
        IPasajeroHorarioRepository pasajeroHorarioRepository,
        IHorarioRepository horarioRepository)
    {
        _pasajeroRepository = pasajeroRepository;
        _pasajeroHorarioRepository = pasajeroHorarioRepository;
        _horarioRepository = horarioRepository;
    }

    public async Task<Unit> Handle(ReactivarPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        // Valida ANTES de cambiar nada: un horario inactivo no puede quedar con pasajeros activos.
        await HorariosActivosGuard.AsegurarQueNoTenganHorariosInactivosAsync(
            new[] { pasajero },
            _pasajeroHorarioRepository,
            _horarioRepository,
            cancellationToken);

        pasajero.Reactivar();
        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
