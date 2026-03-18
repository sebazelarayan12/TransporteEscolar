using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record UpdatePasajeroCommand(int PasajeroId, PasajeroModel.UpdateRequest Payload) : IRequest<Unit>;

public sealed class UpdatePasajeroCommandHandler : IRequestHandler<UpdatePasajeroCommand, Unit>
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly IHorarioRepository _horarioRepository;

    public UpdatePasajeroCommandHandler(
        IPasajeroRepository pasajeroRepository,
        IHorarioRepository horarioRepository)
    {
        _pasajeroRepository = pasajeroRepository;
        _horarioRepository = horarioRepository;
    }

    public async Task<Unit> Handle(UpdatePasajeroCommand request, CancellationToken cancellationToken)
    {
        PasajeroValidator.ValidateUpdate(request.Payload);

        var pasajero = await RepositoryHelper.GetByIdOrThrowAsync(
            _pasajeroRepository.GetByIdAsync,
            request.PasajeroId,
            nameof(Pasajero),
            cancellationToken);

        pasajero.ActualizarDatos(
            request.Payload.Nombre,
            request.Payload.Colegio,
            request.Payload.GradoCurso,
            request.Payload.Turno,
            request.Payload.Observaciones);

        if (request.Payload.HorarioId.HasValue)
        {
            await ValidarHorarioAsync(request.Payload.HorarioId.Value, cancellationToken);
            var prioridad = pasajero.ObtenerSiguientePrioridad();
            pasajero.AsignarOActualizarHorario(
                request.Payload.HorarioId.Value,
                true,
                prioridad,
                PasajeroHorario.NormalizarTransporte(null));
        }
        else
        {
            pasajero.QuitarHorarioPrincipal();
        }

        await _pasajeroRepository.UpdateAsync(pasajero, cancellationToken);
        return Unit.Value;
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
