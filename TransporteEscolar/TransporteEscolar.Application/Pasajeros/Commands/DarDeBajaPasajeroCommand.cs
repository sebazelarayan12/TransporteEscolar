using MediatR;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record DarDeBajaPasajeroCommand(int PasajeroId) : IRequest<Unit>;

public sealed class DarDeBajaPasajeroCommandHandler : IRequestHandler<DarDeBajaPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public DarDeBajaPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<Unit> Handle(DarDeBajaPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        pasajero.DarDeBaja();
        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
