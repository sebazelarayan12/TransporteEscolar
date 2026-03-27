using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.Pasajeros.Commands;

public sealed record CreatePasajeroCommand(PasajeroModel.Request Payload) : IRequest<PasajeroModel.Response>;

public sealed class CreatePasajeroCommandHandler : IRequestHandler<CreatePasajeroCommand, PasajeroModel.Response>
{
    private readonly IPasajeroRepository _pasajeroRepository;
    private readonly ITitularRepository _titularRepository;
    private readonly IHorarioRepository _horarioRepository;
    private readonly INotificacionService _notificacionService;

    public CreatePasajeroCommandHandler(
        IPasajeroRepository pasajeroRepository,
        ITitularRepository titularRepository,
        IHorarioRepository horarioRepository,
        INotificacionService notificacionService)
    {
        _pasajeroRepository = pasajeroRepository;
        _titularRepository = titularRepository;
        _horarioRepository = horarioRepository;
        _notificacionService = notificacionService;
    }

    public async Task<PasajeroModel.Response> Handle(CreatePasajeroCommand request, CancellationToken cancellationToken)
    {
        PasajeroValidator.Validate(request.Payload);

        var titular = await _titularRepository.GetByIdAsync(request.Payload.TitularId, cancellationToken);
        if (titular is null)
        {
            throw new NotFoundException(nameof(Titular), request.Payload.TitularId);
        }

        await ValidarHorarioAsync(request.Payload.HorarioId, cancellationToken);

        var pasajero = new Pasajero(
            request.Payload.TitularId,
            request.Payload.Nombre,
            request.Payload.Colegio,
            request.Payload.GradoCurso,
            request.Payload.Turno,
            request.Payload.Observaciones,
            request.Payload.FechaAlta);

        var creado = await _pasajeroRepository.AddAsync(pasajero, cancellationToken);

        if (request.Payload.HorarioId.HasValue)
        {
            var pasajeroPersistido = await _pasajeroRepository.GetByIdAsync(creado.Id, cancellationToken) ?? creado;
            var prioridad = pasajeroPersistido.ObtenerSiguientePrioridad();
            pasajeroPersistido.AsignarOActualizarHorario(
                request.Payload.HorarioId.Value,
                true,
                prioridad,
                PasajeroHorario.NormalizarTransporte(null));
            await _pasajeroRepository.UpdateAsync(pasajeroPersistido, cancellationToken);
        }

        var pasajeroCompleto = await _pasajeroRepository.GetByIdAsync(creado.Id, cancellationToken) ?? creado;

        var titularNombre = $"{titular.NombreContacto} {titular.Apellido}".Trim();
        await _notificacionService.CrearNotificacionPasajeroCreadoAsync(
            pasajeroCompleto.Nombre,
            titularNombre,
            pasajeroCompleto.Id,
            cancellationToken);

        return pasajeroCompleto.ToResponse();
    }

    private async Task ValidarHorarioAsync(int? horarioId, CancellationToken cancellationToken)
    {
        if (!horarioId.HasValue)
        {
            return;
        }

        var existe = await _horarioRepository.ExisteAsync(horarioId.Value, cancellationToken);
        if (!existe)
        {
            throw new NotFoundException(nameof(Horario), horarioId.Value);
        }
    }
}
