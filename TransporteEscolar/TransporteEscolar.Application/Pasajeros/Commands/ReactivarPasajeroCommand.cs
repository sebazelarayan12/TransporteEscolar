using MediatR;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record ReactivarPasajeroCommand(int PasajeroId) : IRequest<Unit>;

public sealed class ReactivarPasajeroCommandHandler : IRequestHandler<ReactivarPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public ReactivarPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<Unit> Handle(ReactivarPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        pasajero.Reactivar();
        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
