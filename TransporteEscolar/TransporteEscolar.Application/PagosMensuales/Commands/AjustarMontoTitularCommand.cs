using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;

namespace TransporteEscolar.Application.PagosMensuales.Commands;

public sealed record AjustarMontoTitularCommand(
    int TitularId,
    PagoMensualModel.AjusteTitularRequest Payload) : IRequest<PagoMensualModel.AjusteTitularResponse>;

public sealed class AjustarMontoTitularCommandHandler : IRequestHandler<AjustarMontoTitularCommand, PagoMensualModel.AjusteTitularResponse>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;
    private readonly ITransactionManager _transactionManager;
    private readonly INotificacionService _notificacionService;

    public AjustarMontoTitularCommandHandler(
        ITitularRepository titularRepository,
        IPagoMensualRepository pagoMensualRepository,
        ITransactionManager transactionManager,
        INotificacionService notificacionService)
    {
        _titularRepository = titularRepository;
        _pagoMensualRepository = pagoMensualRepository;
        _transactionManager = transactionManager;
        _notificacionService = notificacionService;
    }

    public async Task<PagoMensualModel.AjusteTitularResponse> Handle(AjustarMontoTitularCommand request, CancellationToken cancellationToken)
    {
        PagoMensualValidator.ValidateAjusteTitular(request.Payload);

        var titular = await _titularRepository.GetByIdAsync(request.TitularId, cancellationToken);
        if (titular is null)
            throw new NotFoundException(nameof(Titular), request.TitularId);

        await using var transaction = await _transactionManager.BeginTransactionAsync(cancellationToken);

        try
        {
            var pagos = await _pagoMensualRepository.GetByTitularIdAsync(request.TitularId, cancellationToken);

            TitularAjusteMontoResult resultado;
            try
            {
                resultado = titular.AjustarMonto(
                    request.Payload.NuevoMonto,
                    request.Payload.AplicarSoloPendientes,
                    request.Payload.Motivo,
                    pagos);
            }
            catch (InvalidOperationException ex)
            {
                throw new ValidationException(ex.Message);
            }

            await _titularRepository.UpdateAsync(titular, cancellationToken);

            foreach (var pago in resultado.PagosActualizados)
            {
                await _pagoMensualRepository.UpdateAsync(pago, cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);

            var titularNombre = $"{titular.NombreContacto} {titular.Apellido}".Trim();
            await _notificacionService.CrearNotificacionAjusteMontoAsync(
                titularNombre,
                request.Payload.NuevoMonto,
                request.TitularId,
                cancellationToken);

            return new PagoMensualModel.AjusteTitularResponse(
                request.TitularId,
                resultado.MontoAnterior,
                resultado.MontoNuevo,
                resultado.PeriodosActualizados.Count,
                resultado.PeriodosActualizados.ToList());
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
