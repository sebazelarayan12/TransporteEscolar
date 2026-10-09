using System.Globalization;
using MediatR;
using TransporteEscolar.Application.DTOs;
using TransporteEscolar.Application.Exceptions;
using TransporteEscolar.Application.Interfaces;
using TransporteEscolar.Application.Validation;
using TransporteEscolar.Domain.Entities;
using TransporteEscolar.Domain.Services;

namespace TransporteEscolar.Application.Bot.Commands;

/// <summary>
/// Simula cómo se repartiría un pago entre las cuotas pendientes del titular. No escribe nada ni notifica.
/// </summary>
public sealed record SimularPagoBotCommand(BotPagoModel.SimularRequest Payload) : IRequest<BotPagoModel.SimulacionResponse>;

public sealed class SimularPagoBotCommandHandler : IRequestHandler<SimularPagoBotCommand, BotPagoModel.SimulacionResponse>
{
    private readonly ITitularRepository _titularRepository;
    private readonly IPagoMensualRepository _pagoMensualRepository;

    public SimularPagoBotCommandHandler(ITitularRepository titularRepository, IPagoMensualRepository pagoMensualRepository)
    {
        _titularRepository = titularRepository;
        _pagoMensualRepository = pagoMensualRepository;
    }

    public async Task<BotPagoModel.SimulacionResponse> Handle(SimularPagoBotCommand request, CancellationToken cancellationToken)
    {
        var (titularId, monto) = BotPagoValidator.ValidarSimulacion(request.Payload);

        var titular = await _titularRepository.GetByIdAsync(titularId, cancellationToken);
        if (titular is null || titular.FechaBaja is not null)
            throw new NotFoundException(nameof(Titular), titularId);

        var pagos = await _pagoMensualRepository.GetByTitularIdAsync(titularId, cancellationToken);
        var reparto = ReparticionPagos.Planificar(monto, pagos);

        if (reparto.Items.Count == 0)
            throw new ValidationException("No hay cuotas pendientes para este titular.");

        if (reparto.Sobrante > 0)
            throw new ValidationException(
                $"El monto excede la deuda pendiente del titular. Sobrante: {reparto.Sobrante.ToString("0.##", CultureInfo.InvariantCulture)}.");

        var items = reparto.Items
            .Select(i => new BotPagoModel.RepartoItem(i.Pago.Anio, i.Pago.Mes, i.Aplicado, i.SaldoDespues))
            .ToList();

        return new BotPagoModel.SimulacionResponse(titular.Id, titular.Apellido, monto, items);
    }
}
