using MediatR;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record ConfirmarReinscripcionPasajeroCommand(int PasajeroId, int ReinscripcionId) : IRequest<Unit>;

public sealed class ConfirmarReinscripcionPasajeroCommandHandler : IRequestHandler<ConfirmarReinscripcionPasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public ConfirmarReinscripcionPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<Unit> Handle(ConfirmarReinscripcionPasajeroCommand request, CancellationToken cancellationToken)
    {
        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        try
        {
            pasajero.ConfirmarReinscripcion(request.ReinscripcionId);
        }
        catch (ArgumentException)
        {
            throw new NotFoundException(nameof(ReinscripcionPasajero), request.ReinscripcionId);
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
    }
}
