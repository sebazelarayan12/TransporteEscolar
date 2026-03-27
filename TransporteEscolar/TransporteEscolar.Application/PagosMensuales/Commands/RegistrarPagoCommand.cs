using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Helpers;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Mappers;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record RegistrarPagoCommand(
    int PagoMensualId,
    PagoMensualModel.RegistrarPagoRequest Payload) : IRequest<Unit>;

public sealed class RegistrarPagoCommandHandler : IRequestHandler<RegistrarPagoCommand, Unit>
{
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ITitularRepository _titularRepository;
    private readonly INotificacionService _notificacionService;

    public RegistrarPagoCommandHandler(
        IPagoMensualRepository pagoMensualRepository,
        ITitularRepository titularRepository,
        INotificacionService notificacionService)
    {
        _pagoMensualRepository = pagoMensualRepository;
        _titularRepository = titularRepository;
        _notificacionService = notificacionService;
    }

    public async Task<Unit> Handle(RegistrarPagoCommand request, CancellationToken cancellationToken)
    {
        PagoMensualValidator.ValidateRegistrarPago(request.Payload);

        var pagoMensual = await RepositoryHelper.GetByIdOrThrowAsync(
            _pagoMensualRepository.GetByIdAsync,
            request.PagoMensualId,
            nameof(PagoMensual),
            cancellationToken);

        var titular = await _titularRepository.GetByIdAsync(pagoMensual.TitularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), pagoMensual.TitularId);

        var pagosTitular = await _pagoMensualRepository.GetByTitularIdAsync(pagoMensual.TitularId, cancellationToken);

        IReadOnlyCollection<PagoMensual> pagosActualizados;
        try
        {
            pagosActualizados = titular.RegistrarPago(
                request.Payload.Monto,
                request.Payload.FechaPago,
                request.Payload.MedioPago,
                request.Payload.Observaciones,
                pagosTitular);
        }
        catch (InvalidOperationException ex)
        {
            throw new ValidationException(ex.Message);
        }

        foreach (var pago in pagosActualizados)
        {
            await _pagoMensualRepository.UpdateAsync(pago, cancellationToken);
        }

        var titularNombre = $"{titular.NombreContacto} {titular.Apellido}".Trim();
        var periodo = PagoMensualMappingExtensions.BuildPeriodo(pagoMensual.Mes, pagoMensual.Anio);

        await _notificacionService.CrearNotificacionPagoRegistradoAsync(
            titularNombre,
            request.Payload.Monto,
            periodo,
            request.PagoMensualId,
            cancellationToken);

        return Unit.Value;
    }
}
