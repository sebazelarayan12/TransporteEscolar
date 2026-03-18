using MediatR;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record QuitarHorarioPrincipalPasajeroCommand(int PasajeroId) : IRequest<Unit>;

public sealed class QuitarHorarioPrincipalPasajeroCommandHandler : IRequestHandler<QuitarHorarioPrincipalPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public QuitarHorarioPrincipalPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<Unit> Handle(QuitarHorarioPrincipalPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        pasajero.QuitarHorarioPrincipal();
        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
