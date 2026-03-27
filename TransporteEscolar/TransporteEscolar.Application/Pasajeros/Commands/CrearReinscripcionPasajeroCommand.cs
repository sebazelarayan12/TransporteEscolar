using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record CrearReinscripcionPasajeroCommand(int PasajeroId, ReinscripcionModel.Request Payload)
    : IRequest<ReinscripcionModel.Response>;

public sealed class CrearReinscripcionPasajeroCommandHandler
    : IRequestHandler<CrearReinscripcionPasajeroCommand, ReinscripcionModel.Response>
{
    private readonly IPasajeroRepository _pasajeroRepository;

    public CrearReinscripcionPasajeroCommandHandler(IPasajeroRepository pasajeroRepository)
    {
        _pasajeroRepository = pasajeroRepository;
    }

    public async Task<ReinscripcionModel.Response> Handle(
        CrearReinscripcionPasajeroCommand request,
        CancellationToken cancellationToken)
    {
        ReinscripcionValidator.Validate(request.Payload);

        if (request.Payload.PasajeroId != request.PasajeroId)
        {
            throw new ValidationException("El pasajero del cuerpo no coincide con el de la ruta");
        }

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        ReinscripcionPasajero reinscripcion;
        try
        {
            reinscripcion = pasajero.CrearReinscripcion(request.Payload.Anio);
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return reinscripcion.ToResponse();
    }
}
