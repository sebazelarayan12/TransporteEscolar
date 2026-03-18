using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record AgregarHorarioPasajeroCommand(int PasajeroId, PasajeroHorarioModel.AsignacionRequest Payload)
    : IRequest<PasajeroModel.Response>;

public sealed class AgregarHorarioPasajeroCommandHandler
    : IRequestHandler<AgregarHorarioPasajeroCommand, PasajeroModel.Response>
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IHorarioRepository _horarioRepository;

    public AgregarHorarioPasajeroCommandHandler(
        IPasajeroRepository pasajeroRepository,
        IHorarioRepository horarioRepository)
    {
        _pasajeroRepository = pasajeroRepository;
        _horarioRepository = horarioRepository;
    }

    public async Task<PasajeroModel.Response> Handle(AgregarHorarioPasajeroCommand request, CancellationToken cancellationToken)
    {
        PasajeroHorarioValidator.Validate(request.Payload);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        await ValidarHorarioAsync(request.Payload.HorarioId, cancellationToken);

        var prioridad = request.Payload.Prioridad.HasValue && request.Payload.Prioridad.Value > 0
            ? request.Payload.Prioridad.Value
            : pasajero.ObtenerSiguientePrioridad();

        pasajero.AsignarOActualizarHorario(
            request.Payload.HorarioId,
            request.Payload.EsPrincipal,
            prioridad,
            request.Payload.Transporte);

        var actualizado = pasajero;
        await _pasajeroRepository.UpdateAsync(actualizado, cancellationToken);
        return actualizado.ToResponse();
    }

    private async Task ValidarHorarioAsync(int horarioId, CancellationToken cancellationToken)
    {
        var existe = await _horarioRepository.ExisteAsync(horarioId, cancellationToken);
        if (!existe)
        {
            throw new NotFoundException(nameof(Horario), horarioId);
        }
    }
}
