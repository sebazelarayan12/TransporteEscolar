using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record QuitarHorarioPasajeroCommand(int PasajeroId, int HorarioId) : IRequest<Unit>;

public sealed class QuitarHorarioPasajeroCommandHandler : IRequestHandler<QuitarHorarioPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public QuitarHorarioPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<Unit> Handle(QuitarHorarioPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        var eliminado = pasajero.QuitarHorario(request.HorarioId);
        if (!eliminado)
        {
            throw new NotFoundException(nameof(PasajeroHorario), request.HorarioId);
        }

        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
